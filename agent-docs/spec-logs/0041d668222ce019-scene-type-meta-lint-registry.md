---
version: 4
run_id: 0041d668222ce019
status: complete
base_commit: 00bba01eb75fd0525f3c490063124c26cd516780
max_verifier_invocations: 2
handoff: none
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | kit 개발자 | 라이브러리는 계속 개발하며 확장 가능해야 하고 유지보수 가능한 아키텍처를 가진다 (intent 2, refactoring-4 1번) | 장면 타입의 성질이 `LTT.sceneTypes` 표 하나에 있고, 새 타입은 표 항목 하나와 render 함수 하나로 추가된다 |
| UI-2 | kit 개발자 | lint 규칙을 하나씩 테스트하고 더할 수 있다 (refactoring-4 5번) | `lintDeck`이 내부 규칙 레지스트리로 돌고, 규칙 17종 각각에 단위 테스트가 있다 |
| UI-3 | kit 개발자 | 새 타입·부품을 쓸 때 덱 핸들러 계약을 코드를 읽지 않고 안다 (refactoring-4 2번) | `kit/api/internals.md`에 ctx 프로토콜과 측정 모드 규칙이 있고 각 문장이 코드와 맞는다 |
| UI-4 | 사용자, 수업 작가 | 작가 계약 변경이 기록되고 버전으로 구분된다 (refactoring-4 7번) | `kit/CHANGELOG.md` 0.2.0, 두 매니페스트 version 0.2.0 |
| UI-5 | 사용자 | 리팩터링이 기존 수업을 바꾸지 않는다 | 갤러리 13편 × 1440×900·1280×800의 DOM·audit·lint가 기준 커밋과 같다 |

# Scope
In scope:
- `skills/learn-to-tell/kit/ltt.js`: `LTT.sceneTypes` 메타 표(아래 Signatures)를 두고, `VISUAL_TYPES`·`AUDIT_SKIP`·`isCardGrid`·`isSignature`의 타입별 분기와 `lintDeck`의 no-title·card-monotony 타입 분기, `auditScene`의 hero·loose-figure 타입 분기가 표를 읽게 한다. `lintDeck`을 내부 `RULES` 레지스트리로 바꾼다.
- `skills/learn-to-tell/kit/ltt-deck.js`: `TYPES`의 그리기 함수를 `LTT.sceneTypes[type].render`로 붙이고 `LTT.deckTypes`가 같은 객체를 가리키게 한다. `SPLIT_OFF`·`NO_HEAD`, mount의 full 기본값·points 대상, `measure`의 compare 합산이 표를 읽게 한다.
- `skills/learn-to-tell/kit/api/internals.md`: `LTT.sceneTypes` 행, `LTT.deckTypes` 행 수정, 메타 필드 표, ctx 프로토콜, 측정 모드 규칙, lint 규칙 추가 방법.
- `skills/learn-to-tell/kit/CHANGELOG.md` 새로 만들기, `.claude-plugin/plugin.json`·`packages/ltt-kit/package.json` version 0.2.0, `packages/ltt-kit/package.json` `files`에 `CHANGELOG.md`, README "릴리스"에 한 문장.
- 종료 시(main): refactoring-4 handoff의 State·Next Step 갱신(1·2·5·7 완료와 증거), Open Questions에 overview hero 관찰 한 줄, Execution Ledger 추가. handoff는 열어 둔다.

Out of scope: 핸들러의 측정 로직 분리(probe·measureAll·widen·under·lockZoom, refactoring-4 3번), 갤러리 그림 폭 vw 규칙(4번), 회귀 기준 정비(6번), `auditScene` 임계값 변경, 모바일 분기 변경(ADR dbd5ddb9b247aa15), 새 작가용 API, `kit/API.md`·`kit/api/deck-contracts.md` 수정, 갤러리 페이지 수정, overview의 audit hero 불일치 수정, 릴리스·push·커밋.

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/api/internals.md, skills/learn-to-tell/kit/CHANGELOG.md, .claude-plugin/plugin.json, packages/ltt-kit/package.json, README.md
Tests: tests/scene-types.test.mjs, tests/lint-rules.test.mjs, tests/release-docs.test.mjs, tests/api-docs.test.mjs
Test command: npm test
Review evidence: R-1 갤러리 동작 불변 대조, R-2 공개 이름 대조, R-3 타입 이름 잔여 위치 검토, R-4 internals.md 문서 대조, R-5 덱 기본값 경로 fixture 대조 (아래 Verification Obligations). 산출물은 `agent-docs/spec-logs/0041d668222ce019-*`와 이 spec의 Execution ledger.
Fuzzing: differential random testing. 도구: node 스크립트 `agent-docs/spec-logs/0041d668222ce019-lint-diff-fuzz.mjs`(main 작성·실행, npm test 밖). 표면: `LTT.lintDeck(spec)`, `LTT.auditScene(m)`. oracle: 기준 커밋 `ltt.js`(`git show 00bba01:skills/learn-to-tell/kit/ltt.js`)와 작업 트리 `ltt.js`를 각자 새 vm context에 불러 같은 입력의 출력 JSON이 같다(둘 다 throw하면 일치로 센다, 한쪽만 throw하면 위반). seed 20261019(mulberry32). budget: lintDeck 20,000개 spec, auditScene 20,000개 측정값. 위반 0이고, E-4를 관찰하려면 양쪽 throw가 1건 이상 나와야 한다(망가진 입력 분할). 생성기는 Cases 아래 "fuzz 생성기"에 적은 분포를 따른다.
Mutation tool: none — JS 변이 도구(Stryker)가 설치되어 있지 않고(`npx --no-install stryker --version` 실패), 전역 설치는 금지다. 대신 hand mutation HM-1..HM-10을 둔다.

# Signatures
`LTT.sceneTypes` (ltt.js, 공개 이름, `Object.create(null)`로 만든 표): `{ <type>: entry }`. 타입 12개: `hook, explain, terms, compare, figure, overview, statement, contrast, predict, summary, keywords, map-related`.

entry 필드(ltt.js가 불러올 때 모든 entry에 13개 메타 필드가 own property로 채워진다. 표에 없는 타입·타입 없는 장면·entry에 없는 필드는 "기본"을 쓴다):
| 필드 | 형 | 뜻 | 기본 | 기본이 아닌 타입 |
| --- | --- | --- | --- | --- |
| `head` | boolean | 장면 머리(번호·kicker·title·chips·sub)를 그린다 | true | false: hook, statement |
| `autoSplit` | boolean | `layout`이 없을 때 narration·points가 있으면 split | true | false: map-related, hook, keywords, summary, terms, contrast, predict, figure, overview, statement |
| `fullByDefault` | boolean | `layout`이 없으면 full | false | true: figure, overview |
| `pointsOnMock` | boolean | `pointsOn`이 없을 때 points 대상으로 본문의 첫 목업(`.ltt-phone,.ltt-browser,.ltt-term-mock,.ltt-code`)을 먼저 찾는다 | false | true: figure, overview |
| `sumVisualAreas` | boolean | audit 측정에서 가장 큰 그림 넓이를 `.dk-item .vis` 넓이 합과 비교해 큰 쪽을 쓴다 | false | true: compare |
| `needsReadingGuide` | boolean | lint `no-reading-guide` 대상 | false | true: compare, contrast, figure, overview |
| `titleOptional` | boolean | lint `no-title` 면제 | false | true: hook, keywords, summary |
| `bookend` | boolean | lint `card-monotony` 셈(연속·비율 분모)에서 빠진다 | false | true: hook, keywords |
| `cardGrid` | `false` 또는 `function(s, scenes) → boolean` | lint `card-monotony`의 카드 격자 장면 | false | explain: `!s.form \|\| s.form === "cards"`; compare: `s.form !== "table"`; summary: `summaryCards(s, scenes \|\| [])` 중 `recall`이 있는 카드가 없음; terms: 항상 true |
| `signature` | boolean | lint `no-signature`의 그림 주인공 장면 | false | true: figure, contrast |
| `auditHero` | boolean | audit `small-visual` 22% 기준과 `empty-stage` 판정 | false | true: figure |
| `auditSmallVisual` | boolean | audit `small-visual`을 판정한다 | true | false: hook, terms, summary, keywords, statement, predict |
| `auditLooseFigure` | boolean | audit `loose-figure`를 판정한다 | false | true: figure |
| `render` | `function(s, body, ctx) → {enter?}` | ltt-deck.js가 불러올 때 붙인다 | (없음) | 12개 전부 |

