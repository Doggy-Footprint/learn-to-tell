# M1 생성 실험 시작 전 인계

## User Query

- M0 방향(사용자가 전달한 미래 세션 메모의 요약, 원문 아님): 지면 감사를 닫고 runtime을 먼저 만든다. compare1 3주제로 실제 수업을 생성해 수업당 120k 토큰·12분, 렌더 뒤 레이아웃 수정 거의 없음을 기준으로 잰다. 메모의 "얇은 runtime"은 아래 Next Step의 "범위를 좁힌 runtime"으로 고쳐 쓴다.
- "근데 난 그림 층을 최소로 두고 싶지 않은 걸. 그림은 유지하는 방법도 있어? 내 말도 맞고 니 말도 맞다식의 표현 말고, 방향을 정해서 대답해"
- "커밋하고 다음 세션에 전달할 준비하고, 지시어 알려줘"
- "왜 얇은 runtime이라고 이해하고 있어?", "응. 다른 문서도 체크해서 내용 교정해. 추가보다는 내용을 정확히 표현하기 위한 rewrite 방향으로"

## State

- 브랜치 `dev`. M0 결과는 커밋 `728187b`에 있다(그 앞 `46fcb17`, `4f3c605`). 이 handoff는 `99eb39f`에 처음 들어갔다.
- M0 산출물:
  - 계약 `packages/runtime/types/lesson.d.ts`(+ `internal.d.ts`, `ext/`)
  - stub `packages/runtime/dev/spec-stub.mjs`
  - 규칙 `packages/runtime/rules.md`(37개)
  - 예시 `skill/learn-to-tell/examples/projectile-drag.js`
  - 감사 조각 75개 `bench/coverage/{shots,lessons,new}/`(tsc·count 회귀 묶음)
  - 검토 `bench/coverage/{report,example-review,contract-review}.md`
- 확인 명령:
  - 테스트: `npx tsc -p packages/runtime/test/tsconfig.json && node --test --experimental-test-coverage --test-coverage-include=packages/runtime/dev/spec-stub.mjs --test-coverage-include=bench/coverage/count.mjs --test-coverage-branches=80 --test-coverage-lines=90 'packages/runtime/test/**/*.test.mjs'`(249/249)
  - 예시 검산: `npm run verify:example`
  - 조각: `npx tsc -p bench/coverage/tsconfig.json`, `node bench/coverage/count.mjs bench/coverage --out bench/coverage/out`
- runtime 렌더러는 아직 없다. 렌더한 수업은 0개다.

## Failed Attempts

| attempt | failure evidence | cause |
|---|---|---|
| 렌더 없이 지면 감사로 계약 범위를 잼 | 반박률 23–42%(기준 10%), custom 비율 C 1행, 약 3.3M 토큰에 렌더 0(`bench/coverage/report.md`) | verified: 표현자 판정이 불안정하고, 지표가 계약 질을 구분하지 못함 |
| 그림 층을 기본 도형 7개로 줄이는 안(미래 세션 메모) | 채택 안 함 | verified(사용자 결정): 글자 좌표를 agent에게 돌려줘 v1 레이아웃 결함이 그림 안으로 옮겨 간다 |
| 화면 상태 knob을 model param으로만 받음(v5) | 조각 6개·5분야가 binding 오류 | verified: 화면 param을 둘 자리가 없었다 → v6 화면 param |
| 손으로 쓴 예시를 tsc·stub만으로 믿음 | R2 1차에서 정답 노출 2곳, 덮인 knob, 축 밖 좌표 등 결함 7건 | verified: stub은 수치·id만 본다. 규칙 검토와 data-in-domain 자동 검사가 필요했다 |

## Next Step

M1 생성 실험을 새 workflow-approach run으로 시작한다(intent.md 마일스톤 M1).

1. 이해 확인(understanding round). 이 handoff, `intent.md`(핵심 결정, 인포그래픽 계약, 글자 배치, 생성 흐름, 목표 수치, M1), ADR `agent-docs/adr/3c44a1f91bcb8367-agent-writes-spec-runtime-renders.md`, 마감한 spec `agent-docs/spec-logs/c30ff9a3faa18a2a-m0-contract-coverage.md`(Signatures가 계약의 의미 결정을 담음), `bench/v1-results.md` compare1을 읽는다.
2. 범위 초안:
   - **범위를 좁힌 runtime:** 구현하는 종류를 시험 주제가 쓰는 것으로 줄인다. stage·card, 장면 타입 8종, predict·quiz UI, cartesian·graph·cells frame과 시험 주제가 쓰는 mark가 대상이다. 줄이는 것은 종류뿐이다. 구현한 mark는 글자 배치(겹침·가장자리 회피, leader, 잘림 없음), 최소 글자 크기·대비, 검사까지 완성한다. 빈틈이 있으면 runtime 결함이 생성 비용으로 잡히거나, 생성 agent가 runtime을 우회한다. 아직 구현하지 않은 mark는 check가 오류로 막는다.
   - **SKILL 초안.**
   - **생성:** compare1 3주제를 처음부터 끝까지 만든다. 생성은 새 context의 서브에이전트가 한다.
   - **측정:** 주제마다 토큰과 시간, 렌더 뒤 레이아웃 수정 횟수, spec 크기를 잰다. 독립 정답 검산 서브에이전트를 켜고 잡은 오류 수와 토큰을 잰다.
