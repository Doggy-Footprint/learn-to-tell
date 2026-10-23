// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, rect, path, line, sweep, label, dot, axis, multiples } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const pt = (x, y) => [x, y];
  /** RAPID 26.5°N 2004–2012 mean ~17 Sv (Srokosz & Bryden 2015); weakened = illustrative ~30% less */
  const amoc = model({ regime: "normal" }, ({ regime }) => regime === "normal"
    ? { sink: 62, deep: 3000, speed: 0.16, sv: "17 Sv", note: "26.5°N 관측 평균", sinkLabel: "60°N에서 침강", tone: /** @type {import("ltt").Tone} */ ("focus"), lens: false }
    : { sink: 52, deep: 1900, speed: 0.112, sv: "약 12 Sv", note: "모델로 계산한 예시", sinkLabel: "덜, 남쪽에서 침강", tone: /** @type {import("ltt").Tone} */ ("warn"), lens: true },
  "정상: RAPID 26.5°N 관측(Srokosz & Bryden 2015). 약화: 침강 약 30% 감소 가정 모델 예시");
  /** sample the conveyor loop (lat °, depth m) as a closed polyline */
  /** @param {number} sink @param {number} deep */
  const loopPts = (sink, deep) => {
    /** @type {import("ltt").P[]} */
    const P = [];
    /** @param {import("ltt").P} a @param {import("ltt").P} c @param {import("ltt").P} b */
    const quad = (a, c, b) => { for (let i = 0; i <= 12; i++) { const s = i / 12; P.push(pt((1 - s) ** 2 * a[0] + 2 * s * (1 - s) * c[0] + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * s * (1 - s) * c[1] + s * s * b[1])); } };
    P.push(pt(-36, -60)); P.push(pt(sink - 4, -60));
    quad(pt(sink - 4, -60), pt(sink + 3, -80), pt(sink + 2, -deep / 2));
    quad(pt(sink + 2, -deep / 2), pt(sink + 1, -deep), pt(sink - 8, -deep));
    P.push(pt(-30, -deep));
    quad(pt(-30, -deep), pt(-38, -deep), pt(-38, -deep / 2));
    quad(pt(-38, -deep / 2), pt(-38, -60), pt(-36, -60));
    return P;
  };
  /** @param {import("ltt").P[]} P */
  const cum = (P) => P.reduce((a, p, i) => (i ? [...a, a[i - 1] + Math.hypot(p[0] - P[i - 1][0], (p[1] - P[i - 1][1]) / 36)] : [0]), /** @type {number[]} */ ([]));
  /** @param {import("ltt").P[]} P @param {number[]} C @param {number} s */
  const at = (P, C, s) => { const L = C[C.length - 1], e = ((s % 1) + 1) % 1 * L; let k = 0; while (k < C.length - 2 && C[k + 1] < e) k++; const f = (e - C[k]) / (C[k + 1] - C[k] || 1); return pt(P[k][0] + (P[k + 1][0] - P[k][0]) * f, P[k][1] + (P[k + 1][1] - P[k][1]) * f); };
  const floor = [[-40, 4000], [-25, 3900], [-10, 4000], [5, 3800], [20, 3600], [35, 3900], [50, 3400], [62, 3700], [66, 1800], [70, 900]];
  return {
    models: { amoc },
    figures: {
      section: figure(
        cartesian({ x: [-40, 70, "°N"], y: [-4300, 300, "m"], loop: { ms: 8000, span: [0, 8] } }),
        (m, t) => {
          const a = m.amoc, P = loopPts(a.sink, a.deep), C = cum(P), u = t * a.speed;
          const trail = Array.from({ length: 33 }, (_, i) => at(P, C, u - 0.32 + (0.32 * i) / 32));
          return [
            rect(pt(-40, 0), pt(70, -4000), { id: "sea", tone: "series1", fill: "soft" }),
            path([["M", floor[0][0], -floor[0][1]], ...floor.slice(1).map(([x, d]) => /** @type {import("ltt").PathCmd} */ (["L", x, -d])), ["L", 70, -4300], ["L", -40, -4300], ["Z"]], { id: "floor", tone: "muted", fill: "solid" }),
            axis("x", { label: "위도", ticks: [-30, 0, 26.5, 60] }),
            axis("y", { label: "깊이", ticks: [-1000, -2000, -3000] }),
            sweep("x", 26.5, { id: "rapid", tone: "muted" }),
            a.lens && path([["M", 48, 0], ["Q", 58, -260, 68, 0], ["Z"]], { id: "lens", tone: "warn", fill: "soft", label: "녹은 물 · 가벼운 표층" }),
            line(P, { id: "route", tone: "ref", dash: true, weight: "thin", opacity: 0.6 }),
            line(trail, { id: "trail", tone: a.tone, weight: "bold" }),
            Array.from({ length: 7 }, (_, i) => dot(at(P, C, u - i / 7), { id: `parcel-${i}`, tone: i ? "ref" : a.tone, size: i ? "s" : "l" })),
            label(pt(4, -60 - 400), "따뜻하고 짠 표층수 → 북쪽", { id: "surf-l", anchor: "w" }),
            label(pt(a.sink - 2, -a.deep / 2), a.sinkLabel, { id: "sink-l", anchor: "e" }),
            label(pt(4, -a.deep + 200), `차가운 심층수 ← 남쪽 (${a.deep.toLocaleString()} m)`, { id: "deep-l", anchor: "w" }),
            label(pt(-34, -a.deep / 2), "용승", { id: "up-l", anchor: "w", tone: "muted" }),
            label(pt(-40, -4250), `${a.sv}  ${a.note}`, { id: "sv", anchor: "w", size: "l", tone: a.tone }),
          ];
        },
      ),
      s34: multiples("section", { over: { regime: ["normal", "weak"] } }),
    },
    scenes: [{ type: "explain", title: "북쪽 바다가 가벼워지면 컨베이어가 느려지고 얕아진다", say: "같은 시간에 도는 거리를 비교한다.", figure: "s34", focus: ["trail", "sv"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s34", src: "s34-amoc-weakening.html", corpus: "shot", domain: "해양 · 열염순환 정상 vs 약화",
  props: [
    { id: "b1", cat: "T", text: "두 단면에서 꼬리 달린 점이 표층을 따라 북쪽으로 흐른다", essential: true, why: "beat 1", status: "kept", by: "dots and trail positioned by arc length at t·speed within Loop; multiples share t" },
    { id: "b2", cat: "G", text: "정상 쪽은 60°N에서 3,000 m까지 가라앉고 약화 쪽은 52°N에서 1,900 m로 얕게 가라앉는다", essential: true, why: "beat 2", status: "kept", by: "cartesian x °N, y m data units; path from model sink/deep" },
    { id: "b3", cat: "T", text: "정상 쪽이 심층을 따라 남으로 흐를 때 약화 쪽은 아직 뒤처져 있다", essential: true, why: "beat 3", status: "kept", by: "multiples 'one copy per value, sharing frame, axes, t'; speed 0.16 vs 0.112 per s" },
    { id: "b4", cat: "T", text: "같은 시간에 정상 쪽이 한 바퀴를 더 멀리 돌아 궤적을 남긴다", essential: true, why: "beat 4", status: "approx", diff: "원본 궤적은 SVG 화면 길이 기준 속도인데 여기선 위도·깊이를 섞은 임의 척도(1° = 36 m) 호 길이 기준이라 두 궤적의 한 바퀴 비율이 조금 다르다" },
    { id: "p1", cat: "S", text: "대조는 같은 시간에 움직인 거리 차이로 속도를 보이고 숫자는 그림 아래 하나만 크게 둔다", essential: true, why: "principle", status: "kept", by: "multiples shared t and axes; single label size l per copy" },
  ],
  verdict: "V", custom: [], candidates: ["path-along"],
}];
