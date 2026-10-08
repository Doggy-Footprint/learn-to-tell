import {expect} from '@playwright/test';
import {validateDocument} from '../../contracts/index.mjs';
import {oracleHash, HASH_FORMAT} from '../fixtures/contracts/hash-oracle.mjs';
import {session, lesson, INPUT_IDS, OUTPUT_IDS, baselinePrediction, retryPrediction, predC4, pred} from '../fixtures/learning/data.mjs';
import {crossCheckResult, crossCheckR11, oracleValues, PPV_UNDEFINED_TEXT} from '../fixtures/learning/oracle.mjs';

export const tid = (page, id) => page.getByTestId(id);
export {INPUT_IDS, OUTPUT_IDS, PPV_UNDEFINED_TEXT, pred};
export const BASELINE_PRED = baselinePrediction;
export const RETRY_PRED = retryPrediction;
export const TRANSFER_PRED = predC4;
export const UNDEFINED_ID = 'positive-predictive-value';
export const norm = text => (text ?? '').replace(/\s+/g, ' ').trim();
export const numbersIn = text => [...(text ?? '').matchAll(/\d[\d,]*(?:\.\d+)?/g)].map(m => Number(m[0].replace(/,/g, '')));
// Exact display strings: the first number token of an element, as written (ko-KR grouping, at most 3 decimals); expected values are literals.
export const tokensIn = text => (text ?? '').match(/-?\d[\d,]*(?:\.\d+)?/g) ?? [];
// column: 'output' (current), 'previous' or 'change' cell of the merged output-table (spec 0dcd8454f6e5111d A7)
export async function expectCellStrings(page, expectedByOutput, column = 'output') {
  for (const [id, literal] of Object.entries(expectedByOutput)) {
    const cell = tid(page, 'output-table').locator(`[data-${column}="${id}"]`);
    await expect.poll(async () => tokensIn(await cell.textContent())[0], {message: `output-table ${column} ${id} shows the string ${literal}`}).toBe(literal);
  }
}
export const near = (a, b, tol = 0.011) => Math.abs(a - b) <= tol;

