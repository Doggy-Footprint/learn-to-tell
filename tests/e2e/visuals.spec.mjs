import {test, expect} from '@playwright/test';
import {tid, norm, show, gotoContext, focusByTab, kbPress, kbType, fillPrediction, expectOutputs, submitResult, assertResultDocument} from './helpers.mjs';
import {session} from '../fixtures/learning/data.mjs';
import {buildLesson, startReceiver, SYNTHETIC_V3, SYNTHETIC_V3_UNITS, INSPECTION} from './builds.mjs';
import {lessonF1 as L, lessonF3, F1_GROUPS, F3_GROUPS, captionFor, ariaFor, A, B, OUT_IDS, OUT_LABEL, OUT_UNIT, raw, display, sweepExpect, ko} from '../fixtures/learning/v3.mjs';

// Spec 0dcd8454f6e5111d v1, V6 (input row state transitions), V7 (outputs), V8 (stepper), C1 (keyboard-only run), Q2 (slider latency), Q6 (loopback only).
// Builds the domain-neutral synthetic v3 lesson F1 on its own port (A8); the shared 4321 server keeps the v2 manufacturing build.
// Expected numbers are computed from the F1 closed forms (fixtures/learning/v3.mjs), never read from the page.
const PORT = 4351;
let receiver;
test.use({baseURL: `http://127.0.0.1:${PORT}/`});
test.describe.configure({mode: 'serial'});
test.beforeAll(async () => {
  buildLesson(SYNTHETIC_V3);
  receiver = await startReceiver(PORT);
});
test.afterAll(async () => { await receiver?.stop(); buildLesson(INSPECTION); });

const KEY = `learn-to-tell:${L.lessonId}:${L.lessonRevision}:${session.resultId}`;
const MINUS = '−', DASH = '–';
const BASE = display(20, 10);
const wantFor = (a, b) => ({raw: raw(a, b), display: display(a, b)});
const sweepVisuals = [['sweep-a', 'a', ['part-a', 'total']], ['sweep-b', 'b', ['fill-b', 'margin']]];

const storedInputs = page => page.evaluate(k => JSON.parse(localStorage.getItem(k))?.progress?.inputs ?? null, KEY);
const cell = (page, column, id) => tid(page, 'output-table').locator(`[data-${column}="${id}"]`);
const expectAttr = (loc, name, value, message) => expect.poll(async () => Number(await loc.getAttribute(name)), {message: message ?? `${name} of the element`}).toBeCloseTo(value, 6);
const cellText = async (page, column, id) => norm(await cell(page, column, id).textContent());
const expectCell = (page, column, id, expected) => expect.poll(() => cellText(page, column, id), {message: `${column} cell of ${id}`}).toBe(expected);
const slide = (page, id, value, {commit = false} = {}) => tid(page, `slider-${id}`).evaluate((el, [v, c]) => {
  el.value = String(v);
  el.dispatchEvent(new Event('input', {bubbles: true}));
  if (c) el.dispatchEvent(new Event('change', {bubbles: true}));
}, [value, commit]);

