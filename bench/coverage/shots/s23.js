// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, multiples, split, axis, line, path, dot, label, rect } = api;
  const R = 8.314, G = 5 / 3;
  const carnot = model({ TH: 500, TC: 300, V1: 10, V2: 30, leg: 0 }, ({ TH, TC, V1, V2 }) => {
    const K = Math.pow(TH / TC, 1 / (G - 1)), V3 = V2 * K, V4 = V1 * K;
    const legs = [
      { n: "① 등온 팽창", a: V1, b: V2, iso: true, T: TH },
      { n: "② 단열 팽창", a: V2, b: V3, iso: false, T: TH },
      { n: "③ 등온 압축", a: V3, b: V4, iso: true, T: TC },
      { n: "④ 단열 압축", a: V4, b: V1, iso: false, T: TC },
    ];
    /** @param {typeof legs[number]} l @param {number} s @returns {import("ltt").P} */
    const at = (l, s) => { const V = l.a * Math.pow(l.b / l.a, s); return [V, l.iso ? (R * l.T) / V : (R * l.T * Math.pow(l.a, G - 1)) / Math.pow(V, G)]; };
    const curves = legs.map((l) => Array.from({ length: 61 }, (_, k) => at(l, k / 60)));
    const QIN = R * TH * Math.log(V2 / V1), QOUT = R * TC * Math.log(V3 / V4);
    return { legs, curves, at, QIN, QOUT, W: QIN - QOUT, eta: 1 - TC / TH };
  }, "이상기체 1 mol He(γ=5/3): 등온 Q=nRT ln(V2/V1), 단열 TV^(γ−1)=일정, η=1−TC/TH (Çengel & Boles 6장); P[kPa]=RT/V[L]");
  /** @param {number} u */
  const phase = (u) => { const k = Math.min(3, Math.floor(u / 0.2)), x = Math.max(0, Math.min(1, (u - k * 0.2) / 0.17)); return { k, local: u >= 0.8 ? 1 : x }; };
  const loop = { ms: 8000, span: /** @type {[number, number]} */ ([0, 1]) };
  return {
    models: { carnot },
    figures: {
      cell: figure(cartesian({ x: [5, 70, "L"], y: [0, 450, "kPa"], loop }), (m, t, { params }) => {
        const i = Number(params.leg ?? 0), { legs, curves, at } = m.carnot, { k, local } = phase(t);
        const p = i < k ? 1 : i === k ? local : 0;
        /** @type {import("ltt").PathCmd[]} */
        const ring = curves.flatMap((/** @type {import("ltt").P[]} */ c, /** @type {number} */ j) => c.map((q, n) => /** @type {import("ltt").PathCmd} */ ([n === 0 && j === 0 ? "M" : "L", q[0], q[1]])));
        ring.push(["Z"]);
        return [
          axis("x", { label: "V" }), axis("y", { label: "P" }),
          label([5, 440], legs[i].n, { id: `title${i}`, anchor: "nw" }),
          t >= 0.8 && path(ring, { id: `loop-area${i}`, tone: "focus", fill: "soft", opacity: Math.min(1, (t - 0.8) / 0.08) }),
          curves.map((/** @type {import("ltt").P[]} */ c, /** @type {number} */ j) => line(c, { id: `ghost${i}-${j}`, dash: true, tone: "muted", weight: "thin" })),
          curves.slice(0, i).map((/** @type {import("ltt").P[]} */ c, /** @type {number} */ j) => line(c, { id: `done${i}-${j}`, tone: "ref" })),
          p > 0 && line(curves[i], { id: `now${i}`, tone: i === k ? "focus" : "ref", weight: "bold", reveal: p }),
          i === k && dot(at(legs[i], p), { id: `dot${i}`, tone: "focus" }),
        ];
      }),
      cells: multiples("cell", { over: { leg: [0, 1, 2, 3] } }),
      bars: figure(cartesian({ x: [0, 5000, "J"], y: [0, 3, ""], loop }), (m, t) => {
        const { QIN, QOUT, W, eta } = m.carnot, { k, local } = phase(t), wf = Math.max(0, Math.min(1, (t - 0.8) / 0.08));
        const fin = k === 0 ? local : 1, fout = k < 2 ? 0 : k === 2 ? local : 1;
        return [
          axis("x", { label: "열·일" }),
          label([0, 2.95], "한 바퀴 = 고리 넓이만큼 일", { anchor: "nw" }),
          rect([0, 2], [QIN * fin, 2.5], { id: "b-in", tone: "ref", fill: "solid", label: fin > 0.98 ? `① 받은 열 Q_in ${Math.round(QIN)} J` : "" }),
          rect([0, 1.2], [QOUT * fout, 1.7], { id: "b-out", tone: "ref", fill: "solid", label: fout > 0.98 ? `③ 버린 열 Q_out ${Math.round(QOUT)} J` : "" }),
          rect([0, 0.4], [W * wf, 0.9], { id: "b-w", tone: "focus", fill: "solid", label: wf > 0.98 ? `순일 W ${Math.round(W)} J` : "" }),
          wf > 0 && label([5000, 2.95], `효율 η = 1 − 300/500 = ${Math.round(eta * 100)}%`, { id: "eta", anchor: "ne", opacity: wf }),
        ];
      }),
      s23: split(["cells", "bars"]),
    },
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s23", src: "s23-carnot-cycle.html", corpus: "shot", domain: "열역학 · 카르노 사이클 P-V 궤적 한 장 정리",
  props: [
    { id: "b1", cat: "T", text: "첫 칸에서 점이 자기 구간 곡선을 그린다", essential: true, why: "beat 1", status: "kept", by: "MarkOpts.reveal drawn fraction by arc length; dot at model point" },
    { id: "b2", cat: "T", text: "둘째 칸으로 넘어가 지난 경로를 흐리게 남긴 채 다음 구간이 그려진다", essential: true, why: "beat 2", status: "kept", by: "multiples share t; params.leg per copy; done lines tone ref" },
    { id: "b3", cat: "T", text: "셋째·넷째 칸이 차례로 그려져 경로가 닫히는 고리가 된다", essential: true, why: "beat 3", status: "kept", by: "Loop span maps linearly onto ms; reveal" },
    { id: "b4", cat: "T", text: "고리 넓이가 칠해지고 Q_in·Q_out·W 막대와 효율이 나타난다", essential: true, why: "beat 4", status: "kept", by: "path fill soft with Z; rect in J axis; opacity on t" },
    { id: "q1", cat: "Q", text: "P-V 곡선(등온 RT/V, 단열 PV^γ), 같은 축 V 5–70 L·P 0–450 kPa, Q_in 4567 J, W 1827 J, η 40%", essential: true, why: "결론 수치", status: "kept", by: "model fn; multiples sharing frame, axes" },
    { id: "g1", cat: "G", text: "막대 길이가 같은 J 축척(Q_in−Q_out = W)", essential: true, why: "결과 비교", status: "kept", by: "rect in cartesian x Axis J" },
    { id: "p1", cat: "S", text: "같은 축의 작은 칸으로 단계를 나누고 한 바퀴 결과는 맨 끝에만", essential: true, why: "principle", status: "kept", by: "multiples: one copy per value sharing frame, axes, t" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
