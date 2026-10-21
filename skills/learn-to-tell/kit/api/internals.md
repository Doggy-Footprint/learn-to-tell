kit 개발자용 · 수업에서 부르지 않는 kit 내부 이름이다. kit 모듈끼리, 테스트, 서버 쪽 계산이 쓴다.

# kit 내부 이름

| 이름 | 설명 |
| --- | --- |
| `LTT.kitBase` | `ltt.js`를 불러온 `<script>`의 디렉터리 URL(알 수 없으면 `/kit/`). 폰트와 지도 데이터(`vendor/world-atlas/countries-110m.json`)를 이 위치 기준으로 찾는다. |
| `LTT.lessonId(pathname)` | `/lessons/<id>/` 경로에서 lesson id를 꺼낸다. 아니면 `null`. `record`가 이 값이 있을 때만 서버로 보낸다. |
| `LTT.compare(actual, expected, tol)` | `expect`의 수치 대조 → `{ok, diff, tol}`. `tol`이 없으면 `1e-9 × max(1, \|expected\|)`. |
| `LTT.termsIn(text)` | 문자열 속 `{{용어}}`·`{{보이는 말\|용어}}` 표시를 나온 순서대로 `[{key, shown}]`로. |
| `LTT.sceneText(scene)` | 장면에서 독자가 읽는 글 필드만 모아 한 문자열로(`type`·`tone`·`answer`·`id` 같은 필드와 DOM 노드는 뺀다). lint가 쓴다. |
| `LTT.termIndex(spec)` | glossary 용어마다 처음 표시되거나 terms 장면에서 정의된 장면 번호 `{용어: 번호}`. |
| `LTT.rectHit(a, b)` | 두 사각형 `{x0, y0, x1, y1}`가 0.5px 넘게 겹치는가. |
| `LTT.freeSlot(region, size, solids, gap, step)` | `region` 안에서 모든 `solids`와 `gap`만큼 떨어진 `size` 상자의 첫 왼쪽 위 자리(위 줄부터 훑는다), 없으면 `null`. 펼친 predict 정답 배치가 쓴다. |
| `LTT.stepValues(min, max, step, cap)` | 손잡이가 가질 수 있는 값 목록. 길면 양 끝을 포함해 고르게 `cap`개(기본 201)만. `?audit`의 목표 판정용. |
| `LTT.goalReach(lists, check, start, limit)` | 손잡이 값 조합마다 `check`를 불러 맞는 자리 수 `{samples, hits, start}`. 조합이 `limit`(기본 20000)를 넘으면 고정 시드로 표본을 뽑는다. |
| `LTT.setGlossary(defs, first)` | `linkTerms`와 팝오버가 쓸 용어 풀이와 용어별 첫 장면을 정한다. 풀이는 합쳐지고 같은 용어는 먼저 등록된 것이 남는다(`#ltt-meta`의 `glossary`가 가장 먼저 읽힌다). 덱이 시작할 때 부른다. |
| `LTT.auditScene(m)` | 그려진 장면 하나의 측정값으로 `?audit` 레이아웃 규칙을 판정 → `[{rule, msg}]`. 목표 규칙은 `goal-narrow`만 낸다(`goal-unreachable`·`goal-at-start`는 `goalIssues`). |
| `LTT.termIssues(units, glossary)` | 용어 검사 → `[{where, rule, msg}]`. `units: [{where, text, defines?, skipUnknown?}]`는 읽는 순서의 단위(덱은 장면, 페이지는 구역), `text`의 `{{}}`가 표시다. 단위마다 `unknown-term` → `used-before-defined` → `filler-content` 순. `defines`는 그 단위가 정의하는 key(terms 장면), `skipUnknown`은 `unknown-term`을 건너뛴다. |
| `LTT.goalIssues(goals)` | `goals: [{where, hits, samples, start}]`마다 `goal-unreachable`(`hits`가 0) → `goal-at-start`(`start`) → `[{where, rule, msg}]`. |
| `LTT.deckIssues(spec, extraGlossary)` | 덱 장면 데이터의 `unknown-term`(terms 항목의 plain 누락 포함)·`used-before-defined`·`predict-new-term`·`filler-content` → `[{where: "장면 n", rule, msg}]`. `extraGlossary`(`{용어: 풀이}`)의 key도 풀이가 있는 용어로 치고, key 순서는 등록 순서(`extraGlossary` → `spec.glossary` → terms 장면)다. |
| `LTT.checkSource({issues, prepare, whereOf})` | `check()`가 쓸 검사 원천을 등록한다(덱이 등록한다). 등록하지 않은 페이지는 `body`의 구역을 쓴다. `issues(glossary)` → 정적 오류 목록, `prepare()`는 검사 전에 불린다(덱은 `?check`·`?audit`이면 모든 장면을 그린다), `whereOf(el)`은 목표 요소가 속한 위치 문자열. |
| `LTT.mobile()` | `<html data-ltt-mobile>`가 붙어 있는가(폰 재배치 중인가). |
| `LTT.placement` | `{zoomLock}`. `zoomLock(question, zs)` → 배율. `question`은 질문 상태(정답 숨김)를 상한 1에서 맞춘 배율, `zs`는 선택지별 정답을 흐름 안에 둔 상태를 상한 1에서 맞춘 배율의 배열. `Math.min(question, ...zs)`를 돌려주고 `zs`가 비면 `question`. 잘못된 입력(`question`이나 원소가 number가 아니거나 유한수가 아니거나 0 이하이거나 1 초과, `zs`가 배열이 아님)이면 1. DOM·전역을 읽지 않고 인자를 바꾸지 않는다. predict 배율 잠금이 `ctx.zmax`를 이것으로 정한다. |
| `LTT.measure(fn)` | `fn`을 측정 모드로 실행한다. 그동안 diagram·sequence·map의 `send` 패킷(단계 반복 포함)은 아무것도 하지 않는다. 덱이 figure 단계·predict 정답을 미리 잴 때 쓴다. |
| `LTT.$` | `ltt-parts.js`의 `document.getElementById(id)` 줄임. |
| `LTT.sceneTypes` | 장면 타입 이름 → 메타 entry 표. 덱·lint·audit이 타입 성질을 이 표에서 읽는다(아래 "장면 타입 메타 표"). |
| `LTT.deckTypes` | `LTT.sceneTypes`와 같은 객체(덱 쪽 옛 이름). |

