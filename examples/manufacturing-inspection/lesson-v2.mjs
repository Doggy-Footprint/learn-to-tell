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
const cards = {
  'defect-rate': {
    meaning: '전체 제품 중 실제로 결함이 있는 제품의 비율입니다. 분모는 전체 제품입니다.',
    example: '10,000개 중 100개가 결함이면 결함 비율은 1%입니다.',
    confusion: '“양성인 제품의 비율”과 다릅니다. 양성은 검사가 표시한 결과일 뿐입니다.',
    plain: '결함 비율 = 결함 제품 수 ÷ 전체 제품 수',
  },
  'detection-rate': {
    meaning: '실제 결함 제품 중 검사가 양성으로 표시하는 비율입니다. 분모는 실제 결함 제품입니다.',
    example: '결함 100개 중 90개를 양성으로 찾으면 검출률은 90%입니다.',
    confusion: '“양성 중 결함 비율(PPV)”과 다릅니다. 분모가 결함 전체인지 양성 전체인지 구분하세요.',
    plain: '검출률 = TP ÷ (TP + FN)',
  },
  'false-positive-rate': {
    meaning: '정상 제품 중 검사가 양성으로 잘못 표시하는 비율입니다. 분모는 정상 제품입니다.',
    example: '정상 9,900개 중 5%를 양성으로 표시하면 495개입니다.',
    confusion: '전체 제품 중 오탐 비율이 아닙니다. 분모는 전체가 아니라 정상 제품입니다.',
    plain: '오탐률 = FP ÷ (FP + TN)',
  },
  'positive-predictive-value': {
    meaning: '양성으로 표시된 제품 중 실제 결함인 비율입니다. 분모는 양성 총수입니다.',
    example: 'TP 90, FP 495이면 양성 585개 중 90개가 결함이라 PPV는 약 15.38%입니다.',
    confusion: '검출률이나 전체 정확도로 읽으면 안 됩니다. 양성이 아닌 제품은 PPV의 분모에 들어가지 않습니다.',
    plain: 'PPV = TP ÷ (TP + FP). 양성이 0개이면 분모가 없어 정의되지 않습니다.',
  },
  'overall-accuracy': {
    meaning: '전체 제품 중 결함은 양성, 정상은 음성으로 맞게 분류한 비율입니다. 분모는 전체 제품입니다.',
    example: 'TP 90, TN 9,405이면 10,000개 중 9,495개를 맞게 분류해 94.95%입니다.',
    confusion: '“양성이 실제 결함일 확률”이 아닙니다. 정확도가 높아도 PPV는 낮을 수 있습니다.',
    plain: '전체 정확도 = (TP + TN) ÷ 전체 제품 수',
  },
};
const labels = {'baseline-a': '기본 검사 A', 'population-contrast': '결함 10% 집단 대비', 'candidate-b': '검사 B'};
const scenario = ({scenarioId, inputs}) => ({scenarioId, label: labels[scenarioId], values: Object.entries(inputs).map(([field, value]) => ({inputId: inspectionModel.inputIds[field], value}))});

export const inspectionLessonV2 = {
  ...inspectionLesson,
  version: 2,
  concepts: inspectionLesson.concepts.map(concept => ({...concept, ...cards[concept.conceptId]})),
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
