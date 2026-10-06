import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtemp, rm, writeFile, readFile, readdir, stat, utimes, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {performance} from 'node:perf_hooks';
import {validateDocument} from '../contracts/index.mjs';
import {computeContentHash} from '../contracts/content-hash.mjs';
import {importResult} from '../knowledge/import.mjs';
import {profileDir} from '../knowledge/paths.mjs';
import {checkModel} from '../authoring/check-model.mjs';
import {buildDiagnostic} from '../authoring/diagnose.mjs';
import {placeDiagnostic, placeLesson, setNextPaths} from '../authoring/place.mjs';
import {
  PROFILE as KB_PROFILE, tempHome, layout, makeChain, item, mapFor, sortedObs, wrapperText, truncatedText,
  seedMapText, readText, readDisk, strayFiles
} from './fixtures/knowledge/world.mjs';
import {recordingFs, faultFs} from './fixtures/knowledge/faults.mjs';
import {placementFs, renameRecordingFs} from './fixtures/authoring/faults.mjs';
import {
  EXAMPLE_MODEL, PROFILE, INPUT_IDS, OUTPUT_IDS, TRIGGERS, ORACLE_INPUTS, baseLesson, baseOracle, baseOracleText, exampleOracleText,
  asText, modelSource, pidTop, at, reference
} from './fixtures/authoring/models.mjs';

// Every ok:false Outcome observed below (Q4: code, message and next must exist on all of them).
const failures = [];
const note = (label, out) => { if (out && out.ok === false) failures.push({label, out}); return out; };

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function tempDir(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'ltt-t52-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  return dir;
}
async function writeModel(t, source, name = 'model.mjs') {
  const file = path.join(await tempDir(t), name);
  await writeFile(file, source);
  return file;
}
const LESSON_TEXT = asText(baseLesson());
const check = (modelPath, {lesson = LESSON_TEXT, oracle = baseOracleText()} = {}, opts) => checkModel({lessonText: lesson, modelPath, oracleText: oracle}, opts);
const checkSource = async (t, source, parts, opts) => check(await writeModel(t, source), parts, opts);
const shape = errors => errors.map(error => `${error.code} ${error.path}`).sort();
const wellFormed = errors => {
  assert.ok(Array.isArray(errors) && errors.length > 0);
  for (const error of errors) assert.ok(typeof error.code === 'string' && error.code && typeof error.path === 'string');
};
// Probe numbers k are not specified beyond "/probes/<k>"; only the shape of the path is asserted.
function probeIndexes(errors, code, outputId) {
  const pattern = new RegExp(`^/probes/(\\d+)${outputId ? `/${outputId}` : ''}$`);
  return errors.filter(error => error.code === code).map(error => {
    const match = pattern.exec(error.path);
    assert.ok(match, `${error.code} path ${error.path} must match ${pattern}`);
    return Number(match[1]);
  });
}
async function assertChildGone(pidFile, {required}) {
  let text;
  try { text = await readFile(pidFile, 'utf8'); } catch {
    assert.equal(required, false, 'model never ran, so the pid check would be vacuous');
    return;
  }
  const pid = Number(text);
  assert.ok(Number.isInteger(pid) && pid > 0 && pid !== process.pid);
  for (let attempt = 0; attempt < 40; attempt++) {
    try { process.kill(pid, 0); } catch (error) { assert.equal(error.code, 'ESRCH'); return; }
    await sleep(50);
  }
  try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
  assert.fail(`child ${pid} is still alive after checkModel returned`);
}

// ---------------------------------------------------------------- V1
test('[V1.valid C1] example lesson-v2 + model + oracle pass', async () => {
  const out = await checkModel({lessonText: LESSON_TEXT, modelPath: EXAMPLE_MODEL, oracleText: exampleOracleText()});
  assert.equal(out.ok, true);
  assert.deepEqual(out.errors, []);
});
test('[V1.lesson-contract-failure] lessonRevision 0 is reported as the contract error', async t => {
  const lesson = baseLesson();
  lesson.lessonRevision = 0;
  const out = await checkSource(t, modelSource(), {lesson: asText(lesson)});
  assert.equal(out.ok, false);
  assert.deepEqual(out.errors, [{code: 'RANGE', path: '/lessonRevision'}]);
});
test('[V1.lesson-v1 C19] a v1 lesson is rejected with VERSION', async t => {
  const {inspectionLesson} = await import('../examples/manufacturing-inspection/lesson.mjs');
  const out = await checkSource(t, modelSource(), {lesson: asText(inspectionLesson)});
  assert.equal(out.ok, false);
  assert.ok(out.errors.some(error => error.code === 'VERSION' && error.path === '/lesson/version'), JSON.stringify(out.errors));
});
test('[V1.oracle-contract-failure] oracle case without source is reported as the contract error', async t => {
  const oracle = baseOracle();
  delete oracle.cases[0].source;
  const out = await checkSource(t, modelSource(), {oracle: asText(oracle)});
  assert.equal(out.ok, false);
  assert.deepEqual(out.errors, [{code: 'REQUIRED', path: '/cases/0/source'}]);
});
test('[V1.model-binding-failure] declared modelRevision 2 against lesson revision 1', async t => {
  const out = await checkSource(t, modelSource({modelRevision: 2}));
  assert.equal(out.ok, false);
  assert.deepEqual(out.errors, [{code: 'REVISION', path: '/model/modelRevision'}]);
});
test('[V1.oracle-binding-failure] oracle modelRevision 2 against lesson revision 1', async t => {
  const oracle = baseOracle();
  oracle.modelRevision = 2;
  const out = await checkSource(t, modelSource(), {oracle: asText(oracle)});
  assert.equal(out.ok, false);
  assert.deepEqual(out.errors, [{code: 'REVISION', path: '/oracle/modelRevision'}]);
});

