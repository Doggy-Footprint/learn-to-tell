언제: 그림에 해설, 번호 주석, BEFORE/AFTER, 숫자 카드, 키워드, 상태 표시, 콜아웃, 견본, 핵심 바, 신문 차트 틀, 대비 검사 패널, 간격 측정선, 떠올리기 질문을 붙일 때 · vendor 없음 · 실물: `https://learn-to-tell.vercel.app/gallery/catalog.html#api-ui`

# ltt-ui.js: 설명 부품

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
| `LTT.recall(el, {question, answer, ask, title, hold, onReveal})` → `{answer, reveal}` | 인출 연습 한 칸을 `el`에 넣는다: 질문, 답을 적는 칸, "답 보기" 버튼, 숨은 답. 버튼(키보드로 누를 수 있다)을 누르면 답이 보이고 버튼이 꺼지며 `recall` 이벤트 `{scene: title, question(태그 뺌), answer(적은 글)}`를 남긴다. `answer`·`ask`는 HTML이고 `{{}}`는 링크된다. `question`이 없으면 `el`을 건드리기 전에 던진다. `hold(답 요소)`를 주면 숨김은 호출자가 맡고(덱 summary가 자리를 미리 잡는다), 없으면 kit이 답을 렌더되지 않게 숨긴다. `onReveal(답 요소)`는 공개 직후 불린다. 장면에서는 summary의 `recall`. |
| `LTT.contrast(a, b)` | 두 hex 색의 WCAG 대비비. `ltt.js`에 있고 `inspector`가 `ratio` 없는 행에 쓴다. |
