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
  - 단계 0 완료(`bed2771`): `scripts/transcript-cost.mjs`.
  - 단계 1 완료(`46feba8`): SKILL.md·API.md·rules.md·map/import.md·standalone·PROJECT·README, 테스트. `npm test` 1025 통과.
  - 단계 2 완료.
  - run A는 understanding round에서 사용자 확인을 기다린다.
  - 지시문 수정(`fc378e1`): API.md 수업 예를 다른 분야의 조합 조각으로 바꾸고 SKILL.md 범위·매체·주 그림 문단을 되살렸다.
  - AGENTS.md에 "생성된 수업의 결함은 생성기에서 고친다" 규칙을 넣었다(`96e06db`).
  - 사용자 지시로 여기서 멈췄다. 저장소 변경은 모두 커밋·푸시했다.

## Failed Attempts

| attempt | failure evidence | cause |
| --- | --- | --- |
| (없음) | 착수 전 | - |
| 단계 1 흐름(`46feba8`: outline → 한 번 Write, outline만 보는 검토 1개, 독자·눈 검토 제거) | 블라인드 비교에서 변경 전 흐름보다 낮게 평가됐다 | hypothesis: outline이 범위를 굳히고, 완성본을 읽는 검토가 없어 빠진 개념·약한 그림을 고칠 단계가 없다(뒤 분석에서 약해졌다: 분량 차이는 쓰기 전 지시문에서 생겼다) |
| 단계 1의 눈 검토·장면별 스크린샷 제거(`46feba8`, 대체로 계획한 contact sheet는 run B 전이라 없음) | 사용자가 생성된 수업을 직접 보고 그림 결함을 찾았다. 새 흐름은 이미지를 한 번도 Read하지 않았다 | verified: 화면을 보는 단계가 없고, audit·lint가 이 결함 종류를 잡지 못한다 |

## Next Step

재개 지점(2026-10-19): Open Questions의 생성기 수정 제안을 사용자가 정하면 그 순서로 진행한다. 남은 것은 계획 "단계와 순서"의 단계 3–6(workflow-approach run A–D), 단계 7, 마무리다.

마무리:
- `agent-docs/plans/` 폴더를 통째로 지운다(`git rm -r agent-docs/plans`).
- 이 handoff의 index 항목을 `stale.md`로 옮기고 파일을 `stale/`로 옮긴다.
- `b41cd6ae…`와 `418133af…`도 계획대로 `stale/`로 옮긴다.

사용자가 정한 에이전트 운용:
- 작업·분석 서브에이전트는 `model: opus`, `effort: low`로 띄운다. 탐색 에이전트와 workflow의 implementer·test-implementer·test-verifier·mutant-triager가 모두 여기에 든다.
- skill을 실제로 써 보는 테스트는 sonnet-5.5 + effort medium으로 돌린다.

## Open Questions

생성기 수정 제안(사용자 결정 대기, AGENTS.md "Generated Lesson Defects"):
- lint: 장면 타입에 없는 필드(예: 타입 없는 장면의 `figure`)를 "고침"으로 잡는다.
- audit: 빈 그림, 번호 표식이 글자와 겹치거나 그림 밖에 있는 경우, 손 그림 SVG의 표식 겹침·작은 글자를 잡는다.
- 번호 표식 위치: `points.at`의 % 좌표 대신 그림 요소에 붙여, 화면을 보지 않아도 맞게 한다.
- 표현력: gallery 수업의 장면 캡처를 주제 유형별 본보기로 보여 준다.
- outline에 개념 사다리를 적고 개념마다 장면을 하나씩 대응시킨다. 용어집에만 있는 개념은 다룬 것으로 치지 않는다.

## Spec

해당 없음. 아직 workflow run을 시작하지 않았다. 단계 3–6에서 run마다 `agent-docs/specs/`에 spec을 만든다(run A: kit 측정·판정, B: audit CLI, C: 선언형 칸, D: 부품).

## Execution Ledger

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
- K1: 1안(장면당 한 번 계산하는 CSS `--avail`)으로 간다. 상태와 무관해서 ADR `40552fcb…`를 그대로 지킨다. 2안(`fit` 안에서 줄이기)은 `zoomLock`이 `{z, figMax}`를 잠가야 하고, 그렇지 않으면 predict 공개 때 그림 크기가 바뀐다.
- K1 실패한 시도: 매번 `style.maxHeight = ""`로 되돌리면 작가가 건 `max-height`가 지워져 장면 zoom이 나빠진다. kit이 건 값만 기억해 되돌린다.

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

### 결정 기록

- 2026-10-19 사용자 답: 검토 서브에이전트 1개 유지, audit "고침" 0 + "권고"는 3회 안, kit K1–K8 전부, kit·audit 코드는 workflow-approach.
- 계획의 counter proposal도 승인과 함께 받아들여졌다. 비용 지표를 가중 합으로 바꾸고, 목표치를 기준선 대비 벽시계 ≤ 1.5배·가중 토큰 ≤ 2배로 둔다.
