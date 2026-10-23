// @ts-check
/** @typedef {import("ltt").P} P */
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, graph, node, edge, axis, rect, line, arrow, label, dot, sweep, split, rng, histogram } = api;
  const RATE = { vip: [30, 32], gen: [12, 14] };
  const crowd = model({ seed: 5 }, ({ seed }) => {
    const r = rng(seed);
    const people = Array.from({ length: 2000 }, (_, i) => ({ i, vip: i < 400, coupon: i < 360 || (i >= 400 && i < 540), jx: r(), jy: r() }));
    return { people, cVip: 360, cN: 500, nVip: 40, nN: 1500 };
  }, { illustrative: true });
  const strata = model({ x: 0 }, () => {
    const c = 0.72 * RATE.vip[1] + 0.28 * RATE.gen[1], n = (40 * RATE.vip[0] + 1460 * RATE.gen[0]) / 1500;
    return { c, n, diff: c - n };
  }, { illustrative: true });
  const assign = model({ q: 90, rule: "VIP 우선" }, ({ q, rule }) => {
    const qq = rule === "동전 던지기" ? 25 : q, vipC = 4 * qq, shareC = vipC / 500, shareN = (400 - vipC) / 1500;
    return { q: qq, vipC, shareC, shareN, diff: 2 + 18 * (shareC - shareN), random: qq === 25 };
  }, "관측 차이 = 2%p + 18%p × (VIP 비율 차); 쿠폰 500명 고정");
  const rep = model({ reps: 1000 }, ({ reps }) => {
    const r = rng(42), diffs = [];
    for (let k = 0; k < reps; k++) {
      const idx = Array.from({ length: 2000 }, (_, i) => i);
      for (let i = 0; i < 500; i++) { const j = i + Math.floor(r() * (2000 - i)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      let cy = 0, ny = 0;
      idx.forEach((p, i) => { const vip = p < 400, c = i < 500, pr = (vip ? RATE.vip : RATE.gen)[c ? 1 : 0] / 100; if (r() < pr) { if (c) cy++; else ny++; } });
      diffs.push((cy / 500 - ny / 1500) * 100);
    }
    const mean = diffs.reduce((a, b) => a + b, 0) / reps, sd = Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / (reps - 1));
    return { bins: histogram(diffs, { bins: 40, range: [-4, 16] }), mean, sd };
  }, "무작위 배정 1,000회 시뮬레이션(가정 재구매율 VIP 30/32%, 일반 12/14%)");
  const pv = model({ rule: "crm" }, ({ rule }) => {
    const d = rule === "crm" ? 14.48 : 2, pc = rule === "crm" ? 0.27 : 0.176, pn = rule === "crm" ? 0.125 : 0.156;
    const z = d / 100 / Math.sqrt((pc * (1 - pc)) / 500 + (pn * (1 - pn)) / 1500);
    const t = 1 / (1 + 0.2316419 * z), phi = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
    const p = 2 * phi * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return { rule, d, p };
  }, "두 비율 z검정(정규 근사, Abramowitz–Stegun 26.2.17)");

  /** @param {number} vipW @param {boolean} show @param {number} step */
  const dag = (vipW, show, step = 3) => [
    node("vip", "과거 구매(VIP)", { at: [1, 2] }),
    step >= 1 && node("coupon", "쿠폰", { at: [0, 0] }),
    step >= 2 && node("buy", "재구매", { at: [2, 0] }),
    step >= 1 && show && edge("vip", "coupon", { id: "vip->coupon", directed: true, tone: "warn", weight: vipW > 0.66 ? "bold" : vipW > 0.33 ? "normal" : "thin", opacity: 0.2 + 0.8 * vipW }),
    step >= 2 && edge("vip", "buy", { id: "vip->buy", directed: true, tone: "warn", weight: "bold", text: "+18%p" }),
    step >= 3 && edge("coupon", "buy", { id: "coupon->buy", directed: true, weight: "thin", text: "+2%p" }),
  ];
  /** @param {number} step */
  const bars = (step) => [axis("y", { label: "재구매율", ticks: [0, 10, 20, 30, 40] }),
    step === 0 ? [rect([0.3, 0], [1.3, 27], { id: "all-c", fill: "solid", tone: "series1", label: "쿠폰 27.0%" }), rect([1.7, 0], [2.7, 12.5], { id: "all-n", fill: "solid", tone: "series2", label: "비쿠폰 12.5%" })]
      : [[0.2, 32, "VIP 쿠폰"], [0.8, 30, "VIP 비쿠폰"], [1.8, 14, "일반 쿠폰"], [2.4, 12, "일반 비쿠폰"]].map(([x, y, n], i) =>
        rect([Number(x), 0], [Number(x) + 0.5, Number(y)], { id: `st-${i}`, fill: "solid", tone: i % 2 ? "series2" : "series1", label: `${n} ${y}%` })),
    label([1.5, 39], "가상 데이터", { id: "fake", size: "s", tone: "muted" })];
  /** @type {import("ltt").Axis} */ const BX = [0, 3, "집단"];
  /** @type {import("ltt").Axis} */ const BY = [0, 40, "%"];
  return {
    models: { crowd, strata, assign, rep, pv },
    figures: {
      f1: figure(cartesian({ x: [0, 100, "배치"], y: [0, 50, "배치"], loop: { ms: 4000, span: [0, 1], once: true } }), (m, t) => [
        m.crowd.people.map((/** @type {{i:number;vip:boolean;coupon:boolean;jx:number;jy:number}} */ p) => {
          /** @type {P} */ const a = [(p.i % 50) * 0.8 + 1, Math.floor(p.i / 50) * 1.2 + 1];
          /** @type {P} */ const b = p.coupon ? [55 + p.jx * 18, 5 + p.jy * 40] : [76 + p.jx * 22, 5 + p.jy * 40];
          return dot([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], { size: "s", tone: p.vip ? "focus" : "muted", weight: p.vip ? "bold" : "thin" });
        }),
        rect([54, 4], [74, 46], { id: "box-c", fill: "none", label: "쿠폰 500명 (VIP 360, 72%)" }),
        rect([75, 4], [99, 46], { id: "box-n", fill: "none", label: "비쿠폰 1,500명 (VIP 40, 약 3%)" }),
        label([20, 49], "CRM 규칙: 구매 5회 이상에게 쿠폰 · 점 1개 = 고객 1명", { id: "rule", size: "s" })]),
      f2: figure(cartesian({ x: BX, y: BY, steps: ["전체", "층별"] }), (m, t, ctx) => [bars(ctx.step),
        label([1.5, 35], (mm) => `쿠폰 ${mm.strata.c.toFixed(1)}% − 비쿠폰 ${mm.strata.n.toFixed(1)}% = ${mm.strata.diff.toFixed(1)}%p; 층별 효과 +2%p`, { id: "calc", size: "s" })]),
      f3dag: figure(graph({ layout: "layered", direction: "down", steps: ["VIP", "+쿠폰", "+재구매", "+쿠폰→재구매"] }), (m, t, ctx) => [dag(0.9, true, ctx.step),
        node("note", "그래프는 가정이며 데이터만으로 확정되지 않음", { at: [1, -1], shape: "box", tone: "muted" })]),
      f3bars: figure(cartesian({ x: BX, y: BY, steps: ["VIP", "+쿠폰", "+재구매", "+쿠폰→재구매"] }), (m, t, ctx) => bars(ctx.step >= 2 ? 1 : 0)),
      f3: split(["f3dag", "f3bars"]),
      f4bars: figure(cartesian({ x: [0, 2, "집단"], y: [0, 100, "VIP 비율 %"], static: "두 집단 VIP 구성" }), (m) => [axis("y"),
        rect([0.2, 0], [0.8, m.assign.shareC * 100], { id: "vip-c", fill: "solid", tone: "focus", label: "쿠폰 집단 VIP" }),
        rect([1.2, 0], [1.8, m.assign.shareN * 100], { id: "vip-n", fill: "solid", tone: "focus", label: "비쿠폰 집단 VIP" }),
        label([1, 95], (mm) => `관측 차이 ${mm.assign.diff.toFixed(1)}%p (진짜 효과 2%p)`, { id: "obs" })]),
      f4dag: figure(graph({ layout: "layered", direction: "down", static: "연동 인과 그래프" }), (m) => dag((m.assign.q - 25) / 75, !m.assign.random)),
      f4: split(["f4bars", "f4dag"], { link: "q" }),
      f5: figure(cartesian({ x: [-4, 16, "%p"], y: [0, 120, "회"], static: "무작위 배정 1,000회 관측 차이 분포" }), (m) => [axis("x", { ticks: [-4, 0, 2, 4, 8, 12, 16] }), axis("y"),
        m.rep.bins.map((/** @type {{x0:number;x1:number;count:number}} */ b) => rect([b.x0, 0], [b.x1, b.count], { fill: "soft", tone: "muted" })),
        sweep("x", 14.5, { id: "selected", tone: "bad", weight: "bold", label: "VIP 선택 배정 14.5%p" }),
        label([10, 110], (mm) => `중심 ${mm.rep.mean.toFixed(1)}%p, SD ${mm.rep.sd.toFixed(1)}%p`, { id: "sd" }),
        label([6, 100], "무작위면 차이 = 효과+우연; 선택이면 효과+우연+교란", { id: "msg", size: "s" })]),
      f6: figure(graph({ layout: "layered", direction: "down", static: "선택 대 무작위 인과 그래프와 p값" }), (m) => [dag(0.9, m.pv.rule === "crm"),
        node("p", (mm) => `차이 ${mm.pv.d}%p, p ${mm.pv.p < 0.001 ? "< 0.001" : "≈ " + mm.pv.p.toFixed(2)}`, { at: [1, -1], shape: "box" })]),
      f7: figure(graph({ layout: "layered", direction: "right", static: "연구 설계 4단계" }), () => [
        node("recruit", "고객 모집", { shape: "box" }),
        node("assign", "배정: 누가 배정했나? / 집단이 처치 전에 같았나?", { shape: "box", tone: "focus", weight: "bold", size: "l" }),
        node("treat", "처치", { shape: "box" }), node("measure", "측정: 차이는 우연 범위 밖인가?", { shape: "box" }),
        edge("recruit", "assign", { directed: true }), edge("assign", "treat", { directed: true }), edge("treat", "measure", { directed: true })]),
    },
    scenes: [
      { type: "explain", title: "누가 쿠폰을 받았나", say: "규칙이 VIP를 골라 담는다", figure: "f1", focus: ["box-c"] },
      { type: "steps", title: "인과 그래프 그리기", figure: "f3", steps: [{ say: "VIP", focus: ["vip"] }, { say: "쿠폰", focus: ["vip->coupon"] }, { say: "재구매", focus: ["vip->buy", "st-0"] }, { say: "효과", focus: ["coupon->buy"] }] },
      { type: "explore", title: "배정 방식 바꾸기", say: "VIP 우대를 조절한다", figure: "f4", focus: ["obs", "vip->coupon"], knobs: { rule: ["VIP 우선", "동전 던지기"], q: [25, 100, 1] },
        goal: { say: "관측 차이를 진짜 효과 2%p에 맞춰라", done: (m) => Math.abs(m.assign.diff - 2) < 0.1 } },
      { type: "compare", title: "관찰 연구 대 무작위 실험", say: "작은 p값이 인과를 보장하지 않는다", figure: "f6", focus: ["vip->coupon", "p"], a: { rule: "crm" }, b: { rule: "random" }, labels: ["CRM 선택", "무작위"] },
    ],
  };
};

