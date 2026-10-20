# kit API (v2)

수업 하나 = HTML 파일 하나 = `LTT.deck({...})` 호출 하나. 이 문서에 없는 것은 있는 부품으로 대신하고 `result.md`의 "kit 후보"에 적는다. kit 소스는 읽지 않는다.

```html
<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>주제</title><script src="/kit/ltt.js"></script></head><body><script>
LTT.deck({ lesson: "<id>", title: "…", theme: "studio", goal: ["…"], glossary: { "용어": "풀이" }, scenes: [ … ] });
</script></body></html>
```

수식(`LTT.math`)을 쓸 때만 `ltt.js` 앞에 `<link rel="stylesheet" href="/kit/vendor/katex/katex.min.css"><script src="/kit/vendor/katex/katex.min.js"></script>`.

## 덱

| 필드 | 뜻 |
| --- | --- |
| `title` | 수업 제목(상단 칩) |
| `theme` | `studio` 제품 화면 · `paper` 논문·교과서 · `blueprint` 회로·블록 도면 · `terminal` 로그·인프라 · `ledger` 경제 신문 · `lab` 실험 플롯 · `sketch` 화이트보드 |
| `goal` | 확정한 학습 목표 1–3줄(각 ≤50자). hook에 "이 수업을 마치면"으로 나온다 |
| `glossary` | `{용어: 풀이}`. 본문에서 `{{용어}}`, `{{보이는 말\|용어}}`로 표시하면 풀이 팝오버가 된다. terms 장면에 나온 용어도 정의로 친다 |
| `budget` | 장면이 12개를 넘을 때만 `{scenes, why}` |

장면 순서: `hook` 처음 … `summary` → `overview` → `keywords` 끝. 결정 변수마다 `predict` → `play`(또는 figure) → `recall`.

## 장면

모든 장면 공통(상한은 글자 수): `title`(≤44, 주장 문장) `kicker`(≤20) `sub`(≤100, 읽는 법) `takeaway`(≤60, 핵심 바) `basis`(≤90, 근거·출처) `recall: {q ≤50, a ≤90}`(summary가 모은다) `visual`(부품) `motion`(아래) `points: [{on: id, text ≤70}]`(≤5, 그림의 id에 번호 핀. `note`가 있으면 차례로 켜진다) `layout: "full"|"split"|"stack"` `loop`(기본 true) `hold`(반복 사이 쉬는 초, 기본 1.6). `side`(그림 옆 칸)는 figure·overview에만 둔다.

| type | 추가 필드 | 화면 |
| --- | --- | --- |
| `hook` | `text`(≤56, 큰 문장) `pre`(≤24) `visual` · `layout: "stack"`(그림을 문장 아래 넓게) | 왼쪽 큰 문장·목표, 오른쪽 그림 |
| `terms` | `terms: [{term ≤20, plain ≤60, on: id}]`(그림 있으면 ≤4, 없으면 ≤6 · plain ≤80) `visual` | 그림 하나에 용어 자리를 차례로 강조 |
| `figure` | `visual` 또는 `statement`(≤90 큰 주장) · `narration`(≤180) · `side`(ledger·facts) · `steps` | 그림 하나 |
| `predict` | `q`(≤60) `choices`(2–4개, 각 ≤40) `answer`(0부터) `why`(≤130) · motion에 `["mark","ask"]` | 고르기 전엔 ask까지 반복, 고르면 나머지 재생 + 이유 |
| `play` | `knobs` `visual: p => 부품` `readout: p => [{label ≤16, value, unit, tone}]`(≤4) `goal: {text ≤50, check: p => bool}` · `motion`도 `p => [...]`가 된다 | 손잡이가 params를 바꾸면 그림을 다시 만든다 |
| `compare` | `left`/`right`: `{label ≤20, tag ≤12, tone, visual, text ≤110}` | 같은 축의 두 그림. 동사는 그 id를 가진 쪽으로 간다 |
| `summary` | `items`(≤4, 장면 recall과 합쳐 4개) | 떠올린 뒤 답 보기 |
| `overview` | `visual`(주 그림 다시) `points`(takeaway 자리) | 한 장 정리, 수업 목록의 대표 이미지 |
| `keywords` | `remember` `signals` `queries`(각 ≤4개, ≤50자) | 기억할 것·다시 볼 신호·검색어 |