타입 이름과 무관한 판정은 지금처럼 코드에 남는다: 타입 없는 장면(`!s.type`)의 `mount`는 `needsReadingGuide`·`signature`와 같은 효과, `layout === "full"`은 `signature`·`auditHero`와 같은 효과, 작가가 적은 `layout`은 `fullByDefault`·`autoSplit`보다 우선.

`LTT.deckTypes` (ltt-deck.js): `LTT.deckTypes === LTT.sceneTypes`.

`LTT.lintDeck(spec) → [{scene, rule, msg}]`: 시그니처 불변. 내부 레지스트리 `RULES`(ltt.js 지역 변수, 공개 이름 아님): 각 항목 `{ id: string, scene?: function(s, i, c) → [[i, rule, msg]…], deck?: function(c) → [[sceneIndexOr-1, rule, msg]…] }` 중 `scene` 또는 `deck` 하나. `c` = 덱마다 한 번 만드는 공용 값 `{spec, scenes, glossary, first}`. `lintDeck`은 장면마다(장면 순서) `scene` 규칙을 등록 순서로 돌린 뒤, `deck` 규칙을 등록 순서로 돌린다. 출력 형식과 순서는 FR-6.

`LTT.auditScene(m) → [{rule, msg}]`: 시그니처 불변. `m.type`으로 표를 찾는다(`""`·없는 타입은 기본).

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | ltt.js만 불러도 `LTT.sceneTypes`가 있고 12개 타입 entry가 Signatures 표의 13개 메타 필드 값을 그대로 가진다. 표 자체는 프로토타입이 없다(`"constructor"`·`"toString"` 같은 이름은 표에 없는 타입이다) | must | 사용자 답변 1(B), handoff 1번 |
| FR-2 | 메타를 읽는 모든 곳은 entry가 없거나 필드가 없으면 그 필드의 기본값을 쓴다. 그래서 실행 중에 일부 필드만 가진 entry를 더해도 lint·audit에 반영된다 | must | UI-1 |
| FR-3 | ltt-deck.js를 불러오면 12개 타입 entry에 `render` 함수가 붙고 `LTT.deckTypes === LTT.sceneTypes`다. overview의 render는 figure의 render를 불러 그린다(같은 함수 객체가 아니다: `label` 기본값 "한 장 정리."를 넘기는 별도 함수이며, 그 동작 증거는 R-1) | must | 사용자 결정 |
| FR-4 | 덱(mount·measure)은 `head`·`autoSplit`·`fullByDefault`·`pointsOnMock`·`sumVisualAreas`를 표에서 읽고, lint는 `needsReadingGuide`·`titleOptional`·`bookend`·`cardGrid`·`signature`를, `auditScene`은 `auditHero`·`auditSmallVisual`·`auditLooseFigure`를 읽는다. `SPLIT_OFF`·`NO_HEAD`·`VISUAL_TYPES`·`AUDIT_SKIP`는 없어지고 위 성질을 정하는 타입 이름 비교도 남지 않는다 | must | 사용자 답변 1(B) |
| FR-5 | terms·summary·overview·predict·keywords 고유 내용 규칙(아래 lint 규칙 표의 R1–R4, R6, R13–R15)과 figure 캡션 번호(figure 장면만 센다), terms 장면의 glossary 등록(`lintDeck`·`deck()`)과 첫 정의 위치(`termIndex`), summary의 recall 분기, 장면 머리 안의 `s.type !== "statement"` 검사(statement는 `head: false`라 닿지 않는 기존 코드, 구현 지시로 유지), 덱이 스스로 붙이는 `map-related` 장면(`addScene`)과 render 표의 타입 키는 타입 이름을 그대로 쓴다 | must | 사용자 답변 1 |
| FR-6 | `lintDeck`은 `RULES` 레지스트리로 돈다. 기준 커밋의 `lintDeck`과 같은 입력에서 출력 배열(각 원소의 `scene`·`rule`·`msg`와 순서)이 같다. 기준이 throw하는 입력은 새 코드도 throw한다. 레지스트리는 공개 이름이 아니다 | must | handoff 5번, 사용자 결정 |
| FR-7 | `auditScene`은 기준 커밋과 같은 입력에서 같은 출력 배열을 낸다 | must | 사용자 결정(임계값 불변) |
| FR-8 | 갤러리 13편 × 두 크기의 `?audit` DOM(정규화 후), `#ltt-audit`의 `audit`·`lint` 배열이 기준 커밋과 같고 `tests/gallery-audit.baseline.json`은 바이트 단위로 같다 | must | 사용자 결정 |
| FR-9 | `kit/api/internals.md`: 첫 줄 불변, `LTT.sceneTypes` 정의 행 1개, `LTT.deckTypes` 행을 "`LTT.sceneTypes`와 같은 객체"로 수정, 메타 필드 표(13개 필드 + `render`, 형·기본·기본이 아닌 타입), ctx 프로토콜 절(Signatures 아래 "ctx 계약"의 항목), 측정 모드 절, lint 규칙 추가 절(scene/deck 단계와 등록 순서가 출력 순서임). 코드로 복원할 수 없는 계약만 적는다 | must | handoff 2번 |
| FR-10 | `kit/CHANGELOG.md`가 있고 `## 0.2.0` 항목에 "CHANGELOG 항목" 목록을 담는다. 두 매니페스트 version이 `0.2.0`이고 `npm run check:version`이 통과한다. `packages/ltt-kit/package.json` `files`에 `"CHANGELOG.md"`. README "### 릴리스" 절에 `kit/CHANGELOG.md`를 언급하는 문장 하나 | must | handoff 7번, 사용자 답변 3 |
| FR-11 | 공개 이름은 기준 73개에 `sceneTypes` 하나만 더해진다 | must | 사용자 결정(새 작가 API 없음) |

ctx 계약 (FR-9가 문서화할 항목, 기준 커밋 코드에서 main이 확인함; 문서는 이 의미를 바꾸지 않는다):
- 받는 것: `el`(장면 `section`, `el.firstChild`가 배율을 받는 안쪽 상자), `scene`, `index`(0부터), `scenes`(덱의 장면 배열, 지도 장면이 뒤에 붙을 수 있다), `predictRest`(덱 spec 값). 타입 render와 장면의 `mount(body, ctx)`는 같은 ctx를 받는다.
- 그리는 동안 부를 수 있는 것: `refit()` → 현재 `zmax` 아래에서 배율을 맞추고 그 배율을 돌려준다. `float(panel, host, skip, keepFaded)` → 빈자리에 띄우면 true, 아니면 흐름에 붙이고 false.
- 그린 뒤에만 생기는 것: `fit()`. render·mount가 돌아온 뒤에 붙으므로 render 안에서 바로 부르지 않고 이벤트·비동기 콜백에서 부른다. 데스크톱에서는 `place`가 있으면 그것을, 없으면 기본 배율 맞춤을 하고, 폰에서는 `unplace` 후 폰 재배치를 한다.
- 걸 수 있는 것: `gate {btn, alt?, word}`(공개 전 다음 이동을 한 번 막는다; `alt`가 있고 `btn`이 켜져 있으면 다음 이동이 `btn`을 누른다; 공개 뒤 `null`), `place()`(데스크톱 배치·배율을 스스로 맡는다. 진입·창 크기·글꼴 로드·`?audit`마다 반복해 불린다), `unplace()`(폰으로 갈 때 `place`가 남긴 인라인 상태를 되돌린다), `back`(← 키가 이전 장면 대신 부른다), `zmax`(배율 상한).
- 돌려주는 것: 타입 render는 `{enter}`. `enter`는 방문할 때마다 `fit()` 전에 불린다. `leave`는 장면 `mount`가 돌려준 것만 쓰이고 render가 돌려준 `leave`는 쓰이지 않는다. `?audit`은 모든 장면을 mount하고 `fit()`을 부른 뒤 잰다. 방문하지 않은 장면은 `enter` 없이 `fit()`만 불리므로 `place`는 `enter` 전에도 동작해야 한다.
- 측정 모드: `LTT.measure(fn)` 안에서는 diagram·sequence·map의 `send`와 단계 반복 send가 아무것도 하지 않는다. `LTT.record`는 꺼지지 않는다. `.dk-still`이 붙은 상자 안은 CSS transition이 꺼진다. figure `steps`의 `enter`는 모든 단계에 대해 미리 불리므로 멱등이어야 한다. predict 함수형 `answerVisual`은 선택지마다(인자가 하나면 한 번) 미리 불리므로 같은 입력이면 같은 크기를 내고 동기로 그려야 하며 전역 상태·기록을 건드리지 않는다.

