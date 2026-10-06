// Generic-runtime shapes (spec 65ba74b36b0ef5da v1): inputs are keyed by inputId, predictions by outputId in display units (raw * scale).
// The action key `field` of setInput carries an inputId; the spec does not rename it (kept from the pre-generic action shape).
import {model as inspectionModel} from '../../../examples/manufacturing-inspection/model.mjs';
import {model as syntheticModel} from './synthetic-model.mjs';
import {createRuntime} from '../../../learning/progress.mjs';
import {lesson, syntheticLesson, STAGES, baselinePrediction} from './data.mjs';

export * from './data.mjs';
export const model = inspectionModel;
export {syntheticModel};
export const runtime = createRuntime(lesson, model);
export const syntheticRuntime = createRuntime(syntheticLesson, syntheticModel);

export const act = {
  setInput: (field, value, at) => ({type: 'setInput', field, value, ...(at && {at})}),
  applyScenario: scenarioId => ({type: 'applyScenario', scenarioId}),
  resetInputs: () => ({type: 'resetInputs'}),
  recordPrediction: (values, target = 'baseline', at) => ({type: 'recordPrediction', target, values, ...(at && {at})}),
  skipPrediction: (target = 'baseline', at) => ({type: 'skipPrediction', target, ...(at && {at})}),
  reveal: (target = 'baseline') => ({type: 'reveal', target}),
  retryPrediction: (values, target = 'baseline', at) => ({type: 'retryPrediction', target, values, ...(at && {at})}),
  recordFreeResponse: (kind, answer, at) => ({type: 'recordFreeResponse', kind, answer, ...(at && {at})}),
  openHint: level => ({type: 'openHint', level}),
  setHelp: level => ({type: 'setHelp', level}),
  completeLesson: () => ({type: 'completeLesson'}),
  advanceStage: () => ({type: 'advanceStage'}),
  goToStage: stage => ({type: 'goToStage', stage}),
};
export const ACTION_TYPES = ['setInput', 'applyScenario', 'resetInputs', 'recordPrediction', 'skipPrediction', 'reveal', 'retryPrediction', 'recordFreeResponse', 'openHint', 'setHelp', 'completeLesson'];

// Actions that reach `stage` from a fresh progress; baseline is recorded or skipped on the way to simulation.
export function reach(stage, how = 'record', baseline = baselinePrediction) {
  const idx = STAGES.indexOf(stage), a = [];
  if (idx >= 1) a.push(act.advanceStage());
  if (idx >= 2) a.push(how === 'skip' ? act.skipPrediction() : act.recordPrediction(baseline), act.advanceStage());
  for (let i = 3; i <= idx; i++) a.push(act.advanceStage());
  return a;
}
