# v2 종료, v3 시작 인계

## User Query

- "기존 결과를 opus-xhigh 서브 에이전트에게 전달해서 검수를 받아보자. 여기서 검수는 작업이 바르게 됐는지 뿐만 아니라, 우리가 문제를 해결해온 방향성 자체에 대한 검증이기도 해. (…) 그 방향성은 우리의 기존 작업을 obsolete하게 만들 수도 있지만, 그게 더 나은 방향이라면 수용해야 하지."
- "무조건적인 수용도 안되고, 양쪽이 옳다 식의 수용도 안 돼. 양쪽 의견을 모두 제시하고 trade-off를 설명해 - 나는 BE 3년차니까 FE/Design/UI/UX 용어나, 이 프로젝트에서 사용한 symbol을 말하면 이해하기 어려워. 최종 결정은 내가 한다."
- "이정도면 여기에 더 노력과 시간을 쏟을 이유가 있을까? 방향성이 전혀 증명되지 않았잖아. 증명하려면 엄청난 돈과 시간을 들여야 하고"
- "sonnet agent 호출해서 이런 라이브러리 manim 같은거, 비슷한 거 검색조 해봐"
- "찾은 툴과 사례를 정리해서 v3 handoff로 넘겨. v2는 여기서 닫는다."

## State

- 브랜치 `dev`. v2 전체를 `23a8a96`으로 커밋하고 태그 `archive/v2`를 달았다. v1은 태그 `archive/v1`(`0da38db`)이다.
- 이 인계를 `b61b369`로 커밋한 뒤 "v3 start" 커밋에서 저장소를 비웠다(v1 → v2 때처럼).
  - 남긴 것: `vercel.json`, `site/gallery/index.html`("안녕하세요?"), `LICENSE`, `.gitignore`, `.github/workflows/master-source-gate.yml`, `AGENTS.md`, `CLAUDE.md`, `agent-docs/`.
  - 지운 것: harness 전체(`.harness`, `.agents`, `.claude`의 agents·settings·skills, `.codex`, harness CI). harness는 다시 설치한다. `git config core.hooksPath`는 아직 `.harness/git`을 가리킨다.
  - 이 인계를 뺀 문서는 모두 stale로 옮겼다. ADR 3c44a1f9도 포함한다. spec-logs는 stale 대상이 아니라서 지웠다.
  - git 밖에 있던 `measurements/`(v1 측정 원본, 580 MB)와 `tmp/`는 지우지 않았다.
- 그래서 이 문서가 가리키는 저장소 경로는 대부분 태그 `archive/v2` 기준이다. 열 때는 `git show archive/v2:<path>`를 쓴다.
- v2에서 바꾼 파일(`23a8a96`):
  - **v2 runtime**: `packages/runtime/{package.json,build.mjs,bin/,src/,dev/spec-stub.mjs,rules.md,types/}`, 시험 `packages/runtime/test/`(604개)
  - **SKILL**: `skill/learn-to-tell/{SKILL.md,verify-answers.md}`, `skill/learn-to-tell/examples/projectile-drag.js`(angles 그림에 축을 넣음)
  - **실험과 검수 기록**: `bench/m1/`
    - `generation-results.md`(끝에 "검수 후 정정" 절을 더함)
    - `gen/`
    - `direction-review.md`, `direction-review-phase-a.md`
    - `runtime-sheet-review.md`, `skill-review.md`
  - **루트**: `bench/topics.md`, `plan.md`, `package.json`, `package-lock.json`, `.gitignore`
  - **agent-docs**
    - `agent-docs/spec-logs/018fd67ebfbf6b0f-m1-runtime.md`
    - 이전 인계 2개를 stale로 옮겼다: `agent-docs/handoff/stale/9c1e4b7d20a6f385-…`, `agent-docs/handoff/stale/93e77e4b52d35f59-…`
