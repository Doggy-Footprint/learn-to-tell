import {test, expect} from '@playwright/test';
import {tid, gotoFresh, toPrediction, toSimulation, show, expectOutput, expectPrevious, setInputs, fillPrediction, expectTokens, BASELINE_PRED, RETRY_PRED} from './helpers.mjs';
import {FIELDS} from '../fixtures/learning/shapes.mjs';
import {C6_VALUES, C6_INPUTS} from '../fixtures/learning/cases.mjs';
import {oracleDisplay, PPV_UNDEFINED} from '../fixtures/learning/oracle.mjs';

const DEFAULT = [1, 90, 5];
const ORIGINAL_TOKENS = ['90', '495', '10', '9,405', '585', '15.38%', '94.95%'];
async function expectOriginalValues(page) {
  const el = await show(page, 'prediction-original');
  await expect.poll(async () => { const t = (await el.textContent()) ?? ''; return ORIGINAL_TOKENS.filter(x => !(t.match(/[\d,.]+%?/g) ?? []).includes(x)); }).toEqual([]);
}

test('[V5.S2] C1 defaults, then C2 sequence: record, reveal, contrast, B, reset keeps first prediction', async ({page}) => {
  await toSimulation(page, {predict: 'record'});
  const base = await expectOutput(page, DEFAULT);
  expect([base.truePositive, base.falsePositive, base.falseNegative, base.trueNegative, base.positiveCount, base.positivePredictiveValue, base.accuracy]).toEqual(['90', '495', '10', '9,405', '585', '15.38%', '94.95%']);
  await expect(tid(page, 'input-defect')).toHaveValue('1');
  await expect(tid(page, 'input-detection')).toHaveValue('90');
  await expect(tid(page, 'input-false-positive')).toHaveValue('5');

  await expect(tid(page, 'baseline-comparison')).toHaveCount(0);
  await (await show(page, 'prediction-reveal')).click();
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  await expectOriginalValues(page);

  await tid(page, 'scenario-population-contrast').click();
  await expectOutput(page, [10, 90, 5]);
  await expectPrevious(page, DEFAULT);
  await expect(tid(page, 'input-defect')).toHaveValue('10');
  const contrast = oracleDisplay(10, 90, 5);
  expect([contrast.truePositive, contrast.positivePredictiveValue, contrast.accuracy]).toEqual(['900', '66.67%', '94.50%']);

  await tid(page, 'scenario-candidate-b').click();
  await expectOutput(page, [1, 80, 1]);
  await expectPrevious(page, [10, 90, 5]);
  await expect(tid(page, 'input-detection')).toHaveValue('80');
  await expect(tid(page, 'input-false-positive')).toHaveValue('1');

  await tid(page, 'reset-inputs').click();
  await expectOutput(page, DEFAULT);
  await expect(tid(page, 'input-defect')).toHaveValue('1');
  await expect(tid(page, 'input-detection')).toHaveValue('90');
  await expect(tid(page, 'input-false-positive')).toHaveValue('5');
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  await expectOriginalValues(page);
  for (const field of FIELDS) await expect(await show(page, `prediction-${field}`)).toBeDisabled();
  await expectOriginalValues(page);
  await show(page, 'input-defect');

  await fillPrediction(page, 'prediction-retry', RETRY_PRED);
  await tid(page, 'prediction-retry').click();
  await expectOriginalValues(page);
  for (const field of FIELDS) await expect(await show(page, `prediction-${field}`)).toBeDisabled();

  await show(page, 'input-defect');
  await tid(page, 'input-defect').fill('10');
  await expectOutput(page, [10, 90, 5]);
  await expectPrevious(page, DEFAULT);
});

for (const suffix of C6_INPUTS) for (const value of C6_VALUES) {
  test(`[V5.S3.${suffix}.${value}] C6 boundary input ${value} on input-${suffix}`, async ({page}) => {
    await gotoFresh(page);
    const inputs = {...{defect: 1, detection: 90, 'false-positive': 5}};
    await tid(page, `input-${suffix}`).fill(String(value));
    const invalid = value < 0 || value > 100;
    const error = tid(page, `input-error-${suffix}`);
    if (invalid) {
      await expect(error).toBeVisible();
      await expect(tid(page, `input-${suffix}`)).toHaveAttribute('aria-invalid', 'true');
      await expect(tid(page, 'stale-output-notice')).toBeVisible();
      await expectOutput(page, DEFAULT);
    } else {
      inputs[suffix] = value;
      await expect(error).toBeHidden();
      await expect(tid(page, `input-${suffix}`)).not.toHaveAttribute('aria-invalid', 'true');
      await expect(tid(page, 'stale-output-notice')).toBeHidden();
      await expectOutput(page, [inputs.defect, inputs.detection, inputs['false-positive']]);
    }
  });
}

