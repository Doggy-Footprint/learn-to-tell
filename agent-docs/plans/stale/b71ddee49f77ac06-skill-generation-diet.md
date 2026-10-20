# learn-to-tell 생성 경로 다이어트: 빠르고 싼 수업 생성

- 상태: 2026-10-19 사용자 승인. 진행 상황은 handoff `agent-docs/handoff/3b9ef4b406088e7f-skill-generation-diet.md`에 있다.
- 이 문서는 작업 동안만 쓰는 계획이다. 작업을 마치면 `agent-docs/plans/` 폴더째 지운다(`git rm -r agent-docs/plans`).

## Context

진짜 목표: "좋은 품질의 학습 자료를 빠르고 적은 토큰 비용으로 제공한다."

## 목표 수정 제안 (intent에 대한 counter proposal)

- **비용 지표를 바꾼다**: `subagent_tokens`(마지막 context 크기)가 아니라 transcript usage의 가중 합(입력 1, cache write 1.25, cache read 0.1, 출력 5)으로 잰다. 실제 요금과 비례하고, 턴 수 × context가 그대로 드러난다.
- **목표치**: 같은 모델·같은 주제의 기준선 대비 생성 단계 벽시계 ≤ 1.5배, 가중 토큰 ≤ 2배. 기준선과 같거나 더 빠르게는 현실적이지 않다: 기준선은 렌더링·사실 검증을 전혀 하지 않고, 수업 본문 글자 수가 출력 시간의 하한이다. 대신 kit 고수준화로 lesson 크기를 기준선 HTML 이하로 줄이는 것을 stretch 목표로 둔다.
- **검토 에이전트를 0으로 하지 않는다**: 틀린 내용은 가장 나쁜 품질 결함이다. 그래서 주장 검토 1개만 남기고, 수업 전체가 아니라 짧은 outline만 읽혀 싸게 만들고, HTML 작성과 병렬로 돌려 벽시계에 더하지 않는다. 독자·눈 검토는 없애고 자동 규칙과 contact sheet 한 장으로 바꾼다.

## 설계

### 1. 새 생성 흐름 (§3 자료)

턴 수를 ~12로 줄이는 것이 핵심이다. 수정 왕복(phase 2)을 없애고, 모든 것을 한 context에서 한 번에 한다.

1. 읽기: `SKILL.md`(이미 읽음) + `kit/API.md` + 고른 부품 문서만, **한 턴에 병렬 Read**.
2. **설명 전략 + 장면 outline**을 `<home>/lessons/<id>/outline.md`에 Write(~3K자). 장면마다 type·주장 제목·핵심 내용·쓸 부품 한 줄, 결정 변수 주장 목록, 수치 모델의 공식과 계산 지점.
3. 같은 응답에서 **검토 서브에이전트 1개를 background로** 띄운다(outline.md와 background.md 경로만 준다). 돌려받는 것: 틀린 주장·빠진 조건·출처 오류와 고친 문장, 계산 지점의 기대값, outline 수준 독자 문제(선행 개념 누락, 뒤 predict의 답을 미리 말하는 제목, 정의 전 기호 사용). 모델은 지정하지 않는다(부모 모델 상속).
4. `lesson.html`을 **한 번 Write**. kit 부품 호출과 장면 데이터로 짠다. 기대값 자리는 비워 둔다.
5. `audit.mjs` 1회(두 크기 + contact sheet 한 장).
6. 검토 결과 + audit 지적을 **한 응답의 Edit 묶음**으로 반영(`LTT.expect` 삽입 포함).
7. audit 재실행. **audit은 최대 3회**. 3회째에도 남은 "권고" 경고는 `result.md`에 적고 공개한다. "고침" 경고·lint 오류·expect 불일치는 0이어야 한다.
8. contact sheet를 한 번 본다. 그다음 서버 안내.

