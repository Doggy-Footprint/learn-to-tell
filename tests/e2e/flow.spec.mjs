import {test, expect} from '@playwright/test';
import {writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {tid, norm, gotoContext, toPrediction, toSimulation, show, expectOutput, fillPrediction, submitResult, assertResultDocument, focusByTab, kbPress, kbType, kbSelect, BASELINE_PRED, TRANSFER_PRED, OUTPUT_IDS, INPUT_IDS, UNDEFINED_ID} from './helpers.mjs';
import {lesson} from '../fixtures/learning/data.mjs';
import {startReceiver} from './builds.mjs';

// Same dist as the shared 4321 server, but with --out so the submitted result can be read as a file.
const PORT = 4341;
let receiver;
test.use({baseURL: `http://127.0.0.1:${PORT}/`});
test.beforeAll(async () => { receiver = await startReceiver(PORT); });
test.afterAll(() => { receiver?.stop(); });
const exportResult = (page, how = 'click') => submitResult(page, receiver, {how});

const kbp = async (page, id, key) => { await show(page, id, 'keyboard'); await kbPress(page, id, key); };
const kbt = async (page, id, text) => { await show(page, id, 'keyboard'); await kbType(page, id, text); };
const text = id => lesson.content.find(c => c.contentId === id).text;
const concept = id => lesson.concepts.find(c => c.conceptId === id);

test('[V5.S1] keyboard-only full flow across stages (C1) then the submitted file is a valid completed result', async ({page}) => {
  await gotoContext(page);
  await expect(tid(page, 'output-table')).toHaveCount(0);
  await kbPress(page, 'stage-next');
  await expect(tid(page, 'stage-prediction')).toBeVisible();
  for (const id of OUTPUT_IDS) await kbType(page, `prediction-${id}`, BASELINE_PRED[id]);
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
  await kbt(page, 'input-defect-percent', '2');
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
  await expect(tid(page, 'input-defect-percent')).toHaveValue('2');

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
  for (const id of OUTPUT_IDS) await kbt(page, `transfer-${id}`, TRANSFER_PRED[id]);
  await kbPress(page, 'transfer-record');
  await expect(tid(page, 'transfer-result')).toBeVisible();
  await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', 'supported');

  await kbt(page, 'response-question', '결함 비용과 확인 검사 성능은 얼마인가');
  await kbt(page, 'response-choice', '누락 비용이 불확실하므로 보류한다');
  await kbt(page, 'response-apply', '내 라인의 결함 비율부터 확인한다');
  await show(page, `decision-${lesson.decisions[0].decisionId}`, 'keyboard');
  await kbp(page, 'complete-lesson');
  await expect(tid(page, 'export-notice')).toContainText('map');
  const result = await exportResult(page, 'keyboard');
  assertResultDocument(result, 'completed');
  await expect(tid(page, 'export-error')).toBeHidden();
  const transfer = result.assessments.find(a => a.criterionId === 'calculate-transfer');
  expect(transfer).toMatchObject({status: 'supported', reviewer: 'automatic', help: 'hint'});
  const resp = result.responses.find(r => r.responseId === transfer.responseId);
  expect(resp).toMatchObject({purpose: 'prediction', attempt: 1, previousResponseId: null, visibility: 'before-output', help: 'hint', conceptId: 'detection-rate', conceptRevision: 2, activityId: 'assessment-activity'});
  for (const c of ['explain-transfer', 'ask-for-evidence', 'justify-choice', 'distinguish-denominators']) expect(result.assessments.find(a => a.criterionId === c)).toMatchObject({status: 'pending', reviewer: 'unreviewed'});
});

test('[V5.S7][CH-V7.partial][CH-V7.completed] partial and completed submissions are version 2 with a matching contentHash and validate against the T1 result contract (C1)', async ({page}) => {
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
  expect(firstPrediction).toMatchObject({attempt: 1, previousResponseId: null, visibility: 'before-output', activityId: 'exploration-activity'});
  expect(JSON.parse(firstPrediction.answer)).toEqual(BASELINE_PRED);
  expect(Object.keys(JSON.parse(firstPrediction.answer))).toEqual(OUTPUT_IDS);

  await (await show(page, 'complete-lesson')).click();
  assertResultDocument(await exportResult(page), 'completed');
});

test('[V5.S8] every request during a full session goes to 127.0.0.1 only (Q6)', async ({page, context}) => {
  const seen = [];
  context.on('request', req => { const u = new URL(req.url()); if (/^(https?|wss?):$/.test(u.protocol)) seen.push(u.hostname); });
  await context.route(url => /^https?:$/.test(url.protocol) && url.hostname !== '127.0.0.1', route => route.abort());
  await toSimulation(page, {predict: 'record'});
  await (await show(page, 'prediction-reveal')).click();
  await tid(page, 'scenario-population-contrast').click();
  await tid(page, 'scenario-candidate-b').click();
  await tid(page, 'reset-inputs').click();
  await (await show(page, 'concept-defect-rate')).click();
  await (await show(page, 'hint-level-2')).click();
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
for (const level of ['none', 'agent']) test(`${HELP_TAG[level]} help level ${level} chosen in the browser is recorded in the submitted result`, async ({page}) => {
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

test('[CH-V11] crypto.subtle.digest failure shows export-error and sends no submit request, no download, writes no file', async ({page}) => {
  await page.addInitScript(() => { crypto.subtle.digest = () => Promise.reject(new Error('digest unavailable')); });
  await toPrediction(page);
  await fillPrediction(page, 'prediction', BASELINE_PRED);
  await tid(page, 'prediction-record').click();
  await (await show(page, 'complete-lesson')).click();
  const filesBefore = receiver.files();
  let downloads = 0, submits = 0;
  page.on('download', () => { downloads++; });
  page.on('request', r => { if (new URL(r.url()).pathname === '/__ltt/result') submits++; });
  await show(page, 'export-result');
  await tid(page, 'export-result').click();
  await expect(tid(page, 'export-error')).toBeVisible();
  expect(((await tid(page, 'export-error').textContent()) ?? '').trim().length).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  expect(downloads).toBe(0);
  expect(submits).toBe(0);
  expect(receiver.files()).toEqual(filesBefore);
});

test('[T53-V8.stage-content] each stage body is its activity content, shown verbatim; the diagnosis content is never shown (R9, A1)', async ({page}) => {
  await gotoContext(page);
  const body = async () => norm(await page.locator('body').innerText());
  const stageText = async id => norm(await tid(page, id).innerText());
  expect(await stageText('stage-context')).toContain(norm(text('lesson-orientation')));
  expect(await body()).not.toContain(norm(text('diagnostic-cards')));
  await tid(page, 'stage-next').click();
  await tid(page, 'prediction-skip').click();
  await tid(page, 'stage-next').click();
  const simulation = await stageText('stage-simulation');
  for (const id of lesson.activities.find(a => a.stage === 'exploration').contentIds) expect(simulation, id).toContain(norm(text(id)));
  const explanation = norm(await tid(page, 'explanation-content').first().innerText());
  expect(explanation).toContain(norm(text('inspection-explanation')));
  expect(explanation).not.toContain(norm(text('action-explanation')));
  expect(await body()).not.toContain(norm(text('diagnostic-cards')));
  await tid(page, 'stage-next').click();
  const assessment = await stageText('stage-assessment');
  for (const id of lesson.activities.find(a => a.stage === 'assessment').contentIds) expect(assessment, id).toContain(norm(text(id)));
  await tid(page, 'stage-next').click();
  expect(await stageText('stage-return')).toContain(norm(text('return-to-work')));
  await tid(page, 'stage-next').click();
  expect(await stageText('stage-map')).toContain(norm(text('next-learning-map')));
  expect(await body()).not.toContain(norm(text('diagnostic-cards')));
});

test('[T53-V8.cards] two decision cards without a marked answer; five concept cards with all five fields (R7, R10, A2)', async ({page}) => {
  await toSimulation(page, {predict: 'skip'});
  const cards = page.locator('[data-testid^="decision-"]');
  await expect(cards).toHaveCount(lesson.decisions.length);
  expect(lesson.decisions).toHaveLength(2);
  for (const d of lesson.decisions) {
    const card = tid(page, `decision-${d.decisionId}`);
    await expect(card).toBeVisible();
    const t = norm(await card.innerText());
    for (const x of [d.question, ...d.choices, ...d.requiredInformation]) expect(t, `${d.decisionId}: ${x}`).toContain(norm(x));
    expect(t).not.toContain('정답');
  }
  for (const gone of ['choice-pro', 'choice-con']) await expect(tid(page, gone)).toHaveCount(0);
  expect(lesson.concepts).toHaveLength(5);
  for (const c of lesson.concepts) {
    const button = await show(page, `concept-${c.conceptId}`);
    await expect(button).toContainText(c.label);
    await button.click();
    const card = tid(page, `concept-card-${c.conceptId}`);
    await expect(card).toBeVisible();
    const t = norm(await card.innerText());
    for (const field of ['label', 'meaning', 'example', 'confusion', 'plain']) expect(t, `${c.conceptId}.${field}`).toContain(norm(c[field]));
    await page.keyboard.press('Escape');
    await expect(card).toBeHidden();
  }
});

test('[T53-V8.hints] hint level 1 shows every concept confusion, level 2 adds every plain explanation and sets help to hint; level 3 does not exist (R8, C13)', async ({page}) => {
  await toSimulation(page, {predict: 'skip'});
  await expect(await show(page, 'help-level')).toHaveValue('unknown');
  await expect(tid(page, 'hint-text-1')).toBeHidden();
  await (await show(page, 'hint-level-1')).click();
  const one = norm(await tid(page, 'hint-text-1').innerText());
  for (const c of lesson.concepts) { expect(one, c.conceptId).toContain(norm(c.confusion)); expect(one).not.toContain(norm(c.plain)); }
  await expect(tid(page, 'hint-text-2')).toBeHidden();
  await expect(tid(page, 'help-level')).toHaveValue('hint');
  await (await show(page, 'hint-level-2')).click();
  const two = norm(await tid(page, 'hint-text-2').innerText());
  for (const c of lesson.concepts) expect(two, c.conceptId).toContain(norm(c.plain));
  for (const c of lesson.concepts) expect(two, c.conceptId).not.toContain(norm(c.confusion));
  expect(norm(await tid(page, 'hint-text-1').innerText())).toBe(one);
  await expect(tid(page, 'hint-level-3')).toHaveCount(0);
  await expect(tid(page, 'hint-text-3')).toHaveCount(0);
  await expect(tid(page, 'help-level')).toHaveValue('hint');
});

test('[T53-V8.fields] input labels name inputId and unit; prediction fields follow lesson.outputs with unit; only nullable outputs offer undefined; transfer scenario has no button (R3, R4)', async ({page}) => {
  await toPrediction(page);
  const order = await page.evaluate(ids => [...document.querySelectorAll('[data-testid]')].map(e => e.getAttribute('data-testid')).filter(t => ids.includes(t)), OUTPUT_IDS.map(id => `prediction-${id}`));
  expect(order).toEqual(OUTPUT_IDS.map(id => `prediction-${id}`));
  const stage = norm(await tid(page, 'stage-prediction').innerText());
  for (const o of lesson.outputs) { expect(stage, o.outputId).toContain(o.label); expect(stage, o.outputId).toContain(o.unit); }
  for (const o of lesson.outputs) await expect(tid(page, `prediction-${o.outputId}-undefined`), o.outputId).toHaveCount(o.nullable ? 1 : 0);
  expect(UNDEFINED_ID).toBe('positive-predictive-value');
  await tid(page, 'prediction-skip').click();
  await tid(page, 'stage-next').click();
  const simulation = norm(await tid(page, 'stage-simulation').innerText());
  for (const i of lesson.inputs) { expect(simulation, i.inputId).toContain(i.inputId); expect(simulation).toContain(i.unit); }
  for (const id of INPUT_IDS) await expect(tid(page, `input-${id}`)).toBeVisible();
  for (const sc of lesson.scenarios.filter(s => s.scenarioId !== lesson.transfer.scenarioId)) await expect(tid(page, `scenario-${sc.scenarioId}`)).toBeVisible();
  await expect(tid(page, `scenario-${lesson.transfer.scenarioId}`)).toHaveCount(0);
});

test('[T53-V13.lesson-screen] review capture: safety-notice and every stage text for the Q8 checklist (numbers are lesson-model examples, not grounds for real action)', async ({page}) => {
  await gotoContext(page);
  const parts = [];
  const grab = async name => parts.push(`## ${name}\n${await page.locator('body').innerText()}`);
  await grab('context');
  await tid(page, 'stage-next').click();
  await tid(page, 'prediction-skip').click();
  await grab('prediction');
  await tid(page, 'stage-next').click();
  await grab('simulation');
  for (const stage of ['assessment', 'return', 'map']) { await tid(page, 'stage-next').click(); await grab(stage); }
  const notice = await show(page, 'safety-notice');
  const noticeText = norm(await notice.innerText());
  expect(noticeText.length).toBeGreaterThan(0);
  const text = `# V13 lesson screen text\n## safety-notice\n${noticeText}\n\n${parts.join('\n\n')}\n`;
  const dir = fileURLToPath(new URL('../../test-results/review/', import.meta.url));
  mkdirSync(dir, {recursive: true});
  writeFileSync(`${dir}V13-lesson.txt`, text);
  await test.info().attach('V13-lesson-screen', {body: text, contentType: 'text/plain'});
});
