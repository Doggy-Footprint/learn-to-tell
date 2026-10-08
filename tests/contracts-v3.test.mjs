import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument, validateBundle} from '../contracts/index.mjs';
import {validateModelBinding, validateOracleBinding} from '../contracts/model.mjs';
import {validBundle, clone, good} from './fixtures/contracts/cases.mjs';
import {reseal} from './fixtures/contracts/hash-oracle.mjs';
import {toV2, toV3} from './fixtures/contracts-v3/lessons.mjs';
import {lessonF1, lessonF2, oracleF1, oracleF2} from './fixtures/learning/v3.mjs';
import {model as modelF1} from './fixtures/learning/synthetic-model-v3.mjs';
import {model as modelF2} from './fixtures/learning/synthetic-model-v3-min.mjs';
import {lessonV2OfF1} from './fixtures/authoring/models-v3.mjs';

// Spec 0dcd8454f6e5111d v1. Every expected code and path is written from R1-R3 / the Signatures, not from validator output.
const EPS = 0.01;
const f1 = () => clone(lessonF1);
const validate = lesson => validateDocument(lesson, 'lesson');
const err = (code, path) => ({code, path});
const only = (code, path) => ({ok: false, errors: [err(code, path)]});
const declarationOf = model => { const {calculate: _c, ...rest} = model; return rest; };
// load-b: domain 0..50, practical 5..30 (width 25), default 10, step 2
const IN = 1;
const inputPath = field => `/inputs/${IN}/${field}`;
const edit = fn => { const l = f1(); fn(l, l.inputs[IN]); return l; };

// ---- controls: both synthetic fixtures are valid v3 lessons
test('[F4-V1.control] the synthetic v3 fixtures F1 and F2 are valid lesson documents', () => {
  assert.deepEqual(validate(f1()), good);
  assert.deepEqual(validate(clone(lessonF2)), good);
  assert.equal(lessonF1.version, 3);
});

// ---- V1 boundary value analysis (2-value) + equivalence partitioning on inputs[]
const V1_CASES = [
  ['practical.min = min', (l, i) => { i.practical.min = i.min; }, good],
  ['practical.min = min - 0.01', (l, i) => { i.practical.min = i.min - EPS; }, only('RANGE', inputPath('practical/min'))],
  ['practical.max = max', (l, i) => { i.practical.max = i.max; }, good],
  ['practical.max = max + 0.01', (l, i) => { i.practical.max = i.max + EPS; }, only('RANGE', inputPath('practical/max'))],
  ['default = practical.min', (l, i) => { i.default = i.practical.min; }, good],
  ['default = practical.min - 0.01', (l, i) => { i.default = i.practical.min - EPS; }, only('RANGE', inputPath('default'))],
  ['default = practical.max', (l, i) => { i.default = i.practical.max; }, good],
  ['default = practical.max + 0.01', (l, i) => { i.default = i.practical.max + EPS; }, only('RANGE', inputPath('default'))],
  ['step = practical width', (l, i) => { i.step = i.practical.max - i.practical.min; }, good],
  ['step = practical width + 0.01', (l, i) => { i.step = i.practical.max - i.practical.min + EPS; }, only('RANGE', inputPath('step'))],
  ['step = 0', (l, i) => { i.step = 0; }, only('RANGE', inputPath('step'))],
  ['step = -1', (l, i) => { i.step = -1; }, only('RANGE', inputPath('step'))],
  ['label valid', (l, i) => { i.label = '다른 이름'; }, good],
  ['label blank', (l, i) => { i.label = '  '; }, only('VALUE', inputPath('label'))],
  ['label number', (l, i) => { i.label = 5; }, only('TYPE', inputPath('label'))],
  ['label missing', (l, i) => { delete i.label; }, only('REQUIRED', inputPath('label'))],
  ['basis valid', (l, i) => { i.practical.basis = '다른 근거'; }, good],
  ['basis blank', (l, i) => { i.practical.basis = '  '; }, only('VALUE', inputPath('practical/basis'))],
  ['basis number', (l, i) => { i.practical.basis = 5; }, only('TYPE', inputPath('practical/basis'))],
  ['basis missing', (l, i) => { delete i.practical.basis; }, only('REQUIRED', inputPath('practical/basis'))],
];
for (const [name, mutate, expected] of V1_CASES) test(`[F4-V1.${name}] validateDocument(lesson v3) ${expected.ok ? 'accepts' : 'rejects with the exact code and path'}`, () => {
  const lesson = edit(mutate);
  assert.deepEqual(validate(lesson), expected);
});

