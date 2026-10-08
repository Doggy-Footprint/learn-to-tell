// Independent fixtures for lesson v2 / oracle v1 / model binding (spec fd5077c6a63a8fb9 v1).
// Built only from the v1 lesson, the spec field lists and hand formulas; nothing here imports contracts/ or model code.
import {inspectionLesson} from '../../../examples/manufacturing-inspection/lesson.mjs';
import {validBundle, clone} from '../contracts/cases.mjs';
import {reseal} from '../contracts/hash-oracle.mjs';

export {clone};
export const EPS = 0.01;
export const N = 10000;
export const SECRET = 'SECRET-RESPONSE';

// Hand formulas from the lesson text: TP=Nps FP=N(1-p)f FN=Np(1-s) TN=N(1-p)(1-f) PPV=TP/(TP+FP) accuracy=(TP+TN)/N
export function mxExpected([d, s, f]) {
  const p = d / 100, sr = s / 100, fr = f / 100;
  const tp = N * p * sr, fp = N * (1 - p) * fr, fn = N * p * (1 - sr), tn = N * (1 - p) * (1 - fr);
  return {sampleSize: N, truePositive: tp, falsePositive: fp, falseNegative: fn, trueNegative: tn, positiveCount: tp + fp, positivePredictiveValue: tp + fp === 0 ? null : tp / (tp + fp), accuracy: (tp + tn) / N};
}
export const mxOutputDefs = [
  ['sample-size', 'sampleSize', '개', 1, false, '표본 크기'],
  ['true-positive', 'truePositive', '개', 1, false, 'TP'],
  ['false-positive', 'falsePositive', '개', 1, false, 'FP'],
  ['false-negative', 'falseNegative', '개', 1, false, 'FN'],
  ['true-negative', 'trueNegative', '개', 1, false, 'TN'],
  ['positive-count', 'positiveCount', '개', 1, false, '양성 총수'],
  ['positive-predictive-value', 'positivePredictiveValue', '%', 100, true, 'PPV'],
  ['accuracy', 'accuracy', '%', 100, false, '전체 정확도'],
];
export const mxInputIds = inspectionLesson.inputs.map(x => x.inputId);
// lesson v2 concept cards (spec 65ba74b36b0ef5da R1): four required non-empty strings besides conceptId/conceptRevision/label.
export const CARD_FIELDS = ['meaning', 'example', 'confusion', 'plain'];
const withCards = concepts => concepts.map(c => ({...c, meaning: `${c.label}의 뜻`, example: `${c.label}의 예`, confusion: `${c.label}과 헷갈리는 것`, plain: `${c.label}을 쉽게 말하면`}));

export function mxLesson() {
  const v1 = clone(inspectionLesson);
  const outputs = mxOutputDefs.map(([outputId, , unit, scale, nullable, label]) => ({outputId, label, unit, scale, nullable}));
  const sc = (scenarioId, label, vals) => ({scenarioId, label, values: mxInputIds.map((inputId, i) => ({inputId, value: vals[i]}))});
  return {
    ...v1, version: 2, modelId: 'manufacturing-inspection', modelRevision: 1, concepts: withCards(v1.concepts), outputs,
    scenarios: [sc('baseline-a', '기본 A', [1, 90, 5]), sc('population-contrast', '집단 대비', [10, 90, 5]), sc('candidate-b', '검사 B', [1, 80, 1])],
    transfer: {scenarioId: 'candidate-b', tolerances: outputs.map(o => ({outputId: o.outputId, absolute: 1}))},
  };
}
export const mxDeclaration = () => ({modelId: 'manufacturing-inspection', modelRevision: 1, inputIds: [...mxInputIds], outputIds: mxOutputDefs.map(x => x[0])});

const oc = (caseId, vals) => {
  const e = mxExpected(vals);
  return {caseId, values: mxInputIds.map((inputId, i) => ({inputId, value: vals[i]})), expected: mxOutputDefs.map(([outputId, key]) => ({outputId, value: e[key]})), absolute: 1e-9, source: 'independent hand calculation from the lesson formulas', author: 'independent-agent'};
};
export function mxOracle() {
  const cases = [oc('baseline-a', [1, 90, 5]), oc('population-contrast', [10, 90, 5]), oc('candidate-b', [1, 80, 1]), oc('ppv-null-a', [0, 90, 0]), oc('ppv-null-b', [1, 0, 0]), oc('ppv-null-c', [100, 0, 5])];
  for (let k = 0; k < 3; k++) for (const bound of [0, 100]) { const v = [50, 50, 50]; v[k] = bound; cases.push(oc(`bound-${k}-${bound}`, v)); }
  return {kind: 'oracle', version: 1, modelId: 'manufacturing-inspection', modelRevision: 1, cases};
}
function withoutBound(oracle, k, bound) {
  for (const c of oracle.cases) if (c.values[k].value === bound) {
    const vals = c.values.map(v => v.value); vals[k] = 50;
    const fresh = oc(c.caseId, vals); c.values = fresh.values; c.expected = fresh.expected;
  }
  return oracle;
}

// Generic v2 lesson derived from any v1 lesson (used with the shared contracts bundle fixture).
export function toV2(v1, revision = v1.lessonRevision) {
  const lesson = clone(v1);
  const ids = lesson.inputs.map(x => x.inputId);
  return {
    ...lesson, version: 2, lessonRevision: revision, modelId: 'model-a', modelRevision: 1, concepts: withCards(lesson.concepts),
    outputs: [{outputId: 'output-a', label: 'Out A', unit: 'items', scale: 1, nullable: false}, {outputId: 'output-b', label: 'Out B', unit: '%', scale: 100, nullable: true}],
    scenarios: [{scenarioId: 'scenario-a', label: 'Default', values: ids.map((inputId, i) => ({inputId, value: lesson.inputs[i].default}))}, {scenarioId: 'scenario-b', label: 'Max', values: ids.map((inputId, i) => ({inputId, value: lesson.inputs[i].max}))}],
    transfer: {scenarioId: 'scenario-b', tolerances: [{outputId: 'output-a', absolute: 0.5}, {outputId: 'output-b', absolute: 1}]},
  };
}

