import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, mkdtempSync, writeFileSync, existsSync, statSync, rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateDocument} from '../contracts/index.mjs';
import {validateSessionConfig} from '../learning/session-config.mjs';
import {initialProgress, applyAction, predictionState} from '../learning/progress.mjs';
import {gradeTransferPrediction} from '../learning/grading.mjs';
import {buildResult, validateResultShape, finalizeResult} from '../learning/result.mjs';
import {computeContentHash} from '../contracts/content-hash.mjs';
import {oracleHash, withHash, reseal, HASH_FORMAT} from './fixtures/contracts/hash-oracle.mjs';
import {loadProgress, saveProgress} from '../learning/storage.mjs';
import {formatCount, formatRatio} from '../learning/format.mjs';
import {session, lesson, NOW, FIELDS, STAGES, act, reach, storageKey, predC4, baselinePrediction, retryPrediction} from './fixtures/learning/shapes.mjs';
import {crossCheckResult} from './fixtures/learning/oracle.mjs';
import * as C from './fixtures/learning/cases.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(new URL('./fixtures/learning/manifest.json', import.meta.url), 'utf8'));
const exercised = new Set();
const done = id => exercised.add(id);

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const v of Object.values(value)) deepFreeze(v); }
  return value;
}
const snap = value => JSON.stringify(value);
function play(actions, start = initialProgress(session)) {
  let progress = start;
  for (const [i, action] of actions.entries()) {
    const r = applyAction(progress, action);
    assert.equal(r.ok, true, `setup action ${i} (${action.kind}) rejected: ${JSON.stringify(r)}`);
    progress = r.progress;
  }
  return progress;
}
// buildResult returns the hash-less v2 body; the independent oracle seals it so existing assertions keep validating against T1.
const resultOf = (progress, s = session) => withHash(buildResult(progress, lesson, s, NOW));
function predSig(result) {
  const ps = result.responses.filter(r => r.purpose === 'prediction');
  return ps.map(r => ({attempt: r.attempt, answerNull: r.answer === null, visibility: r.visibility, prev: r.previousResponseId === null ? null : ps.findIndex(x => x.responseId === r.previousResponseId)}));
}
function expectedSig(cell) {
  if (cell.next === 'empty') return [];
  const retries = cell.next === 'retried' ? (cell.state === 'retried' && cell.type === 'retryPrediction' ? 2 : 1) : 0;
  const sig = [{attempt: 1, answerNull: cell.next === 'skipped' || cell.state === 'skipped' || (cell.state === 'empty' && cell.type === 'skipPrediction'), visibility: 'before-output', prev: null}];
  for (let k = 1; k <= retries; k++) sig.push({attempt: k + 1, answerNull: false, visibility: 'after-output', prev: k - 1});
  return sig;
}
const stageOf = progress => progress.stage;
const wellFormedErrors = r => { assert.deepEqual(Object.keys(r).sort(), ['errors', 'ok']); assert.ok(Array.isArray(r.errors) && r.errors.length > 0); for (const e of r.errors) { assert.equal(typeof e.code, 'string'); assert.ok(e.code); assert.equal(typeof e.path, 'string'); } };

