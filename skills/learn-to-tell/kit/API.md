# kit API

수업은 빈 `lesson.html`에서 이 부품들을 조합해 짠다. 모든 부품이 실제로 동작하는 모습과 그 코드는 `https://learn-to-tell.vercel.app/gallery/catalog.html`에 있다. 장면 타입별 예시는 `https://learn-to-tell.vercel.app/gallery/scenes.html`에 있다.

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
<script src="/kit/vendor/elk.bundled.js"></script>                <!-- LTT.autoLayout·LTT.state를 쓸 때만 -->
<script src="/kit/vendor/rough.js"></script>                      <!-- sketch 테마의 손그림 선을 쓸 때만 -->
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
| `LTT.palette()`, `LTT.palette(theme, "light"\|"dark")` | 범주형 색 6개 배열. 인자 없이 부르면 지금 페이지의 테마·다크 모드 값. 계열 구분에만 쓰고 판정(good·bad)에는 쓰지 않는다. 모든 테마에서 배경 대비 3:1 이상(글자 토큰 `ink`·`ink-2`·`muted`·`accent`·`good`·`bad`·`warn`은 바탕·카드·자기 soft 위 4.5:1 이상), 색각 이상(적록·청황) 시뮬레이션에서도 구분된다(`tests/kit.test.mjs`). |
| `LTT.mark(kind, {size, color, weight, fill, inline})` | 모양 표식 SVG 문자열(square, ring, dot, diamond, cross, 목록은 `LTT.marks`). (0,0) 중심이라 d3 `g.html(...)`에 넣는다. `inline: true`면 1em `<svg>`로 감싸 본문·범례에 쓴다. 색만으로 계열을 가르지 않게 모양을 함께 쓴다. |
| `LTT.themeTokens(theme, scheme)` | 문서 없이 테마의 색 토큰 객체(`{bg, ink, c1, …}`). 테스트·서버 쪽 계산용. |
| `LTT.icon(name, {weight, cls})` | 선 아이콘 SVG 문자열. 이름 목록은 `LTT.icons`. hook `art`, explain·terms·facts `icon`, diagram 노드 `icon`에는 이름만 넘긴다. 목록에 없는 값(이모지 등)은 글자로 그린다. 장면의 그림 칸(compare·explain·terms `visual`, predict `visual`·`answerVisual`, figure)에 아이콘 하나만 넣으면 본문 글자 크기가 아니라 칸에 맞는 크기(44–84px, 강조색)로 그린다. 문장 속·버튼·범례 아이콘은 1em 그대로다. SVG 안(diagram·sequence 노드)에서는 글자가 보이지 않으니 이름만 쓴다. 손으로 그린 44개 + Lucide에서 가져온 16개(globe, map-pin, route, git-branch, timer, database-zap, network, shield-check, key-round, mail, package, truck, wifi, cloud, gauge, workflow). 더 필요하면 Lucide에서 그 아이콘만 `ICONS`에 옮긴다(전체 세트는 넣지 않는다). |
| `{{용어}}`, `{{보이는 말\|용어}}` | 본문 속 용어 표시. 덱이 풀이 팝오버로 바꾼다(마우스 올리기·탭). 처음 나온 장면은 진하게 표시된다. |
| `LTT.linkTerms(el, sceneIndex)` | 덱 밖이나 나중에 그린 DOM의 `{{}}`를 바꾼다. 덱은 장면 마운트, predict 공개, compare 공개, summary recall의 답 보기, stepper 자막에서 알아서 부른다. |
| `LTT.lintDeck(spec)` | 독학 기준 점검. `[{scene, rule, msg}]`. 덱이 시작할 때 실행해 경고를 화면 오른쪽 아래 패널에 띄우고 `lint` 이벤트로 남긴다. 규칙은 아래. |
| `LTT.record(type, data)` | lesson 페이지에서만 서버로 이벤트를 보낸다. |
| `LTT.expect(label, actual, expected, {tol})` | 기대값 대조. 불일치는 패널과 서버에 남는다. |
| `LTT.warn(msg)` | 패널에 경고 한 줄. |
| `LTT.contrast(a, b)` | 두 hex 색의 WCAG 대비비. |
| `LTT.summaryCards(scene, scenes)` | summary 장면이 보일 항목 목록(lint와 덱이 같이 쓴다). |

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
| `predict-new-term` | predict의 질문·선택지에서 처음 나온 용어 |
| `no-reading-guide` | compare·contrast·figure·overview·타입 없는 `mount` 장면에 `narration`·`points`·`sub`·`caption`(contrast는 `before.points`도)이 없다 |
| `no-title` | 제목 없는 장면(hook·summary·keywords 제외) |
| `overview-missing` | summary가 있는데 한 장 정리(`overview`)가 없다 |
| `overview-order` | overview가 summary 뒤, keywords 바로 앞이 아니다 |
| `overview-no-visual` | overview에 `figure`가 없다 |
| `keywords-last` | 마지막 장면이 keywords가 아니다 |
| `unused-term` | glossary에 넣고 어디에도 표시하지 않았다 |
| `term-no-visual` | terms 항목에 `visual`이 없다. 그림으로 보일 수 없는 말이면 `visual: false`로 밝힌다 |
| `summary-no-recall` | summary가 모으는 takeaway에 `recall` 질문이 없다 |
| `card-monotony` | 카드 격자 장면(explain `cards`, compare, terms, `recall` 없는 summary)이 3장 연속이거나, hook·keywords를 뺀 장면의 절반 초과 |
| `no-signature` | 그림이 주인공인 장면(`figure`, `contrast`, `layout: "full"`, 타입 없는 `mount`)이 없다 |
| `no-theme`, `unknown-theme` | `theme`을 고르지 않았거나 없는 이름이다 |
| `filler-content` | "항목 1", "샘플 텍스트", lorem, TODO 같은 채움 글 |

