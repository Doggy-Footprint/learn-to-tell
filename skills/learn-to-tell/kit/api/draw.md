# LTT.draw — 손그림 (B 등급)

API.md의 부품으로 그릴 수 없는 도메인 그림(회로, 기하, 물리 장면, 분자, 경기장 등)에만 쓴다. B 장면은 매번 sheet를 눈으로 본다.

```js
visual: LTT.draw({
  aspect: 16 / 9, mobileAspect: 4 / 5,   // 폰에서 다른 비율이 필요하면
  dur: 6,                                // 한 바퀴(초). 반복된다
  beats: [1, 3, 5.5],                    // sheet에 찍을 시각(생략하면 dur의 20·45·70·100%)
  setup(h) {                             // 한 번: 고정된 요소를 만들고 상태를 돌려준다
    h.el("circle", { cx: 500, cy: 280, r: 200, class: "e" });
    const dot = h.el("circle", { r: 14, class: "dot" });
    h.label(500, 280, "TTL 60초", { cls: "big" });
    h.anchor("ring", 500, 80);           // points·zoom이 가리킬 자리
    return { dot };
  },
  draw(t, h, s) {                        // 매 프레임: t초의 모습을 처음부터 정한다(이전 프레임에 기대지 않는다)
    const a = -Math.PI / 2 + (t / 6) * Math.PI * 2;
    s.dot.setAttribute("cx", 500 + 200 * Math.cos(a));
    s.dot.setAttribute("cy", 280 + 200 * Math.sin(a));
  }
})
```

좌표: 가로 1000, 세로 1000/aspect. `h.W`, `h.H`, 폰이면 `h.mobile`. 그림과 글자는 이 틀 안에 둔다(밖으로 나가면 check의 fig-overflow).

| helper | 뜻 |
| --- | --- |
| `h.el(tag, attrs, parent)` · `h.g(parent)` | svg 요소. 클래스 `e`(선) `dot` `ring` `grid` `axis` `band` `ref`, tone은 `e accent`·`dot bad`처럼, 면은 `fill-accent` `fill-bad` `fill-good` `fill-warn` `fill-soft` `fill-card` |
| `h.label(x, y, text, {anchor: "l"\|"r"\|"t"\|"b", cls: "big"\|"strong"\|"muted"\|"chip", tone})` | html 글자(줄바꿈·크기·겹침 점검 대상). 글자는 svg `<text>`로 쓰지 않는다 |
| `h.pos(el, x, y)` | label 위치 옮기기 |
| `h.anchor(id, x, y)` · `h.item(id, els)` | points·zoom 자리 / show·hide·highlight 대상 |
| `h.seg(t, a, b)` | a–b초 구간의 진행률 0–1 |
| `h.ease.inOut/out/in` · `h.lerp` · `h.clamp` | 보간 |
| `h.scale(d0, d1, r0, r1)` · `h.ticks(a, b, n)` · `h.fmt(v)` | 축 |
| `h.rng(seed)` | 무작위는 이것만(같은 t면 같은 그림이어야 한다) |
| `h.along(pathEl, u)` | path 위 u(0–1) 지점 `[x, y]` |
| `h.color("accent")` | 색 토큰 `var(--ltt-accent)` |

지키는 것: 같은 t면 같은 그림(Date·Math.random 금지), 글자는 `h.label`, 색은 토큰, 화면의 주인공은 하나.