async function toSimulation(page, {record = false} = {}) {
  await gotoContext(page);
  await tid(page, 'stage-next').click();
  if (record) {
    await fillPrediction(page, 'prediction', BASE, [], L);
    await tid(page, 'prediction-record').click();
  } else await tid(page, 'prediction-skip').click();
  await tid(page, 'stage-next').click();
  await expect(tid(page, 'output-table')).toBeVisible();
  await expect(tid(page, 'slider-load-a')).toBeVisible();
}
async function expectInputsStored(page, a, b) {
  await expect.poll(() => storedInputs(page), {message: `stored inputs ${a}, ${b}`}).toEqual({'load-a': a, 'load-b': b});
}
async function expectControls(page, a, b) {
  await expect(tid(page, 'slider-load-a')).toHaveValue(String(Math.min(Math.max(a, A.pmin), A.pmax)));
  await expect(tid(page, 'slider-load-b')).toHaveValue(String(Math.min(Math.max(b, B.pmin), B.pmax)));
  await expect(tid(page, 'input-load-a')).toHaveValue(String(a));
  await expect(tid(page, 'input-load-b')).toHaveValue(String(b));
}
// sweep points: data-x is the current input of the visual, data-y the current display value (a null value has no y to compare)
async function expectSweepPoints(page, a, b) {
  const now = display(a, b);
  for (const [vid, which, outs] of sweepVisuals) for (const o of outs) {
    await expect(tid(page, `sweep-line-${vid}-${o}`), `line ${vid} ${o}`).toHaveCount(1);
    if (now[o] === null) continue;
    const point = tid(page, `sweep-point-${vid}-${o}`);
    await expectAttr(point, 'data-x', which === 'a' ? a : b, `${vid} ${o} data-x`);
    await expectAttr(point, 'data-y', now[o], `${vid} ${o} data-y`);
  }
}
// Shape of a sweep line: number of drawn segments and of points, read from whatever path/polyline elements the line is made of.
const lineShape = (page, vid, o) => page.evaluate(([v, out]) => {
  const root = document.querySelector(`[data-testid="sweep-line-${v}-${out}"]`);
  const nodes = [root, ...root.querySelectorAll('path, polyline')].filter(n => ['path', 'polyline'].includes(n.tagName.toLowerCase()));
  let segments = 0, points = 0;
  for (const n of nodes) {
    if (n.tagName.toLowerCase() === 'path') {
      const d = n.getAttribute('d') ?? '';
      segments += (d.match(/[Mm]/g) ?? []).length;
      points += (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).length / 2;
    } else {
      segments += 1;
      points += (n.getAttribute('points') ?? '').trim().split(/[\s,]+/).filter(Boolean).length / 2;
    }
  }
  return {segments, points};
}, [vid, o]);
function expectedShape(which, current, outputId) {
  const values = sweepExpect(which, current).map(p => p.values[outputId]);
  const defined = values.filter(v => v !== null).length;
  const runs = values.reduce((n, v, i) => n + (v !== null && (i === 0 || values[i - 1] === null) ? 1 : 0), 0);
  return {segments: runs, points: defined};
}
async function expectLineShapes(page, a, b) {
  for (const [vid, which, outs] of sweepVisuals) for (const o of outs) {
    const want = expectedShape(which, {a, b}, o);
    await expect.poll(() => lineShape(page, vid, o), {message: `line shape ${vid} ${o}`}).toEqual(want);
  }
}
const ghosts = page => page.locator('[data-testid^="sweep-previous-"]');
const markerFraction = (page, id) => page.evaluate(i => {
  const bar = document.querySelector(`[data-testid="bar-${i}"]`), marker = document.querySelector(`[data-testid="bar-previous-${i}"]`);
  const track = bar.parentElement.getBoundingClientRect(), m = marker.getBoundingClientRect();
  return {left: (m.left - track.left) / track.width, center: (m.left + m.width / 2 - track.left) / track.width, right: (m.right - track.left) / track.width};
}, id);
const segmentShares = (page, vid, ids, prefix) => page.evaluate(([v, list, pre]) => {
  const w = list.map(i => document.querySelector(`[data-testid="${pre}-${v}-${i}"]`).getBoundingClientRect().width);
  const sum = w.reduce((x, y) => x + y, 0);
  return w.map(x => x / sum);
}, [vid, ids, prefix]);
// width % = share * 100 of a composition bar: each segment's share of the bar's drawn width, tight tolerance
async function expectBar(page, prefix, ids, shares) {
  for (const [k, id] of ids.entries()) await expectAttr(tid(page, `${prefix}-share-${id}`), 'data-share', shares[k], `${prefix} ${id} data-share`);
  await expect.poll(async () => (await segmentShares(page, 'share', ids, prefix)).map((x, k) => Math.abs(x - shares[k]) <= 0.005), {message: `${prefix} widths`}).toEqual(ids.map(() => true));
}
const domOrder = (page, testids) => page.evaluate(list => {
  const els = list.map(id => document.querySelector(`[data-testid="${id}"]`));
  return els.every(Boolean) && els.every((el, i) => i === 0 || (els[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
}, testids);
const ariaOf = (page, vid) => tid(page, `visual-${vid}`).locator('svg[role="img"]').getAttribute('aria-label');
const caption = page => tid(page, 'output-table').locator('caption');
const groupsOf = page => page.evaluate(() => [...document.querySelectorAll('[data-testid^="output-group-"]')].map(g => ({id: g.getAttribute('data-testid'), unit: g.getAttribute('data-unit'), cards: [...g.querySelectorAll('[data-testid^="output-card-"]')].map(c => c.getAttribute('data-testid').slice('output-card-'.length))})));
const deltaOf = (page, id) => tid(page, `output-delta-${id}`);
async function expectDelta(page, id, kind, amount) {
  const el = deltaOf(page, id);
  if (kind === 'none') await expect(el, id).toHaveText('직전 값 없음');
  else if (kind === 'up') { await expect(el, id).toContainText(new RegExp(`직전 대비\\s*▲\\s*\\+${amount}(?![\\d,.])`)); await expect(el).not.toContainText('▼'); }
  else if (kind === 'down') { await expect(el, id).toContainText(new RegExp(`직전 대비\\s*▼\\s*${MINUS}${amount}(?![\\d,.])`)); await expect(el).not.toContainText('▲'); }
  else if (kind === 'same') { await expect(el, id).toContainText('변화 없음'); await expect(el).not.toContainText(/[▲▼]/); }
  else if (kind === 'defined') { await expect(el, id).toContainText('정의 여부가 달라짐'); await expect(el).not.toContainText(/[▲▼]/); }
}
const composition = (page, id) => tid(page, `composition-share-${id}`);

// ================================================================ V6
test('[F4-V6.committed] initial state: stored inputs, previous cell, slider and number agree; slider range = practical range, step = step (R10)', async ({page}) => {
  await toSimulation(page);
  await expectInputsStored(page, A.def, B.def);
  await expectCell(page, 'previous', 'part-a', '—');
  await expectControls(page, A.def, B.def);
  for (const i of [A, B]) {
    const slider = tid(page, `slider-${i.id}`);
    await expect(slider).toHaveAttribute('type', 'range');
    await expect(slider).toHaveAttribute('min', String(i.pmin));
    await expect(slider).toHaveAttribute('max', String(i.pmax));
    await expect(slider).toHaveAttribute('step', String(i.step));
    await expect(tid(page, `input-${i.id}`)).toHaveAttribute('type', 'number');
  }
});
test('[F4-V6.labels and practical range] row label is "<label> (<unit>)", range text and basis details come from the lesson (R10)', async ({page}) => {
  await toSimulation(page);
  const sim = tid(page, 'stage-simulation');
  for (const i of L.inputs) {
    await expect(sim).toContainText(`${i.label} (${i.unit})`);
    await expect(tid(page, `practical-range-${i.inputId}`)).toContainText(`실사용 범위 ${i.practical.min}${DASH}${i.practical.max}${i.unit}`);
    const basis = tid(page, `practical-basis-${i.inputId}`);
    await expect(basis).toContainText('이 범위의 근거');
    await expect(basis).toContainText(i.practical.basis);
    expect(await basis.evaluate(el => el.tagName.toLowerCase())).toBe('details');
    await expect(tid(page, `practical-out-${i.inputId}`)).toHaveCount(0);
  }
});
test('[F4-V6.previewing] input events only: cards and chart follow the preview, stored inputs and the previous cell do not change (C4)', async ({page}) => {
  await toSimulation(page);
  for (const v of [30, 35]) {
    await slide(page, 'load-a', v);
    await expect(tid(page, 'output-card-part-a')).toContainText(ko(3 * v));
    await expect(cell(page, 'output', 'part-a')).toContainText(ko(3 * v));
    await expectAttr(tid(page, 'sweep-point-sweep-a-part-a'), 'data-x', v);
    await expect(tid(page, 'slider-load-a')).toHaveValue(String(v));
    await expect(tid(page, 'input-load-a')).toHaveValue(String(v));
  }
  await expectAttr(tid(page, 'sweep-point-sweep-a-total'), 'data-y', 3 * 35 + 2 * 10);
  await page.waitForTimeout(400);
  expect(await storedInputs(page)).toEqual({'load-a': 20, 'load-b': 10});
  await expectCell(page, 'previous', 'part-a', '—');
  await expect(tid(page, 'output-delta-part-a')).toHaveText('직전 값 없음');
});
test('[F4-V6.preview then change] the change event commits: stored inputs follow, the previous cell is the value before the drag, slider and number agree', async ({page}) => {
  await toSimulation(page);
  await slide(page, 'load-a', 35);
  await slide(page, 'load-a', 35, {commit: true});
  await expectInputsStored(page, 35, 10);
  await expectCell(page, 'previous', 'part-a', '60');
  await expectCell(page, 'output', 'part-a', '105');
  await expectControls(page, 35, 10);
  await expectDelta(page, 'part-a', 'up', '45');
});
test('[F4-V6.preview then number input] typing in the number field discards the preview and commits the typed value', async ({page}) => {
  await toSimulation(page);
  await slide(page, 'load-a', 35);
  await tid(page, 'input-load-a').fill('25');
  await expectInputsStored(page, 25, 10);
  await expectCell(page, 'previous', 'part-a', '60');
  await expectCell(page, 'output', 'part-a', '75');
  await expectControls(page, 25, 10);
  await expectAttr(tid(page, 'sweep-point-sweep-a-part-a'), 'data-x', 25);
});
test('[F4-V6.preview then scenario] a scenario discards the preview; the previous values are those of the last committed inputs, not of the preview', async ({page}) => {
  await toSimulation(page);
  await slide(page, 'load-a', 35);
  await tid(page, 'scenario-heavy').click();
  await expectInputsStored(page, 50, 18);
  await expectCell(page, 'previous', 'part-a', '60');
  await expectCell(page, 'previous', 'part-b', '20');
  await expectCell(page, 'output', 'part-a', '150');
  await expectControls(page, 50, 18);
});
test('[F4-V6.preview then out-of-domain number] an out-of-domain number during a preview shows the error and discards the preview; stored inputs stay', async ({page}) => {
  await toSimulation(page);
  await slide(page, 'load-a', 35);
  await tid(page, 'input-load-a').fill('100.01');
  await expect(tid(page, 'input-error-load-a')).toBeVisible();
  await expect(tid(page, 'input-load-a')).toHaveAttribute('aria-invalid', 'true');
  await expect(tid(page, 'slider-load-a')).toHaveValue('20');
  await expect(tid(page, 'output-card-part-a')).toContainText('60');
  await expect(tid(page, 'output-card-part-a')).not.toContainText('105');
  await expectCell(page, 'output', 'part-a', '60');
  await expectAttr(tid(page, 'sweep-point-sweep-a-part-a'), 'data-x', 20);
  await page.waitForTimeout(300);
  expect(await storedInputs(page)).toEqual({'load-a': 20, 'load-b': 10});
  await expectCell(page, 'previous', 'part-a', '\u2014');
});
test('[F4-V6.preview then reset] reset discards the preview and restores the default inputs; the previous values are those of the last committed inputs', async ({page}) => {
  await toSimulation(page);
  await slide(page, 'load-a', 45, {commit: true});
  await expectInputsStored(page, 45, 10);
  await slide(page, 'load-a', 30);
  await expect(tid(page, 'output-card-part-a')).toContainText('90');
  await tid(page, 'reset-inputs').click();
  await expectInputsStored(page, 20, 10);
  await expectControls(page, 20, 10);
  await expectCell(page, 'output', 'part-a', '60');
  await expectCell(page, 'previous', 'part-a', '135');
  await expectAttr(tid(page, 'sweep-point-sweep-a-part-a'), 'data-x', 20);
});
test('[F4-C3.keyboard step] ArrowRight on the focused slider adds one step: committed, previous = default, delta direction matches (C3)', async ({page}) => {
  await toSimulation(page);
  await focusByTab(page, 'slider-load-a');
  await page.keyboard.press('ArrowRight');
  await expectInputsStored(page, A.def + A.step, B.def);
  await expectCell(page, 'previous', 'part-a', '60');
  await expectCell(page, 'output', 'part-a', '75');
  await expectDelta(page, 'part-a', 'up', '15');
  await expectDelta(page, 'part-b', 'same');
  await expectControls(page, 25, 10);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expectInputsStored(page, 15, 10);
  await expectDelta(page, 'part-a', 'down', '15');
});

// C5: number field values around the practical range and the domain, for both inputs (practical narrower than the domain on both).
for (const i of [A, B]) {
  test(`[F4-C5.number field ${i.id}] practical bounds show no badge, just outside show the badge, domain bounds show it, outside the domain is the range error`, async ({page}) => {
    await toSimulation(page);
    const input = tid(page, `input-${i.id}`), badge = tid(page, `practical-out-${i.id}`), error = tid(page, `input-error-${i.id}`);
    const fillValid = async (value, badgeVisible, label) => {
      await input.fill(String(value));
      await expect(error, `${label}: no error`).toBeHidden();
      if (badgeVisible) {
        await expect(badge, `${label}: badge`).toBeVisible();
        await expect(badge).toContainText('현실 범위 밖(모델로는 계산 가능)');
      } else await expect(badge, `${label}: no badge`).toHaveCount(0);
    };
    await fillValid(i.pmin, false, 'practical.min');
    await fillValid(i.pmax, false, 'practical.max');
    await fillValid(Number((i.pmin - i.step / 10).toFixed(6)), true, 'practical.min - step/10');
    await fillValid(Number((i.pmax + i.step / 10).toFixed(6)), true, 'practical.max + step/10');
    await fillValid(i.min, true, 'domain min');
    await fillValid(i.max, true, 'domain max');
    await fillValid(i.def, false, 'default');
    for (const value of [i.min - 0.01, i.max + 0.01]) {
      await input.fill(String(value));
      await expect(error, `${value}: range error`).toBeVisible();
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    }
  });
}
test('[F4-C13.clamp] a number above practical.max (inside the domain): slider at practical.max, sweep x upper bound and current point at the value', async ({page}) => {
  await toSimulation(page);
  await tid(page, 'input-load-a').fill('80');
  await expectInputsStored(page, 80, 10);
  await expect(tid(page, 'slider-load-a')).toHaveValue(String(A.pmax));
  await expect(tid(page, 'input-load-a')).toHaveValue('80');
  await expect(tid(page, 'practical-out-load-a')).toBeVisible();
  await expectAttr(tid(page, 'sweep-point-sweep-a-part-a'), 'data-x', 80);
  const label = await tid(page, 'visual-sweep-a').locator('svg[role="img"]').getAttribute('aria-label');
  expect(label).toContain(`${L.inputs[0].label}이 ${A.pmin}에서 80${A.unit}로 바뀔 때`);
  await expectSweepPoints(page, 80, 10);
  await expectCell(page, 'output', 'part-a', '240');
});

// Q2: p95 of key press -> sweep current point updated, 20 keyboard steps on the slider, measured in the page (key event to DOM mutation).
test('[F4-Q2.slider latency] 20 keyboard steps: p95 from key press to the updated sweep point <= 100ms', async ({page, browser}) => {
  await toSimulation(page);
  await focusByTab(page, 'slider-load-a');
  await page.evaluate(() => {
    window.__q2 = {key: 0, expect: null, ms: null};
    document.addEventListener('keydown', () => { window.__q2.key = performance.now(); window.__q2.ms = null; }, true);
    const check = () => {
      const el = document.querySelector('[data-testid="sweep-point-sweep-a-part-a"]');
      if (el && window.__q2.expect !== null && window.__q2.ms === null && Number(el.getAttribute('data-x')) === window.__q2.expect) window.__q2.ms = performance.now() - window.__q2.key;
    };
    new MutationObserver(check).observe(document.body, {subtree: true, childList: true, attributes: true, characterData: true});
  });
  const walk = [...Array(8).fill(1), ...Array(10).fill(-1), ...Array(2).fill(1)];
  let x = A.def;
  const samples = [];
  for (const dir of walk) {
    x += dir * A.step;
    await page.evaluate(v => { window.__q2.expect = v; window.__q2.ms = null; }, x);
    await page.keyboard.press(dir > 0 ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForFunction(() => window.__q2.ms !== null, null, {timeout: 3000});
    samples.push(await page.evaluate(() => window.__q2.ms));
    await page.waitForTimeout(30);
  }
  expect(samples).toHaveLength(20);
  const sorted = [...samples].sort((p, q) => p - q);
  const p95 = sorted[Math.ceil(0.95 * sorted.length) - 1];
  const line = `[F4-Q2] chrome=${browser.version()} p95=${p95.toFixed(2)}ms max=${sorted.at(-1).toFixed(2)}ms samples=${samples.map(s => s.toFixed(1)).join(',')}`;
  console.log(line);
  test.info().annotations.push({type: 'perf', description: line});
  expect(p95).toBeLessThanOrEqual(100);
});

// ================================================================ V7
test('[F4-V7.defaults] cards, table strings, sweep points and lines, ghosts absent, composition shares at the defaults (C2, C11)', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await toSimulation(page);
  await expectOutputs(page, wantFor(20, 10), L);
  for (const id of OUT_IDS) {
    const card = tid(page, `output-card-${id}`);
    await expect(card).toContainText(OUT_LABEL[id]);
    await expect(card).toContainText(ko(display(20, 10)[id]));
    await expect(card).toContainText(OUT_UNIT[id]);
    await expectDelta(page, id, 'none');
    await expectCell(page, 'previous', id, '—');
    await expectCell(page, 'change', id, '—');
    await expect(tid(page, `bar-previous-${id}`)).toHaveCount(0);
  }
  await expectSweepPoints(page, 20, 10);
  await expect(page.locator('[data-testid^="sweep-line-"]')).toHaveCount(4);
  await expectLineShapes(page, 20, 10);
  await expect(ghosts(page)).toHaveCount(0);
  // composition [part-a, part-b] = 60 : 20
  const shares = {'part-a': 0.75, 'part-b': 0.25};
  for (const [id, share] of Object.entries(shares)) await expectAttr(composition(page, id), 'data-share', share, id);
  await expectBar(page, 'composition', ['part-a', 'part-b'], [0.75, 0.25]);
  await expect(page.locator('[data-testid^="composition-previous-"]')).toHaveCount(0);
  expect(await domOrder(page, ['composition-share-part-a', 'composition-share-part-b'])).toBe(true);
  await expect(caption(page)).toHaveText(captionFor(20, 10));
  const legend = norm(await tid(page, 'composition-legend-share').textContent());
  expect(legend).toMatch(/A 몫: 60\s*pt \(75%\)/);
  expect(legend).toMatch(/B 몫: 20\s*pt \(25%\)/);
  expect(legend.indexOf('A 몫')).toBeLessThan(legend.indexOf('B 몫'));
  const compLabel = await tid(page, 'visual-share').locator('svg[role="img"]').getAttribute('aria-label');
  expect(compLabel).toContain('A 몫과 B 몫의 구성');
  expect(compLabel).toMatch(/A 몫: 60\s*pt \(75%\)/);
  expect(norm(await tid(page, 'visual-share').innerText())).not.toContain('직전');
  expect(errors).toEqual([]);
});
test('[F4-V7.chart summaries] each visual has an svg role=img with a label built from caption, input range and current point (R14)', async ({page}) => {
  await toSimulation(page);
  for (const v of L.visuals) {
    const svg = tid(page, `visual-${v.visualId}`).locator('svg[role="img"]');
    await expect(svg).toHaveCount(1);
    const label = await svg.getAttribute('aria-label');
    expect(label.startsWith(`${v.caption}.`), `${v.visualId}: ${label}`).toBe(true);
    await expect(tid(page, `visual-${v.visualId}`)).toContainText(v.caption);
  }
  for (const v of L.visuals.filter(x => x.kind === 'sweep')) expect(await ariaOf(page, v.visualId), v.visualId).toBe(ariaFor(v, {a: 20, b: 10}));
});
test('[F4-V7.deltas and table] six delta texts, the merged 4-column table, bars and previous markers, ghosts in both states, composition after a change (R12-R15)', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await toSimulation(page);
  await expect(tid(page, 'output-table').getByRole('columnheader')).toHaveText(['항목', '현재', '직전', '변화']);
  const row = id => tid(page, 'output-table').locator('tr', {has: page.locator(`[data-output="${id}"]`)}).locator('th, td');
  await expect(row('part-a')).toHaveText(['A 몫 (pt)', '60', '—', '—']);

  // step 1: load-a 20 -> 25 (slider commit): up 15 on part-a and total; everything else unchanged
  await slide(page, 'load-a', 25, {commit: true});
  await expectInputsStored(page, 25, 10);
  await expectOutputs(page, wantFor(25, 10), L);
  await expectDelta(page, 'part-a', 'up', '15');
  await expectDelta(page, 'total', 'up', '15');
  for (const id of ['part-b', 'fill-b', 'margin']) await expectDelta(page, id, 'same');
  await expect(row('part-a')).toHaveText(['A 몫 (pt)', '75', '60', '+15']);
  await expect(row('part-b')).toHaveText(['B 몫 (pt)', '20', '20', ko(0)]);
  await expect(row('total')).toHaveText(['합계 (pt)', '95', '80', '+15']);
  await expect(row('fill-b')).toHaveText(['B 채움 (%)', '20', '20', ko(0)]);
  await expect(row('margin')).toHaveText(['여유율 (%)', '80', '80', ko(0)]);
  // previous markers: data-value = previous raw, position = previous / largest current value of the unit (95 for pt)
  for (const [id, prev] of [['part-a', 60], ['part-b', 20], ['total', 80]]) {
    await expectAttr(tid(page, `bar-previous-${id}`), 'data-value', prev);
    const f = await markerFraction(page, id);
    expect(Math.min(Math.abs(f.left - prev / 95), Math.abs(f.center - prev / 95)), `${id} marker ${JSON.stringify(f)}`).toBeLessThanOrEqual(0.02);
  }
  // ghosts: only the visual whose input changed
  await expect(page.locator('[data-testid^="sweep-previous-sweep-a-"]')).toHaveCount(2);
  await expect(page.locator('[data-testid^="sweep-previous-sweep-b-"]')).toHaveCount(0);
  await expectSweepPoints(page, 25, 10);
  // ghosts sit at the previous committed input (20, 10) with the display values computed from it
  const prevNow = display(20, 10);
  for (const o of ['part-a', 'total']) {
    await expectAttr(tid(page, `sweep-previous-sweep-a-${o}`), 'data-x', 20, `ghost x ${o}`);
    await expectAttr(tid(page, `sweep-previous-sweep-a-${o}`), 'data-y', prevNow[o], `ghost y ${o}`);
  }
  await expect(caption(page)).toHaveText(captionFor(25, 10));
  // composition after the change: 75 : 20 of 95; previous bar keeps 60 : 20 of 80
  await expectBar(page, 'composition', ['part-a', 'part-b'], [75 / 95, 20 / 95]);
  await expectBar(page, 'composition-previous', ['part-a', 'part-b'], [0.75, 0.25]);
  expect(await domOrder(page, ['composition-share-part-a', 'composition-share-part-b'])).toBe(true);
  expect(await domOrder(page, ['composition-previous-share-part-a', 'composition-previous-share-part-b'])).toBe(true);
  const legend = norm(await tid(page, 'composition-legend-share').textContent());
  expect(legend).toMatch(/A 몫: 75\s*pt \(78\.947%\)/);
  expect(legend).toMatch(/B 몫: 20\s*pt \(21\.053%\)/);
  expect(norm(await tid(page, 'visual-share').innerText())).toContain('직전');

  // step 2: back to 20: down 15
  await slide(page, 'load-a', 20, {commit: true});
  await expectInputsStored(page, 20, 10);
  await expectDelta(page, 'part-a', 'down', '15');
  await expectDelta(page, 'total', 'down', '15');
  await expectDelta(page, 'part-b', 'same');
  await expectCell(page, 'change', 'part-a', ko(60 - 75));
  await expectCell(page, 'change', 'part-b', ko(0));
  await expect(row('part-a').first()).toContainText('A 몫 (pt)');
  await expectCell(page, 'previous', 'part-a', '75');

  // step 3: load-b 10 -> 18 (margin becomes undefined): part-b, total and fill-b up 16, margin definedness changes
  await tid(page, 'input-load-b').fill('18');
  await expectInputsStored(page, 20, 18);
  await expectOutputs(page, wantFor(20, 18), L);
  await expectDelta(page, 'part-b', 'up', '16');
  await expectDelta(page, 'total', 'up', '16');
  await expectDelta(page, 'fill-b', 'up', '16');
  await expectDelta(page, 'part-a', 'same');
  await expectDelta(page, 'margin', 'defined');
  await expect(row('margin')).toHaveText(['여유율 (%)', '정의되지 않음', '80', '정의 여부가 달라짐']);
  await expect(page.locator('[data-testid^="sweep-previous-sweep-a-"]')).toHaveCount(0);
  for (const o of ['fill-b', 'margin']) {
    await expectAttr(tid(page, `sweep-previous-sweep-b-${o}`), 'data-x', 10, `ghost x ${o}`);
    await expectAttr(tid(page, `sweep-previous-sweep-b-${o}`), 'data-y', display(20, 10)[o], `ghost y ${o}`);
  }
  await expectSweepPoints(page, 20, 18);
  await expectLineShapes(page, 20, 18);

  // step 4: load-b 18 -> 17: margin undefined -> undefined
  await tid(page, 'input-load-b').fill('17');
  await expectInputsStored(page, 20, 17);
  await expectDelta(page, 'margin', 'same');
  await expect(row('margin')).toHaveText(['여유율 (%)', '정의되지 않음', '정의되지 않음', '변화 없음']);
  await expectDelta(page, 'part-b', 'down', '2');
  await expectCell(page, 'change', 'part-b', ko(34 - 36));
  await expect(tid(page, 'bar-previous-margin')).toHaveCount(0);
  await expect(tid(page, 'bar-margin')).toHaveCount(0);
  // previous inputs (20, 18): the fill-b ghost is there, the margin ghost is not (its previous value is undefined)
  await expectAttr(tid(page, 'sweep-previous-sweep-b-fill-b'), 'data-x', 18);
  await expectAttr(tid(page, 'sweep-previous-sweep-b-fill-b'), 'data-y', display(20, 18)['fill-b']);
  await expect(tid(page, 'sweep-previous-sweep-b-margin')).toHaveCount(0);

  // back to defined: undefined -> number
  await tid(page, 'input-load-b').fill('10');
  await expectDelta(page, 'margin', 'defined');
  await expect(row('margin')).toHaveText(['여유율 (%)', '80', '정의되지 않음', '정의 여부가 달라짐']);
  expect(errors).toEqual([]);
});
test('[F4-V7.previous marker states] a previous value beyond the largest current value is drawn at the end of the track; a null current keeps the marker of a non-null previous (R12)', async ({page}) => {
  await toSimulation(page);
  await tid(page, 'scenario-heavy').click();
  await expectInputsStored(page, 50, 18);
  // current margin is undefined, previous margin (80%) is not: no bar, marker still there
  await expect(tid(page, 'bar-margin')).toHaveCount(0);
  await expect(tid(page, 'bar-previous-margin')).toHaveCount(1);
  await expectAttr(tid(page, 'bar-previous-margin'), 'data-value', 0.8);
  await tid(page, 'scenario-base').click();
  await expectInputsStored(page, 20, 10);
  // previous heavy values 150 / 36 / 186 against the largest current pt value 80
  const end = f => Math.min(Math.abs(f.left - 1), Math.abs(f.center - 1), Math.abs(f.right - 1)) <= 0.02;
  for (const id of ['part-a', 'total']) {
    await expectAttr(tid(page, `bar-previous-${id}`), 'data-value', raw(50, 18)[id]);
    const f = await markerFraction(page, id);
    expect(end(f), `${id} marker at the end of the track: ${JSON.stringify(f)}`).toBe(true);
  }
  const f = await markerFraction(page, 'part-b');
  expect(Math.min(Math.abs(f.left - 36 / 80), Math.abs(f.center - 36 / 80)), JSON.stringify(f)).toBeLessThanOrEqual(0.02);
  // the previous margin is undefined: no marker
  await expect(tid(page, 'bar-previous-margin')).toHaveCount(0);
});
test('[F4-V7.aria and caption states] full aria-labels and the table caption at a non-default committed state and at a preview state (R13, R14)', async ({page}) => {
  await toSimulation(page);
  await slide(page, 'load-a', 35, {commit: true});
  await tid(page, 'input-load-b').fill('14');
  await expectInputsStored(page, 35, 14);
  await expect(caption(page)).toHaveText(captionFor(35, 14));
  for (const v of L.visuals.filter(x => x.kind === 'sweep')) await expect.poll(() => ariaOf(page, v.visualId), {message: `committed ${v.visualId}`}).toBe(ariaFor(v, {a: 35, b: 14}));
  // preview: the other input of each sweep is the preview input
  await slide(page, 'load-b', 22);
  await expect(caption(page)).toHaveText(captionFor(35, 22));
  for (const v of L.visuals.filter(x => x.kind === 'sweep')) await expect.poll(() => ariaOf(page, v.visualId), {message: `preview ${v.visualId}`}).toBe(ariaFor(v, {a: 35, b: 22}));
  expect(await storedInputs(page)).toEqual({'load-a': 35, 'load-b': 14});
});
test('[F4-V7.unit groups F1] cards are grouped by unit in first-appearance order, in outputs order inside a group (R12)', async ({page}) => {
  await toSimulation(page);
  const groups = await groupsOf(page);
  expect(groups.map(g => ({unit: g.unit, cards: g.cards}))).toEqual(F1_GROUPS.map(g => ({unit: g.unit, cards: g.outputs})));
  expect(groups.map(g => g.id)).toEqual(F1_GROUPS.map((_, n) => `output-group-${n}`));
});
test('[F4-V7.null break] the margin line breaks where the model has no value and keeps drawing on both sides; no page error (C12)', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await toSimulation(page);
  const margin = expectedShape('b', {a: 20, b: 10}, 'margin');
  expect(margin.segments).toBe(2);
  expect(margin.points).toBeLessThan(41);
  expect(await lineShape(page, 'sweep-b', 'margin')).toEqual(margin);
  expect(await lineShape(page, 'sweep-b', 'fill-b')).toEqual({segments: 1, points: 41});
  expect(await lineShape(page, 'sweep-a', 'part-a')).toEqual({segments: 1, points: 41});
  await tid(page, 'scenario-heavy').click();
  await expectInputsStored(page, 50, 18);
  await expectOutputs(page, wantFor(50, 18), L);
  await expectLineShapes(page, 50, 18);
  await expect(page.locator('[data-testid^="sweep-line-"]')).toHaveCount(4);
  expect(errors).toEqual([]);
});
const orderOf = (page, ids) => page.evaluate(([list, needle]) => {
  const walker = document.createTreeWalker(document.querySelector('[data-testid="stage-simulation"]'), NodeFilter.SHOW_TEXT);
  let content = null;
  for (let n = walker.nextNode(); n && !content; n = walker.nextNode()) if (n.textContent.includes(needle)) content = n.parentElement;
  const wanted = [['content', content], ...list.map(id => [id, document.querySelector(`[data-testid="${id}"]`)])];
  const missing = wanted.filter(([, el]) => !el).map(([n]) => n);
  const misordered = [];
  for (let i = 1; i < wanted.length; i++) if (wanted[i][1] && wanted[i - 1][1] && !(wanted[i - 1][1].compareDocumentPosition(wanted[i][1]) & Node.DOCUMENT_POSITION_FOLLOWING)) misordered.push(`${wanted[i - 1][0]} -> ${wanted[i][0]}`);
  return {missing, misordered};
}, [ids, 'BSIM-1']);
const BEFORE_STALE = ['scenario-base', 'reset-inputs', 'input-load-a', 'input-load-b'];
const AFTER_STALE = ['output-card-part-a', 'output-card-margin', 'visual-sweep-a', 'visual-sweep-b', 'visual-share', 'output-table', 'simulation-guidance', 'link-to-explanation'];
test('[F4-V7.block order] valid inputs: no stale notice; content, scenarios and reset, input rows, cards, visuals in declared order, table, guidance text, explanation link (R16)', async ({page}) => {
  await toSimulation(page);
  await expect(tid(page, 'stale-output-notice')).toBeHidden();
  const r = await orderOf(page, [...BEFORE_STALE, ...AFTER_STALE]);
  expect(r.missing).toEqual([]);
  expect(r.misordered).toEqual([]);
  expect(await domOrder(page, ['visual-sweep-a', 'visual-sweep-b', 'visual-share'])).toBe(true);
  for (const v of L.visuals) await expect(tid(page, `visual-${v.visualId}`)).toContainText(v.caption);
});
test('[F4-V7.block order stale] after an invalid number the stale notice is shown between the input rows and the cards (R16)', async ({page}) => {
  await toSimulation(page);
  await tid(page, 'input-load-a').fill('100.01');
  await expect(tid(page, 'stale-output-notice')).toBeVisible();
  const r = await orderOf(page, [...BEFORE_STALE, 'stale-output-notice', ...AFTER_STALE]);
  expect(r.missing).toEqual([]);
  expect(r.misordered).toEqual([]);
});

// ================================================================ V8
const STAGES = ['context', 'prediction', 'simulation', 'assessment', 'return', 'map'];
const stepperState = (page, stage) => page.evaluate(s => {
  const el = document.querySelector(`[data-testid="stepper-${s}"]`);
  if (!el) return null;
  const isButton = n => n.matches('button, [role="button"]');
  const current = el.matches('[aria-current="step"]') || !!el.querySelector('[aria-current="step"]');
  return {button: isButton(el) || !!el.querySelector('button, [role="button"]'), current, check: el.textContent.includes('✓')};
}, stage);
test('[F4-V8.stepper] six stages; current has aria-current, reached stages are buttons, unreached are not, finished stages carry a check mark; reached stage click moves back (R17, C15)', async ({page}) => {
  await gotoContext(page);
  await expect(tid(page, 'stage-stepper')).toBeVisible();
  await expect(tid(page, 'stage-indicator')).toBeVisible();
  const at = async () => Object.fromEntries(await Promise.all(STAGES.map(async s => [s, await stepperState(page, s)])));
  let state = await at();
  for (const s of STAGES) expect(state[s], `${s} item exists`).not.toBeNull();
  expect(state.context).toMatchObject({current: true, check: false});
  for (const s of STAGES.slice(1)) expect(state[s], `unreached ${s}`).toEqual({button: false, current: false, check: false});

  await tid(page, 'stage-next').click();
  await tid(page, 'prediction-skip').click();
  await tid(page, 'stage-next').click();
  await expect(tid(page, 'stage-simulation')).toBeVisible();
  state = await at();
  expect(state.context).toEqual({button: true, current: false, check: true});
  expect(state.prediction).toEqual({button: true, current: false, check: true});
  expect(state.simulation).toMatchObject({current: true, check: false});
  for (const s of ['assessment', 'return', 'map']) expect(state[s], `unreached ${s}`).toEqual({button: false, current: false, check: false});

  // an unreached stage does nothing
  await tid(page, 'stepper-assessment').click({force: true});
  await expect(tid(page, 'stage-simulation')).toBeVisible();
  expect((await at()).simulation.current).toBe(true);

  // click a reached earlier stage
  await tid(page, 'stepper-prediction').click();
  await expect(tid(page, 'stage-prediction')).toBeVisible();
  await expect(tid(page, 'stage-simulation')).toBeHidden();
  state = await at();
  expect(state.prediction.current).toBe(true);
  expect(state.simulation).toEqual({button: true, current: false, check: false});
  expect(state.context).toEqual({button: true, current: false, check: true});
  expect(state.prediction.check).toBe(false);
  for (const s of ['assessment', 'return', 'map']) expect(state[s].button, `unreached ${s}`).toBe(false);

  // and back to the furthest reached stage through its item
  await tid(page, 'stepper-simulation').click();
  await expect(tid(page, 'stage-simulation')).toBeVisible();
  expect((await at()).simulation.current).toBe(true);
});

// ================================================================ C1 and Q6
const NEW_CASE = display(40, 15);
test('[F4-C1.keyboard-only run] F1 from the first stage to the result submission with the keyboard only; labels, sliders and all visuals are shown; the result validates', async ({page}) => {
  await gotoContext(page);
  await kbPress(page, 'stage-next');
  await expect(tid(page, 'stage-prediction')).toBeVisible();
  for (const id of OUT_IDS) await kbType(page, `prediction-${id}`, BASE[id]);
  await kbPress(page, 'prediction-record');
  await kbPress(page, 'stage-next');
  await expect(tid(page, 'stage-simulation')).toBeVisible();
  for (const i of L.inputs) {
    await expect(tid(page, 'stage-simulation')).toContainText(`${i.label} (${i.unit})`);
    await expect(tid(page, `slider-${i.inputId}`)).toBeVisible();
  }
  for (const v of L.visuals) await expect(tid(page, `visual-${v.visualId}`)).toBeVisible();
  await focusByTab(page, 'slider-load-a');
  await page.keyboard.press('ArrowRight');
  await expectInputsStored(page, 25, 10);
  await expectOutputs(page, wantFor(25, 10), L);
  await focusByTab(page, 'slider-load-b');
  await page.keyboard.press('ArrowLeft');
  await expectInputsStored(page, 25, 8);
  await expectOutputs(page, wantFor(25, 8), L);
  await kbPress(page, 'reset-inputs');
  await expectOutputs(page, wantFor(20, 10), L);
  await show(page, 'prediction-reveal', 'keyboard');
  await kbPress(page, 'prediction-reveal');
  await expect(tid(page, 'baseline-comparison')).toBeVisible();

  await show(page, 'transfer-prediction', 'keyboard');
  for (const id of OUT_IDS) await kbType(page, `transfer-${id}`, NEW_CASE[id]);
  await kbPress(page, 'transfer-record');
  await expect(tid(page, 'transfer-grade')).toHaveAttribute('data-status', 'supported');
  await show(page, 'response-question', 'keyboard');
  await kbType(page, 'response-question', '실사용 범위의 근거는 무엇인가');
  await show(page, 'complete-lesson', 'keyboard');
  await kbPress(page, 'complete-lesson');
  const result = await submitResult(page, receiver, {how: 'keyboard'});
  assertResultDocument(result, 'completed', session, L);
  expect(result.lessonId).toBe(L.lessonId);
  const first = result.responses.find(r => r.purpose === 'prediction');
  expect(JSON.parse(first.answer)).toEqual(BASE);
  expect(Object.keys(JSON.parse(first.answer))).toEqual(OUT_IDS);
});

test('[F4-Q6.loopback only] a full F1 run with sliders, scenarios, number fields and submission sends no request to a host other than 127.0.0.1', async ({page, context}) => {
  const seen = [];
  context.on('request', req => { const u = new URL(req.url()); if (/^(https?|wss?):$/.test(u.protocol)) seen.push(u.hostname); });
  await context.route(url => /^https?:$/.test(url.protocol) && url.hostname !== '127.0.0.1', route => route.abort());
  await toSimulation(page, {record: true});
  await slide(page, 'load-a', 40, {commit: true});
  await slide(page, 'load-b', 20);
  await tid(page, 'input-load-b').fill('17');
  await tid(page, 'scenario-extreme').click();
  await tid(page, 'reset-inputs').click();
  await (await show(page, 'prediction-reveal')).click();
  await (await show(page, `concept-${L.concepts[0].conceptId}`)).click();
  await (await show(page, 'hint-level-2')).click();
  await fillPrediction(page, 'transfer', NEW_CASE, [], L);
  await tid(page, 'transfer-record').click();
  await (await show(page, 'response-question')).fill('질문');
  await (await show(page, 'complete-lesson')).click();
  assertResultDocument(await submitResult(page, receiver), 'completed', session, L);
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.filter(h => h !== '127.0.0.1')).toEqual([]);
});