### 화면 점검 (`?audit`)

lint는 장면 데이터만 본다. 실제로 그려진 화면은 URL에 `?audit`을 붙여 연다. 덱이 모든 장면을 그려 재고, 결과를 패널 경고, `layout-audit` 이벤트, `<html data-ltt-audit="건수">`로 남긴다. `LTT.deck(...)`가 돌려주는 객체의 `audit()`으로 직접 부를 수도 있다. 판정은 `LTT.auditScene(측정값)`이 한다.

폭 1000px 이하 창에서는 `shrunk`·`small-visual`·`loose-figure`를 판정하지 않는다. `small-visual`은 hook·terms·summary·keywords·statement·predict 장면에서도 판정하지 않는다.

| rule | 뜻 |
| --- | --- |
| `overflow`, `shrunk` | 78%로 줄여도 넘친다 / 화면에 맞추느라 88% 미만으로 줄었다 |
| `small-visual` | 가장 큰 그림(compare는 칸 그림의 합)이 화면 넓이의 10% 미만, figure·full 장면은 22% 미만 |
| `loose-figure` | figure 그림이 figure 무대의 35% 미만 |
| `empty-stage` | figure·full 장면이 화면 높이의 60% 미만만 쓴다 |
| `many-sizes` | 장면 본문(목업·SVG·번호 표식 제외)에서 글자를 직접 가진 요소의 글자 크기가 7단계 초과 |
| `hscroll` | 가로로 넘친다 |
| `graph-overlap` | 장면 속 diagram에서 라벨·노드·엣지가 겹친다(`LTT.graphOverlaps`) |
| `panel-overlap` | figure 단계 자막 칸이나 펼친 predict 정답이 글 줄·컨트롤·그림(diagram은 노드·라벨 상자)과 겹친다 |
| `goal-unreachable`, `goal-narrow`, `goal-at-start` | `sweep` 목표가 손잡이의 어느 자리에서도 안 맞는다 / 한 자리에서만 맞는다 / 시작 위치에서 이미 맞는다. 자리는 손잡이마다 최대 201곳(dial은 최대 360곳, pad·drag는 축마다 41곳), 조합이 2만 개를 넘으면 고정 시드로 2만 개를 뽑아 `check`를 부른다 |

작성·점검 기준은 1280px 이상 데스크톱이다. 1440×900과 1280×800 두 크기에서 0건이어야 한다.

