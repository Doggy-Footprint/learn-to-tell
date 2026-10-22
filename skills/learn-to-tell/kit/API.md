# kit API

kit은 기능을 제공하고 그리는 방법을 정하지 않는다. 필요한 부품만 "부품 찾기"로 찾아 쓰고, 없는 것은 페이지에 직접 짠다(SVG, canvas, d3 모두 된다). 글꼴·모양 토큰과 드문 ltt.js 이름은 `kit/api/base.md`.

## 페이지 계약

수업은 `lessons/<id>/lesson.html` 한 페이지다. 기본 구성은 `LTT.deck` 슬라이드다(아래 "덱"). 지킬 것은 둘이다.

1. head에 `<script type="application/json" id="ltt-meta">{"topic", "audience", "theme", "medium", "decision", "glossary"}</script>`를 둔다. `glossary`는 `{용어: 풀이 HTML}`이고 본문의 `{{용어}}`가 이것으로 팝오버가 된다(덱 밖 페이지도 같다. 덱의 `glossary`·terms와 합쳐지고 같은 용어는 메타가 이긴다).
2. 계산한 수치는 `LTT.expect`로 대조한다(아래 "기본 이름").

페이지를 열면 kit이 결정적 결함을 스스로 검사한다. 결과는 `#ltt-check`(`<script type="application/json" id="ltt-check">{"source": "deck"|"page", "viewport": [w, h], "errors": [{where, rule, msg}], "advice": [같은 꼴], "scroll", "scenes", "sceneList": [{n, title, states}], "clocks": [{id, dur}]}</script>`, `scenes`·`sceneList`는 덱만), `<html data-ltt-check="errors 건수">`, 패널 경고, `lint` 이벤트다. `errors`는 고칠 결함이다: 등급 "고침" 덱 lint(`where`는 `장면 n`·`덱`), 로드 중 예외 `script-error`, 장면을 그리다 난 예외 `scene-error`(그 장면은 빈 본문). 등급 "권고"는 `advice`에만 있고 건수에 안 든다. `clocks`는 id를 붙인 `LTT.clock`을 만든 순서로 담고(같은 id는 `clock-duplicate-id`), 덱이 아닌 페이지는 h1–h3 구역이 `where`다.

`?shot`은 스크린샷 모드다: `#ltt-expect` 패널이 숨고 모든 `LTT.clock`이 `draw(dur)`만 그린다. `?shot&y=<px>`는 검사 뒤 그 높이로 스크롤하고, `?shot&clock=<id>&t=<ms>`는 그 clock만 `draw(t)`로 그려(다른 clock은 `dur`) 화면 안에 오게 스크롤한다(덱이면 그 장면). 덱의 `#n`은 `?shot`에서도 n번 장면을 고르고, `&state=reveal|step-<k>`는 공개·단계 상태를 그린다(`kit/api/deck-contracts.md`). `audit.mjs --shots`가 이 모드로 PNG와 `index.md`를 만든다.

## 불러오기

순서를 지킨다. "필수"는 모든 수업에 필요하다(d3가 없으면 `ltt-parts.js`가 던져 덱이 안 그려지고 `script-error`가 난다). 주석이 달린 나머지는 그 부품을 쓸 때만 불러온다.

```html
<link rel="stylesheet" href="/kit/vendor/katex/katex.min.css"> <!-- 수식 -->
<script src="/kit/vendor/d3.min.js"></script> <!-- 필수 -->
<script src="/kit/vendor/plot.umd.min.js"></script> <!-- plot, 전역 Plot -->
<script src="/kit/vendor/katex/katex.min.js"></script> <!-- 수식 -->
<script src="/kit/vendor/d3-sankey.min.js"></script> <!-- sankey -->
<script src="/kit/vendor/topojson-client.min.js"></script> <!-- map -->
<script src="/kit/vendor/prism/prism.min.js"></script> <!-- mock.code의 lang -->
<script src="/kit/vendor/elk.bundled.js"></script> <!-- autoLayout·state -->
<script src="/kit/vendor/rough.js"></script> <!-- sketch 손그림 선 -->
<script src="/kit/ltt.js"></script> <!-- 필수 -->
<script src="/kit/ltt-parts.js"></script> <!-- 필수 -->
<script src="/kit/ltt-ui.js"></script> <!-- 필수 -->
<script src="/kit/ltt-mock.js"></script> <!-- 목업 -->
<script src="/kit/ltt-deck.js"></script> <!-- 덱 -->
```

