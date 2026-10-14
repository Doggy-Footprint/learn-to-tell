# kit API

수업은 빈 `lesson.html`에서 이 부품들을 조합해 짠다. 모든 부품이 실제로 동작하는 모습과 그 코드는 `/gallery/catalog.html`에 있다. 장면 타입별 예시는 `/gallery/scenes.html`에 있다.

## 불러오기

순서를 지킨다. 뒤 모듈이 앞 모듈을 쓴다.

```html
<link rel="stylesheet" href="/kit/vendor/katex/katex.min.css">  <!-- 수식이 있을 때만 -->
<script src="/kit/vendor/d3.min.js"></script>
<script src="/kit/vendor/plot.umd.min.js"></script>              <!-- Plot을 쓸 때만, 전역 Plot -->
<script src="/kit/vendor/katex/katex.min.js"></script>           <!-- 수식이 있을 때만 -->
<script src="/kit/ltt.js"></script>       <!-- 토큰·폰트·아이콘·용어·기록·검증 -->
<script src="/kit/ltt-parts.js"></script> <!-- 움직이는 그림 -->
<script src="/kit/ltt-ui.js"></script>    <!-- 설명 부품 -->
<script src="/kit/ltt-mock.js"></script>  <!-- 목업, 쓸 때만 -->
<script src="/kit/ltt-deck.js"></script>  <!-- 장면 덱 -->
```

페이지에는 모델 함수, 기대값, 장면 데이터, 그 수업에만 필요한 작은 CSS를 둔다. 색은 아래 토큰만 쓴다. hex를 새로 적으면 다크 모드가 깨진다(목업 속 '실제 화면' 색은 예외).

## ltt.js: 기초

| 이름 | 설명 |
| --- | --- |
| 토큰 | `--ltt-bg` `--ltt-card` `--ltt-card-2` `--ltt-line` `--ltt-line-2` `--ltt-ink` `--ltt-ink-2` `--ltt-muted` `--ltt-accent(-soft)` `--ltt-good(-soft)` `--ltt-bad(-soft)` `--ltt-warn(-soft)` `--ltt-dark` `--ltt-on-dark` `--ltt-shadow` `--ltt-font` `--ltt-mono`. 다크 모드는 `prefers-color-scheme`를 따르고, `<html data-theme="light|dark">`로 고정할 수 있다. |
| 폰트 | Pretendard Variable(`/kit/vendor/pretendard/`). 숫자·코드는 `var(--ltt-mono)`. |
| `LTT.icon(name, {weight, cls})` | 선 아이콘 SVG 문자열. 이름 목록은 `LTT.icons`. hook `art`, explain·terms·facts `icon`, diagram 노드 `icon`에는 이름만 넘긴다. 이모지도 받는다. |
| `{{용어}}`, `{{보이는 말\|용어}}` | 본문 속 용어 표시. 덱이 풀이 팝오버로 바꾼다(마우스 올리기·탭). 처음 나온 장면은 진하게 표시된다. |
| `LTT.linkTerms(el, sceneIndex)` | 덱 밖이나 나중에 그린 DOM의 `{{}}`를 바꾼다. 덱은 장면 마운트, predict 공개, compare 공개, stepper 자막에서 알아서 부른다. |
| `LTT.lintDeck(spec)` | 독학 기준 점검. `[{scene, rule, msg}]`. 덱이 시작할 때 실행해 경고를 화면 오른쪽 아래 패널에 띄우고 `lint` 이벤트로 남긴다. 규칙은 아래. |
| `LTT.record(type, data)` | lesson 페이지에서만 서버로 이벤트를 보낸다. |
| `LTT.expect(label, actual, expected, {tol})` | 기대값 대조. 불일치는 패널과 서버에 남는다. |
| `LTT.warn(msg)` | 패널에 경고 한 줄. |

### lint 규칙

| rule | 뜻 |
| --- | --- |
| `unknown-term` | `{{x}}`인데 `glossary`에도 `terms` 장면에도 풀이가 없다 |
| `used-before-defined` | glossary 용어가 처음 `{{}}`로 표시되기 전 장면에 그냥 쓰였다 |
| `too-many-terms` | 한 장면에서 새로 나온 용어가 2개 초과(terms 장면은 4개 초과) |
| `predict-before-explain` | 설명 장면보다 predict가 먼저 |
| `predict-new-term` | predict의 질문·선택지에서 처음 나온 용어 |
| `many-predicts` | predict가 2개 이상 |
| `no-reading-guide` | compare·contrast·커스텀 그림 장면에 `narration`·`points`·`sub`가 없다 |
| `no-title` | 제목 없는 장면(hook·summary·keywords 제외) |
| `long-narration` | 해설이 4문장 초과 |
| `many-points` | 번호 주석 3개 초과 |
| `keywords-last` | 마지막 장면이 keywords가 아니다 |
| `unused-term` | glossary에 넣고 어디에도 표시하지 않았다 |

