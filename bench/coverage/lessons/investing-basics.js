// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, cells, graph, axis, grid, line, area, rect, dot, label, legend, sweep, icon, path, circle, cell, node, edge, split } = api;
  const P0 = 1000;
  /** @param {number} v */
  const won = (v) => Math.round(v).toLocaleString("ko-KR") + "만원";
  /** @param {number} r @param {number} T */
  const growth = (r, T) => P0 * Math.pow(1 + r, T);
  /** @param {number} n */
  const sigmaBasket = (n) => 40 * Math.sqrt(1 / n + (1 - 1 / n) * 0.2);
  /** @param {number} w */
  const sigmaMix = (w) => Math.sqrt((18 * w) ** 2 + (6 * (1 - w)) ** 2 + 2 * 0.2 * 18 * 6 * w * (1 - w));
  /** @param {number} w */
  const expMix = (w) => 7 * w + 4 * (1 - w);
  /** @param {number} mu @param {number} sg */
  const badYear = (mu, sg) => mu - 1.645 * sg;
  /** @param {number} v @param {number} mu @param {number} sg */
  const normal = (v, mu, sg) => Math.exp(-(((v - mu) / sg) ** 2) / 2) / (sg * Math.sqrt(2 * Math.PI));
  /** @param {number} a @param {number} b @param {number} d */
  const range = (a, b, d) => Array.from({ length: Math.round((b - a) / d) + 1 }, (_, i) => a + i * d);
  const years = range(0, 30, 1);
  /** @param {number} lo @param {number} hi @param {number} mu @param {number} sg @returns {import("ltt").P[]} */
  const bell = (lo, hi, mu, sg) => range(lo, hi, 0.5).map((v) => [v, normal(v, mu, sg)]);

  const sim = model({ seed: 4 }, ({ seed }) => {
    const rnd = api.rng(seed);
    const nrm = () => { const u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const n = 20, T = 20, sm = 0.4 * Math.sqrt(0.2), se = 0.4 * Math.sqrt(0.8), g = 0.07 - 0.4 * 0.4 / 2;
    const paths = Array.from({ length: n }, () => [1]);
    for (let y = 1; y <= T; y++) { const f = nrm(); for (const p of paths) p.push(p[y - 1] * Math.exp(g + sm * f + se * nrm())); }
    const port = range(0, T, 1).map((y) => paths.reduce((s, p) => s + p[y], 0) / n);
    const fin = paths.map((p) => p[T]);
    const end = port[T];
    return { paths, port, end, below: fin.filter((v) => v < end).length, under1: fin.filter((v) => v < 1).length, best: Math.max(...fin), worst: Math.min(...fin) };
  }, "1-factor GBM: 종목 σ 40%, 상관 0.2, 기대 7%, mulberry32 seed 4 + Box–Muller (v1 simStocks)");
  const basket = model({ nstk: "1" }, ({ nstk }) => ({ n: Number(nstk), s: sigmaBasket(Number(nstk)), floor: sigmaBasket(1e9) }), "σ_p = σ√(1/N + (1−1/N)ρ), σ 40%, ρ 0.2");
  const fees = model({ fee: "1.5" }, ({ fee }) => { const r = 0.07 - Number(fee) / 100; return { fee: Number(fee), r, end: growth(r, 30), lost: 1 - growth(r, 30) / growth(0.07, 30) }; }, "P0(1 + 0.07 − fee)^30");
  const alloc = model({ wst: 100 }, ({ wst }) => { const w = wst / 100, e = expMix(w), s = sigmaMix(w); return { wst, e, s, bad: badYear(e, s) }; }, "2자산 분산: 주식 7%·18%, 채권 4%·6%, ρ 0.2; 나쁜 해 = μ − 1.645σ");

  const growthFrame = (/** @type {import("ltt").TimeSpec} */ ts) => cartesian({ x: [0, 30, "년"], y: [0, 8000, "만원"], ...ts });
  const TIMING = [12, -18, 25, 8, -6, 30, 4, -12, 20, 9];
  const BEST2 = [30, 25], WORST2 = [-18, -12];
  /** @param {number[]} rs */
  const runSeq = (rs) => rs.reduce((v, r) => v * (1 + r / 100), P0);
  const timingRows = /** @type {[string, number, import("ltt").Tone][]} */ ([
    ["나쁜 두 해만 피함", runSeq(TIMING.map((r) => (WORST2.includes(r) ? 3 : r))), "series3"],
    ["계속 머묾", runSeq(TIMING), "focus"],
    ["둘 다 놓침", runSeq(TIMING.map((r) => (BEST2.includes(r) || WORST2.includes(r) ? 3 : r))), "series4"],
    ["예금만", growth(0.03, 10), "muted"],
    ["좋은 두 해 놓침", runSeq(TIMING.map((r) => (BEST2.includes(r) ? 3 : r))), "bad"],
  ]);
  const DCA_PRICES = [10000, 5000, 10000, 20000];
  const DCA_SHARES = DCA_PRICES.map((p) => 100000 / p);

  const series = /** @type {{ id: string; f: (t: number) => number; tone: import("ltt").Tone; weight: "normal" | "bold"; text: string }[]} */ ([
    { id: "simple", f: (t) => P0 * (1 + 0.07 * t), tone: "series2", weight: "normal", text: "단리 7%" },
    { id: "comp", f: (t) => growth(0.07, t), tone: "focus", weight: "bold", text: "복리 7%" },
    { id: "dep", f: (t) => growth(0.03, t), tone: "muted", weight: "normal", text: "예금 복리 3%" },
  ]);

  return {
    models: { sim, basket, fees, alloc },
    figures: {
      hookArt: figure(cartesian({ x: [0, 1, ""], y: [0, 1, ""], static: "상승 추세 아이콘" }), () => icon("trend", [0.5, 0.5], { size: "l", tone: "focus" })),
      termCompound: figure(cartesian({ x: [0, 120, ""], y: [0, 70, ""], static: "직선(단리)과 위로 휘는 곡선(복리)" }), () => [
        line([[8, 12], [112, 36]], { id: "simpleLine", tone: "series2" }),
        path([["M", 8, 12], ["Q", 70, 16, 112, 62]], { id: "compCurve", tone: "focus", weight: "bold" }),
      ]),
      termVol: figure(cartesian({ x: [0, 120, ""], y: [0, 70, ""], static: "평균선 주위로 오르내리는 꺾은선" }), () => [
        line([[8, 34], [112, 34]], { id: "mean", tone: "muted", dash: true }),
        line(/** @type {import("ltt").P[]} */ ([[8, 34], [22, 56], [36, 16], [50, 50], [64, 12], [78, 58], [92, 22], [112, 40]]), { id: "zig", tone: "focus" }),
      ]),
      termDiv: figure(cartesian({ x: [0, 120, ""], y: [0, 70, ""], aspect: "equal", static: "큰 원 하나와 작은 원 16개" }), () => [
        circle([28, 34], 20, { id: "one", tone: "series2", fill: "solid" }),
        [0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => circle([70 + c * 13, 53 - r * 13], 5, { tone: "focus", fill: "solid" }))),
      ]),
      termFee: figure(cartesian({ x: [0, 120, ""], y: [0, 70, ""], static: "막대 끝 일부가 빨갛게 떨어져 나감" }), () => [
        rect([8, 22], [112, 46], { id: "gross", tone: "focus", fill: "solid" }),
        rect([88, 22], [112, 46], { id: "feeCut", tone: "bad", fill: "solid" }),
        label([100, 54], "−", { anchor: "s" }),
      ]),
      termDca: figure(cartesian({ x: [0, 120, ""], y: [0, 70, ""], static: "같은 높이 막대 4개" }), () => [0, 1, 2, 3].map((i) => rect([10 + i * 26, 18], [28 + i * 26, 50], { tone: "focus", fill: "solid" }))),

      compound: figure(growthFrame({ steps: ["단리·복리 7%", "예금 3% 추가"] }), (m, t, ctx) => [
        grid({ y: 2000 }), axis("x", { ticks: [0, 5, 10, 15, 20, 25, 30] }), axis("y", { ticks: [0, 2000, 4000, 6000, 8000] }),
        series.filter((s) => s.id !== "dep" || ctx.step >= 1).map((s) => [
          line(years.map((t) => [t, s.f(t)]), { id: s.id, tone: s.tone, weight: s.weight }),
          label([30, s.f(30)], `${s.text} ${won(s.f(30))}`, { anchor: "w", tone: s.tone }),
        ]),
        label([0, 1000], "시작 1,000만원", { anchor: "nw" }),
      ]),

      risk: figure(cartesian({ x: [-50, 60, "%"], y: [0, 0.075, "확률밀도"], static: "예금·채권·주식 한 해 수익률 분포" }), () => [
        axis("x", { label: "한 해 수익률", ticks: 11 }),
        sweep("x", 0, { tone: "ref", weight: "thin" }),
        area(bell(-50, 60, 7, 18), { id: "stockArea", tone: "focus", fill: "soft" }),
        area(bell(-50, 60, 4, 6), { id: "bondArea", tone: "series2", fill: "soft" }),
        line(bell(-50, 60, 4, 6), { id: "bond", tone: "series2" }),
        line(bell(-50, 60, 7, 18), { id: "stock", tone: "focus", weight: "bold" }),
        line([[3, 0], [3, 0.072]], { id: "deposit", weight: "bold", label: "예금 3% (매년 같음)" }),
        label([4, normal(4, 4, 6)], "채권 평균 4%", { anchor: "e" }),
        label([30, normal(30, 7, 18)], "주식 평균 7%", { anchor: "s" }),
        line([[badYear(7, 18), 0], [badYear(7, 18), 0.03]], { id: "stockBad", tone: "bad", dash: true }),
        label([badYear(7, 18), 0.03], `주식 나쁜 해 ${badYear(7, 18).toFixed(1)}%`, { anchor: "s", tone: "bad" }),
        line([[badYear(4, 6), 0], [badYear(4, 6), 0.046]], { id: "bondBad", tone: "series2", dash: true }),
        label([badYear(4, 6), 0.046], `채권 나쁜 해 ${badYear(4, 6).toFixed(1)}%`, { anchor: "s", tone: "series2" }),
        label([-50, 0.075], "높을수록 그 수익률이 나오는 해가 흔하다. 나쁜 해 = 약 20년에 한 번(하위 5%)", { anchor: "nw" }),
      ]),

      drag: figure(cartesian({ x: [0, 2, "년"], y: [50, 160, ""], static: "+50% 뒤 −50%면 75" }), () => [
        grid({ y: 25 }), axis("x", { ticks: [0, 1, 2] }), axis("y", { ticks: 5 }),
        line([[0, 100], [1, 100], [2, 100]], { id: "flat", tone: "muted", label: "매년 0% → 100" }),
        line([[0, 100], [1, 150], [2, 75]], { id: "swing", tone: "focus", weight: "bold" }),
        /** @type {import("ltt").P[]} */ ([[0, 100], [1, 150], [2, 75]]).map((p) => dot(p, { tone: "focus" })),
        label([1, 150], "+50% → 150", { anchor: "s" }),
        label([2, 75], "−50% → 75", { anchor: "w" }),
      ]),

      paths: figure(cartesian({ x: [0, 20, "년"], y: [0.05, 30, "배"], log: "y", loop: { ms: 6000, span: [0, 20], once: true } }), (m, t) => {
        const k = Math.max(0, Math.min(20, Math.floor(t + 1e-9)));
        /** @param {number[]} p @returns {import("ltt").P[]} */
        const upTo = (p) => p.slice(0, k + 1).map((v, j) => [j, v]);
        const s = m.sim;
        return [
          axis("x", { ticks: 5 }), axis("y", { ticks: [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20] }),
          line([[0, 1], [20, 1]], { id: "par", tone: "ref", dash: true, label: "원금 1배" }),
          s.paths.map((/** @type {number[]} */ p, /** @type {number} */ i) => line(upTo(p), { id: `stock${i}`, tone: "series2", weight: "thin", opacity: 0.4 })),
          line(upTo(s.port), { id: "basket", tone: "focus", weight: "bold" }),
          k === 20 && [
            label([20, s.end], `나눠 담은 바구니 ${s.end.toFixed(2)}배`, { anchor: "w", id: "endLabel" }),
            label([0, 30], `20개 중 ${s.below}개가 바구니보다 낮게, ${s.under1}개가 원금보다 낮게 끝났다`, { anchor: "nw" }),
            label([0, 18], `가장 좋은 종목 ${s.best.toFixed(2)}배 · 가장 나쁜 종목 ${s.worst.toFixed(2)}배`, { anchor: "nw" }),
          ],
        ];
      }),

      nstk: figure(cartesian({ x: [-80, 90, "%"], y: [0, 0.024, "확률밀도"], static: "바구니 한 해 수익률 분포" }), (m) => [
        axis("x", { ticks: 9 }),
        line(bell(-80, 90, 7, m.basket.floor), { id: "floor", tone: "ref", dash: true }),
        label([37, normal(7, 7, m.basket.floor)], `바닥: 시장 위험 ${m.basket.floor.toFixed(1)}%`, { anchor: "w" }),
        line(bell(-80, 90, 7, m.basket.s), { id: "cur", tone: "focus", weight: "bold" }),
        label([90, 0.024], `${m.basket.n}개 · 바구니 흔들림 ${m.basket.s.toFixed(1)}% · 기대수익 7%`, { anchor: "ne" }),
      ]),

      fee: figure(growthFrame({ static: "보수별 30년 복리" }), (m) => [
        grid({ y: 2000 }), axis("x", { ticks: [0, 5, 10, 15, 20, 25, 30] }), axis("y", { ticks: [0, 2000, 4000, 6000, 8000] }),
        line(years.map((t) => [t, growth(0.07, t)]), { id: "noFee", tone: "muted" }),
        label([30, growth(0.07, 30)], `보수 0% ${won(growth(0.07, 30))}`, { anchor: "w" }),
        line(years.map((t) => [t, growth(m.fees.r, t)]), { id: "withFee", tone: "focus", weight: "bold" }),
        label([30, m.fees.end], `보수 ${m.fees.fee.toFixed(1)}% ${won(m.fees.end)}`, { anchor: "w", tone: "focus" }),
        label([0, 8000], `30년 뒤 ${won(m.fees.end)} · 보수로 사라진 몫 ${(m.fees.lost * 100).toFixed(1)}%`, { anchor: "nw" }),
      ]),

      tax: figure(cartesian({ x: [0, 8000, "만원"], y: [0, 3, ""], static: "30년 뒤 남는 돈, 시작 1,000만원" }), () => {
        const rows = /** @type {[string, number, import("ltt").Tone][]} */ ([
          ["세금 없음", growth(0.07, 30), "ref"],
          ["끝에 한 번 낸다", P0 * (1 + (Math.pow(1.07, 30) - 1) * (1 - 0.154)), "focus"],
          ["매년 낸다", P0 * Math.pow(1 + 0.07 * (1 - 0.154), 30), "focus"],
        ]);
        return [
          axis("x", { ticks: [0, 2000, 4000, 6000, 8000] }),
          rows.map(([l, v, tone], i) => [
            rect([0, 2.7 - i], [v, 2.3 - i], { id: `tax${i}`, tone, fill: "solid", label: l }),
            label([v, 2.5 - i], won(v), { anchor: "w" }),
          ]),
        ];
      }),

      dcaPrice: figure(cartesian({ x: [0.5, 4.5, "월"], y: [0, 22000, "원"], static: "1주 가격" }), () => [
        axis("x", { ticks: [1, 2, 3, 4] }), axis("y", { ticks: 3, label: "가격 (1주)" }),
        line(DCA_PRICES.map((p, i) => [i + 1, p]), { id: "price", tone: "series2", weight: "bold" }),
        DCA_PRICES.map((p, i) => [dot([i + 1, p], { tone: "series2" }), label([i + 1, p], p.toLocaleString("ko-KR") + "원", { anchor: i === 1 ? "n" : "s" })]),
      ]),
      dcaShares: figure(cartesian({ x: [0.5, 4.5, "월"], y: [0, 22, "주"], static: "10만원으로 산 주식 수" }), () => [
        axis("x", { ticks: [1, 2, 3, 4] }), axis("y", { ticks: 3, label: "10만원으로 산 주식 수" }),
        DCA_SHARES.map((s, i) => [rect([i + 0.75, 0], [i + 1.25, s], { id: `shares${i}`, tone: "focus", fill: "solid" }), label([i + 1, s], s + "주", { anchor: "s" })]),
      ]),
      dca: split(["dcaPrice", "dcaShares"], { link: "shares1" }),

      timingStrip: figure(cells({ cols: 10, rows: 1, static: "10년 한 해 수익률" }), () =>
        TIMING.map((r, i) => cell(i, 0, { text: (r > 0 ? "+" : "−") + Math.abs(r) + "%", tone: BEST2.includes(r) ? "good" : WORST2.includes(r) ? "bad" : "muted" }))),
      timingBars: figure(cartesian({ x: [0, 3000, "만원"], y: [0, 5, ""], static: "10년 뒤 남는 돈" }), () => [
        axis("x", { ticks: 6 }),
        timingRows.map(([l, v, tone], i) => [
          rect([0, 4.65 - i], [v, 4.35 - i], { id: `timing${i}`, tone, fill: "solid", label: l }),
          label([v, 4.5 - i], won(v), { anchor: "w" }),
        ]),
        legend([{ tone: "good", text: "가장 좋은 두 해" }, { tone: "bad", text: "가장 나쁜 두 해" }]),
      ]),
      timing: split(["timingStrip", "timingBars"]),

      alloc: figure(cartesian({ x: [0, 100, "% 주식"], y: [-25, 10, "%"], static: "주식 비중별 기대수익과 나쁜 해" }), (m) => {
        const ws = range(0, 100, 10);
        return [
          grid({ y: 5 }), axis("x", { ticks: 5 }), axis("y", { ticks: 7 }),
          line(ws.map((w) => [w, expMix(w / 100)]), { id: "exp", tone: "focus", label: "기대수익" }),
          line(ws.map((w) => [w, badYear(expMix(w / 100), sigmaMix(w / 100))]), { id: "bad", tone: "bad", label: `나쁜 해 ${badYear(7, 18).toFixed(1)}%` }),
          label([0, badYear(4, 6)], `채권만 ${badYear(4, 6).toFixed(1)}%`, { anchor: "nw" }),
          line([[0, -15], [100, -15]], { id: "target", tone: "warn", dash: true, label: "목표선 −15%" }),
          sweep("x", m.alloc.wst, { id: "mk" }),
          label([m.alloc.wst, 10], `주식 ${m.alloc.wst}% · 채권 ${100 - m.alloc.wst}% · 기대수익 ${m.alloc.e.toFixed(1)}% · 흔들림 ${m.alloc.s.toFixed(1)}% · 나쁜 해 ${m.alloc.bad.toFixed(1)}%`, { anchor: "n" }),
        ];
      }),

      tree: figure(graph({ layout: "layered", direction: "right", static: "다음 개념 선수 관계" }), () => [
        node("now", "투자의 기본\n이번 수업", { tone: "focus", shape: "round" }),
        node("index", "인덱스펀드·ETF"), node("rebal", "리밸런싱"), node("tax", "연금저축·ISA 세제"),
        node("infl", "인플레이션과 실질수익률"), node("bond", "채권 금리와 가격"), node("emerg", "비상금과 투자 순서"),
        edge("now", "index"), edge("index", "rebal"), edge("now", "tax"), edge("now", "infl"), edge("infl", "bond"), edge("now", "emerg"),
      ]),
      overview: figure(graph({ layout: "layered", direction: "right", static: "처음 투자 계획 흐름" }), () => [
        node("pay", "월급"), node("dca", "매달 같은 금액\n5단 적립식"), node("mix", "비중 나누기\n2·5단 위험·배분"),
        node("stock", "주식 바구니\n3단 분산", { tone: "focus", group: "assets" }), node("bondN", "채권\n2단 흔들림 작음", { group: "assets" }),
        node("acct", "낮은 보수·세금 미루는 계좌\n4단 비용·세금"), node("time", "오래 복리\n1단 30년", { tone: "good" }),
        edge("pay", "dca"), edge("dca", "mix"), edge("mix", "stock"), edge("mix", "bondN"), edge("stock", "acct"), edge("bondN", "acct"), edge("acct", "time"),
      ]),
    },
    scenes: [
      { type: "steps", title: "같은 7%라도 복리는 30년 뒤 단리의 두 배를 넘는다", figure: "compound", steps: [
        { say: "단리 7%는 직선(3,100만원), 복리 7%는 7,612만원.", focus: ["simple", "comp"] },
        { say: "예금 복리 3%를 더한다.", focus: ["dep"] },
      ] },
      { type: "explore", title: "종목을 늘리면 흔들림은 줄지만 바닥이 있다", say: "담은 종목 수를 바꾼다.", figure: "nstk", focus: ["cur", "floor"],
        knobs: { nstk: ["1", "2", "5", "10", "20", "50"] },
        goal: { say: "흔들림이 20% 아래로 내려가는 가장 적은 종목 수를 찾는다", done: (m) => m.basket.n === 20 } },
      { type: "explore", title: "보수 1.5%는 30년 뒤 돈의 3분의 1을 가져간다", say: "보수를 바꿔 본다.", figure: "fee", focus: ["withFee"],
        knobs: { fee: ["0", "0.2", "0.5", "1", "1.5", "2"] } },
      { type: "explore", title: "주식 비중은 견딜 수 있는 나쁜 해로 정한다", say: "주식 비중을 바꾼다.", figure: "alloc", focus: ["mk", "bad", "target"],
        knobs: { wst: [0, 100, 10] },
        goal: { say: "나쁜 해 손실이 −15%보다 작으면서 기대수익이 가장 높은 주식 비중을 찾는다", done: (m) => m.alloc.wst === 60 } },
    ],
  };
};

