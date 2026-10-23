// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, split, rect, label, path } = api;
  /** @type {{ id: string; n: string; s: string; tree: import("ltt").P; box: import("ltt").P }[]} */
  const CO = [
    { id: "P", n: "한빛홀딩스", s: "지배회사", tree: [195, 70], box: [195, 88] },
    { id: "A", n: "한빛화학", s: "P가 60%", tree: [100, 200], box: [110, 200] },
    { id: "B", n: "누리물류", s: "P가 30%", tree: [290, 200], box: [195, 388] },
    { id: "C", n: "한빛소재", s: "A가 70%", tree: [100, 330], box: [280, 200] },
  ];
  const EDGES = [{ f: "P", t: "A", p: 60 }, { f: "P", t: "B", p: 30 }, { f: "A", t: "C", p: 70 }];
  const own = model({ pa: 0.6, ac: 0.7, pb: 0.3 }, (p) => ({ ownC: p.pa * p.ac, consolidated: ["P", "A", "C"], equityMethod: ["B"] }), "K-IFRS 1110 의결권 과반 지배 → 연결, 1028 20% 이상 → 지분법; 가상 회사");
  const NW = 68, NH = 28;
  /** @param {string} pre @param {Record<string, import("ltt").P>} pos @param {number} edgeOp */
  const draw = (pre, pos, edgeOp) => [
    EDGES.map((e) => {
      const a = pos[e.f], b = pos[e.t];
      return path([["M", a[0], a[1] - NH], ["L", a[0], (a[1] + b[1]) / 2], ["L", b[0], (a[1] + b[1]) / 2], ["L", b[0], b[1] + NH]], { id: `${pre}-e-${e.f}${e.t}`, weight: e.p > 50 ? "bold" : "thin", opacity: edgeOp, label: `${e.p}%` });
    }),
    CO.map((c) => [
      rect([pos[c.id][0] - NW, pos[c.id][1] - NH], [pos[c.id][0] + NW, pos[c.id][1] + NH], { id: `${pre}-${c.id}`, fill: "none" }),
      label(pos[c.id], `${c.n}\n${c.s}`, { id: `${pre}-${c.id}-t` }),
    ]),
  ];
  // y up in data; original svg y down -> use 450 - y
  /** @param {import("ltt").P} p @returns {import("ltt").P} */
  const flip = (p) => [p[0], 450 - p[1]];
  /** @param {number} u */
  const k = (u) => Math.max(0, Math.min(1, (u - 0.12) / 0.33)) * (1 - Math.max(0, Math.min(1, (u - 0.88) / 0.12)));
  const loop = { ms: 8000, span: /** @type {[number, number]} */ ([0, 1]) };
  return {
    models: { own },
    figures: {
      tree: figure(cartesian({ x: [0, 390, ""], y: [0, 450, ""], aspect: "equal", loop }), () => [
        label([20, 428], "주주명부: 누가 누구를 얼마나", { anchor: "w" }),
        draw("L", Object.fromEntries(CO.map((c) => [c.id, flip(c.tree)])), 1),
      ]),
      scope: figure(cartesian({ x: [0, 390, ""], y: [0, 450, ""], aspect: "equal", loop }), (m, t) => {
        const kk = k(t), sc = Math.max(0, Math.min(1, (kk - 0.6) / 0.4));
        /** @type {Record<string, import("ltt").P>} */
        const pos = Object.fromEntries(CO.map((c) => { const a = flip(c.tree), b = flip(c.box); return [c.id, /** @type {import("ltt").P} */ ([a[0] + (b[0] - a[0]) * kk, a[1] + (b[1] - a[1]) * kk])]; }));
        return [
          label([20, 428], "연결재무제표: 어디까지 한 회사로", { anchor: "w" }),
          sc > 0 && rect([195 - 165 * sc, 256 - 133 * sc], [195 + 165 * sc, 256 + 140 * sc], { id: "scope-box", tone: "focus", fill: "soft", opacity: sc, label: "연결 범위: 100% 합산" }),
          sc > 0 && label([195, 12], "지분법: 이익의 30%만 한 줄로", { id: "equity-note", opacity: sc }),
          draw("R", pos, 1 - kk),
        ];
      }),
      s20: split(["tree", "scope"]),
    },
    scenes: [{
      type: "predict", title: "손자회사 이익 100억 중 지주회사 주주 몫은?", ask: "한빛소재 순이익 100억 원 중 한빛홀딩스 주주 몫은?",
      figure: "s20", focus: ["scope-box", "R-C"],
      input: { kind: "choice", options: [{ text: "70억", feedback: "A가 C를 70% 갖지만 P는 A를 60%만 갖는다." }, { text: "42억", correct: true }, { text: "100억", feedback: "연결은 100% 합산하지만 귀속은 실질 지분만큼이다." }] },
      reveal: { say: (m) => `실질 지분 60% × 70% = ${Math.round(m.own.ownC * 100)}%. 나머지 58억은 비지배지분, 누리물류는 지분법이라 상자 밖.` },
    }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s20", src: "s20-equity-consolidation.html", corpus: "shot", domain: "회계 · 지분율 트리가 연결 범위로 바뀜",
  props: [
    { id: "b1", cat: "S", text: "좌우에 같은 트리가 나란히 놓인다", essential: true, why: "beat 1", status: "ambiguous", by: "split: Both share t…", diff: "split JSDoc은 두 그림의 배치(좌우)를 말하지 않는다" },
    { id: "b2", cat: "T", text: "오른쪽 트리의 선이 흐려지며 같은 노드가 새 자리로 옮겨간다", essential: true, why: "beat 2", status: "approx", diff: "draw가 t마다 같은 mark id를 새 좌표로 다시 그릴 뿐, 노드가 '같은 것이 이동'한다는 보간 의미는 d.ts가 보장하지 않으나 매 프레임 표본이라 보이는 결과는 같다" },
    { id: "b3", cat: "G", text: "노드 셋이 연결 범위 상자 안으로 모이고 누리물류만 아래 상자 밖에 멈춘다", essential: true, why: "beat 3", status: "kept", by: "rect/label at data coordinates; Loop span maps linearly onto ms" },
    { id: "q1", cat: "Q", text: "지분율 60·30·70%, 과반 선은 굵게, 실질 지분 42%", essential: true, why: "predict 정답 근거", status: "kept", by: "model fn; MarkOpts.weight bold/thin; path label" },
    { id: "p1", cat: "S", text: "원본 트리는 옆에 고정해 기준으로 삼는다", essential: true, why: "principle", status: "kept", by: "tree figure draw ignores t (draw is sampled over time but returns constant marks)" },
  ],
  verdict: "G", custom: [], candidates: ["split-arrangement", "node-morph"],
}];
