// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, cells, graph, rect, dot, circle, line, path, label, arrow, cell, node, edge, legend, split, multiples, sweep, axis } = api;

  /** @type {import("ltt").P[]} */
  const CORRECT = [[2, 1], [1.5, -1], [3, 0.5], [1, 2], [2.5, -0.5], [-0.5, 1.5]];
  /** @type {import("ltt").P[]} */
  const WRONG = [[-2, -1], [-1.5, 1], [-3, -0.5], [-1, -2], [-2.5, 0.5], [0.5, -1.5]];
  /** @param {number} deg */
  const probeHits = (deg) => {
    const t = (deg * Math.PI) / 180;
    /** @param {import("ltt").P} h */
    const s = (h) => Math.cos(t) * h[0] + Math.sin(t) * h[1];
    return CORRECT.filter((h) => s(h) > 0).length + WRONG.filter((h) => s(h) < 0).length;
  };
  /** @param {number} seed @param {number} n */
  const noise = (seed, n) => {
    let s = seed;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: n }, () => /** @type {import("ltt").P} */ ([(r() - 0.5) * 2.4, (r() - 0.5) * 2.4]));
  };
  const NZ = noise(11, 20);
  const LBL = NZ.map((_, i) => (i < 10 ? 1 : -1));
  const SAMPLES = [
    { a: "시드니", n: 18, p: 0.32, ok: false },
    { a: "캔버라", n: 9, p: 0.81, ok: true },
    { a: "멜버른", n: 3, p: 0.15, ok: false },
  ];
  const TOKS = ["Australia", "?", "The", "capital", "is", "Canberra", "."];
  const LAYERS = ["임베딩", "4층", "8층", "12층", "16층", "20층", "24층", "28층", "32층"];
  const HOT = 5, READ_ROW = 4;

  const probe = model({ ang: 0 }, (p) => {
    const t = (p.ang * Math.PI) / 180;
    return { w: /** @type {import("ltt").P} */ ([Math.cos(t), Math.sin(t)]), hits: probeHits(p.ang) };
  }, { illustrative: true });
  const cloud = model({ pos: "exact" }, (p) => ({ d: p.pos === "first" ? 0.25 : p.pos === "last" ? 0.7 : 1.4 }), { illustrative: true });
  const task = model({ task: "A" }, (p) => ({ swap: p.task === "B" }), { illustrative: true });

  /** @param {import("ltt").P} h @param {boolean} ok @param {string} [id] */
  const pt = (h, ok, id) => dot(h, { tone: ok ? "good" : "bad", id });

  const stream = figure(
    cartesian({ x: [-1.6, 7, "토큰 자리"], y: [-1.6, 10, "층(4층 단위)"], loop: { ms: 4000, span: [0, 4000] } }),
    (m, t) => {
      const k = Math.min(8, Math.floor((t / 3200) * 8));
      const done = t >= 3200;
      return [
        LAYERS.map((l, r) => label([-0.2, r + 0.5], l, { anchor: "e" })),
        TOKS.map((tk, c) => label([c + 0.45, -0.6], tk, { weight: c === HOT ? "bold" : "normal" })),
        line([[2, -1.4], [2, 9.4]], { dash: true, tone: "muted", id: "q-a-boundary" }),
        label([1.9, -1.2], "질문", { anchor: "e", tone: "muted" }),
        label([2.1, -1.2], "모델이 생성한 답 →", { anchor: "w", tone: "muted" }),
        LAYERS.map((_, r) => TOKS.map((_, c) => {
          const on = c === HOT && r <= k;
          return rect([c + 0.05, r + 0.15], [c + 0.85, r + 0.85], { id: `cell-${r}-${c}`, tone: on ? "focus" : "muted", fill: on ? "solid" : "soft", opacity: on ? 0.35 + 0.65 * (r / 8) : 1 });
        })),
        LAYERS.slice(1).map((_, i) => i < k && label([HOT + 0.95, i + 1.5], "+", { tone: "focus" })),
        done && [
          rect([HOT - 0.05, READ_ROW + 0.05], [HOT + 0.95, READ_ROW + 0.95], { id: "read-ring", tone: "warn", fill: "none", weight: "bold" }),
          label([HOT + 0.45, 9.7], "여기서 꺼내 읽는다", { tone: "warn", size: "l", leader: [HOT + 0.45, READ_ROW + 1] }),
          label([HOT + 0.45, 9.2], "16층 은닉 상태 = 숫자 4096개"),
        ],
        label([0, 9.9], "가로 = 토큰 자리, 세로 = 층 (32층 모델, 4층마다 한 줄, + = 층이 더한 값. 토큰 경계는 단순화)", { anchor: "w", tone: "muted", size: "s" }),
      ];
    },
  );

  const probeFig = figure(
    cartesian({ x: [-4, 4, "축 1(가상)"], y: [-4, 4, "축 2(가상)"], aspect: "equal", static: "2차원 가상 은닉 상태 12점과 probe 방향 w, 경계선, '맞음' 반평면" }),
    (m) => {
      const [wx, wy] = m.probe.w;
      const n = [-wy, wx], L = 6;
      /** @param {number} s @returns {import("ltt").P} */
      const at = (s) => [n[0] * L * s, n[1] * L * s];
      /** @param {import("ltt").P} h */
      const sc = (h) => wx * h[0] + wy * h[1];
      return [
        axis("x", { label: "축 1" }), axis("y", { label: "축 2" }),
        path([["M", ...at(1)], ["L", n[0] * L + wx * L, n[1] * L + wy * L], ["L", -n[0] * L + wx * L, -n[1] * L + wy * L], ["L", ...at(-1)], ["Z"]], { id: "yes-side", tone: "good", fill: "soft", opacity: 0.6 }),
        line([at(1), at(-1)], { id: "boundary", dash: true, weight: "bold", tone: "ref" }),
        arrow([0, 0], [wx * 1.6, wy * 1.6], { id: "w", tone: "focus", weight: "bold", label: "w" }),
        CORRECT.map((h, i) => [pt(h, true, `c${i}`), !(sc(h) > 0) && circle(h, 0.3, { tone: "warn", fill: "none", weight: "bold" })]),
        WRONG.map((h, i) => [pt(h, false, `x${i}`), !(sc(h) < 0) && circle(h, 0.3, { tone: "warn", fill: "none", weight: "bold" })]),
        label([3.8, -3.6], (o) => `맞게 가른 점 ${o.probe.hits}/12`, { id: "hits", anchor: "e", size: "l" }),
        label([-3.8, 3.7], "2차원으로 줄인 가상 예시 · 실제 은닉 상태는 4096차원", { anchor: "w", tone: "warn", size: "s" }),
        legend([{ tone: "good", text: "맞는 답의 은닉 상태" }, { tone: "bad", text: "틀린 답의 은닉 상태" }, { tone: "warn", text: "잘못 판정된 점" }]),
      ];
    },
  );

  const exactPanel = figure(
    cartesian({ x: [-3.5, 3.5, "축 1(가상)"], y: [-3.5, 3.5, "축 2(가상)"], aspect: "equal", static: "한 토큰 자리의 가상 점구름 20개와 경계" }),
    (m, _t, { params }) => {
      const d = m.cloud.d;
      const pts = NZ.map(([nx, ny], i) => /** @type {[number, number, boolean]} */ ([LBL[i] * d + nx, ny, LBL[i] > 0]));
      const wrongSide = pts.filter(([x, , ok]) => (ok ? x <= 0 : x >= 0)).length;
      const name = params.pos === "first" ? "① 답의 첫 토큰 “The”" : params.pos === "last" ? "③ 마지막 토큰 “.”" : "② 정확한 답 토큰 “Canberra”";
      return [
        sweep("x", 0, { id: "boundary", tone: "ref" }),
        pts.map(([x, y, ok], i) => pt([x, y], ok, `p${i}`)),
        params.pos === "exact" && rect([-3.45, -3.45], [3.45, 3.45], { id: "hot", tone: "warn", fill: "none", weight: "bold" }),
        label([0, 3.2], name, { weight: params.pos === "exact" ? "bold" : "normal" }),
        label([0, -3.2], `경계 반대쪽에 놓인 점 ${wrongSide}개 / 20`, { size: "s" }),
      ];
    },
  );

  const taskCloud = figure(
    cartesian({ x: [-3.5, 3.5, "축 1(가상)"], y: [-3.5, 3.5, "축 2(가상)"], aspect: "equal", static: "과제 A 경계를 과제 A·B 점구름에 댄 그림" }),
    (m) => {
      const pts = NZ.map(([nx, ny], i) => /** @type {[number, number, boolean]} */ (m.task.swap ? [ny, LBL[i] * 1.4 + nx, LBL[i] > 0] : [LBL[i] * 1.4 + nx, ny, LBL[i] > 0]));
      return [
        sweep("x", 0, { id: "boundary-A", tone: "ref", label: "과제 A에서 학습한 경계" }),
        pts.map(([x, y, ok], i) => pt([x, y], ok, `t${i}`)),
        label([0, -3.2], m.task.swap ? "양쪽에 섞인다 (B는 위아래로 갈림)" : "좌우로 갈린다", { tone: m.task.swap ? "bad" : "muted", size: "s" }),
      ];
    },
  );
  const TASKS = ["사실 회상 1", "사실 회상 2", "상식 추론", "수학"];
  const matrix = figure(
    cells({ cols: 5, rows: 5, static: "학습 과제 × 시험 과제 probe 성능 개념도: 대각선 진함, 사실 회상끼리 중간" }),
    () => [
      cell(0, 0, { text: "학습↓ 시험→" }),
      TASKS.map((_, j) => cell(j + 1, 0, { text: String(j + 1) })),
      TASKS.map((tk, i) => [
        cell(0, i + 1, { text: `${i + 1} ${tk}` }),
        TASKS.map((_, j) => cell(j + 1, i + 1, { id: `m${i}${j}`, value: i === j ? 0.95 : i < 2 && j < 2 ? 0.5 : 0.12 })),
      ]),
    ],
  );

  const TYPES = [
    { n: "늘 맞음", runs: [[30, "good", "정답"]] },
    { n: "늘 같은 오답", runs: [[30, "bad", "오답 X"]] },
    { n: "두 답 경쟁", runs: [[16, "good", "정답"], [14, "bad", "오답 X"]] },
    { n: "여러 답 흩어짐", runs: [[5, "good", "정답"], [7, "bad", "오답 X"], [6, "series3", "오답 Y"], [5, "series4", "오답 Z"], [4, "series5", "오답 W"], [3, "series6", "오답 V"]] },
  ];
  const types = figure(
    cartesian({ x: [-8, 30, "샘플 순번"], y: [-0.8, 4, "유형"], static: "네 오류 유형별 30개 샘플 답의 점 줄" }),
    () => TYPES.map((ty, r) => {
      const y = 3.3 - r;
      let i = 0;
      return [
        label([-0.6, y], ty.n, { anchor: "e" }),
        ty.runs.map(([n, tone, text]) => {
          const start = i;
          const dots = Array.from({ length: Number(n) }, () => dot([i++ + 0.5, y], { tone: /** @type {import("ltt").Tone} */ (tone) }));
          return [dots, label([(start + i) / 2, y - 0.4], `${text} ${n}`, { tone: "muted", size: "s" })];
        }),
      ];
    }),
  );

  const TOTAL = 30;
  const byVote = SAMPLES.reduce((a, b) => (b.n > a.n ? b : a));
  const byProbe = SAMPLES.reduce((a, b) => (b.p > a.p ? b : a));
  /** @param {"vote" | "probe"} kind */
  const pickPanel = (kind) => figure(
    cartesian({ x: [-0.6, 1.2, "비율·점수(0–1)"], y: [-1, 3.6, "답"], static: kind === "vote" ? "다수결: 나온 비율 막대" : "probe 점수 막대" }),
    () => {
      const pick = kind === "vote" ? byVote : byProbe;
      return [
        label([-0.6, 3.4], kind === "vote" ? "다수결: 가장 많이 나온 답" : "probe 점수가 가장 높은 답", { anchor: "w", weight: "bold" }),
        SAMPLES.map((d, i) => {
          const v = kind === "vote" ? d.n / TOTAL : d.p;
          const y = 2.4 - i;
          return [
            label([-0.05, y], d.a + (d.ok ? " (정답)" : ""), { anchor: "e" }),
            rect([0, y - 0.2], [1, y + 0.2], { tone: "muted", fill: "soft" }),
            rect([0, y - 0.2], [v, y + 0.2], { id: `${kind}-${i}`, tone: d === pick ? "focus" : "ref", fill: "solid" }),
            label([v + 0.02, y], kind === "vote" ? `${d.n}/30 = ${Math.round((d.n / TOTAL) * 100)}%` : `점수 ${d.p.toFixed(2)}`, { anchor: "w", size: "s" }),
          ];
        }),
        label([-0.6, -0.6], `${pick.ok ? "✓" : "✗"} ${pick.a}를 고른다 — ${pick.ok ? "정답" : "오답"}`, { anchor: "w", size: "l", tone: pick.ok ? "good" : "bad", id: `${kind}-result` }),
      ];
    },
  );

  const KIDS = [
    ["rep", "진실성 방향 · representation engineering — 은닉 상태 속 '참/거짓' 방향을 찾고 다루기"],
    ["iti", "inference-time intervention (ITI) — 찾은 방향으로 활성값을 밀어 출력을 바꾸기"],
    ["ccs", "CCS (Discovering Latent Knowledge) — 라벨 없이 진실성 방향을 찾기"],
    ["se", "semantic entropy — 샘플 답들의 의미가 흩어진 정도로 환각 탐지"],
    ["sae", "sparse autoencoder — 은닉 상태를 해석 가능한 특징으로 나누기"],
  ];
  const tree = figure(
    graph({ layout: "tree", direction: "right", static: "이번 수업에서 이어지는 다섯 주제의 개념 나무" }),
    () => [
      node("root", "이번 수업 — probe로 읽는 진실성 신호", { shape: "round", tone: "focus", fill: "soft" }),
      KIDS.map(([id, t]) => [node(id, t, { shape: "round" }), edge("root", id, { directed: false })]),
    ],
  );

  const BOXES = [
    ["q", "질문 · 호주의 수도는?"],
    ["gen", "답 생성 · 샘플링 30회 ⑤ 오류에도 유형이 있다"],
    ["tok", "정확한 답 토큰 · “Canberra” ③ 진실성 신호가 가장 강한 자리"],
    ["h", "16층 은닉 상태 · 4096차원 ① 토큰 자리·층마다 꺼낼 수 있는 벡터"],
    ["probe", "linear probe · w·h + b ② 방향 w 하나로 맞음·틀림을 가른다 ④ 과제마다 따로 학습해야 한다"],
    ["score", "점수 · 답 고르기 ⑥ 오답을 내도 정답을 가리킬 수 있다"],
  ];
  const pipeline = figure(
    graph({ layout: "layered", direction: "right", static: "질문→답 생성→정확한 답 토큰→16층 은닉 상태→linear probe→점수 파이프라인, 정리 번호 ①–⑥" }),
    () => [
      BOXES.map(([id, t]) => node(id, t, { shape: "box", tone: id === "probe" ? "focus" : undefined })),
      BOXES.slice(1).map(([id], i) => edge(BOXES[i][0], id)),
    ],
  );

  const termHidden = figure(
    cells({ cols: 10, rows: 1, static: "은닉 상태 숫자 4096개 중 10개" }),
    () => [Array.from({ length: 10 }, (_, i) => cell(i, 0, { value: 0.25 + ((i * 37) % 10) / 14 })), label([5, -0.4], "숫자 4096개 중 10개", { size: "s" })],
  );
  const termStream = figure(
    cartesian({ x: [0, 10, "칸"], y: [0, 4.5, "층"], static: "한 토큰 자리에서 층마다 값이 더해져 쌓이는 막대 4개" }),
    () => [Array.from({ length: 4 }, (_, r) => rect([4, r + 0.1], [6, r + 0.8], { tone: "focus", fill: "solid", opacity: 0.4 + r * 0.18 })), label([6.5, 2.2], "+ 층마다", { anchor: "w", size: "s" })],
  );
  const termProbe = figure(
    cartesian({ x: [0, 10, "칸"], y: [0, 4.5, "층"], static: "맞는 점 3개와 틀린 점 3개를 가르는 점선 경계" }),
    () => [
      /** @type {import("ltt").P[]} */ ([[1.5, 3], [2.5, 2], [2, 1.2]]).map((p) => pt(p, true)),
      /** @type {import("ltt").P[]} */ ([[7.5, 3.3], [8.5, 2], [7, 1.2]]).map((p) => pt(p, false)),
      line([[5, 0.2], [5, 4.3]], { dash: true, weight: "bold", tone: "ref" }),
    ],
  );
  /** @param {boolean} hot */
  const tokenRow = (hot) => figure(
    cartesian({ x: [0, 200, "px(도식)"], y: [0, 60, "px(도식)"], static: hot ? "토큰 다섯 개 중 Canberra 강조" : "토큰 다섯 개 The capital is Canberra ." }),
    () => ["The", "capital", "is", "Canberra", "."].map((t, i) => {
      const x = [4, 38, 92, 114, 182][i], w = [32, 52, 20, 66, 12][i];
      return [rect([x, 16], [x + w, 44], { id: `tok-${i}`, tone: hot && i === 3 ? "warn" : "muted", fill: "soft", weight: hot && i === 3 ? "bold" : "thin" }), label([x + w / 2, 30], t, { size: "s" })];
    }),
  );

  return {
    models: { probe, cloud, task },
    figures: {
      stream, probe: probeFig, exactPanel, exact: multiples("exactPanel", { over: { pos: ["first", "exact", "last"] } }),
      taskCloud, taskPair: multiples("taskCloud", { over: { task: ["A", "B"] } }), matrix, general: split(["taskPair", "matrix"]),
      types, pickVote: pickPanel("vote"), pickProbe: pickPanel("probe"), pick: split(["pickVote", "pickProbe"]),
      tree, pipeline, termHidden, termStream, termProbe, termExact: tokenRow(true), tokens: tokenRow(false),
    },
    scenes: [
      { type: "explore", title: "probe는 은닉 상태를 한 방향으로 재서 맞음·틀림을 가른다", say: "손잡이로 probe 방향 w를 돌려 본다. 점수 s = w·h, s > 0이면 맞음.", figure: "probe", focus: ["w", "boundary", "yes-side"], knobs: { ang: [0, 180, 45] }, goal: { say: "12개 점을 모두 맞게 가르는 방향을 찾는다", done: (m) => m.probe.hits === 12 } },
      { type: "predict", title: "probe를 어느 토큰에 대야 할까?", ask: "답의 정오를 맞히려면 어느 토큰 자리의 은닉 상태로 probe를 학습해야 가장 잘 맞힐까?", figure: "tokens", focus: [], input: { kind: "choice", options: [{ text: "① 답의 첫 토큰 “The”", feedback: "첫 토큰은 답의 정오를 정하지 않는다" }, { text: "② 정확한 답 토큰 “Canberra”", correct: true }, { text: "③ 마지막 토큰 “.”", feedback: "흔히 쓰지만 정확한 답 토큰보다 약하다" }] }, reveal: { say: "답의 정오를 바꾸는 것은 “Canberra”다. 논문은 이 자리에서 오류 탐지가 가장 잘 됨을 보였다.", figure: "exact" } },
      { type: "explain", title: "은닉 상태는 토큰 자리마다 층을 따라 쌓인다", say: "강조한 열은 답 토큰 “Canberra” 자리다.", figure: "stream", focus: ["read-ring"] },
      { type: "explain", title: "다수결은 시드니를, probe는 캔버라를 고른다", say: "막대 길이: 왼쪽은 나온 비율, 오른쪽은 probe 점수.", figure: "pick", focus: ["vote-result", "probe-result"] },
    ],
  };
};