폰(폭 760px 미만, 또는 높이 500px 이하의 터치 화면)에서는 `<html data-ltt-mobile>`가 붙고, kit가 같은 장면을 다시 배치한다(`LTT.mobile()`). 장면은 줄이지 않고 세로로 스크롤한다. 모든 격자는 한 열이 되고, 그림 옆 설명은 그림 아래로 간다. 글자가 10px 아래로 작아질 넓은 SVG는 그 크기를 지키고 자기 칸 안에서 가로로 스크롤한다. autoLayout 그래프는 `DOWN`으로 다시 배치된다. 좌우로 밀면 장면이 넘어간다. 참고용 화면이라 점검 대상이 아니다.

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
| `LTT.diagram(svg, spec)` | 격자 좌표 다이어그램. `spec: {cols, rows, cell: [w, h], node: [w, h], pad, parallel, width, height, maxWidth, label, sketch, nodes, edges, zones}`. 노드 `{id, c, r, l, s, k, icon, flaw, ring, w, h}`(`ring`은 이중 테두리)(c·r은 소수 가능, 픽셀이면 `x, y` 중심). `l`·`s`의 `\n`은 줄바꿈이고 2줄 이상이면 상자가 커진다(`h`가 우선). 엣지 `{f, t, l, lo: [dx, dy], k, dash, both, arrow: false, id, shape, via, from, to, radius, points}`: `shape`는 `straight`(기본)·`ortho`(직각, 모서리 `radius` 기본 10)·`curve`, `via: [[c, r], ...]`는 격자 경유점, `from`·`to`는 `top|right|bottom|left`(없으면 거리가 긴 축의 변), `points: [[x, y], ...]`는 픽셀 경로 그대로(자동 배치 결과용). 같은 두 노드 사이 엣지는 `parallel`(기본 14px) 간격으로 벌어진다. 라벨은 경로 길이의 절반 지점 + `lo`. 영역 `{id, parent, c0, r0, c1, r1, l, k}` 또는 픽셀 `{x, y, w, h}`: `parent`가 있으면 깊이마다 10px 더 들어가고 부모 라벨 아래·부모 안쪽으로 잘린다. k: accent·good·bad·warn·muted·dark. 자기 루프, 없는 노드·부모, 잘못된 변·모양 이름, 위치 없는 노드·영역은 오류. `rough.js`를 불러온 페이지에서 sketch 테마(또는 `sketch: true`)면 선이 손그림으로 그려진다(`sketch: false`로 끔). 반환 `{svg, layout, node(id), edge(id), highlight, flow, send, clear, player}`; `send`의 패킷은 그려진 경로를 따른다. |
| `.highlight(ids)` | 노드·엣지(`"from>to"`) 외에는 흐리게. 빈 배열·null이면 해제. |
| `.flow(edgeIds)` | 진행 방향을 보이는 점선 흐름. 방향을 알려야 할 때만. |
| `.send(from, to, {count, color, ms, gap, r})` → Promise | 엣지를 따라 패킷이 이동. |
| `.player(el, steps)` | 단계 재생(stepper). 이전·다음으로 넘기고 '반복 재생'으로 순환한다. 단계별 머무는 시간 `hold`는 표현하려는 바에 맞게 정한다. `steps: [{caption, hold, hot, flow, send: [[from, to, opts]], enter(dg, i)}]`. 단계의 `send`는 그 단계에 머무는 동안 반복된다. 구간마다 `ms`(이동 시간)·`gap`(간격)을 달리해 빠르기 차이를 보인다. 이어진 길은 `send`에 `{relay: [[from, to, ms], ...], count, gap, r, color}`를 넣는다. 패킷마다 구간을 차례로 지나므로, 느린 구간 뒤의 빠른 구간도 느린 구간이 내주는 만큼만 흐른다. 자막이 그림 읽는 법을 말한다. |
| `LTT.graphOverlaps(spec)` | 그린 diagram spec의 겹침 `[{kind, a, b}]`. kind: `label-label`, `label-node`, `edge-node`(끝점이 아닌 노드를 지남), `edge-edge`(끝을 공유하지 않는 두 엣지가 한 줄 위를 6px 넘게 함께 달림). 교차는 세지 않는다. `?audit`의 `graph-overlap` 규칙이 쓴다. |
| `LTT.diagramLayout(spec)` | 좌표만 계산(테스트·커스텀 그림용). 엣지마다 `pts`(꺾는 점 포함), SVG `d`, 라벨 기준점 `lx, ly`, 기존 `x1…y2`; 노드에 `lines`·`sub`; 영역에 `id, parent, depth`. |
| `LTT.autoLayout(spec)` → Promise | 좌표 없이 연결만 적으면 elk(layered)가 배치한 diagram spec을 돌려준다: `LTT.diagram(svg, await LTT.autoLayout(spec))`. `spec: {nodes, edges, groups, direction: RIGHT|DOWN, node: [w, h], spacing: [층, 노드] = [72, 36], pad, radius, label, maxWidth}`. 노드·엣지 필드는 diagram과 같고 노드 `group`은 그룹 id, 그룹 `{id, l, k, parent}`는 중첩 영역이 된다. 엣지는 직각(`ortho`)으로 꺾인다. 라벨은 크기를 재서 elk에 넘기므로 elk가 라벨 자리를 비워 두고 정한 자리(엣지 `at`)에 그려진다. 그래서 라벨·노드·엣지가 겹치지 않는 대신 라벨 몫만큼 층 간격이 넓어진다. 엣지 `main: false`는 보조 엣지(역방향·추론·타입 표시)다. 배치 방향을 정할 때 주 엣지를 앞세우고, 사이클은 보조 엣지를 뒤집어 끊는다. 폰에서는 `direction`과 무관하게 `DOWN`으로 배치한다(`mobile: false`로 끔). 같은 입력은 같은 그림. 노드가 20개를 넘거나 층이 많으면 가로로 길어지니 좁은 칸에서는 `DOWN`. `<script src="/kit/vendor/elk.bundled.js">`(1.6MB)는 이 부품을 쓰는 페이지에서만 불러온다. 호출할 때 없으면 reject한다. 오류(없는 노드·그룹, 중복 id, 자기 루프, 그룹 순환)도 reject. |
| `LTT.state(svg, {states, transitions, initial, direction, groups, node, spacing})` → Promise<diagram> | 상태 기계. 상태 `{id, l, s, k, icon, final}`, 전이 `{f, t, l, k, dash}`. `initial` 앞에 시작 점, `final`은 이중 테두리(diagram 노드 `ring: true`), 자기 자신으로의 전이는 상태 아래 `↻ 이벤트` 줄. autoLayout으로 배치하므로 `elk.bundled.js`가 필요하다. 돌려받은 diagram으로 `player`·`highlight`·`send`를 쓴다(시작 점 id는 `__start`). |
| `LTT.stateSpec(o)` | state가 autoLayout에 넘기는 입력만 만든다(테스트·조정용). |
| `LTT.stepper(el, [{caption, hold, enter(i, dir)}], {onStep, interval})` → `{go, play, stop, index}` | 한 그림을 단계별로. `enter`는 다시 들어와도 같은 화면이 되게 짠다. '반복 재생' 버튼(또는 `play()`)은 단계마다 `hold`ms(없으면 `interval`, 기본 1800ms) 머문 뒤 다음 단계로, 끝에서 처음으로 돌아간다. `hold`는 표현하려는 바에 맞게 정한다(오래 봐야 할 단계는 길게). 이전/다음을 누르면 멈춘다. |
| `LTT.units(el, n, cols, {band}).paint(k, cls, alt)` | 단위 그림(100칸 = 100건). `band: true`면 가는 틱의 넓은 띠(예: 2×50, 시간순 요청). |
| `LTT.bar(el, [{color}]).set(values, labels)` | 비율 막대. |
| `LTT.tween(el, to, fmt, ms)` | 숫자 변화. |
| `LTT.sweep({params: {id: {kind, map, fmt, label, …}}, render, presets, goal})` | 손잡이 → `render(values)`. 조작 자체가 배움일 때만, 실사용 범위만. 손잡이는 `#id` 요소에 붙고 `#id-v`에 `fmt(값)`이 들어간다. `kind`: `"range"`(기본, `#id`는 `<input type=range>`, 값 = `map(input.value)`), `"log"`(`#id`는 range 입력, `{min, max, value}`, 자릿수마다 같은 거리), `"steps"`(`#id`는 빈 `div`, `{stops, value, stopLabel}`, 단계 버튼), `"dial"`(빈 `div`, `{period=360, step=1, value, ring}`, 0이 위·시계 방향, `ring`은 고리 배경 CSS, 가운데 `.mid`는 페이지가 채워도 된다), `"pad"`(빈 `div`, `{x: {min, max, step, value}, y: {…}, labels, bg}`, 값 `[x, y]`, y는 위로 증가). `control`에 `LTT.drag(...)` 같은 손잡이 객체를 주면 `#id` 없이 그것을 쓴다. `"range"` 외 손잡이는 화살표 키로도 움직이고 덱 장면 넘김을 막는다. `presets` 버튼의 `data-preset`은 range는 입력값, 나머지는 손잡이 값이다. `goal: {el, text, target, check(values)}`는 `el` 안에 목표 띠(목표 견본 `target` + 문장)를 그리고, `check`가 참이면 "맞췄다" 표시와 `goal` 이벤트를 남긴다. `check`는 값만 보는 순수 함수여야 한다(`?audit`이 손잡이 자리마다 부른다). |
| `LTT.drag(svg, {value, toSvg, fromSvg, bounds, step, color, label, r})` | 그림 속 대상을 직접 끄는 손잡이. `svg` 위에 점선 원을 그리고, 끌거나 화살표 키로 옮기면 값 `[x, y]`가 `step`으로 맞춰지고 `bounds: [[xmin, xmax], [ymin, ymax]]` 안에 머문다. `toSvg`/`fromSvg`는 데이터 ⇄ SVG 좌표 변환(`LTT.plane`이 같은 이름으로 준다). 돌려주는 객체를 `sweep` `params`의 `control`로 넘긴다. 원 위치만 옮기고, 화살표·도형은 `render`가 다시 그린다. |
| `LTT.predict({..., onReset})` → `{reset, value, locked}` | 첫 짐작을 잠그고 기록. 덱의 predict 장면이 쓴다. `reset()`은 공개를 거두고 다시 고르게 한다. 첫 기록은 남고 `predict-reset` 이벤트와 `retry: true` 짐작이 추가된다. |
| `LTT.plane(svg, {range, vectors, shape}).to(m)` | 2×2 행렬 변환. `toSvg(p)`/`fromSvg(p)`는 평면 좌표 ⇄ SVG 좌표로, `LTT.drag`에 그대로 넘긴다. |
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

