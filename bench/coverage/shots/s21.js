// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, line, dot, label, ode } = api;
  const LV = { a: 0.55, b: 0.028, c: 0.84, d: 0.026 };
  const run = ode((t, [x, y]) => [LV.a * x - LV.b * x * y, LV.d * x * y - LV.c * y], [50, 8], [0, 40], 0.01);
  // first return to y = 8 upward with x near start gives the period
  const pts = run.points;
  let PERIOD = 0;
  for (let i = 200; i < pts.length; i++) { const [px, py] = pts[i - 1].y, [x, y] = pts[i].y; if (py < 8 && y >= 8 && x > 32 && x < px + 1) { PERIOD = pts[i].t; break; } }
  const lv = model({ a: LV.a, b: LV.b, c: LV.c, d: LV.d }, (p) => ({ orbit: run, period: PERIOD, ex: p.c / p.d, ey: p.a / p.b }),
    "로트카-볼테라 dx=ax−bxy, dy=dxy−cy, RK4 h=0.01; 눈신토끼·스라소니 약 10년 주기(허드슨베이 기록)에 맞춘 매개변수");
  const Q = [
    { at: /** @type {import("ltt").P} */ ([88, 6]), t: "① 토끼가 많다 → 스라소니가 는다" },
    { at: /** @type {import("ltt").P} */ ([88, 58]), t: "② 스라소니가 많다 → 토끼가 준다" },
    { at: /** @type {import("ltt").P} */ ([4, 58]), t: "③ 먹이가 없다 → 스라소니가 준다" },
    { at: /** @type {import("ltt").P} */ ([4, 6]), t: "④ 천적이 적다 → 토끼가 회복한다" },
  ];
  return {
    models: { lv },
    figures: {
      s21: figure(cartesian({ x: [0, 100, "천 마리"], y: [0, 62, "천 마리"], loop: { ms: 9000, span: [0, PERIOD] } }), (m, t) => {
        const { orbit, period, ex, ey } = m.lv;
        /** @param {number} tt */
        const at = (tt) => /** @type {import("ltt").P} */ (orbit.at(((tt % period) + period) % period));
        const [x, y] = at(t);
        const qi = x >= ex ? (y < ey ? 0 : 1) : y >= ey ? 2 : 3;
        return [
          axis("x", { label: "토끼 수" }),
          axis("y", { label: "스라소니 수" }),
          line([[ex, 0], [ex, 62]], { id: "eq-x", dash: true, tone: "muted", label: "평형 32천" }),
          line([[0, ey], [100, ey]], { id: "eq-y", dash: true, tone: "muted", label: "평형 20천" }),
          line(orbit.until(period).map((/** @type {{ y: number[] }} */ p) => /** @type {import("ltt").P} */ ([p.y[0], p.y[1]])), { id: "orbit", tone: "ref" }),
          Q.map((q, i) => label(q.at, q.t, { id: `q${i + 1}`, anchor: i % 3 === 0 ? (i === 0 ? "e" : "w") : i === 1 ? "e" : "w", opacity: i === qi ? 1 : 0.35, weight: i === qi ? "bold" : "normal" })),
          Array.from({ length: 15 }, (_, i) => dot(at(t + ((i + 1) * period) / 16), { id: `p${i + 1}`, size: "s", tone: "muted", opacity: 0.55 })),
          dot([x, y], { id: "now", tone: "focus", size: "l", label: `큰 점: ${t.toFixed(1)}년째` }),
        ];
      }),
    },
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s21", src: "s21-predator-prey-cycle.html", corpus: "shot", domain: "생태 · 포식자-피식자 순환 한 장 정리",
  props: [
    { id: "b1", cat: "T", text: "점 16개가 닫힌 궤도를 모델 시간 속도대로 흐르고 큰 점이 든 구역 문장이 밝아진다", essential: true, why: "beat 1", status: "kept", by: "ode Series.at(t) + Loop span [0, period] maps linearly onto ms; MarkOpts.opacity" },
    { id: "b2", cat: "T", text: "큰 점이 다음 구역으로 넘어가면 밝아지는 문장이 바뀐다", essential: true, why: "beat 2", status: "kept", by: "draw sampled over frame time; quadrant from model ex, ey" },
    { id: "b3", cat: "T", text: "큰 점이 왼쪽 아래 구역(④)으로 내려간다", essential: true, why: "beat 3", status: "kept", by: "Series.at linear interpolation of RK4 orbit" },
    { id: "b4", cat: "T", text: "한 바퀴 돌아 처음 자리로 돌아오고 반복한다", essential: true, why: "beat 4", status: "kept", by: "Loop span = 주기, loop repeats (once 생략)" },
    { id: "q1", cat: "Q", text: "궤도와 평형선(c/d≈32.3, a/b≈19.6 천 마리)은 LV 수치해", essential: true, why: "그림 수치의 근거", status: "kept", by: "api.ode fixed-step RK4; cartesian Axis units" },
    { id: "p1", cat: "S", text: "고리 위를 계속 흐르는 입자 + 평형선이 나눈 구역마다 정리 문장", essential: true, why: "principle", status: "kept", by: "dot marks along Series; label marks at data points; line dash" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
