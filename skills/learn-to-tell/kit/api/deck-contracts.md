언제: `LTT.motion`, figure `steps`·`autoplay`, sweep `attract`, predict `answerVisual`·`rest`를 쓸 때, 또는 덱 이동·layout 기본값·`?audit`·폰 재배치의 세부 동작이 필요할 때 읽는다. 수업 작가가 지킬 계약만 담는다.

# ltt-deck.js: 장면 덱 계약

필드 목록과 장면 타입 표는 `kit/API.md`에 있다.

## figure

`points`의 `at`은 무대 안 첫 목업(phone·browser·terminal·code)이 있으면 그 틀 기준, 없으면 무대 전체 기준 %다(`pointsOn`으로 바꾼다).

### `steps` (측정 모드)

- `steps: [{caption, enter(k, fig, dir)}]`를 주면 그림 왼쪽, 단계 자막 오른쪽으로 놓인다.
- 그림의 글·그림(diagram은 노드·라벨 상자)이 자막 칸 밑으로 들어가거나 한 단계에서라도 그 상자들이 자막 칸 밑으로 들어가면, 같은 창 폭에서는 자막 칸이 계속 그림 아래에 있다. 폭 760px 이하에서는 판정 없이 아래에 둔다.
- 그림 폭은 페이지 CSS에서 `vw`로 고정하지 않는다(kit이 칸 폭을 준다). 크기 상한이 필요하면 `px`와 `max-width:100%`를 쓴다. 자막이 아래로 내려가도 kit은 그림을 넓히지 않는다.
- 장면에 들어올 때와 창 크기가 바뀔 때 모든 단계의 `enter`를 한 번씩 미리 돌려 그림 높이와 자막 칸 위치를 정하므로, 단계를 넘겨도 배율과 배치가 바뀌지 않는다. 그래서 `enter`는 멱등이어야 하고(반복 재생도 마지막에서 첫 단계로 바로 간다) 기록·전역 상태를 건드리지 않아야 한다.
- 미리 돌리는 동안 kit의 `send`(패킷 연출)는 아무것도 하지 않고, 그림 안의 CSS transition은 꺼져 끝 크기로 잰다. 직접 만든 d3 transition·`setTimeout`으로 크기를 바꾸는 그리기는 끝 크기를 알 수 없으니 `enter`에 넣지 않는다.
- 자막 칸 높이는 가장 긴 단계 자막에 맞춰 고정되어 단계를 넘겨도 버튼이 움직이지 않는다.
- `figure` 함수가 `{el, ...}`를 돌려주면 `enter`의 `fig`로 그 객체가 온다(같은 그림의 여러 상태). 장면에 들어올 때마다 다시 그리려면 공통 필드 `enter(body, ctx)`.

## 움직임 (`LTT.motion`)

### `loop`

- `LTT.motion.loop(draw, {period, beats, once, rest, el})`은 `draw(u)`를 33ms 이하 간격으로 부른다. u = (진입 뒤 흐른 시간 mod `period`) / `period`(기본 4000ms). `once: true`면 u = min(1, 흐른 시간/`period`)이고 `draw(1)` 뒤 다음 진입까지 멈춘다.
- 돌려받는 `{stop(), play(), running}`: `stop()` 뒤에는 그리지 않고, `play()`는 멈춘 u에서 이어 간다. 장면에 다시 들어오면 stop 여부와 상관없이 u≈0에서 다시 돈다.
- `el`(노드)을 주면, 장면이 현재인 동안 그 노드가 문서에서 떨어질 때 loop가 영구히 끝난다(처음 만들 때 떨어져 있는 것은 괜찮다). 새 loop의 `el`이 아직 끝나지 않은 다른 loop의 `el`과 같으면 옛 loop가 영구히 끝난다. 같은 노드에 다시 그리는 곳(단계 `enter`, 다시 불리는 `answerVisual`)에서는 `el`을 주어 loop가 쌓이지 않게 한다.
- 탭이 가려진 동안(`document.hidden`) 그리지 않고, 다시 보이면 이어서 그린다.
- 시간은 `setTimeout` + `Date.now()`라 헤드리스 Chrome 가상 시간(audit·shot)에서도 돈다. 페이지에서 `requestAnimationFrame`으로 움직임을 짜지 않는다.
- `draw`가 던지면 장면 번호와 함께 경고가 남고 그 loop만 끝난다. `period`가 양의 유한수가 아니면 경고 뒤 4000ms로 돈다.

### `play` (비트 타임라인)