// ---- F4C-W1: exact current value of every output card (spec 679f728f2f602897 R1, C1-C5); expected strings come from the F1 closed forms and Intl, never from the page
const UNDEFINED_TEXT = '정의되지 않음';
const cardText = (a, b) => Object.fromEntries(OUT_IDS.map(id => {
  const v = display(a, b)[id];
  return [id, v === null ? UNDEFINED_TEXT : `${ko(v)} ${OUT_UNIT[id]}`];
}));
async function expectCardValues(page, a, b, label) {
  const want = cardText(a, b);
  for (const id of OUT_IDS) await expect(tid(page, `output-value-${id}`), `${label}: ${id}`).toHaveText(want[id]);
}
const withPageErrors = page => { const errors = []; page.on('pageerror', e => errors.push(String(e))); return errors; };
test('[F4C-W1.literals] the independent expectations are the spec literals (guards the oracle itself)', () => {
  expect(cardText(20, 10)).toEqual({'part-a': '60 pt', 'part-b': '20 pt', total: '80 pt', 'fill-b': '20 %', margin: '80 %'});
  expect(cardText(25, 12)).toEqual({'part-a': '75 pt', 'part-b': '24 pt', total: '99 pt', 'fill-b': '24 %', margin: '76 %'});
  expect(cardText(20, 18)).toEqual({'part-a': '60 pt', 'part-b': '36 pt', total: '96 pt', 'fill-b': '36 %', margin: UNDEFINED_TEXT});
});
test('[F4C-W1.C1 default] load-a 20, load-b 10: five card values', async ({page}) => {
  const errors = withPageErrors(page);
  await toSimulation(page);
  await expectCardValues(page, 20, 10, 'C1');
  expect(errors).toEqual([]);
});
test('[F4C-W1.C2 committed non-default] load-a 25, load-b 12 committed: five card values, stored inputs follow', async ({page}) => {
  const errors = withPageErrors(page);
  await toSimulation(page);
  await tid(page, 'input-load-a').fill('25');
  await tid(page, 'input-load-b').fill('12');
  await expectInputsStored(page, 25, 12);
  await expectCardValues(page, 25, 12, 'C2');
  expect(errors).toEqual([]);
});
test('[F4C-W1.C3 committed margin null] load-b 18 committed (16 < b < 19): margin is the undefined text, other four exact', async ({page}) => {
  const errors = withPageErrors(page);
  await toSimulation(page);
  await tid(page, 'input-load-b').fill('18');
  await expectInputsStored(page, 20, 18);
  await expectCardValues(page, 20, 18, 'C3');
  await expect(tid(page, 'output-value-margin')).toHaveText('정의되지 않음');
  expect(errors).toEqual([]);
});
// One slider is previewed per test: a preview is the committed input plus that one slider's value, so previews on two sliders do not accumulate (spec 0dcd8454f6e5111d R11).
for (const [name, id, value, a, b] of [['load-a 35', 'load-a', 35, 35, 10], ['load-b 18 (null margin)', 'load-b', 18, 20, 18]]) {
  test(`[F4C-W1.C4 preview ${name}] input event only: five card values follow the preview, stored inputs stay at the defaults`, async ({page}) => {
    const errors = withPageErrors(page);
    await toSimulation(page);
    await slide(page, id, value);
    await expectCardValues(page, a, b, 'C4');
    await page.waitForTimeout(300);
    expect(await storedInputs(page)).toEqual({'load-a': 20, 'load-b': 10});
    expect(errors).toEqual([]);
  });
}
test('[F4C-W1.C5 null back to number] margin null at load-b 18, then load-b 12 committed: margin is a number again, all five exact', async ({page}) => {
  const errors = withPageErrors(page);
  await toSimulation(page);
  await tid(page, 'input-load-b').fill('18');
  await expectInputsStored(page, 20, 18);
  await expect(tid(page, 'output-value-margin')).toHaveText(UNDEFINED_TEXT);
  await tid(page, 'input-load-b').fill('12');
  await expectInputsStored(page, 20, 12);
  await expectCardValues(page, 20, 12, 'C5');
  expect(errors).toEqual([]);
});

