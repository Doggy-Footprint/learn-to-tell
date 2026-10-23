// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, line, rect, label, dot, circle, sweep } = api;
  /** @type {{ a: import("ltt").P; b: import("ltt").P; c: number }[]} */
  const WALLS = [
    { a: [0, 0], b: [12, 0], c: 1 }, { a: [12, 0], b: [12, 8], c: 1 }, { a: [12, 8], b: [0, 8], c: 1 }, { a: [0, 8], b: [0, 0], c: 1 },
    { a: [4, 0], b: [4, 3.2], c: 1 }, { a: [4, 4.4], b: [4, 8], c: 1 },
    { a: [8, 0], b: [8, 2.6], c: 0 }, { a: [8, 3.6], b: [8, 8], c: 0 },
    { a: [8, 4.5], b: [12, 4.5], c: 0 }, { a: [0, 4.5], b: [2.4, 4.5], c: 0 }, { a: [3.2, 4.5], b: [4, 4.5], c: 0 },
  ];
  const ROOMS = [{ n: "침실 1", x: 2, y: 2.2 }, { n: "거실", x: 6, y: 5.8 }, { n: "주방", x: 6, y: 1.4 }, { n: "침실 2", x: 10, y: 2.2 }, { n: "서재", x: 10, y: 6.3 }, { n: "현관", x: 2, y: 6.3 }];
  /** @param {import("ltt").P} a @param {import("ltt").P} b @param {import("ltt").P} c */
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  /** @param {import("ltt").P} p @param {import("ltt").P} q @param {typeof WALLS[number]} w */
  const cross = (p, q, w) => { return d(p, q, w.a) * d(p, q, w.b) < 0 && d(w.a, w.b, p) * d(w.a, w.b, q) < 0; };
  const FAR = /** @type {import("ltt").P} */ ([10, 2.2]);
  // floor plan y is svg-down in the original; data y here is the same metre value (frame flips nothing essential)
  const wifi = model({ x: 1.5, y: 6.5 }, ({ x, y }) => {
    /** @param {import("ltt").P} p */
    const rssi = (p) => { const dist = Math.max(1, Math.hypot(p[0] - x, p[1] - y)); let loss = 0; WALLS.forEach((w) => { if (cross([x, y], p, w)) loss += w.c ? 12 : 4; }); return -40 - 30 * Math.log10(dist) - loss; };
    const cells = []; for (let cx = 0.25; cx < 12; cx += 0.5) for (let cy = 0.25; cy < 8; cy += 0.5) cells.push({ p: /** @type {import("ltt").P} */ ([cx, cy]), v: rssi([cx, cy]) });
    return { cells, far: rssi(FAR) };
  }, "2.4 GHz 실내 경로 손실: 1 m −40 dBm, 지수 3, 콘크리트 12 dB·석고 4 dB (ITU-R P.1238 범위)");
  /** @param {number} v @returns {import("ltt").Tone} */
  const tone = (v) => (v >= -60 ? "good" : v >= -70 ? "warn" : "bad");
  return {
    models: { wifi },
    figures: {
      s27: figure(cartesian({ x: [0, 12, "m"], y: [0, 8, "m"], aspect: "equal", loop: { ms: 5000, span: [0, 1] } }), (m, t, { params }) => {
        const scanX = t < 0.85 ? (t / 0.85) * 13 - 0.5 : -1;
        return [
          m.wifi.cells.map((/** @type {{ p: import("ltt").P; v: number }} */ c, /** @type {number} */ i) => {
            const d = scanX < 0 ? 99 : Math.abs(c.p[0] - scanX);
            const o = scanX < 0 ? 0.5 : (c.p[0] <= scanX ? 0.5 : 0.08) + (d < 0.8 ? 0.35 * (1 - d / 0.8) : 0);
            return rect([c.p[0] - 0.24, c.p[1] - 0.24], [c.p[0] + 0.24, c.p[1] + 0.24], { id: `cell${i}`, tone: tone(c.v), fill: "solid", opacity: o });
          }),
          WALLS.map((w, i) => line([w.a, w.b], { id: `wall${i}`, weight: w.c ? "bold" : "thin" })),
          ROOMS.map((r) => label([r.x, r.y], r.n)),
          scanX >= 0 && sweep("x", scanX, { id: "scan", tone: "focus", width: 0.6 }),
          circle([Number(params.x), Number(params.y)], 0.3, { id: "router", tone: "focus", fill: "solid", label: "공유기" }),
          dot([FAR[0], FAR[1] + 0.37], { id: "far" }),
          label([FAR[0], FAR[1] + 0.77], (o) => `${o.wifi.far.toFixed(0)} dBm`, { id: "readout" }),
          label([12, 8], "굵은 벽 콘크리트 · 가는 벽 석고 · 12m × 8m", { anchor: "sw", size: "s" }),
        ];
      }),
    },
    scenes: [{
      type: "explore", title: "공유기를 옮기면 신호 지도가 벽을 따라 다시 그려진다", say: "벽마다 감쇠만큼 깎인다. 훑는 띠가 지나간 칸이 그 자리의 신호 세기다.",
      figure: "s27", focus: ["scan", "router"], knobs: { x: [0.5, 11.5, 0.5], y: [0.5, 7.5, 0.5] },
      handles: [{ mark: "router", x: "x", y: "y" }],
      goal: { say: "침실 2에서 −67 dBm 이상이 나오는 자리를 찾는다", done: (m) => m.wifi.far >= -67 },
    }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s27", src: "s27-wifi-router-floorplan.html", corpus: "shot", domain: "무선 · 평면도 위 공유기 위치와 Wi-Fi 신호 세기",
  props: [
    { id: "b1", cat: "T", text: "세로 띠가 신호 지도 왼쪽을 훑으며 밝힌다", essential: true, why: "beat 1", status: "kept", by: "sweep('x', at, {width}); opacity per t" },
    { id: "b2", cat: "T", text: "띠가 가운데 벽을 넘어가며 색이 바뀌는 칸을 차례로 비춘다", essential: true, why: "beat 2", status: "kept", by: "Loop span maps linearly onto ms; draw sampled over time" },
    { id: "b3", cat: "T", text: "띠가 오른쪽 끝 약한 구역까지 훑는다", essential: true, why: "beat 3", status: "kept", by: "sweep at model x" },
    { id: "b4", cat: "T", text: "띠가 사라지고 전체 신호 지도가 머문다", essential: true, why: "beat 4", status: "kept", by: "conditional mark (false omitted)" },
    { id: "q1", cat: "Q", text: "칸 색 = RSSI 3단계(−60/−70 dBm 경계), 경로 손실 식과 벽 감쇠, 12×8 m 같은 축척", essential: true, why: "히트맵 의미", status: "approx", diff: "tone good/warn/bad의 실제 색은 runtime이 정하고 범례 문구(-60 이상 좋음 등)를 legend 없이 생략했다" },
    { id: "i1", cat: "I", text: "공유기를 0.5 m 격자로 끌면 지도와 침실 2 값이 다시 계산된다", essential: true, why: "장면 조작", status: "kept", by: "Explore.handles: Dragging a handle mark sets params x, y, clamped; knobs step" },
    { id: "p1", cat: "E", text: "정적 히트맵 위를 띠 하나로 훑어 어디까지 닿나를 읽는 순서", essential: true, why: "principle", status: "kept", by: "sweep over rect cells" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