lint 규칙 (FR-6의 순서 근거; `glossary` = `spec.glossary` 키(삽입 순) 뒤에 terms 장면 key를 더한 것, `first` = `LTT.termIndex(spec)`, `text` = `LTT.sceneText(s)`, `plain` = text에서 `{{…}}` 표시를 지운 것):
| 순서 | 단계 | 규칙 | 경고 조건 (장면 번호 = i+1, 덱 경고는 0) |
| --- | --- | --- | --- |
| R1 | scene | `unknown-term` | `s.type !== "terms"`이고 text의 표시 `{{k}}`(나온 순서, 중복 포함)의 k가 glossary에 없다 |
| R2 | scene | `unknown-term`, `term-no-visual` | `s.type === "terms"`, `s.terms`의 항목마다 차례로: `plain` 없음 → `unknown-term`, 이어서 `visual === undefined` → `term-no-visual` |
| R3 | scene | `summary-no-recall` | `s.type === "summary"`, `summaryCards(s, scenes)`의 카드마다 `recall`이 없다 |
| R4 | scene | `overview-no-visual` | `s.type === "overview"`이고 `figure`가 없다 |
| R5 | scene | `used-before-defined` | glossary 키마다(순서대로) plain에 키 문자열이 있고 `first[key]`가 없거나 i보다 크다 |
| R6 | scene | `predict-new-term` | `s.type === "predict"`, `{title, sub, question, hint, choices}`의 표시 중 `first`가 i인 키, 키마다 한 번 |
| R7 | scene | `no-reading-guide` | (`needsReadingGuide` 또는 `!s.type && s.mount`)이고 `narration`·`points`·`sub`·`caption`·`before.points`가 모두 없다 |
| R8 | scene | `no-title` | `titleOptional`이 아니고 `title`이 없다 |
| R9 | scene | `filler-content` | plain에 채움 글(lorem, TODO, TBD, xxx, 더미 텍스트, 샘플 텍스트, 임시 텍스트, Item A–D, 항목 n 등)이 있다. 첫 일치 하나 |
| R10 | deck | `card-monotony` | `bookend`가 아닌 장면을 순서대로 세며 `cardGrid`면 연속 수+1, 아니면 0; 연속 수가 정확히 3이 되는 장면에 경고(장면 번호). 이어서 센 장면 ≥ 4이고 카드 장면/센 장면 > 0.5면 덱 경고 |
| R11 | deck | `no-signature` | 장면이 있고 어느 장면도 `signature`·`layout === "full"`·`!s.type && s.mount`가 아니다 |
| R12 | deck | `no-theme` / `unknown-theme` | `theme`이 없다 / 없는 테마 이름 |
| R13 | deck | `keywords-last` | 마지막 장면이 없거나 keywords가 아니다 |
| R14 | deck | `overview-missing` | summary가 있는데 overview가 없다 |
| R15 | deck | `overview-order` | overview가 있을 때만: 첫 overview 위치 ov가 마지막 summary보다 앞이거나 끝에서 두 번째가 아니다(장면 번호 ov+1). overview가 없으면 판정하지 않는다(summary가 없어도 ov 위치만 본다) |
| R16 | deck | `unused-term` | glossary 키 중 `first`에 없는 것마다 |

CHANGELOG 항목 (FR-10, `## 0.2.0`에 한 줄씩, 작가 계약과 kit 개발자용으로 나눠도 된다): figure `steps`의 `enter` 멱등, predict `answerVisual` 순수·동기, predict `rest`(`hide`·`dim`·`dot`)와 덱 `predictRest`, 고른 선택지에서 다음 이동이 정답을 연다(auto-reveal), 펼친 정답·단계 자막이 빈자리에 놓인다, audit 규칙 `panel-overlap`, `<script id="ltt-audit">` JSON과 `server/audit.mjs`, API 문서가 `kit/API.md` + `kit/api/*.md`로 나뉨, 장면 타입 메타 표 `LTT.sceneTypes`(`LTT.deckTypes`가 같은 표), lint 규칙 레지스트리.

# Errors
- E-1: ltt-deck.js가 그리기 함수를 붙일 타입의 entry가 `LTT.sceneTypes`에 없다 — ltt-deck.js를 불러오는 중 `Error`를 던지고 메시지에 그 타입 이름이 있다 — 그 로드는 `LTT.deck`을 정의하지 않는다.
- E-2: ltt.js 없이(또는 `LTT.sceneTypes` 없는 옛 ltt.js로) ltt-deck.js를 불러온다 — 기존 첫 줄 검사와 같은 `Error`("ltt-deck.js needs ltt.js, ltt-parts.js and ltt-ui.js loaded first") — `LTT.deck` 미정의.
- E-3: 표에 없는 타입, 타입 없는 장면, 프로토타입 이름 타입 — 오류가 아니다. 모든 필드에 기본값을 쓰고, 덱은 그 장면을 render 없이(`{}`) 그린다 — 경고는 lint 규칙대로만 나온다.
- E-4: lintDeck에 기준 커밋이 throw하는 입력 — 새 코드도 throw한다(메시지는 비교하지 않는다).

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 갤러리 13편 × 1440×900·1280×800, `?audit` | DOM(정규화)·`audit`·`lint` 배열이 기준 스냅숏과 같다. lint는 26회 모두 빈 배열 |
| C-2 | normal | ltt.js만 vm에 로드 | 12개 entry의 13개 필드가 Signatures 표와 같다 |
| C-3 | normal | 6개 kit 파일을 vm에 차례로 로드 | 12개 entry 모두 `render` 함수, `LTT.deckTypes === LTT.sceneTypes`, 공개 이름 = 기준 73개 + `sceneTypes` |
| C-4 | boundary | card-monotony: 카드 장면 연속 2 / 3 / 4 / 3·비카드·3 | 경고 0 / 3번째에 1 / 3번째에만 1 / 두 묶음 각 3번째에 1씩 |
| C-5 | boundary | card-monotony 비율: 센 장면 4 중 카드 2 / 3, 센 장면 3 중 카드 3, hook·keywords를 더해도 분모 불변 | 덱 경고 없음 / 있음 / 없음(연속 경고만) / 분모에 안 들어감 |
| C-6 | boundary | cardGrid 변형: explain form 없음·`cards`·`strip`·`stack`, compare form 없음·`table`, summary recall 있음·없음, terms | 카드 / 카드 / 아님 / 아님, 카드 / 아님, 아님 / 카드, 카드 |
| C-7 | edge | 타입 없는 장면 + `mount` / `mount` 없음 | `signature`·`needsReadingGuide` 효과 있음 / 없음 |
| C-8 | edge | 표에 없는 타입 `"foo"`, `"constructor"` | 제목 필수, 카드 아님, 그림 주인공 아님, reading guide 대상 아님, audit small-visual 판정함(10% 기준), loose-figure 판정 안 함 |
| C-9 | boundary | auditScene small-visual: hero(figure 또는 `layout: "full"`) 0.2199 / 0.22, 일반 0.0999 / 0.1, `compact: true`, `auditSmallVisual: false`인 6개 타입 | 경고 / 없음, 경고 / 없음, 판정 안 함, 판정 안 함 |
| C-10 | boundary | loose-figure: figure 0.349 / 0.35, overview 0.1; empty-stage: hero fill 0.599 / 0.6, 일반 0.1 | 경고 / 없음, 없음; 경고 / 없음, 없음 |
| C-11 | edge | overview, `layout` 없음, visualRatio 0.15, fill 0.3 | small-visual 없음(일반 기준), empty-stage 없음 (관찰 그대로 보존) |
| C-12 | normal | 여러 규칙이 함께 걸리는 덱(2개 장면 + 덱 경고) | 경고 순서가 장면 순 → 장면 안 R1..R9 순 → 덱 R10..R16 순 |
| C-13 | error | ltt.js 로드 후 `delete LTT.sceneTypes.keywords`, 이어서 parts·ui·deck 로드 | 불러오는 중 Error, 메시지에 `keywords`, `LTT.deck` 미정의 |
| C-14 | error | ltt.js 없이 ltt-deck.js만 로드 | E-2 Error |
| C-15 | edge | 실행 중 `LTT.sceneTypes.timeline = {needsReadingGuide: true, titleOptional: true, cardGrid: () => true, auditSmallVisual: false}` | timeline 장면: guide 없으면 `no-reading-guide`, 제목 없어도 `no-title` 없음, 카드 장면으로 셈, audit small-visual 판정 안 함, 나머지 필드는 기본 |
| C-16 | normal | 두 매니페스트, package `files`, CHANGELOG, README 릴리스 | 0.2.0 둘 다, `files`에 CHANGELOG.md, `## 0.2.0`과 CHANGELOG 항목들, README 릴리스 절에 `kit/CHANGELOG.md`, `node scripts/build.mjs version` 종료 코드 0 |
| C-17 | edge | 실행 중 빈 entry `LTT.sceneTypes.foo = {}`, `LTT.sceneTypes.bar = {needsReadingGuide: true}` (`cardGrid` 없음) | foo·bar 장면: 제목 없으면 `no-title`, 카드 셈에서 throw 없이 카드 아님, audit small-visual을 10% 기준으로 판정(0.05 경고, 0.15 없음); bar는 guide 없으면 `no-reading-guide` |
| C-18 | edge | 변성 관계 MR-1: 타입 `"foo"`를 쓰는 VO-4·VO-6 입력 전부에 대해 `LTT.sceneTypes.foo = {}`를 더하기 전과 뒤 | lintDeck·auditScene 출력이 같다 |
| C-19 | edge | 변성 관계 MR-2: 내장 타입 T의 13개 메타 필드만 복사한 entry `copy`. audit: T ∈ 12개 타입 전부, VO-6의 측정값 변형 전부에서 `type: "copy"`와 `type: T`. lint: T ∈ {hook, explain, terms, compare, figure, statement, contrast, predict, map-related}, 덱 `[figure(제목·caption 있음), {type: X}, {type: X}, {type: X}, keywords]`(X 장면에는 다른 필드 없음; `form` 변형 없음·`"table"`도 함께) | 출력이 같다(X = T일 때와 X = copy일 때) |
| C-20 | edge | R-5 fixture: 타입 없는 mount 장면(narration·points 있음/없음), 표에 없는 타입 `"foo"` 장면(narration·points), 실행 중 빈 entry `timeline` 장면 | 기준 커밋과 작업 트리의 `?audit` DOM이 정규화 후 같고, `timeline` 장면 DOM은 `"foo"` 장면과 같다(머리 있음, split, render 없음) |

