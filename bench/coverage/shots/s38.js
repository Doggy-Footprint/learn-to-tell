// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, circle, line, dot, label, axis, grid, rect, sweep, split } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  /** @param {number} m */
  const price = (m) => (m <= 1000 ? 4200 * (1 - (0.024 * m) / 100) : 4200 * (1 - 0.24) * (1 - (0.006 * (m - 1000)) / 100));
  /** @param {number} t seconds in the 7 s loop */
  const radius = (t) => {
    const u = t / 7;
    const k = u < 0.7 ? ease(u / 0.7) : u < 0.85 ? 1 : 1 - ease((u - 0.85) / 0.15);
    return 100 + 1400 * k;
  };
  const band = model({ d: 300 }, ({ d }) => ({ d, p: price(d), drop: Math.round((1 - price(d) / 4200) * 100) }), { illustrative: true });
  const loop = { ms: 7000, span: /** @type {[number, number]} */ ([0, 7]) };
  const figures = {
    map: figure(
      cartesian({ x: [-1700, 1700, "m"], y: [-1700, 1700, "m"], aspect: "equal", loop }),
      (m, t) => {
        const dm = radius(t);
        return [
          [400, 800, 1200, 1600].map((r) => [circle(pt(0, 0), r, { id: `ring-${r}`, tone: "muted", fill: "none", weight: "thin" }), label(pt(r * 0.707, r * 0.707), `${r}m`, { id: `ring-l-${r}`, tone: "muted", anchor: "sw" })]),
          line([pt(-1700, 0), pt(1700, 0)], { id: "rail", weight: "bold" }),
          line([pt(0, -1700), pt(0, 1700)], { id: "road", tone: "muted" }),
          circle(pt(0, 0), dm, { id: "radius", tone: "focus", fill: "soft" }),
          dot(pt(0, 0), { id: "station", label: "선릉역" }),
        ];
      },
    ),
    chart: figure(
      cartesian({ x: [0, 1600, "m"], y: [2800, 4400, "만원/3.3㎡"], loop }),
      (m, t) => {
        const dm = radius(t), p = price(dm);
        return [
          axis("x", { label: "역에서 거리", ticks: [0, 400, 800, 1200, 1600] }),
          axis("y", { label: "3.3㎡당 가격(만원)", ticks: [3000, 3500, 4000] }),
          grid({ y: [3000, 3500, 4000] }),
          rect(pt(0, 2800), pt(dm, 4400), { id: "band", tone: "focus", fill: "soft" }),
          line(Array.from({ length: 81 }, (_, i) => pt(i * 20, price(i * 20))), { id: "price", weight: "bold" }),
          sweep("x", 1000, { id: "knee", tone: "muted", label: "1km 뒤 완만" }),
          sweep("x", dm, { id: "edge", tone: "focus" }),
          dot(pt(dm, p), { id: "now", tone: "focus" }),
          label(pt(dm, p + 160), `${Math.round(p).toLocaleString()}만원 · 역 앞보다 ${Math.round((1 - p / 4200) * 100)}% 낮음`, { id: "val", anchor: dm > 1100 ? "se" : "sw" }),
        ];
      },
    ),
    both: split(["map", "chart"], { link: "d" }),
  };
  return {
    models: { band },
    figures,
    scenes: [{ type: "explore", title: "역에서 1km까지는 100m마다 가격이 약 2.4%씩 빠진다", say: "왼쪽 원은 지도 위 반경, 오른쪽 띠는 그 반경 안의 가격.", figure: "both", focus: ["radius", "band", "now"], knobs: { d: [100, 1500, 50] }, goal: { say: "역 앞보다 10% 이상 싸지는 첫 반경을 찾는다", done: (o) => o.band.p <= 4200 * 0.9 && price(o.band.d - 50) > 4200 * 0.9 } }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s38", src: "s38-station-radius.html", corpus: "shot", domain: "부동산 · 역에서의 거리 반경과 가격 띠",
  props: [
    { id: "b1", cat: "T", text: "0–2s 지도 반경 원이 작게 시작하고 차트 강조 띠가 왼쪽 끝에 있다", essential: true, why: "beat", status: "kept", by: "Loop{ms:7000,span:[0,7]}; radius(t)를 두 draw가 같은 식으로 계산" },
    { id: "b2", cat: "G", text: "2–4s 원이 넓어지는 만큼 차트의 띠·점·라벨이 오른쪽으로 훑는다", essential: true, why: "beat", status: "kept", by: "split: 'Both share t'; 같은 m 단위로 circle 반지름과 rect·sweep x를 둔다" },
    { id: "b3", cat: "T", text: "5–6s 원이 가장 넓은 상태로 멈추고 점은 완만한 구간 끝에 머문다", essential: true, why: "beat", status: "kept", by: "draw의 radius(t) 유지 구간(0.7–0.85)" },
    { id: "p1", cat: "E", text: "변수 하나를 두 표현에 같은 강조로 동시에 건다", essential: true, why: "principle", status: "kept", by: "Tone 'focus' 양쪽 + split 'Both share t' + link 'param … highlighted in both'" },
    { id: "q1", cat: "Q", text: "가격 모델 4200만원, 1km까지 100m당 2.4%, 이후 0.6%", essential: true, why: "결론 제목", status: "kept", by: "line 데이터 단위, y Axis 단위" },
    { id: "i1", cat: "I", text: "손잡이로 반경을 옮기면 자동 훑기가 멈추고 손잡이 값으로 그린다", essential: false, why: "원본 조작", status: "ambiguous", diff: "draw가 t로 반경을 정해 knob d는 그림에 반영되지 않는다; d.ts는 knob 조작이 loop를 멈추는지, t와 param 중 무엇이 우선인지 말하지 않는다" },
  ],
  verdict: "V", custom: [], candidates: ["loop-until-touch"],
}];
