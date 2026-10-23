---
version: 6
run_id: e48ead05eb246d3c
status: complete
base_commit: 9636962a3df067c186249db5b74b924d1896ec23
max_verifier_invocations: 2
handoff: agent-docs/handoff/7a0ce2dc6e07a3ca-gallery-v2-test-results-and-generator-fixes.md
---

# User Intent
| id | stakeholder | intention | observable goal |
| --- | --- | --- | --- |
| UI-1 | skill 관리자(사용자) | gallery v2 시험에서 나온 레이아웃 결함(handoff `7a0ce2dc6e07a3ca` 2번)을 측정으로 확정되는 범위에서 kit이 자동 보정하거나 check가 오류로 낸다 (사용자 답 1-A) | 시험 수업에서 재현한 넘침·작은 SVG 글자·카드 넘침이 check 오류로 나오거나 kit이 생기지 않게 한다. 겹침은 판정하지 않는다 |
| UI-2 | skill 관리자 | 남은 kit·check 코드 결함 8 후반, 10, 11, 12, 14, 15, 18을 생성기에서 고친다 (사용자 답 2-A) | 재현 입력에서 결함이 없어지거나 check 오류로 나온다 |
| UI-3 | skill 관리자 | API.md "부품 찾기"의 재검색 문장을 SKILL.md grep 안내로 옮기고, rule id 목록이 문서·kit에서 빠지면 테스트가 잡게 한다(A-2) (사용자 답 3) | 문장이 SKILL.md에 있고 API.md에 없다. rule id 등록부와 rules.md 표가 다르면 테스트가 실패한다 |

# Scope
In scope: 결함 2(측정 가능한 레이아웃: 장면 넘침, 카드·hook 칸 넘침, 작은 SVG 글자 자동 보정, 카드 제목 줄바꿈), 8 후반(그려진 장면 글의 용어 검사, SVG 안 `{{}}`), 10(시각 칸 함수가 문서에 붙은 뒤 실행, figure 반환 계약), 11(hook `art` 값·크기, 모르는 아이콘 이름 lint), 12(summary 쪽 나눔), 14(`LTT.expect` 비숫자 비교), 15(`?shot` clock 다시 그리기), 18(vw 폭 check), A-2(rule id 등록부), 부품 찾기 문장 이동. 이를 위한 kit·audit 코드, 바뀐 동작의 문서(SKILL.md, API.md, deck-contracts.md, rules.md, internals.md), 갤러리 baseline 재생성과 검토. 시작 전과 끝에 handoff `7a0ce2dc6e07a3ca` 갱신(A-4 기록 포함).
Out of scope: 라벨·선·글자 겹침 판정, HTML 글자 크기 판정·보정(SVG `<text>`만), 결함 13(미문서화 필드 보충) 중 이번에 동작을 바꾸지 않는 항목, 16(팔레트·SVG `fill="var()"`), 20(self symlink 경로), A-4, 수업·갤러리 HTML 수정, 재생성 시험, 생성 시간, 폰 레이아웃(폰 모드에서는 새 레이아웃 판정·보정을 하지 않는다), 공개·단계·쪽 상태에서의 레이아웃 판정(check는 처음 상태만 본다).

