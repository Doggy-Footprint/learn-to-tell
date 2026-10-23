# 범위 감사 보고 (중단, 잠정)

- 절차: `protocol.md` (sha256 `5ba7d144b79b36914759e6d294c24569b7dd07d3d85143a6849653e21921ab1d`, pilot 전 `41522e08764cebce39eb74c08b00ea0e8e5776bc23d7a4237b83bdd89fcd0c8b`)
- 계약: spec v4의 `packages/runtime/types/lesson.d.ts`
- 집계: `node bench/coverage/count.mjs bench/coverage --out bench/coverage/out`
- 상태: 진행 3단계(전체 감사)의 반박까지 하고 멈췄다. 2차 개정, batch 2(held-out 6분야), 끝 조건 E1–E3 판정은 하지 않았다.

## 결과

| corpus | V | C | G | N | (C+G)/(V+C+G) | Wilson 95% |
|---|---|---|---|---|---|---|
| shot | 43 | 0 | 6 | 0 | 12.2% | 5.7–24.2% |
| shot-extra | 1 | 1 | 0 | 0 | 50% | 9.5–90.5% |
| lesson (7수업) | 96 | 0 | 9 | 2 | 8.6% | 4.6–15.5% |
| new-b1 (6분야 12주제) | 85 | 0 | 11 | 0 | 11.5% | 6.5–19.4% |

반박 전 값이다. 표현자 판정은 반박 표본에서 아래만큼 뒤집혔다.

| 묶음 | 계약 | 검사 V 행 | 반박 | 반박률 | 기록 |
|---|---|---|---|---|---|
| pilot shot·lesson | v3 | 12 | 5 | 42% | `refute/pilot-shots-lesson.md` |
| pilot new | v3 | 26 | 6 | 23% | `refute/pilot-new.md` |
| wave 1 shot | v4 | 10 | 4 | 40% | `refute/w1-shots.md` |
| wave 1 lesson | v4 | 15 | 6 | 40% | `refute/w1-lessons.md` |
| wave 1 new | v4 | 22 | 7 | 32% | `refute/w1-new.md` |

pilot 비율(v3): shot 33%, lesson 43%, new-b1 24%. 이 결과로 spec v4 어휘 1차 개정을 했다.

- 승격 후보(3행 이상, 2분야 이상): rect-dash 6, edge-dash 3, step-tween 3, tap-select 3.
- wave 1 반박에서 드러난 계약 공백:
  - graph frame의 좌표 단위
  - flow rate 단위
  - Option.params와 multiples 중 무엇이 우선하는가
  - 같은 tone 안의 명도 순서
  - QuizReveal이 숨기는 범위
  - 선택 중 미리보기로 정답이 새는 문제
  - knob이 model param이 아닌 경우
- 표현자 오류:
  - s22: 축 밖이 잘림
  - s29: 띠가 보이지 않음
  - s49: fill 오용
  - dna 3건: 서열, 색, 정답 반전
  - knob을 params에 연결하지 않음 2건

## 실패: 왜 멈췄는가

| 시도 | 실패 근거 | 원인 |
|---|---|---|
| 지면 감사로 계약의 표현 범위를 잼 | 어휘를 개정해도 반박률이 23–42%로 남았다(기준 10%). 표현자(opus, effort low)의 판정은 신호로 쓰기 어렵다 | verified: 반박 기록 5개 |
| custom 비율을 범위 지표로 씀 | C가 거의 0이다(전체 1행). 어휘가 데이터 좌표의 SVG 기본 도형에 가까워서, 무엇이든 custom 없이 그려진다. 그래서 이 비율은 계약의 질을 구분하지 못한다 | verified: 위 표 |
| 렌더 없이 계약부터 고정 | 약 3.3M 토큰을 썼지만 렌더된 수업은 0개다. 가장 큰 위험 셋은 감사로 보이지 않는다: (1) 그림 안 글자 배치, (2) spec 크기, (3) 숫자·정답 오류 | hypothesis: (1)·(2)는 M1-lite 생성 실험으로 확인한다. (3)의 근거는 dna F8 정답 반전, s22 축 등 반박 기록 |

- spec 크기: 예시 수업 16.8 KB에서 추정한 값은 25–40 KB다(v1 HTML은 30–68 KB).
- 숫자·정답 오류: 독립 검토(opus, effort high)가 반박 기록을 보고 약 17%로 추정했다. checks는 수치만 잡고, 정답 표시나 데이터 값의 오류는 막지 못한다.

## 남기는 것

- 조각 `shots/`, `lessons/`, `new/`는 v4 계약의 tsc·count 회귀 묶음으로 쓴다.
- `new/*/*.brief.md`는 M3 bench 주제 후보다.
- 끝 조건 "held-out (C+G)/(V+C+G) ≤ 10%"는 버린다.