- `AGENTS.md`("현재 버전은 v2")와 `plan.md`(v2 설계)는 고치지 않았다. v3를 시작할 때 고친다.
- 실험 결과 페이지(비공개): https://claude.ai/artifact/XyRUhHQouT1jsUdjwa56Li
  - skill 수업 3개와 기준선 3개를 데스크톱·모바일 폭에서 볼 수 있다.
  - 로컬 원본은 세션 scratch에만 있었다. 다시 만들려면 `bench/m1/gen/<topic>/lesson.js`에 `node packages/runtime/bin/ltt.mjs html`을 실행하고, 같은 폴더의 `baseline.html`을 함께 둔다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| v2 핵심 구조: agent는 spec만 쓰고 runtime이 모든 화면을 그린다(ADR 3c44a1f9) | M1 생성 실험: 일반 요청보다 비용 2–3배, 시간 1.2–2.3배. "일반 요청보다 낫다"는 증거 없음. 검수자는 기준선이 3주제 중 2개에서 결정에 더 쓸모 있다고 봄(블라인드 아님) | hypothesis: runtime이 더하는 가치보다 형식 제약(글 분량, 실물 표현 불가)으로 잃는 것이 큼 |
| 한 화면에 다 넣는 slide 형식을 runtime이 보장 | runtime 한 주기에 spec 18판, 실패 시도 10건 중 8건이 화면 다듬기, 시험 604개. 그래도 실험 수업 3개 모두 모바일 첫 줄 잘림, 그래프가 화면 일부만 씀 | hypothesis: 고정 화면 형식이 배치 결함의 근원(v1과 같음). 스크롤 문서가 덜 깨진다는 근거는 정적 기준선뿐이라 약함 |
| M1 끝 조건을 비용·반복 횟수로만 정함 | 품질 비교 없이 "충족". supply-chain은 check 실패, 정답 오류 미수정 상태로 제출됐는데도 충족으로 셈 | verified: `plan.md` M1 행, `bench/m1/gen/global-supply-chain/ltt-log.jsonl` |
| 기준선을 작업 문장만으로 만듦 | skill 지시문 2.2–2.4 KB(진단·오개념·구조), 기준선 0.5–0.6 KB | verified: 비교가 공정하지 않아 runtime의 기여를 분리할 수 없음 |
| check 통과를 화면 수치의 정확성으로 봄 | supply #13: check `amp4`는 통과(2.5), 화면은 3.0배 | verified: check는 model별 기본값(`packages/runtime/src/core/model.mjs:294`), 화면은 기본값을 합침(`packages/runtime/src/layout/figure.mjs:51`) |
| sheet의 자동 배치 검사로 겹침을 0으로 봄 | 세 수업 모두 layoutViolations 0인데 검토자가 겹침 4건 보고(polished F6·F7, attacker R2, supply F10) | verified: `bench/m1/gen/<topic>/sheet-review.md` |
| 그림 필수 계약 | attacker #14·#15에 질문과 무관한 막대 | verified: 계약이 장식용 그림을 유도 |
| 장면 본문 글자 상한 | 화면 본문 음절 수가 기준선의 56–63% | verified(검수자 측정): "교과서 한 챕터" 목표와 충돌 |
| "illustrative 값" 규칙(SKILL 11번) | attacker 수업에 방어 이름·실제 수치 없음, 기준선은 방어 12개 소개 | hypothesis: 아는 수치도 인용하지 않게 만듦 |
| runtime 증거 보강 run 재개(verifier +1) | 사용자가 v2 종료로 취소 | 실행 안 함 |
| (v2 이전 기록) 렌더 전 지면 범위 감사 | 약 3.3M 토큰, 렌더한 수업 0개 | verified: `plan.md` 기각 대안 |

## Next Step

1. **v3 이해 확인부터 한다.** 출발점은 다음과 같다.
   - 의도는 `plan.md`의 "What I want"(사용자 원문 5개)다. 다만 2번(코드로 모델링한 그림을 렌더)과 5번(전환 애니메이션)이 필수인지, 수단인지는 아직 답을 받지 못했다(Open Questions 1).
   - v2는 "일반 요청보다 낫다"를 증명하지 못했다. v3는 무엇을 만들기 전에 먼저 그것을 잰다.
2. **먼저 잴 것(가장 싼 순서)**
   1. 사용자가 기존 3쌍(skill 수업 대 기준선)을 결과 페이지에서 직접 비교한다. 비용 없음, 30분–1시간.
   2. 공정 기준선 비교. 기준선에도 같은 진단 결과와 "15–20분, 예측 → 설명, 퀴즈" 지시를 준다. 6주제 × 1회, 약 $10–15. 판정 규칙(승률 문턱)은 실행 전에 고정한다.
