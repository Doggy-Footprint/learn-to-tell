// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, graph, cells, line, path, dot, rect, label, arrow, node, edge, cell, axis, grid, brace, icon } = api;
  /** @typedef {import("ltt").P} P */
  const H = 270;
  /** @param {number} x @param {number} y @returns {P} */
  const v = (x, y) => [x, H - y];
  /** @param {P} a @param {P} b @param {P} c @param {P} d @returns {P[]} */
  const cubic = (a, b, c, d) => Array.from({ length: 25 }, (_, i) => {
    const s = i / 24, u = 1 - s;
    return /** @type {P} */ ([0, 1].map((k) => u * u * u * a[k] + 3 * u * u * s * b[k] + 3 * u * s * s * c[k] + s * s * s * d[k]));
  });
  const up = [v(20, 190), v(170, 190), ...cubic(v(170, 190), v(230, 190), v(220, 90), v(290, 90))];
  const routes = {
    switch: [...up, v(408, 90)],
    loop: [...up, v(388, 90)],
    bridge: [v(20, 190), v(325, 190)],
  };
  /** @param {P[]} pts @param {number} f @returns {P} */
  const along = (pts, f) => {
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    let d = f * seg.reduce((a, b) => a + b, 0);
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i]) { const r = seg[i] ? d / seg[i] : 0; return [pts[i][0] + r * (pts[i + 1][0] - pts[i][0]), pts[i][1] + r * (pts[i + 1][1] - pts[i][1])]; }
      d -= seg[i];
    }
    return pts[pts.length - 1];
  };
  const MOVE0 = 600, ARRIVE = 3600;
  /** @param {"switch"|"bridge"|"loop"} kind */
  const track = (kind) => figure(
    cartesian({ x: [0, 640, ""], y: [0, 270, ""], aspect: "equal", loop: { ms: 4200, span: [0, 4200], once: true } }),
    (m, t) => {
      const p = Math.max(0, Math.min(1, (t - MOVE0) / (ARRIVE - MOVE0)));
      const arrived = t >= ARRIVE;
      const switched = t >= MOVE0;
      const trolley = along(routes[kind], p);
      const five = [410, 440, 470, 500, 530].map((x, i) => dot(v(x, 190), { id: `five${i}`, tone: "good", size: "m" }));
      const side = kind === "loop"
        ? [...up, v(540, 90), ...cubic(v(540, 90), v(610, 90), v(620, 190), v(570, 190))]
        : [...up, v(620, 90)];
      const fp = Math.max(0, Math.min(1, (t - 600) / 1400));
      const lever = (switched ? -40 : 40) * Math.PI / 180;
      return [
        line([v(20, 190), v(620, 190)], { id: "main", weight: "bold", tone: kind === "bridge" || !switched ? "focus" : "muted" }),
        kind !== "bridge" && [
          line(side, { id: "side", weight: "bold", tone: switched ? "focus" : "muted" }),
          line([v(170, 230), v(170 + 22 * Math.sin(lever), 230 - 22 * Math.cos(lever))], { id: "lever", tone: "focus", weight: "bold" }),
          label(v(170, 262), "레버", { tone: "muted" }),
          dot(v(kind === "loop" ? 410 : 430, 90), { id: "one", tone: arrived ? "bad" : "warn", size: "m" }),
          label(v(kind === "loop" ? 410 : 430, 116), "한 명"),
        ],
        kind === "loop" && [
          line([v(424, 80), v(540, 80), ...cubic(v(540, 80), v(602, 80), v(608, 176), v(574, 178))], { id: "ghost", dash: true, tone: "muted" }),
          label(v(470, 66), "그 사람이 없다면 전차는 고리를 돌아온다", { tone: "muted" }),
        ],
        kind === "bridge" && [
          rect(v(330, 240), v(374, 120), { id: "bridge", fill: "soft", tone: "muted" }),
          label(v(352, 262), "육교", { tone: "muted" }),
          fp > 0 && line([v(352, 148), v(352, Math.max(148, 136 + 54 * fp - 12))], { dash: true, tone: "warn" }),
          label(v(384, 140), fp === 0 ? "육교 위에 서 있다" : fp < 1 ? "밀려 떨어지는 중" : "육교 위 → 선로로 떨어짐", { anchor: "w", tone: "muted" }),
          dot(v(352, 136 + 54 * fp), { id: "one", tone: arrived ? "bad" : "warn", size: "m" }),
          label(v(352, 166 + 54 * fp), "한 명"),
        ],
        five,
        label(v(470, 222), "다섯 명"),
        rect([trolley[0] - 18, trolley[1] - 10], [trolley[0] + 18, trolley[1] + 10], { id: "trolley", fill: "solid", label: p === 0 ? "전차" : undefined }),
        label(v(20, 30), arrived ? "구한 사람 5 · 죽은 사람 1" : "구한 사람 ? · 죽은 사람 ?", { id: "tally", anchor: "w", weight: "bold" }),
        label(v(620, 262), "위에서 본 선로 · 축척 아님", { anchor: "e", tone: "muted", size: "s" }),
      ];
    },
  );

  /** @param {string} id @param {[string, string, import("ltt").Tone?][]} parts @param {string[]} ops */
  const mini = (id, parts, ops) => figure(graph({ layout: "layered", direction: "right", static: id }), () => [
    parts.map(([k, text, tone], i) => node(k, text, { at: [i * 2, 0], tone, shape: "round" })),
    parts.slice(1).map(([k], i) => edge(parts[i][0], k, { text: ops[i], directed: ops[i] === "→" })),
  ]);

  /** chain node: [id, col, row, text, tone?] */
  /** @param {string} pre @param {number} ox @param {number} oy @param {[string, number, number, string, import("ltt").Tone?][]} ns @param {[string, string, boolean?][]} es */
  const chain = (pre, ox, oy, ns, es) => [
    ns.map(([k, c, r, text, tone]) => node(pre + k, text, { at: [ox + c, oy - r], tone, shape: "box", group: pre })),
    es.map(([f, t, removed]) => edge(pre + f, pre + t, { directed: true, opacity: removed ? 0.4 : 1, tone: removed ? "muted" : undefined })),
  ];

  const pct = { 스위치: 81, 루프: 72, 육교: 51 };
  const rows = /** @type {const} */ (["스위치", "루프", "육교"]);

  return {
    models: {
      cases: model({ kind: "switch" }, ({ kind }) => ({ saved: 5, died: 1, net: 5 - 1, kind }), "Thomson (1985) Yale Law Journal 94: 두 사례 모두 5 생존 · 1 사망"),
      survey: model({}, () => pct, "Awad et al. (2020) PNAS 117(5): 2332–2337, 42개국 평균"),
    },
    figures: {
      hook: figure(cartesian({ x: [0, 10, ""], y: [0, 10, ""], static: "저울: 다섯과 하나" }), () => icon("scale", [5, 5], { id: "scale", size: "l" })),
      termConseq: mini("5명 생존 > 1명 생존", [["a", "5명 생존", "good"], ["b", "1명 생존", "bad"]], [">"]),
      termDeon: mini("좋은 결과 ≠ 허용", [["a", "좋은 결과"], ["b", "허용", "bad"]], ["≠"]),
      termSide: mini("행동 → 목표, 옆으로 부수 효과", [["a", "행동"], ["b", "목표", "good"]], ["→"]),
      termMeans: mini("행동 → 수단 → 목표", [["a", "행동"], ["b", "수단", "bad"], ["c", "목표", "good"]], ["→", "→"]),
      switch: track("switch"),
      bridge: track("bridge"),
      loop: track("loop"),
      ledger: figure(cells({ cols: 7, rows: 3, static: "장부: 구한 사람 5, 죽은 사람 1, 차이 4" }), (m, t, { params }) => [
        label([0, 2], `${params.kind === "bridge" ? "육교" : "스위치"}`, { weight: "bold" }),
        label([0, 1], "구한 사람"), [1, 2, 3, 4, 5].map((c) => cell(c, 1, { tone: "good", id: `saved${c}` })), label([6, 1], "5"),
        label([0, 0], "죽은 사람"), cell(1, 0, { tone: "bad", id: "died" }), label([6, 0], "1"),
        label([3, -0.6], "차이 5 − 1 = 4", { id: "net", weight: "bold" }),
      ]),
      chains: figure(graph({ layout: "layered", direction: "right", static: "스위치·육교 인과 사슬, 그 사람이 있을 때와 없을 때" }), () => [
        label([1, 3], "그 사람이 있을 때", { weight: "bold" }), label([6, 3], "그 사람이 없었다면", { weight: "bold" }),
        label([-1, 2], "스위치", { weight: "bold" }), label([-1, -1], "육교", { weight: "bold" }),
        chain("sw0-", 0, 2, [["act", 0, 0, "레버를 당긴다"], ["turn", 1, 0, "전차가 옆길로 간다"], ["five", 2, 0, "다섯이 산다", "good"], ["one", 1, 1, "한 명이 죽는다", "bad"]],
          [["act", "turn"], ["turn", "five"], ["turn", "one"]]),
        chain("sw1-", 5, 2, [["act", 0, 0, "레버를 당긴다"], ["turn", 1, 0, "전차가 옆길로 간다"], ["five", 2, 0, "그래도 다섯이 산다", "good"], ["one", 1, 1, "(그 사람이 없다면)", "muted"]],
          [["act", "turn"], ["turn", "five"], ["turn", "one", true]]),
        label([6, 0.2], "그 사람이 없어도 다섯은 산다 → 그의 죽음은 부수 효과", { id: "verdict-sw", tone: "good" }),
        chain("br0-", 0, -1, [["act", 0, 0, "한 명을 민다"], ["fall", 1, 0, "그가 선로에 떨어진다"], ["stop", 2, 0, "그에게 부딪혀 전차가 멈춘다 (그는 죽는다)", "bad"], ["five", 3, 0, "다섯이 산다", "good"]],
          [["act", "fall"], ["fall", "stop"], ["stop", "five"]]),
        chain("br1-", 5, -1, [["act", 0, 0, "한 명을 민다"], ["fall", 1, 0, "(그 사람이 없다면)", "muted"], ["stop", 2, 0, "전차가 멈추지 않는다", "bad"], ["five", 3, 0, "다섯이 죽는다", "bad"]],
          [["act", "fall"], ["fall", "stop", true], ["stop", "five"]]),
        label([6, -2], "그 사람이 없으면 다섯이 죽는다 → 그의 몸은 수단", { id: "verdict-br", tone: "bad" }),
      ]),
      kant: mini("밀기 → 그 사람 = 브레이크 → 다섯이 산다", [["a", "밀기"], ["b", "그 사람 = 브레이크", "bad"], ["c", "다섯이 산다", "good"]], ["→", "→"]),
      features: figure(cells({ cols: 4, rows: 4, static: "세 사례의 특징표" }), () => [
        ["사례", "장부", "죽음이 수단인가", "손으로 직접 미는가"].map((s, c) => cell(c, 3, { text: s, tone: "muted" })),
        [["스위치", "5 · 1", "아니오", "아니오"], ["루프", "5 · 1", "예", "아니오"], ["육교", "5 · 1", "예", "예"]]
          .map((r, i) => r.map((s, c) => cell(c, 2 - i, { text: s, tone: s === "예" ? "bad" : undefined }))),
      ]),
      bars: figure(cartesian({ x: [0, 100, "%"], y: [0, 3, ""], loop: { ms: 900, span: [0, 1], once: true } }), (m, t) => [
        grid({ x: [0, 25, 50, 75, 100] }),
        axis("x", { ticks: [0, 25, 50, 75, 100], label: "“희생해도 된다” 응답 비율 (42개국 평균)" }),
        rows.map((k, i) => [
          rect([0, 2.6 - i - 0.35], [pct[k] * t, 2.6 - i + 0.35], { id: `bar-${k}`, tone: "focus", fill: "solid" }),
          label([0, 2.6 - i], k, { anchor: "e" }),
          label([pct[k] * t, 2.6 - i], `${pct[k]}%`, { anchor: "w" }),
        ]),
        t >= 1 && [
          brace([pct.루프, 1.6], [pct.스위치, 1.6], "−9%p 스위치 → 루프: 그의 몸이 수단이 됨", { id: "gap1" }),
          brace([pct.육교, 0.6], [pct.루프, 0.6], "−21%p 루프 → 육교: 손으로 직접 밀기", { id: "gap2" }),
        ],
      ]),
      debateCons: mini("스위치 = 육교", [["a", "스위치"], ["b", "육교"]], ["="]),
      debateDeon: mini("부수 효과 ≠ 수단", [["a", "부수 효과", "good"], ["b", "수단", "bad"]], ["≠"]),
      tree: figure(graph({ layout: "layered", direction: "right", static: "개념 나무: 이번 수업 → 다음 개념" }), () => [
        [["cons", "결과주의"], ["dde", "이중효과 원리"], ["means", "수단으로 사용하기"], ["xphi", "트롤리 직관 실험"]]
          .map(([k, s]) => node(k, s, { group: "이번 수업", tone: "focus" })),
        [["rule", "규칙 결과주의"], ["doing", "행위와 허용의 구분"], ["kant", "정언명령의 세 정식"], ["contract", "계약주의(Scanlon)"], ["dual", "이중 과정 이론"], ["av", "자율주행차 윤리"]]
          .map(([k, s]) => node(k, s, { group: "다음 개념", tone: "muted" })),
        [["cons", "rule"], ["dde", "doing"], ["means", "kant"], ["means", "contract"], ["xphi", "dual"], ["xphi", "av"]].map(([f, t]) => edge(f, t, { directed: true })),
      ]),
      overview: figure(cells({ cols: 4, rows: 6, static: "세 사례 개관표" }), () => [
        ["", "스위치", "루프", "육교"].map((s, c) => cell(c, 5, { text: s })),
        [["1 장부", "구함 5 · 죽음 1", "구함 5 · 죽음 1", "구함 5 · 죽음 1"],
          ["2 그의 몸", "부수 효과", "수단", "수단"],
          ["3 이중효과", "허용", "수단 조건에 걸림", "수단 조건에 걸림"],
          ["4 행동", "레버", "레버", "손으로 밀기"],
          ["5 희생 지지", "81%", "72%", "51%"]]
          .map((r, i) => r.map((s, c) => cell(c, 4 - i, { text: s, tone: s === "수단" ? "bad" : s === "부수 효과" ? "good" : undefined }))),
      ]),
    },
    scenes: [
      { type: "compare", title: "장부만 보면 두 사례는 똑같다", say: "결과주의는 이 장부만 본다.", figure: "ledger", focus: ["net"], a: { kind: "switch" }, b: { kind: "bridge" }, labels: ["스위치", "육교"] },
      {
        type: "predict", title: "사람들은 세 사례를 어떻게 판단했을까", ask: "“희생해도 된다”고 답한 비율은 어떤 순서였을까?", figure: "features", focus: [],
        input: { kind: "choice", options: [
          { text: "셋이 거의 같다", feedback: "장부는 같지만 판단은 갈렸다." },
          { text: "스위치 = 루프 > 육교", feedback: "루프도 스위치보다 낮았다." },
          { text: "스위치 > 루프 = 육교", feedback: "육교가 루프보다 더 낮았다." },
          { text: "스위치 > 루프 > 육교", correct: true },
        ] },
        reveal: { say: "스위치 81% > 루프 72% > 육교 51%(나라별 평균).", figure: "bars" },
      },
    ],
  };
};

