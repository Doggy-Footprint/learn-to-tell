// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, circle, path, arrow, line, label } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const p = (x, y) => [x, 520 - y];
  const SYN = 29.53;
  const NAMES = /** @type {[number, string][]} */ ([[0.03, "삭"], [0.22, "초승달"], [0.28, "상현"], [0.47, "차가는 볼록달"], [0.53, "보름"], [0.72, "기우는 볼록달"], [0.78, "하현"], [0.97, "그믐달"], [1.01, "삭"]]);
  const moon = model({ syn: SYN }, (q) => ({ syn: Number(q.syn), lit: (/** @type {number} */ th) => (1 - Math.cos(th)) / 2 }), "삭망월 29.53일; 밝은 비율 (1 − cos θ)/2, θ = 태양–지구–달 이각(0 = 삭)");
  const ex = 300, ey = 260, R = 190, mcx = 800, mcy = 250, MR = 140;
  /** @param {number} th @returns {import("ltt").PathCmd[]} */
  const litPath = (th) => {
    const c = Math.cos(th), rx = Math.abs(c) * MR, wax = Math.sin(th) >= 0, top = 520 - (mcy - MR), bot = 520 - (mcy + MR);
    return wax
      ? [["M", mcx, top], ["A", MR, MR, 0, 0, 0, mcx, bot], ["A", rx, MR, 0, 0, c > 0 ? 1 : 0, mcx, top], ["Z"]]
      : [["M", mcx, top], ["A", MR, MR, 0, 0, 1, mcx, bot], ["A", rx, MR, 0, 0, c > 0 ? 0 : 1, mcx, top], ["Z"]];
  };
  /** @type {[number, number][]} */
  const warp = [[0, 0]];
  for (let k = 0; k < 4; k++) warp.push([(k * SYN) / 4, (k + 0.12) / 4], [((k + 1) * SYN) / 4, (k + 0.88) / 4]);
  warp.push([SYN, 1]);
  const phase = figure(
    cartesian({ x: [0, 1040, ""], y: [0, 520, ""], aspect: "equal", loop: { ms: 10000, span: [0, SYN], warp } }),
    (m, d) => {
      const u = d / m.moon.syn, th = 2 * Math.PI * u, mx = ex + R * Math.cos(th), my = ey - R * Math.sin(th);
      const name = (NAMES.find((n) => u < n[0]) || NAMES[0])[1];
      return [
        [0, 1, 2, 3, 4].map((i) => arrow(p(590, 90 + i * 85), p(545, 90 + i * 85), { id: `sun-${i}`, tone: "warn" })),
        label(p(590, 60), "← 햇빛", { id: "sun-l", anchor: "e", tone: "warn", weight: "bold" }),
        circle(p(ex, ey), R, { id: "orbit", tone: "muted", fill: "none" }),
        circle(p(ex, ey), 30, { id: "earth", fill: "soft", tone: "ref" }),
        path([["M", ex, 520 - (ey - 30)], ["A", 30, 30, 0, 0, 1, ex, 520 - (ey + 30)], ["Z"]], { id: "earth-night", fill: "solid", tone: "muted", opacity: 0.55 }),
        label(p(ex, ey + 56), "지구", { id: "earth-l" }),
        label(p(ex, 36), "북쪽 위에서 본 공전 궤도", { id: "orbit-l", tone: "muted" }),
        line([p(ex, ey), p(mx, my)], { id: "sight", tone: "focus", dash: true, weight: "thin" }),
        circle(p(mx, my), 18, { id: "moon-dark", fill: "solid", tone: "muted" }),
        path([["M", mx, 520 - (my - 18)], ["A", 18, 18, 0, 0, 0, mx, 520 - (my + 18)], ["Z"]], { id: "moon-day", fill: "solid", tone: "ref" }),
        label(p(ex + (R + 44) * Math.cos(th), ey - (R + 44) * Math.sin(th)), `${Math.round((th * 180) / Math.PI)}°`, { id: "ang", tone: "focus", weight: "bold" }),
        label(p(mcx, 52), "지구에서 올려다본 달", { id: "disk-l", tone: "muted" }),
        circle(p(mcx, mcy), MR, { id: "disk", fill: "solid", tone: "muted" }),
        path(litPath(th), { id: "lit", fill: "solid", tone: "ref" }),
        label(p(mcx, mcy + MR + 48), name, { id: "name", weight: "bold", size: "l" }),
        label(p(mcx, mcy + MR + 76), `${d.toFixed(1)}일째 · 밝은 면 ${Math.round(m.moon.lit(th) * 100)}%`, { id: "day" }),
        label(p(1030, 505), "궤도 크기와 달 크기는 축척이 아니다", { id: "noscale", anchor: "ne", tone: "muted", size: "s" }),
      ];
    },
  );
  return { models: { moon }, figures: { phase } };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s50", src: "s50-moon-phase-orbit.html", corpus: "shot", domain: "천문 · 공전 위치에 따른 달의 위상",
  props: [
    { id: "b1", cat: "T", text: "0–2.5s 왼쪽 궤도에서 점이 돌기 시작하고 오른쪽 원판에 가는 밝은 면이 생긴다", essential: true, why: "beat", status: "kept", by: "loop span [0,29.53] 일 단위; 궤도 위 circle 위치와 lit path를 같은 t에서 계산" },
    { id: "b2", cat: "G", text: "2.5–3s 4분의 1을 돌자 경계선이 곧게 펴져 반이 밝아진다", essential: true, why: "beat", status: "kept", by: "PathCmd \"A\" rx = |cos θ|·r (θ=90°에서 0), warp로 머묾" },
    { id: "b3", cat: "G", text: "3–5.5s 반대편에 닿으며 경계선이 휘어 원판 전체가 밝아진다", essential: true, why: "beat", status: "kept", by: "PathCmd \"A\" sweep 1 = counterclockwise in data coordinates로 두 호의 방향 지정" },
    { id: "b4", cat: "G", text: "5.5–8s 밝은 면이 반대쪽부터 줄어 다시 반이 된다", essential: true, why: "beat", status: "kept", by: "sin θ < 0에서 왼쪽 반원 경로(차는 달 오른쪽 밝음, 북반구)" },
    { id: "pr", cat: "S", text: "원인(위에서 본 배치)과 결과(관찰자가 본 모양)를 나란히 두고 같은 시계로 움직인다", essential: true, why: "principle", status: "kept", by: "한 figure draw가 같은 t로 두 그림을 그린다" },
    { id: "t1", cat: "T", text: "위상 이름이 바뀌는 0·90·180·270°에서 잠깐 머문다", essential: false, why: "원본 dwell", status: "kept", by: "Loop.warp \"repeated modelT holds; slower parts are marked slow-motion\"" },
    { id: "x1", cat: "X", text: "축척이 아니라는 표시", essential: false, why: "v1 원칙", status: "kept", by: "Api.label" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
