import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {request} from 'node:http';
import {createServer} from 'node:net';
import {existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateDocument} from '../contracts/index.mjs';
import {validBundle} from './fixtures/contracts/cases.mjs';
import {withHash} from './fixtures/contracts/hash-oracle.mjs';

// Black-box tests of scripts/serve.mjs through a subprocess (spec 3c9d5e71a0b84f26 v1: O1-O4, Q1-Q3).
const root = fileURLToPath(new URL('..', import.meta.url));
const MIB = 1024 * 1024;
const ENDPOINT = '/__ltt/result';

// serve roots at dist/; create a placeholder only when dist/index.html is absent and remove only that (same convention as build.test.mjs).
const placeholderDir = !existsSync(join(root, 'dist'));
const placeholderIndex = !existsSync(join(root, 'dist', 'index.html'));
test.before(() => {
  if (placeholderDir) mkdirSync(join(root, 'dist'));
  if (placeholderIndex) writeFileSync(join(root, 'dist', 'index.html'), '<!-- placeholder created by tests/serve.test.mjs -->\n');
});
test.after(() => {
  if (placeholderIndex) rmSync(join(root, 'dist', 'index.html'), {force: true});
  if (placeholderDir) rmSync(join(root, 'dist'), {recursive: true, force: true});
});

const scratch = [];
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'ltt-serve-')); scratch.push(d); return d; };
test.after(() => { for (const d of scratch) { try { chmodSync(d, 0o755); chmodSync(join(d, 'out'), 0o755); } catch {} rmSync(d, {recursive: true, force: true}); } });

function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => { const {port} = s.address(); s.close(() => resolve(port)); });
  });
}

function exitOf(args, {timeout = 20000} = {}) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, ['scripts/serve.mjs', ...args], {cwd: root});
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve({code: 'timeout', stdout, stderr}); }, timeout);
    child.on('exit', code => { clearTimeout(timer); resolve({code, stdout, stderr}); });
  });
}

// out: absolute or relative path string, or null for no --out. Runs fn({port, url}) against a live server and always stops it.
async function withServe(out, fn, {extra = []} = {}) {
  const port = await freePort();
  const args = ['scripts/serve.mjs', '--port', String(port), ...(out === null ? [] : ['--out', out]), ...extra];
  const child = spawn(process.execPath, args, {cwd: root});
  const exited = new Promise(resolve => child.on('exit', resolve));
  let stdout = '', stderr = '';
  child.stderr.on('data', d => { stderr += d; });
  const first = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no stdout line in 20s; stderr=${stderr}`)), 20000);
    child.stdout.on('data', d => { stdout += d; if (stdout.includes('\n')) { clearTimeout(timer); resolve(stdout.split('\n')[0].trim()); } });
    child.on('exit', code => { clearTimeout(timer); reject(new Error(`serve exited ${code}; stderr=${stderr}`)); });
  });
  try {
    assert.equal(first, `http://127.0.0.1:${port}/`);
    return await fn({port, url: first, stdout: () => stdout});
  } finally {
    child.kill('SIGTERM');
    await Promise.race([exited, new Promise(r => setTimeout(r, 5000))]);
    child.kill('SIGKILL');
  }
}

// Raw request: the path is sent verbatim (no client-side normalization).
function send(port, {method = 'GET', path = '/', headers = {}, body} = {}) {
  return new Promise((resolve, reject) => {
    const req = request({host: '127.0.0.1', port, method, path, agent: false, headers: {connection: 'close', ...headers}}, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks)}));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end(body);
  });
}
const post = (port, body, {origin, contentType = 'application/json', method = 'POST'} = {}) => send(port, {
  method, path: ENDPOINT, body,
  headers: {...(contentType === null ? {} : {'content-type': contentType}), ...(origin === undefined ? {} : {origin})},
});
const json = res => JSON.parse(res.body.toString('utf8'));

