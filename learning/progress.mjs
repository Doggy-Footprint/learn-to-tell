export const HELP_LEVELS = ['none', 'hint', 'agent', 'unknown'];
export const FREE_KINDS = ['question', 'choice', 'apply'];
export const STAGES = ['context', 'prediction', 'simulation', 'assessment', 'return', 'map'];
export const TARGETS = ['baseline', 'transfer'];
export const HINT_LEVELS = 2;

const fail = (code, path) => ({ok: false, errors: [{code, path}]});
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const emptyTrack = extra => ({original: null, revealed: false, retries: [], ...extra});
const scenarioInputs = scenario => Object.fromEntries(scenario.values.map(({inputId, value}) => [inputId, value]));

export function createRuntime(lesson, model) {
  const defaultInputs = Object.fromEntries(lesson.inputs.map(input => [input.inputId, input.default]));
  const transferScenario = lesson.scenarios.find(item => item.scenarioId === lesson.transfer.scenarioId);
  const expectedFor = inputs => {
    const calculated = model.calculate(inputs);
    if (!calculated.ok) return null;
    return Object.fromEntries(lesson.outputs.map(({outputId, scale}) => [outputId, calculated.value[outputId] === null ? null : calculated.value[outputId] * scale]));
  };
  const baselineInputs = scenarioInputs(lesson.scenarios[0]);
  const transferInputs = scenarioInputs(transferScenario);
  return {
    lesson,
    model,
    inputIds: lesson.inputs.map(input => input.inputId),
    inputs: lesson.inputs,
    outputs: lesson.outputs,
    defaultInputs,
    stages: STAGES,
    scenarios: lesson.scenarios.filter(item => item !== transferScenario),
    scenarioInputs,
    baselineScenario: lesson.scenarios[0],
    baselineInputs,
    transferScenario,
    transferInputs,
    expectedFor,
    baselineExpected: expectedFor(baselineInputs),
    transferExpected: expectedFor(transferInputs),
  };
}

export function initialProgress(session, runtime) {
  return {
    lessonId: runtime.lesson.lessonId,
    lessonRevision: runtime.lesson.lessonRevision,
    resultId: session.resultId,
    inputs: {...runtime.defaultInputs},
    previousInputs: null,
    scenarioId: null,
    stage: 'context',
    reached: 'context',
    help: 'unknown',
    hintDepth: 0,
    baseline: emptyTrack(),
    transfer: emptyTrack({inputs: {...runtime.transferInputs}, calculationError: false}),
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

function predictionValues(values, outputs) {
  if (!isRecord(values)) return {errors: [{code: 'TYPE', path: '/values'}]};
  const errors = [];
  const out = {};
  for (const key of Object.keys(values)) if (!outputs.some(output => output.outputId === key)) errors.push({code: 'UNKNOWN_FIELD', path: `/values/${key}`});
  for (const {outputId, nullable} of outputs) {
    const path = `/values/${outputId}`;
    const item = values[outputId];
    if (!Object.hasOwn(values, outputId)) errors.push({code: 'REQUIRED', path});
    else if (nullable && item === null) out[outputId] = null;
    else if (typeof item !== 'number' || !Number.isFinite(item)) errors.push({code: 'TYPE', path});
    else out[outputId] = item;
  }
  return errors.length ? {errors} : {values: out};
}

const stamp = action => typeof action.at === 'string' ? action.at : null;

// A failed calculation must leave the transfer track unrevealed so nothing is shown or graded from it.
function settleTransfer(next, runtime) {
  if (runtime.model.calculate(next.transfer.inputs).ok) {
    next.transfer.revealed = true;
    next.transfer.calculationError = false;
  } else next.transfer.calculationError = true;
}

function target(next, action) {
  if (!TARGETS.includes(action.target)) return {error: fail('VALUE', '/target')};
  return {track: next[action.target]};
}

const simulating = next => STAGES.indexOf(next.stage) >= STAGES.indexOf('simulation');

function changeInputs(next, inputs, runtime) {
  if (runtime.inputIds.some(inputId => inputs[inputId] !== next.inputs[inputId])) next.previousInputs = {...next.inputs};
  next.inputs = {...inputs};
}

const handlers = {
  setInput(next, action, runtime) {
    if (!simulating(next)) return fail('STATE', '/type');
    const spec = runtime.inputs.find(input => input.inputId === action.field);
    if (!spec) return fail('VALUE', '/field');
    if (typeof action.value !== 'number' || !Number.isFinite(action.value)) return fail('TYPE', '/value');
    if (action.value < spec.min || action.value > spec.max) return fail('RANGE', '/value');
    changeInputs(next, {...next.inputs, [action.field]: action.value}, runtime);
    next.scenarioId = null;
  },
  applyScenario(next, action, runtime) {
    if (!simulating(next)) return fail('STATE', '/type');
    const scenario = runtime.scenarios.find(item => item.scenarioId === action.scenarioId);
    if (!scenario) return fail('REFERENCE', '/scenarioId');
    changeInputs(next, runtime.scenarioInputs(scenario), runtime);
    next.scenarioId = scenario.scenarioId;
  },
  resetInputs(next, action, runtime) {
    if (!simulating(next)) return fail('STATE', '/type');
    changeInputs(next, runtime.defaultInputs, runtime);
    next.scenarioId = null;
  },
  recordPrediction(next, action, runtime) {
    const picked = target(next, action);
    if (picked.error) return picked.error;
    if (picked.track.original !== null) return fail('STATE', '/type');
    const checked = predictionValues(action.values, runtime.outputs);
    if (checked.errors) return {ok: false, errors: checked.errors};
    picked.track.original = {values: checked.values, help: next.help, at: stamp(action)};
    if (action.target === 'transfer') settleTransfer(next, runtime);
  },
  skipPrediction(next, action, runtime) {
    const picked = target(next, action);
    if (picked.error) return picked.error;
    if (picked.track.original !== null) return fail('STATE', '/type');
    picked.track.original = {values: null, help: next.help, at: stamp(action)};
    if (action.target === 'transfer') settleTransfer(next, runtime);
  },
  reveal(next, action, runtime) {
    const picked = target(next, action);
    if (picked.error) return picked.error;
    if (picked.track.original === null || picked.track.revealed) return fail('STATE', '/type');
    if (action.target === 'transfer') settleTransfer(next, runtime);
    else picked.track.revealed = true;
  },
  retryPrediction(next, action, runtime) {
    const picked = target(next, action);
    if (picked.error) return picked.error;
    if (!picked.track.revealed) return fail('STATE', '/type');
    const checked = predictionValues(action.values, runtime.outputs);
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
    if (action.level < 1 || action.level > HINT_LEVELS) return fail('RANGE', '/level');
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

export function applyAction(progress, action, runtime) {
  if (!isRecord(action)) return fail('TYPE', '');
  if (typeof action.type !== 'string' || !Object.hasOwn(handlers, action.type)) return fail('VALUE', '/type');
  const next = structuredClone(progress);
  return handlers[action.type](next, action, runtime) ?? {ok: true, progress: next};
}
