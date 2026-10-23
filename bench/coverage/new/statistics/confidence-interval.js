// @ts-check
/** @typedef {import("ltt").P} P */
/** @type {import("../../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, cells, cell, axis, rect, line, label, dot, math, sweep, split, rng } = api;
  const P0 = 0.04;
  const binom = (/** @type {() => number} */ r, /** @type {number} */ n) => { let k = 0; for (let i = 0; i < n; i++) if (r() < P0) k++; return k; };
  const pop = model({ seed: 3, draws: 5 }, ({ seed, draws }) => {
    const r = rng(seed), idx = Array.from({ length: 10000 }, (_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const buyer = new Set(idx.slice(0, 400));
    const samples = Array.from({ length: draws }, (_, s) => {
      const rr = rng(seed * 100 + s), pick = Array.from({ length: 10000 }, (_, i) => i);
      for (let i = 0; i < 500; i++) { const j = i + Math.floor(rr() * (10000 - i)); [pick[i], pick[j]] = [pick[j], pick[i]]; }
      const chosen = pick.slice(0, 500);
      return { chosen, rate: chosen.filter((i) => buyer.has(i)).length / 500 };
    });
    return { buyer: [...buyer], samples };
  }, "모집단 10,000명 중 구매자 정확히 400명(4%) 무작위 배치, 비복원 500명 추출");
  const dots = model({ reps: 1000 }, ({ reps }) => { const r = rng(11); return { rates: Array.from({ length: reps }, () => binom(r, 500) / 500) }; }, "이항분포 n=500, p=0.04 시뮬레이션");
  const se = model({ n: 500 }, ({ n }) => { const s = Math.sqrt((P0 * (1 - P0)) / n); return { n, se: s, half: 1.96 * s, ok: 1.96 * s <= 0.01 }; }, "SE = √(p(1−p)/n), p=0.04");
  const ci = model({ n: 500 }, ({ n }) => {
    const r = rng(n + 7);
    const rows = Array.from({ length: 100 }, () => { const p = binom(r, n) / n, h = 1.96 * Math.sqrt((p * (1 - p)) / n); return { p, lo: p - h, hi: p + h, hit: p - h <= P0 && P0 <= p + h, h }; });
    return { rows, hits: rows.filter((x) => x.hit).length, meanHalf: rows.reduce((a, x) => a + x.h, 0) / 100 };
  }, "Wald 구간 p̂±1.96·√(p̂(1−p̂)/n)");
  const pdf = (/** @type {number} */ x, /** @type {number} */ s) => Math.exp(-0.5 * ((x - 4) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  /** @param {import("ltt").Outputs} m */
  const ciDraw = (m, /** @type {number} */ k) => [
    axis("x", { label: "전환율", ticks: [2, 3, 4, 5, 6] }), axis("y", { label: "추출 번호" }),
    sweep("x", 4, { id: "truth", tone: "ref", label: "진짜 값 4% (고정)" }),
    m.ci.rows.slice(0, k).map((/** @type {{lo:number;hi:number;p:number;hit:boolean}} */ c, /** @type {number} */ i) => [
      line([[c.lo * 100, i + 1], [c.hi * 100, i + 1]], { id: `ci-${i}`, tone: c.hit ? "muted" : "bad", weight: c.hit ? "thin" : "bold" }), dot([c.p * 100, i + 1], { size: "s" })]),
  ];
  return {
    models: { pop, dots, se, ci },
    figures: {
      f1: figure(cells({ cols: 126, rows: 100, steps: ["표본 1", "표본 2", "표본 3", "표본 4", "표본 5"] }), (m, t, ctx) => {
        const buyer = new Set(m.pop.buyer), s = m.pop.samples[ctx.step];
        return [
          Array.from({ length: 10000 }, (_, i) => cell(i % 100, Math.floor(i / 100), { id: `c-${i}`, tone: buyer.has(i) ? "focus" : "muted", opacity: s.chosen.includes(i) ? 1 : 0.35 })),
          s.chosen.map((/** @type {number} */ i, /** @type {number} */ j) => cell(105 + (j % 20), 75 - Math.floor(j / 20), { id: `s-${j}`, from: `c-${i}`, tone: buyer.has(i) ? "focus" : "muted" })),
          label([115, 85], `표본 전환율 ${(s.rate * 100).toFixed(1)}%`, { id: "rate", weight: "bold", size: "l" }),
          label([115, 92], "진짜 전환율 4%", { id: "true-rate", size: "s", tone: "muted" }),
          label([50, -3], "실제로는 모집단 전체를 볼 수 없음", { id: "god-view", size: "s", tone: "muted" }),
        ];
      }),
      f2: figure(cartesian({ x: [2, 6, "%"], y: [0, 110, "회"], loop: { ms: 200000, span: [0, 1000], once: true } }), (m, t) => {
        const k = Math.floor(t), stack = /** @type {Record<number, number>} */ ({});
        return [axis("x", { ticks: [2, 3, 4, 5, 6] }), axis("y", { label: "추출 횟수" }), sweep("x", 4, { id: "truth", tone: "ref" }),
          m.dots.rates.slice(0, k).map((/** @type {number} */ r, /** @type {number} */ i) => {
            const b = Math.round(r * 500); stack[b] = (stack[b] ?? 0) + 1;
            return dot([b * 0.2, stack[b] - 0.5], { id: i === k - 1 ? "last" : undefined, size: "s", tone: i === k - 1 ? "focus" : "muted" });
          })];
      }),
      f3: figure(cartesian({ x: [2, 6, "%"], y: [0, 2.2, "밀도(1/%p)"], static: "n에 따른 표본분포 정규곡선" }), (m) => {
        const s = m.se.se * 100;
        return [axis("x", { ticks: [2, 3, 4, 5, 6] }), axis("y"),
          line(Array.from({ length: 201 }, (_, i) => /** @type {P} */ ([2 + i * 0.02, pdf(2 + i * 0.02, s)])), { id: "curve", curve: "smooth", tone: "focus" }),
          rect([3, 0], [5, 0.05], { id: "target", tone: "good", fill: "soft", label: "±1%p" }),
          label([5.5, 2], (mm) => `n=${Math.round(mm.se.n)}, SE=${(mm.se.se * 100).toFixed(2)}%p, 95% ±${(mm.se.half * 100).toFixed(2)}%p`, { id: "se-label" })];
      }),
      f4f: figure(cartesian({ x: [0, 10, ""], y: [0, 4, ""], static: "SE 공식 항" }), (m, t, ctx) => [
        math([2, 3], "SE=", { id: "lhs" }),
        math([4, 3], "\\sqrt{\\quad\\quad\\quad}", { id: "sqrt", tone: "focus", size: "l", weight: "bold" }),
        math([4.4, 3], "\\frac{p(1-p)}{n}", { id: "frac", tone: ctx.params.term === "n" || ctx.params.term === "p(1−p)" ? "focus" : "muted" }),
        rect([1, 0], [1 + 8 * 0.0088 / 0.009, 0.6], { id: "se500", fill: "solid", tone: "series1", label: "n=500: SE 0.88%p" }),
        rect([1, 1], [1 + 8 * 0.0044 / 0.009, 1.6], { id: "se2000", fill: "solid", tone: "series2", label: "n=2000 (4배): SE 0.44%p (1/2)" })]),
      f4c: figure(cartesian({ x: [2, 6, "%"], y: [0, 1, "밀도(1/%p)"], static: "곡선 폭" }), (m, t, ctx) => [axis("x"),
        line(Array.from({ length: 201 }, (_, i) => /** @type {P} */ ([2 + i * 0.02, pdf(2 + i * 0.02, m.se.se * 100)])), { id: "w-curve", tone: ctx.params.term ? "focus" : "muted" }),
        line([[4 - m.se.se * 100, 0.3], [4 + m.se.se * 100, 0.3]], { id: "w-se", tone: "focus", label: "±1 SE" })]),
      f4: split(["f4f", "f4c"], { link: "term" }),
      f5: figure(cartesian({ x: [1.5, 6.5, "%"], y: [0, 101, "번"], steps: ["1개", "10개", "100개"] }), (m, t, ctx) => {
        const k = [1, 10, 100][ctx.step];
        return [ciDraw(m, k), label([6.3, 98], `적중 ${m.ci.rows.slice(0, k).filter((/** @type {{hit:boolean}} */ c) => c.hit).length}/${k}`, { id: "counter", anchor: "e" }),
          label([4, -6], "고정된 것은 진짜 값, 움직이는 것은 구간", { id: "fixed", anchor: "n" })];
      }),
      f6: figure(cartesian({ x: [2, 6, "%"], y: [0, 101, "번"], static: "구간 100개" }), (m) => [ciDraw(m, 100),
        label([5.9, 98], (mm) => `평균 폭 ±${(mm.ci.meanHalf * 100).toFixed(2)}%p`, { anchor: "e" }),
        label([5.9, 92], (mm) => `적중률 ${mm.ci.hits}%`, { id: "hit-rate", anchor: "e", tone: "focus", weight: "bold" })]),
      f7: figure(cartesian({ x: [3, 5.5, "%"], y: [0, 1, ""], static: "보고서 CI와 기준값" }), () => [axis("x", { ticks: [3, 3.5, 4, 4.5, 5, 5.5] }),
        line([[3.6, 0.5], [4.8, 0.5]], { id: "bar", weight: "bold", tone: "focus" }), dot([4.2, 0.5], { id: "est", tone: "focus", label: "4.2%" }),
        sweep("x", 3.5, { id: "baseline", tone: "ref", label: "지난 캠페인 3.5%(구간 밖)" }),
        label([4.25, 0.15], "이 하나의 구간은 맞았거나 틀렸다; 95%는 방법의 성공률", { id: "meaning" })]),
    },
    scenes: [
      { type: "steps", title: "표본을 또 뽑으면", figure: "f1", steps: [1, 2, 3, 4, 5].map((i) => ({ say: `표본 ${i}`, focus: ["rate"] })) },
      { type: "explore", title: "표본 크기와 흔들림", say: "n을 바꾼다", figure: "f3", focus: ["curve", "se-label"], knobs: { n: { range: [100, 10000], step: 1, log: true } },
        goal: { say: "±1%p 안에 95%가 들어오게 하는 n을 찾아라", done: (m) => m.se.ok && m.se.n <= 1600 } },
      { type: "explore", title: "표준오차 공식 읽기", say: "항을 골라 곡선 폭과 잇는다", figure: "f4", focus: ["sqrt"], knobs: { term: ["p(1−p)", "n", "√"], n: [100, 10000, 100] } },
      { type: "steps", title: "신뢰구간 100개", figure: "f5", steps: [{ say: "1개", focus: ["ci-0"] }, { say: "10개", focus: ["counter"] }, { say: "100개", focus: ["counter", "fixed"] }] },
      { type: "compare", title: "n=500 대 n=5000", say: "폭은 줄고 적중률은 같다", figure: "f6", focus: ["hit-rate"], a: { n: 500 }, b: { n: 5000 }, labels: ["n=500", "n=5,000"] },
    ],
  };
};

const SRC = "bench/coverage/new/statistics/confidence-interval.brief.md";
/** @param {string} fig @param {import("../../fragment").Prop[]} props @param {string[]} [candidates] @returns {import("../../fragment").AuditRow} */
const row = (fig, props, candidates = []) => {
  const ess = props.filter((p) => p.essential);
  const verdict = ess.some((p) => p.status === "lost" || p.status === "ambiguous") ? "G" : "V";
  return { fig: `confidence-interval#${fig}`, src: SRC, corpus: "new-b1", domain: "통계", props, verdict, custom: [], candidates };
};
/** @type {import("../../fragment").AuditRow[]} */
export const audit = [
  row("F1", [
    { id: "P1", cat: "Q", text: "100×100 점, 구매자 정확히 400개 무작위", essential: true, why: "", status: "kept", by: "cells frame 'Points are [col, row]'; model 셔플 후 400개" },
    { id: "P2", cat: "T", text: "클릭마다 500개 점이 빛나며 표본 상자로 이동, 표본 전환율 표시", essential: true, why: "", status: "kept", by: "Steps 'Each step advances the figure's steps index'; MarkOpts.from 'Mark id this mark animates out of'" },
    { id: "P3", cat: "E", text: "진짜 4% 회색 작게, 표본값 굵게", essential: true, why: "", status: "kept", by: "label tone muted size s / weight bold size l" },
    { id: "P4", cat: "X", text: "'실제로는 모집단 전체를 볼 수 없음'", essential: true, why: "", status: "kept", by: "label god-view" },
  ]),
  row("F2", [
    { id: "P1", cat: "Q", text: "x 2.0–6.0%, 0.2%p 구간, 점=1회, 이항 n=500 p=0.04", essential: true, why: "1/500=0.2%p라 구간 하나가 성공 수 하나", status: "kept", by: "Axis [2,6,'%']; api.rng 이항 시뮬레이션; dot per draw" },
    { id: "P2", cat: "T", text: "자동 재생 1회/0.2초, 최대 1,000회", essential: true, why: "", status: "kept", by: "Loop {ms:200000, span:[0,1000], once:true} 'maps span linearly onto ms'" },
    { id: "P3", cat: "G", text: "4% 수직 기준선", essential: true, why: "", status: "kept", by: "sweep('x', 4)" },
    { id: "P4", cat: "E", text: "마지막 점 강조", essential: false, why: "", status: "kept", by: "dot tone focus id last" },
  ]),
  row("F3", [
    { id: "P1", cat: "I", text: "n 슬라이더 100–10,000 로그 눈금", essential: true, why: "", status: "kept", by: "Explore.knobs {range, log:true}" },
    { id: "P2", cat: "Q", text: "SE=√(0.04·0.96/n); n=500 0.88%p, n=2000 0.44%p", essential: true, why: "값 검증 맞음(0.876, 0.438)", status: "kept", by: "model se; line 정규 pdf" },
    { id: "P3", cat: "G", text: "x축 고정 2%–6%", essential: true, why: "", status: "kept", by: "Axis 고정(camera 미사용)" },
    { id: "P4", cat: "I", text: "목표: ±1%p 안에 95% 되는 n(≈1,475)", essential: true, why: "값 검증: 1.96²·0.0384/0.0001=1,475.2", status: "kept", by: "Explore.goal.done" },
    { id: "P5", cat: "X", text: "현재 SE 라벨", essential: true, why: "", status: "kept", by: "label Text 함수" },
  ]),
  row("F4", [
    { id: "P1", cat: "S", text: "왼쪽 공식, 오른쪽 곡선; 항 hover 시 대응 강조", essential: true, why: "", status: "approx", diff: "hover 대신 term knob 선택; split의 좌우 순서는 d.ts가 정하지 않음" },
    { id: "P2", cat: "Q", text: "n 4배 → SE 1/2 막대 두 개", essential: true, why: "", status: "kept", by: "rect 길이 데이터 단위 비례" },
    { id: "P3", cat: "E", text: "√ 기호 가장 강조", essential: true, why: "", status: "approx", diff: "TeX 일부만 강조할 수 없어 √를 별도 math mark로 겹쳐 그림; 두 mark 정렬은 보장되지 않는다" },
  ], ["hover-link", "math-part-highlight"]),
  row("F5", [
    { id: "P1", cat: "Q", text: "p̂±1.96·SE, n=500; y 1–100", essential: true, why: "", status: "kept", by: "model ci; line per row" },
    { id: "P2", cat: "G", text: "진짜 값 4% 수직선", essential: true, why: "", status: "kept", by: "sweep" },
    { id: "P3", cat: "E", text: "빗나간 구간(기댓값 약 5개) 빨강", essential: true, why: "", status: "kept", by: "tone bad" },
    { id: "P4", cat: "T", text: "1 → 10 → 100개, 적중 카운터", essential: true, why: "", status: "kept", by: "TimeSpec steps; label counter" },
    { id: "P5", cat: "X", text: "'고정된 것은 진짜 값, 움직이는 것은 구간'", essential: true, why: "", status: "kept", by: "label fixed" },
  ]),
  row("F6", [
    { id: "P1", cat: "S", text: "좌우 동일 x축 2%–6%", essential: true, why: "", status: "kept", by: "Compare 'Same figure ... side by side'" },
    { id: "P2", cat: "Q", text: "평균 폭 n=500 ±1.72%p, n=5,000 ±0.54%p", essential: true, why: "값 검증 맞음(1.716, 0.543)", status: "kept", by: "model ci meanHalf" },
    { id: "P3", cat: "E", text: "두 조건 적중률 약 95% 강조", essential: true, why: "", status: "kept", by: "label hit-rate tone focus bold" },
  ]),
  row("F7", [
    { id: "P1", cat: "Q", text: "수직선 3%–5.5%, 점 4.2, 막대 3.6–4.8, 기준 3.5", essential: true, why: "", status: "kept", by: "Axis; line, dot, sweep" },
    { id: "P2", cat: "G", text: "기준값이 막대 밖", essential: true, why: "", status: "kept", by: "데이터 좌표 3.5 < 3.6" },
    { id: "P3", cat: "X", text: "'이 하나의 구간은 맞았거나 틀렸다; 95%는 방법의 성공률'", essential: true, why: "", status: "kept", by: "label meaning" },
  ]),
];
