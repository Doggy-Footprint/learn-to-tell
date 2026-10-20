# 변경 기록

버전을 올릴 때 작가 계약(수업 spec이 지켜야 하거나 수업에서 보이는 동작)과 kit 개발자용 변경을 한 줄씩 적는다.

## 1.0.0

작가 계약
- 그림은 기본으로 움직인다. `LTT.motion.loop`·`bind`·`reduced`가 장면에 묶인 반복 움직임을 주고, 장면을 떠나면 멈춘다. 예외(읽는 글, 공개 전 답, `still: "이유"`)도 가능하면 `once`로 한 번 재생 후 멈춘다.
- `LTT.motion.play(svg, beats, opts)`가 비트 타임라인(`t: [a, b]`, `text`)에 동사 `draw`·`flow`·`camera`·`morph`·`stack`을 붙인다. 대상은 diagram 노드·엣지 id, axisPlot 계열 id, CSS 선택자, Element이고 diagram 노드 `morph`는 엣지를 따라 그린다.
- `LTT.beforeAfter().ms`는 표식이 없으면 0, 있으면 700 + 140 × (m − 1)이다.
- figure `steps`는 기본으로 자동 재생된다(`autoplay`: `true`·`"once"`·`false`). 단계 `hold`가 덱 figure에서도 쓰인다.
- `LTT.sweep`은 기본으로 손대기 전까지 손잡이를 혼자 훑는다(`attract`, 끄려면 `false`).
- 장면 공통 필드 `still`과 audit 권고 `still-visual`이 생겼다.
- predict `question`이 제목과 다르면 선택지 위에 보이고, 공통 `takeaway`는 정답 공개 전에는 가려진다.
- `LTT.expect`는 기대값이 숫자가 아니면(boolean·문자열) `===`로 판정한다.

kit 개발자용
- 장면 요소 `data-ltt-beats`와 audit JSON `beats`가 장면마다 비트 시각을 내보낸다.
- 같은 시각 비트가 여러 번 오면 글 있는 비트가 글 없는 비트를 대신한다(글이 둘이면 먼저 온 글). audit JSON에 장면 type 목록 `types`가 더해졌다.
- 움직임 시간은 `setTimeout` + `Date.now()`로 재므로 헤드리스 가상 시간에서도 돈다(`requestAnimationFrame`을 쓰지 않는다).

## 0.2.0

작가 계약
- figure `steps`의 `enter`는 측정을 위해 모든 단계에 대해 미리 불리므로 멱등이어야 한다.
- predict 함수형 `answerVisual`은 선택지마다 미리 그려 재므로 순수·동기여야 한다(같은 입력이면 같은 크기, 전역 상태·기록을 건드리지 않음).
- predict `rest`(`hide`·`dim`·`dot`)가 공개 뒤 고르지 않은 오답의 모습을 정하고, 덱 `predictRest`가 덱 전체 기본값이다.
- 선택지를 고른 predict에서 다음 이동은 정답을 연다(auto-reveal).
- 펼친 정답과 단계 자막이 장면의 빈자리에 놓여 공개·단계 이동에 장면이 다시 줄지 않는다.
- audit 규칙 `panel-overlap`: 자막·정답 패널이 글·그림과 겹치면 경고한다.
- figure 그림 폭을 페이지 CSS에서 `vw`로 고정하지 않는다(kit이 칸 폭을 준다). 자막이 아래로 내려갈 때 `vw`로 묶인 그림을 칸 폭까지 넓히던 덱 동작(`widen`)은 없어졌다.
- predict: 공개 상태에서 창 크기가 바뀌면 배율을 다시 재고, `answerVisual`이 다시 불린다.
- audit은 장면을 실제로 그린 layout으로 판정한다: layout을 적지 않은 overview도 full 장면이라 `small-visual` 22% 기준과 `empty-stage`를 받는다.

kit 개발자용
- `?audit` 결과가 `<script id="ltt-audit">` JSON으로 남고 `server/audit.mjs`가 headless Chrome으로 갤러리·수업을 점검한다.
- API 문서가 `kit/API.md`와 `kit/api/*.md`로 나뉘었다.
- 장면 타입 메타 표 `LTT.sceneTypes`가 생겼고 `LTT.deckTypes`는 같은 표를 가리킨다(값이 그리기 함수에서 메타 entry로 바뀜).
- lint 규칙 레지스트리: `LTT.lintDeck`이 내부 규칙 목록을 등록 순서로 돌린다(경고와 순서는 그대로).
- 미리 그려 재기·배율 잠금·답 자리 예약이 `ltt-deck.js`의 지역 `placement` 한 곳으로 모였다(측정 모듈 분리). 순수 함수 `LTT.placement.zoomLock`을 공개한다.
- 다섯 모듈의 정적 CSS 원본이 `kit/ltt.css`·`ltt-parts.css`·`ltt-ui.css`·`ltt-mock.css`·`ltt-deck.css`로 옮겨졌다. `npm run build:css`가 JS 안 문자열을 다시 만들고, 어긋나면 `npm test`와 pre-commit의 `build.mjs css --check`가 실패한다. 런타임 `<style>` 텍스트와 요청은 그대로다.
