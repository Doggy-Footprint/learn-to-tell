// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, grid, axis, rect, line, dot, label, sweep, legend } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const pt = (x, y) => [x, y];
  const D = Array.from({ length: 12 }, (_, i) => i + 1);
  const bv = model({ noise: 0.1 }, ({ noise }) => {
    const bias2 = D.map((d) => 0.85 * Math.exp(-0.55 * (d - 1)));
    const vari = D.map((d) => 0.01 * Math.exp(0.4 * (d - 1)));
    const total = D.map((_, i) => bias2[i] + vari[i] + noise);
    const best = D[total.indexOf(Math.min(...total))];
    return { bias2, vari, total, best, noise };
  }, "E[(y−f̂)²] = 편향² + 분산 + σ² (ESL 7.3절); 곡선 계수는 모양을 보이기 위한 가정");
  /** @param {number} x */
  const ease = (x) => 1 - (1 - x) ** 3;
  const bw = 0.31;
  return {
    models: { bv },
    figures: {
      s33: figure(
        cartesian({ x: [0.5, 12.5, "차수"], y: [0, 1, "MSE"], loop: { ms: 9000, span: [0, 1] } }),
        (m, u) => {
          const b = m.bv, grow = Math.min(1, u / 0.7), fade = u > 0.95 ? 1 - (u - 0.95) / 0.05 : 1, done = u >= 0.7 ? fade : 0;
          let last = -1;
          const bars = D.map((d, i) => {
            const p = Math.max(0, Math.min(1, grow * 12 - i)), e = ease(p) * fade;
            if (p > 0) last = i;
            const layers = /** @type {[string, number, import("ltt").Tone][]} */ ([["noise", b.noise, "muted"], ["bias", b.bias2[i], "series1"], ["var", b.vari[i], "series2"]]);
            let acc = 0;
            return layers.map(([k, v, tone]) => { const y0 = acc; acc += v * e; return rect(pt(d - bw, Math.min(1, y0)), pt(d + bw, Math.min(1, acc)), { id: `${k}-${d}`, tone, fill: "solid" }); });
          });
          const pts = D.slice(0, last + 1).map((d, i) => pt(d, b.total[i]));
          return [
            grid({ y: [0, 0.25, 0.5, 0.75, 1] }),
            axis("x", { label: "모델 복잡도 (다항식 차수)", ticks: D }),
            axis("y", { label: "테스트 오차 (MSE)", ticks: [0, 0.25, 0.5, 0.75, 1] }),
            bars,
            line(pts, { id: "total", weight: "bold", opacity: fade }),
            last >= 0 && dot(pts[last], { id: "head", opacity: fade, label: u < 0.7 ? b.total[last].toFixed(2) : undefined }),
            sweep("x", b.best, { id: "best", tone: "focus", label: `가장 낮은 오차 · 차수 ${b.best}`, opacity: done }),
            label(pt(1.1, 0.98), "과소적합: 편향이 크다", { id: "under", anchor: "w", opacity: done }),
            label(pt(12.4, 0.98), "과적합: 분산이 크다", { id: "over", anchor: "e", opacity: done }),
            legend([{ tone: "series2", text: "분산" }, { tone: "series1", text: "편향²" }, { tone: "muted", text: "잡음" }], { id: "key", at: pt(9, 0.9) }),
          ];
        },
      ),
    },
    scenes: [{ type: "explain", title: "복잡도를 올리면 편향은 줄고 분산은 쌓인다", say: "합이 가장 낮은 차수에서 멈춘다. 그보다 단순하면 편향이, 복잡하면 분산이 오차를 키운다.", figure: "s33", focus: ["total", "best"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s33", src: "s33-bias-variance-error.html", corpus: "shot", domain: "ML · 편향-분산, 모델 복잡도별 오차",
  props: [
    { id: "b1", cat: "T", text: "낮은 차수 막대가 잡음·편향²·분산 순으로 쌓이고 합계 선이 그려진다", essential: true, why: "beat 1", status: "kept", by: "rect stacked in data units, heights grown from loop t; line pts up to last grown bar" },
    { id: "b2", cat: "Q", text: "차수가 오를수록 편향² 층은 줄고 분산 층이 쌓이며 선이 내려간다", essential: true, why: "beat 2", status: "kept", by: "model bias2 = 0.85e^(−0.55(d−1)), var = 0.01e^(0.4(d−1)), noise 0.10; linear y axis MSE" },
    { id: "b3", cat: "Q", text: "높은 차수에서 분산 층이 커지며 합계 선이 다시 올라간다(y는 1.0에서 잘림)", essential: true, why: "beat 3", status: "approx", diff: "원본은 1.0 넘는 막대를 축 끝에서 자르는데 여기서도 Math.min으로 자르지만 잘림 표시는 runtime이 하지 않는다('marks are clipped to the frame'만 보장)" },
    { id: "b4", cat: "E", text: "최저점 차수(6)에 표시가 나타나고 양쪽 설명과 함께 멈춘다", essential: true, why: "beat 4", status: "kept", by: "sweep('x', best) with opacity 0 until u ≥ 0.7; labels same" },
    { id: "p1", cat: "T", text: "성분을 한 막대에 쌓고 합계 선을 함께 그려, 다 그린 뒤에야 최적점을 표시한다", essential: true, why: "principle", status: "kept", by: "time-driven opacity of best mark after growth phase" },
  ],
  verdict: "V", custom: [], candidates: ["stacked-bar", "axis-break"],
}];
