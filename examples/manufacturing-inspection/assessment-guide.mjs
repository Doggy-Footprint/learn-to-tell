import {inspectionLesson} from './lesson.mjs';

const examples = [
  {
    supported: '관찰: 설명을 가린 새 사례에서 학습자가 “검출률은 실제 결함, 오탐률은 정상, PPV는 양성, 전체 정확도는 전체가 분모다. 전체 정확도가 높아도 양성의 결함 비율은 낮을 수 있다”고 자기 말로 설명했다. 도움 조건을 함께 기록한다.',
    partial: '관찰: PPV의 분모를 양성으로 설명했지만 오탐률의 분모를 전체로 설명했다. 구분한 부분과 남은 혼동을 함께 남긴다.',
    not_demonstrated: '관찰: 자유 응답 검토가 끝났고 학습자는 전체 정확도를 양성 중 결함 비율이라고 설명했다. 이번 조건에서 구분 수행이 관찰되지 않았다고 기록하며 영구적인 능력 결론은 내리지 않는다.',
  },
  {
    supported: '관찰: 결과 공개 전 또는 공개 후 중 어느 응답인지 구분한 새 사례 응답의 TP=160, FP=196, FN=40, TN=9604, 양성=356, PPV=40/89, 전체 정확도=9764/10000 모두가 허용 오차(개수 5개 항목은 절대 차이 1 이하, PPV·전체 정확도는 1%p 이하) 안에서 맞는다. 계산 도구의 1e-9 오차는 별도 기준이다. 공개 후 응답이면 독립 최초 예측 성공으로 기록하지 않는다.',
    partial: '관찰: TP·FN은 맞지만 FP를 전체 10000개의 2%인 200으로 계산해 일부 출력이 어긋났다. 맞은 필드와 틀린 필드를 각각 남긴다.',
    not_demonstrated: '관찰: 정상 계산 조건에서 제출한 새 사례 수치가 모든 기대값과 불일치한다. 수치 재현이 관찰되지 않았다고 기록한다. 도구 오류·빈 응답·열람만으로 이 상태를 만들지 않는다.',
  },
  {
    supported: '관찰: “집단의 결함 비율과 B의 오탐률 조건이 달라 정상에서 오는 양성 수를 다시 계산해야 한다. 이전 PPV를 가져올 수 없고 실제 집단에서도 검사 성능이 유지되는지 확인해야 한다”고 설명했다.',
    partial: '관찰: 집단의 결함 비율 변화 때문에 PPV를 다시 계산한다고 설명했지만 검사 성능이 유지되는 가정을 언급하지 않았다.',
    not_demonstrated: '관찰: 검토가 끝난 새 사례 설명에서 “검사 이름이 같으면 PPV도 같다”고 이전 집단 수치를 그대로 적용했다. 전이는 이번 조건에서 확인되지 않았다.',
  },
  {
    supported: '관찰: “놓친 결함과 정상 폐기 비용은 각각 얼마인가? 추가 확인 검사의 검출률·오탐률과 첫 검사와의 오류 독립성은 확인됐나?”라고 물었다. 비용은 A/B 선택, 성능·독립성은 확인 후 조치의 신뢰도를 바꾼다고 연결했다.',
    partial: '관찰: 추가 검사 정확도를 물었지만 어느 분모의 성능인지와 첫 검사 오류의 독립성을 확인하지 못했고 질문이 선택에 필요한 이유도 일부만 설명했다.',
    not_demonstrated: '관찰: 검토한 응답에서 “뭘 고르면 돼?”만 요청하고 선택을 바꿀 정보나 이유를 특정하지 않았다. 정해진 문장과의 일치가 아니라 필요한 정보의 연결을 보지 못했다는 근거를 남긴다.',
  },
  {
    supported: '관찰: “B는 오탐을 줄이지만 결함을 더 놓친다. 누락 비용이 크면 A로 바꿀 수 있다. 지금은 비용과 확인 검사 성능·독립성이 없으므로 조치를 보류하고 그 정보가 확인되면 재검토한다”고 양쪽 조건을 설명했다. 특정 선택 자체를 정답으로 강제하지 않는다.',
    partial: '관찰: B의 오탐 감소를 근거로 선택했지만 누락 증가나 재검토 조건을 설명하지 못했다. 지지 근거는 확인됐고 반대 조건은 아직 부분 수행이다.',
    not_demonstrated: '관찰: 검토한 응답에서 “전체 정확도가 높으니 양성을 모두 폐기한다”고만 말하고 정상 제품 손실·부족한 정보·실패 조건을 고려하지 않았다. 이번 선택 의미의 설명이 확인되지 않았다.',
  },
];