fuzz 생성기 (main, seed 20261019, mulberry32):
- lintDeck spec: 장면 0–9개, 타입은 12개 + `undefined` + `""` + `"foo"` 중 고르게; 필드는 각각 확률 0.5로(`cards`만 0.3): `title`, `sub`, `narration`, `points`, `caption`, `before: {points}`, `mount`(함수), `layout`(`full`·`split`·`stack`), `form`(`cards`·`strip`·`stack`·`table`), `takeaway`, `recall`, `figure`, `cards`(0–3개, text·recall 섞음), `terms`(terms 장면은 항상, 다른 장면은 0.1: key·plain·visual 섞음, visual은 `undefined`·`false`·문자열), `question`·`hint`·`choices`; 글 필드에는 glossary 후보 키 5개의 `{{k}}`·`{{보임|k}}`·맨 키 문자열과 채움 글 후보(`TODO`, `항목 1`, `placeholder`, `lorem`, `샘플 텍스트`)를 섞는다; 망가진 입력 분할(spec마다 확률 0.1, 하나를 고름): 장면 자리에 `null`, 장면 자리에 숫자, terms 장면의 `terms`가 문자열, `cards`가 문자열, `choices`가 문자열, `glossary`가 `null`; `glossary` 0–4개 키; `theme`은 없음·실제 테마·`"nope"`. 20,000개.
- auditScene m: `type` 같은 집합, `layout` `""`·`full`·`split`, `compact` bool, `zoom` {0.7, 0.879, 0.88, 1}, `visualRatio` {null, 0.05, 0.0999, 0.1, 0.15, 0.2199, 0.22, 0.5}, `figRatio` {null, 0.2, 0.349, 0.35, 0.8}, `fill` {null, 0.3, 0.599, 0.6, 0.9}, `fontSizes` 5–9, `hscroll` {0, 12}, `overflow` bool, `panelOverlap` {0, 2}, `graphOverlaps` {0, 1}, `goals` 0–2개(hits 0–3, samples 10, start bool). 20,000개.

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | lint·audit·덱 배치 결과가 기준과 같아야 한다(정확성) |
| Performance efficiency | no | lintDeck은 덱마다 한 번, 표 조회는 상수 시간. 측정 로직은 이번 범위 밖 |
| Compatibility | yes | 기존 수업(갤러리, CDN 고정 standalone)이 같은 화면을 내고 공개 이름이 유지된다(공존·상호운용) |
| Interaction capability | no | 화면·조작 변경 없음. 동작 불변은 Compatibility와 FR-8로 본다 |
| Reliability | no | 새 실패 경로는 개발자 실수(E-1·E-2)뿐이고 Errors로 다룬다 |
| Security | no | 입력·권한·네트워크 표면 변화 없음 |
| Maintainability | yes | 이번 작업의 목적(수정 용이성, 시험 용이성, 분석 용이성) |
| Flexibility | no | 설치·이식 변화 없음. version 일치는 FR-10과 기존 `check:version`이 본다 |
| Safety | no | 해당 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Compatibility / co-existence | 갤러리 13편 × 2크기, 기준 커밋 대비 | R-1: 정규화한 `?audit` DOM 파일 차이 수, `audit`·`lint` 배열 차이 수(실행 26회), baseline.json sha256 | DOM 불일치 0/26(R-1의 반복 덤프 규칙), 배열 차이 0/26, sha256 = `a40956c2…5c5e`(같음) | review R-1; automated: gallery-audit test; mutation HM-9, HM-10 | 사용자 결정 |
| QR-2 | Compatibility / interoperability | vm에서 6개 kit 파일을 불러온 `Object.keys(LTT)` | R-2: 기준 커밋 집합 B(73개)와 새 집합 N 비교, 개수 | B ⊆ N, N − B = {sceneTypes} | review R-2; automated: api-docs C-1·VO-2(74개) | FR-11 |
| QR-3 | Functional suitability / functional correctness | lintDeck·auditScene, 기준 커밋 대비 | differential fuzz: 위반 수 / 실행 수 | 위반 0 / 20,000 + 0 / 20,000, 예산 완주 | fuzz; automated VO-4..VO-6 | FR-6, FR-7 |
| QR-4 | Maintainability / modifiability | ltt.js·ltt-deck.js | R-3: 타입 이름 문자열 비교·타입 키 객체 중 메타 표와 render 정의 밖, 허용 목록(FR-5)에 없는 곳의 수 | 0 | review R-3; automated VO-7 (런타임 entry로 성질 추가) | UI-1 |
| QR-5 | Maintainability / testability | lint 규칙 이름 17종 | 양성·음성 단위 테스트가 모두 있는 규칙 수 / 17 | 17/17 | automated VO-4; mutation HM-3..HM-6 | UI-2 |
| QR-6 | Maintainability / analysability | internals.md ctx·측정 모드 절의 문장 | R-4: 코드 줄과 대조해 맞는 문장 수 / 전체 문장 수 | 100% | review R-4; automated VO-10 (항목 존재) | UI-3 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, C-2 | `LTT.sceneTypes` (ltt.js만 vm 로드) | unit, 모든 칸 | decision table testing (규칙 = 타입, 결과 = 필드 값) | 12 타입 × 13 필드 = 156칸 + 표 키 집합이 정확히 12개 + 표가 프로토타입 없음(`"constructor" in` 거짓) | 100% | 각 boolean 필드 값이 표와 같다. `cardGrid`는 false이거나 함수이고, 함수는 C-6 입력에서 표의 결과를 낸다 | `tests/scene-types.test.mjs` |
| VO-2 | FR-3, FR-11, C-3 | 6개 kit 파일 vm 로드(DOM 없음) | unit | equivalence partitioning | 12 타입의 `render` 함수, `deckTypes === sceneTypes`, 공개 이름에 `sceneTypes` | 100% | 위와 같다 | `tests/scene-types.test.mjs` |
| VO-3 | E-1, E-2, C-13, C-14 | ltt-deck.js 로드 실패 | unit | error guessing | EG-1 entry 하나 삭제, EG-2 ltt.js 없음 | none — experience-based | throw, 메시지(EG-1 타입 이름, EG-2 기존 문구), `LTT.deck` 미정의 | `tests/scene-types.test.mjs` |
| VO-4 | FR-4, FR-5, FR-6, FR-2, QR-5, C-4..C-8 | `LTT.lintDeck` 합성 spec | unit, 규칙마다 최소 spec | equivalence partitioning + 3-value boundary value analysis | 17 규칙 이름 × {걸림, 안 걸림} = 34; BVA: 연속 2·3·4, 두 묶음; 비율 2/4·3/4·3/3; C-6의 9개 변형; titleOptional 3 타입 + explain + "foo" + 타입 없음; needsReadingGuide 4 타입 + statement + 타입 없음 mount 유무; signature figure·contrast·layout full·타입 없음 mount·없음; bookend hook·keywords; prototype 이름 `"constructor"`; summary `cardGrid`가 `scenes`에 의존(자기 `cards` 없는 summary 3장: 앞 장면 takeaway에 recall이 없으면 카드 연속 경고, 있으면 없음) | 100% | 각 입력에서 기대 `rule`·`scene`이 나오고(또는 안 나오고), 다른 규칙 경고와 섞이지 않게 `theme`·keywords 등 다른 조건은 만족시킨다 | `tests/lint-rules.test.mjs` |
| VO-5 | FR-6, C-12 | `LTT.lintDeck` 출력 순서 | unit | scenario testing | 장면 2개에서 R1·R2·R5·R7·R8·R9 중 4개 이상과 덱 R10·R11·R12·R13·R16 중 4개 이상이 함께 걸리는 시나리오 1개 + 같은 장면 안 R2의 항목별 교차(`unknown-term`, `term-no-visual`, `unknown-term`) 1개 | 100% | `[scene, rule]` 배열이 lint 규칙 표의 순서 규칙으로 손으로 만든 기대 배열과 같다 | `tests/lint-rules.test.mjs` |
| VO-6 | FR-4, FR-7, FR-2, C-8..C-11 | `LTT.auditScene(m)` | unit | 3-value boundary value analysis + decision table | small-visual: 12 타입 + `""` + `"foo"` 각각 판정 여부; 경계 0.0999/0.1/0.1001(일반)·0.2199/0.22/0.2201(figure, `layout:"full"`); `compact`; loose-figure figure 0.349/0.35/0.351·overview; empty-stage hero 0.599/0.6/0.601·일반; C-11 | 100% | 경고 유무가 Signatures·C 표와 같다 | `tests/scene-types.test.mjs` |
| VO-7 | FR-2, QR-4, C-15, C-17, C-18, C-19 | 실행 중 추가한 entry (lint·audit) | unit | equivalence partitioning + metamorphic testing | C-15: needsReadingGuide, titleOptional, cardGrid, auditSmallVisual 효과 + 지정 안 한 bookend·signature·auditHero·auditLooseFigure 기본; C-17: 빈 entry와 `cardGrid` 없는 entry의 no-title·카드 셈(throw 없음)·small-visual 10% 기준(기본 true인 유일한 lint/audit 필드)·bar의 reading guide; C-18 MR-1 전 입력; C-19 MR-2 audit 12타입 × VO-6 변형, lint 9타입 × form 2 | 100% | 위 Cases 결과. 덱 쪽 필드(head·autoSplit·fullByDefault·pointsOnMock·sumVisualAreas)의 기본값 경로는 vm에서 볼 수 없어 VO-14(R-5)가 맡는다 | `tests/scene-types.test.mjs`(C-15, C-17, C-18 audit 부분, C-19), `tests/lint-rules.test.mjs`(C-18 lintDeck 부분: VO-4 입력 목록을 그대로 걸러 쓴다) |
| VO-8 | FR-8, QR-1, C-1 | 갤러리 실제 화면 | end-to-end | metamorphic testing (기준 커밋 대 작업 트리) | 26 실행 × {DOM, audit, lint} + baseline sha | 100% | 차이 0 | R-1 (main): 기준 트리(`git archive 00bba01`) 덤프 5회와 작업 트리 덤프 3회를 `0041d668222ce019-dom-dump.mjs`로 뜬다. 파일마다 작업 트리 덤프 중 하나 이상이 기준 덤프 중 하나와 `0041d668222ce019-dom-diff.sh` 정규화 후 같으면 일치(기준끼리도 transition 중간값 때문에 0–2파일 차이가 난다). 26파일 모두 일치해야 한다; `audit.mjs --gallery --json`을 `0041d668222ce019-base-audit.json`과 target·size별 `audit`·`lint` deep-equal; `shasum -a 256 tests/gallery-audit.baseline.json`. 자동: gallery-audit test |
| VO-9 | FR-6, FR-7, QR-3, E-4 | lintDeck·auditScene 전체 입력 공간 | unit (main 실행) | random testing (differential) | 생성기 2개 × 20,000 | 예산 완주 | 위반 0, 양쪽 throw ≥ 1(E-4 관찰), 규칙 17종·12종 모두 발생 | fuzz 스크립트 결과를 Execution ledger에 |
| VO-10 | FR-9, QR-6 | `kit/api/internals.md` | unit (정적 문서) + review | syntax testing (문서 구조 토큰) | 첫 줄 토큰 유지; 표 행 첫 칸에 `LTT.sceneTypes` 1회; `LTT.deckTypes` 행에 `sceneTypes`; 필드 이름 14개(13 + `render`)가 표 행 첫 칸에; ctx 토큰 `el`·`scene`·`index`·`scenes`·`predictRest`·`refit`·`float`·`fit`·`gate`·`place`·`unplace`·`back`·`zmax`·`enter`·`leave`; 측정 모드 토큰 `LTT.measure`·`send`·`.dk-still`·`answerVisual`·멱등; 메타 필드 표 13행의 "기본" 칸 값과 "기본이 아닌 타입" 칸의 타입 집합이 Signatures 표와 같다(cardGrid는 타입 집합만); `lint`가 들어간 제목 아래 절에 `RULES`·`scene`·`deck`·`등록 순서`; api-docs BASE_DEFINITIONS 74 | 100% | 토큰과 표 값이 맞다. R-4: FR-9 절 전체(메타 표 설명 문단, 새 타입 문단, ctx 계약, 측정 모드, lint 규칙 추가)의 문장마다 코드 줄을 대조한 표와 맞는 문장 수/전체 문장 수 | `tests/release-docs.test.mjs`, `tests/api-docs.test.mjs`; R-4 (main) |
| VO-11 | FR-10, C-16 | 매니페스트·CHANGELOG·README | unit (정적) | equivalence partitioning | 두 version `0.2.0`, 두 값 같음, `files`에 `CHANGELOG.md`, CHANGELOG 파일 존재·`## 0.2.0`·항목 토큰(`enter`, `answerVisual`, `rest`, `predictRest`, `auto-reveal`, `panel-overlap`, `ltt-audit`, `audit.mjs`, `kit/api/`, `sceneTypes`, `deckTypes`, lint 레지스트리, `빈자리`), README `### 릴리스` 절 안 `kit/CHANGELOG.md`, `node scripts/build.mjs version` 종료 코드 0과 출력 `0.2.0` | 100% | 위와 같다 | `tests/release-docs.test.mjs` |
| VO-12 | FR-4, FR-5, QR-4 | ltt.js·ltt-deck.js 소스 | review | error guessing | 남은 타입 이름 문자열 비교·타입 키 객체를 모두 나열하고 FR-5 허용 목록과 대조 | none — experience-based | 허용 목록 밖 0 | R-3 (main): 타입 이름 12개를 (a) 큰따옴표·작은따옴표·백틱 문자열, (b) 따옴표 없는 객체 키(`이름:`)로 ltt.js·ltt-deck.js에서 grep한 결과 표와 FR-5 허용 목록 대조 |
| VO-14 | FR-2, FR-4, E-3, C-20 | 덱 쪽 기본값 경로(표에 없는 타입, 타입 없는 장면, 실행 중 빈 entry) | end-to-end | metamorphic testing (기준 커밋 대 작업 트리, 빈 entry 대 없는 타입) | C-20의 장면 5개 × {기준 대 작업 트리, partial 대 plain} | 100% | 정규화 DOM 차이 0 | R-5 (main): `0041d668222ce019-r5-dump.mjs <repo> 0041d668222ce019-r5-fixture.html <out> [partial]`을 기준 트리·작업 트리(plain)·작업 트리(partial) 각 2회 → `0041d668222ce019-dom-diff.sh` `diffs=0` 두 쌍; partial 분기가 실제로 돌았는지 제목 probe로 확인 |
| VO-13 | QR-2, FR-11 | 공개 이름 | review | equivalence partitioning | B와 N | 100% | N − B = {sceneTypes}, B − N = ∅ | R-2 (main): 기준 커밋 파일과 작업 트리 파일을 각각 vm에 불러 `Object.keys(LTT)` 비교 |