export const cases = [];
const wrapped = build => () => { const r = build(); return Object.hasOwn(r, 'input') && Object.keys(r).every(k => k === 'input' || k === 'calls') ? r : {input: r}; };
const add = (id, items, surface, build, expect) => cases.push({id, obligationId: id.split('.')[0], items, surface, build: wrapped(build), expect});
const fixedInput = (input, extra = {}) => () => ({input, ...extra});
const good = {ok: true};
const ex = (code, path) => ({code, path});
const un = (code, under) => ({code, under});

// ---- V1: version equivalence classes {1, 2, 0, 3, "2"} ----
{
  const v1 = () => clone(inspectionLesson);
  add('V1.v1', ['V1.v1'], 'lesson', () => ({input: v1()}), good);
  add('V1.v1.rules-only', ['V1.v1'], 'lesson', () => ({input: {...v1(), modelId: 'manufacturing-inspection'}}), {exact: [ex('UNKNOWN_FIELD', '/modelId')]});
  add('V1.v2', ['V1.v2'], 'lesson', () => ({input: mxLesson()}), good);
  add('V1.v2.requires-new-fields', ['V1.v2'], 'lesson', () => ({input: {...v1(), version: 2}}), {has: ['modelId', 'modelRevision', 'outputs', 'scenarios', 'transfer'].map(f => ex('REQUIRED', `/${f}`))});
  for (const [item, version] of [['0', 0], ['4', 4]]) add(`V1.version-${item}`, [`V1.${item}`], 'lesson', () => ({input: {...mxLesson(), version}}), {exact: [ex('VERSION', '/version')]});
  add('V1.version-string-2', ['V1.str2'], 'lesson', () => ({input: {...mxLesson(), version: '2'}}), {exact: [ex('TYPE', '/version')]});
}

// ---- T5-3 V1: lesson v2 concept card fields, equivalence classes {valid, missing, blank, number} per field; v1 keeps three fields ----
{
  const cardCase = (name, field, mutate, expect) => add(`T53-V1.${field}.${name}`, [`T53-V1.${field}.${name}`], 'lesson', () => { const l = mxLesson(); mutate(l.concepts[0], field); return {input: l}; }, expect);
  for (const f of CARD_FIELDS) {
    const path = `/concepts/0/${f}`;
    cardCase('valid', f, (c, k) => { c[k] = '유효한 문장 하나.'; }, good);
    cardCase('missing', f, (c, k) => { delete c[k]; }, {exact: [ex('REQUIRED', path)]});
    cardCase('blank', f, (c, k) => { c[k] = '  '; }, {exact: [ex('VALUE', path)]});
    cardCase('number', f, (c, k) => { c[k] = 5; }, {exact: [ex('TYPE', path)]});
    add(`T53-V1.${f}.missing-last`, [`T53-V1.${f}.missing`], 'lesson', () => { const l = mxLesson(); delete l.concepts.at(-1)[f]; return {input: l}; }, {exact: [ex('REQUIRED', `/concepts/${mxLesson().concepts.length - 1}/${f}`)]});
  }
  add('T53-V1.v1-rejects-card-fields', ['T53-V1.v1-card-fields'], 'lesson', () => { const l = clone(inspectionLesson); for (const f of CARD_FIELDS) l.concepts[0][f] = '카드 문장'; return {input: l}; }, {exact: [...CARD_FIELDS].sort().map(f => ex('UNKNOWN_FIELD', `/concepts/0/${f}`))});
}