const SRC = "bench/coverage/new/statistics/confounding-and-randomization.brief.md";
/** @param {string} fig @param {import("../../fragment").Prop[]} props @param {string[]} [candidates] @returns {import("../../fragment").AuditRow} */
const row = (fig, props, candidates = []) => {
  const ess = props.filter((p) => p.essential);
  const verdict = ess.some((p) => p.status === "lost" || p.status === "ambiguous") ? "G" : "V";
  return { fig: `confounding-and-randomization#${fig}`, src: SRC, corpus: "new-b1", domain: "통계", props, verdict, custom: [], candidates };
};
/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row("F1", [
    { id: "P1", cat: "Q", text: "2,000명, VIP 20%; 쿠폰 500 중 VIP 360(72%), 비쿠폰 1,500 중 VIP 40(약 3%)", essential: true, why: "값 검증 맞음(40/1500=2.7%); 단 '5회 이상' 규칙이 VIP 40명을 빼는 이유는 brief에 없다", status: "kept", by: "dot 1개=고객 1명, model crowd 집계" },
    { id: "P2", cat: "T", text: "규칙 적용 애니메이션: 두 상자로 이동", essential: true, why: "", status: "kept", by: "Loop once; draw 'sampled over the frame's time'으로 위치 보간" },
    { id: "P3", cat: "E", text: "VIP 색이 쿠폰 상자에 몰림이 먼저 보이게", essential: true, why: "", status: "kept", by: "Tone 'focus is the accent'" },
    { id: "P4", cat: "X", text: "'아이콘 1개=고객 1명'", essential: false, why: "", status: "kept", by: "label rule" },
  ], ["person-icon-grid"]),
  row("F2", [
    { id: "P1", cat: "Q", text: "VIP 30/32%, 일반 12/14%; 쿠폰 27.0%, 비쿠폰 12.5% 가중평균 일치", essential: true, why: "값 검증: 26.96%, 12.48%, 차이 14.48%p", status: "approx", diff: "막대는 brief 표기값 27.0/12.5를 쓰고 라벨은 model 값 26.96/12.48을 반올림해 표시" },
    { id: "P2", cat: "T", text: "전체 막대 → 층별로 쪼개짐", essential: true, why: "", status: "kept", by: "TimeSpec steps; ctx.step" },
    { id: "P3", cat: "X", text: "'가상 데이터'", essential: true, why: "", status: "kept", by: "label fake" },
    { id: "P4", cat: "S", text: "같은 y축 0–40%", essential: true, why: "", status: "kept", by: "Axis [0,40,'%']" },
  ]),
  row("F3", [
    { id: "P1", cat: "G", text: "화살표 방향=인과, 두께=효과 크기(18%p vs 2%p)", essential: true, why: "", status: "approx", diff: "edge weight가 thin/normal/bold 3단계뿐이라 9:1 비율 대신 순서만 보인다(edge text로 수치 병기)" },
    { id: "P2", cat: "E", text: "뒷문 경로 주황 강조", essential: true, why: "", status: "kept", by: "edge tone warn" },
    { id: "P3", cat: "T", text: "노드 하나씩 추가, 경로마다 F2 막대 해당 부분 강조", essential: true, why: "", status: "kept", by: "split 'share t, step ... focus'; graph steps" },
    { id: "P4", cat: "X", text: "그래프는 가정 주석", essential: true, why: "", status: "approx", diff: "graph frame에 자유 label 좌표가 정의되지 않아 주석을 node(at)로 둔다; at 좌표계는 d.ts가 말하지 않는다" },
  ], ["edge-width-value", "graph-annotation"]),
  row("F4", [
    { id: "P1", cat: "I", text: "슬라이더 VIP 쿠폰 확률 25%–100%, 일반 확률 자동 조정(쿠폰 500 고정)", essential: true, why: "", status: "kept", by: "Explore.knobs q [25,100,1]; model이 일반 확률 (500−4q)/1600" },
    { id: "P2", cat: "Q", text: "관측 차이 = 2%p + 18%p×(VIP 비율 차)", essential: true, why: "q=90%에서 14.48%p로 F2와 일치", status: "kept", by: "model assign" },
    { id: "P3", cat: "I", text: "목표: 관측 차이를 2%p에 맞추기", essential: true, why: "", status: "kept", by: "Explore.goal.done" },
    { id: "P4", cat: "G", text: "VIP→쿠폰 화살표 두께 슬라이더 연동, 무작위면 사라짐", essential: true, why: "", status: "approx", diff: "두께는 3단계 weight + 연속 opacity로 근사; 무작위일 때 edge 생략" },
  ], ["edge-width-value"]),
  row("F5", [
    { id: "P1", cat: "Q", text: "x −4~16%p, 0.5%p 구간, SD≈1.9%p", essential: true, why: "값 검증: 해석적 SD ≈1.94%p", status: "kept", by: "histogram bins 40 range [-4,16]; model sd" },
    { id: "P2", cat: "E", text: "선택 배정 값이 분포 바깥 멀리", essential: true, why: "", status: "kept", by: "sweep x 14.5 tone bad" },
    { id: "P3", cat: "X", text: "'무작위면 효과+우연; 선택이면 효과+우연+교란'", essential: true, why: "", status: "kept", by: "label msg" },
  ]),
  row("F6", [
    { id: "P1", cat: "S", text: "동일 배치·동일 축", essential: true, why: "", status: "approx", diff: "Compare는 같은 figure를 나란히 보장하나 graph layout이 두 params에서 같은 배치를 내는지는 node at 고정으로만 기대한다; F1 아이콘 구성은 빠졌다" },
    { id: "P2", cat: "G", text: "오른쪽 VIP→쿠폰 화살표 제거", essential: true, why: "", status: "kept", by: "rule=random일 때 edge 생략" },
    { id: "P3", cat: "Q", text: "p값 둘 다(p<0.001, p≈0.3)", essential: true, why: "값 검증: z≈6.7, z≈1.03→p≈0.30", status: "kept", by: "model pv 두 비율 z검정" },
  ]),
  row("F7", [
    { id: "P1", cat: "S", text: "왼→오 4단계 상자", essential: true, why: "", status: "kept", by: "graph layered direction 'right'; node shape box" },
    { id: "P2", cat: "E", text: "'배정' 상자 가장 강조", essential: true, why: "", status: "kept", by: "node tone focus weight bold" },
    { id: "P3", cat: "X", text: "세 질문", essential: true, why: "", status: "kept", by: "node text" },
  ]),
];