// practical width {> 0 (the F1 default), = 0}: min >= max is RANGE at practical/max. With width 0 the step rule of R2 also holds (step > 0 = width),
// so the failing set is bounded to those two rule outcomes rather than pinned to one of them.
test('[F4-V1.practical width = 0] practical.min = practical.max is RANGE at practical/max', () => {
  const lesson = edit((l, i) => { i.practical.min = 10; i.practical.max = 10; });
  const result = validate(lesson);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.code === 'RANGE' && e.path === inputPath('practical/max')), JSON.stringify(result.errors));
  const allowed = [err('RANGE', inputPath('practical/max')), err('RANGE', inputPath('step'))];
  for (const e of result.errors) assert.ok(allowed.some(a => a.code === e.code && a.path === e.path), JSON.stringify(e));
});
// caption (visuals[0].caption) {valid, blank, number, missing}
const CAPTION = '/visuals/0/caption';
for (const [name, mutate, expected] of [
  ['caption valid', v => { v.caption = '다른 제목'; }, good],
  ['caption blank', v => { v.caption = '  '; }, only('VALUE', CAPTION)],
  ['caption number', v => { v.caption = 5; }, only('TYPE', CAPTION)],
  ['caption missing', v => { delete v.caption; }, only('REQUIRED', CAPTION)],
]) test(`[F4-V1.${name}] validateDocument(lesson v3) caption`, () => {
  const lesson = f1();
  mutate(lesson.visuals[0]);
  assert.deepEqual(validate(lesson), expected);
});

test('[F4-V1.C6 boundary valid] practical = domain and step = practical width is valid', () => {
  const lesson = edit((l, i) => { i.practical.min = i.min; i.practical.max = i.max; i.step = i.max - i.min; });
  assert.deepEqual(validate(lesson), good);
});
test('[F4-V1.v2 + label] a v2 lesson carrying label on an input is UNKNOWN_FIELD at that field', () => {
  const lesson = lessonV2OfF1();
  assert.deepEqual(validate(lesson), good);
  lesson.inputs[0].label = '부하 A';
  assert.deepEqual(validate(lesson), only('UNKNOWN_FIELD', '/inputs/0/label'));
});