금지(SKILL.md에 짧게):
- kit 소스(`kit/*.js|css`), `server/*.mjs`, gallery 페이지를 읽거나 grep하지 않는다. `node -e`로 kit을 실험하지 않는다. 문서에 없는 것은 문서에 있는 부품으로 대신하고 `result.md` "kit 후보"에 적는다.
- lesson.html을 다시 통째로 Write하지 않는다. python·sed 패치를 쓰지 않는다. Edit만 쓴다. 자기가 쓴 lesson.html을 다시 Read하지 않는다.
- 장면별 PNG를 열지 않는다(contact sheet 한 장, 필요하면 경고 장면 1–2장만).
- 경고를 피하려고 px 폭·높이를 조정하지 않는다(kit이 맞춘다, 아래 5-K1). audit을 `timeout`으로 감싸지 않는다(macOS에 없다, audit이 자체 제한을 둔다).
- 손 그림(SVG·d3·innerHTML 템플릿)은 kit 부품·spec으로 그릴 수 없는 도메인 그림에만 쓴다.

### 2. 검증 (§3.6 대체)

| 지금 | 바뀐 뒤 |
| --- | --- |
| 기대값 서브에이전트 | 검토 서브에이전트에 합침(공식·계산 지점만 받는 독립성 유지) |
| 주장 검토 서브에이전트 | 같은 검토 서브에이전트, 입력은 outline.md |
| 독자 검토 서브에이전트(lesson.html 통째) | 없앰. outline 수준 항목은 검토 서브에이전트, 나머지는 lint 규칙(아래)과 작성 규칙 |
| audit 2크기 0건 | audit 2크기, "고침" 0건 + "권고"는 3회 안에서 고치고 남으면 기록 |
| 눈 검토 서브에이전트(장면별 PNG) | 없앰. contact sheet 한 장을 생성 agent가 보고, 화면 문제 상당수는 자동 규칙으로 |

서브에이전트를 쓸 수 없으면(standalone) 지금처럼 "미검증" 태그를 단다. `learn-to-tell-PROJECT.md` 검증 원칙(독자 검토 서브에이전트 문장)을 같이 고친다.

### 3. 문서 다이어트

목표: 생성 때 읽는 문서 ~30K자. 크기 상한을 테스트로 고정해 다시 불어나지 않게 한다.

- `SKILL.md` 33.7K → ≤ 14K자. 남길 것: 흐름(§0–6), 해야 할 것·하지 말 것, 검증, result.md 템플릿, map 명령. 뺄 것: §3의 부품·손잡이·장면 순서 표와 독학 기준 표(→ API.md로 옮기며 중복 제거), gallery 안내(예시 수업 목록·catalog·scenes URL), §3.6 서술형 체크리스트, import 절(→ `map/import.md`, 인자가 import일 때만 읽음).
- `kit/API.md` 12.3K → 단일 작성 참조(≤ 13K): 불러오기 + `ltt-meta` head 예, **짧은 선언형 수업 예 하나**(장면 3–4개; 복사용 템플릿이 아니라 API 조합 예라는 점을 rejection `2c5216fd…`과 같이 명시), 장면 타입·필드 표, 부품 고르기 표, 손잡이 표, 독학 기준을 한 줄 규칙으로, 테마 표, **아이콘 이름 목록**. lint·audit 규칙 표는 `kit/api/rules.md`로(audit 출력이 스스로 설명하므로 보통 읽지 않는다).
- 부품 문서(`kit/api/*.md`)는 그대로 두되 새 spec 형식과 sweep 장면을 반영한다.
- `standalone.md` 표를 새 흐름에 맞춘다. `result.md` "생성 비용"은 audit 출력에서 옮겨 적을 수 있는 항목으로 줄인다(lesson 바이트·장면 수, 검토 서브에이전트 수, audit 횟수, 시각, 토큰).
- 문서 문구를 고정한 테스트를 새 구조에 맞게 고친다: `tests/api-docs.test.mjs`(크기 상한, 규칙 id 위치, §2·§3·§5 문구, standalone 줄), `tests/map/skill.test.mjs`(§0·§5·§6 헤딩·문구), `tests/release-docs.test.mjs`(API.md 원칙 줄 등). SKILL.md·API.md 크기 상한 테스트를 추가한다.

### 4. audit 도구 (`server/audit.mjs`, kit의 측정·판정)

