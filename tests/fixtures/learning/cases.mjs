import {session2, act, INPUT_IDS, OUTPUT_IDS as FIELDS, COUNT_FIELDS, RATIO_FIELDS, predC4, expectedC4, pred, baselinePrediction, retryPrediction} from './shapes.mjs';

// ---- V1: state transition table (independent of production). Spec v3 "예측 상태 전이" + stage rules.
// Prediction state is per target; cells use target baseline. empty is observed at stage prediction, others at stage simulation.
import {reach} from './shapes.mjs';
export const V1_STATES = ['empty', 'recorded', 'skipped', 'revealed', 'retried'];
const rec = act.recordPrediction(baselinePrediction), skp = act.skipPrediction(), rvl = act.reveal(), rty = act.retryPrediction(retryPrediction), adv = act.advanceStage();
export const V1_PATH = {
  empty: reach('prediction'),
  recorded: [adv, rec, adv],
  skipped: [adv, skp, adv],
  revealed: [adv, rec, adv, rvl],
  retried: [adv, rec, adv, rvl, rty],
};
const payload = {
  setInput: act.setInput('defect-percent', 12), applyScenario: act.applyScenario('candidate-b'), resetInputs: act.resetInputs(),
  recordPrediction: act.recordPrediction(retryPrediction), skipPrediction: act.skipPrediction(), reveal: act.reveal(), retryPrediction: act.retryPrediction(retryPrediction),
  recordFreeResponse: act.recordFreeResponse('question', '필요한 정보는 무엇인가'), openHint: act.openHint(1), setHelp: act.setHelp('hint'), completeLesson: act.completeLesson(),
};
const outcome = (state, type) => {
  switch (type) {
    case 'setInput': case 'applyScenario': case 'resetInputs': return state === 'empty' ? 'invalid' : 'ok';
    case 'recordPrediction': case 'skipPrediction': return state === 'empty' ? 'ok' : 'invalid';
    case 'reveal': return state === 'recorded' || state === 'skipped' ? 'ok' : 'invalid';
    case 'retryPrediction': return state === 'revealed' || state === 'retried' ? 'ok' : 'invalid';
    case 'completeLesson': return 'invalid';
    default: return 'ok';
  }
};
const nextState = (state, type) => outcome(state, type) === 'invalid' ? state : type === 'recordPrediction' ? 'recorded' : type === 'skipPrediction' ? 'skipped' : type === 'reveal' ? 'revealed' : type === 'retryPrediction' ? 'retried' : state;
export const V1_CELLS = [];
for (const state of V1_STATES) for (const type of Object.keys(payload)) V1_CELLS.push({id: `V1.cell.${state}.${type}`, state, type, action: payload[type], expect: outcome(state, type), next: nextState(state, type)});
export const V1_MALFORMED = {
  'unknown-type': {type: 'selfDestruct'}, 'null': null, 'no-type': {}, 'non-object': 'reveal',
  'setHelp-bogus': {type: 'setHelp', level: 'bogus'}, 'openHint-level-3': {type: 'openHint', level: 3}, 'openHint-level-0': {type: 'openHint', level: 0},
  'applyScenario-bogus': {type: 'applyScenario', scenarioId: 'no-such-scenario'}, 'setInput-bad-field': {type: 'setInput', field: 'bogus', value: 5},
  'freeResponse-bad-kind': {type: 'recordFreeResponse', kind: 'bogus', answer: 'x'}, 'goToStage-bogus': {type: 'goToStage', stage: 'nowhere'},
};
export const V1_INVALID = [];
for (const state of V1_STATES) for (const [name, action] of Object.entries(V1_MALFORMED)) V1_INVALID.push({id: `V1.invalid.${state}.${name}`, state, action});
export const V1_FLOWS = ['V1.C8.skip-hint-response-retry', 'V1.C12.revealed-original-immutable'];
export const V1_STAGE = [
  'V1.stage.initial-context', 'V1.stage.advance.context-to-prediction', 'V1.stage.advance.prediction-blocked-empty', 'V1.stage.advance.prediction-after-record',
  'V1.stage.advance.prediction-after-skip', 'V1.stage.advance.simulation-to-assessment', 'V1.stage.advance.assessment-to-return', 'V1.stage.advance.return-to-map',
  'V1.stage.goto.reached', 'V1.stage.goto.unreached', 'V1.stage.goto.record-unchanged',
  'V1.stage.complete.invalid-before-map', 'V1.stage.complete.valid-at-map', 'V1.stage.complete.repeat-invalid',
  'V1.stage.input-actions.invalid-before-simulation', 'V1.stage.transfer-record-reveals', 'V1.stage.transfer-skip-reveals',
];