## 장면 타입 메타 표

`LTT.sceneTypes`는 프로토타입 없는 객체라 `"constructor"`·`"toString"` 같은 이름도 표에 없는 타입이다. `ltt.js`가 불러올 때 12개 entry의 빠진 메타 필드를 기본으로 채우고, 읽는 쪽도 entry가 없거나(표에 없는 타입, 타입 없는 장면) 필드가 `undefined`면 그 필드의 기본을 쓴다. 그래서 실행 중에 일부 필드만 가진 entry를 더해도 lint·audit에 반영된다.

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
| `cardGrid` | `false` 또는 `function(s, scenes) → boolean` | lint `card-monotony`의 카드 격자 장면 | false | explain: `!s.form \|\| s.form === "cards"`; compare: `s.form !== "table"`; summary: 카드(`LTT.summaryCards`) 중 `recall`이 있는 것이 없다; terms: 항상 true |
| `signature` | boolean | lint `no-signature`의 그림 주인공 장면 | false | true: figure, contrast |
| `auditHero` | boolean | audit `small-visual` 22% 기준과 `empty-stage` 판정 | false | true: figure |
| `auditSmallVisual` | boolean | audit `small-visual`을 판정한다 | true | false: hook, terms, summary, keywords, statement, predict |
| `auditLooseFigure` | boolean | audit `loose-figure`를 판정한다 | false | true: figure |
| `render` | `function(s, body, ctx) → {enter?}` | 장면 본문을 그린다. `ltt-deck.js`가 불러올 때 붙인다 | (없음, 덱이 `{}`로 본다) | 12개 전부 |

타입 이름과 무관한 판정은 코드에 남는다: 타입 없는 장면의 `mount`는 `needsReadingGuide`·`signature`와 같은 효과, `layout: "full"`은 `signature`·`auditHero`와 같은 효과, 작가가 적은 `layout`은 `fullByDefault`·`autoSplit`보다 우선한다. terms·summary·overview·predict·keywords의 고유 내용 규칙(`unknown-term`·`term-no-visual`·`summary-no-recall`·`overview-no-visual`·`predict-new-term`·`keywords-last`·`overview-missing`·`overview-order`)과 figure 캡션 번호는 메타가 아니라 타입 이름을 쓴다.

