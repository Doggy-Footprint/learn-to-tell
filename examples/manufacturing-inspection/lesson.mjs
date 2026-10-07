const concepts = [
  ['defect-rate', '결함 비율: 전체 중 실제 결함이 있는 비율'],
  ['detection-rate', '검출률: 실제 결함 중 양성으로 찾는 비율'],
  ['false-positive-rate', '오탐률: 정상 중 양성으로 잘못 표시하는 비율'],
  ['positive-predictive-value', 'PPV: 양성 중 실제 결함인 비율'],
  ['overall-accuracy', '전체 정확도: 전체 중 결함과 정상을 맞게 분류한 비율'],
].map(([conceptId, label]) => ({conceptId, conceptRevision: 1, label}));
const all = concepts.map(concept => concept.conceptId);
const content = (contentId, role, text, conceptIds = all) => ({contentId, role, text, conceptIds});

export const inspectionScenarios = [
  {scenarioId: 'baseline-a', inputs: {defectPercent: 1, detectionPercent: 90, falsePositivePercent: 5}},
  {scenarioId: 'population-contrast', inputs: {defectPercent: 10, detectionPercent: 90, falsePositivePercent: 5}},
  {scenarioId: 'candidate-b', inputs: {defectPercent: 1, detectionPercent: 80, falsePositivePercent: 1}},
];

