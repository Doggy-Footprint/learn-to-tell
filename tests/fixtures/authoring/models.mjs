// Independent fixtures for T5-2 (spec d1adf29b9bdfe2b8 v2). Expected values come from the hand formulas
// TP=d*s FP=(100-d)*f FN=d*(100-s) TN=(100-d)*(100-f) PPV=TP/(TP+FP) accuracy=(TP+TN)/10000 (N=10000, percent inputs);
// nothing here imports authoring/ or scripts/lesson.mjs. Generated model sources must stay free of the words
// "import" and "require(" unless a fixture deliberately violates the single-file rule (spec S2).
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {inspectionLessonV2} from '../../../examples/manufacturing-inspection/lesson-v2.mjs';

export const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
export const EXAMPLE_MODEL = path.join(ROOT, 'examples', 'manufacturing-inspection', 'model.mjs');
export const EXAMPLE_ORACLE = path.join(ROOT, 'examples', 'manufacturing-inspection', 'oracle.json');
export const PROFILE = 'local-learner';
export const INPUT_IDS = ['defect-percent', 'detection-percent', 'false-positive-percent'];
export const OUTPUT_IDS = ['true-positive', 'false-positive', 'false-negative', 'true-negative', 'positive-count', 'positive-predictive-value', 'accuracy'];
export const DEFAULTS = [1, 90, 5];
export const clone = value => structuredClone(value);

export function reference([d, s, f]) {
  const tp = d * s;
  const fp = (100 - d) * f;
  const fn = d * (100 - s);
  const tn = (100 - d) * (100 - f);
  const pc = tp + fp;
  return {'true-positive': tp, 'false-positive': fp, 'false-negative': fn, 'true-negative': tn, 'positive-count': pc, 'positive-predictive-value': pc === 0 ? null : tp / pc, accuracy: (tp + tn) / 10000};
}

export const baseLesson = () => clone(inspectionLessonV2);
// Tab indentation and a trailing newline so a re-serialising implementation cannot reproduce the input bytes by accident.
export const asText = value => JSON.stringify(value, null, '\t') + '\n';
export const exampleOracleText = () => asText(JSON.parse(readFileSync(EXAMPLE_ORACLE, 'utf8')));

// Index 4 is an oracle-only input (not a min/max/default combination); indexes 1-3 reach every min and max once.
export const ORACLE_INPUTS = [[1, 90, 5], [0, 90, 0], [100, 0, 100], [50, 100, 50], [37, 61, 13]];
export function baseOracle() {
  return {
    kind: 'oracle', version: 1, modelId: 'manufacturing-inspection', modelRevision: 1,
    cases: ORACLE_INPUTS.map((values, index) => {
      const expected = reference(values);
      return {
        caseId: `case-${index}`,
        values: INPUT_IDS.map((inputId, position) => ({inputId, value: values[position]})),
        expected: OUTPUT_IDS.map(outputId => ({outputId, value: expected[outputId]})),
        absolute: 1e-9, source: 'hand calculation from the percent formulas', author: 'independent-agent',
      };
    }),
  };
}
export const baseOracleText = () => asText(baseOracle());

// Probe inputs outside the oracle that must be reached by the non-finite/shape/mutation/determinism probes.
export const TRIGGERS = {allMin: [0, 0, 0], allMax: [100, 100, 100], oracleOnly: [37, 61, 13], inputMaxOthersDefault: [100, 90, 5], inputMinOthersDefault: [1, 90, 0]};
export const at = ([d, s, f]) => `at(${d}, ${s}, ${f})`;

// pre: runs before the range check (may mutate `values`, throw, exit); post: edits `out` after the reference result.
export function modelSource({top = '', pre = '', post = '', rangeBad = 'v < 0 || v > 100', modelRevision = 1, raw = null} = {}) {
  if (raw !== null) return raw;
  return `// 테스트용 생성 모델
${top}
const IDS = ${JSON.stringify(INPUT_IDS)};
const DEFAULTS = ${JSON.stringify(Object.fromEntries(INPUT_IDS.map((id, index) => [id, DEFAULTS[index]])))};
const rangeBad = (id, v, all) => ${rangeBad};
const reference = o => {
  const d = o['defect-percent'], s = o['detection-percent'], f = o['false-positive-percent'];
  const tp = d * s, fp = (100 - d) * f, fn = d * (100 - s), tn = (100 - d) * (100 - f), pc = tp + fp;
  return {'true-positive': tp, 'false-positive': fp, 'false-negative': fn, 'true-negative': tn, 'positive-count': pc, 'positive-predictive-value': pc === 0 ? null : tp / pc, accuracy: (tp + tn) / 10000};
};
export const model = {
  modelId: 'manufacturing-inspection',
  modelRevision: ${modelRevision},
  inputIds: IDS,
  outputIds: ${JSON.stringify(OUTPUT_IDS)},
  calculate(values) {
    const orig = {...values};
    const at = (d, s, f) => orig['defect-percent'] === d && orig['detection-percent'] === s && orig['false-positive-percent'] === f;
    ${pre}
    for (const id of IDS) if (rangeBad(id, orig[id], orig)) return {ok: false, errors: [{code: 'RANGE', path: '/' + id}]};
    const out = reference(orig);
    ${post}
    return {ok: true, value: out};
  }
};
`;
}

export const pidTop = pidFile => `process.getBuiltinModule('node:fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));`;