- `LTT.motion.play(root, beats, {period, once, el})`은 `loop` 하나 위에서 돌아 결합·reduced-motion·측정 모드·`once`·`el`·`{stop, play, running}`이 같다. `root`는 `<svg>`, d3 선택, 또는 `<svg>`를 품은 Element. `beats`는 `[{t: [a, b], text, 동사: 대상, ...옵션}]`(0 ≤ a < b ≤ `period`, ms). `period` 기본은 가장 큰 b + 1000. 비트마다 동사는 0개(머묾) 또는 1개.
- 동사(p = 비트 안 진행도 0→1, e = easeInOutCubic(p)): `draw: 대상` 윤곽이 처음부터 그려진다(`stroke-dashoffset`). `flow: 대상, count(3), tail(24), r(4), laps(1)` 선 위로 입자가 선형으로 흐르고 비트 밖에는 숨는다(root 안 `g.ltt-flow`). `camera: 대상 | [x, y, w, h], pad(16)` root `viewBox`가 가고, 다음 camera 비트는 앞 비트의 도착점에서 시작한다. `morph: 대상, to: {속성: 수, translate: [dx, dy]}` 숫자 속성이 play 때 값에서 `to`로 간다. `stack: 대상, from("bottom"|"left")` 대상이 문서 순서대로 차례로 자란다(`scale`).
- diagram 노드 `morph`의 `to: {x, y}`는 노드 spec의 `x`, `y`(중심 px)와 같은 좌표다. 닿은 엣지와 라벨이 매 프레임 다시 그려진다.
- 대상: Element·배열은 그대로. 문자열은 diagram이면 노드 id, 엣지 id, `"from>to"`, `LTT.axisPlot`이면 계열 id, 그 밖은 root 안 CSS 선택자(여럿 가능).
- 상태는 주기 시각의 함수다. 비트 전은 p = 0, 후는 p = 1을 유지하고 주기가 다시 시작하면 모두 p = 0이다. 같은 속성을 움직이는 비트가 이어지면 뒤 비트는 앞 비트의 도착 값에서 시작한다. reduced-motion·측정 모드는 모든 비트 p = 1 한 장이다.
- 비트 노출: 비트마다 끝 시각이 장면 비트(`data-ltt-beats`)가 되고 `text`가 같이 실린다(`once`가 아니면 `period − 1`로 깎임).
- 잘못된 비트(`t` 범위, 동사 둘 이상, 없는 대상, `camera`·`morph` 인자)는 장면·비트 번호와 함께 경고하고 그 비트만 버린다. `<svg>`가 없으면 경고하고 돌지 않는 handle을 돌려준다.

### 결합 범위

- 장면 i를 처음 그리는 동안(figure·`visual`·`answerVisual`·terms `visual`·compare 칸·contrast 양쪽 그림·`mount`) 만든 loop·`bind`는 장면 i에 붙고, 진입 때 시작해 이탈 때 멈춘다. 공통 필드 `enter`·step `enter`·predict 공개처럼 장면이 현재일 때 만든 loop는 그 방문에만 속한다: 바로 시작하고, 떠나면 영구히 끝난다(다음 방문에 그 코드가 다시 만든다).
- 덱 밖에서 만든 loop는 바로 돌고 탭 가림·`el`·`stop()`으로만 멈춘다.
- `LTT.motion.bind({enter, leave})`는 붙은 장면에 들어올 때마다 `enter()`, 떠날 때마다 `leave()`를 부른다. 현재 장면에서 등록하면 `enter()`를 바로 한 번 부르고, 그 방문에만 속해 떠날 때 `leave()`를 한 번 부른 뒤 버려진다(방문마다 쌓이지 않는다). 덱 밖에서 등록하면 `enter()`를 바로 한 번 부르고 `leave()`는 부르지 않는다. 던지면 경고만 남고 다른 훅과 이동은 계속된다. `mount`가 돌려주는 `{enter, leave}`와 공통 `enter`는 전과 같다.

### 측정 모드·reduced-motion

- figure 단계와 predict 정답을 미리 그려 재는 동안(측정 모드) 만든 loop는 `draw(rest)`를 한 번만 부르고 결합·반복·비트 노출을 하지 않는다. `bind`도 무시된다.
- `LTT.motion.reduced()`(`prefers-reduced-motion: reduce`, DOM이 없으면 false)가 참이면 loop는 진입마다 `draw(rest)`를 한 번 부르고 반복하지 않는다. `rest` 기본값은 `beats`가 있으면 마지막 beat의 t/`period`, 없으면 1. figure 자동 재생과 sweep 자동 훑기도 돌지 않는다(figure는 단계 0에서 클릭을 기다린다).

### figure `autoplay`

