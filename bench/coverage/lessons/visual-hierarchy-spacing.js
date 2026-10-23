// @ts-check
/** @typedef {import("ltt").P} P */
/** @typedef {import("ltt").Tone} Tone */
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, cells, graph, rect, label, dim, dot, circle, icon, mock, node, edge, axis, model } = api;
  const KPI = [
    { lab: "매출", val: "4.2억 원", del: "▲ +8.0%", good: true, tone: /** @type {Tone} */ ("series1") },
    { lab: "신규 가입", val: "1,284명", del: "▲ +3.1%", good: true, tone: /** @type {Tone} */ ("series2") },
    { lab: "이탈률", val: "5.6%", del: "▲ +2.1%p", good: false, tone: /** @type {Tone} */ ("bad"), alert: true },
    { lab: "평균 주문액", val: "32,800원", del: "▼ −1.2%", good: false, tone: /** @type {Tone} */ ("series4") },
  ];
  const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
  const SALES = [0.52, 0.58, 0.61, 0.55, 0.66, 0.69, 0.59];
  const SP = {
    loud: { lv: 16, vd: 16, card: 16, section: 16, stitle: 16, head: 16 },
    calm: { lv: 4, vd: 4, card: 24, section: 48, stitle: 12, head: 24 },
  };
  const OUTER = 24;
  /** @param {number} inner */
  const ratio = (inner) => OUTER / inner;

  /**
   * KPI row in px, y down from top; returns marks and bottom y.
   * @param {"loud"|"calm"} mode @param {number} x0 @param {number} top @param {number} W @param {number} H @param {boolean} ann @param {boolean} blob
   */
  const kpiRow = (mode, x0, top, W, H, ann, blob) => {
    const s = SP[mode], loud = mode === "loud";
    const cw = (W - 3 * s.card) / 4;
    const ch = 16 + 16 + s.lv + 24 + s.vd + 16 + 16;
    /** @param {number} y */
    const Y = (y) => H - y;
    /** @type {import("ltt").MarkTree[]} */
    const out = [];
    KPI.forEach((k, i) => {
      const x = x0 + i * (cw + s.card);
      const yl = top + 16, yv = yl + 16 + s.lv, yd = yv + 24 + s.vd;
      out.push(rect([x, Y(top)], [x + cw, Y(top + ch)], { id: `${mode}-card${i}`, tone: "muted", fill: "soft" }));
      /** @type {[string, string, number, Tone|undefined, "s"|"m"|"l", "normal"|"bold"][]} */
      const rows = [
        ["lab", k.lab, yl, loud ? "series1" : "muted", "s", loud ? "bold" : "normal"],
        ["val", k.val, yv, loud ? k.tone : undefined, "l", "bold"],
        ["del", k.del, yd, loud ? (k.good ? "good" : "bad") : k.alert ? "bad" : "muted", "s", loud ? "bold" : "normal"],
      ];
      for (const [r, t, y, tone, size, weight] of rows) {
        const h = r === "val" ? 24 : 16;
        out.push(blob
          ? rect([x + 16, Y(y)], [x + 16 + t.length * (r === "val" ? 11 : 7), Y(y + h)], { id: `${mode}-blob-${r}${i}`, tone: tone ?? "ref", fill: "solid", opacity: tone && tone !== "muted" ? 0.9 : 0.35 })
          : label([x + 16, Y(y)], t, { id: `${mode}-${r}${i}`, anchor: "nw", tone, size, weight }));
      }
      if (ann && i === 0) out.push(dim([x + cw - 8, Y(yl + 16)], [x + cw - 8, Y(yl + 16 + s.lv)], `${s.lv}`, { id: `${mode}-gap-lv`, tone: "focus" }));
      if (ann && i === 1) out.push(dim([x - s.card, Y(top + ch / 2)], [x, Y(top + ch / 2)], `${s.card}`, { id: `${mode}-gap-card`, tone: "focus" }));
    });
    return { marks: out, bottom: top + ch };
  };

  /** @param {"loud"|"calm"} mode @param {boolean} ann @param {boolean} markers */
  const dashboard = (mode, ann, markers) => {
    const s = SP[mode], loud = mode === "loud";
    const W = 600, H = 470, x0 = 20;
    /** @param {number} y */
    const Y = (y) => H - y;
    let y = 40;
    /** @type {import("ltt").MarkTree[]} */
    const kids = [
      label([x0, Y(y)], "주간 운영 대시보드", { id: `${mode}-title`, anchor: "nw", size: "l", weight: "bold" }),
      label([x0, Y(y + 26)], "10.13 – 10.19", { id: `${mode}-date`, anchor: "nw", size: "s", tone: loud ? "series1" : "muted", weight: loud ? "bold" : "normal" }),
      rect([440, Y(y)], [500, Y(y + 28)], { id: `${mode}-btn-filter`, tone: loud ? "warn" : "muted", fill: loud ? "solid" : "none", label: "필터" }),
      rect([510, Y(y)], [580, Y(y + 28)], { id: `${mode}-btn-export`, tone: "focus", fill: "solid", label: "내보내기" }),
    ];
    y += 44 + s.head;
    const row = kpiRow(mode, x0, y, W - 2 * x0, H, ann, false);
    kids.push(row.marks);
    y = row.bottom;
    if (ann) kids.push(dim([x0 - 8, Y(y)], [x0 - 8, Y(y + s.section)], `${s.section}`, { id: `${mode}-gap-section`, tone: "focus" }));
    y += s.section;
    kids.push(label([x0, Y(y)], "일별 매출 (억 원)", { id: `${mode}-stitle`, anchor: "nw", weight: "bold" }));
    y += 18 + s.stitle;
    const base = y + 70, bw = 50;
    SALES.forEach((v, i) => {
      const bx = x0 + i * 78;
      /** @type {Tone} */
      const tone = loud ? /** @type {Tone[]} */ (["series1", "series2", "warn", "bad", "series4", "series5", "series6"])[i] : "muted";
      kids.push(rect([bx, Y(base)], [bx + bw, Y(base - (v / 0.7) * 70)], { id: `${mode}-bar${i}`, tone, fill: "solid" }));
      kids.push(label([bx + bw / 2, Y(base - (v / 0.7) * 70) + 2], v.toFixed(2), { id: `${mode}-barv${i}`, anchor: "s", size: "s" }));
      kids.push(label([bx + bw / 2, Y(base + 4)], DAYS[i], { id: `${mode}-day${i}`, anchor: "n", size: "s", tone: "muted" }));
    });
    if (markers) {
      kids.push(
        label([x0 - 4, Y(84 + s.head - 4)], "①", { id: "mk1", tone: "focus", weight: "bold" }),
        label([x0 + 1 * ((560 - 72) / 4 + 24) + 90, Y(84 + s.head + 36)], "②", { id: "mk2", tone: "focus", weight: "bold" }),
        label([x0 - 10, Y(row.bottom + 24)], "③", { id: "mk3", tone: "focus", weight: "bold" }),
        label([x0 + 2 * ((560 - 72) / 4 + 24) + 110, Y(row.bottom - 26)], "④", { id: "mk4", tone: "focus", weight: "bold" }),
      );
    }
    return mock("browser", [[0, 0], [W, H]], kids, { id: `${mode}-browser`, title: "ops.example.com/weekly" });
  };

  const WORDS = ["매출", "신규 가입", "이탈률", "평균 주문액", "방문 수", "전환율"];
  /** @type {["s"|"m"|"l", "normal"|"bold", Tone][]} */
  const MIX = [["l", "bold", "series1"], ["s", "normal", "series2"], ["m", "bold", "bad"], ["l", "normal", "series4"], ["s", "bold", "warn"], ["m", "normal", "series5"]];

  return {
    models: {
      prox: model({ inner: "24" }, ({ inner }) => ({ inner: Number(inner), ratio: ratio(Number(inner)) }), "Wertheimer 1923 근접성; 바깥 24px 고정, 비율 = 24 ÷ 안쪽"),
    },
    figures: {
      hook: figure(cartesian({ x: [0, 10, ""], y: [0, 10, ""], static: "눈 아이콘" }), () => [icon("eye", [5, 5], { id: "eye", size: "l" })]),
      "term-proximity": figure(cartesian({ x: [0, 150, "px"], y: [0, 44, "px"], aspect: "equal", static: "점 셋씩 두 묶음" }), () =>
        [0, 1, 2].flatMap((i) => [circle([12 + i * 16, 22], 6, { id: `pa${i}`, fill: "solid", tone: "muted" }), circle([92 + i * 16, 22], 6, { id: `pb${i}`, fill: "solid", tone: "muted" })])),
      "term-signal": figure(cartesian({ x: [0, 150, ""], y: [0, 44, ""], static: "Aa 네 개: 크고 굵게, 굵게, 빨강, 회색" }), () => [
        label([5, 22], "Aa", { id: "aa-big", size: "l", weight: "bold", anchor: "w" }),
        label([45, 22], "Aa", { id: "aa-bold", size: "s", weight: "bold", anchor: "w" }),
        label([80, 22], "Aa", { id: "aa-red", size: "s", tone: "bad", anchor: "w" }),
        label([115, 22], "Aa", { id: "aa-mute", size: "s", tone: "muted", anchor: "w" }),
      ]),
      "term-scale": figure(cartesian({ x: [0, 150, "px"], y: [0, 44, "px"], aspect: "equal", static: "4·8·16·24·48 막대" }), () =>
        [4, 8, 16, 24, 48].map((v, i) => rect([i * 28, 4], [i * 28 + 20, 4 + v * 0.75], { id: `sc${v}`, tone: "focus", fill: "solid", opacity: 0.35 + i * 0.15 }))),
      "term-budget": figure(cells({ cols: 6, rows: 2, static: "회색 점 11개와 빨간 점 1개" }), () =>
        Array.from({ length: 12 }, (_, i) => dot([i % 6, Math.floor(i / 6)], { id: `b${i}`, tone: i === 8 ? "bad" : "muted" }))),
      prox: figure(cartesian({ x: [0, 200, "px"], y: [0, 200, "px"], aspect: "equal", static: "라벨·값 세 쌍, 안쪽·바깥 간격 측정선" }), (m) => {
        const inner = m.prox.inner;
        /** @type {import("ltt").MarkTree[]} */
        const out = [];
        let y = 190;
        KPI.slice(0, 3).forEach((k, i) => {
          if (i) { out.push(dim([150, y], [150, y - OUTER], `밖 ${OUTER}`, { id: `out${i}`, tone: "ref" })); y -= OUTER; }
          out.push(label([10, y], k.lab, { id: `l${i}`, anchor: "nw", size: "s", tone: "muted" }));
          y -= 16;
          out.push(dim([150, y], [150, y - inner], `안 ${inner}`, { id: `in${i}`, tone: "focus" }));
          y -= inner;
          out.push(label([10, y], k.val, { id: `v${i}`, anchor: "nw", size: "l", weight: "bold" }));
          y -= 24;
        });
        const r = m.prox.ratio;
        out.push(label([10, 4], `×${r.toFixed(r < 1 ? 2 : 1)} 바깥 ÷ 안쪽 · ${r >= 2 ? "한 쌍으로 묶인다" : r > 1 ? "묶이긴 하지만 흐릿하다" : r === 1 ? "짝을 정할 수 없다" : "잘못 묶인다"}`, { id: "verdict", anchor: "sw", tone: r <= 1 ? "bad" : r >= 2 ? "good" : "warn" }));
        return out;
      }),
      four: figure(cells({ cols: 4, rows: 7, static: "같은 여섯 단어 네 칸: 크기·굵기·색·제각각" }), () => {
        const titles = ["① 크기만 다름", "② 굵기만 다름", "③ 색만 다름", "④ 모두가 제각각"];
        /** @type {import("ltt").MarkTree[]} */
        const out = titles.map((t, c) => label([c, 0], t, { id: `ph${c}`, weight: "bold", size: "s" }));
        WORDS.forEach((w, r) => {
          const tgt = w === "이탈률";
          out.push(
            label([0, r + 1], w, { id: `p0-${r}`, size: tgt ? "l" : "m", tone: tgt ? "ref" : undefined }),
            label([1, r + 1], w, { id: `p1-${r}`, weight: tgt ? "bold" : "normal" }),
            label([2, r + 1], w, { id: `p2-${r}`, tone: tgt ? "bad" : undefined }),
            label([3, r + 1], w, { id: `p3-${r}`, size: MIX[r][0], weight: MIX[r][1], tone: MIX[r][2] }),
          );
        });
        return out;
      }),
      scale: figure(cartesian({ x: [0, 700, "px"], y: [0, 330, "px"], aspect: "equal", static: "4의 배수 척도와 카드 두 장 1.5배 해부도" }), () => {
        const S = 1.5;
        /** @type {Record<number, Tone>} */
        const used = { 4: "series1", 16: "series3", 24: "series2", 48: "series4" };
        const steps = [4, 8, 12, 16, 24, 32, 48];
        /** @type {import("ltt").MarkTree[]} */
        const out = [label([0, 325], "4의 배수 척도 (px)", { id: "ruler-title", anchor: "nw", weight: "bold", size: "s" })];
        steps.forEach((v, i) => {
          const y = 290 - i * 40;
          out.push(
            label([30, y], `${v}`, { id: `rl${v}`, anchor: "e", weight: used[v] ? "bold" : "normal", tone: used[v] ? undefined : "muted" }),
            rect([40, y - 9], [40 + v * S * 2, y + 9], { id: `rb${v}`, tone: used[v] ?? "muted", fill: "solid" }),
            !used[v] && label([46 + v * S * 2, y], "안 씀", { id: `rn${v}`, anchor: "w", size: "s", tone: "muted" }),
          );
        });
        const cw = 150, pad = 16, g = 4, cg = 24, sg = 48, ch = pad + 16 + g + 24 + g + 16 + pad;
        const X = (/** @type {number} */ v) => 260 + v * S, Y = (/** @type {number} */ v) => 320 - v * S;
        [0, 1].forEach((j) => {
          const x0 = j * (cw + cg), k = KPI[j];
          out.push(
            rect([X(x0), Y(0)], [X(x0 + cw), Y(ch)], { id: `ac${j}`, tone: "muted", fill: "soft" }),
            label([X(x0 + pad), Y(pad)], k.lab, { id: `al${j}`, anchor: "nw", size: "s", tone: "muted" }),
            label([X(x0 + pad), Y(pad + 16 + g)], k.val, { id: `av${j}`, anchor: "nw", size: "l", tone: "muted" }),
            label([X(x0 + pad), Y(pad + 16 + g + 24 + g)], k.del, { id: `ad${j}`, anchor: "nw", size: "s", tone: "muted" }),
          );
        });
        /** @param {P} a @param {P} b @param {Tone} tone @param {string} t @param {string} id */
        const gap = (a, b, tone, t, id) => [rect(a, b, { id, tone, fill: "solid", opacity: 0.85 }), label([(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 4], t, { id: id + "-t", anchor: "s", weight: "bold", tone })];
        out.push(
          gap([X(cw - 12) - 15, Y(pad + 16)], [X(cw - 12), Y(pad + 16 + g)], "series1", "4", "g4"),
          gap([X(cw - 12) - 15, Y(0)], [X(cw - 12), Y(pad)], "series3", "16", "g16"),
          gap([X(cw), Y(ch / 2 - 5)], [X(cw + cg), Y(ch / 2 + 5)], "series2", "24", "g24"),
          gap([X(cw * 2 + cg), Y(ch)], [X(cw * 2 + cg) + 15, Y(ch + sg)], "series4", "48", "g48"),
          api.line([[X(0), Y(ch + sg)], [X(cw * 2 + cg), Y(ch + sg)]], { id: "next-sec", dash: true, tone: "muted" }),
          label([X(0), Y(ch + sg + 4)], "일별 매출 (억 원)", { id: "next-title", anchor: "nw", weight: "bold" }),
          label([X(0), Y(ch + sg + 30)], "다음 섹션 시작 · 그림은 실제 px의 1.5배로 확대", { id: "scale-note", anchor: "nw", size: "s", tone: "muted" }),
        );
        return out;
      }),
      "kpi-loud": figure(cartesian({ x: [0, 600, "px"], y: [0, 130, "px"], aspect: "equal", static: "고치기 전 KPI 줄" }), () => kpiRow("loud", 10, 10, 580, 130, false, false).marks),
      "kpi-calm": figure(cartesian({ x: [0, 600, "px"], y: [0, 130, "px"], aspect: "equal", static: "고친 뒤 KPI 줄" }), () => kpiRow("calm", 10, 10, 580, 130, false, false).marks),
      budget: figure(cartesian({ x: [0, 1300, "px"], y: [0, 320, "px"], aspect: "equal", static: "전/후 × 원래/흐리게 2×2" }), () => [
        label([300, 315], "원래 화면", { id: "hd-orig", anchor: "n", weight: "bold" }),
        label([950, 315], "흐리게 보기 (blur 5px)", { id: "hd-blur", anchor: "n", weight: "bold" }),
        label([0, 220], "고치기 전 · 색 강조 12 / 12", { id: "rl-loud", anchor: "w", tone: "bad", size: "s" }),
        label([0, 70], "고친 뒤 · 색 강조 1 / 12", { id: "rl-calm", anchor: "w", tone: "good", size: "s" }),
        kpiRow("loud", 30, 10, 560, 320, false, false).marks,
        kpiRow("loud", 680, 10, 560, 320, false, true).marks,
        kpiRow("calm", 30, 170, 560, 320, false, false).marks,
        kpiRow("calm", 680, 170, 560, 320, false, true).marks,
      ]),
      dash: figure(cartesian({ x: [0, 600, "px"], y: [0, 470, "px"], aspect: "equal", static: "주간 운영 대시보드, 간격(px) 표시" }), (m, t, { params }) =>
        dashboard(params.mode === "calm" ? "calm" : "loud", true, false)),
      tree: figure(graph({ layout: "layered", direction: "right", static: "이번 네 개념에서 다음 개념으로" }), () => [
        ...[["prox", "근접성"], ["sig", "위계 신호"], ["space", "간격 체계"], ["budget", "대비 예산"]].map(([id, t]) => node(id, `${t}\n이번 수업`, { tone: "good", group: "now", shape: "box" })),
        ...[["grid", "레이아웃 그리드·정렬\n열·여백으로 화면 나누기"], ["type", "타입 스케일\n글자 크기 단계 정하기"], ["wcag", "색 대비 비율 (WCAG)\n읽히는 최소 대비"], ["token", "디자인 토큰\n간격·색을 이름으로 관리"], ["pre", "차트의 전주의 속성\n차트에서 한 계열만 띄우기"]].map(([id, t]) => node(id, t, { group: "next", shape: "box" })),
        ...[["prox", "grid"], ["sig", "type"], ["sig", "wcag"], ["space", "grid"], ["space", "token"], ["budget", "pre"]].map(([f, t]) => edge(f, t, { directed: true })),
      ]),
      overview: figure(cartesian({ x: [0, 600, "px"], y: [0, 470, "px"], aspect: "equal", static: "고친 대시보드 위 ①–④" }), () => dashboard("calm", false, true)),
    },
    scenes: [
      { type: "hook", title: "세련된 화면은 '차이'를 아껴 쓴다", say: "가장 먼저 봐야 할 숫자가 정말 가장 먼저 보이는가?", figure: "hook", focus: ["eye"] },
      { type: "define", term: "근접성", definition: "가까이 놓인 것은 한 묶음으로 보인다.", figure: "term-proximity", focus: [] },
      { type: "define", term: "위계 신호", definition: "중요도 순서를 알리는 시각 차이: 크기, 굵기, 색.", figure: "term-signal", focus: [] },
      { type: "define", term: "간격 체계", definition: "간격을 4의 배수 척도에서만 고른다.", figure: "term-scale", focus: [] },
      { type: "define", term: "대비 예산", definition: "강한 강조를 쓸 곳의 수를 미리 정해 둔다.", figure: "term-budget", focus: ["b8"] },
      {
        type: "explore", title: "라벨이 어느 숫자의 것인지는 간격이 정한다", say: "바깥 간격은 24px로 두고 안쪽 간격만 바꿔 본다.", figure: "prox", focus: ["in1", "out1"],
        knobs: { inner: ["4", "8", "12", "16", "24", "32"] },
        goal: { say: "라벨과 값이 한 쌍으로 분명히 묶이게 안쪽 간격을 줄여 보세요. (바깥 ÷ 안쪽 ≥ 2)", done: (m) => m.prox.ratio >= 2 },
      },
      { type: "explain", title: "크기·굵기·색은 주변과의 차이로 읽힌다", say: "같은 여섯 단어에서 '이탈률'을 찾아 보자.", figure: "four", focus: ["p0-2", "p1-2", "p2-2", "p3-2"] },
      { type: "explain", title: "간격은 척도에서 고르고, 안쪽은 작게 바깥은 크게 둔다", say: "라벨→값 4 < 카드 여백 16 < 카드 사이 24 < 섹션 사이 48.", figure: "scale", focus: ["g4", "g16", "g24", "g48"] },
      {
        type: "predict", title: "이탈률을 가장 먼저 보이게 하려면?", ask: "'이탈률 +2.1%p'가 가장 먼저 눈에 들어오게 하려면?", figure: "kpi-loud", focus: [],
        input: { kind: "choice", options: [
          { text: "이탈률 카드를 더 크고 굵고 빨갛게 만든다", feedback: "주변이 이미 제각각이면 차이는 조금만 는다." },
          { text: "나머지 11개 요소의 색과 굵기를 뺀다", correct: true },
          { text: "이탈률 카드에 경고 아이콘과 두꺼운 테두리를 더한다", feedback: "장식을 더하면 주변이 더 제각각이 된다." },
        ] },
        reveal: { say: "나머지를 덜면 빨강이 화면에 하나뿐이 된다.", figure: "kpi-calm" },
      },
      { type: "explain", title: "강조를 덜어 낸 쪽만 흐리게 봐도 이탈률이 남는다", say: "흐린 화면에서 고친 뒤에는 빨간 점 하나만 남는다.", figure: "budget", focus: ["calm-blob-del2"] },
      { type: "compare", title: "같은 데이터, 같은 대시보드: 네 원리를 모두 적용하면", say: "파란 표시는 간격(px)이다.", figure: "dash", focus: [], a: { mode: "loud" }, b: { mode: "calm" }, labels: ["고치기 전", "고친 뒤"] },
      { type: "explain", title: "다음에 배울 것", say: "초록은 이번 수업에서 다룬 개념이다.", figure: "tree", focus: ["prox", "sig", "space", "budget"] },
    ],
  };
};

