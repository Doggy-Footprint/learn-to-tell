import {test, expect} from '@playwright/test';
import {tid, gotoFresh, expectV2InputRows, toPrediction, toSimulation, show, expectOutput, expectOutputs, expectPrevious, expectCellStrings, tokensIn, setInputs, fillPrediction, expectNumbers, inspectionWant, near, numbersIn, BASELINE_PRED, RETRY_PRED, OUTPUT_IDS, INPUT_IDS, UNDEFINED_ID, PPV_UNDEFINED_TEXT} from './helpers.mjs';
import {C6_VALUES, C6_INPUTS} from '../fixtures/learning/cases.mjs';
import {lesson as inspectionLesson} from '../fixtures/learning/data.mjs';
import {oracleValues} from '../fixtures/learning/oracle.mjs';

const DEFAULT = [1, 90, 5];
const DEFAULT_VALUES = {'defect-percent': 1, 'detection-percent': 90, 'false-positive-percent': 5};
const ORIGINAL_NUMBERS = [90, 495, 10, 9405, 585, 15.38, 94.95];
const cell = (page, id) => tid(page, 'output-table').locator(`[data-output="${id}"]`);

test('[V5.S2] C2 defaults, then sequence: record, reveal, contrast, B, reset keeps first prediction', async ({page}) => {
  await toSimulation(page, {predict: 'record'});
  const base = await expectOutput(page, DEFAULT);
  expect(OUTPUT_IDS.slice(0, 5).map(id => base.display[id])).toEqual([90, 495, 10, 9405, 585]);
  expect(base.display['positive-predictive-value']).toBeCloseTo(15.3846, 3);
  expect(base.display.accuracy).toBeCloseTo(94.95, 9);
  for (const id of INPUT_IDS) await expect(tid(page, `input-${id}`)).toHaveValue(String(DEFAULT_VALUES[id]));

  await expect(tid(page, 'baseline-comparison')).toHaveCount(0);
  await (await show(page, 'prediction-reveal')).click();
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  await expectNumbers(page, 'prediction-original', ORIGINAL_NUMBERS);

  await tid(page, 'scenario-population-contrast').click();
  await expectOutput(page, [10, 90, 5]);
  await expectPrevious(page, DEFAULT);
  await expect(tid(page, 'input-defect-percent')).toHaveValue('10');
  const contrast = oracleValues(10, 90, 5).display;
  expect(contrast['true-positive']).toBeCloseTo(900, 9);
  expect(contrast.accuracy).toBeCloseTo(94.5, 9);
  expect(contrast['positive-predictive-value']).toBeCloseTo(66.6667, 3);

  await tid(page, 'scenario-candidate-b').click();
  await expectOutput(page, [1, 80, 1]);
  await expectPrevious(page, [10, 90, 5]);
  await expect(tid(page, 'input-detection-percent')).toHaveValue('80');
  await expect(tid(page, 'input-false-positive-percent')).toHaveValue('1');

  await tid(page, 'reset-inputs').click();
  await expectOutput(page, DEFAULT);
  for (const id of INPUT_IDS) await expect(tid(page, `input-${id}`)).toHaveValue(String(DEFAULT_VALUES[id]));
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  await expectNumbers(page, 'prediction-original', ORIGINAL_NUMBERS);
  for (const id of OUTPUT_IDS) await expect(await show(page, `prediction-${id}`)).toBeDisabled();
  await show(page, 'input-defect-percent');

  await fillPrediction(page, 'prediction-retry', RETRY_PRED);
  await tid(page, 'prediction-retry').click();
  await expectNumbers(page, 'prediction-original', ORIGINAL_NUMBERS);
  for (const id of OUTPUT_IDS) await expect(await show(page, `prediction-${id}`)).toBeDisabled();

  await show(page, 'input-defect-percent');
  await tid(page, 'input-defect-percent').fill('10');
  await expectOutput(page, [10, 90, 5]);
  await expectPrevious(page, DEFAULT);
});