// ================= V1 =================
for (const cell of C.V1_CELLS) {
  test(`${cell.id} [spec v3] ${cell.expect}`, () => {
    const before = play(C.V1_PATH[cell.state]);
    deepFreeze(before);
    const beforeText = snap(before), beforeResult = snap(resultOf(before));
    const r = applyAction(before, cell.action);
    assert.equal(snap(before), beforeText, 'original progress unchanged');
    assert.equal(snap(resultOf(before)), beforeResult);
    if (cell.expect === 'invalid') { assert.equal(r.ok, false); wellFormedErrors(r); } else {
      assert.equal(r.ok, true, JSON.stringify(r));
      assert.deepEqual(Object.keys(r).sort(), ['ok', 'progress']);
      const after = resultOf(r.progress), prior = resultOf(before);
      assert.deepEqual(validateDocument(after, 'result'), {ok: true, errors: []});
      assert.deepEqual(predSig(after), expectedSig(cell));
      if (cell.type === 'recordFreeResponse') {
        assert.equal(after.responses.length, prior.responses.length + 1);
        assert.equal(after.responses.at(-1).answer, cell.action.answer);
      }
      if (cell.type === 'openHint') assert.equal(after.assessments.filter(a => !['pending', 'skipped'].includes(a.status)).length, prior.assessments.filter(a => !['pending', 'skipped'].includes(a.status)).length, 'hint view alone is not performance');
      if (cell.next === 'retried') assert.deepEqual(after.responses.find(x => x.purpose === 'prediction' && x.attempt === 1), prior.responses.find(x => x.purpose === 'prediction' && x.attempt === 1), 'original response untouched');
      if (cell.next === 'revealed') assert.equal(applyAction(r.progress, act.recordPrediction(predC4)).ok, false, 'revealed state rejects original edit');
    }
    done(cell.id);
  });
}
for (const item of C.V1_INVALID) test(`${item.id} [spec v3] invalid action leaves progress unchanged`, () => {
  const before = deepFreeze(play(C.V1_PATH[item.state]));
  const text = snap(before);
  let r;
  assert.doesNotThrow(() => { r = applyAction(before, item.action); });
  assert.equal(r.ok, false); wellFormedErrors(r);
  assert.equal(snap(before), text);
  done(item.id);
});
test('V1.C8.skip-hint-response-retry [spec v5] C8', () => {
  const p = play([act.advanceStage(), act.skipPrediction(), act.advanceStage(), act.reveal(), act.openHint(1), act.openHint(2), act.recordFreeResponse('question', '질문'), act.retryPrediction(retryPrediction),
    act.advanceStage(), act.skipPrediction('transfer'), act.recordFreeResponse('choice', null)]);
  const r = resultOf(p);
  assert.deepEqual(validateDocument(r, 'result'), {ok: true, errors: []});
  const second = r.responses.find(x => x.purpose === 'prediction' && x.attempt === 2);
  const first = r.responses.find(x => x.responseId === second.previousResponseId);
  assert.equal(first.answer, null, 'original skipped answer kept');
  assert.equal(second.previousResponseId, first.responseId);
  assert.equal(second.attempt, 2);
  assert.ok(r.responses.some(x => x.help === 'hint'), 'help=hint recorded');
  const skipped = r.assessments.filter(a => a.status === 'skipped').map(a => a.criterionId).sort();
  assert.deepEqual(skipped, ['calculate-transfer', 'distinguish-denominators', 'justify-choice'], 'skipped judgements come from transfer skip and null free response only');
  assert.ok(!r.assessments.some(a => a.responseId === first.responseId || a.responseId === second.responseId), 'baseline predictions are not assessed');
  done('V1.C8.skip-hint-response-retry');
});
test('V1.C12.revealed-original-immutable [spec v3] C12', () => {
  const p = deepFreeze(play(C.V1_PATH.revealed));
  const before = resultOf(p), text = snap(p);
  const r = applyAction(p, act.recordPrediction({...baselinePrediction, truePositive: 1}));
  assert.equal(r.ok, false);
  assert.equal(snap(p), text);
  assert.deepEqual(resultOf(p).responses, before.responses);
  done('V1.C12.revealed-original-immutable');
});
const stageTest = (id, fn) => test(`${id} [spec v3]`, () => { fn(); done(id); });
const expectOk = (p, a) => { const r = applyAction(p, a); assert.equal(r.ok, true, JSON.stringify(r)); return r.progress; };
const expectInvalid = (p, a) => { deepFreeze(p); const t = snap(p); const r = applyAction(p, a); assert.equal(r.ok, false, `${a.type} should be invalid`); wellFormedErrors(r); assert.equal(snap(p), t); };
stageTest('V1.stage.initial-context', () => { assert.equal(stageOf(initialProgress(session)), 'context'); });
stageTest('V1.stage.advance.context-to-prediction', () => assert.equal(stageOf(expectOk(initialProgress(session), act.advanceStage())), 'prediction'));
stageTest('V1.stage.advance.prediction-blocked-empty', () => expectInvalid(play(reach('prediction')), act.advanceStage()));
stageTest('V1.stage.advance.prediction-after-record', () => assert.equal(stageOf(expectOk(play([act.advanceStage(), act.recordPrediction(baselinePrediction)]), act.advanceStage())), 'simulation'));
stageTest('V1.stage.advance.prediction-after-skip', () => assert.equal(stageOf(expectOk(play([act.advanceStage(), act.skipPrediction()]), act.advanceStage())), 'simulation'));
stageTest('V1.stage.advance.simulation-to-assessment', () => assert.equal(stageOf(expectOk(play(reach('simulation')), act.advanceStage())), 'assessment'));
stageTest('V1.stage.advance.assessment-to-return', () => assert.equal(stageOf(expectOk(play(reach('assessment')), act.advanceStage())), 'return'));
stageTest('V1.stage.advance.return-to-map', () => assert.equal(stageOf(expectOk(play(reach('return')), act.advanceStage())), 'map'));
stageTest('V1.stage.goto.reached', () => {
  const p = play(reach('simulation'));
  for (const stage of ['context', 'prediction', 'simulation']) assert.equal(stageOf(expectOk(p, act.goToStage(stage))), stage);
});
stageTest('V1.stage.goto.unreached', () => {
  const p = play(reach('prediction'));
  for (const stage of ['simulation', 'assessment', 'return', 'map']) expectInvalid(p, act.goToStage(stage));
});
stageTest('V1.stage.goto.record-unchanged', () => {
  const p = play([...reach('assessment'), act.recordPrediction(predC4, 'transfer'), act.recordFreeResponse('question', '질문')]);
  const before = resultOf(p);
  const back = expectOk(expectOk(p, act.goToStage('context')), act.goToStage('simulation'));
  assert.deepEqual(resultOf(back), before);
});
stageTest('V1.stage.complete.invalid-before-map', () => { for (const stage of STAGES.slice(0, 5)) expectInvalid(play(reach(stage)), act.completeLesson()); });
stageTest('V1.stage.complete.valid-at-map', () => {
  const p = play(reach('map'));
  assert.equal(resultOf(p).state, 'partial');
  const done_ = expectOk(p, act.completeLesson());
  const r = resultOf(done_);
  assert.equal(r.state, 'completed');
  assert.deepEqual(validateDocument(r, 'result'), {ok: true, errors: []});
});
stageTest('V1.stage.complete.repeat-invalid', () => expectInvalid(play([...reach('map'), act.completeLesson()]), act.completeLesson()));
stageTest('V1.stage.input-actions.invalid-before-simulation', () => {
  for (const stage of ['context', 'prediction']) for (const a of [act.setInput('defectPercent', 5), act.applyScenario('candidate-b'), act.resetInputs()]) expectInvalid(play(reach(stage)), a);
});
for (const how of ['record', 'skip']) stageTest(`V1.stage.transfer-${how}-reveals`, () => {
  const p = play([...reach('assessment'), how === 'record' ? act.recordPrediction(predC4, 'transfer') : act.skipPrediction('transfer')]);
  expectInvalid(p, act.reveal('transfer'));
  assert.equal(applyAction(p, act.retryPrediction(predC4, 'transfer')).ok, true, 'transfer is already revealed so retry is allowed');
});

