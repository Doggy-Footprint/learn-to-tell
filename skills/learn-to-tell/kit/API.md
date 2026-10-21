# kit API

수업 작성 참조. kit은 기능을 제공하고 그리는 방법을 정하지 않는다. 필요한 부품만 골라 쓰고, 없는 것은 페이지에 직접 짠다(SVG, canvas, d3 모두 된다). 부품 문서는 "부품 고르기" 표의 참조 열에서 고른 것만 읽는다. audit·lint 규칙 뜻은 출력만으로 모를 때만 `kit/api/rules.md`, 글꼴·모양 토큰과 드문 ltt.js 이름은 `kit/api/base.md`.

## 페이지 계약

수업은 `lessons/<id>/lesson.html` 한 페이지다. 구성(넘김, 스크롤, 한 화면)은 자유다. 지킬 것은 셋이다.

1. head에 `<script type="application/json" id="ltt-meta">{"topic", "audience", "theme", "medium", "decision"}</script>`를 둔다.
2. 계산한 수치는 `LTT.expect(label, actual, expected, {tol})`로 대조한다.
3. 움직이는 그림은 `LTT.clock(el, draw, {dur, loop})`로 돌린다. `draw(t)`는 t초의 화면을 그린다. clock은 `el`이 화면 밖이거나 숨겨지면 멈추고, reduced-motion이면 `draw(dur)`만 그린다. audit은 clock에 등록된 그림을 시간 간격으로 찍어 contact sheet를 만든다. 반환값 `{play, pause, seek(t)}`.

여러 화면을 순서대로 넘길 때만 `LTT.deck`을 쓴다(아래 "덱"). 그 밖에는 페이지에 직접 배치한다.

## 불러오기

순서를 지킨다. 주석이 달린 vendor는 그 부품을 쓸 때만 불러온다.

```html
<link rel="stylesheet" href="/kit/vendor/katex/katex.min.css"> <!-- 수식 -->
<script src="/kit/vendor/d3.min.js"></script>
<script src="/kit/vendor/plot.umd.min.js"></script> <!-- plot, 전역 Plot -->
<script src="/kit/vendor/katex/katex.min.js"></script> <!-- 수식 -->
<script src="/kit/vendor/d3-sankey.min.js"></script> <!-- sankey -->
<script src="/kit/vendor/topojson-client.min.js"></script> <!-- map -->
<script src="/kit/vendor/prism/prism.min.js"></script> <!-- mock.code의 lang -->
<script src="/kit/vendor/elk.bundled.js"></script> <!-- autoLayout·state -->
<script src="/kit/vendor/rough.js"></script> <!-- sketch 손그림 선 -->
<script src="/kit/ltt.js"></script>
<script src="/kit/ltt-parts.js"></script>
<script src="/kit/ltt-ui.js"></script>
<script src="/kit/ltt-mock.js"></script> <!-- 목업, 쓸 때만 -->
<script src="/kit/ltt-deck.js"></script> <!-- 덱, 쓸 때만 -->
```

## 기본 이름

| 이름 | 설명 |
| --- | --- |
| `LTT.clock(el, draw, {dur, loop})` | 움직이는 그림의 시계(페이지 계약 3) |
| `LTT.deck({title, theme, glossary: {용어: 풀이}, scenes})` | 장면 덱(선택). 장면 하나 = 스크롤 없는 한 화면 |
| `LTT.theme(name)`, `LTT.themes` | 테마(아래 표). 덱에서는 `theme` 필드로 |
| `LTT.icon(name, {weight, cls})`, `LTT.icons` | 선 아이콘 SVG. `art`·`icon` 필드에는 이름만(아래 목록) |
| `LTT.palette()`, `LTT.palette(theme, "light"\|"dark")` | 범주형 색 6개. 계열 구분에만 |
| `LTT.mark(kind, {size, color, weight, fill, inline})`, `LTT.marks` | 모양 표식(square, ring, dot, diamond, cross). 색만으로 계열을 가르지 않게 |
| `{{용어}}`, `{{보이는 말\|용어}}` | 본문 속 용어. 풀이 팝오버가 된다 |
| `LTT.expect(label, actual, expected, {tol})` | 기대값 대조. 불일치는 패널과 서버에 남는다 |
| `LTT.lintDeck(spec)` | 덱 장면 데이터 점검 `[{scene, rule, msg}]`. 덱이 시작할 때 실행한다 |
| `LTT.record(type, data)` | 서버로 이벤트(lesson 페이지에서만) |
| `LTT.math(scope)` | `data-tex` 요소를 KaTeX로 |
| `LTT.MOTION_MS` | 기본 전환 길이. reduced-motion이면 0 |