3. **v3 후보 방향**: 상세는 `bench/m1/direction-review.md`에 있다.
   - **얇은 skill**
     - agent가 HTML 한 장을 쓴다.
     - skill은 진단, 짧은 교수 설계 체크리스트, 작은 보조 스크립트(예측 가림, 퀴즈 기록), 두 폭 자동 검사 1회, 정답 검산, 결과 되돌려주기만 더한다.
   - **문서형 + 작은 부품**
     - 글·표·실물 예시는 HTML로 쓴다.
     - 수치 모델 그림과 그 검산만 작은 라이브러리로 둔다.
     - 차트는 기성품(Observable Plot, JSXGraph 등)에 맡기는 것을 검토한다. 이 경우 `plan.md`의 Observable Plot 기각 사유("프레임마다 모델을 그리는 애니메이션과 도식에 안 맞음")를 다시 따져야 한다.
4. **v2에서 재사용할 후보**: v3 방향이 정해진 뒤 고른다.
   - 진단과 지식 map 설계: v1부터 이어 온 것. `archive/v1`, `plan.md`에 있다.
   - 정답 검산 지침: `skill/learn-to-tell/verify-answers.md`. 실험에서 실제 수치 오류 1건을 잡았다.
   - 순수 함수 수치 모델과 기대값 검사: `packages/runtime/src/core/model.mjs`. 다만 화면과 계산이 어긋나는 위 버그를 먼저 고쳐야 한다.
   - 자동 스크린샷 도구: `packages/runtime/src/cli/` sheet, playwright-core.
   - 실험 장치: `bench/m1/gen/run.sh`, `bench/m1/gen/analyze.py`. analyze는 python·sed 수정과 `node $L sheet` 실행을 세지 못하므로 고쳐 써야 한다.
   - 시험 주제와 고정 진단: `bench/topics.md`.
5. **v3 시작 때 할 일**
   - harness를 다시 설치한다(사용자).
   - v3 설계 문서를 새로 쓴다.
   - 이미 한 것: `AGENTS.md` Project Definition을 v1·v2·v3 목록으로 정리했다. ADR 3c44a1f9는 stale로 옮겼다. v2는 커밋했고 `archive/v2` 태그를 달았다.

## Open Questions

1. 의도 2번(그림을 코드로 모델링한 뒤 렌더)과 5번(페이지를 넘길 때 요소가 움직여 제자리를 찾는 전환)은 필수 요구인가, "일반 요청보다 나은 자료"를 위한 수단인가?
   - 필수라면 얇은 skill은 후보에서 빠진다.
   - 사용자에게 물었지만 아직 답을 받지 못했다.
2. 성공 판정을 무엇으로 할까? 후보는 블라인드 쌍 승률, 사용자 본인의 학습·결정 도움 평가, 퀴즈 점수다. v2는 이것을 정하지 않은 채 구현부터 했다.
3. 이해 확인 퀴즈를 페이지에서 채점할지, 대화에서 서술형으로 할지. 대화는 agent가 채점할 수 있는 유일한 곳이다.
4. 진단 사다리를 "결정에 필요한 것" 중심으로 다시 세울지. 지금 규칙("사다리 한 단 = 절 하나")은 수업을 개념을 차례로 훑는 데 그치게 했다는 지적이 있다.
5. claude.ai 경로는 아직 시험하지 않았다. runtime 묶음 약 3.9 MB와 글꼴 로딩 문제가 남아 있다.

## Spec

- 활성 spec은 없다.
- 마지막 run은 보관본 `agent-docs/spec-logs/018fd67ebfbf6b0f-m1-runtime.md`다. version 18, status limit, run ID `018fd67ebfbf6b0f`.
- 사용자가 준 verifier +1회는 쓰지 않았다. v2를 닫으면서 이 run의 재개를 취소했다.

## Execution Ledger

