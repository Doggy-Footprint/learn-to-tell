# R-1·R-4 실행 기록 (spec 74cb05d7da21907e, verifier advisory A-5)

덤프 디렉터리는 크기 때문에 세션 scratchpad에만 있었다. 같은 명령으로 다시 만들 수 있다.

- 기준: `git archive b3d5ba5` 사본 → `node agent-docs/spec-logs/0041d668222ce019-dom-dump.mjs <사본> dom-base-{1..5}`. 기준 dom-base-1 대비 `0041d668222ce019-dom-diff.sh` 결과는 diffs 0·1·1·0이다.
- phase 1(ledger 3): 작업 트리 사본 덤프 dom-m1-{1..3} → `0041d668222ce019-dom-match.sh "dom-base-1..5" "dom-m1-1..3"` 출력 `files=26 nomatch=0`. audit JSON은 26회에 오류 0, 기준 대비 배열 차이 0.
- 최종(ledger 8): dom-m4-{1..5}
  - 1–3회만 대조하면 `NOMATCH 1280x800__finance__diversification.html`가 하나 더 나온다. d3 `stroke-dashoffset` 값 410.78/305.22가 기준 411.38과 달랐는데, transition이 끝나기 전 값을 찍은 것이다.
  - 5회로 대조하면 `NOMATCH` 4개(`1280x800__knowledge-graph__ontology-triples.html`, `1280x800__network__tls13-quic.html`, `1440x900__knowledge-graph__ontology-triples.html`, `1440x900__network__tls13-quic.html`), 출력 `files=26 nomatch=4`.
  - 그 4개 파일의 차이: 페이지 `<style>`의 폭 선언 한 줄, tls13 4장면 `.dk-in` zoom(1440 0.963074 → 0.967816, 1280 0.893926 → 0.889908), `.pic` `min-height`(tls13 425→421 / 378→381px, ontology 250→251 / 223→209px).
- audit(최종): `74cb05d7da21907e-p2-audit.json`. 26회에 오류 0, 경고 42건, 기준 `74cb05d7da21907e-base-audit.json`과 audit·lint·expectFails 배열 차이 0.
- R-4: 기준과 작업 트리의 kit 파일 6개를 vm에 불러 `Object.keys(LTT)`를 비교했다. 출력 `base 74 new 75 added [ 'placement' ] lost []`.
- baseline: `tests/gallery-audit.baseline.json` sha256 a40956c21427d9965e68b12726130e84eb6e8453af04d5388f66dd904fb35c5e(기준과 같음, 건수가 줄지 않아 `audit:baseline`을 돌리지 않음).