색 토큰: `--ltt-bg` `--ltt-card` `--ltt-card-2` `--ltt-line` `--ltt-line-2` `--ltt-ink` `--ltt-ink-2` `--ltt-muted` `--ltt-accent(-soft)` `--ltt-good(-soft)` `--ltt-bad(-soft)` `--ltt-warn(-soft)` `--ltt-dark` `--ltt-on-dark`, 범주형 `--ltt-c1`…`c6`, 지도 `--ltt-sea` `--ltt-land` `--ltt-border`. CSS 클래스: `ltt-param`(손잡이 줄), `ltt-bar`, `ltt-stat`·`ltt-hero`(큰 숫자, `<small>` 단위), `ltt-key`(범례), `ltt-basis`(근거 작은 글), `ltt-tag`(+`warn`·`bad`·`good`·`muted`), `ltt-mono`.

아이콘: check x arrow arrow-down plus minus clock hourglass db server cache cpu memory user users doc search eye alert bolt refresh target chart trend phone monitor cursor lock send layers wind ruler scale dice home anchor pencil palette sun ball question bulb link inbox globe map-pin route git-branch timer database-zap network shield-check key-round mail package truck wifi cloud gauge workflow

### 테마

테마는 그 분야 사람이 보는 매체의 모양이다. 고르지 않으면 `studio`.

| theme | 매체 |
| --- | --- |
| `paper` | 논문 figure·교과서(수학, 교육학, 인지과학) |
| `blueprint` | 회로·블록 도면(하드웨어, 시스템 구조) |
| `terminal` | 터미널·로그·대시보드(백엔드, 인프라) |
| `ledger` | 경제 신문 차트(금융, 지표) |
| `lab` | 실험 노트·모눈 플롯(물리, 공학, 시뮬레이션) |
| `studio` | 제품 화면·디자인 툴(UI/UX, 기본) |
| `sketch` | 화이트보드(첫 소개, 아키텍처 스케치) |
| `atlas` | 지도·물류(지리, 리전, 공급망, +`LTT.map`) |

## 덱

### 모든 장면의 공통 필드

| 필드 | 뜻 |
| --- | --- |
| `title`, `en` | 주장 문장으로 쓴 제목, 영문 보조 제목 |
| `kicker`, `sub`, `chips` | 제목 위 작은 알약 / 제목 아래 한두 줄(상황, 읽는 법) / 키워드 |
| `narration` | 해설 2–4문장. 있으면 그림 옆 설명 레일이 생긴다 |
| `points`, `pointsOn`, `pointsTone` | 번호 주석 `[{at: [x%, y%], text}]`. 대상은 `pointsOn` 셀렉터, 없으면 `[data-annotate]`, 없으면 본문의 첫 요소 |
| `takeaway`, `recall`, `ask`, `sources` | 핵심 한 문장 / 그것을 떠올리게 하는 질문 / agent에게 할 질문 / 찾아볼 곳. summary가 모은다 |
| `basis`, `tex`, `aside` | 근거 한 줄, 접힌 수식, 설명 레일의 추가 부품 |
| `mount(body, ctx)` → `{enter, leave}`, `enter` | 커스텀 그림. ctx: `{el, scene, index, scenes}` |
| `layout`, `bare`, `number: false` | `"split"`·`"stack"`·`"full"`(기본: figure·overview는 full, narration·points가 있으면 split) / split 카드 테두리 없앰 / 장면 번호 숨김 |

### 장면 타입