const src = "archive/v1:site/gallery/philosophy/trolley-ethics.html";
/** @type {import("../fragment").AuditRow[]} */
export const audit = [
  {
    fig: "trolley-ethics#hook", src, corpus: "lesson", domain: "철학", verdict: "G", custom: [], candidates: ["icon-set"],
    props: [{ id: "P1", cat: "X", text: "저울 아이콘(art: scale)으로 다섯과 하나를 다는 질문을 상징", essential: true, why: "v2 hook. 질문 장면의 유일한 그림이 저울 상징에 기댄다", status: "ambiguous", diff: "icon 이름 집합을 d.ts가 정하지 않아 \"scale\"이 저울로 그려진다는 보장이 없다" }],
  },
  {
    fig: "trolley-ethics#term-consequentialism", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "X", text: "'5명 생존' > '1명 생존' 두 칩과 부등호", essential: true, why: "v2 define. 결과주의 정의를 결과 비교로 보여 준다", status: "kept", by: "node(id, text, {at}) + edge({text})" },
      { id: "P2", cat: "E", text: "5명 생존 good, 1명 생존 bad 색", essential: false, why: "어느 쪽이 나은지 강조", status: "kept", by: "MarkOpts.tone good/bad 'semantic'" },
    ],
  },
  {
    fig: "trolley-ethics#term-deontology", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "X", text: "'좋은 결과' ≠ '허용'", essential: true, why: "v2 define. 의무론 정의의 핵심(좋은 결과가 허용을 뜻하지 않음)", status: "kept", by: "node + edge({text:'≠'})" }],
  },
  {
    fig: "trolley-ethics#term-side-effect", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "G", text: "행동 → 목표 사슬, 부수 효과는 사슬 밖 옆 가지", essential: true, why: "v2 define. 부수 효과는 목표 경로 위에 있지 않다는 것이 정의의 핵심", status: "approx", diff: "부수 효과 칩을 사슬 옆 가지로 두지 않고 생략했다; 정의 문장이 그 위치를 말하므로 결론은 남는다" },
    ],
  },
  {
    fig: "trolley-ethics#term-means", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "G", text: "행동 → 수단 → 목표, 수단이 경로 위에 있음", essential: true, why: "v2 define. 수단은 목표로 가는 경로 위에 반드시 놓인다", status: "kept", by: "node({at}) 순서 + edge directed; graph: 'at overrides layout'" }],
  },
  {
    fig: "trolley-ethics#switch", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: ["mark-rotate", "path-sample"],
    props: [
      { id: "P1", cat: "G", text: "본선은 다섯에게, 옆길은 한 명에게 이어지는 선로 위상(위에서 본 도식, 축척 아님 표시)", essential: true, why: "v2 explain(제목·서사). 레버가 전차를 한 명 쪽으로 돌린다는 것이 장면 결론", status: "kept", by: "line(pts) + dot + label; 축척 아님은 label 문자" },
      { id: "P2", cat: "T", text: "0.6s에 레버가 넘어가고 전차가 0.6–3.6s에 옆길을 따라 한 명에게 도달, 한 번 재생 후 정지", essential: true, why: "결과(다섯 생존, 한 명 사망)가 전차 이동으로 드러난다", status: "kept", by: "Loop {ms:4200, span:[0,4200], once} 'maps span linearly onto ms', 'Play once, then hold the end state'" },
      { id: "P3", cat: "E", text: "활성 선로 강조(전환 전 본선, 후 옆길)", essential: true, why: "어느 길로 가는지 보여 준다", status: "kept", by: "tone focus 'is the accent' vs muted" },
      { id: "P4", cat: "X", text: "도달 후 집계 '구한 사람 5 · 죽은 사람 1'", essential: true, why: "장부 장면으로 이어지는 결과 숫자", status: "kept", by: "label(at, text) t에 따라 sampled draw" },
      { id: "P5", cat: "G", text: "전차가 곡선에서 진행 방향으로 회전", essential: false, why: "외형", status: "approx", diff: "rect는 회전 옵션이 없어 축 정렬 상자로 그린다" },
      { id: "P6", cat: "I", text: "다시 재생 버튼", essential: false, why: "재관찰 편의", status: "lost", diff: "figure 단위 replay 컨트롤을 d.ts가 말하지 않는다" },
    ],
  },
  {
    fig: "trolley-ethics#bridge", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: ["mark-rotate"],
    props: [
      { id: "P1", cat: "G", text: "옆길 없는 본선, 다섯 앞의 육교, 육교 위 한 명", essential: true, why: "v2 explain. 옆길이 없고 그의 몸만이 전차를 멈춘다는 구조", status: "kept", by: "line + rect + dot + label" },
      { id: "P2", cat: "T", text: "0.6–2.0s 그 사람이 선로로 떨어지고, 전차가 x=325에서 멈춘다(다섯 앞)", essential: true, why: "그의 몸이 전차를 멈춘다는 사고 실험 가정을 보여 준다", status: "kept", by: "Loop once; dot 위치를 t의 함수로 그림" },
      { id: "P3", cat: "X", text: "상태 글 '육교 위에 서 있다/밀려 떨어지는 중/선로로 떨어짐'과 도달 후 집계 5·1", essential: true, why: "두 사례 장부가 같음을 준비", status: "kept", by: "label Text, sampled draw" },
    ],
  },
  {
    fig: "trolley-ethics#ledger", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "Q", text: "사례마다 구한 사람 5(점 5개), 죽은 사람 1(점 1개), 차이 4", essential: true, why: "v2 compare. 제목 '장부만 보면 두 사례는 똑같다'가 같은 숫자에 기댄다", status: "kept", by: "cells + cell(col,row) 개수, label 숫자" },
      { id: "P2", cat: "S", text: "스위치와 육교 장부를 나란히 두고 = 로 잇는다", essential: true, why: "동일함을 한눈에", status: "approx", diff: "Compare 'side by side'로 나란히 두지만 둘 사이 '=' 기호는 그릴 자리가 없어 labels·say로 옮긴다" },
    ],
  },
  {
    fig: "trolley-ethics#chains", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: ["edge-dash"],
    props: [
      { id: "P1", cat: "G", text: "스위치: 레버 → 옆길 → (다섯 산다, 한 명 죽는다) 분기; 한 명은 다섯으로 가는 경로 밖", essential: true, why: "v2 compare(2×2). 부수 효과 = 경로 밖이라는 결론", status: "kept", by: "node({at}) + edge directed; 'at overrides layout'" },
      { id: "P2", cat: "G", text: "육교: 민다 → 떨어진다 → 멈춘다 → 다섯 산다, 그가 경로 위", essential: true, why: "수단 = 경로 위라는 결론", status: "kept", by: "node + edge directed" },
      { id: "P3", cat: "S", text: "2×2 격자: 행 사례, 열 '있을 때/없었다면'", essential: true, why: "반사실 시험을 같은 줄에서 비교", status: "kept", by: "node at으로 열·행 배치, label 머리글" },
      { id: "P4", cat: "E", text: "제거된 사람의 노드는 muted, 끊긴 화살표는 점선", essential: true, why: "그 사람을 지웠음을 표시", status: "approx", diff: "edge에 dash 옵션이 없어 opacity 0.4·muted로 대신한다; 지워진 연결은 여전히 구별된다" },
      { id: "P5", cat: "X", text: "판정 태그 '부수 효과'(good)·'수단'(bad)", essential: true, why: "장면 결론 문장", status: "kept", by: "label + tone good/bad" },
    ],
  },
  {
    fig: "trolley-ethics#kant", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "G", text: "밀기 → 그 사람 = 브레이크(bad) → 다섯이 산다", essential: true, why: "v2 explain. 인간성 정식: 그를 수단(브레이크)으로 쓴다", status: "kept", by: "node at + edge directed, tone bad" }],
  },
  {
    fig: "trolley-ethics#loop", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: ["mark-rotate"],
    props: [
      { id: "P1", cat: "G", text: "옆길이 고리로 돌아 다섯 뒤 본선에 다시 이어짐, 고리 위 한 명", essential: true, why: "v2 explain. 행동은 레버, 구조는 수단이라는 결론", status: "kept", by: "line(cubic 표본점) + dot" },
      { id: "P2", cat: "G", text: "그 사람이 없을 때의 반사실 경로(점선)와 설명 글", essential: true, why: "그의 몸이 없으면 다섯이 죽는다 = 수단", status: "kept", by: "line({dash:true}) + label" },
      { id: "P3", cat: "T", text: "레버 전환 후 전차가 고리 위 한 명(x=388)에서 멈춘다, 한 번 재생", essential: true, why: "그에게 부딪혀야 멈춘다", status: "kept", by: "Loop once, rect 위치 = 경로 길이 비례 보간" },
      { id: "P4", cat: "X", text: "도달 후 집계 5·1", essential: true, why: "장부 동일", status: "kept", by: "label Text" },
    ],
  },
  {
    fig: "trolley-ethics#features", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "X", text: "사례 × (장부, 수단인가, 직접 미는가) 표: 스위치 아니오/아니오, 루프 예/아니오, 육교 예/예", essential: true, why: "v2 predict. 예측 근거가 되는 두 요인 분리", status: "kept", by: "cells + cell({text})" },
    ],
  },
  {
    fig: "trolley-ethics#bars", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "Q", text: "수평 막대 스위치 81, 루프 72, 육교 51(%), 0–100% 고정 선형 축, 눈금 0/25/50/75/100", essential: true, why: "v2 explain(predict reveal). 제목 '81 → 72 → 51%로 내려간다'", status: "kept", by: "cartesian x:[0,100,'%'] + rect 길이 + axis ticks" },
      { id: "P2", cat: "Q", text: "간격 −9%p(스위치→루프), −21%p(루프→육교)와 각 간격에 바뀐 요소", essential: true, why: "간격을 요인에 대응시키는 결론", status: "kept", by: "brace(from,to,text) 데이터 좌표" },
      { id: "P3", cat: "T", text: "막대가 0에서 자라는 재생", essential: false, why: "도입 효과", status: "kept", by: "Loop once" },
    ],
  },
  {
    fig: "trolley-ethics#debate-consequentialist", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "X", text: "'스위치' = '육교'", essential: true, why: "v2 explain. 결과주의 자리의 요지", status: "kept", by: "node + edge({text})" }],
  },
  {
    fig: "trolley-ethics#debate-deontologist", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [{ id: "P1", cat: "X", text: "'부수 효과'(good) ≠ '수단'(bad)", essential: true, why: "v2 explain. 의무론 자리의 요지", status: "kept", by: "node + edge({text}) + tone" }],
  },
  {
    fig: "trolley-ethics#tree", src, corpus: "lesson", domain: "철학", verdict: "G", custom: [], candidates: ["group-box"],
    props: [
      { id: "P1", cat: "G", text: "이번 수업 4개념 → 다음 6개념, 화살표 6개, 왼→오른", essential: true, why: "v2 explain. '이것을 알면 다음으로'", status: "kept", by: "graph layered direction right + edge directed" },
      { id: "P2", cat: "S", text: "왼쪽 묶음 '이번 수업', 오른쪽 '다음 개념'", essential: true, why: "제목이 두 묶음에 기댄다", status: "ambiguous", diff: "node group이 묶음 상자·제목을 그리는지, 묶음이 좌우로 갈리는지 d.ts가 말하지 않는다" },
    ],
  },
  {
    fig: "trolley-ethics#overview", src, corpus: "lesson", domain: "철학", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "X", text: "3사례 × 5행(장부, 그의 몸, 이중효과, 행동, 지지율 81/72/51) 표", essential: true, why: "v2 summary(lesson.summary.figures). 제목 '장부는 같고 사슬·행동·판단이 다르다'", status: "kept", by: "cells + cell({text})" },
      { id: "P2", cat: "E", text: "부수 효과 good, 수단 bad 태그 색", essential: false, why: "구조 차이 강조", status: "kept", by: "tone good/bad" },
    ],
  },
];