export const V1_TRANSFER_STATES = [
  {id: 'V1.predictionState.transfer.empty', state: 'empty', actions: []},
  {id: 'V1.predictionState.transfer.revealed-after-record', state: 'revealed', actions: [act.recordPrediction(predC4, 'transfer')]},
  {id: 'V1.predictionState.transfer.revealed-after-skip', state: 'revealed', actions: [act.skipPrediction('transfer')]},
  {id: 'V1.predictionState.transfer.retried', state: 'retried', actions: [act.recordPrediction(predC4, 'transfer'), act.retryPrediction(predC4, 'transfer')]},
];
export const V3_SHAPE = [
  ['TYPE', '/responses', r => { r.responses = 'x'; }], ['REQUIRED', '/state', r => { delete r.state; }], ['UNKNOWN_FIELD', '/extra', r => { r.extra = 1; }],
  ['VALUE', '/resultId', r => { r.resultId = 'Bad Id'; }], ['RANGE', '/sequence', r => { r.sequence = 0; }], ['KIND', '/kind', r => { r.kind = 'map'; }],
  ['VERSION', '/version', r => { r.version = 1; }], ['STATE', '/previousResultId', r => { r.sequence = 2; r.previousResultId = null; }],
].map(([code, path, mutate]) => ({id: `V3.shape.${code}`, code, path, mutate}));
// ---- V1 on the transfer target (record/skip proceed straight to revealed)
export const TR_STATES = ['empty', 'revealed-record', 'revealed-skip', 'retried'];
const trRec = act.recordPrediction(predC4, 'transfer'), trSkp = act.skipPrediction('transfer'), trRty = act.retryPrediction(retryPrediction, 'transfer');
export const TR_PATH = {empty: reach('assessment'), 'revealed-record': [...reach('assessment'), trRec], 'revealed-skip': [...reach('assessment'), trSkp], retried: [...reach('assessment'), trRec, trRty]};
const trPayload = {recordPrediction: trRec, skipPrediction: trSkp, reveal: act.reveal('transfer'), retryPrediction: trRty};
export const V1_TR_CELLS = [];
for (const state of TR_STATES) for (const type of Object.keys(trPayload)) {
  const ok = (state === 'empty' && (type === 'recordPrediction' || type === 'skipPrediction')) || (state !== 'empty' && type === 'retryPrediction');
  V1_TR_CELLS.push({id: `V1.transfer.cell.${state}.${type}`, state, type, action: trPayload[type], expect: ok ? 'ok' : 'invalid'});
}
export const V1_TR_INVALID = [];
for (const state of TR_STATES) for (const [name, action] of Object.entries(V1_MALFORMED)) V1_TR_INVALID.push({id: `V1.transfer.invalid.${state}.${name}`, state, action});
// ---- V2 (legacy numbering): grading in display units; every output tolerance is 1 in the inspection lesson fixture
export const EB = pred(160, 196, 40, 9604, 356, 50, 75);
export const EB_PRED = EB;
export const DELTAS = [-1.01, -1, 0, 1, 1.01];
export const sorted = a => [...a].sort();
export const V2_CASES = [];
for (const field of FIELDS) for (const d of DELTAS) {
  const prediction = {...EB_PRED, [field]: EB_PRED[field] + d};
  const bad = Math.abs(d) > 1;
  V2_CASES.push({id: `V2.${field}.${d}`, prediction, expected: EB, status: bad ? 'partial' : 'supported', mismatched: bad ? [field] : []});
}
const wrongBy = Object.fromEntries(FIELDS.map(f => [f, RATIO_FIELDS.includes(f) ? 10 : 5]));
const withWrong = wrongFields => Object.fromEntries(FIELDS.map(f => [f, wrongFields.includes(f) ? EB_PRED[f] + wrongBy[f] : EB_PRED[f]]));
for (const [n, wrong] of [[0, FIELDS], [1, FIELDS.slice(1)], [6, ['accuracy']], [7, []]]) {
  V2_CASES.push({id: `V2.count.${n}`, prediction: withWrong(wrong), expected: EB, status: n === 7 ? 'supported' : n === 0 ? 'not_demonstrated' : 'partial', mismatched: wrong});
}
const NULL_EXPECTED = pred(0, 0, 0, 10000, 0, null, 100);
const NULL_PRED = NULL_EXPECTED;
V2_CASES.push(
  {id: 'V2.ppv-null.match', prediction: NULL_PRED, expected: NULL_EXPECTED, status: 'supported', mismatched: []},
  {id: 'V2.ppv-null.mismatch-number', prediction: {...NULL_PRED, 'positive-predictive-value': 0}, expected: NULL_EXPECTED, status: 'partial', mismatched: ['positive-predictive-value']},
  {id: 'V2.ppv-null.mismatch-undefined-chosen', prediction: {...predC4, 'positive-predictive-value': null}, expected: expectedC4, status: 'partial', mismatched: ['positive-predictive-value']},
  {id: 'V2.spec-c4', prediction: predC4, expected: expectedC4, status: 'supported', mismatched: []},
  {id: 'V2.skipped', prediction: null, expected: EB, status: 'skipped', mismatched: undefined},
);

