# audit 상한 5회 실측 비용과 외부 시각 브레인스토밍 후속

## Goal

- "테스트 한 번 돌려보자 3개 대상 2회 반복 총 12회"
- "기준보다 HEAD에서 오히려 시간이랑 토큰이 늘었네..? 그럼 이 작업은 어떤 의미가 있지?"
- "sub agent 호출해서 우리가 체크하지 못한 다른 가능성을 체크해보자. 우리의 의도나 방향성은 제외하고, 다른 수직적인 시각에서 넓게 관찰해서 개선 방향을 제안해달라고 해줘. 그걸 우리는 브레인 스토밍으로 받아들일거야."
- "ok handoff로 작성하고, 지금 껀 PR."

## State

- 브랜치 `perform/diet`, 코드 기준 `7788139`. 이 handoff를 쓰는 동안 코드는 바꾸지 않았다.
- 측정 설정: 기준 `0fb63ae`, HEAD `7788139`(SKILL.md §3 audit 상한 5회와 lint `icon-not-string`). 주제는 cpu-cache, cache-ttl, projectile 셋이고 판마다 2회씩, 모두 12회다. sonnet-5.5, effort medium, 비대화로 돌렸고 12회 모두 exit 0이었다.
- 원자료: `~/toy-projects/learn-to-tell/measurements/20261020-audit5-check/`(runs, transcript, score/summary.md, score/key.json). 같은 폴더의 measurements `README.md`에 행이 있다.
- 결과(기준 → HEAD):
  - 벽시계 평균: 482s → 544s(+13%).
  - 가중 토큰 평균: 662k → 732k(+11%). 실행별 범위가 531k–860k로 넓다.
  - 마지막 Edit을 audit한 실행: 3/6 → 5/6.
  - lesson Edit: 회당 평균 17 → 32.
  - 블라인드 채점 5축 합: 123 → 124, 선호는 3 대 3. 시각 축은 19 → 23으로 올랐지만 채점 편차 안이다.
  - 베끼기: 12편 모두 0건.
- `icon-not-string`은 12회 동안 한 번도 걸리지 않았다. 잡아낸 사례가 없고, 오탐도 없었다.
- 외부 관찰 에이전트(opus low)에게 우리 의도는 빼고 원자료만 주었다. 결과는 Open Questions에 적는다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| audit 상한을 5회로 올리고 Edit 뒤에는 늘 audit을 돌리게 함(`bc93b50`) | cache-ttl-head-2: 5회째 audit 뒤 sheet를 다시 보고 Edit 4개를 audit 없이 남겼다. result.md에 본인이 적었다 | verified: 5회째 audit 뒤에도 8단계의 sheet 다시 보기가 남아 있어 Edit할 기회가 생긴다 |
| 같은 변경 | cache-ttl-head-1과 projectile-head-2가 audit을 6회 돌렸다. projectile-head-2는 고치지 못한 `hscroll`(장면 10, overview)을 남겼다 | hypothesis: overview 레이아웃이 원인이다(kit) |
| 같은 변경 | 비용이 +11%, 시간이 +13% 늘었는데 품질 점수는 같다 | hypothesis: 늘어난 비용은 회차와 Edit 연쇄에서 나온다. 2회 반복이라 증가 폭은 확정하지 못했다 |

## Next Step

사용자 결정을 기다린다. 이 세션이 제시한 선택지는 다음과 같다.
1. 상한 5회는 두고 "5회째 audit 뒤에는 sheet도 다시 보지 않는다"로 문구를 조인다. 이 세션이 추천했다.
2. 상한을 3–4회로 되돌리고 "마지막 회차 뒤에는 Edit하지 않는다"만 남긴다.
3. 지금 상태를 그대로 둔다.

기본 첫 일은 원자료만으로 할 수 있는 확인이다(새 실행 없음). 축소 하한 78%(`skills/learn-to-tell/kit/ltt-deck.js:872`)에 닿은 `shrunk` 장면이 실제로 화면 밖으로 넘치는지 본다.

바꾼 뒤에는 같은 12회 측정으로 다시 확인한다. 실행 방법은 원자료 폴더의 `run.sh`와 `prompts/`에 있다.

## Open Questions

외부 관찰 브레인스토밍(2026-10-20). 사실은 이 세션에서 다시 확인한 것만 verified로 표시했다.
- 하한에 닿은 `shrunk`(verified): 최종 audit에 남은 `shrunk` 37건 중 15건이 정확히 78%다. 이 값은 `fit()` 하한(`ltt-deck.js:869-872`)이다. audit(`ltt.js:647`)은 하한에 닿은 장면을 다른 `shrunk`와 구분하지 않고 같은 권고로 낸다. Edit으로는 풀리지 않을 수 있다. kit이 장면 분할을 더 강하게 요구하거나 생성 전에 막는 방향이 있다.
- Edit 수와 점수(verified): projectile-base-1은 Edit 0회(Write 2회)로 22점이었다. cache-ttl-head-2는 Edit 51회로 20점이었다. 12점 산점도로 아직 일반화하지 않았다.
- 비용 구조(외부 에이전트 계산, 미확인):
  - 실행 시간의 76–95%가 모델 생성이다.
  - 출력 토큰 43–75k는 최종 HTML 약 5–8k 토큰의 약 8배다.
  - cache_read는 턴 수와 함께 움직인다.
  - 이 계산에서 나온 후보 방향은 턴 수를 KPI로 두는 것과, Edit 연쇄 대신 장면 단위로 다시 쓰는 것이다.
- 측정 방법(범위 밖 후보):
  - 측정 프롬프트가 §4를 건너뛰어 퀴즈 경로는 측정된 적이 없다.
  - 학습 효과는 측정하지 않는다. 대리 학습자 모델로 전후 점수를 재는 방법이 후보다.
  - 채점은 정지 프레임 둘만 본다. 시뮬레이션 조작은 평가하지 않는다.
  - 처치 효과가 반복 잡음보다 작을 수 있다. 같은 커밋 반복으로 분산을 재고 A/A 쌍을 쓰는 방법이 후보다.
- 눈 검토: 자유 관찰 대신 예/아니오 체크리스트로 바꾸고, 반복해서 잡히는 항목은 audit 규칙으로 올린다.
- 헤드라인이 결론 문장이라 예측할 여지를 닫는다. sheet 1장만 본 관찰이라 hypothesis다.
- 과거 거절과 겹치는 후보:
  - outline을 JSON으로 쓰고 렌더러가 생성하는 2단 구조: rejection `1d250c5adce868bf`, `2c5216fdfdbccf54`.
  - 분량을 실측해 정하는 것: rejection `472b8df126578190`.
  - 다시 꺼내려면 이 거절 이유부터 읽는다.

## Spec

none. workflow-approach run이 아니다.

## Execution Ledger

none. 측정과 분석만 했다. 채점 key는 `score/key.json`이고, X/Y 배정 seed는 20261020이다.