- **마지막 run(018fd67ebfbf6b0f) 카운터**
  - 수정 묶음 10, verifier 2/2.
  - 증거 빈틈 6개는 닫지 않고 종료했다: 사용자 정의 그림의 이벤트 속성 처리, drag 정답 표시, 키보드 이동, 화면 속성 대조, sheet 위반 보고 경로, 수정 뒤 PNG 재확인.
  - 상세는 `agent-docs/handoff/stale/93e77e4b52d35f59-m1-runtime-verifier-limit.md`에 있다.
- **M1 생성 실험**: opus-5-5, effort low, 6개 동시 실행.

  | 주제 | skill 수업 | 기준선 |
  |---|---|---|
  | attacker | 171초, $0.94 | 106초, $0.32 |
  | supply-chain | 250초, $1.06 | 110초, $0.33 |
  | polished | 192초, 약 $1.0 | 154초, $0.53 |

  - 상세: `bench/m1/generation-results.md`
- **방향 검수**: opus 서브에이전트 1개, effort xhigh, 약 361k 토큰, 18분. 결과는 `bench/m1/direction-review.md`, 블라인드 단계 기록은 `bench/m1/direction-review-phase-a.md`.
- **도구·사례 조사**: sonnet 서브에이전트 1개, 웹 검색 약 7회, 약 52k 토큰. 얕은 조사다. 결과는 아래 Reference에 있다.
- 이번에는 fuzz와 mutation을 돌리지 않았다. 구현 run이 없었다.
- **사용자 선호(계속 지킨다)**
  - 서브에이전트는 opus, effort low로 돌린다. 사용자가 모델이나 effort를 지정하면 그것을 따른다.
  - 커밋은 지시가 있을 때만 한다.
  - ADR과 rejection 기록은 초안을 승인받은 뒤 쓴다.
  - 결정은 기본값으로 밝히거나 묻는다. 답은 방향을 정해서 한다.
  - 사용자에게는 한국어로 답한다.
  - 대안 비교는 양쪽 의견과 trade-off를 함께 제시하되 "둘 다 맞다"로 끝내지 않는다.
  - FE·디자인 용어와 프로젝트 내부 기호는 풀어서 쓴다. 사용자는 BE 3년차다.
  - 최종 결정은 사용자가 한다.

## Reference: 기존 도구와 사례 조사 (2026-10-24)

- 조사 범위: sonnet 서브에이전트가 웹 검색 약 7회로 조사했다.
- "확인 못 함" 항목:
  - Idyll, MathBox, Slidev, Remotion, Theatre.js, p5.js, D3, reveal.js의 현재 상태는 검색으로 확인하지 못했다. 표의 해당 내용은 조사자의 사전 지식이다.
- 일부 출처는 2차 자료다.
- 인용하기 전에 각 repo나 원문을 확인해야 한다.

### 라이브러리

| 라이브러리 | 결과물 | LLM이 쓰기 쉬운가 | 글자·배치 자동 처리 | 빌드 없이 브라우저 | 비고 | 출처 |
|---|---|---|---|---|---|---|
| Manim CE | 영상(Python) | 학습 데이터 많음, API 큼 | 없음(`next_to`·`arrange` 정도) | 불가(Python, ffmpeg, LaTeX) | MIT, 활발. `plan.md`에서 "영상이라 조작 불가"로 기각 | https://docs.manim.community/en/stable/index.html |
| Motion Canvas | 영상·웹(TS) | 학습 데이터 적음(미확인) | 일부(flex 방식 Layout, 미확인) | 빌드 필요 | 마지막 커밋 2024-12이라는 2차 출처 | https://hn.nuxt.dev/item/47155375 |
| Remotion | 영상(React) | React라 쉬울 것(미확인) | CSS에 의존 | 빌드 필요 | 상업 이용 시 유료 라이선스(미확인) | 확인 못 함 |
| Mafs | 조작 가능한 웹 그래프(React SVG) | 선언형, 작은 API | 좌표계 안에서는 됨, 글자 충돌 회피는 없음(미확인) | React 필요, ESM CDN으로 가능(미확인) | v0.21.0, 약 3.3K stars(2차 출처) | https://docsearch.algolia.com/mcp/docs/repo/stevenpetryk/mafs |
| JSXGraph | 조작 가능한 웹 수학 그림 | 선언형 객체 API, 학습 데이터 중간 | 글자 위치 자동, 충돌 회피 약함(미확인) | 가능(script 하나) | LGPL-3.0과 MIT 병기, 불명확 | https://jsxgraph.uni-bayreuth.de/home/news/release/v1.4.1.html |
| Observable Plot | 차트(SVG) | 선언형, 학습 데이터 많음 | 축·범례 자동, 글자 충돌은 `dodge` 정도 | 가능(CDN ESM) | ISC. `plan.md`에서 그림 층으로는 기각 | https://bestofjs.org/projects/observable-plot |
| Idyll | 마크업 기반 문서 | 학습 데이터 적음(미확인) | 문서 배치만 | 빌드 필요(미확인) | 유지보수 둔화로 알려짐(미확인) | 확인 못 함 |
| p5.js, D3, reveal.js, Slidev, Theatre.js, MathBox | 웹 | p5·D3·reveal은 학습 데이터 매우 많음. D3는 저수준이라 오류 여지 큼 | 거의 없음 | Slidev 외 CDN 가능 | 모두 미확인 | 확인 못 함 |

