# kit API

수업은 빈 `lesson.html`에서 이 부품들을 조합해 짠다. 모든 부품이 실제로 동작하는 모습과 그 코드는 `/gallery/catalog.html`에 있다. 장면 타입별 예시는 `/gallery/scenes.html`에 있다.

## 불러오기

순서를 지킨다. 뒤 모듈이 앞 모듈을 쓴다.

```html
<link rel="stylesheet" href="/kit/vendor/katex/katex.min.css">  <!-- 수식이 있을 때만 -->
<script src="/kit/vendor/d3.min.js"></script>
<script src="/kit/vendor/plot.umd.min.js"></script>              <!-- Plot을 쓸 때만, 전역 Plot -->
<script src="/kit/vendor/katex/katex.min.js"></script>           <!-- 수식이 있을 때만 -->
<script src="/kit/vendor/d3-sankey.min.js"></script>             <!-- LTT.sankey를 쓸 때만 -->
<script src="/kit/vendor/topojson-client.min.js"></script>       <!-- LTT.map을 쓸 때만 -->
<script src="/kit/vendor/prism/prism.min.js"></script>           <!-- mock.code의 lang을 쓸 때만 -->
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
| `LTT.theme(name)`, `LTT.themes` | 도메인 테마를 고른다. 덱에서는 `LTT.deck({theme})`로 넘긴다. 테마는 토큰 값과 표면(모서리, 그림자, 제목 폰트, 배경 격자)만 바꾸므로 같은 부품이 다른 매체처럼 보인다. 아래 표. |
| 토큰 | `--ltt-bg` `--ltt-card` `--ltt-card-2` `--ltt-line` `--ltt-line-2` `--ltt-ink` `--ltt-ink-2` `--ltt-muted` `--ltt-accent(-soft)` `--ltt-good(-soft)` `--ltt-bad(-soft)` `--ltt-warn(-soft)` `--ltt-dark` `--ltt-on-dark` `--ltt-on-accent` `--ltt-accent-on-dark` `--ltt-shadow` `--ltt-font` `--ltt-font-display` `--ltt-mono` `--ltt-r-lg` `--ltt-r-md` `--ltt-r-sm`, 범주형 `--ltt-c1`…`--ltt-c6`, 지도 `--ltt-sea` `--ltt-land` `--ltt-border`. 다크 모드는 `prefers-color-scheme`를 따르고, `<html data-theme="light|dark">`로 고정할 수 있다. |
| 폰트 | 본문 Pretendard Variable, 세리프 `'LTT Serif'`(Noto Serif KR), 모노 `'LTT Mono'`(D2Coding). 세리프·모노는 KS X 1001 한글 2,350자 + 라틴 subset이라 빠진 음절은 시스템 폰트로 그린다. 숫자·코드는 `var(--ltt-mono)`, 세리프 제목은 테마의 `--ltt-font-display`. |
| `LTT.palette()`, `LTT.palette(theme, "light"\|"dark")` | 범주형 색 6개 배열. 인자 없이 부르면 지금 페이지의 테마·다크 모드 값. 계열 구분에만 쓰고 판정(good·bad)에는 쓰지 않는다. 모든 테마에서 배경 대비 3:1 이상, 색각 이상(적록·청황) 시뮬레이션에서도 구분된다(`tests/kit.test.mjs`). |
| `LTT.mark(kind, {size, color, weight, fill, inline})` | 모양 표식 SVG 문자열(square, ring, dot, diamond, cross, 목록은 `LTT.marks`). (0,0) 중심이라 d3 `g.html(...)`에 넣는다. `inline: true`면 1em `<svg>`로 감싸 본문·범례에 쓴다. 색만으로 계열을 가르지 않게 모양을 함께 쓴다. |
| `LTT.themeTokens(theme, scheme)` | 문서 없이 테마의 색 토큰 객체(`{bg, ink, c1, …}`). 테스트·서버 쪽 계산용. |
| `LTT.icon(name, {weight, cls})` | 선 아이콘 SVG 문자열. 이름 목록은 `LTT.icons`. hook `art`, explain·terms·facts `icon`, diagram 노드 `icon`에는 이름만 넘긴다. 이모지도 받는다. 손으로 그린 44개 + Lucide에서 가져온 16개(globe, map-pin, route, git-branch, timer, database-zap, network, shield-check, key-round, mail, package, truck, wifi, cloud, gauge, workflow). 더 필요하면 Lucide에서 그 아이콘만 `ICONS`에 옮긴다(전체 세트는 넣지 않는다). |
| `{{용어}}`, `{{보이는 말\|용어}}` | 본문 속 용어 표시. 덱이 풀이 팝오버로 바꾼다(마우스 올리기·탭). 처음 나온 장면은 진하게 표시된다. |
| `LTT.linkTerms(el, sceneIndex)` | 덱 밖이나 나중에 그린 DOM의 `{{}}`를 바꾼다. 덱은 장면 마운트, predict 공개, compare 공개, stepper 자막에서 알아서 부른다. |
| `LTT.lintDeck(spec)` | 독학 기준 점검. `[{scene, rule, msg}]`. 덱이 시작할 때 실행해 경고를 화면 오른쪽 아래 패널에 띄우고 `lint` 이벤트로 남긴다. 규칙은 아래. |
| `LTT.record(type, data)` | lesson 페이지에서만 서버로 이벤트를 보낸다. |
| `LTT.expect(label, actual, expected, {tol})` | 기대값 대조. 불일치는 패널과 서버에 남는다. |
| `LTT.warn(msg)` | 패널에 경고 한 줄. |
| `LTT.contrast(a, b)` | 두 hex 색의 WCAG 대비비. |

### 테마

| theme | 흉내 내는 매체 | 맞는 도메인 |
| --- | --- | --- |
| `paper` | 논문 figure·교과서: 크림 종이, 세리프 제목, 괘선, 그림자 없음 | 수학, 교육학, 인지과학, 연구 설계 |
| `blueprint` | 회로·블록 도면: 남색 격자, 모노 라벨, 선만 있는 상자 | GPU, 하드웨어, 시스템·네트워크 구조 |
| `terminal` | 터미널·로그·대시보드: 검정 바탕, 모노 번호, 녹색 강조 | 백엔드, 인프라, CLI, 운영 |
| `ledger` | 경제 신문 차트: 살구색 종이, 세리프 헤드라인, 각진 표 | 금융, 경제, 비즈니스 지표 |
| `lab` | 실험 노트·모눈 플롯: 모눈 배경, 주황 펜 색 | 물리, 공학, 시뮬레이션 |
| `studio` | 제품 화면·디자인 툴: 중립 회색, 둥근 카드 (기본) | UI/UX, 제품 |
| `sketch` | 화이트보드·손그림 설명: 흰 보드(다크는 칠판), 굵은 마커 선. `rough.js`를 불러오면 diagram이 손그림 선으로 그려진다 | 개념 첫 소개, 아키텍처 스케치, 브레인스토밍 |
| `atlas` | 지도·지리·물류: 바다·육지 색 토큰, 모노 번호 | 지리, 물류, 리전·지연 시간, 공급망 |

테마는 매체를 고르는 것이지 장식이 아니다. 페이지 CSS에서 토큰을 다시 정의하지 않는다.

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
| `card-monotony` | 카드 격자 장면(explain `cards`, compare, terms, summary)이 3장 연속이거나, hook·keywords를 뺀 장면의 60% 초과 |
| `no-signature` | 그림이 주인공인 장면(`figure`, `contrast`, `layout: "full"`, 타입 없는 `mount`)이 없다 |
| `no-theme`, `unknown-theme` | `theme`을 고르지 않았거나 없는 이름이다 |
| `filler-content` | "항목 1", "샘플 텍스트", lorem, TODO 같은 채움 글 |

### 화면 점검 (`?audit`)

lint는 장면 데이터만 본다. 실제로 그려진 화면은 URL에 `?audit`을 붙여 연다. 덱이 모든 장면을 그려 재고, 결과를 패널 경고, `layout-audit` 이벤트, `<html data-ltt-audit="건수">`로 남긴다. `LTT.deck(...)`가 돌려주는 객체의 `audit()`으로 직접 부를 수도 있다. 판정은 `LTT.auditScene(측정값)`이 한다.

| rule | 뜻 |
| --- | --- |
| `overflow`, `shrunk` | 78%로 줄여도 넘친다 / 화면에 맞추느라 88% 미만으로 줄었다 |
| `small-visual` | 가장 큰 그림(compare는 칸 그림의 합)이 화면 넓이의 10% 미만, figure·full 장면은 22% 미만 |
| `loose-figure` | figure 그림이 figure 무대의 35% 미만 |
| `empty-stage` | figure·full 장면이 화면 높이의 60% 미만만 쓴다 |
| `many-sizes` | 장면 본문(목업·SVG 제외)의 글자 크기가 7단계 초과 |
| `hscroll` | 가로로 넘친다. 휴대폰 폭(720px 이하)에서는 이것만 본다 |

1440×900과 390×844 두 크기에서 0건이어야 한다.

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
| `LTT.chartFrame({title, dek, source})` → `{el, foot()}` | 신문식 차트 틀: 굵은 괘선, 헤드라인(주장), dek(단위·조건), 차트, `foot()`가 붙이는 출처 줄. 차트는 `el`에 그린다. |
| `LTT.inspector({title, rows: [{name, fg, bg, ratio}], min, level})` | 디자인 툴식 대비 검사 패널(문자열). `ratio`가 없으면 `LTT.contrast`로 계산, `min`(기본 4.5) 미만이면 미달. |
| `LTT.redline(container, {selector, x})` → `{update}` | 대상마다 위쪽 margin을 오른쪽 여백에 px 측정선으로. 스타일을 바꾼 뒤 `update()`. |
| `LTT.h(tag, cls, html)`, `LTT.fill(node, v)` | 작은 DOM 도우미. `fill`은 문자열·노드·함수(노드를 채우거나 노드/문자열을 돌려줌)를 받는다. |

## ltt-mock.js: 목업

모두 `{el, screen}`을 돌려준다. 내용은 `screen`에 넣고, 번호 주석은 `el`에 건다(틀 기준 %).

| 이름 | 옵션 |
| --- | --- |
| `LTT.mock.phone(o)` | `width`(px), `ratio`(기본 `"9/17.5"`), `dark`, `bg`, `time`, `content` |
| `LTT.mock.browser(o)` | `url` 또는 `title`, `width`, `height`, `bg`, `content` |
| `LTT.mock.terminal(o)` → `+ add(line)` | `title`, `lines: ["$ 명령", "출력", {t: "ok"\|"warn"\|"err"\|"dim"\|"out"\|"cmd", text}]`. 줄 색은 `--ltt-term-*` 변수(터미널은 테마와 무관하게 어둡다). 캐시 로그라면 미스=ok, 적중=out, 오래된 값=warn, 원본 쓰기=err처럼 의미를 골라 쓴다 |
| `LTT.mock.code(o)` → `+ line(n)` | `code`(원문 그대로), `lang`(javascript, typescript, python, bash, json, sql. Prism을 불러왔을 때 문법 색), `title`, `marks: {줄번호: "good"\|"bad"\|"accent"\|"warn"}`, `start`, `numbers: false` |

UI 예시는 맨 HTML 조각보다 목업에 넣는다. 목업 안의 색은 '실제 화면'이라 토큰 대신 hex를 써도 된다.

## ltt-parts.js: 움직이는 그림

| 이름 | 설명 |
| --- | --- |
| `LTT.diagram(svg, spec)` | 격자 좌표 다이어그램. `spec: {cols, rows, cell: [w, h], node: [w, h], pad, parallel, width, height, maxWidth, label, nodes, edges, zones}`. 노드 `{id, c, r, l, s, k, icon, flaw, w, h}`(c·r은 소수 가능, 픽셀이면 `x, y` 중심). `l`·`s`의 `\n`은 줄바꿈이고 2줄 이상이면 상자가 커진다(`h`가 우선). 엣지 `{f, t, l, lo: [dx, dy], k, dash, both, arrow: false, id, shape, via, from, to, radius, points}`: `shape`는 `straight`(기본)·`ortho`(직각, 모서리 `radius` 기본 10)·`curve`, `via: [[c, r], ...]`는 격자 경유점, `from`·`to`는 `top|right|bottom|left`(없으면 거리가 긴 축의 변), `points: [[x, y], ...]`는 픽셀 경로 그대로(자동 배치 결과용). 같은 두 노드 사이 엣지는 `parallel`(기본 14px) 간격으로 벌어진다. 라벨은 경로 길이의 절반 지점 + `lo`. 영역 `{id, parent, c0, r0, c1, r1, l, k}` 또는 픽셀 `{x, y, w, h}`: `parent`가 있으면 깊이마다 10px 더 들어가고 부모 라벨 아래·부모 안쪽으로 잘린다. k: accent·good·bad·warn·muted·dark. 자기 루프, 없는 노드·부모, 잘못된 변·모양 이름, 위치 없는 노드·영역은 오류. 반환 `{svg, layout, node(id), edge(id), highlight, flow, send, clear, player}`; `send`의 패킷은 그려진 경로를 따른다. |
| `.highlight(ids)` | 노드·엣지(`"from>to"`) 외에는 흐리게. 빈 배열·null이면 해제. |
| `.flow(edgeIds)` | 진행 방향을 보이는 점선 흐름. 방향을 알려야 할 때만. |
| `.send(from, to, {count, color, ms, gap, r})` → Promise | 엣지를 따라 패킷이 이동. |
| `.player(el, steps, {interval})` | 단계 재생. `steps: [{caption, hot, flow, send: [[from, to, opts]], enter(dg, i)}]`. 자막이 그림 읽는 법을 말한다. |
| `LTT.diagramLayout(spec)` | 좌표만 계산(테스트·커스텀 그림용). 엣지마다 `pts`(꺾는 점 포함), SVG `d`, 라벨 기준점 `lx, ly`, 기존 `x1…y2`; 노드에 `lines`·`sub`; 영역에 `id, parent, depth`. |
| `LTT.autoLayout(spec)` → Promise | 좌표 없이 연결만 적으면 elk(layered)가 배치한 diagram spec을 돌려준다: `LTT.diagram(svg, await LTT.autoLayout(spec))`. `spec: {nodes, edges, groups, direction: RIGHT|DOWN, node: [w, h], spacing: [층, 노드] = [72, 36], pad, radius, label, maxWidth}`. 노드·엣지 필드는 diagram과 같고 노드 `group`은 그룹 id, 그룹 `{id, l, k, parent}`는 중첩 영역이 된다. 엣지는 직각(`ortho`)으로 꺾이고 라벨은 diagram이 경로 절반에 둔다(elk는 라벨 자리를 비우지 않으니 라벨이 많으면 `spacing`을 늘린다). 같은 입력은 같은 그림. 노드가 20개를 넘거나 층이 많으면 가로로 길어지니 좁은 칸에서는 `DOWN`. `<script src="/kit/vendor/elk.bundled.js">`(1.6MB)를 ltt.js보다 먼저 불러야 하며, 없으면 reject한다. 오류(없는 노드·그룹, 중복 id, 자기 루프, 그룹 순환)도 reject. |
| `LTT.stepper(el, [{caption, enter(i, dir)}], {interval, onStep})` | 한 그림을 단계별로. `enter`는 다시 들어와도 같은 화면이 되게 짠다. |
| `LTT.units(el, n, cols, {band}).paint(k, cls, alt)` | 단위 그림(100칸 = 100건). `band: true`면 가는 틱의 넓은 띠(예: 2×50, 시간순 요청). |
| `LTT.bar(el, [{color}]).set(values, labels)` | 비율 막대. |
| `LTT.tween(el, to, fmt, ms)` | 숫자 변화. |
| `LTT.sweep({params: {id: {map, fmt}}, render, presets})` | range 입력 → `render(values)`. 조작 자체가 배움일 때만, 실사용 범위만. |
| `LTT.predict({...})` | 첫 짐작을 잠그고 기록. 덱의 predict 장면이 쓴다. |
| `LTT.plane(svg, {range, vectors, shape}).to(m)` | 2×2 행렬 변환. |
| `LTT.sim({init, step, draw, until, dt, onEnd})` | 고정 간격 시뮬레이션. `runToEnd()`는 화면 없이 결과만. |
| `LTT.sequence(svg, {actors, items, spans, col, row})` | 시퀀스 다이어그램. 배우 `{id, l, s, icon, k}`, `items`는 시간순으로 메시지 `{f, t, l, kind: "sync"\|"async"\|"reply", k, flaw, id}`와 메모 `{note, over: [ids]}`. sync는 받는 쪽 활성 막대를 열고, 그 배우의 다음 reply가 닫는다. f = t면 자기 호출 고리. `spans: [{from, to, l, k}]`는 두 메시지 id 사이 시간 구간(왼쪽 괄호). `.show(n)`, `.highlight(ids)`, `.send(id)`, `.player(el, [{caption, upto, hot}])`(upto 기본 = 단계 번호 + 1, 마지막 메시지에 패킷). 재시도·인증·타임아웃 순서 수업. |
| `LTT.sequenceLayout(spec)` | 좌표만 계산(테스트용). |
| `LTT.axisPlot(svg \| el, {width, height, x, y, equal, ticks, labels: {x, y}, series: [{id, color \| k, dash, dot}], margin, cls})` → `{set(id, points), px, x, y}` | 축이 고정된 함수·궤적 플롯. `equal: true`(또는 `y: [y0]`)면 x 축척으로 y 범위를 정해 모양이 실제와 같다. 계열 색 기본 `--ltt-c1…`. |
| `LTT.lanes(svg \| el, {axis: {max, step, fmt}, lanes: [{l, s, value, text, color \| k}], labelW})` → `{play}` | 같은 시간 축의 레인 막대. 어느 단계에서 시간이 드는지. |
| `LTT.hbars(svg \| el, {domain, ticks, tickFormat, fmt, rows: [{label, value, text, tone}]})` → `{play}` | 고정 축 가로 막대. `tone: "floor"`는 바닥(하한)을 점선 테두리로. `chartFrame` 안에 그리면 신문 차트가 된다. |
| `LTT.plot(options)`, `LTT.plotTheme(options)` | Observable Plot을 테마 팔레트·모노 눈금·투명 배경 기본값으로. 막대·선·점·분포. `plot.umd.min.js` 필요. |
| `LTT.sankey(svg \| el, {nodes: [{id, l, k}], links: [{f, t, value, k}], fmt})` → `{highlight(ids)}` | 흐름량(비용·트래픽·퍼널). 띠 굵기 = 값. `d3-sankey.min.js` 필요. |
| `LTT.map(svg, {projection, rotate, extent, countries, places, routes, width, height})` → Promise | 세계 지도(Natural Earth 1:110m). `projection`: equalEarth(기본)·mercator·naturalEarth·orthographic. `extent: [[lon0, lat0], [lon1, lat1]]`로 지역에 맞추고, 날짜변경선을 넘는 지역은 `rotate: [-중심경도, 0]`. `countries: {영어 이름: tone}`, `places: [{id, lon, lat, l, lo, k, mark}]`, `routes: [{f, t, l, lo, k, dash}]`(대권 호). 결과에 `highlight`·`flow`·`send`·`player`·`project(lon, lat)`. `topojson-client.min.js` 필요. |
| 트리·트리맵 | kit 부품 없이 `d3.hierarchy` + `d3.tree`/`d3.treemap`. 예시는 catalog. |
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
| `layout` | `"split"`(그림 \| 설명 레일), `"stack"`(설명 위, 그림 전체 폭), `"full"`(그림이 무대 전체, 해설·번호 주석은 그림 아래 캡션 줄). 기본은 figure면 full, narration·points가 있으면 split |
| `bare` | split에서 본문 카드 테두리를 없앤다(그림이 이미 패널일 때) |
| `number: false` | 큰 장면 번호를 숨긴다 |

### 장면 타입

| type | 필드 |
| --- | --- |
| `hook` | `art`(아이콘 이름·이모지·HTML), `pre`, `text`, `sub`, `kicker`, `chips`. 첫 장면 |
| `terms` | `terms: [{key, word, en, icon, plain, example}]`. 용어를 쉬운 말로 먼저 푼다. key는 glossary에 자동 등록 |
| `explain` | `steps: [{icon, title, text, visual}]`, `form`, `arrows`. `form`: `"cards"`(기본, 독립된 요소 나열), `"strip"`(이어진 한 줄 흐름, 카드 없이 선과 마디), `"stack"`(세로 타임라인, 단계마다 오른쪽에 그림) |
| `figure` | `figure`(그림: 노드·HTML·함수), `caption`, `label`, `steps`, `interval`. 그림 하나가 화면을 차지하고 아래에 "그림 n." 캡션이 붙는다. `points`의 `at`은 무대 안 첫 목업(phone·browser·terminal·code)이 있으면 그 틀 기준, 없으면 무대 전체 기준 %다(`pointsOn`으로 바꾼다). `steps: [{caption, enter(k, fig)}]`를 주면 그림 왼쪽, 단계 자막 오른쪽으로 놓인다. `figure` 함수가 `{el, ...}`를 돌려주면 `enter`의 `fig`로 그 객체가 온다(같은 그림의 여러 상태). 장면에 들어올 때마다 다시 그리려면 공통 필드 `enter(body, ctx)` |
| `statement` | `title`(큰 주장 한 문장, `<em>`은 강조색), `sub`, `visual`(작은 근거 그림, 선택). 카드 없이 리듬을 바꾸는 장면 |
| `contrast` | `before`, `after`(위 beforeAfter의 각 쪽) |
| `compare` | `items: [{label, visual, tone, verdict, note, noteAfter, enter, onReveal}]`, `form`, `cols`, `reveal`, `revealLabel`. `form: "table"`이면 사례가 행이 되는 비교표(라벨 \| 그림 \| 판정), `head: ["라벨 열", "그림 열", "판정 열"]`은 열 머리글(휴대폰 폭에서는 숨김) |
| `predict` | `choices`, `answer`, `question`, `hint`, `visual`, `answerVisual`, `why`, `button`, `unsure`, `reveal` |
| `summary` | 앞 장면의 `takeaway`를 카드로 모은다. `cards`로 직접 줄 수도 있다. `extra: {title, text}`는 검은 카드 |
| `keywords` | `terms: [{ko, en}]`, `signals`, `queries`, `neighbors: [{term, diff}]`. 마지막 장면 |
| (없음) | `mount`로 그리는 커스텀 장면 |
