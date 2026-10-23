// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, cells, graph, rect, label, flow, line, dot, arrow, axis, grid, sweep, cell, node, edge, icon, legend } = api;
  const N = 7e9, W = 2 * N, F = 989e12, BW = 3.35e12, BW_H200 = 4.8e12;
  /** @param {number} bw */
  const tRead = (bw) => (W / bw) * 1e3;
  /** @param {number} f @param {number} b */
  const tComp = (f, b) => ((b * 2 * N) / f) * 1e3;
  /** @param {number} v @param {number} d */
  const fmt = (v, d) => v.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const inf = model(
    { kF: 1, kB: 1, B: 1, kR: 1 },
    (p) => {
      const tr = tRead(BW * p.kB), tc = tComp(F * p.kF, 1), st = Math.max(tr, tc);
      const f = F * p.kR, B = Math.round(p.B), stB = Math.max(tRead(BW), tComp(f, B));
      return { tr, tc, st, tps: 1e3 / st, f, B, att: Math.min(f / 1e12, (B * BW) / 1e12), stB, tot: (B / stB) * 1e3, pu: 1e3 / stB, ridge: f / BW };
    },
    "t_read = 2N/BW, t_comp = 2NB/F, step = max (Williams et al. 2009 Roofline; NVIDIA H100 datasheet 989 TFLOPS, 3.35 TB/s)",
  );
  /** @param {number} fl @param {number} bw @returns {import("ltt").P[]} */
  const roofPts = (fl, bw) => [0.5, fl / bw, 4096].map((I) => /** @type {import("ltt").P} */ ([I, Math.min(fl, I * bw) / 1e12]));

  const sch = () => cartesian({ x: [0, 100, "도식"], y: [0, 100, "GB"], static: "" });

  const figures = {
    gpu: figure(cartesian({ x: [0, 100, "도식"], y: [0, 100, "GB"], loop: { ms: 3000, span: [0, 1] } }), (m, t) => [
      rect([3, 10], [25, 90], { id: "hbm", fill: "none", label: "HBM 메모리 80 GB" }),
      rect([3, 10], [25, 24], { id: "weights", tone: "focus", fill: "solid", label: "7B 모델 가중치 14 GB" }),
      label([4, 26], "칠한 높이 = 14/80 (실제 비율)", { tone: "muted", anchor: "sw" }),
      rect([25, 47], [63, 53], { id: "pipe", fill: "soft", tone: "warn" }),
      flow([[26, 50], [62, 50]], { id: "bytes", n: 9, rate: 1, seed: 1, t, tone: "warn" }),
      label([44, 60], "3.35 TB/s", { tone: "warn", size: "l" }),
      label([44, 42], "통로: HBM 대역폭 · 1초에 3.35조 바이트", { tone: "muted" }),
      rect([63, 5], [97, 92], { id: "compute", fill: "none", label: "계산부: SM 132개" }),
      Array.from({ length: 132 }, (_, i) => rect([65 + (i % 12) * 2.6, 20 + Math.floor(i / 12) * 6], [67.2 + (i % 12) * 2.6, 24.6 + Math.floor(i / 12) * 6], { id: `sm${i}`, tone: "series2", fill: "soft" })),
      label([80, 10], "989 TFLOPS · 1초에 989조 번 계산 (BF16)", { tone: "series2", size: "l" }),
      label([3, 2], "크기·간격은 축척 아님 (HBM 높이만 실제 비율)", { tone: "muted", anchor: "sw" }),
    ]),

    decode: figure(
      cartesian({ x: [0, 100, "도식"], y: [0, 33, "층"], loop: { ms: 6000, span: [0, tRead(BW)], once: true } }),
      (m, t) => {
        const k = Math.min(32, Math.floor((t / tRead(BW)) * 32 + 1e-9));
        return [
          label([5, 33], "HBM의 가중치: 32층 × 0.44 GB", { anchor: "sw" }),
          Array.from({ length: 32 }, (_, i) => rect([5, i + 0.1], [30, i + 0.9], { id: `L${i + 1}`, tone: i < k ? "focus" : "muted", fill: i < k ? "solid" : "soft" })),
          label([4, 0.5], "1층", { anchor: "e", tone: "muted" }),
          label([4, 31.5], "32층", { anchor: "e", tone: "muted" }),
          arrow([31, Math.max(0, k - 1) + 0.5], [42, 29], { id: "read-arrow", tone: "focus" }),
          rect([42, 26], [60, 32], { id: "compute", fill: "none", label: "계산부 · 가중치 하나당 곱 1·덧셈 1" }),
          label([65, 28], `읽은 층 ${k} / 32`, { id: "k", size: "l" }),
          label([65, 22], `HBM에서 읽은 바이트 ${fmt((14 * k) / 32, 1)} GB`, { id: "gb", tone: "warn", size: "l" }),
          label([65, 16], `경과 시간 ${fmt((tRead(BW) * k) / 32, 2)} ms (3.35 TB/s)`, { id: "ms", tone: "warn", size: "l" }),
          label([65, 10], `계산량 ${fmt((14 * k) / 32, 1)} GFLOP`, { id: "fl", tone: "series2", size: "l" }),
          label([5, -1], "느리게 재생: 실제 4.18 ms를 6초로 늘림", { id: "slow", tone: "muted", anchor: "nw" }),
        ];
      },
    ),

    answer: figure(cartesian({ x: [0, 4.5, "ms"], y: [0, 3, ""], static: "HBM 읽기 4.18 ms 막대와 계산 0.014·0.007 ms 막대" }), () => [
      axis("x", { label: "ms" }),
      rect([0, 2.2], [tRead(BW), 2.8], { id: "read", tone: "warn", fill: "solid", label: "HBM 읽기 4.18 ms (그대로)" }),
      rect([0, 1.2], [tComp(F, 1), 1.8], { id: "c1", tone: "series2", fill: "solid", label: "계산 ×1 0.014 ms" }),
      rect([0, 0.2], [tComp(2 * F, 1), 0.8], { id: "c2", tone: "series2", fill: "solid", label: "계산 ×2 0.007 ms" }),
    ]),

    times: figure(cartesian({ x: [0, 5, "ms"], y: [0, 2, ""], static: "읽기·계산 시간 막대와 긴 쪽 표시" }), (m) => {
      const o = m.inf;
      return [
        grid({ x: 1 }),
        axis("x", { label: "ms", ticks: [0, 1, 2, 3, 4, 5] }),
        rect([0, 1.2], [o.tr, 1.7], { id: "read", tone: "warn", fill: "solid", label: `HBM 읽기 ${fmt(o.tr, 2)} ms` }),
        rect([0, 0.3], [o.tc, 0.8], { id: "comp", tone: "series2", fill: "solid", label: `계산 ${fmt(o.tc, 4)} ms (너무 짧아 거의 안 보임)` }),
        sweep("x", o.st, { id: "step", tone: "focus", label: "한 토큰 시간 = 긴 쪽" }),
        label([4.9, 1.95], `${fmt(o.st, 2)} ms / 토큰 · ${fmt(o.tps, 0)} 토큰/초 (사용자 1명)`, { id: "tps", anchor: "ne", size: "l" }),
        label([0, -0.3], "7B, 배치 1. 읽기·계산 겹침 가정 이상적 상한. KV 캐시·어텐션 제외", { tone: "muted", anchor: "nw" }),
      ];
    }),

    intensity: figure(cells({ cols: 25, rows: 12, static: "295칸 중 1칸만 켜진 격자" }), () => [
      Array.from({ length: 295 }, (_, i) => cell(i % 25, Math.floor(i / 25), { id: i === 0 ? "used" : `c${i}`, tone: i === 0 ? "warn" : "muted", fill: i === 0 ? "solid" : "soft" })),
      label([0, 12.5], "HBM에서 1바이트가 도착하는 동안 할 수 있는 계산: 295칸 (한 칸 = 1 FLOP, 989 TFLOPS ÷ 3.35 TB/s)", { anchor: "sw" }),
      label([18, 9], "decode 배치 1: 1 FLOP/B", { id: "ai", tone: "warn", size: "l" }),
      label([18, 5], "H100 ridge: 295 FLOP/B — 0.3%만 사용", { id: "ridge", tone: "series2", size: "l" }),
    ]),

    batch: figure(cartesian({ x: [0, 100, "도식"], y: [0, 100, ""], static: "가중치 1번 읽기로 토큰 B개 계산" }), (m) => {
      const B = m.inf.B;
      return [
        label([5, 95], `배치 B = ${B}`, { size: "l" }),
        rect([5, 40], [40, 65], { id: "w", tone: "focus", fill: "solid", label: "가중치 14 GB · 읽기 1번" }),
        Array.from({ length: B }, (_, i) => [
          arrow([40, 52], [60, 80 - i * 12], { id: `a${i}` }),
          rect([60, 76 - i * 12], [85, 84 - i * 12], { id: `tok${i}`, tone: "series2", fill: "solid", label: `토큰 ${i + 1}` }),
        ]),
        label([5, 20], `계산 ${14 * B} GFLOP ÷ 읽기 14 GB`),
        label([5, 10], `강도 ${B} FLOP/B`, { id: "ai", tone: B === 1 ? "warn" : "series2", size: "l" }),
      ];
    }),

    roof: figure(cartesian({ x: [0.5, 4096, "FLOP/B"], y: [1, 4000, "TFLOPS"], log: "xy", static: "roofline과 현재 배치의 점" }), (m) => {
      const o = m.inf;
      return [
        grid({ x: [1, 10, 100, 1000], y: [1, 10, 100, 1000] }),
        axis("x", { label: "산술 강도 (FLOP/B, 로그) = 배치 크기", ticks: [1, 10, 100, 1000] }),
        axis("y", { label: "도달 계산 속도 (TFLOPS, 로그)", ticks: [1, 10, 100, 1000] }),
        line(roofPts(F, BW), { id: "roof", tone: "focus", label: "지붕 989" }),
        o.f > F && line(roofPts(o.f, BW), { id: "roof2", tone: "good", label: "지붕 ×2: 1,978" }),
        line([[o.ridge, 1], [o.ridge, o.f / 1e12]], { id: "ridge", dash: true, tone: "ref", label: `ridge ${fmt(o.ridge, 0)}` }),
        label([3, 8], "읽기 한계: 강도 × 3.35 TB/s", { tone: "muted" }),
        dot([o.B, o.att], { id: "pt", tone: "warn", size: "l", label: `배치 ${o.B}: ${fmt(o.att, o.att < 10 ? 2 : 0)} TFLOPS` }),
        label([4000, 3500], `${fmt(o.stB, 2)} ms/단계 · ${fmt(o.tot, 0)} 토큰/초(전체) · ${fmt(o.pu, 0)} 토큰/초(사용자당)`, { id: "readout", anchor: "ne" }),
      ];
    }),

    choose: figure(cartesian({ x: [0, 400, "토큰/초"], y: [0, 6, ""], static: "H100·H200 decode 상한 막대와 사양 표" }), () => [
      axis("x", { label: "7B 배치 1 decode 상한 (토큰/초)" }),
      rect([0, 5], [(1e3 / tRead(BW)), 5.7], { id: "h100", tone: "focus", fill: "solid", label: "H100 SXM 239" }),
      rect([0, 4], [(1e3 / tRead(BW_H200)), 4.7], { id: "h200", tone: "focus", fill: "solid", label: "H200 343" }),
      label([0, 3], "계산 속도   989 TFLOPS | 989 TFLOPS | 같다", { anchor: "w" }),
      label([0, 2], "HBM 대역폭  3.35 TB/s | 4.8 TB/s | 1.43배", { id: "bw-row", tone: "warn", anchor: "w" }),
      label([0, 1], "HBM 용량    80 GB | 141 GB | 더 큰 모델·배치", { anchor: "w" }),
    ]),

    tree: figure(graph({ layout: "tree", direction: "right", static: "이번 수업에서 이어지는 개념 나무" }), () => {
      const kids = [["kv", "KV 캐시 — 배치를 키우면 다시 늘어나는 읽기"], ["q", "양자화 (INT8·INT4) — 읽을 바이트 자체를 줄이기"], ["cb", "continuous batching — 서버가 배치를 채우는 법"], ["fa", "FlashAttention — 어텐션의 메모리 왕복 줄이기"], ["tp", "텐서 병렬 — 여러 GPU로 대역폭 합치기"], ["sd", "speculative decoding — 한 번 읽고 토큰 여러 개 검증"]];
      return [
        node("here", "이번 수업: 대역폭 · 산술 강도 · roofline / prefill과 decode · 배치", { tone: "focus", shape: "box" }),
        kids.map(([id, t]) => [node(id, t, { shape: "box" }), edge("here", id, { directed: true })]),
      ];
    }),

    overview: figure(cartesian({ x: [0.5, 4096, "FLOP/B"], y: [1, 4000, "TFLOPS"], log: "xy", static: "roofline 위 번호 정리" }), () => {
      const items = ["계산 속도와 읽기 속도는 따로 있다", "decode 한 토큰 = 14 GB 읽기 4.18 ms", "배치 1 decode: FLOPS 2배여도 그대로", "강도 < ridge 295면 읽기가 시간을 정함", "배치 B → 강도 ≈ B, 점이 오른쪽으로", "prefill(강도≈1,000)은 FLOPS로 빨라짐", "대역폭↑(H200 4.8 TB/s): 기운 지붕이 올라감"];
      /** @type {import("ltt").P[]} */
      const at = [[0.7, 6], [1, 2], [1.6, 3.35], [F / BW * 1.3, 1.5], [12, 80], [1000, 400], [60, 600]];
      return [
        axis("x", { label: "산술 강도 (FLOP/B, 로그)" }),
        axis("y", { label: "도달 TFLOPS (로그)" }),
        line(roofPts(F, BW_H200), { id: "roof-h200", tone: "good" }),
        line(roofPts(F, BW), { id: "roof", tone: "focus" }),
        line([[F / BW, 1], [F / BW, 989]], { id: "ridge", dash: true, tone: "ref" }),
        dot([1, 3.35], { id: "decode", tone: "warn" }),
        dot([1000, 989], { id: "prefill", tone: "good" }),
        arrow([1.6, 3.35 * 1.6], [40, 3.35 * 40], { id: "batch-move", tone: "warn" }),
        at.map((p, i) => label(p, String(i + 1), { id: `n${i + 1}`, tone: "focus", size: "s" })),
        legend(items.map((t, i) => ({ tone: /** @type {import("ltt").Tone} */ ("focus"), text: `${i + 1}. ${t}` })), { id: "list" }),
      ];
    }),

    hookArt: figure(sch(), () => icon("cpu", [50, 50], { id: "cpu", size: "l" })),

    tvFlops: figure(sch(), () => [Array.from({ length: 24 }, (_, i) => rect([5 + (i % 8) * 11, 60 - Math.floor(i / 8) * 18], [14 + (i % 8) * 11, 72 - Math.floor(i / 8) * 18], { id: `u${i}`, tone: "series2", fill: "soft" })), label([50, 10], "곱·덧셈 유닛", { tone: "muted" })]),
    tvHbm: figure(sch(), () => [rect([30, 10], [70, 90], { id: "hbm", fill: "none", label: "80 GB" }), rect([30, 10], [70, 24], { id: "w", tone: "focus", fill: "solid" })]),
    tvBw: figure(sch(), () => [rect([5, 40], [95, 60], { id: "pipe", tone: "warn", fill: "soft" }), Array.from({ length: 6 }, (_, i) => dot([12 + i * 15, 50], { id: `b${i}`, tone: "warn" })), label([50, 15], "바이트/초 →", { tone: "muted" })]),
    tvWt: figure(sch(), () => ["0.12", "-0.8", "0.03", "1.4", "-0.2", "0.57"].map((t, i) => label([20 + (i % 3) * 30, 70 - Math.floor(i / 3) * 35], t, { id: `v${i}` }))),
    tvDecode: figure(sch(), () => ["안", "녕", "하", "?"].map((t, i) => rect([5 + i * 23, 30], [25 + i * 23, 70], { id: `t${i}`, tone: i < 3 ? "series2" : "muted", fill: i < 3 ? "solid" : "none", label: t }))),
    tvBatch: figure(sch(), () => [rect([5, 35], [35, 65], { id: "w", tone: "focus", fill: "solid" }), [0, 1, 2, 3].map((i) => [arrow([35, 50], [65, 88 - i * 25]), rect([65, 82 - i * 25], [95, 94 - i * 25], { id: `t${i}`, tone: "series2", fill: "solid" })])]),
  };

  return {
    models: { inf },
    figures,
    scenes: [
      { type: "predict", title: "계산부만 2배 빨라지면?", ask: "FLOPS만 2배, 대역폭은 그대로면 사용자 1명의 토큰/초는?", figure: "answer", focus: ["read"], input: { kind: "choice", options: [{ text: "약 2배 빨라진다", feedback: "읽기 4.18 ms가 그대로다" }, { text: "거의 그대로다", correct: true }, { text: "느려진다", feedback: "계산은 빨라졌다" }] }, reveal: { say: "계산 0.014→0.007 ms여도 읽기 4.18 ms를 기다린다", marks: ["read", "c1", "c2"] } },
      { type: "explore", title: "한 토큰 시간은 읽기와 계산 중 긴 쪽이 정한다", say: "어느 손잡이가 토큰/초를 움직이는가?", figure: "times", focus: ["step", "tps"], knobs: { kF: { range: [1, 4], step: 1 }, kB: [1, 2, 1] } },
      { type: "compare", title: "배치: 한 번 읽은 가중치로 여러 토큰", say: "읽기 1번, 계산 B배", figure: "batch", focus: ["ai"], a: { B: 1 }, b: { B: 4 }, labels: ["배치 1", "배치 4"] },
      { type: "explore", title: "Roofline", say: "배치 손잡이로 점을 옮기고 계산 속도 ×2로 지붕을 올려 보자", figure: "roof", focus: ["pt", "roof"], knobs: { B: { range: [1, 1024], log: true }, kR: [1, 2, 1] } },
    ],
  };
};