// ---- V2 decision table on visuals[]
const visualsEdit = fn => { const l = f1(); fn(l.visuals, l); return l; };
const V2_ROWS = [
  ['visuals 0', v => { v.length = 0; }, only('RANGE', '/visuals')],
  ['duplicate visualId', v => { v[1].visualId = v[0].visualId; }, only('DUPLICATE', '/visuals/1/visualId')],
  ['sweep x inputId null', v => { v[0].inputId = null; }, only('STATE', '/visuals/0/inputId')],
  ['sweep x inputId existing', v => { v[0].inputId = 'load-b'; }, good],
  ['sweep x inputId missing', v => { v[0].inputId = 'ghost-input'; }, only('REFERENCE', '/visuals/0/inputId')],
  ['composition x inputId null', v => { v[2].inputId = null; }, good],
  ['composition x inputId non-null', v => { v[2].inputId = 'load-a'; }, only('STATE', '/visuals/2/inputId')],
  ['outputId missing', v => { v[0].outputIds[1] = 'ghost-output'; }, only('REFERENCE', '/visuals/0/outputIds/1')],
  ['outputId duplicate', v => { v[0].outputIds = ['part-a', 'part-a']; }, only('DUPLICATE', '/visuals/0/outputIds/1')],
  ['unit mix', v => { v[0].outputIds = ['part-a', 'fill-b']; }, only('STATE', '/visuals/0/outputIds')],
  ['composition one output', v => { v[2].outputIds = ['part-a']; }, only('RANGE', '/visuals/2/outputIds')],
  ['composition nullable output', v => { v[2].outputIds = ['fill-b', 'margin']; }, only('STATE', '/visuals/2/outputIds/1')],
  ['valid sweep', v => { v[1].outputIds = ['fill-b', 'margin']; }, good],
  ['valid composition', v => { v[2].outputIds = ['part-a', 'part-b', 'total']; }, good],
];
for (const [name, mutate, expected] of V2_ROWS) test(`[F4-V2.${name}] validateDocument(lesson v3) visuals rule row`, () => {
  assert.deepEqual(validate(visualsEdit(mutate)), expected);
});
// ---- V3: lesson version partition {2, 3, 1, 4} over the contract surfaces. Expected outcomes are the v2 outcomes.
const base = () => validBundle();
const lesson3Of = toV3;
const mapOf = (lessons, results) => ({kind: 'map', version: 2, profileId: 'profile-a', revision: 1, lessons, results, observations: [], nextPaths: []});
const resultFor = (resultId, lessonRevision, answer) => { const r = clone(base().result); r.resultId = resultId; r.lessonRevision = lessonRevision; if (answer) r.responses[0].answer = answer; return r; };
const bundleOf = (lesson, result, map) => reseal({diagnostic: clone(base().diagnostic), lesson, result, map, previousResult: null});
const withLesson = (make, revision = 1) => {
  const b = base();
  const l = make(b.lesson, revision);
  b.lesson = l;
  b.map.lessons = [clone(l)];
  return reseal(b);
};
const lessonOfVersion = { 2: (v1, r) => toV2(v1, r), 3: lesson3Of };

test('[F4-V3.control] the generic v3 lesson helper is a valid lesson', () => {
  assert.deepEqual(validate(lesson3Of(base().lesson, 1)), good);
});

for (const version of [2, 3]) {
  test(`[F4-V3.map v${version}] a map holding a v${version} lesson is valid, results referencing it included`, () => {
    const lesson = lessonOfVersion[version](base().lesson, 2);
    assert.deepEqual(validateDocument(reseal(mapOf([clone(base().lesson), lesson], [resultFor('result-a', 1), resultFor('result-m', 2, 'Another answer')])), 'map'), good);
  });
}
test('[F4-V3.map v1] a map holding only a v1 lesson stays valid', () => {
  assert.deepEqual(validateDocument(reseal(mapOf([clone(base().lesson)], [resultFor('result-a', 1)])), 'map'), good);
});
test('[F4-V3.map v4] a map holding a lesson of version 4 is VERSION at that lesson', () => {
  const lesson = lesson3Of(base().lesson, 1);
  lesson.version = 4;
  assert.deepEqual(validateDocument(mapOf([lesson], []), 'map'), only('VERSION', '/lessons/0/version'));
});
test('[F4-V3.map v3 R2 violation] one practical.min below min inside a map lesson is RANGE under /lessons/0', () => {
  const lesson = lesson3Of(base().lesson, 1);
  lesson.inputs[0].practical.min = lesson.inputs[0].min - EPS;
  assert.deepEqual(validateDocument(mapOf([lesson], []), 'map'), only('RANGE', '/lessons/0/inputs/0/practical/min'));
});

