// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, multiples, axis, grid, line, dot, label, rect } = api;
  const ITEMS = [{ k: "식료품", r: 10 }, { k: "주거·전기", r: 2 }, { k: "교통", r: 4 }, { k: "기타", r: 1 }];
  const W = { old: [0.30, 0.15, 0.11, 0.44], new: [0.15, 0.18, 0.11, 0.56] };
  const tones = /** @type {const} */ (["series1", "series2", "series3", "series4"]);
  const cpi = model({ basket: "old" }, (p) => { const w = p.basket === "new" ? W.new : W.old; return { w, total: ITEMS.reduce((a, it, i) => a + w[i] * it.r, 0) }; },
    "CPI 상승률 = Σ(품목군 가격 변화 × 가중치); 가중치는 통계청 2020 기준 품목군 비중 단순화, 가격 변화는 가정");
  return {
    models: { cpi },
    figures: {
      panel: figure(cartesian({ x: [0, 12, "월"], y: [0, 13, "%"], loop: { ms: 8000, span: [0, 1] } }), (m, t, { params }) => {
        const { w, total } = m.cpi;
        const a = Math.min(1, t / 0.35), b = Math.max(0, Math.min(1, (t - 0.35) / 0.4)), fade = t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1;
        let x0 = 0;
        return [
          axis("x", { label: "기간", ticks: [0, 6, 12] }), axis("y", { label: "누적 가격 변화", ticks: [0, 2, 4, 6, 8, 10] }), grid({ y: 2 }),
          label([0, 12.9], `${params.basket === "new" ? "새" : "옛"} 바스켓 가중치`, { anchor: "nw" }),
          w.map((/** @type {number} */ v, /** @type {number} */ i) => { const r = rect([x0, 11.2], [x0 + v * 12, 12.2], { id: `w${i}`, tone: tones[i], fill: "solid", label: `${Math.round(v * 100)}%` }); x0 += v * 12; return r; }),
          ITEMS.map((it, i) => line([[0, 0], [12, it.r]], { id: `item${i}`, tone: tones[i], reveal: a, opacity: 0.55 * fade, label: `${it.k} +${it.r}%` })),
          b > 0 && line([[0, 0], [12, total]], { id: "cpi-line", weight: "bold", reveal: b, opacity: fade }),
          b > 0 && dot([12 * b, total * b], { id: "cpi-dot", opacity: fade }),
          b > 0 && label([0.5, 10.5], `CPI +${(total * b).toFixed(2)}%`, { id: "cpi-val", anchor: "nw", size: "l", opacity: fade }),
        ];
      }),
      s25: multiples("panel", { over: { basket: ["old", "new"] } }),
    },
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s25", src: "s25-cpi-basket-weights.html", corpus: "shot", domain: "물가 · CPI 바스켓 가중치가 바뀌면 같은 가격 변화도 다른 물가",
  props: [
    { id: "b1", cat: "T", text: "양쪽 칸에 같은 품목별 가격선 4개가 그려진다", essential: true, why: "beat 1", status: "kept", by: "multiples: one copy per value, sharing frame, axes, t; MarkOpts.reveal" },
    { id: "b2", cat: "T", text: "굵은 평균선이 그려지고 위 숫자가 오른다", essential: true, why: "beat 2", status: "kept", by: "reveal fraction + Text recomputed per t" },
    { id: "b3", cat: "T", text: "두 굵은 선 기울기와 최종 숫자(4.18 vs 2.86)가 나란히 머문 뒤 사라진다", essential: true, why: "beat 3", status: "kept", by: "multiples sharing axes; opacity on t" },
    { id: "q1", cat: "Q", text: "가중치 30/15/11/44 vs 15/18/11/56, 가격 +10/+2/+4/+1%, 같은 y 축척", essential: true, why: "결론", status: "kept", by: "model fn; multiples sharing frame, axes" },
    { id: "p1", cat: "E", text: "입력은 똑같고 가중치만 다르게 해 굵은 선 기울기 차이 하나가 메시지", essential: true, why: "principle", status: "kept", by: "multiples over basket; weight bold" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
