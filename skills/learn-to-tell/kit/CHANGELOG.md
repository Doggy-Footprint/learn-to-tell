# 변경 기록

버전을 올릴 때 작가 계약(수업 spec이 지켜야 하거나 수업에서 보이는 동작)과 kit 개발자용 변경을 한 줄씩 적는다.

## 미출시

작가 계약
- 덱 predict의 `question`이 장면 맨 위(`visual` 앞)에 `.dk-pq` 글로 보인다. `question`이 없거나 빈 문자열이면 `.dk-pq`가 없다.
- `dialControl`·`padControl`은 pointerdown 때 잰 사각형으로 그 드래그의 값을 정한다. 값 표시 글자 폭이 바뀌어 컨트롤이 움직여도 값이 떨리지 않는다.
- `audit.mjs`가 `check`를 `?check`와 `?shot` 두 상태에서 읽어 합치고, 값을 바꾸면 range·dial·pad 상자가 1px 넘게 움직일 때 `control-shift`를 낸다(점검 로드가 실패하면 `probe-failed`). 점검 로드는 `/api/lessons/*/events`를 막아 `events.jsonl`에 남지 않는다.
- 덱이 아닌 페이지도 `#ltt-meta`의 `glossary`로 `{{용어}}` 풀이 팝오버를 얻고, `load` 때 kit이 `{{}}`를 링크한다.
- 모든 페이지에서 kit이 `unknown-term`·`used-before-defined`·`filler-content`·`goal-unreachable`·`goal-at-start`·`expect-mismatch`를 검사해 `#ltt-check`·`data-ltt-check`·패널·`lint` 이벤트로 낸다. 덱의 `predict-new-term`도 같다. 덱의 `lint`에서는 이 항목들이 빠진다.
- `?check`(또는 `?shot`)이면 덱이 모든 장면을 그려 목표를 검사한다.
- `LTT.clock(el, draw, {dur, loop, id})` 추가: 보일 때만 도는 시계. reduced-motion이거나 `?shot`이면 `draw(dur)` 한 장만 그린다. 움직이는 그림은 이것으로 그리고 id를 붙인다.
- `?shot` 모드(`?shot`, `?shot&y=<px>`, `?shot&clock=<id>&t=<ms>`)와 `#ltt-check`의 `scroll`·`scenes`·`clocks` 필드. 같은 clock id가 둘이면 `clock-duplicate-id`.
- 덱의 `?audit`·`audit()`·`#ltt-audit`·`layout-audit` 이벤트와 레이아웃 판정 규칙(`overflow`·`shrunk`·`small-visual` 등)을 없앴다. 그려진 화면은 `audit.mjs --shots` PNG로 본다.
- 부품은 kit 코드의 `// @ltt-part LTT.이름 | 대상 | 방식 | 그림 | 문서` 주석을 grep해 찾는다. `kit/API.md`의 "부품 고르기" 표를 없애고, 손잡이 모양 표는 `kit/api/controls.md`로 옮겼다.
- `LTT.recall`로 덱 밖에서도 떠올리기 질문과 `recall` 이벤트를 쓸 수 있다.
kit 개발자용 · 수업에서 부르지 않는 kit 내부 이름이다. kit 모듈끼리, 테스트, 서버 쪽 계산이 쓴다.
- `LTT.termIssues`·`goalIssues`·`deckIssues`·`checkSource` 추가. `lintDeck`은 용어·채움 글 규칙을 더는 내지 않는다. 장면 타입 메타의 `sumVisualAreas`·`auditHero`·`auditSmallVisual`·`auditLooseFigure`와 `LTT.auditScene`을 없앴다.
- `LTT.setGlossary`는 풀이를 합치고 먼저 등록된 것을 남긴다.
- `server/audit.mjs`는 `?shot`으로 `#ltt-check`만 읽는다. `--shots`는 덱은 장면마다, 덱 아닌 페이지는 스크롤 위치마다 PNG를 남기고, `--checklist`의 `[shot <id> <ms>]` 표식마다 한 장 더 찍는다. 결과 필드가 `check`·`marks`·`shots`·`truncated`·`scroll`로 바뀌었다(`audit`·`lint`·`expectFails`·`scenes` 삭제). `checkSource`에 `scenes`·`reveal`이 더해졌다.

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