// ================= v5 additions =================
const trackOf = (progress, name) => progress[name];
for (const state of C.V1_STATES) test(`V1.predictionState.baseline.${state} [spec v5]`, () => {
  const p = deepFreeze(play(C.V1_PATH[state]));
  assert.equal(predictionState(trackOf(p, 'baseline')), state);
  assert.equal(predictionState(trackOf(p, 'transfer')), 'empty', 'transfer track untouched by baseline actions');
  done(`V1.predictionState.baseline.${state}`);
});
for (const t of C.V1_TRANSFER_STATES) test(`${t.id} [spec v5]`, () => {
  const p = deepFreeze(play([...reach('assessment'), ...t.actions]));
  assert.equal(predictionState(trackOf(p, 'transfer')), t.state);
  assert.equal(predictionState(trackOf(p, 'baseline')), 'recorded', 'baseline track untouched by transfer actions');
  done(t.id);
});
const validResult = () => resultOf(play(C.v3Actions('supported', 'none', 'completed')));
test('V3.shape.valid [spec v5] validateResultShape accepts a real result', () => {
  const r = validResult();
  assert.deepEqual(validateDocument(r, 'result'), {ok: true, errors: []});
  assert.deepEqual(validateResultShape(deepFreeze(structuredClone(r))), {ok: true, errors: []});
  done('V3.shape.valid');
});
for (const v of C.V3_SHAPE) test(`${v.id} [spec v5] ${v.code} ${v.path}`, () => {
  const r = validResult(); v.mutate(r); reseal(r);
  const got = validateResultShape(r);
  assert.equal(got.ok, false); wellFormedErrors(got);
  assert.ok(got.errors.some(e => e.code === v.code && e.path === v.path), JSON.stringify(got.errors));
  assert.deepEqual(got.errors, validateDocument(r, 'result').errors, 'same code/path as T1 validateDocument');
  done(v.id);
});
for (const m of C.V4_MULTI) test(`${m.id} [spec v5] errors ordered by code then path`, () => {
  const r = validateSessionConfig(deepFreeze(structuredClone(m.value)));
  assert.equal(r.ok, false); wellFormedErrors(r);
  assert.deepEqual(r.errors, m.errors);
  done(m.id);
});

// ================= content-hash spec v1: V8 validateResultShape, V10 build/finalize signature checks =================
const sealedResult = () => validResult();
const shapeErrors = r => { const got = validateResultShape(deepFreeze(r)); return got; };
test('CH-V8.valid [V8/C1] a sealed v2 result is accepted', () => {
  const r = sealedResult();
  assert.equal(r.version, 2);
  assert.match(r.contentHash, HASH_FORMAT);
  assert.deepEqual(shapeErrors(r), {ok: true, errors: []});
  done('CH-V8.valid');
});
test('CH-V8.version-1 [V8/C7] version 1 is rejected as VERSION /version', () => {
  const r = sealedResult(); r.version = 1; reseal(r);
  assert.deepEqual(shapeErrors(r), {ok: false, errors: [{code: 'VERSION', path: '/version'}]});
  done('CH-V8.version-1');
});
test('CH-V8.hash-missing [V8/C6] missing contentHash is REQUIRED /contentHash', () => {
  const r = sealedResult(); delete r.contentHash;
  assert.deepEqual(shapeErrors(r), {ok: false, errors: [{code: 'REQUIRED', path: '/contentHash'}]});
  done('CH-V8.hash-missing');
});
test('CH-V8.hash-format [V8/C6] malformed contentHash is VALUE /contentHash', () => {
  const hex = sealedResult().contentHash.slice(7);
  for (const bad of [hex, `sha1-${hex}`, `sha256-${hex.toUpperCase()}`, `sha256-${hex.slice(1)}`, `sha256-${hex}0`, `sha256-g${hex.slice(1)}`]) {
    const r = sealedResult(); r.contentHash = bad;
    assert.deepEqual(shapeErrors(r), {ok: false, errors: [{code: 'VALUE', path: '/contentHash'}]}, bad);
  }
  done('CH-V8.hash-format');
});
// Signature property (spec Signatures: "hash 재계산은 하지 않는다"), not one of the four V8 coverage items.
test('CH-V8.hash-not-recomputed [Signatures] a well-formed but stale hash is accepted by the synchronous shape check', () => {
  const r = sealedResult(); r.responses[0].answer = 'tampered';
  assert.deepEqual(shapeErrors(r), {ok: true, errors: []});
  done('CH-V8.hash-not-recomputed');
});
// Signature checks supporting F10; not tied to a V-number.
test('CH-V10.build-result-v2 [Signatures] buildResult returns the v2 body without contentHash', () => {
  const r = buildResult(play(C.v3Actions('supported', 'none', 'completed')), lesson, session, NOW);
  assert.equal(r.version, 2);
  assert.equal(Object.hasOwn(r, 'contentHash'), false);
  assert.equal(r.kind, 'result');
  done('CH-V10.build-result-v2');
});
test('CH-V10.finalize-result [Signatures] finalizeResult adds the oracle hash and leaves the input untouched', async () => {
  const body = deepFreeze(buildResult(play(C.v3Actions('supported', 'none', 'completed')), lesson, session, NOW));
  const before = snap(body);
  const out = await finalizeResult(body);
  assert.equal(snap(body), before, 'input not mutated');
  assert.equal(out.contentHash, oracleHash(body));
  assert.equal(out.contentHash, await computeContentHash(body));
  assert.deepEqual({...out, contentHash: undefined}, {...body, contentHash: undefined});
  assert.deepEqual(Object.keys(out), [...Object.keys(body), 'contentHash']);
  assert.deepEqual(validateDocument(out, 'result'), {ok: true, errors: []});
  done('CH-V10.finalize-result');
});