// ---------------------------------------------------------------- V2 (real child processes)
test('[V2.normal-exit] valid model finishes ok and leaves no child', async t => {
  const pidFile = path.join(await tempDir(t), 'pid');
  const out = await checkSource(t, modelSource({top: pidTop(pidFile)}));
  assert.deepEqual(out, {ok: true, errors: []});
  await assertChildGone(pidFile, {required: true});
});
test('[V2.import-delay C7] 4500ms synchronous delay at module top level still passes', async t => {
  const pidFile = path.join(await tempDir(t), 'pid');
  const started = performance.now();
  const out = await checkSource(t, modelSource({top: `${pidTop(pidFile)}\nconst t0 = Date.now(); while (Date.now() - t0 < 4500) {}`}));
  const elapsed = performance.now() - started;
  assert.deepEqual(out, {ok: true, errors: []});
  assert.ok(elapsed >= 4400, `elapsed ${elapsed}`);
  await assertChildGone(pidFile, {required: true});
});
test('[V2.infinite-loop C7 Q2] default 5000ms limit: TIMEOUT /model within 7000ms, child terminated', async t => {
  const pidFile = path.join(await tempDir(t), 'pid');
  const started = performance.now();
  const out = await checkSource(t, modelSource({top: `${pidTop(pidFile)}\nwhile (true) {}`}));
  const elapsed = performance.now() - started;
  assert.equal(out.ok, false);
  assert.deepEqual(out.errors, [{code: 'TIMEOUT', path: '/model'}]);
  assert.ok(elapsed <= 7000, `elapsed ${elapsed}`);
  assert.ok(elapsed >= 4900, `TIMEOUT must not fire before the 5000ms limit; elapsed ${elapsed}`);
  await assertChildGone(pidFile, {required: true});
});
test('[V2.calculate-loop VF1a] calculate that never returns (fast import): TIMEOUT /model within 7000ms, child terminated', async t => {
  const pidFile = path.join(await tempDir(t), 'pid');
  const started = performance.now();
  const out = await checkSource(t, modelSource({top: pidTop(pidFile), pre: 'while (true) {}'}));
  const elapsed = performance.now() - started;
  assert.deepEqual(out.errors, [{code: 'TIMEOUT', path: '/model'}]);
  assert.ok(elapsed <= 7000 && elapsed >= 4900, `elapsed ${elapsed}`);
  await assertChildGone(pidFile, {required: true});
});
test('[V2.combined-budget VF1b R2] 3500ms import + one 2500ms calculate: each under 5000ms, together over it: TIMEOUT /model', async t => {
  const pidFile = path.join(await tempDir(t), 'pid');
  const top = `${pidTop(pidFile)}
const t0 = Date.now(); while (Date.now() - t0 < 3500) {}
let waited = false;`;
  const pre = 'if (!waited) { waited = true; const t1 = Date.now(); while (Date.now() - t1 < 2500) {} }';
  const started = performance.now();
  const out = await checkSource(t, modelSource({top, pre}));
  const elapsed = performance.now() - started;
  assert.deepEqual(out.errors, [{code: 'TIMEOUT', path: '/model'}]);
  assert.ok(elapsed <= 7000 && elapsed >= 4900, `elapsed ${elapsed}`);
  await assertChildGone(pidFile, {required: true});
});
test('[V2.throw C13] calculate that throws is reported as THROW', async t => {
  const pidFile = path.join(await tempDir(t), 'pid');
  const out = await checkSource(t, modelSource({top: pidTop(pidFile), pre: "throw new Error('boom');"}));
  assert.equal(out.ok, false);
  const thrown = out.errors.filter(error => error.code === 'THROW');
  assert.ok(thrown.length > 0, JSON.stringify(out.errors));
  for (const error of thrown) assert.match(error.path, /^\/(probes|cases)\/\d+$/);
  await assertChildGone(pidFile, {required: true});
});
const loadFailures = {
  'no-model-export': {source: () => 'export const notModel = 1;\n'},
  'syntax-error': {source: () => 'export const model = {;\n'},
};
for (const [label, spec] of Object.entries(loadFailures)) {
  test(`[V2.load-failure ${label} C13] reported as LOAD /model`, async t => {
    const out = await checkSource(t, spec.source());
    assert.equal(out.ok, false);
    assert.deepEqual(out.errors, [{code: 'LOAD', path: '/model'}]);
  });
}
const SIBLING = 'export const helper = 1;\n';
const importViolations = {
  'static-import': () => `import {helper} from './sibling.mjs';\n${modelSource().replace('// 테스트용 생성 모델\n', '')}`,
  'dynamic-import(': () => `if (false) { await import('./sibling.mjs'); }\n${modelSource()}`,
  'export-from': () => `export {helper} from './sibling.mjs';\n${modelSource()}`,
  'require(': () => `if (false) { require('./sibling.mjs'); }\n${modelSource()}`,
};
for (const [label, build] of Object.entries(importViolations)) {
  test(`[V2.${label} C13] single-file rule violation is LOAD /model even when the sibling exists and the code is unreachable`, async t => {
    const dir = await tempDir(t);
    await writeFile(path.join(dir, 'sibling.mjs'), SIBLING);
    const file = path.join(dir, 'model.mjs');
    await writeFile(file, build());
    const out = await check(file);
    assert.equal(out.ok, false);
    assert.deepEqual(out.errors, [{code: 'LOAD', path: '/model'}]);
  });
}
test('[V2.process-exit Q6] a model calling process.exit does not end the test process or pass the check', async t => {
  const pidFile = path.join(await tempDir(t), 'pid');
  const out = await checkSource(t, modelSource({top: pidTop(pidFile), pre: 'process.exit(0);'}));
  assert.equal(out.ok, false);
  wellFormed(out.errors);
  await assertChildGone(pidFile, {required: true});
});
test('[V2.global-pollution Q6] global and prototype pollution stays in the child', async t => {
  const original = Math.random;
  t.after(() => {
    Math.random = original;
    delete globalThis.__ltt_pollution;
    delete Object.prototype.__ltt_polluted;
  });
  const pidFile = path.join(await tempDir(t), 'pid');
  const top = `${pidTop(pidFile)}
globalThis.__ltt_pollution = 'polluted';
Object.defineProperty(Object.prototype, '__ltt_polluted', {value: 1, configurable: true, writable: true});
Math.random = () => 4;`;
  const out = await checkSource(t, modelSource({top}));
  assert.equal(typeof out.ok, 'boolean');
  assert.ok(Array.isArray(out.errors));
  assert.equal(globalThis.__ltt_pollution, undefined);
  assert.equal(Object.hasOwn(Object.prototype, '__ltt_polluted'), false);
  assert.equal(({}).__ltt_polluted, undefined);
  assert.notEqual(Math.random(), 4);
  await assertChildGone(pidFile, {required: true});
  const after = await checkSource(t, modelSource());
  assert.deepEqual(after, {ok: true, errors: []});
});

// ---------------------------------------------------------------- V3 (oracle comparison, absolute tolerance)
const ABS = 0.25;
const STEP = 2 ** -20;
function oracleWith(edit) {
  const oracle = baseOracle();
  edit(oracle);
  return asText(oracle);
}
const TN = 3; // output index of true-negative
const TN_VALUE = reference(ORACLE_INPUTS[3])['true-negative'];
assert.equal(OUTPUT_IDS[TN], 'true-negative');
const toleranceCases = [
  ['diff = absolute (expected above)', TN_VALUE + ABS, true],
  ['diff = absolute (expected below)', TN_VALUE - ABS, true],
  ['diff = absolute + eps (expected above)', TN_VALUE + ABS + STEP, false],
  ['diff = absolute + eps (expected below)', TN_VALUE - ABS - STEP, false],
];
for (const [label, expected, passes] of toleranceCases) {
  test(`[V3.${label}] case 3 true-negative, absolute 0.25`, async t => {
    const oracle = oracleWith(doc => { doc.cases[3].absolute = ABS; doc.cases[3].expected[TN].value = expected; });
    const out = await checkSource(t, modelSource(), {oracle});
    if (passes) assert.deepEqual(out, {ok: true, errors: []});
    else {
      assert.equal(out.ok, false);
      assert.deepEqual(out.errors, [{code: 'MISMATCH', path: '/cases/3/expected/3'}]);
    }
  });
}
test('[V3.absolute-zero] absolute 0 accepts an exact match and rejects a 2^-20 difference', async t => {
  const file = await writeModel(t, modelSource());
  const exact = await check(file, {oracle: oracleWith(doc => { doc.cases[3].absolute = 0; })});
  assert.deepEqual(exact, {ok: true, errors: []});
  const off = await check(file, {oracle: oracleWith(doc => { doc.cases[3].absolute = 0; doc.cases[3].expected[TN].value = TN_VALUE + STEP; })});
  assert.deepEqual(off.errors, [{code: 'MISMATCH', path: '/cases/3/expected/3'}]);
});
test('[V3.null-null] expected null and actual null match (cases 1 and 2 have PPV null)', async t => {
  const out = await checkSource(t, modelSource());
  assert.deepEqual(out, {ok: true, errors: []});
  assert.equal(baseOracle().cases[1].expected[5].value, null);
});
test('[V3.expected-null actual-number] MISMATCH at the PPV of case 0', async t => {
  const out = await checkSource(t, modelSource(), {oracle: oracleWith(doc => { doc.cases[0].expected[5].value = null; })});
  assert.deepEqual(out.errors, [{code: 'MISMATCH', path: '/cases/0/expected/5'}]);
});
test('[V3.expected-number actual-null] MISMATCH at the PPV of case 1', async t => {
  const out = await checkSource(t, modelSource(), {oracle: oracleWith(doc => { doc.cases[1].expected[5].value = 0.5; })});
  assert.deepEqual(out.errors, [{code: 'MISMATCH', path: '/cases/1/expected/5'}]);
});
test('[V3.calculate-ok-false A8] ok:false on an oracle case is MISMATCH for every expected/<j> of that case only', async t => {
  const out = await checkSource(t, modelSource({pre: `if (${at(ORACLE_INPUTS[4])}) return {ok: false, errors: [{code: 'NOPE', path: '/x'}]};`}));
  assert.equal(out.ok, false);
  assert.deepEqual(shape(out.errors), OUTPUT_IDS.map((_, j) => `MISMATCH /cases/4/expected/${j}`).sort());
});