const src = "archive/v1:site/gallery/finance/investing-basics.html";
/** @param {string} scene @param {import("../fragment").Prop[]} props @param {string[]} [candidates] @returns {import("../fragment").AuditRow} */
const row = (scene, props, candidates = []) => {
  const bad = props.some((p) => p.essential && (p.status === "lost" || p.status === "ambiguous"));
  return { fig: `investing-basics#${scene}`, src, corpus: "lesson", domain: "금융", props, verdict: bad ? "G" : "V", custom: [], candidates };
};

/** @type {import("../fragment").AuditRow[]} */
export const audit = [
  row("hook-art", [
    { id: "P1", cat: "G", text: "상승 추세 아이콘(art: trend)", essential: false, why: "v2 hook. 장식 아이콘이고 결론(예금 3% 30년 2,427만원)은 글에 있다", status: "ambiguous", by: "icon(name)", diff: "icon 이름 집합을 d.ts가 정하지 않는다" },
  ]),
  row("term-복리", [
    { id: "P1", cat: "G", text: "직선(단리) 위로 끝이 휘어 올라가는 곡선(복리)", essential: true, why: "v2 define(figure). 낱말 '이자에 이자'의 그림 요지가 휘는 곡선이다", status: "kept", by: "line, path Q 명령(PathCmd)" },
    { id: "P2", cat: "E", text: "복리 곡선이 더 굵고 강조색", essential: false, why: "핵심 대상 강조", status: "kept", by: "MarkOpts.tone focus, weight bold" },
  ]),
  row("term-변동성", [
    { id: "P1", cat: "G", text: "점선 평균 주위로 위아래 흩어지는 꺾은선", essential: true, why: "v2 define(figure). '평균에서 흩어지는 정도'", status: "kept", by: "line dash, line linear" },
  ]),
  row("term-분산투자", [
    { id: "P1", cat: "G", text: "큰 원 하나 대 작은 원 4×4", essential: true, why: "v2 define(figure). 한 덩어리 대 나눠 담기", status: "kept", by: "circle(center, radius, fill solid), aspect equal" },
  ]),
  row("term-보수", [
    { id: "P1", cat: "G", text: "막대 끝 약 23%가 빨갛게 떨어져 나간 몫", essential: true, why: "v2 define(figure). '해마다 떼어 가는 비용'", status: "kept", by: "rect, 뒤에 그린 mark가 위에 칠해짐(MarkOpts JSDoc), tone bad" },
  ]),
  row("term-적립식", [
    { id: "P1", cat: "G", text: "같은 높이 막대 4개(매달 같은 금액)", essential: true, why: "v2 define(figure). '매달 같은 금액'", status: "kept", by: "rect 데이터 좌표" },
  ]),
  row("compound", [
    { id: "P1", cat: "Q", text: "0–30년 × 0–8,000만원 선형 축에 단리 1000(1+0.07t), 복리 1000·1.07^t, 예금 1000·1.03^t", essential: true, why: "v2 steps. 제목 '복리는 30년 뒤 단리의 두 배를 넘는다'가 같은 축의 두 곡선 높이 비교에 기댄다", status: "kept", by: "cartesian x/y Axis(단위), line(P[] 데이터 단위)" },
    { id: "P2", cat: "X", text: "끝값 글자 3,100·7,612·2,427만원", essential: true, why: "결론의 숫자", status: "kept", by: "label(at, Text)" },
    { id: "P3", cat: "T", text: "1단계 단리·복리, 2단계 예금 3% 추가", essential: true, why: "②의 '4%p 차이가 5,000만원 넘게 벌어진다'는 추가된 선에 기댄다", status: "kept", by: "TimeSpec steps, Steps 'Each step advances the figure's steps index', ctx.step" },
    { id: "P4", cat: "E", text: "복리 선 굵게", essential: false, why: "핵심 곡선", status: "kept", by: "weight bold, tone focus" },
  ]),
  row("risk", [
    { id: "P1", cat: "Q", text: "−50~60% 축 위 정규밀도 N(7,18), N(4,6) 곡선과 넓이", essential: true, why: "v2 explain. '기대수익이 높을수록 넓게 흩어진다'는 두 분포 폭 비교", status: "kept", by: "cartesian Axis, line, area(base 0 'Filled between pts and y = base')" },
    { id: "P2", cat: "Q", text: "예금 3% 단일 수직선", essential: true, why: "예금은 매년 같음", status: "kept", by: "line 데이터 좌표" },
    { id: "P3", cat: "Q", text: "나쁜 해 μ−1.645σ 점선: 주식 −22.6%, 채권 −5.9% 글자", essential: true, why: "narration의 나쁜 해 손실 수치", status: "kept", by: "line dash, label Text" },
    { id: "P4", cat: "E", text: "주식 굵게·강조색, 나쁜 해 bad 색", essential: false, why: "", status: "kept", by: "Tone focus/bad, weight" },
  ]),
  row("drag", [
    { id: "P1", cat: "Q", text: "100→150→75 경로와 100 수평 경로, 50–160 축", essential: true, why: "v2 explain. 제목 '+50% 뒤 −50%면 25%를 잃는다'", status: "kept", by: "cartesian, line, dot" },
    { id: "P2", cat: "X", text: "x 눈금 '시작·1년 뒤·2년 뒤'", essential: false, why: "", status: "approx", diff: "axis ticks는 숫자뿐이라 0·1·2년으로 표시된다" },
    { id: "P3", cat: "X", text: "'+50% → 150', '−50% → 75', '매년 0% → 100'", essential: true, why: "결론 수치", status: "kept", by: "label, MarkOpts.label" },
  ]),
  row("paths", [
    { id: "P1", cat: "Q", text: "seed 4 모의 20종목 경로와 평균 바구니, 0–20년 × 0.05–30배 로그축, 눈금 0.05…20", essential: true, why: "v2 explain. '흐린 선은 종목, 굵은 선은 바구니'와 0.09~18.99배 갈라짐", status: "kept", by: "cartesian log 'y', axis ticks number[], rng 'mulberry32(seed >>> 0)… same sequence'" },
    { id: "P2", cat: "T", text: "6초 동안 해 단위로 경로가 그려지고 끝에서 멈춤", essential: false, why: "v1 LTT.clock dur 6000", status: "kept", by: "Loop ms 6000, span [0,20], once 'Play once, then hold the end state'" },
    { id: "P3", cat: "X", text: "끝에서 '20개 중 16개 바구니보다 낮게, 11개 원금 아래', 최고·최저 배수, 바구니 1.99배", essential: true, why: "앞 predict 정답(16개)의 근거", status: "kept", by: "label Text, draw(m,t) 조건부 MarkTree(false 허용)" },
    { id: "P4", cat: "E", text: "종목 선 흐리게(opacity 0.4, thin), 바구니 굵게", essential: true, why: "제목이 흐림/굵음 구분을 말한다", status: "kept", by: "MarkOpts.opacity, weight thin/bold" },
    { id: "P5", cat: "Q", text: "원금 1배 점선", essential: false, why: "", status: "kept", by: "line dash" },
  ]),
  row("nstk", [
    { id: "P1", cat: "Q", text: "N(7, σ_p(N)) 분포, σ_p = 40√(1/N+(1−1/N)0.2), −80~90% 축", essential: true, why: "v2 explore. '흔들림은 줄지만 바닥이 있다'", status: "kept", by: "model fn, line(P[]), Axis" },
    { id: "P2", cat: "Q", text: "바닥 17.9% 점선 분포", essential: true, why: "제목의 '바닥'", status: "kept", by: "line dash" },
    { id: "P3", cat: "I", text: "종목 수 단계 1·2·5·10·20·50 선택", essential: true, why: "단계를 눌러 바꾼다", status: "approx", diff: "숫자 단계는 string[] 선택지로만 줄 수 있어 param이 문자열이 되고 모델에서 Number 변환한다(값은 같음)" },
    { id: "P4", cat: "I", text: "목표: σ<20%가 되는 최소 N(=20) 찾기", essential: false, why: "", status: "kept", by: "Explore.goal done(m)" },
    { id: "P5", cat: "X", text: "현재 흔들림 % 수치 표시", essential: true, why: "목표 판단에 필요", status: "kept", by: "label Text 함수 재평가(Text JSDoc)" },
  ], ["discrete-numeric-knob"]),
  row("fee", [
    { id: "P1", cat: "Q", text: "compound와 같은 0–30년 × 0–8,000만원 축, 보수 0% 7% 복리 회색 선과 (7−fee)% 복리 선", essential: true, why: "v2 explore. '3번 장면과 같은 축'과 '1.5%가 3분의 1'", status: "kept", by: "같은 cartesian Axis 값을 공유(growthFrame), line" },
    { id: "P2", cat: "I", text: "보수 0·0.2·0.5·1·1.5·2% 단계, 기본 1.5", essential: true, why: "단계를 눌러 바꾼다", status: "approx", diff: "string[] 선택지로 문자열 param을 Number 변환" },
    { id: "P3", cat: "X", text: "끝값 만원과 사라진 몫 %(1.5%에서 34.5%)", essential: true, why: "제목 3분의 1", status: "kept", by: "label Text 함수" },
  ], ["discrete-numeric-knob"]),
  row("tax", [
    { id: "P1", cat: "Q", text: "0–8,000만원 가로 막대 3개: 7,612 / 6,594 / 5,618만원", essential: true, why: "v2 explain. '매년 내느냐, 끝에 한 번 내느냐가 다르다'", status: "kept", by: "rect 데이터 좌표, axis ticks" },
    { id: "P2", cat: "E", text: "세금 없음 막대는 기준(floor) 톤", essential: false, why: "", status: "kept", by: "Tone ref" },
    { id: "P3", cat: "X", text: "행 이름과 값 글자, 제목·출처", essential: true, why: "막대가 무엇인지", status: "approx", diff: "행 이름은 rect label로 붙고 위치는 runtime이 정하며 chartFrame 제목·출처 칸은 figure에 없어 장면 글로 옮겨야 한다" },
    { id: "P4", cat: "T", text: "막대 등장 애니메이션(hb.play)", essential: false, why: "", status: "lost" },
  ]),
  row("dca", [
    { id: "P1", cat: "Q", text: "월별 가격 10,000·5,000·10,000·20,000원 꺾은선(0–22,000원)", essential: true, why: "v2 explain. '싼 달에 더 많은 주식'", status: "kept", by: "cartesian 단위 축, line, dot" },
    { id: "P2", cat: "Q", text: "같은 달 아래 산 주식 수 막대 10·20·10·5주(0–22주)", essential: true, why: "같음", status: "kept", by: "rect" },
    { id: "P3", cat: "S", text: "두 패널이 같은 월 x 위치로 위아래 정렬", essential: true, why: "가격 낮은 달 = 막대 긴 달을 눈으로 대응", status: "approx", diff: "split은 'side by side'라 위아래 정렬이 아니고 x 위치 공유를 보장하지 않지만, 두 패널 모두 같은 1–4월 눈금을 가져 대응은 읽힌다" },
  ], ["stacked-panels-shared-x"]),
  row("timing", [
    { id: "P1", cat: "Q", text: "10년 수익률 칸, 좋은 두 해 초록·나쁜 두 해 빨강", essential: true, why: "v2 explain. 어느 해를 빼는지", status: "kept", by: "cells, cell text, Tone good/bad" },
    { id: "P2", cat: "Q", text: "0–3,000만원 가로 막대 5개: 2,666 / 1,814 / 1,741 / 1,344 / 1,184만원, 이 순서", essential: true, why: "제목 '좋은 해 두 번 놓치면 예금보다 못하다'", status: "kept", by: "rect 데이터 좌표" },
    { id: "P3", cat: "S", text: "칸 띠가 막대 위에 있음", essential: false, why: "", status: "approx", diff: "split은 좌우 배치" },
  ]),
  row("alloc", [
    { id: "P1", cat: "Q", text: "주식 비중 0–100% × −25~10% 축의 기대수익선과 나쁜 해선(μ−1.645σ_mix)", essential: true, why: "v2 explore. '비중은 견딜 수 있는 나쁜 해로 정한다'", status: "kept", by: "model, line, cartesian Axis" },
    { id: "P2", cat: "Q", text: "목표선 −15% 점선(warn)", essential: true, why: "goal 기준", status: "kept", by: "line dash, Tone warn" },
    { id: "P3", cat: "I", text: "비중 0–100 10 단위 슬라이더, 현재 위치 세로선", essential: true, why: "", status: "kept", by: "Explore.knobs [min,max,step], sweep('x', at)" },
    { id: "P4", cat: "X", text: "현재 기대수익·흔들림·나쁜 해 수치", essential: true, why: "목표 판단", status: "kept", by: "label Text 함수" },
    { id: "P5", cat: "I", text: "목표: 나쁜 해 > −15% 중 최대 비중(60%)", essential: false, why: "", status: "kept", by: "Explore.goal" },
  ]),
  row("tree", [
    { id: "P1", cat: "G", text: "이번 수업에서 갈라지는 선수 관계 간선, 오른쪽일수록 앞 개념 필요", essential: true, why: "v2 explain(마지막 절 다음 개념; Concept.leadsTo와도 겹침). sub가 방향을 말한다", status: "kept", by: "graph layout layered, direction right, edge directed" },
    { id: "P2", cat: "E", text: "'투자의 기본' 강조(accent ring)", essential: false, why: "", status: "kept", by: "Tone focus" },
    { id: "P3", cat: "G", text: "노드 아이콘", essential: false, why: "", status: "lost", diff: "node에 icon 옵션이 없다" },
  ], ["node-icon"]),
  row("overview", [
    { id: "P1", cat: "G", text: "월급→적립→비중→(주식|채권)→계좌→복리 흐름, 주식·채권 같은 열", essential: true, why: "v2 summary.figures. 계획 한 장의 순서", status: "approx", diff: "같은 열은 group으로만 묶이며 layered 배치가 같은 층을 보장한다는 문장은 없지만 간선 깊이가 같아 층이 같다", by: "graph layered, node group" },
    { id: "P2", cat: "X", text: "상자 아래 작은 글 '몇 단 무엇'", essential: true, why: "caption이 그 글을 가리킨다", status: "approx", diff: "부제가 따로 없어 줄바꿈 한 Text로 넣으며 작은 글자 구분을 잃는다" },
    { id: "P3", cat: "E", text: "주식 accent, 오래 복리 good", essential: false, why: "", status: "kept", by: "Tone focus/good" },
  ], ["node-subtitle", "node-icon"]),
];
