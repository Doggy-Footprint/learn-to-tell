# 장면 배율 고정의 보류 항목: 단계 그림 겹쳐 쌓기, 지연 그리기 측정, 띄우기를 고려한 배율

## Goal
"보류할 것들은 핸드 오프로 남기고." (배율 고정 작업 c217c45·d91675c·73939fd에 대한 외부 검토에서 나온 항목 중 즉시 수정하지 않기로 한 것)

## State
- 브랜치 `fix/run-time`, 기준 커밋 `73939fd`.
- 관련 파일: `skills/learn-to-tell/kit/ltt-deck.js`(`lockZoom`, `probe`, `widen`, `floatPanel`, `fit`), `skills/learn-to-tell/kit/ltt-parts.js`(`stepper`, `diagram.send`, `LTT.bar`), `skills/learn-to-tell/kit/API.md`(predict·figure 행).
- 즉시 수정 대상(측정 모드의 kit 부분, resize 디바운스, lockZoom 원상 복구 보장, 단일 probe, recall 답 자리 예약)은 이 문서 범위가 아니다.

## Failed Attempts
| attempt | failure evidence | cause |
|---|---|---|
| 진입 시 모든 단계 `enter`를 실행해 높이를 잼(d91675c) | tls13-quic 12장면 0단계에서 다른 단계의 `dg.send` 패킷 25~65개가 보임(외부 검토, `ltt-parts.js` diagram.send가 원을 덧붙이고 지우지 않음) | verified: 측정이 작가 코드의 부수효과를 그대로 실행함 |
| `answerVisual`을 화면 밖에서 동기 측정(c217c45) | projectile-drag 정답 그림의 막대가 100~500ms 뒤 들어와 약 24px이 측정에서 빠짐(외부 검토, 코드 읽기) | hypothesis: 브라우저에서 넘침 미확인 |

## Next Step
1. **단계 그림 겹쳐 쌓기(검토안 B)**: `steps: [{caption, draw(node, fig)}]` 형태를 추가해 kit이 단계별 프레임을 한 grid 칸(`grid-area:1/1`)에 겹치고 현재 단계 외에는 `visibility:hidden`으로 둔다. 높이는 CSS가 최댓값으로 정하고, 자막 위치 판정은 모든 프레임의 `solidRects` 합집합으로 한다. 대상 예: tls13-quic 4장면(`drawSeq`가 단계마다 길이가 다른 시퀀스를 새로 그림), ontology-triples `fig.draw(rules)`. 강조만 바꾸는 stepper(tls13-quic 8·12)는 probe 없이 ratchet만 쓴다. 위험: SVG `defs` id 충돌, 단계 사이 모핑 상실, DOM N배.
2. **지연 그리기(검토 3번)**: 측정 모드에서 동기 처리되는 `LTT.later(ms, fn)`를 작가 API로 열고 projectile-drag·single-gpu-dataflow·cache-ttl·diversification·retrieval-practice의 `setTimeout`을 옮긴다. 작가 규칙이 하나 늘어 생성 비용과 맞바꾼다. CSS transition은 probe 중 `.dk-still`로 꺼서 이미 해결됐고(visual-hierarchy-spacing 4장면), API.md 문구는 "크기를 바꾸지 않을 때만"으로 고쳤다. 남은 대상은 `setTimeout`·d3 transition으로 크기를 바꾸는 그리기뿐이다.
3. **띄우기를 고려한 배율(검토 4번, 안 C)**: lockZoom이 정답을 흐름 안에만 두고 재서, 빈자리에 뜰 수 있는 장면도 진입부터 축소될 수 있다. 선택지마다 `aria-pressed`·`.right`를 흉내 내고 `floatPanel`로 잰다. 먼저 갤러리에서 실제로 이런 장면이 있는지 확인한다.
4. **공개 상태 resize(검토 7번)**: 공개 상태에서 창 크기가 바뀌면 `ctx.zmax`가 옛 값으로 남는다. 안 C로 상태 무관 계산이 되면 함께 해결된다.

## Open Questions
- 안 B의 새 단계 API를 기존 `enter` 방식과 공존시킬지, 크기가 바뀌는 stepper는 `draw`만 허용할지.
- `LTT.later` 규칙 추가가 수업 생성 비용 대비 가치가 있는지(사용자는 경고 시스템을 생성 비용 때문에 기각했다).

## Spec
없음(workflow-approach 미사용).

## Execution Ledger
- 외부 검토(Opus high) 발견 8건: 1·2·5·6·8번은 즉시 수정으로 분류, 3·4·7번과 안 B·C는 이 문서로 보류.
- 검증 기록: 폭 1400/1000/968/760에서 predict 공개·되돌리기, stepper 단계 전환의 zoom 불변 확인(73939fd 기준). 패킷 잔상은 브라우저 측정 항목에 없었다.
- 즉시 수정 후 검증: 갤러리 11개 페이지 × 폭 1400/1000/760의 predict 공개 30건·stepper 단계 전환 18건·summary 답 보기 30건을 훑음. 처음 돌렸을 때 visual-hierarchy-spacing 4장면만 1단계에서 zoom이 0.983→0.961로 바뀜. 원인은 `.pc > *{transition:all .35s}`라 probe가 전환 전 높이(393px, 실제 411px)를 읽은 것이고(verified), probe 중 transition을 끄도록 고침.
