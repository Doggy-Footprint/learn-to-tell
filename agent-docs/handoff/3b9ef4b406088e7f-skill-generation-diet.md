# 수업 생성 경로 다이어트: 흐름·검증·문서·audit·kit 선언형 부품

## Goal

- "handoff를 참고해서 skill의 시행 흐름과 속도, 비용을 개선해야 해."
- "내 진짜 intent는 '이 프로젝트가 좋은 품질의 학습 자료를 빠르고 적은 토큰 비용으로 제공하는 것'이야."
- "이 계획을 임시 폴더에 커밋하고 handoff에 적어줄 수 있어? 새로운 세션에서 이어가야해"

## State

- 브랜치 `fix/efficiency`. 기준 커밋 `f16c44e`(앞 세션 handoff `418133af…` 커밋)이다.
- 승인된 계획: `agent-docs/plans/b71ddee49f77ac06-skill-generation-diet.md`. 이 handoff와 같은 커밋에 들어 있다.
- 변경 파일은 다음과 같고, 코드 변경은 없다.
  - `agent-docs/plans/`(새 디렉터리: 계획, `index.md`, `stale.md`, `stale/`)
  - 이 handoff
  - `agent-docs/handoff/index.md`
- `tmp/`는 `.gitignore`에 있어 커밋할 수 없다. 그래서 계획을 `agent-docs/plans/`에 두었다.
- `agent-docs/plans/`는 이 작업을 위해 2026-10-19 세션이 새로 만든 임시 디렉터리다. 이 handoff가 끝나면 `git rm -r agent-docs/plans`로 폴더째 지운다(사용자 지시). `stale/`로 옮기지 않는다. 이 handoff 자체는 Handoff Rule대로 `stale/`로 옮긴다.
- 계획 단계 0의 첫 항목(미커밋 handoff 커밋)은 `f16c44e`로 끝났다.
- 2026-10-19 두 번째 세션:
  - 단계 0 완료(`bed2771`): `scripts/transcript-cost.mjs`, ledger `b41cd6ae…` 실험 3.
  - 단계 1 완료(`46feba8`): SKILL.md·API.md·rules.md·map/import.md·standalone·PROJECT·README, 테스트. `npm test` 1025 통과.
  - 단계 2 완료: ledger 실험 4.
  - run A는 understanding round에서 사용자 확인을 기다린다. K1 1안 spike 결과는 Execution Ledger "K1 spike"에 있다.
  - 품질 확인(사용자 요청, Execution Ledger "품질 확인"): 새 흐름이 블라인드 채점 3개 주제 모두에서 변경 전 흐름보다 낮았다. run A 전에 흐름을 고칠지 사용자 결정을 기다린다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |
| 단계 1 흐름(`46feba8`: outline → 한 번 Write, outline만 보는 검토 1개, 독자·눈 검토 제거) | 블라인드 채점 3개 주제 모두 변경 전 흐름 선호, 5축 합 17–18 vs 23–25(Execution Ledger "품질 확인") | hypothesis: outline이 장면 예산 하한(8–9장면)에서 범위를 굳히고, 완성본을 읽는 검토가 없어 빠진 개념·약한 그림을 고칠 단계가 없다 |

## Next Step

계획의 "단계와 순서"를 차례로 한다. 시작점은 단계 0의 `scripts/transcript-cost.mjs`다.

1. `scripts/transcript-cost.mjs`
   - 입력: main transcript `~/.claude/projects/<cwd>/<session>.jsonl`과 `<session>/subagents/agent-*.jsonl`.
   - 측정 정의는 아래 Execution Ledger "transcript 측정 주의"를 따른다.
2. 단계 0 측정: 현재 skill(HEAD)과 기준선을 CPU+cache 주제로 1회씩 돌린다. 조건은 다음과 같다.
   - `claude -p --model sonnet --effort medium`을 빈 scratch 디렉터리에서 실행한다.
   - skill 쪽은 `--plugin-dir <repo>`와 `LTT_HOME=<scratch>/home`을 준다. 기준선은 plugin 없이 실행한다.
   - 도구는 `--allowedTools`로 좁힌다(CLI 2.1.303에 `--model`·`--effort`·`--plugin-dir`·`--allowedTools`가 있다).
   - 결과는 `agent-docs/handoff/b41cd6aec66a2589-refactoring-1-lesson-cost-ledger.md` Execution Ledger에 적는다.
