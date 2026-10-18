언제: 지리가 결정 변수일 때(리전 간 지연, 물류 경로, 공급망) · vendor: `topojson-client.min.js` · 실물: `https://learn-to-tell.vercel.app/gallery/catalog.html#api-map`

# ltt-parts.js: 지도

| 이름 | 설명 |
| --- | --- |
| `LTT.map(svg, {projection, rotate, extent, countries, places, routes, width, height})` → Promise | 세계 지도(Natural Earth 1:110m). `projection`: equalEarth(기본)·mercator·naturalEarth·orthographic. `extent: [[lon0, lat0], [lon1, lat1]]`로 지역에 맞추고, 날짜변경선을 넘는 지역은 `rotate: [-중심경도, 0]`. `countries: {영어 이름: tone}`, `places: [{id, lon, lat, l, lo, k, mark}]`, `routes: [{f, t, l, lo, k, dash}]`(대권 호). 결과에 `highlight`·`flow`·`send`·`player`·`project(lon, lat)`. `topojson-client.min.js` 필요. |
