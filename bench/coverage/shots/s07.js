// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, model, line, rect, label, rng } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const ease = (/** @type {number} */ x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clamp = (/** @type {number} */ x) => Math.max(0, Math.min(1, x));
  const P_SLOW = 0.01, NREQ = 20, SPLIT = 0.6, RUN = 2.8, HOLD = 0.9;
  /** wall seconds into the run phase → simulated ms, log scale 3 ms → 1300 ms */
  const simMs = (/** @type {number} */ u) => 3 * Math.pow(1300 / 3, u);
  const msToRun = (/** @type {number} */ ms) => (Math.log(ms / 3) / Math.log(1300 / 3)) * RUN;
  const fan = model({ fan: "100" }, ({ fan }) => {
    const n = Number(fan), rand = rng(7);
    // normal calls 6–25 ms, slow calls 800–1200 ms
    const reqs = [];
    let start = 0;
    for (let r = 0; r < NREQ; r++) {
      const lat = Array.from({ length: n }, () => (rand() < P_SLOW ? 800 + 400 * rand() : 6 + 19 * rand() * rand()));
      const max = Math.max(...lat), dur = SPLIT + msToRun(max) + HOLD;
      reqs.push({ lat, max, start, dur }); start += dur;
    }
    return { n, reqs, span: start, pSlow: 1 - Math.pow(1 - P_SLOW, n) };
  }, "Dean & Barroso, The Tail at Scale (CACM 2013): 1 − (1 − 0.01)^N; 호출 지연 분포는 모델로 계산한 예시");
  const CX = 120, CY = -235, RX = 905;
  return {
    models: { fan },
    figures: {
      fanout: figure(
        // model time = wall seconds; 20 requests (≤ 4.3 s each) fit in 90 s and wrap by their own span
        cartesian({ x: [0, 1120, ""], y: [-470, 0, ""], aspect: "equal", loop: { ms: 90000, span: [0, 90] } }),
        (m, T) => {
          const F = m.fan, n = F.n, tt = T % F.span;
          const ri = Math.max(0, F.reqs.findIndex((/** @type {{start: number, dur: number}} */ r) => tt < r.start + r.dur));
          const req = F.reqs[ri], t = tt - req.start;
          const split = ease(clamp(t / SPLIT)), ms = t < SPLIT ? 0 : simMs(clamp((t - SPLIT) / RUN)), done = ms >= req.max;
          const x0 = 290, y0 = 64, w = 380, h = 350, cols = Math.ceil(Math.sqrt((n * w) / h)), rows = Math.ceil(n / cols);
          const size = Math.min(w / cols, h / rows, 110), gap = size * 0.2, cs = size - gap;
          const ox = x0 + (w - cols * size) / 2 + gap / 2, oy = y0 + (h - rows * size) / 2 + gap / 2;
          const cells = req.lat.map((/** @type {number} */ lat, /** @type {number} */ i) => {
            const x = ox + (i % cols) * size, yTop = -(oy + Math.floor(i / cols) * size), slow = lat > 100, f = clamp(ms / lat);
            return [
              line([p(CX + 70, CY), p(x, yTop - cs / 2)], { id: `out-${i}`, tone: "muted", weight: "thin", reveal: split, opacity: done ? 0.4 : 1 }),
              rect(p(x, yTop - cs), p(x + cs, yTop), { id: `cell-${i}`, tone: "muted", fill: "soft" }),
              f > 0 && rect(p(x, yTop - cs), p(x + cs, yTop - cs + cs * f), { id: `fill-${i}`, tone: slow ? "bad" : "focus", fill: "solid", opacity: slow ? 1 : 0.55 }),
              cs >= 44 && (f >= 1 || slow) && label(p(x + cs / 2, yTop - cs / 2), `${Math.round(Math.min(lat, ms))}ms`, { id: `cell-lab-${i}` }),
              done && line([p(x + cs, yTop - cs / 2), p(RX - 75, CY)], { id: `back-${i}`, tone: "focus", weight: "thin", opacity: 0.7 }),
            ];
          });
          const respTone = done ? (req.max > 100 ? "bad" : "good") : "muted";
          const tally = F.reqs.slice(0, done ? ri + 1 : ri);
          return [
            rect(p(CX - 70, CY - 34), p(CX + 70, CY + 34), { id: "req", fill: "none", label: "GET /feed · 요청 1개" }),
            rect(p(RX - 75, CY - 34), p(RX + 75, CY + 34), { id: "resp", fill: "none", tone: respTone, label: done ? `응답 ${Math.round(req.max)}ms` : "응답 대기 중" }),
            cells,
            label(p(480, -34), t < SPLIT ? "요청을 쪼갠다" : done ? `가장 느린 호출을 기다려 합친다 · ${Math.round(req.max)}ms` : `호출 진행 · ${Math.round(ms)}ms 경과`, { id: "clock" }),
            label(p(480, -446), `백엔드 호출 ${n}개 · 호출마다 1% 확률로 1초 넘게 걸린다`, { id: "grid-cap", tone: "muted" }),
            label(p(RX, -60), "느린 요청 비율", { id: "hero-cap", tone: "muted" }),
            label(p(RX, -112), `${Math.round(F.pSlow * 100)}%`, { id: "hero", size: "l", weight: "bold" }),
            label(p(RX, -138), `1 − 0.99^${n} · 모델로 계산한 예시`, { id: "hero-sub", tone: "muted" }),
            label(p(RX, CY - 84), "최근 요청 20개", { id: "tally-cap", tone: "muted" }),
            Array.from({ length: NREQ }, (_, i) => {
              const v = tally[i], x = RX - 115 + (i % 10) * 23.5, y = CY - 98 - Math.floor(i / 10) * 23.5;
              return rect(p(x, y - 18), p(x + 18, y), { id: `tally-${i}`, tone: v === undefined ? "muted" : v.max > 100 ? "bad" : "good", fill: v === undefined ? "none" : v.max > 100 ? "solid" : "soft" });
            }),
            tally.length > 0 && label(p(RX, CY - 168), `느림 ${tally.filter((/** @type {{max: number}} */ r) => r.max > 100).length} / ${tally.length}`, { id: "tally-text" }),
          ];
        },
      ),
    },
    scenes: [{
      type: "explore", title: "호출을 많이 쪼갤수록 한 요청이 느린 호출에 걸릴 확률이 커진다",
      say: "fan-out된 호출 하나하나는 1%만 느리다(호출 p99가 1초). 응답은 가장 느린 칸이 차야 나간다.",
      figure: "fanout", focus: ["hero", "resp"],
      knobs: { fan: ["1", "5", "10", "25", "50", "100", "200"] },
      goal: { say: "느린 요청이 10% 아래로 내려가는 fan-out을 찾는다", done: (m) => m.fan.pSlow < 0.1 },
    }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s07", src: "archive/v1:site/gallery/shots/s07-fanout-tail-latency.html", corpus: "shot", domain: "백엔드",
  props: [
    { id: "b1", cat: "T", text: "0–0.6s 요청 하나가 선 여러 개로 갈라져 작은 칸들로 나뉜다", essential: true, why: "beat 1", status: "kept", by: "line reveal 'Drawn fraction 0–1' = split(t)" },
    { id: "b2", cat: "T", text: "칸들이 각자 지연만큼 아래에서 차오른다", essential: true, why: "beat 2", status: "kept", by: "rect height = cs·min(1, ms/lat) from t; log sim-time readout in 'clock' label" },
    { id: "b3", cat: "T", text: "가장 늦은 칸이 차야 선이 응답으로 합쳐지고 결과가 집계 칸에 쌓인다", essential: true, why: "beat 3", status: "kept", by: "back lines + resp tone only when ms ≥ max; tally rects from completed requests in the deterministic sequence" },
    { id: "pr1", cat: "T", text: "'가장 늦은 칸을 기다린다'를 칸이 차는 시간 차로 보인다", essential: true, why: "principle", status: "kept", by: "per-cell fill computed against each latency on shared t" },
    { id: "pr2", cat: "X", text: "확률은 큰 숫자(1 − 0.99^N)로 옆에 둔다", essential: true, why: "principle", status: "kept", by: "label 'hero' size 'l' from model pSlow" },
    { id: "i1", cat: "I", text: "fan-out 1·5·10·25·50·100·200 단계 조절과 10% 목표", essential: true, why: "role sweep", status: "kept", by: "Explore knobs string[] choices + goal.done" },
    { id: "t1", cat: "T", text: "집계 칸은 끝없이 최근 20개를 굴린다", essential: false, why: "원본 tally.shift", status: "approx", diff: "loop replays a fixed 20-request sequence, so the tally empties at each loop restart" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