// result import contract (validateBundle): v3 behaves as v2 for duplicate / conflict / ok
test('[F4-V3.bundle duplicate] v3 lesson with the result already in the map: same outcome as v2', () => {
  const v2 = validateBundle(withLesson(lessonOfVersion[2]));
  const v3 = validateBundle(withLesson(lessonOfVersion[3]));
  assert.deepEqual(v2, {ok: true, errors: [], duplicateOf: 'result-a'});
  assert.deepEqual(v3, v2);
});
test('[F4-V3.bundle ok] v3 lesson, new result next to an older v1 result in the map: ok', () => {
  const make = lessonOf => {
    const lesson = lessonOf(base().lesson, 2);
    return validateBundle(bundleOf(lesson, resultFor('result-new', 2, 'A new answer'), reseal(mapOf([clone(base().lesson), clone(lesson)], [resultFor('result-a', 1)]))));
  };
  assert.deepEqual(make(lessonOfVersion[2]), good);
  assert.deepEqual(make(lessonOfVersion[3]), good);
});
test('[F4-V3.bundle conflict] v3 lesson: same resultId with different content is CONFLICT at /result/resultId, as for v2', () => {
  const make = lessonOf => {
    const lesson = lessonOf(base().lesson, 2);
    return validateBundle(bundleOf(lesson, resultFor('result-a', 2), reseal(mapOf([clone(lesson)], [resultFor('result-a', 2, 'Different content')]))));
  };
  assert.deepEqual(make(lessonOfVersion[2]), only('CONFLICT', '/result/resultId'));
  assert.deepEqual(make(lessonOfVersion[3]), only('CONFLICT', '/result/resultId'));
});
test('[F4-V3.bundle lesson content conflict] a v3 lesson that differs from the map copy of the same revision is CONFLICT at /lesson/lessonRevision', () => {
  const stored = lesson3Of(base().lesson, 2);
  stored.concepts[0].label = 'Different label';
  const lesson = lesson3Of(base().lesson, 2);
  assert.deepEqual(validateBundle(bundleOf(lesson, resultFor('result-new', 2), reseal(mapOf([stored], [])))), only('CONFLICT', '/lesson/lessonRevision'));
});
test('[F4-V3.bundle v1] a v1 lesson bundle is still accepted (duplicate outcome)', () => {
  assert.deepEqual(validateBundle(validBundle()), {ok: true, errors: [], duplicateOf: 'result-a'});
});
test('[F4-V3.bundle v4] a lesson of version 4 is VERSION at /lesson/version', () => {
  const b = withLesson(lesson3Of);
  b.lesson.version = 4;
  b.map.lessons = [];
  const r = validateBundle(reseal(b));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => e.code === 'VERSION' && e.path === '/lesson/version'), JSON.stringify(r.errors));
});
test('[F4-V3.bundle v3 R2 violation] practical.max above max in the bundle lesson is RANGE at /lesson/inputs/0/practical/max', () => {
  const b = withLesson(lesson3Of);
  b.lesson.inputs[0].practical.max = b.lesson.inputs[0].max + EPS;
  b.map.lessons = [];
  const r = validateBundle(reseal(b));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => e.code === 'RANGE' && e.path === '/lesson/inputs/0/practical/max'), JSON.stringify(r.errors));
});