// ================= EG1/EG2: transfer target and 1e-9 tolerance =================
const trSig = result => { const tr = result.responses.filter(r => r.purpose === 'prediction').slice(1); return tr.map(r => ({attempt: r.attempt, answerNull: r.answer === null, visibility: r.visibility, prev: r.previousResponseId === null ? null : tr.findIndex(x => x.responseId === r.previousResponseId)})); };
function trExpected(cell) {
  const firstNull = cell.state === 'revealed-skip' || (cell.state === 'empty' && cell.type === 'skipPrediction');
  const n = cell.type === 'retryPrediction' ? (cell.state === 'retried' ? 3 : 2) : 1;
  return Array.from({length: n}, (_, i) => ({attempt: i + 1, answerNull: i === 0 ? firstNull : false, visibility: i === 0 ? 'before-output' : 'after-output', prev: i === 0 ? null : i - 1}));
}
for (const cell of C.V1_TR_CELLS) test(`${cell.id} [spec v7] ${cell.expect}`, () => {
  const before = deepFreeze(play(C.TR_PATH[cell.state]));
  const text = snap(before), prior = resultOf(before);
  const r = applyAction(before, cell.action);
  assert.equal(snap(before), text);
  if (cell.expect === 'invalid') { assert.equal(r.ok, false); wellFormedErrors(r); assert.deepEqual(resultOf(before).responses, prior.responses, 'original kept'); }
  else {
    assert.equal(r.ok, true, JSON.stringify(r));
    const after = resultOf(r.progress);
    assert.deepEqual(validateDocument(after, 'result'), {ok: true, errors: []});
    assert.deepEqual(trSig(after), trExpected(cell));
    assert.deepEqual(predSig(after)[0], predSig(prior)[0], 'baseline untouched');
    assert.equal(predictionState(r.progress.transfer), cell.type === 'retryPrediction' ? 'retried' : 'revealed');
    const origAfter = after.responses.filter(x => x.purpose === 'prediction')[1];
    if (cell.state === 'empty') {
      assert.equal(origAfter.attempt, 1); assert.equal(origAfter.previousResponseId, null); assert.equal(origAfter.visibility, 'before-output');
      assert.equal(origAfter.answer === null, cell.type === 'skipPrediction', 'new original is null only when skipped');
    } else assert.deepEqual(origAfter, prior.responses.filter(x => x.purpose === 'prediction')[1], 'original transfer response kept');
  }
  done(cell.id);
});
for (const item of C.V1_TR_INVALID) test(`${item.id} [spec v7] invalid action leaves transfer progress unchanged`, () => {
  const before = deepFreeze(play(C.TR_PATH[item.state]));
  const text = snap(before);
  let r; assert.doesNotThrow(() => { r = applyAction(before, item.action); });
  assert.equal(r.ok, false); wellFormedErrors(r); assert.equal(snap(before), text);
  done(item.id);
});
for (const c of C.V2_TOL) test(`${c.id} [spec v7] ${c.status}`, () => {
  const r = gradeTransferPrediction(deepFreeze(structuredClone(c.prediction)), deepFreeze(structuredClone(c.expected)));
  assert.equal(r.status, c.status);
  assert.deepEqual(C.sorted(r.mismatched), C.sorted(c.mismatched));
  done(c.id);
});
test('V3.transfer.retry-chain [spec v7] retries chain by previousResponseId; calculate-transfer stays on the original', () => {
  const base = [...reach('assessment'), act.recordPrediction(predC4, 'transfer')];
  const orig = resultOf(play(base)).responses.filter(x => x.purpose === 'prediction')[1];
  const r = resultOf(play([...base, act.retryPrediction({...predC4, truePositive: 0}, 'transfer'), act.retryPrediction({...predC4, truePositive: 1}, 'transfer')]));
  assert.deepEqual(validateDocument(r, 'result'), {ok: true, errors: []});
  const tr = r.responses.filter(x => x.purpose === 'prediction').slice(1);
  assert.deepEqual(tr.map(x => x.attempt), [1, 2, 3]);
  assert.deepEqual(tr.map(x => x.previousResponseId), [null, tr[0].responseId, tr[1].responseId]);
  assert.deepEqual(tr.map(x => x.visibility), ['before-output', 'after-output', 'after-output']);
  assert.deepEqual(tr[0], orig, 'original unchanged');
  const t = r.assessments.find(a => a.criterionId === 'calculate-transfer');
  assert.equal(t.responseId, tr[0].responseId); assert.equal(t.status, 'supported');
  assert.ok(!r.assessments.some(a => [tr[1].responseId, tr[2].responseId].includes(a.responseId)), 'retries not graded');
  done('V3.transfer.retry-chain');
});
test('V3.transfer.retry-chain-skipped [spec v7] skipped original stays skipped after retry', () => {
  const r = resultOf(play([...reach('assessment'), act.skipPrediction('transfer'), act.retryPrediction(predC4, 'transfer')]));
  assert.deepEqual(validateDocument(r, 'result'), {ok: true, errors: []});
  const tr = r.responses.filter(x => x.purpose === 'prediction').slice(1);
  assert.equal(tr[0].answer, null); assert.equal(tr[1].previousResponseId, tr[0].responseId);
  const t = r.assessments.find(a => a.criterionId === 'calculate-transfer');
  assert.equal(t.status, 'skipped'); assert.equal(t.responseId, tr[0].responseId);
  assert.ok(!r.assessments.some(a => a.responseId === tr[1].responseId));
  done('V3.transfer.retry-chain-skipped');
});