hand mutation (main, 하나씩 seed.py backup → 주입 → `npm test`(또는 R-1) → restore):
- HM-1 표에서 `predict` entry 삭제 → VO-1·VO-2 실패.
- HM-2 compare `autoSplit`을 false로 → VO-1 실패(+ R-1 DOM 차이).
- HM-3 card-monotony 연속 기준 3 → 4 → VO-4 C-4 실패.
- HM-4 비율 `> 0.5` → `>= 0.5` → VO-4 C-5 실패.
- HM-5 레지스트리에서 `no-title` 항목 제거 → VO-4 실패.
- HM-6 scene 단계 두 항목(R7, R8) 순서 교환 → VO-5 실패.
- HM-7 auditScene이 `auditSmallVisual`을 무시(항상 판정) → VO-6 실패.
- HM-8 `auditHero`를 `signature`로 읽음(contrast가 hero) → VO-6 실패.
- HM-9 deck이 render를 붙이지 않음 → VO-2 실패, gallery-audit 실패.
- HM-10 deck이 `head`를 무시(항상 머리) → R-1 DOM 차이(detector는 R-1 절차).
- HM-11 덱 쪽 `autoSplit` 기본을 false로 → R-5 차이.
- HM-12 실행 중 entry에서 `auditSmallVisual`을 기본 없이 읽음 → VO-7 C-17 실패.
- HM-13 `cardGrid`가 없으면 호출해 throw → VO-7 C-17 실패.
- HM-14 규칙마다 throw를 삼켜 `[]` → fuzz E-4 위반.
- HM-15 summary `cardGrid`가 `scenes`를 무시 → VO-4 summary 항목 실패.