// model binding and oracle binding: lesson intake accepts versions 2 and 3, anything else is VERSION /lesson/version
const declF1 = () => declarationOf(modelF1);
const v2OfF1 = () => lessonV2OfF1();
for (const [name, make, accepted] of [
  ['v2', v2OfF1, true],
  ['v3', f1, true],
  ['v1', () => ({...v2OfF1(), version: 1}), false],
  ['v4', () => ({...f1(), version: 4}), false],
]) {
  test(`[F4-V3.validateModelBinding ${name}] ${accepted ? 'accepted' : 'VERSION /lesson/version'}`, () => {
    const r = validateModelBinding(declF1(), make());
    if (accepted) assert.deepEqual(r, good);
    else {
      assert.equal(r.ok, false);
      assert.ok(r.errors.some(e => e.code === 'VERSION' && e.path === '/lesson/version'), JSON.stringify(r.errors));
    }
  });
  test(`[F4-V3.validateOracleBinding ${name}] ${accepted ? 'accepted' : 'VERSION /lesson/version'}`, () => {
    const r = validateOracleBinding(clone(oracleF1), make());
    if (accepted) assert.deepEqual(r, good);
    else {
      assert.equal(r.ok, false);
      assert.ok(r.errors.some(e => e.code === 'VERSION' && e.path === '/lesson/version'), JSON.stringify(r.errors));
    }
  });
}
test('[F4-V3.binding F2] the minimal v3 fixture binds to its model and oracle', () => {
  assert.deepEqual(validateModelBinding(declarationOf(modelF2), clone(lessonF2)), good);
  assert.deepEqual(validateOracleBinding(clone(oracleF2), clone(lessonF2)), good);
  assert.deepEqual(validateDocument(clone(oracleF1), 'oracle'), good);
});

// ---- V1 (F5): required fields, types and unknown fields of lesson v3. The wrong-type values follow the contract field types of the Signatures
// (number -> 'invalid', id / string / enum -> 0, nullable id / array / object -> false).
const STRUCT = [
  ['visuals', '/visuals', l => { delete l.visuals; }, l => { l.visuals = false; }],
  ['inputs[1].step', '/inputs/1/step', l => { delete l.inputs[1].step; }, l => { l.inputs[1].step = 'invalid'; }],
  ['inputs[1].practical', '/inputs/1/practical', l => { delete l.inputs[1].practical; }, l => { l.inputs[1].practical = false; }],
  ['practical.min', '/inputs/1/practical/min', l => { delete l.inputs[1].practical.min; }, l => { l.inputs[1].practical.min = 'invalid'; }],
  ['practical.max', '/inputs/1/practical/max', l => { delete l.inputs[1].practical.max; }, l => { l.inputs[1].practical.max = 'invalid'; }],
  ['visuals[0].visualId', '/visuals/0/visualId', l => { delete l.visuals[0].visualId; }, l => { l.visuals[0].visualId = 0; }],
  ['visuals[0].kind', '/visuals/0/kind', l => { delete l.visuals[0].kind; }, l => { l.visuals[0].kind = 0; }],
  ['visuals[0].inputId', '/visuals/0/inputId', l => { delete l.visuals[0].inputId; }, l => { l.visuals[0].inputId = false; }],
  ['visuals[0].outputIds', '/visuals/0/outputIds', l => { delete l.visuals[0].outputIds; }, l => { l.visuals[0].outputIds = false; }],
  ['visuals[0].caption', '/visuals/0/caption', l => { delete l.visuals[0].caption; }, l => { l.visuals[0].caption = 0; }],
];
for (const [name, path, drop, wrong] of STRUCT) {
  test(`[F4-V1.v3 missing ${name}] REQUIRED at ${path}`, () => {
    const l = f1(); drop(l);
    assert.deepEqual(validate(l), only('REQUIRED', path));
  });
  test(`[F4-V1.v3 wrong type ${name}] TYPE at ${path}`, () => {
    const l = f1(); wrong(l);
    assert.deepEqual(validate(l), only('TYPE', path));
  });
}
for (const [name, path, add] of [
  ['top level', '/extra', l => { l.extra = 1; }],
  ['inputs[i]', '/inputs/1/extra', l => { l.inputs[1].extra = 1; }],
  ['practical', '/inputs/1/practical/extra', l => { l.inputs[1].practical.extra = 1; }],
  ['visuals[i]', '/visuals/0/extra', l => { l.visuals[0].extra = 1; }],
]) test(`[F4-V1.v3 unknown field ${name}] UNKNOWN_FIELD at ${path}`, () => {
  const l = f1(); add(l);
  assert.deepEqual(validate(l), only('UNKNOWN_FIELD', path));
});
for (const [field, set] of [
  ['step', l => { l.inputs[0].step = 1; }],
  ['practical', l => { l.inputs[0].practical = {min: 0, max: 10, basis: 'b'}; }],
  ['visuals', l => { l.visuals = clone(lessonF1.visuals); }],
]) test(`[F4-V1.v2 + ${field}] a v2 lesson carrying ${field} is UNKNOWN_FIELD`, () => {
  const l = lessonV2OfF1(); set(l);
  assert.deepEqual(validate(l), only('UNKNOWN_FIELD', field === 'visuals' ? '/visuals' : `/inputs/0/${field}`));
});

