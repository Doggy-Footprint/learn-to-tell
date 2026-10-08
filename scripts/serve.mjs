import {existsSync} from 'node:fs';
import {mkdir, readFile, rename, rm, stat, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {randomBytes} from 'node:crypto';
import {validateResultShape} from '../learning/result.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const parsedArgs = parseArgs({options: {port: {type: 'string'}, out: {type: 'string'}}, strict: false, allowPositionals: true, tokens: true});
for (const token of parsedArgs.tokens) {
  const name = token.kind === 'positional' ? token.value : `--${token.name}`;
  if (token.kind === 'positional' || !['port', 'out'].includes(token.name)) {
    process.stderr.write(`ARGUMENT ${name}\n`);
    process.exit(2);
  }
}
if (parsedArgs.values.port !== undefined && typeof parsedArgs.values.port !== 'string') {
  process.stderr.write('ARGUMENT --port\n');
  process.exit(2);
}
const portText = parsedArgs.values.port ?? '4321';
const port = Number(portText);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.stderr.write('ARGUMENT --port\n');
  process.exit(2);
}
const outValue = parsedArgs.values.out;
if (outValue !== undefined && (typeof outValue !== 'string' || outValue === '')) {
  process.stderr.write('ARGUMENT --out\n');
  process.exit(2);
}
const outDir = outValue === undefined ? null : resolve(outValue);
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  process.stderr.write('DIST_MISSING dist/index.html\n');
  process.exit(1);
}

// A 1 MiB cap is an estimate of the largest legitimate result document (spec assumption A4).
const MAX_BODY = 1024 * 1024;
const DRAIN_LIMIT_MS = 3000;
const RESULT_PATH = '/__ltt/result';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8', '.wasm': 'application/wasm',
};
const allowedOrigins = [`http://127.0.0.1:${port}`, `http://localhost:${port}`];

const sendJson = (res, status, body) => {
  const text = JSON.stringify(body);
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text), 'Cache-Control': 'no-cache'});
  res.end(text);
};
const fail = (res, status, code, extra = {}) => sendJson(res, status, {ok: false, code, ...extra});

async function serveStatic(req, res) {
  const notFound = () => {
    res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : 'Not Found');
  };
  const rawPath = req.url.split(/[?#]/)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return notFound();
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').includes('..')) return notFound();
  let file = resolve(dist, `.${decoded}`);
  if (file !== dist && !file.startsWith(dist + sep)) return notFound();
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Content-Length': body.length, 'Cache-Control': 'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    notFound();
  }
}

function readBody(req, res) {
  return new Promise(resolveBody => {
    const reject = () => {
      const {socket} = req;
      // A client that sent `Connection: close` makes Node destroy the socket as soon as the response finishes, which resets a client still writing the body and loses the 413; so the response waits until the body is drained (bounded by a timer).
      const respond = () => {
        clearTimeout(timer);
        if (res.headersSent) return;
        res.once('finish', () => socket.end());
        fail(res, 413, 'TOO_LARGE');
      };
      const timer = setTimeout(() => {
        respond();
        socket.destroy();
      }, DRAIN_LIMIT_MS);
      socket.once('close', () => clearTimeout(timer));
      req.once('end', respond);
      req.resume();
      resolveBody(null);
    };
    if (Number(req.headers['content-length']) > MAX_BODY) return reject();
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        chunks.length = 0;
        req.removeAllListeners('data');
        return reject();
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks)));
    req.on('error', () => resolveBody(null));
  });
}

async function receiveResult(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD');
  if (outDir === null) return fail(res, 404, 'NO_OUT');
  const {origin} = req.headers;
  // Browsers attach Origin to cross-site POSTs, so this keeps other local web pages from writing; non-browser clients send none.
  if (origin !== undefined && !allowedOrigins.includes(origin)) return fail(res, 403, 'ORIGIN');
  if (String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase() !== 'application/json') return fail(res, 415, 'CONTENT_TYPE');
  const body = await readBody(req, res);
  if (body === null) return;
  let document;
  try {
    document = JSON.parse(body.toString('utf8'));
  } catch {
    return fail(res, 400, 'JSON');
  }
  const shape = validateResultShape(document);
  if (!shape.ok) return fail(res, 422, 'INVALID', {errors: shape.errors});
  const name = `result-${document.resultId}.json`;
  const temp = join(outDir, `.${name}.${randomBytes(6).toString('hex')}.tmp`);
  try {
    await mkdir(outDir, {recursive: true});
    await writeFile(temp, body);
    await rename(temp, join(outDir, name));
  } catch {
    await rm(temp, {force: true});
    return fail(res, 500, 'IO');
  }
  sendJson(res, 200, {ok: true, file: name});
}

const server = createServer(async (req, res) => {
  if (req.url.split(/[?#]/)[0] === RESULT_PATH) return receiveResult(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {Allow: 'GET, HEAD', 'Cache-Control': 'no-cache'});
    return res.end();
  }
  return serveStatic(req, res);
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`http://127.0.0.1:${port}/\n`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => process.exit(0));