## 기본 이름

| 이름 | 설명 |
| --- | --- |
| `LTT.deck({title, theme, glossary: {용어: 풀이}, scenes})` | 장면 덱(선택). 장면 하나 = 스크롤 없는 한 화면 |
| `LTT.theme(name)`, `LTT.themes` | 테마(아래 표). 덱에서는 `theme` 필드로, 덱이 아니면 `LTT.theme(name)`으로 켠다 |
| `LTT.icon(name, {weight, cls})`, `LTT.icons` | 선 아이콘 SVG. `art`·`icon` 필드에는 이름만(아래 목록) |
| `LTT.palette()`, `LTT.palette(theme, "light"\|"dark")` | 범주형 색 6개. 계열 구분에만 |
| `LTT.mark(kind, {size, color, weight, fill, inline})`, `LTT.marks` | 모양 표식(square, ring, dot, diamond, cross). 색만으로 계열을 가르지 않게 |
| `{{용어}}`, `{{보이는 말\|용어}}` | 본문 속 용어. 풀이 팝오버가 된다 |
| `LTT.expect(label, actual, expected, {tol})` | 기대값 대조. 불일치는 패널과 서버에 남는다 |
| `LTT.check()` | 결함 검사를 지금 다시 돌려 `#ltt-check`와 같은 객체를 돌려주고 `data-ltt-check`·패널을 갱신한다 |
| `LTT.clock(el, draw, {dur, loop, id})` | 움직이는 그림의 시계 → `{play, pause, seek}`. `draw(t)`(t는 0~`dur` ms)를 `el`이 보이는 동안 프레임마다 부르고 `loop`이 아니면 `draw(dur)`에서 멈춘다. reduced-motion·`?shot`이면 `draw(dur)` 한 번뿐. `id`를 붙이면 checklist `[shot <id> <ms>]`로 그 시점을 찍는다 |
| `LTT.lintDeck(spec)` | 덱 장면 데이터 점검 `[{scene, rule, msg}]`. 덱이 시작할 때 실행한다 |
| `LTT.record(type, data)` | 서버로 이벤트(lesson 페이지에서만) |
| `LTT.math(scope)`, `LTT.MOTION_MS` | `data-tex` 요소를 KaTeX로 / 기본 전환 길이(reduced-motion이면 0) |

색 토큰: `--ltt-bg` `--ltt-card` `--ltt-card-2` `--ltt-line` `--ltt-line-2` `--ltt-ink` `--ltt-ink-2` `--ltt-muted` `--ltt-accent(-soft)` `--ltt-good(-soft)` `--ltt-bad(-soft)` `--ltt-warn(-soft)` `--ltt-dark` `--ltt-on-dark`, 범주형 `--ltt-c1`…`c6`, 지도 `--ltt-sea` `--ltt-land` `--ltt-border`. CSS 클래스: `ltt-param`(손잡이 줄), `ltt-bar`, `ltt-stat`·`ltt-hero`(큰 숫자, `<small>` 단위), `ltt-key`(범례), `ltt-basis`(근거 작은 글), `ltt-tag`(+`warn`·`bad`·`good`·`muted`), `ltt-mono`.

아이콘: check x arrow arrow-down plus minus clock hourglass db server cache cpu memory user users doc search eye alert bolt refresh target chart trend phone monitor cursor lock send layers wind ruler scale dice home anchor pencil palette sun ball question bulb link inbox globe map-pin route git-branch timer database-zap network shield-check key-round mail package truck wifi cloud gauge workflow

### 테마