| type | 필드 |
| --- | --- |
| `hook` | `art`(아이콘 이름·HTML), `pre`, `text`, `sub`. 첫 장면 |
| `terms` | `terms: [{key, word, en, icon, visual, plain, example}]`. key는 glossary에 등록. `visual`은 그 말이 가리키는 것을 보이는 작은 그림 |
| `explain` | `steps: [{icon, title, text, visual}]`, `form`: `"cards"`(독립 요소), `"strip"`(한 줄 흐름), `"stack"`(세로 타임라인, 단계마다 그림), `arrows` |
| `figure` | `figure`(노드·HTML·함수), `caption`, `label`, `steps`. 그림 하나가 화면을 차지한다 |
| `overview` | `figure`, `caption`, `label`. summary 뒤 한 장 인포그래픽: 주 그림에 앞 takeaway를 자리(구역·번호)로 놓는다 |
| `statement` | `title`(큰 주장, `<em>` 강조), `sub`, `visual`. 리듬을 바꾸는 장면 |
| `contrast` | `before`, `after`(`LTT.beforeAfter`의 각 쪽) |
| `compare` | `items: [{label, visual, tone, verdict, note, noteAfter}]`, `form: "table"`·`head`, `cols`, `reveal`. 판정은 공개 뒤 |
| `predict` | `question`, `choices`, `answer`, `visual`(조건, `LTT.facts`), `answerVisual`, `why`, `hint`, `rest` |
| `summary` | 앞 takeaway를 모은다. `recall`이 있으면 질문 → "답 보기"의 인출 연습. `cards`로 직접 줄 수도 있다 |
| `keywords` | `terms: [{ko, en}]`, `signals`, `queries`, `neighbors: [{term, diff}]`. 작성하는 마지막 장면 |
| (없음) | `mount`로 그리는 커스텀 장면(손잡이 장면) |

시각 칸(`figure`, `visual`, `answerVisual`)은 HTML 문자열, 노드, 또는 `(el) => …` 함수를 받는다.

### 덱의 고정 순서

hook이 처음, keywords가 마지막, overview는 summary 바로 뒤다. figure `steps`·predict `answerVisual`을 쓸 때는 `kit/api/deck-contracts.md`를 읽는다. 장면의 `mount` 안에서 `LTT.clock`을 쓰면 장면을 떠날 때 자동으로 멈춘다.

## 부품 고르기

| 보여 줄 것 | 부품 | 참조 |
| --- | --- | --- |
| 박스와 화살표, 몇 개 | `LTT.diagram`(격자 좌표, `player` 단계 재생) | `kit/api/diagram.md` |
| 박스 20개 넘음·여러 겹 묶음 / 상태 전이 | `LTT.autoLayout` → `LTT.diagram` / `LTT.state` | `kit/api/diagram.md` |
| 누가 누구에게 언제 보내나 | `LTT.sequence` | `kit/api/sequence.md` |
| 어디에서 어디로(지리) | `LTT.map` | `kit/api/map.md` |
| 시간이 어디에 쓰이나 | `LTT.lanes` | `kit/api/charts.md` |
| 양을 고정 축에서 비교 | `LTT.hbars`, 좌표 플롯 `LTT.axisPlot`, 그 밖의 통계 차트 `LTT.plot` | `kit/api/charts.md` |
| 비율·건수 | `LTT.bar`, `LTT.units`(100칸) | `kit/api/charts.md` |
| 흐름의 양이 갈라지나 | `LTT.sankey` | `kit/api/charts.md` |
| 상황의 조건·숫자 | `LTT.facts`, `LTT.callout` | `kit/api/ui.md` |
| 실제 화면·로그·코드 | `LTT.mock.*` | `kit/api/mock.md` |
| 화면 간격·색 대비 | `LTT.redline`, `LTT.inspector` | `kit/api/ui.md` |
| 손잡이·단계 재생·시뮬레이션 | `LTT.sweep`, `LTT.drag`, `LTT.stepper`, `LTT.sim` | `kit/api/controls.md` |

손잡이는 변수의 모양으로 고른다(`LTT.sweep` `params`의 `kind`). 그 분야 사람이 실제로 만지는 손잡이가 있으면 그 모양을 따른다.

| 변수의 모양 | 손잡이 |
| --- | --- |
| 선택지 2–6개, 고정 단계(흔히 쓰는 TTL 값) | `"steps"` |
| 순환하는 값(각도, 색상, 시각) | `"dial"` |
| 자릿수가 바뀌는 범위(1초~1시간) | `"log"` |
| 서로 묶인 두 값(x·y) | `"pad"` |
| 그림 속 대상(벡터 끝, 경계선) | `LTT.drag`를 `control`로 |
| 연속된 한 값 | `"range"` |

## 조합 조각

덱과 부품의 문법을 보이는 조각이다. 수업 구성이나 그림 종류의 본보기가 아니다.