- **CDP로 다시 짠다**: Chrome 하나(`--remote-debugging-port=0`, Node 내장 WebSocket, 새 의존성 없음)에서 두 크기를 돌리고, 가상 시간 예산 12s를 기다리지 않고 `fonts.ready` 뒤 `data-ltt-audit`가 붙으면 끝낸다. 크기마다 resize가 아니라 reload(지금과 같은 placement 의미). reduced-motion을 에뮬레이트한다. 장면 이동은 `?audit`일 때만 여는 덱 `go` 훅(지금은 `#n`을 시작 때만 읽음)으로 하고, 장면 스크린샷을 같은 세션에서 찍는다(장면마다 Chrome 재시작 없음). 임시 프로필은 `finally`에서 지운다. 기존 `--dump-dom` 경로는 `--legacy`와 CDP 실패 시 자동 fallback으로 남긴다.
- **contact sheet**: 1280×800 장면 스크린샷을 격자 한 장(`<lesson dir>/audit/sheet.png`)으로 Chrome이 직접 합성. 칸마다 장면 번호·type·경고 배지.
- **고칠 곳을 말하는 메시지**: 규칙마다 장면 필드·파라미터를 가리킨다. 예: `장면 7 predict · shrunk 82% (정답 B 공개 상태) — why 312자, answerVisual 높이 240px → why를 줄이거나 answerVisual을 낮춘다`. graph-overlap은 겹친 노드·라벨 id, goal-*는 목표·손잡이 범위·적중 자리, hscroll은 가장 넓은 요소. zoomLock이 버리던 "최소 배율을 만든 상태"를 남긴다.
- **심각도**: "고침"(overflow, hscroll, panel-overlap, graph-overlap, goal-unreachable, goal-at-start, expect 불일치, lint 중 unknown-term·used-before-defined·순서·overview·theme·filler) / "권고"(shrunk, small-visual, loose-figure, empty-stage, many-sizes, goal-narrow, card-monotony, no-signature, unused-term, 새 규칙). lint·expect는 크기마다 반복하지 않고 한 번만 출력. 출력 첫 줄에 lesson 바이트·장면 수.
- **새 자동 규칙**(독자·눈 검토 항목 중 결정적으로 잴 수 있는 것): 렌더된 글자 대비(배경 대비 4.5/3.0), SVG 안 글자 겹침(라벨이 선·라벨과 겹침), 무대 밖으로 잘린 그림, 그림 없는 그림 장면(`visualRatio == null`), 같은 type·layout·form 장면 연속, narration·step 글 길이 상한, goal 없는 손잡이, `ltt-meta.medium`과 테마 매체 불일치.

### 5. kit 선언형 부품 (라이브러리를 "구조를 말하면 그려 주는" 수준으로)

- **K1 그림이 남는 높이를 흡수**: 장면 전체를 줄이기 전에 주 그림을 (비율 유지, 자연 높이의 65%까지) 먼저 줄여 글자를 100%로 남긴다. `shrunk`/`small-visual` 반복의 원인 제거.
  - 1안으로 간다(spike 완료, 2안은 필요 없다): 장면마다 한 번 `--avail`(장면 높이 − 그림 밖 내용 높이)을 계산해 `.dk-fig-stage > svg[viewBox]`·`[data-visual]`에 `max-height`로 건다. 상태와 무관한 제약이라 `placement`·`zoomLock`(ADR `40552fcb…`)을 건드리지 않는다. 남는 넘침은 지금 zoom이 맡는다. kit이 건 `max-height`만 되돌린다(매번 `style.maxHeight = ""`로 되돌리면 작가가 건 값이 지워진다).
  - 폰(`mobileFit`)은 건드리지 않는다. `small-visual`·`loose-figure`는 줄이기 전 비율로 판정해 경고가 다른 규칙으로 옮겨 가지 않게 한다.
- **K2 시각 칸이 spec 객체를 받는다**: `fill()`과 figure·visual·answerVisual·overview가 `{diagram}`, `{axisPlot}`, `{hbars}`, `{lanes}`, `{units}`, `{bar}`, `{sankey}`, `{mock}` 같은 객체를 받아 kit이 SVG·칸을 만들고 부품을 부른다.
  - 부품 등록표 `LTT.visuals[name]`로 보내 모듈 불러오기 순서를 지킨다. 키가 하나가 아니거나 모르는 키면 오류(lint에도 같은 검사).
  - `answerVisual`도 `fill`을 거치게 한다(지금은 우회). spec은 동기로 그린다(측정 계약).
  - 부품 API는 `node.__lttPart`에 두고 `steps[].enter(k, api)`로 넘긴다. 선언형 단계 `{hot, flow, send, show}`는 kit이 멱등 `enter`로 만든다.
  - `LTT.diagram`도 컨테이너를 받는다. 수업마다 다시 만들던 "SVG 만들기" 도우미가 사라진다.