const SRC = "archive/v1:site/gallery/ml/llm-hallucination-internal.html";
/** @param {string} scene */
const fig = (scene) => `llm-hallucination-internal#${scene}`;

/** @type {import("../fragment").AuditRow[]} */
export const audit = [
  {
    fig: fig("stream"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "G", text: "토큰 자리(가로 7) × 층(세로 9) 격자, 답 토큰 열 강조", essential: true, why: "v2 explain(+define 보조). 제목 '토큰 자리마다 층을 따라 쌓인다'가 격자 구조에 기댄다", status: "kept", by: "cartesian 데이터 좌표 + rect(from,to); weight/tone focus" },
      { id: "P2", cat: "T", text: "답 토큰 열이 아래층부터 위로 차례로 채워지고(3.2 s), 끝나면 16층 칸에 읽기 표시가 뜬다(4 s 주기)", essential: true, why: "residual stream이 층마다 더해지며 흐른다는 결론", status: "kept", by: "TimeSpec loop {ms:4000, span:[0,4000]} 'loop maps span linearly onto ms'; draw sampled over t" },
      { id: "P3", cat: "Q", text: "층이 높을수록 진해지는 누적(불투명도 0.35+0.65·r/8)과 층마다 '+'", essential: true, why: "각 층이 덮어쓰지 않고 더한다는 정의", status: "approx", diff: "opacity는 '0–1'로만 정의돼 테마 색 위에서 명도 단계가 원본과 같다는 보장은 없지만 단조 증가는 남는다" },
      { id: "P4", cat: "X", text: "층 이름·토큰·'질문/생성한 답' 경계·'16층 은닉 상태 = 숫자 4096개' 글", essential: true, why: "어느 칸을 읽는지 결론이 글에 기댄다", status: "kept", by: "label(at,text,{anchor,leader}); line dash" },
      { id: "P5", cat: "E", text: "16층 읽기 칸 warn 링", essential: true, why: "'여기서 꺼내 읽는다'", status: "kept", by: "rect tone warn fill none; Explain.focus" },
    ],
  },
  {
    fig: fig("probe"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "I", text: "probe 방향 w를 0·45·90·135·180°로 돌린다", essential: true, why: "v2 explore(v1 mount+LTT.sweep). 장면이 손잡이 조작에 기댄다", status: "kept", by: "Explore.knobs [min,max,step] = [0,180,45]" },
      { id: "P2", cat: "G", text: "w 화살표, 그에 수직인 경계선, '맞음' 반평면 음영이 w와 함께 돈다", essential: true, why: "s = w·h > 0 판정의 기하", status: "kept", by: "arrow, line dash, path fill 'soft'; aspect 'equal'로 수직 유지" },
      { id: "P3", cat: "Q", text: "가상 12점의 2차원 좌표, 맞게 가른 수(0°:10, 45°:12, 90°:8, 135°:4, 180°:2)", essential: true, why: "결론 '방향 하나로 가른다'", status: "kept", by: "model fn 결정적 + label Text 함수 'Functions are re-evaluated with current model outputs'" },
      { id: "P4", cat: "E", text: "잘못 판정된 점에 warn 링", essential: true, why: "어느 점이 틀렸는지 보인다", status: "kept", by: "circle tone warn fill none" },
      { id: "P5", cat: "S", text: "맞음/틀림 점을 모양(원·X)으로도 구별", essential: false, why: "색맹 중복 부호", status: "approx", diff: "dot은 tone만 바꿔 모양 중복이 없다(tone good/bad로 구별은 남음)" },
      { id: "P6", cat: "I", text: "12/12 달성 목표", essential: true, why: "goal 텍스트", status: "kept", by: "Explore.goal.done" },
    ],
  },
  {
    fig: fig("exact"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "S", text: "같은 20점을 세 토큰 자리에서 찍은 세 판, 같은 축척", essential: true, why: "v2 predict의 reveal.figure(+explain). 비교가 같은 축척에 기댄다", status: "kept", by: "multiples 'one copy per value, sharing frame, axes'" },
      { id: "P2", cat: "Q", text: "분리 거리 첫 0.25 < 마지막 0.7 < 정확한 답 1.4, 경계 반대쪽 점 수 표시", essential: true, why: "결론 '정확한 답 토큰에 모여 있다'", status: "kept", by: "model param pos → d; label 텍스트" },
      { id: "P3", cat: "E", text: "정확한 답 판 warn 테두리", essential: true, why: "결론 대상 강조", status: "kept", by: "draw ctx.params.pos로 조건부 rect" },
      { id: "P4", cat: "X", text: "'개념도: 가상 점' 단서", essential: true, why: "그림 원칙(사실성)", status: "approx", diff: "multiples 공통 단서 자리가 없어 판마다 label이나 장면 say로 옮겨야 한다" },
    ],
  },
  {
    fig: fig("general"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: ["axis-category-labels"],
    props: [
      { id: "P1", cat: "G", text: "과제 A 경계(세로선)를 과제 B 점구름(위아래로 갈림)에 그대로 대면 섞인다", essential: true, why: "v2 compare/explain. 제목 '다른 과제에서 통하지 않는다'", status: "kept", by: "multiples over task, sweep('x',0) 동일 경계" },
      { id: "P2", cat: "Q", text: "학습×시험 4×4 성능 격자: 대각 0.95, 사실 회상끼리 0.5, 나머지 0.12", essential: true, why: "'비슷한 과제끼리만 일부 옮겨 간다'", status: "kept", by: "cell value 'colored on the runtime's sequential scale'" },
      { id: "P3", cat: "X", text: "격자 행·열 과제 이름", essential: true, why: "어느 과제 쌍인지", status: "approx", diff: "cells 프레임에 범주 축 라벨이 없어 머리 칸을 격자 칸으로 대신한다" },
      { id: "P4", cat: "S", text: "점구름 두 판과 격자를 한 장면에", essential: true, why: "두 근거를 나란히", status: "kept", by: "split([taskPair, matrix])" },
    ],
  },
  {
    fig: fig("types"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "Q", text: "유형 네 줄 각 30점, 답별 개수(16/14, 5/7/6/5/4/3)", essential: true, why: "v2 explain. 오류 유형이 분포 모양으로 갈린다", status: "kept", by: "dot 데이터 좌표, 개수 label" },
      { id: "P2", cat: "E", text: "답 종류별 색(정답 good, 오답 X bad, Y–V 구별 색)", essential: true, why: "'여러 답 흩어짐'이 색 수로 보인다", status: "kept", by: "Tone 'series1–6 stay mutually distinguishable'" },
      { id: "P3", cat: "X", text: "'가상 예시' 단서", essential: true, why: "사실성 원칙", status: "kept", by: "label" },
    ],
  },
  {
    fig: fig("pick"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "Q", text: "왼쪽 비율 18/30·9/30·3/30, 오른쪽 점수 0.32·0.81·0.15 막대", essential: true, why: "v2 explain(또는 compare). 결론 '다수결은 시드니, probe는 캔버라'", status: "kept", by: "rect 데이터 좌표 0–1 막대" },
      { id: "P2", cat: "E", text: "각 방식이 고른 막대 강조 + 결과 ✓/✗ 색", essential: true, why: "결론", status: "kept", by: "tone focus, good/bad" },
      { id: "P3", cat: "S", text: "두 방식을 나란히", essential: true, why: "대조", status: "kept", by: "split" },
    ],
  },
  {
    fig: fig("tree"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: ["node-subtitle"],
    props: [
      { id: "P1", cat: "G", text: "이번 수업 → 다섯 갈래 개념 나무", essential: true, why: "v2 summary(다음 주제). 제목 '다섯 갈래'", status: "kept", by: "graph layout tree, node, edge" },
      { id: "P2", cat: "X", text: "갈래마다 이름 + 한 줄 설명", essential: true, why: "무엇을 이어 공부할지", status: "approx", diff: "node text가 한 문자열이라 굵은 제목/작은 설명 두 단계가 한 줄로 합쳐진다" },
    ],
  },
  {
    fig: fig("pipeline"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: ["node-annotation"],
    props: [
      { id: "P1", cat: "G", text: "질문→답 생성→정확한 답 토큰→16층 은닉 상태→linear probe→점수 순서", essential: true, why: "v2 summary. 여섯 개념이 놓이는 자리", status: "kept", by: "graph layered direction right, edge directed" },
      { id: "P2", cat: "X", text: "①–⑥ 정리 번호와 각 노트가 해당 상자 근처에", essential: true, why: "제목 '여섯 가지가 놓이는 자리'", status: "approx", diff: "graph 프레임에서 상자 옆 자유 주석 위치가 없어 노트를 node 글에 합친다" },
      { id: "P3", cat: "E", text: "linear probe 상자 강조", essential: false, why: "핵심 도구", status: "kept", by: "node tone focus" },
    ],
  },
  {
    fig: fig("term-hidden"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "Q", text: "은닉 상태 = 숫자 벡터(10칸, 값마다 진하기) '4096개 중 10개'", essential: true, why: "v2 define 그림", status: "kept", by: "cells + cell value; label" }],
  },
  {
    fig: fig("term-stream"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "G", text: "한 자리에서 층마다 쌓이는 칸 4개 + '층마다'", essential: true, why: "v2 define 그림. residual = 더함", status: "kept", by: "rect stack, opacity, label" }],
  },
  {
    fig: fig("term-probe"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "G", text: "맞음 3점과 틀림 3점을 가르는 직선 경계", essential: true, why: "v2 define 그림. 선형 분류기", status: "kept", by: "dot tone good/bad, line dash" }],
  },
  {
    fig: fig("term-exact"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "E", text: "토큰 다섯 개 중 'Canberra' 칸 warn 강조", essential: true, why: "v2 define 그림. 정확한 답 토큰 정의", status: "kept", by: "rect tone warn weight bold" }],
  },
  {
    fig: fig("tokens"), src: SRC, corpus: "lesson", domain: "ML", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "G", text: "강조 없는 토큰 다섯 개 줄(답을 미리 보이지 않음)", essential: true, why: "v2 predict 그림. 선택지 ①②③이 가리키는 토큰", status: "kept", by: "rect + label; Predict.figure" }],
  },
  {
    fig: fig("hook-art"), src: SRC, corpus: "lesson", domain: "ML", verdict: "N", custom: [], candidates: [],
    reason: "hook의 art 'bulb'는 kit 장식 아이콘으로 데이터·도식이 없다(v2 hook). 글이 본질",
    props: [],
  },
];
