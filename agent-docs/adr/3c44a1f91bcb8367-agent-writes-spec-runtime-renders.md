# 수업은 agent가 쓴 spec을 runtime이 그린다

- Status: Accepted (2026-10-23). `archive/v1:agent-docs/adr/6ff15ad3eef7b88d-kit-as-auxiliary-library.md`를 대체한다.

## Context

- v1은 agent가 수업 HTML(30–68KB)을 직접 쓰고, kit을 같은 구조가 있을 때만 쓰는 보조 라이브러리로 두었다.
- 같은 주제 5개에서 v1은 일반 요청보다 토큰 7.8–8.4배, 생성 시간 973–1556초(일반 요청 159–296초)를 썼다(`bench/v1-results.md` compare1).
- gallery-v2 수업 17개는 평균 25분 22초가 걸렸고, 그중 58%가 audit·검증 반복이었다. 반복을 만든 결함은 레이아웃(넘침·작은 글자·겹침)과 kit 사용 형식 오류였고, 렌더한 뒤에야 드러났다.

## Decision

- agent는 수업 spec만 쓴다: 기대값(`checks`), 순수 함수 수치 모델(`models`), 데이터 단위 좌표의 그림(`figures`), 절과 장면(`sections`). 레이아웃·CSS·DOM·애니메이션 코드는 쓰지 않는다.
- 레이아웃, UI, 애니메이션, 장면 전환은 버전을 고정한 runtime(`@doggy-footprint/ltt-runtime`)이 맡는다. 최소 글자 크기, 대비, 여백, 글 분량 상한은 runtime 상수다.
- 검사(`ltt check`)는 브라우저 없이 Node에서 spec을 검사한다. 렌더 결과는 contact sheet로 한 번 본다.
- 어휘 밖의 그림은 `custom`(frame 안의 SVG 그룹)으로 그린다.

## Alternatives

- v1 구조를 유지하고 결정적 검사를 늘린다: 기각. regen-fix2에서 audit 횟수는 같은 주제 기준 12→4, 11→8, 13→8회로 줄었지만 생성 시간은 29분 21초–32분 39초로, gallery-v2의 같은 주제(28분 52초–35분 21초)와 같은 범위였다.
- Vega-Lite나 Observable Plot을 그림 계약으로 쓴다: 기각. 프레임마다 모델 값을 다시 그리는 애니메이션과 궤적·프로토콜 사다리 같은 도식을 표현하지 못한다.

## Consequences

- Positive: 레이아웃 값은 runtime이 정하므로 수업마다 레이아웃 결함을 고치는 렌더 반복이 없다. spec 형식 오류는 `ltt check`가 spec 경로와 함께 보고한다.
- Negative: `custom`으로 그린 그림에는 레이아웃 보장이 없다. 수업을 생성하기 전에 runtime과 검사기를 먼저 구현해야 한다.
