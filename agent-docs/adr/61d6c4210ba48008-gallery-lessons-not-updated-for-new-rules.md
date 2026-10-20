# gallery 수업은 새 kit 기본값·audit 규칙에 맞춰 고치지 않는다

- Status: Accepted (2026-10-19)

## Context

`site/gallery/`의 수업 13편은 `tests/gallery-audit.test.mjs`가 1440×900·1280×800에서 audit하고, `tests/gallery-audit.baseline.json`의 허용 개수와 비교한다. 기준선은 전부 0이었다. run `6cc24f891a69c407`(움직임 런타임)은 "예외를 빼고 모든 그림은 움직인다"는 기본값과 audit 권고 `still-visual`을 넣는다. 정지 그림을 쓴 gallery 수업은 이 규칙에 걸린다. kit 기본값이나 audit 규칙을 바꿀 때마다 같은 일이 생긴다.

## Decision

gallery 수업 13편은 새 kit 기본값이나 새 audit·lint 규칙에 맞추려고 고치지 않는다. 새 규칙이 gallery에서 내는 개수는 도입한 run에서 재서 baseline 허용치로 적는다. 기존 규칙의 허용치는 그대로 둔다. 수업은 사용자가 그 수업을 고치라고 할 때만 고친다.

## Alternatives

- 규칙을 바꿀 때마다 gallery 13편을 새 규칙에 맞게 고친다: 기각. 바꿀 때마다 13편을 고치고 다시 audit하는 비용이 든다.

## Consequences

- Positive: kit·audit 규칙을 바꾸는 run이 gallery 수업 수정 없이 끝난다.
- Negative: gallery 수업이 최신 기본값(움직이는 그림 등)을 보여 주지 않고, baseline 허용치가 규칙마다 0보다 커질 수 있다.