export const inspectionAssessmentGuide = {
  lessonId: inspectionLesson.lessonId,
  lessonRevision: inspectionLesson.lessonRevision,
  rubricId: inspectionLesson.rubric.rubricId,
  rubricVersion: inspectionLesson.rubric.rubricVersion,
  transferCase: {
    inputs: {defectPercent: 2, detectionPercent: 80, falsePositivePercent: 2},
    expected: {sampleSize: 10000, truePositive: 160, falsePositive: 196, falseNegative: 40, trueNegative: 9604, positiveCount: 356, positivePredictiveValue: 40 / 89, accuracy: 9764 / 10000},
  },
  criteria: inspectionLesson.rubric.criteria.map((criterion, index) => ({
    criterionId: criterion.criterionId,
    dimension: criterion.dimension,
    mode: criterion.mode,
    rule: criterion.rule,
    examples: examples[index],
    pending: '응답 또는 자유 응답 검토가 아직 끝나지 않았거나 도구 계산 실패로 관찰이 막혔으면 pending이다. 관찰 입력·집단·결과 공개 전후·도움 none/hint/agent/unknown과 미검토 이유를 보존하고 완료·숙련으로 승격하지 않는다. 계산 실패를 이해 부족으로 채점하지 않는다.',
    skipped: '사용자가 해당 수행을 건너뛰었으면 skipped로 남긴다. 설명 열람·완료 버튼·자기 확신은 수행 증거가 아니다. 도움은 벌점이 아니지만 도움 수준과 관찰 조건을 보존하며 재시도는 최초 예측과 이전 답을 지우지 않는다.',
  })),
  hints: [
    {level: 1, text: '먼저 지금 구하려는 비율의 분모를 말해 보세요. 실제 결함 전체인지, 정상 전체인지, 양성 전체인지 구분하고 막힌 지점만 요청하세요. 도움을 보았다는 사실은 수행 성공을 뜻하지 않습니다.'},
    {level: 2, text: '10000개를 결함과 정상으로 나눈 뒤, 결함에 검출률을 적용하고 정상에 오탐률을 적용해 보세요. 이 두 양성 그룹을 합친 수가 PPV의 분모입니다. 결과 전에 예상했다면 최초 답을 남긴 채 다시 계산하세요.'},
    {level: 3, text: 'TP=Nps, FP=N(1-p)f, FN=Np(1-s), TN=N(1-p)(1-f)를 이용하세요. PPV는 TP/(TP+FP), 전체 정확도는 (TP+TN)/N입니다. 양성 0개면 PPV는 null입니다. 선택에는 누락·오탐 비용과 추가 검사 성능·독립성이 더 필요하므로 부족하면 질문하고 보류할 수 있습니다.'},
  ],
  feedback: {
    matched: '사실(A): 제출한 수치나 설명에서 확인된 항목을 구체적으로 인용하고 이번 입력·집단·공개 전후·도움 조건을 붙여 말한다. 예: “양성의 분모를 TP+FP로 구분한 근거가 확인됐어요.” 지지(B): “확인된 부분을 바탕으로 다음 선택을 함께 검토할 수 있어요.” 특정 선택에 동의하거나 영구적인 숙련을 선언하지 않는다. B 선택의 오탐 감소와 누락 증가를 모두 비교하고 반대 조건도 묻는다.',
    mismatched: '사실(A): “FP의 분모를 전체로 잡았지만 오탐률은 정상 제품에 적용하므로 새 사례 FP는 196이에요.”처럼 관찰된 차이만 짚는다. 지지(B): “혼동한 분모를 찾았으니 한 단계씩 다시 살펴볼 수 있어요. 필요하면 힌트를 선택하거나 보류해도 됩니다.” 최초 답을 보존하고 단계를 낮춰 재시도한다. 도구 오류는 계산 실패, 미검토는 pending, 건너뜀은 skipped로 구분하며 이해 부족이나 위축을 부르는 능력 평가로 바꾸지 않는다.',
  },
};
