import {spawn, spawnSync} from 'node:child_process';
import {request} from 'node:http';
import {existsSync, mkdtempSync, readdirSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = fileURLToPath(new URL('../..', import.meta.url));
export const INSPECTION = {session: 'tests/fixtures/learning/session.valid.json', lesson: 'tests/fixtures/learning/inspection-lesson-v2.json', model: 'examples/manufacturing-inspection/model.mjs'};
export const SYNTHETIC_V3 = {session: 'tests/fixtures/learning/session.valid.json', lesson: 'tests/fixtures/learning/synthetic-lesson-v3.json', model: 'tests/fixtures/learning/synthetic-model-v3.mjs'};
export const SYNTHETIC_V3_MIN = {session: 'tests/fixtures/learning/session.valid.json', lesson: 'tests/fixtures/learning/synthetic-lesson-v3-min.json', model: 'tests/fixtures/learning/synthetic-model-v3-min.mjs'};
export const SYNTHETIC_V3_UNITS = {session: 'tests/fixtures/learning/session.valid.json', lesson: 'tests/fixtures/learning/synthetic-lesson-v3-units.json', model: 'tests/fixtures/learning/synthetic-model-v3-units.mjs'};
export const SYNTHETIC = {session: 'tests/fixtures/learning/session.valid.json', lesson: 'tests/fixtures/learning/synthetic-lesson-v2.json', model: 'tests/fixtures/learning/synthetic-model.mjs'};

// build-lesson replaces dist/; specs that need another lesson rebuild it and restore INSPECTION in afterAll (workers: 1, serial).
export function buildLesson({session, lesson, model}) {
  const r = spawnSync(process.execPath, ['scripts/build-lesson.mjs', '--session', session, '--lesson', lesson, '--model', model], {cwd: root, encoding: 'utf8', timeout: 170000});
  if (r.status !== 0) throw new Error(`build-lesson failed (${r.status}): ${r.stderr}`);
}
export function startServe(args) {
  const child = spawn(process.execPath, ['scripts/serve.mjs', ...args], {cwd: root});
  const ready = new Promise((resolve, reject) => {
    let buf = '';
    child.stdout.on('data', d => { buf += d; if (buf.includes('\n')) resolve(buf.split('\n')[0].trim()); });
    child.on('exit', code => reject(new Error(`serve exited ${code}`)));
    setTimeout(() => reject(new Error('serve did not print a URL in 20s')), 20000);
  });
  const exited = new Promise(resolve => child.on('exit', resolve));
  return {child, ready, exited, stop: () => child.kill('SIGTERM')};
}
export function http(method, port, path) {
  return new Promise((resolve, reject) => {
    const req = request({host: '127.0.0.1', port, method, path, agent: false, headers: {connection: 'close'}}, res => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString()})); });
    req.on('error', reject);
    req.end(method === 'GET' ? undefined : 'x');
  });
}

// serve --out <tmp>: the page under test is served from here so submitted results can be read as files (the shared 4321 server has no --out).
export async function startReceiver(port) {
  const out = mkdtempSync(join(tmpdir(), 'ltt-e2e-out-'));
  const server = startServe(['--port', String(port), '--out', out]);
  await server.ready;
  return {
    out, port, server,
    files: () => (existsSync(out) ? readdirSync(out).sort() : []),
    text: resultId => readFileSync(join(out, `result-${resultId}.json`), 'utf8'),
    read: resultId => JSON.parse(readFileSync(join(out, `result-${resultId}.json`), 'utf8')),
    stop: async () => { server.stop(); await server.exited; rmSync(out, {recursive: true, force: true}); },
  };
}