// ---- V2 1e-9 correction: 0.57 * 100 is 56.99999999999999 in binary floating point
export const EC = {...EB, 'positive-predictive-value': 0.57 * 100, accuracy: 0.57 * 100};
export const V2_TOL = [];
for (const field of ['positive-predictive-value', 'accuracy']) for (const [p, ok] of [[58, true], [56, true], [58.02, false], [55.98, false]]) V2_TOL.push({id: `V2.tolerance.${field}.${p}`, prediction: {...EB_PRED, 'positive-predictive-value': 57, accuracy: 57, [field]: p}, expected: EC, status: ok ? 'supported' : 'partial', mismatched: ok ? [] : [field]});

// ---- V3
export const CH_ITEMS = ['CH-V8.valid', 'CH-V8.version-1', 'CH-V8.hash-missing', 'CH-V8.hash-format', 'CH-V8.hash-not-recomputed', 'CH-V10.build-result-v2', 'CH-V10.finalize-result'];
export const V3_STATES = ['partial', 'completed'];
export const V3_PRED = ['supported', 'partial', 'not_demonstrated', 'skipped', 'pending'];
export const V3_HELP = ['none', 'hint', 'agent', 'unknown'];
export const predictionFor = {supported: predC4, partial: {...predC4, 'true-positive': 163}, not_demonstrated: Object.fromEntries(FIELDS.map(f => [f, 0]))};
export function v3Actions(pred, help, state) {
  const a = [act.setHelp(help), ...reach('assessment')];
  if (help === 'hint') a.push(act.openHint(2));
  if (help !== 'hint') a.push(act.setHelp(help));
  if (pred === 'skipped') a.push(act.skipPrediction('transfer'));
  else if (pred !== 'pending') a.push(act.recordPrediction(predictionFor[pred], 'transfer'));
  a.push(act.recordFreeResponse('question', '비용과 성능 정보를 알려 주세요'), act.recordFreeResponse('choice', '누락 비용이 불확실하다'), act.recordFreeResponse('apply', '내 라인에 적용한다'));
  if (state === 'completed') a.push(act.advanceStage(), act.advanceStage(), act.completeLesson());
  return a;
}
export const V3_CASES = [];
for (const state of V3_STATES) for (const pred of V3_PRED) for (const help of V3_HELP) V3_CASES.push({id: `V3.${state}.${pred}.${help}`, state, pred, help});
// spec v3 evaluation mapping: transfer first prediction -> distinguish-denominators; apply -> explain-transfer; question -> ask-for-evidence; choice -> justify-choice
export const DIM_SOURCE = {'distinguish-denominators': 'transfer', 'explain-transfer': 'apply', 'ask-for-evidence': 'question', 'justify-choice': 'choice'};
export const AGENT_CRITERIA = Object.keys(DIM_SOURCE);
export function dimActions(criterion, status) {
  const a = reach('assessment'), src = DIM_SOURCE[criterion];
  if (src === 'transfer') a.push(status === 'pending' ? act.recordPrediction(predC4, 'transfer') : act.skipPrediction('transfer'));
  else a.push(act.recordFreeResponse(src, status === 'pending' ? '응답 내용' : null));
  return a;
}
export const V3_DIM = AGENT_CRITERIA.flatMap(c => ['pending', 'skipped'].map(s => ({id: `V3.dim.${c}.${s}`, criterion: c, status: s})));
export const V3_EXTRA = ['V3.session.custom', 'V3.retry.previous-response', 'V3.initial-progress', 'V3.calculation-error', 'V3.help.default-unknown', 'V3.help.hint-raised', 'V3.recorded-at', 'V3.transfer.retry-chain', 'V3.transfer.retry-chain-skipped'];
export const CUSTOM_SESSION = session2;

