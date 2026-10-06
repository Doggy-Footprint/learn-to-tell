import {test, expect} from '@playwright/test';
import {tid, norm, show, gotoStage, expectCellStrings, expectOutputs, fillPrediction, readDownload, assertResultDocument} from './helpers.mjs';
import {syntheticLesson as L, session} from '../fixtures/learning/data.mjs';
import {buildLesson, startServe, SYNTHETIC, INSPECTION} from './builds.mjs';

// V9: second, synthetic lesson (1 input, 2 outputs in 2 units, no nullable output, no manufacturing words).
// build-lesson writes dist/, so this spec builds the synthetic lesson, serves it on its own port and restores the inspection build afterwards.
const PORT = 4324;
let server;
test.use({baseURL: `http://127.0.0.1:${PORT}/`});
test.describe.configure({mode: 'serial'});
test.beforeAll(async () => {
  buildLesson(SYNTHETIC);
  server = startServe(['--port', String(PORT)]);
  await server.ready;
});
test.afterAll(() => { server?.stop(); buildLesson(INSPECTION); });

// closed form: after 10 minutes the tank holds rate * 10 liters; capacity 2000 liters
const wantFor = rate => {
  const volume = rate * 10, ratio = volume / 2000;
  return {raw: {'filled-volume': volume, 'fill-ratio': ratio}, display: {'filled-volume': volume, 'fill-ratio': ratio * 100}};
};
const BASELINE = {'filled-volume': 200, 'fill-ratio': 10};
const TRANSFER = {'filled-volume': 500, 'fill-ratio': 25};
const text = id => L.content.find(c => c.contentId === id).text;
const OUTPUT_TESTIDS = L.outputs.map(o => o.outputId);

async function toSimulation(page) {
  await page.goto('/');
  await expect(tid(page, 'stage-context')).toBeVisible();
  await tid(page, 'stage-next').click();
  await fillPrediction(page, 'prediction', BASELINE, [], L);
  await tid(page, 'prediction-record').click();
  await tid(page, 'stage-next').click();
  await expect(tid(page, 'output-table')).toBeVisible();
}
const screenStrings = page => page.evaluate(() => {
  const out = [document.body.innerText];
  for (const e of document.querySelectorAll('*')) for (const a of ['aria-label', 'title', 'placeholder', 'alt', 'aria-description']) { const v = e.getAttribute(a); if (v) out.push(v); }
  return out.join('\n');
});
async function expectNoManufacturingText(page, where) {
  const s = await screenStrings(page);
  expect(s, `${where}: 결함`).not.toContain('결함');
  expect(s, `${where}: 검사`).not.toContain('검사');
}

test('[T53-V9.flow] prediction, reveal, new case and export on the synthetic lesson give a contract-valid result of that lesson (C7, Q3)', async ({page}) => {
  await toSimulation(page);
  await expectOutputs(page, wantFor(20), L);
  await (await show(page, 'prediction-reveal')).click();
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  await (await show(page, 'scenario-fast-fill')).click();
  await expectOutputs(page, wantFor(80), L);
  await expect(tid(page, 'input-flow-rate')).toHaveValue('80');
  await tid(page, 'reset-inputs').click();
  await expectOutputs(page, wantFor(20), L);
  await fillPrediction(page, 'transfer', TRANSFER, [], L);
  for (const o of L.outputs) await expect(tid(page, `transfer-${o.outputId}-undefined`), o.outputId).toHaveCount(0);
  await tid(page, 'transfer-record').click();
  await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', 'supported');
  await (await show(page, 'response-question')).fill('용량이 바뀌면 어떻게 되는가');
  await (await show(page, 'complete-lesson')).click();
  await (await show(page, 'export-result')).scrollIntoViewIfNeeded();
  const [download] = await Promise.all([page.waitForEvent('download'), tid(page, 'export-result').click()]);
  const result = await readDownload(download);
  assertResultDocument(result, 'completed', session, L);
  expect(result.lessonId).toBe('water-tank-lesson');
  const transfer = result.assessments.find(a => a.criterionId === 'calculate-transfer');
  expect(transfer.status).toBe('supported');
  const response = result.responses.find(r => r.responseId === transfer.responseId);
  expect(response).toMatchObject({conceptId: 'tank-capacity', conceptRevision: 3, activityId: 'tank-assess'});
  expect(JSON.parse(response.answer)).toEqual(TRANSFER);
  expect(Object.keys(JSON.parse(response.answer))).toEqual(OUTPUT_TESTIDS);
});

test('[T53-V9.range] flow-rate accepts its min and max and rejects values just outside without recalculation (R3, C5)', async ({page}) => {
  await toSimulation(page);
  let lastValid = 20;
  for (const [value, ok] of [[-0.01, false], [0, true], [100, true], [100.01, false]]) {
    await tid(page, 'input-flow-rate').fill(String(value));
    if (ok) {
      lastValid = value;
      await expect(tid(page, 'input-error-flow-rate')).toBeHidden();
      await expect(tid(page, 'stale-output-notice')).toBeHidden();
      await expectOutputs(page, wantFor(value), L);
    } else {
      await expect(tid(page, 'input-error-flow-rate')).toBeVisible();
      await expect(tid(page, 'stale-output-notice')).toBeVisible();
      await expectOutputs(page, wantFor(lastValid), L);
    }
  }
});

