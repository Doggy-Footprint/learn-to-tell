// @ts-check
/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { model, figure, cartesian, circle, line, dot, label, rect } = api;
  /** @param {number} x @param {number} y @returns {import("ltt").P} */
  const pt = (x, y) => [x, 470 - y];
  /** @param {number} x */
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  /** @param {number} x */
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** @typedef {{ k: number; d: number; l: Node | null; r: Node | null; x: number; y: number }} Node */
  const KEYS = [50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45, 55, 65, 75, 90];
  const tree = model({ n: 15 }, () => {
    /** @type {Node | null} */
    let root = null;
    /** @param {Node | null} n @param {number} k @param {number} d @returns {Node} */
    const ins = (n, k, d) => { if (!n) return { k, d, l: null, r: null, x: 0, y: 0 }; if (k < n.k) n.l = ins(n.l, k, d + 1); else n.r = ins(n.r, k, d + 1); return n; };
    KEYS.forEach((k) => (root = ins(root, k, 0)));
    /** @type {Node[]} */
    const nodes = [];
    /** @param {Node | null} n @param {number} lo @param {number} hi */
    const place = (n, lo, hi) => { if (!n) return; n.x = (lo + hi) / 2; n.y = 56 + n.d * 104; nodes.push(n); place(n.l, lo, n.x); place(n.r, n.x, hi); };
    place(root, 40, 700);
    /** @param {number} k */
    const search = (k) => { /** @type {Node[]} */ const path = []; let n = root; while (n) { path.push(n); if (k === n.k) return { path, found: true }; n = k < n.k ? n.l : n.r; } return { path, found: false }; };
    return { nodes, searches: [45, 62].map((q) => ({ q, ...search(q) })) };
  }, "BST 삽입 순서 고정; 균형 트리 비교 ≤ ⌈log₂(n+1)⌉ (Cormen 외 12장)");
  const figures = {
    bst: figure(
      cartesian({ x: [0, 980, ""], y: [0, 470, ""], aspect: "equal", loop: { ms: 10000, span: [0, 1] } }),
      (m, u) => {
        /** @type {{ nodes: Node[]; searches: { q: number; path: Node[]; found: boolean }[] }} */
        const T = m.tree;
        const qi = u < 0.5 ? 0 : 1, lu = (u - qi * 0.5) / 0.5, { q, path, found } = T.searches[qi];
        const last = path[path.length - 1];
        const pts = path.map((n) => pt(n.x, n.y));
        if (!found) pts.push(pt(last.x + (q < last.k ? -22 : 22), last.y + 60));
        const segs = pts.length - 1, hold = lu > 0.72, fade = clamp((lu - 0.93) / 0.07);
        const pos = ease(clamp(lu / 0.72)) * segs, si = Math.min(segs - 1, Math.floor(pos)), f = pos - si;
        const [ax, ay] = pts[si], [bx, by] = pts[si + 1];
        const head = pt(0, 0); head[0] = ax + (bx - ax) * f; head[1] = ay + (by - ay) * f;
        const visited = Math.min(path.length, Math.floor(pos + 0.5) + 1);
        const at = path[visited - 1];
        const sym = q === at.k ? "=" : q < at.k ? "<" : ">", dir = q === at.k ? "찾음" : q < at.k ? "왼쪽" : "오른쪽";
        return [
          T.nodes.map((n) => [n.l, n.r].map((c) => c && line([pt(n.x, n.y), pt(c.x, c.y)], { id: `e-${n.k}-${c.k}`, tone: "muted", weight: "thin" }))),
          line([...pts.slice(0, si + 1), head], { id: "trail", tone: "focus", weight: "bold", opacity: 1 - fade }),
          T.nodes.map((n) => {
            const k = path.indexOf(n), on = k >= 0 && k < visited && fade < 1, hit = on && found && n === last && hold;
            return [circle(pt(n.x, n.y), 21, { id: `n-${n.k}`, tone: on ? "focus" : "muted", fill: hit ? "solid" : on ? "soft" : "none" }), label(pt(n.x, n.y), String(n.k), { id: `k-${n.k}` })];
          }),
          !hold && dot(head, { id: "probe", tone: "focus", opacity: 1 - fade }),
          label(pt(at.x + (q < at.k ? -28 : 28), at.y - 30), `${q} ${sym} ${at.k} → ${dir}`, { id: "cmp", tone: "focus", anchor: q < at.k ? "e" : "w", opacity: 1 - fade }),
          !found && hold && label(pt(pts[pts.length - 1][0], 470 - pts[pts.length - 1][1] + 24), "빈자리", { id: "null", tone: "muted", opacity: 1 - fade }),
          label(pt(760, 66), "찾는 값", { id: "q-h", anchor: "w", tone: "muted" }),
          label(pt(760, 112), String(q), { id: "q", anchor: "w", size: "l", weight: "bold" }),
          label(pt(760, 170), "비교 횟수", { id: "c-h", anchor: "w", tone: "muted" }),
          label(pt(760, 214), String(visited), { id: "count", anchor: "w", size: "l", weight: "bold" }),
          [0, 1, 2, 3].map((i) => rect(pt(760 + i * 34, 240), pt(788 + i * 34, 232), { id: `tick-${i}`, tone: i < visited ? "focus" : "muted", fill: "solid" })),
          label(pt(760, 286), hold ? (found ? `${q}을 찾았다` : `${q}은 트리에 없다`) : "내려가는 중", { id: "result", anchor: "w", weight: "bold" }),
          label(pt(760, 374), "키 15개, 높이 4층 · ⌈log₂(15+1)⌉ = 4", { id: "bound", anchor: "w", tone: "muted", size: "s" }),
        ];
      },
    ),
  };
  return { models: { tree }, figures, scenes: [{ type: "explain", title: "비교 한 번마다 남은 후보가 절반으로 준다", say: "작으면 왼쪽, 크면 오른쪽.", figure: "bst", focus: ["trail", "probe"] }] };
};
/** @type {import("../fragment").AuditRow[]} */
export const audit = [{
  fig: "s42", src: "s42-bst-search-path.html", corpus: "shot", domain: "알고리즘 · 이진 탐색 트리 탐색 경로",
  props: [
    { id: "b1", cat: "T", text: "0–4s 점이 루트에서 내려가며 지나온 길에 선 궤적을 남긴다", essential: true, why: "beat", status: "kept", by: "Loop{ms:10000,span:[0,1]}; line(지나온 점 + 현재 머리점) + dot" },
    { id: "b2", cat: "Q", text: "4–5s 도착한 칸이 진해지고 비교 횟수 막대가 다 찬다", essential: true, why: "beat", status: "kept", by: "circle fill 'solid', 칸 4개 rect tone" },
    { id: "b3", cat: "T", text: "5–9s 궤적이 지워지고 다른 값(62)으로 새 궤적이 그려진다", essential: true, why: "beat", status: "kept", by: "opacity 페이드 + t ≥ 0.5에서 두 번째 탐색" },
    { id: "b4", cat: "X", text: "9–10s 마지막 칸 아래 빈자리에서 멈추고 '없다'가 뜬다", essential: true, why: "beat", status: "kept", by: "label '빈자리' + 결과 label" },
    { id: "p1", cat: "G", text: "움직이는 점 하나가 남기는 궤적이 곧 실행 경로", essential: true, why: "principle", status: "kept", by: "궤적 line의 꼭짓점이 search가 방문한 노드 좌표 그대로" },
  ],
  verdict: "V", custom: [], candidates: [],
}];