# Assumptions and Defaults
| id | decision | evidence and uncertainty | brief v<n> — approved / vetoed → <answer> / user answer |
| --- | --- | --- | --- |
| AD-1 | 메타 표에 6개 상수 외 타입 성질(full 기본, 제목 면제, 카드 분모 제외, audit hero·loose-figure, compare 합산, points 목업 우선)도 넣는다. 타입 고유 내용 규칙은 타입 이름을 쓰는 lint 규칙으로 남긴다 | 이해 라운드 질문 1 | user answer |
| AD-2 | lint 불변 증거: 규칙별 합성 spec 단위 테스트(npm test 영구) + 기준 커밋과의 differential fuzz(spec-logs 1회 기록). 영구 fixture 없음 | 이해 라운드 질문 2 | user answer |
| AD-3 | `files`에 `CHANGELOG.md` 추가 | 이해 라운드 질문 3 | user answer |
| AD-4 | `LTT.sceneTypes` 공개 이름(internals.md 행), BASE_DEFINITIONS 73→74, `LTT.deckTypes`가 같은 표를 가리켜 값 모양이 바뀜(타입 → 함수에서 타입 → entry) | 저장소 안 `deckTypes` 소비자 없음(grep), internals.md에 "덱 내부"로 적힘 | user answer |
| AD-5 | 동작 불변: baseline 바이트 동일, 갤러리 audit·lint 불변, 기존 436 테스트 통과, 임계값·모바일 분기 불변, 새 작가 API 없음 | 사용자 결정 | user answer |
| AD-6 | 필드 이름: `head, autoSplit, fullByDefault, pointsOnMock, sumVisualAreas, needsReadingGuide, titleOptional, bookend, cardGrid, signature, auditHero, auditSmallVisual, auditLooseFigure, render` | 쓰는 쪽(덱/lint/audit)이 이름에서 보이게 audit 전용 필드에 `audit` 접두 | user answer (brief v1 질문 1: `readingGuide` → `needsReadingGuide`, `sumVisuals` → `sumVisualAreas`, 나머지 그대로) |
| AD-7 | 표를 `Object.create(null)`로 만들어 `"constructor"`·`"toString"` 같은 타입 이름을 표에 없는 타입으로 다룬다. 기준 커밋은 이 이름들을 SPLIT_OFF·NO_HEAD 등에 "있음"으로 잘못 읽었다(동작 차이는 이런 이름에서만) | 실제 수업에 없는 이름; fuzz 생성기에서 제외 | brief v1 — approved |
| AD-8 | entry 필드 기본값은 로드 때 채우고, 읽는 쪽도 없는 필드를 기본으로 본다(실행 중 추가 entry 지원) | FR-2 | brief v1 — approved |
| AD-9 | render는 있는데 entry가 없으면 ltt-deck.js 로드 때 throw(E-1). entry만 있고 render가 없으면 오류 없이 빈 장면 | 개발자 실수를 조용히 기본값으로 숨기지 않는다. 배포 kit은 두 파일이 같은 버전으로 묶여 실사용에서 일어나지 않는다 | brief v1 — approved |
| AD-10 | ltt-deck.js 첫 줄 의존 검사에 `LTT.sceneTypes`를 더한다(E-2) | 옛 ltt.js와 새 ltt-deck.js가 섞이면 TypeError 대신 기존 문구 | brief v1 — approved |
| AD-11 | lint 출력 "같음"은 집합이 아니라 순서까지 같은 배열 | 패널·`#ltt-audit` JSON이 순서대로 남는다. 더 강한 조건 | brief v1 — approved |
| AD-12 | CHANGELOG 0.2.0에 사용자 지정 항목 외 v0.1.0..HEAD의 작가가 보는 동작 2개(auto-reveal, 빈자리 배치)를 더한다 | `git log v0.1.0..HEAD`: ba4fe65, 2f71c60, cd6dada | brief v1 — approved |
| AD-13 | fuzz: differential random, seed 20261019, 20,000 + 20,000. Mutation tool: none(Stryker 미설치, 전역 설치 금지), hand mutation 10건 | 결정적 표·규칙 코드라 기준 커밋과의 차분이 가장 강한 oracle | brief v1 — approved |
| AD-14 | 덱 쪽 배선(head·autoSplit·fullByDefault·pointsOnMock·sumVisualAreas)의 증거는 R-1 DOM 차분(기준 덤프 2회가 정규화 후 0/26 차이로 결정적임을 확인)과 gallery-audit 테스트. npm test에 DOM 테스트는 더하지 않는다(jsdom 없음, 새 의존성 금지) | scenes.html이 모든 타입을 담는다 | brief v1 — approved |
| AD-15 | 기준선: `0041d668222ce019-base-audit.json`(기준 커밋 audit JSON), 기준 DOM 덤프는 scratchpad(2회, 각 26파일, 크기 때문에 저장소에 넣지 않음) | 덤프 스크립트·정규화 스크립트는 spec-logs에 있어 다시 만들 수 있다 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-2, C-8 | VO-1 | scene-types.test |
| FR-2 | C-8, C-15, C-17, C-18, C-19, C-20 | VO-4, VO-6, VO-7, VO-14 | lint-rules.test, scene-types.test, R-5 |
| FR-3 | C-3 | VO-2 | scene-types.test |
| FR-4 | C-4..C-11 | VO-4, VO-6, VO-8, VO-12 | tests + R-1 + R-3 |
| FR-5 | C-12 | VO-4, VO-12 | lint-rules.test + R-3 |
| FR-6 | C-4..C-8, C-12 | VO-4, VO-5, VO-9 | lint-rules.test + fuzz |
| FR-7 | C-9..C-11 | VO-6, VO-9 | scene-types.test + fuzz |
| FR-8 | C-1 | VO-8 | R-1 + gallery-audit.test |
| FR-9 | — | VO-10 | release-docs.test, api-docs.test, R-4 |
| FR-10 | C-16 | VO-11 | release-docs.test |
| FR-11 | C-3 | VO-2, VO-13 | scene-types.test, api-docs.test, R-2 |
| E-1, E-2 | C-13, C-14 | VO-3 | scene-types.test |
| E-3 | C-8, C-17, C-20 | VO-4, VO-6, VO-7, VO-14 | tests, R-5 |
| E-4 | — | VO-9 | fuzz (망가진 입력 분할, 양쪽 throw ≥ 1) |
| QR-1 | C-1, C-20 | VO-8, VO-14 | R-1, R-5 |
| QR-2 | C-3 | VO-13, VO-2 | R-2 |
| QR-3 | — | VO-9 | fuzz |
| QR-4 | C-15 | VO-12, VO-7 | R-3, test |
| QR-5 | C-4..C-8 | VO-4 | lint-rules.test |
| QR-6 | — | VO-10 | R-4 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 2 |
| verifier invocations | 2 |
| open finding ids | none (advisory A-1, A-4..A-6, A-8..A-10 남김; A-7은 ledger 14로 확인) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 4 | tests/scene-types.test.mjs VO-1 (verifier 1 승인, 의존 파일 불변) | accepted | HM-1·HM-2 탐지 | sceneTypes 표 |
| VO-2 | 4 | tests/scene-types.test.mjs VO-2 (verifier 1 승인) | accepted | HM-1·HM-9 탐지 | render 부착 |
| VO-3 | 4 | tests/scene-types.test.mjs VO-3 (verifier 1 승인) | accepted | — | 로드 검사 |
| VO-4 | 4 | tests/lint-rules.test.mjs VO-4 + summary `scenes` 항목(correction 2) | accepted | HM-3·HM-4·HM-5·HM-15 탐지 | RULES; correction 2가 테스트 추가 |
| VO-5 | 4 | tests/lint-rules.test.mjs VO-5 (verifier 1 승인) | accepted | HM-5·HM-6 탐지 | RULES 순서 |
| VO-6 | 4 | tests/scene-types.test.mjs VO-6 (correction 2에서 표 기반으로 바뀌어 이름만 바뀜, 단언 불변) | accepted | HM-7r·HM-8r 재탐지 | auditScene |
| VO-7 | 4 | scene-types C-15·C-17·C-18(audit)·C-19, lint-rules C-18(lint) | accepted | HM-12·HM-13 탐지 | SC-1 해결 대상 |
| VO-8 | 4 | R-1 ledger 3 (verifier 1 승인) | accepted | HM-10 탐지(R-1 26/26 불일치) | 덱 배선 |
| VO-9 | 4 | fuzz 재실행(망가진 입력 분할) ledger 9 | accepted | HM-14b 탐지 | SC-2 해결 대상 |
| VO-10 | 4 | release-docs(메타 표 값·lint 절), api-docs, R-4 표 `0041d668222ce019-r4-doc-review.md` | accepted | — | SC-3a·EG-1 해결 대상 |
| VO-11 | 4 | release-docs(`빈자리`, build.mjs version) | accepted | — | SC-3b 해결 대상 |
| VO-12 | 4 | R-3 ledger 10 | accepted | — | SC-4 해결 대상 |
| VO-13 | 4 | R-2 ledger 4 (verifier 1 승인) | accepted | — | 공개 이름 |
| VO-14 | 4 | R-5 ledger 7 | accepted | HM-11 탐지 | 새 의무(SC-1b) |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 0 | 기준 측정 | — | 기준 커밋 00bba01: `npm test` 436 pass(13.1 s). `audit.mjs --gallery --json` 26회 오류 0, audit 42건, lint 0건 → `0041d668222ce019-base-audit.json`. 기준 DOM 덤프 2회, 정규화(포트, 무작위 marker id, 비행 중 `.pk`, opacity 값) 후 차이 0/26. baseline.json sha256 a40956c21427d9965e68b12726130e84eb6e8453af04d5388f66dd904fb35c5e. 공개 이름 73개. `npx --no-install stryker` 없음 | 기준선 확보 |
| 1 | 첫 npm test: 712 중 711 pass, `VO-2 FR-3: overview renders with figure's render` 실패 | test defect: FR-3 v1 문장 "figure의 render를 쓴다"를 같은 함수로 읽음. 구현은 label 기본값을 넘기는 별도 함수(옳음) | spec v2에서 FR-3 문장 명확화, test-implementer가 동일성 단언 제거(형제 검사: 동일성·함수 소스 단언 없음 확인) | 두 번째 npm test 711/711 pass |
| 2 | VO-9 differential fuzz | — | `node agent-docs/spec-logs/0041d668222ce019-lint-diff-fuzz.mjs 20261019 20000` | lint 위반 0/20,000(양쪽 throw 0, 규칙 17종 모두 발생), audit 위반 0/20,000(규칙 12종 모두 발생), 예산 완주. 결과 `0041d668222ce019-lint-diff-fuzz-result.json`. implementer의 자체 차분(seed 20261019·7)도 0, `"constructor"`·`"toString"`만 차이(AD-7 승인 차이) |
| 3 | R-1 갤러리 불변 | 기준 덤프끼리도 transition 중간값으로 0–2파일 차이(기준 트리 덤프 3·4·5: diffs 2·1·0) | 기준 5회(작업 트리=HEAD 2회 + `git archive 00bba01` 3회)와 작업 트리 3회를 `0041d668222ce019-dom-match.sh`로 대조 | `files=26 nomatch=0`; 작업 트리 3회 각각 dom-base-1 대비 `diffs=0`. audit JSON: runs 26, diffs 0, errors 0, audit 42, lint 0. baseline.json sha256 a40956c2…5c5e 동일 |
| 4 | R-2 공개 이름 | — | 기준 커밋·작업 트리 파일을 각각 vm에 6개 로드 | base 73, new 74, added [sceneTypes], lost [] |
| 5 | R-3 타입 이름 잔여 | — | Verification Obligations VO-12의 grep | 남은 곳: ltt.js termIndex·lintDeck glossary 수집(terms), R1·R2(terms), R3(summary), R4(overview), R6(predict), R13(keywords), R14·R15(summary·overview); ltt-deck.js figure 캡션 번호, deck() glossary 수집(terms), head 안 `statement` 죽은 검사(FR-5·구현 지시로 유지), `map-related` render 키와 addScene; 나머지 3곳은 DOM 태그 이름(`summary`·`figure` 요소). FR-5 밖 0곳. SPLIT_OFF·NO_HEAD·VISUAL_TYPES·AUDIT_SKIP 없음 |
| 6 | R-4 ctx 문서 대조 | internals.md predict 문장이 "`잘 모르겠다` 포함"을 무조건으로 적음(코드: `unsure: false`면 빠짐, HTML 문자열 answerVisual은 한 번) | main이 문장 하나 수정(correction 1에 포함) | 나머지 문장 대조 결과 일치: el·firstChild(mount에서 `.dk-in`을 render 전에 붙임), refit=fit(el, inner, zmax), float=floatPanel 반환값, fit이 render·mount 뒤에 붙음, place/unplace/mobileFit 분기, gate 세 분기(forward)·마지막 장면, back(←·PageUp), zmax 기본 1, enter 순서(render→mount→points→scene enter→fit), leave는 mount 것만, audit의 fit, probe 키(innerWidth×innerHeight+fonts.status), measure의 send 억제(ltt-parts MEASURING)와 record 비억제, `.dk-still` CSS. 수정 뒤 npm test 711/711 |
| 7 | verifier 1 retry: SC-1, SC-2, SC-3, SC-4, EG-1 (blocking), A-1..A-5 (advisory) | SC-1: 실행 중 부분 entry·덱 기본값 경로의 증거 없음. 갤러리 13편에는 타입 없는 장면·표에 없는 타입이 없다(페이지별 `type:` 집계 스크립트, scratchpad `r4/scene-types-in-gallery.mjs`) | spec v3: C-17..C-20, VO-14(R-5). R-5 fixture `0041d668222ce019-r5-fixture.html`, `-r5-dump.mjs`: 기준 트리 2회·작업 트리 plain 2회·partial 2회 → base 대 after `diffs=0`, after 대 partial `diffs=0`; 구조 확인 head 6·split 3·full 1·rail 3; partial 분기 실행을 제목 probe(`P=true T={}`)로 확인 | 증거 확보; A-1(opacity 정규화)·A-4(E-1 한 타입)·A-5는 advisory 유지, A-2·A-3 일부 반영 |
| 8 | R-4 대조 중 문장 2개 부정확: gate 문장이 stepper가 →를 먼저 받는 경우를 빠뜨림; (6에서 고친 predict 문장) | 문서 정밀도 | main이 internals.md gate 문장 수정(correction 2), 문장별 대조표 `0041d668222ce019-r4-doc-review.md` 43/43 | EG-1 해결 |
| 9 | SC-2 E-4 관찰 없음 | 생성기에 망가진 입력이 없었다 | 생성기에 망가진 입력 분할(spec마다 0.1) 추가 후 seed 20261019, 20,000 + 20,000 재실행 | malformed 2,049, 양쪽 throw 1,011, 한쪽 throw 0, lint 위반 0(규칙 17종), audit 위반 0(규칙 12종). 결과 `0041d668222ce019-lint-diff-fuzz-result.json` |
| 10 | SC-4 R-3 모순·사각지대 | FR-5 허용 목록에 termIndex·statement 죽은 검사·map-related가 빠져 있었고 grep이 큰따옴표만 봤다 | spec v3 FR-5 수정; grep을 큰따옴표·작은따옴표·백틱 + 따옴표 없는 키로 확장 | 따옴표 문자열: ledger 5와 같은 목록(모두 FR-5 허용) + DOM 태그 3곳. 따옴표 없는 키: `TYPE_META` 표 12개(메타 표 자체), `RENDERS` 12개(render 표), `compare: compare`(LTT 속성), `figure: s.figure`(장면 필드), STYLE 안 CSS 주석 3곳. 허용 목록 밖 0곳 |
| 11 | correction 2 (test-implementer): VO-4 summary `scenes` 항목, VO-7 C-17·C-18·C-19, VO-10 메타 표 값·lint 절, VO-11 `빈자리`·build.mjs version | 증거 항목 누락 | 테스트 추가(기존 단언 불변, VO-6은 표 기반으로 이름만 바뀜). C-18 lint 부분은 lint-rules에 둠(spec v4에 반영) | `npm test` 775/775 pass |
| 12 | hand mutation (main) | — | seed.py backup → 주입 → `npm test`(HM-10은 R-1, HM-11은 R-5, HM-14는 fuzz) → restore, 매번 sha 대조 | HM-1 11 fail(VO-1 키·predict 행, VO-2, api-docs C-1, gallery); HM-2 1(VO-1 compare); HM-3 15(VO-4 C-4·C-6, kit.test 기존 2); HM-4 12(VO-4 C-4·C-5 2/4·bookend); HM-5 5(VO-4 no-title 4, VO-5); HM-6 1(VO-5); HM-7 9 → 재실행 HM-7r 9(VO-6 6타입, kit.test, gallery); HM-8 3 → HM-8r 3(VO-6 contrast 2, gallery); HM-9 2(VO-2 render, gallery); HM-10 R-1 nomatch 26/26; HM-11 R-5 diffs 1; HM-12 3(VO-7 C-17 2, C-18); HM-13 7(VO-7 C-17 6, C-18); HM-14(장면 규칙만 감쌈) fuzz 위반 0 → 결론 없음: 생성 입력의 throw가 모두 머리말(glossary·termIndex)이나 deck 규칙에서 나서 장면 규칙만 감싸면 같은 동작; HM-14b(모든 규칙 감쌈, spec 정의) fuzz 한쪽 throw 374 → 탐지; HM-15 2(VO-4 summary, kit.test). 15/15 탐지(HM-14는 HM-14b로). 모든 restore 확인, `seed: none` |
| 13 | HM-8 첫 실행 중 gallery-audit의 headless Chrome 하나가 14분 멈춤 | 기존 `audit.mjs` `runChrome`의 60초 SIGKILL 뒤에도 `close`가 오지 않음(가설: Chrome 자식 프로세스가 stdout을 잡고 있음). 부하(동시 Chrome) 아래서만 봄 | 멈춘 Chrome을 kill해 run을 끝냄; HM-8 결론은 VO-6 단위 테스트로 판정, HM-8r로 재확인 | 범위 밖 관찰(server 코드). handoff Open Questions에 남김 |
| 14 | verifier 2 pass (VO-1..VO-14 accepted, blocking 0; advisory A-1, A-4..A-10) | — | A-7 확인: 정규식 리터럴·`.test`/`.match`로 타입을 비교하는 곳과 목록 밖 `.type` 사용을 ltt.js·ltt-deck.js에서 grep → 0건 | 종료. 최종 `npm test` 775/775 pass(12.6 s), baseline sha256 a40956c2…5c5e 동일, `seed: none`. refactoring-4 handoff State·Next Step·Open Questions(overview hero 관찰, audit Chrome 멈춤)·Execution Ledger 갱신, 열린 채 둠 |

