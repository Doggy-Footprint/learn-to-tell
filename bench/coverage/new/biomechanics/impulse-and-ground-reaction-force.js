// @ts-check
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, rect, label, line, area, arrow, sweep, dot, axis, math, inset, multiples } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  const M = 70, G = 9.81, MG = M * G;
  const halfSine = api.model({ cadence: 170, gct: 0.25 }, (p) => {
    const step = 60 / p.cadence;
    const gct = Math.min(p.gct, step);
    const peak = (Math.PI / 2) * step / gct;
    const pts = Array.from({ length: 101 }, (_, i) => pt((i / 100) * gct * 1000, peak * Math.sin((Math.PI * i) / 100)));
    return { step, gct, peak, mean: step / gct, flight: (step - gct) * 1000, impulse: MG * step, impossible: p.gct > step, pts };
  }, "충격량-운동량: ∫F dt = mg·(60/cadence); 반사인 F=Fmax·sin(πt/GCT) ⇒ Fmax = (π/2)·mg·step/GCT");

  const timeline = figure(cartesian({ x: [0, 0.353, "s"], y: [0, 1.2, "m"], loop: { ms: 1412, span: [0, 0.353] } }), (m, t) => {
    const c = 0.25;
    const inContact = t <= c;
    const footY = inContact ? 0 : 0.12 * Math.sin((Math.PI * (t - c)) / (0.353 - c));
    const hipY = 0.9 - 0.04 * Math.sin((Math.PI * Math.min(t, c)) / c);
    return [
      axis("x", { label: "시간 (s)", ticks: [0, 0.1, 0.2, 0.25, 0.353] }),
      rect(pt(0, 0.02), pt(c, 0.1), { id: "contact", tone: "focus", fill: "solid" }),
      rect(pt(c, 0.02), pt(m.gr.step, 0.1), { id: "flight", tone: "muted", fill: "soft" }),
      label(pt(0.125, 0.06), "접촉 0.250 s", { id: "contact-t" }),
      label(pt(0.30, 0.06), "체공 0.103 s", { id: "flight-t" }),
      [0.0, 0.125, 0.25, 0.3].map((ts, i) => {
        const fy = ts <= c ? 0.15 : 0.27;
        return [
          line([pt(ts, 1.1), pt(ts, 0.6)], { id: `torso-${i}`, tone: "muted" }),
          line([pt(ts, 0.6), pt(ts + 0.01, fy)], { id: `leg-${i}`, tone: "muted" }),
          dot(pt(ts + 0.01, fy), { id: `foot-${i}`, tone: ts <= c ? "focus" : "muted" }),
          label(pt(ts, 1.17), ["착지", "중간 지지", "이지", "체공"][i], { id: `pose-${i}`, size: "s" }),
        ];
      }),
      line([pt(0, 0.15), pt(0.353, 0.15)], { id: "ground", weight: "thin" }),
      dot(pt(t, 0.15 + footY), { id: "foot-now", tone: "focus", size: "l" }),
      line([pt(t, hipY - 0.3), pt(t, 0.15 + footY)], { id: "leg-now" }),
      sweep("x", t, { id: "cursor", tone: "ref" }),
      label(pt(0.18, 0.4), "걸음 시간 = 60/케이던스 = 60/170 = 0.353 s", { id: "step-eq" }),
    ];
  });

  const predictModel = api.model({}, () => [0.2, 0.3].map((g) => (Math.PI / 2) * (60 / 170) / g), "Fmax = (π/2)·step/GCT BW");
  const predictFig = figure(cartesian({ x: [0, 3, ""], y: [0, 3, "BW"], static: "GCT 200/300 ms 최대 수직력 막대" }), (m) => [
    axis("y", { label: "최대 수직력 (BW)", ticks: [0, 1, 2, 3] }),
    [0, 1].map((i) => [
      rect(pt(0.5 + i * 1.3, 0), pt(1.3 + i * 1.3, 3), { id: `slot-${i}`, fill: "none", tone: "muted" }),
      rect(pt(0.5 + i * 1.3, 0), pt(1.3 + i * 1.3, m.pred[i]), { id: `bar-${i}`, tone: i === 0 ? "focus" : "series2", fill: "solid" }),
      label(pt(0.9 + i * 1.3, m.pred[i] + 0.1), `${m.pred[i].toFixed(2)} BW`, { id: `val-${i}` }),
      label(pt(0.9 + i * 1.3, -0.15), i === 0 ? "GCT 200 ms" : "GCT 300 ms", { id: `cond-${i}` }),
    ]),
    label(pt(1.5, 2.95), "반사인 근사 모델", { id: "model-note", tone: "muted", size: "s" }),
  ]);

  const defFig = figure(cartesian({ x: [0, 3, ""], y: [-1, 1.4, "m/s"], aspect: "equal", static: "운동량과 충격량" }), () => [
    rect(pt(0.3, 0.2), pt(0.7, 0.5), { id: "blk-a", fill: "soft" }), label(pt(0.5, 0.35), "70 kg", { id: "m-a" }),
    arrow(pt(0.5, 0.2), pt(0.5, 0.2 - 0.5), { id: "v-in", tone: "series1", label: "−0.50 m/s" }),
    rect(pt(1.3, 0.2), pt(1.7, 0.5), { id: "blk-b", fill: "soft" }),
    arrow(pt(1.5, -0.2), pt(1.5, 0.2), { id: "F", tone: "focus", weight: "bold", label: "F (힘 척도 별도)" }),
    label(pt(1.5, -0.3), "Δt = 접촉", { id: "dt" }),
    rect(pt(2.3, 0.2), pt(2.7, 0.5), { id: "blk-c", fill: "soft" }),
    arrow(pt(2.5, 0.5), pt(2.5, 1.0), { id: "v-out", tone: "series1", label: "+0.50 m/s" }),
    label(pt(0.5, 1.2), "착지 전", { id: "s1" }), label(pt(1.5, 1.2), "접촉", { id: "s2" }), label(pt(2.5, 1.2), "이지 후", { id: "s3" }),
    math(pt(1.5, -0.7), "J=\\int F\\,dt=\\Delta p=70\\,\\text{kg}\\times1.0\\,\\text{m/s}=70\\,\\text{N·s}\\;(\\text{N·s}=\\text{kg·m/s})", { id: "J-eq" }),
    label(pt(1.5, -0.95), "속도 화살표: 1 m/s = 화살표 길이 1 (축 단위), 중력 제외 순 충격량", { id: "scale-note", size: "s" }),
  ]);

  const grfFig = figure(cartesian({ x: [0, 353, "ms"], y: [0, 3, "BW"], static: "수직 지면반력 곡선과 넓이" }), (m, _t, { params }) => {
    const g = m.gr;
    const above = [...g.pts, pt(g.step * 1000, 1)];
    const tc = Number(params.tc ?? 0);
    const k = Math.min(1, tc / (g.gct * 1000));
    const cum = MG * g.gct * g.peak * (1 - Math.cos(Math.PI * k)) / Math.PI;
    return [
      axis("x", { label: "시간 (ms)" }), axis("y", { label: "수직 지면반력 (BW)", ticks: [0, 1, 2, 3] }),
      area(g.pts, { id: "total-area", tone: "series2", fill: "soft" }),
      area(g.pts, { id: "net-area", base: 1, tone: "focus", fill: "solid" }),
      rect(pt(g.gct * 1000, 0), pt(g.step * 1000, 1), { id: "debt", tone: "warn", fill: "soft" }),
      line(above, { id: "curve", weight: "thin" }),
      sweep("y", 1, { id: "bw-line", tone: "ref", label: "1 BW = 686.7 N" }),
      label(pt(120, 0.5), `전체 넓이 = mg×${g.step.toFixed(3)} s = ${g.impulse.toFixed(0)} N·s`, { id: "total-t" }),
      label(pt(125, 1.6), `1 BW 위 순 넓이 ${(MG * g.gct * (2 * g.peak / Math.PI - 1)).toFixed(1)} N·s`, { id: "net-t", tone: "focus" }),
      label(pt(300, 1.2), `체공 '빚' ${(MG * (g.step - g.gct)).toFixed(1)} N·s`, { id: "debt-t", tone: "warn" }),
      label(pt(125, g.peak + 0.12), `Fmax = ${g.peak.toFixed(2)} BW`, { id: "peak-t" }),
      sweep("x", tc, { id: "cursor" }),
      label(pt(tc, 2.9), `누적 ${cum.toFixed(0)} N·s, 수직속도 ${((cum - MG * tc / 1000) / M - 0.5).toFixed(2)} m/s`, { id: "cum-t", size: "s" }),
    ];
  });

  const stepsFig = figure(cartesian({ x: [0, 0.4, "s"], y: [0, 3, "BW"], steps: ["① 걸음 시간", "② 충격량 직사각형", "③ 접촉 시간으로 좁힘", "④ 반사인"] }), (m, _t, { step }) => {
    const g = m.gr;
    const w = step >= 2 ? g.gct : g.step, h = step >= 2 ? g.mean : 1;
    const eq = ["걸음 시간 = 60/170 = 0.353 s", "J = mg × 0.353 s = 242 N·s (높이 1 BW)", "높이 = 242 / 0.250 = 970 N = 1.41 BW", "반사인 피크 = (π/2)·1.41 = 2.22 BW"][step];
    return [
      axis("y", { label: "BW", ticks: [0, 1, 2, 3] }), axis("x", { label: "s" }),
      step >= 1 && rect(pt(0, 0), pt(w, h), { id: "impulse-rect", tone: "focus", fill: step >= 3 ? "none" : "solid" }),
      step === 0 && line([pt(0, 0.05), pt(g.step, 0.05)], { id: "step-line", weight: "bold" }),
      step >= 3 && area(/** @type {import("ltt").P[]} */ (g.pts).map(([x, y]) => pt(x / 1000, y)), { id: "sine", tone: "focus" }),
      step >= 1 && label(pt(0.2, 2.8), "넓이 = 242 N·s", { id: "area-fixed", weight: "bold" }),
      label(pt(0.2, 2.5), eq, { id: "eq" }),
    ];
  });

  const exploreFig = figure(cartesian({ x: [0, 320, "ms"], y: [0, 3.5, "BW"], static: "케이던스·GCT 탐색" }), (m) => {
    const g = m.gr, ok = g.peak <= 2 && !g.impossible;
    return [
      axis("x", { label: "시간 (ms)" }), axis("y", { label: "BW" }),
      area(g.pts, { id: "curve", tone: ok ? "good" : "focus" }),
      sweep("y", 2, { id: "target", tone: "warn", label: "목표 2.0 BW" }),
      label(pt(160, 3.3), `피크 ${g.peak.toFixed(2)} BW · 평균 ${g.mean.toFixed(2)} BW · 체공 ${Math.max(0, g.flight).toFixed(0)} ms`, { id: "readout" }),
      g.impossible && label(pt(160, 3.0), "GCT가 걸음 시간보다 길 수 없음: GCT를 걸음 시간으로 제한", { id: "warn", tone: "bad" }),
      label(pt(160, 0.2), "모델: 반사인, 수평력·충격 피크 무시", { id: "model-note", tone: "muted", size: "s" }),
    ];
  });

  const T = 0.25;
  const footModel = api.model({}, () => {
    /** @param {(t: number) => number} f */
    const integ = (f) => { let s = 0; for (let i = 0; i < 2000; i++) s += f(((i + 0.5) * T) / 2000); return (s * T) / 2000; };
    const heel = (/** @type {number} */ t) => 2.4 * Math.sin((Math.PI * t) / T) ** 1.6 + 1.12 * Math.exp(-(((t - 0.03) / 0.012) ** 2));
    const A = integ(heel);
    const kf = api.root((k) => integ((t) => 2.4 * Math.sin((Math.PI * t) / T) ** k) - A, [0.3, 3]);
    const fore = (/** @type {number} */ t) => 2.4 * Math.sin((Math.PI * t) / T) ** kf;
    const ts = Array.from({ length: 126 }, (_, i) => (i * T) / 125);
    return {
      heel: ts.map((t) => pt(t * 1000, heel(t))), fore: ts.map((t) => pt(t * 1000, fore(t))),
      areaNs: A * MG, areaForeNs: integ(fore) * MG,
      lrHeel: heel(0.03) / 0.03, lrFore: fore(0.05) / 0.05,
    };
  }, { illustrative: true });
  const strikeFig = figure(cartesian({ x: [0, 250, "ms"], y: [0, 3, "BW"], static: "뒤꿈치 vs 앞꿈치 착지 지면반력" }), (m) => [
    axis("x", { label: "시간 (ms)" }), axis("y", { label: "BW" }),
    rect(pt(0, 0), pt(50, 3), { id: "early", tone: "focus", fill: "soft", opacity: 0.3 }),
    line(m.foot.heel, { id: "heel", tone: "series1", label: "뒤꿈치 착지" }),
    line(m.foot.fore, { id: "fore", tone: "series2", label: "앞꿈치 착지" }),
    label(pt(180, 2.85), `넓이: 뒤꿈치 ${m.foot.areaNs.toFixed(0)} N·s / 앞꿈치 ${m.foot.areaForeNs.toFixed(0)} N·s`, { id: "areas" }),
    label(pt(180, 2.6), `부하율: 뒤꿈치 ${m.foot.lrHeel.toFixed(0)} BW/s · 앞꿈치 ${m.foot.lrFore.toFixed(0)} BW/s`, { id: "rates", tone: "focus" }),
    label(pt(180, 0.2), "대표 형태, 개인차 큼", { id: "rep", tone: "muted", size: "s" }),
  ]);
  const zoomFig = figure(cartesian({ x: [0, 250, "ms"], y: [0, 3, "BW"], static: "0–50 ms 확대" }), () => inset("strike", { id: "zoom", source: [pt(0, 0), pt(50, 2)], at: [pt(150, 0.5), pt(245, 2.0)] }));

  const runners = [[160, 0.28], [175, 0.23], [185, 0.21]];
  const quizFig = figure(cartesian({ x: [0, 280, "ms"], y: [0, 3, "BW"], static: "주자 카드" }), (m, _t, { params }) => {
    const [c, g] = runners[Number(params.runner ?? 0)];
    const pk = (Math.PI / 2) * (60 / c) / g;
    return [
      axis("y", { ticks: [0, 1, 2, 3] }),
      label(pt(140, 2.9), `${c} spm / ${g * 1000} ms`, { id: "card" }),
      params.shown === true && [
        area(Array.from({ length: 51 }, (_, i) => pt((i / 50) * g * 1000, pk * Math.sin((Math.PI * i) / 50))), { id: "mini" }),
        label(pt(140, pk + 0.1), `피크 ${pk.toFixed(2)} BW`, { id: "pk" }),
      ],
    ];
  });

  return {
    models: { gr: halfSine, pred: predictModel, foot: footModel },
    figures: { timeline, predict: predictFig, def: defFig, grf: grfFig, steps: stepsFig, explore: exploreFig, strike: strikeFig, strikeZoom: zoomFig, strikeBoth: api.split(["strike", "strikeZoom"]), quizCard: quizFig, quizCards: multiples("quizCard", { over: { runner: [0, 1, 2] } }) },
    scenes: [
      { type: "hook", title: "같은 속도, 다른 GCT", say: "힘은 접촉 칸에만 있다.", figure: "timeline", focus: ["contact"] },
      { type: "predict", title: "GCT 200 vs 300 ms", ask: "어느 쪽 최대 수직력이 큰가?", figure: "predict", focus: ["slot-0", "slot-1"], input: { kind: "choice", options: [{ text: "200 ms", correct: true }, { text: "300 ms", feedback: "짧은 접촉 = 더 큰 힘. 같은 충격량을 더 짧은 시간에 내야 한다." }] }, reveal: { say: "2.78 BW vs 1.85 BW", marks: ["bar-0", "bar-1", "val-0", "val-1"] }, targets: "짧은 접촉 = 작은 부하" },
      { type: "define", term: "충격량", definition: "J = ∫F dt = Δp", figure: "def", focus: ["J-eq"] },
      { type: "explore", title: "곡선 아래 넓이가 속도 변화다", say: "커서를 움직여 보라.", figure: "grf", focus: ["net-area", "debt"], knobs: { tc: [0, 353, 1] } },
      { type: "steps", title: "한 걸음 평균력 4단계", figure: "steps", steps: [{ say: "①", focus: ["step-line"] }, { say: "②", focus: ["impulse-rect"] }, { say: "③", focus: ["impulse-rect"] }, { say: "④", focus: ["sine"] }] },
      { type: "explore", title: "피크 2.0 BW 이하 맞추기", say: "슬라이더를 움직여라.", figure: "explore", focus: ["target"], knobs: { cadence: [150, 190, 1], gct: [0.18, 0.32, 0.005] }, goal: { say: "피크 ≤ 2.0 BW, 체공 ≥ 0", done: (m) => m.gr.peak <= 2 && !m.gr.impossible } },
      { type: "explain", title: "뒤꿈치 vs 앞꿈치", say: "넓이는 같고 부하율이 다르다.", figure: "strikeBoth", focus: ["early", "rates"] },
      { type: "quiz", items: [{ kind: "choice", prompt: "피크 BW가 가장 큰 주자는?", options: [{ text: "185/210", correct: true }, { text: "175/230", feedback: "2.34 < 2.43" }, { text: "160/280", feedback: "2.10" }], objective: "peak", figure: "quizCards", params: { shown: false }, reveal: { params: { shown: true }, marks: ["mini", "pk"] } }] },
    ],
  };
};