# Paths
Implementation: skills/learn-to-tell/kit/ltt.js, skills/learn-to-tell/kit/ltt-deck.js, skills/learn-to-tell/kit/ltt-deck.css (`npm run build:css`로 STYLE과 맞춤), skills/learn-to-tell/kit/ltt-ui.js, skills/learn-to-tell/kit/ltt-ui.css, skills/learn-to-tell/kit/ltt-parts.js, skills/learn-to-tell/kit/ltt-parts.css, skills/learn-to-tell/kit/ltt-mock.js, skills/learn-to-tell/server/audit.mjs, skills/learn-to-tell/SKILL.md, skills/learn-to-tell/kit/API.md, skills/learn-to-tell/kit/api/deck-contracts.md, skills/learn-to-tell/kit/api/rules.md, skills/learn-to-tell/kit/api/internals.md, skills/learn-to-tell/kit/CHANGELOG.md, packages/ltt-kit/ (`npm run build:kit` 산출물만)
Tests: tests/layout-check.test.mjs, tests/kit-defects.test.mjs, tests/rule-registry.test.mjs, tests/expect-compare.fuzz.mjs, tests/fixtures/layout-check/, 기존 tests/*.test.mjs 중 바뀐 계약에 걸린 단언(rule id 손 목록, rules.md 문장, used-before-defined 문서 문장 등), tests/gallery-audit.baseline.json (main이 `npm run audit:baseline`으로만 갱신)
Test command: npm test
Review evidence: RV-1 문서 검토(VO-16 절차), RV-2 갤러리 baseline diff 검토(VO-17 절차), RV-3 갤러리 audit 시간 비교(VO-18 절차)
Fuzzing: node tests/expect-compare.fuzz.mjs — `LTT.compare(actual, expected, tol)`의 `ok`를 테스트 안에 FR-11대로 쓴 참조 구현과 차등 비교(differential). 값 생성: 유한 수(정수·소수·−0), NaN, ±Infinity, 길이 0–4 문자열(알파벳 {a, b, 1, 공백}), true/false, null, undefined, 길이 0–3 배열(원소는 앞의 것, 깊이 2까지), 빈 객체; tol은 undefined 또는 {0, 1e-9, 0.5}; 짝은 50% 확률로 같은 값 복사본. seed 1, 20,000 사례. npm test 밖
Mutation tool: none — 저장소에 JS mutation 도구가 없고(node_modules 없음) kit 코드가 브라우저·vm에서 돈다. 손 mutation만 쓴다

# Signatures
LTT.fixSvgText(scope) (ltt.js, LTT에 노출; FR-4 보정을 scope 아래에 적용, ltt-deck.js가 부른다)
LTT.renderedText(el) → string (ltt.js, LTT에 노출; FR-8의 그려진 글, 용어 표시는 `{{key}}`)
LTT.ruleIds: string[] (ltt.js, LTT에 노출; kit의 check·lint가 낼 수 있는 모든 rule id, 권고 포함)
AUDIT_RULE_IDS: string[] (audit.mjs export; audit만 내는 rule id: control-shift, probe-failed, shot-format, shot-unknown-clock, shot-bad-time)
LTT.compare(actual, expected, tol) → {ok, diff, tol} (기존 이름, 비숫자 규칙 추가)
check 새 rule(모두 `errors`, 고침): `scene-overflow`, `box-overflow`, `vw-size`; lint 새 rule(고침): `unknown-icon`
hook 장면 `art`: 아이콘 이름 | HTML 문자열 | Node | `(el, ctx) => …`
덱 `sceneList` states 추가: summary가 m(≥2)쪽이면 `["page-2", …, "page-m"]`; URL `?shot&state=page-<k>#n`; audit shot 파일 `<slug>-<size>-sNN-page<k>.png`
새 이름(`LTT.ruleIds`, `LTT.fixSvgText`, `LTT.renderedText`, `AUDIT_RULE_IDS`)은 기존 계약(공개 이름은 문서 하나에만 정의)에 따라 `kit/api/internals.md`에만 정의한다

# Functional Requirements
| id | requirement | priority | source |
| --- | --- | --- | --- |
| FR-1 | `scene-overflow`: 데스크톱(`data-ltt-mobile` 없음)에서 check가 돌 때 mount된 덱 장면마다, fit(최소 78%) 뒤 장면 섹션 안의 내용 — 비어 있지 않은 글 노드의 줄 상자(`Range.getClientRects`, SVG 안 글 제외; 세로로는 가장 가까운 inline이 아닌 조상의 상자로 자른다 — line-height < 1인 글 줄 상자가 블록 밖으로 나오는 것은 글자가 잘린 것이 아니다), 가장 바깥 `svg`·`img`·`canvas`·`video`·`iframe`, `input`·`button`·`select`·`textarea` 상자(크기 0 제외, `visibility`는 보지 않음; 장면 안의 `overflow: auto|scroll|hidden|clip` 조상 아래 내용은 그 조상 상자로 자른다) — 의 상자가 장면 섹션의 테두리 안쪽 상자(`getBoundingClientRect`에서 테두리를 뺀 것) 밖으로 아래·위 또는 오른쪽·왼쪽으로 1px 넘게 나가면. 섹션의 안쪽 여백만 넘친 것(`scrollHeight`만 큰 것)이나 빈 상자 폭·배경만 넘친 것은 넘침이 아니다 `{where: "장면 n", rule: "scene-overflow", msg}` 1건. msg에 넘친 방향과 px 수가 있다. 장면은 그 load의 처음 상태로 잰다 | must | 결함 2 |
| FR-2 | `box-overflow`: 데스크톱에서 check가 돌 때 mount된 덱 장면의 kit 칸 — hook `art` 칸, explain 단계 카드, terms 카드, compare 항목, 카드형 summary 카드, recall 목록 항목, contrast 각 쪽 — 마다, 그 칸의 HTML 자손 요소 또는 가장 바깥 `<svg>`(SVG 내부 요소는 제외, 크기 0인 요소 제외)의 상자가 칸의 테두리 상자 밖으로 어느 방향으로든 1px 넘게 나가면 칸마다 1건(칸이나 그 사이 조상의 `overflow: hidden|clip`으로 잘려 안 보이는 경우도 센다. 단 칸 안에 있는 `overflow: auto|scroll` 조상 아래 자손은 그 스크롤 조상의 상자로 대신 잰다) `{where: "장면 n", rule: "box-overflow", msg}`. msg에 칸 종류(예: "용어 카드", "hook 그림 칸")와 칸을 가리키는 글(용어·label·제목 중 있는 것)과 px 수가 있다 | must | 결함 2, 11 |
| FR-3 | 카드 제목 자동 줄바꿈(Design Principle 3): terms 카드 `word`, explain 단계 `title`, compare `label`, summary 카드 제목은 공백 없는 긴 낱말(60자)도 칸 안에서 줄을 바꿔 칸 밖으로 나가지 않는다(그 칸에 `box-overflow` 없음) | must | 결함 2 |
| FR-4 | 작은 SVG 글자 자동 보정(Design Principle 3): 데스크톱에서 덱 장면이 fit될 때마다와 `?shot`의 `data-ltt-shot` 신호 직전에, 덱이 아닌 페이지는 check 직전에, 글이 비어 있지 않은 SVG `<text>`(kit 아이콘 `.ltt-ic` 안 제외)의 화면 글자 크기 = `getComputedStyle(text).fontSize`(px) × (그 text를 담은 가장 가까운 `<svg viewBox>`의 `getBoundingClientRect().width` ÷ viewBox 폭)가 10px 미만이면 그 text의 글자 크기를 화면 10px이 되게 키운다(인라인 style). 10px 이상인 text의 글자 크기는 바꾸지 않는다. 이 보정은 check에 보고하지 않는다. viewBox 없는 svg는 배율 1로 본다. `?shot`에서는 FR-13의 clock 다시 그리기와 상태 적용 뒤, 신호 직전 마지막에 보정한다 | must | 결함 2, Design Principle 3 |
| FR-5 | hook `art`: 아이콘 이름이면 지금의 둥근 아이콘 칸. HTML 문자열·Node·함수(`fill` 의미, 함수는 문서에 붙은 칸으로 불림)는 그 내용을 그리고, 이때 칸은 고정 정사각·큰 글꼴(60–120px)을 쓰지 않고 폭이 hook 행 폭의 40% 이하이며 안의 `svg`·`img`·`canvas`는 칸 폭에 맞춰 줄어든다(종횡비 유지). Node가 "[object …]", 함수가 소스 글로 찍히지 않는다 | must | 결함 11 |
| FR-6 | lint `unknown-icon`(고침): hook `art`, explain `steps[].icon`, terms `terms[].icon` 값이 `/^[a-z][a-z0-9-]*$/`에 맞는 문자열인데 `LTT.icons`에 없으면 그 값마다 1건(장면 n), msg에 값이 있다 | must | 결함 11(cache `database`) |
| FR-7 | summary 쪽 나눔: summary가 보이는 항목(카드형이면 카드, recall형이면 항목, `extra` 포함)이 7개 이상이면 6개씩 쪽으로 나누고 장면 안 쪽 넘김 버튼 두 개(보이는 글이나 aria-label에 각각 "이전"·"다음")와 "k / m" 글(예: "1 / 2") 표시를 둔다. 다른 장면에서 들어올 때 보이는 쪽은 정하지 않는다. 6개 이하면 지금과 같다. 화면 속 쪽 넘김이 보이면 ←/→ 키는 쪽 끝에 닿을 때까지 쪽을 먼저 넘긴다(기존 stepper 규칙). 쪽을 넘겨도 장면 배율(제목 h2의 화면 높이)이 1px 넘게 바뀌지 않는다. recall 공개·`recall` 이벤트는 그대로다. `sceneList` states는 `page-2…page-m`, `?shot&state=page-<k>#n`은 k쪽을 그린다(범위 밖은 상태 없이). audit `--shots`는 `sNN-page<k>.png`를 찍고 index.md에 상태 `page-<k>`로 적는다 | must | 결함 12 |
| FR-8 | 그려진 장면 글의 용어 검사(결함 8 후반): check가 덱의 용어 검사(`unknown-term`, `used-before-defined`)를 할 때 mount된 장면은 장면 데이터 글에 더해 그 장면 섹션에 그려진 글(HTML 글 노드, SVG `<text>` 글; `aria-hidden="true"` 하위 제외; 용어 표시 요소는 `{{key}}` 표시로 셈)도 그 장면의 글로 본다. (a) 그려진 글에만 있는 평문 용어도 처음 표시보다 앞 장면이면 `used-before-defined`; (b) 그려진 글에만 있는 `{{key}}` 표시도 그 장면의 표시(정의)로 셈; (c) 그려진 글에만 있는 모르는 `{{key}}`도 `unknown-term`. 같은 장면에서 같은 (rule, msg)는 한 번만 낸다. mount 안 된 장면은 데이터 글만 본다. 용어 경계 판정은 기존 `LTT.usesTerm` | must | 결함 8 |
| FR-9 | SVG 안 `{{}}`: `LTT.linkTerms`가 SVG `<text>` 안의 `{{보이는 말|key}}`를 SVG에서 그려지는 요소(`tspan`)로 바꾼다. 결과 글에 `{{`가 없고 보이는 말이 그려진다(`getBBox().width > 0`), 그 요소는 용어 표시로 셈(FR-8) | must | 결함 8, 13(변환 범위) |
| FR-10 | 시각 칸 함수 실행 시점(결함 10): figure(steps 유무), overview `figure`, explain `steps[].visual`, terms `visual`, compare `items[].visual`, statement `visual`, predict `visual`·`answerVisual`, contrast `before`/`after`의 `visual`·`foot.visual`, `aside`, hook `art` 함수는 모두 `isConnected === true`이고 그 장면 섹션 안에 있는 노드로 불린다. 그래서 함수 안에서 그 노드에 넣은 id를 `document.getElementById`로 찾고(`LTT.sweep`이 `#id`를 찾음), 넣은 SVG `path`의 `getTotalLength()`가 0보다 크다 | must | 결함 10 |
| FR-11 | figure 함수 반환 계약: (a) 받은 노드를 채우고 아무것도 안 돌려줌 (b) 새 Node나 HTML 문자열을 돌려줌 → 넣는다 (c) `{el, ...}`를 돌려줌 → el이 새 노드면 넣고, el이 받은 노드이거나 그 안에 이미 있으면 다시 넣지 않는다; steps의 `enter(k, fig)`는 그 객체를 받는다 (d) 받은 노드 자신을 돌려줌 → 다시 넣지 않는다. 어느 것도 `scene-error`·`check-failed`를 내지 않는다(steps 유무 둘 다) | must | 결함 10(diversification) |
| FR-12 | `LTT.compare`/`LTT.expect`: 둘 다 유한 수면 지금 규칙(`|actual − expected| <= tol`, 기본 tol `1e-9 × max(1, |expected|)`); 둘 다 문자열, 둘 다 boolean, 둘 다 null이면 `===`; 둘 다 배열이면 길이가 같고 원소마다 이 규칙(수 원소의 tol은 주어진 tol 또는 그 원소의 기본 tol)이 모두 ok; 그 밖(타입 다름, NaN, ±Infinity, undefined, 객체)은 불일치. ok면 패널 ✓ 행, `expect-mismatch` 없음 | must | 결함 14 |
| FR-13 | `?shot` clock 다시 그리기(결함 15): `?shot`에서 check와 상태 적용(`state`) 뒤 `data-ltt-shot` 신호 직전에, 멈추지 않은(draw가 던지지 않은) 모든 `LTT.clock`을 한 번 더 그린다: `clock=<id>&t=<ms>`로 고른 clock은 `draw(t)`(dur로 자름), 나머지는 `draw(dur)`. 그래서 같은 장면의 `LTT.sweep` 첫 render나 `enter`가 그림을 덮어써도 찍히는 상태는 이 시점이다 | must | 결함 15 |
| FR-14 | `vw-size`(고침): check가 돌 때 kit이 아닌 스타일 — 문서의 `<style>` 요소와 같은 출처 stylesheet(kit 스크립트가 만든 style 요소와 href 경로가 `/kit/`인 link 제외; `@media`·`@supports` 안 규칙 포함), 그리고 body 안 요소의 `style` 속성 — 에서 `width`, `min-width`, `max-width`, `flex-basis`, `inline-size`, `min-inline-size`, `max-inline-size` 값에 `vw`·`svw`·`lvw`·`dvw` 단위가 있으면 선언마다 1건 `{where: "페이지", rule: "vw-size", msg}`; msg에 선택자(속성이면 요소 tag와 id·class)와 선언 글. 다른 속성(`font-size` 등)과 `vh`는 보지 않는다. 덱·덱 아닌 페이지 둘 다 | must | 결함 18 |
| FR-15 | rule 등록부(A-2): `LTT.ruleIds`는 kit check·lint가 낼 수 있는 rule id 전부, `AUDIT_RULE_IDS`는 audit만 내는 rule id 전부. 둘의 합집합은 rules.md 표들의 첫 칸 code span 집합과 같다. check가 등록부에 없는 rule을 `errors`·`advice`에 담게 되면 그 항목은 그대로 두고 `{where: "페이지", rule: "check-failed", msg: "등록되지 않은 rule <id>"}`를 더한다. audit도 `AUDIT_RULE_IDS`·`LTT.ruleIds`(결과 JSON에 오는 것) 밖 rule을 내면 같은 형식의 `check-failed`를 더한다 | must | A-2 |
| FR-16 | 문서: (a) SKILL.md `@ltt-part` grep 안내 줄에 "걸리지 않으면 다른 축의 말로 한 번 더 찾고, 그래도 없으면 직접 짠다"가 들어가고 API.md "부품 찾기"에서는 그 문장이 빠진다; (b) rules.md: "그려진 화면의 레이아웃은 판정하지 않는다"를 새 원칙(측정으로 확정되는 넘침은 check, 결정적으로 고칠 수 있는 것은 kit 보정, 겹침은 PNG)으로, `used-before-defined`의 "mount·figure HTML·SVG 안의 글은 보지 않는다"를 FR-8로 바꾸고, 새 rule 4개 행; (c) API.md·deck-contracts.md: hook `art` 값·칸 크기, 시각 칸 함수가 문서에 붙은 뒤 불린다는 것과 figure 반환 계약(FR-11)과 형제 여러 개는 가로로 놓인다는 것, summary 쪽 나눔과 `page-<k>`, `LTT.expect` 비교 규칙, `?shot&clock` 다시 그리기, SVG 작은 글자·카드 제목 자동 보정, SVG `<text>` 안 `{{}}`가 tspan으로 된다는 것; (d) 각 사실은 생성 agent가 읽는 곳(SKILL.md 또는 API.md 네 절, 해당 장면을 쓸 때 읽는 deck-contracts.md) 중 한 곳에 적는다 | must | UI-3, 결함 10–12, 14, 15 |
| FR-17 | 문서 수정은 이번 결함과 무관한 기존 규칙의 뜻을 바꾸지 않고, 기존 테스트가 글자 그대로 지키는 문장(gate-gaps 평가 기준·체크리스트 줄, `check`를 `?check`·`?shot` 두 상태에서 읽는다는 SKILL.md 설명 등)은 유지한다 | must | UI-3, 지난 run 실패 기록 |

# Errors
- 장면 내용이 78%로 줄여도 화면보다 큼 — check `scene-overflow` 1건(장면 n), audit 종료 1 — 장면은 지금처럼 스크롤된다
- kit 칸 밖으로 나간 자손 — check `box-overflow` 칸마다 1건 — 그림은 그대로
- 페이지 CSS·style 속성의 vw 폭 — check `vw-size` 선언마다 1건 — 스타일은 그대로 적용
- 모르는 아이콘 이름 — lint `unknown-icon` 1건 — 값은 지금처럼 글로 그려짐
- 레이아웃 측정 중 예외 — check에 `check-failed`(msg에 예외 문구) 1건을 더하고, 그 밖의 오류(용어·lint·script-error 등)는 그대로 낸다 — 페이지는 계속 동작
- figure 함수가 받은 노드나 그 안의 노드를 `el`로 돌려줌 — 오류 없음 — 그 노드가 한 번만 있다
- 등록부 밖 rule — `check-failed` "등록되지 않은 rule <id>" 추가 — 원래 항목도 남음
- `LTT.expect` 타입 다른 값 — 불일치(패널 ✗, `expect-mismatch`) — 예전과 같음

# Cases
| id | level | input / state | expected result |
| --- | --- | --- | --- |
| C-1 | normal | 1440×900 `?check`, 장면 3이 높이 2400px 고정 div(mount) | errors에 `scene-overflow` 장면 3, msg에 세로 px |
| C-2 | boundary | 같은 덱, 장면 내용이 상자에 딱 맞는 높이(넘침 0)와 4px 넘침; 내용 끝은 상자 안이고 섹션 안쪽 여백만 넘침(`scrollHeight > clientHeight`); 글은 상자 안인데 `min-width`로 빈 폭만 장면 밖으로 나간 상자 | 0건 / 1건 / 0건 / 0건 |
| C-3 | edge | 폰 모드(390×844)에서 C-1 | `scene-overflow` 없음 |
| C-4 | normal | terms 카드 `visual`에 폭 2000px div, compare 항목 visual 폭 2000px, contrast before visual 폭 2000px, explain 단계 visual 폭 2000px | 각 장면에 `box-overflow` 1건씩, msg에 칸 종류 |
| C-5 | normal | terms `word`가 공백 없는 60자, compare label 60자, explain title 60자 | `box-overflow` 없음, 제목 오른쪽 끝 ≤ 칸 오른쪽 끝 + 1 |
| C-6 | normal | figure 장면 SVG viewBox `0 0 1000 200`, 칸 폭 300px, text font-size 16 | load 뒤 화면 글자 크기 ≥ 9.9px; check에 관련 오류 없음 |
| C-7 | boundary | 같은 SVG에 화면 크기 정확히 10px이 되는 text와 9px이 되는 text | 10px text의 font-size는 그대로, 9px text는 ≥ 9.9px로 |
| C-8 | edge | `.ltt-ic` 아이콘 SVG 안 text, 빈 text | 바뀌지 않음 |
| C-9 | normal | hook `art`에 Node(폭 900 viewBox SVG), 함수(문서에 붙었는지 기록, `#hook-x` 생성) | 칸 글에 "[object" 없음, 함수가 붙은 노드로 불림, SVG가 칸 안(칸 폭 ≤ hook 행 폭 40% + 1), `box-overflow` 없음 |
| C-10 | error | hook `art: "database"`, explain step `icon: "rocketship"`, terms icon `"cpu"` | `unknown-icon` 2건(장면 각각), cpu는 없음 |
| C-11 | normal | 앞 장면 9개에 takeaway+recall, summary | 쪽 2개(6+3), 쪽 넘김 후 h2 높이 변화 ≤ 1px, sceneList states `["page-2"]`, `?shot&state=page-2#n`이 7–9번째 항목을 보임 |
| C-12 | boundary | 항목 6개 / 7개 | 쪽 나눔 없음, states `[]` / 쪽 2개 |
| C-13 | normal | 장면 2 mount HTML에 평문 glossary 용어 "캐시", 처음 `{{캐시}}`는 장면 4 | `used-before-defined` 장면 2 |
| C-14 | normal | 장면 2 mount HTML에만 `{{캐시}}`, 장면 3 데이터에 평문 "캐시" | `used-before-defined` 없음 |
| C-15 | error | 장면 2 mount HTML에만 `{{없는말}}` | `unknown-term` 장면 2 1건 |
| C-16 | edge | 같은 용어가 데이터와 그려진 글 둘 다에서 정의 전 사용 | 같은 (where, rule, msg) 1건 |
| C-17 | normal | figure SVG `<text>{{보이는|캐시}}</text>` | 글에 `{{` 없음, "보이는" 그려짐(bbox 폭 > 0) |
| C-18 | normal | figure 함수가 안에서 `#k1` input과 `LTT.sweep({params:{k1}})`, path 추가 후 `getTotalLength()` 기록; explain·terms·compare·statement·predict·contrast·aside·hook 함수가 `isConnected` 기록 | scene-error 없음, 모두 true, 길이 > 0 |
| C-19 | normal | figure 함수 반환 (a) 없음 (b) 새 svg (c) `{el: 새 svg, api}` (d) `{el: 받은 노드}` (e) 받은 노드 — steps 있음·없음 각각 | 오류 0, (c)의 enter가 api 객체를 받음, 노드 중복 없음 |
| C-20 | normal | `LTT.expect("s", "abc", "abc")`, `("b", true, true)`, `("n", null, null)`, `("v", [1, 2.0000000001], [1, 2])` | 모두 ok, `expect-mismatch` 없음 |
| C-21 | error | `("s", "abc", "abd")`, `("t", "1", 1)`, `("a", [1], [1, 2])`, `("o", {}, {})`, `("x", NaN, NaN)` | 모두 불일치 |
| C-22 | normal | 장면에 `LTT.clock(id "c", dur 1000)` 뒤 같은 그림을 `draw(1000)`으로 다시 그리는 `LTT.sweep` immediate render; `?shot&clock=c&t=300` | 찍힌 DOM이 draw(300) 상태 |
| C-23 | normal | 같은 덱 `?shot`(clock 지정 없음), sweep render가 draw(0)으로 덮어씀 | DOM이 draw(dur) 상태 |
| C-24 | error | 페이지 `<style>`에 `.a{width:40vw}`, `@media(min-width:1px){.b{max-width:min(440px,34vw)!important}}`, `.c{font-size:2vw}`, `.d{height:50vh}`; 요소 `style="flex-basis:30vw"` | `vw-size` 3건(.a, .b, 속성), .c·.d 없음 |
| C-25 | edge | kit만 쓰는 깨끗한 덱 | `vw-size` 없음 |
| C-26 | normal | `LTT.ruleIds ∪ AUDIT_RULE_IDS` vs rules.md 표 | 같은 집합 |
| C-27 | error | 테스트가 `LTT.checkSource`로 등록부 밖 rule `zz-test`를 내는 source를 단 페이지 | errors에 `zz-test` 그대로 + `check-failed` "등록되지 않은 rule zz-test" |
| C-28 | edge | 레이아웃 측정 중 예외(측정 대상 칸의 getBoundingClientRect가 던지게 한 페이지) | `check-failed` 1건 + 같은 페이지의 다른 오류(예: unknown-term) 유지 |
| C-29 | normal | SKILL.md·API.md 문장 | FR-16(a) |

# Quality Applicability
| ISO/IEC 25010:2023 characteristic | applicable | rationale |
| --- | --- | --- |
| Functional suitability | yes | 결함을 잡거나 없애는 것이 목적 |
| Performance efficiency | yes | check가 모든 장면을 재므로 audit 시간이 늘 수 있다(생성 시간 handoff와 충돌) |
| Compatibility | yes | 기존 수업·갤러리가 계속 그려져야 하고, 기존 rule·URL·shot 이름이 유지돼야 한다 |
| Interaction capability | yes | summary 쪽 넘김 키 조작, SVG 글자 가독성 |
| Reliability | yes | 측정 예외가 check 전체를 지우면 안 된다 |
| Security | no | 새 입력 경로 없음(check JSON은 기존처럼 `<` 이스케이프) |
| Maintainability | yes | rule 등록부·문서 일치(A-2), 주석 규칙 |
| Flexibility | no | 데스크톱 1280px 이상 기준 유지, 폰은 범위 밖 |
| Safety | no | 해당 없음 |

# Quality Requirements
| id | characteristic / subcharacteristic | target and context | measure method / inputs / unit | threshold and direction | evidence: automated, review, mutation | source |
| --- | --- | --- | --- | --- | --- | --- |
| QR-1 | Functional suitability / correctness | FR-1..FR-15 재현 입력 | Cases 통과 수 / 전체 | 100%, 높을수록 | npm test, 손 mutation | UI-1..UI-3 |
| QR-2 | Performance efficiency / time behaviour | 갤러리 전체 audit(`node scripts/gallery-audit.mjs`, 기본 두 크기, 같은 기계) | wall time 초, base_commit 대비 비율 | ≤ 1.25배, 낮을수록 | RV-3 | 생성 시간 handoff |
| QR-3 | Compatibility / co-existence | 기존 테스트, 기존 rule id·URL·shot 파일 이름 | 기존 테스트 실패 수(바뀐 계약 단언 갱신 제외) | 0 | npm test | 기존 계약 |
| QR-4 | Interaction capability / operability | summary 쪽 넘김 | → 키로 모든 쪽을 지난 뒤 다음 장면, ← 키로 거꾸로 | 쪽 m개 summary에서 → (m−1)번 뒤 장면 그대로, 한 번 더면 다음 장면 | npm test | 결함 12 |
| QR-5 | Reliability / fault tolerance | 레이아웃 측정 중 예외 | 다른 오류 유지 여부 | 유지(C-28) | npm test | Errors |
| QR-6 | Maintainability / modifiability | rule 등록부·rules.md·kit 출력 | 집합 차이 수 | 0 (C-26, C-27) | npm test | A-2 |
| QR-7 | Maintainability / analysability | 새 코드 주석 | AGENTS.md Comment Enforcement 위반 수 | 0 | RV-1 | AGENTS.md |
| QR-8 | Compatibility / interoperability | 갤러리 baseline | 바뀐 page×size마다 새 rule이 실제 결함인지 | 오탐 0 (오탐이면 구현 결함으로 되돌림) | RV-2 | UI-1 |

# Verification Obligations
| id | parent requirement/Case ids | variant and target surface | test layer and selection policy | ISO/IEC/IEEE 29119-4 technique | coverage items | coverage target | observation and expected result | evidence procedure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VO-1 | FR-1, C-1..C-3 | `#ltt-check` errors (Chrome, 1440×900 `?check`, 390×844 폰) | integration, 고정 fixture | boundary value analysis (2-value) | 넘침 0px, 넘침 ≥4px, 가로 넘침 ≥4px, 여백만 넘침, 빈 폭만 넘침, 폰 모드 | 100% | rule·where 일치, 폰은 없음 | npm test |
| VO-2 | FR-2, FR-3, C-4, C-5 | errors, 제목 상자 rect | integration | equivalence partitioning | 칸 종류 7개(hook art, explain, terms, compare, 카드 summary, recall 항목, contrast) × {넘침, 정상} 중 넘침 7 + 정상 1(모든 칸 한 덱); 잘림 2개({overflow:hidden 조상 안 넓은 자손 → 1건, 칸 안에 맞는 overflow:auto 상자 안 넓은 자손 → 0건}); 제목 줄바꿈 4필드 | 100% | 넘침 칸마다 1건, 정상 0건, 제목 rect 안 | npm test |
| VO-3 | FR-4, C-6..C-8 | SVG text computed font-size × 배율 | integration | boundary value analysis (3-value) | 화면 9px, 10px, 11px, 아이콘 안, 빈 text, `?shot` 신호 시점, 덱 아닌 페이지 | 100% | ≥9.9 / 원래 그대로 | npm test |
| VO-4 | FR-5, FR-6, C-9, C-10 | hook 칸 DOM·rect, lint 출력 | integration + unit(lintDeck) | equivalence partitioning | art: 아이콘, HTML, Node, 함수, 없음; icon 필드 3곳 × {알려진, 모르는, HTML} | 100% | C-9, C-10 | npm test |
| VO-5 | FR-7, C-11, C-12, QR-4 | summary DOM, sceneList, `?shot&state`, 키 이동, audit shot 파일 | integration | state transition | 상태 {쪽1, 쪽2, …, 마지막 쪽}, 전이 {→, ←, 버튼 다음/이전, 경계에서 →(다음 장면)}; 6/7개 경계; 카드형·recall형 | all states and transitions (0-switch) | 쪽 내용·h2 높이·장면 번호 | npm test |
| VO-6 | FR-8, FR-9, C-13..C-17 | errors, SVG 글 | integration | decision table | 조건: 용어가 {데이터, 그려진 글, 둘 다}에 × {평문, 표시, 모르는 표시} × mount 여부; 규칙 7행(C-13..C-16 + mount 안 된 장면 + aria-hidden 글 + SVG tspan) | 100% | 기대 rule·where·중복 없음 | npm test |
| VO-7 | FR-10, FR-11, C-18, C-19 | 함수가 기록한 값, errors | integration | equivalence partitioning + error guessing | 시각 칸 12곳 각각 isConnected; 반환형 5개 × steps 유무 | 100% / none — experience-based(반환형) | 모두 true, 오류 0 | npm test |
| VO-8 | FR-12, C-20, C-21 | `LTT.compare` 반환, expect 패널·이벤트 | unit(vm) | decision table | 타입 짝 {수·수, 문자·문자, bool·bool, null·null, 배열·배열, 다른 타입, NaN, ±Inf, undefined, 객체} × {같음, 다름} | 100% | ok 값 | npm test |
| VO-9 | FR-12 | `LTT.compare` | unit | random (differential fuzz) | 20,000 사례 seed 1 | none — random | 참조와 차이 0 | node tests/expect-compare.fuzz.mjs |
| VO-10 | FR-13, C-22, C-23 | `?shot` 뒤 DOM | integration | equivalence partitioning | clock 지정/미지정, sweep 덮어쓰기/enter 덮어쓰기, 던진 clock | 100% | draw(t)/draw(dur) 상태 | npm test |
| VO-11 | FR-14, C-24, C-25 | errors | integration | equivalence partitioning + syntax | 속성 7개 중 width·max-width·flex-basis·inline-size; 단위 vw·dvw·vh; 위치 style 요소·@media·style 속성·kit style; font-size | 100% | 기대 건수 | npm test |
| VO-12 | FR-15, C-26, C-27, QR-6 | 등록부, rules.md, check 출력 | unit + integration | equivalence partitioning | 등록 rule, 미등록 rule(kit), 미등록 rule(audit) | 100% | 집합 같음, check-failed 추가 | npm test |
| VO-13 | Errors, C-28, QR-5 | errors | integration | error guessing | 측정 중 예외 | none — experience-based | check-failed + 다른 오류 유지 | npm test |
| VO-14 | FR-16(a), C-29 | 문서 글 | unit | equivalence partitioning | SKILL.md 포함, API.md 미포함 | 100% | 문장 위치 | npm test |
| VO-15 | QR-1, QR-3 | 전체 | — | — | 기존 테스트 | 100% pass | 통과 | npm test |
| VO-16 | FR-16(b)–(d), FR-17, QR-7 | 문서·주석 | review | — | FR-16 사실 목록 각각, 지운·바꾼 문장 각각 | 100% | 사실이 한 곳에 있고 모순 없음, 무관 규칙 불변, 주석 규칙 위반 0 | RV-1: base_commit 대비 `git diff`로 문서 5개를 읽고 FR-16 항목별 위치·문장을 표로 적고, 삭제·약화 문장마다 근거를 적는다(spec 실행 원장) |
| VO-17 | QR-8 | 갤러리 baseline | review | — | 바뀐 page×size 각각 | 100% | 새 오류가 실제 결함 | RV-2: `npm run audit:baseline` 전후 diff, 새 오류를 rule별로 세고 scene-overflow·box-overflow는 장면 PNG(`--shots`)를 보고, vw-size·unknown-icon·used-before-defined는 원문 줄을 보고 실제 결함인지 표로 적는다 |
| VO-18 | QR-2 | 갤러리 audit 시간 | review | — | 1회 측정 | — | ≤ 1.25배 | RV-3: base_commit 시간(실행 전 기록: 원장) vs 구현 뒤 같은 명령 `/usr/bin/time -p node scripts/gallery-audit.mjs` |

# Assumptions and Defaults
| id | decision | evidence and uncertainty | approval |
| --- | --- | --- | --- |
| D-1 | 레이아웃 범위 = 측정 가능한 넘침·작은 글자·카드 넘침, 겹침 제외 | 사용자 답 1-A | user answer |
| D-2 | 이번 run은 코드 결함(2, 8 후반, 10, 11, 12, 14, 15, 18) + A-2 + 문장 이동, 13·16·20·A-4는 다음 run, handoff를 시작 전에 갱신하고 끝에 다시 고침 | 사용자 답 2-A, 3 | user answer |
| D-3 | 작은 글자 기준 10px, SVG `<text>`만 자동 보정(보고 안 함), HTML 글자 제외 | 기존 mobileFit 기준(약 10px), 결함 보고가 SVG viewBox 축소였음. 보정 뒤 라벨이 겹칠 수 있음 → PNG 검증이 본다 | brief v1 — approved |
| D-4 | 넘침·칸 넘침은 보정 없이 check 오류(이미 78% 축소 뒤라 결정적 보정이 없음). 처음 상태만 판정 | Design Principle 3은 결정적 보정이 있을 때만 | brief v1 — approved |
| D-5 | summary는 7개 이상이면 6개씩 쪽 나눔 | 1280×800에서 recall 9개가 넘쳤다는 보고 4건, 6개로 줄인 수업은 들어감(investing) | user answer (A) |
| D-6 | hook 비아이콘 art 칸 폭 상한 = hook 행의 40% | 지금 아이콘 칸 240px ≈ 1280 기준 19%, 수업들이 440px을 원함 | brief v1 — approved |
| D-7 | vw 판정 속성은 폭 계열 7개, vh 제외 | API.md 원칙이 "폭" | brief v1 — approved |
| D-8 | rule 등록부 + 런타임 check-failed 가드(A-2) | 손 목록 대신 kit이 가진 목록, 미등록 rule은 실행 시 드러남 | brief v1 — approved |
| D-9 | 갤러리 수업은 고치지 않고 baseline에 새 건수를 기록(오탐만 구현에서 고침) | AGENTS.md Generated Lesson Defects | brief v1 — approved |
| D-10 | 구조 기반 커버리지 측정 없음 | kit은 Chrome·vm에서 실행, 도구 없음 | brief v1 — approved |

# Traceability
| requirement id | Case ids | obligation ids | evidence procedure |
| --- | --- | --- | --- |
| FR-1 | C-1..C-3 | VO-1 | npm test |
| FR-2, FR-3 | C-4, C-5 | VO-2 | npm test |
| FR-4 | C-6..C-8 | VO-3 | npm test |
| FR-5, FR-6 | C-9, C-10 | VO-4 | npm test |
| FR-7 | C-11, C-12 | VO-5 | npm test |
| FR-8, FR-9 | C-13..C-17 | VO-6 | npm test |
| FR-10, FR-11 | C-18, C-19 | VO-7 | npm test |
| FR-12 | C-20, C-21 | VO-8, VO-9 | npm test + fuzz |
| FR-13 | C-22, C-23 | VO-10 | npm test |
| FR-14 | C-24, C-25 | VO-11 | npm test |
| FR-15 | C-26, C-27 | VO-12 | npm test |
| FR-16, FR-17 | C-29 | VO-14, VO-16 | npm test + RV-1 |
| Errors | C-28 | VO-13 | npm test |
| QR-1..QR-8 | — | VO-15..VO-18 | 위 |

# Workflow Control
| item | value |
| --- | --- |
| correction batches used | 7 |
| verifier invocations | 2 |
| open finding ids | none (advisory A-2..A-6, Adv-1 남음) |

Audit state (one entry per obligation; retain prior decisions in the execution ledger):
| obligation id | spec version | evidence references and revision | accepted / open / invalidated / pending | rationale and mutation outcome | dependencies and reopening evidence |
| --- | --- | --- | --- | --- | --- |
| VO-1 | 6 | tests/layout-check.test.mjs VO-1 (svg filler, 내용 기준 보정) | accepted (verifier 2) | M1 검출 | FR-1 v6, harness.mjs |
| VO-2 | 6 | tests/layout-check.test.mjs VO-2 (any-side 전제, LTT.check 재실행) | accepted (verifier 2) | M2 검출 | FR-2 v3, harness.mjs |
| VO-3 | 6 | tests/layout-check.test.mjs VO-3 | accepted (verifier 2) | M3, M4 검출 | FR-4 v2 순서 |
| VO-4 | 6 | tests/kit-defects.test.mjs VO-4 | accepted (verifier 2) | 손 mutation 없음 | FR-5, FR-6 |
| VO-5 | 6 | tests/kit-defects.test.mjs VO-5 | accepted (verifier 2) | M5 검출 | FR-7 v2 |
| VO-6 | 6 | tests/kit-defects.test.mjs VO-6 | accepted (verifier 2) | M6 검출 | FR-8, FR-9 |
| VO-7 | 6 | tests/kit-defects.test.mjs VO-7 | accepted (verifier 2) | 손 mutation 없음 | FR-10, FR-11 |
| VO-8 | 6 | tests/kit-defects.test.mjs VO-8 | accepted (verifier 2) | M7 검출 | FR-12 v2 |
| VO-9 | 6 | tests/expect-compare.fuzz.mjs | accepted (verifier 2) | 차이 0 / 20,000 | FR-12 |
| VO-10 | 6 | tests/kit-defects.test.mjs VO-10 | accepted (verifier 2) | M8 검출 | FR-13 |
| VO-11 | 6 | tests/layout-check.test.mjs VO-11 | accepted (verifier 2) | M9 검출 | FR-14 |
| VO-12 | 6 | tests/rule-registry.test.mjs, generator-defects QR-7 | accepted (verifier 2) | M10 검출 | FR-15 |
| VO-13 | 6 | tests/layout-check.test.mjs VO-13 | accepted (verifier 2) | — | Errors |
| VO-14 | 6 | tests/kit-defects.test.mjs VO-14 | accepted (verifier 2) | — | FR-16(a) |
| VO-15 | 6 | npm test 1466/1466 ×2 (보정 7 뒤) | accepted (verifier 2) | — | 전체 |
| VO-16 | 6 | RV-1 (원장 5) | accepted (verifier 2) | — | 문서 5개 |
| VO-17 | 6 | RV-2 (원장 7) | accepted (verifier 2) | — | baseline |
| VO-18 | 6 | RV-3 (원장 7) | accepted (verifier 2) | — | 갤러리 audit 시간 |

Execution ledger (append attempts; preserve failed approaches):
| attempt | finding / failure signature | cause hypothesis | changed approach / new evidence | result / disposition |
| --- | --- | --- | --- | --- |
| 0 | base_commit npm test, 갤러리 audit | — | npm test 1338/1338 pass 205 s; `/usr/bin/time -p node scripts/gallery-audit.mjs` real 27.92 s, 두 크기 각 18건 | 기준 |
| 1 | npm test 1445/1454: box-overflow C-4 3종·summary·recall 미검출; api-docs 공개 이름 extra fixSvgText·renderedText·ruleIds, beforeAfter 두 문서; check-page C-16 미등록 rule `r`; 갤러리 baseline | 구현이 overflow 조상으로 잘라 잼(가설); 공개 이름 spec 누락(spec gap); 기존 테스트가 FR-15와 충돌(test defect); baseline은 예정된 변화 | spec v3, 보정 묶음 1(I-1..I-3, T-1..T-3) | I-1..I-3·T-1..T-3 반영; 2차 npm test 1452/1459 |
| 2 | VO-2 x5·summary·recall 여전히 실패; scene-types 공개 이름 oracle; perf 2건(diagram 20ms, map CLI 2775ms); RV-2 scene-overflow 오탐(cache 5px, investing 2px), gpu 가로 51px 원인 불명 | VO-2: flex 칸 안 width:2000px 빈 div가 줄어 실제로 안 넘침(verified: kit CSS .dk-tm .vis 등 display:flex) → test defect; scene-types: 묶음 1 sibling sweep 누락; perf: 같은 시각 audit 7페이지 병렬 실행 부하(가설, 재실행으로 확인); scene-overflow: scrollHeight가 섹션 안쪽 여백을 셈(가설, PNG 근거) | spec v4 FR-1 재정의, 보정 묶음 2(I-4, I-5, T-4..T-6) | 갤러리 scene-overflow 13→7; 남은 것 중 gpu s09(min-width 빈 폭), visual-hierarchy s08 11px, color-contrast s11 2px, cache s07 1px은 PNG상 가려진 내용 없음(오탐) |
| 3 | v4 요소 상자 기준 오탐 | 빈 상자 폭·배경도 요소 상자로 셈(verified: gpu 진단, PNG) | spec v5 내용 기준 측정, 보정 묶음 3(I-6, T-7) | 구현 첫 v5는 149건 오탐(line-height<1 글 줄 상자, `.dk-no` .86) → 세로 자르기 추가(v6 계약 기록); 갤러리 scene-overflow 2(vector-calculus s07 두 크기, 참) |
| 4 | npm test 1457/1461: VO-2 x5 전제 실패(contrast 자식 오른쪽 1239 < 칸 1415), 카드 summary·recall box-overflow [] ; 갤러리 baseline | 가운데 정렬 flex에서 자식이 양쪽으로 넘침 + contrast 지칭 글이 장면 제목(verified: 오류 문구); MutationObserver 주입이 같은 task의 check 뒤 마이크로태스크(verified: check가 prepare에서 mount·판정을 동기로 함) → 둘 다 test defect. perf 2건은 이번 실행 통과 → 지난 실패는 병렬 audit 부하(verified) | 보정 묶음 4(T-8, T-9) | 반영 |
| 5 | RV-1: rules.md scene-overflow 행이 v1 정의, box-overflow 잘림 규칙 누락, API.md 새 사실이 '원칙' 절(생성 agent가 읽는 네 절 밖, FR-16(d) 위반), 덱 아닌 페이지 보정 누락 | 문서가 v3–v6 계약 변경을 따라가지 못함(verified: git diff) | 보정 묶음 5(D-1..D-4) | 반영; npm test 1461/1461 (diagram PF1 perf는 4차 실행에서 부하로 1회 실패, 단독 3회 통과 12ms — 이번 변경 무관, ltt-parts.js는 표지 1줄) |
| 6 | 손 mutation M1–M10 | 선택 이유: 새 FR마다 판정 경계·분기·순서가 가장 깨지기 쉬운 곳 하나씩(넘침 임계, hidden 잘림, 10px 기준, 신호 직전 보정, 쪽 크기, 그려진 글, 비숫자 비교, clock 다시 그리기, @media, 등록부 가드) | seed.py backup → 주입 → 해당 테스트 파일 → restore | 10/10 의도한 VO 테스트가 검출(M1 VO-1 C-2 +8, M2 VO-2 v3 clipping, M3 VO-3 2건, M4 VO-3 signal time, M5 VO-5 7건, M6 VO-6 5건, M7 VO-8 9건, M8 VO-10 5건, M9 VO-11 2건, M10 VO-12 C-27); restore 모두 성공 |
| 7 | fuzz, RV-2, RV-3 | — | `node tests/expect-compare.fuzz.mjs` seed 1 20,000건; baseline 재생성 diff 검토; 갤러리 audit 시간 | fuzz 차이 0(경계 tol 1건 비교 제외); baseline: ontology 1→2(used-before-defined owl:hasKey, glossary 용어를 표시 없이 SVG 글에서 사용 — 참), matrix 1→2(vw-size `:has(> svg.hookart){width:min(440px,34vw)}` — 결함 18 원래 사례, 참), vector-calculus 1→2(scene-overflow s07 근거 줄 잘림 PNG 확인 — 참), scenes.html 1→8(vw-size 작가 inline `width:calc(n*min(8px,1vw))` 7개 — FR-14 정의상 참); 오탐 0. RV-3 28.58 s / 27.92 s = 1.02배 ≤ 1.25 |
| 8 | 검증 1회차 retry: F-1(VO-1 글 줄 넘침 양성·v6 세로 자르기 증거 없음), F-2(VO-6 mount 안 된 장면 행 전제 없음), F-3(VO-12 audit 가드 관찰 안 됨), F-4(RV-1 기록 불완전); 권고 A-1..A-7 | F-1..F-3 obligation evidence gap(test), F-4 main 검토 기록 누락 | 보정 묶음 6: T(F-1, F-2, F-3, A-1, A-7), I(QR-7 주석 2건), main RV-1 기록(아래 9) | 진행. 권고 A-2(위·왼쪽 방향, img·control, 1/2px), A-3(fuzz가 0 아닌 tol 정확 경계 비교 제외), A-4(쪽 나눔 중 recall 이벤트), A-5(VO-7·VO-13 추측 결함 목록 미기재), A-6(RV-2 PNG 경로 미기재 → 9에서 보충)은 비차단으로 남김 |
| 9 | RV-1 최종 기록(VO-16, 묶음 5 반영 뒤 base_commit 대비 `git diff`) | — | FR-16 항목별 위치: (a) SKILL.md:61 grep 줄 끝에 재검색 문장, API.md "부품 찾기"에서 삭제; (b) rules.md:5 원칙 문장 교체(넘침은 check, 결정적 보정은 kit, 겹침은 PNG), rules.md:34 used-before-defined가 그려진 글 포함으로 교체, 새 행 rules.md:15 unknown-icon·43 scene-overflow(v6 내용 기준)·44 box-overflow(잘림 규칙)·45 vw-size, check-failed 행에 측정 예외·등록부 문장 추가; (c) API.md:101 hook art 값·40% 칸, API.md:114 시각 칸 함수가 붙은 노드로 불림·figure 반환 (a)–(d)·형제 가로, API.md:110 summary 쪽 나눔 + deck-contracts.md:31 세부·:52 page-<k> 상태·shot 이름, API.md:47 expect 비교 규칙, API.md:14 `?shot` clock 다시 그리기·page 상태, API.md:116 SVG 10px 보정(덱·페이지)·카드 제목 줄바꿈·SVG tspan; (d) 위 사실은 모두 SKILL.md 또는 API.md 네 절(페이지 계약 14, 기본 이름 47, 덱 101–116) 또는 deck-contracts.md에 한 번씩, "원칙" 절에는 기존 vw 문장 확장만. 삭제·약화 문장: 삭제 3(API.md 재검색 문장 → SKILL.md로 이동, rules.md "레이아웃은 판정하지 않는다" → FR-16(b) 새 원칙, rules.md "mount·figure HTML·SVG 안의 글은 보지 않는다" → FR-8), 나머지 `-` 줄 8개는 같은 문장에 내용을 더한 교체(약화 없음: ?shot, expect, hook, summary, 시각 칸, compare, deckIssues, checkSource, check-failed). FR-17: SKILL.md 변경은 61행 1줄뿐, gate-gaps·release-docs 테스트 통과(npm test 1461/1461). QR-7: 새 주석 30개 검토, 위반 2(ltt-deck.js CELLS 위 변수 설명, ltt.js same 위 제어 흐름 서술) → 보정 묶음 6에서 제거 요청. RV-2 재현 절차: `node skills/learn-to-tell/server/audit.mjs site/gallery/<page> --shots <scratch>/rv2` 후 `<slug>-<size>-sNN.png` 확인(vector-calculus-mml5 1280x800 s07, gpu 1440x900 s09, cache-ttl 1280x800 s07, investing-basics 1280x800 s14, visual-hierarchy-spacing 1280x800 s08, color-contrast 1280x800 s11) | 기록 |
| 10 | 보정 묶음 6 결과: 3개 파일 121/124(F-1(b) 전제 실패 'block bottom 841 > 834', VO-3 두 건 ReferenceError t9) | 묶음 6 테스트 편집 결함(verified: 오류 문구) | 보정 묶음 7(T: 상한 변수 수정, F-1(b)를 페이지 안 이분 탐색으로 재구성) | 3개 파일 23/23·92/92·9/9, test-implementer 9회 중 1회 원인 미상 실패(미포착) → 이후 npm test 2회 연속 1466/1466 |
| 11 | 확인 mutation M11(글 노드 측정 제외), M12(audit 가드 제거), M13(세로 자르기 제거) | F-1·F-3·v6 자르기 증거 | seed.py backup → 주입 → 해당 테스트 → restore | M11 → VO-1 F-1(a) 검출, M12 → VO-12 F-3 audit clause 검출, M13 → VO-1 F-1(b)의 기대 [] 단언이 ['장면 3']로 실패(의도한 단언). F-2는 전제(장면 7 mount 안 됨) + 데이터/그려진 용어 분리 oracle로 결정적; M6(그려진 글 무시)은 mounted 대조 테스트가 검출. restore 모두 성공. QR-7 위반 2건 제거(묶음 6, CELLS 주석 삭제·same 주석 근거만) → 0 |
| 12 | 검증 2회차 pass | — | — | F-1..F-4 닫힘, 전 obligation accepted. 비차단: Adv-1(layout-check 9회 중 1회 미포착 일시 실패, 이후 npm test 2회 연속 통과), A-2..A-6, unused-term 권고가 그려진 글의 `{{}}` 표시를 세지 않음(FR-8 범위 밖, implementer 보고) |

# Version Log
## v1
- 초안. handoff `7a0ce2dc6e07a3ca` 남은 결함 중 코드 결함과 A-2·문장 이동(사용자 답 1-A, 2-A, 3).

## v1 승인
- brief v1 승인. summary 쪽 나눔은 사용자 답 A.

## v2
- 계약만 보충(test-implementer 지적): FR-4 `?shot`에서 작은 글자 보정은 clock 다시 그리기·상태 적용 뒤 마지막; FR-7 쪽 넘김 버튼 표지("이전"·"다음")와 "k / m" 글, 들어올 때의 쪽은 정하지 않음; FR-12 tol 경계는 `<=`.

## v3
- [보정 1] Signatures: ltt-deck.js가 쓰는 `LTT.fixSvgText`, `LTT.renderedText`를 공개 이름으로 선언(internals.md에만 정의). 근거: npm test api-docs 공개 이름 검사가 선언 안 된 이름 두 개를 잡음.
- FR-2 잘림 처리 명시: hidden/clip으로 잘린 것도 넘침, auto/scroll 조상 아래는 그 조상 상자로 잰다. VO-2 coverage에 잘림 2개 추가. 근거: 구현이 overflow 조상으로 잘라 재서 C-4 5종 중 3종과 summary·recall을 놓침(npm test).

## v4
- [보정 2] FR-1 측정 정의를 그려진 요소 상자 기준으로 바꿈. 근거: RV-2에서 갤러리 PNG(cache-ttl 1280 s07 5px, investing 1280 s14 2px)는 가려진 내용이 없는데 `scrollHeight`가 섹션 안쪽 여백을 세어 오류가 남; vector-calculus 1280 s07 76px은 실제로 근거 줄이 잘림(참). C-2·VO-1에 여백만 넘침 항목 추가.
- VO-2 fixture 결함 기록: flex 칸 안 `width:2000px` 빈 div는 줄어들어 넘치지 않음 → 테스트가 실제 넘침(줄지 않는 자식)을 만들고 그 전제를 확인해야 함.

## v5
- [보정 3] FR-1 측정 대상을 요소 상자에서 내용(글 줄 상자, 그림·미디어, 컨트롤)으로 좁힘. 근거: v4 구현으로 갤러리 PNG 확인 — gpu s09 가로 51/130px은 `.readout .ltt-stat{min-width:9em}` 빈 폭(글은 1284px에서 끝남, 구현자 진단), visual-hierarchy 1280 s08 11px·color-contrast 1280 s11 2px·cache 1280 s07 1px은 가려진 내용 없음. vector-calculus s07은 근거 글 줄이 잘려 참으로 남아야 함. C-2·VO-1에 빈 폭 항목 추가.

## v6
- 계약 기록: FR-1 글 줄 상자는 세로로 가장 가까운 비inline 조상 상자로 자른다. 근거: implementer의 v5 첫 구현에서 line-height < 1 글(`.dk-no`) 때문에 갤러리 149건 "세로(위)" 오탐. 대가: 높이 고정·overflow visible 블록 밖으로 넘친 글은 글 경로로는 안 잡힘(블록 자체가 장면 밖이면 잡힘).

## 완료
- 검증 2/2회(1회 retry → 2회 pass), 보정 묶음 7회, 손 mutation 13개 모두 검출, fuzz 20,000건 차이 0. status complete.