- **K3 `type: "sweep"` 장면**: `{params, goal, readout(values), figure, presets}`만 적으면 kit이 손잡이·목표 띠·읽기값·그림을 배치. `mount` + innerHTML + `LTT.$` 조합을 대체. 손잡이는 `p.control`로 붙여 장면 간 id 충돌을 피한다. `LTT.sceneTypes` entry(메타 필드 명시)와 `internals.md` entry 수를 고친다. audit 목표 표본 검사가 생성된 sweep을 찾는지 확인한다.
- **K4 `axisPlot` 덧그림**: log 축, `marks: [{rule}, {band}, {point}, {label}, {arrow}]`(단계별 `step` 필드), x축을 공유하는 여러 패널.
- **K5 시간축·수직선 부품**: `LTT.timeline`(점 사건·구간·세로 표식·log 눈금·`upto` 단계 재생). 한 줄이면 수직선으로도 쓴다.
- **K6 데이터·노드 기준 번호 주석 + overview 자동 번호**: `points[].at`이 `{node: id}`, 데이터 좌표를 받고, overview가 앞 takeaway를 번호로 모은다.
- **K7 용어 그림 glyph**: terms `visual: {glyph: [box, {arrow, l}, box]}` 같은 작은 도식.
- **K8 kit 스타일 고침**: 각주·표 머리줄 저대비, compare table 판정 열이 공개 전 비어 보임, 장면별 좌측 여백 차이.

새 부품마다 kit 테스트, 부품 문서 한 줄, catalog 데모 하나를 넣는다(PROJECT.md "kit와 gallery는 만들 때 테스트한다"). 기존 gallery 수업은 다시 쓰지 않는다(SKILL.md가 더는 gallery를 읽게 하지 않는다). gallery audit 기준선(전부 0)은 유지해야 한다.

## 결정 (2026-10-19 사용자 답)

- 검토 서브에이전트 1개 유지(outline만 읽는 사실·기대값·outline 수준 독자 검토). 독자·눈 검토 서브에이전트는 없앤다.
- audit 통과: "고침" 0 + "권고"는 3회 안에서 고치고 남으면 `result.md`에 기록.
- kit 범위: K1–K8 전부. K4–K7 순서는 측정 1차로 정한다.
- kit·audit 코드 변경은 workflow-approach로 한다(run마다 spec 승인, 독립 구현·테스트, verifier ≤ 2, mutation). 문서·흐름 변경과 측정 스크립트는 workflow 대상이 아니다(문서 편집·개발용 도구).
- 서브에이전트 운용: 작업·분석(탐색, workflow의 implementer·test-implementer·test-verifier·mutant-triager 포함)은 `model: opus`, `effort: low`. skill 사용 테스트는 sonnet-5.5 + effort medium.

기본값(바꾸려면 말해 주면 된다):
- skill 안 검토 서브에이전트의 모델은 지정하지 않는다(부모 모델 상속). 사실 검토 품질이 생성 모델 수준이어야 하기 때문이다.
- gallery 수업은 다시 쓰지 않는다. 새 부품은 catalog 데모 하나씩만 넣는다.

## 단계와 순서

workflow-approach는 active spec을 한 번에 하나만 두므로 코드 run은 차례로 한다. run마다 이해 확인과 brief 승인을 사용자에게 받는다. verifier 예산(2회)을 넘기면 그 run은 `limit` handoff로 닫고 다음 단계로 갈지 묻는다.