// ---- V2: lesson v2 rules ----
{
  mxInputIds.forEach((inputId, k) => {
    const lo = 0, hi = 100;
    const probe = (name, value, expectRange) => add(`V2.bva.${inputId}.${name}`, [`V2.bva.${inputId}.${name}`], 'lesson', () => { const l = mxLesson(); l.scenarios[0].values[k].value = value; return {input: l}; }, expectRange ? {exact: [ex('RANGE', `/scenarios/0/values/${k}/value`)]} : good);
    probe('min-minus', lo - EPS, true); probe('min-eq', lo, false); probe('min-plus', lo + EPS, false);
    probe('max-minus', hi - EPS, false); probe('max-eq', hi, false); probe('max-plus', hi + EPS, true);
  });
  add('V2.absolute.minus', ['V2.absolute.minus'], 'lesson', () => { const l = mxLesson(); l.transfer.tolerances[0].absolute = -EPS; return {input: l}; }, {exact: [ex('RANGE', '/transfer/tolerances/0/absolute')]});
  add('V2.absolute.zero', ['V2.absolute.zero'], 'lesson', () => { const l = mxLesson(); for (const t of l.transfer.tolerances) t.absolute = 0; return {input: l}; }, good);
  add('V2.c3.scenarios-at-min-and-max', ['V2.c3'], 'lesson', () => {
    const l = mxLesson(); const mk = (scenarioId, v) => ({scenarioId, label: scenarioId, values: mxInputIds.map(inputId => ({inputId, value: v}))});
    l.scenarios = [mk('all-min', 0), mk('all-max', 100)]; l.transfer = {scenarioId: 'all-max', tolerances: l.outputs.map(o => ({outputId: o.outputId, absolute: 0}))};
    return {input: l};
  }, good);
  const rule = (name, mutate, expect) => add(`V2.f3.${name}`, [`V2.f3.${name}`], 'lesson', () => { const l = mxLesson(); mutate(l); return {input: l}; }, expect);
  const parity = (name, mutate) => add(`V2.v1rule.${name}`, [`V2.v1rule.${name}`], 'lessonParity', () => { const v1 = clone(inspectionLesson), v2 = mxLesson(); mutate(v1); mutate(v2); return {v1, v2}; }, {parity: true});
  parity('required-minutes-21', l => { l.activities.find(a => a.stage === 'exploration').minutes = 9; });
  parity('missing-stage', l => { l.activities = l.activities.filter(a => a.stage !== 'return'); });
  parity('missing-dimension', l => { l.rubric.criteria.find(c => c.dimension === 'transfer').dimension = 'concept'; });
  parity('role-mismatch-reference', l => { l.decisions[0].assessmentId = 'diagnostic-cards'; });
  for (const [name, value] of [['zero', 0], ['negative', -1]]) rule(`scale-${name}`, l => { l.outputs[0].scale = value; }, {exact: [ex('RANGE', '/outputs/0/scale')]});
  rule('duplicate-output', l => l.outputs.push(clone(l.outputs[0])), {exact: [ex('DUPLICATE', '/outputs/8/outputId')]});
  rule('duplicate-scenario', l => l.scenarios.push(clone(l.scenarios[0])), {exact: [ex('DUPLICATE', '/scenarios/3/scenarioId')]});
  rule('scenario-input-unknown', l => { l.scenarios[0].values.push({inputId: 'absent-input', value: 1}); }, {exact: [ex('REFERENCE', '/scenarios/0/values/3/inputId')]});
  rule('scenario-missing-input', l => { l.scenarios[0].values.pop(); }, {exact: [ex('STATE', '/scenarios/0/values')]});
  rule('scenario-duplicate-input', l => { l.scenarios[0].values.push(clone(l.scenarios[0].values[0])); }, {exact: [ex('STATE', '/scenarios/0/values')]});
  rule('transfer-scenario-unknown', l => { l.transfer.scenarioId = 'absent-scenario'; }, {exact: [ex('REFERENCE', '/transfer/scenarioId')]});
  rule('tolerance-output-unknown', l => { l.transfer.tolerances.push({outputId: 'absent-output', absolute: 1}); }, {exact: [ex('REFERENCE', '/transfer/tolerances/8/outputId')]});
  rule('tolerance-duplicate-output', l => l.transfer.tolerances.push(clone(l.transfer.tolerances[0])), {exact: [ex('DUPLICATE', '/transfer/tolerances/8/outputId')]});
  rule('tolerance-missing-output', l => { l.transfer.tolerances.pop(); }, {exact: [ex('STATE', '/transfer/tolerances')]});
}

// ---- V3: oracle document and binding ----
{
  const ob = (oracle, lesson = mxLesson()) => ({oracle, lesson});
  add('V3.baseline.valid-document', ['V3.cover.present'], 'oracle', () => ({input: mxOracle()}), good);
  add('V3.baseline.valid-binding', ['V3.cover.present'], 'oracleBinding', () => ob(mxOracle()), good);
  // decision table nullable x expected-null (PPV is nullable, accuracy is not)
  const outIndex = id => mxOutputDefs.findIndex(x => x[0] === id);
  const setExpected = (id, value) => () => { const o = mxOracle(); o.cases[0].expected[outIndex(id)].value = value; return ob(o); };
  add('V3.null.nullable-null', ['V3.null.nullable-null'], 'oracleBinding', setExpected('positive-predictive-value', null), good);
  add('V3.null.nullable-value', ['V3.null.nullable-value'], 'oracleBinding', setExpected('positive-predictive-value', 0.5), good);
  add('V3.null.strict-value', ['V3.null.strict-value'], 'oracleBinding', setExpected('accuracy', 0.5), good);
  add('V3.null.strict-null', ['V3.null.strict-null'], 'oracleBinding', setExpected('accuracy', null), {exact: [un('STATE', '/cases/0/expected/7/value')]});
  add('V3.null.strict-null.document-level-ok', ['V3.null.strict-null'], 'oracle', () => ({input: setExpected('accuracy', null)().oracle}), good);
  mxInputIds.forEach((inputId, k) => {
    for (const [bound, value] of [['min', 0], ['max', 100]]) {
      add(`V3.cover.${inputId}.${bound}.present`, [`V3.cover.${inputId}.${bound}.present`], 'oracleBinding', () => ob(mxOracle()), good);
      add(`V3.cover.${inputId}.${bound}.absent`, [`V3.cover.${inputId}.${bound}.absent`], 'oracleBinding', () => ob(withoutBound(mxOracle(), k, value)), {exact: [ex('STATE', '/oracle/cases')]});
    }
  });
  add('V3.f4.absolute-negative', ['V3.f4.absolute-negative'], 'oracle', () => { const o = mxOracle(); o.cases[0].absolute = -EPS; return {input: o}; }, {exact: [ex('RANGE', '/cases/0/absolute')]});
  add('V3.f4.absolute-negative.last-case', ['V3.f4.absolute-negative'], 'oracle', () => { const o = mxOracle(); const last = o.cases.length - 1; o.cases[last].absolute = -EPS; return {input: o}; }, {exact: [ex('RANGE', `/cases/${mxOracle().cases.length - 1}/absolute`)]});
  const ref = (name, mutate, expect) => add(`V3.ref.${name}`, [`V3.ref.${name}`], 'oracleBinding', () => { const o = mxOracle(); mutate(o); return ob(o); }, expect);
  ref('modelId', o => { o.modelId = 'other-model'; }, {exact: [ex('REFERENCE', '/oracle/modelId')]});
  ref('modelRevision', o => { o.modelRevision = 2; }, {exact: [ex('REVISION', '/oracle/modelRevision')]});
  ref('inputId', o => { o.cases[0].values[0].inputId = 'absent-input'; }, {has: [un('REFERENCE', '/cases/0/values/0/inputId')]});
  ref('outputId', o => { o.cases[0].expected[0].outputId = 'absent-output'; }, {has: [un('REFERENCE', '/cases/0/expected/0/outputId')]});
  ref('range', o => { o.cases[0].values[0].value = 100 + EPS; }, {exact: [un('RANGE', '/cases/0/values/0/value')]});
  const f4 = (name, surface, mutate, expect) => add(`V3.f4.${name}`, [`V3.f4.${name}`], surface, () => { const o = mxOracle(); mutate(o); return surface === 'oracle' ? {input: o} : ob(o); }, expect);
  f4('duplicate-caseId', 'oracle', o => { o.cases[1].caseId = o.cases[0].caseId; }, {exact: [ex('DUPLICATE', '/cases/1/caseId')]});
  f4('case-duplicate-input', 'oracle', o => { o.cases[0].values.push(clone(o.cases[0].values[0])); }, {exact: [ex('STATE', '/cases/0/values')]});
  f4('case-duplicate-output', 'oracle', o => { o.cases[0].expected.push(clone(o.cases[0].expected[0])); }, {exact: [ex('STATE', '/cases/0/expected')]});
  f4('case-missing-input.document-ok', 'oracle', o => { o.cases[0].values.pop(); }, good);
  f4('case-missing-output.document-ok', 'oracle', o => { o.cases[0].expected.pop(); }, good);
  f4('case-missing-input', 'oracleBinding', o => { o.cases[0].values.pop(); }, {exact: [ex('STATE', '/oracle/cases/0/values')]});
  f4('case-missing-output', 'oracleBinding', o => { o.cases[0].expected.pop(); }, {exact: [ex('STATE', '/oracle/cases/0/expected')]});
}

