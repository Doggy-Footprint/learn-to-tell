# 학습 장면은 인포그래픽 우선, 정리 장면은 글로 된 인출 연습

- Status: Accepted (2026-10-15)

## Context

`SKILL.md`는 모든 장면에서 "답은 가능하면 인포그래픽으로"를 요구했다. 그런데 `terms` 장면은 글만 받았고, `summary` 장면은 takeaway를 카드 격자로 다시 보여 주었다. HSL 수업 테스트에서 사용자는 용어에 그림을 원했고, 마지막 정리는 학습 확인이므로 글 위주가 낫다고 했다.

## Decision

새 내용을 익히는 장면(용어 포함)은 인포그래픽을 우선한다. `terms` 항목마다 `visual`을 그린다. 정리(`summary`)는 글로 된 인출 연습이다. takeaway마다 `recall` 질문을 먼저 보이고, 사용자가 떠올리거나 적은 뒤에 답 문장을 연다. 적은 답은 `recall` 이벤트로 남긴다. lint의 `term-no-visual`과 `summary-no-recall`이 이를 확인한다.

## Alternatives

- 모든 장면에서 인포그래픽 우선(이전 규칙): 기각. 정리 장면에서 그림 카드를 다시 읽으면 인출이 일어나지 않는다. 다시 읽기는 이해했다는 착각을 키우고, 인출 연습이 장기 기억에 낫다(Roediger & Karpicke 2006).

## Consequences

- Positive: 정리 장면이 시험 효과를 쓰고, 4단계 이해 확인에서 사용자가 적은 답을 읽을 수 있다.
- Negative: 모든 수업이 takeaway마다 인출 질문을, 용어마다 그림을 써야 한다.