// ================= V2 =================
for (const c of C.V2_CASES) test(`${c.id} [spec v3] ${c.status}`, () => {
  const p = c.prediction === null ? null : deepFreeze(structuredClone(c.prediction)), e = deepFreeze(structuredClone(c.expected));
  const r = gradeTransferPrediction(p, e);
  assert.equal(r.status, c.status);
  if (c.mismatched !== undefined) {
    assert.deepEqual(C.sorted(r.mismatched), C.sorted(c.mismatched));
    assert.deepEqual(C.sorted(r.matched), C.sorted(FIELDS.filter(f => !c.mismatched.includes(f))));
  }
  assert.deepEqual(gradeTransferPrediction(p, e), r, 'deterministic');
  done(c.id);
});

// ================= V3 =================
const toProgress = (pred, help, state) => play(C.v3Actions(pred, help, state));
function checkResult(result, {state, pred, help, s = session}) {
  assert.deepEqual(validateDocument(result, 'result'), {ok: true, errors: []});
  assert.deepEqual(crossCheckResult(result, lesson), []);
  assert.equal(result.state, state);
  for (const k of ['profileId', 'resultId', 'baseMapRevision', 'sequence', 'previousResultId']) assert.equal(result[k], s[k], k);
  assert.equal(result.lessonId, lesson.lessonId); assert.equal(result.lessonRevision, lesson.lessonRevision);
  if (help) for (const r of result.responses) assert.equal(r.help, help, `response ${r.responseId} help`);
  const crit = new Map(lesson.rubric.criteria.map(c => [c.criterionId, c]));
  for (const a of result.assessments) if (crit.get(a.criterionId).mode === 'agent') {
    assert.ok(['pending', 'skipped'].includes(a.status), `agent dimension ${a.criterionId} must not be judged automatically`);
    if (a.status === 'pending') assert.equal(a.reviewer, 'unreviewed');
  }
  if (pred) {
    const t = result.assessments.find(a => a.criterionId === 'calculate-transfer');
    if (pred === 'pending') assert.ok(!t || t.status === 'pending');
    else {
      assert.ok(t, 'calculate-transfer assessment present');
      assert.equal(t.status, pred);
      if (pred !== 'skipped') assert.equal(t.reviewer, 'automatic');
      const resp = result.responses.find(r => r.responseId === t.responseId);
      assert.equal(resp.purpose, 'prediction'); assert.equal(resp.attempt, 1); assert.equal(resp.previousResponseId, null);
      assert.equal(resp.visibility, 'before-output');
      assert.equal(resp.answer === null, pred === 'skipped');
    }
    const d = result.assessments.find(a => a.criterionId === 'distinguish-denominators');
    if (pred === 'pending') assert.equal(d, undefined); else assert.equal(d?.status, pred === 'skipped' ? 'skipped' : 'pending');
    for (const c of ['explain-transfer', 'ask-for-evidence', 'justify-choice']) { const a = result.assessments.find(x => x.criterionId === c); assert.equal(a?.status, 'pending', c); assert.equal(a.reviewer, 'unreviewed'); }
  }
}
for (const c of C.V3_CASES) test(`${c.id} [spec v3]`, () => {
  const p = deepFreeze(toProgress(c.pred, c.help, c.state));
  const text = snap(p);
  const result = resultOf(p);
  assert.equal(snap(p), text, 'buildResult does not mutate progress');
  checkResult(result, c);
  assert.deepEqual(resultOf(p), result, 'deterministic');
  done(c.id);
});
for (const d of C.V3_DIM) test(`${d.id} [spec v3] agent dimension ${d.status} per evaluation mapping`, () => {
  const result = resultOf(play(C.dimActions(d.criterion, d.status)));
  checkResult(result, {state: 'partial'});
  const mine = result.assessments.filter(a => a.criterionId === d.criterion);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].status, d.status);
  if (d.status === 'pending') assert.equal(mine[0].reviewer, 'unreviewed');
  for (const other of C.AGENT_CRITERIA.filter(c => c !== d.criterion)) assert.equal(result.assessments.filter(a => a.criterionId === other).length, 0, `no response, no assessment: ${other}`);
  done(d.id);
});
test('V3.session.custom [spec v2] session values are copied, not hard-coded', () => {
  const s = C.CUSTOM_SESSION;
  const result = withHash(buildResult(play(C.v3Actions('supported', 'agent', 'partial'), initialProgress(s)), lesson, s, NOW));
  checkResult(result, {state: 'partial', s});
  done('V3.session.custom');
});
test('V3.retry.previous-response [spec v3] retry linked to original, original kept; retry not assessed', () => {
  const p = play([...reach('simulation'), act.reveal(), act.retryPrediction({...baselinePrediction, truePositive: 91})]);
  const result = resultOf(p);
  checkResult(result, {state: 'partial'});
  const [a, b] = result.responses.filter(r => r.purpose === 'prediction');
  assert.equal(b.previousResponseId, a.responseId); assert.equal(b.visibility, 'after-output'); assert.equal(a.visibility, 'before-output');
  const original = resultOf(play([...reach('simulation'), act.reveal()])).responses.find(r => r.purpose === 'prediction');
  assert.deepEqual(a, original);
  assert.ok(!result.assessments.some(x => x.responseId === b.responseId), 'retry response is not judged');
  done('V3.retry.previous-response');
});
test('V3.initial-progress [spec v2] untouched progress exports a valid partial result', () => {
  const s = deepFreeze(structuredClone(session));
  const p = initialProgress(s);
  assert.deepEqual(initialProgress(s), p);
  assert.deepEqual(s, session);
  const r = resultOf(p);
  checkResult(r, {state: 'partial'});
  assert.deepEqual(r.assessments, [], 'no responses, no assessments');
  assert.equal(initialProgress(s).stage, 'context');
  done('V3.initial-progress');
});

