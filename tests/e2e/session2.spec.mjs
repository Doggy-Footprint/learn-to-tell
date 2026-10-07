import {test, expect} from '@playwright/test';
import {toSimulation, show, submitResult, assertResultDocument} from './helpers.mjs';
import {session2} from '../fixtures/learning/data.mjs';
import {buildLesson, startReceiver, INSPECTION} from './builds.mjs';

const PORT = 4323;
let receiver;

test.use({baseURL: `http://127.0.0.1:${PORT}/`});
test.describe.configure({mode: 'serial'});

// Rebuilds dist/ with the second session fixture, then restores the default build; tests run serially (workers: 1).
test.beforeAll(async () => {
  buildLesson({...INSPECTION, session: 'tests/fixtures/learning/session.second.json'});
  receiver = await startReceiver(PORT);
});
test.afterAll(() => { receiver?.stop(); buildLesson(INSPECTION); });

test('[V5.S7.second-session] a build with the second session fixture submits that session in the result', async ({page}) => {
  await toSimulation(page, {predict: 'skip'});
  await (await show(page, 'complete-lesson')).click();
  const result = await submitResult(page, receiver, {resultId: session2.resultId});
  assertResultDocument(result, 'completed', session2);
  expect(result).toMatchObject({profileId: 'second-learner', resultId: 'inspection-result-2', baseMapRevision: 3, sequence: 2, previousResultId: 'inspection-result-1'});
});