// ---- V4 session config (spec v3 codes: TYPE REQUIRED UNKNOWN_FIELD VALUE RANGE STATE)
const ID64 = 'a'.repeat(64), ID65 = 'a'.repeat(65);
const idFormat = ['Upper', '1abc', '', ID65, 'has space', 'under_score'].map(v => [v, 'VALUE']);
const T = values => values.map(v => [v, 'TYPE']);
export const SESSION_FIELDS = {
  profileId: {valid: ['local-learner', 'a', ID64], type: T([5, null, true, {}, []]), format: idFormat},
  resultId: {valid: ['inspection-result-1', 'x-1', ID64], type: T([5, null, true, {}, []]), format: idFormat},
  baseMapRevision: {valid: [1, 7], type: T(['1', null, true, {}]), format: [[1.5, 'VALUE']], range: [[0, 'RANGE'], [-1, 'RANGE']]},
  sequence: {valid: [1, 2, 99], type: T(['1', null, true, {}]), format: [[1.5, 'VALUE']], range: [[0, 'RANGE'], [-1, 'RANGE']]},
  previousResultId: {valid: [null, 'prev-result'], type: T([5, true, {}, []]), format: idFormat},
};
export const baseSession = {profileId: 'local-learner', resultId: 'inspection-result-1', baseMapRevision: 1, sequence: 1, previousResultId: null};
export const V4_SESSION = [];
for (const [field, spec] of Object.entries(SESSION_FIELDS)) {
  V4_SESSION.push({id: `V4.session.${field}.valid`, field, kind: 'valid', values: spec.valid.map(v => [v, null])});
  V4_SESSION.push({id: `V4.session.${field}.missing`, field, kind: 'missing', values: [[undefined, 'REQUIRED']]});
  V4_SESSION.push({id: `V4.session.${field}.type`, field, kind: 'type', values: spec.type});
  V4_SESSION.push({id: `V4.session.${field}.format`, field, kind: 'format', values: spec.format});
  if (spec.range) V4_SESSION.push({id: `V4.session.${field}.range`, field, kind: 'range', values: spec.range});
}
V4_SESSION.push({id: 'V4.session.extra', field: 'extra', kind: 'extra', values: [[1, 'UNKNOWN_FIELD'], [null, 'UNKNOWN_FIELD'], ['x', 'UNKNOWN_FIELD']]});
export const V4_STATE = [
  {id: 'V4.session.state.sequence1-with-previous', value: {...baseSession, previousResultId: 'prev-result'}},
  {id: 'V4.session.state.sequence2-null-previous', value: {...baseSession, sequence: 2}},
];
export const V4_ROOTS = [['null', null], ['array', []], ['string', 'x'], ['number', 5]].map(([n, value]) => ({id: `V4.session.root.${n}`, value}));
export function sessionVariant(field, kind, value) {
  const s = structuredClone(baseSession);
  if (kind === 'missing') delete s[field];
  else if (kind === 'extra') s.extra = value;
  else s[field] = value;
  if (kind === 'valid' && field === 'sequence' && value > 1 && s.previousResultId === null) s.previousResultId = 'prev-result';
  if (kind === 'valid' && field === 'previousResultId' && value !== null) s.sequence = 2;
  return s;
}
const cfg = o => ({...baseSession, ...o});
export const V4_MULTI = [
  {id: 'V4.session.multi.code-then-path', value: {...cfg({profileId: 5, resultId: 'Bad'}), zzz: 1}, errors: [{code: 'TYPE', path: '/profileId'}, {code: 'UNKNOWN_FIELD', path: '/zzz'}, {code: 'VALUE', path: '/resultId'}]},
  {id: 'V4.session.multi.same-code-path-order', value: cfg({profileId: 5, resultId: 5}), errors: [{code: 'TYPE', path: '/profileId'}, {code: 'TYPE', path: '/resultId'}]},
  {id: 'V4.session.multi.range-and-required', value: (() => { const v = cfg({baseMapRevision: 0, sequence: 0}); delete v.previousResultId; return v; })(), errors: [{code: 'RANGE', path: '/baseMapRevision'}, {code: 'RANGE', path: '/sequence'}, {code: 'REQUIRED', path: '/previousResultId'}].sort((a, b) => a.code < b.code ? -1 : a.code > b.code ? 1 : a.path < b.path ? -1 : 1)},
];

