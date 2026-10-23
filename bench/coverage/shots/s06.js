// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, geo, cartesian, model, line, dot, circle, label, rect, trace, split, ode } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const p = (x, y) => [x, y];
  const clamp = (/** @type {number} */ x) => Math.max(0, Math.min(1, x));
  /** @type {{key: string, d: number, l: string, k: "sea" | "dwell"}[]} */
  const LEGS = [
    { key: "출항", d: 6, l: "부산 출항 → 싱가포르", k: "sea" }, { key: "환적", d: 3, l: "싱가포르 환적 대기", k: "dwell" },
    { key: "본선 운항", d: 24, l: "싱가포르 → 로테르담", k: "sea" }, { key: "통관", d: 2, l: "로테르담 통관", k: "dwell" }];
  /** @type {import("ltt").P[]} */
  const W1 = [[129.04, 35.1], [127, 32.5], [122.5, 27.5], [119.5, 22.5], [113, 15], [108, 8], [103.85, 1.26]];
  /** @type {import("ltt").P[]} */
  const W2 = [[103.85, 1.26], [100, 4], [96, 6.2], [86, 5.8], [79.5, 5.5], [65, 11], [52, 12.8], [43.4, 12.6], [38.5, 19.5], [34.5, 27], [32.5, 30.5], [28, 33.2], [18, 35], [10, 37.5], [0, 37], [-5.6, 35.95], [-10, 38], [-9.6, 43.5], [-5, 48.5], [-1, 50.2], [2.5, 51.4], [4.0, 51.95]];
  const len = (/** @type {import("ltt").P[]} */ q) => q.slice(1).reduce((s, b, i) => s + Math.hypot(b[0] - q[i][0], b[1] - q[i][1]), 0);
  /** velocity along route w so that it is covered at constant speed over [t0, t0 + dur] days */
  const vel = (/** @type {import("ltt").P[]} */ w, /** @type {number} */ s) => {
    for (let i = 1; i < w.length; i++) {
      const L = Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1]);
      if (s < L || i === w.length - 1) return p((w[i][0] - w[i - 1][0]) / L, (w[i][1] - w[i - 1][1]) / L);
      s -= L;
    }
    return p(0, 0);
  };
  const voyage = model({ dwell: 3 }, ({ dwell }) => {
    const total = LEGS.reduce((a, l) => a + (l.key === "환적" ? dwell : l.d), 0);
    const L1 = len(W1), L2 = len(W2), t2 = 6 + dwell;
    // ship position as ODE state [lon, lat, arc length on current leg]; zero velocity while dwelling
    const ship = ode((t, y) => {
      if (t < 6) { const v = vel(W1, y[2]); const sp = L1 / 6; return [v[0] * sp, v[1] * sp, sp]; }
      if (t < t2 || t >= t2 + 24) return [0, 0, 0];
      const v = vel(W2, y[2] - L1); const sp = L2 / 24; return [v[0] * sp, v[1] * sp, sp];
    }, [W1[0][0], W1[0][1], 0], [0, total], 0.01);
    return { total, ship, t2 };
  }, "선사 공표 스케줄의 흔한 범위에서 고른 대표값: 부산–싱가포르 6일, 환적 3일, 싱가포르–로테르담(수에즈) 24일, 통관 2일");
  // 8 s: schedule runs 6.4 s (35 days), holds 1.6 s at arrival
  const loop = { ms: 8000, span: /** @type {[number, number]} */ ([0, 35]), warp: /** @type {[number, number][]} */ ([[0, 0], [35, 0.8], [35, 1]]) };
  const dwellNow = (/** @type {number} */ t) => (t >= 6 && t < 9) || (t >= 33 && t < 35);
  return {
    models: { voyage },
    figures: {
      map: figure(
        geo({ projection: "mercator", loop }),
        (m, t) => {
          const [lon, lat] = m.voyage.ship.at(t), ph = (t * 2) % 1;
          return [
            line(W1, { id: "route1-base", tone: "muted", dash: true }), line(W2, { id: "route2-base", tone: "muted", dash: true }),
            trace(m.voyage.ship, t, { id: "route", tone: "focus", head: true, dims: [0, 1], weight: "bold" }),
            dwellNow(t) && t < 35 && circle(p(lon, lat), 0.5 + 1.5 * ph, { id: "halo", tone: "warn", fill: "none", opacity: 1 - ph }),
            dot(W1[0], { id: "pus", label: "부산" }), dot(W2[0], { id: "sin", label: "싱가포르" }),
            dot(W2[W2.length - 1], { id: "rtm", label: "로테르담" }), dot(p(32.5, 30.5), { id: "suez", label: "수에즈", tone: "muted", size: "s" }),
          ];
        },
      ),
      sched: figure(
        cartesian({ x: [0, 35, "일"], y: [0, 2, ""], loop }),
        (m, t) => {
          let a = 0, cur = 0;
          const segs = LEGS.map((lg, i) => {
            const lu = clamp((t - a) / lg.d), x = a; a += lg.d; if (t >= x) cur = i;
            return [
              rect(p(x, 1), p(a - 0.15, 1.3), { id: `slot-${i}`, tone: "muted", fill: "soft" }),
              lu > 0 && rect(p(x, 1), p(x + lg.d * lu - 0.15, 1.3), { id: `fill-${i}`, tone: lg.k === "sea" ? "focus" : "warn", fill: "solid" }),
              label(p(x, 0.7), `${lg.key} ${lg.d}일`, { id: `seg-lab-${i}`, anchor: "nw", tone: lu > 0 && lu < 1 ? undefined : "muted" }),
            ];
          });
          return [
            segs,
            label(p(0, 1.8), `D+${Math.min(m.voyage.total, Math.round(t))}일`, { id: "day", anchor: "w", size: "l" }),
            label(p(35, 1.8), t >= 35 ? `도착·통관 완료 · 총 ${m.voyage.total}일` : LEGS[cur].l, { id: "what", anchor: "e" }),
          ];
        },
      ),
      voyageFig: split(["map", "sched"]),
    },
    scenes: [
      { type: "explain", title: "도착일은 배가 달린 날에 기다린 날을 더해 정해진다", say: "선이 그려지면 배가 달린 날, 점이 멈춰 맥박치면 기다린 날이다.", figure: "voyageFig", focus: ["route", "day"] },
      { type: "define", term: "출항", definition: "ETD. 배가 선적항을 떠나는 날. 리드타임은 여기서 센다.", figure: "voyageFig", focus: ["pus", "fill-0"] },
      { type: "define", term: "환적", definition: "중간 항구에서 다른 배로 옮겨 싣는다. 연결 배를 기다리는 날이 붙는다.", figure: "voyageFig", focus: ["sin", "fill-1", "halo"] },
      { type: "define", term: "통관", definition: "도착국 세관이 물건을 내줘야 창고로 간다.", figure: "voyageFig", focus: ["rtm", "fill-3"] },
    ],
  };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s06", src: "archive/v1:site/gallery/shots/s06-shipping-leadtime.html", corpus: "shot", domain: "해운 물류",
  props: [
    { id: "b1", cat: "T", text: "0–1s 항로선이 그려지고 점이 따라가며 일정표 첫 칸이 쌓인다", essential: true, why: "beat 1", status: "kept", by: "trace(series, t, {head}) 'Path of series up to model time t'; rect width from t; split shares t" },
    { id: "b2", cat: "T", text: "점이 중간 항구에서 멈춰 맥박치고 대기 칸이 다른 색으로 쌓인다", essential: true, why: "beat 2", status: "kept", by: "ODE velocity 0 during dwell; circle radius/opacity from t; tone 'warn' vs 'focus'" },
    { id: "b3", cat: "T", text: "둘째 항로선이 길게 그려지며 일정표가 D+n일을 센다", essential: true, why: "beat 3", status: "kept", by: "trace up to t; label 'day' from t" },
    { id: "b4", cat: "T", text: "통관 칸까지 차고 '총 35일'로 멈췄다가 처음으로 돌아간다", essential: true, why: "beat 4", status: "kept", by: "Loop.warp [35,0.8]→[35,1] 'repeated modelT holds'" },
    { id: "pr1", cat: "T", text: "선이 그려지는 속도와 시간축 막대가 쌓이는 속도를 맞춘다", essential: true, why: "principle", status: "kept", by: "both frames use the same Loop on model time in days; split 'Both share t'" },
    { id: "pr2", cat: "E", text: "이동과 대기를 다른 동작으로 가른다(선 그리기 vs 멈춤·맥박)", essential: true, why: "principle", status: "kept", by: "trace head stationary while ODE velocity 0 + halo circle only during dwell" },
    { id: "g1", cat: "G", text: "메르카토르 지도 위 실제 항로(부산→싱가포르→수에즈→로테르담)", essential: true, why: "terms 장면의 공간", status: "kept", by: "geo projection 'mercator'; 'Points are [lon, lat] degrees'" },
    { id: "g2", cat: "G", text: "지도 범위를 항로(경도 −14~134, 위도 −6~58)에 맞춘다", essential: false, why: "원본 extent", status: "approx", diff: "GeoOpts has only a region name; omitted → whole world, route occupies a smaller part" },
  ],
  verdict: "V", custom: [], candidates: ["geo-extent"],
}];
