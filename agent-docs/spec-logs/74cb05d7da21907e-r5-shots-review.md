# R-5 스크린샷 대조 (spec 74cb05d7da21907e v4, VO-10 / QR-9)

- 대상: phase 2 최종 트리에서 audit 크기 DOM이 기준과 다른 페이지. R-1 방식으로 기준 덤프 5회와 최종 덤프 5회를 비교했고 nomatch는 `network/tls13-quic.html`, `knowledge-graph/ontology-triples.html` × 1440x900·1280x800뿐이다.
- DOM 차이: 페이지 `<style>`의 폭 선언 한 줄(`.seqwrap { width: 800px; max-width: 100%; }`, `.kg.wide, .ladder { width: 880px; max-width: 100%; }`), tls13 4장면 `.dk-in` zoom, figure `steps` 그림 상자의 `min-height`.
- 절차:
  - 기준 트리(`git archive b3d5ba5`)와 최종 트리 사본에서 각각 `node skills/learn-to-tell/server/audit.mjs site/gallery/network/tls13-quic.html site/gallery/knowledge-graph/ontology-triples.html --size 1440x900 --size 1280x800 --shots <dir>`를 실행했다(장면 40 × 2크기 = 80장씩).
  - 바이트가 다른 22장 중 DOM이 바뀐 figure 장면(tls13 4·8·12, ontology 10·12)을 `sips -Z 720`으로 줄여 눈으로 대조했다.
  - 나머지(tls13 1·2·5·14·16, ontology 1·2·20·24)는 DOM이 기준과 같은 장면이다. 바이트 차이는 촬영 시점의 애니메이션 차이로 보고, tls13 1280-14 한 장을 확인했다.
- 나빠짐 기준(v4 QR-9): 겹침·잘림, 그림이 칸 안에 있는데도 기준보다 그림 폭이 5% 넘게 줄어듦, 장면 배율 하락 0.005 초과. 칸을 넘치던 그림이 칸 폭으로 줄어든 것은 나빠짐이 아니다.

| 장면 | 크기 | 관찰 | 판정 |
| --- | --- | --- | --- |
| tls13 4 | 1440x900 | 시퀀스 그림 폭 806 → 800px(−0.7%), zoom 0.9631 → 0.9678(상승). 자막 칸과 겹침 없음 | 나빠짐 아님 |
| tls13 4 | 1280x800 | 그림 폭 717 → 723px(칸 폭), zoom 0.8939 → 0.8899(−0.004, 0.005 이하) | 나빠짐 아님(IM-2) |
| tls13 8 | 1440x900·1280x800 | 그림 폭 806 → 800 / 717 → 723, zoom 1 그대로, 겹침 없음 | 나빠짐 아님 |
| tls13 12 | 1440x900·1280x800 | 연결 이전 도식(`.seqwrap`) 폭 806 → 800px / 717 → 723px(implementer CDP 측정), zoom 1 그대로, 겹침·잘림 없음 | 나빠짐 아님 |
| ontology 10 | 1440x900 | Turtle 코드 상자 폭 864 → 866px, 화면 차이 없음 | 나빠짐 아님 |
| ontology 10 | 1280x800 | 기준은 코드 상자(768px)가 칸(723px)을 넘어 자막 글("RDFS · 계층과…")에 닿았다. 최종은 칸 폭 723px에 맞고 자막과 떨어져 있다 | 나빠짐 아님(칸 넘침 해소) |
| ontology 12 | 1440x900 | 그래프 폭 864 → 866px, 화면 차이 없음 | 나빠짐 아님 |
| ontology 12 | 1280x800 | 그래프 폭 768(칸 초과) → 723px(칸 폭, −5.9%). 자막과 겹침 없음 | 나빠짐 아님(IM-2) |
| tls13 14 | 1280x800 | DOM 같음. overflow 경고 장면, 기준과 같은 배치 | 나빠짐 아님 |

결과: "나빠짐" 0장면. 폭 값은 implementer의 CDP 측정(그림 칸 폭 1440 866.3px, 1280 722.9px)과 스크린샷이 서로 맞다.