`LTT.deck({title, glossary: {용어: 풀이}, scenes})`. 장면 하나 = 메시지 하나 = 스크롤 없는 한 화면. ←/→·PageUp/PageDown 키(화면 속 stepper가 있으면 그 stepper가 끝에 닿을 때까지 ←/→를 먼저 받는다), `#n` 해시, `scene` 이벤트. compare의 판정이나 predict의 정답을 보지 않고 다음으로 가려 하면, 첫 시도는 넘어가지 않는다. 대신 그 버튼(predict에서 아직 고르지 않았으면 선택지)을 테마에 맞게 강조하고 말풍선을 띄운다. 다음 버튼이면 버튼 위에, 키·스와이프면 화면 가운데에 뜬다. 같은 장면에서 한 번 더 시도하면 넘어간다(`skip-warn`, `skip-reveal` 이벤트). predict에서 선택지를 이미 골랐다면 다음 버튼·키·스와이프는 넘어가지 않고 정답을 바로 펼친다(`auto-reveal` 이벤트). 정답을 펼친 predict에서 ← 키는 이전 장면 대신 문제 상태로 돌아간다(`predict-back` 이벤트, 이전 버튼·스와이프는 그대로 이전 장면). 펼친 정답은 장면 안에서 글·컨트롤·그림이 없는 빈자리를 찾아 그 위에 놓이고, 빈자리가 없으면 아래로 붙는다(넘치면 평소처럼 78%까지 줄인다).

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
| `recall` | takeaway를 떠올리게 하는 질문 한 줄. summary가 질문을 먼저 보이고 답(takeaway)은 "답 보기" 뒤에 연다 |
| `ask` | agent에게 할 질문 한 줄. summary 카드에 붙는다 |
| `aside` | 설명 레일에 넣을 추가 부품 |
| `basis`, `tex` | 근거 한 줄, 접힌 수식 |
| `mount(body, ctx)` → `{enter, leave}`, `enter` | 커스텀 그림. ctx: `{el, scene, index, scenes}` |
| `layout` | `"split"`(그림 \| 설명 레일), `"stack"`(설명 위, 그림 전체 폭), `"full"`(그림이 무대 전체, 해설·번호 주석은 그림 아래 캡션 줄). 기본은 figure·overview면 full, 그 밖에는 narration·points가 있으면 split. 단 hook·keywords·summary·terms·contrast·predict·statement는 자동 split이 되지 않는다 |
| `bare` | split에서 본문 카드 테두리를 없앤다(그림이 이미 패널일 때) |
| `number: false` | 큰 장면 번호를 숨긴다 |