3. 단계 1(문서·흐름, workflow 아님) → 단계 2(측정 1차) → 단계 3–6(workflow-approach run A–D) → 단계 7(측정 2차).
4. 마무리:
   - `agent-docs/plans/` 폴더를 통째로 지운다(`git rm -r agent-docs/plans`).
   - 이 handoff의 index 항목을 `stale.md`로 옮기고 파일을 `stale/`로 옮긴다.
   - `b41cd6ae…`와 `418133af…`도 계획대로 `stale/`로 옮긴다.

사용자가 정한 에이전트 운용:
- 작업·분석 서브에이전트는 `model: opus`, `effort: low`로 띄운다. 탐색 에이전트와 workflow의 implementer·test-implementer·test-verifier·mutant-triager가 모두 여기에 든다.
- skill을 실제로 써 보는 테스트는 sonnet-5.5 + effort medium으로 돌린다.

## Open Questions

- `claude -p` 중첩 실행의 권한 범위(`--allowedTools` 목록)와, 백그라운드 서버 시작 단계를 테스트에서 뺄지는 아직 정하지 않았다.
- 계획 "기본값" 세 가지는 사용자가 바꾸라고 하지 않으면 그대로 쓴다.
  - 검토 서브에이전트 모델은 부모 모델을 상속한다.
  - 테스트 주제는 CPU+cache의 AoS vs SoA 시나리오다.
  - gallery 수업은 다시 쓰지 않는다.

## Spec

해당 없음. 아직 workflow run을 시작하지 않았다. 단계 3–6에서 run마다 `agent-docs/specs/`에 spec을 만든다(run A: kit 측정·판정, B: audit CLI, C: 선언형 칸, D: 부품).

## Execution Ledger

### 근거 출처

계획 Context의 수치는 2026-10-19 세션의 탐색 에이전트 3개와 Plan 에이전트 1개가 원자료를 읽어 낸 것이다. 원자료는 아래에 있다.
- compare1 transcript: `~/.claude/projects/-Users-hwansu-orca-workspaces-learn-to-tell-run-time/76d97b37-2581-43f6-a4e0-feeda1bf2e34/subagents/`
- lesson 파일: `site/compare1/*/skill.html`
- 검토 지적 원문: `site/compare1/index.html`에 들어 있다.

검증 에이전트 ID(기대값 / 주장 / 독자 / 눈):

| 주제 | 기대값 | 주장 | 독자 | 눈 |
| --- | --- | --- | --- | --- |
| cache-ttl | aca65 | acf7e | a2480 | ad6ea |
| trolley | a7135 | a70b0 | a928c | ad818 |
| projectile | a0ec2 | a80b3 | aa177 | a7967 |
| contrast | a12ef | a262f | ab3e0 | a09c8 |
| ontology | a86b8 | a506c | aa30b | ad7ca |

생성 에이전트 ID는 `418133af…` handoff에 있다. 수정 전 사본과 `review-findings.md`는 앞 세션 scratchpad `/private/tmp/claude-501/-Users-hwansu-orca-workspaces-learn-to-tell-run-time/76d97b37-2581-43f6-a4e0-feeda1bf2e34/scratchpad/`(`ltt-exp/`)에 있다. 영구 보존이 아니다.

### transcript 측정 주의

- JSONL은 tool call을 `api-request-blob` 레코드에 한 번 더 남긴다. `assistant`·`user` 레코드만 세야 하고, 아니면 PNG·패치 수가 두 배로 나온다.
- usage는 `message.id`로 중복을 지운다.
- `output_tokens`는 믿을 수 없다. 26–46K자 Write 메시지가 3–35로 기록되어 있다. 출력은 assistant 글 + tool 입력 글자 수로 추정한다. lesson Write 전후 context 증가로 재면 약 1.6자/token이다.
- `subagent_tokens`(Agent 완료 알림)는 마지막 context 크기다. 누적 비용이 아니다.
- 비용 지표는 가중 합으로 정했다: 입력 1, cache write 1.25, cache read 0.1, 출력 5.

### 생성 에이전트의 kit·gallery 조회 (문서 공백 근거)

