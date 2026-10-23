// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, multiples, path, rect, label, sweep, axis } = api;
  const CFG = { now: { f: 1.0, V: 0.8, name: "지금" }, target: { f: 1.5, V: 1.0, name: "목표" } };
  const power = model({ cfg: "now", window: 6 }, (p) => {
    const c = p.cfg === "target" ? CFG.target : CFG.now;
    const ticks = Math.round(c.f * p.window);
    return { ...c, ticks, block: c.V * c.V, energy: ticks * c.V * c.V, ratio: (CFG.target.f * CFG.target.V ** 2) / (CFG.now.f * CFG.now.V ** 2) };
  }, "P = α·C·V²·f (Weste & Harris, CMOS VLSI Design); 같은 칩이면 α·C 상쇄, 6 ns 창에서 클럭마다 C·V² 한 덩어리");
  return {
    models: { power },
    figures: {
      tower: figure(cartesian({ x: [0, 4, ""], y: [0, 7, "C·V² (상대 에너지)"], loop: { ms: 7000, span: [0, 1] } }), (m, t, { params }) => {
        const { ticks, block, name, f, V } = m.power;
        const run = Math.min(1, t / 0.75), n = run * ticks, dy = 6 / ticks;
        const final = params.final === true;
        /** @type {import("ltt").PathCmd[]} */
        const wave = [["M", 0.3, 6.5]];
        for (let k = 0; k < ticks; k++) { const y0 = 6.5 - k * dy; wave.push(["L", 1, y0], ["L", 1, y0 - dy / 2], ["L", 0.3, y0 - dy / 2], ["L", 0.3, y0 - dy]); }
        const shown = final ? ticks : Math.floor(n + 1e-9);
        const top = shown * block;
        return [
          axis("y", { label: "쌓인 에너지 (블록 높이 = V²)" }),
          label([0, 6.9], `${name} ${f.toFixed(1)} GHz · ${V.toFixed(1)} V — 6 ns 동안 클럭 ${ticks}번`, { id: "head", anchor: "w" }),
          path(wave, { id: "clock", tone: "focus", label: "시간 ↓ 6 ns" }),
          !final && t < 0.75 && sweep("y", 6.5 - n * dy, { id: "cursor" }),
          Array.from({ length: shown }, (_, k) => rect([2, k * block], [3.5, (k + 1) * block - 0.03], { id: `blk${k}`, tone: "focus", fill: "soft" })),
          label([2.75, top + 0.15], final ? `에너지 ${(ticks * block).toFixed(2)}` : t < 0.75 ? "" : "?", { id: "total", anchor: "s", weight: "bold" }),
        ];
      }),
      s22: multiples("tower", { over: { cfg: ["now", "target"] } }),
    },
    scenes: [{
      type: "predict", title: "클럭을 1.5배 올리면 동적 전력은 몇 배가 될까?", ask: "1.0 GHz·0.8 V → 1.5 GHz·1.0 V. 같은 칩의 동적 전력은?",
      figure: "s22", focus: ["blk0", "clock"],
      input: { kind: "choice", options: [{ text: "1.5배", feedback: "블록 높이(V²)도 커진다." }, { text: "약 1.9배", feedback: "V는 1.25배지만 V²는 1.56배다." }, { text: "약 2.3배", correct: true }, { text: "약 3.5배", feedback: "f는 제곱이 아니다." }] },
      reveal: { say: (m) => `블록 개수 1.5배(f) × 블록 높이 1.56배(V²) ≈ ${m.power.ratio.toFixed(2)}배.`, params: { final: true }, marks: ["total"] },
    }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s22", src: "s22-clock-power.html", corpus: "shot", domain: "칩 설계 · 클럭을 올리면 동적 전력(∝ fV²)이 쌓임",
  props: [
    { id: "b1", cat: "T", text: "커서가 클럭 파형을 따라 내려가고 클럭마다 V² 높이 블록이 쌓인다", essential: true, why: "beat 1", status: "approx", diff: "블록이 위에서 떨어지는 낙하 움직임 없이 클럭을 지날 때 제자리에 나타난다(MarkOpts.from은 다른 mark에서 나오는 것만 말함)" },
    { id: "b2", cat: "T", text: "오른쪽은 클럭이 촘촘해 블록이 더 자주, 더 큰 크기로 쌓인다", essential: true, why: "beat 2", status: "kept", by: "multiples: one copy per value, sharing frame, axes, t" },
    { id: "b3", cat: "T", text: "왼쪽 6개는 멈추고 오른쪽 9개가 끝까지 쌓여 높이 차가 벌어진다", essential: true, why: "beat 3", status: "kept", by: "multiples share t; both copies' run normalised to window so left 6 ends with right 9 (원본도 같은 run 비율)" },
    { id: "b4", cat: "T", text: "커서가 사라지고 두 탑의 합계 높이가 나란히 머문다", essential: true, why: "beat 4", status: "kept", by: "conditional marks on t; multiples sharing axes (same y scale)" },
    { id: "q1", cat: "Q", text: "블록 높이 ∝ V²(0.64 vs 1.0), 개수 ∝ f(6 vs 9), 같은 축척, 비율 2.34", essential: true, why: "결론 2.3배", status: "kept", by: "rect in data units; multiples sharing frame, axes" },
    { id: "i1", cat: "I", text: "예측 전 합계는 '?', 답 뒤 그림에 에너지 값", essential: true, why: "predict 구조", status: "kept", by: "Predict.reveal.params show after; reveal.marks" },
    { id: "p1", cat: "E", text: "두 인수를 다른 채널(개수·블록 크기)로, 결과는 높이 하나로 비교", essential: true, why: "principle", status: "kept", by: "rect count and rect height in shared y Axis" },
  ],
  verdict: "V", custom: [], candidates: ["drop-in"],
}];
