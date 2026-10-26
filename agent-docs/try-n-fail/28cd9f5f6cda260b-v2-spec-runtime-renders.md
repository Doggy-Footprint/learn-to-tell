---
commit: 01f77424cee961dd33ef29dcd6ad24051720c421
---

# agent는 spec만 쓰고 runtime이 화면을 모두 그리는 구조(v2)

## Goal
일반 요청(작업 문장만 받은 agent가 쓴 HTML)보다 나은 수업을 만든다. agent는 spec만 쓰고, 화면·배치·검사는 runtime이 보장한다.

## Attempts
경로는 태그 `archive/v2` 기준이다(`git show archive/v2:<path>`).

| attempt | failure evidence | cause |
| --- | --- | --- |
| v2 핵심 구조: agent는 spec만 쓰고 runtime이 모든 화면을 그린다(`agent-docs/adr/3c44a1f91bcb8367-agent-writes-spec-runtime-renders.md`) | M1 생성 실험 3주제(opus-5-5, effort low): 기준선보다 비용 2–3배($0.94–1.06 대 $0.32–0.53), 시간 1.2–2.3배. 방향 검수자(opus, effort xhigh, 블라인드 아님)는 3주제 중 2개에서 기준선이 결정에 더 쓸모 있다고 봄. 사용자가 v2를 닫음 | hypothesis: runtime이 더하는 가치보다 형식 제약(글 분량, 실물 표현 불가)으로 잃는 것이 크다 |
| 한 화면에 다 넣는 slide 형식을 runtime이 보장 | runtime spec 18판, 실패 시도 10건 중 8건이 화면 다듬기, 시험 604개. 그래도 실험 수업 3개 모두 모바일 첫 줄이 잘리고, 그래프가 화면 일부만 씀 | hypothesis: 고정 화면 형식이 배치 결함의 근원이다(v1과 같음) |
| check 통과를 화면 수치의 정확성으로 봄 | supply-chain #13: check `amp4`는 통과(2.5), 화면은 3.0배 | verified: check는 model별 기본값으로 계산하고(`packages/runtime/src/core/model.mjs:294`), 화면은 모든 model의 기본값을 합쳐 뒤 model이 앞 model을 덮는다(`packages/runtime/src/layout/figure.mjs:51`) |
| sheet 자동 배치 검사로 겹침 0을 판정 | 세 수업 모두 layoutViolations 0인데, 검토자가 겹침 4건 보고 | verified: `bench/m1/gen/<topic>/sheet-review.md` |
| 그림 필수 계약 | attacker #14·#15에 질문과 무관한 막대 그림 | verified: 계약이 장식용 그림을 유도 |
| 장면 본문 글자 상한 | 화면 본문 음절 수가 기준선의 56–63% | verified(검수자 측정): "교과서 한 챕터" 목표와 충돌 |
| "illustrative 값" 규칙(SKILL 11번) | attacker 수업에 방어 이름·실제 수치 없음. 기준선은 방어 12개 소개 | hypothesis: 아는 수치도 인용하지 않게 만든다 |
| M1 끝 조건을 비용·반복 횟수로만 정함 | 품질 비교 없이 "충족". supply-chain은 check 실패, 정답 오류 미수정 상태로 제출됐는데도 충족으로 셈 | verified: `plan.md` M1 행, `bench/m1/gen/global-supply-chain/ltt-log.jsonl` |
| 기준선을 작업 문장만으로 만듦 | skill 지시문 2.2–2.4 KB(진단·오개념·구조), 기준선 0.5–0.6 KB | verified: 비교가 공정하지 않아 runtime의 기여를 분리할 수 없다 |
| 렌더 전 지면 범위 감사 | 약 3.3M 토큰, 렌더한 수업 0개 | verified: `plan.md` 기각 대안 |

## Revisit Condition
- 같은 진단 결과와 수업 지시를 준 공정 기준선과 블라인드로 비교해, 일반 HTML 수업이 배치 결함이나 수치 오류로 반복해서 지는 근거가 생길 때.
- check와 화면이 같은 계산 경로를 쓰는 runtime이 생겨, check 통과가 화면 수치를 보장할 때.
- 품질이 이미 따로 확인된 생성 경로에서 비용만 줄이는 실험일 때. 이때는 비용만으로 끝 조건을 정할 수 있다.