// ---- V4: validateModelBinding ----
{
  const mb = (mutate = () => {}, lessonMutate = () => {}) => () => { const declaration = mxDeclaration(), lesson = mxLesson(); mutate(declaration); lessonMutate(lesson); return {declaration, lesson}; };
  add('V4.match', ['V4.match'], 'modelBinding', mb(), good);
  add('V4.match.reordered', ['V4.match'], 'modelBinding', mb(d => { d.inputIds.reverse(); d.outputIds.reverse(); }), good);
  add('V4.modelId', ['V4.modelId'], 'modelBinding', mb(d => { d.modelId = 'other-model'; }), {exact: [ex('REFERENCE', '/model/modelId')]});
  add('V4.revision', ['V4.revision'], 'modelBinding', mb(d => { d.modelRevision = 2; }), {exact: [ex('REVISION', '/model/modelRevision')]});
  add('V4.input-missing', ['V4.input-missing'], 'modelBinding', mb(d => d.inputIds.pop()), {exact: [{code: 'REFERENCE', re: /inputIds/}]});
  add('V4.input-extra', ['V4.input-extra'], 'modelBinding', mb(d => d.inputIds.push('extra-input')), {exact: [{code: 'REFERENCE', re: /inputIds/}]});
  add('V4.output-missing', ['V4.output-missing'], 'modelBinding', mb(d => d.outputIds.pop()), {exact: [{code: 'REFERENCE', re: /outputIds/}]});
  add('V4.output-extra', ['V4.output-extra'], 'modelBinding', mb(d => d.outputIds.push('extra-output')), {exact: [{code: 'REFERENCE', re: /outputIds/}]});
  add('V4.field-missing.outputIds', ['V4.field-missing'], 'modelBinding', mb(d => { delete d.outputIds; }), {has: [ex('REQUIRED', '/model/outputIds')]});
  add('V4.field-type.inputIds', ['V4.field-type'], 'modelBinding', mb(d => { d.inputIds = 'defect-percent'; }), {has: [ex('TYPE', '/model/inputIds')]});
  add('V4.field-missing.oracle-cases', ['V4.field-missing'], 'oracleBinding', () => { const oracle = mxOracle(); delete oracle.cases; return {oracle, lesson: mxLesson()}; }, {has: [ex('REQUIRED', '/oracle/cases')]});
  add('V4.field-type.oracle-cases', ['V4.field-type'], 'oracleBinding', () => { const oracle = mxOracle(); oracle.cases = 'not-an-array'; return {oracle, lesson: mxLesson()}; }, {has: [ex('TYPE', '/oracle/cases')]});
  add('V4.non-object.declaration', ['V4.non-object'], 'modelBinding', () => ({declaration: null, lesson: mxLesson()}), {exact: [ex('TYPE', '/model')]});
  add('V4.non-object.lesson', ['V4.non-object'], 'modelBinding', () => ({declaration: mxDeclaration(), lesson: null}), {exact: [ex('TYPE', '/lesson')]});
  add('V4.non-object.oracle-binding.oracle', ['V4.non-object'], 'oracleBinding', () => ({oracle: null, lesson: mxLesson()}), {exact: [ex('TYPE', '/oracle')]});
  add('V4.non-object.oracle-binding.lesson', ['V4.non-object'], 'oracleBinding', () => ({oracle: mxOracle(), lesson: null}), {exact: [ex('TYPE', '/lesson')]});
}