const src = "archive/v1:site/gallery/gpu/single-gpu-dataflow.html";
/** @param {string} scene @param {import("../fragment").Prop[]} props @param {Partial<import("../fragment").AuditRow>} [extra] @returns {import("../fragment").AuditRow} */
const row = (scene, props, extra = {}) => ({ fig: `single-gpu-dataflow#${scene}`, src, corpus: "lesson", domain: "GPU", props, verdict: "V", custom: [], candidates: [], ...extra });

/** @type {import("../fragment").AuditRow[]} */
export const audit = [
  row("hook-art", [
    { id: "P1", cat: "G", text: "CPU/칩 아이콘으로 GPU 질문을 연다", essential: false, why: "v2 hook. 장식 그림이라 제목 결론이 기대지 않는다", status: "ambiguous" },
  ], { candidates: [] }),
  row("term-flops", [
    { id: "P1", cat: "G", text: "곱·덧셈 유닛이 여러 개 나란히 있는 격자", essential: true, why: "v2 define(FLOPS). 정의 '계산부가 1초에 하는 곱셈·덧셈 수'가 병렬 유닛 그림에 기댄다", status: "kept", by: "rect(from, to) in cartesian data units" },
  ]),
  row("term-hbm", [
    { id: "P1", cat: "G", text: "80 GB 메모리 상자 안 아래쪽을 가중치가 채움", essential: true, why: "v2 define(HBM). '가중치가 여기에 있다'", status: "kept", by: "rect(from, to) 두 개 겹침; MarkTree 'Later marks paint on top'" },
  ]),
  row("term-bw", [
    { id: "P1", cat: "G", text: "통로 안의 바이트 점과 '바이트/초 →' 방향", essential: true, why: "v2 define(대역폭)", status: "kept", by: "rect + dot + label" },
  ]),
  row("term-weights", [
    { id: "P1", cat: "X", text: "가중치는 실수 숫자들(0.12, -0.8 …)", essential: true, why: "v2 define(가중치)", status: "kept", by: "label(at, text)" },
  ]),
  row("term-decode", [
    { id: "P1", cat: "E", text: "만든 토큰 3개는 채움, 다음 토큰 '?'는 빈 칸", essential: true, why: "v2 define(decode). 토큰을 하나씩 이어 만든다는 정의", status: "kept", by: "MarkOpts fill solid/none, tone" },
  ]),
  row("term-batch", [
    { id: "P1", cat: "G", text: "가중치 하나에서 토큰 4개로 화살표가 갈라짐", essential: true, why: "v2 define(배치)", status: "kept", by: "arrow(from, to) + rect" },
  ]),
  row("gpu", [
    { id: "P1", cat: "Q", text: "HBM 상자 높이 80 GB 중 가중치 14 GB를 실제 비율로 칠함", essential: true, why: "v2 explain. 'HBM의 가중치가 통로를 지나야 계산' 장면; 그림 안에 '실제 비율'이라고 적었다", status: "kept", by: "rect in cartesian y axis [0,100,'GB']; P is data units, not pixels" },
    { id: "P2", cat: "T", text: "통로를 따라 바이트 점 9개가 3초 주기로 HBM→계산부로 흐름", essential: true, why: "두 속도 중 '읽기'가 흐름이라는 결론", status: "kept", by: "flow(pts, {n:9, rate, seed, t}); TimeSpec loop {ms:3000, span}" },
    { id: "P3", cat: "S", text: "HBM | 통로 | 계산부 좌→우 배치, 계산부에 SM 132개 격자", essential: true, why: "데이터가 도착해야 계산한다는 순서", status: "kept", by: "rect 132개 in data units" },
    { id: "P4", cat: "X", text: "3.35 TB/s와 989 TFLOPS를 다른 강조로, '축척 아님' 표시", essential: true, why: "두 속도의 단위가 다름; v1 원칙(축척 깨면 표시)", status: "kept", by: "label tone warn/series2 ('series1–6 stay mutually distinguishable'), label text" },
  ]),
  row("decode", [
    { id: "P1", cat: "T", text: "32층이 아래(1층)부터 차례로 읽힘 상태로 바뀌고 끝에서 멈춤", essential: true, why: "v2 explain(once 애니메이션; steps로 바꾸면 32단계라 explain+loop once가 맞다). '토큰마다 14 GB 전부 읽기'", status: "kept", by: "Loop.once 'Play once, then hold the end state'; draw(m, t) 재계산" },
    { id: "P2", cat: "Q", text: "읽은 GB·경과 ms·GFLOP 카운터가 층 수에 비례(14 GB, 4.18 ms, 14 GFLOP에서 끝남)", essential: true, why: "결론 숫자 4.18 ms, 14 GFLOP", status: "kept", by: "Loop span [0, 4.18] 'maps span linearly onto ms'; label text computed from t" },
    { id: "P3", cat: "X", text: "'느리게 재생: 실제 4.18 ms를 6초로 늘림' 표시", essential: true, why: "v1 원칙: 시간 축척을 깨면 표시", status: "approx", diff: "warp가 없어 runtime의 slow-motion 표시는 보장되지 않고 label 글로만 남는다" },
    { id: "P4", cat: "G", text: "현재 층에서 계산부로 화살표", essential: false, why: "읽기→계산 연결", status: "kept", by: "arrow(from, to)" },
  ], { candidates: ["slow-motion-uniform"] }),
  row("answer", [
    { id: "P1", cat: "Q", text: "읽기 4.18 ms 막대 대비 계산 0.014→0.007 ms 막대가 같은 선형 축척", essential: true, why: "v2 predict의 reveal.figure. 정답 '거의 그대로'의 근거", status: "kept", by: "rect in cartesian x [0,4.5,'ms']" },
    { id: "P2", cat: "E", text: "계산 막대는 최소 2px로 보이게 그림", essential: true, why: "막대가 사라지면 '계산이 있다'는 비교가 안 보임", status: "approx", diff: "최소 표시 크기 보장이 없어 0.3% 폭 막대가 안 보일 수 있으나 label 숫자가 남는다" },
  ], { candidates: ["min-visible-size"] }),
  row("times", [
    { id: "P1", cat: "Q", text: "읽기·계산 시간 막대가 0–5 ms 선형 축에서 모델값", essential: true, why: "v2 explore. '긴 쪽이 정한다'", status: "kept", by: "rect + axis ticks in cartesian x ms; model fn" },
    { id: "P2", cat: "E", text: "긴 쪽 끝에 '한 토큰 시간' 점선", essential: true, why: "제목 결론", status: "kept", by: "sweep('x', at) 'Line across the frame at a data value'" },
    { id: "P3", cat: "I", text: "계산 속도 ×1/×2/×4, 대역폭 ×1/×2 손잡이로 토큰/초가 바뀜", essential: true, why: "어느 손잡이가 움직이는지 직접 확인", status: "approx", diff: "kF가 정확한 정지점 {1,2,4} 대신 1–4 step 1 슬라이더라 ×3도 고를 수 있다" },
    { id: "P4", cat: "X", text: "ms/토큰, 토큰/초 읽기값", essential: true, why: "takeaway 숫자", status: "kept", by: "label text from model outputs; draw re-evaluated with ctx.params" },
    { id: "P5", cat: "E", text: "계산 막대 최소 2px", essential: false, why: "보이게", status: "approx", diff: "최소 크기 보장 없음" },
  ], { candidates: ["knob-stops", "min-visible-size"] }),
  row("intensity", [
    { id: "P1", cat: "Q", text: "295칸 격자 중 1칸만 켜짐(1 FLOP/B 대 ridge 295)", essential: true, why: "v2 explain. 산술 강도 < ridge", status: "kept", by: "cells({cols:25, rows:12}) + cell(col,row) 295개" },
    { id: "P2", cat: "X", text: "1 FLOP/B와 295 FLOP/B를 대비 강조", essential: true, why: "두 숫자 대비", status: "kept", by: "label tone warn vs series2" },
  ]),
  row("batch", [
    { id: "P1", cat: "G", text: "가중치 1번 읽기에서 토큰 B개로 화살표(B=1 vs 4)", essential: true, why: "v2 compare. 읽기 1번, 계산 B배", status: "kept", by: "Compare a/b 'Same figure under params a and b, side by side'" },
    { id: "P2", cat: "Q", text: "강도 = B FLOP/B (14 vs 56 GFLOP ÷ 14 GB)", essential: true, why: "takeaway", status: "kept", by: "label text from model B" },
  ]),
  row("roofline", [
    { id: "P1", cat: "Q", text: "로그-로그 축에 지붕 min(989, I×3.35)", essential: true, why: "v2 explore. roofline 정의", status: "kept", by: "cartesian log 'xy'; line(pts) with ridge vertex" },
    { id: "P2", cat: "I", text: "배치 1–1024 로그 슬라이더로 점이 지붕 위를 움직임", essential: true, why: "점이 ridge 왼쪽이면 FLOPS가 소용없음", status: "kept", by: "Explore knobs {range, log: true}; dot at model outputs" },
    { id: "P3", cat: "I", text: "계산 속도 ×2면 평평한 지붕만 올라가는 두 번째 지붕", essential: true, why: "takeaway 'FLOPS 2배는 평평한 지붕만 올린다'", status: "kept", by: "knob kR [1,2,1]; conditional MarkTree (false omitted)" },
    { id: "P4", cat: "E", text: "ridge 점선과 값", essential: true, why: "recall 질문", status: "kept", by: "line dash: true + label" },
    { id: "P5", cat: "X", text: "기운 지붕 위 '읽기 한계' 글이 선 기울기를 따라 회전", essential: false, why: "구간 이름", status: "approx", diff: "label 회전 옵션이 없어 수평 글로 둔다" },
  ], { candidates: ["label-along-path"] }),
  row("compare-prefill-decode", [], { verdict: "N", reason: "v2 compare. v1 compare item visual은 숫자 몇 줄의 HTML 글이고 그리는 도식이 없다(kit 비교 카드)." }),
  row("choose", [
    { id: "P1", cat: "Q", text: "H100 239 vs H200 343 토큰/초 막대가 같은 선형 축 0–400", essential: true, why: "v2 explain. 대역폭 1.43배 = 상한 1.43배", status: "kept", by: "rect in cartesian x [0,400,'토큰/초']" },
    { id: "P2", cat: "X", text: "사양 표(계산 같음, 대역폭 1.43배 강조, 용량)", essential: true, why: "FLOPS 같고 대역폭만 다름", status: "approx", diff: "표 어휘가 없어 열 정렬이 label 한 줄 문자열로 바뀐다" },
  ], { candidates: ["table"] }),
  row("concept-tree", [
    { id: "P1", cat: "G", text: "이번 수업 상자에서 다음 개념 6개로 가지", essential: true, why: "v2 explain(개념 나무; v2에서는 summary 전 explain)", status: "kept", by: "graph layout tree direction right; node/edge directed" },
    { id: "P2", cat: "E", text: "이번 수업 상자 강조", essential: true, why: "출발점", status: "kept", by: "node tone focus" },
  ]),
  row("overview", [
    { id: "P1", cat: "Q", text: "H100·H200 두 지붕(로그-로그), ridge 295, decode 점(1,3.35), prefill 점(1000,989)", essential: true, why: "v2 summary(LessonInput.summary.figures). 앞 결론의 자리", status: "kept", by: "cartesian log 'xy'; line/dot in data units" },
    { id: "P2", cat: "X", text: "번호 1–7을 해당 자리에 놓고 옆 목록과 짝지음", essential: true, why: "번호 = 앞 장면 핵심 문장 자리", status: "approx", diff: "번호 배지 대신 label 숫자, 목록은 legend라 번호 원 모양과 위치 대응이 약하다" },
    { id: "P3", cat: "G", text: "배치가 커지면 점이 기운 지붕을 따라 오른쪽으로 화살표", essential: true, why: "항목 5", status: "kept", by: "arrow(from, to) in log data coords" },
  ], { candidates: ["numbered-callout"] }),
];