`knobs`: `{id, label ≤18, min, max, value, step, unit ≤4, log, fmt: v => 문자열}` 또는 `{id, label, options: [...](2–5개), value}`, 최대 3개. 범위는 실사용 범위만 둔다.
`steps`: `[{caption ≤90, motion: [...], hold}]` 2–6개. 단계마다 그 motion을 재생하고 자막을 바꾼다. 아래 단계 점을 누르면 그 단계로 간다(`motion`과 같이 쓰지 않는다).
predict와 play에는 `narration`을 쓰지 않는다(오른쪽 칸을 선택지·손잡이가 쓴다).

## 그림 고르기

| 설명 방법 | 부품 | 등급 |
| --- | --- | --- |
| 비율·건수(100명 중 n명) | `LTT.units` | S |
| 큰 숫자 2–4개 | `LTT.facts` | S |
| 값의 추이·관계·분포 | `LTT.chart` | S(움직이면 M) |
| 조건별 비교표 | `LTT.table` | S |
| 단계·파이프라인 | `LTT.pipeline` | S |
| 시간순 사건 | `LTT.timeline` | S |
| 로그·코드 | `LTT.terminal`, `LTT.code` | S |
| 수식 전개 | `LTT.math` | S |
| 주의·실패 사례 한 줄 | `LTT.callout` | S |
| 상자와 화살표, 흐름, 순환, 트리 | `LTT.graph` | M |
| 요청·응답 순서 | `LTT.sequence` | M |
| 무작위 → 분포 | `LTT.dist` | M |
| 모양이 바뀌는 도형·배치 | `LTT.morph` | M |
| 같은 그림 여러 조건 | `LTT.multiples` | M |
| 그림 옆 계수판 | `LTT.ledger`(`side`에) | S |
| 위 어디에도 안 맞는 도메인 그림 | `LTT.draw` (`api/draw.md`) | B |

S = kit이 넘침·겹침을 막는다. M·B = check가 만든 프레임 sheet를 눈으로 본다. 상한을 넘기면 그리기 전에 오류가 난다(메시지대로 줄인다).

## 부품

