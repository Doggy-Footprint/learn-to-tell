// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, path, arrow, label, line, rect } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const W = [{ w: "어제", x: 110 }, { w: "철수가", x: 270 }, { w: "빨간", x: 440 }, { w: "사과를", x: 600 }, { w: "먹었다", x: 800 }];
  const ARCS = [{ h: 4, d: 0, rel: "때 (obl)" }, { h: 4, d: 1, rel: "주어 (nsubj)" }, { h: 3, d: 2, rel: "꾸밈 (amod)" }, { h: 4, d: 3, rel: "목적어 (obj)" }];
  const isHead = [false, false, false, true, true];
  const BASE = 110;
  const figures = {
    parse: figure(
      cartesian({ x: [0, 920, ""], y: [0, 440, ""], aspect: "equal", loop: { ms: 9000, span: [0, 1] } }),
      (m, u) => {
        const sp = ease(clamp(u / 0.16)), mg = ease(clamp((u - 0.62) / 0.2)), out = ease(clamp((u - 0.94) / 0.06));
        const split = sp * (1 - out);
        const rk = ease(clamp((u - 0.58) / 0.06)) * (1 - out);
        const roleOp = clamp((u - 0.5) / 0.08) * (1 - out);
        const cap = u < 0.18 ? "한 줄로 붙은 문장을 어절로 쪼갠다" : u < 0.6 ? "화살표: 핵심어 → 의존어, 위 글자는 관계" : u < 0.94 ? "의존어는 핵심어와 합쳐져 한 덩어리(구)가 된다" : "";
        return [
          rect(pt(380, BASE - 24), pt(670, BASE + 40), { id: "np-box", fill: "soft", tone: "focus", opacity: clamp(mg * 1.6 - 0.2) * (1 - out) }),
          rect(pt(40, BASE - 36), pt(880, BASE + 52), { id: "s-box", fill: "none", tone: "muted", opacity: clamp(mg * 1.6 - 0.8) * (1 - out) }),
          ARCS.map((a, i) => {
            const x1 = W[a.h].x, x2 = W[a.d].x, hgt = 40 + Math.abs(x1 - x2) * 0.32, y0 = BASE + 34;
            const k = ease(clamp((u - 0.2 - i * 0.1) / 0.1)) * (1 - out);
            return [
              path([["M", x1, y0], ["C", x1, y0 + hgt, x2, y0 + hgt, x2, y0 + 6]], { id: `arc-${a.d}`, reveal: k }),
              k > 0.95 && arrow(pt(x2, y0 + 16), pt(x2, y0 + 4), { id: `tip-${a.d}` }),
              label(pt((x1 + x2) / 2, y0 + hgt * 0.75 + 8), a.rel, { id: `rel-${a.d}`, anchor: "s", opacity: clamp((k - 0.6) / 0.4) }),
            ];
          }),
          label(pt(860, 344), "뿌리 (root)", { id: "root", tone: "focus", opacity: rk }),
          line([pt(800, 360), pt(800, BASE + 40)], { id: "root-line", tone: "focus", dash: true, opacity: rk }),
          W.map((o, i) => [
            label(pt(460 + (o.x - 460) * (0.55 + 0.45 * split), BASE), o.w, { id: `w-${i}`, size: "l", weight: "bold", tone: isHead[i] && mg > 0.3 ? "focus" : undefined }),
            label(pt(o.x, BASE - 34), i === 3 ? "핵심어 ← 빨간" : i === 4 ? "핵심어 (문장 전체)" : "의존어", { id: `role-${i}`, tone: "muted", opacity: roleOp }),
          ]),
          label(pt(460, 20), cap, { id: "cap" }),
        ];
      },
    ),
  };
  return { figures, scenes: [{ type: "define", term: "핵심어", definition: "문장은 핵심어에 기대는 말들의 나무다. 화살표는 핵심어에서 의존어로 간다.", figure: "parse", focus: ["root", "rel-1"] }] };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s37", src: "s37-dependency-parse.html", corpus: "shot", domain: "언어학 · 의존 구문 분석의 핵심어·의존어·관계",
  props: [
    { id: "b1", cat: "T", text: "0–1.5s 한 줄로 붙은 문장이 어절 단위로 갈라진다", essential: true, why: "beat", status: "kept", by: "Loop{ms:9000,span:[0,1]}; 어절 label 위치를 draw가 t로 계산" },
    { id: "b2", cat: "T", text: "1.5–5s 핵심어→의존어로 호가 하나씩 그려지고 그 위에 관계 이름이 얹힌다", essential: true, why: "beat", status: "kept", by: "path C + MarkOpts.reveal, 끝 arrow, 관계 label opacity" },
    { id: "b3", cat: "X", text: "5–5.6s 뿌리 표시와 세로선이 나타나고 각 어절에 역할이 붙는다", essential: true, why: "beat", status: "kept", by: "label/line opacity를 t로 계산" },
    { id: "b4", cat: "G", text: "5.6–8.5s 의존어가 핵심어 쪽으로 합쳐지며 묶음 상자가 둘러싼다", essential: true, why: "beat", status: "approx", diff: "원본도 쪼갤 때 쓴 같은 수렴 식이라 합쳐짐은 어절 간격이 좁아지는 것으로만 보이고, 상자는 opacity로 나타난다(원본과 같음); 화살표 머리는 호 끝에 붙은 별도 arrow라 곡선 접선과 정확히 맞지 않는다" },
    { id: "p1", cat: "X", text: "관계 이름은 표가 아니라 그 관계를 잇는 선 위에 얹는다", essential: true, why: "principle", status: "kept", by: "label(at) 데이터 좌표를 호 꼭대기로 계산; aspect 'equal'" },
    { id: "p2", cat: "S", text: "쪼개짐→연결→합쳐짐을 한 대상 위에서 차례로", essential: true, why: "principle", status: "kept", by: "단일 figure + Loop 한 주기" },
  ],
  verdict: "V", custom: [], candidates: ["path-arrowhead"],
}];