| 단계 | 내용 | 방식 | 게이트 |
| --- | --- | --- | --- |
| 0 측정 도구 | `scripts/transcript-cost.mjs`(main + subagents transcript → 호출 수, 최대 context, 누적 cache read, 가중 토큰, 출력 글자, PNG Read, 도구별 시간, 벽시계; 저장소에 남긴다) | 직접 | 완료 |
| 1 흐름·검증·문서 | §1–3. "고침"/"권고"는 이 단계에서 문서의 규칙 id 목록으로 정한다(코드 변경 전에도 동작). 문서 고정 테스트 갱신, 크기 상한 테스트 추가 | 직접 | `npm test` |
| 2 측정 1차 | 새 흐름으로 1회 | 직접 | 완료 |
| 3 WF run A: kit 측정·판정 | K1(1안), A2(규칙 `severity`, `zoomLock`이 `{z, by}`, `graphOverlaps` id 보존, `sceneText`로 긴 글 필드, 필드를 가리키는 메시지), 새 자동 규칙, `?audit` 전용 덱 `go` 훅 | workflow | `npm test`, gallery audit 기준선을 다시 만들고 의도한 변화만인지 확인 |
| 4 WF run B: audit CLI | CDP·contact sheet·출력 형식(lint·expect 한 번, 첫 줄 바이트·장면 수, `--legacy`) | workflow | audit 1회 시간, `tests/server.test.mjs` |
| 5 WF run C: 선언형 칸 | K2 + K3 + API.md·부품 문서·catalog 데모 | workflow | `npm test`, gallery audit 0 |
| 6 WF run D: 부품 | K4–K8 + 문서·데모 | workflow | `npm test`, gallery audit 0 |
| 7 측정 2차 | 새 skill·기준선으로 측정 | 직접 | 목표치 판정 |

## 바뀌는 파일 (대표)

- 흐름·문서: `skills/learn-to-tell/SKILL.md`, `kit/API.md`, `kit/api/*.md`(+`rules.md`), `standalone.md`, 새 `map/import.md`, `learn-to-tell-PROJECT.md`(검증·자료 절), `README.md`(검증 장치 절).
- audit: `skills/learn-to-tell/server/audit.mjs`, `kit/ltt-deck.js`(`measure`, `zoomLock` 결과 보존, contact sheet용 장면 이동), `kit/ltt.js`(`auditScene`·`lintDeck` 메시지·심각도·새 규칙).
- kit: `kit/ltt-deck.js`(`fit`, sweep 장면, spec 칸), `kit/ltt-ui.js`(`fill`), `kit/ltt-parts.js`(diagram 컨테이너, axisPlot marks, timeline, glyph), `kit/ltt-*.css` → `npm run build:css`, `kit/CHANGELOG.md`, `site/gallery/catalog.html`.
- 테스트: `tests/api-docs.test.mjs`, `tests/map/skill.test.mjs`, `tests/release-docs.test.mjs`, `tests/kit.test.mjs`, `tests/scene-types.test.mjs`, `tests/placement.test.mjs`, `tests/server.test.mjs`, `tests/gallery-audit.test.mjs`.
- 기록: 끝나면 `b41cd6ae…`(Next Step 4 tier 결정이 이 작업으로 정리됨)와 `418133af…`를 stale로 옮긴다. 이 계획이 든 `agent-docs/plans/`는 폴더째 지운다.

재사용: `LTT.sceneText`(lint의 글 추출), `LTT.contrast`(대비 규칙), `LTT.rectHit`(겹침 규칙), `LTT.graphOverlaps`(겹친 id), `createLttServer`(audit 내장 서버), diagram `player`의 `hot`·`flow`·`send`(선언형 단계).

## 검증 (end-to-end)

- 단위·회귀: `npm test`. `LTT_AUDIT=1 npm test`로 gallery audit 기준선(0) 유지. `npm run check:css`.
- 실제 사용 테스트: `claude -p --model sonnet --effort medium`을 빈 scratch 디렉터리에서 `--plugin-dir <repo>`, `LTT_HOME=<scratch>/home`으로 실행한다. 최상위 세션이라 검토 서브에이전트를 스스로 띄울 수 있어 실제 fork 세션과 같은 조건이다. 진단 결과를 프롬프트로 주고 §1·§4 대화는 뺀다. 기준선은 같은 명령에서 skill 없이 "학습 자료를 만들어 달라". 도구 허용은 `--allowedTools`로 좁힌다.
- 측정: `scripts/transcript-cost.mjs`로 두 transcript를 같은 정의로 잰다.
- 품질 확인: 사용자가 contact sheet와 수업을 직접 본다. 판정: audit "고침"·lint·expect 0, 검토의 사실 지적 반영 완료.
- 단계마다: 문서·kit을 바꾸면 `npm test`, kit을 바꾸면 `LTT_AUDIT=1`로 gallery audit, CSS를 바꾸면 `npm run build:css` 뒤 `npm run check:css`.