export const inspectionLesson = {
  kind: 'lesson', version: 1, lessonId: 'manufacturing-inspection-lesson', lessonRevision: 1,
  profileId: 'local-learner', diagnosticId: 'inspection-diagnostic', candidateId: 'inspection-candidate', contextKind: 'interest',
  concepts,
  content: [
    content('diagnostic-cards', 'application', '2분: 공장에서 제품 10,000개를 검사한다. “검사 정확도가 높으면 양성 제품 대부분이 결함일까?”와 “결함이 더 흔한 생산 라인에서도 양성의 의미가 같을까?”에 먼저 예상과 이유를 한 문장씩 적는다. 내 문제와 익숙함·의외임·모르겠음·해당 없음 중 하나를 고르고, 양성이라는 말이 검사 표시인지 실제 결함인지 서로 확인한다. 이 응답은 지식 차이의 가설이며 한 번의 오답이나 자신감으로 능력을 판정하지 않는다.'),
    content('lesson-orientation', 'explanation', '1분: 이번에는 검사 A/B를 선택하고, 양성 제품의 자동 조치·추가 확인·보류를 비교한다. 계산 입력은 집단의 결함 비율과 검사별 검출률·오탐률이다. 현실에서 선택하는 결정 변수는 검사 종류와 후속 조치이며, 집단의 결함 비율을 마음대로 선택할 수는 없다. 수치는 가상 제조 사례다. 의료 판정이나 실제 생산 승인으로 사용하지 않는다. 18분은 설계 예산이며 개인별 시간이나 교육 효과를 보장하지 않는다.'),
    content('inspection-explanation', 'explanation', '분모를 구분하자. 결함 비율은 전체, 검출률은 실제 결함, 오탐률은 정상, PPV는 양성 전체, 전체 정확도는 제품 전체를 분모로 삼는다. 고정 N=10,000, p=결함 비율/100, s=검출률/100, f=오탐률/100일 때 TP=Nps, FP=N(1-p)f, FN=Np(1-s), TN=N(1-p)(1-f)다. TP는 찾은 결함, FP는 잘못 양성인 정상, FN은 놓친 결함, TN은 맞게 음성인 정상이다. PPV=TP/(TP+FP), 전체 정확도=(TP+TN)/N. 계산 정의 근거: MedCalc 공식 문서 https://www.medcalc.org/en/manual/roc-curve-analysis-predictive-values.php . 이는 예상값 계산이며 실제 통계 표본이나 신뢰구간 추정이 아니다.'),
    content('inspection-simulation', 'simulation', '6분 활동의 앞부분: 결과를 보기 전에 기본 A(결함 1%, 검출 90%, 오탐 5%)의 양성 중 결함 비율을 예상해 최초 답과 이유를 보존한다. 건너뛰어도 된다. 계산 후 A의 TP=90, FP=495, FN=10, TN=9,405를 전체 10,000칸 또는 같은 값의 표로 비교한다. 양성 585개 중 결함 90개라는 분모로 PPV를 설명한다. 다음 결과도 공개 전 예측한다. 검출률과 오탐률을 유지하고 결함 비율만 10%로 바꾸면 TP=900, FP=450, FN=100, TN=8,550이 된다. A로 초기화한 뒤 검사 B(1%,80%,1%)를 적용하면 TP=80, FP=99, FN=20, TN=9,801이다. 개별 입력을 탐색할 때는 한 번에 한 비율만 바꾸고 전후 값을 비교한다. A에서 B로 바꾸는 것은 검사 후보 하나의 선택 변경이지만 검출률과 오탐률 두 입력이 함께 달라지는 비교다. 이를 한 입력만 바꾼 실험으로 해석하지 않는다. 첫 예측을 덮어쓰지 않는다.'),
    content('inspection-application', 'application', 'A와 B 선택: A는 B보다 결함 10개를 더 찾지만 정상 제품 396개를 더 양성으로 보낸다. B는 오탐을 줄이지만 결함 누락이 10개 늘어난다. 기본 A의 PPV는 90/585, B는 80/179다. 이 차이를 보고 “놓친 결함 한 개의 비용은 얼마인가?”, “정상 제품을 멈추거나 폐기할 비용은?”, “추가 확인 처리 용량과 검사 비용은?”을 질문하자. 비용이 미정이면 한 검사가 항상 우월하다고 결론내리지 않고 선택을 보류한다. 핵심 선택 한 건을 대칭 비교한다: B 찬성 근거는 오탐 감소, 반대 근거는 결함 누락 증가다. 누락 비용이 크면 A가 유리할 수 있고, 정상 제품 정지 비용이 크면 B가 유리할 수 있다.'),
    content('inspection-failure', 'failure', 'A의 전체 정확도는 94.95%여도 PPV는 약 15.38%다. 전체 정확도를 “양성이 실제 결함일 확률”로 바꾸어 읽으면 실패한다. 결함이 드문 집단에는 정상 제품이 많아 작은 오탐률도 큰 FP를 만든다. 결함 10% 집단의 높은 PPV를 1% 집단에 그대로 가져오면 분모가 달라져 실패한다. 대비 계산은 집단이 바뀌어도 검출률·오탐률이 유지된다는 가정을 둔다. 실제 제품·라인·검사 환경에서 이 가정이 맞는지는 별도로 확인해야 한다.'),
    content('inspection-assessment', 'assessment', '5분 이해 확인의 앞부분: 설명과 이전 결과를 가린 뒤 새 사례의 입력은 결함 2%, 검출 80%, 오탐 2%다. 결과 공개 전에 TP·FP·FN·TN·양성 총수·PPV·전체 정확도를 예상하고 이유를 적는다. 기대값과 모범 응답은 검토자 자료에만 둔다. 처음 예상과 계산 뒤 설명을 별도 응답으로 보존한다. 검출률과 PPV의 분모를 구분하고, 기본 A의 PPV를 이 집단에 가져올 수 있는지 설명하라. 계산 도구 오류는 계산 실패로 남기고 이해 부족으로 채점하지 않는다. 예측을 건너뛰면 skipped, 자유 응답을 아직 검토하지 않았으면 pending으로 남긴다.'),
    content('action-explanation', 'explanation', '양성은 검사 표시이며 실제 결함 확정이 아니다. 자동 조치는 양성 제품을 바로 멈추거나 폐기하는 선택, 추가 확인은 별도 검사를 거치는 선택, 보류는 필요한 정보를 얻기 전 결정을 유예하는 선택이다. PPV만으로 세 조치 중 하나를 정할 수 없다. 제품 위해·누락 비용·오탐 비용·확인 검사 성능과 처리 시간도 필요하다. 추가 검사가 같은 원인으로 오탐할 수 있으므로 검사 간 독립성을 근거 없이 가정하거나 두 검사의 확률을 단순히 곱하지 않는다.'),
    content('action-application', 'application', '6분 활동의 뒷부분: 기본 A의 양성 585개를 모두 폐기할 때 실제 결함과 정상 제품이 각각 얼마나 포함되는지 표에서 찾는다. 추가 확인을 제안한다면 “확인 검사의 검출률·오탐률은?”, “첫 검사와 오류 원인이 독립적인가?”, “처리 용량·지연과 비용은?”을 agent에게 묻고 각 질문이 조치 선택을 어떻게 바꾸는지 말한다. 이 정보가 없으면 추가 검사의 최종 PPV나 최적 조치를 임의로 계산하지 않는다. 비용·안전 조건·성능을 확보할 때까지 합리적으로 보류할 수 있다.'),
    content('action-failure', 'failure', '양성 총수가 0이면 양성 중 결함 비율은 분모가 없어 PPV=null(정의되지 않음)이다. 0%라고 읽거나 완벽한 검사라고 결론내리지 않는다. 결함 0%, 검출 90%, 오탐 0% 또는 결함 1%, 검출 0%, 오탐 0%를 비교하고 놓친 결함도 본다. 소수 입력을 쓰면 예상 개수도 소수다. 결함 0.015%, 검출 90%, 오탐 5%의 예상 TP=1.35는 제품을 쪼갠다는 뜻이 아니라 같은 조건에서 기대하는 평균이다. 실제 10,000개 표본은 정수이며 변동한다. 화면 반올림 값으로 원시 계산이나 판단을 대체하지 않는다.'),
    content('action-assessment', 'assessment', '5분 이해 확인의 뒷부분: 새 사례 양성 제품에 자동 조치·추가 확인·보류 중 하나를 잠정 선택하고, 유리한 조건과 실패 조건을 각각 설명한다. 부족한 정보 두 가지를 agent에게 물을 질문으로 만들고 왜 필요한지 말한다. 보류도 필요한 정보와 재검토 조건이 구체적이면 수행 근거가 된다. 도움은 none/hint/agent/unknown과 관찰한 입력·집단·결과 공개 전후 조건을 함께 남긴다. 도움 사용은 벌점이 아니며 도움 열람·완료 버튼만으로 수행을 인정하지 않는다. 이번 조건의 관찰 근거로 supported·partial·not_demonstrated를 구분하며 영구적인 숙련 판정으로 확대하지 않는다.'),
    content('return-to-work', 'application', '2분: 실제 작업으로 돌아갈 요약을 세 문장으로 작성한다. “나는 검사 또는 후속 조치를 이렇게 잠정 선택한다/보류한다.” “이 선택은 이 비용·성능 조건에서 유리하고 이 조건에서 실패한다.” “agent에게 이 정보를 확인해 달라고 요청하고 확인되면 재검토한다.” 실제 집단의 결함 비율·검사 환경은 아직 모르면 질문으로 남긴다. 수업 사례를 실제 생산 승인으로 옮기지 않는다. 사용자가 요약을 수정할 수 있게 한다.'),
    content('next-learning-map', 'application', '2분: 이번에 관찰한 다섯 차원의 수행·도움 조건과 미확인 항목을 확인한다. PPV 분모가 어렵다면 분모와 조건부 비율을, 집단 전용이 어렵다면 집단 차이와 성능 가정을, 선택을 보류했다면 오류 비용과 추가 검사 독립성을 다음 학습 후보로 제안한다. 수업 완료나 요약 확인만으로 로컬 knowledge map이 저장되었다고 생각하지 않는다. 결과를 전달받을 때 저장 상태를 확인하고, 기록이 이번 조건에서의 수행 근거라는 의미를 함께 확인한다. 미검토 pending이나 건너뜀 skipped를 완료·숙련으로 승격하지 않는다. 시간이 더 필요하면 보충을 별도 회차로 나누며 시간 초과를 실패로 기록하지 않는다.'),
  ],
  decisions: [
    {decisionId: 'choose-inspection', question: '검사 A와 B 중 무엇을 선택하거나 보류할까?', choices: ['A: 누락 감소', 'B: 오탐 감소', '비용 확인까지 보류'], requiredInformation: ['결함 비율과 검사 성능', '누락·오탐 비용과 처리 용량'], explanationId: 'inspection-explanation', simulationId: 'inspection-simulation', applicationId: 'inspection-application', failureId: 'inspection-failure', assessmentId: 'inspection-assessment'},
    {decisionId: 'choose-positive-action', question: '양성 제품에 자동 조치·추가 확인·보류 중 무엇을 할까?', choices: ['자동 조치', '추가 확인', '정보 확보까지 보류'], requiredInformation: ['누락·오탐 비용과 안전 조건', '추가 검사 성능·독립성·용량·시간'], explanationId: 'action-explanation', simulationId: 'inspection-simulation', applicationId: 'action-application', failureId: 'action-failure', assessmentId: 'action-assessment'},
  ],
  inputs: [
    {inputId: 'defect-percent', unit: '%', min: 0, max: 100, default: 1},
    {inputId: 'detection-percent', unit: '%', min: 0, max: 100, default: 90},
    {inputId: 'false-positive-percent', unit: '%', min: 0, max: 100, default: 5},
  ],
  activities: [
    {activityId: 'diagnose-inspection', stage: 'diagnosis', contentIds: ['diagnostic-cards'], required: true, minutes: 2},
    {activityId: 'orient-inspection', stage: 'orientation', contentIds: ['lesson-orientation'], required: true, minutes: 1},
    {activityId: 'explore-inspection', stage: 'exploration', contentIds: ['inspection-explanation', 'inspection-simulation', 'inspection-application', 'inspection-failure', 'action-explanation', 'action-application', 'action-failure'], required: true, minutes: 6},
    {activityId: 'assess-inspection', stage: 'assessment', contentIds: ['inspection-assessment', 'action-assessment'], required: true, minutes: 5},
    {activityId: 'return-inspection', stage: 'return', contentIds: ['return-to-work'], required: true, minutes: 2},
    {activityId: 'map-inspection', stage: 'map', contentIds: ['next-learning-map'], required: true, minutes: 2},
  ],
  rubric: {rubricId: 'inspection-rubric', rubricVersion: 1, criteria: [
    {criterionId: 'distinguish-denominators', dimension: 'concept', conceptIds: all, contentId: 'inspection-assessment', mode: 'agent', rule: '결함 비율·검출률·오탐률·PPV·전체 정확도의 분모를 구분하고 전체 정확도를 PPV로 읽는 오류를 설명한다.'},
    {criterionId: 'calculate-transfer', dimension: 'prediction-model', conceptIds: all, contentId: 'inspection-assessment', mode: 'automatic', rule: '새 사례의 예상 TP·FP·FN·TN·양성 총수·PPV·전체 정확도를 독립 기대값과 비교한다. 개수 5개 항목은 기대값과의 절대 차이가 1 이하, PPV·전체 정확도는 %p 차이가 1 이하이면 일치로 보고, 기대 PPV가 null이면 학습자가 정의되지 않음으로 답해야 일치한다. 7개 모두 일치하면 supported, 1–6개는 partial, 0개는 not_demonstrated다. 계산 도구의 허용 오차 절대 오차 1e-9 이하는 학습자 판정과 별개의 도구 기준이다. 최초 예측과 결과 후 응답을 분리하고 도구 계산 실패는 채점하지 않는다.'},
    {criterionId: 'explain-transfer', dimension: 'transfer', conceptIds: ['defect-rate', 'positive-predictive-value', 'detection-rate', 'false-positive-rate'], contentId: 'inspection-assessment', mode: 'agent', rule: '새 집단에서 PPV를 다시 구하는 이유와 검사 성능 유지 가정을 설명하고 이전 집단 수치의 전용을 거부한다.'},
    {criterionId: 'ask-for-evidence', dimension: 'question', conceptIds: ['detection-rate', 'false-positive-rate', 'positive-predictive-value'], contentId: 'action-assessment', mode: 'agent', rule: '오류 비용과 추가 검사 성능·독립성 등 부족한 정보를 질문하고 각 질문이 선택을 바꾸는 이유를 연결한다.'},
    {criterionId: 'justify-choice', dimension: 'choice-meaning', conceptIds: all, contentId: 'action-assessment', mode: 'agent', rule: '검사 또는 후속 조치의 선택·보류에 유리한 조건과 실패 조건을 대칭 비교하고 부족한 정보와 재검토 조건을 밝힌다.'},
  ]},
};