### LLM이 학습·설명 자료를 만드는 사례

| 사례 | 하는 일 | 배치·정확성 대응 | 보고된 결과 | 출처 |
|---|---|---|---|---|
| TheoremExplainAgent (ACL 2025) | 정리를 설명하는 5분 이상의 Manim 영상 생성 | 계획 단계와 LLM 평가. 배치 보장 없음 | 240개 정리, o3-mini 성공률 93.8%. 대부분의 영상에 배치 문제가 남음. 영상이 글로는 안 보이던 추론 오류를 드러냄 | https://aclanthology.org/2025.acl-long.332 |
| Generative Manim, Math-To-Manim 등 | 자연어를 Manim 코드로 변환 | 프롬프트 위주 | 정량 결과 없음 | https://www.sourcepulse.org/projects/1834213 , https://www.sourcepulse.org/projects/1840874 |
| Google Learn Your Way (LearnLM) | 교과서를 학습자에 맞게 다시 쓰고 마인드맵·오디오·퀴즈 생성 | 원문 교과서를 근거로 씀 | 약 60명 시험에서 기억 테스트 77% 대 68%(원문 수치 미확인) | https://arxiv.org/abs/2509.13348v4 |
| InteractScience (arXiv 2510.09724) | LLM이 만든 과학 시뮬레이션 벤치마크, 150과제 | 기능 시험과 시각 시험을 병행 | 화면은 80% 넘게 동작, 과학적 정확성은 50% 미만. 실패의 53%가 화면 상태와 수식 불일치 | https://arxiv.org/pdf/2510.09724v1 |
| SimStep (arXiv 2507.09664) | 단계적으로 사양을 쓰고 디버깅하는 시뮬레이션 저작 도구 | 헤드리스 브라우저로 JS 오류를 잡아 LLM에 돌려줌 | 일부 시뮬레이션이 JS·논리·UI 문제로 동작 안 함(수치 미확인) | https://arxiv.org/pdf/2507.09664 |
| Claude·ChatGPT artifact 기반 학습 도구 | 찾지 못함 | | | |

### 조사에서 얻은 판단
- 수업 한 편 전체를 맡는 기성품은 찾지 못했다. 수업 한 편은 장면 구성, 예측 → 설명, 퀴즈, 페이지 배치를 다 포함한다.
- 그래프나 차트 한 장 단위는 기성품이 있다: Mafs, JSXGraph, Observable Plot.
- 글자 겹침을 자동으로 피하는 라이브러리는 찾지 못했다. LLM이 만든 Manim 영상에도 배치 문제가 남는다(TheoremExplainAgent).
- 숫자 정확성을 검사하는 라이브러리는 없다. 외부 근거가 둘 있다.
  - InteractScience: LLM이 만든 시뮬레이션은 화면은 동작해도 숫자가 틀린다.
  - SimStep: 헤드리스 브라우저로 JS 오류를 잡아 LLM에 돌려줘도 일부 시뮬레이션은 여전히 동작하지 않는다.
- v2 자산 중 외부 근거가 있는 것은 수치 모델과 검산이다. slide 형식과 전환 애니메이션의 학습 효과는 외부 근거도, 우리 측정도 없다.