test('[T53-V9.tables-bars] two table rows and two bars; each bar is the largest of its own unit, so it fills the track; zero gives zero width (R6)', async ({page}) => {
  await toSimulation(page);
  await expect(tid(page, 'output-table').locator('[data-output]')).toHaveCount(2);
  await expect(page.locator('[data-testid^="bar-"]')).toHaveCount(2);
  const table = norm(await tid(page, 'output-table').innerText());
  for (const o of L.outputs) { expect(table).toContain(o.label); expect(table).toContain(o.unit); }
  const ratio = id => page.evaluate(i => { const b = document.querySelector(`[data-testid="bar-${i}"]`); return b.getBoundingClientRect().width / b.parentElement.getBoundingClientRect().width; }, id);
  await tid(page, 'input-flow-rate').fill('50');
  await expectOutputs(page, wantFor(50), L);
  for (const id of OUTPUT_TESTIDS) await expect.poll(() => ratio(id), {message: `${id} fills its track`}).toBeCloseTo(1, 1);
  await tid(page, 'input-flow-rate').fill('0');
  await expectOutputs(page, wantFor(0), L);
  for (const id of OUTPUT_TESTIDS) await expect.poll(() => ratio(id), {message: `${id} has no width at 0`}).toBeLessThan(0.01);
  await expect(tid(page, 'bar-filled-volume')).toHaveAttribute('data-value', '0');
});

test('[T53-V9.content-cards] stage bodies, one decision card, three concept cards and the two hint levels come from the synthetic lesson (R7, R8, R9, R10)', async ({page}) => {
  await page.goto('/');
  expect(norm(await tid(page, 'stage-context').innerText())).toContain(norm(text('tank-orientation')));
  await tid(page, 'stage-next').click();
  await tid(page, 'prediction-skip').click();
  await tid(page, 'stage-next').click();
  const simulation = norm(await tid(page, 'stage-simulation').innerText());
  for (const id of L.activities.find(a => a.stage === 'exploration').contentIds) expect(simulation, id).toContain(norm(text(id)));
  await expect(page.locator('[data-testid^="decision-"]')).toHaveCount(1);
  const d = L.decisions[0];
  const card = norm(await tid(page, `decision-${d.decisionId}`).innerText());
  for (const x of [d.question, ...d.choices, ...d.requiredInformation]) expect(card).toContain(norm(x));
  for (const c of L.concepts) {
    await (await show(page, `concept-${c.conceptId}`)).click();
    const t = norm(await tid(page, `concept-card-${c.conceptId}`).innerText());
    for (const f of ['label', 'meaning', 'example', 'confusion', 'plain']) expect(t, `${c.conceptId}.${f}`).toContain(norm(c[f]));
    await page.keyboard.press('Escape');
  }
  await (await show(page, 'hint-level-2')).click();
  const one = norm(await tid(page, 'hint-text-1').innerText()), two = norm(await tid(page, 'hint-text-2').innerText());
  for (const c of L.concepts) { expect(one).toContain(norm(c.confusion)); expect(two).toContain(norm(c.plain)); expect(two).not.toContain(norm(c.confusion)); }
  const assessment = norm(await (await gotoStage(page, 'assessment')).innerText());
  for (const id of L.activities.find(a => a.stage === 'assessment').contentIds) expect(assessment, id).toContain(norm(text(id)));
  expect(norm(await (await gotoStage(page, 'return')).innerText())).toContain(norm(text('tank-return')));
  expect(norm(await (await gotoStage(page, 'map')).innerText())).toContain(norm(text('tank-map')));
});

test('[T53-V9.no-manufacturing-text] no screen text or attribute contains 결함 or 검사 in any stage, with a concept card and hints open (C7, Q8)', async ({page}) => {
  await page.goto('/');
  await expectNoManufacturingText(page, 'context');
  await tid(page, 'stage-next').click();
  await expectNoManufacturingText(page, 'prediction');
  await tid(page, 'prediction-skip').click();
  await expectNoManufacturingText(page, 'prediction skipped');
  await tid(page, 'stage-next').click();
  await (await show(page, `concept-${L.concepts[0].conceptId}`)).click();
  await (await show(page, 'hint-level-2')).click();
  await expectNoManufacturingText(page, 'simulation (concept card and hints open)');
  await gotoStage(page, 'assessment');
  await fillPrediction(page, 'transfer', TRANSFER, [], L);
  await tid(page, 'transfer-record').click();
  await expectNoManufacturingText(page, 'assessment');
  await gotoStage(page, 'return');
  await expectNoManufacturingText(page, 'return');
  await gotoStage(page, 'map');
  await expectNoManufacturingText(page, 'map');
  await (await show(page, 'complete-lesson')).click();
  await expectNoManufacturingText(page, 'completed');
  const title = await page.title();
  expect(title, 'document title is also visible to the learner').not.toContain('검사');
});

test('[T53-V9.display-strings] synthetic table cells use exact formatted strings (R6, formatCount)', async ({page}) => {
  await toSimulation(page);
  await expectCellStrings(page, {'filled-volume': '200', 'fill-ratio': '10'});
  await tid(page, 'input-flow-rate').fill('37');
  await expectCellStrings(page, {'filled-volume': '370', 'fill-ratio': '18.5'});
  await tid(page, 'input-flow-rate').fill('100');
  await expectCellStrings(page, {'filled-volume': '1,000', 'fill-ratio': '50'});
});
