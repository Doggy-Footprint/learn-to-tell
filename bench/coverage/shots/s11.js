// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, rect, line, dot, label, legend } = api;
  const REG = [
    { id: "us-east-1", p95: 190 }, { id: "eu-west-1", p95: 120 }, { id: "ap-northeast-2", p95: 78 },
    { id: "sa-east-1", p95: 64 }, { id: "ap-southeast-2", p95: 55 }, { id: "ap-south-1", p95: 49 },
    { id: "af-south-1", p95: 45 }, { id: "me-central-1", p95: 42 }];
  const STACK = 18, PAIR = 2.5;
  /** @param {number} n */
  const cost = (n) => ({ stack: n * STACK, repl: (PAIR * n * (n - 1)) / 2 });
  /** @param {number} n */
  const total = (n) => cost(n).stack + cost(n).repl;
  const YMAX = total(8);
  /** latency ms drawn on the cost axis: 200 ms ↦ YMAX·(320/350) as in the original */
  /** @param {number} ms */
  const ly = (ms) => (ms / 200) * YMAX * (320 / 350);
  const regions = model({ upto: 4, from: 0 }, ({ upto, from }) => ({
    upto, from, rows: REG.map((r, i) => ({ ...r, n: i + 1, ...cost(i + 1), total: total(i + 1) })),
  }), "스택 18k$/리전, 복제 2.5k$/리전 쌍(AWS inter-region 약 $0.02/GB); p95는 CloudPing 류 RTT 근삿값");
  return {
    models: { regions },
    figures: {
      chart: figure(
        cartesian({ x: [0.5, 8.5, "리전 수"], y: [0, YMAX, "천 달러/월"], loop: { ms: 9000, span: [0, 1], warp: [[0, 0], [1, 0.7], [1, 1]] } }),
        (m, t) => {
          const { upto, from, rows } = m.regions;
          const prog = t * (upto - from);
          /** @type {import("ltt").P[]} */
          const pts = [];
          /** @type {import("ltt").MarkTree[]} */
          const cols = rows.map((/** @type {{ n: number; id: string; p95: number; stack: number; repl: number; total: number }} */ r, /** @type {number} */ i) => {
            if (i >= upto) return [
              rect([r.n - 0.3, 0], [r.n + 0.3, YMAX * 0.2], { id: `slot-${r.n}`, tone: "muted", fill: "none" }),
              label([r.n, YMAX * 0.1], "?", { id: `q-${r.n}`, tone: "muted", size: "l" }),
            ];
            const k = i < from ? 1 : Math.max(0, Math.min(1, prog - (i - from)));
            const hs = r.stack * Math.min(1, k * 1.6), hr = r.repl * Math.max(0, (k - 0.4) / 0.6);
            if (k > 0) pts.push([r.n, ly(r.p95) * k + ly(rows[Math.max(0, i - 1)].p95) * (1 - k)]);
            return [
              rect([r.n - 0.3, 0], [r.n + 0.3, hs], { id: `stack-${r.n}`, tone: "series1", fill: "solid" }),
              rect([r.n - 0.3, hs], [r.n + 0.3, hs + hr], { id: `repl-${r.n}`, tone: "series2", fill: "solid" }),
              k > 0.95 && label([r.n, r.total], `$${Math.round(r.total)}k`, { anchor: "s" }),
              label([r.n, 0], r.id, { anchor: "n", size: "s", tone: "muted" }),
              k > 0.95 && dot([r.n, ly(r.p95)], { id: `lat-${r.n}`, tone: "focus", label: `${r.p95}ms` }),
            ];
          });
          return [
            axis("x", { label: "리전 수", ticks: [1, 2, 3, 4, 5, 6, 7, 8] }),
            axis("y", { label: "월 비용" }),
            legend([{ tone: "series1", text: "리전 스택 비용" }, { tone: "series2", text: "리전 간 복제 비용" }, { tone: "focus", text: "전 세계 p95 지연 (선)" }], { id: "key" }),
            cols,
            line(pts, { id: "latency", tone: "focus", weight: "bold" }),
          ];
        },
      ),
    },
    scenes: [{
      type: "predict", title: "리전을 4개에서 8개로 늘리면?", ask: "리전 4개를 8개로 늘리면 지연과 비용은?", figure: "chart", focus: ["latency"],
      params: { upto: 4, from: 0 },
      input: { kind: "choice", options: [
        { text: "지연이 다시 절반쯤 줄고 비용은 두 배", feedback: "사용자 대부분은 이미 가까운 리전이 있다." },
        { text: "지연은 20ms쯤만 줄고 비용은 두 배를 넘는다", correct: true },
        { text: "지연은 그대로, 비용만 두 배", feedback: "지연은 64→42ms로 조금 준다." }] },
      reveal: { say: "지연은 64→42ms, 비용은 $87k→$214k. 복제가 리전 쌍 n(n−1)/2에 비례한다.", figure: "chart", params: { upto: 8, from: 4 } },
    }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s11", src: "archive/v1:site/gallery/shots/s11-region-tradeoff.html", corpus: "shot", domain: "클라우드 · 리전을 늘릴수록 지연은 줄고 비용은 쌓임",
  props: [
    { id: "b1", cat: "T", text: "0–2s 첫 칸 막대가 쌓이고 지연 선이 첫 점에서 시작", essential: true, why: "beat", status: "kept", by: "Loop span [0,1] warp; draw가 t로 rect 높이와 line 점을 계산" },
    { id: "b2", cat: "Q", text: "칸마다 막대(스택+복제 n(n−1)/2)가 더 높이 쌓이고 선(p95 ms)은 내려간다", essential: true, why: "beat; 두 양의 반대 추세가 결론", status: "approx", diff: "보조 y축이 없어 지연을 비용 축에 비례 환산해 그리고 ms 값은 점 label로만 읽는다" },
    { id: "b3", cat: "Q", text: "4–6s 막대는 가파르게, 선은 거의 평평", essential: true, why: "beat", status: "kept", by: "rect·line 위치가 frame 데이터 단위(P 주석 'data units')" },
    { id: "b4", cat: "T", text: "6–9s 그려진 칸 옆에 남은 칸이 점선 ?로 비어 정지", essential: true, why: "beat", status: "approx", diff: "rect·path에 dash 옵션이 없어 빈 칸은 fill none 윤곽+? label로, 점선 질감은 잃는다" },
    { id: "p1", cat: "S", text: "축을 처음부터 최종 범위(8개, $214k)로 고정", essential: true, why: "principle", status: "kept", by: "cartesian x·y Axis 고정, camera 미사용" },
    { id: "p2", cat: "I", text: "빈 칸을 ?로 남겨 예측할 자리를 그림 안에 두고, 답 뒤 4→8 칸이 이어 쌓인다", essential: true, why: "principle", status: "kept", by: "Predict input choice + reveal.figure/reveal.params 'show after'" },
  ],
  verdict: "V", custom: [], candidates: ["dual-y-axis", "rect-dash"],
}];
