kit 개발자용 · 수업에서 부르지 않는 kit 내부 이름이다. kit 모듈끼리, 테스트, 서버 쪽 계산이 쓴다.

# kit 내부 이름

| 이름 | 설명 |
| --- | --- |
| `LTT.kitBase` | `ltt.js`를 불러온 `<script>`의 디렉터리 URL(알 수 없으면 `/kit/`). 폰트와 지도 데이터(`vendor/world-atlas/countries-110m.json`)를 이 위치 기준으로 찾는다. |
| `LTT.lessonId(pathname)` | `/lessons/<id>/` 경로에서 lesson id를 꺼낸다. 아니면 `null`. `record`가 이 값이 있을 때만 서버로 보낸다. |
| `LTT.compare(actual, expected, tol)` | `expect`의 수치 대조 → `{ok, diff, tol}`. `tol`이 없으면 `1e-9 × max(1, \|expected\|)`. |
| `LTT.termsIn(text)` | 문자열 속 `{{용어}}`·`{{보이는 말\|용어}}` 표시를 나온 순서대로 `[{key, shown}]`로. |
| `LTT.sceneText(scene)` | 장면에서 독자가 읽는 글 필드만 모아 한 문자열로(`type`·`tone`·`answer`·`id` 같은 필드와 DOM 노드는 뺀다). lint가 쓴다. |
| `LTT.termIndex(spec)` | glossary 용어마다 처음 표시되거나 terms 장면에서 정의된 장면 번호 `{용어: 번호}`. |
| `LTT.rectHit(a, b)` | 두 사각형 `{x0, y0, x1, y1}`가 0.5px 넘게 겹치는가. |
| `LTT.freeSlot(region, size, solids, gap, step)` | `region` 안에서 모든 `solids`와 `gap`만큼 떨어진 `size` 상자의 첫 왼쪽 위 자리(위 줄부터 훑는다), 없으면 `null`. 펼친 predict 정답 배치가 쓴다. |
| `LTT.stepValues(min, max, step, cap)` | 손잡이가 가질 수 있는 값 목록. 길면 양 끝을 포함해 고르게 `cap`개(기본 201)만. `?audit`의 목표 판정용. |
| `LTT.goalReach(lists, check, start, limit)` | 손잡이 값 조합마다 `check`를 불러 맞는 자리 수 `{samples, hits, start}`. 조합이 `limit`(기본 20000)를 넘으면 고정 시드로 표본을 뽑는다. |
| `LTT.setGlossary(defs, first)` | `linkTerms`가 쓸 용어 풀이와 용어별 첫 장면을 정한다. 덱이 시작할 때 부른다. |
| `LTT.auditScene(m)` | 그려진 장면 하나의 측정값으로 `?audit` 규칙을 판정 → `[{rule, msg}]`. |
| `LTT.mobile()` | `<html data-ltt-mobile>`가 붙어 있는가(폰 재배치 중인가). |
| `LTT.measure(fn)` | `fn`을 측정 모드로 실행한다. 그동안 diagram·sequence·map의 `send` 패킷(단계 반복 포함)은 아무것도 하지 않는다. 덱이 figure 단계·predict 정답을 미리 잴 때 쓴다. |
| `LTT.$` | `ltt-parts.js`의 `document.getElementById(id)` 줄임. |
| `LTT.deckTypes` | 장면 타입 이름 → 그리기 함수 표(덱 내부). |