새 장면 타입은 `ltt.js`의 표에 entry 하나(기본과 다른 필드만)와 `ltt-deck.js`의 `RENDERS`에 render 하나로 더한다. render는 있는데 entry가 없으면 `ltt-deck.js`를 불러오는 중 그 타입 이름을 담은 `Error`가 나고 `LTT.deck`이 정의되지 않는다. entry만 있고 render가 없으면 본문이 빈 장면이 된다.

## ctx 계약

타입 render와 장면의 `mount(body, ctx)`(그리고 `enter(body, ctx)`)는 같은 ctx를 받는다.

| 이름 | 때 | 계약 |
| --- | --- | --- |
| `ctx.el` | 받음 | 장면 `section`. `el.firstChild`가 배율을 받는 안쪽 상자다. |
| `ctx.scene`, `ctx.index` | 받음 | 장면 spec과 0부터 센 장면 번호. |
| `ctx.scenes` | 받음 | 덱의 장면 배열. 지식 지도 장면이 나중에 뒤에 붙을 수 있다. |
| `ctx.predictRest` | 받음 | 덱 spec의 `predictRest` 값. |
| `ctx.refit()` | 그리는 동안 | 현재 `ctx.zmax` 아래에서 배율을 맞추고 그 배율을 돌려준다. |
| `ctx.float(panel, host, skip, keepFaded)` | 그리는 동안 | `panel`을 장면의 빈자리에 띄우면 `true`, 빈자리가 없으면 흐름에 붙이고 배율을 다시 맞춘 뒤 `false`. |
| `ctx.fit()` | 그린 뒤 | render·`mount`가 돌아온 뒤에 붙으므로 render 안에서 바로 부르지 않고 이벤트·비동기 콜백에서 부른다. 데스크톱에서는 `ctx.place`가 있으면 그것을, 없으면 기본 배율 맞춤을 하고, 폰에서는 `ctx.unplace`(있으면) 후 폰 재배치를 한다. |
| `ctx.gate` | 건다 | `{btn, alt?, word}`. 공개 전 첫 다음 이동(다음 버튼·스와이프, 그리고 화면 속 stepper가 받지 않은 →·PageDown 키)은 넘어가지 않고 `btn`(꺼져 있고 `alt`가 있으면 `alt`)을 가리키며 `word`로 안내한다. 같은 장면에서 한 번 더 이동하면 넘어간다. `alt`가 있고 `btn`이 켜져 있으면 다음 이동이 대신 `btn`을 누른다. `btn`이 꺼져 있고 `alt` 안에 눌린 선택지(`aria-pressed=true`)가 있으면 그 이동은 무시된다. 마지막 장면에서는 막기와 누르기가 없다. 공개하면 `null`로 둔다. |
| `ctx.place()` | 건다 | 데스크톱 배치·배율을 스스로 맡는다. 데스크톱에서 진입·창 크기·글꼴 로드·`?audit`, 그리고 장면이 `ctx.fit()`을 부를 때마다 반복해 불린다. |
| `ctx.unplace()` | 건다 | 폰으로 갈 때 `place`가 남긴 인라인 상태를 되돌린다. |
| `ctx.back` | 건다 | 함수. ←·PageUp 키가 이전 장면으로 가는 대신 이것을 부른다. |
| `ctx.zmax` | 건다 | 배율 상한(없으면 1). `refit`·`float`·기본 배율 맞춤이 따른다. |

render는 `{enter}`(또는 `{}`)를 돌려준다. `enter`는 방문할 때마다 `fit()` 전에 불린다(이어서 `mount`가 돌려준 `enter`, points 다시 그리기, 장면 `enter` 순). `leave`는 장면 `mount`가 돌려준 것만 다른 장면으로 갈 때 쓰이고, render가 돌려준 `leave`는 쓰이지 않는다. `?audit`은 모든 장면을 mount하고 `fit()`을 부른 뒤 잰다. 방문하지 않은 장면은 `enter` 없이 `fit()`만 불리므로 `place`는 `enter` 전에도 동작해야 한다.

## placement

`ltt-deck.js`의 지역 `placement`가 미리 그려 재기(측정 모드, `.dk-still`, 끝난 뒤 원상 복구), 창 크기 키(창 너비·높이와 `document.fonts.status`) 비교, predict 배율 잠금, summary recall 답 자리 예약을 맡는다. 타입 render는 상태를 열거하는 함수와 요소만 넘기고 크기를 직접 읽지 않는다.