- `steps`가 둘 이상이면(하나면 자동 재생·비트 없음) 기본(`autoplay: true`)으로 진입 때 단계 0에서 시작해 단계마다 `hold`ms(기본 1800) 뒤 다음으로 가고, 마지막 뒤에 0으로 돌아간다. `"once"`는 마지막 단계에서 멈추고, `false`는 자동 재생을 끈다.
- 이전·다음·반복 단추(←/→ 키 포함)를 누르면 그 방문 동안 자동 재생이 멈춘다. 떠나면 멈추고, 다시 들어오면 단계 0부터 다시 재생한다. 측정 미리 그리기 뒤에도 현재 단계에서 이어 간다.

### sweep `attract`

- `LTT.sweep`의 `attract`(기본 `true`, `false`, 또는 `{param, period}`; param 기본은 첫 param, period 기본 6000ms): 장면이 현재이고 아직 아무도 손대지 않은 동안 그 param의 손잡이를 `raws()` 처음→끝→처음으로 옮기며 `render`를 부른다. 손잡이와 `#id-v` 값 표시도 함께 움직인다.
- 훑는 동안에는 goal의 `done`·`first`를 바꾸지 않고 `goal` 이벤트도 남기지 않는다.
- 처음 손대면(손잡이의 pointerdown·keydown·input, preset 클릭) 시작값으로 되돌린 뒤 그 조작을 적용하고, 그 페이지에서 다시 훑지 않는다. 그래서 시작값은 여전히 목표 밖이어야 한다(`goal-at-start`).
- 없는 param id면 경고 뒤 자동 훑기 없이 평소대로 동작한다.

### 비트 노출

- 장면 요소 `section.dk-scene`의 `data-ltt-beats`에 `[{"t": 정수 ms, "text"?: 글}]`이 t 오름차순으로 적힌다. t는 장면 진입 기준이다. shot·sheet가 비트마다 화면을 찍는다.
- 합쳐 적히는 것: 그리는 동안 붙은 loop의 `beats`(`[{t, text}]` 또는 `[t]`, 0 < t ≤ `period`, 범위 밖·수가 아닌 t는 경고 뒤 버림. 없으면 `period`의 1/3, 2/3, 끝 − 1ms, `once`는 1/3, 2/3, 끝), figure 자동 재생(단계 k마다 단계 시작 + 0.8 × `hold`, text는 마크업과 `{{x|y}}` 표시를 지운 자막), sweep 자동 훑기(loop 기본값), contrast 재생(재생이 끝나는 시각 하나). 같은 t는 하나로 합친다. 움직임이 없으면 속성이 없다.
- `?audit` 결과 JSON의 `beats`는 장면마다 이 배열이다(없으면 `[]`). audit은 장면에 들어가지 않고 그리기만 해도 채운다.

### 정지 그림 (`still`)

- 장면 공통 `still: "이유"`(비어 있지 않은 문자열)는 일부러 멈춰 둔 그림이라는 표시다. 문자열이 아니거나 비어 있으면 없는 것과 같다.
- audit `still-visual`(권고)은 좁은 창이 아니고, 본문에 목업이 아닌 그림이 있고, 노출 비트가 없고, `still`이 없고, 타입이 terms·summary·keywords·hook·map-related가 아닐 때 난다.

## predict `rest`·배율·`answerVisual`

- `rest`는 정답 공개 뒤 고르지 않은 오답의 모습: `"hide"`(기본, 자리만 남기고 숨김) · `"dim"`(흐리게) · `"dot"`(점으로). 어느 쪽이든 자리를 유지해 화면이 흔들리지 않는다. 펼친 정답은 hide로 숨긴 자리에는 놓일 수 있지만 dim·dot 선택지는 가리지 않는다. 덱 전체 기본값은 `LTT.deck({predictRest})`.
- 배율은 장면에 들어올 때 문제 상태와 선택지별 정답 상태 중 가장 큰 쪽에 맞춰 정하고, 공개할 때 바꾸지 않는다. 그래서 해설(`why`)·`answerVisual`이 길면 공개 전에도 장면이 작아지니 짧게 쓴다.
- `question`이 `title`과 다르면 선택지 위에 글로 보인다. `hint`가 없으면 기본 안내 줄("틀려도 괜찮다…") 자리에 들어가 줄이 늘지 않고, `hint`를 주면 둘 다 보인다. 공통 `takeaway`는 공개 전에는 자리만 남기고 가려져(접근성 트리에서도 빠짐) 공개 때 보이고, 초기화하면 다시 가려진다. 자리를 지키므로 공개해도 배율이 바뀌지 않는다.
- 공개 뒤 창 크기가 바뀌면 배율을 다시 잰다. 그 크기에서 새로 열어 같은 답을 공개한 배율과 같다.
- 측정을 위해 함수형 `answerVisual(node, id)`는 선택지마다 화면 밖에서 미리 한 번씩 불릴 수 있다(인자를 하나만 받으면 한 번만). 공개 뒤에도 창 크기가 바뀌면 다시 불리고, 이어서 고른 값으로 한 번 더 불려 공개 모습을 다시 그린다. 같은 입력이면 같은 크기를 내고, 전역 상태·기록을 건드리지 않아야 한다. 미리 그리는 동안 kit의 `send`는 아무것도 하지 않는다. `node` 안의 지연 애니메이션은 크기를 바꾸지 않을 때만 괜찮다.