// ---- valid documents (independent fixtures; hash sealed by the independent oracle)
const baseResult = () => structuredClone(validBundle().result);
const sealed = mutate => { const r = baseResult(); mutate?.(r); return withHash(r); };
const docA = () => sealed();
const docB = () => sealed(r => { r.responses[0].answer = 'Second submission 두번째'; });
const text = doc => JSON.stringify(doc, null, 4) + '\n';
const fileOf = doc => `result-${doc.resultId}.json`;
const listing = dir => (existsSync(dir) ? readdirSync(dir).sort() : null);
const bytes = (dir, doc) => readFileSync(join(dir, fileOf(doc)));

function outLayout() {
  const parent = tmp();
  const out = join(parent, 'out');
  mkdirSync(out);
  return {parent, out};
}

test('[SERVE-pre] fixture documents are contract-valid result v2 with different content', () => {
  for (const d of [docA(), docB()]) assert.deepEqual(validateDocument(d, 'result'), {ok: true, errors: []});
  assert.notEqual(docA().contentHash, docB().contentHash);
  assert.equal(docA().resultId, docB().resultId);
});

// ================= O1: static serving, startup, arguments (R1, R2; C4, C11, C12; Q3) =================
const dist = name => readFileSync(join(root, 'dist', name));
for (const [path, file] of [['/', 'index.html'], ['/index.html', 'index.html']]) {
  test(`[O1.static ${path}] GET and HEAD ${path} serve dist/${file} with Cache-Control: no-cache (C4)`, async () => {
    await withServe(null, async ({port}) => {
      const get = await send(port, {path});
      assert.equal(get.status, 200);
      assert.deepEqual(get.body, dist(file));
      assert.equal(get.headers['cache-control'], 'no-cache');
      const head = await send(port, {method: 'HEAD', path});
      assert.equal(head.status, 200);
      assert.equal(head.body.length, 0);
      assert.equal(head.headers['cache-control'], 'no-cache');
      for (const h of ['content-type', 'content-length']) if (get.headers[h] !== undefined) assert.equal(head.headers[h], get.headers[h], `HEAD ${h} equals GET`);
    });
  });
}
const NOT_FOUND = [['missing', '/definitely-missing-file.html'], ['dotdot', '/../package.json'], ['encoded-dotdot', '/%2e%2e/package.json'], ['absolute', '//etc/passwd']];
for (const [name, path] of NOT_FOUND) for (const method of ['GET', 'HEAD']) {
  test(`[O1.not-found ${method} ${name}] ${method} ${path} is 404 without exposing file content (C4, C11)`, async () => {
    await withServe(null, async ({port}) => {
      const res = await send(port, {method, path});
      assert.equal(res.status, 404);
      const body = res.body.toString('utf8');
      assert.equal(body.includes('"learn-to-tell"'), false, 'package.json content leaked');
      assert.equal(body.includes('root:'), false, '/etc/passwd content leaked');
      if (method === 'HEAD') assert.equal(res.body.length, 0);
    });
  });
}

test('[O1.default-port] without --port the single stdout line is http://127.0.0.1:4321/ (R2)', async t => {
  const free = await new Promise(resolve => { const s = createServer(); s.on('error', () => resolve(false)); s.listen(4321, '127.0.0.1', () => s.close(() => resolve(true))); });
  if (!free) { const reason = 'port 4321 is already in use in this environment'; console.log(`[O1.default-port] skipped: ${reason}`); t.skip(reason); return; }
  const child = spawn(process.execPath, ['scripts/serve.mjs'], {cwd: root});
  const exited = new Promise(resolve => child.on('exit', resolve));
  try {
    let stdout = '';
    const first = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no stdout line in 20s')), 20000);
      child.stdout.on('data', d => { stdout += d; if (stdout.includes('\n')) { clearTimeout(timer); resolve(stdout.split('\n')[0]); } });
      child.on('exit', code => { clearTimeout(timer); reject(new Error(`serve exited ${code}`)); });
    });
    assert.equal(first, 'http://127.0.0.1:4321/');
    await new Promise(r => setTimeout(r, 200));
    assert.equal(stdout, 'http://127.0.0.1:4321/\n');
  } finally {
    child.kill('SIGTERM');
    await Promise.race([exited, new Promise(r => setTimeout(r, 5000))]);
    child.kill('SIGKILL');
  }
});

