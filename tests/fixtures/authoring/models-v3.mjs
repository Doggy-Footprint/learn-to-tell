// Fault models for check-model C9 (spec 0dcd8454f6e5111d v1), derived from the F1 closed form.
// Sweep sample points of F1: visual 0 varies load-a over 10..60 with load-b = 10; visual 1 varies load-b over 6..30 with load-a = 20.
// Each fault sits at a point that is neither an oracle case nor an existing range/all-min/all-max probe.
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT, asText} from './models.mjs';

export const LESSON_PATH = path.join(ROOT, 'tests', 'fixtures', 'learning', 'synthetic-lesson-v3.json');
export const ORACLE_PATH = path.join(ROOT, 'tests', 'fixtures', 'learning', 'synthetic-oracle-v3.json');
export const MODEL_PATH = path.join(ROOT, 'tests', 'fixtures', 'learning', 'synthetic-model-v3.mjs');
export const lessonV3 = () => JSON.parse(readFileSync(LESSON_PATH, 'utf8'));
export const oracleV3 = () => JSON.parse(readFileSync(ORACLE_PATH, 'utf8'));
export const lessonV3Text = () => asText(lessonV3());
export const oracleV3Text = () => asText(oracleV3());

// v2 form of F1: the same inputs/outputs without the v3 fields (same model, same oracle)
export function lessonV2OfF1() {
  const l = lessonV3();
  l.version = 2;
  delete l.visuals;
  l.inputs = l.inputs.map(({inputId, unit, min, max, default: d}) => ({inputId, unit, min, max, default: d}));
  return l;
}

// Points (load-a, load-b) of the sweep samples used by the faults.
export const POINTS = {
  sweepBMin: [20, 6], sweepBInner: [20, 12], sweepBMax: [20, 30], outsideOnly: [20, 40],
  sweepAInner: [33.75, 10],
};

const near = ([a, b]) => `(Math.abs(a - ${a}) < 1e-9 && Math.abs(b - ${b}) < 1e-9)`;
export function modelSourceV3({pre = '', post = ''} = {}) {
  return `const IDS = ['load-a', 'load-b'];
export const model = {
  modelId: 'load-balance',
  modelRevision: 1,
  inputIds: IDS,
  outputIds: ['part-a', 'part-b', 'total', 'fill-b', 'margin'],
  calculate(values) {
    const a = values['load-a'], b = values['load-b'];
    ${pre}
    if (typeof a !== 'number' || !(a >= 0 && a <= 100)) return {ok: false, errors: [{code: 'RANGE', path: '/load-a'}]};
    if (typeof b !== 'number' || !(b >= 0 && b <= 50)) return {ok: false, errors: [{code: 'RANGE', path: '/load-b'}]};
    const out = {'part-a': 3 * a, 'part-b': 2 * b, total: 3 * a + 2 * b, 'fill-b': b / 50, margin: b > 16 && b < 19 ? null : 1 - b / 50};
    ${post}
    return {ok: true, value: out};
  },
};
`;
}
export const failAt = point => `if (${near(point)}) return {ok: false, errors: [{code: 'RANGE', path: '/load-b'}]};`;
export const outAt = (point, outputId, expression) => `if (${near(point)}) out['${outputId}'] = ${expression};`;
export const asLessonText = lesson => asText(lesson);
