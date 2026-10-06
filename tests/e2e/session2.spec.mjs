import {test, expect} from '@playwright/test';
import {tid, toSimulation, show, readDownload, assertResultDocument} from './helpers.mjs';
import {session2} from '../fixtures/learning/data.mjs';
import {buildLesson, startServe, INSPECTION} from './builds.mjs';

const PORT = 4323;
let server;

test.use({baseURL: `http://127.0.0.1:${PORT}/`});
test.describe.configure({mode: 'serial'});

// Rebuilds dist/ with the second session fixture, then restores the default build; tests run serially (workers: 1).
test.beforeAll(async () => {
  buildLesson({...INSPECTION, session: 'tests/fixtures/learning/session.second.json'});
  server = startServe(['--port', String(PORT)]);
  await server.ready;
});
test.afterAll(() => { server?.stop(); buildLesson(INSPECTION); });

test('[V5.S7.second-session] a build with the second session fixture downloads that session in the result', async ({page}) => {
  await toSimulation(page, {predict: 'skip'});
  await (await show(page, 'complete-lesson')).click();
  await (await show(page, 'export-result')).scrollIntoViewIfNeeded();
  const [download] = await Promise.all([page.waitForEvent('download'), tid(page, 'export-result').click()]);
  const result = await readDownload(download, session2.resultId);
  assertResultDocument(result, 'completed', session2);
  expect(result).toMatchObject({profileId: 'second-learner', resultId: 'inspection-result-2', baseMapRevision: 3, sequence: 2, previousResultId: 'inspection-result-1'});
});
