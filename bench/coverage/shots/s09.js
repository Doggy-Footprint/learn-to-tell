// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, model, rect, label, line, dot, axis, grid, split } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const KB = 1024, MB = KB * KB, GB = MB * KB;
  const LV = [{ id: "L1", cap: 32 * KB, ns: 0.8 }, { id: "L2", cap: 1 * MB, ns: 2.8 }, { id: "L3", cap: 32 * MB, ns: 10 }, { id: "DRAM", cap: 64 * GB, ns: 80 }];
  const avgNs = (/** @type {number} */ ws) => { let prev = 0, sum = 0; for (const l of LV) { const f = Math.min(1, l.cap / ws); sum += (f - prev) * l.ns; prev = f; if (f >= 1) break; } return sum; };
  const fit = (/** @type {number} */ ws) => LV.findIndex((l) => ws <= l.cap);
  const fmtB = (/** @type {number} */ b) => (b >= GB ? (b / GB).toFixed(b < 10 * GB ? 1 : 0).replace(/\.0$/, "") + "GB" : b >= MB ? (b / MB).toFixed(b < 10 * MB ? 1 : 0).replace(/\.0$/, "") + "MB" : Math.round(b / KB) + "KB");
  const ease = (/** @type {number} */ x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const mem = model({ ws: 16 * KB }, ({ ws }) => ({ ws, ns: avgNs(ws), level: fit(ws) }),
    "AMD Ryzen 9 7950X 코어 대략값(L1d 32KB·0.8ns, L2 1MB·2.8ns, L3 32MB·10ns, DRAM 80ns, Chips and Cheese 언저리); 무작위 접근·완전 연관 가정");
  // auto: hold 0.9 s inside each level, move 1.3 s (log2 bytes 13.5→18.5→23.5→28.5→back)
  const KEYS = [13.5, 18.5, 23.5, 28.5], HOLD = 0.9, MOVE = 1.3, P = KEYS.length * (HOLD + MOVE);
  const autoE = (/** @type {number} */ t) => { t %= P; const i = Math.floor(t / (HOLD + MOVE)), r = t - i * (HOLD + MOVE), a = KEYS[i], b = KEYS[(i + 1) % KEYS.length]; return r < HOLD ? a : a + (b - a) * ease((r - HOLD) / MOVE); };
  const curve = Array.from({ length: 361 }, (_, i) => p(2 ** (12 + i * 0.05), avgNs(2 ** (12 + i * 0.05))));
  /** left: pyramid, x in log2(bytes) so widths share the graph's log scale */
  const pyramid = (/** @type {(t: number, params: import("ltt").Params) => number} */ wsOf) => (/** @type {import("ltt").Outputs} */ m, /** @type {number} */ t, /** @type {{params: import("ltt").Params}} */ ctx) => {
    const b = wsOf(t, ctx.params), e = Math.log2(b), k = fit(b);
    const half = (/** @type {number} */ x) => 2 + (x - 13) / 2;
    const rows = LV.map((l, i) => {
      const hw = half(Math.log2(l.cap)), y = 3 - i;
      return [
        rect(p(-hw, y), p(hw, y + 0.85), { id: `level-${l.id}`, tone: i === k ? "focus" : "muted", fill: i === k ? "soft" : "none" }),
        label(p(-hw - 0.4, y + 0.42), `${l.id} · ${fmtB(l.cap)} · ${l.ns}ns`, { id: `level-lab-${l.id}`, anchor: "e", tone: i === k ? "focus" : undefined }),
      ];
    });
    const R = Math.max(0, k), y = 3 - R, w = Math.min(half(e), half(Math.log2(LV[R].cap)) - 0.3), h = Math.max(0.22, Math.min(0.72, (60 - (e - 12) * 1.2) / 78 * 0.85));
    return [
      rows,
      rect(p(-w, y + (0.85 - h) / 2), p(w, y + (0.85 + h) / 2), { id: "ws-box", tone: "focus", fill: "soft", weight: "bold", label: fmtB(b) }),
      label(p(0, -0.5), "점선 상자 = 작업 세트(자주 만지는 데이터)", { id: "ws-note", tone: "muted" }),
    ];
  };
  const graph = (/** @type {(t: number, params: import("ltt").Params) => number} */ wsOf) => (/** @type {import("ltt").Outputs} */ m, /** @type {number} */ t, /** @type {{params: import("ltt").Params}} */ ctx) => {
    const b = wsOf(t, ctx.params), ns = avgNs(b);
    return [
      axis("x", { label: "작업 세트 크기(log)", ticks: [4 * KB, 64 * KB, MB, 16 * MB, 256 * MB, GB] }),
      axis("y", { label: "평균 메모리 접근 지연(log) · 모델로 계산한 예시", ticks: [1, 10, 100] }),
      grid({ y: [1, 10, 100] }),
      LV.slice(0, 3).map((l) => line([p(l.cap, 0.5), p(l.cap, 100)], { id: `edge-${l.id}`, dash: true, tone: "muted", label: `${l.id} 끝` })),
      line(curve, { id: "latency", tone: "ref" }),
      line(curve.filter((q) => q[0] <= b).concat([p(b, ns)]), { id: "trail", tone: "focus", weight: "bold" }),
      dot(p(b, ns), { id: "now", tone: "focus", label: `${ns.toFixed(ns < 10 ? 1 : 0)}ns` }),
    ];
  };
  const auto = (/** @type {number} */ t) => 2 ** autoE(t);
  const manual = (/** @type {number} */ _t, /** @type {import("ltt").Params} */ params) => Number(params.ws);
  const loop = { ms: P * 1000, span: /** @type {[number, number]} */ ([0, P]) };
  return {
    models: { mem },
    figures: {
      pyrAuto: figure(cartesian({ x: [-12, 12, "log₂ B"], y: [-1, 4, ""], loop }), pyramid(auto)),
      graphAuto: figure(cartesian({ x: [4 * KB, GB, "B"], y: [0.5, 100, "ns"], log: "xy", loop }), graph(auto)),
      pyrMan: figure(cartesian({ x: [-12, 12, "log₂ B"], y: [-1, 4, ""], static: "작업 세트 상자가 맞는 메모리 층" }), pyramid(manual)),
      graphMan: figure(cartesian({ x: [4 * KB, GB, "B"], y: [0.5, 100, "ns"], log: "xy", static: "작업 세트별 평균 지연 계단 곡선" }), graph(manual)),
      autoFig: split(["pyrAuto", "graphAuto"]),
      manFig: split(["pyrMan", "graphMan"], { link: "ws" }),
    },
    scenes: [
      { type: "explain", title: "작업 세트가 한 층을 넘칠 때마다 접근 지연이 계단을 오른다", say: "작업 세트가 커지면 상자가 넓어지며 아래 층으로 내려간다. 오른쪽 점은 그때의 평균 지연이다.", figure: "autoFig", focus: ["ws-box", "now"] },
      {
        type: "explore", title: "작업 세트를 직접 바꿔 보기", say: "손잡이로 작업 세트를 바꾼다.", figure: "manFig", focus: ["ws-box", "now"],
        knobs: { ws: { range: [4 * KB, GB], log: true } },
        goal: { say: "평균 지연이 40ns를 넘는 작업 세트를 찾는다", done: (m) => m.mem.ns > 40 },
      },
    ],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s09", src: "archive/v1:site/gallery/shots/s09-working-set-hierarchy.html", corpus: "shot", domain: "컴퓨터 구조",
  props: [
    { id: "b1", cat: "G", text: "0–1s 상자가 맨 위 층 안에 있고 점은 지연 곡선 바닥", essential: true, why: "beat 1", status: "kept", by: "ws-box placed in row of fit(ws); dot at (ws, avgNs(ws)) on log-log frame" },
    { id: "b2", cat: "T", text: "1–3s 상자가 커지며 다음 층으로 내려가고 점이 첫 계단을 오른다", essential: true, why: "beat 2", status: "kept", by: "ws from t (hold/move keys) in both halves; split 'Both share t'" },
    { id: "b3", cat: "T", text: "3–5s 상자가 셋째 층에 들고 점이 둘째 계단 위로", essential: true, why: "beat 3", status: "kept", by: "same t-driven ws" },
    { id: "b4", cat: "T", text: "5–8s 맨 아래 층까지 커지고 점이 꼭대기에 닿은 뒤 처음으로 줄어든다", essential: true, why: "beat 4", status: "kept", by: "Loop ms 8800 span [0,8.8] with key 28.5→13.5 move inside span" },
    { id: "pr1", cat: "Q", text: "같은 로그 눈금을 공간 그림과 그래프 두 곳에 쓴다", essential: true, why: "principle", status: "kept", by: "pyramid x in log₂ B data units; graph cartesian log 'xy'" },
    { id: "pr2", cat: "T", text: "한 층을 넘치는 순간이 두 곳에서 함께 보인다", essential: true, why: "principle", status: "kept", by: "split 'Both share t, step, params, knobs'" },
    { id: "i1", cat: "I", text: "작업 세트 log 슬라이더(4KB–1GB)와 40ns 목표", essential: false, why: "role sweep", status: "kept", by: "Explore knobs {range, log: true} + goal.done" },
    { id: "e1", cat: "E", text: "상자는 점선 테두리", essential: false, why: "원본 stroke-dasharray", status: "approx", diff: "rect has no dash; box marked by focus tone, soft fill and bold weight" },
    { id: "i2", cat: "I", text: "손잡이를 잡으면 자동 재생이 멈춘다", essential: false, why: "원본 mount", status: "approx", diff: "auto loop and manual knob are separate scenes/figures instead of one figure switching on grab" },
  ],
  verdict: "V", custom: [], candidates: ["rect-dash"],
}];
