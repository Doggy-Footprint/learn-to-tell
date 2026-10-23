// @ts-check
/** @typedef {import("ltt").P} P */
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, axis, grid, rect, line, arrow, label, path, flow, brace, split, inset } = api;
  const SPLIT = [["앱스토어 수수료", 2970], ["클라우드 비용", 1200], ["직원 급여", 3800], ["콘텐츠 라이선스", 1000], ["이윤", 930]];
  const GAP = 300;
  const fee = model({ price: 9900 }, ({ price }) => {
    let top = price + GAP * (SPLIT.length - 1), src = price;
    const bands = SPLIT.map(([name, v]) => {
      const b = { name: String(name), v: Number(v), s1: src, s0: src - Number(v), d1: top, d0: top - Number(v) };
      src -= Number(v); top -= Number(v) + GAP;
      return b;
    });
    return { bands, total: bands.reduce((a, b) => a + b.v, 0) };
  }, { illustrative: true });
  const chain = model({ mill: 250, bakery: 600, stages: "3단계" }, ({ mill, bakery, stages }) => {
    if (stages === "제빵소만") return { sales: [0, 0, bakery], va: [0, 0, bakery], inter: [0, 0, 0], sumSales: bakery, sumVA: bakery };
    const m = Math.max(mill, 100), b = Math.max(bakery, m);
    const sales = [100, m, b], inter = [0, 100, m], va = sales.map((s, i) => s - inter[i]);
    return { sales, inter, va, sumSales: sales[0] + sales[1] + sales[2], sumVA: va[0] + va[1] + va[2] };
  }, { illustrative: true });
  const app = model({ price: 9900, cloud: 1200, license: 1000, store: 2970 }, (p) => ({ ...p, va: p.price - p.cloud - p.license - p.store }), { illustrative: true });

  /** @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 @param {number} x3 @param {number} y3 */
  const band = (x0, y0, x1, y1, x2, y2, x3, y3) => path([["M", x0, y0], ["C", 5, y0, 5, y1, x1, y1], ["L", x2, y2], ["C", 5, y2, 5, y3, x3, y3], ["Z"]], { fill: "soft", tone: "focus" });

  // Simple circular flow geometry (cartesian, data units arbitrary layout box 0–10).
  /** @type {Record<string, P>} */
  const N = { hh: [1.5, 5], firm: [8.5, 5], goods: [5, 8.5], factor: [5, 1.5] };
  /** @param {string | null} hi @param {number} active */
  const loopMarks = (hi, active) => {
    /** @param {string} id @param {string[]} touches */
    const on = (id, touches, i = -1) => (hi ? touches.includes(hi) : active < 0 || i === active);
    return [
      ...Object.entries({ hh: "가계", firm: "기업", goods: "생산물 시장", factor: "생산요소 시장" }).map(([k, t]) => [
        rect([N[k][0] - 1.1, N[k][1] - 0.5], [N[k][0] + 1.1, N[k][1] + 0.5], { id: `node-${k}`, fill: "soft", tone: hi === k ? "focus" : "muted" }),
        label(N[k], t, { size: "m" }),
      ]),
      // money (outer, bold): hh -> goods -> firm -> factor -> hh
      arrow([1.5, 5.5], [3.9, 8.9], { id: "m-spend", tone: on("", ["hh", "goods"], 0) ? "focus" : "muted", weight: "bold", label: "소비지출 (구독료 결제)" }),
      arrow([6.1, 8.9], [8.5, 5.5], { id: "m-revenue", tone: on("", ["goods", "firm"], 1) ? "focus" : "muted", weight: "bold", label: "판매수입" }),
      arrow([8.5, 4.5], [6.1, 1.1], { id: "m-wage", tone: on("", ["firm", "factor"], 2) ? "focus" : "muted", weight: "bold", label: "임금·이자·이윤 (월급)" }),
      arrow([3.9, 1.1], [1.5, 4.5], { id: "m-income", tone: on("", ["factor", "hh"], 3) ? "focus" : "muted", weight: "bold", label: "소득" }),
      // real (inner, dashed): opposite direction on same paths
      line([[7.6, 5.6], [5.9, 7.9]], { id: "r-goods", dash: true, tone: "muted", weight: "thin", label: "재화·서비스 (구독 서비스)" }),
      arrow([6.0, 7.75], [5.9, 7.9], { tone: "muted", weight: "thin" }),
      line([[4.1, 7.9], [2.4, 5.6]], { id: "r-goods2", dash: true, tone: "muted", weight: "thin" }),
      arrow([2.5, 5.75], [2.4, 5.6], { tone: "muted", weight: "thin" }),
      line([[2.4, 4.4], [4.1, 2.1]], { id: "r-labor", dash: true, tone: "muted", weight: "thin", label: "노동·자본 (개발자 노동)" }),
      arrow([4.0, 2.25], [4.1, 2.1], { tone: "muted", weight: "thin" }),
      line([[5.9, 2.1], [7.6, 4.4]], { id: "r-labor2", dash: true, tone: "muted", weight: "thin" }),
      arrow([7.5, 4.25], [7.6, 4.4], { tone: "muted", weight: "thin" }),
      label([5, 5], "저축·투자·정부·해외는 생략한 단순화 모형", { id: "simplified", size: "s", tone: "muted" }),
    ];
  };

  const extDraw = (/** @type {number} */ stage, /** @type {string} */ term) => [
    loopMarks(null, -1),
    stage >= 1 && [rect([3.9, 3.9], [6.1, 4.6], { id: "gov", fill: "soft" }), label([5, 4.25], "정부"),
      arrow([1.5, 4.5], [3.9, 4.1], { id: "tax", tone: term === "" ? "warn" : "muted", label: "세금(누출)" }),
      arrow([6.1, 4.4], [8.5, 4.9], { id: "gov-buy", tone: term === "G" ? "focus" : "series2", weight: term === "G" ? "bold" : "normal", label: "정부구매 G(주입)" }),
      line([[3.9, 4.4], [1.6, 4.8]], { id: "transfer", dash: true, tone: "series4", label: "이전지출(교환 없음)" })],
    stage >= 2 && [rect([3.9, 5.5], [6.1, 6.2], { id: "fin", fill: "soft" }), label([5, 5.85], "금융시장"),
      arrow([1.5, 5.4], [3.9, 5.8], { id: "saving", tone: "warn", label: "저축(누출)" }),
      arrow([6.1, 5.8], [8.5, 5.2], { id: "invest", tone: term === "I" ? "focus" : "series2", weight: term === "I" ? "bold" : "normal", label: "투자 I(주입)" })],
    stage >= 3 && [rect([8.8, 7.6], [9.9, 8.3], { id: "foreign", fill: "soft" }), label([9.35, 7.95], "해외"),
      arrow([9.3, 7.6], [8.7, 5.5], { id: "export", tone: term === "X−M" ? "focus" : "series2", weight: term === "X−M" ? "bold" : "normal", label: "수출 X(주입)" }),
      arrow([2.0, 5.5], [8.8, 8.1], { id: "import", tone: term === "X−M" ? "focus" : "warn", label: "수입 M(누출)" })],
    term === "C" && arrow([1.5, 5.5], [3.9, 8.9], { id: "c-hi", tone: "focus", weight: "bold", label: "소비 C" }),
    label([5, 9.7], "Y = C + I + G + (X − M)", { id: "identity", size: "l" }),
    label([5, 0.3], "화살표 굵기는 비율을 나타내지 않음", { id: "no-scale", size: "s", tone: "muted" }),
  ];

  const box = { x: /** @type {import("ltt").Axis} */ ([0, 10, "배치(축척 없음)"]), y: /** @type {import("ltt").Axis} */ ([0, 10, "배치(축척 없음)"]) };
  return {
    models: { fee, chain, app },
    figures: {
      f1: figure(cartesian({ x: [0, 10, "흐름 단계"], y: [0, 11100, "원"], loop: { ms: 4000, span: [0, 1] } }), (m, t) => [
        axis("y", { label: "금액(원, 갈래 사이 간격 300원은 금액 아님)" }),
        rect([0, 0], [1, 9900], { id: "src", tone: "focus", fill: "solid", label: "구독료 9,900원" }),
        m.fee.bands.map((/** @type {{name:string;v:number;s0:number;s1:number;d0:number;d1:number}} */ b, /** @type {number} */ i) => [
          band(1, b.s1, 9, b.d1, 9, b.d0, 1, b.s0),
          rect([9, b.d0], [10, b.d1], { id: `dst-${i}`, fill: "solid", tone: /** @type {import("ltt").Tone} */ (`series${i + 1}`) }),
          label([9.5, (b.d0 + b.d1) / 2], `${b.name} ${b.v.toLocaleString()}원 → 누군가의 소득`, { anchor: "w", size: "s" }),
          flow([[1, (b.s0 + b.s1) / 2], [5, (b.s0 + b.s1 + b.d0 + b.d1) / 4], [9, (b.d0 + b.d1) / 2]], { id: `coin-${i}`, n: Math.max(2, Math.round(b.v / 500)), rate: 1, seed: i + 1, t, tone: "warn", size: "s" }),
        ]),
        label([10, 11100], "가상 비용 구조", { id: "illustrative", anchor: "ne", size: "s", tone: "muted" }),
        label([0.5, 10400], (mm) => `합계 ${mm.fee.total.toLocaleString()}원 보존`, { id: "total" }),
      ]),
      f2: figure(cartesian({ ...box, static: "가계·기업·두 시장 사이 바깥 화폐 고리와 반대 방향 안쪽 실물 고리" }), (m, t, ctx) => loopMarks(String(ctx.params.node ?? "") || null, -1)),
      f3loop: figure(cartesian({ ...box, steps: ["가계 → 생산물 시장", "생산물 시장 → 기업", "기업 → 생산요소 시장", "생산요소 시장 → 가계"] }), (m, t, ctx) => [
        loopMarks(null, ctx.step),
        flow((/** @type {P[][]} */ ([[[1.5, 5.5], [3.9, 8.9]], [[6.1, 8.9], [8.5, 5.5]], [[8.5, 4.5], [6.1, 1.1]], [[3.9, 1.1], [1.5, 4.5]]]))[ctx.step] ?? [[1.5, 5.5], [3.9, 8.9]], { id: "won", n: 6, rate: 1, seed: 7, t, tone: "focus", label: "100만 원" }),
      ]),
      f3gauge: figure(cartesian({ x: [0, 3, "측면"], y: [0, 100, "만 원"], steps: ["가계 → 생산물 시장", "생산물 시장 → 기업", "기업 → 생산요소 시장", "생산요소 시장 → 가계"] }), (m, t, ctx) => {
        const fill = [ctx.step >= 0 ? 100 : 0, ctx.step >= 1 ? 100 : 0, ctx.step >= 3 ? 100 : 0];
        return [axis("y", { label: "같은 눈금 0–100만 원", ticks: [0, 25, 50, 75, 100] }),
          ["지출", "생산", "소득"].map((n, i) => [rect([i + 0.2, 0], [i + 0.8, 100], { tone: "muted", fill: "none" }), rect([i + 0.2, 0], [i + 0.8, fill[i]], { id: `g-${n}`, tone: "focus", fill: "solid" }), label([i + 0.5, -4], `${n} ${fill[i]}`, { anchor: "n" })])];
      }),
      f4: figure(cartesian({ x: [0, 4, "생산 단계"], y: [0, 1000, "원"], static: "단계별 매출 = 중간재 + 부가가치 쌓인 막대" }), (m) => {
        const c = m.chain, names = ["밀 농가", "제분소", "제빵소"];
        return [axis("y", { label: "매출(원)" }), grid({ y: 100 }),
          names.map((n, i) => [
            c.inter[i] > 0 && rect([i + 0.6, 0], [i + 1.4, c.inter[i]], { id: `inter-${i}`, tone: "muted", fill: "soft", label: "중간재" }),
            c.va[i] > 0 && rect([i + 0.6, c.inter[i]], [i + 1.4, c.sales[i]], { id: `va-${i}`, tone: "focus", fill: "solid", label: `부가가치 ${c.va[i]}` }),
            label([i + 1, -30], `${n} 매출 ${c.sales[i]}원`, { anchor: "n", size: "s" }),
            i > 0 && c.inter[i] > 0 && line([[i + 0.4, c.sales[i - 1]], [i + 0.6, c.inter[i]]], { id: `link-${i}`, dash: true, tone: "ref" }),
          ]),
          label([3.8, 950], (mm) => `부가가치 합 ${mm.chain.sumVA}원 = 최종재 가격`, { id: "sum-va", anchor: "e", tone: "focus" }),
          label([3.8, 880], (mm) => `매출 합 ${mm.chain.sumSales}원`, { id: "sum-sales", anchor: "e", tone: "muted" })];
      }),
      f5: figure(cartesian({ x: [0, 3, "합계 방식"], y: [0, 1000, "원"], static: "매출 합 950원 대 부가가치 합 600원" }), () => [
        axis("y", { ticks: [0, 200, 400, 600, 800, 1000] }),
        [[0, 100, "농가"], [100, 350, "제분소"], [350, 950, "제빵소"]].map(([a, b, n], i) => rect([0.4, Number(a)], [1.2, Number(b)], { id: `s-${i}`, tone: /** @type {import("ltt").Tone} */ (`series${i + 1}`), fill: "soft", label: `${n} ${Number(b) - Number(a)}` })),
        [[0, 100], [100, 250], [250, 600]].map(([a, b], i) => rect([1.8, a], [2.6, b], { id: `v-${i}`, tone: /** @type {import("ltt").Tone} */ (`series${i + 1}`), fill: "solid", label: `${b - a}` })),
        label([0.8, 980], "매출 합 950원 ≠ GDP", { id: "not-gdp", tone: "bad" }), label([2.2, 630], "부가가치 합 600원 = GDP 기여"),
        brace([1.5, 600], [1.5, 950], "차이 350원 = 중간재 거래액", { id: "gap", tone: "warn" }),
      ]),
      f6: figure(cartesian({ x: [0, 6, "거래 사슬"], y: [0, 10000, "원"], static: "구독 앱 사업의 중간재와 부가가치" }), (m) => {
        const a = m.app; let y = 0;
        const parts = [["클라우드", a.cloud, "cloud"], ["라이선스", a.license, "license"], ["앱스토어 수수료(해외 귀속 시 수입)", a.store, "store"]];
        return [axis("y", { label: "금액(원)" }),
          parts.map(([n, v, id], i) => { const y0 = y; y += Number(v); return [
            rect([0.3, y0], [1.5, y], { id: `sup-${id}`, tone: "muted", fill: "soft", label: `${n} ${Number(v).toLocaleString()}` }),
            rect([3, y0], [4.2, y], { id: `buy-${id}`, tone: "muted", fill: "soft" }),
            arrow([1.5, (y0 + y) / 2], [3, (y0 + y) / 2], { id: `in-${id}` })]; }),
          rect([3, y], [4.2, a.price], { id: "app-va", tone: "focus", fill: "solid", label: `앱 회사 부가가치 ${a.va.toLocaleString()}원` }),
          arrow([4.2, a.price / 2], [5.5, a.price / 2], { label: `소비자 ${a.price.toLocaleString()}원` }),
          label([3, 9900], "가상 예시. 앱스토어 수수료는 해외 기업 귀속 시 수입으로 처리", { id: "note", anchor: "se", size: "s", tone: "muted" })];
      }),
      f7steps: figure(cartesian({ ...box, steps: ["2부문", "+ 정부", "+ 금융시장", "+ 해외"] }), (m, t, ctx) => extDraw(ctx.step, "")),
      f7: figure(cartesian({ ...box, static: "4부문 확장 순환도와 Y=C+I+G+(X−M)" }), (m, t, ctx) => extDraw(3, String(ctx.params.term ?? ""))),
      f7thumb: figure(cartesian({ ...box, static: "분류판 옆 확장 순환도" }), (m, t, ctx) => [inset("f7", { at: [[0, 0], [10, 10]] })]),
      f3: split(["f3loop", "f3gauge"]),
    },
    scenes: [
      { type: "explore", title: "두 시장, 두 주체", say: "노드를 골라 나가고 들어오는 흐름을 본다.", figure: "f2", focus: ["m-spend", "r-goods"], knobs: { node: ["hh", "firm", "goods", "factor"] } },
      { type: "steps", title: "한 바퀴를 추적하기", figure: "f3", steps: [
        { say: "가계가 100만 원을 지출한다.", focus: ["m-spend", "g-지출"] }, { say: "기업 매출 = 생산 100.", focus: ["m-revenue", "g-생산"] },
        { say: "기업이 요소 대가로 지급한다.", focus: ["m-wage"] }, { say: "가계 소득 100.", focus: ["m-income", "g-소득"] }] },
      { type: "explore", title: "생산 단계별 부가가치", say: "가격을 바꿔도 부가가치 합은 최종재 가격이다.", figure: "f4", focus: ["sum-va", "sum-sales"],
        knobs: { mill: [150, 400, 10], bakery: [300, 900, 10], stages: ["3단계", "제빵소만"] },
        goal: { say: "매출 합과 부가가치 합의 차이를 0으로 만들어라", done: (m) => m.chain.sumSales === m.chain.sumVA } },
      { type: "steps", title: "정부와 해외가 끼어들면", figure: "f7steps", steps: [
        { say: "2부문", focus: [] }, { say: "정부", focus: ["tax", "gov-buy", "transfer"] }, { say: "금융", focus: ["saving", "invest"] }, { say: "해외", focus: ["export", "import"] }] },
      { type: "explore", title: "식의 항과 화살표", say: "항을 고르면 대응 화살표가 강조된다.", figure: "f7", focus: ["identity"], knobs: { term: ["C", "I", "G", "X−M"] } },
      { type: "quiz", items: /** @type {[import("ltt").QuizItem, ...import("ltt").QuizItem[]]} */ ([
        ...[["구독료 결제", true, "", "c-hi"], ["중고폰 거래", false, "기존 자산 이전이라 새 생산이 아니다", "identity"], ["클라우드 요금(앱 회사가 지불)", false, "중간재라 최종재 가격에 이미 들어 있다", "identity"],
          ["정부 실업급여", false, "이전지출: 생산물과 교환되지 않는다", "transfer"], ["해외 사용자 구독료", true, "", "export"], ["주식 매수", false, "금융 거래: 소유권 이전일 뿐이다", "saving"]].map(([card, inc, why, mark]) => (/** @type {import("ltt").QuizItem} */ ({
          kind: "choice", prompt: `카드: ${card} — GDP에?`, objective: "o1", figure: "f7thumb",
          options: inc ? [{ text: "포함", correct: true }, { text: "불포함", feedback: "새로 생산된 최종재 지출이다" }] : [{ text: "불포함", correct: true }, { text: "포함", feedback: String(why) }],
          reveal: { say: String(why || "최종재 지출"), marks: [String(mark)] } }))),
      ]) },
    ],
  };
};