for (const id of C6_INPUTS) for (const value of C6_VALUES) {
  test(`[V5.S3.${id}.${value}] C5 boundary input ${value} on input-${id}`, async ({page}) => {
    await gotoFresh(page);
    const inputs = {...DEFAULT_VALUES};
    await tid(page, `input-${id}`).fill(String(value));
    const invalid = value < 0 || value > 100;
    const error = tid(page, `input-error-${id}`);
    if (invalid) {
      await expect(error).toBeVisible();
      await expect(tid(page, `input-${id}`)).toHaveAttribute('aria-invalid', 'true');
      await expect(tid(page, 'stale-output-notice')).toBeVisible();
      await expectOutput(page, DEFAULT);
    } else {
      inputs[id] = value;
      await expect(error).toBeHidden();
      await expect(tid(page, `input-${id}`)).not.toHaveAttribute('aria-invalid', 'true');
      await expect(tid(page, 'stale-output-notice')).toBeHidden();
      await expectOutput(page, INPUT_IDS.map(k => inputs[k]));
    }
  });
}

test('[V5.S4] C6 (0,90,0) shows PPV as undefined, never 0%, and draws no bar for it', async ({page}) => {
  await gotoFresh(page);
  await setInputs(page, [0, 90, 0]);
  const want = await expectOutput(page, [0, 90, 0]);
  expect(want.display[UNDEFINED_ID]).toBeNull();
  await expect(cell(page, UNDEFINED_ID)).toContainText(PPV_UNDEFINED_TEXT);
  await expect(cell(page, UNDEFINED_ID)).not.toContainText('0%');
  await expect(tid(page, `bar-${UNDEFINED_ID}`)).toHaveCount(0);
  expect(numbersIn(await cell(page, 'true-negative').textContent())[0]).toBe(10000);
  expect(near(numbersIn(await cell(page, 'accuracy').textContent())[0], 100)).toBe(true);
  await expect(tid(page, 'bar-true-negative')).toHaveAttribute('data-value', '10000');
});

test('[T53-V8.output-bars] table values equal raw*scale, bar data-value is the raw value, bar widths are proportional per unit (R6, C2)', async ({page}) => {
  await gotoFresh(page);
  for (const input of [[1, 90, 5], [10, 90, 5], [1, 80, 1], [0.015, 90, 5], [0, 90, 0], [100, 0, 100]]) {
    await setInputs(page, input);
    await expectOutput(page, input);
  }
  for (const o of ['true-positive', 'accuracy']) await expect(tid(page, `bar-${o}`)).toHaveCount(1);
  await expect(tid(page, 'output-table')).toContainText('양성 예측도(PPV)');
});

test('[T53-V8.bar-width-100] the largest bar of each unit group fills its track (width 100%) (C2)', async ({page}) => {
  await gotoFresh(page);
  const ratio = id => page.evaluate(i => { const b = document.querySelector(`[data-testid="bar-${i}"]`); return b.getBoundingClientRect().width / b.parentElement.getBoundingClientRect().width; }, id);
  await expect.poll(() => ratio('true-negative'), {message: 'largest 개 bar (9405)'}).toBeCloseTo(1, 1);
  await expect.poll(() => ratio('accuracy'), {message: 'largest % bar (94.95)'}).toBeCloseTo(1, 1);
  await expect.poll(async () => (await ratio('positive-predictive-value')) < 0.5, {message: 'smaller % bar'}).toBe(true);
});

test('[V5.S2.baseline-a] scenario-baseline-a restores the C2 values and inputs', async ({page}) => {
  await gotoFresh(page);
  await tid(page, 'scenario-candidate-b').click();
  await expectOutput(page, [1, 80, 1]);
  await tid(page, 'scenario-baseline-a').click();
  await expectOutput(page, DEFAULT);
  await expectPrevious(page, [1, 80, 1]);
  for (const id of INPUT_IDS) await expect(tid(page, `input-${id}`)).toHaveValue(String(DEFAULT_VALUES[id]));
});

test('[V5.S2.ppv-undefined] baseline prediction with PPV marked undefined is kept and displayed as undefined', async ({page}) => {
  await toPrediction(page);
  await fillPrediction(page, 'prediction', BASELINE_PRED, [UNDEFINED_ID]);
  await tid(page, 'prediction-record').click();
  await tid(page, 'stage-next').click();
  await (await show(page, 'prediction-reveal')).click();
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  await expectNumbers(page, 'prediction-original', [90, 495, 10, 9405, 585, 94.95], {absent: [15.38]});
  await expect(tid(page, 'prediction-original')).toContainText(PPV_UNDEFINED_TEXT);
});