### 장면 타입

| type | 필드 |
| --- | --- |
| `hook` | `art`(아이콘 이름·이모지·HTML), `pre`, `text`, `sub`, `kicker`, `chips`. 첫 장면 |
| `terms` | `terms: [{key, word, en, icon, visual, plain, example}]`. 용어를 쉬운 말로 먼저 푼다. key는 glossary에 자동 등록. `visual`(HTML·노드·함수)은 그 말이 가리키는 것을 보이는 작은 그림으로, 풀이 위에 그린다(예: 색상 → 색상환 위의 각도) |
| `explain` | `steps: [{icon, title, text, visual}]`, `form`, `arrows`. `form`: `"cards"`(기본, 독립된 요소 나열), `"strip"`(이어진 한 줄 흐름, 카드 없이 선과 마디), `"stack"`(세로 타임라인, 단계마다 오른쪽에 그림) |
| `figure` | `figure`(그림: 노드·HTML·함수), `caption`, `label`, `steps`. 그림 하나가 화면을 차지하고 아래에 "그림 n." 캡션이 붙는다. `points`의 `at`은 무대 안 첫 목업(phone·browser·terminal·code)이 있으면 그 틀 기준, 없으면 무대 전체 기준 %다(`pointsOn`으로 바꾼다). `steps: [{caption, enter(k, fig, dir)}]`를 주면 그림 왼쪽, 단계 자막 오른쪽으로 놓인다. 그림의 글·그림(diagram은 노드·라벨 상자)이 자막 칸 밑으로 들어가거나 한 단계에서라도 그 상자들이 자막 칸 밑으로 들어가면, 같은 창 폭에서는 자막 칸이 계속 그림 아래에 있다. 폭 760px 이하에서는 판정 없이 아래에 둔다. 자막 칸 높이는 가장 긴 단계 자막에 맞춰 고정되어 단계를 넘겨도 버튼이 움직이지 않는다. `figure` 함수가 `{el, ...}`를 돌려주면 `enter`의 `fig`로 그 객체가 온다(같은 그림의 여러 상태). 장면에 들어올 때마다 다시 그리려면 공통 필드 `enter(body, ctx)` |
| `overview` | `figure`, `caption`, `label`(기본 "한 장 정리."). summary 뒤, keywords 바로 앞에 두는 한 장 인포그래픽. figure처럼 그림이 무대 전체를 쓴다. 새 내용 없이 앞 장면의 takeaway를 그림 안 자리에 배치한다 |
| `statement` | `title`(큰 주장 한 문장, `<em>`은 강조색), `sub`, `visual`(작은 근거 그림, 선택). 카드 없이 리듬을 바꾸는 장면 |
| `contrast` | `before`, `after`(위 beforeAfter의 각 쪽) |
| `compare` | `items: [{label, visual, tone, verdict, note, noteAfter, enter, onReveal, onReset}]`, `form`, `cols`, `reveal`, `revealLabel`. `form: "table"`이면 사례가 행이 되는 비교표(라벨 \| 그림 \| 판정), `head: ["라벨 열", "그림 열", "판정 열"]`은 열 머리글 |
| `predict` | `choices`, `answer`, `question`, `hint`, `visual`, `answerVisual`, `why`, `button`, `unsure`, `reveal`, `onReset`, `rest`. `rest`는 정답 공개 뒤 고르지 않은 오답의 모습: `"hide"`(기본, 자리만 남기고 숨김) · `"dim"`(흐리게) · `"dot"`(점으로). 어느 쪽이든 자리를 유지해 화면이 흔들리지 않는다. 펼친 정답은 hide로 숨긴 자리에는 놓일 수 있지만 dim·dot 선택지는 가리지 않는다. 덱 전체 기본값은 `LTT.deck({predictRest})` |
| `summary` | 앞 장면의 `takeaway`를 모은다. `recall`이 있으면 글 목록의 인출 연습이 된다: 질문 → 입력칸(선택) → "답 보기" → takeaway·`ask`. 공개할 때 `recall` 이벤트(`{scene, question, answer}`)를 남긴다. `recall`이 없으면 카드 격자. `cards: [{n, title, text, ask, recall}]`로 직접 줄 수도 있다. `extra: {title, text}`는 마지막 항목 |
| `keywords` | `terms: [{ko, en}]`, `signals`, `queries`, `neighbors: [{term, diff}]`. 작성하는 마지막 장면. 그 뒤에 `map-related` 장면이 `/map/data.json`에서 자동으로 붙는다(이어진 개념이 없으면 없음). 직접 쓰지 않는다 |
| (없음) | `mount`로 그리는 커스텀 장면 |