// ---- V5: map and bundle with lesson v1/v2 coexisting ----
{
  const mapOf = (lessons, results) => ({kind: 'map', version: 2, profileId: 'profile-a', revision: 1, lessons, results, observations: [], nextPaths: []});
  const base = validBundle();
  const lesson1 = () => clone(base.lesson);
  const lesson2 = () => toV2(base.lesson, 2);
  const resultFor = (resultId, lessonRevision, answer) => { const r = clone(base.result); r.resultId = resultId; r.lessonRevision = lessonRevision; if (answer) r.responses[0].answer = answer; return r; };
  const bundleOf = (lesson, result, map) => reseal({diagnostic: clone(base.diagnostic), lesson, result, map, previousResult: null});
  add('V5.1.lesson-v1.result-v1.duplicate', ['V5.lesson.v1', 'V5.result.v1', 'V5.outcome.duplicate'], 'bundle', () => ({input: validBundle()}), {ok: true, duplicateOf: 'result-a'});
  add('V5.2.lesson-v2.result-v2.conflict', ['V5.lesson.v2', 'V5.result.v2', 'V5.outcome.conflict'], 'bundle', () => {
    const result = resultFor('result-a', 2); const stored = resultFor('result-a', 2, 'Different content');
    return {input: bundleOf(lesson2(), result, reseal(mapOf([lesson2()], [stored])))};
  }, {exact: [ex('CONFLICT', '/result/resultId')]});
  add('V5.3.lesson-v1.map-has-v2-result.ok', ['V5.lesson.v1', 'V5.result.v2', 'V5.outcome.ok'], 'bundle', () => {
    const result = resultFor('result-new', 1, 'A new answer'); const stored = resultFor('result-m', 2);
    return {input: bundleOf(lesson1(), result, reseal(mapOf([lesson1(), lesson2()], [stored])))};
  }, good);
  add('V5.4.c10.bundle-v2-lesson-with-v1-rev1-in-map.ok', ['V5.lesson.v2', 'V5.result.v1', 'V5.outcome.ok'], 'bundle', () => {
    const result = resultFor('result-new', 2, 'A new answer'); const stored = resultFor('result-a', 1);
    return {input: bundleOf(lesson2(), result, reseal(mapOf([lesson1(), lesson2()], [stored])))};
  }, good);
  add('V5.5.c10.map-v1-rev1-and-v2-rev2.result-refs-rev1.ok', ['V5.lesson.v1', 'V5.lesson.v2', 'V5.result.v1', 'V5.outcome.ok'], 'map', () => ({input: reseal(mapOf([lesson1(), lesson2()], [resultFor('result-a', 1)]))}), good);
  add('V5.6.map-v1-and-v2.results-ref-both.ok', ['V5.result.v1', 'V5.result.v2', 'V5.outcome.ok'], 'map', () => ({input: reseal(mapOf([lesson1(), lesson2()], [resultFor('result-a', 1), resultFor('result-m', 2, 'Another answer')]))}), good);
  add('V5.7.map-duplicate-v2-lesson.duplicate', ['V5.lesson.v2', 'V5.outcome.duplicate'], 'map', () => ({input: reseal(mapOf([lesson2(), lesson2()], []))}), {exact: [ex('DUPLICATE', '/lessons/1/lessonId')]});
  add('V5.8.lesson-v2-content-conflict', ['V5.lesson.v2', 'V5.outcome.conflict'], 'bundle', () => {
    const stored = lesson2(); stored.concepts[0].label = 'Different label';
    return {input: bundleOf(lesson2(), resultFor('result-new', 2), reseal(mapOf([stored], [])))};
  }, {exact: [ex('CONFLICT', '/lesson/lessonRevision')]});
}

// ---- V8: hostile inputs in new v2 fields and oracle cases ----
{
  class Plain { }
  const locations = {
    outputs: {surface: 'lesson', make: mxLesson, owner: d => d.outputs[0], ownerPath: '/outputs/0', getter: d => [d.outputs[0], 'label'], getterPath: '/outputs/0/label', array: d => [d, 'outputs'], arrayPath: '/outputs', item: (d, i) => ({...clone(d.outputs[0]), outputId: `output-${i}`}), replaceOwner: (d, v) => { d.outputs[0] = v; }},
    scenarios: {surface: 'lesson', make: mxLesson, owner: d => d.scenarios[0], ownerPath: '/scenarios/0', getter: d => [d.scenarios[0].values[0], 'value'], getterPath: '/scenarios/0/values/0/value', array: d => [d, 'scenarios'], arrayPath: '/scenarios', item: (d, i) => ({...clone(d.scenarios[0]), scenarioId: `scenario-${i}`}), replaceOwner: (d, v) => { d.scenarios[0] = v; }},
    transfer: {surface: 'lesson', make: mxLesson, owner: d => d.transfer, ownerPath: '/transfer', getter: d => [d.transfer.tolerances[0], 'absolute'], getterPath: '/transfer/tolerances/0/absolute', cycleOwner: d => d.transfer.tolerances[0], cyclePath: '/transfer/tolerances/0/extra', array: d => [d.transfer, 'tolerances'], arrayPath: '/transfer/tolerances', item: (d, i) => ({...clone(d.transfer.tolerances[0]), outputId: `output-${i}`}), replaceOwner: (d, v) => { d.transfer = v; }},
    oracle: {surface: 'oracle', make: mxOracle, owner: d => d.cases[0], ownerPath: '/cases/0', getter: d => [d.cases[0].expected[0], 'value'], getterPath: '/cases/0/expected/0/value', array: d => [d, 'cases'], arrayPath: '/cases', item: (d, i) => ({...clone(d.cases[0]), caseId: `case-${i}`}), replaceOwner: (d, v) => { d.cases[0] = v; }},
  };
  const kinds = {
    getter: {apply: (loc, d, calls) => { const [parent, key] = loc.getter(d); Object.defineProperty(parent, key, {enumerable: true, get() { calls.n++; return SECRET; }}); }, expect: loc => ({exact: [ex('TYPE', loc.getterPath)]})},
    symbol: {apply: (loc, d) => { loc.owner(d)[Symbol('hostile')] = SECRET; }, expect: loc => ({exact: [ex('TYPE', loc.ownerPath)]})},
    cycle: {apply: (loc, d) => { const o = (loc.cycleOwner ?? loc.owner)(d); o.extra = o; }, expect: loc => ({exact: [ex('TYPE', loc.cyclePath ?? `${loc.ownerPath}/extra`)]})},
    depth: {apply: (loc, d) => { let cur = loc.owner(d); for (let i = 0; i < 40; i++) { cur.extra = {}; cur = cur.extra; } }, expect: loc => ({has: [un('LIMIT', `${loc.ownerPath}/extra`)]})},
    length: {apply: (loc, d) => { const [parent, key] = loc.array(d); parent[key] = Array.from({length: 1001}, (_, i) => loc.item(d, i)); }, expect: loc => ({exact: [ex('LIMIT', loc.arrayPath)]})},
    'non-plain': {apply: (loc, d) => { loc.replaceOwner(d, Object.assign(new Plain(), clone(loc.owner(d)))); }, expect: loc => ({exact: [ex('TYPE', loc.ownerPath)]})},
  };
  for (const [kind, k] of Object.entries(kinds)) for (const [name, loc] of Object.entries(locations)) {
    add(`V8.${kind}.${name}`, [`V8.${kind}`], loc.surface, () => { const calls = {n: 0}; const doc = loc.make(); k.apply(loc, doc, calls); return {input: doc, calls: () => calls.n}; }, k.expect(loc));
  }
  const bindingGetter = (id, surface, build, path) => {
    add(id, ['V8.getter'], surface, () => { const calls = {n: 0}; const input = build(calls); return {input, calls: () => calls.n}; }, {has: [{code: 'TYPE', re: path}]});
  };
  const trap = calls => ({enumerable: true, get() { calls.n++; return SECRET; }});
  bindingGetter('V8.getter.model-binding.declaration', 'modelBinding', calls => { const declaration = mxDeclaration(); Object.defineProperty(declaration, 'outputIds', trap(calls)); return {declaration, lesson: mxLesson()}; }, /outputIds/);
  bindingGetter('V8.getter.model-binding.lesson', 'modelBinding', calls => { const lesson = mxLesson(); Object.defineProperty(lesson.outputs[0], 'outputId', trap(calls)); return {declaration: mxDeclaration(), lesson}; }, /outputs\/0\/outputId/);
  bindingGetter('V8.getter.oracle-binding.oracle', 'oracleBinding', calls => { const oracle = mxOracle(); Object.defineProperty(oracle.cases[0].expected[0], 'value', trap(calls)); return {oracle, lesson: mxLesson()}; }, /cases\/0\/expected\/0\/value/);
  bindingGetter('V8.getter.bundle.lesson-v2', 'bundle', calls => { const b = validBundle(); b.lesson = toV2(b.lesson); b.map = {kind: 'map', version: 2, profileId: 'profile-a', revision: 1, lessons: [], results: [], observations: [], nextPaths: []}; Object.defineProperty(b.lesson.outputs[0], 'label', trap(calls)); return b; }, /^\/lesson\/outputs\/0\/label$/);
  add('V8.symbol.model-binding.declaration', ['V8.symbol'], 'modelBinding', () => { const declaration = mxDeclaration(); declaration[Symbol('hostile')] = SECRET; return {input: {declaration, lesson: mxLesson()}}; }, {has: [{code: 'TYPE', re: /^\/model$/}]});
  add('V8.symbol.oracle-binding.oracle', ['V8.symbol'], 'oracleBinding', () => { const oracle = mxOracle(); oracle.cases[0][Symbol('hostile')] = SECRET; return {input: {oracle, lesson: mxLesson()}}; }, {has: [{code: 'TYPE', re: /^\/oracle$|\/cases\/0$/}]});
}