test('[V5.S2.skipped-original] skipped predictions show 건너뜀 and keep disabled empty inputs', async ({page}) => {
  await toSimulation(page, {predict: 'skip'});
  await expect(await show(page, 'prediction-original')).toContainText('건너뜀');
  for (const id of OUTPUT_IDS) { const el = await show(page, `prediction-${id}`); await expect(el).toBeDisabled(); await expect(el).toHaveValue(''); }
  await (await show(page, 'transfer-skip')).click();
  await expect(await show(page, 'transfer-original')).toContainText('건너뜀');
  for (const id of OUTPUT_IDS) await expect(await show(page, `transfer-${id}`)).toBeDisabled();
});

const S3_TAG = {empty: '[V5.S3.empty]', 'non-numeric': '[V5.S3.non-numeric]'};
for (const kind of ['empty', 'non-numeric']) for (const id of C6_INPUTS) {
  test(`${S3_TAG[kind]} ${id}: ${kind} input on input-${id} is rejected without recalculation`, async ({page}) => {
    await gotoFresh(page);
    const input = tid(page, `input-${id}`);
    await input.fill('');
    if (kind === 'non-numeric') { await input.focus(); await page.keyboard.type('e'); }
    await expect(tid(page, `input-error-${id}`)).toBeVisible();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(tid(page, 'stale-output-notice')).toBeVisible();
    await expectOutput(page, DEFAULT);
  });
}

for (const id of C6_INPUTS) test(`[V5.S3.reload] ${id}: reload after an invalid entry restores the last valid value of input-${id}`, async ({page}) => {
  await gotoFresh(page);
  const inputs = {...DEFAULT_VALUES};
  await tid(page, `input-${id}`).fill('7');
  inputs[id] = 7;
  await expectOutput(page, INPUT_IDS.map(k => inputs[k]));
  await tid(page, `input-${id}`).fill('-5');
  await expect(tid(page, `input-error-${id}`)).toBeVisible();
  await page.reload();
  await expect(await show(page, `input-${id}`)).toHaveValue('7');
  await expect(tid(page, `input-${id}`)).not.toHaveAttribute('aria-invalid', 'true');
  await expect(tid(page, `input-error-${id}`)).toBeHidden();
  await expectOutput(page, INPUT_IDS.map(k => inputs[k]));
});

// Literals follow Intl.NumberFormat('ko-KR', {maximumFractionDigits: 3}) written by hand from the closed-form values.
test('[T53-V8.display-strings] table cells and the shown prediction use exact formatted strings (R6, formatCount)', async ({page}) => {
  await toSimulation(page, {predict: 'record'});
  await expectCellStrings(page, {'true-positive': '90', 'false-positive': '495', 'false-negative': '10', 'true-negative': '9,405', 'positive-count': '585', 'positive-predictive-value': '15.385', accuracy: '94.95'});
  await (await show(page, 'prediction-reveal')).click();
  const shown = tokensIn(await tid(page, 'prediction-original').textContent());
  for (const literal of ['90', '495', '10', '9,405', '585', '15.38', '94.95']) expect(shown, `prediction shows ${literal}`).toContain(literal);
  await tid(page, 'scenario-population-contrast').click();
  await expectCellStrings(page, {'true-positive': '900', 'false-positive': '450', 'false-negative': '100', 'true-negative': '8,550', 'positive-count': '1,350', 'positive-predictive-value': '66.667', accuracy: '94.5'});
  await expectCellStrings(page, {'true-positive': '90', 'true-negative': '9,405', 'positive-predictive-value': '15.385'}, 'previous');
});

test('[F4-C10.inspection v2] the v2 manufacturing lesson renders with defaults: label = inputId, slider range = domain, no visuals', async ({page}) => {
  await gotoFresh(page);
  await expectV2InputRows(page, inspectionLesson);
  await expectOutput(page, [1, 90, 5]);
});