- figure `steps`: 단계 수, 단계 k를 그리는 함수(`enter(k, fig, 1)`), 현재 단계 번호, 그림 상자·자막 칸·행.
- predict: 선택지 목록(`잘 모르겠다` 포함), 선택지별 `answerVisual` 그리기, 정답 패널과 host, 공개 상태 여부와 고른 값. 측정은 버튼 표시를 건드리지 않는다.
- summary recall: 답 요소. 예약은 자리를 남긴 채 숨기고 해제는 보인다.
- 크기 키는 측정을 시작할 때 기록되므로, 측정이 throw하면 다음 키 변경 때 다시 잰다.

## 측정 모드

- `LTT.measure(fn)` 안에서는 diagram·sequence·map의 `send`와 단계 반복 send가 아무것도 하지 않는다. `LTT.record`는 꺼지지 않는다.
- `.dk-still`이 붙은 상자 안은 CSS transition이 꺼진다.
- figure `steps`: `place`할 때 창 크기나 글꼴 상태가 지난번 측정과 다르면 모든 단계의 `enter`를 측정 모드에서 차례로(배치에 따라 여러 번) 미리 부르고, 측정 모드 밖에서 현재 단계의 `enter`를 다시 부른다. 그래서 `enter`는 멱등이어야 한다.
- predict 함수형 `answerVisual`: `place`할 때 창 크기나 글꼴 상태가 지난번 측정과 다르면 측정 모드로 미리 불린다. 공개 뒤에도 창 크기가 바뀌면 다시 불리고, 측정이 끝나면 고른 값으로 한 번 더 불려 공개 모습을 다시 그린다(`s.reveal`·`LTT.record`는 부르지 않는다). 인자를 둘 이상 받으면 선택지마다(`unsure: false`가 아니면 `잘 모르겠다` 포함), 아니면 한 번(HTML 문자열 `answerVisual`도 한 번). 같은 입력이면 같은 크기를 내고 동기로 그려야 하며 전역 상태·기록을 건드리지 않는다.

## lint 규칙 추가

`LTT.lintDeck`은 `ltt.js`의 지역 배열 `RULES`로 돈다(용어·채움 글 규칙은 `deckIssues`로 옮겨 `lintDeck`에 없다). 항목은 `{id, scene(s, i, c)}` 또는 `{id, deck(c)}` 중 하나이고, `c`는 덱마다 한 번 만드는 `{spec, scenes, glossary, first}`다(`glossary` = `spec.glossary` 키 뒤에 terms 장면 key, `first` = `LTT.termIndex(spec)`; `unused-term`이 쓴다). 규칙은 `[index, rule, msg]` 배열을 돌려준다. `index`는 0부터 센 장면 번호이고 덱 전체 경고는 -1이다(출력 `scene`은 `index + 1`). `scene` 규칙은 장면마다(장면 순서) 등록 순서로, 이어서 `deck` 규칙이 등록 순서로 돈다. 등록 순서가 곧 출력 순서이므로 새 규칙을 넣는 자리가 경고 순서를 정한다.

## CSS를 고치려면

- 다섯 모듈의 정적 CSS는 `kit/<모듈>.css`(`ltt.css`·`ltt-parts.css`·`ltt-ui.css`·`ltt-mock.css`·`ltt-deck.css`)에서 고친다. 런타임은 `.css`를 요청하지 않고 JS 안 문자열을 `<style>`로 넣는다.
- 고친 뒤 `npm run build:css`로 JS 안 문자열을 다시 만든다. JS의 `/* css:start <모듈>.css */`와 `/* css:end */` 사이 구간은 생성 결과라 손으로 고치지 않는다.
- `.css`와 생성 구간이 어긋나면 `npm test`와 `node scripts/build.mjs css --check`(pre-commit)가 실패한다.
- 테마 토큰(`:root` 토큰 블록, 다크 블록, `themeCss()`)과 `@font-face`는 `ltt.js`에 남는다. `ltt.css`는 `body`부터이고, 생성 구간은 이 블록들 뒤, `themeCss()` 출력 앞에 붙는다.
- 생성 문자열에서 달라지는 것은 주석·공백·`}` 앞 `;`뿐이다. 규칙 순서·선택자·값은 `.css`에 쓴 그대로 들어간다.
