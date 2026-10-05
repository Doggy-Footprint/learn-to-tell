import {test, expect} from '@playwright/test';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {tid, toSimulation, show, readDownload, assertResultDocument} from './helpers.mjs';
import {session2} from '../fixtures/learning/shapes.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const PORT = 4323;
const build = file => { const r = spawnSync(process.execPath, ['scripts/build-lesson.mjs', '--session', file], {cwd: root, encoding: 'utf8'}); if (r.status !== 0) throw new Error(`build failed: ${r.stderr}`); };
let server;

test.use({baseURL: `http://127.0.0.1:${PORT}/`});
test.describe.configure({mode: 'serial'});

// Rebuilds dist/ with the second fixture, then restores the default fixture build; tests run serially (workers: 1).
test.beforeAll(async () => {
  build('tests/fixtures/learning/session.second.json');
  server = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(PORT)], {cwd: root});
  await new Promise((resolve, reject) => {
    let buf = '';
    server.stdout.on('data', d => { buf += d; if (buf.includes('\n')) resolve(); });
    server.on('exit', code => reject(new Error(`serve exited ${code}`)));
    setTimeout(() => reject(new Error('serve did not start')), 20000);
  });
});
test.afterAll(() => { server?.kill('SIGTERM'); build('tests/fixtures/learning/session.valid.json'); });

test('[V5.S7.second-session] a build with the second session fixture downloads that session in the result', async ({page}) => {
  await toSimulation(page, {predict: 'skip'});
  await (await show(page, 'complete-lesson')).click();
  await (await show(page, 'export-result')).scrollIntoViewIfNeeded();
  const [download] = await Promise.all([page.waitForEvent('download'), tid(page, 'export-result').click()]);
  const result = await readDownload(download, session2.resultId);
  assertResultDocument(result, 'completed', session2);
  expect(result).toMatchObject({profileId: 'second-learner', resultId: 'inspection-result-2', baseMapRevision: 3, sequence: 2, previousResultId: 'inspection-result-1'});
});
