// @ts-check
/** @typedef {[number, number]} Pt */

const F = 500;
/** Pinhole projection, y up (v1 used y down). @param {number} X @param {number} Y @param {number} Z @returns {Pt} */
const pr = (X, Y, Z) => [(F * X) / Z, (F * Y) / Z];
/** @param {Pt[]} pts @returns {Pt[]} */
function hull(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  /** @param {Pt} o @param {Pt} a @param {Pt} b */
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  /** @type {Pt[]} */ const lo = [];
  /** @type {Pt[]} */ const up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
/** @param {number} xc @param {number} Y @param {number} zc @param {number} r @param {number} [n] @returns {Pt[]} */
const circle3 = (xc, Y, zc, r, n = 120) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI; return pr(xc + r * Math.cos(a), Y, zc + r * Math.sin(a)); });
/** @param {Pt[]} p */
const ratioOf = (p) => { const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys); return { w, h, ratio: h / w }; };

const TBL = -40;
const MUG = { xc: -10, zc: 70, r: 4, y0: TBL, y1: TBL + 10 };
const mTop = circle3(MUG.xc, MUG.y1, MUG.zc, MUG.r), mBot = circle3(MUG.xc, MUG.y0, MUG.zc, MUG.r);
const mSil = hull(mTop.concat(mBot));
/** @param {number} rad @returns {Pt[]} */
const handleArc = (rad) => Array.from({ length: 41 }, (_, i) => { const a = Math.PI / 2 + (i / 40) * Math.PI; return pr(MUG.xc - MUG.r + rad * Math.cos(a) * 0.85, (MUG.y0 + MUG.y1) / 2 + rad * Math.sin(a), MUG.zc); });
const hOuter = handleArc(3.3), hInner = handleArc(2.3), hMid = handleArc(2.8);

/** @param {[number, number, number]} c @param {number} w @param {number} d @param {number} h @param {number} th @param {number} yb */
function boxGeom(c, w, d, h, th, yb) {
  const u = [Math.cos(th), 0, Math.sin(th)], v = [-Math.sin(th), 0, Math.cos(th)];
  /** @type {number[][]} */ const P3 = [];
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => P3.push([c[0] + (a * u[0] * w) / 2 + (b * v[0] * d) / 2, yb, c[2] + (a * u[2] * w) / 2 + (b * v[2] * d) / 2]));
  for (let i = 0; i < 4; i++) P3.push([P3[i][0], yb + h, P3[i][2]]);
  const faces = [
    { idx: [0, 1, 2, 3], n: [0, -1, 0], top: false }, { idx: [4, 5, 6, 7], n: [0, 1, 0], top: true },
    { idx: [0, 1, 5, 4], n: [-v[0], 0, -v[2]], top: false }, { idx: [1, 2, 6, 5], n: u, top: false },
    { idx: [2, 3, 7, 6], n: v, top: false }, { idx: [3, 0, 4, 7], n: [-u[0], 0, -u[2]], top: false },
  ].map((fc) => { const cc = [0, 1, 2].map((k) => fc.idx.reduce((s, i) => s + P3[i][k], 0) / 4); return { ...fc, vis: fc.n[0] * cc[0] + fc.n[1] * cc[1] + fc.n[2] * cc[2] < 0 }; });
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const edges = E.map(([a, b]) => ({ a, b, vis: faces.some((fc) => fc.vis && fc.idx.includes(a) && fc.idx.includes(b)), dir: a % 4 === b % 4 ? "y" : (Math.min(a % 4, b % 4) === 0 && Math.max(a % 4, b % 4) === 1) || (Math.min(a % 4, b % 4) === 2 && Math.max(a % 4, b % 4) === 3) ? "u" : "v" }));
  /** @type {Pt[]} */ const P2 = P3.map((p) => pr(p[0], p[1], p[2]));
  return { P2, faces, edges, u };
}
const BOX = boxGeom([4, 0, 78], 12, 9, 7, (30 * Math.PI) / 180, TBL);

const allPts = mSil.concat(hOuter, BOX.P2);
const pad = 26;
const bx0 = Math.min(...allPts.map((p) => p[0])) - pad, bx1 = Math.max(...allPts.map((p) => p[0])) + pad;
const by0 = Math.min(...allPts.map((p) => p[1])) - pad, by1 = Math.max(...allPts.map((p) => p[1])) + pad;
const U = "그림면 단위 (f=500)";

