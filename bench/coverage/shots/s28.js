// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, grid, line, sweep, label, glyph, dot, dim } = api;
  const HALF = 8, TMAX = 72;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const pt = (x, y) => [x, y];
  /** @param {number} t @param {number} tau */
  const conc = (t, tau) => { let c = 0; for (let n = 0; n * tau <= t + 1e-9; n++) c += 2 ** (-(t - n * tau) / HALF); return c; };
  /** @param {number} tau */
  const accum = (tau) => 1 / (1 - 2 ** (-tau / HALF));
  const KEYS = [16, 8, 4];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  /** model time u in [0,3): each key held for 55% of its segment, then eased to the next */
  /** @param {number} u */
  const tauAt = (u) => { const i = Math.floor(u) % 3, f = u - Math.floor(u), a = KEYS[i], b = KEYS[(i + 1) % 3]; return f < 0.55 ? a : a + (b - a) * ease((f - 0.55) / 0.45); };
  return {
    models: {
      pk: model({ half: HALF }, ({ half }) => ({ accum8: 1 / (1 - 2 ** (-8 / half)) }), "1구획 정맥 bolus, 테오필린 반감기 8h(Goodman & Gilman 약동학 표), 축적 = 1/(1−2^(−τ/8))"),
    },
    figures: {
      s28: figure(
        cartesian({ x: [0, TMAX, "h"], y: [0, 3.8, "첫 최고 농도 = 1"], loop: { ms: 9000, span: [0, 3] } }),
        (m, t) => {
          const tau = tauAt(t), r = accum(tau);
          /** @type {import("ltt").MarkTree[]} */
          const singles = [];
          for (let n = 0; n * tau <= TMAX; n++) {
            const t0 = n * tau, pts = [pt(t0, 0)];
            for (let s = t0; s <= TMAX; s += 0.5) pts.push(pt(s, 2 ** (-(s - t0) / HALF)));
            singles.push(line(pts, { id: `dose-${n}`, tone: "muted", dash: true, weight: "thin", opacity: 0.75 }));
            singles.push(glyph("triangle-up", pt(t0, 0), { id: `dose-tick-${n}`, tone: "ref", size: "s" }));
          }
          const sum = Array.from({ length: 361 }, (_, i) => pt(i * 0.2, conc(i * 0.2, tau)));
          return [
            grid({ x: 12, y: 1 }),
            axis("x", { label: "투여 뒤 시간", ticks: [0, 12, 24, 36, 48, 60, 72] }),
            axis("y", { label: "혈중 농도 (첫 최고 농도 = 1)", ticks: [0, 1, 2, 3] }),
            singles,
            sweep("y", r, { id: "plateau", tone: "ref", label: `정상 상태 ×${r.toFixed(1)}` }),
            line(sum, { id: "sum", tone: "focus", weight: "bold" }),
            dim(pt(0, 0.5), pt(HALF, 0.5), "반감기 8h → 절반", { id: "half-life" }),
            dot(pt(HALF, 0.5), { id: "half-dot" }),
            label(pt(2, 3.6), `투약 간격 τ = ${tau.toFixed(1).replace(".0", "")}시간 · τ/반감기 = ${(tau / HALF).toFixed(2)}`, { id: "readout", anchor: "w", size: "l" }),
          ];
        },
      ),
    },
    scenes: [
      { type: "hook", title: "같은 약, 간격만 줄였는데 세 배로 쌓인다", say: "점선은 한 번씩 먹은 약, 굵은 선은 그 합이다.", figure: "s28", focus: ["sum", "plateau"] },
    ],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s28", src: "s28-dosing-interval.html", corpus: "shot", domain: "약리 · 투약 간격에 따른 혈중 농도 곡선과 반감기",
  props: [
    { id: "b1", cat: "T", text: "간격 16h에서 흐린 회당 곡선이 거의 다 빠진 뒤 다음 톱니가 그려진다", essential: true, why: "beat 1", status: "kept", by: "figure draw is sampled over the frame's time; Loop span/ms; MarkOpts opacity·dash·tone muted for 회당 곡선" },
    { id: "b2", cat: "T", text: "간격이 연속으로 줄며 톱니가 촘촘해지고 굵은 합 곡선 모양이 바뀐다", essential: true, why: "beat 2", status: "kept", by: "draw(m, t) recomputes tau from t each sample; weight bold on sum line" },
    { id: "b3", cat: "Q", text: "간격 8h에서 합이 정상 상태 선(×2.0) 근처에 멈춘다", essential: true, why: "beat 3", status: "kept", by: "sweep('y', accum(tau)) at data value; Axis unit; hold expressed by tauAt piecewise of model t" },
    { id: "b4", cat: "Q", text: "간격 4h에서 곡선이 촘촘히 쌓여 합과 정상 상태 선(×3.4)이 높이 오른다", essential: true, why: "beat 4", status: "kept", by: "same model formula; line/sweep in data units" },
    { id: "p1", cat: "E", text: "개별 기여분은 흐리게 겹치고 합은 굵게 그린다", essential: true, why: "principle", status: "kept", by: "MarkOpts tone muted/opacity/dash vs tone focus weight bold; later marks paint on top" },
    { id: "p2", cat: "T", text: "변수(τ) 하나만 연속으로 바꿔 모양 변화로 메커니즘을 보인다", essential: true, why: "principle", status: "approx", diff: "τ의 연속 변화는 loop 시간으로 그림 안에서 계산하므로 τ가 knob·param으로 드러나지 않고 hold·ease 구간이 slow-motion 표시 대상인지 정해지지 않는다" },
  ],
  verdict: "V", custom: [], candidates: ["param-tween"],
}];
