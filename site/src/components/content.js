export const FIELD_LABELS = {
  truePositive: 'TP (결함이고 양성)',
  falsePositive: 'FP (정상인데 양성)',
  falseNegative: 'FN (결함인데 음성)',
  trueNegative: 'TN (정상이고 음성)',
  positiveCount: '양성 총수',
  positivePredictiveValue: 'PPV (양성 중 결함 비율)',
  accuracy: '전체 정확도',
};

export const INPUT_LABELS = {
  defectPercent: {suffix: 'defect', label: '결함 비율'},
  detectionPercent: {suffix: 'detection', label: '검출률'},
  falsePositivePercent: {suffix: 'false-positive', label: '오탐률'},
};

export const HELP_LABELS = {none: '도움 없음', hint: '힌트 사용', agent: 'agent 도움 받음', unknown: '알 수 없음'};

export const CONCEPT_CARDS = {
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

export const SAFETY_NOTICE = '이 화면의 수치는 가상의 제조 검사 사례를 계산한 예시입니다. 실제 검사 성능이 아니며 실제 제품의 폐기·정지·승인 같은 조치의 근거로 사용하지 마세요. 계산은 집단이 바뀌어도 검출률과 오탐률이 유지된다고 가정합니다.';
export const OBSERVATION_NOTICE = '아래 판정과 표시는 이번 입력·집단·공개 시점·도움 조건에서 관찰된 내용입니다. 다른 조건으로 일반화하지 않으며, 도움을 받은 기록도 수행 기록으로 남습니다.';
export const EXPORT_NOTICE = '다운로드는 map 저장이 아닙니다. 내려받은 파일의 경로를 agent에게 전달해야 agent가 검증하고 map에 반영합니다. 이 화면은 map을 저장하지 않습니다.';
export const EXPORT_BLOCKED_NOTICE = '결과가 계약 형식에 맞지 않아 파일을 만들지 않았습니다.';
export const STORAGE_NOTICES = {
  'load-failed': '저장된 진행을 불러오지 못함: 저장 값이 손상되었거나 다른 수업·버전의 값입니다. 처음 상태로 시작하며, 이번 학습을 진행해 저장하기 전에는 기존 값을 덮어쓰지 않습니다.',
  unavailable: '이 브라우저에 진행이 저장되지 않음: 저장소를 쓸 수 없습니다. 메모리 상태로 계속할 수 있으니 결과를 내보내 보관하세요.',
};

export const STATUS_LABELS = {
  supported: ['✓', '모두 일치', 'supported'],
  partial: ['△', '일부 일치', 'partial'],
  not_demonstrated: ['·', '이번 조건에서 일치가 관찰되지 않음', 'not_demonstrated'],
  skipped: ['–', '건너뜀', 'skipped'],
  pending: ['…', '계산 실패로 판정 보류', 'pending'],
};

export const NUMBER_NOTES = [
  'PPV는 양성 총수가 0이면 분모가 없어 “정의되지 않음(양성 0)”입니다. 0%나 완벽한 검사를 뜻하지 않습니다.',
  '소수 개수(예: 1.35)는 제품을 쪼갠다는 뜻이 아니라 같은 조건에서 기대하는 평균입니다. 실제 10,000개 표본의 개수는 정수이며 변동합니다. 화면은 소수 최대 3자리까지만 표시하고 계산은 원래 값을 씁니다.',
];
