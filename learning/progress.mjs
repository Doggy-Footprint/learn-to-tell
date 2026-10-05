import {calculateInspection, inspectionModel} from '../examples/manufacturing-inspection/model.mjs';
import {inspectionLesson, inspectionScenarios} from '../examples/manufacturing-inspection/lesson.mjs';
import {inspectionAssessmentGuide} from '../examples/manufacturing-inspection/assessment-guide.mjs';
import {COUNT_FIELDS, PREDICTION_FIELDS} from './grading.mjs';

export const INPUT_FIELDS = Object.keys(inspectionModel.inputIds);
export const HELP_LEVELS = ['none', 'hint', 'agent', 'unknown'];
export const FREE_KINDS = ['question', 'choice', 'apply'];
export const STAGES = ['context', 'prediction', 'simulation', 'assessment', 'return', 'map'];
export const TARGETS = ['baseline', 'transfer'];
export const DEFAULT_INPUTS = Object.fromEntries(INPUT_FIELDS.map(field => [field, inspectionLesson.inputs.find(input => input.inputId === inspectionModel.inputIds[field]).default]));

const fail = (code, path) => ({ok: false, errors: [{code, path}]});
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const emptyTrack = extra => ({original: null, revealed: false, retries: [], ...extra});

export function initialProgress(session) {
  return {
    lessonId: inspectionLesson.lessonId,
    lessonRevision: inspectionLesson.lessonRevision,
    resultId: session.resultId,
    inputs: {...DEFAULT_INPUTS},
    previousInputs: null,
    scenarioId: null,
    stage: 'context',
    reached: 'context',
    help: 'unknown',
    hintDepth: 0,
    baseline: emptyTrack(),
    transfer: emptyTrack({inputs: {...inspectionAssessmentGuide.transferCase.inputs}, calculationError: false}),
    responses: {question: null, choice: null, apply: null},
    completed: false,
  };
}

export function predictionState(track) {
  if (track.original === null) return 'empty';
  if (track.retries.length) return 'retried';
  if (track.revealed) return 'revealed';
  return track.original.values === null ? 'skipped' : 'recorded';
}

function predictionValues(values) {
  if (!isRecord(values)) return {errors: [{code: 'TYPE', path: '/values'}]};
  const errors = [];
  const out = {};
  for (const key of Object.keys(values)) if (!PREDICTION_FIELDS.includes(key)) errors.push({code: 'UNKNOWN_FIELD', path: `/values/${key}`});
  for (const field of PREDICTION_FIELDS) {
    const path = `/values/${field}`;
    const item = values[field];
    if (!Object.hasOwn(values, field)) errors.push({code: 'REQUIRED', path});
    else if (field === 'positivePredictiveValue' && item === null) out[field] = null;
    else if (typeof item !== 'number' || !Number.isFinite(item)) errors.push({code: 'TYPE', path});
    else if (item < 0 || (!COUNT_FIELDS.includes(field) && item > 100)) errors.push({code: 'RANGE', path});
    else out[field] = item;
  }
  return errors.length ? {errors} : {values: out};
}

const stamp = action => typeof action.at === 'string' ? action.at : null;

// A failed calculation must leave the transfer track unrevealed so nothing is shown or graded from it.
function settleTransfer(next) {
  if (calculateInspection(next.transfer.inputs).ok) {
    next.transfer.revealed = true;
    next.transfer.calculationError = false;
  } else next.transfer.calculationError = true;
}

function target(next, action) {
  if (!TARGETS.includes(action.target)) return {error: fail('VALUE', '/target')};
  return {track: next[action.target]};
}

const simulating = next => STAGES.indexOf(next.stage) >= STAGES.indexOf('simulation');

function changeInputs(next, inputs) {
  if (INPUT_FIELDS.some(field => inputs[field] !== next.inputs[field])) next.previousInputs = {...next.inputs};
  next.inputs = {...inputs};
}