# Version Log
## v4 (종료 기록)
- verifier 2 pass로 status complete. 변경 내용 없음(종료 기록만).
## v4
- 계약만 고침: VO-7 증거 위치에 `tests/lint-rules.test.mjs`(C-18 lintDeck 부분)를 더함(test-implementer가 VO-4 입력 목록을 그대로 걸러 쓰려고 그곳에 둠; Tests 경로 안). correction 2와 hand mutation 결과를 ledger 7–13에 기록.
## v3
- verifier 1 retry(SC-1..SC-4, EG-1)에 따른 계약·증거 보강. 사용자 결정·품질 기준은 바뀌지 않아 재브리프 없음.
  - SC-1: C-17(빈·부분 entry), C-18(MR-1), C-19(MR-2)를 VO-7에 추가; 덱 쪽 기본값 경로는 새 VO-14(R-5 fixture 차분, C-20). 갤러리 13편에는 타입 없는 장면·표에 없는 타입이 없어 R-1이 이 경로를 보지 못한다(ledger 7).
  - SC-2: fuzz 생성기에 망가진 입력 분할, E-4 관찰 조건(양쪽 throw ≥ 1).
  - SC-3: VO-10에 메타 표 값·lint 절 토큰, R-4 범위를 FR-9 절 전체로; VO-11에 `빈자리`와 `scripts/build.mjs version`.
  - SC-4: FR-5 허용 목록에 termIndex, statement 죽은 검사, map-related addScene·render 키를 명시; R-3 grep을 따옴표 종류·따옴표 없는 키로 넓힘.
  - EG-1: R-4를 문장별 대조표(코드 줄, 개수)로 다시 기록.
  - A-2: 생성기 서술을 실제(`cards` 0.3, 비 terms 장면 terms 0.1, 채움 글 후보 5개)에 맞춤. A-3 중 summary `cardGrid`의 `scenes` 의존을 VO-4에 추가. HM-11..HM-15 추가.
## v2
- 계약만 고침(재브리프 없음): FR-3의 overview 문장을 "figure render를 불러 그림, 같은 함수 아님"으로 명확히 함(첫 npm test에서 `overview.render === figure.render` 단언 실패, test defect). VO-4의 C-6 변형 수 10 → 9(test-implementer 지적, C-6 표는 9개). R15에 "overview가 없으면 판정하지 않음"을 명시(test-implementer 지적, 기준 코드 조건 `ov >= 0`). R-1 DOM 절차를 반복 덤프 규칙으로 바꿈: 기준 트리끼리도 덤프 5회 중 diffs 2·1·0이 나와(cache-ttl·trolley·projectile의 transition 중간값) 단일 덤프 비교로는 불일치를 가를 수 없다. 기준 측정 ledger의 audit 건수 40 → 42(기준 JSON 재집계).
## v1
- 이해 라운드 답변(AD-1..AD-5)으로 초안 작성.
- 승인: brief v1 질문 1 답변으로 필드 이름 두 개(`needsReadingGuide`, `sumVisualAreas`) 확정, AD-7..AD-15 승인, status active.