```js
const SVG = "http://www.w3.org/2000/svg";
const hours = (lines, parcels = 12000, perLine = 1500) => parcels / (lines * perLine); // 분류에 걸리는 시간
// 그림 함수는 새 svg를 만들어 { el }로 돌려준다. 주 그림이면 같은 함수를 figure·overview에서 다시 쓴다.
const hub = (el) => { const s = el.appendChild(document.createElementNS(SVG, "svg"));
  return { el: s, dg: LTT.diagram(s, { cols: 3, rows: 2, cell: [280, 170], node: [160, 64],
    nodes: [{ id: "in", c: 0, r: 0, l: "입고", icon: "truck" }, { id: "sort", c: 1, r: 0, l: "분류 라인", icon: "package" },
      { id: "out", c: 2, r: 0, l: "출고", icon: "route" }, { id: "cut", c: 1, r: 1, l: "마감", s: "18시", icon: "clock", k: "warn" }],
    edges: [{ f: "in", t: "sort", l: "12,000상자" }, { f: "sort", t: "out", l: "라인당 시간당 1,500" }, { f: "cut", t: "sort", dash: true }] }) }; };
const figureScene = { type: "figure", title: "상자는 분류 라인을 지나야 출고된다", sub: "위는 상자의 길, 아래는 지켜야 할 마감", figure: hub,
  steps: [{ caption: "① 입고된 상자가 분류 라인 앞에 쌓인다", enter: (k, f) => f.dg.highlight(["in", "sort"]) },
          { caption: "② 라인이 많을수록 빨리 비운다", enter: (k, f) => f.dg.highlight(["sort", "out"]) }],
  takeaway: "분류 시간은 물량 ÷ (라인 수 × 라인 처리량)이다.", recall: "라인을 두 배로 늘리면 분류 시간은?" };
const predictScene = { type: "predict", title: "라인 4개면 몇 시간 걸릴까?", question: "12,000상자, 라인 하나가 시간당 1,500상자",
  visual: () => LTT.facts([{ icon: "package", value: "12,000", label: "상자" }, { icon: "gauge", value: "1,500/시간", label: "라인당" }]),
  choices: [{ id: "1", text: "1시간" }, { id: "2", text: "2시간" }, { id: "8", text: "8시간" }], answer: "2",
  why: "12,000 ÷ (4 × 1,500) = 2. <span class=\"ltt-tag\">모델로 계산한 예시</span>" };
const knobScene = { title: "마감에 맞추려면 라인이 몇 개 필요할까", narration: "단계를 눌러 라인 수를 바꾼다. 막대는 분류에 걸리는 시간이다.",
  mount(body) {
    body.innerHTML = `<div id="g"></div><div class="ltt-param">라인 <b id="lines-v"></b><div id="lines"></div></div><div class="ltt-bar" id="b"></div>`;
    const bar = LTT.bar("b", [{ color: "var(--ltt-accent)" }, { color: "var(--ltt-line)" }]);
    LTT.sweep({ params: { lines: { kind: "steps", stops: [4, 6, 8, 10], value: 4, fmt: (v) => v + "개" } },
      render: ({ lines }) => { const h = hours(lines); bar.set([h * 25, 100 - h * 25], [h.toFixed(1) + "시간", ""]); },
      goal: { el: "g", text: "1.5시간 안에 끝나는 라인 수를 찾는다", check: ({ lines }) => hours(lines) <= 1.5 } });
    return {};
  }, takeaway: "라인 수를 늘리면 분류 시간은 반비례로 준다.", recall: "라인 8개면 몇 시간?" };
// LTT.deck({ title, theme, glossary, scenes: [hook, …, figureScene, predictScene, knobScene, …, summary, overview, keywords] })
LTT.expect("라인 8개 분류 시간", hours(8), 1, { tol: 1e-9 });
```

## 원칙

- 색은 위 토큰만 쓴다. hex를 새로 적으면 다크 모드가 깨진다(목업 속 '실제 화면' 색은 예외). 페이지 CSS에서 토큰을 다시 정의하지 않는다.
- 범위와 상수에는 `basis`를 적고, 근거가 약하면 "불확실", 화면 수치에는 "모델로 계산한 예시" 태그를 단다. 근거 없는 수치를 지어내지 않는다.
- lint는 `{{}}`로 표시된 용어만 안다. 표시하지 않은 전문 용어는 쓰는 사람이 풀어 둔다.
- 작성·점검 기준은 1280px 이상 데스크톱이다.
- figure 그림 폭을 `vw`로 고정하지 않는다(kit이 칸 폭을 준다).