const handlers = {
  setInput(next, action) {
    if (!simulating(next)) return fail('STATE', '/type');
    if (!INPUT_FIELDS.includes(action.field)) return fail('VALUE', '/field');
    if (typeof action.value !== 'number' || !Number.isFinite(action.value)) return fail('TYPE', '/value');
    if (action.value < 0 || action.value > 100) return fail('RANGE', '/value');
    changeInputs(next, {...next.inputs, [action.field]: action.value});
    next.scenarioId = null;
  },
  applyScenario(next, action) {
    if (!simulating(next)) return fail('STATE', '/type');
    const scenario = inspectionScenarios.find(item => item.scenarioId === action.scenarioId);
    if (!scenario) return fail('REFERENCE', '/scenarioId');
    changeInputs(next, scenario.inputs);
    next.scenarioId = scenario.scenarioId;
  },
  resetInputs(next) {
    if (!simulating(next)) return fail('STATE', '/type');
    changeInputs(next, DEFAULT_INPUTS);
    next.scenarioId = null;
  },
  recordPrediction(next, action) {
    const picked = target(next, action);
    if (picked.error) return picked.error;
    if (picked.track.original !== null) return fail('STATE', '/type');
    const checked = predictionValues(action.values);
    if (checked.errors) return {ok: false, errors: checked.errors};
    picked.track.original = {values: checked.values, help: next.help, at: stamp(action)};
    if (action.target === 'transfer') settleTransfer(next);
  },
  skipPrediction(next, action) {
    const picked = target(next, action);
    if (picked.error) return picked.error;
    if (picked.track.original !== null) return fail('STATE', '/type');
    picked.track.original = {values: null, help: next.help, at: stamp(action)};
    if (action.target === 'transfer') settleTransfer(next);
  },
  reveal(next, action) {
    const picked = target(next, action);
    if (picked.error) return picked.error;
    if (picked.track.original === null || picked.track.revealed) return fail('STATE', '/type');
    if (action.target === 'transfer') settleTransfer(next);
    else picked.track.revealed = true;
  },
  retryPrediction(next, action) {
    const picked = target(next, action);
    if (picked.error) return picked.error;
    if (!picked.track.revealed) return fail('STATE', '/type');
    const checked = predictionValues(action.values);
    if (checked.errors) return {ok: false, errors: checked.errors};
    picked.track.retries.push({values: checked.values, help: next.help, at: stamp(action)});
  },
  recordFreeResponse(next, action) {
    if (!FREE_KINDS.includes(action.kind)) return fail('VALUE', '/kind');
    if (action.answer !== null && typeof action.answer !== 'string') return fail('TYPE', '/answer');
    next.responses[action.kind] = action.answer === null ? {text: null, help: next.help, at: stamp(action)}
      : action.answer.trim() === '' ? null : {text: action.answer, help: next.help, at: stamp(action)};
  },
  openHint(next, action) {
    if (typeof action.level !== 'number' || !Number.isInteger(action.level)) return fail('TYPE', '/level');
    if (action.level < 1 || action.level > inspectionAssessmentGuide.hints.length) return fail('RANGE', '/level');
    next.hintDepth = action.level;
    if (next.help === 'none' || next.help === 'unknown') next.help = 'hint';
  },
  setHelp(next, action) {
    if (!HELP_LEVELS.includes(action.level)) return fail('VALUE', '/level');
    next.help = action.level;
  },
  completeLesson(next) {
    if (next.stage !== 'map' || next.completed) return fail('STATE', '/type');
    next.completed = true;
  },
  advanceStage(next) {
    const index = STAGES.indexOf(next.stage);
    if (index === STAGES.length - 1) return fail('STATE', '/type');
    if (next.stage === 'prediction' && next.baseline.original === null) return fail('STATE', '/type');
    next.stage = STAGES[index + 1];
    if (STAGES.indexOf(next.reached) < index + 1) next.reached = next.stage;
  },
  goToStage(next, action) {
    if (!STAGES.includes(action.stage)) return fail('VALUE', '/stage');
    if (STAGES.indexOf(action.stage) > STAGES.indexOf(next.reached)) return fail('STATE', '/stage');
    next.stage = action.stage;
  },
};

export function applyAction(progress, action) {
  if (!isRecord(action)) return fail('TYPE', '');
  if (typeof action.type !== 'string' || !Object.hasOwn(handlers, action.type)) return fail('VALUE', '/type');
  const next = structuredClone(progress);
  return handlers[action.type](next, action) ?? {ok: true, progress: next};
}
