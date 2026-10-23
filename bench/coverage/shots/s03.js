// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, model, rect, label, sweep, axis, grid } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const ease = (/** @type {number} */ x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clamp = (/** @type {number} */ x) => Math.max(0, Math.min(1, x));
  /** @type {{k: string, ms: number, g: number, tone: import("ltt").Tone}[]} */
  const SEG = [
    { k: "DNS", ms: 100, g: 0, tone: "series1" }, { k: "TCP", ms: 100, g: 0, tone: "series1" }, { k: "TLS", ms: 200, g: 0, tone: "series1" },
    { k: "TTFB", ms: 400, g: 1, tone: "series2" }, { k: "HTML", ms: 200, g: 2, tone: "series3" }, { k: "CSS·JS·렌더", ms: 900, g: 2, tone: "series3" }];
  const ZONES = [{ n: "①", t: "왕복 횟수가 시간을 정한다", g: 0 }, { n: "②", t: "서버가 첫 바이트를 늦게 준다", g: 1 }, { n: "③", t: "렌더를 막는 파일이 가장 길다", g: 2 }];
  const budget = model({ budget: 2500 }, ({ budget }) => ({ budget, total: SEG.reduce((a, s) => a + s.ms, 0) }),
    "모바일 4G RTT 약 100ms 가정, TLS 1.2 2왕복; LCP 2.5초 web.dev Core Web Vitals");
  const ROW = (/** @type {number} */ i) => 7 - i, BAR = 0, H = 0.7;
  return {
    models: { budget },
    figures: {
      waterfall: figure(
        // phase 0–1 of the original 9 s draw(u)
        cartesian({ x: [0, 2800, "ms"], y: [-1.5, 8, ""], loop: { ms: 9000, span: [0, 1] } }),
        (m, u) => {
          let acc = 0, sum = 0;
          const rows = SEG.map((sg, i) => {
            const x0 = acc; acc += sg.ms;
            const grow = ease(clamp((u - i * 0.075) / 0.07)), drop = ease(clamp((u - 0.55 - i * 0.02) / 0.15));
            const y = ROW(i) + (BAR - ROW(i)) * drop;
            sum += sg.ms * grow;
            const msOp = clamp((grow - 0.8) / 0.2) * (1 - clamp(drop * 3));
            return [
              rect(p(x0, ROW(i)), p(acc, ROW(i) + H), { id: `outline-${i}`, fill: "none", tone: "muted", weight: "thin" }),
              u <= 0.98 && grow > 0 && rect(p(x0, y), p(x0 + sg.ms * grow, y + H), { id: `seg-${i}`, tone: sg.tone, fill: "solid", label: grow > 0.9 ? sg.k : undefined }),
              msOp > 0 && label(p(acc + 20, ROW(i) + H / 2), `${sg.ms}ms`, { id: `ms-${i}`, anchor: "w", opacity: msOp }),
            ];
          });
          const zones = ZONES.map((z, i) => {
            const last = SEG.map((s, j) => (s.g === z.g ? j : -1)).filter((j) => j >= 0).pop() ?? 0;
            const end = SEG.slice(0, last + 1).reduce((a, s) => a + s.ms, 0);
            const op = clamp((u - 0.74 - i * 0.04) / 0.05) * (u > 0.98 ? 0 : 1);
            return op > 0 && label(p(end + 20, ROW(last) + H / 2), `${z.n} ${z.t}`, { id: `zone-${z.g}`, anchor: "w", opacity: op });
          });
          const leftOp = clamp((u - 0.7) / 0.05) * (u > 0.98 ? 0 : 1);
          return [
            grid({ x: 500 }),
            axis("x", { ticks: [0, 500, 1000, 1500, 2000, 2500] }),
            sweep("x", m.budget.budget, { id: "budget", tone: "bad", label: "LCP 예산 2.5초" }),
            rows,
            leftOp > 0 && rect(p(m.budget.total, BAR), p(m.budget.budget, BAR + H), { id: "left", tone: "good", fill: "none", opacity: leftOp, label: `남은 ${m.budget.budget - m.budget.total}ms` }),
            zones,
            label(p(0, -1), `합계 ${Math.round(sum).toLocaleString()}ms · 예산까지 ${Math.round(m.budget.budget - sum)}ms`, { id: "total", anchor: "w" }),
          ];
        },
      ),
    },
    scenes: [{ type: "explain", title: "2.5초 예산은 연결·서버·렌더가 차례로 쌓여 채운다", say: "구간마다 한 줄씩 그려진 뒤 한 막대로 내려 쌓인다.", figure: "waterfall", focus: ["budget", "left"] }],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s03", src: "archive/v1:site/gallery/shots/s03-page-load-budget.html", corpus: "shot", domain: "웹 성능",
  props: [
    { id: "b1", cat: "T", text: "0–2s 구간 막대가 폭포처럼 한 줄씩 차례로 그려진다", essential: true, why: "beat 1", status: "kept", by: "rect width from t per row (grow); figure draw sampled over frame time" },
    { id: "b2", cat: "Q", text: "마지막 줄까지 그려지고 합계가 예산선 앞까지 쌓인다", essential: true, why: "beat 2", status: "kept", by: "rects in ms data units on x axis; sweep('x', 2500) budget line; label 'total' from t" },
    { id: "b3", cat: "T", text: "줄들이 아래로 내려와 한 막대로 합쳐진다", essential: true, why: "beat 3", status: "kept", by: "rect y interpolated from row to BAR per t" },
    { id: "b4", cat: "X", text: "쌓인 막대 끝에 남은 칸과 정리 번호가 놓이고 펼친 윤곽이 남는다", essential: true, why: "beat 4", status: "kept", by: "rect fill 'none' outlines stay; label marks 'zone-*', rect 'left' with label" },
    { id: "pr1", cat: "S", text: "펼친 상태→접힌 상태 이동을 보이고 펼친 윤곽 자리에 정리 번호를 얹는다", essential: true, why: "principle", status: "kept", by: "outline rects at row positions + zone labels at each group's last-row end" },
    { id: "s1", cat: "E", text: "윤곽은 점선", essential: false, why: "원본 stroke-dasharray", status: "approx", diff: "rect has no dash option; outline distinguished by fill none + muted thin only" },
  ],
  verdict: "V", custom: [], candidates: ["rect-dash"],
}];
