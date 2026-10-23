// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, rect, label, arrow, path, line } = api;
  const W = 860, H = 560, PW = 360, PH = 220;
  /** svg-style y-down coordinates mapped to y-up data */
  /** @type {(x: number, y: number) => import("ltt").P} */
  const pt = (x, y) => [x, H - y];
  const POS = [[30, 40], [470, 40], [470, 300], [30, 300]];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  /** @param {number} i */
  const zoomOf = (i) => { const [x, y] = POS[i], pad = 26, w = PW + pad * 2, h = (w * H) / W; return [x - pad, y + PH / 2 - h / 2, w, h]; };
  const full = [0, 0, W, H];
  const keys = [full, zoomOf(0), zoomOf(1), zoomOf(2), zoomOf(3), full];
  /** @param {number} u */
  const view = (u) => {
    const seg = keys.length - 1, k = Math.min(seg - 1, Math.floor(u * seg)), f = u * seg - k, t = f < 0.55 ? 0 : ease((f - 0.55) / 0.45);
    const v = keys[k].map((a, j) => a + (keys[k + 1][j] - a) * t);
    return { v, focus: t > 0.5 ? k : k - 1 };
  };
  /** @param {number} i @param {number} op */
  const panel = (i, op) => {
    const [ox, oy] = POS[i];
    /** @type {(x: number, y: number) => import("ltt").P} */
    const q = (x, y) => pt(ox + x, oy + y);
    const o = { opacity: op };
    const title = ["북극 기온이 오른다", "9월 해빙이 줄어든다", "반사율(알베도)이 떨어진다", "바다가 햇빛을 더 흡수한다"][i];
    return [
      rect(q(0, PH), q(PW, 0), { id: `panel-${i}`, fill: "soft", tone: "muted", ...o }),
      label(q(18, 30), ["①", "②", "③", "④"][i], { id: `num-${i}`, tone: "focus", anchor: "w", ...o }),
      label(q(42, 30), title, { id: `title-${i}`, anchor: "w", size: "l", ...o }),
      i === 0 && [
        rect(q(46, 186), q(56, 110), { id: "thermo", tone: "bad", fill: "solid", ...o }),
        /** NASA GISTEMP Arctic (64–90°N) anomaly vs 1951–1980, approx */
        [[1980, 0], [2000, 0.9], [2023, 2.6]].map(([yr, v], k) => [
          rect(q(110 + k * 76, 190), q(154 + k * 76, 190 - (20 + v * 46)), { id: `temp-${yr}`, tone: "bad", fill: "soft", ...o }),
          label(q(132 + k * 76, 184 - (20 + v * 46)), `+${v.toFixed(1)}℃`, { id: `temp-l-${yr}`, ...o }),
          label(q(132 + k * 76, 208), String(yr), { id: `temp-y-${yr}`, tone: "muted", size: "s", ...o }),
        ]),
      ],
      i === 1 && [
        path([["M", ox + 26, H - oy - 125], ["A", 66, 54, 0, 1, 1, ox + 158, H - oy - 125], ["A", 66, 54, 0, 1, 1, ox + 26, H - oy - 125], ["Z"]], { id: "ice-1980", tone: "muted", ...o }),
        path([["M", ox + 42, H - oy - 125], ["A", 50, 40, 0, 1, 1, ox + 142, H - oy - 125], ["A", 50, 40, 0, 1, 1, ox + 42, H - oy - 125], ["Z"]], { id: "ice-2020", tone: "ref", fill: "soft", ...o }),
        label(q(178, 100), "1979–88 평균 약 7.0", { id: "ice-l1", anchor: "w", tone: "muted", ...o }),
        label(q(178, 128), "2014–23 평균 약 4.4", { id: "ice-l2", anchor: "w", weight: "bold", ...o }),
        label(q(178, 154), "백만 km², NSIDC", { id: "ice-src", anchor: "w", size: "s", tone: "muted", ...o }),
      ],
      i === 2 && /** @type {[string, number][]} */ ([["해빙(눈 덮임)", 0.7], ["열린 바다", 0.06]]).map(([n, a], k) => [
        label(q(24, 92 + k * 64), n, { id: `alb-n-${k}`, anchor: "w", ...o }),
        rect(q(130, 102 + k * 64), q(330, 70 + k * 64), { id: `alb-bg-${k}`, fill: "none", tone: "muted", ...o }),
        rect(q(130, 102 + k * 64), q(130 + 200 * a, 70 + k * 64), { id: `alb-${k}`, fill: "solid", tone: k ? "ref" : "muted", ...o }),
        label(q(136 + 200 * a, 92 + k * 64), `${Math.round(a * 100)}% 반사`, { id: `alb-v-${k}`, anchor: "w", ...o }),
      ]),
      i === 3 && [
        rect(q(20, 200), q(340, 150), { id: "sea", tone: "ref", fill: "solid", ...o }),
        [70, 130, 190, 250, 310].map((ax, k) => arrow(q(ax - 30, 52), q(ax, 148), { id: `sun-${k}`, tone: "warn", ...o })),
        label(q(180, 178), "흡수 약 94% → 물이 데워진다", { id: "absorb", ...o }),
      ],
    ];
  };
  return {
    figures: {
      s32: figure(
        cartesian({
          x: [0, W, "px"], y: [0, H, "px"], aspect: "equal", loop: { ms: 10000, span: [0, 1] },
          camera: (m, t) => { const [x, y, w, h] = view(t).v; return { x: [x, x + w], y: [H - y - h, H - y] }; },
        }),
        (m, t) => {
          const { focus } = view(t), overview = focus < 0 || focus > 3, co = overview ? 1 : 0;
          return [
            [0, 1, 2, 3].map((i) => panel(i, overview || focus === i ? 1 : 0.1)),
            arrow(pt(396, 130), pt(462, 130), { id: "c01", tone: "focus", label: "녹는다", opacity: co }),
            arrow(pt(650, 266), pt(650, 294), { id: "c12", tone: "focus", opacity: co }),
            arrow(pt(464, 410), pt(398, 410), { id: "c23", tone: "focus", label: "흡수↑", opacity: co }),
            arrow(pt(210, 294), pt(210, 266), { id: "c30", tone: "focus", opacity: co }),
            label(pt(430, 286), "+ 되먹임: 처음 변화를 키운다", { id: "loop-note", weight: "bold", opacity: co }),
          ];
        },
      ),
    },
    scenes: [{ type: "explain", title: "한 장 정리: 녹을수록 더 녹는 고리", say: "알베도가 0.7에서 0.06으로 떨어지면 같은 햇빛에서 흡수량이 약 3배가 된다(30% → 94%).", figure: "s32", focus: ["c01", "c12", "c23", "c30"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s32", src: "s32-ice-albedo-overview.html", corpus: "shot", domain: "기후 · 얼음-알베도 되먹임 한 장 정리",
  props: [
    { id: "b1", cat: "T", text: "전체 2×2 고리에서 첫 칸으로 확대되고 나머지 칸은 흐려진다", essential: true, why: "beat 1", status: "kept", by: "cartesian camera 'returns the visible data window over time'; per-panel opacity from t" },
    { id: "b2", cat: "T", text: "화살표 방향을 따라 옆 칸으로 옮겨 가 확대된다", essential: true, why: "beat 2", status: "kept", by: "camera keyframes interpolated in data space by t" },
    { id: "b3", cat: "T", text: "고리 순서대로 셋째·넷째 칸을 차례로 확대한다", essential: true, why: "beat 3", status: "kept", by: "camera key order 0→1→2→3 follows arrows" },
    { id: "b4", cat: "T", text: "다시 전체로 축소되어 네 칸과 순환 화살표가 함께 보인다", essential: true, why: "beat 4", status: "kept", by: "last camera key is the full window; connector opacity 1 in overview" },
    { id: "q1", cat: "Q", text: "칸 안 수치: 북극 기온 편차 0/0.9/2.6℃, 해빙 7.0→4.4 백만 km², 알베도 0.7 vs 0.06 막대 길이 비례", essential: true, why: "그림 결론(흡수 3배)의 근거", status: "kept", by: "rect in data units; label text" },
    { id: "p1", cat: "S", text: "전체를 먼저 보인 뒤 확대 순서가 곧 인과 순서가 되게 한다", essential: true, why: "principle", status: "kept", by: "camera function of t; arrow marks with direction" },
  ],
  verdict: "V", custom: [], candidates: ["ellipse"],
}];
