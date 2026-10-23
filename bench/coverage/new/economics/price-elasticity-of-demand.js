// @ts-check
/** @typedef {import("ltt").P} P */
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, grid, rect, line, arrow, label, dot, math, sweep, split, dim } = api;
  const mid = (/** @type {number} */ a, /** @type {number} */ b) => (b - a) / ((a + b) / 2);
  const ab = model({ p0: 9900, q0: 10000, p1: 12900, q1: 7000 }, ({ p0, q0, p1, q1 }) => {
    const dP = mid(p0, p1), dQ = mid(q0, q1);
    return { tr0: (p0 * q0) / 1e4, tr1: (p1 * q1) / 1e4, dP, dQ, E: Math.abs(dQ / dP), simpleUp: (p1 - p0) / p0, simpleDown: (p0 - p1) / p1,
      gain: (p1 - p0) * q1, loss: p0 * (q0 - q1) };
  }, "월매출 = 가격×가입자; 중간점 공식 %Δ = Δ/평균");
  const shift = model({ price: 9900, panel: "move" }, ({ price, panel }) => ({ q: 40000 - 3 * price, panel }), "brief 예시 수요 Q=40,000−3P, 이동 후 Q=30,000−3P");
  const lin = model({ P: 9000 }, ({ P }) => ({ P, Q: 20000 - P, E: P / (20000 - P), TR: P * (20000 - P) }), "Q=20,000−P; 점탄력성 |E|=|dQ/dP|·P/Q = P/Q");
  const seg = model({ seg: "student" }, ({ seg }) => {
    const E = seg === "student" ? 2.0 : 0.4, p0 = 9900, p1 = 12900, q0 = 5000;
    const r = -E * mid(p0, p1); // (q1-q0)/((q0+q1)/2) = r
    const q1 = (q0 * (1 + r / 2)) / (1 - r / 2);
    return { E, p0, p1, q0, q1, dTR: p1 * q1 - p0 * q0 };
  }, "중간점 탄력성 정의를 Q1에 대해 풂");

  /** @type {import("ltt").Axis} */ const QA = [0, 40000, "명"];
  /** @type {import("ltt").Axis} */ const PA = [0, 14000, "원"];
  return {
    models: { ab, shift, lin, seg },
    figures: {
      f1: figure(cartesian({ x: [0, 3, "요금"], y: [0, 10000, "만 원"], static: "인상 전후 월매출 막대" }), (m) => [
        axis("y", { label: "월매출(만 원)", ticks: [0, 2000, 4000, 6000, 8000, 10000] }),
        rect([0.4, 0], [1.2, m.ab.tr0], { id: "bar-before", fill: "solid", tone: "series1", label: "9,900원 × 10,000명" }),
        rect([1.8, 0], [2.6, m.ab.tr1], { id: "bar-after", fill: "solid", tone: "series2", label: "12,900원 × 7,000명" }),
        rect([1.8, m.ab.tr1], [2.6, m.ab.tr0], { id: "loss", fill: "solid", tone: "bad", label: (mm) => `${Math.round(mm.ab.tr1 - mm.ab.tr0)}만 원` }),
        label([1.5, -300], (mm) => `가격 +${(mm.ab.simpleUp * 100).toFixed(1)}%, 가입자 −30%`, { id: "ratios", anchor: "n" }),
      ]),
      f2: figure(cartesian({ x: QA, y: PA, loop: { ms: 2000, span: [0, 1], once: true } }), (m, t, ctx) => {
        const move = ctx.params.panel !== "shift";
        /** @param {number} a */ const curve = (a) => /** @type {P[]} */ ([[a, 0], [a - 3 * 14000, 14000]].map(([q, p]) => [Math.max(q, 0), q < 0 ? a / 3 : p]));
        const k = move ? 40000 : 40000 - 10000 * t;
        return [axis("x", { label: "수요량 Q" }), axis("y", { label: "가격 P" }),
          line(curve(40000), { id: "D0", tone: move ? "focus" : "muted" }),
          move ? [dot([10300, 9900], { id: "A", label: "A" }), dot([1300, 12900], { id: "B", label: "B" }), arrow([10300, 9900], [1300, 12900], { id: "along", tone: "focus" })]
            : [line(curve(k), { id: "D1", tone: "focus", label: "Q=30,000−3P" }), arrow([25000, 5000], [25000 - 10000 * t, 5000], { id: "shift-arrow", tone: "focus" })],
          label([20000, 13500], move ? "수요량의 변화(가격 원인)" : "수요의 변화(가격 외 원인)", { id: "title" })];
      }),
      f3: figure(cartesian({ x: [-50, 50, "%"], y: [0, 3, ""], static: "가격·수요량 변화율 막대" }), (m) => {
        const dP = m.ab.dP * 100, dQ = m.ab.dQ * 100;
        return [axis("x", { ticks: [-50, -25, 0, 25, 50] }),
          rect([0, 2], [dP, 2.5], { id: "bar-p", fill: "solid", tone: "series1", label: `가격 +${dP.toFixed(1)}%` }),
          rect([dQ, 1], [0, 1.5], { id: "bar-q", fill: "solid", tone: "series2", label: `수요량 ${dQ.toFixed(1)}%` }),
          line([[-dP, 0.8], [-dP, 1.7]], { id: "unit", dash: true, tone: "ref", weight: "bold", label: "|E|=1 경계" }),
          rect([-50, 0.8], [-dP, 1.7], { id: "elastic-zone", fill: "soft", tone: "warn", label: "탄력적" }),
          rect([-dP, 0.8], [0, 1.7], { id: "inelastic-zone", fill: "soft", tone: "muted", label: "비탄력적" }),
          math([30, 1.2], `|E|=\\frac{|\\%\\Delta Q|}{|\\%\\Delta P|}=${m.ab.E.toFixed(2)}`, { id: "formula" })];
      }),
      f4calc: figure(cartesian({ x: [0, 10, ""], y: [0, 5, ""], steps: ["ΔQ/평균Q", "ΔP/평균P", "비", "판정"] }), (m, t, ctx) => [
        ["\\frac{-3000}{8500}=-35.3\\%", "\\frac{3000}{11400}=26.3\\%", "\\frac{35.3}{26.3}=1.34", "1.34>1\\Rightarrow\\text{탄력적}"].map((s, i) => i <= ctx.step && math([1, 4 - i], s, { id: `line-${i}`, tone: i === ctx.step ? "focus" : "muted" })),
        label([6, 0.5], (mm) => `단순 변화율: 인상 +${(mm.ab.simpleUp * 100).toFixed(1)}%, 인하 ${(mm.ab.simpleDown * 100).toFixed(1)}% / 중간점 ±${(mm.ab.dP * 100).toFixed(1)}%`, { id: "simple", size: "s" }),
      ]),
      f4mini: figure(cartesian({ x: [0, 12000, "명"], y: [0, 14000, "원"], steps: ["ΔQ/평균Q", "ΔP/평균P", "비", "판정"] }), (m, t, ctx) => [
        axis("x"), axis("y"), line([[0, 19900], [12000, 7900]], { id: "D" }),
        dot([10000, 9900], { label: "A" }), dot([7000, 12900], { label: "B" }),
        ctx.step === 0 && dim([7000, 9000], [10000, 9000], "ΔQ = −3,000", { id: "dq", tone: "focus" }),
        ctx.step === 1 && dim([6000, 9900], [6000, 12900], "ΔP = 3,000", { id: "dp", tone: "focus" }),
        ctx.step >= 2 && line([[10000, 9900], [7000, 12900]], { id: "arc", tone: "focus", weight: "bold" })]),
      f4: split(["f4calc", "f4mini"]),
      f5: figure(cartesian({ x: [0, 12000, "명"], y: PA, static: "총수입 사각형, 얻는 넓이 대 잃는 넓이" }), (m) => [
        axis("x", { label: "수요량 Q" }), axis("y", { label: "가격 P" }), line([[0, 19900], [12000, 7900]], { id: "D", label: "수요곡선" }),
        rect([0, 0], [7000, 9900], { id: "kept", fill: "soft", tone: "muted" }),
        rect([0, 9900], [7000, 12900], { id: "gain", fill: "solid", tone: "good", label: (mm) => `+${(mm.ab.gain / 1e4).toLocaleString()}만 원` }),
        rect([7000, 0], [10000, 9900], { id: "lose", fill: "solid", tone: "bad", label: (mm) => `−${(mm.ab.loss / 1e4).toLocaleString()}만 원` }),
      ]),
      f6d: figure(cartesian({ x: [0, 20000, "원"], y: [0, 20000, "명"], static: "직선 수요곡선" }), (m) => [
        axis("x", { label: "가격 P" }), axis("y", { label: "수요량 Q" }),
        line([[10000, 10000], [20000, 0]], { id: "elastic", tone: "warn", weight: "bold", label: "탄력적 |E|>1" }),
        line([[0, 20000], [10000, 10000]], { id: "inelastic", tone: "series3", weight: "bold", label: "비탄력적 |E|<1" }),
        dot([m.lin.P, m.lin.Q], { id: "h", tone: "focus", size: "l", label: (mm) => `|E| = ${mm.lin.E.toFixed(2)}` }),
        label([18000, 19000], "예시용 가상 수요", { id: "illustrative", size: "s", tone: "muted" })]),
      f6tr: figure(cartesian({ x: [0, 20000, "원"], y: [0, 1.1e8, "원"], static: "총수입 곡선" }), (m) => [
        axis("x", { label: "가격 P" }), axis("y", { label: "총수입 TR" }),
        line(Array.from({ length: 101 }, (_, i) => /** @type {P} */ ([i * 200, i * 200 * (20000 - i * 200)])), { id: "TR", curve: "smooth" }),
        sweep("x", m.lin.P, { id: "p-now", tone: "focus" }), dot([m.lin.P, m.lin.TR], { id: "tr-dot", tone: "focus", label: (mm) => `${(mm.lin.TR / 1e4).toLocaleString()}만 원` }),
        dot([10000, 1e8], { id: "tr-max", tone: "ref", label: "최대 1억 원 @ 10,000원" })]),
      f6: split(["f6d", "f6tr"], { link: "P" }),
      f7: figure(cartesian({ x: [0, 6000, "명"], y: PA, static: "고객군별 같은 인상의 총수입 변화" }), (m) => {
        const s = m.seg;
        return [axis("x", { label: "가입자" }), axis("y", { label: "가격" }),
          line([[s.q0, s.p0], [s.q1, s.p1]], { id: "D", weight: "bold" }),
          rect([0, 0], [s.q0, s.p0], { id: "tr0", fill: "none", tone: "muted" }),
          rect([0, 0], [s.q1, s.p1], { id: "tr1", fill: "soft", tone: s.dTR < 0 ? "bad" : "good", label: `${Math.round(s.q0)}명 → ${Math.round(s.q1)}명` }),
          label([3000, 13600], `|E|=${s.E}, TR ${s.dTR < 0 ? "" : "+"}${Math.round(s.dTR / 1e4).toLocaleString()}만 원`, { id: "dtr", tone: s.dTR < 0 ? "bad" : "good" }),
          label([3000, 13000], s.E > 1 ? "대체재 많음·지출 비중 큼" : "업무 필수·대체재 적음", { id: "why", size: "s" })];
      }),
      f7m: api.multiples("f7", { over: { seg: ["student", "business"] } }),
      f8: figure(cartesian({ x: [0, 3, "|E|"], y: [0, 2, "가격 변화"], static: "탄력성 × 가격 방향 총수입 판정표" }), () => [
        ["|E|>1", "|E|=1", "|E|<1"].map((c, i) => label([i + 0.5, 2.1], c, { anchor: "s" })),
        label([-0.05, 1.5], "인상", { anchor: "e" }), label([-0.05, 0.5], "인하", { anchor: "e" }),
        rect([0, 1], [1, 2], { id: "case", fill: "soft", tone: "focus" }), dot([0.8, 1.2], { id: "case-dot", tone: "focus", label: "장면 1: |E|=1.34" }),
        [[0, 1, "down"], [1, 1, "flat"], [2, 1, "up"], [0, 0, "up"], [1, 0, "flat"], [2, 0, "down"]].map(([c, r, d]) => {
          const x = Number(c) + 0.5, y = Number(r) + 0.5;
          return arrow(d === "flat" ? [x - 0.3, y] : [x, d === "up" ? y - 0.3 : y + 0.3], d === "flat" ? [x + 0.3, y] : [x, d === "up" ? y + 0.3 : y - 0.3], { id: `tr-${c}-${r}` });
        }),
        label([1.5, -0.15], "탄력성은 구간마다 다르므로 테스트 범위 밖으로 외삽 금지", { id: "note", anchor: "n", size: "s", tone: "warn" })]),
    },
    scenes: [
      { type: "predict", title: "가입자 30% 감소, 매출은 늘까 줄까", ask: "12,900원으로 올리면 월매출은?", figure: "f1", focus: ["ratios"],
        input: { kind: "choice", options: [{ text: "감소", correct: true }, { text: "증가", feedback: "단가 상승분보다 가입자 감소 효과가 크다" }] },
        reveal: { say: "9,900만 → 9,030만 원", marks: ["bar-before", "bar-after", "loss"] }, targets: "가격을 올리면 매출이 늘어난다" },
      { type: "compare", title: "곡선 위의 이동 vs 곡선의 이동", say: "같은 축", figure: "f2", focus: ["along", "shift-arrow"], a: { panel: "move" }, b: { panel: "shift" }, labels: ["수요량의 변화(가격 원인)", "수요의 변화(가격 외 원인)"] },
      { type: "steps", title: "중간점 공식으로 계산하기", figure: "f4", steps: [{ say: "ΔQ", focus: ["line-0", "dq"] }, { say: "ΔP", focus: ["line-1", "dp"] }, { say: "비", focus: ["line-2", "arc"] }, { say: "판정", focus: ["line-3"] }] },
      { type: "explore", title: "같은 곡선, 다른 탄력성", say: "가격점을 끌어 본다", figure: "f6", focus: ["h", "tr-dot"], knobs: { P: [0, 20000, 100] }, handles: [{ mark: "h", x: "P" }],
        goal: { say: "TR이 최대가 되는 가격을 찾아라", done: (m) => m.lin.P === 10000 } },
      { type: "explore", title: "탄력적인 고객, 비탄력적인 고객", say: "같은 인상", figure: "f7m", focus: ["dtr"], knobs: { seg: ["student", "business"] } },
    ],
  };
};

