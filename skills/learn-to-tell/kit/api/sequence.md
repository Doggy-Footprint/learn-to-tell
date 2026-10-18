언제: 누가 누구에게 언제 보내는지(재시도·인증·타임아웃 순서)를 보일 때 · vendor 없음(늘 불러오는 d3만) · 실물: `https://learn-to-tell.vercel.app/gallery/catalog.html#api-sequence`

# ltt-parts.js: 시퀀스 다이어그램

| 이름 | 설명 |
| --- | --- |
| `LTT.sequence(svg, {actors, items, spans, col, row})` | 시퀀스 다이어그램. 배우 `{id, l, s, icon, k}`, `items`는 시간순으로 메시지 `{f, t, l, kind: "sync"\|"async"\|"reply", k, flaw, id}`와 메모 `{note, over: [ids]}`. sync는 받는 쪽 활성 막대를 열고, 그 배우의 다음 reply가 닫는다. f = t면 자기 호출 고리. `spans: [{from, to, l, k}]`는 두 메시지 id 사이 시간 구간(왼쪽 괄호). `.show(n)`, `.highlight(ids)`, `.send(id)`, `.player(el, [{caption, upto, hot}])`(upto 기본 = 단계 번호 + 1, 마지막 메시지에 패킷). 재시도·인증·타임아웃 순서 수업. |
| `LTT.sequenceLayout(spec)` | 좌표만 계산(테스트용). |