const SRC = "bench/coverage/new/biomechanics/impulse-and-ground-reaction-force.brief.md";
/** @param {string} id @param {"Q"|"G"|"T"|"I"|"E"|"S"|"X"} cat @param {string} text @param {boolean} essential @param {string} why @param {"kept"|"approx"|"lost"|"custom"|"ambiguous"} status @param {string} note @returns {import("../../fragment").Prop} */
const P = (id, cat, text, essential, why, status, note) => (status === "kept" ? { id, cat, text, essential, why, status, by: note } : { id, cat, text, essential, why, status, diff: note });
const row = (/** @type {string} */ fig, /** @type {import("../../fragment").Prop[]} */ props, /** @type {"V"|"G"} */ verdict, /** @type {string[]} */ candidates) => ({ fig, src: SRC, corpus: /** @type {const} */ ("new-b1"), domain: "운동역학", props, verdict, custom: [], candidates });

/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row("impulse-and-ground-reaction-force#F1", [
    P("P1", "Q", "가로축 0–0.353 s 선형, 경계 0.250 s", true, "계산의 분모", "kept", "cartesian Axis [0,0.353,'s'] 선형(log 없음), rect 경계 데이터 좌표 0.25"),
    P("P2", "G", "접촉 칸 동안 발이 지면에, 체공 칸에서 떨어짐", true, "시간-자세 대응", "kept", "draw(t)가 t≤0.25에서 footY=0"),
    P("P3", "T", "1/4 속도 반복 재생 + 커서", false, "리듬", "kept", "Loop{ms:1412, span:[0,0.353]} 'maps span linearly onto ms' + sweep 커서"),
    P("P4", "X", "걸음 시간 = 60/케이던스 = 0.353 s", true, "변환식", "kept", "label step-eq"),
    P("P5", "E", "접촉 강조색, 체공 회색", true, "힘 구간", "kept", "tone focus fill solid / tone muted"),
  ], "V", []),
  row("impulse-and-ground-reaction-force#F2", [
    P("P1", "I", "선택 전 막대 값 숨김", true, "predict", "kept", "Predict reveal.marks 'stay hidden until answered'"),
    P("P2", "Q", "피크 = (π/2)·mg·0.353/GCT, 0–3 BW 공통 척도", true, "정확한 비교 (계산 확인: 2.77, 1.85 BW)", "kept", "model + 하나의 y Axis [0,3,'BW']"),
    P("P3", "X", "반사인 근사 모델 표기", true, "단순화", "kept", "label model-note"),
    P("P4", "E", "오개념 선택 시 문구 크게", false, "오개념 직면", "approx", "Option.feedback로 문구는 보이나 글자 크기 지정은 없다"),
  ], "V", []),
  row("impulse-and-ground-reaction-force#F3", [
    P("P1", "Q", "속도 화살표 길이 ∝ m/s (1 m/s = 80 px), 힘 화살표 별도 척도", true, "척도 분리", "approx", "y 축 단위 m/s 데이터 길이로 비례는 보장되나 px 값(80 px)은 runtime 소유; 힘 화살표 척도는 라벨로만 분리 표시(별도 축 없음)"),
    P("P2", "G", "속도 화살표 수직, 들어오는/나가는 방향 반대", true, "부호 반전", "kept", "arrow 데이터 좌표, aspect 'equal'"),
    P("P3", "X", "J = ∫F dt = Δp, N·s = kg·m/s", true, "정의 (계산 확인: 70 N·s)", "kept", "math TeX source"),
    P("P4", "S", "착지 전 / 접촉 / 이지 후 3단", true, "시간 순서", "kept", "x 0.5/1.5/2.5 배치 + 제목 label"),
  ], "V", ["secondary-scale"]),
  row("impulse-and-ground-reaction-force#F4", [
    P("P1", "Q", "F(t)=Fmax·sin(πt/GCT), Fmax=2.22 BW, mg=686.7 N", true, "계산 일치 (확인: 2.218 BW)", "kept", "model halfSine, area(pts) 데이터 단위"),
    P("P2", "Q", "전체 넓이 = mg×0.353 = 242 N·s 숫자", true, "중력 충격량", "kept", "label total-t 계산값 242"),
    P("P3", "G", "1 BW 위 넓이 = 체공 1 BW 아래 빚 넓이", true, "운동량 보존", "approx", "x축을 브리프의 0–250 ms에서 0–353 ms로 넓혀 체공 빚을 그렸다; area base 1은 접촉 초·말 1 BW 아래 부분도 같은 채움으로 칠해 순 넓이(70.6 N·s)와 빚(70.6 N·s)을 숫자로 함께 보여 준다"),
    P("P4", "I", "커서 누적 넓이·수직속도", false, "체감", "kept", "Explore knob tc + Text 계산"),
    P("P5", "E", "넓이 채움이 곡선선보다 먼저", true, "핵심은 넓이", "kept", "area fill solid tone focus, line weight thin"),
  ], "V", []),
  row("impulse-and-ground-reaction-force#F5", [
    P("P1", "T", "단계마다 넓이 유지하며 폭↓ 높이↑ 변형", true, "넓이 보존", "ambiguous", "steps는 index만 바꾸고 같은 id rect가 단계 사이에 연속 변형되는지 d.ts가 말하지 않는다"),
    P("P2", "Q", "넓이 242 N·s 고정 표시", true, "불변량 (확인: 970 N=1.41 BW)", "kept", "label area-fixed 매 단계"),
    P("P3", "X", "단계별 식 한 줄", true, "", "kept", "label eq[step]"),
    P("P4", "S", "세로축 0–3 BW 고정", true, "높이 비교", "kept", "frame y Axis [0,3,'BW'] 단일 frame"),
  ], "G", ["step-tween"]),
  row("impulse-and-ground-reaction-force#F6", [
    P("P1", "I", "두 슬라이더, 불가능 조합은 범위 밖 처리하고 경고", true, "사실만", "approx", "knob 범위는 서로 독립이라 GCT>걸음 시간을 범위 밖으로 막을 수 없다; model이 GCT를 걸음 시간으로 제한하고 경고 label을 띄운다"),
    P("P2", "Q", "피크 = (π/2)·(60/cadence)/GCT BW", true, "", "kept", "model halfSine"),
    P("P3", "E", "2.0 BW 목표선, 달성 시 곡선 색 변화", true, "판정", "kept", "sweep y=2 + tone good/focus"),
    P("P4", "X", "모델 단순화 표시", true, "", "kept", "label model-note"),
    P("P5", "G", "케이던스↑ → 같은 GCT에서 피크↓", true, "코칭 근거", "kept", "model 식이 step=60/cadence에 비례"),
  ], "V", ["dependent-knob-range"]),
  row("impulse-and-ground-reaction-force#F7", [
    P("P1", "Q", "두 곡선 넓이 동일하게 생성, 넓이 수치", true, "충격량 불변", "kept", "api.root로 앞꿈치 지수를 풀어 넓이 일치(둘 다 240 N·s; 브리프 F4의 242 N·s와 다른 걸음이며 2.4 BW 능동 피크 때문)"),
    P("P2", "Q", "초기 부하율: 뒤꿈치 약 53, 앞꿈치 약 25 BW/s", true, "차이 위치", "approx", "모델값 뒤꿈치 53.5 BW/s(충격 피크 1.6 BW/30 ms 기준), 앞꿈치 F(50 ms)/50 ms = 24 BW/s; 브리프의 '초기 50 ms'는 뒤꿈치에서는 30 ms 기준이어야 53이 나온다(50 ms 평균이면 약 22 BW/s); 능동 피크는 125 ms로 브리프의 110 ms와 다르다"),
    P("P3", "E", "0–50 ms 확대 강조", true, "핵심 차이", "kept", "inset(source,at) 'magnified source box' + rect early tone focus"),
    P("P4", "X", "대표 형태, 개인차 큼", true, "", "kept", "label rep"),
  ], "V", []),
  row("impulse-and-ground-reaction-force#F8", [
    P("P1", "Q", "피크는 F6 공식과 동일", true, "일관성 (브리프 1.92는 오류: 160/280 → 2.10 BW; 2.34, 2.43은 맞음)", "kept", "같은 식 (π/2)(60/c)/g"),
    P("P2", "I", "선택 후 공개", true, "", "kept", "QuizReveal 'Shown after a choice or numeric answer is submitted' params shown + marks"),
    P("P3", "S", "세 카드 동일 축 척도", true, "비교", "kept", "multiples 'sharing frame, axes'"),
  ], "V", []),
];