// ---- V3 (F6): every v2 semantic violation class, injected into F1 (v3), gives the code and path of the v2 form.
const SEMANTIC = [
  ['duplicate-output', l => l.outputs.push(clone(l.outputs[0])), err('DUPLICATE', '/outputs/5/outputId')],
  ['duplicate-scenario', l => l.scenarios.push(clone(l.scenarios[0])), err('DUPLICATE', '/scenarios/4/scenarioId')],
  ['scenario-input-unknown', l => { l.scenarios[0].values.push({inputId: 'absent-input', value: 1}); }, err('REFERENCE', '/scenarios/0/values/2/inputId')],
  ['scenario-missing-input', l => { l.scenarios[0].values.pop(); }, err('STATE', '/scenarios/0/values')],
  ['scenario-duplicate-input', l => { l.scenarios[0].values.push(clone(l.scenarios[0].values[0])); }, err('STATE', '/scenarios/0/values')],
  ['scenario-value-outside-domain', l => { l.scenarios[0].values[0].value = 100.01; }, err('RANGE', '/scenarios/0/values/0/value')],
  ['transfer-scenario-unknown', l => { l.transfer.scenarioId = 'absent-scenario'; }, err('REFERENCE', '/transfer/scenarioId')],
  ['tolerance-output-unknown', l => { l.transfer.tolerances.push({outputId: 'absent-output', absolute: 1}); }, err('REFERENCE', '/transfer/tolerances/5/outputId')],
  ['tolerance-duplicate-output', l => l.transfer.tolerances.push(clone(l.transfer.tolerances[0])), err('DUPLICATE', '/transfer/tolerances/5/outputId')],
  ['tolerance-missing-output', l => { l.transfer.tolerances.pop(); }, err('STATE', '/transfer/tolerances')],
  ['tolerance-absolute-negative', l => { l.transfer.tolerances[0].absolute = -EPS; }, err('RANGE', '/transfer/tolerances/0/absolute')],
  ['scale-zero', l => { l.outputs[0].scale = 0; }, err('RANGE', '/outputs/0/scale')],
  ['scale-negative', l => { l.outputs[0].scale = -1; }, err('RANGE', '/outputs/0/scale')],
];
for (const [name, mutate, expected] of SEMANTIC) test(`[F4-V3.v2 semantics ${name}] F1 (v3) and its v2 form give the same code and path`, () => {
  const v3 = f1(), v2 = lessonV2OfF1();
  mutate(v3); mutate(v2);
  assert.deepEqual(validate(v2), {ok: false, errors: [expected]});
  assert.deepEqual(validate(v3), {ok: false, errors: [expected]});
});
// rules inherited from v1 (activities, rubric): v3 equals the v2 form; codes and paths follow the T1 contract (STATE /activities for a missing required stage,
// RANGE /activities for required minutes outside 15-20, STATE /rubric/criteria for a missing dimension, REFERENCE /decisions/<i>/<role>Id for a role mismatch).
const INHERITED = [
  ['required-minutes-21', l => { l.activities.find(a => a.stage === 'exploration').minutes = 9; }, err('RANGE', '/activities')],
  ['missing-stage', l => { l.activities = l.activities.filter(a => a.stage !== 'return'); }, err('STATE', '/activities')],
  ['missing-dimension', l => { l.rubric.criteria.find(c => c.dimension === 'transfer').dimension = 'concept'; }, err('STATE', '/rubric/criteria')],
  ['role-mismatch-reference', l => { l.decisions[0].assessmentId = 'bal-diagnostic-cards'; }, err('REFERENCE', '/decisions/0/assessmentId')],
];
for (const [name, mutate] of INHERITED) test(`[F4-V3.v2 semantics ${name}] the v1 rule gives the same errors for v3 and v2`, () => {
  const v3 = f1(), v2 = lessonV2OfF1();
  mutate(v3); mutate(v2);
  const r2 = validate(v2);
  assert.equal(r2.ok, false);
  assert.deepEqual(validate(v3), r2);
});

