언제: 양을 고정 축·막대·레인·흐름·평면 변환·단위 그림으로 보일 때 · vendor: `plot.umd.min.js`(plot·plotTheme, 전역 Plot), `d3-sankey.min.js`(sankey) · 실물: `https://learn-to-tell.vercel.app/gallery/catalog.html#api-charts`

# ltt-parts.js: 차트

| 이름 | 설명 |
| --- | --- |
| `LTT.axisPlot(svg \| el, {width, height, x, y, equal, ticks, labels: {x, y}, series: [{id, color \| k, dash, dot}], margin, cls})` → `{set(id, points), px, x, y}` | 축이 고정된 함수·궤적 플롯. `equal: true`(또는 `y: [y0]`)면 x 축척으로 y 범위를 정해 모양이 실제와 같다. 계열 색 기본 `--ltt-c1…`. |
| `LTT.lanes(svg \| el, {axis: {max, step, fmt}, lanes: [{l, s, value, text, color \| k}], labelW})` → `{play}` | 같은 시간 축의 레인 막대. 어느 단계에서 시간이 드는지. |
| `LTT.hbars(svg \| el, {domain, ticks, tickFormat, fmt, rows: [{label, value, text, tone}]})` → `{play}` | 고정 축 가로 막대. `tone: "floor"`는 바닥(하한)을 점선 테두리로. `chartFrame` 안에 그리면 신문 차트가 된다. |
| `LTT.plot(options)`, `LTT.plotTheme(options)` | Observable Plot을 테마 팔레트·모노 눈금·투명 배경 기본값으로. 막대·선·점·분포. `plot.umd.min.js` 필요. |
| `LTT.sankey(svg \| el, {nodes: [{id, l, k}], links: [{f, t, value, k}], fmt})` → `{highlight(ids)}` | 흐름량(비용·트래픽·퍼널). 띠 굵기 = 값. `d3-sankey.min.js` 필요. |
| `LTT.plane(svg, {range, vectors, shape}).to(m)` | 2×2 행렬 변환. `toSvg(p)`/`fromSvg(p)`는 평면 좌표 ⇄ SVG 좌표로, `LTT.drag`에 그대로 넘긴다. |
| `LTT.units(el, n, cols, {band}).paint(k, cls, alt)` | 단위 그림(100칸 = 100건). `band: true`면 가는 틱의 넓은 띠(예: 2×50, 시간순 요청). |
| `LTT.bar(el, [{color}]).set(values, labels)` | 비율 막대. |

## 데이터 형식

- `axisPlot`의 `set(id, points)`: `points`는 데이터 좌표 `[[x, y], …]`이고 배열 순서대로 선을 잇는다. 빈 배열이면 선을 지운다. `dot: true` 계열은 마지막 점에 점을 찍는다. 없는 `id`면 throw하고, 돌려주는 값은 같은 객체라 이어 부를 수 있다. `ticks`는 `[x 눈금 수, y 눈금 수]`(기본 `[6, 4]`)이고, 각 칸에 값 배열을 주면 그 값에만 눈금을 둔다. 눈금 글은 `xFormat`·`yFormat`(기본 `String`).
- `hbars`의 `ticks`는 눈금 값 배열(기본: `domain`에서 d3가 고른 4개 안팎), `tickFormat(값) → 글`(기본 `String`)이 축 위 눈금 글을 만든다. 막대 값 글은 `fmt`(또는 행의 `text`).

## 그리기

- 데이터가 하는 일이 모양을 정한다: 크기 비교는 막대, 시간에 따른 변화는 선, 비율은 `units`·`bar`, 흐름량은 `sankey`. 숫자 하나가 요점이면 차트 대신 `ltt-hero`.
- 색도 하는 일로 고른다. 계열 구분은 `--ltt-c1`부터 고정 순서로 쓰고, 계열 수가 바뀌어도 다시 칠하지 않는다. 크기는 한 색의 명암, 양·음은 두 색과 회색 중간으로 칠한다. good·bad·warn은 판정에만 쓰고 라벨을 함께 단다. 무지개 색은 쓰지 않는다.
- y축은 하나다. 단위가 다른 두 양은 패널 둘로 나누거나 같은 기준(시작 = 100)으로 맞춘다.
- 선은 2px, 점은 8px 이상으로 그리고 격자·축은 흐리게 둔다. 값·라벨 글자는 `--ltt-ink`·`--ltt-muted`로 쓰고, 계열 색은 표식에만 쓴다. 계열이 둘 이상이면 범례를 두고, 넷 이하면 선 끝에 직접 라벨도 단다. 모든 점에 숫자를 달지 않는다.
- 눈금과 라벨은 축이 실제로 닿는 값만 쓴다.
