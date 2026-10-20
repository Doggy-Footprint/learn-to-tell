# kit API

수업 작성 참조. 빈 `lesson.html`에서 아래 부품을 조합해 짠다. 이 문서와 고른 부품 문서에 없는 것은 있는 부품으로 대신한다.

부품 문서는 아래 "부품 고르기" 표의 참조 열에서 고른 것만 읽는다. figure `steps`·predict `answerVisual`을 쓸 때만 `kit/api/deck-contracts.md`, audit·lint 규칙 뜻은 출력만으로 모를 때만 `kit/api/rules.md`, 글꼴·모양 토큰과 드문 ltt.js 이름은 `kit/api/base.md`.

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
<script src="/kit/ltt-deck.js"></script>
```

head에 `<script type="application/json" id="ltt-meta">{"topic", "audience", "theme", "medium", "decision"}</script>`를 둔다.

## 기본 이름

| 이름 | 설명 |
| --- | --- |
| `LTT.deck({title, theme, glossary: {용어: 풀이}, scenes})` | 장면 덱. 장면 하나 = 메시지 하나 = 스크롤 없는 한 화면 |
| `LTT.theme(name)`, `LTT.themes` | 테마. 덱에서는 `theme` 필드로 |
| `LTT.icon(name, {weight, cls})`, `LTT.icons` | 선 아이콘 SVG. `art`·`icon` 필드에는 이름만(아래 목록) |
| `LTT.palette()`, `LTT.palette(theme, "light"\|"dark")` | 범주형 색 6개. 계열 구분에만 |
| `LTT.mark(kind, {size, color, weight, fill, inline})`, `LTT.marks` | 모양 표식(square, ring, dot, diamond, cross). 색만으로 계열을 가르지 않게 |
| `{{용어}}`, `{{보이는 말\|용어}}` | 본문 속 용어. 덱이 풀이 팝오버로 바꾸고, 처음 나온 장면은 진하게 |
| `LTT.expect(label, actual, expected, {tol})` | 기대값 대조. 불일치는 패널과 서버에 남는다 |
| `LTT.lintDeck(spec)` | 독학 기준 점검 `[{scene, rule, msg}]`. 덱이 시작할 때 실행한다 |
| `LTT.record(type, data)` | 서버로 이벤트(lesson 페이지에서만) |
| `LTT.math(scope)` | `data-tex` 요소를 KaTeX로 |
| `LTT.MOTION_MS` | 기본 모션 길이. reduced-motion이면 0 |

색 토큰: `--ltt-bg` `--ltt-card` `--ltt-card-2` `--ltt-line` `--ltt-line-2` `--ltt-ink` `--ltt-ink-2` `--ltt-muted` `--ltt-accent(-soft)` `--ltt-good(-soft)` `--ltt-bad(-soft)` `--ltt-warn(-soft)` `--ltt-dark` `--ltt-on-dark`, 범주형 `--ltt-c1`…`c6`, 지도 `--ltt-sea` `--ltt-land` `--ltt-border`. CSS 클래스: `ltt-param`(손잡이 줄), `ltt-bar`, `ltt-stat`·`ltt-hero`(큰 숫자, `<small>` 단위), `ltt-key`(범례), `ltt-basis`(근거 작은 글), `ltt-tag`(+`warn`·`bad`·`good`·`muted`), `ltt-mono`.

아이콘: check x arrow arrow-down plus minus clock hourglass db server cache cpu memory user users doc search eye alert bolt refresh target chart trend phone monitor cursor lock send layers wind ruler scale dice home anchor pencil palette sun ball question bulb link inbox globe map-pin route git-branch timer database-zap network shield-check key-round mail package truck wifi cloud gauge workflow

### 테마

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

### 장면 고르기

- 고정 순서는 셋: hook이 처음, keywords가 마지막, overview는 summary 바로 뒤. 흔한 흐름은 hook → 파트마다 [(terms) → 원리 → predict → 조작] → summary → overview → keywords.
- 원리: 원인 → 과정 → 결과가 한 그림에 보이면 `figure`(번호 주석·단계 재생), 순서가 핵심이면 explain `strip`·`stack`, 독립 요소 나열만 `cards`. 수식(`tex`)보다 먼저.
- `statement`는 직관과 반대인 결론을 못 박을 때, `contrast`는 같은 대상의 BEFORE/AFTER, `compare`는 실제 사례 2–4개를 같은 질문으로(속성 차이면 `table`, 판정을 미리 말하는 설명은 `noteAfter`).
- `predict`는 퀴즈가 아니다. 결정 변수를 조작하는 장면 바로 앞에 둔다. 질문 용어는 앞 장면에서 푼다. 사용자가 세계·시스템을 짐작할 때만 쓴다(자기 편향 체험은 연구 사례 `compare`로).
- 조작(`mount` 안의 `LTT.sweep`)은 조작 자체가 배움일 때만, 실사용 범위만. `goal`은 손잡이 두 자리 이상에서 맞고, 시작 위치는 목표 밖에 둔다. 결정 변수끼리 영향을 주면 summary 앞에 손잡이를 함께 여는 샌드박스를 둘 수 있다.
- 모션은 아끼지 않는다(3B1B·설명 GIF처럼): 선이 그려지고, 모양이 바뀌고, 값이 쌓이고, 패킷이 흐르며 메커니즘을 보인다. 자동 재생·반복도 된다. 효과를 흩뿌리지 말고 장면마다 잘 짜인 움직임 하나를 둔다. 반복은 `leave`에서 멈추고, reduced-motion이면 최종 상태를 보인다.

### 부품 고르기

그림의 모양은 개념의 구조를 따른다: 순환은 원, 순서는 줄, 비율은 넓이, 연결은 선. 직접 그리기 전에 이 표를 본다.

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

### 독학 기준

- 장면마다 독자의 질문에 답한다: 왜 보지(`hook`), 무슨 뜻이지(`terms`·`{{}}`, 새 용어는 장면당 2개 이하), 어딜 보지(`points`·`sub`·범례), 왜 그렇지(그림 위 라벨·화살표·단계 자막), 내 일에선(목업·사례), 어디서 틀리지(`predict`+`why`), 뭘 기억하지(주장 제목, `takeaway`+`recall`), 더 알려면(`basis`·`sources`·`ask`·`keywords`).
- 익히는 장면은 인포그래픽으로: 설명은 그림 위 번호 주석·라벨·짧은 문구로 얹고, 얹을 수 없는 것만 글로 쓴다. 확인하는 `summary`는 반대로 글과 `recall`이다.
- 글이 말하는 동작(돌린다, 늘린다, 옮긴다)과 그림·손잡이의 동작을 맞춘다.
- 장면마다 가장 큰 것은 그림 하나다. 그림 아래 문단이 그림보다 길면 장면을 나눈다. 카드 격자(explain `cards`, compare, terms, summary)는 연속 2장까지, 전체의 절반 이하.
- 글자 크기는 kit 단계만 쓴다. `accent`는 장면당 한 의미, good·bad·warn은 판정에만. 색 이름("파란 선") 대신 모양·라벨로 가리킨다.
- 구조 장치는 정보일 때만: 번호는 실제 순서일 때, 테두리·카드는 따로 떼어 볼 것에만. 장식 이모지는 쓰지 않는다.

## 조합 조각

문법을 보이는 조각이다. 장면 구성·장면 수·그림 종류의 본보기가 아니다. 장면 구성은 SKILL.md §3과 위 "장면 고르기"로 주제에 맞게 짠다.

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

- 페이지에는 모델 함수, 기대값, 장면 데이터, 부품 조합, 그 수업에만 필요한 작은 CSS만 둔다. kit에 없는 부품이 필요하면 페이지에 짜고 `result.md`의 "kit 후보"에 적는다.
- 색은 위 토큰만 쓴다. hex를 새로 적으면 다크 모드가 깨진다(목업 속 '실제 화면' 색은 예외). 범주 색은 `--ltt-c1`부터 차례로 쓴다.
- 테마는 매체를 고르는 것이지 장식이 아니다. 페이지 CSS에서 토큰을 다시 정의하지 않는다.
- 범위와 상수에는 `basis`를 적고, 근거가 약하면 "불확실", 화면 수치에는 "모델로 계산한 예시" 태그를 단다. 근거 없는 수치를 지어내지 않는다. 실제 활용 예와 실패·주의 예를 함께 둔다. 목업·표에는 "항목 1" 같은 채움 글 대신 사용자 작업에서 나올 법한 이름과 값을 넣는다.
- lint는 `{{}}`로 표시된 용어만 안다. 표시하지 않은 전문 용어는 쓰는 사람이 풀어 둔다.
- 작성·점검 기준은 1280px 이상 데스크톱이다. 폰에서는 kit이 한 열로 다시 배치한다.
- figure 그림 폭을 `vw`로 고정하지 않는다(kit이 칸 폭을 준다).
