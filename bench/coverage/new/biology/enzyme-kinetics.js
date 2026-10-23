// @ts-check
/** @typedef {import("../../fragment").Prop} Prop */
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, line, path, dim, label, circle, dot, rect, arrow, sweep, legend, inset, multiples, ode, rng, grid } = api;
  const KM = 2, VMAX = 100; // mM, µM/min
  /** @param {number} s @param {number} km @param {number} vm */
  const mm = (s, km, vm) => (vm * s) / (km + s);
  /** @param {number} n @param {(i: number) => number} f @returns {import("ltt").P[]} */
  const curve = (n, f, x0 = 0, x1 = 20) => Array.from({ length: n + 1 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / n; return [x, f(x)]; });
  const SDATA = [0.25, 0.5, 1, 2, 4, 8, 16, 32];
  const r6 = rng(6);
  const vdata = SDATA.map((s) => mm(s, KM, VMAX) * (1 + 0.05 * (r6() * 2 - 1) * 1.7));
  // Absorbance noise σ=0.005 → [P] noise via assumed ε·l = 5.5 mM⁻¹ (pNP ε405 ≈ 18.3 mM⁻¹cm⁻¹, ~0.3 cm well path); brief gives no ε.
  const EPS_L = 5.5;
  const models = {
    prog: model({ s0: 1, km: KM, vmax: VMAX, t0: 0, t1: 2 }, ({ s0, km, vmax, t0, t1 }) => {
      const s = ode((t, [S]) => [-(vmax / 1000) * S / (km + S)], [s0], [0, 10], 0.01);
      const r = rng(5);
      const pts = Array.from({ length: 21 }, (_, i) => { const t = i * 0.5; const p = (s0 - s.at(t)[0]) * 1000; return /** @type {import("ltt").P} */ ([t, p + ((r() + r() + r() - 1.5) * 2 * 0.005 * 1000) / EPS_L]); });
      const inWin = pts.filter(([t]) => t >= Math.min(t0, t1) && t <= Math.max(t0, t1));
      const n = inWin.length, mx = inWin.reduce((a, p) => a + p[0], 0) / n, my = inWin.reduce((a, p) => a + p[1], 0) / n;
      const slope = inWin.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / inWin.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
      const v0 = mm(s0, km, vmax);
      const t10 = api.root((t) => s.at(t)[0] - 0.9 * s0, [0, 10]);
      return { s, pts, slope, v0, err: (slope - v0) / v0, t10, sLeft: s.at(10)[0] / s0 };
    }, "integrated Michaelis–Menten via RK4, [S]0=1 mM, Km=2 mM, Vmax=100 µM/min; noise σ_A=0.005, ε·l=5.5 mM⁻¹ assumed"),
    fit: model({ km: 3, vmax: 80, logx: false }, ({ km, vmax }) => {
      const ssr = SDATA.reduce((a, s, i) => a + (vdata[i] - mm(s, km, vmax)) ** 2, 0);
      let best = Infinity;
      for (let k = 0.5; k <= 6; k += 0.05) for (let v = 60; v <= 140; v += 0.5) best = Math.min(best, SDATA.reduce((a, s, i) => a + (vdata[i] - mm(s, k, v)) ** 2, 0));
      return { ssr, best, ok: ssr <= 1.1 * best };
    }, "MM v = Vmax[S]/(Km+[S]), true Km=2, Vmax=100, 5% noise (rng seed 6)"),
    inh: model({ kind: "comp", ratio: 1 }, ({ kind, ratio }) => ({ km: kind === "comp" ? KM * (1 + ratio) : KM, vmax: kind === "comp" ? VMAX : VMAX / (1 + ratio) }), "competitive Km_app = Km(1+[I]/Ki); pure noncompetitive Vmax_app = Vmax/(1+[I]/Ki)"),
    occ: model({ s: 2 }, ({ s }) => ({ frac: s / (KM + s), rate: 20 * (s / (KM + s)) }), { illustrative: true }),
  };
  /** @param {number} x @param {number} y */
  const enzymeShape = (x, y, closed = false) => path([["M", x - 1, y], ["L", x - 1, y + 1.4], ["L", x - 0.3, y + 1.4], closed ? ["L", x, y + 1.0] : ["L", x, y + 0.8], closed ? ["L", x + 0.3, y + 1.4] : ["L", x + 0.3, y + 1.4], ["L", x + 1, y + 1.4], ["L", x + 1, y], ["Z"]], { fill: "soft" });
  const figures = {
    energy: figure(cartesian({ x: [0, 10, ""], y: [0, 100, "kJ/mol"], static: "반응 좌표에 따른 자유 에너지, 비촉매와 효소 경로" }), () => [
      axis("x", { label: "반응 좌표" }), axis("y", { label: "자유 에너지" }),
      path([["M", 0, 20], ["C", 3, 20, 4, 95, 5, 95], ["C", 6, 95, 7, 5, 10, 5]], { id: "uncat", tone: "ref", label: "비촉매" }),
      path([["M", 0, 20], ["C", 3, 20, 4, 50, 5, 50], ["C", 6, 50, 7, 5, 10, 5]], { id: "cat", tone: "focus", label: "효소" }),
      line([[0, 20], [10, 20]], { id: "start-level", dash: true, tone: "muted" }),
      line([[8, 5], [10, 5]], { id: "end-level", dash: true, tone: "muted" }),
      dim([5, 50], [5, 95], "Ea 차이 45", { id: "ea-diff", tone: "focus" }),
      dim([4.2, 20], [4.2, 95], "Ea 75", { id: "ea-uncat" }), dim([5.8, 20], [5.8, 50], "Ea 30", { id: "ea-cat" }),
      dim([9, 20], [9, 5], "ΔG 같음", { id: "dg" }),
      label([0.3, 92], "예시 값, 특정 효소 아님", { id: "illus", anchor: "nw" }),
    ]),
    occupancy: figure(cartesian({ x: [0, 20, ""], y: [0, 12, ""], loop: { ms: 8000, span: [0, 40] } }), (m, t, { params }) => {
      const p = s0frac(Number(params.s));
      const slot = Math.floor(t * 2);
      const enz = Array.from({ length: 20 }, (_, i) => {
        const r = rng(1000 * slot + i);
        const bound = r() < p;
        const x = 1 + (i % 10) * 2, y = i < 10 ? 2 : 6;
        return [circle([x, y], 0.6, { id: `e${i}`, fill: bound ? "solid" : "none", tone: bound ? "focus" : "muted" })];
      });
      const nS = Math.min(60, Math.round(6 * Math.log10(Number(params.s) / KM * 10 + 1) * 4));
      const sub = Array.from({ length: nS }, (_, i) => { const r = rng(i * 7919 + slot); return dot([r() * 20, r() * 9], { id: `s${i}`, size: "s", tone: "series2" }); });
      return [enz, sub,
        label([0.3, 11.5], (o) => `점유율 ${(o.occ.frac * 100).toFixed(0)}% · 생성 ${o.occ.rate.toFixed(1)} 개/단위시간`, { id: "counter", anchor: "nw" }),
        label([19.7, 11.5], "분자 크기·간격·속도는 축척 아님", { id: "scale-note", anchor: "ne" }),
        legend([{ tone: "muted", text: "빈 효소(윤곽)" }, { tone: "focus", text: "결합한 효소(채움)" }], { id: "key", at: [12, 10] })];
    }),
    predictV: figure(cartesian({ x: [0, 20, "mM"], y: [0, 120, "µM/min"], static: "v–[S] 예측과 실제 쌍곡선" }), () => [
      axis("x", { label: "[S]" }), axis("y", { label: "v" }),
      dot([1, mm(1, KM, VMAX)], { id: "at1", label: "33" }),
      dot([10, 60], { id: "guess-pt", tone: "series2" }),
      line([[0, 0], [3.6, 120]], { id: "proportional", dash: true, tone: "bad", label: "비례(오개념)" }),
      line(curve(100, (s) => mm(s, KM, VMAX)), { id: "mm-curve", tone: "focus" }),
      dot([10, mm(10, KM, VMAX)], { id: "at10", label: "83" }),
    ]),
    cycle: figure(cartesian({ x: [0, 12, ""], y: [0, 6, ""], steps: ["E + S", "ES", "EP", "E + P"] }), (m, t, { step }) => [
      enzymeShape(6, 1, step === 1 || step === 2),
      step === 0 && circle([6, 4.5], 0.4, { id: "S", tone: "series2", fill: "solid", label: "S" }),
      (step === 1 || step === 2) && circle([6, 2.2], 0.35, { id: "bound", tone: step === 1 ? "series2" : "series3", fill: "solid" }),
      step === 3 && circle([9, 4.5], 0.4, { id: "P", tone: "series3", fill: "solid", label: "P" }),
      label([6, 0.4], ["활성 부위 비어 있음", "유도적합: 활성 부위가 감쌈", "전이 상태 → 생성물", "효소는 처음 모양 그대로"][step], { id: "note" }),
      label([0.2, 5.8], "kcat 예: 탄산탈수효소 ~10⁶ /s, 키모트립신 ~10² /s", { id: "kcat", anchor: "nw" }),
      label([11.8, 5.8], "단순화된 2차원 모식도", { id: "schematic", anchor: "ne" }),
    ]),
    progress: figure(cartesian({ x: [0, 10, "min"], y: [0, 250, "µM"], static: "[P] 진행 곡선, 30초 간격 측정점" }), (m, t, { params }) => {
      const t0 = Number(params.t0), t1 = Number(params.t1), P = m.prog;
      const y0 = P.pts[0][1];
      return [
        axis("x", { label: "시간" }), axis("y", { label: "[P]" }),
        rect([0, 0], [P.t10, 250], { id: "band10", tone: "good", fill: "soft", opacity: 0.3, label: "기질 소모 10% 이내" }),
        P.pts.map((/** @type {import("ltt").P} */ p, /** @type {number} */ i) => dot(p, { id: `pt${i}`, size: "s" })),
        line([[t0, y0 + P.slope * t0], [t1, y0 + P.slope * t1]], { id: "fit", tone: "focus", weight: "bold" }),
        line([[0, 0], [10, P.v0 * 10]], { id: "true-v0", dash: true, tone: "ref", label: "참 초기 속도" }),
        dot([t0, 0], { id: "h0", label: "시작" }), dot([t1, 0], { id: "h1", label: "끝" }),
        label([0.3, 240], (o) => `기울기 ${o.prog.slope.toFixed(1)} µM/min · 참값 대비 ${(o.prog.err * 100).toFixed(1)}%`, { id: "slope-val", anchor: "nw" }),
        rect([9.2, 120], [9.8, 120 + 100 * P.sLeft], { id: "s-left", fill: "solid", tone: "series2", label: "남은 [S]" }),
      ];
    }),
    fitV: figure(cartesian({ x: [0, 34, "mM"], y: [0, 140, "µM/min"], static: "8개 [S]의 초기 속도와 조정 가능한 MM 곡선" }), (m, t, { params }) => {
      const km = Number(params.km), vm = Number(params.vmax);
      return [
        axis("x", { label: "[S]" }), axis("y", { label: "v" }),
        SDATA.map((s, i) => [dot([s, vdata[i]], { id: `d${i}` }), line([[s, vdata[i] * 0.95], [s, vdata[i] * 1.05]], { id: `eb${i}`, weight: "thin" })]),
        line(curve(170, (s) => mm(s, km, vm), 0, 34), { id: "fit-curve", tone: "focus" }),
        line([[0, vm], [34, vm]], { id: "vmax-line", dash: true, label: "Vmax" }),
        line([[0, vm / 2], [km, vm / 2]], { id: "half-line", dash: true, tone: "warn" }),
        line([[km, 0], [km, vm / 2]], { id: "km-line", dash: true, tone: "warn" }),
        dot([km, vm / 2], { id: "km-pt", tone: "focus", size: "l", label: "Km, Vmax/2" }),
        dot([30, vm], { id: "vmax-h" }),
        label([20, 20], (o) => `SSR ${o.fit.ssr.toFixed(0)} (최적 ${o.fit.best.toFixed(0)})`, { id: "ssr" }),
      ];
    }),
    inhPanel: figure(cartesian({ x: [0, 20, "mM"], y: [0, 160, "µM/min"], static: "저해제 없음 기준과 저해 곡선" }), (m, t, { params }) => [
      axis("x", { label: "[S]" }), axis("y", { label: "v" }),
      line(curve(100, (s) => mm(s, KM, VMAX)), { id: "base", tone: "ref", label: "저해제 없음" }),
      line(curve(100, (s) => mm(s, m.inh.km, m.inh.vmax)), { id: "inh-curve", tone: "focus", label: (o) => `Km ${o.inh.km.toFixed(1)}, Vmax ${o.inh.vmax.toFixed(0)}` }),
      params.kind === "comp" && arrow([12, 70], [19, 97], { id: "converge", tone: "focus", label: "높은 [S]에서 기준으로 수렴" }),
      params.kind === "comp" ? [enzymeShape(4, 125), circle([4, 127.5], 0.4, { id: "inh-site", tone: "bad", fill: "solid", label: "활성 부위 경쟁" })]
        : [enzymeShape(4, 125), circle([5.4, 125.5], 0.4, { id: "allo-site", tone: "bad", fill: "solid", label: "다른 자리 결합" })],
    ]),
    quizData: figure(cartesian({ x: [0, 20, "mM"], y: [0, 120, "µM/min"], static: "미지 시료 v–[S], 저해제 없음/있음" }), () => [
      axis("x", { label: "[S]" }), axis("y", { label: "v" }),
      [0.5, 1, 2, 4, 8, 16].map((s, i) => [dot([s, mm(s, 2, 100)], { id: `q0-${i}`, tone: "series1" }), dot([s, mm(s, 6, 100)], { id: `q1-${i}`, tone: "series2" })]),
      legend([{ tone: "series1", text: "저해제 −" }, { tone: "series2", text: "저해제 +" }], { id: "qkey", at: [14, 30] }),
    ]),
    inhibit: multiples("inhPanel", { over: { kind: ["comp", "noncomp"] } }),
    pipeline: figure(cartesian({ x: [0, 60, ""], y: [0, 20, ""], static: "흡광도에서 저해 판정까지 파이프라인" }), () => {
      const steps = [["progress", "흡광도→[P]: ε·l 확인"], ["progress", "초기 기울기: 소모 10% 이내"], ["fitV", "v–[S]: 8농도 이상"], ["fitV", "Km·Vmax: 잔차 확인"], ["inhPanel", "저해: Km/Vmax 중 무엇이 변하나"]];
      return steps.map(([f, note], i) => [
        inset(f, { at: [[i * 12 + 1, 6], [i * 12 + 10, 16]], id: `thumb${i}` }),
        label([i * 12 + 5.5, 4], note, { id: `note${i}` }),
        i < 4 && arrow([i * 12 + 10.2, 11], [i * 12 + 12.8, 11], { id: `flow${i}` }),
      ]);
    }),
  };
  /** @param {number} s */
  function s0frac(s) { return s / (KM + s); }
  /** @type {import("ltt").Scene[]} */
  const scenes = [
    { type: "predict", title: "기질 10배", ask: "[S] 10 mM에서 v는 어디일까? 점을 끌어 놓자.", figure: "predictV", focus: ["guess-pt"], input: { kind: "drag", mark: "guess-pt", axis: "y", answer: () => mm(10, KM, VMAX), tol: 8 }, reveal: { say: "쌍곡선: 10배 넣어도 33→83.", marks: ["mm-curve", "proportional", "at1", "at10"] } },
    { type: "explore", title: "기질 농도와 점유", say: "[S]를 바꿔 보자.", figure: "occupancy", focus: ["counter"], knobs: { s: { range: [0.2, 200], log: true } } },
    { type: "steps", title: "촉매 순환", figure: "cycle", steps: [{ say: "E + S", focus: ["S"] }, { say: "ES", focus: ["bound"] }, { say: "EP", focus: ["bound"] }, { say: "E + P", focus: ["P", "note"] }] },
    { type: "explore", title: "초기 속도 뽑기", say: "구간을 옮겨 보자.", figure: "progress", focus: ["fit", "band10", "slope-val"], knobs: { t0: [0, 10, 0.5], t1: [0, 10, 0.5] }, handles: [{ mark: "h0", x: "t0" }, { mark: "h1", x: "t1" }] },
    { type: "explore", title: "Km·Vmax 맞추기", say: "핸들을 끌어 맞춰 보자.", figure: "fitV", focus: ["km-pt", "ssr"], knobs: { km: [0.5, 6, 0.05], vmax: [60, 140, 0.5], logx: false }, handles: [{ mark: "km-pt", x: "km" }, { mark: "vmax-h", y: "vmax" }], goal: { say: "SSR을 최적의 110% 이내로", done: (m) => m.fit.ok } },
    { type: "explore", title: "경쟁적 vs 비경쟁적", say: "[I]/Ki를 바꿔 보자.", figure: "inhibit", focus: ["inh-curve", "converge"], knobs: { ratio: [0, 5, 0.1] } },
    { type: "quiz", items: [{ kind: "choice", prompt: "저해 유형은?", objective: "o5", figure: "quizData", options: [{ text: "경쟁적, Km 6 mM", correct: true }, { text: "비경쟁적", feedback: "Vmax는 같다." }] }] },
  ];
  return { models, figures, scenes: /** @type {import("ltt").Scene[]} */ (scenes) };
};

