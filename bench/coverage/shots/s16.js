// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, path, line, rect, label, dot, multiples } = api;
  const RAD = Math.PI / 180, LAT = 37.57, DEC = -23.44;
  /** @param {number} t */
  const sun = (t) => {
    const H = 15 * (t - 12) * RAD, f = LAT * RAD, d = DEC * RAD;
    const sa = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H), alt = Math.asin(sa);
    const caz = (sa * Math.sin(f) - Math.sin(d)) / (Math.cos(alt) * Math.cos(f));
    return { alt: alt / RAD, prof: Math.atan(Math.tan(alt) / Math.max(0.05, Math.abs(caz))) };
  };
  const TIMES = [8, 10, 12, 14, 16, 18];
  const day = model({ south: true }, ({ south }) => ({
    cells: TIMES.map((t) => {
      const s = sun(t);
      if (s.alt <= 0 || !south) return { t, lit: s.alt > 0, a: 0, b: 0 };
      const tp = Math.tan(s.prof);
      return { t, lit: true, a: Math.min(5, 0.9 / tp), b: Math.min(5, 2.1 / tp) };
    }),
  }), "태양 고도·방위 구면삼각법, 서울 북위 37.57° 동지 적위 −23.44°, 창 0.9–2.1 m, 방 깊이 5 m");
  const CW = 7.5; // m per cell incl. margin
  return {
    models: { day },
    figures: {
      row: figure(
        cartesian({ x: [0, 6 * CW, "m"], y: [-0.8, 3.6, "m"], aspect: "equal", loop: { ms: 8400, span: [0, 6] } }),
        (m, t, { params }) => {
          const south = params.south !== false;
          const i = Math.floor(t) % 6, f = t - Math.floor(t), j = (i + 1) % 6, mv = Math.max(0, (f - 0.6) / 0.4);
          return [
            m.day.cells.map((/** @type {{ t: number; lit: boolean; a: number; b: number }} */ c, /** @type {number} */ n) => {
              const ox = n * CW + 1, wx = south ? ox : ox + 5, op = n === i ? 1 : n === j ? 0.35 + 0.65 * mv : 0.35;
              return [
                path([["M", ox, 0], ["L", ox + 5, 0], ["M", ox, 0], ["L", ox, 2.6], ["L", ox + 5, 2.6], ["L", ox + 5, 0]], { id: `room-${n}`, opacity: op }),
                line([[wx, 0.9], [wx, 2.1]], { id: `win-${n}`, tone: "focus", dash: true, opacity: op }),
                south && c.b > 0 && path([["M", wx, 2.1], ["L", wx, 0.9], ["L", ox + c.a, 0], ["L", ox + c.b, 0], ["Z"]], { id: `beam-${n}`, tone: "warn", fill: "soft", opacity: op }),
                south && c.b > 0 && line([[ox + c.a, 0], [ox + c.b, 0]], { id: `patch-${n}`, tone: "warn", weight: "bold", opacity: op }),
                !south && c.lit && path([["M", wx, 2.1], ["L", wx, 0.9], ["L", wx - 1.8, 0], ["Z"]], { id: `sky-${n}`, tone: "muted", fill: "soft", opacity: op }),
                c.lit && dot([south ? ox - 0.6 : ox - 0.8, 3], { tone: "warn", fill: south ? "solid" : "none" }),
                label([ox, 3.3], `${c.t}시`, { anchor: "w", opacity: op }),
                label([ox + 5, 3.3], !c.lit ? "해 짐" : south ? `${(c.b - c.a).toFixed(1)} m` : "0 m", { anchor: "e", opacity: op }),
                label([ox + 2.5, -0.5], south ? "창(남) → 안쪽" : "안쪽 ← 창(북)", { size: "s", tone: "muted" }),
              ];
            }),
            rect([i * CW + (j - i) * CW * mv + 0.2, -0.75], [i * CW + (j - i) * CW * mv + CW - 0.2, 3.55], { id: "now", tone: "focus", fill: "none", weight: "bold" }),
          ];
        },
      ),
      rows: multiples("row", { over: { south: [false, true] } }),
    },
    scenes: [{ type: "compare", title: "동짓날 남향 방에는 해가 바닥 깊이 들고, 북향 방에는 하루 내내 들지 않는다", say: "칸 위 숫자는 바닥에 닿은 직사광 폭, 테두리가 훑는 칸이 지금 시각이다.", figure: "row", focus: ["now"], a: { south: false }, b: { south: true }, labels: ["북향 방", "남향 방"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s16", src: "archive/v1:site/gallery/shots/s16-room-daylight.html", corpus: "shot", domain: "건축 · 남향 vs 북향 방의 하루 채광",
  props: [
    { id: "b1", cat: "T", text: "0–1.4s 테두리가 8시 칸을 위아래 두 줄에서 함께 감싸고 남향 칸에만 빛", essential: true, why: "beat", status: "kept", by: "multiples 'sharing frame, axes, t' — 두 줄이 같은 t로 now rect 위치를 계산" },
    { id: "b2", cat: "Q", text: "2.8–4.2s 12시 칸으로 옮겨가고 남향 빛줄기(바닥 폭 m)가 강조", essential: true, why: "beat", status: "kept", by: "api.model 태양 기하 + path 꼭짓점 데이터 단위, aspect equal" },
    { id: "b3", cat: "T", text: "5.6–7s 16시로 훑으며 남향 빛이 다시 짧아진다", essential: true, why: "beat", status: "kept", by: "Loop span [0,6] 선형 사상, draw에서 칸 사이 이동" },
    { id: "b4", cat: "T", text: "7–8.4s 18시 두 줄 모두 빛이 꺼지고 8시로 돌아간다", essential: true, why: "beat", status: "kept", by: "Loop 반복; 모델 alt<=0이면 빛 없음" },
    { id: "p1", cat: "S", text: "대비를 같은 축으로 맞춘 작은 칸 두 줄로 놓는다", essential: true, why: "principle", status: "kept", by: "multiples over south, 'one copy per value, sharing frame, axes'" },
    { id: "p2", cat: "E", text: "훑는 강조가 같은 시점을 두 줄에 동시에 비춘다", essential: true, why: "principle", status: "kept", by: "multiples가 t를 공유하고 now rect가 t의 함수" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