공개 전 경고는 0건이어야 한다. lint는 표시된 용어만 안다. 표시하지 않은 전문 용어는 독자 검토(SKILL.md)로 잡는다.

## ltt-ui.js: 설명 부품

모두 DOM 노드(또는 HTML 문자열)를 돌려준다. 장면의 `visual`·`mount`·`aside`에서 쓴다.

| 이름 | 언제 |
| --- | --- |
| `LTT.narration(html \| [html])` | 그림만으로 이유가 안 보일 때. 원인 → 과정 → 결과를 2–4문장. 장면에서는 `narration` 필드. |
| `LTT.annotate(target, points, {tone})` → `{list, markers, replay}` | 그림 위 번호 ↔ 해설 목록. `points: [{at: [x%, y%], title, text, tone}]`. `at`이 없으면 목록에만 나온다. tone: accent(기본)·good·bad(✕ 표시)·warn. 장면에서는 `points` 필드. |
| `LTT.beforeAfter({before, after})` → `{el, before, after, replay}` | 같은 대상의 실패 예와 고친 예. 각 쪽 `{visual, points, foot: {label, visual, caption}, label, tone, pointsOn}`. 장면에서는 `type: "contrast"`. |
| `LTT.facts([{icon, value, label, tone}])` | 상황의 조건을 숫자 카드로. predict의 `visual`에 넣으면 무엇을 근거로 짐작할지 보인다. |
| `LTT.chips([text \| {text, tone, icon, dot}])` | 키워드 묶음. 장면에서는 `chips` 필드(제목 아래). |
| `LTT.badge(kind, text)` | before·after·good·bad·warn·accent 상태 표시(문자열). |
| `LTT.callout(html, {tone, title, icon})` | 흔한 오해나 주의 한 가지. |
| `LTT.swatches([{color, label, w, h, r, border}], {caption})` | '무엇을 썼나'를 실물 견본으로. 색·크기·모서리 값 목록. |
| `LTT.takeaway(text, sources)` | 검은 '핵심' 바 + '찾아볼 곳'. 장면에서는 `takeaway`·`sources` 필드. |
| `LTT.h(tag, cls, html)`, `LTT.fill(node, v)` | 작은 DOM 도우미. `fill`은 문자열·노드·함수(노드를 채우거나 노드/문자열을 돌려줌)를 받는다. |

## ltt-mock.js: 목업

모두 `{el, screen}`을 돌려준다. 내용은 `screen`에 넣고, 번호 주석은 `el`에 건다(틀 기준 %).

| 이름 | 옵션 |
| --- | --- |
| `LTT.mock.phone(o)` | `width`(px), `ratio`(기본 `"9/17.5"`), `dark`, `bg`, `time`, `content` |
| `LTT.mock.browser(o)` | `url` 또는 `title`, `width`, `height`, `bg`, `content` |
| `LTT.mock.terminal(o)` → `+ add(line)` | `title`, `lines: ["$ 명령", "출력", {t: "ok"\|"err"\|"dim"\|"out"\|"cmd", text}]` |
| `LTT.mock.code(o)` → `+ line(n)` | `code`(원문 그대로), `title`, `marks: {줄번호: "good"\|"bad"\|"accent"\|"warn"}`, `start`, `numbers: false` |

UI 예시는 맨 HTML 조각보다 목업에 넣는다. 목업 안의 색은 '실제 화면'이라 토큰 대신 hex를 써도 된다.

## ltt-parts.js: 움직이는 그림