/** @type {import("../fragment").Fragment} */
export default (api) => {
  const { figure, cartesian, graph, split, multiples, model, path, line, dot, rect, label, dim, sweep, arrow, circle, icon, field, node, edge, legend, cell, cells, axis } = api;
  /** @param {Pt[]} pts @param {boolean} [close] @returns {import("ltt").PathCmd[]} */
  const cmds = (pts, close) => { /** @type {import("ltt").PathCmd[]} */ const c = pts.map((p, i) => /** @type {import("ltt").PathCmd} */ ([i ? "L" : "M", p[0], p[1]])); if (close) c.push(["Z"]); return c; };
  const still = () => [
    ...BOX.faces.filter((f) => f.vis).map((f, i) => path(cmds(f.idx.map((k) => BOX.P2[k]), true), { id: `box-face-${i}`, fill: "soft", tone: "muted" })),
    path(cmds(mSil, true), { id: "mug-body", fill: "soft", tone: "muted" }),
  ];
  /** @type {Pt[][]} */
  const contourParts = [mSil.concat([mSil[0]]), mTop.concat([mTop[0]]), hOuter, hInner, ...BOX.edges.filter((e) => e.vis).map((e) => [BOX.P2[e.a], BOX.P2[e.b]])];
  /** @param {Pt[]} p */
  const plen = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
  const lens = contourParts.map(plen), total = lens.reduce((a, b) => a + b, 0);
  /** @param {Pt[]} p @param {number} d @returns {Pt} */
  const pointAt = (p, d) => { for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d <= s) { const k = s ? d / s : 0; return [p[i - 1][0] + k * (p[i][0] - p[i - 1][0]), p[i - 1][1] + k * (p[i][1] - p[i - 1][1])]; } d -= s; } return p[p.length - 1]; };
  const slFrame = (/** @type {import("ltt").TimeSpec} */ ts) => cartesian({ x: [bx0, bx1, U], y: [by0, by1, U], aspect: "equal", ...ts });

  // table
  const tableKnown = figure(cartesian({ x: [-200, 200, "cm"], y: [-150, 150, "cm"], aspect: "equal", static: "위에서 본 식탁 120×80cm" }), () => [
    rect([-60, -40], [60, 40], { id: "table-top", fill: "soft" }),
    dim([-60, -48], [60, -48], "폭 120cm", { id: "w" }),
    label([0, 0], "깊이 80cm", { tone: "muted" }),
    label([0, 50], "먼 변 = 앞 변 = 120cm", { tone: "muted", anchor: "s" }),
  ]);
  const q = [pr(-60, TBL, 100), pr(60, TBL, 100), pr(60, TBL, 180), pr(-60, TBL, 180)];
  const tableRatio = q[2][0] / q[1][0];
  const tableSeen = figure(cartesian({ x: [-340, 340, U], y: [-300, 40, U], aspect: "equal", static: "앉은 눈(식탁 위 40cm)에 보이는 사다리꼴" }), () => [
    sweep("y", 0, { id: "eye-line", tone: "ref", label: "눈높이" }),
    path(cmds(q, true), { id: "table-seen", fill: "soft", weight: "bold" }),
    dim([q[3][0], q[3][1] + 14], [q[2][0], q[2][1] + 14], "먼 변 (180cm 앞)", { id: "far", tone: "focus" }),
    dim([q[0][0], q[0][1] - 14], [q[1][0], q[1][1] - 14], "앞 변 (100cm 앞)", { id: "near", tone: "focus" }),
    label([0, q[0][1] - 70], `먼 변 ÷ 앞 변 = ${tableRatio.toFixed(2)} (= 100 ÷ 180)`, { id: "ratio" }),
  ]);

  // contour: v1 draws parts in sequence over 6s, once, with a dot at the pen head
  const contour = figure(slFrame({ loop: { ms: 6000, span: [0, 1], once: true } }), (m, t) => {
    let rest = total * t;
    /** @type {Pt} */ let head = contourParts[0][0];
    const marks = contourParts.map((p, i) => { const done = Math.max(0, Math.min(lens[i], rest)); if (rest > 0 && rest <= lens[i]) head = pointAt(p, done); rest -= lens[i]; return line(p, { id: `contour-${i}`, weight: "bold", reveal: done / lens[i] }); });
    return [...still(), sweep("y", pr(0, TBL, 66)[1], { tone: "ref", id: "table-edge" }), ...marks, t < 1 && dot(head, { id: "pen", tone: "focus" })];
  });

  // negative space
  const mTR = pr(MUG.xc + MUG.r, MUG.y1, MUG.zc), mBR = pr(MUG.xc + MUG.r, MUG.y0, MUG.zc);
  /** @param {number[]} idx */
  const leftOf = (idx) => idx.map((i) => BOX.P2[i]).reduce((a, b) => (b[0] < a[0] ? b : a));
  const bTL = leftOf([4, 5, 6, 7]), bBL = leftOf([0, 1, 2, 3]);
  const mugR = Math.max(...mSil.map((p) => p[0])), boxL = Math.min(...BOX.P2.map((p) => p[0])), yTop = Math.max(...BOX.P2.map((p) => p[1]));
  const neg = figure(slFrame({ static: "머그잔과 상자 사이·손잡이 안쪽의 음형 공간" }), () => [
    path(cmds([[mTR[0] - 6, mTR[1]], bTL, bBL, [mBR[0] - 6, mBR[1]]], true), { id: "gap", tone: "focus", fill: "solid", opacity: 0.55 }),
    ...BOX.faces.filter((f) => f.vis).map((f, i) => path(cmds(f.idx.map((k) => BOX.P2[k]), true), { id: `occ-box-${i}`, fill: "solid", tone: "muted" })),
    path(cmds(mSil, true), { id: "occ-mug", fill: "solid", tone: "muted" }),
    line([mTR, bTL], { dash: true, tone: "ref", id: "gap-top" }),
    line([mBR, bBL], { dash: true, tone: "ref", id: "gap-bot" }),
    path(cmds(hInner, true), { id: "hole", tone: "focus", fill: "solid", opacity: 0.75 }),
    ...contourParts.map((p, i) => line(p, { id: `c-${i}`, tone: "ref", weight: "thin" })),
    label([hInner[20][0] - 4, hInner[20][1] + 30], "① 손잡이 안쪽", { tone: "focus" }),
    label([(mugR + boxL) / 2, yTop + 6], "② 사이", { tone: "focus", anchor: "s" }),
    label([bx0 + 4, by0 + 4], "손잡이 모양은 근사", { tone: "muted", anchor: "sw", size: "s" }),
  ]);

  // pencil measuring
  /** @param {number} arm @param {number} H @param {number} D */
  const reading = (arm, H, D) => (arm * H) / D;
  const pencilSide = figure(cartesian({ x: [-5, 320, "cm"], y: [-16, 16, "cm"], aspect: "equal", static: "옆에서 본 배치, 같은 축척" }), (m, t, { params }) => {
    const D = Number(params.dist), armH = params.bent ? 45 : 60;
    return [
      dot([0, 0], { id: "eye", label: "눈" }),
      rect([D - 4, -5], [D + 4, 5], { id: "mug-side", fill: "soft", label: `머그잔 ${D}cm` }),
      line([[0, 0], [D, 5]], { tone: "ref" }), line([[0, 0], [D, -5]], { tone: "ref" }),
      line([[60, -9], [60, 9]], { id: "pencil-w", weight: "bold", label: "폭 잴 때 연필 60cm" }),
      line([[armH, -9], [armH, 9]], { id: "pencil-h", weight: "bold", tone: "focus", label: armH === 60 ? undefined : `높이 잴 때 연필 ${armH}cm` }),
    ];
  });
  const pencilView = figure(cartesian({ x: [-6, 6, "연필 눈금 cm"], y: [-5, 5, "연필 눈금 cm"], aspect: "equal", static: "연필 위 엄지 자리 (확대)" }), (m, t, { params }) => {
    const D = Number(params.dist), armH = params.bent ? 45 : 60;
    const rh = reading(armH, 10, D), rw = reading(60, 8, D), mh = reading(60, 10, D), ratio = rh / rw, ok = Math.abs(ratio - 1.25) < 0.01;
    const cx = -2;
    return [
      rect([cx - rw / 2, -mh / 2], [cx + rw / 2, mh / 2], { id: "mug-view", fill: "soft" }),
      line([[cx + rw / 2 + 1, mh / 2 + 0.5], [cx + rw / 2 + 1, -mh / 2 - 0.5]], { id: "pencil-v", tone: "warn", weight: "bold" }),
      dot([cx + rw / 2 + 1, mh / 2 - rh], { id: "thumb-h", tone: "focus", label: `엄지 ${rh.toFixed(1)}` }),
      line([[cx - rw / 2 - 0.5, -mh / 2 - 0.7], [cx + rw / 2 + 0.5, -mh / 2 - 0.7]], { id: "pencil-hz", tone: "warn", weight: "bold" }),
      dot([cx - rw / 2 + rw, -mh / 2 - 0.7], { id: "thumb-w", tone: "focus", label: `엄지 ${rw.toFixed(1)}` }),
      label([0, -4.6], `높이 눈금 ${rh.toFixed(1)} ÷ 폭 눈금 ${rw.toFixed(1)} = 비 ${ratio.toFixed(2)}${ok ? " (실제 10÷8과 같다)" : " (실제 1.25와 다르다)"}`, { id: "pen-read", tone: ok ? "good" : "bad" }),
    ];
  });
  const pencil = split(["pencilSide", "pencilView"], { link: "dist" });

  // heads
  const headOutline = /** @type {import("ltt").PathCmd[]} */ ([["M", 0, 80], ["C", 52, 80, 62, 30, 60, -5], ["C", 58, -45, 40, -72, 0, -85], ["C", -40, -72, -58, -45, -60, -5], ["C", -62, 30, -52, 80, 0, 80], ["Z"]]);
  /** @param {number} f @param {boolean} measure */
  const head = (f, measure) => {
    const ey = 80 - 165 * f;
    return [
      path(headOutline, { id: "head", fill: "soft" }),
      ...[-1, 1].map((k) => path([["M", k * 14 - 11, ey], ["Q", k * 14, ey + 7, k * 14 + 11, ey], ["Q", k * 14, ey - 6, k * 14 - 11, ey], ["Z"]], { id: `eye-${k}` })),
      measure && [dim([70, 80], [70, ey], "", { id: "top-eye", tone: "focus" }), dim([70, ey], [70, -85], "", { id: "eye-chin", tone: "focus" }), line([[-66, ey], [66, ey]], { dash: true, tone: "ref", id: "eye-level" })],
    ];
  };
  const headFrame = () => cartesian({ x: [-80, 80, "mm(도식)"], y: [-110, 95, "mm(도식)"], aspect: "equal", static: "정면 머리, 눈 높이 후보" });
  const headOne = figure(headFrame(), (m, t, { params }) => head(Number(params.eyeFrac), false));
  const headChoices = multiples("headOne", { over: { eyeFrac: [1 / 3, 1 / 2, 2 / 3] } });
  const headAnswer = figure(headFrame(), () => head(0.5, true));

  // basic shapes
  const shapes = figure(slFrame({ static: "원기둥·반고리·직육면체, 가려진 선 점선" }), () => [
    ...still(),
    ...contourParts.map((p, i) => line(p, { tone: "ref", weight: "thin", id: `base-${i}` })),
    line(mTop.concat([mTop[0]]), { id: "cyl-top", tone: "focus" }),
    line(mBot.slice(60).concat([mBot[0]]), { id: "cyl-bot-front", tone: "focus" }),
    line(mBot.slice(0, 61), { id: "cyl-bot-back", tone: "focus", dash: true }),
    line([pr(MUG.xc - MUG.r, MUG.y0, MUG.zc), pr(MUG.xc - MUG.r, MUG.y1, MUG.zc)], { id: "cyl-l", tone: "focus" }),
    line([pr(MUG.xc + MUG.r, MUG.y0, MUG.zc), pr(MUG.xc + MUG.r, MUG.y1, MUG.zc)], { id: "cyl-r", tone: "focus", label: "원기둥" }),
    line(hOuter, { id: "ring-o", tone: "focus", label: "반고리" }), line(hInner, { id: "ring-i", tone: "focus" }),
    line(hMid, { id: "ring-axis", tone: "focus", dash: true, weight: "thin" }),
    ...BOX.edges.map((e, i) => line([BOX.P2[e.a], BOX.P2[e.b]], { id: `cuboid-${i}`, tone: "focus", dash: !e.vis, label: i === 5 ? "직육면체" : undefined })),
    label([bx0 + 4, by0 + 4], "점선 = 가려진 선 · 손잡이 모양은 근사", { tone: "muted", anchor: "sw", size: "s" }),
  ]);

  // ellipses
  const ellSide = figure(cartesian({ x: [-3, 105, "cm"], y: [-48, 6, "cm"], aspect: "equal", static: "옆에서 본 배치, 같은 축척" }), () => [
    line([[-3, -40], [105, -40]], { tone: "ref", id: "table", label: "식탁" }),
    dot([0, 0], { id: "eye", label: "눈" }),
    sweep("y", 0, { tone: "ref", id: "eye-level", label: "눈높이 (식탁 위 40cm)" }),
    rect([66, -40], [74, -30], { id: "mug", fill: "soft" }),
    line([[0, 0], [70, -30]], { id: "ray-top", tone: "focus", label: "① 윗면" }),
    line([[0, 0], [70, -40]], { id: "ray-bot", tone: "focus", dash: true, label: "② 바닥" }),
    dim([0, -44], [70, -44], "70cm", { tone: "muted" }),
  ]);
  const eT = circle3(0, -30, 70, 4), eB = circle3(0, -40, 70, 4, 120), rT = ratioOf(circle3(0, -30, 70, 4, 3600)), rB = ratioOf(circle3(0, -40, 70, 4, 3600));
  const ellAnswer = figure(cartesian({ x: [-40, 300, U], y: [-300, -176, U], aspect: "equal", static: "투영으로 계산한 두 타원" }), () => [
    path(cmds(hull(eT.concat(eB)), true), { id: "mug-sil", fill: "soft" }),
    line(eT.concat([eT[0]]), { id: "ell-top", tone: "focus" }),
    line(eB.slice(60).concat([eB[0]]), { id: "ell-bot", tone: "focus" }),
    line(eB.slice(0, 61), { id: "ell-bot-hidden", tone: "focus", dash: true }),
    label([36, pr(0, -30, 70)[1]], `① 윗면 ${rT.w.toFixed(1)} × ${rT.h.toFixed(1)} → ${rT.ratio.toFixed(2)}`, { anchor: "w", id: "lab-top" }),
    label([36, pr(0, -40, 70)[1]], `② 바닥 ${rB.w.toFixed(1)} × ${rB.h.toFixed(1)} → ${rB.ratio.toFixed(2)}`, { anchor: "w", id: "lab-bot" }),
  ]);

  // perspective
  const persp = figure(cartesian({ x: [-620, 620, U], y: [-270, 150, U], aspect: "equal", static: "돌린 상자와 소실점" }), (m, t, { params }) => {
    const thd = Number(params.th), eye = Number(params.eye), th = (thd * Math.PI) / 180;
    const bx = boxGeom([0, 0, 150], 40, 40, 30, th, -eye);
    /** @type {{dir: string, x: number}[]} */ const vps = [];
    if (thd > 0) vps.push({ dir: "u", x: F / Math.tan(th) });
    vps.push({ dir: "v", x: -F * Math.tan(th) });
    const topVis = bx.faces.some((f) => f.top && f.vis);
    return [
      sweep("y", 0, { id: "horizon", tone: "focus", label: "수평선 = 눈높이" }),
      ...bx.faces.filter((f) => f.vis).map((f, i) => path(cmds(f.idx.map((k) => bx.P2[k]), true), { id: `pface-${i}`, fill: "soft", tone: f.top ? "muted" : f.n[0] > 0 ? "series1" : "series2" })),
      ...vps.flatMap((vp) => bx.edges.filter((e) => e.vis && e.dir === vp.dir).flatMap((e) => [e.a, e.b].map((i) => line([bx.P2[i], [vp.x, 0]], { dash: true, weight: "thin", tone: "ref", id: `vl-${vp.dir}-${e.a}-${e.b}-${i}` })))),
      ...bx.edges.filter((e) => e.vis).map((e, i) => line([bx.P2[e.a], bx.P2[e.b]], { id: `pedge-${i}`, weight: "bold" })),
      ...vps.map((vp) => Math.abs(vp.x) <= 600 ? dot([vp.x, 0], { id: `vp-${vp.dir}`, tone: "focus", label: "소실점" }) : arrow([Math.sign(vp.x) * 560, 0], [Math.sign(vp.x) * 600, 0], { id: `vp-${vp.dir}`, tone: "focus", label: "소실점은 그림 밖" })),
      label([0, -250], `${vps.length === 1 ? "1점 투시" : "2점 투시"} · 소실점 ${vps.length}개 (${vps.map((v) => Math.round(v.x)).join(", ")}) · 윗면 ${topVis ? "보임" : "안 보임"} (상자 높이 30cm)`, { id: "persp-read" }),
    ];
  });

  // light on sphere
  const LE = (35 * Math.PI) / 180;
  /** @param {number} a */
  const lightVec = (a) => { const r = (a * Math.PI) / 180; return [Math.sin(r) * Math.cos(LE), Math.cos(r) * Math.cos(LE), Math.sin(LE)]; };
  /** @param {number[]} n @param {number[]} L */
  const shade = (n, L) => { const d = n[0] * L[0] + n[1] * L[1] + n[2] * L[2]; let b = 0.08 + 0.92 * Math.max(0, d); if (d < 0) { const rx = -L[0], ry = -0.7, rl = Math.hypot(rx, ry); b += 0.32 * Math.max(0, (n[0] * rx + n[1] * ry) / rl) * Math.min(1, -d * 3); } return Math.min(1, b); };
  const grays = [0.95, 0.72, 0.5, 0.28, 0.08];
  const sphere = figure(cartesian({ x: [-2.2, 2.2, "구 반지름"], y: [-1.6, 1.6, "구 반지름"], aspect: "equal", static: "빛 방향에 따른 구의 명암" }), (m, t, { params }) => {
    const a = Number(params.la), post = Boolean(params.post), L = lightVec(a);
    const sxy = Math.hypot(L[0], L[1]), ux = L[0] / sxy, uy = L[1] / sxy, ly = Math.max(0.2, L[1]);
    const shx = -1.1 * (L[0] / ly) * 0.6;
    return [
      rect([-2.2, -1.6], [2.2, -0.55], { id: "floor", fill: "soft", tone: "muted" }),
      path([["M", shx - 1, -0.86], ["A", 1, 0.22, 0, 1, 1, shx + 1, -0.86], ["A", 1, 0.22, 0, 1, 1, shx - 1, -0.86], ["Z"]], { id: "cast", fill: "solid", tone: "muted", opacity: 0.55, label: "던진 그림자" }),
      field((x, y) => { const r2 = x * x + y * y; if (r2 > 1) return NaN; let b = shade([x, y, Math.sqrt(1 - r2)], L); if (post) b = grays.reduce((best, g) => (Math.abs(g - b) < Math.abs(best - b) ? g : best), grays[0]); return b; }, { as: "color", density: 200, id: "shading" }),
      arrow([ux * 1.7, uy * 1.7], [ux * 1.17, uy * 1.17], { id: "light", tone: "focus", label: "빛" }),
      label([L[0] + (ux < 0 ? -0.8 : 0.8), L[1] - 0.6], "하이라이트", { leader: [L[0], L[1]], id: "hl" }),
      label([-ux * L[2] + (ux < 0 ? 0.9 : -0.9), -uy * L[2] + 0.3], "코어 섀도", { leader: [-ux * L[2], -uy * L[2]], id: "core" }),
      label([-ux * 0.95 + (ux < 0 ? 0.9 : -0.9), -uy * 0.95], "반사광", { leader: [-ux * 0.95, -uy * 0.95], id: "reflect" }),
    ];
  });
  const valueScale = figure(cells({ cols: 5, rows: 1, static: "명도 5단계 1 가장 밝음 → 5 가장 어두움" }), () => grays.map((g, i) => cell(i, 0, { value: g, text: String(i + 1), id: `v${i + 1}` })));
  const light = split(["sphere", "valueScale"]);

  // next topics
  const now = ["윤곽·음형 공간", "연필 측정·비례", "기본 도형·타원", "1·2점 투시", "명도·빛의 방향"];
  /** @type {[string, number[]][]} */
  const next = [["제스처 드로잉", [0]], ["인체 비례·해부", [1]], ["단면선과 형태 명암", [2, 4]], ["3점 투시", [3]], ["구도", [1, 3]], ["색채: 명도·채도·색상", [4]]];
  const tree = figure(graph({ layout: "layered", direction: "right", static: "이번 수업 다섯 기술 → 다음 주제" }), () => [
    ...now.map((t, i) => node(`n${i}`, t, { group: "이번 수업", tone: "focus", shape: "round" })),
    ...next.map(([t], j) => node(`x${j}`, t, { group: "다음에 배울 것", shape: "round" })),
    ...next.flatMap(([, from], j) => from.map((i) => edge(`n${i}`, `x${j}`, { tone: "ref" }))),
  ]);

  // overview
  const shadowPts = mBot.map((p) => /** @type {Pt} */ ([p[0] + 24, p[1] - 2]));
  const vpx = (F * BOX.u[0]) / BOX.u[2];
  const sxs = mSil.map((p) => p[0]), sys = mSil.map((p) => p[1]);
  const mx0 = Math.min(...sxs), mx1 = Math.max(...sxs), my0 = Math.min(...sys), my1 = Math.max(...sys);
  const sR0 = pr(MUG.xc + MUG.r * 0.35, MUG.y0, MUG.zc - 3.7), sR1 = pr(MUG.xc + MUG.r * 0.35, MUG.y1, MUG.zc - 3.7);
  const overview = figure(slFrame({ static: "정물 한 장에 다섯 기술" }), () => [
    path(cmds(hull(mBot.concat(shadowPts)), true), { id: "ov-cast", fill: "solid", tone: "muted", opacity: 0.55 }),
    ...still(),
    path(cmds([sR1, mTR, mBR, sR0], true), { id: "ov-mug-shade", fill: "solid", tone: "muted", opacity: 0.4 }),
    ...BOX.faces.filter((f) => f.vis && !f.top && f.n[0] > 0).map((f, i) => path(cmds(f.idx.map((k) => BOX.P2[k]), true), { id: `ov-box-shade-${i}`, fill: "solid", tone: "muted", opacity: 0.4 })),
    ...contourParts.map((p, i) => line(p, { id: `ov-c-${i}` })),
    path(cmds(hInner, true), { id: "ov-hole", fill: "solid", tone: "focus", opacity: 0.45 }),
    ...BOX.edges.filter((e) => e.vis && e.dir === "u").map((e, i) => { const a = BOX.P2[e.a], b = BOX.P2[e.b], far = a[0] > b[0] ? a : b, dx = vpx - far[0], dy = -far[1], k = 40 / Math.hypot(dx, dy); return line([far, [far[0] + dx * k, far[1] + dy * k]], { dash: true, weight: "thin", tone: "ref", id: `ov-vl-${i}` }); }),
    label([bx1 - 4, by1 - 4], "점선: 소실점 쪽으로", { anchor: "ne", tone: "muted", size: "s" }),
    dim([mx1 + 5, my1], [mx1 + 5, my0], "높이", { id: "ov-h", tone: "focus" }),
    dim([mx0, my0 - 5], [mx1, my0 - 5], "폭", { id: "ov-w", tone: "focus" }),
    label([mTop[90][0] - 10, my1 + 8], "①", { tone: "focus", id: "n1" }),
    label([hOuter[20][0] - 8, hOuter[20][1]], "②", { tone: "focus", id: "n2" }),
    label([mx1 + 14, (my0 + my1) / 2], "③", { tone: "focus", id: "n3" }),
    label([BOX.P2[6][0] + 4, Math.max(...BOX.P2.map((p) => p[1])) + 8], "④", { tone: "focus", id: "n4" }),
    label([Math.max(...shadowPts.map((p) => p[0])) + 8, Math.min(...shadowPts.map((p) => p[1])) + 4], "⑤", { tone: "focus", id: "n5" }),
  ]);

  const hook = figure(cartesian({ x: [-1, 1, ""], y: [-1, 1, ""], static: "연필 아이콘" }), () => icon("pencil", [0, 0], { id: "pencil" }));

  return {
    models: {
      pencil: model({ dist: 120, bent: false }, (p) => ({ ratio: reading(p.bent ? 45 : 60, 10, p.dist) / reading(60, 8, p.dist) }), "연필 눈금 = 팔 길이 × 실제 길이 ÷ 거리 (v1 basis)"),
      persp: model({ th: 30, eye: 55 }, (p) => ({ vpR: p.th > 0 ? F / Math.tan((p.th * Math.PI) / 180) : Infinity, vpL: -F * Math.tan((p.th * Math.PI) / 180) }), "핀홀 투영 f=500, 소실점 f/tanθ, −f·tanθ"),
      light: model({ la: -45, post: false }, (p) => ({ center: shade([0, 0, 1], lightVec(p.la)) }), { illustrative: true }),
      head: model({ eyeFrac: 0.5 }, (p) => ({ eyeFrac: p.eyeFrac }), "Loomis, Drawing the Head and Hands (1956)"),
    },
    figures: { hook, tableKnown, tableSeen, table: split(["tableKnown", "tableSeen"]), contour, neg, pencilSide, pencilView, pencil, headOne, headChoices, headAnswer, shapes, ellSide, ellAnswer, persp, sphere, valueScale, light, tree, overview },
    scenes: [
      { type: "explore", title: "연필 눈금 길이는 거리에 따라 바뀌지만, 두 길이의 비는 그대로다", say: "거리를 바꾸고, 높이를 잴 때만 팔을 굽혀 보라.", figure: "pencil", focus: ["pen-read"], knobs: { dist: [80, 300, 10], bent: true } },
      { type: "predict", title: "같은 방법으로 얼굴을 재 보자", ask: "어른의 머리를 정면에서 볼 때, 눈은 머리 높이의 어디쯤에 있을까?", figure: "headChoices", focus: ["eye-1"], input: { kind: "choice", options: [{ text: "A: 위에서 1/3", feedback: "기호로 그린 얼굴은 눈을 너무 위에 둔다.", params: { eyeFrac: 1 / 3 } }, { text: "B: 절반", correct: true, params: { eyeFrac: 1 / 2 } }, { text: "C: 위에서 2/3", feedback: "정수리–눈과 눈–턱이 거의 같다.", params: { eyeFrac: 2 / 3 } }] }, reveal: { say: "정수리에서 눈까지와 눈에서 턱까지가 거의 같다.", figure: "headAnswer" } },
      { type: "predict", title: "원기둥의 두 타원은 같은 모양일까?", ask: "윗면 타원(①)과 바닥 타원(②) 중 어느 쪽이 더 둥글게 보일까?", figure: "ellSide", focus: ["ray-top", "ray-bot"], input: { kind: "choice", options: [{ text: "① 윗면이 더 둥글다", feedback: "윗면이 눈높이에 더 가깝다." }, { text: "② 바닥이 더 둥글다", correct: true }, { text: "둘이 같다", feedback: "내려다보는 각도가 다르다." }] }, reveal: { say: "눈높이에서 멀수록 타원은 둥글어진다.", figure: "ellAnswer" } },
      { type: "explore", title: "평행한 수평 모서리는 눈높이 선 위의 한 점으로 모인다", say: "θ를 0으로 돌려 보고, 눈높이를 30cm보다 낮춰 보라.", figure: "persp", focus: ["horizon"], knobs: { th: [0, 45, 1], eye: [10, 80, 5] } },
      { type: "explore", title: "빛을 마주한 면은 밝고, 빛 반대쪽에 코어 섀도·반사광·던진 그림자가 생긴다", say: "빛의 방향을 바꾸고, 5단계로 묶어 보라.", figure: "light", focus: ["shading"], knobs: { la: [-75, 75, 5], post: true } },
    ],
  };
};

