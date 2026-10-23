// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, multiples, axis, grid, line, dot, rect, sweep, label } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const p = (x, y) => [x, y];
  const Ka = 1.75e-5, Ca = 0.1, Va = 25, Cb = 0.1, Kw = 1e-14, VMAX = 40;
  /** @param {number} V */
  const pH = (V) => {
    const T = Va + V, na = (Cb * V) / T, ct = (Ca * Va) / T;
    let lo = 0, hi = 14;
    for (let i = 0; i < 60; i++) {
      const mm = (lo + hi) / 2, h = 10 ** -mm, f = na + h - Kw / h - (ct * Ka) / (Ka + h);
      if (f > 0) lo = mm; else hi = mm;
    }
    return (lo + hi) / 2;
  };
  const PTS = Array.from({ length: 201 }, (_, i) => p(i * 0.2, pH(i * 0.2)));
  const ZONE = { buffer: { v0: 2.3, v1: 22.7 }, eq: { v0: 24.4, v1: 25.6 }, ind: { v0: 24.9, v1: 25.2 } };
  const term = model(
    { kind: "buffer" },
    (q) => {
      const kind = q.kind === "eq" ? "eq" : q.kind === "ind" ? "ind" : "buffer";
      return { kind, zone: ZONE[kind], eqPH: pH(25), halfPH: pH(12.5) };
    },
    "0.10 M 아세트산 25 mL + 0.10 M NaOH, Ka 1.75e-5, 전하 균형 [Na+]+[H+]=[OH-]+[A-] 이분법. 변색 범위는 일반화학 교과서 표",
  );
  const curve = figure(
    cartesian({ x: [0, VMAX, "mL"], y: [0, 14, "pH"], loop: { ms: 8000, span: [0, VMAX], warp: [[0, 0], [4, 0.2], [36, 0.6], [VMAX, 0.8], [VMAX, 1]] } }),
    (m, v) => {
      const z = m.term.zone, kind = m.term.kind, on = v >= z.v0 ? 1 : 0;
      const lit = PTS.filter((d) => d[0] >= z.v0 - 0.3 && d[0] <= Math.min(v, z.v1 + 0.3));
      return [
        axis("x", { label: "NaOH 부피", ticks: [0, 10, 20, 30, 40] }),
        axis("y", { label: "pH", ticks: [0, 2, 4, 6, 8, 10, 12, 14] }),
        grid({ y: 2 }),
        kind === "ind" && [rect(p(0, 8.2), p(VMAX, 10), { id: "band", tone: "warn", fill: "soft", opacity: on }), label(p(2, 10.3), "페놀프탈레인 pH 8.2–10", { id: "tag", anchor: "sw", weight: "bold", opacity: on })],
        kind === "buffer" && [rect(p(z.v0, 0), p(z.v1, 14), { id: "band", tone: "focus", fill: "soft", opacity: 0.6 * on }), label(p(12.5, 7.4), "pH = pKa ± 1 (4.76)", { id: "tag", weight: "bold", opacity: on })],
        kind === "eq" && [sweep("x", 25, { id: "band", tone: "ref", opacity: on }), label(p(26.5, m.term.eqPH), "25 mL, pH 8.7", { id: "tag", anchor: "w", weight: "bold", opacity: on })],
        line(PTS, { id: "curve", tone: "muted" }),
        lit.length > 1 && line(lit, { id: "lit", tone: "focus", weight: "bold" }),
        dot(p(v, pH(v)), { id: "drop", tone: "focus" }),
      ];
    },
  );
  const terms = multiples("curve", { over: { kind: ["buffer", "eq", "ind"] } });
  return { models: { term }, figures: { curve, terms } };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s46", src: "s46-titration-terms.html", corpus: "shot", domain: "화학 · 적정 곡선의 당량점, 지시약, 완충 구간",
  props: [
    { id: "b1", cat: "T", text: "0–1.5s 세 곡선 위 점이 같은 속도로 출발하고 아직 어느 구간도 칠해지지 않는다", essential: true, why: "beat", status: "kept", by: "multiples \"sharing frame, axes, t\"; band opacity = v ≥ v0" },
    { id: "b2", cat: "E", text: "1.5–3.3s 점이 완만한 구간을 지나며 한 칸만 그 구간이 굵게 칠해지고 띠가 깔린다", essential: true, why: "beat", status: "kept", by: "lit line(weight bold, tone focus)을 zone 안 PTS 중 v 이하로; rect fill soft" },
    { id: "b3", cat: "E", text: "3.3–4s 점이 가파른 벽을 오르며 당량점 세로선과 지시약 띠가 함께 켜진다", essential: true, why: "beat", status: "kept", by: "Api.sweep(\"x\",25) + rect(8.2–10), 같은 t 조건" },
    { id: "b4", cat: "T", text: "4–7.5s 점이 끝까지 훑고 세 칸이 각자 칠한 구간을 남긴 채 멈춘다", essential: true, why: "beat", status: "kept", by: "Loop.warp \"repeated modelT holds\" [[40,0.8],[40,1]]" },
    { id: "pr", cat: "S", text: "같은 곡선을 개념 수만큼 나란히 두고 강조만 바꾸면 관계가 위치로 보인다", essential: true, why: "principle", status: "kept", by: "Api.multiples over kind, \"sharing frame, axes\"" },
    { id: "q1", cat: "Q", text: "pH(V) 곡선: 전하 균형 해, x mL 0–40, y pH 0–14 선형", essential: true, why: "당량점 8.7, 반당량점 4.76", status: "kept", by: "Api.model src + Axis 단위" },
    { id: "t2", cat: "T", text: "점 속도 ease(가속·감속)", essential: false, why: "원본 easing", status: "approx", diff: "warp 구간 선형 근사로 easing 모양이 다르다." },
  ],
  verdict: "V", custom: [], candidates: [],
}];
