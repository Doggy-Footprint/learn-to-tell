// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, rect, label, line, arrow } = api;
  /** @type {(x: number, y: number) => import("ltt").P} */
  const pt = (x, y) => [x, y];
  const SRC = "x = a + b * 2";
  /** CPython 3.12 tokenize·ast.dump·dis output */
  const TOK = /** @type {[string, string, number][]} */ ([["NAME", "x", 0], ["OP", "=", 2], ["NAME", "a", 4], ["OP", "+", 6], ["NAME", "b", 8], ["OP", "*", 10], ["NUMBER", "2", 12]]);
  const AST = [
    { l: "Assign", x: 110, y: 0, p: -1, src: [0, 13] }, { l: "Name x", x: 55, y: 1, p: 0, src: [0, 1] }, { l: "BinOp +", x: 160, y: 1, p: 0, src: [4, 13] },
    { l: "Name a", x: 100, y: 2, p: 2, src: [4, 5] }, { l: "BinOp *", x: 200, y: 2, p: 2, src: [8, 13] },
    { l: "Name b", x: 150, y: 3, p: 4, src: [8, 9] }, { l: "Const 2", x: 225, y: 3, p: 4, src: [12, 13] }];
  const OFF = [0, 2, 4, 6, 8, 12, 16, 18];
  const BC = /** @type {[string, string, number | null][]} */ ([["RESUME", "0", null], ["LOAD_NAME", "a", 3], ["LOAD_NAME", "b", 5], ["LOAD_CONST", "2", 6], ["BINARY_OP", "*", 4], ["BINARY_OP", "+", 2], ["STORE_NAME", "x", 1], ["RETURN_CONST", "None", null]]);
  const PH = [[0, 0.12], [0.14, 0.38], [0.4, 0.62], [0.64, 0.88]];
  const PW = 260, GAP = 26, CW = 16.5;
  /** @param {number} i */
  const px = (i) => i * (PW + GAP);
  /** @param {number} v */
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const heads = [["소스", "문자열"], ["토큰", "tokenize"], ["AST", "ast.parse"], ["바이트코드", "dis"]];
  const units = ["글자", "토큰", "노드", "명령"], totals = [SRC.length, TOK.length, AST.length, BC.length];
  return {
    figures: {
      s30: figure(
        cartesian({ x: [0, 1120, "px"], y: [0, 470, "px"], loop: { ms: 10000, span: [0, 1] } }),
        (m, u) => {
          const shown = PH.map(([a, b], i) => Math.floor(clamp((u - a) / (b - a)) * totals[i] + 1e-9));
          /** @type {number[] | null} */
          let span = null;
          PH.forEach(([a, b], i) => {
            const f = clamp((u - a) / (b - a)), k = Math.min(totals[i] - 1, shown[i] - 1);
            if (f > 0 && f < 1 && i > 0 && k >= 0) {
              if (i === 1) span = [TOK[k][2], TOK[k][2] + TOK[k][1].length];
              if (i === 2) span = AST[k].src;
              if (i === 3) { const ai = BC[k][2]; span = ai == null ? null : AST[ai].src; }
            }
          });
          const Y = (/** @type {number} */ y) => 470 - y;
          return [
            heads.map((h, i) => [
              rect(pt(px(i), Y(24)), pt(px(i) + PW, Y(404)), { id: `pane-${i}`, tone: "muted", fill: "soft" }),
              label(pt(px(i) + 16, Y(50)), `${i + 1} ${h[0]}`, { id: `head-${i}`, anchor: "w" }),
              label(pt(px(i) + PW - 16, Y(50)), h[1], { id: `tool-${i}`, anchor: "e", size: "s", tone: "muted" }),
              i < 3 && arrow(pt(px(i) + PW + 5, Y(214)), pt(px(i + 1) - 5, Y(214)), { id: `next-${i}`, tone: "muted" }),
              label(pt(px(i) + PW / 2, Y(448)), `${shown[i]} / ${totals[i]} ${units[i]}`, { id: `count-${i}`, size: "l", tone: shown[i] === totals[i] ? undefined : "muted" }),
            ]),
            span && rect(pt(16 + span[0] * CW, Y(124)), pt(18 + span[1] * CW, Y(94)), { id: "src-hi", tone: "focus", fill: "soft" }),
            [...SRC].map((c, k) => k < shown[0] && label(pt(20 + k * CW, Y(112)), c, { id: `ch-${k}`, anchor: "w", size: "l" })),
            label(pt(20, Y(164)), span ? "← 지금 만드는 것의 출처" : u > PH[0][1] ? "한 줄, 13글자" : "", { id: "src-note", anchor: "w", size: "s" }),
            TOK.map((t, k) => {
              const y = 78 + k * 40, on = k < shown[1];
              return [
                rect(pt(px(1) + 14, Y(y + 32)), pt(px(1) + PW - 14, Y(y)), { id: `tok-${k}`, opacity: on ? 1 : 0.08, from: on ? "src-hi" : undefined }),
                label(pt(px(1) + 26, Y(y + 16)), t[0], { id: `tok-kind-${k}`, anchor: "w", tone: "muted", opacity: on ? 1 : 0.08 }),
                label(pt(px(1) + PW - 28, Y(y + 16)), `'${t[1]}'`, { id: `tok-val-${k}`, anchor: "e", tone: "focus", opacity: on ? 1 : 0.08 }),
              ];
            }),
            AST.map((n, k) => {
              const on = k < shown[2], y = Y(90 + n.y * 78), par = AST[n.p];
              return [
                par && line([pt(px(2) + par.x, Y(90 + par.y * 78) - 14), pt(px(2) + n.x, y + 14)], { id: `ast-edge-${k}`, opacity: on ? 1 : 0.08 }),
                rect(pt(px(2) + n.x - (n.l.length * 8 + 14) / 2, y - 14), pt(px(2) + n.x + (n.l.length * 8 + 14) / 2, y + 14), { id: `ast-${k}`, tone: "focus", opacity: on ? 1 : 0.08 }),
                label(pt(px(2) + n.x, y), n.l, { id: `ast-l-${k}`, opacity: on ? 1 : 0.08 }),
              ];
            }),
            BC.map((b, k) => {
              const on = k < shown[3], y = Y(86 + k * 36);
              return [
                label(pt(px(3) + 16, y), String(OFF[k]).padStart(2, "0"), { id: `bc-off-${k}`, anchor: "w", tone: "muted", opacity: on ? 1 : 0.08 }),
                label(pt(px(3) + 44, y), b[0], { id: `bc-op-${k}`, anchor: "w", opacity: on ? 1 : 0.08 }),
                label(pt(px(3) + PW - 16, y), b[1], { id: `bc-arg-${k}`, anchor: "e", tone: "focus", opacity: on ? 1 : 0.08 }),
              ];
            }),
          ];
        },
      ),
    },
    scenes: [{ type: "hook", title: "13글자 한 줄이 8개 명령이 되기까지", say: "바이트코드는 곱셈을 먼저 한다. 트리에서 더 깊이 있기 때문이다.", figure: "s30", focus: ["pane-3", "src-hi"] }],
  };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s30", src: "s30-compile-pipeline.html", corpus: "shot", domain: "컴파일러 · 소스→토큰→AST→바이트코드",
  props: [
    { id: "b1", cat: "T", text: "0–4s 소스 글자가 차례로 강조되며 토큰 칸에 항목이 하나씩 쌓인다", essential: true, why: "beat 1", status: "kept", by: "Loop ms 10000 span [0,1]; draw sampled over t; per-item opacity from phase fraction; src-hi rect at token char span" },
    { id: "b2", cat: "T", text: "4–6s AST 칸에 노드가 위에서 아래로 그려지고 출처 글자가 소스 칸에서 강조된다", essential: true, why: "beat 2", status: "kept", by: "same t-driven reveal; AST nodes ordered top-down; src-hi from AST[k].src" },
    { id: "b3", cat: "Q", text: "6–9s 바이트코드 칸에 명령이 한 줄씩 쌓이고 칸 아래 개수(n / 8 명령)가 오른다", essential: true, why: "beat 3", status: "kept", by: "label text recomputed per sample of t" },
    { id: "b4", cat: "T", text: "9–10s 네 칸이 모두 채워진 채 멈춘다", essential: true, why: "beat 4", status: "kept", by: "phase fractions clamp to 1 for u > 0.88 within Loop" },
    { id: "x1", cat: "X", text: "CPython 3.12 실제 tokenize·AST·dis 출력(오프셋 포함)", essential: true, why: "사실성", status: "kept", by: "label text marks with literal values" },
    { id: "p1", cat: "S", text: "같은 입력을 단계별 작은 칸 넷에 나란히 둔다", essential: true, why: "principle", status: "approx", diff: "multiples는 같은 그림을 param으로만 복제하므로 내용이 다른 네 칸을 한 frame에 rect로 직접 배치했고, 칸 구도는 runtime이 아닌 좌표로만 정해진다" },
    { id: "p2", cat: "E", text: "항목을 쌓으며 출처 글자를 강조해 칸 사이 대응을 잇는다", essential: true, why: "principle", status: "kept", by: "src-hi rect tone focus recomputed from current item's source span; MarkOpts from names origin mark" },
  ],
  verdict: "V", custom: [], candidates: ["panel-grid", "text-span-highlight"],
}];