주제의 분야를 키워드 열에서 찾아 고르고, 없으면 그 분야 사람이 실제로 보는 매체에 가장 가까운 것을 고른다. 고르지 않으면 `studio`.

| theme | 매체 | 키워드 |
| --- | --- | --- |
| `studio` | 제품 화면·디자인 툴 | UI/UX, 제품 화면, 프런트엔드, 디자인 시스템, A/B 실험, 퍼널, 이미지 처리 |
| `paper` | 논문 figure·교과서 | 통계, 인지과학, 심리 실험, 교육학, 언어학, 알고리즘, 신호처리 |
| `chalk` | 칠판 강의·판서 노트 | 수학 유도·증명, 선형대수, 미적분, 벡터 미적분, 확률 기초, 수식 전개, 기하 |
| `essay` | 인문서·에세이 지면 | 철학, 윤리, 문학, 역사, 사회 이론, 심리 에세이, 고전 읽기, 종교 |
| `blueprint` | 회로·블록 도면 | 하드웨어, 회로, 칩 설계, GPU, 컴퓨터 구조, 시스템 블록도, 반도체, 기계 장치 |
| `terminal` | 터미널·로그·대시보드 | 백엔드, 인프라, 클라우드 운영, DB, 런타임, 네트워크, 보안, 컴파일러, 로그·모니터링 |
| `spec` | 표준 문서·명세서(RFC) | 프로토콜 명세, 표준·규격, RFC, 스키마·데이터 모델, 온톨로지, 파일 형식, 법 조문·규정 |
| `notebook` | Jupyter·연구 노트북 | 머신러닝, 딥러닝, LLM, 모델 내부, 데이터 분석, 데이터 과학, 모델 평가 |
| `ledger` | 경제 신문 차트 | 금융, 투자, 거시경제, 회계, 물가, 부동산, 경제 지표 |
| `lab` | 실험 노트·모눈 플롯 | 물리, 화학, 공학, 제어, 시뮬레이션, 측정 실험, 열역학 |
| `clinic` | 의학 교과서·진료 차트 | 의학, 약리, 생리, 해부, 생물, 세포, 영양, 공중보건, 임상 시험 |
| `field` | 야외 도감·현장 노트 | 생태, 진화, 기후, 지구과학, 지질, 농업, 원예, 환경 |
| `atlas` | 지도·지리·물류(+`LTT.map`) | 지리, 리전, 물류, 공급망, 도시, 교통, 해양, 에너지 지도 |
| `atelier` | 스케치북·화실 | 드로잉, 회화, 색채, 미술사, 사진 구도, 조형, 공예 |
| `score` | 오선지·악보 | 음악 이론, 화성, 리듬, 음계, 음향, 악기, 작곡 |
| `playbook` | 전술판·경기 분석 | 스포츠 전술, 경기 데이터, 포메이션, 게임 전략, 보드게임, e스포츠 |
| `sketch` | 화이트보드·손그림 설명 | 첫 소개, 아키텍처 스케치, 분산 시스템 개념, 제품·조직 프로세스, git |

## 덱

### 모든 장면의 공통 필드

| 필드 | 뜻 |
| --- | --- |
| `title`, `en` | 주장 문장으로 쓴 제목, 영문 보조 제목 |
| `kicker`, `sub`, `chips` | 제목 위 작은 알약 / 제목 아래 한두 줄(상황, 읽는 법) / 키워드 |
| `narration` | 해설 2–4문장. 있으면 그림 옆 설명 레일이 생긴다 |
| `points`, `pointsOn`, `pointsTone` | 번호 주석 `[{at: [x%, y%], text}]`. 대상은 `pointsOn` 셀렉터, 없으면 `[data-annotate]`, 없으면 본문의 첫 요소 |
| `takeaway`, `recall`, `ask`, `sources` | 핵심 한 문장 / 그것을 떠올리게 하는 질문 / agent에게 할 질문 / 찾아볼 곳. summary가 모은다. predict와 판정 공개형 compare의 `takeaway`는 공개 뒤에 보인다(자리는 유지) |
| `basis`, `tex`, `aside` | 근거 한 줄, 접힌 수식, 설명 레일의 추가 부품 |
| `mount(body, ctx)` → `{enter, leave}`, `enter` | 커스텀 그림. ctx: `{el, scene, index, scenes}` |
| `layout`, `bare`, `number: false` | `"split"`·`"stack"`·`"full"`(기본값: deck-contracts.md) / split 카드 테두리 없앰 / 장면 번호 숨김 |

