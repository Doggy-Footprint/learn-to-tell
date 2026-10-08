// Independent oracle for the synthetic v3 fixtures F1 and F2: expected numbers come from the closed forms below, never from rendered output.
import {readFileSync} from 'node:fs';

const json = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
export const F1 = {session: 'tests/fixtures/learning/session.valid.json', lesson: 'tests/fixtures/learning/synthetic-lesson-v3.json', model: 'tests/fixtures/learning/synthetic-model-v3.mjs', oracle: 'tests/fixtures/learning/synthetic-oracle-v3.json'};
export const F2 = {session: 'tests/fixtures/learning/session.valid.json', lesson: 'tests/fixtures/learning/synthetic-lesson-v3-min.json', model: 'tests/fixtures/learning/synthetic-model-v3-min.mjs', oracle: 'tests/fixtures/learning/synthetic-oracle-v3-min.json'};
export const lessonF1 = json('./synthetic-lesson-v3.json');
export const lessonF2 = json('./synthetic-lesson-v3-min.json');
export const lessonF3 = json('./synthetic-lesson-v3-units.json');
export const oracleF1 = json('./synthetic-oracle-v3.json');
export const oracleF2 = json('./synthetic-oracle-v3-min.json');

export const A = {id: 'load-a', label: '부하 A', unit: 'u', min: 0, max: 100, def: 20, step: 5, pmin: 10, pmax: 60};
export const B = {id: 'load-b', label: '부하 B', unit: 'v', min: 0, max: 50, def: 10, step: 2, pmin: 6, pmax: 30};
export const OUT_IDS = ['part-a', 'part-b', 'total', 'fill-b', 'margin'];
export const OUT_LABEL = {'part-a': 'A 몫', 'part-b': 'B 몫', total: '합계', 'fill-b': 'B 채움', margin: '여유율'};
export const OUT_UNIT = {'part-a': 'pt', 'part-b': 'pt', total: 'pt', 'fill-b': '%', margin: '%'};
export const SCALE = {'part-a': 1, 'part-b': 1, total: 1, 'fill-b': 100, margin: 100};

// raw model values; margin is undefined (null) for 16 < b < 19
export const raw = (a, b) => ({'part-a': 3 * a, 'part-b': 2 * b, total: 3 * a + 2 * b, 'fill-b': b / 50, margin: b > 16 && b < 19 ? null : 1 - b / 50});
export const display = (a, b) => Object.fromEntries(Object.entries(raw(a, b)).map(([k, v]) => [k, v === null ? null : v * SCALE[k]]));
export const ko = n => new Intl.NumberFormat('ko-KR', {maximumFractionDigits: 3}).format(n);

// 41 equally spaced x over [min(pmin, cur), max(pmax, cur)], other input fixed
export function sweepExpect(which, current) {
  const spec = which === 'a' ? A : B;
  const cur = which === 'a' ? current.a : current.b;
  const lo = Math.min(spec.pmin, cur), hi = Math.max(spec.pmax, cur);
  return Array.from({length: 41}, (_, i) => {
    const x = lo + (hi - lo) * i / 40;
    return {x, values: which === 'a' ? display(x, current.b) : display(current.a, x)};
  });
}

export const F2_DISPLAY = s => ({twice: 2 * s});

// F3: outputs x-first (X), y-only (Y), x-second (X); unit groups by first appearance are [X: x-first, x-second], [Y: y-only]
export const F3_GROUPS = [{unit: 'X', outputs: ['x-first', 'x-second']}, {unit: 'Y', outputs: ['y-only']}];
// F1: [pt: part-a, part-b, total], [%: fill-b, margin]
export const F1_GROUPS = [{unit: 'pt', outputs: ['part-a', 'part-b', 'total']}, {unit: '%', outputs: ['fill-b', 'margin']}];
// R13 caption: 현재 입력(<label> <formatCount(값)><unit> · …)의 출력, inputs in declared order
export const captionFor = (a, b) => `현재 입력(${A.label} ${ko(a)}${A.unit} · ${B.label} ${ko(b)}${B.unit})의 출력`;
// R14 aria-label of a sweep visual of F1 at the given current inputs (shared y axis over all lines of the chart)
export function ariaFor(visual, current) {
  const which = visual.inputId === 'load-a' ? 'a' : 'b';
  const spec = which === 'a' ? A : B;
  const pts = sweepExpect(which, current);
  const all = pts.flatMap(p => visual.outputIds.map(o => p.values[o])).filter(v => v !== null);
  let ymin = Math.min(0, ...all), ymax = Math.max(...all);
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const now = display(current.a, current.b);
  const parts = visual.outputIds.map(o => `${OUT_LABEL[o]} ${ko(ymin)}\u2013${ko(ymax)}${OUT_UNIT[o]}; 현재 ${ko(current[which])}${spec.unit}에서 ${ko(now[o])}${OUT_UNIT[o]}`);
  return `${visual.caption}. ${spec.label}이 ${ko(pts[0].x)}에서 ${ko(pts[40].x)}${spec.unit}로 바뀔 때 ${parts.join(', ')}`;
}