// ---- F4C-W2 (spec 679f728f2f602897 A-1): 17 classes x 3 surfaces. The same F1 lesson (v2 form and v3 form) is injected on every surface:
// validateDocument(lesson), validateDocument(map) with the lesson in map.lessons[0], validateBundle with the lesson as bundle.lesson.
const SURFACE_PREFIX = {lesson: '', map: '/lessons/0', bundle: '/lesson'};
const runSurface = (surface, lesson) => {
  if (surface === 'lesson') return validateDocument(lesson, 'lesson');
  if (surface === 'map') return validateDocument(reseal(mapOf([lesson], [])), 'map');
  const b = base();
  b.lesson = lesson;
  b.map.lessons = [];
  return validateBundle(reseal(b));
};
const ALL_CLASSES = [...SEMANTIC, ...INHERITED];
test('[F4C-W2.count] 13 semantic + 4 inherited classes', () => {
  assert.equal(SEMANTIC.length, 13);
  assert.equal(INHERITED.length, 4);
  assert.equal(new Set(ALL_CLASSES.map(c => c[0])).size, 17);
});
for (const surface of Object.keys(SURFACE_PREFIX)) for (const [name, mutate, expected] of ALL_CLASSES) test(`[F4C-W2.${surface} ${name}] v2 rejects with the surface-prefixed path and v3 gives the identical result`, () => {
  const v3 = f1(), v2 = lessonV2OfF1();
  mutate(v3); mutate(v2);
  const r2 = runSurface(surface, v2), r3 = runSurface(surface, v3);
  const want = err(expected.code, SURFACE_PREFIX[surface] + expected.path);
  assert.equal(r2.ok, false, JSON.stringify(r2));
  assert.ok(r2.errors.some(e => e.code === want.code && e.path === want.path), `${JSON.stringify(want)} in ${JSON.stringify(r2.errors)}`);
  assert.deepEqual(r3, r2);
});
test('[F4-V3.v2 semantics map] a scenario input reference violation inside a map lesson has the v2 code under /lessons/0', () => {
  const make = lessonOf => { const l = lessonOf(base().lesson, 1); l.scenarios[0].values.push({inputId: 'absent-input', value: 1}); return validateDocument(mapOf([l], []), 'map'); };
  const v2 = make(lessonOfVersion[2]), v3 = make(lessonOfVersion[3]);
  assert.deepEqual(v2, only('REFERENCE', '/lessons/0/scenarios/0/values/1/inputId'));
  assert.deepEqual(v3, v2);
});
test('[F4-V3.v2 semantics bundle] a scenario input reference violation in the bundle lesson has the v2 code under /lesson', () => {
  const make = lessonOf => {
    const b = withLesson(lessonOf);
    b.lesson.scenarios[0].values.push({inputId: 'absent-input', value: 1});
    b.map.lessons = [];
    return validateBundle(reseal(b));
  };
  const v2 = make(lessonOfVersion[2]), v3 = make(lessonOfVersion[3]);
  assert.equal(v2.ok, false);
  assert.ok(v2.errors.some(e => e.code === 'REFERENCE' && e.path === '/lesson/scenarios/0/values/1/inputId'), JSON.stringify(v2.errors));
  assert.deepEqual(v3, v2);
});
