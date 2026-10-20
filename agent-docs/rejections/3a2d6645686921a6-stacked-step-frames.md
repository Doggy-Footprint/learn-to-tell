# 단계 그림을 한 칸에 겹쳐 쌓아 장면 높이를 정하는 방식(안 B)

## Context
figure `steps`는 단계마다 그림 높이가 달라질 수 있다. ADR 40552(2026-10-18)는 장면 진입과 창 크기 변경 때 모든 단계의 `enter`를 측정 모드에서 미리 돌려 그림 최대 높이와 자막 위치를 정하게 했다. 외부 검토(handoff e72bbfb2418e2e6d)가 그 대안으로 단계별 프레임을 겹쳐 CSS가 최대 높이를 정하는 방식을 냈다.

## Rejected Alternative
`steps: [{caption, draw(node, fig)}]` 형태를 추가해 kit이 단계마다 프레임을 만들어 한 grid 칸(`grid-area:1/1`)에 겹치고, 현재 단계 외 프레임은 `visibility:hidden`으로 두며, 자막 위치는 모든 프레임의 `solidRects` 합집합으로 판정한다.

## Reason
사용자가 기각했다. ADR 40552가 진입 시 모든 상태를 미리 그리는 방식을 택한 지 이틀 뒤에 새 증거 없이 그 방식을 바꾸는 대안이다. 단계 수만큼 DOM이 늘고, 단계 사이 모핑(같은 그림이 다음 상태로 바뀌는 연출)이 없어진다.

## Revisit Condition
수업 비용 기록(refactoring-1 ledger)이 미리 그리기 때문에 생긴 audit 누락이나 눈에 보이는 깜빡임을 구체적으로 가리킬 때, 또는 `enter`로 표현할 수 없는 단계별 프레임이 필요한 수업이 생길 때.

## Chosen Instead
agent-docs/adr/40552fcb2a7c3985-lock-scene-scale-on-entry.md