export const V4_STORAGE = ['normal', 'absent', 'corrupt-json', 'schema-version', 'result-mismatch', 'lesson-id-mismatch', 'lesson-revision-mismatch', 'get-throws', 'set-throws'].map(n => ({id: `V4.storage.${n}`, name: n}));
export const V4_CLI = [['no-file', 'missing-file'], ['bad-json', 'json-parse'], ...V4_ROOTS.map(r => [r.id.replace('V4.session.', ''), r.id]), ...V4_STATE.map(c => [c.id.replace('V4.session.', '').replace('.', '-'), c.id]), ...V4_SESSION.filter(c => c.kind !== 'valid').map(c => [`${c.field}-${c.kind}`, c.id])].map(([n, ref]) => ({id: `V4.cli.${n}`, ref}));
V4_CLI.push({id: 'V4.cli.no-argument', ref: 'no-argument'});

// ---- E2E items (titles carry `[id]`; node test checks the spec sources mention each prefix)
export const E2E_ITEMS_LEGACY = ['V5.S1', 'V5.S2', 'V5.S3', 'V5.S4', 'V5.S5', 'V5.S6', 'V5.S7', 'V5.S8', 'V5.S2.baseline-a', 'V5.S2.ppv-undefined', 'V5.S2.skipped-original', 'V5.S3.empty', 'V5.S3.non-numeric', 'V5.S3.reload', 'V5.S6.grade-partial', 'V5.S6.grade-not-demonstrated', 'V5.S6.transfer-retry', 'V5.S6.ppv-undefined', 'V5.S7.second-session', 'V5.S7.help-none', 'V5.S7.help-agent', 'V5.S7.response-skip', 'V8.S9', 'V8.S10', 'V8.S11', 'V6.axe.before-reveal', 'V6.axe.after-reveal', 'V6.axe.transfer', 'V6.axe.hint-open', 'V6.perf', 'V6.serve', 'CH-V7.partial', 'CH-V7.completed', 'CH-V11'];
export const C6_VALUES = [-0.01, 0, 0.01, 99.99, 100, 100.01];
export const C6_INPUTS = ['defect-percent', 'detection-percent', 'false-positive-percent'];
export {FIELDS, COUNT_FIELDS, RATIO_FIELDS};