- 아이콘 이름: 5/5 에이전트가 grep했다. API.md에는 `LTT.icons`가 있다는 말만 있고, base.md는 Lucide 16개만 적고 손그림 44개는 적지 않았다.
- sweep 마크업: `#id`/`#id-v`, `.ltt-param` 예가 없다. 4/5가 gallery에서 찾았다.
- kit CSS 클래스 목록: `ltt-param`, `ltt-hero`, `ltt-stat`, `ltt-key`가 없다.
- audit CLI와 home/kit 경로: 5/5가 `audit.mjs` 앞부분을 읽었다.
- 그 밖에 찾은 것: overview·figure 크기, figure-with-steps 반환값, axisPlot·hbars 옵션, `diagram.edge()`가 라벨을 주지 않는 점, expect tolerance(`internals.md`에만 있다).
- `LTT.$`: 수업 3개와 gallery 4개가 쓰지만 `internals.md:22`에만 적혀 있다. sweep이 DOM id에 묶여 있어서 쓰게 된다.

### audit.mjs 구조 (CDP 재작성 run B 입력)

- Chrome 찾기: `audit.mjs:36-44`. 없으면 종료 코드 2.
- 실행: 대상 × 크기마다 1회, `--jobs` 4 pool(`:13, :144-154, :170`). `--dump-dom` + `--virtual-time-budget=12000`(`:12, :79-81, :114`).
- 결과 추출: `<script id="ltt-audit">`를 정규식으로 읽는다(`:116`).
- 재시도: JSON이 없으면 예산 3배로 두 번 재시도(`:118-122`), 각각 `RUN_TIMEOUT` 60s(`:14, :96-99`).
- 스크린샷: `takeShots`(`:133-141`)가 장면마다 Chrome을 새로 띄워 `--screenshot`, `url#i`로 차례로 찍는다.
- 출력: `formatReport`(`:185-205`). lint 줄에 rule id가 없고(`:199`), lint·expect를 크기마다 반복한다. 종료 코드는 0/1/2(`:207-210`).
- 페이지 쪽: `ltt-deck.js:1235-1236`이 `fonts.ready` + 300ms 뒤 `audit()`을 부른다. 장면 `#n`은 시작 때만 읽는다(`:1224`). `go(i)`는 closure다(`:1081`, 점 클릭 `:1016/:1217`). `data-ltt-audit`는 `:1203`.
- server 경로: `server.mjs` `/kit/*`(`:109`), `/lessons/<id>/*`(`:123`), events POST(`:105`). audit 임시 home에서는 `/map/data.json`이 404다.

### kit 지점 (run A·C 입력, Plan 에이전트 검토)

- `fit()`: `ltt-deck.js:826-838`이 장면 zoom을 정하는 유일한 곳이다(하한 0.78). `placement`는 `ctx.refit`(`:1024`)로 거기에 닿는다.
  - predict lock은 정답 상태마다 `refit()`을 읽는다(`~:392-398`). steps `measureAll`은 `~:333-345`다.
  - steps의 `tallest`는 `pic.offsetHeight`와 `minHeight`로 잰다(`~:325`).
  - 폰은 `mobileFit`(`:848`)이 맡는다.
- `zoomLock`: `ltt-deck.js:292-301`. 최소 배율을 만든 상태를 버린다.
- `measure`: `ltt-deck.js:946-981`. `graphOverlaps`는 개수만 남긴다(`:976`). `visualRatio`는 그림이 없으면 `null`이고, 그러면 `small-visual`이 판정을 건너뛴다.
- `auditScene`: `ltt.js:619-639`. `lintDeck` 규칙은 `ltt.js:513-599`, runner는 `:602-613`이다. 메시지 문구를 고정한 테스트는 없다(rule id만 확인한다). 그래서 메시지를 고쳐 써도 테스트는 깨지지 않는다.
- `fill`: `ltt-ui.js:115-121`. 함수·Node·그 밖(innerHTML)만 받아서, 객체를 주면 `[object Object]`가 나온다.
  - figure는 `ltt-deck.js:552-583`, overview는 figure를 다시 쓴다(`:594`).
  - `answerVisual`은 `fill`을 거치지 않는다(`:640-643`).
  - `mount`는 `:1046`이다.