const SRC = "bench/coverage/new/economics/circular-flow-of-income.brief.md";
/** @param {string} fig @param {import("../../fragment").Prop[]} props @param {string[]} [candidates] @returns {import("../../fragment").AuditRow} */
const row = (fig, props, candidates = []) => {
  const ess = props.filter((p) => p.essential);
  const verdict = ess.some((p) => p.status === "lost" || p.status === "ambiguous") ? "G" : "V";
  return { fig: `circular-flow-of-income#${fig}`, src: SRC, corpus: "new-b1", domain: "경제학", props, verdict, custom: [], candidates };
};
/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row("F1", [
    { id: "P1", cat: "Q", text: "흐름 폭이 금액에 비례, 합계 9,900원 보존", essential: true, why: "폭이 사실과 대응해야 함(합계 검증: 2,970+1,200+3,800+1,000+930=9,900)", status: "kept", by: "P: 'Point in the frame's data units'; path fill 'soft' 띠의 양 끝 높이가 금액(원) y축 구간" },
    { id: "P2", cat: "T", text: "동전 입자가 왼쪽에서 오른쪽으로 흘러 갈라지는 루프", essential: false, why: "지출이 소득이 됨", status: "kept", by: "flow(pts,{n,rate,seed,t}) 'particles moving along pts'; Loop ms 4000" },
    { id: "P3", cat: "X", text: "갈래 끝 '누군가의 소득' 라벨, 귀퉁이 '가상 비용 구조'", essential: true, why: "사실 표시", status: "kept", by: "label(at, text, {anchor:'ne'}) at data corner [10,11100]" },
  ], ["sankey-band"]),
  row("F2", [
    { id: "P1", cat: "G", text: "실물·화폐 고리가 같은 경로에서 반대 방향", essential: true, why: "핵심 관계", status: "kept", by: "arrow(from,to) 방향 = from→to; 화폐는 hh→goods, 실물은 goods→hh 같은 선분 근처" },
    { id: "P2", cat: "E", text: "화폐 흐름 실선 굵게(주 색), 실물 점선(보조 색)", essential: true, why: "먼저 눈에 띌 대상", status: "approx", diff: "arrow에는 dash가 없어 실물은 dashed line + 짧은 arrow 머리로 조립; 시각 결과는 같지만 한 mark가 아니다" },
    { id: "P3", cat: "I", text: "노드를 누르면 해당 흐름만 하이라이트", essential: false, why: "선택", status: "approx", diff: "노드 클릭 대신 explore knob(node choices)로 고른다" },
    { id: "P4", cat: "X", text: "각 화살표에 흐름 이름과 앱 예", essential: true, why: "", status: "kept", by: "MarkOpts.label on arrow/line" },
    { id: "P5", cat: "X", text: "'저축·투자·정부·해외는 생략한 단순화 모형' 표기", essential: true, why: "단순화 표시", status: "kept", by: "label mark id simplified" },
  ], ["dashed-arrow", "click-select-mark"]),
  row("F3", [
    { id: "P1", cat: "T", text: "단계 버튼 4개, 현재 구간 화살표만 활성", essential: true, why: "", status: "kept", by: "TimeSpec steps 4개; Steps 'Each step advances the figure's steps index'; draw가 ctx.step 구간만 focus tone" },
    { id: "P2", cat: "Q", text: "세 계기판이 같은 눈금 0~100만 원으로 같은 높이 도달", essential: true, why: "세 측면 등가", status: "kept", by: "한 cartesian y [0,100,'만 원']에 세 rect" },
    { id: "P3", cat: "S", text: "순환도 오른쪽에 세 계기판 인셋", essential: true, why: "", status: "ambiguous", diff: "split은 두 그림이 t·step을 공유한다고만 말하고 배치(좌우·크기)를 말하지 않는다; inset(no source)은 step 공유를 말하지 않는다" },
  ], ["split-arrangement"]),
  row("F4", [
    { id: "P1", cat: "G", text: "아래 중간재 부분이 이전 단계 막대 전체와 같은 높이로 연결선", essential: true, why: "이중계산 출처", status: "kept", by: "rect 높이가 데이터 단위; line link-i가 이전 sales와 현재 inter를 잇는다" },
    { id: "P2", cat: "I", text: "가격 슬라이더(제분소 150~400, 제빵소 300~900), 앞 단계보다 낮게 불가", essential: true, why: "", status: "approx", diff: "knob 범위는 고정이라 슬라이더 자체가 막히지 않고 model이 bakery=max(bakery, mill)로 값을 고정한다" },
    { id: "P3", cat: "Q", text: "부가가치 합=최종재 가격(600) 실시간, 매출 합(950)도", essential: true, why: "", status: "kept", by: "Text 함수 'Functions are re-evaluated with current model outputs'" },
    { id: "P4", cat: "E", text: "부가가치 진한 색, 중간재 빗금", essential: true, why: "", status: "approx", diff: "빗금 채움이 없어 중간재는 muted soft 채움으로 구분" },
    { id: "P5", cat: "I", text: "목표: 매출 합-부가가치 합 차이 0 조건(중간재 단계 없음)", essential: false, why: "", status: "kept", by: "Explore.goal.done; stages knob" },
  ], ["hatch-fill", "knob-dependent-range"]),
  row("F5", [
    { id: "P1", cat: "S", text: "같은 축 나란히", essential: true, why: "", status: "kept", by: "한 cartesian frame 안 두 rect 스택" },
    { id: "P2", cat: "Q", text: "축 0~1,000원, 0 기점", essential: true, why: "", status: "kept", by: "Axis [0,1000,'원']" },
    { id: "P3", cat: "E", text: "차이 350원 괄호", essential: true, why: "", status: "kept", by: "brace(from,to,text)" },
    { id: "P4", cat: "X", text: "'매출 합 ≠ GDP' 라벨", essential: true, why: "오개념 교정", status: "kept", by: "label id not-gdp" },
  ]),
  row("F6", [
    { id: "P1", cat: "G", text: "중간재 구매 블록이 공급자 노드에서 화살표로 들어옴", essential: true, why: "", status: "kept", by: "arrow(sup → buy)" },
    { id: "P2", cat: "Q", text: "블록 높이 금액 비례(부가가치 4,730원 검증)", essential: true, why: "", status: "kept", by: "rect in data units, y [0,10000,'원']; model va = 9900−1200−1000−2970" },
    { id: "P3", cat: "X", text: "'가상 예시, 수수료 해외 귀속 시 수입' 주석", essential: true, why: "해외 부문 처리", status: "kept", by: "label id note" },
  ]),
  row("F7", [
    { id: "P1", cat: "G", text: "누출은 밖으로, 주입은 안으로 향하는 화살표", essential: true, why: "", status: "kept", by: "arrow from→to 방향" },
    { id: "P2", cat: "T", text: "새 부문이 하나씩 등장하는 3단계", essential: false, why: "", status: "kept", by: "TimeSpec steps; ctx.step" },
    { id: "P3", cat: "I", text: "식의 항을 누르면 대응 화살표 하이라이트", essential: true, why: "", status: "approx", diff: "식 위 항 클릭 대신 term knob(choices)로 고른다" },
    { id: "P4", cat: "E", text: "이전지출 점선·다른 색", essential: true, why: "퀴즈 오답 원인", status: "kept", by: "line dash:true, tone series4" },
    { id: "P5", cat: "X", text: "'화살표 굵기는 비율을 나타내지 않음'", essential: true, why: "", status: "kept", by: "label id no-scale" },
  ], ["click-select-mark", "math-term-target"]),
  row("F8", [
    { id: "P1", cat: "I", text: "카드 드래그 앤 드롭 후 채점", essential: true, why: "", status: "approx", diff: "classify 항목은 figure·피드백을 못 가져 카드마다 포함/불포함 choice로 나눴다; 한 판에서 끌기는 없다" },
    { id: "P2", cat: "S", text: "분류판 옆 F7 축소판 인셋", essential: true, why: "판정 근거를 구조와", status: "approx", diff: "QuizItem.figure로 축소판을 함께 보이나 '옆' 배치는 runtime 몫이고 카드가 화살표로 날아가는 동작은 reveal.marks 강조로 대신" },
    { id: "P3", cat: "X", text: "오답 카드 한 줄 이유", essential: true, why: "", status: "kept", by: "Option.feedback; QuizReveal.say" },
  ], ["classify-feedback", "classify-figure"]),
];