// ---- unit groups on F3 (outputs declared with interleaved units X, Y, X), own build
test.describe('[F4-V7.unit groups F3]', () => {
  test.beforeAll(() => { buildLesson(SYNTHETIC_V3_UNITS); });
  test.afterAll(() => { buildLesson(SYNTHETIC_V3); });
  test('[F4-V7.unit groups F3] two groups: X (x-first, x-second) then Y (y-only), with data-unit and the cards inside their group in outputs order', async ({page}) => {
    await gotoContext(page);
    await tid(page, 'stage-next').click();
    await tid(page, 'prediction-skip').click();
    await tid(page, 'stage-next').click();
    await expect(tid(page, 'output-table')).toBeVisible();
    expect(lessonF3.outputs.map(o => o.unit)).toEqual(['X', 'Y', 'X']);
    await expect.poll(() => groupsOf(page)).toEqual(F3_GROUPS.map((g, n) => ({id: `output-group-${n}`, unit: g.unit, cards: g.outputs})));
    await expect(page.locator('[data-testid^="output-group-"]')).toHaveCount(2);
    await expect(page.locator('[data-testid^="output-card-"]')).toHaveCount(3);
    await expect(tid(page, 'output-card-x-first')).toContainText('4');
    await expect(tid(page, 'output-card-y-only')).toContainText('8');
    await expect(tid(page, 'output-card-x-second')).toContainText('9');
  });
});