test('[V5.S4] C7 (0,90,0) shows PPV as undefined, never 0%', async ({page}) => {
  await gotoFresh(page);
  await setInputs(page, [0, 90, 0]);
  const want = await expectOutput(page, [0, 90, 0]);
  expect(want.positivePredictiveValue).toBe(PPV_UNDEFINED);
  const cell = tid(page, 'output-table').locator('[data-field=positivePredictiveValue]');
  await expect(cell).toHaveText('정의되지 않음(양성 0)');
  await expect(cell).not.toContainText('0%');
  await expect(tid(page, 'output-table').locator('[data-field=trueNegative]')).toHaveText('10,000');
  await expect(tid(page, 'output-table').locator('[data-field=accuracy]')).toHaveText('100.00%');
});

test('[V5.S2.baseline-a] scenario-baseline-a restores the C1 values and inputs', async ({page}) => {
  await gotoFresh(page);
  await tid(page, 'scenario-candidate-b').click();
  await expectOutput(page, [1, 80, 1]);
  await tid(page, 'scenario-baseline-a').click();
  await expectOutput(page, DEFAULT);
  await expectPrevious(page, [1, 80, 1]);
  await expect(tid(page, 'input-defect')).toHaveValue('1');
  await expect(tid(page, 'input-detection')).toHaveValue('90');
  await expect(tid(page, 'input-false-positive')).toHaveValue('5');
});

test('[V5.S2.ppv-undefined] baseline prediction with PPV marked undefined is kept and displayed as undefined', async ({page}) => {
  await toPrediction(page);
  await fillPrediction(page, 'prediction', BASELINE_PRED, true);
  await tid(page, 'prediction-record').click();
  await tid(page, 'stage-next').click();
  await (await show(page, 'prediction-reveal')).click();
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  await expectTokens(page, 'prediction-original', ['90', '495', '10', '9,405', '585', '94.95%'], {absent: ['15.38%']});
  await expect(tid(page, 'prediction-original')).toContainText('정의되지 않음');
});

test('[V5.S2.skipped-original] skipped predictions show 건너뜀 and keep disabled empty inputs', async ({page}) => {
  await toSimulation(page, {predict: 'skip'});
  await expect(await show(page, 'prediction-original')).toContainText('건너뜀');
  for (const field of FIELDS) { const el = await show(page, `prediction-${field}`); await expect(el).toBeDisabled(); await expect(el).toHaveValue(''); }
  await (await show(page, 'transfer-skip')).click();
  await expect(await show(page, 'transfer-original')).toContainText('건너뜀');
  for (const field of FIELDS) await expect(await show(page, `transfer-${field}`)).toBeDisabled();
});

const S3_TAG = {empty: '[V5.S3.empty]', 'non-numeric': '[V5.S3.non-numeric]'};
for (const kind of ['empty', 'non-numeric']) for (const suffix of C6_INPUTS) {
  test(`${S3_TAG[kind]} ${suffix}: ${kind} input on input-${suffix} is rejected without recalculation`, async ({page}) => {
    await gotoFresh(page);
    const input = tid(page, `input-${suffix}`);
    await input.fill('');
    if (kind === 'non-numeric') { await input.focus(); await page.keyboard.type('e'); }
    await expect(tid(page, `input-error-${suffix}`)).toBeVisible();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(tid(page, 'stale-output-notice')).toBeVisible();
    await expectOutput(page, DEFAULT);
  });
}

for (const suffix of C6_INPUTS) test(`[V5.S3.reload] ${suffix}: reload after an invalid entry restores the last valid value of input-${suffix}`, async ({page}) => {
  await gotoFresh(page);
  const inputs = {defect: 1, detection: 90, 'false-positive': 5};
  await tid(page, `input-${suffix}`).fill('7');
  inputs[suffix] = 7;
  await expectOutput(page, [inputs.defect, inputs.detection, inputs['false-positive']]);
  await tid(page, `input-${suffix}`).fill('-5');
  await expect(tid(page, `input-error-${suffix}`)).toBeVisible();
  await page.reload();
  await expect(await show(page, `input-${suffix}`)).toHaveValue('7');
  await expect(tid(page, `input-${suffix}`)).not.toHaveAttribute('aria-invalid', 'true');
  await expect(tid(page, `input-error-${suffix}`)).toBeHidden();
  await expectOutput(page, [inputs.defect, inputs.detection, inputs['false-positive']]);
});
