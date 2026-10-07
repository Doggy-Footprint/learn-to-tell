import {spawn, spawnSync} from 'node:child_process';
import {request} from 'node:http';
import {fileURLToPath} from 'node:url';

export const root = fileURLToPath(new URL('../..', import.meta.url));
export const INSPECTION = {session: 'tests/fixtures/learning/session.valid.json', lesson: 'tests/fixtures/learning/inspection-lesson-v2.json', model: 'examples/manufacturing-inspection/model.mjs'};
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
  return {child, ready, stop: () => child.kill('SIGTERM')};
}
export function http(method, port, path) {
  return new Promise((resolve, reject) => {
    const req = request({host: '127.0.0.1', port, method, path, agent: false, headers: {connection: 'close'}}, res => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString()})); });
    req.on('error', reject);
    req.end(method === 'GET' ? undefined : 'x');
  });
}