// ---- T5-4 (spec 7e3b1a94c2d05f68 v1): diagnostic v2 `reactions`. Expected values are written from the spec Cases, not from contracts/. ----
export const reactionOf = (round, candidateId, reaction, askedBack = null) => ({round, candidateId, reaction, askedBack});
// The base diagnostic has one final-round candidate, `candidate-a` (validBundle). Round 1 names a candidate that is no longer in the document (A1).
// T5-4 concept ladder (spec 5a2c9e7d1b4f8036 v1): v2 now requires `ladder` (R4, no migration), so the default v2 document carries a valid one (C1).
export const ladderItem = (step, conceptId, answer, askedBack = null) => ({step, conceptId, label: `${conceptId} 라벨`, answer, askedBack});
export const defaultLadder = () => [ladderItem(1, 'concept-low', 'known'), ladderItem(2, 'concept-mid', 'vague', '이 개념은 무엇인가요?'), ladderItem(3, 'concept-high', 'unknown')];
export const diagV2 = (reactions = [reactionOf(1, 'candidate-x', 'surprising', '이 개념이 무엇인가요?'), reactionOf(2, 'candidate-a', 'similar', null)], ladder = defaultLadder()) => ({...clone(validBundle().diagnostic), version: 2, reactions, ladder});
export const diagV1 = () => clone(validBundle().diagnostic);
const at54 = (id, items, build, expect) => add(id, items, 'diagnostic', build, expect);
const fieldCase = (id, item, mutate, expect) => at54(id, [item], () => { const d = diagV2([reactionOf(2, 'candidate-a', 'similar', null)]); mutate(d.reactions[0], d); return d; }, expect);
{
  // O1 (C1, C2, C14, C5, C6, C8-C11): classification tree + two-value boundaries.
  at54('T54-O1.v2-valid', ['T54-O1.version.2', 'T54-O1.round.valid', 'T54-O1.askedBack.string', 'T54-O1.askedBack.null'], () => diagV2(), good);
  at54('T54-O1.v1-valid', ['T54-O1.version.1'], diagV1, good);
  at54('T54-O1.version-3', ['T54-O1.version.3'], () => ({...diagV2(), version: 3}), {has: [ex('VERSION', '/version')]});
  at54('T54-O1.v1-with-reactions', ['T54-O1.presence.v1-with-reactions'], () => ({...diagV1(), reactions: [reactionOf(2, 'candidate-a', 'similar')]}), {has: [ex('UNKNOWN_FIELD', '/reactions')]});
  at54('T54-O1.v2-without-reactions', ['T54-O1.presence.v2-without-reactions'], () => { const d = diagV2(); delete d.reactions; return d; }, {has: [ex('REQUIRED', '/reactions')]});
  at54('T54-O1.reactions-empty', ['T54-O1.reactions.len0'], () => diagV2([]), {has: [ex('RANGE', '/reactions')]});
  at54('T54-O1.reactions-one', ['T54-O1.reactions.len1'], () => diagV2([reactionOf(1, 'candidate-a', 'unknown')]), good);
  for (const [name, value, code] of [['0', 0, 'RANGE'], ['3', 3, 'RANGE'], ['1.5', 1.5, 'VALUE'], ['string-1', '1', 'TYPE']]) {
    fieldCase(`T54-O1.round-${name}`, `T54-O1.round.invalid-${name}`, r => { r.round = value; }, {has: [ex(code, '/reactions/0/round')]});
  }
  for (const round of [1, 2]) fieldCase(`T54-O1.round-valid-${round}`, 'T54-O1.round.valid', r => { r.round = round; }, good);
  for (const value of ['similar', 'surprising', 'unknown', 'not-applicable']) fieldCase(`T54-O1.reaction-${value}`, 'T54-O1.reaction.valid', r => { r.reaction = value; }, good);
  fieldCase('T54-O1.reaction-outside', 'T54-O1.reaction.invalid', r => { r.reaction = 'maybe'; }, {has: [ex('VALUE', '/reactions/0/reaction')]});
  fieldCase('T54-O1.askedBack-string', 'T54-O1.askedBack.string', r => { r.askedBack = '무슨 뜻인가요?'; }, good);
  fieldCase('T54-O1.askedBack-null', 'T54-O1.askedBack.null', r => { r.askedBack = null; }, good);
  fieldCase('T54-O1.askedBack-number', 'T54-O1.askedBack.invalid-number', r => { r.askedBack = 7; }, {has: [ex('TYPE', '/reactions/0/askedBack')]});
  fieldCase('T54-O1.askedBack-missing', 'T54-O1.askedBack.invalid-missing', r => { delete r.askedBack; }, {has: [ex('REQUIRED', '/reactions/0/askedBack')]});
  fieldCase('T54-O1.unknown-key', 'T54-O1.unknownKey.invalid', r => { r.extra = true; }, {has: [ex('UNKNOWN_FIELD', '/reactions/0/extra')]});
  // C8: three candidates, all four reaction values; (round, candidateId) is the identity, so one candidate may appear in two rounds.
  at54('T54-O1.three-candidates-four-values', ['T54-O1.reaction.all-four'], () => {
    const d = diagV2([reactionOf(1, 'cand-a', 'similar'), reactionOf(1, 'cand-b', 'surprising'), reactionOf(1, 'cand-c', 'unknown'), reactionOf(2, 'cand-a', 'not-applicable')]);
    d.candidates = ['cand-a', 'cand-b', 'cand-c'].map(candidateId => ({...d.candidates[0], candidateId}));
    d.selection = 'cand-a'; d.hypotheses = [{...d.hypotheses[0], candidateId: 'cand-a'}];
    return d;
  }, good);

  // O2 (C7, C12, C13, C18, C19, C20): decision table over {duplicate pair, max-round reference, lower-round reference/format, selection null}.
  at54('T54-O2.dup-pair', ['T54-O2.row1.duplicate-pair'], () => diagV2([reactionOf(1, 'candidate-a', 'similar'), reactionOf(1, 'candidate-a', 'unknown')]), {exact: [ex('DUPLICATE', '/reactions/1')]});
  at54('T54-O2.same-candidate-other-round', ['T54-O2.row1.duplicate-pair'], () => diagV2([reactionOf(1, 'candidate-a', 'similar'), reactionOf(2, 'candidate-a', 'unknown')]), good);
  at54('T54-O2.max-round-unknown-candidate', ['T54-O2.row2.max-round-reference'], () => diagV2([reactionOf(1, 'candidate-x', 'similar'), reactionOf(2, 'ghost', 'unknown')]), {exact: [ex('REFERENCE', '/reactions/1/candidateId')]});
  at54('T54-O2.single-max-round-member', ['T54-O2.row3.only-max-round'], () => diagV2([reactionOf(1, 'candidate-a', 'similar')]), good);
  at54('T54-O2.single-max-round-nonmember', ['T54-O2.row3.only-max-round'], () => diagV2([reactionOf(1, 'ghost', 'similar')]), {exact: [ex('REFERENCE', '/reactions/0/candidateId')]});
  at54('T54-O2.lower-round-nonmember', ['T54-O2.row4.lower-round-valid-id'], () => diagV2([reactionOf(1, 'candidate-x', 'similar'), reactionOf(2, 'candidate-a', 'similar')]), good);
  at54('T54-O2.lower-round-bad-format', ['T54-O2.row5.lower-round-bad-id'], () => diagV2([reactionOf(1, 'Bad Id', 'similar'), reactionOf(2, 'candidate-a', 'similar')]), {has: [{code: ['VALUE', 'TYPE'], path: '/reactions/0/candidateId'}]});
  at54('T54-O2.selection-null', ['T54-O2.row6.selection-null'], () => { const d = diagV2(); d.selection = null; d.confirmation = 'deferred'; return d; }, good);
}

