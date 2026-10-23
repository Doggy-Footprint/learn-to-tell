// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, dot, line, label, split, multiples } = api;
  const OFF = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5], NOISE = [4, -6, 2, -3, 5, -2, 3];
  const GROUPS = [{ l: "20대", cx: 2, b: 180 }, { l: "40대", cx: 4, b: 205 }, { l: "60대", cx: 6, b: 230 }].map((g, gi) => ({
    ...g, pts: OFF.map((o, i) => /** @type {import("ltt").P} */ ([g.cx + o, g.b - 6 * o + NOISE[(i + gi * 2) % 7]])) }));
  /** @param {import("ltt").P[]} pts */
  const fit = (pts) => {
    const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
    const sxy = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0), sxx = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
    return { m: sxy / sxx, b: my - (sxy / sxx) * mx };
  };
  const simpson = model({ g: 0 }, ({ g }) => {
    const grp = GROUPS[g];
    return { pooled: fit(GROUPS.flatMap((x) => x.pts)), all: GROUPS.flatMap((x) => x.pts), grp, gfit: fit(grp.pts) };
  }, { illustrative: true });
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** @param {number} u @param {number} a @param {number} b */
  const seg = (u, a, b) => clamp((u - a) / (b - a));
  const frame = () => cartesian({ x: [0, 8, "h/주"], y: [150, 260, "mg/dL"], loop: { ms: 8000, span: [0, 1] } });
  /** @param {{ m: number; b: number }} f @param {[number, number]} xs @returns {import("ltt").P[]} */
  const fl = (f, xs) => xs.map((x) => /** @type {import("ltt").P} */ ([x, f.m * x + f.b]));
  /** @param {number} m */
  const slope = (m) => `기울기 ${m > 0 ? "+" : "−"}${Math.abs(m).toFixed(1)}`;
  return {
    models: { simpson },
    figures: {
      pooled: figure(frame(), (m, u) => [
        axis("x", { label: "주당 운동 시간", ticks: [0, 4, 8] }),
        axis("y", { label: "LDL 콜레스테롤", ticks: [160, 200, 240] }),
        label([0, 258], "세 나이대를 합친 21명", { anchor: "w" }),
        m.simpson.all.map((/** @type {import("ltt").P} */ p) => dot(p, { tone: "muted", size: "s" })),
        line(fl(m.simpson.pooled, [0.3, 7.7]), { id: "pooled-fit", tone: "bad", weight: "bold", reveal: seg(u, 0.04, 0.3) * (1 - seg(u, 0.9, 0.98)), label: slope(m.simpson.pooled.m) }),
      ]),
      group: figure(frame(), (m, u, { params }) => {
        const g = Number(params.g), grp = m.simpson.grp;
        const tone = /** @type {const} */ (["series1", "series2", "series3"])[g];
        return [
          axis("x", { ticks: [0, 4, 8] }),
          axis("y", { ticks: [160, 200, 240] }),
          label([0, 258], grp.l, { anchor: "w" }),
          grp.pts.map((/** @type {import("ltt").P} */ p) => dot(p, { tone, size: "s" })),
          line(fl(m.simpson.gfit, [grp.cx - 1.8, grp.cx + 1.8]), { id: "group-fit", tone, weight: "bold", reveal: seg(u, 0.34 + g * 0.1, 0.52 + g * 0.1) * (1 - seg(u, 0.9, 0.98)), label: slope(m.simpson.gfit.m) }),
        ];
      }),
      groups: multiples("group", { over: { g: [0, 1, 2] } }),
      both: split(["pooled", "groups"]),
    },
    scenes: [{ type: "explain", title: "합치면 오르는 선이, 나누면 셋 다 내려간다", say: "같은 21명의 점이다. 교란 변수인 나이를 칸으로 나누면 심슨의 역설이 드러난다.", figure: "both", focus: ["pooled-fit", "group-fit"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s14", src: "archive/v1:site/gallery/shots/s14-simpson-paradox-slopes.html", corpus: "shot", domain: "통계 · 심슨의 역설, 집단별 기울기 vs 합친 기울기",
  props: [
    { id: "b1", cat: "T", text: "0–2s 합친 산점도 위 오르는 선(+7.3)이 왼쪽부터 그려진다", essential: true, why: "beat", status: "kept", by: "MarkOpts.reveal 'Drawn fraction 0–1, by arc length from the path start'" },
    { id: "b2", cat: "T", text: "3–4s 오른쪽 첫 칸에 같은 점들로 내려가는 선", essential: true, why: "beat", status: "kept", by: "multiples copy마다 params.g가 다르고 reveal 구간을 g로 늦춤('one copy per value')" },
    { id: "b3", cat: "T", text: "4–5s 둘째·셋째 칸이 차례로 이어진다", essential: true, why: "beat", status: "kept", by: "같은 g 지연" },
    { id: "b4", cat: "Q", text: "6–7s 오르는 선 하나와 내려가는 선 셋이 나란히 멈춘다(최소제곱 기울기)", essential: true, why: "beat; 부호 반전이 결론", status: "kept", by: "api.model이 fit 계산, line 끝점이 데이터 단위" },
    { id: "p1", cat: "S", text: "같은 점을 합친 칸과 나이대별 칸으로, 칸마다 축 범위 같게", essential: true, why: "principle", status: "ambiguous", diff: "multiples는 'sharing frame, axes'라 세 칸끼리는 같지만, split 안에 multiples를 넣을 수 있는지와 split 양쪽 축 범위가 같은 값으로 그려지는지(같은 축척)는 d.ts가 말하지 않는다" },
    { id: "p2", cat: "T", text: "선을 하나씩 순서대로 그린다", essential: true, why: "principle", status: "kept", by: "reveal + split 'Both share t'" },
    { id: "e1", cat: "E", text: "합친 칸은 점을 무채색으로, 집단 칸은 집단 색+표식 모양으로", essential: false, why: "부호 대비 보조", status: "approx", diff: "집단별 표식 모양(원·사각·마름모)은 glyph 이름이 정의되지 않아 색으로만 구분" },
  ],
  verdict: "G", custom: [], candidates: ["split-shared-scale"],
}];