test('V3.calculation-error [spec v3] failure is a calculation-error response with pending calculate-transfer', () => {
  const ok = play([...reach('assessment'), act.recordPrediction(predC4, 'transfer')]);
  const broken = {...ok, transfer: {...ok.transfer, calculationError: {code: 'RANGE', path: '/defectPercent'}}};
  const r = resultOf(broken);
  assert.deepEqual(validateDocument(r, 'result'), {ok: true, errors: []});
  assert.ok(r.responses.some(x => x.purpose === 'calculation-error'));
  const t = r.assessments.find(a => a.criterionId === 'calculate-transfer');
  assert.equal(t.status, 'pending');
  assert.ok(!r.assessments.some(a => a.status === 'not_demonstrated'), 'calculation failure is not a lack of understanding');
  done('V3.calculation-error');
});
test('V3.help.default-unknown [spec v3]', () => {
  const r = resultOf(play(reach('assessment')));
  assert.ok(r.responses.length > 0);
  for (const x of r.responses) assert.equal(x.help, 'unknown');
  done('V3.help.default-unknown');
});
test('V3.help.hint-raised [spec v3] openHint raises unknown/none to hint, keeps agent', () => {
  for (const [start, expected] of [[null, 'hint'], ['none', 'hint'], ['unknown', 'hint'], ['agent', 'agent']]) {
    const r = resultOf(play([...reach('assessment'), ...(start ? [act.setHelp(start)] : []), act.openHint(1), act.recordFreeResponse('question', `q-${start}`)]));
    assert.equal(r.responses.at(-1).help, expected, String(start));
  }
  done('V3.help.hint-raised');
});
test('V3.recorded-at [spec v3] recordedAt = action.at else now (Date or ISO)', () => {
  const at = '2026-10-05T01:02:03.000Z';
  const p = play([...reach('assessment'), act.recordFreeResponse('question', 'with-at', at), act.recordFreeResponse('choice', 'no-at')]);
  for (const now of [NOW, new Date(NOW)]) {
    const r = withHash(buildResult(p, lesson, session, now));
    assert.equal(r.responses.find(x => x.answer === 'with-at').recordedAt, at);
    assert.equal(r.responses.find(x => x.answer === 'no-at').recordedAt, NOW);
    assert.deepEqual(validateDocument(r, 'result'), {ok: true, errors: []});
  }
  done('V3.recorded-at');
});

// ================= V4 session config =================
const hasError = (r, code, path) => r.errors.some(e => e.code === code && e.path === path);
for (const c of C.V4_SESSION) test(`${c.id} [spec v3]`, () => {
  for (const [value, code] of c.values) {
    const input = deepFreeze(C.sessionVariant(c.field, c.kind, value));
    const r = validateSessionConfig(input);
    const label = `${c.field}/${c.kind}/${JSON.stringify(value)}`;
    if (c.kind === 'valid') { assert.deepEqual(r, {ok: true, value: input}, label); continue; }
    assert.equal(r.ok, false, label); wellFormedErrors(r);
    assert.ok(hasError(r, code, `/${c.field}`), `${label} expects ${code} at /${c.field}: ${JSON.stringify(r.errors)}`);
    if (['profileId', 'resultId', 'baseMapRevision', 'extra'].includes(c.field)) assert.equal(r.errors.length, 1, label);
  }
  done(c.id);
});
for (const c of C.V4_STATE) test(`${c.id} [spec v3] sequence 1 iff previousResultId null`, () => {
  const r = validateSessionConfig(deepFreeze(structuredClone(c.value)));
  assert.equal(r.ok, false); wellFormedErrors(r);
  assert.deepEqual(r.errors, [{code: 'STATE', path: '/previousResultId'}]);
  done(c.id);
});
for (const c of C.V4_ROOTS) test(`${c.id} [spec v3]`, () => {
  const r = validateSessionConfig(c.value);
  assert.equal(r.ok, false); wellFormedErrors(r);
  assert.deepEqual(r.errors, [{code: 'TYPE', path: ''}]);
  done(c.id);
});