test('[O1.startup] stdout is exactly one line http://127.0.0.1:<port>/ and the server answers on loopback (R2, Q3)', async () => {
  await withServe(null, async ({port, url, stdout}) => {
    assert.equal(url, `http://127.0.0.1:${port}/`);
    assert.equal((await send(port, {path: '/'})).status, 200);
    assert.equal(stdout(), `${url}\n`);
  });
});
for (const signal of ['SIGINT', 'SIGTERM']) test(`[O1.signal ${signal}] the process exits on ${signal} (R2)`, async () => {
  const port = await freePort();
  const child = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(port)], {cwd: root});
  const exited = new Promise(resolve => child.on('exit', (code, sig) => resolve({code, sig})));
  await new Promise((resolve, reject) => { child.stdout.once('data', resolve); setTimeout(() => reject(new Error('no URL line')), 20000); });
  child.kill(signal);
  const r = await Promise.race([exited, new Promise(resolve => setTimeout(() => resolve('timeout'), 10000))]);
  if (r === 'timeout') child.kill('SIGKILL');
  assert.notEqual(r, 'timeout', `${signal} did not stop serve`);
});

const ARGS = [
  ['bogus', ['--bogus', 'x'], 'ARGUMENT --bogus'],
  ['bogus-no-value', ['--bogus'], 'ARGUMENT --bogus'],
  ['port-x', ['--port', 'x'], 'ARGUMENT --port'],
  ['out-no-value', ['--out'], 'ARGUMENT --out'],
  ['out-empty', ['--out', ''], 'ARGUMENT --out'],
];
for (const [name, args, line] of ARGS) test(`[O1.args ${name}] ${args.join(' ')} exits 2 with "${line}", empty stdout, no server (R2, R3, C12, Q3)`, async () => {
  const r = await exitOf(args);
  assert.equal(r.code, 2);
  assert.ok(r.stderr.includes(line), r.stderr);
  assert.equal(r.stdout, '');
});

// ================= O2: receiving, normal paths (R3, R4; C1, C3, C6, C7) =================
test('[O2.basic] valid result without Origin: 200 {ok,file}; file is the received body byte for byte, not a re-serialization (C1)', async () => {
  const {parent, out} = outLayout();
  await withServe(out, async ({port}) => {
    const doc = docA();
    const body = text(doc);
    const res = await post(port, body);
    assert.equal(res.status, 200);
    assert.deepEqual(json(res), {ok: true, file: fileOf(doc)});
    assert.deepEqual(listing(out), [fileOf(doc)], 'no temp file remains');
    assert.deepEqual(bytes(out, doc), Buffer.from(body, 'utf8'));
    assert.notDeepEqual(bytes(out, doc), Buffer.from(JSON.stringify(doc, null, 2)), 'must not be re-serialized');
    assert.deepEqual(listing(parent), ['out']);
  });
});
test('[O2.overwrite] the same resultId submitted twice keeps the last body (C3, A2)', async () => {
  const {out} = outLayout();
  await withServe(out, async ({port}) => {
    const a = docA(), b = docB();
    assert.equal((await post(port, text(a))).status, 200);
    assert.deepEqual(bytes(out, a), Buffer.from(text(a)));
    const second = await post(port, text(b));
    assert.equal(second.status, 200);
    assert.deepEqual(json(second), {ok: true, file: fileOf(b)});
    assert.deepEqual(bytes(out, b), Buffer.from(text(b)));
    assert.deepEqual(listing(out), [fileOf(b)]);
  });
});
test('[O2.mkdir] a missing --out folder is not created at startup and is created (mkdir -p) on the first receipt (C6, R3)', async () => {
  const parent = tmp();
  const out = join(parent, 'a', 'b', 'out');
  await withServe(out, async ({port}) => {
    assert.equal(existsSync(join(parent, 'a')), false, 'nothing created at startup');
    const res = await post(port, text(docA()));
    assert.equal(res.status, 200);
    assert.deepEqual(listing(out), [fileOf(docA())]);
  });
});
test('[O2.relative-out] a relative --out is resolved against the working directory (R3)', async () => {
  const parent = tmp();
  const abs = join(parent, 'rel-out');
  await withServe(relative(root, abs), async ({port}) => {
    assert.equal((await post(port, text(docA()))).status, 200);
    assert.deepEqual(listing(abs), [fileOf(docA())]);
  });
});
test('[O2.no-out] without --out the endpoint answers 404 NO_OUT and writes nothing (C7, R3)', async () => {
  await withServe(null, async ({port}) => {
    const res = await post(port, text(docA()));
    assert.equal(res.status, 404);
    assert.equal(json(res).ok, false);
    assert.equal(json(res).code, 'NO_OUT');
  });
});

