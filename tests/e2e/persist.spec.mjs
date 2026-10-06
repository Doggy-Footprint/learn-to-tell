import {test, expect} from '@playwright/test';
import {tid, gotoContext, toPrediction, toSimulation, gotoFresh, show, expectOutput, fillPrediction, expectNumbers, TRANSFER_PRED, BASELINE_PRED, RETRY_PRED, UNDEFINED_ID, INPUT_IDS, OUTPUT_IDS, pred} from './helpers.mjs';

const MINE = pred(77, 123, 4, 9000, 200, 38.5, 90.1);

async function expectRestored(page, texts) {
  await expect(await show(page, 'input-defect-percent')).toHaveValue('12.5');
  await expectNumbers(page, 'prediction-original', [77, 123, 4, 9000, 200, 38.5, 90.1]);
  await expect(await show(page, 'response-apply')).toHaveValue(texts.apply);
  await expect(await show(page, 'response-question')).toHaveValue(texts.question);
  await expect(tid(page, 'storage-notice')).toHaveCount(0);
}

test('[V5.S5] round-trip links keep input/prediction/scroll; reload and reopened tab restore state (C9)', async ({page, context}) => {
  const texts = {apply: '내 라인에 적용할 첫 질문', question: '확인 검사의 오탐률은 얼마인가'};
  await toPrediction(page);
  await fillPrediction(page, 'prediction', MINE);
  await tid(page, 'prediction-record').click();
  await tid(page, 'stage-next').click();
  await tid(page, 'input-defect-percent').fill('12.5');
  await (await show(page, 'prediction-reveal')).click();
  await fillPrediction(page, 'prediction-retry', RETRY_PRED);
  await tid(page, 'prediction-retry').click();
  await (await show(page, 'response-question')).fill(texts.question);
  await tid(page, 'response-apply').fill(texts.apply);
  await tid(page, 'response-apply').blur();
  await show(page, 'input-defect-percent');
  const stageText = await tid(page, 'stage-indicator').innerText();

  await (await show(page, 'link-to-explanation')).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 37));
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);
  await tid(page, 'link-to-explanation').click();
  const highlighted = page.locator('[data-highlighted="true"]');
  await expect(highlighted.first()).toBeVisible();
  await expect.poll(() => highlighted.evaluateAll(els => {
    const hasInput = e => e.matches('[data-testid^="input-"]') || !!e.querySelector('[data-testid^="input-"]');
    return {related_input: els.some(hasInput), explanation_paragraph: els.some(e => !hasInput(e))};
  }), {message: 'both the explanation paragraph and a related input are highlighted'}).toEqual({related_input: true, explanation_paragraph: true});
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - before), {message: 'the link must really scroll'}).toBeGreaterThan(2);
  await tid(page, 'link-back-to-simulation').click();
  const after = await page.evaluate(() => window.scrollY);
  expect(Math.abs(after - before), `scroll before=${before} after=${after}`).toBeLessThanOrEqual(2);
  await expectRestored(page, texts);

  await show(page, 'input-defect-percent');
  const stageNow = await tid(page, 'stage-indicator').innerText();
  await page.reload();
  await expect(tid(page, 'stage-indicator')).toHaveText(stageNow);
  await expectRestored(page, texts);
  await show(page, 'output-table');
  await expectOutput(page, [12.5, 90, 5]);

  const reopened = await context.newPage();
  await reopened.goto('/');
  await expectRestored(reopened, texts);
  await show(reopened, 'output-table');
  await expectOutput(reopened, [12.5, 90, 5]);
});