const src = "bench/coverage/new/biology/enzyme-kinetics.brief.md";
/** @returns {Prop} */
const p = (/** @type {string} */ id, /** @type {Prop["cat"]} */ cat, /** @type {string} */ text, /** @type {boolean} */ essential, /** @type {string} */ why, /** @type {Prop["status"]} */ status, /** @type {string} */ note) =>
  status === "kept" ? { id, cat, text, essential, why, status, by: note } : { id, cat, text, essential, why, status, diff: note };
/** @param {number} n @param {Prop[]} props @param {string[]} candidates */
const row = (n, props, candidates = []) => /** @type {import("../../fragment").AuditRow} */ ({ fig: `enzyme-kinetics#F${n}`, src, corpus: "new-b1", domain: "생명과학", props, verdict: props.some((q) => q.essential && (q.status === "lost" || q.status === "ambiguous")) ? "G" : "V", custom: [], candidates });

/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row(1, [
    p("P1", "G", "두 경로의 시작·끝 높이가 같다", true, "ΔG 불변 결론", "kept", "P: Point in the frame's data units; 두 path가 같은 (0,20),(10,5) 좌표"),
    p("P2", "Q", "kJ/mol 선형, Ea 75 vs 30 예시", false, "크기 감각", "kept", "Axis unit + cartesian 선형 기본; path 정점 95/50"),
    p("P3", "E", "Ea 차이 양방향 화살표", true, "핵심 관계", "kept", "dim: Dimension line between two points with its measured text"),
    p("P4", "X", "예시 값 표기", true, "사실성", "kept", "label"),
  ]),
  row(2, [
    p("P1", "T", "연속 루프, 확률적 결합-촉매-방출", true, "포화 = 빈 효소 없음", "approx", "loop + rng(seed per 0.5 시간 슬롯)으로 각 효소 상태를 독립 추첨할 뿐 결합→촉매→방출의 개별 사건 순서와 기질 확산 궤적은 이어지지 않는다"),
    p("P2", "I", "[S] 슬라이더 0.1~100×Km log", true, "", "kept", "Explore.knobs { range, log: true } (0.2–200 mM = 0.1–100×Km)"),
    p("P3", "Q", "점유 확률 = [S]/(Km+[S]), 카운터", true, "MM 식과 일치", "kept", "model 출력 frac을 rng 임계로 사용 + label Text 함수"),
    p("P4", "X", "축척 아님 표기", true, "", "kept", "label"),
    p("P5", "E", "빈 효소 윤곽, 결합 효소 채움", true, "", "kept", "MarkOpts.fill none/solid"),
  ], ["stochastic-agents"]),
  row(3, [
    p("P1", "I", "점 드래그로 예측 고정", true, "", "kept", "DragInput: Learner drags mark along axis; answer drawn as mark id guess"),
    p("P2", "Q", "[S] 0~20 mM, v 0~120 µM/min 선형", true, "", "kept", "cartesian Axis [min,max,unit]"),
    p("P3", "G", "비례 직선 점선 겹침", true, "오개념 교정", "kept", "line dash; Predict.reveal.marks stay hidden until answered"),
    p("P4", "X", "33, 83 라벨", false, "검산: 100·1/3=33.3, 100·10/12=83.3 맞음", "kept", "MarkOpts.label"),
  ]),
  row(4, [
    p("P1", "T", "단계별 진행", true, "", "kept", "TimeSpec steps + Steps scene: Each step advances the figure's steps index"),
    p("P2", "G", "마지막 단계 효소 모양 = 처음", true, "효소 불소모", "kept", "같은 path 명령(step 0과 3에서 enzymeShape open)"),
    p("P3", "G", "유도적합 변형", false, "", "approx", "활성 부위 꼭짓점이 바뀌는 두 정적 모양일 뿐 감싸는 변형 과정은 보이지 않는다"),
    p("P4", "Q", "kcat 예시", false, "", "kept", "label"),
    p("P5", "X", "2차원 모식도 표기", true, "", "kept", "label"),
  ]),
  row(5, [
    p("P1", "Q", "MM 적분형 시뮬레이션, 노이즈 σ=0.005", true, "brief에 ε·l이 없어 흡광도→[P] 환산은 5.5 mM⁻¹로 가정", "kept", "model + ode(RK4) + rng 노이즈"),
    p("P2", "I", "구간 시작·끝 핸들", true, "", "kept", "Explore.handles: Dragging a handle mark sets params x to its data coordinate"),
    p("P3", "E", "소모 10% 이내 배경 띠, 밖이면 과소추정 수치", true, "", "kept", "rect fill soft + root로 t10 계산; slope-val label"),
    p("P4", "S", "inset 남은 [S] 막대", false, "", "approx", "inset 대신 같은 프레임 안 rect 막대라 별도 축이 없다"),
    p("P5", "X", "기울기와 참값 차이 %", true, "", "kept", "label Text 함수"),
  ]),
  row(6, [
    p("P1", "I", "Vmax·Km 핸들 직접 드래그", true, "", "kept", "Explore.handles mark km-pt x:km, vmax-h y:vmax"),
    p("P2", "Q", "8농도, 참값 Km 2·Vmax 100, 5% 노이즈, SSR", true, "", "kept", "model + rng(6) + label"),
    p("P3", "I", "x축 선형/log 전환", false, "", "lost", "cartesian log는 frame 생성 시 고정이고 param으로 바꿀 수 없다"),
    p("P4", "E", "Vmax/2와 Km 교점 강조", true, "", "kept", "dot size l tone focus + Scene focus"),
    p("P5", "T", "SSR 110% 이내 성공 표시", false, "", "kept", "Explore.goal.done"),
  ], ["param-log-scale"]),
  row(7, [
    p("P1", "S", "좌우 small multiples 같은 축", true, "", "kept", "multiples: one copy per value, sharing frame, axes"),
    p("P2", "Q", "[I]=Ki: 경쟁 Km_app=2Km, 비경쟁 Vmax/2", true, "검산 맞음", "kept", "model inh (ratio 1 기본)"),
    p("P3", "I", "[I]/Ki 0~5 두 패널 동시", false, "", "kept", "multiples sharing knobs"),
    p("P4", "E", "경쟁적 패널에서 높은 [S] 수렴 강조", true, "", "kept", "params.kind 조건 arrow + label; x 범위 20 mM에서는 수렴이 다 보이지 않아(20 mM에서 83 vs 91) 화살표로 방향만 보인다"),
  ]),
  row(8, [
    p("P1", "Q", "경쟁적 데이터 Km 2→6, Vmax 동일", true, "", "kept", "dot 좌표 = mm(s,2,100), mm(s,6,100)"),
    p("P2", "X", "축 라벨·단위만, 힌트 없음", true, "", "kept", "axis label + Axis unit; QuizItem.figure"),
  ]),
  row(9, [
    p("P1", "S", "왼→오 단계 흐름", true, "", "kept", "inset without source: whole figure as thumbnail, placed at box; arrow"),
    p("P2", "X", "단계별 주의점 한 줄", true, "", "kept", "label"),
  ]),
];
