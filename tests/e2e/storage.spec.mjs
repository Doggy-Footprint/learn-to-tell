import {test, expect} from '@playwright/test';
import {tid, gotoContext, toSimulation, show, setInputs, fillPrediction, expectOutput, readDownload, assertResultDocument, TRANSFER_PRED} from './helpers.mjs';
import {storageKey, INPUT_IDS} from '../fixtures/learning/data.mjs';

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
  await expect(tid(page, 'input-defect-percent')).toHaveValue('7');
  await page.reload();
  await expect(await show(page, 'input-defect-percent')).toHaveValue('7');

  await (await show(page, 'reset-learning')).click();
  await tid(page, 'reset-learning-confirm').click();
  await expect(tid(page, 'stage-context')).toBeVisible();
  await expect(tid(page, 'output-table')).toHaveCount(0);
  await expect.poll(async () => { const s = await stored(page); return s === null || JSON.parse(s).progress.stage === 'context'; }).toBe(true);
  await page.reload();
  await expect(tid(page, 'stage-context')).toBeVisible();
  expect(dialogs).toEqual([]);
});


// C12: a stored value whose inputs keys differ from the lesson's inputIds is ignored (load-failed) and stays untouched until the first action.
test('[T53-V8.C12] stored progress with another lesson\'s inputs keys: load-failed notice, initial state, value untouched until the first action', async ({page}) => {
  await toSimulation(page, {predict: 'record'});
  await expect.poll(() => stored(page)).not.toBeNull();
  const doc = JSON.parse(await stored(page));
  doc.progress.inputs = {'flow-rate': 20};
  const text = JSON.stringify(doc);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, text]);
  await page.reload();
  await expect(notice(page, 'load-failed')).toBeVisible();
  await expect(tid(page, 'stage-context')).toBeVisible();
  expect(await stored(page)).toBe(text);
  await tid(page, 'stage-next').click();
  await expect(tid(page, 'stage-prediction')).toBeVisible();
  await expect.poll(() => stored(page)).not.toBe(text);
  expect(Object.keys(JSON.parse(await stored(page)).progress.inputs).sort()).toEqual([...INPUT_IDS].sort());
});