// ================= V4 storage =================
function fakeStorage(initial = {}, {getThrows = false, setThrows = false} = {}) {
  const map = new Map(Object.entries(initial)), calls = [];
  return {
    getItem(k) { calls.push(['get', k]); if (getThrows) throw new Error('SecurityError'); return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { calls.push(['set', k]); if (setThrows) throw new Error('QuotaExceededError'); map.set(k, String(v)); },
    removeItem(k) { calls.push(['remove', k]); map.delete(k); },
    calls, map,
  };
}
const unwrap = r => { assert.deepEqual(Object.keys(r).sort(), ['notice', 'progress']); return {progress: r.progress, notice: r.notice}; };
const savedText = (progress, s = session) => { const st = fakeStorage(); assert.deepEqual(saveProgress(st, progress), {ok: true}); return st.map.get(storageKey(s)); };
const richProgress = () => play([...reach('simulation'), act.setInput('defectPercent', 12), act.reveal(), act.recordFreeResponse('choice', '이유')]);
function assertFailedLoad(r, kind, initial) {
  const {progress, notice} = unwrap(r);
  assert.deepEqual(progress, JSON.parse(JSON.stringify(initial)), 'starts from initial progress');
  assert.equal(notice, kind);
}
function mutateStored(text, regex, replace) {
  const doc = JSON.parse(text); let hit = 0;
  (function walk(o) { for (const [k, v] of Object.entries(o)) { if (v && typeof v === 'object') walk(v); else if (regex.test(k)) { o[k] = replace(v); hit++; } } })(doc.progress);
  assert.ok(hit > 0, `stored progress exposes a field matching ${regex}`);
  return JSON.stringify(doc);
}
const initial = initialProgress(session);
for (const c of C.V4_STORAGE) test(`${c.id} [spec v3]`, () => {
  const key = storageKey();
  const rich = richProgress();
  if (c.name === 'normal') {
    const st = fakeStorage();
    assert.deepEqual(saveProgress(st, rich), {ok: true});
    assert.deepEqual(Object.keys(JSON.parse(st.map.get(key))).sort(), ['progress', 'schemaVersion']);
    assert.equal(JSON.parse(st.map.get(key)).schemaVersion, 1);
    assert.deepEqual(JSON.parse(st.map.get(key)).progress, JSON.parse(JSON.stringify(rich)));
    const {progress, notice} = unwrap(loadProgress(st, session));
    assert.deepEqual(progress, JSON.parse(JSON.stringify(rich)));
    assert.equal(notice, null);
  } else if (c.name === 'absent') {
    const {progress, notice} = unwrap(loadProgress(fakeStorage(), session));
    assert.deepEqual(progress, JSON.parse(JSON.stringify(initial))); assert.equal(notice, null);
  } else if (c.name === 'corrupt-json') {
    for (const bad of ['{not json', '', '[]', 'null', '"x"']) {
      const st = fakeStorage({[key]: bad});
      assertFailedLoad(loadProgress(st, session), 'load-failed', initial);
      assert.equal(st.map.get(key), bad, 'corrupt value kept until user progress saves');
      assert.equal(st.calls.filter(x => x[0] !== 'get').length, 0, 'no write or remove on load');
      assert.deepEqual(saveProgress(st, rich), {ok: true});
      assert.equal(JSON.parse(st.map.get(key)).schemaVersion, 1, 'overwritten only by explicit save');
    }
  } else if (c.name === 'schema-version') {
    const doc = JSON.parse(savedText(rich));
    for (const v of [2, 0, '1', undefined]) {
      const text = JSON.stringify({...doc, schemaVersion: v}); const st = fakeStorage({[key]: text});
      assertFailedLoad(loadProgress(st, session), 'load-failed', initial); assert.equal(st.map.get(key), text);
    }
  } else if (c.name === 'result-mismatch') {
    const other = {...session, resultId: 'another-result'};
    const text = savedText(initialProgress(other), other);
    const st = fakeStorage({[key]: text});
    assertFailedLoad(loadProgress(st, session), 'load-failed', initial); assert.equal(st.map.get(key), text);
  } else if (c.name === 'lesson-id-mismatch') {
    const text = mutateStored(savedText(rich), /lessonId/i, () => 'another-lesson'); const st = fakeStorage({[key]: text});
    assertFailedLoad(loadProgress(st, session), 'load-failed', initial); assert.equal(st.map.get(key), text);
  } else if (c.name === 'lesson-revision-mismatch') {
    const text = mutateStored(savedText(rich), /lessonRevision/i, v => v + 1); const st = fakeStorage({[key]: text});
    assertFailedLoad(loadProgress(st, session), 'load-failed', initial); assert.equal(st.map.get(key), text);
  } else if (c.name === 'get-throws') {
    let r; assert.doesNotThrow(() => { r = loadProgress(fakeStorage({}, {getThrows: true}), session); });
    assertFailedLoad(r, 'unavailable', initial);
  } else {
    let r; const st = fakeStorage({}, {setThrows: true});
    assert.doesNotThrow(() => { r = saveProgress(st, rich); });
    assert.deepEqual(r, {ok: false, reason: 'unavailable'});
  }
  done(c.id);
});

// ================= V4 build CLI =================
function distDigest() {
  const dir = join(root, 'dist');
  if (!existsSync(dir)) return 'ABSENT';
  const h = createHash('sha256');
  (function walk(d) { for (const name of readdirSync(d).sort()) { const p = join(d, name); if (statSync(p).isDirectory()) { h.update(`D:${p}`); walk(p); } else { h.update(`F:${p}:${statSync(p).size}`); h.update(readFileSync(p)); } } })(dir);
  return h.digest('hex');
}
const tmp = mkdtempSync(join(tmpdir(), 'ltt-session-'));
test.after(() => rmSync(tmp, {recursive: true, force: true}));
function cliInput(ref) {
  if (ref === 'missing-file') return {path: join(tmp, 'absent.json')};
  if (ref === 'no-argument') return {args: []};
  if (ref === 'json-parse') return {text: '{"profileId": '};
  const root_ = C.V4_ROOTS.find(c => c.id === ref);
  if (root_) return {text: JSON.stringify(root_.value), value: root_.value};
  const st_ = C.V4_STATE.find(x => x.id === ref);
  if (st_) return {text: JSON.stringify(st_.value), value: st_.value};
  const c = C.V4_SESSION.find(x => x.id === ref);
  const value = C.sessionVariant(c.field, c.kind, c.values[0][0]);
  return {text: JSON.stringify(value), value};
}
for (const c of C.V4_CLI) test(`${c.id} [spec v3] build exits nonzero, reports code and path, dist untouched`, () => {
  const input = cliInput(c.ref);
  const path = input.path ?? join(tmp, `${c.id}.json`);
  if (input.text !== undefined) writeFileSync(path, input.text);
  const before = distDigest();
  const r = spawnSync(process.execPath, ['scripts/build-lesson.mjs', ...(input.args ?? ['--session', path])], {cwd: root, encoding: 'utf8', timeout: 60000});
  assert.notEqual(r.status, 0, `exit status ${r.status}`);
  assert.equal(r.error, undefined);
  assert.ok(r.stderr.trim().length > 0, 'diagnostic on stderr');
  if ('value' in input) {
    const expected = validateSessionConfig(input.value);
    assert.equal(expected.ok, false);
    for (const e of expected.errors) { assert.ok(r.stderr.includes(e.code), `stderr names code ${e.code}: ${r.stderr}`); assert.ok(r.stderr.includes(e.path === '' ? '/' : e.path) || e.path === '', `stderr names path ${e.path}`); }
  }
  assert.equal(distDigest(), before, 'dist unchanged');
  done(c.id);
});

// ================= format (spec F2 display formats; learning/format.mjs coverage) =================
test('V7.format.count [spec v3] ko-KR grouping; non-integers up to 3 decimals', () => {
  for (const [n, s] of [[0, '0'], [90, '90'], [9405, '9,405'], [10000, '10,000'], [1.35, '1.35'], [0.15, '0.15'], [499.925, '499.925'], [9498.575, '9,498.575']]) assert.equal(formatCount(n), s, String(n));
  done('V7.format.count');
});
test('V7.format.ratio [spec v3] percent with 2 decimals', () => {
  for (const [r, s] of [[2 / 13, '15.38%'], [9495 / 10000, '94.95%'], [1, '100.00%'], [0, '0.00%'], [40 / 89, '44.94%'], [2 / 3, '66.67%'], [80 / 179, '44.69%']]) assert.equal(formatRatio(r), s, String(r));
  done('V7.format.ratio');
});

// ================= completeness (must stay last) =================
test('manifest lists every declared item and every item is exercised', () => {
  const ids = [...C.V1_CELLS, ...C.V1_INVALID, ...C.V2_CASES, ...C.V3_CASES, ...C.V3_DIM, ...C.V4_SESSION, ...C.V4_STATE, ...C.V4_ROOTS, ...C.V4_STORAGE, ...C.V4_CLI].map(x => x.id).concat(C.V1_TR_CELLS.map(x => x.id), C.V1_TR_INVALID.map(x => x.id), C.V2_TOL.map(x => x.id), C.V1_FLOWS, C.V1_STAGE, C.V1_TRANSFER_STATES.map(x => x.id), C.V1_STATES.map(x => `V1.predictionState.baseline.${x}`), ['V3.shape.valid'], C.V3_SHAPE.map(x => x.id), C.CH_ITEMS, C.V4_MULTI.map(x => x.id), C.V3_EXTRA, C.V4_FORMAT);
  const nodeRows = manifest.filter(r => !r.layer);
  assert.equal(new Set(nodeRows.map(r => r.id)).size, nodeRows.length);
  assert.deepEqual(nodeRows.map(r => r.id).sort(), ids.sort(), 'manifest equals declared items');
  for (const r of manifest) assert.equal(r.obligationId, r.id.split('.')[0]);
  // independently derived counts from the spec's declared dimensions
  assert.equal(C.V1_CELLS.length, 5 * 11);
  assert.ok(C.V1_STATES.every(s => C.V1_INVALID.filter(x => x.state === s).length >= 1));
  assert.equal(C.V2_CASES.filter(x => /^V2\.(truePositive|falsePositive|falseNegative|trueNegative|positiveCount|positivePredictiveValue|accuracy)\./.test(x.id)).length, 7 * 5);
  assert.deepEqual(C.V2_CASES.filter(x => x.id.startsWith('V2.count.')).map(x => x.id), ['V2.count.0', 'V2.count.1', 'V2.count.6', 'V2.count.7']);
  assert.equal(C.V3_CASES.length, 2 * 5 * 4);
  assert.equal(C.V1_TR_CELLS.length, 4 * 4);
  assert.equal(C.V2_TOL.length, 2 * 4);
  assert.equal(C.V3_DIM.length, 4 * 2);
  assert.equal(C.V4_SESSION.length, 5 * 4 + 2 + 1);
  assert.equal(C.V4_STATE.length, 2);
  for (const r of nodeRows) assert.ok(exercised.has(r.id), `not exercised: ${r.id}`);
  assert.ok(nodeRows.every(r => !r.blocked), 'no blocked items remain');
  const specSources = readdirSync(new URL('./e2e/', import.meta.url)).filter(f => f.endsWith('.spec.mjs')).map(f => readFileSync(new URL(`./e2e/${f}`, import.meta.url), 'utf8')).join('\n');
  for (const id of C.E2E_ITEMS) assert.ok(specSources.includes(`[${id}`), `e2e title missing for ${id}`);
  assert.deepEqual(manifest.filter(r => r.layer === 'e2e').map(r => r.id), C.E2E_ITEMS);
});
