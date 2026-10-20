# 도식 자동 배치에 elkjs를 vendor한다

- Status: Accepted (2026-10-15)

## Context

kit의 `LTT.diagram`은 노드마다 격자 좌표를 손으로 적어야 했다. 노드 20개 이상, 중첩 그룹, 직각 경로가 있는 도식은 좌표를 잡기 어렵고, 수업 페이지가 단계 재생·하이라이트·`send()`·`?audit` 측정을 그대로 쓰려면 배치 결과가 `LTT.diagram` 입력 형식이어야 했다.

## Decision

elkjs 0.12.0(`kit/vendor/elk.bundled.js`, 1.6MB)의 `layered` 배치를 EPL-2.0으로 vendor한다(패키지 라이선스는 "EPL-2.0 OR GPL-3.0-or-later"). `LTT.autoLayout(spec)`이 elk 결과를 `LTT.diagram`의 픽셀 입력(노드 `x, y`, 엣지 `points`, 영역 `x, y, w, h`)으로 바꿔 돌려주고, `LTT.state`도 이것을 쓴다. 이 부품을 쓰는 페이지만 `elk.bundled.js`를 불러온다.

## Alternatives

- dagre(MIT): 기각. 크기는 작지만 중첩 그룹과 포트 지원이 약해 그룹을 영역으로 그릴 수 없다.
- Mermaid: 기각. 용량이 크고 자체 테마로 그려서 `--ltt-*` 토큰, 단계 재생, 하이라이트, `?audit` 측정과 맞출 수 없다.

## Consequences

- Positive: 좌표 없는 spec에서 중첩 그룹과 직각 경로가 있는 도식을 얻고, 같은 입력은 같은 좌표를 낸다.
- Negative: vendor 용량이 1.6MB 늘고 EPL-2.0 고지(`LICENSE-elkjs`)를 유지해야 한다. node vm 테스트는 context에 `global`을 두고 elk에 넘기는 객체를 vm realm 안에서 만들어야 한다.