// ---------------------------------------------------------------- V4 (range probes)
const bounds = ['min', 'max'];
test('[V4.range-checking model] min-eps and max+eps rejected, min and max accepted: no errors', async t => {
  assert.deepEqual(await checkSource(t, modelSource()), {ok: true, errors: []});
});
for (const id of INPUT_IDS) {
  test(`[V4.min-check-missing ${id}] only /inputs/${id}/min is reported`, async t => {
    const out = await checkSource(t, modelSource({rangeBad: `(id === '${id}' ? false : v < 0) || v > 100`}));
    assert.equal(out.ok, false);
    assert.deepEqual(out.errors, [{code: 'PROBE_RANGE', path: `/inputs/${id}/min`}]);
  });
  test(`[V4.max-check-missing ${id}] only /inputs/${id}/max is reported`, async t => {
    const out = await checkSource(t, modelSource({rangeBad: `v < 0 || (id === '${id}' ? false : v > 100)`}));
    assert.equal(out.ok, false);
    assert.deepEqual(out.errors, [{code: 'PROBE_RANGE', path: `/inputs/${id}/max`}]);
  });
}
test('[V4.epsilon lower bound] a model that rejects beyond 5e-10 / 5e-8 is satisfied by eps = max(1e-9, |bound|*1e-9)', async t => {
  assert.deepEqual(await checkSource(t, modelSource({rangeBad: 'v < -5e-10 || v > 100 + 5e-8'})), {ok: true, errors: []});
});
test('[V4.epsilon upper bound] a model that tolerates 2e-9 below min and 2e-7 above max is flagged on every input and bound', async t => {
  const out = await checkSource(t, modelSource({rangeBad: 'v < -2e-9 || v > 100 + 2e-7'}));
  assert.deepEqual(shape(out.errors), shape(INPUT_IDS.flatMap(id => bounds.map(bound => ({code: 'PROBE_RANGE', path: `/inputs/${id}/${bound}`})))));
});
test('[V4.others-at-default] a model that rejects only while every other input is at its default passes', async t => {
  const out = await checkSource(t, modelSource({rangeBad: '(v < 0 || v > 100) && IDS.filter(k => k !== id).every(k => all[k] === DEFAULTS[k])'}));
  assert.deepEqual(out, {ok: true, errors: []});
});
test('[V4.min-accepted] a model rejecting exactly min (v <= 0) fails the oracle cases at min, not the range probe', async t => {
  const out = await checkSource(t, modelSource({rangeBad: 'v <= 0 || v > 100'}));
  assert.equal(out.ok, false);
  assert.ok(out.errors.every(error => error.code === 'MISMATCH'), JSON.stringify(out.errors));
  assert.deepEqual([...new Set(out.errors.map(error => /^\/cases\/(\d+)\/expected\//.exec(error.path)?.[1]))].sort(), ['1', '2']);
});
test('[V4.max-accepted] a model rejecting exactly max (v >= 100) fails the oracle cases at max, not the range probe', async t => {
  const out = await checkSource(t, modelSource({rangeBad: 'v < 0 || v >= 100'}));
  assert.equal(out.ok, false);
  assert.ok(out.errors.every(error => error.code === 'MISMATCH'), JSON.stringify(out.errors));
  assert.deepEqual([...new Set(out.errors.map(error => /^\/cases\/(\d+)\/expected\//.exec(error.path)?.[1]))].sort(), ['2', '3']);
});

// ---------------------------------------------------------------- V5 (probe outputs)
const at1 = at(TRIGGERS.allMin);
for (const [label, expression] of [['NaN', 'NaN'], ['Infinity', 'Infinity'], ['-Infinity', '-Infinity']]) {
  for (const outputId of ['accuracy', 'positive-predictive-value']) {
    test(`[V5.${label} ${outputId}] reported as NON_FINITE under that output (JSON would hide it as null)`, async t => {
      const out = await checkSource(t, modelSource({post: `if (${at1}) out['${outputId}'] = ${expression};`}));
      assert.equal(out.ok, false);
      assert.equal(out.errors.length, 1, JSON.stringify(out.errors));
      assert.equal(probeIndexes(out.errors, 'NON_FINITE', outputId).length, 1);
    });
  }
}
// Triggers must differ from every oracle case input, otherwise the oracle comparison (R4) reports MISMATCH as well.
const PROBE_ONLY = Object.entries(TRIGGERS).filter(([name]) => name !== 'oracleOnly').map(([, inputs]) => inputs);
for (const inputs of PROBE_ONLY) assert.ok(!ORACLE_INPUTS.some(known => known.join() === inputs.join()), `trigger ${inputs} coincides with an oracle case`);
test('[V5.NaN at every distinct probe kind] per-input min/max with others default, all-min, all-max are probed with distinct probe numbers', async t => {
  const condition = PROBE_ONLY.map(at).join(' || ');
  const out = await checkSource(t, modelSource({post: `if (${condition}) out.accuracy = NaN;`}));
  assert.equal(out.ok, false);
  const indexes = probeIndexes(out.errors, 'NON_FINITE', 'accuracy');
  assert.equal(out.errors.length, PROBE_ONLY.length, JSON.stringify(out.errors));
  assert.equal(new Set(indexes).size, indexes.length);
});
test('[V5.finite] every probe output finite (and PPV null where the denominator is 0): no errors', async t => {
  assert.deepEqual(await checkSource(t, modelSource()), {ok: true, errors: []});
});
test('[V5.nullable-null] null on the nullable PPV is allowed at a probe where PPV is not null', async t => {
  const out = await checkSource(t, modelSource({post: `if (${at(TRIGGERS.allMax)}) out['positive-predictive-value'] = null;`}));
  assert.deepEqual(out, {ok: true, errors: []});
});
test('[V5.non-nullable-null] null on a non-nullable output is NON_FINITE', async t => {
  const out = await checkSource(t, modelSource({post: `if (${at1}) out.accuracy = null;`}));
  assert.equal(out.errors.length, 1, JSON.stringify(out.errors));
  assert.equal(probeIndexes(out.errors, 'NON_FINITE', 'accuracy').length, 1);
});
test('[V5.string] a numeric string is NON_FINITE', async t => {
  const out = await checkSource(t, modelSource({post: `if (${at1}) out.accuracy = '0.5';`}));
  assert.equal(out.errors.length, 1, JSON.stringify(out.errors));
  assert.equal(probeIndexes(out.errors, 'NON_FINITE', 'accuracy').length, 1);
});
test('[V5.key-missing C18] an output without one outputId is SHAPE /probes/<k>', async t => {
  const out = await checkSource(t, modelSource({post: `if (${at1}) delete out.accuracy;`}));
  assert.equal(out.ok, false);
  assert.equal(out.errors.length, 1, `SHAPE only, no NON_FINITE for the missing output: ${JSON.stringify(out.errors)}`);
  assert.equal(probeIndexes(out.errors, 'SHAPE').length, 1);
});
test('[V5.key-extra C18] an output with an undeclared key is exactly SHAPE /probes/<k>', async t => {
  const out = await checkSource(t, modelSource({post: `if (${at1}) out.extra = 1;`}));
  assert.equal(out.errors.length, 1, JSON.stringify(out.errors));
  assert.equal(probeIndexes(out.errors, 'SHAPE').length, 1);
});

// ---------------------------------------------------------------- V6 (mutation / determinism, error guessing)
const at2 = at(TRIGGERS.allMax);
const mutations = {
  'overwrite value': `if (${at2}) values['defect-percent'] = 5;`,
  'add key': `if (${at2}) values.extra = 1;`,
  'delete key': `if (${at2}) delete values['detection-percent'];`,
};
for (const [label, pre] of Object.entries(mutations)) {
  test(`[V6.mutation ${label} C12] input object changed by calculate is MUTATION /probes/<k>`, async t => {
    const out = await checkSource(t, modelSource({pre}));
    assert.equal(out.ok, false);
    const mutated = out.errors.filter(error => error.code === 'MUTATION');
    assert.equal(probeIndexes(mutated, 'MUTATION').length, 1, JSON.stringify(out.errors));
  });
}
test('[V6.mutation oracle-case input] the oracle case inputs belong to the probe set (R6): mutation there is MUTATION /probes/<k>', async t => {
  const out = await checkSource(t, modelSource({pre: `if (${at(TRIGGERS.oracleOnly)}) values.extra = 1;`}));
  assert.equal(out.ok, false);
  assert.equal(probeIndexes(out.errors.filter(error => error.code === 'MUTATION'), 'MUTATION').length, 1, JSON.stringify(out.errors));
});
test('[V6.Math.random C12] different results for the same input is NONDETERMINISTIC /probes/<k>', async t => {
  const out = await checkSource(t, modelSource({post: `if (${at2}) out.accuracy = Math.random();`}));
  assert.equal(out.errors.length, 1, JSON.stringify(out.errors));
  assert.equal(probeIndexes(out.errors, 'NONDETERMINISTIC').length, 1);
});
test('[V6.call-counter-state] module-level call counter is NONDETERMINISTIC /probes/<k>', async t => {
  const out = await checkSource(t, modelSource({top: 'let calls = 0;', post: `if (${at2}) out.accuracy = ++calls / 1000;`}));
  assert.equal(out.errors.length, 1, JSON.stringify(out.errors));
  assert.equal(probeIndexes(out.errors, 'NONDETERMINISTIC').length, 1);
});
test('[V6.control] a pure model reports neither MUTATION nor NONDETERMINISTIC', async t => {
  assert.deepEqual(await checkSource(t, modelSource()), {ok: true, errors: []});
});

// ---------------------------------------------------------------- V7 (classification tree)
const cand = id => ({candidateId: id, title: `Title ${id}`, decisionQuestion: `Question ${id}?`, reason: `Reason ${id}`, preview: `Preview ${id}`});
const react = (candidateId, reaction) => ({candidateId, reaction});
const hypothesis = (candidateId, category = 'common-knowledge-gap') => ({candidateId, category, rationale: `Rationale ${candidateId}`, status: 'hypothesis'});
const round1 = () => ({candidates: [cand('cand-a'), cand('cand-b'), cand('cand-c')], reactions: [react('cand-a', 'similar'), react('cand-b', 'surprising'), react('cand-c', 'unknown')]});
const round2 = () => ({candidates: [cand('inspection-candidate'), cand('cand-d')], reactions: [react('inspection-candidate', 'not-applicable'), react('cand-d', 'similar')]});
const choicesOf = (...rounds) => ({kind: 'diagnostic-choices', version: 1, diagnosticId: 'inspection-diagnostic', profileId: PROFILE, contextKind: 'interest', rounds});
const hypotheses = () => [hypothesis('inspection-candidate'), hypothesis('cand-d', 'unknown-concept')];
const expectedDiagnostic = (candidates, hyps = hypotheses()) => ({kind: 'diagnostic', version: 1, diagnosticId: 'inspection-diagnostic', profileId: PROFILE, contextKind: 'interest', candidates, selection: null, confirmation: 'unconfirmed', hypotheses: hyps});
function accepted(choices, hyps = hypotheses()) {
  const out = buildDiagnostic(choices, hyps);
  assert.equal(out.ok, true, JSON.stringify(out.errors));
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.diagnostic, expectedDiagnostic(choices.rounds.at(-1).candidates, hyps));
  assert.deepEqual(validateDocument(out.diagnostic, 'diagnostic'), {ok: true, errors: []});
}
// A6: choices errors are INVALID-level errors with fixed paths; hypotheses errors use the diagnostic contract paths.
function rejected(choices, hyps, ...expected) {
  const out = buildDiagnostic(choices, hyps);
  assert.equal(out.ok, false);
  assert.equal(out.diagnostic, undefined);
  wellFormed(out.errors);
  for (const [code, pointer] of expected) assert.ok(out.errors.some(error => error.path === pointer && (code === undefined || error.code === code)), `expected ${pointer}: ${JSON.stringify(out.errors)}`);
}
const four = () => ['a', 'b', 'c', 'd'].map(id => cand(`cand-${id}`));
test('[V7.valid C4] 2 rounds, all four reactions: last round candidates, selection null, unconfirmed', () => accepted(choicesOf(round1(), round2())));
test('[V7.rounds=1 C9] a single round is accepted and used as the last round', () => accepted(choicesOf({candidates: [cand('inspection-candidate'), cand('cand-d')], reactions: [react('cand-d', 'similar')]})));
test('[V7.rounds=0 C9] rejected at /rounds', () => rejected(choicesOf(), hypotheses(), [undefined, '/rounds']));
test('[V7.rounds=3 C9] rejected at /rounds', () => rejected(choicesOf(round1(), round2(), round2()), hypotheses(), [undefined, '/rounds']));
test('[V7.candidates=1] one candidate in the last round', () => accepted(choicesOf(round1(), {candidates: [cand('inspection-candidate')], reactions: []}), [hypothesis('inspection-candidate')]));
test('[V7.candidates=3] three candidates in the last round', () => accepted(choicesOf(round2(), {candidates: [cand('inspection-candidate'), cand('cand-d'), cand('cand-e')], reactions: [react('cand-e', 'unknown')]})));
test('[V7.candidates=0] last round without candidates is rejected at /rounds/1/candidates', () => rejected(choicesOf(round1(), {candidates: [], reactions: []}), [], [undefined, '/rounds/1/candidates']));
test('[V7.candidates=4] last round with four candidates is rejected at /rounds/1/candidates', () => rejected(choicesOf(round1(), {candidates: four(), reactions: []}), [], [undefined, '/rounds/1/candidates']));
test('[V7.candidates=4 first round] a first round with four candidates is rejected at /rounds/0/candidates', () => rejected(choicesOf({candidates: four(), reactions: []}, round2()), hypotheses(), [undefined, '/rounds/0/candidates']));
test('[V7.reaction-undefined] a reaction outside the four values is rejected at .../reaction', () => {
  const second = round2();
  second.reactions[0].reaction = 'confused';
  rejected(choicesOf(round1(), second), hypotheses(), [undefined, '/rounds/1/reactions/0/reaction']);
});
test('[V7.candidateId-unknown] reaction naming a candidate that exists nowhere is rejected at .../candidateId', () => {
  const second = round2();
  second.reactions.push(react('ghost', 'similar'));
  rejected(choicesOf(round1(), second), hypotheses(), [undefined, '/rounds/1/reactions/2/candidateId']);
});
test('[V7.candidateId-other-round] reaction naming a candidate of another round is rejected at .../candidateId', () => {
  const second = round2();
  second.reactions.push(react('cand-a', 'similar'));
  rejected(choicesOf(round1(), second), hypotheses(), [undefined, '/rounds/1/reactions/2/candidateId']);
});
test('[V7.candidateId-duplicate] a second reaction for one candidate in a round is rejected at .../candidateId', () => {
  const first = round1();
  first.reactions.push(react('cand-a', 'unknown'));
  rejected(choicesOf(first, round2()), hypotheses(), [undefined, '/rounds/0/reactions/3/candidateId']);
});
test('[V7.hypotheses-contract-violation] status other than hypothesis is VALUE /hypotheses/0/status', () => {
  const hyps = hypotheses();
  hyps[0].status = 'confirmed';
  rejected(choicesOf(round1(), round2()), hyps, ['VALUE', '/hypotheses/0/status']);
});
test('[V7.hypotheses-unknown-candidate] hypothesis about a candidate nowhere in the choices is REFERENCE /hypotheses/0/candidateId', () => rejected(choicesOf(round1(), round2()), [hypothesis('ghost')], ['REFERENCE', '/hypotheses/0/candidateId']));
test('[V7.hypotheses-first-round-candidate] hypothesis about a candidate that is not in the last round is REFERENCE /hypotheses/0/candidateId', () => rejected(choicesOf(round1(), round2()), [hypothesis('cand-a')], ['REFERENCE', '/hypotheses/0/candidateId']));

// ---------------------------------------------------------------- V8 (placement)
const LESSON = baseLesson();
const DIAG_TEXT = asText({kind: 'diagnostic', version: 1, diagnosticId: 'inspection-diagnostic', profileId: PROFILE, contextKind: 'interest', candidates: [cand('inspection-candidate')], selection: 'inspection-candidate', confirmation: 'confirmed', hypotheses: []});
const rel = {
  diag: 'diagnostics/inspection-diagnostic.json',
  lesson: `lessons/${LESSON.lessonId}.${LESSON.lessonRevision}.json`,
  model: 'models/manufacturing-inspection.1.mjs',
  oracle: 'models/manufacturing-inspection.1.oracle.json',
};
const abs = (home, key) => path.join(profileDir(PROFILE, {home}), rel[key]);
const placeInput = () => ({lessonText: LESSON_TEXT, modelPath: EXAMPLE_MODEL, oracleText: exampleOracleText()});
const wanted = async () => ({lesson: Buffer.from(LESSON_TEXT), model: await readFile(EXAMPLE_MODEL), oracle: Buffer.from(exampleOracleText())});
const resolved = (home, paths) => [].concat(paths).map(file => path.resolve(profileDir(PROFILE, {home}), file)).sort();
async function snap(home) {
  const out = {};
  let entries;
  try { entries = await readdir(home, {recursive: true, withFileTypes: true}); } catch (error) {
    if (error.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const file = path.join(entry.parentPath, entry.name);
    if (entry.isDirectory()) { out[`${path.relative(home, file)}/`] = {directory: true}; continue; }
    if (!entry.isFile()) continue;
    out[path.relative(home, file)] = {bytes: (await readFile(file)).toString('base64'), mtimeMs: (await stat(file)).mtimeMs};
  }
  return out;
}
const OLD = new Date('2001-01-01T00:00:00Z');
async function seed(home, key, content, {aged = true} = {}) {
  const file = abs(home, key);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, content);
  if (aged) await utimes(file, OLD, OLD);
  return file;
}
async function seedUnrelated(home) {
  const dir = profileDir(PROFILE, {home});
  await mkdir(path.join(dir, 'lessons'), {recursive: true});
  await writeFile(path.join(dir, 'map.json'), '{"unrelated":true}\n');
  await writeFile(path.join(dir, 'lessons', 'other-lesson.1.json'), '{"other":true}\n');
  await utimes(path.join(dir, 'map.json'), OLD, OLD);
  await utimes(path.join(dir, 'lessons', 'other-lesson.1.json'), OLD, OLD);
}
// S1: a snapshot holds files (bytes, mtime) and directories (paths); `tree` lists both, `names` only the files.
const tree = async home => Object.keys(await snap(home)).sort();
const names = async home => (await tree(home)).filter(name => !name.endsWith('/'));
const conflictNames = (out, ...keys) => assert.deepEqual(out.errors, keys.map(key => ({code: 'CONFLICT', path: rel[key]}))); // A7: profile-relative path

test('[V8.diagnostic none] placed, bytes equal the input, nothing else written', async t => {
  const home = await tempHome(t);
  const out = note('placeDiagnostic none', await placeDiagnostic(DIAG_TEXT, {home}));
  assert.equal(out.ok, true);
  assert.equal(out.action, 'placed');
  assert.deepEqual(resolved(home, out.path), [abs(home, 'diag')]);
  assert.equal(await readFile(abs(home, 'diag'), 'utf8'), DIAG_TEXT);
  assert.deepEqual(await names(home), [path.join('.learn-to-tell', 'profiles', PROFILE, rel.diag)]);
});
test('[V8.diagnostic same] unchanged, bytes and mtime kept', async t => {
  const home = await tempHome(t);
  await seed(home, 'diag', DIAG_TEXT);
  const before = await snap(home);
  const out = note('placeDiagnostic same', await placeDiagnostic(DIAG_TEXT, {home}));
  assert.equal(out.ok, true);
  assert.equal(out.action, 'unchanged');
  assert.deepEqual(resolved(home, out.path), [abs(home, 'diag')]);
  assert.deepEqual(await snap(home), before);
});
test('[V8.diagnostic different] CONFLICT naming the file, existing bytes and mtime kept', async t => {
  const home = await tempHome(t);
  await seed(home, 'diag', DIAG_TEXT.replace('Title', 'Other title'));
  const before = await snap(home);
  const out = note('placeDiagnostic different', await placeDiagnostic(DIAG_TEXT, {home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'CONFLICT');
  conflictNames(out, 'diag');
  assert.deepEqual(await snap(home), before);
});
test('[V8.diagnostic profileId-format C17] PROFILE before any fs call', async t => {
  const home = await tempHome(t);
  const {fs, calls} = recordingFs();
  const bad = JSON.stringify({...JSON.parse(DIAG_TEXT), profileId: 'Bad_ID'});
  const out = note('placeDiagnostic bad profileId', await placeDiagnostic(bad, {home, fs}));
  assert.equal(out.code, 'PROFILE');
  assert.deepEqual(calls, []);
});
test('[V8.lesson profileId-format C17] PROFILE before any fs call', async t => {
  const home = await tempHome(t);
  const {fs, calls} = recordingFs();
  const lesson = baseLesson();
  lesson.profileId = 'Bad_ID';
  const out = note('placeLesson bad profileId', await placeLesson({...placeInput(), lessonText: asText(lesson)}, {home, fs}));
  assert.equal(out.code, 'PROFILE');
  assert.deepEqual(calls, []);
});
test('[V8.diagnostic profileId-missing A9] a document without profileId is INVALID (contract), nothing written', async t => {
  const home = await tempHome(t);
  const {profileId: _omitted, ...without} = JSON.parse(DIAG_TEXT);
  const out = note('placeDiagnostic no profileId', await placeDiagnostic(JSON.stringify(without), {home}));
  assert.equal(out.code, 'INVALID');
  assert.ok(out.errors.some(error => error.code === 'REQUIRED' && error.path === '/profileId'), JSON.stringify(out.errors));
  assert.deepEqual(await names(home), []);
});
test('[V8.lesson profileId-missing A9] a lesson without profileId is INVALID (contract), nothing written', async t => {
  const home = await tempHome(t);
  const lesson = baseLesson();
  delete lesson.profileId;
  const out = note('placeLesson no profileId', await placeLesson(placeText(asText(lesson)), {home}));
  assert.equal(out.code, 'INVALID');
  assert.ok(out.errors.some(error => error.code === 'REQUIRED' && error.path === '/profileId'), JSON.stringify(out.errors));
  assert.deepEqual(await names(home), []);
});
test('[V8.lesson none C2] placed: three files with exactly the input bytes', async t => {
  const home = await tempHome(t);
  const out = note('placeLesson none', await placeLesson(placeInput(), {home}));
  assert.equal(out.ok, true);
  assert.equal(out.action, 'placed');
  assert.deepEqual(resolved(home, out.paths), ['lesson', 'model', 'oracle'].map(key => abs(home, key)).sort());
  const bytes = await wanted();
  for (const key of ['lesson', 'model', 'oracle']) assert.deepEqual(await readFile(abs(home, key)), bytes[key], key);
  assert.equal((await names(home)).length, 3, 'no temp files left');
});
test('[V8.lesson same C3] unchanged, all three files keep bytes and mtime', async t => {
  const home = await tempHome(t);
  const bytes = await wanted();
  for (const key of ['lesson', 'model', 'oracle']) await seed(home, key, bytes[key]);
  const before = await snap(home);
  const out = note('placeLesson same', await placeLesson(placeInput(), {home}));
  assert.equal(out.ok, true);
  assert.equal(out.action, 'unchanged');
  assert.deepEqual(await snap(home), before);
});
test('[V8.lesson different C14] same lesson id.revision with other bytes: CONFLICT, model and oracle not written', async t => {
  const home = await tempHome(t);
  await seed(home, 'lesson', LESSON_TEXT + ' ');
  const before = await snap(home);
  const out = note('placeLesson lesson differs', await placeLesson(placeInput(), {home}));
  assert.equal(out.code, 'CONFLICT');
  conflictNames(out, 'lesson');
  assert.deepEqual(await snap(home), before);
});
test('[V8.lesson partial-same C20] model and oracle identical, lesson absent: lesson written, existing files untouched', async t => {
  const home = await tempHome(t);
  const bytes = await wanted();
  await seed(home, 'model', bytes.model);
  await seed(home, 'oracle', bytes.oracle);
  const before = await snap(home);
  const out = note('placeLesson partial', await placeLesson(placeInput(), {home}));
  assert.equal(out.ok, true);
  assert.equal(out.action, 'placed');
  assert.ok(resolved(home, out.paths).includes(abs(home, 'lesson')));
  assert.deepEqual(await readFile(abs(home, 'lesson')), bytes.lesson);
  const after = await snap(home);
  for (const key of ['model', 'oracle']) {
    const name = path.join('.learn-to-tell', 'profiles', PROFILE, rel[key]);
    assert.deepEqual(after[name], before[name], `${key} untouched`);
  }
  assert.equal(Object.keys(after).filter(name => !name.endsWith('/')).length, 3);
});
test('[V8.lesson partial-different C20] only a differing model exists: CONFLICT, nothing written', async t => {
  const home = await tempHome(t);
  const bytes = await wanted();
  await seed(home, 'model', Buffer.concat([bytes.model, Buffer.from('// edited\n')]));
  const before = await snap(home);
  const out = note('placeLesson model differs', await placeLesson(placeInput(), {home}));
  assert.equal(out.code, 'CONFLICT');
  conflictNames(out, 'model');
  assert.deepEqual(await snap(home), before);
});
const profileStates = {
  'profile dir absent': async () => {},
  'profile dir present': seedUnrelated,
};
for (const [state, prepare] of Object.entries(profileStates)) {
  for (const fail of ['mkdir', 'open', 'write', 'sync', 'rename-model', 'rename-lesson']) {
    test(`[V8.fault ${fail}${fail === 'rename-lesson' ? ' C15' : ''} / ${state}] IO, files and directories identical, no temp files`, async t => {
      const home = await tempHome(t);
      await prepare(home);
      const before = await snap(home);
      const {fs, events} = placementFs(home, {fail});
      const out = note(`placeLesson fault ${fail} ${state}`, await placeLesson(placeInput(), {home, fs}));
      assert.ok(events.length >= 1, 'the fault point must have been reached');
      assert.equal(out.ok, false);
      assert.equal(out.code, 'IO');
      assert.deepEqual(await snap(home), before);
    });
  }
}
// VF3(a): model and oracle already identical, only the lesson is new; the failure must leave them (bytes, mtime) alone.
for (const fail of ['mkdir', 'open', 'write', 'sync', 'rename-lesson']) {
  test(`[V8.fault ${fail} / partial-same] lesson write fails: IO, pre-existing model and oracle kept, no new directory`, async t => {
    const home = await tempHome(t);
    const bytes = await wanted();
    await seed(home, 'model', bytes.model);
    await seed(home, 'oracle', bytes.oracle);
    const before = await snap(home);
    const {fs, events} = placementFs(home, {fail});
    const out = note(`placeLesson partial fault ${fail}`, await placeLesson(placeInput(), {home, fs}));
    assert.ok(events.length >= 1, 'the fault point must have been reached');
    assert.equal(out.code, 'IO');
    assert.deepEqual(await snap(home), before);
  });
}
for (const [state, prepare] of Object.entries(profileStates)) {
  test(`[V8.fault rename-diagnostic / ${state}] placeDiagnostic: IO, files and directories identical`, async t => {
    const home = await tempHome(t);
    await prepare(home);
    const before = await snap(home);
    const {fs, events} = placementFs(home, {fail: 'rename-diagnostic'});
    const out = note(`placeDiagnostic fault ${state}`, await placeDiagnostic(DIAG_TEXT, {home, fs}));
    assert.ok(events.length >= 1);
    assert.equal(out.code, 'IO');
    assert.deepEqual(await snap(home), before);
  });
}
// VF3(b): only the oracle differs.
for (const lessonState of ['lesson absent', 'lesson same']) {
  test(`[V8.oracle-differs / ${lessonState}] CONFLICT naming only the oracle, nothing written`, async t => {
    const home = await tempHome(t);
    const bytes = await wanted();
    await seed(home, 'model', bytes.model);
    await seed(home, 'oracle', Buffer.concat([bytes.oracle, Buffer.from(' ')]));
    if (lessonState === 'lesson same') await seed(home, 'lesson', bytes.lesson);
    const before = await snap(home);
    const out = note(`placeLesson oracle differs ${lessonState}`, await placeLesson(placeInput(), {home}));
    assert.equal(out.code, 'CONFLICT');
    conflictNames(out, 'oracle');
    assert.deepEqual(await snap(home), before);
  });
}
// VF4: rename order on success.
test('[V8.rename-order R14] model and oracle are renamed before the lesson, which is renamed last', async t => {
  const home = await tempHome(t);
  const {fs, renames} = renameRecordingFs(home);
  const out = await placeLesson(placeInput(), {home, fs});
  assert.equal(out.action, 'placed');
  assert.equal(renames.length, 3, JSON.stringify(renames));
  assert.equal(renames.at(-1), abs(home, 'lesson'));
  assert.deepEqual(renames.slice(0, 2).sort(), [abs(home, 'model'), abs(home, 'oracle')].sort());
});
test('[V8.Q3 C2 C4] a placed diagnostic and lesson are found by knowledge importResult', async t => {
  const home = await tempHome(t);
  assert.equal((await placeDiagnostic(DIAG_TEXT, {home})).ok, true);
  assert.equal((await placeLesson(placeInput(), {home})).ok, true);
  const result = {kind: 'result', version: 2, resultId: 'result-1', profileId: PROFILE, lessonId: LESSON.lessonId, lessonRevision: LESSON.lessonRevision, baseMapRevision: 1, sequence: 1, previousResultId: null, state: 'partial', responses: [], assessments: []};
  result.contentHash = await computeContentHash(result);
  const out = await importResult(JSON.stringify(result), {home});
  assert.equal(out.ok, true, JSON.stringify(out));
});
test('[V8.Q3 C4] a diagnostic made by buildDiagnostic and placed is found (no MISSING_DIAGNOSTIC)', async t => {
  const home = await tempHome(t);
  const built = buildDiagnostic(choicesOf(round1(), round2()), hypotheses());
  assert.equal(built.ok, true);
  const text = JSON.stringify({...built.diagnostic, diagnosticId: LESSON.diagnosticId, contextKind: LESSON.contextKind, candidates: [cand(LESSON.candidateId)], hypotheses: []});
  assert.equal((await placeDiagnostic(text, {home})).ok, true);
  assert.equal((await placeLesson(placeInput(), {home})).ok, true);
  const result = {kind: 'result', version: 2, resultId: 'result-1', profileId: PROFILE, lessonId: LESSON.lessonId, lessonRevision: LESSON.lessonRevision, baseMapRevision: 1, sequence: 1, previousResultId: null, state: 'partial', responses: [], assessments: []};
  result.contentHash = await computeContentHash(result);
  const out = await importResult(JSON.stringify(result), {home});
  assert.notEqual(out.code, 'MISSING_DIAGNOSTIC');
  assert.notEqual(out.code, 'MISSING_LESSON');
});

// ---------------------------------------------------------------- V9 (volume)
function lessonWith(edit) {
  const lesson = baseLesson();
  edit(lesson);
  return asText(lesson);
}
const exploreMinutes = minutes => lesson => { lesson.activities[2].minutes = minutes; };
const placeText = text => ({...placeInput(), lessonText: text});
test('[V9.at-limits] decisions 2, concepts 5, required minutes 20 (optional activity minutes excluded) are placed', async t => {
  const home = await tempHome(t);
  const text = lessonWith(lesson => {
    exploreMinutes(8)(lesson);
    lesson.activities.push({activityId: 'optional-extra', stage: 'exploration', contentIds: ['inspection-explanation'], required: false, minutes: 30});
  });
  const out = note('place at limits', await placeLesson(placeText(text), {home}));
  assert.equal(out.ok, true, JSON.stringify(out));
  assert.equal(out.action, 'placed');
});
const scopeCases = [
  ['decisions=3', lesson => lesson.decisions.push({...lesson.decisions[0], decisionId: 'extra-decision'}), 'SCOPE', {code: 'SCOPE', path: '/decisions'}],
  ['concepts=6', lesson => lesson.concepts.push({conceptId: 'extra-concept', conceptRevision: 1, label: 'Extra', meaning: 'Extra meaning', example: 'Extra example', confusion: 'Extra confusion', plain: 'Extra plain'}), 'SCOPE', {code: 'SCOPE', path: '/concepts'}],
  // D1: time is left to the lesson contract (RANGE /activities), so the outcome is INVALID.
  ['required minutes=20.5 C6', exploreMinutes(8.5), 'INVALID', {code: 'RANGE', path: '/activities'}],
];
for (const [label, edit, outcomeCode, error] of scopeCases) {
  test(`[V9.${label}] ${outcomeCode} ${error.code} ${error.path}, nothing placed`, async t => {
    const home = await tempHome(t);
    const out = note(`place ${label}`, await placeLesson(placeText(lessonWith(edit)), {home}));
    assert.equal(out.ok, false);
    assert.equal(out.code, outcomeCode);
    assert.ok(out.errors.some(item => item.code === error.code && item.path === error.path), JSON.stringify(out.errors));
    if (outcomeCode === 'SCOPE') assert.deepEqual(out.errors, [error]);
    assert.deepEqual(await tree(home), []);
  });
}
test('[V9.order contract -> SCOPE -> check-model VF5] over-scope lesson is rejected before the model ever runs', async t => {
  const home = await tempHome(t);
  const dir = await tempDir(t);
  const pidFile = path.join(dir, 'pid');
  const model = path.join(dir, 'loop.mjs');
  await writeFile(model, modelSource({top: `${pidTop(pidFile)}\nwhile (true) {}`}));
  const started = performance.now();
  const out = note('place over scope with looping model', await placeLesson({...placeText(lessonWith(lesson => lesson.decisions.push({...lesson.decisions[0], decisionId: 'extra-decision'}))), modelPath: model}, {home}));
  const elapsed = performance.now() - started;
  assert.equal(out.code, 'SCOPE');
  assert.ok(elapsed < 3000, `elapsed ${elapsed}: the model must not have been run`);
  await assert.rejects(readFile(pidFile), {code: 'ENOENT'});
  assert.deepEqual(await tree(home), []);
});
test('[V9.order contract -> SCOPE] a contract violation together with over-scope is INVALID, not SCOPE', async t => {
  const home = await tempHome(t);
  const text = lessonWith(lesson => { lesson.lessonRevision = 0; lesson.decisions.push({...lesson.decisions[0], decisionId: 'extra-decision'}); });
  const out = note('place invalid and over scope', await placeLesson(placeText(text), {home}));
  assert.equal(out.code, 'INVALID');
  assert.ok(out.errors.some(error => error.code === 'RANGE' && error.path === '/lessonRevision'), JSON.stringify(out.errors));
  assert.deepEqual(await tree(home), []);
});

// ---------------------------------------------------------------- V10 (setNextPaths)
const LEVELS = [[item(1, 'supported', 'a')], [item(1, 'supported', 'a'), item(2, 'partial', 'b')]];
const newPaths = () => [
  {pathId: 'path-n1', lessonId: 'lesson-a', conceptId: 'concept-a', conceptRevision: 1, reason: 'Review inspection cost', lessonStatus: 'placed'},
  {pathId: 'path-n2', lessonId: 'lesson-a', conceptId: 'concept-b', conceptRevision: 2, reason: 'Defect escape', lessonStatus: 'placed'},
];
async function seededMap(t) {
  const home = await tempHome(t);
  const results = await makeChain(LEVELS);
  const map = mapFor(results, {revision: 3, nextPaths: [{pathId: 'path-old', lessonId: 'lesson-a', conceptId: 'concept-a', conceptRevision: 1, reason: 'old', lessonStatus: 'placed'}]});
  const text = wrapperText(4, map);
  await seedMapText(home, text);
  return {home, map, text};
}
test('[V10.valid C5] nextPaths replaced, revision and generation each +1, the rest of the map kept', async t => {
  const {home, map} = await seededMap(t);
  const out = note('setNextPaths valid', await setNextPaths(KB_PROFILE, JSON.stringify(newPaths()), {home}));
  assert.deepEqual(out, {ok: true, revision: 4, generation: 5});
  const disk = await readDisk(home);
  assert.equal(disk.generation, 5);
  assert.deepEqual(sortedObs(disk.map), sortedObs({...map, revision: 4, nextPaths: newPaths()}));
  assert.deepEqual(validateDocument(disk.map, 'map'), {ok: true, errors: []});
});
test('[V10.planned C21] a planned path to a lesson that is not placed is accepted: revision +1', async t => {
  const {home, map} = await seededMap(t);
  const planned = [{pathId: 'path-split-2', lessonId: 'lesson-not-yet-made', conceptId: 'concept-unseen', conceptRevision: 7, reason: 'Second session of the split lesson', lessonStatus: 'planned'}];
  const out = note('setNextPaths planned', await setNextPaths(KB_PROFILE, JSON.stringify(planned), {home}));
  assert.deepEqual(out, {ok: true, revision: 4, generation: 5});
  assert.deepEqual(sortedObs((await readDisk(home)).map), sortedObs({...map, revision: 4, nextPaths: planned}));
});
test('[V10.placed-unplaced-lesson C21] a placed path to a lesson not in the map is INVALID REFERENCE /nextPaths/0/lessonId, bytes kept', async t => {
  const {home, text} = await seededMap(t);
  const paths = [{...newPaths()[0], lessonId: 'lesson-not-yet-made'}];
  const before = await snap(home);
  const out = note('setNextPaths placed unplaced', await setNextPaths(KB_PROFILE, JSON.stringify(paths), {home}));
  assert.equal(out.code, 'INVALID');
  assert.ok(out.errors.some(error => error.code === 'REFERENCE' && error.path.endsWith('/0/lessonId')), JSON.stringify(out.errors));
  assert.equal(await readText(layout(home).map), text);
  assert.deepEqual(await snap(home), before, 'S1: files and directories identical');
});
test('[V10.map-missing C16] MAP_MISSING and no map.json created', async t => {
  const home = await tempHome(t);
  const before = await snap(home);
  const out = note('setNextPaths missing', await setNextPaths(KB_PROFILE, JSON.stringify(newPaths()), {home}));
  assert.equal(out.code, 'MAP_MISSING');
  assert.equal(await readText(layout(home).map), null);
  assert.deepEqual(await snap(home), before, 'S1: files and directories identical');
});
test('[V10.map-corrupt C16] MAP_UNREADABLE and map.json bytes kept', async t => {
  const home = await tempHome(t);
  const results = await makeChain(LEVELS);
  const text = truncatedText(4, mapFor(results));
  await seedMapText(home, text);
  const before = await snap(home);
  const out = note('setNextPaths corrupt', await setNextPaths(KB_PROFILE, JSON.stringify(newPaths()), {home}));
  assert.equal(out.code, 'MAP_UNREADABLE');
  assert.equal(await readText(layout(home).map), text);
  assert.deepEqual(await snap(home), before, 'S1: files and directories identical');
});
test('[V10.nextPath-contract-violation] a nextPath without reason is INVALID and map.json bytes kept', async t => {
  const {home, text} = await seededMap(t);
  const broken = newPaths();
  delete broken[0].reason;
  const before = await snap(home);
  const out = note('setNextPaths invalid', await setNextPaths(KB_PROFILE, JSON.stringify(broken), {home}));
  assert.equal(out.code, 'INVALID');
  assert.ok(out.errors.some(error => error.code === 'REQUIRED' && error.path.endsWith('/0/reason')), JSON.stringify(out.errors));
  assert.equal(await readText(layout(home).map), text);
  assert.deepEqual(await snap(home), before, 'S1: files and directories identical');
});
test('[V10.json-error] unparsable nextPaths text is INVALID with a JSON error and map.json bytes kept', async t => {
  const {home, text} = await seededMap(t);
  const before = await snap(home);
  const out = note('setNextPaths json', await setNextPaths(KB_PROFILE, '[{', {home}));
  assert.equal(out.code, 'INVALID');
  assert.ok(out.errors.some(error => error.code === 'JSON'), JSON.stringify(out.errors));
  assert.equal(await readText(layout(home).map), text);
  assert.deepEqual(await snap(home), before, 'S1: files and directories identical');
});
test('[V10.profileId-format C17] PROFILE before any fs call', async t => {
  const home = await tempHome(t);
  const {fs, calls} = recordingFs();
  const before = await snap(home);
  const out = note('setNextPaths bad profile', await setNextPaths('Bad_ID', JSON.stringify(newPaths()), {home, fs}));
  assert.equal(out.code, 'PROFILE');
  assert.deepEqual(calls, []);
  assert.deepEqual(await snap(home), before, 'S1: files and directories identical');
});
test('[V10.STALE] map changed by someone else during the write: STALE, concurrent map.json kept, no temp file', async t => {
  const {home, map} = await seededMap(t);
  const concurrent = wrapperText(5, {...map, revision: 9});
  const {fs} = faultFs(home, {afterSync: () => seedMapText(home, concurrent)});
  const out = note('setNextPaths stale', await setNextPaths(KB_PROFILE, JSON.stringify(newPaths()), {home, fs}));
  assert.equal(out.code, 'STALE');
  assert.equal(await readText(layout(home).map), concurrent);
  assert.deepEqual(await strayFiles(home), []);
});

// ---------------------------------------------------------------- Q4
test('[Q4] every failure Outcome observed above has code, message and next', () => {
  assert.ok(failures.length >= 20, `observed ${failures.length} failure outcomes`);
  for (const {label, out} of failures) {
    for (const key of ['code', 'message', 'next']) assert.ok(typeof out[key] === 'string' && out[key].trim(), `${label}: ${key}`);
  }
});