const src = "archive/v1:site/gallery/uiux/visual-hierarchy-spacing.html";
/** @type {import("../fragment").AuditRow[]} */
export const audit = [
  {
    fig: "visual-hierarchy-spacing#hook", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "X", text: "장식용 눈 그림(art: eye)", essential: false, why: "v1 hook → v2 hook. 장식이며 결론이 기대지 않는다.", status: "kept", by: "Api.icon(name, at)" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#term-proximity", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "G", text: "점 셋씩 두 묶음, 묶음 안 간격(16) < 묶음 사이 간격(48)", essential: true, why: "v1 terms 카드 visual → v2 define. 근접성 정의가 간격 차이로 묶음이 생김을 보여야 한다.", status: "kept", by: "cartesian aspect: \"equal\" + circle(center, radius in x-axis data units)" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#term-signal", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "E", text: "같은 글자 Aa를 크기·굵기·색·흐림으로 달리 표시", essential: true, why: "v1 terms visual → v2 define. 위계 신호 세 종류를 하나씩 보여야 한다.", status: "approx", by: "MarkOpts size, weight, tone", diff: "24px/15px 같은 크기 비율은 s·m·l 단계로만 정해지고 비율이 runtime에 맡겨진다." },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#term-scale", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "Q", text: "막대 높이 = 4·8·16·24·48 × 0.75, 같은 축척", essential: true, why: "v1 terms visual → v2 define. 척도 값의 크기 차이가 눈에 보여야 한다.", status: "kept", by: "cartesian aspect: \"equal\" + rect(from, to) in data units" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#term-budget", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "E", text: "12개 점 중 1개만 빨강", essential: true, why: "v1 terms visual → v2 define. 대비 예산 = 강조 한 곳.", status: "kept", by: "Tone bad vs muted (\"good, warn, bad are semantic\")" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#prox", src, corpus: "lesson", domain: "UI/UX", verdict: "G", custom: [], candidates: ["text-box-metrics"],
    props: [
      { id: "P1", cat: "I", text: "안쪽 간격 손잡이 4·8·12·16·24·32 px, 바깥 24 고정", essential: true, why: "v1 mount(LTT.sweep steps) → v2 explore. 장면 결론이 안쪽 간격을 바꿔 본 결과에 기댄다.", status: "kept", by: "Explore.knobs string[] (choices) + model param inner" },
      { id: "P2", cat: "G", text: "라벨·값 줄 상자 사이 실제 간격이 px 그대로 변해 쌍이 묶이거나 잘못 묶임", essential: true, why: "결론 '안쪽 < 바깥이어야 묶인다'는 보이는 거리 그 자체에 기댄다.", status: "ambiguous", by: "label(at, anchor nw) + aspect equal", diff: "label의 글자 높이가 data 단위로 정해지지 않아(size s·m·l) 줄 상자 사이 실제 여백이 지정 px와 같다는 보장이 없다." },
      { id: "P3", cat: "X", text: "안·밖 측정선과 값, 비율 ×r, 4단계 판정 문구", essential: true, why: "비율 2 기준과 판정이 결론이다.", status: "kept", by: "dim(from, to, text) + label Text, model outputs" },
      { id: "P4", cat: "I", text: "목표: 바깥 ÷ 안쪽 ≥ 2", essential: true, why: "장면 goal.", status: "kept", by: "Explore.goal.done(m)" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#four", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: ["text-size-px"],
    props: [
      { id: "P1", cat: "E", text: "①②③ 칸에서 '이탈률'만 크기/굵기/색 하나가 다름", essential: true, why: "v1 figure → v2 explain. '신호 하나만 달라도 바로 보인다'.", status: "kept", by: "MarkOpts size, weight, tone" },
      { id: "P2", cat: "E", text: "④ 칸은 여섯 단어가 크기 13–18·굵기·색이 제각각, '이탈률'은 ③과 같은 빨강+굵게", essential: true, why: "결론 '주변이 제각각이면 목표가 묻힌다'.", status: "approx", by: "size s·m·l, weight, Tone series1–6 + bad", diff: "6단계 크기(13–18px)가 3단계로 줄지만 주변이 제각각이고 목표가 빨강+굵게인 관계는 남는다." },
      { id: "P3", cat: "S", text: "같은 여섯 단어, 같은 줄 순서의 네 칸 나란히", essential: true, why: "탐색 비교의 공정성.", status: "kept", by: "cells({cols, rows}) Points are [col, row]" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#scale", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "Q", text: "척도 막대 길이 = v × 3 (4..48), 쓰는 4값만 색, 나머지 '안 씀'", essential: true, why: "v1 figure → v2 explain. 척도에서 고른다는 결론.", status: "kept", by: "aspect equal + rect data units; tone series/muted" },
      { id: "P2", cat: "Q", text: "카드 두 장 실제 px 1.5배 해부도: 4 < 16 < 24 < 48 간격 막대", essential: true, why: "겹이 바깥일수록 큰 간격이라는 순서가 결론.", status: "kept", by: "aspect equal + rect(from,to) data units" },
      { id: "P3", cat: "X", text: "'실제 px의 1.5배로 확대' 축척 표시", essential: true, why: "그림 원칙: 축척 변경을 표시.", status: "kept", by: "label" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#kpi-predict", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "E", text: "질문 그림: KPI 12개 요소 모두 색 강조", essential: true, why: "v1 predict visual/answerVisual → v2 predict(reveal.figure). 12/12 강조 상태가 질문의 전제.", status: "kept", by: "Tone series1–6 'mutually distinguishable' + weight bold" },
      { id: "P2", cat: "E", text: "답 그림: 이탈률 변화율 하나만 빨강, 나머지 회색", essential: true, why: "정답 b의 결과.", status: "kept", by: "Predict.reveal.figure ('show after') + Tone bad/muted" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#budget", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: ["blur-filter"],
    props: [
      { id: "P1", cat: "S", text: "전/후 × 원래/흐리게 2×2 배치", essential: true, why: "v1 figure → v2 explain. 네 칸 비교가 결론.", status: "kept", by: "cartesian data-unit placement of four kpiRow groups" },
      { id: "P2", cat: "E", text: "흐리게 보기(blur 5px)에서 고치기 전은 색 덩어리가 고르게 퍼지고, 고친 뒤는 빨간 점 하나만 남음", essential: true, why: "장면 제목의 결론.", status: "approx", by: "rect fill solid + tone/opacity 덩어리", diff: "실제 가우시안 흐림 대신 글자 자리의 색 덩어리로 대체해 '흐려도 남는 것'을 계산하지 않고 저자가 정한다." },
      { id: "P3", cat: "X", text: "색 강조 12/12, 1/12 표시", essential: true, why: "수치 결론.", status: "kept", by: "label" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#dash", src, corpus: "lesson", domain: "UI/UX", verdict: "G", custom: [], candidates: ["text-box-metrics"],
    props: [
      { id: "P1", cat: "S", text: "고치기 전/고친 뒤 대시보드 브라우저 틀 나란히", essential: true, why: "v1 figure(LTT.mock.browser ×2) → v2 compare.", status: "kept", by: "Compare a/b 'Same figure under params a and b, side by side' + mock(\"browser\")" },
      { id: "P2", cat: "G", text: "간격 실제 px: 전 16 일괄, 후 4·24·48 (섹션 > 카드 사이 > 카드 안)", essential: true, why: "caption 결론이 간격 순서에 기댄다.", status: "ambiguous", by: "rect/dim data units + aspect equal", diff: "글자 줄 높이가 data 단위로 보장되지 않아 라벨→값 4px 같은 글자 사이 간격이 실제로 그 값이라는 보장이 없다." },
      { id: "P3", cat: "X", text: "간격 측정 표시(16, 4·24·48)", essential: true, why: "'파란 표시는 간격'.", status: "kept", by: "dim(from,to,text)" },
      { id: "P4", cat: "Q", text: "일별 매출 막대 7개 높이 ∝ 값, 합 4.20 = KPI 매출", essential: true, why: "같은 데이터임을 보인다.", status: "kept", by: "rect data units" },
      { id: "P5", cat: "E", text: "채운 버튼: 전 2개, 후 1개; 막대 색: 전 제각각, 후 회색", essential: true, why: "주 버튼 하나·대비 예산.", status: "kept", by: "rect fill solid/none + Tone" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#tree", src, corpus: "lesson", domain: "UI/UX", verdict: "V", custom: [], candidates: [],
    props: [
      { id: "P1", cat: "G", text: "이번 수업 개념 4개 → 다음 개념 5개 방향 간선", essential: true, why: "v1 figure(LTT.diagram) → v2 explain. 개념 연결이 내용.", status: "kept", by: "graph layered direction right + node/edge directed" },
      { id: "P2", cat: "E", text: "이번 수업 개념은 초록", essential: true, why: "caption '초록은 이번 수업'.", status: "kept", by: "Tone good" },
    ],
  },
  {
    fig: "visual-hierarchy-spacing#overview", src, corpus: "lesson", domain: "UI/UX", verdict: "G", custom: [], candidates: ["text-box-metrics", "anchor-to-mark"],
    props: [
      { id: "P1", cat: "X", text: "고친 대시보드 위 ①–④ 표시가 각 원리의 자리에 붙음", essential: true, why: "v1 overview figure → v2 lesson.summary.figures. caption이 네 자리를 가리킨다.", status: "ambiguous", by: "label(at) data coordinates", diff: "②는 값 글자 옆, ④는 변화율 글자 옆에 붙어야 하는데 글자 폭이 data 단위로 보장되지 않아 저자가 좌표로 짐작한다." },
      { id: "P2", cat: "G", text: "고친 뒤 간격 4·24·48과 빨강 한 곳", essential: true, why: "caption 결론.", status: "kept", by: "rect/label data units + Tone bad" },
    ],
  },
];