// ================= T5-3 (spec 65ba74b36b0ef5da v1) obligations; ids are prefixed T53-
export const T53_RANGE = [];
for (const inputId of INPUT_IDS) for (const [name, value, ok] of [['min-minus', -0.01, false], ['min', 0, true], ['max', 100, true], ['max-plus', 100.01, false]]) T53_RANGE.push({id: `T53-V2.range.${inputId}.${name}`, inputId, value, ok});
export const T53_STORAGE = ['same-keys', 'other-keys', 'subset-keys', 'superset-keys', 'calculate-fails'].map(n => ({id: `T53-V2.storage.${n}`, name: n}));
export const T53_NULL_EXPECTED = ['given-null', 'given-number'].map(n => ({id: `T53-V2.nullable-expected.${n}`, name: n}));
export const T53_V2_EXTRA = ['T53-V2.runtime.shape', 'T53-V2.scenario.values', 'T53-V2.prediction-finite-only'];

// V3 grading lesson: per-output tolerances differ; accuracy has none (0).
export const T53_TOL = {'true-positive': 1, 'false-positive': 0.5, 'false-negative': 2, 'true-negative': 3, 'positive-count': 0.25, 'positive-predictive-value': 4, accuracy: 0};
export const T53_BASE = pred(100, 200, 50, 9650, 300, 33.5, 90);
// sign alternates by output so a missing Math.abs is caught
const SIGN = Object.fromEntries(FIELDS.map((f, i) => [f, i % 2 === 0 ? 1 : -1]));
export const T53_DIFF = [];
for (const f of FIELDS) for (const [name, extra] of [['absolute', 0], ['absolute+0.01', 0.01]]) T53_DIFF.push({id: `T53-V3.diff.${f}.${name}`, output: f, value: T53_BASE[f] + SIGN[f] * (T53_TOL[f] + extra), match: extra === 0});
export const T53_STATUS = ['supported', 'partial', 'not_demonstrated', 'skipped'].map(n => ({id: `T53-V3.status.${n}`, status: n}));
export const T53_V3_EXTRA = ['T53-V3.key-order-independent', 'T53-V3.result-per-output-tolerance'];

export const T53_HINT = [0, 1, 2, 3].map(level => ({id: `T53-V4.hint.level-${level}`, level, ok: level === 1 || level === 2}));
export const T53_V4_RESULT = ['T53-V4.result.inspection', 'T53-V4.result.synthetic', 'T53-V4.result.first-activity-and-concept', 'T53-V4.result.answer-serialization', 'T53-V4.result.context-phrase'];
export const T53_V5 = ['T53-V5.sources', 'T53-V5.extractor-controls'];
export const T53_IDS = [...T53_RANGE.map(x => x.id), ...T53_STORAGE.map(x => x.id), ...T53_NULL_EXPECTED.map(x => x.id), ...T53_V2_EXTRA, ...T53_DIFF.map(x => x.id), ...T53_STATUS.map(x => x.id), ...T53_V3_EXTRA, ...T53_HINT.map(x => x.id), ...T53_V4_RESULT, ...T53_V5];

export const E2E_ITEMS_T53 = ['T53-V8.stage-content', 'T53-V8.cards', 'T53-V8.hints', 'T53-V8.fields', 'T53-V8.output-bars', 'T53-V8.display-strings', 'T53-V8.bar-width-100', 'T53-V8.C12',
  'T53-V9.flow', 'T53-V9.range', 'T53-V9.display-strings', 'T53-V9.tables-bars', 'T53-V9.content-cards', 'T53-V9.no-manufacturing-text',
  'T53-V11.omitted', 'T53-V11.other', 'T53-V11.dist-missing', 'T53-V11.unknown-flag', 'T54-O5.target-diagnostic', 'T54-O5.target-lesson', 'T53-V13.lesson-screen'];
export const E2E_ITEMS = [...E2E_ITEMS_LEGACY, ...E2E_ITEMS_T53];