test('[V5.S6] outputs absent before baseline record/skip; new-case result absent until prediction recorded or skipped (C12)', async ({page}) => {
  const count = (id, pg = page) => pg.locator(`[data-testid="${id}"]`).count();
  const gated = ['output-table', ...OUTPUT_IDS.map(id => `bar-${id}`), ...INPUT_IDS.map(id => `input-${id}`), 'scenario-baseline-a', 'scenario-population-contrast', 'scenario-candidate-b', 'reset-inputs', 'baseline-comparison', 'transfer-result'];
  const stageRegions = ['context', 'prediction', 'simulation', 'assessment', 'return', 'map'];
  await gotoContext(page);
  for (const id of gated) expect(await count(id), id).toBe(0);
  for (const name of stageRegions) expect(await count(`stage-${name}`), name).toBe(name === 'context' ? 1 : 0);
  const html = await page.content();
  for (const id of ['output-table', 'bar-true-positive', 'transfer-result']) expect(html).not.toContain(`data-testid="${id}"`);
  await tid(page, 'stage-next').click();
  for (const name of stageRegions) expect(await count(`stage-${name}`), name).toBe(name === 'prediction' ? 1 : 0);
  for (const id of gated) expect(await count(id), `${id} before baseline record/skip`).toBe(0);
  const next = tid(page, 'stage-next');
  if (await next.count() && await next.isEnabled()) await next.click();
  for (const id of gated) expect(await count(id), `${id} still absent without record/skip`).toBe(0);
  await page.reload();
  await expect(tid(page, 'stage-prediction')).toBeVisible();
  for (const id of gated) expect(await count(id), `${id} after reload`).toBe(0);

  await fillPrediction(page, 'prediction', BASELINE_PRED);
  await tid(page, 'prediction-record').click();
  await tid(page, 'stage-next').click();
  await expect(tid(page, 'stage-simulation')).toBeVisible();
  await expect(tid(page, 'output-table')).toBeVisible();
  await show(page, 'prediction-reveal');
  expect(await count('transfer-result')).toBe(0);
  await fillPrediction(page, 'transfer', TRANSFER_PRED);
  expect(await count('transfer-result')).toBe(0);
  await tid(page, 'transfer-record').click();
  await expect(tid(page, 'transfer-result')).toBeVisible();
  await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', 'supported');

  const other = await page.context().newPage();
  await other.goto('/');
  await other.evaluate(() => localStorage.clear());
  await other.reload();
  await toSimulation(other, {predict: 'skip'});
  expect(await count('transfer-result', other)).toBe(0);
  await show(other, 'transfer-skip');
  await tid(other, 'transfer-skip').click();
  await expect(tid(other, 'transfer-result')).toBeVisible();
  await expect(tid(other, 'transfer-grade')).toHaveAttribute('data-status', 'skipped');
});

const TR_NUMBERS = [160, 196, 40, 9604, 356, 44.94, 97.64];
const GRADE_TAG = {partial: '[V5.S6.grade-partial]', 'not-demonstrated': '[V5.S6.grade-not-demonstrated]'};
for (const [id, change, status] of [['partial', {'true-positive': 163}, 'partial'], ['not-demonstrated', Object.fromEntries(OUTPUT_IDS.map(k => [k, 0])), 'not_demonstrated']]) {
  test(`${GRADE_TAG[id]} transfer-grade shows ${status}`, async ({page}) => {
    await gotoFresh(page);
    await fillPrediction(page, 'transfer', {...TRANSFER_PRED, ...change});
    await tid(page, 'transfer-record').click();
    await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', status);
  });
}
test('[V5.S6.ppv-undefined] transfer PPV marked undefined is shown and graded as a mismatch', async ({page}) => {
  await gotoFresh(page);
  await fillPrediction(page, 'transfer', TRANSFER_PRED, [UNDEFINED_ID]);
  await tid(page, 'transfer-record').click();
  await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', 'partial');
  await expectNumbers(page, 'transfer-original', [160, 196, 40, 9604, 356, 97.64], {absent: [44.94]});
  await expect(tid(page, 'transfer-original')).toContainText('정의되지 않음');
});
test('[V5.S6.transfer-retry] transfer retry uses its own fields; the original stays unchanged and disabled', async ({page}) => {
  await gotoFresh(page);
  await fillPrediction(page, 'transfer', TRANSFER_PRED);
  await tid(page, 'transfer-record').click();
  await expectNumbers(page, 'transfer-original', TR_NUMBERS);
  for (const field of OUTPUT_IDS) await expect(await show(page, `transfer-${field}`)).toBeDisabled();
  await fillPrediction(page, 'transfer-retry', {...TRANSFER_PRED, 'true-positive': 1, accuracy: 50});
  await tid(page, 'transfer-retry').click();
  await expectNumbers(page, 'transfer-original', TR_NUMBERS, {absent: [50]});
  await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', 'supported');
  for (const field of OUTPUT_IDS) await expect(await show(page, `transfer-${field}`)).toBeDisabled();
});
