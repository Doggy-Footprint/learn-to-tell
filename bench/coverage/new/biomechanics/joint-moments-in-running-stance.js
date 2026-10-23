// @ts-check
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, line, circle, arrow, label, dim, angle, rect, axis, dot, legend, multiples } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  const H = 1.75, L1 = 0.245 * H, L2 = 0.246 * H, LF = 0.152 * H, ANK = 0.08, MG = 70 * 9.81, BWLEN = 0.2;
  /** Two-link leg: hip above x=0, ankle above foot x, knee forward of the hip–ankle chord. @param {number} xf @param {number} flexDeg */
  const leg = (xf, flexDeg) => {
    const fr = (flexDeg * Math.PI) / 180;
    const d = Math.sqrt(L1 * L1 + L2 * L2 + 2 * L1 * L2 * Math.cos(fr));
    const hip = pt(0, ANK + Math.sqrt(Math.max(0, d * d - xf * xf)));
    const ank = pt(xf, ANK);
    const dx = ank[0] - hip[0], dy = ank[1] - hip[1];
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const knee = pt(hip[0] + (a * dx) / d - (h * dy) / d, hip[1] + (a * dy) / d + (h * dx) / d);
    return { hip, knee, ank, toe: pt(xf + LF * 0.7, 0), heel: pt(xf - LF * 0.3, 0), com: pt(0, hip[1] + 0.1) };
  };
  /** Perpendicular foot and length from p to the line through a with direction u. @param {import("ltt").P} p @param {import("ltt").P} a @param {import("ltt").P} u */
  const perp = (p, a, u) => {
    const n = Math.hypot(u[0], u[1]), ux = u[0] / n, uy = u[1] / n;
    const s = (p[0] - a[0]) * ux + (p[1] - a[1]) * uy;
    const f = pt(a[0] + s * ux, a[1] + s * uy);
    return { foot: f, len: Math.hypot(p[0] - f[0], p[1] - f[1]) };
  };
  const stance = api.model({ xf: 0.3, flex: 10, bw: 1.6, tilt: 15, toCom: true }, (p) => {
    const g = leg(p.xf, p.flex);
    const cop = pt(p.xf, 0);
    const u = p.toCom ? pt(g.com[0] - cop[0], g.com[1] - cop[1]) : pt(-Math.sin((p.tilt * Math.PI) / 180), Math.cos((p.tilt * Math.PI) / 180));
    const n = Math.hypot(u[0], u[1]);
    const F = p.bw * MG;
    const k = perp(g.knee, cop, u);
    return { ...g, cop, u: pt(u[0] / n, u[1] / n), F, arm: k.len, armFoot: k.foot, moment: F * k.len, horizBW: (p.bw * Math.abs(u[0])) / n };
  }, "2D 정적 근사: 관절 모멘트 ≈ |GRF| × 관절–작용선 수직 거리; 분절 비율 Winter(신장 대비)");

  /** @param {import("ltt").Outputs} s @param {boolean} showArm */
  const body = (s, showArm) => {
    const tip = pt(s.cop[0] + s.u[0] * BWLEN * (s.F / MG), s.cop[1] + s.u[1] * BWLEN * (s.F / MG));
    return [
      line([pt(-0.5, 0), pt(0.7, 0)], { id: "ground", tone: "muted" }),
      line([s.hip, s.knee], { id: "thigh" }), line([s.knee, s.ank], { id: "shank" }), line([s.heel, s.ank, s.toe], { id: "foot" }),
      [s.hip, s.knee, s.ank].map((j, i) => circle(j, 0.02, { id: ["hip", "knee", "ankle"][i] })),
      dot(s.com, { id: "com", label: "질량중심" }),
      arrow(s.cop, tip, { id: "grf", tone: "focus", weight: "bold", label: `GRF ${(s.F / MG).toFixed(1)} BW = ${s.F.toFixed(0)} N` }),
      line([s.cop, pt(s.cop[0] + s.u[0] * 1.3, s.cop[1] + s.u[1] * 1.3)], { id: "action-line", dash: true, tone: "focus" }),
      showArm && [
        line([s.knee, s.armFoot], { id: "arm", tone: s.moment <= 120 ? "good" : "warn", weight: "bold" }),
        label(pt(0.45, 1.1), "발 위치를 당기려면 케이던스 +5–10%", { id: "cadence-hint", size: "s" }),
        angle(s.armFoot, s.knee, s.cop, { id: "right-angle", text: "90°" }),
        dim(s.knee, s.armFoot, `${(s.arm * 100).toFixed(1)} cm`, { id: "arm-dim" }),
        label(pt(0.45, 1.2), `무릎 모멘트 ${s.moment.toFixed(0)} N·m (${(s.moment / 70).toFixed(2)} N·m/kg)`, { id: "moment-t" }),
      ],
      legend([{ tone: "focus", text: "GRF 길이: 1 BW = 0.2 m (공간 축척과 별도)" }], { id: "force-scale" }),
      label(pt(0.1, -0.08), "2D 시상면 단순화, 근육 미표시", { id: "simplify", tone: "muted", size: "s" }),
    ];
  };
  const frame = () => cartesian({ x: [-0.5, 0.7, "m"], y: [-0.1, 1.3, "m"], aspect: "equal", static: "측면 하지 막대 모형" });
  const model = figure(frame(), (m, _t, { params }) => body(m.stance, params.showArm === true));

  const wrench = api.model({ hx: 0, hy: 1 }, (p) => {
    const th = (Math.atan2(p.hy, p.hx) * 180) / Math.PI;
    const t = Math.max(0, Math.min(180, th)), r = 0.25, F = 100;
    return { theta: t, d: r * Math.sin((t * Math.PI) / 180), tau: F * r * Math.sin((t * Math.PI) / 180) };
  }, "τ = F·r·sinθ");
  const wrenchFig = figure(cartesian({ x: [-0.1, 0.45, "m"], y: [-0.2, 0.3, "m"], aspect: "equal", static: "렌치 토크" }), (m) => {
    const w = m.wrench, a = (w.theta * Math.PI) / 180;
    const end = pt(0.25, 0), dir = pt(Math.cos(a), Math.sin(a));
    const s = perp(pt(0, 0), end, dir);
    return [
      circle(pt(0, 0), 0.015, { id: "bolt", fill: "solid" }),
      line([pt(0, 0), end], { id: "handle", weight: "bold" }),
      arrow(end, pt(0.25 + 0.15 * dir[0], 0.15 * dir[1]), { id: "force", label: "100 N" }),
      dot(pt(0.25 + 0.15 * dir[0], 0.15 * dir[1]), { id: "force-handle", size: "l" }),
      line([pt(0.25 - 0.4 * dir[0], -0.4 * dir[1]), pt(0.25 + 0.4 * dir[0], 0.4 * dir[1])], { id: "wline", dash: true, tone: "muted" }),
      line([pt(0, 0), s.foot], { id: "d", tone: "focus", weight: "bold" }),
      angle(s.foot, pt(0, 0), end, { id: "perp-mark", text: "90°" }),
      label(pt(0.2, 0.27), `θ = ${w.theta.toFixed(0)}°, d = ${w.d.toFixed(3)} m, τ = F·r·sinθ = ${w.tau.toFixed(1)} N·m`, { id: "tau" }),
    ];
  });

  const butterfly = figure(cartesian({ x: [-0.2, 0.4, "m"], y: [0, 0.6, "m"], aspect: "equal", loop: { ms: 2500, span: [0, 0.25] } }), (_m, t) => [
    line([pt(-0.05, 0), pt(0.2, 0)], { id: "sole", weight: "bold" }),
    Array.from({ length: 26 }, (_, i) => {
      const ti = i * 0.01, ph = ti / 0.25;
      const fz = 2.4 * Math.sin(Math.PI * ph), fx = -0.45 * Math.sin(2 * Math.PI * ph);
      const cop = -0.03 + 0.18 * ph;
      return ti <= t + 1e-9 && arrow(pt(cop, 0), pt(cop + fx * 0.2, fz * 0.2), { id: `v${i}`, tone: fx < 0 ? "series1" : "series2", weight: "thin" });
    }),
    label(pt(-0.12, 0.5), "제동 (뒤로)", { id: "brake", tone: "series1" }), label(pt(0.3, 0.5), "추진 (앞으로)", { id: "prop", tone: "series2" }),
    label(pt(0.06, 0.55), "전환점 ≈ 지지 50%", { id: "switch" }),
    label(pt(0.1, 0.03), "압력중심 뒤꿈치→앞꿈치 0.18 m", { id: "cop-t", size: "s" }),
    label(pt(0.1, 0.58), "대표 곡선 기반 재구성, 수평 ±0.45 BW·수직 2.4 BW, 1 BW = 0.2 m", { id: "rep", tone: "muted", size: "s" }),
  ]);

  const POSES = [{ name: "착지", m: { hip: 0.6, knee: 1.2, ankle: 0.4 } }, { name: "중간 지지", m: { hip: 0.9, knee: 2.6, ankle: 2.3 } }, { name: "이지", m: { hip: 0.3, knee: 0.8, ankle: 2.8 } }];
  const POSE_GEO = [[0.3, 10, 1.6, 15], [0.0, 40, 2.4, 0], [-0.25, 20, 1.5, -15]];
  const stepsFig = figure(cartesian({ x: [-0.5, 1.6, "m"], y: [-0.1, 1.3, "m"], aspect: "equal", steps: POSES.map((p) => p.name) }), (_m, _t, { step }) => {
    const [xf, fl, bw, tilt] = POSE_GEO[step];
    const g = leg(xf, fl), cop = pt(xf, 0), a = (tilt * Math.PI) / 180, u = pt(-Math.sin(a), Math.cos(a));
    const mm = POSES[step].m, mx = Math.max(mm.hip, mm.knee, mm.ankle);
    return [
      line([g.hip, g.knee], { id: "thigh" }), line([g.knee, g.ank], { id: "shank" }), line([g.heel, g.ank, g.toe], { id: "foot" }),
      arrow(cop, pt(cop[0] + u[0] * bw * BWLEN, u[1] * bw * BWLEN), { id: "grf", tone: "focus", weight: "bold" }),
      [g.hip, g.knee, g.ank].map((j, i) => line([j, perp(j, cop, u).foot], { id: `arm-${i}`, tone: "muted" })),
      axis("y", { label: "N·m/kg (막대, 0–3 → 0–1.2 m)" }),
      Object.entries(mm).map(([k, v], i) => [
        rect(pt(0.9 + i * 0.22, 0), pt(1.05 + i * 0.22, v * 0.4), { id: `bar-${k}`, tone: v === mx ? "focus" : "muted", fill: "solid" }),
        label(pt(0.975 + i * 0.22, v * 0.4 + 0.05), `${k} ${v}`, { id: `bar-${k}-t`, size: "s" }),
      ]),
      label(pt(1.2, 1.25), "정적 근사: 분절 질량·가속 무시, 실제 역동역학 값과 ±15%", { id: "static-note", tone: "muted", size: "s" }),
    ];
  });

  const candidates = (/** @type {import("ltt").Outputs} */ s) => [
    line([s.knee, s.toe], { id: "c-foot", tone: "series3" }),
    line([s.knee, pt(s.cop[0], s.knee[1])], { id: "c-horiz", tone: "series4" }),
    line([s.knee, s.armFoot], { id: "c-perp", tone: "series5" }),
    line([s.knee, s.ank], { id: "c-shank", tone: "series6", weight: "bold" }),
  ];
  const quizFig = figure(frame(), (m) => [body(m.stance, false), candidates(m.stance), angle(m.stance.armFoot, m.stance.knee, m.stance.cop, { id: "quiz-right" })]);

  return {
    models: { stance, wrench },
    figures: { model, wrench: wrenchFig, butterfly, steps: stepsFig, pair: multiples("model", { over: { xf: [0.3, 0.1] } }), quiz: quizFig },
    scenes: [
      { type: "predict", title: "발이 몸 앞 30 cm vs 10 cm", ask: "무릎 모멘트가 큰 쪽은?", figure: "model", focus: ["grf"], params: { showArm: false, toCom: false }, input: { kind: "choice", options: [{ text: "30 cm (굴곡 10°)", params: { xf: 0.3, flex: 10, tilt: 15 }, correct: true }, { text: "10 cm (굴곡 25°)", params: { xf: 0.1, flex: 25, tilt: 5 }, feedback: "모멘트 팔을 보라." }] }, reveal: { say: "모멘트 팔이 답을 정한다.", marks: ["arm", "arm-dim", "moment-t"], params: { showArm: true } } },
      { type: "explore", title: "토크와 모멘트 팔", say: "힘 방향을 돌려 보라.", figure: "wrench", focus: ["d"], knobs: {}, handles: [{ mark: "force-handle", x: "hx", y: "hy" }] },
      { type: "explain", title: "지지기의 지면반력 벡터", say: "제동에서 추진으로.", figure: "butterfly", focus: ["switch"] },
      { type: "steps", title: "모멘트가 옮겨 가는 순서", figure: "steps", steps: POSES.map((p) => ({ say: p.name, focus: ["bar-knee", "bar-ankle"] })) },
      { type: "explore", title: "무릎 모멘트 목표 맞추기", say: "발을 끌고 굴곡을 바꿔라.", figure: "model", focus: ["arm"], knobs: { xf: [-0.05, 0.35, 0.01], flex: [5, 40, 1], showArm: true }, handles: [{ mark: "foot", x: "xf" }], goal: { say: "1.6 BW에서 ≤ 120 N·m", done: (m) => m.stance.moment <= 120 } },
      { type: "compare", title: "오버스트라이드 vs 몸 아래 착지", say: "화살표 크기는 같고 모멘트 팔만 다르다.", figure: "model", focus: ["arm", "grf"], a: { xf: 0.3, flex: 10, tilt: 15, showArm: true, toCom: false }, b: { xf: 0.1, flex: 25, tilt: 5, showArm: true, toCom: false }, labels: ["0.30 m", "0.10 m"] },
      { type: "quiz", items: [{ kind: "choice", prompt: "무릎 모멘트 팔은?", options: [{ text: "무릎→작용선 수선", correct: true }, { text: "무릎→발 거리", feedback: "작용선과 직각이 아니다." }, { text: "무릎→압력중심 수평 거리", feedback: "작용선이 기울어 있다." }, { text: "하퇴 길이", feedback: "분절 길이일 뿐이다." }], objective: "arm", figure: "quiz", params: { xf: 0.0, flex: 40, bw: 2.2, tilt: 0, toCom: false }, reveal: { marks: ["c-perp", "quiz-right"] } }] },
    ],
  };
};