// ================= O3: rejection paths (R5-R8; C5, C8, C9, C10; Q1) =================
// Every rejection must leave --out and its parent untouched and the server alive.
async function rejects(port, {out, parent}, attempt, {status, code}) {
  const before = listing(out), parentBefore = listing(parent);
  const res = await attempt();
  assert.equal(res.status, status);
  const body = json(res);
  assert.equal(body.ok, false);
  assert.equal(body.code, code);
  assert.deepEqual(listing(out), before, 'no file created in --out');
  assert.deepEqual(listing(parent), parentBefore, 'nothing created outside --out');
  return body;
}

test('[O3.origin] Origin: absent/exact/localhost accepted; other host, other port, "null" rejected 403 ORIGIN (R5, C8, Q1)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    const other = port === 9999 ? 9998 : 9999;
    for (const [i, origin] of [undefined, `http://127.0.0.1:${port}`, `http://localhost:${port}`].entries()) {
      const doc = sealed(r => { r.resultId = `result-origin-${i}`; });
      const res = await post(port, text(doc), {origin});
      assert.equal(res.status, 200, `origin ${origin}`);
      assert.deepEqual(bytes(layout.out, doc), Buffer.from(text(doc)));
    }
    for (const origin of ['http://evil.example', `http://127.0.0.1:${other}`, 'null']) {
      await rejects(port, layout, () => post(port, text(docA()), {origin}), {status: 403, code: 'ORIGIN'});
    }
  });
});
// One-shot client: the whole body goes out in a single req.end(buf). Every client-side 'error' (request or socket) is recorded, never tolerated.
// declared: Content-Length header; otherwise Transfer-Encoding: chunked, so the size is only known while receiving.
function oneShot(port, body, {declared}) {
  const errors = [];
  let closedAt = null;
  const started = Date.now();
  const headers = {'content-type': 'application/json', ...(declared ? {'content-length': body.length} : {'transfer-encoding': 'chunked'})};
  const settled = new Promise(resolve => {
    const req = request({host: '127.0.0.1', port, method: 'POST', path: ENDPOINT, agent: false, headers}, r => {
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => resolve({status: r.statusCode, body: Buffer.concat(chunks)}));
      r.on('error', e => errors.push(`response: ${e.code ?? e.message}`));
    });
    req.on('socket', s => {
      s.on('error', e => errors.push(`socket: ${e.code ?? e.message}`));
      s.on('close', () => { closedAt = Date.now() - started; });
    });
    req.on('error', e => { errors.push(`request: ${e.code ?? e.message}`); resolve(null); });
    req.end(body);
  });
  const closed = async () => {
    const deadline = Date.now() + 5000;
    while (closedAt === null && Date.now() < deadline) await new Promise(r => setTimeout(r, 20));
    return closedAt;
  };
  return {settled, errors, closed};
}
const paddedDoc = size => { const base = Buffer.from(JSON.stringify(docA())); return Buffer.concat([base, Buffer.alloc(size - base.length, 0x20)]); };

async function expectOversizeRejected(port, layout, {declared}) {
  const big = paddedDoc(MIB + 1);
  assert.equal(big.length, MIB + 1);
  const client = oneShot(port, big, {declared});
  const res = await client.settled;
  assert.notEqual(res, null, `no response; client errors: ${client.errors.join(', ')}`);
  assert.equal(res.status, 413);
  assert.equal(json(res).code, 'TOO_LARGE');
  assert.equal(json(res).ok, false);
  const closedAfter = await client.closed();
  assert.notEqual(closedAfter, null, 'connection not closed within 5 s after 413');
  assert.ok(closedAfter <= 5000, `closed after ${closedAfter} ms`);
  assert.deepEqual(client.errors, [], 'the client wrote the whole body without a socket error');
  assert.deepEqual(listing(layout.out), [], 'no file in --out');
  assert.deepEqual(listing(layout.parent), ['out']);
}

