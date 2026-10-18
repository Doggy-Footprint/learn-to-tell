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
