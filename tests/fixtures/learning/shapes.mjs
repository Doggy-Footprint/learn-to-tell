// Shapes follow spec v3 "Shapes and stage flow": action = {type, at?}; prediction ratios in %, PPV null = undefined chosen,
// skipped grade input = null; expected = T2 value (ratios 0-1).
import {readFileSync} from 'node:fs';
import {inspectionLesson} from '../../../examples/manufacturing-inspection/lesson.mjs';

export const session = JSON.parse(readFileSync(new URL('./session.valid.json', import.meta.url), 'utf8'));
export const session2 = JSON.parse(readFileSync(new URL('./session.second.json', import.meta.url), 'utf8'));
export const lesson = inspectionLesson;
export const NOW = '2026-10-05T00:00:00.000Z';
export const FIELDS = ['truePositive', 'falsePositive', 'falseNegative', 'trueNegative', 'positiveCount', 'positivePredictiveValue', 'accuracy'];
export const COUNT_FIELDS = FIELDS.slice(0, 5);
export const RATIO_FIELDS = FIELDS.slice(5);
export const STAGES = ['context', 'prediction', 'simulation', 'assessment', 'return', 'map'];
export const storageKey = (s = session) => `learn-to-tell:${lesson.lessonId}:${lesson.lessonRevision}:${s.resultId}`;

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
export function reach(stage, how = 'record') {
  const idx = STAGES.indexOf(stage), a = [];
  if (idx >= 1) a.push(act.advanceStage());
  if (idx >= 2) a.push(how === 'skip' ? act.skipPrediction() : act.recordPrediction(baselinePrediction), act.advanceStage());
  for (let i = 3; i <= idx; i++) a.push(act.advanceStage());
  return a;
}

export const expectedC4 = {truePositive: 160, falsePositive: 196, falseNegative: 40, trueNegative: 9604, positiveCount: 356, positivePredictiveValue: 40 / 89, accuracy: 9764 / 10000};
export const predC4 = {truePositive: 160, falsePositive: 196, falseNegative: 40, trueNegative: 9604, positiveCount: 356, positivePredictiveValue: 44.94, accuracy: 97.64};
export const baselinePrediction = {truePositive: 90, falsePositive: 495, falseNegative: 10, trueNegative: 9405, positiveCount: 585, positivePredictiveValue: 15.38, accuracy: 94.95};
export const retryPrediction = {truePositive: 91, falsePositive: 494, falseNegative: 9, trueNegative: 9406, positiveCount: 585, positivePredictiveValue: 15.56, accuracy: 94.97};