const SRC = "bench/coverage/new/biomechanics/joint-moments-in-running-stance.brief.md";
/** @param {string} id @param {"Q"|"G"|"T"|"I"|"E"|"S"|"X"} cat @param {string} text @param {boolean} essential @param {string} why @param {"kept"|"approx"|"lost"|"custom"|"ambiguous"} status @param {string} note @returns {import("../../fragment").Prop} */
const P = (id, cat, text, essential, why, status, note) => (status === "kept" ? { id, cat, text, essential, why, status, by: note } : { id, cat, text, essential, why, status, diff: note });
const row = (/** @type {string} */ fig, /** @type {import("../../fragment").Prop[]} */ props, /** @type {"V"|"G"} */ verdict, /** @type {string[]} */ candidates) => ({ fig, src: SRC, corpus: /** @type {const} */ ("new-b1"), domain: "운동역학", props, verdict, custom: [], candidates });

/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row("joint-moments-in-running-stance#F1", [
    P("P1", "G", "분절 비율 0.245·0.246·0.152 × 1.75 m, 1 m = 300 px 동일 축척", true, "몸 비율", "approx", "aspect 'equal'로 x·y 같은 축척은 보장되나 1 m = 300 px 절대 값은 runtime 소유; 대퇴+하퇴 0.86 m + 발목 높이 0.08 m로 다리 길이 0.90 m에 근사"),
    P("P2", "Q", "GRF 1 BW = 60 px(=0.2 m), 별도 범례", true, "척도 분리", "approx", "GRF를 공간 좌표 길이(1 BW = 0.2 m)로 그리고 legend로 힘 척도를 밝힌다; 힘 전용 축은 없다"),
    P("P3", "G", "GRF 작용선 점선 연장", true, "모멘트 팔 기준", "kept", "line dash"),
    P("P4", "X", "2D 시상면 단순화, 근육 미표시", true, "", "kept", "label simplify"),
    P("P5", "E", "GRF 가장 굵고 진함", true, "핵심", "kept", "arrow weight bold tone focus"),
  ], "V", ["secondary-scale"]),
  row("joint-moments-in-running-stance#F2", [
    P("P1", "I", "선택 전 모멘트 팔 숨김", true, "", "kept", "Predict reveal.marks 'stay hidden until answered'"),
    P("P2", "Q", "1.6 BW(1100 N), 기울기 15° / 5°", true, "제동 방향 (확인: 1.6×686.7 = 1099 N)", "kept", "model params bw 1.6, tilt 15/5"),
    P("P3", "G", "무릎→작용선 수선과 길이 cm", true, "", "kept", "line arm + dim 'Dimension line ... with its measured text' + angle 90°"),
    P("P4", "X", "두 결과 N·m 표시", true, "값 주의: 이 분절 모형(굴곡 10°/25°, GRF 15°/5°)으로 계산하면 팔 0.017 m/0.086 m, 모멘트 약 18/95 N·m로 브리프의 0.12/0.05 m·132/55 N·m와 순서까지 뒤집힌다(굴곡이 큰 쪽 무릎이 작용선보다 더 앞)", "lost", "수치는 model 계산값으로 표시되며 브리프가 기대한 순서(30 cm 쪽이 큼)를 이 기하로는 보장하지 못한다; 원본 값을 쓰려면 illustrative 데이터로 박아야 한다"),
  ], "G", ["illustrative-overlay"]),
  row("joint-moments-in-running-stance#F3", [
    P("P1", "I", "힘 방향 드래그 핸들 0–180°", true, "수직 거리 체감", "kept", "Explore handles 'Dragging a handle mark sets params x, y', model이 atan2로 θ, 0–180 clamp"),
    P("P2", "G", "축에서 작용선까지 직각 표시 수선", true, "", "kept", "line d + angle 마크"),
    P("P3", "Q", "τ = F·r·sinθ 실시간 값", true, "확인: 25 / 12.5 N·m", "kept", "model wrench + Text"),
    P("P4", "E", "수선 d 강조색", true, "", "kept", "tone focus weight bold"),
  ], "V", []),
  row("joint-moments-in-running-stance#F4", [
    P("P1", "Q", "수평 ±0.45 BW, 수직 2.4 BW, 대표 형태", true, "", "kept", "fz=2.4 sin, fx=−0.45 sin(2π) 데이터 좌표, 1 BW = 0.2 m"),
    P("P2", "G", "압력중심이 발바닥 위에서 앞으로 0.18 m", true, "", "kept", "cop = −0.03 + 0.18·ph"),
    P("P3", "T", "순서대로 그려지는 애니메이션, 반복", false, "", "kept", "Loop{ms:2500, span:[0,0.25]}, t 이하 화살표만"),
    P("P4", "X", "제동/추진 라벨과 전환점 ~50%", true, "", "kept", "label + series1/series2 tone"),
    P("P5", "X", "대표 곡선 기반 재구성", true, "", "kept", "label rep"),
  ], "V", []),
  row("joint-moments-in-running-stance#F5", [
    P("P1", "T", "단계 버튼으로 자세 전환, 분절 보간 이동", true, "", "ambiguous", "steps index만 바뀌고 같은 id 선분이 단계 사이에 보간되는지 d.ts가 말하지 않는다"),
    P("P2", "Q", "모멘트 = GRF×팔, 막대 0–3 N·m/kg 공통 척도", true, "", "approx", "막대 값은 브리프 수치를 박았고(그림의 팔로 계산하지 않음), 막대 척도는 공간 축을 0.4 m/(N·m/kg)로 빌려 쓴다"),
    P("P3", "E", "각 단계 최대 관절 모멘트 강조", true, "무릎→발목", "kept", "최대값 막대 tone focus"),
    P("P4", "X", "정적 근사 ±15% 표기", true, "", "kept", "label static-note"),
  ], "G", ["step-tween", "secondary-scale"]),
  row("joint-moments-in-running-stance#F6", [
    P("P1", "I", "발 드래그 핸들, 굴곡 슬라이더", true, "", "kept", "handles {mark:'foot', x:'xf'} + knobs flex"),
    P("P2", "G", "GRF 작용선이 질량중심을 지나도록 제약", true, "", "kept", "model 기본 toCom:true에서 작용선 방향 u = 질량중심 − 압력중심"),
    P("P3", "Q", "무릎 모멘트 = 1100 N × 수직 거리, N·m 및 N·m/kg", true, "목표 ≤120 N·m ⇒ 팔 ≤ 0.109 m", "kept", "model moment + label moment-t"),
    P("P4", "E", "목표 달성 시 모멘트 팔 색 변화", true, "", "kept", "arm tone = moment ≤ 120 ? good : warn"),
    P("P5", "X", "케이던스 환산 힌트", false, "", "kept", "label cadence-hint"),
  ], "V", []),
  row("joint-moments-in-running-stance#F7", [
    P("P1", "S", "두 패널 동일 축척·질량중심 높이 정렬", true, "", "approx", "Compare는 같은 figure를 a/b로 나란히 보여 같은 frame·축척이지만, 질량중심 높이는 굴곡에 따라 hip 높이가 달라져 정렬되지 않는다"),
    P("P2", "Q", "수치 쌍 표시", true, "브리프 132/55 N·m(팔 0.12/0.05 m)은 이 기하로 재현되지 않음; 제동 수평 성분 0.41/0.14 BW는 1.6·sin15°=0.414, 1.6·sin5°=0.139로 맞음", "lost", "moment-t는 model 계산값을 보이고 제동 수평 성분(horizBW)은 계산되지만 그림에 표시하지 않았다"),
    P("P3", "E", "화살표 크기 같고 모멘트 팔만 다름 강조", true, "오개념 반박", "kept", "같은 bw로 grf arrow 길이 동일, arm tone warn bold"),
  ], "G", []),
  row("joint-moments-in-running-stance#F8", [
    P("P1", "I", "선분 클릭 선택", true, "", "approx", "그림 위 선분 클릭 대신 QuizItem choice 텍스트 선택지; 선분은 series 색으로 구별"),
    P("P2", "G", "정답 선분은 작용선과 직각", true, "", "kept", "perp 계산 + angle 마크, QuizReveal marks"),
    P("P3", "X", "오답 이유 한 줄", false, "", "kept", "Option.feedback"),
  ], "V", ["click-select"]),
];