3. 끝 조건: 주제마다 120k 토큰·12분 이하, 렌더 뒤 레이아웃 수정 1회 이하. 넘으면 대조군(같은 3주제를 "agent가 페이지를 쓰는 작은 library"로)과 비교해 구조를 다시 검토한다.
4. 범위에 더한다(사용자 승인). 걱정의 근거는 v1이다: 생성 agent가 라이브러리를 몰라 렌더 뒤 디버깅을 반복했고, 그만큼 생성 비용이 늘었다.
   - **의미 검사를 M2에서 M1로 당긴다.** tsc와 stub을 통과해도 뜻이 틀린 수업이 남는다. 근거는 M0 예시 수업에서 R2가 찾은 결함 7건과 감사 조각의 표현자 오류다. M0에서 실제로 결함을 잡은 rules.md check 층 규칙을 생성 루프의 check에 넣는다: data-in-domain, goal-reachable, goal-at-start, reveal-figure-exists와 reveal.marks id 존재, input-binding, term-defined-before-use, accent-focus-only. 지금은 `packages/runtime/test/example-fr43.test.mjs` 안에만 있는 검사다. 오류 메시지는 spec 경로와 규칙 id를 담아, 렌더 없이 고칠 수 있게 한다.
   - **runtime 디버깅을 생성 agent에서 떼어 낸다.** check를 통과했는데 렌더가 이상하면 runtime 버그로 본다. 생성 agent는 runtime 소스를 읽거나 고치거나 우회하지 않고 기록만 남긴다. SKILL 초안과 생성 서브에이전트 지시에 이 규칙을 적는다.
   - **반복을 원인별로 센다.** 주제마다 tsc, check, 렌더 뒤 수정, 정답 검산 횟수와 각 토큰을 따로 기록한다. 렌더 뒤 수정이 주제당 1회를 넘으면 v1 문제가 다시 생긴 것으로 보고 구조를 재검토한다.
   - intent.md의 마일스톤 표(M1·M2 끝 조건, `ltt check`의 일부를 M1로)는 이 run의 brief 승인 뒤에 고친다.

## Open Questions

- compare1 5주제(cache-ttl, contrast, ontology, projectile, trolley) 중 3개를 고른다. 기본 제안: projectile은 예시 수업과 겹치므로 빼고, frame을 고르게 쓰는 cache-ttl(cartesian), ontology(graph), contrast. 사용자가 정한다.
- 렌더 확인 방법: 데스크톱·모바일 스크린샷을 어떤 도구로 찍을지(Chrome 확장 또는 headless), contact sheet 형식.
- 글자 배치 알고리즘의 수준(탐욕적 후보 위치 + leader로 시작할지).
- runtime 의존성(외부 라이브러리 허용 범위: KaTeX, 코드 하이라이트, 애니메이션). intent의 "외부 의존성으로 완성도 있는 UI" 선호를 따른다.
- 독립 정답 검산을 기본으로 켤지는 M1 측정 결과로 정한다.

## Spec

- 다음 run의 spec은 아직 없다.
- 직전 run: `agent-docs/spec-logs/c30ff9a3faa18a2a-m0-contract-coverage.md`, version 8, status complete, run_id `c30ff9a3faa18a2a`. 그 run의 limit handoff는 `agent-docs/handoff/stale/f28686a679afa0f4-m0-contract-verifier-limit.md`.

## Execution Ledger

- 직전 run의 finding 처리, 증거, mutation(손 13/13), verifier 3회, 수정 묶음 6은 위 spec의 Workflow Control과 Execution ledger에 있다.
- 다음 run에 넘기는 advisory:
  - A2-1: R2 표가 여러 규칙을 묶어 판정
  - A2-2: `Params` JSDoc 두 블록
  - A2-4: camera 창·handle 값 미탐색
  - A3-1: 검사기 자체 시험이 범위 안 점의 인자 위치를 확인하지 않음
  - A3-2: 예시가 모든 mark 종류를 쓰지는 않음
- 사용자 선호(계속 지킨다):
  - 서브에이전트 implementer·test-implementer·verifier는 opus, effort low로 돌린다. run은 1개다.
  - 커밋은 사용자가 지시할 때만 한다.
  - ADR과 rejection 기록은 초안을 보여 주고 승인받은 뒤 쓴다.
  - 결정 사항은 기본값으로 밝히거나 묻고, 말없이 정하지 않는다.
  - 답할 때는 방향을 정해 답한다("둘 다 맞다"식으로 답하지 않는다).