// ---- T5-4 concept ladder (spec 5a2c9e7d1b4f8036 v1). Expected codes are written from the spec Cases and the existing array/integer conventions
// (below min RANGE, above max LIMIT, non-integer VALUE, wrong type TYPE), not from contracts/. ----
const at54L = (id, items, build, expect) => add(id, items, 'diagnostic', build, expect);
const withLadder = ladder => { const d = diagV2(); d.ladder = ladder; return d; };
// Every item-level rule applies to each ladder item, so each invalid-field row runs twice: alone at index 0 and as the third item of a valid 3-item ladder (index 2).
const atIndex2 = expect => ({has: expect.has.map(m => ({...m, path: m.path.replace('/ladder/0/', '/ladder/2/')}))});
const ladderField = (id, item, mutate, expect) => {
  at54L(id, [item], () => { const d = withLadder([ladderItem(1, 'concept-a', 'known', null)]); mutate(d.ladder[0], d); return d; }, expect);
  at54L(`${id}@2`, [`${item}@2`], () => { const d = withLadder([ladderItem(1, 'concept-a', 'known', null), ladderItem(2, 'concept-b', 'vague', null), ladderItem(3, 'concept-c', 'unknown', null)]); mutate(d.ladder[2], d); return d; }, atIndex2(expect));
};
const stepsOf = steps => steps.map((step, i) => ladderItem(step, `concept-${i}`, 'known'));
{
  // O1 (C1, C3, C4, C5, C7, C8, C9, C11, C12, C15): classification tree + two-value boundaries.
  at54L('T54L-O1.v2-ladder-valid', ['T54L-O1.presence.v2-with', 'T54L-O1.answer.known', 'T54L-O1.answer.vague', 'T54L-O1.answer.unknown', 'T54L-O1.askedBack.string', 'T54L-O1.askedBack.null', 'T54L-O1.step.valid', 'T54L-O1.conceptId.valid', 'T54L-O1.label.valid'], () => diagV2(), good);
  at54L('T54L-O1.v1-no-ladder', ['T54L-O1.presence.v1-without'], diagV1, good);
  at54L('T54L-O1.v1-with-ladder', ['T54L-O1.presence.v1-with'], () => ({...diagV1(), ladder: defaultLadder()}), {has: [ex('UNKNOWN_FIELD', '/ladder')]});
  at54L('T54L-O1.v2-without-ladder', ['T54L-O1.presence.v2-without'], () => { const d = diagV2(); delete d.ladder; return d; }, {has: [ex('REQUIRED', '/ladder')]});
  at54L('T54L-O1.len-0', ['T54L-O1.len.0'], () => withLadder([]), {has: [ex('RANGE', '/ladder')]});
  at54L('T54L-O1.len-1', ['T54L-O1.len.1'], () => withLadder(stepsOf([1])), good);
  at54L('T54L-O1.len-5', ['T54L-O1.len.5'], () => withLadder(stepsOf([1, 2, 3, 4, 5])), good);
  at54L('T54L-O1.len-6', ['T54L-O1.len.6'], () => withLadder(stepsOf([1, 2, 3, 4, 5, 5])), {has: [ex('LIMIT', '/ladder')]});
  ladderField('T54L-O1.step-1.5', 'T54L-O1.step.invalid-1.5', i => { i.step = 1.5; }, {has: [ex('VALUE', '/ladder/0/step')]});
  ladderField('T54L-O1.step-string', 'T54L-O1.step.invalid-string-1', i => { i.step = '1'; }, {has: [ex('TYPE', '/ladder/0/step')]});
  ladderField('T54L-O1.conceptId-bad-format', 'T54L-O1.conceptId.invalid', i => { i.conceptId = 'Bad Id'; }, {has: [{code: ['VALUE', 'TYPE'], path: '/ladder/0/conceptId'}]});
  ladderField('T54L-O1.label-missing', 'T54L-O1.label.invalid-missing', i => { delete i.label; }, {has: [ex('REQUIRED', '/ladder/0/label')]});
  ladderField('T54L-O1.answer-outside', 'T54L-O1.answer.invalid', i => { i.answer = 'maybe'; }, {has: [ex('VALUE', '/ladder/0/answer')]});
  ladderField('T54L-O1.askedBack-number', 'T54L-O1.askedBack.invalid-number', i => { i.askedBack = 7; }, {has: [ex('TYPE', '/ladder/0/askedBack')]});
  ladderField('T54L-O1.askedBack-missing', 'T54L-O1.askedBack.invalid-missing', i => { delete i.askedBack; }, {has: [ex('REQUIRED', '/ladder/0/askedBack')]});
  ladderField('T54L-O1.unknown-key', 'T54L-O1.unknownKey.invalid', i => { i.extra = true; }, {has: [ex('UNKNOWN_FIELD', '/ladder/0/extra')]});
  at54L('T54L-O1.all-known', ['T54L-O1.answers.all-known'], () => withLadder([ladderItem(1, 'concept-a', 'known'), ladderItem(2, 'concept-b', 'known'), ladderItem(3, 'concept-c', 'known')]), good);
  at54L('T54L-O1.all-unknown', ['T54L-O1.answers.all-unknown'], () => withLadder([ladderItem(1, 'concept-a', 'unknown'), ladderItem(2, 'concept-b', 'unknown'), ladderItem(3, 'concept-c', 'unknown')]), good);

  // O2 (C6, C10, C14): classification tree + two-value boundaries on step, semantic duplicates, A1 (no continuity / order check).
  for (const [step, code] of [[0, 'RANGE'], [1, null], [5, null], [6, 'RANGE']]) {
    at54L(`T54L-O2.step-${step}`, [`T54L-O2.step.${step}`], () => withLadder(stepsOf([step])), code ? {has: [ex(code, '/ladder/0/step')]} : good);
    at54L(`T54L-O2.step-${step}@2`, [`T54L-O2.step.${step}@2`], () => withLadder([ladderItem(2, 'concept-a', 'known'), ladderItem(3, 'concept-b', 'vague'), ladderItem(step, 'concept-c', 'unknown')]), code ? {has: [ex(code, '/ladder/2/step')]} : good);
  }
  at54L('T54L-O2.dup-step', ['T54L-O2.dup.step'], () => withLadder([ladderItem(2, 'concept-a', 'known'), ladderItem(2, 'concept-b', 'unknown')]), {exact: [ex('DUPLICATE', '/ladder/1')]});
  at54L('T54L-O2.dup-conceptId', ['T54L-O2.dup.conceptId'], () => withLadder([ladderItem(1, 'concept-a', 'known'), ladderItem(2, 'concept-a', 'unknown')]), {exact: [ex('DUPLICATE', '/ladder/1')]});
  at54L('T54L-O2.non-contiguous', ['T54L-O2.order.non-contiguous'], () => withLadder(stepsOf([1, 3, 5])), good);
  at54L('T54L-O2.reverse-order', ['T54L-O2.order.reverse'], () => withLadder(stepsOf([5, 3, 1])), good);
}