| 이름 | 설명 |
| --- | --- |
| `LTT.diagram(svg, spec)` | 격자 좌표 다이어그램. `spec: {cols, rows, cell: [w, h], node: [w, h], pad, maxWidth, label, nodes, edges, zones}`. 노드 `{id, c, r, l, s, k, icon, flaw, w, h}`(c·r은 소수 가능), 엣지 `{f, t, l, lo: [dx, dy], k, dash, both, arrow: false, id}`, 영역 `{c0, r0, c1, r1, l, k}`. k: accent·good·bad·warn·muted·dark. |
| `.highlight(ids)` | 노드·엣지(`"from>to"`) 외에는 흐리게. 빈 배열·null이면 해제. |
| `.flow(edgeIds)` | 진행 방향을 보이는 점선 흐름. 방향을 알려야 할 때만. |
| `.send(from, to, {count, color, ms, gap, r})` → Promise | 엣지를 따라 패킷이 이동. |
| `.player(el, steps, {interval})` | 단계 재생. `steps: [{caption, hot, flow, send: [[from, to, opts]], enter(dg, i)}]`. 자막이 그림 읽는 법을 말한다. |
| `LTT.diagramLayout(spec)` | 좌표만 계산(테스트·커스텀 그림용). |
| `LTT.stepper(el, [{caption, enter(i, dir)}], {interval, onStep})` | 한 그림을 단계별로. `enter`는 다시 들어와도 같은 화면이 되게 짠다. |
| `LTT.units(el, n, cols).paint(k, cls, alt)` | 단위 그림(100칸 = 100건). |
| `LTT.bar(el, [{color}]).set(values, labels)` | 비율 막대. |
| `LTT.tween(el, to, fmt, ms)` | 숫자 변화. |
| `LTT.sweep({params: {id: {map, fmt}}, render, presets})` | range 입력 → `render(values)`. 조작 자체가 배움일 때만, 실사용 범위만. |
| `LTT.predict({...})` | 첫 짐작을 잠그고 기록. 덱의 predict 장면이 쓴다. |
| `LTT.plane(svg, {range, vectors, shape}).to(m)` | 2×2 행렬 변환. |
| `LTT.sim({init, step, draw, until, dt, onEnd})` | 고정 간격 시뮬레이션. `runToEnd()`는 화면 없이 결과만. |
| `LTT.math(scope)` | `data-tex` 요소를 KaTeX로. |
| `LTT.MOTION_MS` | 기본 모션 길이. reduced-motion이면 0. |

## ltt-deck.js: 장면 덱

`LTT.deck({title, glossary: {용어: 풀이}, scenes})`. 장면 하나 = 메시지 하나 = 스크롤 없는 한 화면. ←/→ 키, `#n` 해시, `scene` 이벤트.

### 모든 장면의 공통 필드

| 필드 | 뜻 |
| --- | --- |
| `kicker` | 제목 위 작은 알약(맥락) |
| `title`, `en` | 주장 문장으로 쓴 제목, 영문 보조 제목 |
| `sub` | 제목 아래 한두 줄(상황, 읽는 법) |
| `chips` | 제목 아래 키워드 |
| `narration` | 해설 2–4문장. 있으면 그림 옆 설명 레일이 생긴다 |
| `points`, `pointsOn`, `pointsTone` | 번호 주석. 대상은 `pointsOn` 셀렉터, 없으면 `[data-annotate]`, 없으면 본문의 첫 요소 |
| `takeaway`, `sources` | 핵심 한 문장과 찾아볼 곳. summary 장면이 모은다 |
| `ask` | agent에게 할 질문 한 줄. summary 카드에 붙는다 |
| `aside` | 설명 레일에 넣을 추가 부품 |
| `basis`, `tex` | 근거 한 줄, 접힌 수식 |
| `mount(body, ctx)` → `{enter, leave}`, `enter` | 커스텀 그림. ctx: `{el, scene, index, scenes}` |
| `layout` | `"split"`(그림 \| 설명 레일) 또는 `"stack"`(설명 위, 그림 전체 폭). 기본은 narration·points가 있으면 split |
| `bare` | split에서 본문 카드 테두리를 없앤다(그림이 이미 패널일 때) |
| `number: false` | 큰 장면 번호를 숨긴다 |

### 장면 타입

| type | 필드 |
| --- | --- |
| `hook` | `art`(아이콘 이름·이모지·HTML), `pre`, `text`, `sub`, `kicker`, `chips`. 첫 장면 |
| `terms` | `terms: [{key, word, en, icon, plain, example}]`. 용어를 쉬운 말로 먼저 푼다. key는 glossary에 자동 등록 |
| `explain` | `steps: [{icon, title, text, visual}]`, `arrows`. 원인 → 과정 → 결과 |
| `contrast` | `before`, `after`(위 beforeAfter의 각 쪽) |
| `compare` | `items: [{label, visual, tone, verdict, note, noteAfter, enter, onReveal}]`, `cols`, `reveal`, `revealLabel` |
| `predict` | `choices`, `answer`, `question`, `hint`, `visual`, `answerVisual`, `why`, `button`, `unsure`, `reveal` |
| `summary` | 앞 장면의 `takeaway`를 카드로 모은다. `cards`로 직접 줄 수도 있다. `extra: {title, text}`는 검은 카드 |
| `keywords` | `terms: [{ko, en}]`, `signals`, `queries`, `neighbors: [{term, diff}]`. 마지막 장면 |
| (없음) | `mount`로 그리는 커스텀 장면 |
