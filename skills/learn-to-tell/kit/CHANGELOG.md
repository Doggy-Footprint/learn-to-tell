# 변경 기록

버전을 올릴 때 작가 계약(수업 spec이 지켜야 하거나 수업에서 보이는 동작)과 kit 개발자용 변경을 한 줄씩 적는다.

## 다음 버전 (미배포)

작가 계약
- 단계가 둘 이상인 모든 재생기(덱 figure `steps`, 단독 `LTT.stepper`, `diagram`·`sequence`·`map`의 `player`)가 자동으로 넘어가 마지막 뒤 0으로 돌아간다. 덱 안은 장면 진입 때, 덱 밖은 만들 때 시작하고 `prefers-reduced-motion: reduce`이면 시작하지 않는다. 이전·다음은 그 방문 동안 멈추고 '반복 재생' 단추가 토글한다. figure 필드 `autoplay`는 없어졌고(주어도 무시), `play(once)`의 `once`도 없다(`play()`는 늘 순환).
- 단계 머무름은 `max(hold 또는 interval, max(1800, 1000 + 100 × 자막 평문 글자 수))`ms다. `data-ltt-beats`의 figure 비트도 이 머무름으로 계산한다.
- figure `steps`의 단계 `enter` 안 `highlight`와 `diagram.player`의 `hot`은 누적 공개한다: 노드·엣지·엣지 라벨이 처음 강조되는 단계에 나타나고(`visibility`, 크기·배치 불변), 한 번도 강조되지 않는 요소는 처음부터 보인다. 덱 밖에서 직접 부른 `highlight`는 그대로다.
- audit 권고 `still-visual` 문구는 figure `steps`(단계 둘 이상)를 노출 비트로 센다. 판정은 그대로다.
- 데스크톱에서 장면이 한 화면에 안 들어가면 kit이 장면을 줄이기 전에 본문의 그림(`svg[viewBox]`, `[data-visual]`; 아이콘·목업·다른 그림 안은 제외) 높이를 하나의 비율 `absorb`(0.65–1)로 먼저 줄인다. 가로세로 비율은 유지하고, 0.65로도 안 들어가면 나머지를 장면 배율(78%까지)이 맡는다. kit은 그림에 inline `max-height`·`max-width`를 걸고, 작가가 inline으로 건 `max-height`보다 크게 걸지 않는다. 폰 배치에서는 걸지 않는다.
- audit 경고마다 `severity`(`"fix"` 고침, `"advise"` 권고)가 붙는다(lint도 같다). 권고는 `shrunk`·`small-visual`·`loose-figure`·`empty-stage`·`many-sizes`·`goal-narrow`·`still-visual`·`card-monotony`·`no-signature`·`unused-term`.
- `shrunk`·`overflow`·`hscroll`·`graph-overlap` 메시지가 원인(배율을 정한 상태, 가장 긴 글 필드, 가장 넓은 요소, 겹친 id)을 말한다. `overflow`는 실제 배율을 적고 78% 하한과 다른 상태에 맞춘 배율을 구분한다. rule id와 판정 임계값은 그대로다.
- `server/audit.mjs` 종료 코드: 0 = 고칠 것 없음(권고만 있어도 0), 1 = 고침 경고·고침 lint·`LTT.expect` 불일치, 2 = Chrome 없음·측정 실패. 텍스트 보고는 대상 머리줄(장면 수, 파일이면 바이트), 크기별 줄, `[rule·고침|권고]`, 같은 (장면, rule, msg)를 크기를 나열해 한 줄로 합치고, lint·expect는 대상마다 한 번 보인다.

kit 개발자용
- `#ltt-audit` JSON에 `measures: [{zoom, absorb, zoomBy, floor}]`(장면 순서)가 더해지고 `audit[]`·`lint[]` 항목에 `severity`가 붙는다. `audit()` 결과 항목에도 `measures`가 있다. 결과 배열은 그대로 대상 × 크기다.
- `LTT.auditScene(m)`의 입력에 선택 필드 `zoomBy`·`floor`·`longest`·`wide`·`graphIds`·`absorb`가 늘었다. `visualRatio`·`figRatio`는 흡수 전 그림 크기로 잰다.
- `LTT.placement`은 그대로 `{zoomLock}`이다. 배율을 정한 상태는 덱 안에서 따로 기억한다.

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
- lint `icon-not-string`(고침): hook `art`, explain `steps[].icon`, terms 항목 `icon`이 문자열이 아니면(falsy 제외) 경고한다.

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