```js
LTT.units({ n: 100, cols, order: "random", seed, groups: [{ k: 25, label: "원본 요청", tone: "bad" }] })   // n ≤200, groups ≤5
LTT.facts([{ value: 75, unit: "%", label: "hit 비율", tone: "good" }])                             // ≤4, value ≤9자, label ≤36
LTT.callout({ tone: "warn", icon: "alert", title: "≤36", text: "≤150" })
LTT.table({ cols: ["조건", { label: "p99", num: true }], rows: [["a", { v: 12, tone: "bad" }]], highlight: { row: 0 } })  // 열 2–5, 행 ≤6(열≤3이면 7), 칸 ≤84/열수 자
LTT.pipeline({ steps: [{ title: "≤16", text: "≤50", icon }] })          // 2–6
LTT.timeline({ events: [{ t: "2019", title: "≤20", text: "≤50" }] })   // 2–7
LTT.terminal({ title, lines: ["…", { text: "…", tone: "ok"|"warn"|"err"|"dim"|"hl" }] })  // ≤12줄, 줄 ≤64자
LTT.code({ title, code: "…", marks: { 3: "add"|"del"|"hl" } })        // ≤12줄
LTT.math({ steps: ["a^2+b^2", "= c^2"] })                               // ≤4
LTT.chart({ x: { label ≤28, domain: [0, 300], fmt, unit, ticks } /* 또는 cats: [...] */, y: { label ≤28, domain: [0, 1], fmt: v => …, unit, ticks },
  series: [{ id, label ≤18, type: "line"|"area"|"step"|"dot"|"bar", points: [[x, y]…] /* 범주 축이면 values */, tone, dash, showValues }],
  refs: [{ id, x 또는 y, label ≤20 }], stack: false /* 막대만 쌓는다 */, legend: true, aspect: 2, mobileAspect })
  // series ≤6, points ≤400, domain 필수(축은 고정). y가 null이면 선이 끊긴다. label 없는 계열은 범례에 없다
LTT.graph({ layout: "chain"|"ring"|"tree"|"grid"|"manual", track: false, aspect, mobileAspect, cols /* grid */,
  nodes: [{ id, label ≤16, sub ≤20, icon, tone, shape: "round", ghost, at: [x%, y%], m: [x%, y%] /* manual, m은 폰 자리 */ }],
  edges: [{ from, to, label ≤14, dash, tone, curve }] })              // nodes ≤10, edges ≤16, 간선 id = "from>to"
LTT.sequence({ actors: ["사용자", "캐시", "원본"], messages: [{ from, to, label ≤24, reply, tone }] })  // actors 2–5, messages ≤10
LTT.dist({ bins: { min, max, n ≤24 }, n ≤400, sample: "normal" | { mean, sd } | [값…], seed, label, unit })
LTT.morph({ aspect, mobileAspect, shapes: {
    a: { kind: "rect", x, y, w, h, rx }, b: { kind: "circle", x, y, r }, c: { kind: "ellipse", x, y, rx, ry },
    d: { kind: "line", x1, y1, x2, y2 }, e: { kind: "path", d: "M10 80 L50 20 A20 20 0 0 1 90 80 Z" }, f: { kind: "polygon", points: "10,90 50,10 90,90" },
    g: { kind: "label", x, y, text ≤24, anchor: "l"|"r"|"t"|"b" /* (x, y)가 글의 왼쪽·오른쪽 끝·위·아래 */, cls: "big"|"strong"|"muted"|"chip" } },   // 공통: fill stroke strokeWidth dash tone opacity
  states: { B: { a: { x: 60, fill: "--ltt-bad" }, g: { text: "후" } } })
  // 좌표·반지름·path의 모든 수는 그림의 %(가로 기준 x, 세로 기준 y). w/h = width/height, x/y = cx/cy. shapes ≤40
  // 색은 토큰 이름("--ltt-accent"). fill을 주면 면이 칠해지므로 선만 그릴 path에는 fill을 두지 않는다
LTT.multiples({ cols, panels: [{ title ≤24, part: LTT.chart({...}) }] })   // 2–6. 동사는 칸 안 부품의 id로 부른다(같은 id면 모든 칸, panel: i로 한 칸). 칸 전체는 p0…
LTT.ledger([{ id, label ≤18, value, unit, tone, total: true /* 합계 줄 */ }])   // ≤6, side에
```

`tone`: `accent` `good` `bad` `warn` `muted` `ink`. 아이콘 이름은 `LTT.icons`(틀리면 오류가 목록을 보여 준다): check x arrow clock db server cache cpu memory user doc search alert bolt refresh chart lock send layers globe network key-round package cloud gauge 등.

## 움직임 (motion)

`motion`은 단계 배열이다. 앞 단계가 끝나면 다음이 시작하고, 끝나면 `hold`초 쉬고 처음부터 반복한다. 모든 화면은 시간 t의 함수라서 아무 시각이나 다시 그릴 수 있다.

```js
motion: [
  ["travel", { along: "user>cache>db", dots: 3 }],          // [동사, 인자] — dur(초)는 생략하면 기본값
  { par: [["pulse", { node: "db" }], ["count", { id: "orig", to: 1 }]] },   // 동시에
  ["wait", 0.5], ["mark", "ask"],                            // 멈춤, predict의 질문 지점
  ["zoom", { to: "cache" }], ["note", { n: 1 }], ["reset"]
]
```