const src = "archive/v1:site/gallery/art/drawing-basics.html";
/** @param {string} scene @param {import("../fragment").Prop[]} props @param {"V"|"C"|"G"|"X"|"N"} verdict @param {string[]} candidates @returns {import("../fragment").AuditRow} */
const row = (scene, props, verdict, candidates = []) => ({ fig: `drawing-basics#${scene}`, src, corpus: "lesson", domain: "미술", props, verdict, custom: [], candidates });

/** @type {import("../fragment").AuditRow[]} */
export const audit = [
  row("hook", [{ id: "P1", cat: "X", text: "연필 아이콘(장식)", essential: false, why: "v2 hook. art: 'pencil'은 제목 '아는 모양을 그리면 틀린다'가 기대지 않는 장식", status: "kept", by: "Api.icon(name, at)" }], "V"),
  row("table", [
    { id: "P1", cat: "S", text: "아는 모양(위에서 본 직사각형)과 보이는 모양(사다리꼴)을 나란히", essential: true, why: "v2 compare(또는 explain+split): v1 figure 장면, 제목이 두 모양의 대비", status: "kept", by: "Api.split(figures): 'Both share t, step, params…' 두 패널 나란히" },
    { id: "P2", cat: "Q", text: "핀홀 투영으로 계산한 사다리꼴(먼 변/앞 변 = 100/180 = 0.556)", essential: true, why: "결론 '보이는 모양을 옮긴다'가 계산된 정확한 모양에 기댐", status: "kept", by: "Point in the frame's data units; path(cmds) + cartesian aspect 'equal'" },
    { id: "P3", cat: "G", text: "눈높이 선이 사다리꼴 위에 있음", essential: true, why: "먼 변이 짧고 위로 올라가는 이유", status: "kept", by: "sweep('y', at): Line across the frame at a data value" },
    { id: "P4", cat: "X", text: "먼 변·앞 변 거리 표기와 비 0.56", essential: true, why: "제목의 수치 근거", status: "kept", by: "dim(from,to,text): Dimension line with its measured text; label" },
    { id: "P5", cat: "Q", text: "위에서 본 식탁 120×80cm 같은 축척", essential: false, why: "아는 모양 쪽 치수", status: "kept", by: "cartesian x/y Axis unit 'cm', aspect 'equal'" },
  ], "V"),
  row("contour", [
    { id: "P1", cat: "T", text: "윤곽선이 부분 순서대로 6초에 걸쳐 한 번 그려지고 끝 상태 유지", essential: true, why: "v2 explain. 제목 '경계를 천천히 따라간다'가 진행 애니메이션에 기댐", status: "kept", by: "Loop {ms: 6000, once: true}: 'Play once, then hold the end state'; MarkOpts.reveal 'Drawn fraction 0–1, by arc length from the path start'" },
    { id: "P2", cat: "E", text: "펜 끝 점이 현재 그리는 위치에 있음", essential: true, why: "눈·손이 같은 속도로 경계를 따라감을 보임", status: "kept", by: "figure draw(m, t) sampled over the frame's time; dot(at) at computed arc-length point" },
    { id: "P3", cat: "G", text: "윤곽 = 머그 실루엣·윗면 타원·손잡이·상자 보이는 모서리(투영 계산)", essential: true, why: "윤곽선이 실제 경계와 대응", status: "kept", by: "line(pts) in data units, cartesian aspect 'equal'" },
  ], "V"),
  row("negative", [
    { id: "P1", cat: "G", text: "머그와 상자 사이 빈 공간이 두 물체 경계를 정확히 공유하는 채운 영역", essential: true, why: "v2 explain. 결론 '빈 공간과 물체는 경계를 공유한다'", status: "approx", by: "", diff: "v1의 마스크(사각형−물체) 대신 사각형을 칠하고 물체를 fill 'solid'로 위에 덮어 가린다. 물체가 배경색이 아니라 muted 색으로 칠해진다" },
    { id: "P2", cat: "G", text: "손잡이 안쪽 구멍 채움", essential: true, why: "음형 공간 ①", status: "kept", by: "path(cmds) with fill 'solid', opacity" },
    { id: "P3", cat: "E", text: "음형 공간이 강조색, 물체 윤곽은 약하게", essential: true, why: "핵심 관계를 먼저 보이게", status: "kept", by: "Tone 'focus' is the accent; 'ref'; weight 'thin'" },
    { id: "P4", cat: "X", text: "① ② 표지와 '손잡이 모양은 근사' 표시", essential: true, why: "단순화 표시(그림 원칙)", status: "kept", by: "label(at, text)" },
  ], "V", ["path-subtract"]),
  row("pencil", [
    { id: "P1", cat: "I", text: "거리 80–300cm 슬라이더, 팔 굽힘 토글", essential: true, why: "v2 explore. v1 mount+LTT.sweep 조작", status: "kept", by: "Explore.knobs: model param to slider, choices, or toggle" },
    { id: "P2", cat: "Q", text: "엄지 눈금 = 팔 × 실제 길이 ÷ 거리, 높이/폭 비 1.25 유지(팔 굽히면 0.94)", essential: true, why: "제목 '비는 그대로다'", status: "kept", by: "figure draw ctx.params 'scene's params merged over defaults'; computed in draw" },
    { id: "P3", cat: "S", text: "옆 배치(같은 축척)와 눈에 보이는 연필 눈금 두 패널이 같은 조작 공유", essential: true, why: "원인(거리)과 결과(눈금) 연결", status: "kept", by: "split: 'Both share t, step, params, knobs'" },
    { id: "P4", cat: "E", text: "비가 1.25면 good, 아니면 bad 표시", essential: true, why: "팔을 똑같이 펴야 한다는 결론", status: "kept", by: "Tone good/bad semantic; draw re-evaluated with params" },
    { id: "P5", cat: "Q", text: "옆 배치 가로·세로 같은 축척(cm)", essential: false, why: "패널 제목", status: "kept", by: "cartesian aspect 'equal', Axis unit" },
  ], "V"),
  row("head", [
    { id: "P1", cat: "S", text: "눈 높이 1/3·1/2·2/3인 머리 세 개를 같은 틀로 나란히", essential: true, why: "v2 predict. v1 visual headChoices", status: "kept", by: "multiples(figure, {over}): one copy per value, sharing frame, axes" },
    { id: "P2", cat: "Q", text: "눈 위치 = 정수리에서 머리 높이 × 비율", essential: true, why: "선택지의 차이", status: "kept", by: "multiples over keys are model params; draw ctx.params" },
    { id: "P3", cat: "G", text: "정답 그림: 정수리–눈, 눈–턱 길이가 같음을 측정선으로", essential: true, why: "answerVisual, why '거의 같다'", status: "kept", by: "Predict.reveal.figure shows after; dim(from,to)" },
    { id: "P4", cat: "I", text: "답 고르기 뒤 정답 그림 공개", essential: true, why: "predict 흐름", status: "kept", by: "Predict: 'reveal.figure and reveal.params show after'" },
  ], "V"),
  row("shapes", [
    { id: "P1", cat: "G", text: "머그 = 원기둥(투영된 윗/바닥 타원+옆선), 손잡이 = 반고리, 상자 = 직육면체", essential: true, why: "v2 explain. 제목", status: "kept", by: "line(pts) in data units; aspect 'equal'" },
    { id: "P2", cat: "E", text: "가려진 바닥 타원 뒤쪽·상자 뒤 모서리를 점선", essential: true, why: "narration '가려진 선까지 그려 확인'", status: "kept", by: "line o.dash" },
    { id: "P3", cat: "E", text: "기본 도형은 강조, 원 정물은 약하게 뒤에", essential: true, why: "핵심 관계 우선", status: "kept", by: "Tone focus/ref; 'Later marks in MarkTree paint on top'" },
    { id: "P4", cat: "X", text: "'원기둥' '반고리' '직육면체' 표지와 범례 문장", essential: true, why: "제목의 대응", status: "kept", by: "MarkOpts.label; label()" },
  ], "V"),
  row("ellipse", [
    { id: "P1", cat: "G", text: "옆에서 본 눈·머그·식탁 배치, 같은 축척, 눈에서 윗면·바닥으로 시선", essential: true, why: "v2 predict. v1 visual ellSide", status: "kept", by: "cartesian aspect 'equal', units cm; line" },
    { id: "P2", cat: "Q", text: "투영으로 계산한 두 타원, 높이/폭 0.43 vs 0.57", essential: true, why: "answerVisual: 바닥이 더 둥글다", status: "kept", by: "Predict.reveal.figure; path/line in data units, aspect 'equal'" },
    { id: "P3", cat: "X", text: "타원별 폭×높이→비 수치", essential: true, why: "답의 근거", status: "kept", by: "label(at, text)" },
    { id: "P4", cat: "E", text: "바닥 타원 뒤쪽 점선", essential: false, why: "가려진 선", status: "kept", by: "line o.dash" },
  ], "V"),
  row("perspective", [
    { id: "P1", cat: "I", text: "θ 0–45°, 눈높이 10–80cm 조작", essential: true, why: "v2 explore. v1 mount+LTT.sweep", status: "kept", by: "Explore.knobs slider" },
    { id: "P2", cat: "Q", text: "소실점 x = f/tanθ, −f·tanθ (f=500), 수평선 y=0 위", essential: true, why: "제목 '눈높이 선 위의 한 점'", status: "kept", by: "dot at data coords; sweep('y', 0)" },
    { id: "P3", cat: "G", text: "보이는 수평 모서리 연장선이 소실점으로 모임; θ=0이면 1점", essential: true, why: "1·2점 투시 결론", status: "kept", by: "line(pts) in data units; draw re-evaluated per params" },
    { id: "P4", cat: "E", text: "소실점이 그림 밖이면 화살표로 방향 표시", essential: true, why: "θ 작을 때 소실점 존재를 숨기지 않음", status: "approx", by: "", diff: "arrow는 프레임 안에 그리지만 프레임 밖 좌표 자체를 가리키는 표준 표시가 없어 직접 판정해 그린다; 'marks are clipped to the frame'이라 연장선이 잘린다(v1도 잘림)" },
    { id: "P5", cat: "X", text: "1점/2점 투시·소실점 수·윗면 보임 판독", essential: true, why: "결론 판독", status: "kept", by: "label(at, text)" },
  ], "V", ["offscreen-pointer"]),
  row("light", [
    { id: "P1", cat: "Q", text: "구 표면 밝기 = 0.08 + 0.92·max(0, n·L) + 반사광 항, 회색 명도로 표시", essential: true, why: "v2 explore. 제목 '빛을 마주한 면은 밝고…'; 밝기가 곧 명도", status: "ambiguous", by: "", diff: "field(f, {as:'color'})는 'Scalar f is colored'일 뿐 색 척도(회색·밝기 단조·값 범위 0–1 고정)를 보장하지 않는다; NaN으로 구 밖을 비우는 것도 정의 없음" },
    { id: "P2", cat: "I", text: "빛 방향 −75–75°, 부드럽게/5단계 묶기 토글", essential: true, why: "조작이 결론을 만든다", status: "kept", by: "Explore.knobs slider and toggle" },
    { id: "P3", cat: "Q", text: "5단계 묶기 = 0.95/0.72/0.5/0.28/0.08 중 가장 가까운 값", essential: true, why: "명도 단계화", status: "ambiguous", by: "", diff: "양자화는 draw에서 하지만 표시 색이 runtime 척도라 다섯 단계가 명도 5단계로 보인다는 보장이 없다" },
    { id: "P4", cat: "X", text: "하이라이트·코어 섀도·반사광·던진 그림자·빛 표지가 빛 방향 따라 움직임", essential: true, why: "제목의 네 요소", status: "kept", by: "label(at, text, {leader}): line from the label to that point; draw per params" },
    { id: "P5", cat: "G", text: "던진 그림자가 빛 반대쪽 바닥에 (모양 근사)", essential: true, why: "결론", status: "approx", by: "", diff: "v1도 근사 타원; 같은 근사를 path A로 재현하나 '근사' 표기는 HTML basis 문장에 있었고 그림 안에는 없다(동일)" },
    { id: "P6", cat: "Q", text: "명도 5단계 견본(회색 값)", essential: false, why: "옆 패널", status: "ambiguous", by: "", diff: "cell value 'colored on the runtime's sequential scale' — 회색 명도 보장 없음" },
  ], "G", ["grayscale-value", "shaded-surface"]),
  row("tree", [
    { id: "P1", cat: "G", text: "이번 수업 다섯 기술 → 다음 주제 여섯, 다대다 연결", essential: true, why: "v2 explain(마무리). v1 mount treeFig '다음에 배울 것'", status: "kept", by: "graph({layout:'layered', direction:'right'}); node, edge between node ids" },
    { id: "P2", cat: "S", text: "왼쪽 열 '이번 수업', 오른쪽 열 '다음에 배울 것'", essential: true, why: "두 묶음 구분", status: "approx", by: "", diff: "node group은 묶음을 뜻하지만 열 배치와 열 제목 표시는 보장되지 않는다; layered 방향으로 두 층이 되는 것에 기댄다" },
  ], "V"),
  row("overview", [
    { id: "P1", cat: "G", text: "정물 한 장에 윤곽·음형 공간·비례 측정선·소실점 방향선·그늘과 던진 그림자", essential: true, why: "v2 explain(summary.figures). 제목 '다섯 기술이 다 들어 있다'", status: "kept", by: "path/line/dim in data units, aspect 'equal'; LessonInput.summary.figures" },
    { id: "P2", cat: "X", text: "①–⑤ 번호 표지가 각 요소 자리에", essential: true, why: "caption 대응", status: "kept", by: "label(at, text)" },
    { id: "P3", cat: "E", text: "그림자·그늘을 어두운 반투명으로", essential: true, why: "빛 왼쪽 위, 그늘 오른쪽", status: "approx", by: "", diff: "검정 반투명 대신 muted tone + opacity; 어두움 정도는 runtime 색에 달림" },
  ], "V"),
];
