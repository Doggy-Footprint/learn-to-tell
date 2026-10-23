# M0 계약 run: verifier 예산 소진(V2-1 남음)

## User Query

- "M0 계획 수립해", "/workflow-approach 사", "맞다. sub-agent (implementer, test-implementer, verifier - opus-low 를 사용)만 적용", "run 1개"
- "근데 난 그림 층을 최소로 두고 싶지 않은 걸. 그림은 유지하는 방법도 있어? 내 말도 맞고 니 말도 맞다식의 표현 말고, 방향을 정해서 대답해"
- "지금 상황을 커밋 (실패한 부분도 명시)하고 수정해"
- "승인"(brief v5 기본값 A-18–A-25), "승인"(brief v6 기본값 A-26–A-29)

## State

- 브랜치 `dev`, HEAD `46fcb17`(v4 계약과 중단한 감사 기록). 아래 변경은 모두 커밋 전이다.
- 바뀐 파일:
  - 문서: `intent.md`, `agent-docs/adr/3c44a1f91bcb8367-agent-writes-spec-runtime-renders.md`(Decision 1줄, Negative 1문장)
  - 계약·도구: `packages/runtime/types/lesson.d.ts`, `packages/runtime/dev/spec-stub.mjs`, `packages/runtime/rules.md`, `bench/coverage/count.mjs`
  - 예시: `skill/learn-to-tell/examples/projectile-drag.js`
  - 테스트: `packages/runtime/test/`(binding.test.mjs, example-fr43.test.mjs, types/infer-checks-first.js 새 파일, 나머지 수정)
  - 감사 조각 5개: `bench/coverage/new/{biomechanics/impulse-and-ground-reaction-force,economics/circular-flow-of-income,law/personal-data-roles-and-transfers,music/harmonic-series-consonance,statistics/confidence-interval}.js`(화면 param 선언)
  - 검토 산출물(새 파일): `bench/coverage/example-review.md`(R2), `bench/coverage/contract-review.md`(R3)
- 마지막 확인: Test command 246/246, 커버리지 줄 99.24%·분기 90.51%. root·조각 tsc 오류 0, `npm run verify:example` ok, `node bench/coverage/count.mjs bench/coverage --out bench/coverage/out` exit 0.

## Failed Attempts

| attempt | failure evidence | cause |
|---|---|---|
| 지면 범위 감사로 계약 범위를 잼(spec v1–v4) | 반박률 23–42%(기준 10%), custom 비율 C 1행, 렌더 0, 약 3.3M 토큰(`bench/coverage/report.md`) | verified: 반박 기록 5개 |
| 수정 묶음 3(v5): count에 binding 검사 추가 | VO-8 usage 2 ≠ 1 | verified: binding 검사의 figure 표본 실행이 usage에 더해짐(FR-34) |
| v5 binding 규칙(knob 키 = model param) | 조각 6개·5분야가 binding 오류 | verified: 탭·보이기·커서 같은 화면 상태 param의 자리가 계약에 없었다 → v6 화면 param(A-26) |
| v4 예시 수업 | R2 1차: accent-focus-only·data-in-domain 위반, 규칙 밖 결함 7건 | verified: `bench/coverage/example-review.md` 1차 |
| rules.md 고의 결함 3개(term-unknown, text-length, legend-for-series) | 고친 예시에 적용해도 규칙에 걸리지 않음 | verified: R2 2차 보강 |
| verifier 1회차 | finding 8개(증거 공백 6, 검토 절차 2) | verified: 테스트 31개·R2·R3 보강으로 닫힘(verifier 2회차 확인) |
| verifier 2회차 | V2-1: data-in-domain 검사가 9종 mark만 본다 | verified: spec v7 FR-43·VO-10이 대상 mark 종류를 정하지 않음 |

## Next Step

1. V2-1을 정한다. 권장안은 (b)다: VO-10 data-in-domain 검사에 점을 가진 mark를 모두 넣는다(label at·leader, circle center, arc center, path 좌표, brace, math at, code at, glyph at, icon at, legend at, mock box, inset at·source, node at, flow pts). 예시가 실제로 쓰는 것은 legend at, math at, code at이다. (a) FR-43을 9종으로 좁히는 안은 글자 mark가 축 밖에 놓여도 막지 못한다.
2. 이 run은 verifier 예산을 다 썼다. V2-1을 닫으려면 사용자가 새 run을 열거나, main 검증만으로 닫는 것을 허락해야 한다.
3. 커밋은 사용자가 지시할 때 한다.

## Open Questions

- V2-1을 (a)·(b) 중 어느 쪽으로 닫는가, 새 run으로 하는가.
- advisory도 처리하는가: A2-3(reveal.marks id가 그려진 기술자에 있는지 검사), A2-4(camera 창·handle 값 탐색), A2-1(R2 묶음 판정 풀어 쓰기), A2-2(`Params` JSDoc 두 블록).
- ADR Decision·Negative 문장은 사용자 "수정해"를 승인으로 보고 썼다. 거부하면 되돌린다.

## Spec

- `agent-docs/spec-logs/c30ff9a3faa18a2a-m0-contract-coverage.md`, version 7, status limit, run_id `c30ff9a3faa18a2a`, base_commit `4f3c6058f14b1928894e39e97387c1a303e6623c`.

## Execution Ledger

- finding과 처리:
  - F-1 usage 이중 계산: 고침(count.mjs)
  - F-2 화면 param: v6 A-26, 조각 5개 수정. joint-moments 조각은 v6 규칙으로 이미 선언된 상태
  - F-3 focus 의미: A-27
  - F-4 예시 결함: A-28·A-29, FR-43
  - V1-1–V1-8: 닫힘
  - V2-1: 열림(blocking spec challenge)
  - A2-1–A2-4: advisory, 열림
- 증거: Test command 246/246, R1 `bench/coverage/report.md`, R2 `bench/coverage/example-review.md`, R3 `bench/coverage/contract-review.md`.
- fuzz: 없음(spec Fuzzing none).
- mutation:
  - 손 mutation 10/10 잡힘. M1 ε 제거, M2 lt 비엄격, M3 run 병합 순서, M4 첫 model만 선언, M5 compare b 출처 누락, M6 usage에 binding 표본, M7 count가 binding 무시, M8 predict focus 미검사, M9 ode event 보간 없음, M10 예시 drag-path tone focus. seed.py로 복원했다.
  - mutation 도구: 없음.
- 카운터: 수정 묶음 5, verifier 2/2.
