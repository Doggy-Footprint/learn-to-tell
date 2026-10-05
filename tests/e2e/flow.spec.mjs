import {test, expect} from '@playwright/test';
import {tid, gotoContext, toPrediction, toSimulation, show, expectOutput, fillPrediction, readDownload, assertResultDocument, focusByTab, kbPress, kbType, kbSelect, BASELINE_PRED, TRANSFER_PRED} from './helpers.mjs';
import {FIELDS} from '../fixtures/learning/shapes.mjs';

async function exportResult(page, how = 'click') {
  await show(page, 'export-result', how === 'click' ? 'click' : 'keyboard');
  const [download] = await Promise.all([page.waitForEvent('download'), (async () => { if (how === 'click') await tid(page, 'export-result').click(); else { await focusByTab(page, 'export-result'); await page.keyboard.press('Enter'); } })()]);
  return readDownload(download);
}

const kbp = async (page, id, key) => { await show(page, id, 'keyboard'); await kbPress(page, id, key); };
const kbt = async (page, id, text) => { await show(page, id, 'keyboard'); await kbType(page, id, text); };

test('[V5.S1] keyboard-only full flow across stages (C3) then download is a valid completed result', async ({page}) => {
  await gotoContext(page);
  await expect(tid(page, 'output-table')).toHaveCount(0);
  await kbPress(page, 'stage-next');
  await expect(tid(page, 'stage-prediction')).toBeVisible();
  for (const field of FIELDS) await kbType(page, `prediction-${field}`, BASELINE_PRED[field]);
  await kbPress(page, 'prediction-record');
  await kbPress(page, 'stage-next');
  await expect(tid(page, 'stage-simulation')).toBeVisible();
  await expectOutput(page, [1, 90, 5]);
  await kbp(page, 'prediction-reveal');
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  await expect(tid(page, 'prediction-original')).toBeVisible();

  await kbp(page, 'scenario-population-contrast');
  await expectOutput(page, [10, 90, 5]);
  await kbp(page, 'scenario-candidate-b');
  await expectOutput(page, [1, 80, 1]);
  await kbp(page, 'reset-inputs');
  await expectOutput(page, [1, 90, 5]);
  await kbt(page, 'input-defect', '2');
  await kbp(page, 'concept-defect-rate');
  await expect(tid(page, 'concept-defect-rate')).toHaveAttribute('aria-expanded', 'true');
  await expect(tid(page, 'concept-card-defect-rate')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tid(page, 'concept-defect-rate')).toHaveAttribute('aria-expanded', 'false');
  await expect(tid(page, 'concept-card-defect-rate')).toBeHidden();
  await kbPress(page, 'concept-defect-rate', ' ');
  await expect(tid(page, 'concept-defect-rate')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(tid(page, 'concept-defect-rate')).toHaveAttribute('aria-expanded', 'false');

  await kbp(page, 'link-to-explanation');
  await expect(page.locator('[data-highlighted="true"]').first()).toBeVisible();
  await kbp(page, 'link-back-to-simulation');
  await expect(tid(page, 'input-defect')).toHaveValue('2');

  await show(page, 'help-level', 'keyboard');
  await expect(tid(page, 'help-level')).toHaveValue('unknown');
  await kbp(page, 'hint-level-2');
  await expect(tid(page, 'hint-text-1')).toBeVisible();
  await expect(tid(page, 'hint-text-2')).toBeVisible();
  await expect(tid(page, 'hint-text-3')).toBeHidden();
  await show(page, 'help-level', 'keyboard');
  await expect(tid(page, 'help-level')).toHaveValue('hint');
  await kbSelect(page, 'help-level', 'hint');

  await show(page, 'transfer-prediction', 'keyboard');
  await expect(tid(page, 'transfer-result')).toHaveCount(0);
  for (const field of FIELDS) await kbt(page, `transfer-${field}`, TRANSFER_PRED[field]);
  await kbPress(page, 'transfer-record');
  await expect(tid(page, 'transfer-result')).toBeVisible();
  await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', 'supported');

  await kbt(page, 'response-question', '결함 비용과 확인 검사 성능은 얼마인가');
  await kbt(page, 'response-choice', '누락 비용이 불확실하므로 보류한다');
  await kbt(page, 'response-apply', '내 라인의 결함 비율부터 확인한다');
  await show(page, 'choice-pro', 'keyboard');
  await expect(tid(page, 'choice-pro')).toBeVisible();
  await expect(tid(page, 'choice-con')).toBeVisible();
  await expect(tid(page, 'choice-pro')).not.toHaveText('');
  await expect(tid(page, 'choice-con')).not.toHaveText('');
  await kbp(page, 'complete-lesson');
  await expect(tid(page, 'export-notice')).toContainText('map');
  const result = await exportResult(page, 'keyboard');
  assertResultDocument(result, 'completed');
  await expect(tid(page, 'export-error')).toHaveCount(0);
  const transfer = result.assessments.find(a => a.criterionId === 'calculate-transfer');
  expect(transfer).toMatchObject({status: 'supported', reviewer: 'automatic', help: 'hint'});
  const resp = result.responses.find(r => r.responseId === transfer.responseId);
  expect(resp).toMatchObject({purpose: 'prediction', attempt: 1, previousResponseId: null, visibility: 'before-output', help: 'hint'});
  for (const c of ['explain-transfer', 'ask-for-evidence', 'justify-choice', 'distinguish-denominators']) expect(result.assessments.find(a => a.criterionId === c)).toMatchObject({status: 'pending', reviewer: 'unreviewed'});
});

test('[V5.S7][CH-V7.partial][CH-V7.completed] partial and completed downloads are version 2 with a matching contentHash and validate against the T1 result contract (C13, C12)', async ({page}) => {
  await toPrediction(page);
  await fillPrediction(page, 'prediction', BASELINE_PRED);
  await tid(page, 'prediction-record').click();
  await show(page, 'export-notice');
  await expect(tid(page, 'export-notice')).toContainText('map');
  const partial = await exportResult(page);
  assertResultDocument(partial, 'partial');
  const t = partial.assessments.find(a => a.criterionId === 'calculate-transfer');
  expect(!t || t.status === 'pending' || t.status === 'skipped').toBe(true);
  for (const a of partial.assessments) expect(['pending', 'skipped']).toContain(a.status);
  const firstPrediction = partial.responses.find(r => r.purpose === 'prediction');
  expect(firstPrediction).toMatchObject({attempt: 1, previousResponseId: null, visibility: 'before-output'});

  await (await show(page, 'complete-lesson')).click();
  assertResultDocument(await exportResult(page), 'completed');
});

test('[V5.S8] every request during a full session goes to 127.0.0.1 only (C14)', async ({page, context}) => {
  const seen = [];
  context.on('request', req => { const u = new URL(req.url()); if (/^(https?|wss?):$/.test(u.protocol)) seen.push(u.hostname); });
  await context.route(url => /^https?:$/.test(url.protocol) && url.hostname !== '127.0.0.1', route => route.abort());
  await toSimulation(page, {predict: 'record'});
  await (await show(page, 'prediction-reveal')).click();
  await tid(page, 'scenario-population-contrast').click();
  await tid(page, 'scenario-candidate-b').click();
  await tid(page, 'reset-inputs').click();
  await (await show(page, 'concept-defect-rate')).click();
  await (await show(page, 'hint-level-3')).click();
  await fillPrediction(page, 'transfer', TRANSFER_PRED);
  await tid(page, 'transfer-record').click();
  await (await show(page, 'response-question')).fill('질문');
  await (await show(page, 'complete-lesson')).click();
  await exportResult(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.filter(h => h !== '127.0.0.1')).toEqual([]);
});

const HELP_TAG = {none: '[V5.S7.help-none]', agent: '[V5.S7.help-agent]'};
for (const level of ['none', 'agent']) test(`${HELP_TAG[level]} help level ${level} chosen in the browser is recorded in the downloaded result`, async ({page}) => {
  await toSimulation(page, {predict: 'record'});
  await (await show(page, 'help-level')).selectOption(level);
  await expect(tid(page, 'help-level')).toHaveValue(level);
  await fillPrediction(page, 'transfer', TRANSFER_PRED);
  await tid(page, 'transfer-record').click();
  await (await show(page, 'response-question')).fill('질문');
  await (await show(page, 'complete-lesson')).click();
  const result = await exportResult(page);
  assertResultDocument(result, 'completed');
  const assessed = new Set(result.assessments.map(a => a.responseId));
  expect(assessed.size).toBeGreaterThan(0);
  for (const r of result.responses.filter(x => assessed.has(x.responseId))) expect(r.help).toBe(level);
  for (const a of result.assessments) expect(a.help).toBe(level);
});

test('[V5.S7.response-skip] response-skip-question/choice/apply produce skipped assessments', async ({page}) => {
  await toSimulation(page, {predict: 'skip'});
  for (const kind of ['question', 'choice', 'apply']) await (await show(page, `response-skip-${kind}`)).click();
  await (await show(page, 'transfer-skip')).click();
  await (await show(page, 'complete-lesson')).click();
  const result = await exportResult(page);
  assertResultDocument(result, 'completed');
  for (const c of ['explain-transfer', 'ask-for-evidence', 'justify-choice', 'distinguish-denominators', 'calculate-transfer']) expect(result.assessments.find(a => a.criterionId === c), c).toMatchObject({status: 'skipped'});
});

test('[CH-V11] crypto.subtle.digest failure shows export-error and starts no download', async ({page}) => {
  await page.addInitScript(() => { crypto.subtle.digest = () => Promise.reject(new Error('digest unavailable')); });
  await toPrediction(page);
  await fillPrediction(page, 'prediction', BASELINE_PRED);
  await tid(page, 'prediction-record').click();
  await (await show(page, 'complete-lesson')).click();
  let downloads = 0;
  page.on('download', () => { downloads++; });
  await show(page, 'export-result');
  await tid(page, 'export-result').click();
  await expect(tid(page, 'export-error')).toBeVisible();
  expect(((await tid(page, 'export-error').textContent()) ?? '').trim().length).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  expect(downloads).toBe(0);
});