### 장면 타입

| type | 필드 |
| --- | --- |
| `hook` | `art`(아이콘 이름·HTML), `pre`, `text`, `sub`. 첫 장면 |
| `terms` | `terms: [{key, word, en, icon, visual, plain, example}]`. key는 glossary에 등록. `visual`은 그 말이 가리키는 것을 보이는 작은 그림 |
| `explain` | `steps: [{icon, title, text, visual}]`, `form`: `"cards"`(독립 요소), `"strip"`(한 줄 흐름), `"stack"`(세로 타임라인, 단계마다 그림), `arrows` |
| `figure` | `figure`(노드·HTML·함수), `caption`, `label`, `steps`. 그림 하나가 화면을 차지한다. `figure` 필드는 `type`이 `figure`·`overview`일 때만 그려진다 |
| `overview` | `figure`, `caption`, `label`. summary 뒤 한 장 인포그래픽: 주 그림에 앞 takeaway를 자리(구역·번호)로 놓는다 |
| `statement` | `title`(큰 주장, `<em>` 강조), `sub`, `visual`. 리듬을 바꾸는 장면 |
| `contrast` | `before`, `after`(`LTT.beforeAfter`의 각 쪽) |
| `compare` | `items: [{label, visual, tone, verdict, note, noteAfter}]`, `form: "table"`·`head`, `cols`, `reveal`. 판정은 공개 뒤 |
| `predict` | `question`(화면에 보이는 질문, 조건 `visual` 위에 그려진다), `choices: [{id, text}]`(2개 이상), `answer: id`(choices 중 하나), `visual`(조건, `LTT.facts`), `answerVisual`, `why`, `hint`, `rest` |
| `summary` | 앞 takeaway를 모은다. `recall`이 있으면 질문 → "답 보기"의 인출 연습. `cards`로 직접 줄 수도 있다 |
| `keywords` | `terms: [{ko, en}]`, `signals`, `queries`, `neighbors: [{term, diff}]`, `next: [{term, why, from?}]`. 수업의 마지막 작성 장면이고 `next`가 개념 나무다: 덱 제목이 뿌리, `from`이 다른 항목의 `term`이면 그 아래 가지, 아니면 뿌리 아래 |
| (없음) | `mount`로 그리는 커스텀 장면(손잡이 장면) |

시각 칸(`figure`, `visual`, `answerVisual`)은 HTML 문자열, 노드, 또는 `(el) => …` 함수를 받는다.

### 덱의 고정 순서

hook(처음) → 본문 장면 → summary → overview → keywords(마지막) 순서다. figure `steps`·predict `answerVisual`을 쓸 때는 `kit/api/deck-contracts.md`를 읽는다.

## 부품 찾기

kit 코드 부품마다 머리에 `// @ltt-part LTT.이름 | 대상: … | 방식: … | 그림: … | 문서: kit/api/….md`가 있다. 설명 대상·방식·그림 종류의 말로 `grep -n "@ltt-part" <skill>/kit/*.js | grep -i "<키워드>"`를 실행해 걸린 줄의 `문서:`만 읽는다. 걸리지 않으면 다른 축의 말로 한 번 더 찾고, 그래도 없으면 직접 짠다.

## 조합 조각

덱과 부품의 문법을 보이는 조각이다. 수업 구성이나 그림 종류의 본보기가 아니다.