| 동사 | 부품 | 인자 |
| --- | --- | --- |
| `show` `hide` | id가 있는 모든 부품 | `{id}` 또는 `{ids: [...]}` 그 뒤로 계속 보이거나 숨는다 |
| `highlight` `dim` | id가 있는 모든 부품 | `{id, tone}` / `{except: [...]}` 그 단계 동안만(계속 두려면 `keep: true`) |
| `travel` | graph | `{along: "a>b>c" \| [...], dots, tone, stay}` 점이 간선을 따라 간다 |
| `flow` | graph | `{edges: ["a>b"], n, speed, tone}` 그동안 입자가 계속 흐른다 |
| `pulse` `set` `relayout` | graph | `{node, tone}` / `{node, sub, tone}` / `{to: {id: [x%, y%]}, m: 폰 자리}` |
| `send` | sequence | `{i}` 또는 `{from, to}` 메시지가 차례로 간다 |
| `draw` `grow` | chart | `{id}` 선이 그려지고 막대가 자란다(없으면 전부) |
| `to` | chart / morph | `{id, points 또는 values}` 같은 축에서 값이 바뀐다(쌓은 막대도) / `{state}` |
| `point` | chart | `{id, from, to, keep}` 점이 곡선을 따라가며 x를 훑는다(그 단계 동안만) |
| `scan` | chart·table·units·code·terminal | `{from, to, width, keep}` 강조 띠가 훑는다 |
| `fill` | units | `{group}` 칸이 차례로 찬다 |
| `step` | pipeline·timeline·math | `{to}` 그 단계까지 보인다 |
| `type` | terminal·code | `{from, to}` 줄이 차례로 나온다 |
| `count` | facts·ledger | `{i 또는 id, to, from, digits}` 숫자가 센다. from이 없으면 앞 count가 남긴 값에서 |
| `drop` `curve` | dist | 입자가 떨어져 쌓인다 / 이론 곡선 |
| `zoom` `reset` | graph·chart·sequence·dist·morph·draw | `{to: id, k: 2.6}`(k = 배율) 또는 `{to: [x%, y%, w%, h%]}`(상자 전체가 보이게 맞춘다. 폰에서는 폰 그림의 %) 카메라. 글자도 커지므로 폰에서는 2배 안팎 |
| `note` | 장면 | `{n}` n번 핀과 설명을 켠다 |

동사는 그 id를 가진 부품으로 간다(visual → side, compare는 왼쪽 → 오른쪽). 양쪽에 같은 id가 있으면 인자에 `side: "right"`, 여러 단계를 묶을 때는 `{side: "right", par: [...]}`. 없는 id는 있는 id를 알려 주는 오류가 난다. `dur: 0`이면 즉시 바뀐다(처음부터 숨길 것은 `["hide", {id, dur: 0}]`). 장면 하나에는 메시지 하나, 움직임은 메커니즘(무엇이 어디로 가나)을 보인다.

## 점검

`node <skill>/server/check.mjs <id>` — 데스크톱 1280×800, 폰 390×844에서 겹침·넘침·작은 글자·schema·lint·expect·콘솔 오류를 잰다. 움직이는 장면(M·B)은 beat 시각 프레임을 `check/sNN.jpg` 한 장에 모으므로 그 장만 본다. 고친 뒤 `--scenes 3,5`로 그 장면만 다시 잰다(`--out <dir>`로 sheet 위치를 바꾼다). 폰에서 manual graph가 겹치면 노드에 `m: [x%, y%]`를 준다. 덱을 다 맞추면 `--cover`로 대표 이미지를 남긴다.
`LTT.expect(label, actual, expected, { tol })`로 모델 값을 대조한다(불일치는 check에 나온다).
