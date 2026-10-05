import {test, expect} from '@playwright/test';
import {tid, gotoContext, toSimulation, gotoFresh, show, setInputs, fillPrediction, expectOutput, readDownload, assertResultDocument, TRANSFER_PRED, BASELINE_PRED} from './helpers.mjs';
import {storageKey} from '../fixtures/learning/shapes.mjs';
import {oracleOutput} from '../fixtures/learning/oracle.mjs';

const key = storageKey();
const notice = (page, kind) => page.locator(`[data-testid="storage-notice"][data-kind="${kind}"]`);
const stored = page => page.evaluate(k => localStorage.getItem(k), key);

test('[V8.S9] corrupt stored value: load-failed notice, value untouched until the first action, page usable', async ({page, context}) => {
  await context.addInitScript(k => { localStorage.setItem(k, '{corrupt'); }, key);
  await gotoContext(page);
  await expect(notice(page, 'load-failed')).toBeVisible();
  expect(await stored(page)).toBe('{corrupt');
  await tid(page, 'stage-next').click();
  await expect(tid(page, 'stage-prediction')).toBeVisible();
  await expect.poll(() => stored(page)).not.toBe('{corrupt');
  const saved = JSON.parse(await stored(page));
  expect(saved.schemaVersion).toBe(1);
});

test('[V8.S10] blocked localStorage: unavailable notice, in-memory flow continues and the result still exports', async ({page, context}) => {
  await context.addInitScript(() => {
    Storage.prototype.getItem = function () { throw new Error('blocked'); };
    Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
  });
  await toSimulation(page, {predict: 'record'});
  await expect(notice(page, 'unavailable')).toBeVisible();
  await expectOutput(page, [1, 90, 5]);
  await fillPrediction(page, 'transfer', TRANSFER_PRED);
  await tid(page, 'transfer-record').click();
  await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', 'supported');
  await (await show(page, 'export-result')).scrollIntoViewIfNeeded();
  const [download] = await Promise.all([page.waitForEvent('download'), tid(page, 'export-result').click()]);
  assertResultDocument(await readDownload(download), 'partial');
});

test('[V8.S11] reset-learning needs an in-page confirm (no browser dialog); cancel keeps state; confirm clears and returns to context', async ({page}) => {
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.type()); d.dismiss(); });
  await toSimulation(page, {predict: 'record'});
  await setInputs(page, [7, 90, 5]);
  const indicator = await tid(page, 'stage-indicator').innerText();
  await (await show(page, 'reset-learning')).click();
  await expect(tid(page, 'reset-learning-confirm')).toBeVisible();
  await tid(page, 'reset-learning-cancel').click();
  await expect(tid(page, 'reset-learning-confirm')).toBeHidden();
  await expect(tid(page, 'stage-indicator')).toHaveText(indicator);
  await expect(tid(page, 'input-defect')).toHaveValue('7');
  await page.reload();
  await expect(await show(page, 'input-defect')).toHaveValue('7');

  await (await show(page, 'reset-learning')).click();
  await tid(page, 'reset-learning-confirm').click();
  await expect(tid(page, 'stage-context')).toBeVisible();
  await expect(tid(page, 'output-table')).toHaveCount(0);
  await expect.poll(async () => { const s = await stored(page); return s === null || JSON.parse(s).progress.stage === 'context'; }).toBe(true);
  await page.reload();
  await expect(tid(page, 'stage-context')).toBeVisible();
  expect(dialogs).toEqual([]);
});

const half = n => Number((n + 500000n) / 1000000n);
function expectedCells(d, s, f) {
  const {tp, fp, fn} = oracleOutput(d, s, f);
  const c1 = half(tp), c2 = half(tp + fp), c3 = half(tp + fp + fn);
  return [c1, c2 - c1, c3 - c2, 10000 - c3];
}
test('[V8.S12] output-grid data-cells equal cumulative rounded boundaries and sum to 10,000', async ({page}) => {
  await gotoFresh(page);
  const series = ['true-positive', 'false-positive', 'false-negative', 'true-negative'];
  for (const input of [[1, 90, 5], [10, 90, 5], [1, 80, 1], [0.015, 90, 5]]) {
    await setInputs(page, input);
    await expectOutput(page, input);
    const want = expectedCells(...input);
    expect(want.reduce((a, b) => a + b, 0)).toBe(10000);
    for (const [i, name] of series.entries()) await expect(tid(page, 'output-grid').locator(`[data-series="${name}"]`), `${input} ${name}`).toHaveAttribute('data-cells', String(want[i]));
    const sum = await tid(page, 'output-grid').locator('[data-series]').evaluateAll(els => els.reduce((a, e) => a + Number(e.getAttribute('data-cells')), 0));
    expect(sum).toBe(10000);
  }
});
