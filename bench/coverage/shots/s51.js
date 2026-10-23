// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, dot, line, label, rng } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const p = (x, y) => [x, 500 - y];
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const ROWS = 12, BALLS = 160;
  const board = model(
    { seed: 7 },
    (q) => {
      const r = rng(Number(q.seed));
      const paths = Array.from({ length: BALLS }, () => Array.from({ length: ROWS }, () => (r() < 0.5 ? 0 : 1)));
      const land = paths.map((pp) => pp.reduce((/** @type {number} */ a, b) => a + b, 0));
      /** @type {number[]} */
      const seen = new Array(ROWS + 1).fill(0);
      /** @param {number} n @param {number} k */
      const choose = (n, k) => { let v = 1; for (let i = 1; i <= k; i++) v = (v * (n - k + i)) / i; return v; };
      return { paths, land, slot: land.map((b) => seen[b]++), pCenter: choose(ROWS, 6) / 2 ** ROWS };
    },
    "이항분포 B(12, 1/2), P(6) = 924/4096; 공 160개는 고정 시드 모의 실험",
  );
  const W = 620, cx = 310, dx = 40, dy = 22, top = 40, br = 5, binTop = top + ROWS * dy + 24, floor = 470;
  const SPAWN = 0.028, FALL = 0.075, per = 4, step = 2 * br + 1, TOTAL = BALLS * SPAWN + ROWS * FALL + 0.6;
  const fig = figure(
    cartesian({ x: [0, W, ""], y: [0, 500, ""], aspect: "equal", loop: { ms: 9500, span: [0, 9.5] } }),
    (m, t) => {
      /** @type {number[][]} */
      const paths = m.board.paths;
      let landed = 0;
      const balls = paths.map((pp, i) => {
        const lt = t - i * SPAWN;
        if (lt < 0 || t > TOTAL + 1.2) return null;
        const q = lt / FALL;
        if (q < ROWS) {
          const k = Math.floor(q), f = q - k;
          /** @type {import("ltt").P[]} */
          const trail = [];
          let s = 0;
          for (let j = 0; j <= k; j++) { trail.push(p(cx + (s - j / 2) * dx, top + j * dy)); if (j < k) s += pp[j]; }
          const x0 = cx + (s - k / 2) * dx, x1 = x0 + (pp[k] - 0.5) * dx;
          const head = p(x0 + (x1 - x0) * ease(f), top + k * dy + f * dy - 2 * Math.sin(Math.PI * f) * 6);
          return [line([...trail, head], { id: `trail-${i}`, tone: "series1", weight: "thin", opacity: 0.35 }), dot(head, { id: `ball-${i}`, tone: "series1", size: "s" })];
        }
        const b = m.board.land[i], n = m.board.slot[i], yEnd = floor - br - 1 - Math.floor(n / per) * step;
        const drop = clamp((q - ROWS) / 3), y0 = top + ROWS * dy;
        if (drop >= 1) landed++;
        return dot(p(cx + (b - ROWS / 2) * dx + ((n % per) - 1) * step, y0 + (yEnd - y0) * drop * drop), { id: `ball-${i}`, tone: "series1", size: "s" });
      });
      const show = clamp((t - TOTAL + 0.4) / 0.6);
      const curve = Array.from({ length: 121 }, (_, i) => {
        const k = i / 10, g = Math.exp(-((k - 6) ** 2) / 6) / Math.sqrt(6 * Math.PI);
        return p(cx + (k - ROWS / 2) * dx, floor - ((g * BALLS) / per) * step);
      });
      return [
        line([p(cx - 30, 6), p(cx - 8, 28)], { id: "funnel-l" }),
        line([p(cx + 30, 6), p(cx + 8, 28)], { id: "funnel-r" }),
        Array.from({ length: ROWS }, (_, r) => Array.from({ length: r + 1 }, (_, j) => dot(p(cx + (j - r / 2) * dx, top + r * dy + 10), { id: `peg-${r}-${j}`, tone: "muted", size: "s" }))),
        Array.from({ length: ROWS + 2 }, (_, b) => line([p(cx + (b - 0.5 - ROWS / 2) * dx, binTop), p(cx + (b - 0.5 - ROWS / 2) * dx, floor)], { id: `wall-${b}`, tone: "muted" })),
        line([p(cx - (ROWS / 2 + 0.5) * dx, floor), p(cx + (ROWS / 2 + 0.5) * dx, floor)], { id: "floor", weight: "bold" }),
        Array.from({ length: ROWS + 1 }, (_, b) => label(p(cx + (b - ROWS / 2) * dx, floor + 20), String(b), { id: `bin-${b}`, tone: "muted", size: "s" })),
        balls,
        line(curve, { id: "normal", tone: "focus", dash: true, weight: "bold", opacity: show }),
        label(p(cx + 3.2 * dx, floor - 120), "정규분포 곡선", { id: "normal-l", anchor: "w", tone: "focus", opacity: show }),
        label(p(24, 40), `떨어진 공 ${landed} / ${BALLS}`, { id: "count", anchor: "w" }),
      ];
    },
  );
  return {
    models: { board },
    figures: { galton: fig },
    scenes: [{
      type: "predict", title: "못 12줄을 지난 공은 가운데에 얼마나 모일까", ask: "공이 가운데 칸(6번)에 들어갈 확률은?", figure: "galton", focus: ["bin-6"],
      input: { kind: "choice", options: [{ text: "약 8%", feedback: "가운데 칸이 가장 많이 모인다." }, { text: "약 23%", correct: true }, { text: "약 50%", feedback: "가장 많이 모여도 넷 중 하나가 안 된다." }] },
      reveal: { say: (m) => `₁₂C₆ = 924, 2¹² = 4,096이라 ${(m.board.pCenter * 100).toFixed(1)}%다.`, marks: ["normal"] },
    }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s51", src: "s51-galton-board.html", corpus: "shot", domain: "물리 · 갈톤 보드와 정규분포",
  props: [
    { id: "b1", cat: "T", text: "0–1.5s 공이 하나씩 못판을 튀며 내려와 좌우로 갈라진 궤적을 남긴다", essential: true, why: "beat", status: "kept", by: "loop span [0,9.5] s; 공마다 고정 경로(Api.rng 시드)로 dot 위치와 지나온 line trail을 t로 계산" },
    { id: "b2", cat: "Q", text: "1.5–5s 공이 계속 흘러 아래 칸에 쌓이고 가운데 칸이 가장 높아진다", essential: true, why: "beat", status: "kept", by: "칸별 slot 순서로 4개씩 쌓는 dot 좌표(aspect equal)" },
    { id: "b3", cat: "T", text: "6–7.5s 다 쌓인 더미 위에 이론 곡선이 겹쳐 오른다", essential: true, why: "beat", status: "approx", by: "line opacity를 t로", diff: "원본도 투명도로 나타나므로 '오른다'는 선이 아래에서 자라는 동작이 아니라 페이드로만 보인다." },
    { id: "pr", cat: "T", text: "개별 무작위 경로 → 쌓인 결과로 분포 → 이론 곡선은 마지막에", essential: true, why: "principle", status: "kept", by: "같은 loop 안 시간 순서(공 투하 → 착지 → TOTAL 뒤 곡선), \"Later marks paint on top\"" },
    { id: "q1", cat: "Q", text: "곡선 높이 = 160 × N(6, 3) 밀도를 같은 쌓기 축척으로", essential: true, why: "더미와 곡선 비교", status: "kept", by: "Api.model src, 곡선과 공이 같은 data 좌표" },
    { id: "q2", cat: "Q", text: "원본과 같은 공 160개 표본(Lehmer 시드 7)", essential: false, why: "재현성", status: "approx", diff: "Api.rng는 mulberry32라 칸별 개수가 원본과 다르다." },
  ],
  verdict: "V", custom: [], candidates: [],
}];