```js
const SVG = "http://www.w3.org/2000/svg";
const hours = (lines, parcels = 12000, perLine = 1500) => parcels / (lines * perLine);
// 그림 함수는 새 svg를 만들어 { el }로 돌려준다. 주 그림이면 같은 함수를 figure·overview에서 다시 쓴다.
const hub = (el) => { const s = el.appendChild(document.createElementNS(SVG, "svg"));
  return { el: s, dg: LTT.diagram(s, { cols: 3, rows: 1, cell: [280, 170], node: [160, 64],
    nodes: [{ id: "in", c: 0, r: 0, l: "입고", icon: "truck" }, { id: "sort", c: 1, r: 0, l: "분류 라인", icon: "package" },
      { id: "out", c: 2, r: 0, l: "출고", icon: "route" }],
    edges: [{ f: "in", t: "sort", l: "12,000상자" }, { f: "sort", t: "out", l: "라인당 시간당 1,500" }] }) }; };
const figureScene = { type: "figure", title: "상자는 분류 라인을 지나야 출고된다", sub: "상자가 지나는 길", figure: hub,
  steps: [{ caption: "① 입고된 상자가 분류 라인 앞에 쌓인다", enter: (k, f) => f.dg.highlight(["in", "sort"]) },
          { caption: "② 라인이 많을수록 빨리 비운다", enter: (k, f) => f.dg.highlight(["sort", "out"]) }],
  takeaway: "분류 시간은 물량 ÷ (라인 수 × 라인 처리량)이다.", recall: "라인을 두 배로 늘리면 분류 시간은?" };
const predictScene = { type: "predict", title: "라인 4개면 몇 시간 걸릴까?", question: "12,000상자, 라인 하나가 시간당 1,500상자",
  visual: () => LTT.facts([{ icon: "package", value: "12,000", label: "상자" }, { icon: "gauge", value: "1,500/시간", label: "라인당" }]),
  choices: [{ id: "1", text: "1시간" }, { id: "2", text: "2시간" }, { id: "8", text: "8시간" }], answer: "2",
  why: "12,000 ÷ (4 × 1,500) = 2. <span class=\"ltt-tag\">모델로 계산한 예시</span>" };
const knobScene = { title: "1.5시간 안에 끝내려면 라인이 몇 개 필요할까", narration: "단계를 눌러 라인 수를 바꾼다. 막대는 분류에 걸리는 시간이다.",
  mount(body) {
    body.innerHTML = `<div id="g"></div><div class="ltt-param">라인 <b id="lines-v"></b><div id="lines"></div></div><div class="ltt-bar" id="b"></div>`;
    const bar = LTT.bar("b", [{ color: "var(--ltt-accent)" }, { color: "var(--ltt-line)" }]);
    LTT.sweep({ params: { lines: { kind: "steps", stops: [4, 6, 8, 10], value: 4 } },
      render: ({ lines }) => { const h = hours(lines); bar.set([h * 25, 100 - h * 25], [h.toFixed(1) + "시간", ""]); },
      goal: { el: "g", text: "1.5시간 안에 끝나는 라인 수를 찾는다", check: ({ lines }) => hours(lines) <= 1.5 } });
    return {};
  }, takeaway: "라인 수를 늘리면 분류 시간은 반비례로 준다.", recall: "라인 8개면 몇 시간?" };
LTT.expect("라인 8개 분류 시간", hours(8), 1, { tol: 1e-9 });
```

## 원칙

- 색은 위 토큰만 쓴다. hex를 새로 적으면 다크 모드가 깨진다(목업 속 '실제 화면' 색은 예외). 페이지 CSS에서 토큰을 다시 정의하지 않는다.
- 범위와 상수에는 `basis`를 적고, 근거가 약하면 "불확실", 화면 수치에는 "모델로 계산한 예시" 태그를 단다. 근거 없는 수치를 지어내지 않는다.
- lint는 `{{}}`로 표시된 용어만 안다. 표시하지 않은 전문 용어는 쓰는 사람이 풀어 둔다.
- 작성·점검 기준은 1280px 이상 데스크톱이다.
- figure 그림 폭을 `vw`로 고정하지 않는다(kit이 칸 폭을 준다).