## summary·keywords

- `recall`이 있으면 summary는 글 목록의 인출 연습이 된다. summary가 질문을 먼저 보이고 답(takeaway)은 "답 보기" 뒤에 연다. 답 칸은 열기 전에도 빈자리로 잡혀 있어 열어도 배율이 바뀌지 않는다. 공개할 때 `recall` 이벤트(`{scene, question, answer}`)를 남긴다.
- keywords 뒤에 `map-related` 장면이 `/map/data.json`에서 자동으로 붙는다(이어진 개념이 없으면 없음). 직접 쓰지 않는다.

## layout 기본값

기본은 figure·overview면 full(overview도 figure처럼 그림이 무대 전체를 쓴다), 그 밖에는 narration·points가 있으면 split. 단 hook·keywords·summary·terms·contrast·predict·statement는 자동 split이 되지 않는다.

## 덱 이동

←/→·PageUp/PageDown 키(화면 속 stepper가 있으면 그 stepper가 끝에 닿을 때까지 ←/→를 먼저 받는다), `#n` 해시, `scene` 이벤트.

- compare의 판정이나 predict의 정답을 보지 않고 다음으로 가려 하면, 첫 시도는 넘어가지 않는다. 대신 그 버튼(predict에서 아직 고르지 않았으면 선택지)을 테마에 맞게 강조하고 말풍선을 띄운다. 다음 버튼이면 버튼 위에, 키·스와이프면 화면 가운데에 뜬다. 같은 장면에서 한 번 더 시도하면 넘어간다(`skip-warn`, `skip-reveal` 이벤트).
- predict에서 선택지를 이미 골랐다면 다음 버튼·키·스와이프는 넘어가지 않고 정답을 바로 펼친다(`auto-reveal` 이벤트).
- 정답을 펼친 predict에서 ← 키는 이전 장면 대신 문제 상태로 돌아간다(`predict-back` 이벤트, 이전 버튼·스와이프는 그대로 이전 장면).
- 펼친 정답은 장면 안에서 글·컨트롤·그림이 없는 빈자리를 찾아 그 위에 놓이고, 빈자리가 없으면 아래로 붙는다(넘치면 평소처럼 78%까지 줄인다).

## 화면 점검 (`?audit`) 세부

- 덱이 모든 장면을 그려 잰다. `LTT.deck(...)`가 돌려주는 객체의 `audit()`으로 직접 부를 수도 있다. 판정은 `LTT.auditScene(측정값)`이 한다.
- 결과는 `<script type="application/json" id="ltt-audit">`에도 남고, `server/audit.mjs`가 헤드리스 Chrome의 `--dump-dom` 출력에서 그것을 읽어 두 크기의 표를 만든다.
- 폭 1000px 이하 창에서는 `shrunk`·`small-visual`·`loose-figure`를 판정하지 않는다. `small-visual`은 hook·terms·summary·keywords·statement·predict 장면에서도 판정하지 않는다.
- `goal-unreachable`·`goal-narrow`·`goal-at-start`의 자리는 손잡이마다 최대 201곳(dial은 최대 360곳, pad·drag는 축마다 41곳), 조합이 2만 개를 넘으면 고정 시드로 2만 개를 뽑아 `check`를 부른다.

## 폰 재배치

폰(폭 760px 미만, 또는 높이 500px 이하의 터치 화면)에서는 `<html data-ltt-mobile>`가 붙고, kit가 같은 장면을 다시 배치한다(`LTT.mobile()`). 장면은 줄이지 않고 세로로 스크롤한다. 모든 격자는 한 열이 되고, 그림 옆 설명은 그림 아래로 간다. 글자가 10px 아래로 작아질 넓은 SVG는 그 크기를 지키고 자기 칸 안에서 가로로 스크롤한다. 단 `steps`가 있는 figure의 그림은 단계마다 다시 그려질 수 있어 칸 폭에 맞춘다. explain 단계 목록의 그림은 번호 칸을 비워 두고 글과 같은 열에 놓인다. autoLayout 그래프는 `DOWN`으로 다시 배치된다. 좌우로 밀면 장면이 넘어간다. 참고용 화면이라 점검 대상이 아니다.
