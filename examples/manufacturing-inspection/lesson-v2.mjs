import {inspectionLesson, inspectionScenarios} from './lesson.mjs';
import {inspectionModel} from './model.mjs';

const output = (outputId, label, unit, scale, nullable = false) => ({outputId, label, unit, scale, nullable});
const tolerance = outputId => ({outputId, absolute: 1});
const outputs = [
  output('true-positive', 'TP: 찾은 결함', '개', 1),
  output('false-positive', 'FP: 잘못 양성인 정상', '개', 1),
  output('false-negative', 'FN: 놓친 결함', '개', 1),
  output('true-negative', 'TN: 맞게 음성인 정상', '개', 1),
  output('positive-count', '양성 총수', '개', 1),
  output('positive-predictive-value', 'PPV', '%', 100, true),
  output('accuracy', '전체 정확도', '%', 100),
];
const labels = {'baseline-a': '기본 검사 A', 'population-contrast': '결함 10% 집단 대비', 'candidate-b': '검사 B'};
const scenario = ({scenarioId, inputs}) => ({scenarioId, label: labels[scenarioId], values: Object.entries(inputs).map(([field, value]) => ({inputId: inspectionModel.inputIds[field], value}))});

export const inspectionLessonV2 = {
  ...inspectionLesson,
  version: 2,
  lessonRevision: 2,
  modelId: inspectionModel.modelId,
  modelRevision: inspectionModel.modelRevision,
  outputs,
  scenarios: [
    ...inspectionScenarios.map(scenario),
    {scenarioId: 'transfer-case', label: '새 사례 (결함 2%, 검출 80%, 오탐 2%)', values: [{inputId: 'defect-percent', value: 2}, {inputId: 'detection-percent', value: 80}, {inputId: 'false-positive-percent', value: 2}]},
  ],
  transfer: {scenarioId: 'transfer-case', tolerances: outputs.map(({outputId}) => tolerance(outputId))},
};
