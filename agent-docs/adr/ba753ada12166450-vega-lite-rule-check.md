# 그래프·차트는 Vega-Lite 공개 API로 쓰고 Node에서 rule 검사한다

Status: Accepted (2026-10-24)

## Context

- v3는 agent가 외부 라이브러리의 공개 API를 그대로 쓰게 하고, rule로 검증할 수 있는 대상만 검사한다(`plan.md` What I want 2·3).
- 함수·수치 모델 그래프에는 상호작용과 자동 무빙이 필요하다(`plan.md` 사용자 결정).
- rule 검사는 화면이 실제로 그릴 값을 프로그램이 읽어 기준점과 비교해야 한다.

## Decision

- 함수·수치 모델 그래프와 데이터 차트는 Vega-Lite spec으로 쓴다.
- 자동 무빙: 시간 매개변수 `t`를 페이지 스크립트가 `view.signal`로 바꾼다. 같은 `t`에 `bind` 슬라이더를 연결할 수 있다.
- rule 검사: Node에서 `renderer: 'none'`으로 View를 만들고, 매개변수를 정해진 값들로 넣은 뒤 `view.data(name)`이 돌려준 값을 기준점과 비교한다. spec은 Vega-Lite JSON 스키마를 통과해야 한다.
- 테마는 Vega-Lite `config` 객체로 정한다.
- 근거 출처: https://vega.github.io/vega-lite/docs/parameter.html , https://vega.github.io/vega/docs/api/view/ , https://vega.github.io/vega/usage/ , https://vega.github.io/vega-lite/docs/bind.html , https://vega.github.io/vega-lite/docs/config.html

## Alternatives

- JSXGraph: 슬라이더(`Slider`)와 수학 그림을 지원한다. 그릴 값을 Node에서 화면 없이 꺼내는 방법이 공식 문서에 없어서 rule 검사를 만들 수 없다.
- Plotly.js: layout sliders를 지원한다. JSXGraph와 같은 이유로 기각한다.

## Consequences

- Positive: 검사와 화면이 같은 Vega dataflow를 쓴다. 테마 변경 지점은 `config` 객체 하나다.
- Negative: 슬라이더로 다시 계산하는 함수는 Vega expression 문법으로 써야 한다. 함수 그래프 외의 도식은 rule 검사 대상이 아니다.