- 장면 타입: `ltt-deck.js:819-821`이 `LTT.sceneTypes` entry 없는 타입을 막는다. `internals.md:28`에 "12개 entry"라고 적혀 있다. sweep `control`은 `ltt-parts.js:376`이다.
- K1 위험: 2안(`fit` 안에서 줄이기)으로 가면 `zoomLock`이 `{z, figMax}`를 잠가야 한다. 그렇지 않으면 predict 공개 때 그림 크기가 바뀐다. 1안(장면당 한 번 계산하는 CSS `--avail`)은 상태와 무관해서 ADR `40552fcb…`를 그대로 지킨다.

### 문서 문구를 고정한 테스트 (단계 1에서 고친다)

- `tests/map/skill.test.mjs`: SKILL.md를 `## N` 헤딩으로 나눈다(`:10`). 고정한 것:
  - `:21` §5 frontmatter 필드
  - `:27` §0 `find`·`show`, map.md는 통째로 읽지 않는다
  - `:36` §6 find/재사용
  - `:44` 입자도
  - `:50` level 1–5
  - `:58` sweep 문구
  - `:69` grid·focus URL
- `tests/api-docs.test.mjs`:
  - 이름 정의: `:230-274`(런타임 `LTT.*` 75개가 API.md·api/*.md 첫 칸에 한 번씩), `:284`(deck-contracts.md는 이름을 정의하지 않는다)
  - 크기 상한: `:307` API.md ≤ 8,500자, `:324` API.md + 가장 큰 부품 문서 2개 ≤ 18,000
  - API.md 구조: `:351` 불러오기 순서, `:357` 테마 이름, `:370` lint 17·audit 12 id, `:407`·`:412` 행 길이, `:424`, `:429`, `:436`
  - 부품 문서: `:440` 10개, `:453` 첫 줄 언제·vendor·catalog
  - SKILL.md 문구: `:480` §2 예산 B1–B4, `:486`, `:490` §3 읽기 줄, `:498` 부품 표, `:512` internals 언급 금지, `:526`·`:535` §5 생성 비용
  - 그 밖: `:544` standalone 줄, `:551`·`:561` PROJECT.md, `:580` catalog 앵커, `:719`·`:762` audit 임계값 문구
- `tests/release-docs.test.mjs`:
  - internals.md: `:75`, `:83`, `:88`, `:99`, `:105`, `:115`, `:176`, `:190`, `:299`, `:305`, `:443`
  - CHANGELOG: `:230-262`, `:325-336`, `:401`, `:419`
  - README: `:267`, `:460`
  - API.md 원칙 vw 줄: `:290`
  - deck-contracts: `:312`, `:319`, `:351`
- gallery audit 테스트(`tests/gallery-audit.test.mjs`)는 `LTT_AUDIT=1`일 때만 Chrome으로 돈다. 기준선은 전부 0이다.

### K1 spike (2026-10-19, scratch만, 저장소 변경 없음)

- 1안 구현: 장면마다 창 크기가 바뀔 때 한 번, zoom 1에서 넘침량을 재고, `.dk-body` 안 가장 큰 `svg[viewBox]`·`img`·`canvas`(아이콘·목업·SVG 안 SVG 제외, 높이 120px 이상)에 `max-height = max(높이 × 0.65, 높이 − 넘침)`을 건다. 이어서 기존 `fit`이 남은 넘침을 zoom한다.
- 결과(audit JSON에 장면별 zoom을 더해 비교):

  | 대상 | zoom < 1 장면 | 경고 변화 |
  | --- | --- | --- |
  | gallery 11편 × 2크기(338장면) | 65 → 40 | 0 → 0 |
  | compare1 5편 + 실험 3 첫 초안·최종(192장면) | 64 → 48 | shrunk 2 → 2, small-visual 0 → 2 |

- 실패한 시도: 처음 구현은 매번 `style.maxHeight = ""`로 되돌려 작가가 건 `max-height: 90px`(compare1 projectile 장면 8)를 지웠다. 그 장면 zoom이 0.96 → 0.78로 나빠졌다. kit이 건 값만 기억해 되돌리게 고쳤다.
- 남은 shrunk 2건(실험 3 초안)은 큰 그림이 없는 글 장면이라 1안이 다루지 않는다. 새 small-visual 2건은 그림을 줄인 뒤 비율로 판정해서 생겼다. 계획대로 줄이기 전 비율로 판정하면 사라질 것이다(hypothesis).
- 판단: 2안(`fit` 안에서 줄이고 `zoomLock`이 `{z, figMax}`를 잠금)은 필요 없다.

### 품질 확인 (2026-10-19, 실험 5)

- 질문: 새 흐름 수업이 얇아진 것이 흐름 탓인지 실행 편차인지. 사용자 승인 계획: 주제 2개를 두 흐름으로 1회씩 더 생성하고 CPU+cache 쌍과 함께 블라인드 채점.
- 조건: sonnet + effort medium, 격리 HOME, 변경 전 흐름 = `b6dd805` 스냅샷, 새 흐름 = `46feba8` 스냅샷. 시나리오와 고정 진단은 compare1(`site/compare1/index.html`)과 같다. 같은 주제의 두 흐름을 동시에 돌렸다(벽시계는 쌍 안에서만 비교).
- 채점: 주제마다 opus low 서브에이전트 1개가 두 수업을 X/Y(무작위 배정)로 받는다. HTML 소스와 1280×800 contact sheet만 읽고 범위·정확성·근거·독학 가능성·시각 설계를 1–5점으로 매긴다.

  | 주제 | 흐름 | 장면 | 크기 | 한글 음절 | 벽시계 | 가중 토큰 | 범위·정확·근거·독학·시각 | 합 | 선호 |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | CPU+cache | 변경 전 | 12 | 31.6KB | 2,817 | 658 s | 1,319,879 | 4·5·5·5·5 | 24 | ✓ |
  | CPU+cache | 새 흐름 | 11 | 15.6KB | 1,707 | 297 s | 504,558 | 3·4·4·3·3 | 17 | |
  | cache-ttl | 변경 전 | 10 | 25.2KB | 2,306 | 459 s | 990,879 | 5·4·4·5·5 | 23 | ✓ |
  | cache-ttl | 새 흐름 | 8 | 11.4KB | 1,235 | 214 s | 367,830 | 3·4·4·4·3 | 18 | |
  | contrast | 변경 전 | 12 | 26.1KB | 2,064 | 823 s | 1,085,294 | 5·5·5·5·5 | 25 | ✓ |
  | contrast | 새 흐름 | 9 | 14.8KB | 1,404 | 212 s | 383,881 | 3·4·5·3·3 | 18 | |

- 판정(계획 기준 "내용 축에서 2개 주제 이상 뒤지면 흐름 탓"): 3/3 주제에서 뒤졌다. 흐름 탓으로 본다.
- 새 흐름에서 빠진 것(채점자 지적):
  - CPU+cache: 적중·미스, 프리페치 설명과 그림, hybrid 계산.
  - cache-ttl: 데이터 종류별 TTL 분리, 틀린 값의 비용으로 상한 정하기, 시간축 만료 그림.
  - contrast: 대비비 식 장면, 굵은 큰 글자·배경색 조작, 기준 눈금 그림.
- 3개 주제 공통: 한 장 정리가 주 그림이 아니다(표, 구조도 재사용, 글 상자). 조작 장면은 막대 2개 수준이다.
- 정확성(조건 누락) 지적: 새 흐름 1·2·1건, 변경 전 0·3·0건.
- audit·lint는 양쪽 모두 "고침" 0건이다. 새 흐름 cache-ttl만 권고 `shrunk` 1건(1280×800, 87%)이 남았다. 화면 깨짐 차이는 없다.
- outline 길이 2,212·1,786·1,868자(SKILL.md 지시 3,000자 안팎). 장면 예산 문구("기본 8~10장면")는 두 흐름이 같다. 변경 전 흐름은 완성본 검토(독자·눈) 뒤 10–12장면으로 늘었다.
- 비용: 새 흐름 가중 토큰은 변경 전의 0.35–0.38배다. 계획 목표(기준선 대비 가중 ≤ 2배, 벽시계 ≤ 1.5배)는 CPU+cache 기준선 652,495로 환산하면 가중 약 130만까지 여유가 있다.
- 산출물은 세션 scratchpad `eval/`에 있다(영구 보존 아님).

### 결정 기록

- 2026-10-19 사용자 답: 검토 서브에이전트 1개 유지, audit "고침" 0 + "권고"는 3회 안, kit K1–K8 전부, kit·audit 코드는 workflow-approach.
- 계획의 counter proposal도 승인과 함께 받아들여졌다. 비용 지표를 가중 합으로 바꾸고, 목표치를 기준선 대비 벽시계 ≤ 1.5배·가중 토큰 ≤ 2배로 둔다.
