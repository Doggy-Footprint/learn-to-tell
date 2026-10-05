import {expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {validateDocument} from '../../contracts/index.mjs';
import {oracleHash, HASH_FORMAT} from '../fixtures/contracts/hash-oracle.mjs';
import {session, lesson, FIELDS} from '../fixtures/learning/shapes.mjs';
import {crossCheckResult, oracleDisplay} from '../fixtures/learning/oracle.mjs';

export const tid = (page, id) => page.getByTestId(id);
export const INPUT_SUFFIX = ['defect', 'detection', 'false-positive'];

// Spec v4 stage flow: outputs exist only from stage simulation, after the baseline prediction is recorded or skipped.
// The spec does not map hints/concept cards/links/responses/export to stages, so show() walks stages (next, then back) until the testid is visible.
async function step(page, id, how) {
  if (how === 'keyboard') { await focusByTab(page, id); await page.keyboard.press('Enter'); } else await tid(page, id).click();
}
export async function show(page, id, how = 'click') {
  const el = tid(page, id).first();
  const seen = async () => (await el.count()) > 0 && await el.isVisible();
  for (const dir of ['stage-next', 'stage-back']) {
    for (let i = 0; i < 8; i++) {
      if (await seen()) return tid(page, id);
      const nav = tid(page, dir);
      if (!(await nav.count()) || !(await nav.isEnabled())) break;
      await step(page, dir, how);
      await el.waitFor({state: 'visible', timeout: 400}).catch(() => {});
    }
  }
  await expect(el, `${id} reachable through stages`).toBeVisible();
  return tid(page, id);
}
export async function gotoContext(page) {
  await page.goto('/');
  await expect(tid(page, 'stage-context')).toBeVisible();
}
export async function toPrediction(page, how = 'click') {
  await gotoContext(page);
  await step(page, 'stage-next', how);
  await expect(tid(page, 'stage-prediction')).toBeVisible();
}
export async function toSimulation(page, {predict = 'skip', how = 'click'} = {}) {
  await toPrediction(page, how);
  if (predict === 'record') { await fillPrediction(page, 'prediction', BASELINE_PRED); await tid(page, 'prediction-record').click(); } else await tid(page, 'prediction-skip').click();
  await step(page, 'stage-next', how);
  await expect(tid(page, 'stage-simulation')).toBeVisible();
  await expect(tid(page, 'output-table')).toBeVisible();
}
export async function gotoFresh(page) { await toSimulation(page, {predict: 'skip'}); }
export async function expectOutput(page, [d, s, f]) {
  const want = oracleDisplay(d, s, f);
  for (const field of FIELDS) await expect(tid(page, 'output-table').locator(`[data-field=${field}]`)).toHaveText(want[field]);
  const grid = tid(page, 'output-grid');
  const attr = {truePositive: 'data-true-positive', falsePositive: 'data-false-positive', falseNegative: 'data-false-negative', trueNegative: 'data-true-negative'};
  for (const [field, name] of Object.entries(attr)) {
    await expect.poll(async () => Number(await grid.getAttribute(name)), {message: `${name} raw value`}).toBeCloseTo(want.raw[field], 9);
  }
  return want;
}
export async function expectPrevious(page, input) {
  const want = oracleDisplay(...input);
  for (const field of FIELDS) await expect(tid(page, 'output-previous').locator(`[data-field=${field}]`)).toHaveText(want[field]);
}
export async function setInputs(page, [d, s, f]) {
  await show(page, 'input-defect');
  for (const [suffix, v] of [['defect', d], ['detection', s], ['false-positive', f]]) await tid(page, `input-${suffix}`).fill(String(v));
}
export async function fillPrediction(page, prefix, values, undefinedPpv = false) {
  await show(page, `${prefix}-truePositive`);
  for (const field of FIELDS) {
    if (field === 'positivePredictiveValue' && undefinedPpv) continue;
    await tid(page, `${prefix}-${field}`).fill(String(values[field]));
  }
  if (undefinedPpv) await tid(page, `${prefix}-ppv-undefined`).check();
}
export const BASELINE_PRED = {truePositive: 90, falsePositive: 495, falseNegative: 10, trueNegative: 9405, positiveCount: 585, positivePredictiveValue: 15.38, accuracy: 94.95};
export const RETRY_PRED = {truePositive: 91, falsePositive: 494, falseNegative: 9, trueNegative: 9406, positiveCount: 585, positivePredictiveValue: 15.56, accuracy: 94.97};
export const TRANSFER_PRED = {truePositive: 160, falsePositive: 196, falseNegative: 40, trueNegative: 9604, positiveCount: 356, positivePredictiveValue: 44.94, accuracy: 97.64};

export async function readDownload(download, resultId = session.resultId) {
  expect(download.suggestedFilename()).toBe(`result-${resultId}.json`);
  const path = await download.path();
  return JSON.parse(readFileSync(path, 'utf8'));
}
export async function expectTokens(page, id, tokens, {absent = []} = {}) {
  const el = await show(page, id);
  await expect.poll(async () => { const found = ((await el.textContent()) ?? '').match(/[\d,.]+%?/g) ?? []; return tokens.filter(x => !found.includes(x)); }, {message: `${id} shows ${tokens}`}).toEqual([]);
  const found = ((await el.textContent()) ?? '').match(/[\d,.]+%?/g) ?? [];
  for (const a of absent) expect(found).not.toContain(a);
}
export function assertResultDocument(result, state, s = session) {
  expect(result.version).toBe(2);
  expect(result.contentHash).toMatch(HASH_FORMAT);
  expect(result.contentHash, 'browser Web Crypto hash equals the node:crypto oracle').toBe(oracleHash(result));
  expect(validateDocument(result, 'result')).toEqual({ok: true, errors: []});
  expect(crossCheckResult(result, lesson)).toEqual([]);
  expect(result.state).toBe(state);
  for (const k of ['profileId', 'resultId', 'baseMapRevision', 'sequence', 'previousResultId']) expect(result[k]).toBe(s[k]);
}

// keyboard-only helpers: never use pointer or fill
export async function focusByTab(page, id) {
  const matches = () => page.evaluate(i => document.activeElement?.matches(`[data-testid="${i}"]`) ?? false, id);
  for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 400; i++) {
    if (await matches()) return;
    await page.keyboard.press(key);
  }
  expect(await matches(), `focus reachable by keyboard: ${id}`).toBe(true);
}
export async function kbPress(page, id, key = 'Enter') { await focusByTab(page, id); await page.keyboard.press(key); }
export async function kbType(page, id, text) {
  await focusByTab(page, id);
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(String(text));
}
export async function kbSelect(page, id, value) {
  await focusByTab(page, id);
  const el = tid(page, id);
  for (let i = 0; i < 6 && (await el.inputValue()) !== value; i++) await page.keyboard.press('ArrowDown');
  await expect(el).toHaveValue(value);
}