test('[O3.size] exactly 1 MiB is processed (200); 1 MiB + 1 byte is 413 TOO_LARGE with the connection closed, no client write error and no file (R6, C5, Q1)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    const exact = paddedDoc(MIB);
    assert.equal(exact.length, MIB);
    const ok = await post(port, exact);
    assert.equal(ok.status, 200);
    assert.deepEqual(bytes(layout.out, docA()), exact);
    rmSync(join(layout.out, fileOf(docA())));
    await expectOversizeRejected(port, layout, {declared: true});
  });
});
test('[O3.size chunked] without Content-Length: exactly 1 MiB is 200; 1 MiB + 1 byte exceeded during receipt is 413 TOO_LARGE, no client write error, closed within 5 s, no file (R2, C6)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    const exact = paddedDoc(MIB);
    const client = oneShot(port, exact, {declared: false});
    const ok = await client.settled;
    assert.notEqual(ok, null, `no response; client errors: ${client.errors.join(', ')}`);
    assert.equal(ok.status, 200);
    assert.deepEqual(client.errors, []);
    assert.deepEqual(bytes(layout.out, docA()), exact);
    rmSync(join(layout.out, fileOf(docA())));
    await expectOversizeRejected(port, layout, {declared: false});
  });
});
test('[O3.size stalled] Content-Length 1 MiB + 1 declared, only part of the body written, then the client stalls: the connection is closed within 5 s and no file exists (R2, C7)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    const big = paddedDoc(MIB + 1);
    const started = Date.now();
    const closedAfter = await new Promise(resolve => {
      const req = request({host: '127.0.0.1', port, method: 'POST', path: ENDPOINT, agent: false, headers: {'content-type': 'application/json', 'content-length': big.length}});
      const timer = setTimeout(() => { req.destroy(); resolve(null); }, 5000);
      req.on('socket', s => s.on('close', () => { clearTimeout(timer); resolve(Date.now() - started); }));
      req.on('error', () => {});
      req.on('response', r => r.resume());
      req.write(big.subarray(0, MIB / 2));
    });
    assert.notEqual(closedAfter, null, 'connection still open after 5 s');
    assert.ok(closedAfter <= 5000);
    assert.deepEqual(listing(layout.out), []);
    assert.deepEqual(listing(layout.parent), ['out']);
  });
});
test('[O3.size alive] after a 413 (declared and chunked) the same server answers a normal request with 200 and writes only that file (R2, C8)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    await expectOversizeRejected(port, layout, {declared: true});
    await expectOversizeRejected(port, layout, {declared: false});
    const doc = docB();
    const res = await post(port, text(doc));
    assert.equal(res.status, 200);
    assert.deepEqual(listing(layout.out), [fileOf(doc)]);
    assert.deepEqual(bytes(layout.out, doc), Buffer.from(text(doc)));
  });
});
test('[O3.content-type] application/json accepted; text/plain and a missing Content-Type are 415 CONTENT_TYPE (R7, C9)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    for (const contentType of ['text/plain', null]) {
      await rejects(port, layout, () => post(port, text(docA()), {contentType}), {status: 415, code: 'CONTENT_TYPE'});
    }
    assert.equal((await post(port, text(docA()), {contentType: 'application/json'})).status, 200);
  });
});
test('[O3.body] broken JSON is 400 JSON; a contract violation is 422 INVALID with errors [{code,path}] (R7, C9, Q1)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    await rejects(port, layout, () => post(port, '{"kind":"result","version":'), {status: 400, code: 'JSON'});
    const missing = sealed(r => { delete r.profileId; });
    const body = await rejects(port, layout, () => post(port, text(missing)), {status: 422, code: 'INVALID'});
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.every(e => typeof e.code === 'string' && typeof e.path === 'string'));
    assert.deepEqual(body.errors.filter(e => e.path === '/profileId'), [{code: 'REQUIRED', path: '/profileId'}]);
  });
});
test('[O3.method] PUT and GET on the endpoint are 405 METHOD and write nothing (R8, C10, Q1)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    await rejects(port, layout, () => post(port, text(docA()), {method: 'PUT'}), {status: 405, code: 'METHOD'});
    await rejects(port, layout, () => send(port, {method: 'GET', path: ENDPOINT}), {status: 405, code: 'METHOD'});
  });
});
test('[O3.resultId-path] a resultId that is not an id (path separators / traversal) is rejected and no file is created inside or outside --out (R8, Q1)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    for (const resultId of ['../escape', 'a/b', '..']) {
      const doc = sealed(r => { r.resultId = resultId; });
      const res = await post(port, text(doc));
      assert.notEqual(res.status, 200, resultId);
      assert.equal(json(res).ok, false);
      assert.deepEqual(listing(layout.out), [], `no file for ${resultId}`);
      assert.deepEqual(listing(layout.parent), ['out'], `nothing outside --out for ${resultId}`);
    }
  });
});
test('[O3.alive] after every kind of rejection the server keeps serving valid submissions and static files (Errors)', async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    await post(port, '{', {});
    await post(port, text(docA()), {origin: 'http://evil.example'});
    await post(port, text(docA()), {contentType: 'text/plain'});
    await post(port, text(docA()), {method: 'PUT'});
    assert.equal((await post(port, text(docA()))).status, 200);
    assert.equal((await send(port, {path: '/'})).status, 200);
  });
});

