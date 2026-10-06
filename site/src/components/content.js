export const HELP_LABELS = {none: '도움 없음', hint: '힌트 사용', agent: 'agent 도움 받음', unknown: '알 수 없음'};

export const SAFETY_NOTICE = '이 화면의 수치는 이 수업의 모델로 계산한 예시입니다. 실제 값이 아니며 실제 작업의 조치나 결정의 근거로 사용하지 마세요. 모델의 가정이 실제 상황에 맞는지는 따로 확인해야 합니다.';
export const OBSERVATION_NOTICE = '아래 판정과 표시는 이번 입력·공개 시점·도움 조건에서 관찰된 내용입니다. 다른 조건으로 일반화하지 않으며, 도움을 받은 기록도 수행 기록으로 남습니다.';
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
  '“정의되지 않음”은 이 입력에서 모델이 값을 정할 수 없다는 뜻입니다. 0이나 최선의 값을 뜻하지 않습니다.',
  '소수로 표시된 값은 모델이 계산한 기대값입니다. 화면은 소수 최대 3자리까지만 표시하고 계산은 원래 값을 씁니다.',
];