// Spec stage flow: outputs exist only from stage simulation, after the baseline prediction is recorded or skipped.
// The spec does not map hints/concept cards/links/responses/export to stages, so show() walks stages (next, then back) until the testid is visible.
async function step(page, id, how) {
  if (how === 'keyboard') { await focusByTab(page, id); await page.keyboard.press('Enter'); } else await tid(page, id).click();
}
// Observable stage state: indicator text plus the stepper item marked aria-current (spec 679f728f2f602897 R3: no fixed-time waits after a stage step).
const stageSignature = page => page.evaluate(() => {
  const current = document.querySelector('[data-testid^="stepper-"][aria-current="step"], [data-testid^="stepper-"] [aria-current="step"]');
  const item = current?.closest('[data-testid^="stepper-"]');
  const regions = ['context', 'prediction', 'simulation', 'assessment', 'return', 'map'].filter(n => { const r = document.querySelector(`[data-testid="stage-${n}"]`); return r && r.getClientRects().length > 0; });
  return JSON.stringify([document.querySelector('[data-testid="stage-indicator"]')?.innerText ?? null, item?.getAttribute('data-testid') ?? null, regions]);
});
// Resolves true when the stage changed after the step, false when it did not within the generous bound (the caller then decides, as before).
async function stepToNextStage(page, dir, how) {
  const before = await stageSignature(page);
  await step(page, dir, how);
  return expect.poll(() => stageSignature(page), {timeout: 5000}).not.toBe(before).then(() => true, () => false);
}
export async function show(page, id, how = 'click') {
  const el = tid(page, id).first();
  const seen = async () => (await el.count()) > 0 && await el.isVisible();
  for (const dir of ['stage-next', 'stage-back']) {
    for (let i = 0; i < 8; i++) {
      if (await seen()) return tid(page, id);
      const nav = tid(page, dir);
      if (!(await nav.count()) || !(await nav.isEnabled())) break;
      await stepToNextStage(page, dir, how);
    }
  }
  await expect(el, `${id} reachable through stages`).toBeVisible();
  return tid(page, id);
}
// Walks stage-next / stage-back until stage-<name> is visible; show() may have moved the page to another stage.
export async function gotoStage(page, name) {
  const region = tid(page, `stage-${name}`);
  for (const dir of ['stage-next', 'stage-back']) {
    for (let i = 0; i < 8; i++) {
      if (await region.isVisible()) return region;
      const nav = tid(page, dir);
      if (!(await nav.count()) || !(await nav.isEnabled())) break;
      await stepToNextStage(page, dir, 'click');
    }
  }
  await expect(region, `stage ${name} reachable`).toBeVisible();
  return region;
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

// ---- output table and bars (R6). Display text is compared by its first number; the spec fixes label, unit and value but not the number format.
export const inspectionWant = ([d, s, f]) => oracleValues(d, s, f);
export async function expectOutputs(page, want, l = lesson) {
  const table = tid(page, 'output-table');
  for (const o of l.outputs) {
    const cell = table.locator(`[data-output="${o.outputId}"]`);
    const expected = want.display[o.outputId];
    if (expected === null) {
      await expect(cell, `${o.outputId} undefined`).toContainText(PPV_UNDEFINED_TEXT);
      await expect(tid(page, `bar-${o.outputId}`), `no bar for undefined ${o.outputId}`).toHaveCount(0);
    } else {
      await expect.poll(async () => near(numbersIn(await cell.textContent())[0], expected), {message: `${o.outputId} cell shows ${expected}`}).toBe(true);
      await expect.poll(async () => Number(await tid(page, `bar-${o.outputId}`).getAttribute('data-value')), {message: `${o.outputId} bar raw value`}).toBeCloseTo(want.raw[o.outputId], 9);
    }
  }
  await expectBarRatios(page, want, l);
}
export async function expectOutput(page, input) { const want = inspectionWant(input); await expectOutputs(page, want); return want; }
// Within one unit, width(bar) / width(largest bar) = |v| / max|v|; all widths 0 when the maximum is 0.
export async function expectBarRatios(page, want, l = lesson) {
  const groups = new Map();
  for (const o of l.outputs) if (want.raw[o.outputId] !== null) groups.set(o.unit, [...(groups.get(o.unit) ?? []), o.outputId]);
  for (const [unit, ids] of groups) {
    const max = Math.max(...ids.map(id => Math.abs(want.raw[id])));
    await expect.poll(async () => {
      const widths = await page.evaluate(list => Object.fromEntries(list.map(id => [id, document.querySelector(`[data-testid="bar-${id}"]`)?.getBoundingClientRect().width ?? -1])), ids);
      if (max === 0) return Object.values(widths).every(w => w >= 0 && w < 0.5);
      const top = widths[ids.find(id => Math.abs(want.raw[id]) === max)];
      return top > 0 && ids.every(id => Math.abs(widths[id] / top - Math.abs(want.raw[id]) / max) <= 0.02);
    }, {message: `bar widths of unit ${unit} are proportional to |value|`}).toBe(true);
  }
}
export async function expectPrevious(page, input, l = lesson) {
  const want = inspectionWant(input);
  for (const o of l.outputs) {
    const cell = tid(page, 'output-table').locator(`[data-previous="${o.outputId}"]`);
    const expected = want.display[o.outputId];
    if (expected === null) await expect(cell).toContainText(PPV_UNDEFINED_TEXT);
    else await expect.poll(async () => near(numbersIn(await cell.textContent())[0], expected), {message: `previous ${o.outputId}`}).toBe(true);
  }
}
export async function setInputs(page, values, ids = INPUT_IDS) {
  await show(page, `input-${ids[0]}`);
  for (const [i, id] of ids.entries()) await tid(page, `input-${id}`).fill(String(values[i]));
}
export async function fillPrediction(page, prefix, values, undefinedIds = [], l = lesson) {
  await show(page, `${prefix}-${l.outputs[0].outputId}`);
  for (const o of l.outputs) {
    if (undefinedIds.includes(o.outputId)) await tid(page, `${prefix}-${o.outputId}-undefined`).check();
    else await tid(page, `${prefix}-${o.outputId}`).fill(String(values[o.outputId]));
  }
}
// Number tokens of an element: every expected value must appear; `absent` values must not.
export async function expectNumbers(page, id, expected, {absent = []} = {}) {
  const el = await show(page, id);
  await expect.poll(async () => { const found = numbersIn(await el.textContent()); return expected.filter(x => !found.some(f => near(f, x, 0.0051))); }, {message: `${id} shows ${expected}`}).toEqual([]);
  const found = numbersIn(await el.textContent());
  for (const a of absent) expect(found.some(f => near(f, a, 0.0051)), `${id} must not show ${a}`).toBe(false);
}
export const valuesOf = (values, ids = OUTPUT_IDS) => ids.map(id => values[id]).filter(v => v !== null);

// Submits through the page button (POST /__ltt/result), asserts the 200 response, that no download starts, and returns the file the server wrote.
export async function submitResult(page, receiver, {how = 'click', resultId = session.resultId} = {}) {
  await show(page, 'export-result', how === 'click' ? 'click' : 'keyboard');
  let downloads = 0;
  const onDownload = () => { downloads++; };
  page.on('download', onDownload);
  try {
    const [response] = await Promise.all([
      page.waitForResponse(r => new URL(r.url()).pathname === '/__ltt/result' && r.request().method() === 'POST'),
      how === 'click' ? tid(page, 'export-result').click() : (async () => { await focusByTab(page, 'export-result'); await page.keyboard.press('Enter'); })(),
    ]);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ok: true, file: `result-${resultId}.json`});
    expect(response.request().postData(), 'the file is the posted body').toBe(receiver.text(resultId));
    await expect(tid(page, 'export-status')).toBeVisible();
    await expect(tid(page, 'export-error')).toBeHidden();
    await page.waitForTimeout(300);
  } finally { page.off('download', onDownload); }
  expect(downloads, 'no download event').toBe(0);
  return receiver.read(resultId);
}
export function assertResultDocument(result, state, s = session, l = lesson) {
  expect(result.version).toBe(2);
  expect(result.contentHash).toMatch(HASH_FORMAT);
  expect(result.contentHash, 'browser Web Crypto hash equals the node:crypto oracle').toBe(oracleHash(result));
  expect(validateDocument(result, 'result')).toEqual({ok: true, errors: []});
  expect(crossCheckResult(result, l)).toEqual([]);
  expect(crossCheckR11(result, l)).toEqual([]);
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

// C10 (spec 0dcd8454f6e5111d): a v2 lesson renders with defaults: label text = inputId, slider range = domain, range text without "실사용", no basis, no badge, no visuals.
export async function expectV2InputRows(page, l) {
  const sim = tid(page, 'stage-simulation');
  for (const i of l.inputs) {
    await expect(sim, `label of ${i.inputId}`).toContainText(`${i.inputId} (${i.unit})`);
    const slider = tid(page, `slider-${i.inputId}`);
    await expect(slider).toHaveAttribute('type', 'range');
    await expect(slider).toHaveAttribute('min', String(i.min));
    await expect(slider).toHaveAttribute('max', String(i.max));
    await expect(tid(page, `practical-range-${i.inputId}`)).toHaveText(new RegExp(`^\\s*범위 ${i.min}\\u2013${i.max}${i.unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`));
    await expect(tid(page, `practical-basis-${i.inputId}`)).toHaveCount(0);
    await expect(tid(page, `practical-out-${i.inputId}`)).toHaveCount(0);
  }
  await expect(page.locator('[data-testid^="visual-"]')).toHaveCount(0);
}
