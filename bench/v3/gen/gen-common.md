# 지시

학습 자료 HTML 한 장을 만든다. 이 실행은 비대화형이다. 사용자에게 묻지 않고 바로 만든다.

- 결과: 현재 작업 디렉터리의 `index.html` 한 파일. 외부 파일을 따로 두지 않는다.
- 아래 "진단 결과(고정)"로 가르칠 단계와 다룰 오개념을 정한다.
- 읽지 않는다: 현재 작업 디렉터리 밖의 파일. 검사기 소스도 읽지 않는다.
- 웹 검색 도구는 없다. 확실하지 않은 수치는 예시값이라고 밝힌다.

## 그래프·차트: Vega-Lite

함수·수치 모델 그래프와 데이터 차트는 Vega-Lite로 그린다. 글, 개념 설명, 도식, 화면 배치는 자유롭게 HTML/CSS/SVG로 쓴다.

- `<head>`에 다음 세 줄을 그대로 넣는다.
  ```html
  <script src="https://cdn.jsdelivr.net/npm/vega@6.4.0"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@6.5.0"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@7.3.0"></script>
  ```
- 차트 spec은 `<script type="application/json" data-ltt-chart="<id>">` 안에 JSON으로만 둔다. 페이지 스크립트는 그 JSON을 읽어 그린다. spec을 JS 코드 안에 따로 쓰지 않는다.
  ```js
  const spec = JSON.parse(document.querySelector('[data-ltt-chart="traj"]').textContent);
  const { view } = await vegaEmbed('#traj', spec, { actions: false });
  ```
- 데이터는 `values`나 `sequence`로 spec 안에 넣는다. `url` 데이터는 쓰지 않는다.
- 슬라이더는 top-level `params`에 `bind: {"input": "range", "min": .., "max": .., "step": ..}`로 단다.
- 자동 무빙: 시간 매개변수(예: `t`)를 params에 두고, 페이지 스크립트가 `requestAnimationFrame` 주기로 `view.signal('t', v).runAsync()`를 부른다. 재생/멈춤 버튼을 둔다.
- 기준점: 차트마다 `usermeta.ltt.points`에 1개 이상 둔다. 형식은 `{"id", "mark", "params"?, "where", "field", "value", "tol"}`다.
  - `mark`: 그 데이터를 그리는 view(또는 layer)의 `name`. view마다 `name`을 붙인다.
  - `params`: 그 점에서 바꿀 매개변수 값(슬라이더 범위 안). 생략하면 기본값.
  - `where`: 행을 고르는 필드 값. 정확히 한 행이 골라져야 한다.
  - `field`, `value`, `tol`: 그 행에서 확인할 필드, 기대값, 허용오차.
  - 기대값은 spec의 식을 복사하지 말고 따로 계산한다(Bash에서 node나 python으로 계산해도 된다).

## 퀴즈

- 선택형: `<div data-ltt-quiz="<id>" data-kind="choice">` 안의 선택지에 `data-ltt-option`, 정답 하나에만 `data-correct`.
- 수치형: `<div data-ltt-quiz="<id>" data-kind="number" data-answer="<수>" data-tol="<허용오차>">`. 답이 차트 모델 값이면 `data-from="<차트id>.<기준점id>"`를 붙인다.
- 채점 JS는 이 속성을 읽어 채점한다.

## 검사

- 다 쓰면 `node /Users/hwansu/orca/workspaces/learn-to-tell/v3/packages/check/bin/ltt-check.mjs index.html`을 실행한다. 출력 JSON의 `ok`가 `true`가 될 때까지 고친다.
- 검사기는 그래프·차트·퀴즈 정답만 본다. 나머지는 스스로 판단한다. 렌더링 확인용 브라우저는 없다.

## 끝나면

마지막 메시지에 적는다.
- 검사 실행 횟수와 회차별 오류 수(rule별), 마지막 `unchecked`
- 검사 때문에 고친 것
- 남긴 문제(없으면 "없음")

---
