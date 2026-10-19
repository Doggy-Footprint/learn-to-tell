언제: 손잡이로 조작하게 하거나, 첫 짐작을 잠그거나, 한 그림을 단계별로 넘기거나, 시뮬레이션·숫자 변화를 보일 때 · vendor 없음 · 실물: `https://learn-to-tell.vercel.app/gallery/catalog.html#api-controls`

# ltt-parts.js: 조작·짐작·단계

| 이름 | 설명 |
| --- | --- |
| `LTT.sweep({params: {id: {kind, map, fmt, label, …}}, render, presets, goal, attract})` → `{render, values, controls}` | 손잡이 → `render(values)`. `attract`(기본 `true`, `false`, `{param, period}`)는 손대기 전까지 손잡이를 혼자 처음→끝→처음으로 훑는다(`kit/api/deck-contracts.md`). 조작 자체가 배움일 때만, 실사용 범위만. 손잡이는 `#id` 요소에 붙고 `#id-v`에 `fmt(값)`이 들어간다. `kind`: `"range"`(기본, `#id`는 `<input type=range>`, 값 = `map(input.value)`), `"log"`(`#id`는 range 입력, `{min, max, value}`, 자릿수마다 같은 거리), `"steps"`(`#id`는 빈 `div`, `{stops, value, stopLabel}`, 단계 버튼), `"dial"`(빈 `div`, `{period=360, step=1, value, ring}`, 0이 위·시계 방향, `ring`은 고리 배경 CSS, 가운데 `.mid`는 페이지가 채워도 된다), `"pad"`(빈 `div`, `{x: {min, max, step, value}, y: {…}, labels, bg}`, 값 `[x, y]`, y는 위로 증가). `control`에 `LTT.drag(...)` 같은 손잡이 객체를 주면 `#id` 없이 그것을 쓴다. `"range"` 외 손잡이는 화살표 키로도 움직이고 덱 장면 넘김을 막는다. `presets` 버튼의 `data-preset`은 range는 입력값, 나머지는 손잡이 값이다. `goal: {el, text, target, check(values)}`는 `el` 안에 목표 띠(목표 견본 `target` + 문장)를 그리고, `check`가 참이면 "맞췄다" 표시와 `goal` 이벤트를 남긴다. `check`는 값만 보는 순수 함수여야 한다(`?audit`이 손잡이 자리마다 부른다). |
| `LTT.drag(svg, {value, toSvg, fromSvg, bounds, step, color, label, r})` | 그림 속 대상을 직접 끄는 손잡이. `svg` 위에 점선 원을 그리고, 끌거나 화살표 키로 옮기면 값 `[x, y]`가 `step`으로 맞춰지고 `bounds: [[xmin, xmax], [ymin, ymax]]` 안에 머문다. `toSvg`/`fromSvg`는 데이터 ⇄ SVG 좌표 변환(`LTT.plane`이 같은 이름으로 준다). 돌려주는 객체를 `sweep` `params`의 `control`로 넘긴다. 원 위치만 옮기고, 화살표·도형은 `render`가 다시 그린다. |
| `LTT.predict({..., onReset})` → `{reset, value, locked}` | 첫 짐작을 잠그고 기록. 덱의 predict 장면이 쓴다. `reset()`은 공개를 거두고 다시 고르게 한다. 첫 기록은 남고 `predict-reset` 이벤트와 `retry: true` 짐작이 추가된다. |
| `LTT.stepper(el, [{caption, hold, enter(i, dir)}], {onStep, interval})` → `{go, play, stop, index}` | 한 그림을 단계별로. `enter`는 다시 들어와도 같은 화면이 되게 짠다. '반복 재생' 버튼(또는 `play()`)은 단계마다 `hold`ms(없으면 `interval`, 기본 1800ms) 머문 뒤 다음 단계로, 끝에서 처음으로 돌아간다. `hold`는 표현하려는 바에 맞게 정한다(오래 봐야 할 단계는 길게). 이전/다음을 누르면 멈춘다. `play(true)`는 마지막 단계에서 멈춘다. 단독으로는 자동 재생하지 않는다(덱 figure `autoplay`만). |
| `LTT.sim({init, step, draw, until, dt, onEnd})` | 고정 간격 시뮬레이션. `runToEnd()`는 화면 없이 결과만. |
| `LTT.tween(el, to, fmt, ms)` | 숫자 변화. |