const SRC = "bench/coverage/new/economics/price-elasticity-of-demand.brief.md";
/** @param {string} fig @param {import("../../fragment").Prop[]} props @param {string[]} [candidates] @returns {import("../../fragment").AuditRow} */
const row = (fig, props, candidates = []) => {
  const ess = props.filter((p) => p.essential);
  const verdict = ess.some((p) => p.status === "lost" || p.status === "ambiguous") ? "G" : "V";
  return { fig: `price-elasticity-of-demand#${fig}`, src: SRC, corpus: "new-b1", domain: "경제학", props, verdict, custom: [], candidates };
};
/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row("F1", [
    { id: "P1", cat: "Q", text: "세로축 월매출(만 원), 0 시작, 0~10,000", essential: true, why: "0이 아닌 축은 과장", status: "kept", by: "Axis [0,10000,'만 원']; rect 높이 model tr0=9,900, tr1=9,030" },
    { id: "P2", cat: "I", text: "막대 공개 전 증가/감소 선택 필수", essential: true, why: "예측 후 공개", status: "kept", by: "Predict 'reveal.marks stay hidden until answered'" },
    { id: "P3", cat: "X", text: "'가격 +30.3%, 가입자 −30%' 표기", essential: true, why: "", status: "kept", by: "label Text 함수" },
    { id: "P4", cat: "E", text: "차액 −870만 원 붉은 구간", essential: true, why: "", status: "kept", by: "rect tone 'bad'" },
  ]),
  row("F2", [
    { id: "P1", cat: "S", text: "좌우 두 패널, 축 범위 동일(P 0~14,000, Q 0~40,000)", essential: true, why: "", status: "kept", by: "Compare 'Same figure under params a and b, side by side'" },
    { id: "P2", cat: "G", text: "왼쪽 점이 곡선 따라 이동 화살표, 오른쪽 곡선 평행이동 화살표", essential: true, why: "brief 값 검증: Q(9,900)=10,300, Q(12,900)=1,300 맞음. 단 F1의 10,000→7,000과 다른 곡선이다", status: "kept", by: "arrow A→B, arrow shift-arrow; line D1" },
    { id: "P3", cat: "T", text: "왼쪽 가격 슬라이드 점 이동, 오른쪽 2초 곡선 이동 애니메이션", essential: false, why: "", status: "approx", diff: "Compare에는 knobs가 없어 왼쪽 가격 슬라이더가 없다; 오른쪽은 Loop ms 2000 once로 재생" },
    { id: "P4", cat: "X", text: "패널 제목", essential: true, why: "", status: "kept", by: "Compare.labels" },
  ]),
  row("F3", [
    { id: "P1", cat: "Q", text: "두 막대 같은 % 눈금(−50~+50%)", essential: true, why: "brief 값 검증: 26.3%, −35.3%, 1.34 맞음", status: "kept", by: "한 cartesian x [-50,50,'%']" },
    { id: "P2", cat: "G", text: "탄력적/비탄력적 영역 표시", essential: true, why: "", status: "kept", by: "rect elastic-zone/inelastic-zone, 경계 x=−%ΔP" },
    { id: "P3", cat: "X", text: "공식 |E|=|%ΔQ|/|%ΔP|", essential: true, why: "", status: "kept", by: "math(at, tex)" },
    { id: "P4", cat: "E", text: "|E|=1 기준선 점선", essential: true, why: "", status: "kept", by: "line dash:true weight bold" },
  ]),
  row("F4", [
    { id: "P1", cat: "T", text: "단계 버튼 한 줄씩 공개, 수요곡선 미니 그림 해당 구간 하이라이트", essential: true, why: "", status: "kept", by: "split 'Both share t, step'; TimeSpec steps; ctx.step" },
    { id: "P2", cat: "Q", text: "단순 변화율(+30.3%, −23.3%) vs 중간점(±26.3%)", essential: false, why: "값 검증 맞음", status: "kept", by: "model simpleUp/simpleDown/dP" },
    { id: "P3", cat: "X", text: "각 단계 수식과 숫자", essential: true, why: "", status: "kept", by: "math marks" },
  ]),
  row("F5", [
    { id: "P1", cat: "G", text: "사각형 넓이 = P×Q 축척대로", essential: true, why: "", status: "kept", by: "rect corner가 데이터 단위; 선형 축에서 넓이 비 보존" },
    { id: "P2", cat: "E", text: "얻는 초록 2,100만 vs 잃는 빨강 2,970만", essential: true, why: "값 검증 맞음", status: "kept", by: "rect tone good/bad" },
    { id: "P3", cat: "X", text: "두 사각형 안 금액", essential: true, why: "", status: "approx", diff: "rect label 위치가 사각형 안인지 d.ts가 정하지 않는다" },
    { id: "P4", cat: "Q", text: "축 P 0~14,000원, Q 0~12,000명", essential: true, why: "", status: "kept", by: "Axis" },
  ], ["label-inside"]),
  row("F6", [
    { id: "P1", cat: "S", text: "수요곡선(위)과 TR(아래) 같은 가격축 공유 세로 정렬", essential: true, why: "중점과 TR 최대가 같은 가격", status: "ambiguous", diff: "split은 배치 방향과 x축 정렬을 말하지 않는다(link는 강조만)" },
    { id: "P2", cat: "I", text: "가격 핸들 드래그(100원 단위)", essential: true, why: "", status: "kept", by: "Explore.handles {mark:'h', x:'P'}; knobs P step 100" },
    { id: "P3", cat: "Q", text: "|E|=P/Q 실시간, P=10,000에서 1, TR 최대 1억", essential: true, why: "값 검증 맞음", status: "kept", by: "model lin; Text 함수 재평가" },
    { id: "P4", cat: "G", text: "위 절반 탄력적, 아래 절반 비탄력적 색 구분", essential: true, why: "", status: "kept", by: "두 line tone warn/series3" },
    { id: "P5", cat: "I", text: "목표: TR 최대 가격 찾기", essential: false, why: "", status: "kept", by: "Explore.goal" },
    { id: "P6", cat: "X", text: "'예시용 가상 수요'", essential: true, why: "", status: "kept", by: "label" },
  ], ["split-stack-shared-axis"]),
  row("F7", [
    { id: "P1", cat: "S", text: "좌우 small multiples, 동일 축", essential: true, why: "", status: "kept", by: "multiples 'one copy per value, sharing frame, axes'" },
    { id: "P2", cat: "Q", text: "학생 5,000→약 2,370명, 업무 5,000→약 4,470명(중간점 일관)", essential: true, why: "brief 값 오류: 중간점 |E|=2, %ΔP=26.3%면 학생 2,917명, |E|=0.4면 업무 4,500명", status: "approx", diff: "model이 중간점 정의로 풀어 학생 2,917명·업무 4,500명을 그린다(brief 수치와 다름)" },
    { id: "P3", cat: "E", text: "TR 변화 부호 색(학생 −1,890만, 업무 +830만)", essential: true, why: "brief 값 오류: 올바른 값 학생 −1,187.5만 원, 업무 +855만 원", status: "approx", diff: "부호 색은 유지, 금액은 model 값 −1,188만·+855만 원으로 표시" },
    { id: "P4", cat: "X", text: "탄력성이 다른 이유 라벨", essential: false, why: "", status: "kept", by: "label why" },
  ]),
  row("F8", [
    { id: "P1", cat: "G", text: "각 칸 위/아래/수평 화살표", essential: true, why: "", status: "kept", by: "arrow from→to" },
    { id: "P2", cat: "E", text: "장면 1 사례 칸 하이라이트", essential: true, why: "", status: "kept", by: "rect tone focus, dot" },
    { id: "P3", cat: "X", text: "외삽 금지 주석", essential: true, why: "", status: "kept", by: "label note" },
  ]),
];
