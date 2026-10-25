# 한 장 인포그래픽 정리는 회상 뒤 overview 장면으로 둔다

- Status: Accepted (2026-10-15)

## Context

사용자는 마지막 장에서 수업 전체를 한 페이지 인포그래픽으로 정리하기를 원했다. b130c928-infographic-for-learning-recall-for-summary는 summary를 글로 된 인출 연습으로 정했다. summary는 질문을 먼저 보이고, 떠올린 뒤에 답을 연다.

## Decision

summary 다음, keywords 바로 앞에 `overview` 장면을 둔다. overview는 수업의 signature visual을 다시 써서 각 takeaway를 그림 속 자리(구역·화살표·번호)에 놓는 한 장 그림이며, 새 내용은 넣지 않는다. lint의 `overview-missing`, `overview-order`, `overview-no-visual`이 이를 확인한다. 그림은 kit이 자동으로 조립하지 않고 수업마다 직접 그린다.

## Alternatives

- summary를 인포그래픽으로 바꾼다: 기각. 답이 그려진 그림을 회상 전에 보면 인출 대신 다시 읽기가 일어나고, b130c928의 근거(Roediger & Karpicke 2006)와 충돌한다.
- 각 장면의 takeaway와 term visual을 kit이 자동으로 배치한다: 기각. 그림을 나열하면 표현 사이의 관계가 드러나지 않아 학습자가 그림마다 따로 해독해야 한다. 한 장 지도의 목적은 같은 대표 그림 위에서 정리 사이의 연결을 보이는 것이다.

## Consequences

- Positive: 회상 효과를 유지하면서 수업이 한 장의 시각 지도로 끝난다.
- Negative: 모든 수업이 장면 하나와 그림 하나를 더 그려야 하고, 1440×900과 720×900 점검 대상도 하나 늘어난다.