// ================= O4: write failures (R4, Q2; C14) =================
const canTestPermissions = process.platform !== 'win32' && !(typeof process.getuid === 'function' && process.getuid() === 0);
const skipPerm = canTestPermissions ? false : 'directory permissions are not enforced for this user/platform';
test('[O4.read-only-out] a read-only --out folder answers 500 IO and leaves no file or temp file (C14, Q2)', {skip: skipPerm}, async () => {
  const layout = outLayout();
  chmodSync(layout.out, 0o555);
  try {
    await withServe(layout.out, async ({port}) => {
      const res = await post(port, text(docA()));
      assert.equal(res.status, 500);
      assert.equal(json(res).ok, false);
      assert.equal(json(res).code, 'IO');
      assert.deepEqual(listing(layout.out), []);
      chmodSync(layout.out, 0o755);
      assert.equal((await post(port, text(docA()))).status, 200, 'server continues after an IO error');
    });
  } finally { chmodSync(layout.out, 0o755); }
});
test('[O4.overwrite-fails] when replacing an existing file fails: 500 IO, the existing file bytes are unchanged, no temp file remains (C14, Q2)', {skip: skipPerm}, async () => {
  const layout = outLayout();
  await withServe(layout.out, async ({port}) => {
    const a = docA(), b = docB();
    assert.equal((await post(port, text(a))).status, 200);
    const before = bytes(layout.out, a);
    chmodSync(layout.out, 0o555);
    try {
      const res = await post(port, text(b));
      assert.equal(res.status, 500);
      assert.equal(json(res).code, 'IO');
      assert.deepEqual(bytes(layout.out, a), before, 'existing final file unchanged');
      assert.deepEqual(listing(layout.out), [fileOf(a)], 'no temp file remains');
    } finally { chmodSync(layout.out, 0o755); }
    assert.equal((await post(port, text(b))).status, 200);
    assert.deepEqual(bytes(layout.out, b), Buffer.from(text(b)));
  });
});
test('[O4.rename-fails] the temp file is written but rename fails (final path is a non-empty directory): 500 IO and no temp file remains (C14, Q2)', async () => {
  const layout = outLayout();
  const doc = docA();
  const blocker = join(layout.out, fileOf(doc));
  mkdirSync(blocker);
  writeFileSync(join(blocker, 'keep.txt'), 'keep');
  await withServe(layout.out, async ({port}) => {
    const res = await post(port, text(doc));
    assert.equal(res.status, 500);
    assert.equal(json(res).ok, false);
    assert.equal(json(res).code, 'IO');
    assert.deepEqual(listing(layout.out), [fileOf(doc)], 'only the blocking directory remains, no temp file');
    assert.deepEqual(listing(blocker), ['keep.txt']);
    assert.deepEqual(listing(layout.parent), ['out']);
  });
});
