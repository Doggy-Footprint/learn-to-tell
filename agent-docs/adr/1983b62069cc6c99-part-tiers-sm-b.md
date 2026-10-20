# kit 부품을 S·M·B 등급으로 나누고 S 장면은 눈으로 보지 않는다

- Status: Accepted (2026-10-20)

## Context

kit v1에서는 부품이 내용 길이에 따라 넘치거나 겹쳤다. 이를 막으려고 측정·배치 장치(장면 진입 때 모든 단계 미리 그리기, zoom 잠금, fit 축소)를 덧댔고 `ltt-deck.js`는 39번 고쳐졌다. 검증으로는 눈 검토 서브에이전트가 모든 장면의 스크린샷 24–42장을 봤고, 검증이 skill 토큰의 48–53%를 차지했다.

## Decision

- 부품마다 등급을 둔다.
  - S(facts·callout·table·units·pipeline·timeline·terminal·code·math·ledger, 움직임 없는 chart): kit이 넘침·겹침을 막는다. 사람과 agent 모두 보지 않는다.
  - M(graph·sequence·dist·morph, 움직이는 chart): check가 만든 sheet를 agent가 본다. multiples는 칸 부품의 등급을 따른다.
  - B(`LTT.draw` 손그림): 늘 sheet를 본다.
- S의 보장은 세 가지로 한다.
  - 글자 수·항목 수 상한(schema)을 넘으면 그리기 전에 SchemaError를 낸다.
  - 글 상자를 칸에 맞춰 줄이되 12.6px 아래로는 줄이지 않는다.
  - fuzz 테스트(`tests/fuzz.test.mjs`)에서 모든 글을 상한까지 채운 덱이 1280×800과 390×844 모두 0건이어야 한다.
- 장면의 등급은 부품 등급과 motion으로 정한다. `server/check.mjs`는 M·B 장면에만 sheet를 만든다.
- 이를 위해 자리는 mount 때 정하고, 시간 t에 따라 바뀌는 것은 칠하기(opacity, transform, 속성값)뿐이다. 그래서 상한과 fuzz로 확인한 배치가 재생 중에도 유지된다.

## Alternatives

- v1처럼 장면 진입 때 모든 단계를 미리 그려 크기를 재고 고정한다: 기각. 저자 코드의 부작용을 측정이 실행해 step 0에 패킷 25–65개가 남았고, 비동기 그림이 빠졌다.
- 모든 장면을 데스크톱·폰 이미지로 눈 검토한다: 기각. 검토 비용이 장면 수에 비례하고, v1에서 이 방식이 검증 비용의 대부분이었다.

## Consequences

- Positive: 정적 장면은 생성 중에 이미지를 만들거나 보지 않는다. check는 schema·lint·측정 오류만 보고한다.
- Negative: 새 S 부품마다 상한과 fuzz 생성기를 같이 만들어야 하고, 상한 때문에 긴 글은 장면을 나눠야 한다.
