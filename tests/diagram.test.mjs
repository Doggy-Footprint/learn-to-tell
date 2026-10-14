import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Spec: agent-docs/specs/8f96def5ba48e754-diagram-edge-paths.md v3. Every expected value below is derived from the spec's
// formulas (hand-computed constants or the small reference helpers in this file), never from the implementation.

function loadParts() {
  const context = { console: { info() {}, warn() {} } };
  vm.createContext(context);
  for (const f of ["vendor/d3.min.js", "ltt.js", "ltt-parts.js"]) {
    vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/" + f, import.meta.url), "utf8"), context);
  }
  return context.LTT;
}
const { diagramLayout } = loadParts();

// ---------- reference helpers (spec formulas) ----------
const TOL = 1e-6;
const near = (a, b, tol = TOL, msg = "") => assert.ok(typeof a === "number" && Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`);
const pt = (p) => { assert.ok(Array.isArray(p) && p.length === 2, "pts item is an [x, y] array"); return [p[0], p[1]]; };
const ptsOf = (e) => Array.from(e.pts, pt);
function assertPts(actual, expected, tol = TOL, msg = "") {
  const a = Array.from(actual, pt);
  assert.equal(a.length, expected.length, `${msg} pts count: ${JSON.stringify(a)} vs ${JSON.stringify(expected)}`);
  a.forEach((p, i) => {
    near(p[0], expected[i][0], tol, `${msg} pts[${i}].x`);
    near(p[1], expected[i][1], tol, `${msg} pts[${i}].y`);
  });
}
const edgeOf = (L, id) => {
  const e = L.edges.find((x) => x.id === id);
  assert.ok(e, "edge " + id + " exists");
  return e;
};
const NORMAL = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
const sideRef = (b, s, g) => ({ top: [b.cx, b.y - g], bottom: [b.cx, b.y + b.h + g], left: [b.x - g, b.cy], right: [b.x + b.w + g, b.cy] })[s];
const clipRef = (b, dx, dy, g) => {
  if (dx === 0 && dy === 0) { dx = 1; dy = 0; }
  const t = Math.min(dx !== 0 ? (b.w / 2 + g) / Math.abs(dx) : Infinity, dy !== 0 ? (b.h / 2 + g) / Math.abs(dy) : Infinity);
  return [b.cx + dx * t, b.cy + dy * t];
};

// Tokenize a path d string: command letters stay strings, numbers become Numbers; comma and space both separate.
function tokens(d) {
  return (d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map((s) => (/[A-Za-z]/.test(s) ? s.toUpperCase() : Number(s)));
}
// Drop L commands that do not move the pen, so a zero-length L before/after a Q never matters.
function normTokens(tok) {
  const out = [];
  let i = 0, cur = null;
  while (i < tok.length) {
    const c = tok[i++];
    const n = c === "C" ? 6 : c === "Q" ? 4 : 2;
    const args = tok.slice(i, i + n);
    i += n;
    const end = [args[n - 2], args[n - 1]];
    if (c === "L" && cur && Math.abs(cur[0] - end[0]) <= 0.01 && Math.abs(cur[1] - end[1]) <= 0.01) continue;
    out.push(c, ...args);
    cur = end;
  }
  return out;
}
function assertD(d, expected, msg = "") {
  const a = normTokens(tokens(d)), e = normTokens(expected);
  assert.equal(a.length, e.length, `${msg} d token count: "${d}" vs ${JSON.stringify(e)}`);
  a.forEach((tk, i) => {
    if (typeof e[i] === "string") assert.equal(tk, e[i], `${msg} d token ${i} in "${d}"`);
    else near(tk, e[i], 0.01, `${msg} d token ${i} in "${d}"`);
  });
}
// d for an ortho path per FR-7.
function orthoD(pts, r) {
  const out = ["M", ...pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [p, c, n] = [pts[i - 1], pts[i], pts[i + 1]];
    const l1 = Math.hypot(c[0] - p[0], c[1] - p[1]), l2 = Math.hypot(n[0] - c[0], n[1] - c[1]);
    const rc = Math.min(r, l1 / 2, l2 / 2);
    if (rc > 0) {
      out.push("L", c[0] - ((c[0] - p[0]) / l1) * rc, c[1] - ((c[1] - p[1]) / l1) * rc);
      out.push("Q", ...c, c[0] + ((n[0] - c[0]) / l2) * rc, c[1] + ((n[1] - c[1]) / l2) * rc);
    } else out.push("L", ...c);
  }
  out.push("L", ...pts[pts.length - 1]);
  return out;
}
const polyLen = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function polyHalf(pts) {
  let rest = polyLen(pts) / 2;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (rest <= l && l > 0) return [pts[i - 1][0] + ((pts[i][0] - pts[i - 1][0]) * rest) / l, pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * rest) / l];
    rest -= l;
  }
  return pts[pts.length - 1];
}
// FR-9 cubic segments from anchors and the outward normals of the first/last anchors.
function curveRef(A, sn, en) {
  const unit = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const segs = [];
  for (let i = 0; i + 1 < A.length; i++) {
    const [p, q] = [A[i], A[i + 1]];
    const t = 0.5 * Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1]));
    const o = i === 0 && sn ? sn : unit(p, q), bk = i + 2 === A.length && en ? en : unit(q, p);
    segs.push([p, [p[0] + o[0] * t, p[1] + o[1] * t], [q[0] + bk[0] * t, q[1] + bk[1] * t], q]);
  }
  return segs;
}
const curveTokens = (segs) => ["M", ...segs[0][0], ...segs.flatMap((s) => ["C", ...s[1], ...s[2], ...s[3]])];
function curveHalf(segs) {
  const N = 4000, samples = [];
  for (const [p0, p1, p2, p3] of segs) {
    for (let k = 0; k <= N; k++) {
      const t = k / N, u = 1 - t;
      samples.push([0, 1].map((j) => u * u * u * p0[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t * t * t * p3[j]));
    }
  }
  return polyHalf(samples);
}
const axisAligned = (a, b, tol = 0) => Math.abs(a[0] - b[0]) <= tol || Math.abs(a[1] - b[1]) <= tol;

// Pixel-node scene with pad 0, cell [200, 100], node [100, 40]: pixel P(x, y) = (x, y), grid G(c, r) = (200c + 100, 100r + 50).
const PAD0 = { pad: 0, cell: [200, 100], node: [100, 40] };
const PN = (id, x, y, o = {}) => ({ id, x, y, ...o });
const GN = (id, c, r, o = {}) => ({ id, c, r, ...o });
const one = (nodes, edge, extra = {}) => diagramLayout({ ...PAD0, ...extra, nodes, edges: [edge] }).edges[0];

// ---------- VO-1 ----------
function legacyRef(spec) {
  const pad = spec.pad ?? 20, cell = spec.cell ?? [210, 120], nd = spec.node ?? [164, 60];
  const cols = spec.cols ?? 1 + Math.max(...spec.nodes.filter((n) => n.c != null).map((n) => n.c));
  const rows = spec.rows ?? 1 + Math.max(...spec.nodes.filter((n) => n.r != null).map((n) => n.r));
  const nodes = {};
  for (const n of spec.nodes) {
    const w = n.w ?? nd[0], h = n.h ?? nd[1];
    const cx = pad + (n.c + 0.5) * cell[0], cy = pad + (n.r + 0.5) * cell[1];
    nodes[n.id] = { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
  }
  const edges = spec.edges.map((e) => {
    const a = nodes[e.f], b = nodes[e.t];
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    const p = clipRef(a, dx, dy, 4), q = clipRef(b, -dx, -dy, 8);
    return { id: e.id ?? e.f + ">" + e.t, f: e.f, t: e.t, x1: p[0], y1: p[1], x2: q[0], y2: q[1], lx: (p[0] + q[0]) / 2, ly: (p[1] + q[1]) / 2 };
  });
  const zones = (spec.zones ?? []).map((z, i) => ({
    id: z.id ?? "z" + i, parent: null, depth: 0,
    x: pad + z.c0 * cell[0] + 6, y: pad + z.r0 * cell[1] + 6, w: (z.c1 - z.c0 + 1) * cell[0] - 12, h: (z.r1 - z.r0 + 1) * cell[1] - 12,
  }));
  return { width: spec.width ?? 2 * pad + cols * cell[0], height: spec.height ?? 2 * pad + rows * cell[1], nodes, edges, zones };
}
function assertLegacy(spec, label) {
  const L = diagramLayout(spec), R = legacyRef(spec);
  near(L.width, R.width, TOL, label + " width");
  near(L.height, R.height, TOL, label + " height");
  for (const id of Object.keys(R.nodes)) for (const k of ["x", "y", "w", "h", "cx", "cy"]) near(L.nodes[id][k], R.nodes[id][k], TOL, `${label} node ${id}.${k}`);
  assert.equal(L.edges.length, R.edges.length);
  R.edges.forEach((r, i) => {
    const e = L.edges[i];
    assert.equal(e.id, r.id);
    assert.equal(e.f, r.f);
    assert.equal(e.t, r.t);
    assert.equal(e.shape, "straight");
    for (const k of ["x1", "y1", "x2", "y2", "lx", "ly"]) near(e[k], r[k], TOL, `${label} edge ${r.id}.${k}`);
    assertPts(e.pts, [[r.x1, r.y1], [r.x2, r.y2]], TOL, `${label} ${r.id}`);
    assertD(e.d, ["M", r.x1, r.y1, "L", r.x2, r.y2], `${label} ${r.id}`);
  });
  assert.equal(L.zones.length, R.zones.length);
  R.zones.forEach((r, i) => {
    const z = L.zones[i];
    assert.equal(z.id, r.id);
    assert.equal(z.parent, null);
    assert.equal(z.depth, 0);
    for (const k of ["x", "y", "w", "h"]) near(z[k], r[k], TOL, `${label} zone ${i}.${k}`);
  });
}

test("VO-1 EP1 C-1 two nodes, no options (hand-computed constants and legacy reference)", () => {
  const spec = { cols: 2, rows: 1, cell: [200, 100], node: [120, 40], pad: 0, nodes: [{ id: "a", c: 0, r: 0 }, { id: "b", c: 1, r: 0 }], edges: [{ f: "a", t: "b" }] };
  const L = diagramLayout(spec), e = L.edges[0];
  near(e.x1, 164); near(e.x2, 232); near(e.y1, 50); near(e.y2, 50); near(e.lx, 198); near(e.ly, 50);
  assertD(e.d, ["M", 164, 50, "L", 232, 50]);
  assert.equal(e.id, "a>b");
  assertLegacy(spec, "EP1");
});

test("VO-1 EP2 catalog diagram demo spec", () => {
  assertLegacy({
    cols: 3, rows: 2, cell: [190, 100], node: [150, 56], maxWidth: false,
    zones: [{ c0: 0, r0: 0, c1: 1, r1: 1, l: "하나의 프롬프트", k: "bad" }],
    nodes: [
      { id: "user", c: 0, r: 0, l: "사용자 지시", s: "진짜 목표", icon: "user" },
      { id: "doc", c: 0, r: 1, l: "외부 문서", s: "공격자 통제", icon: "doc", k: "bad", flaw: true },
      { id: "llm", c: 1, r: 0.5, l: "LLM", s: "구분 못 함", icon: "cpu", k: "accent" },
      { id: "tool", c: 2, r: 0.5, l: "도구 실행", icon: "bolt", k: "dark" },
    ],
    edges: [{ f: "user", t: "llm" }, { f: "doc", t: "llm", k: "bad", l: "숨은 명령", lo: [-24, 16] }, { f: "llm", t: "tool", k: "accent" }],
  }, "EP2");
});

test("VO-1 EP3 gpu single-GPU dataflow spec (single-token)", () => {
  assertLegacy({
    cols: 4, rows: 1, cell: [220, 130], node: [180, 70], maxWidth: false,
    zones: [{ c0: 0, r0: 0, c1: 2, r1: 0, l: "GPU 한 장", k: "accent" }],
    nodes: [
      { id: "hbm", c: 0, r: 0, l: "HBM", s: "가중치 16 GB", icon: "memory" },
      { id: "l2", c: 1, r: 0, l: "L2 캐시", s: "작은 임시 보관소", icon: "layers", k: "muted" },
      { id: "sm", c: 2, r: 0, l: "SM 연산기", s: "곱하고 더한다", icon: "cpu" },
      { id: "out", c: 3, r: 0, l: "토큰 1개", s: "다음 글자", icon: "doc", k: "good" },
    ],
    edges: [{ f: "hbm", t: "l2", l: "3.35 TB/s", lo: [0, -16], k: "accent" }, { f: "l2", t: "sm", k: "accent" }, { f: "sm", t: "out", k: "good" }],
  }, "EP3");
});

test("VO-1 EP4 gpu single-GPU dataflow spec (batch of four users)", () => {
  const US = [0, 1, 2, 3];
  assertLegacy({
    cols: 4, rows: 4, cell: [220, 70], node: [180, 54], maxWidth: false,
    zones: [{ c0: 0, r0: 0, c1: 2, r1: 3, l: "GPU 한 장", k: "accent" }],
    nodes: [
      { id: "hbm", c: 0, r: 1.5, l: "HBM", s: "가중치 16 GB", icon: "memory", h: 70 },
      { id: "l2", c: 1, r: 1.5, l: "L2 캐시", s: "작은 임시 보관소", icon: "layers", k: "muted", h: 70 },
      { id: "sm", c: 2, r: 1.5, l: "SM 연산기", s: "한 번에 여러 명", icon: "cpu", h: 70 },
      ...US.map((i) => ({ id: "u" + i, c: 3, r: i, l: "사용자 " + (i + 1), icon: "user", w: 150, h: 48 })),
    ],
    edges: [{ f: "hbm", t: "l2", l: "표 1번", lo: [0, -16], k: "accent" }, { f: "l2", t: "sm", k: "accent" }, ...US.map((i) => ({ f: "sm", t: "u" + i, k: "good" }))],
  }, "EP4");
});

// ---------- VO-2 ortho decision table ----------
const ORTHO = (o) => ({ f: "a", t: "b", shape: "ortho", ...o });
const DT = [
  ["DT1 pH·qH", [PN("a", 100, 100), PN("b", 400, 200)], ORTHO({ from: "right", to: "left" }), [[154, 100], [248, 100], [248, 200], [342, 200]]],
  ["DT2 pV·qV", [PN("a", 100, 100), PN("b", 300, 300)], ORTHO({ from: "bottom", to: "top" }), [[100, 124], [100, 198], [300, 198], [300, 272]]],
  ["DT3 pH·qV", [PN("a", 100, 100), PN("b", 300, 300)], ORTHO({ from: "right", to: "top" }), [[154, 100], [300, 100], [300, 272]]],
  ["DT4 pH·free", [PN("a", 100, 100), PN("b", 700, 150)], ORTHO({ from: "right", to: "left", via: [[2, 1]] }), [[154, 100], [500, 100], [500, 150], [642, 150]]],
  ["DT5 pV·qH", [PN("a", 100, 100), PN("b", 400, 300)], ORTHO({ from: "bottom", to: "left" }), [[100, 124], [100, 300], [342, 300]]],
  ["DT6 pV·free", [PN("a", 100, 100), PN("b", 300, 550)], ORTHO({ from: "bottom", to: "top", via: [[1, 3]] }), [[100, 124], [100, 350], [300, 350], [300, 522]]],
  ["DT7 free·qH", [PN("a", 100, 100), PN("b", 500, 300)], ORTHO({ from: "right", to: "left", via: [[1, 0.5]] }), [[154, 100], [300, 100], [300, 300], [442, 300]]],
  ["DT8 free·qV", [PN("a", 100, 100), PN("b", 500, 400)], ORTHO({ from: "right", to: "top", via: [[1, 0.5]] }), [[154, 100], [500, 100], [500, 372]]],
  ["DT9 free·free", [PN("a", 100, 100), PN("b", 700, 200)], ORTHO({ from: "right", to: "left", via: [[1, 0.5], [2, 1.5]] }), [[154, 100], [500, 100], [500, 200], [642, 200]]],
  ["DT10 aligned, no bend", [PN("a", 100, 100), PN("b", 400, 100)], ORTHO({ from: "right", to: "left" }), [[154, 100], [342, 100]]],
];
for (const [name, nodes, edge, expected] of DT) {
  test(`VO-2 ${name} elbow`, () => {
    const e = one(nodes, edge);
    assertPts(e.pts, expected, TOL, name);
    const p = ptsOf(e);
    for (let i = 1; i < p.length; i++) assert.ok(axisAligned(p[i - 1], p[i]), `${name} segment ${i} axis aligned: ${JSON.stringify(p)}`);
    assert.equal(e.shape, "ortho");
  });
}

// ---------- VO-3 side inference ----------
const SI = [
  ["SI1 right", [PN("a", 100, 100), PN("b", 400, 150)], ORTHO({}), [[154, 100], [248, 100], [248, 150], [342, 150]]],
  ["SI2 left", [PN("a", 400, 100), PN("b", 100, 150)], ORTHO({}), [[346, 100], [252, 100], [252, 150], [158, 150]]],
  ["SI3 bottom", [PN("a", 100, 100), PN("b", 100, 300)], ORTHO({}), [[100, 124], [100, 272]]],
  ["SI4 top", [PN("a", 100, 300), PN("b", 100, 100)], ORTHO({}), [[100, 276], [100, 128]]],
  ["SI5 from overrides inference", [PN("a", 100, 100), PN("b", 400, 150)], ORTHO({ from: "bottom" }), [[100, 124], [100, 150], [342, 150]]],
  ["SI6 to overrides inference", [PN("a", 100, 100), PN("b", 400, 150)], ORTHO({ to: "top" }), [[154, 100], [400, 100], [400, 122]]],
];
for (const [name, nodes, edge, expected] of SI) {
  test(`VO-3 ${name}`, () => {
    const e = one(nodes, edge);
    assertPts(e.pts, expected, TOL, name);
    const [first, last] = [pt(e.pts[0]), pt(e.pts[e.pts.length - 1])];
    near(e.x1, first[0]); near(e.y1, first[1]); near(e.x2, last[0]); near(e.y2, last[1]);
  });
}

const VIA2 = [PN("a", 100, 100), PN("b", 500, 100)];
test("VO-3 SI7 ortho with via and no from/to infers sides from V1 / Vk, not from the opposite node", () => {
  const e = one(VIA2, ORTHO({ via: [[0, 3], [2, 3]] }));
  assertPts(e.pts, [[100, 124], [100, 350], [500, 350], [500, 128]]);
});

// ---------- VO-4 boundaries ----------
test("VO-4 BV1 (x axis) pV·qV x offset 0.4px (no bend) vs 0.6px (bend)", () => {
  const nodes = (dx) => [PN("a", 100, 100), PN("b", 100 + dx, 400)];
  const e04 = one(nodes(0.4), ORTHO({ from: "bottom", to: "top" }));
  assertPts(e04.pts, [[100, 124], [100.4, 372]]);
  const e06 = one(nodes(0.6), ORTHO({ from: "bottom", to: "top" }));
  assertPts(e06.pts, [[100, 124], [100, 248], [100.6, 248], [100.6, 372]]);
});
test("VO-4 BV1 ortho alignment 0.4px (no bend) vs 0.6px (bend)", () => {
  const nodes = (dy) => [PN("a", 100, 100), PN("b", 400, 100 + dy)];
  const e04 = one(nodes(0.4), ORTHO({ from: "right", to: "left" }));
  assert.equal(e04.pts.length, 2);
  assertPts(e04.pts, [[154, 100], [342, 100.4]]);
  const e06 = one(nodes(0.6), ORTHO({ from: "right", to: "left" }));
  assertPts(e06.pts, [[154, 100], [248, 100], [248, 100.6], [342, 100.6]]);
});

const ZPTS = [[154, 100], [248, 100], [248, 200], [342, 200]];
const zNodes = [PN("a", 100, 100), PN("b", 400, 200)];
test("VO-4 BV2 radius equal to half the shorter adjacent segment (47), and just above (48 clamps), just below (46)", () => {
  const d = (radius) => one(zNodes, ORTHO({ from: "right", to: "left", radius })).d;
  assertD(d(47), ["M", 154, 100, "L", 201, 100, "Q", 248, 100, 248, 147, "L", 248, 153, "Q", 248, 200, 295, 200, "L", 342, 200], "r=47");
  assertD(d(48), ["M", 154, 100, "L", 201, 100, "Q", 248, 100, 248, 147, "L", 248, 153, "Q", 248, 200, 295, 200, "L", 342, 200], "r=48 clamps to 47");
  assertD(d(46), ["M", 154, 100, "L", 202, 100, "Q", 248, 100, 248, 146, "L", 248, 154, "Q", 248, 200, 294, 200, "L", 342, 200], "r=46");
});

test("VO-4 BV3 radius 0 draws only L commands through the pts", () => {
  const e = one(zNodes, ORTHO({ from: "right", to: "left", radius: 0 }));
  assert.ok(!/Q/i.test(e.d), "no Q in " + e.d);
  assertD(e.d, ["M", 154, 100, "L", 248, 100, "L", 248, 200, "L", 342, 200]);
});

test("VO-4 BV4 parallel bundle n = 1 gives offset 0, n = 2 gives +-7", () => {
  const nodes = [GN("a", 0, 0), GN("b", 1, 0)];
  const single = diagramLayout({ ...PAD0, nodes, edges: [{ f: "a", t: "b", id: "s" }] }).edges[0];
  near(single.y1, 50); near(single.y2, 50);
  const pair = diagramLayout({ ...PAD0, nodes, edges: [{ f: "a", t: "b", id: "p0" }, { f: "a", t: "b", id: "p1" }] });
  near(edgeOf(pair, "p0").y1, 43); near(edgeOf(pair, "p0").y2, 43);
  near(edgeOf(pair, "p1").y1, 57); near(edgeOf(pair, "p1").y2, 57);
});

test("VO-4 BV5 auto height starts at 2 lines (1 line + 1 sub line stays node[1] = 54)", () => {
  const h = (n) => diagramLayout({ pad: 0, cell: [200, 100], node: [100, 54], nodes: [{ id: "n", c: 0, r: 0, ...n }], edges: [] }).nodes.n.h;
  near(h({ l: "한 줄", s: "부제" }), 54);
  near(h({ l: "한 줄" }), 54);
  near(h({ l: "가\n나" }), 60);
});

test("VO-4 BV6 ortho inference with |dx| = |dy| picks the horizontal sides", () => {
  const e = one([PN("a", 100, 100), PN("b", 300, 300)], ORTHO({}));
  assertPts(e.pts, [[154, 100], [198, 100], [198, 300], [242, 300]]);
});

// ---------- VO-5 ortho d strings ----------
const RDCASES = [
  ["DT1 path", zNodes, ORTHO({ from: "right", to: "left" })],
  ["DT6 path", [PN("a", 100, 100), PN("b", 300, 550)], ORTHO({ from: "bottom", to: "top", via: [[1, 3]] })],
];
test("VO-5 RD1 Q count equals the number of interior vertices", () => {
  for (const [name, nodes, edge] of RDCASES) {
    const e = one(nodes, edge);
    const q = tokens(e.d).filter((t) => t === "Q").length;
    assert.equal(q, e.pts.length - 2, name);
  }
  assert.equal(tokens(one(zNodes, ORTHO({ from: "right", to: "left" })).d).filter((t) => t === "Q").length, 2);
});
test("VO-5 RD2 each Q control point is the vertex", () => {
  for (const [name, nodes, edge] of RDCASES) {
    const e = one(nodes, edge), p = ptsOf(e), tk = tokens(e.d);
    let v = 1;
    for (let i = 0; i < tk.length; i++) {
      if (tk[i] === "Q") {
        near(tk[i + 1], p[v][0], 0.01, name); near(tk[i + 2], p[v][1], 0.01, name);
        v++;
      }
    }
    assert.equal(v, p.length - 1, name);
  }
  assertD(one(zNodes, ORTHO({ from: "right", to: "left" })).d, ["M", 154, 100, "L", 238, 100, "Q", 248, 100, 248, 110, "L", 248, 190, "Q", 248, 200, 258, 200, "L", 342, 200]);
});
test("VO-5 RD3 d starts with M pts[0] and ends at the last pts", () => {
  for (const [name, nodes, edge] of RDCASES) {
    const e = one(nodes, edge), p = ptsOf(e), tk = tokens(e.d);
    assert.equal(tk[0], "M", name);
    near(tk[1], p[0][0], 0.01, name); near(tk[2], p[0][1], 0.01, name);
    near(tk[tk.length - 2], p[p.length - 1][0], 0.01, name); near(tk[tk.length - 1], p[p.length - 1][1], 0.01, name);
    assert.ok(/^\s*M/i.test(e.d));
  }
  const comma = tokens("M154,100 L238,100");
  assert.deepEqual(comma, ["M", 154, 100, "L", 238, 100]);
});

// ---------- VO-6 straight via / from / to ----------
const SVN = [GN("a", 0, 0), GN("b", 2, 0)];
const SV = (o) => one(SVN, { f: "a", t: "b", ...o });
test("VO-6 SV1 via only: clip toward the via point", () => {
  const e = SV({ via: [[1, 1]] });
  assertPts(e.pts, [[148, 74], [300, 150], [444, 78]]);
  assertD(e.d, ["M", 148, 74, "L", 300, 150, "L", 444, 78]);
  const half = polyHalf([[148, 74], [300, 150], [444, 78]]);
  near(e.lx, half[0]); near(e.ly, half[1]);
});
test("VO-6 SV2 from only (with via, and without via clipping toward the other node)", () => {
  const e = SV({ via: [[1, 1]], from: "bottom" });
  assertPts(e.pts, [[100, 74], [300, 150], [444, 78]]);
  assertD(e.d, ["M", 100, 74, "L", 300, 150, "L", 444, 78]);
  assertPts(SV({ from: "bottom" }).pts, [[100, 74], [442, 50]]);
});
test("VO-6 SV3 to only (with via, and without via clipping toward the other node)", () => {
  const e = SV({ via: [[1, 1]], to: "top" });
  assertPts(e.pts, [[148, 74], [300, 150], [500, 22]]);
  assertD(e.d, ["M", 148, 74, "L", 300, 150, "L", 500, 22]);
  assertPts(SV({ to: "top" }).pts, [[154, 50], [500, 22]]);
});
test("VO-6 SV4 via + from + to", () => {
  const e = SV({ via: [[1, 1]], from: "bottom", to: "top" });
  assertPts(e.pts, [[100, 74], [300, 150], [500, 22]]);
  assertD(e.d, ["M", 100, 74, "L", 300, 150, "L", 500, 22]);
  assert.equal(e.shape, "straight");
});

test("VO-6 SV5 straight with two via points: start clips toward V1, end toward V2, order kept (C-6)", () => {
  const e = SV({ via: [[1, 1], [2, 3]] });
  assertPts(e.pts, [[148, 74], [300, 150], [500, 350], [500, 78]]);
  assertD(e.d, ["M", 148, 74, "L", 300, 150, "L", 500, 350, "L", 500, 78]);
});

// ---------- VO-7 curve ----------
test("VO-7 CV1 two anchors with from/to sides", () => {
  const e = one([PN("a", 100, 100), PN("b", 400, 300)], { f: "a", t: "b", shape: "curve", from: "right", to: "top" });
  assertPts(e.pts, [[154, 100], [400, 272]]);
  assertD(e.d, ["M", 154, 100, "C", 277, 100, 400, 149, 400, 272]);
  assert.equal(e.shape, "curve");
});
test("VO-7 CV2 one via point (control points follow unit vectors)", () => {
  const e = one([PN("a", 100, 100), PN("b", 600, 300)], { f: "a", t: "b", shape: "curve", from: "right", to: "left", via: [[1, 2]] });
  const A = [[154, 100], [300, 250], [542, 300]];
  assertPts(e.pts, A);
  assertD(e.d, curveTokens(curveRef(A, NORMAL.right, NORMAL.left)));
});
test("VO-7 CV3 sides inferred", () => {
  const e = one([PN("a", 100, 100), PN("b", 400, 150)], { f: "a", t: "b", shape: "curve" });
  assertPts(e.pts, [[154, 100], [342, 150]]);
  assertD(e.d, ["M", 154, 100, "C", 248, 100, 248, 150, 342, 150]);
});

test("VO-7 CV4 points + curve: every anchor uses the via-point direction rule", () => {
  const e = one([PN("a", 0, 0), PN("b", 600, 600)], { f: "a", t: "b", shape: "curve", from: "top", to: "bottom", points: [[100, 100], [300, 200], [500, 200]] });
  const A = [[100, 100], [300, 200], [500, 200]];
  assertPts(e.pts, A);
  assertD(e.d, curveTokens(curveRef(A, null, null)));
});

test("VO-7 CV5 curve with via and no from/to infers sides from V1 / Vk", () => {
  const e = one(VIA2, { f: "a", t: "b", shape: "curve", via: [[0, 3], [2, 3]] });
  const A = [[100, 124], [100, 350], [500, 350], [500, 128]];
  assertPts(e.pts, A);
  assertD(e.d, curveTokens(curveRef(A, NORMAL.bottom, NORMAL.bottom)));
});

// ---------- VO-8 parallel offsets ----------
test("VO-8 PO1 n = 3 with mixed directions (C-9), and first edge direction fixes the normal", () => {
  const nodes = [GN("a", 0, 0), GN("b", 1, 0)];
  const L = diagramLayout({ ...PAD0, nodes, edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "a", id: "e1" }, { f: "a", t: "b", id: "e2" }] });
  const exp = { e0: [154, 36, 242, 36], e1: [246, 50, 158, 50], e2: [154, 64, 242, 64] };
  for (const [id, v] of Object.entries(exp)) { const e = edgeOf(L, id); near(e.x1, v[0], TOL, id); near(e.y1, v[1], TOL, id); near(e.x2, v[2], TOL, id); near(e.y2, v[3], TOL, id); }
  const M = diagramLayout({ ...PAD0, nodes, edges: [{ f: "b", t: "a", id: "e0" }, { f: "a", t: "b", id: "e1" }, { f: "b", t: "a", id: "e2" }] });
  const exp2 = { e0: [246, 64, 158, 64], e1: [154, 50, 242, 50], e2: [246, 36, 158, 36] };
  for (const [id, v] of Object.entries(exp2)) { const e = edgeOf(M, id); near(e.x1, v[0], TOL, id); near(e.y1, v[1], TOL, id); near(e.x2, v[2], TOL, id); near(e.y2, v[3], TOL, id); }
});
test("VO-8 PO2 n = 2, default 14 and spec.parallel override", () => {
  const nodes = [GN("a", 0, 0), GN("b", 1, 0)];
  const edges = [{ f: "a", t: "b", id: "p0" }, { f: "a", t: "b", id: "p1" }];
  const L = diagramLayout({ ...PAD0, nodes, edges });
  near(edgeOf(L, "p0").y1, 43); near(edgeOf(L, "p1").y1, 57);
  const W = diagramLayout({ ...PAD0, parallel: 20, nodes, edges });
  near(edgeOf(W, "p0").y1, 40); near(edgeOf(W, "p1").y2, 60);
});
test("VO-8 PO3 via and points edges are excluded from the bundle (C-21)", () => {
  const nodes = [GN("a", 0, 0), GN("b", 1, 0)];
  const L = diagramLayout({ ...PAD0, nodes, edges: [
    { f: "a", t: "b", id: "v", via: [[0.5, 1]] },
    { f: "a", t: "b", id: "p0" },
    { f: "a", t: "b", id: "p1" },
    { f: "a", t: "b", id: "px", points: [[100, 50], [300, 50]] },
  ] });
  near(edgeOf(L, "p0").y1, 43); near(edgeOf(L, "p1").y1, 57);
  assertPts([pt(edgeOf(L, "v").pts[0])], [[124, 74]]);
  assertPts(edgeOf(L, "px").pts, [[100, 50], [300, 50]]);
  const S = diagramLayout({ ...PAD0, nodes, edges: [{ f: "a", t: "b", id: "v", via: [[0.5, 1]] }, { f: "a", t: "b", id: "lone" }] });
  near(edgeOf(S, "lone").y1, 50); near(edgeOf(S, "lone").y2, 50);
});
test("VO-8 PO5 reversed edge in an n = 2 bundle is offset on the side given by the first edge's normal", () => {
  const L = diagramLayout({ ...PAD0, nodes: [GN("a", 0, 0), GN("b", 1, 0)], edges: [{ f: "a", t: "b", id: "f" }, { f: "b", t: "a", id: "r" }] });
  const r = edgeOf(L, "r");
  near(r.y1, 57); near(r.y2, 57); near(r.x1, 246); near(r.x2, 158);
  near(edgeOf(L, "f").y1, 43);
});
test("VO-8 PO6 label point of an offset edge is the half-length point of its shifted polyline", () => {
  const L = diagramLayout({ ...PAD0, nodes: [GN("a", 0, 0), GN("b", 1, 0)], edges: [{ f: "a", t: "b", id: "p0" }, { f: "a", t: "b", id: "p1" }] });
  near(edgeOf(L, "p0").lx, 198); near(edgeOf(L, "p0").ly, 43);
  near(edgeOf(L, "p1").lx, 198); near(edgeOf(L, "p1").ly, 57);
  const ux = 200 / Math.hypot(200, 100);
  const D = diagramLayout({ ...PAD0, nodes: [GN("a", 0, 0), GN("b", 1, 1)], edges: [
    { f: "a", t: "b", id: "h0", shape: "ortho", from: "right", to: "left" },
    { f: "a", t: "b", id: "h1", shape: "ortho", from: "right", to: "left" },
  ] });
  for (const [id, o] of [["h0", -7], ["h1", 7]]) {
    const dy = o * ux, half = polyHalf([[154, 50 + dy], [198, 50 + dy], [198, 150 + dy], [242, 150 + dy]]);
    near(edgeOf(D, id).lx, half[0], TOL, id); near(edgeOf(D, id).ly, half[1], TOL, id);
  }
});
test("VO-8 PO4 ortho/curve add only the tangent component of the offset to the side points", () => {
  const vNodes = [GN("a", 0, 0), GN("b", 0, 1)];
  const V = diagramLayout({ ...PAD0, nodes: vNodes, edges: [{ f: "a", t: "b", id: "o0", shape: "ortho" }, { f: "a", t: "b", id: "o1", shape: "ortho" }] });
  assertPts(edgeOf(V, "o0").pts, [[107, 74], [107, 122]]);
  assertPts(edgeOf(V, "o1").pts, [[93, 74], [93, 122]]);
  const dNodes = [GN("a", 0, 0), GN("b", 1, 1)];
  const len = Math.hypot(200, 100), ux = 200 / len, uy = 100 / len; // nu = (-uy, ux)
  const D = diagramLayout({ ...PAD0, nodes: dNodes, edges: [
    { f: "a", t: "b", id: "h0", shape: "ortho", from: "right", to: "left" },
    { f: "a", t: "b", id: "h1", shape: "ortho", from: "right", to: "left" },
  ] });
  for (const [id, o] of [["h0", -7], ["h1", 7]]) {
    const dy = o * ux;
    assertPts(edgeOf(D, id).pts, [[154, 50 + dy], [198, 50 + dy], [198, 150 + dy], [242, 150 + dy]]);
  }
  const T = diagramLayout({ ...PAD0, nodes: dNodes, edges: [
    { f: "a", t: "b", id: "t0", shape: "ortho", from: "bottom", to: "top" },
    { f: "a", t: "b", id: "t1", shape: "ortho", from: "bottom", to: "top" },
  ] });
  for (const [id, o] of [["t0", -7], ["t1", 7]]) {
    const dx = o * -uy;
    assertPts(edgeOf(T, id).pts, [[100 + dx, 74], [100 + dx, 98], [300 + dx, 98], [300 + dx, 122]]);
  }
  const C = diagramLayout({ ...PAD0, nodes: dNodes, edges: [
    { f: "a", t: "b", id: "c0", shape: "curve", from: "right", to: "left" },
    { f: "a", t: "b", id: "c1", shape: "curve", from: "right", to: "left" },
  ] });
  for (const [id, o] of [["c0", -7], ["c1", 7]]) {
    const dy = o * ux;
    assertPts(edgeOf(C, id).pts, [[154, 50 + dy], [242, 150 + dy]]);
  }
});

// ---------- VO-9 nested zones ----------
const zspec = (zones) => ({ cols: 6, rows: 4, cell: [200, 100], node: [100, 40], nodes: [{ id: "n", c: 0, r: 0 }], edges: [], zones });
const zbox = (z) => [z.x, z.y, z.w, z.h];
const assertBox = (z, exp, msg) => exp.forEach((v, i) => near(zbox(z)[i], v, TOL, `${msg} [${i}]`));
test("VO-9 ZN1 root zone uses the legacy inset", () => {
  const L = diagramLayout(zspec([{ id: "root", c0: 0, r0: 0, c1: 3, r1: 2 }]));
  assertBox(L.zones[0], [26, 26, 788, 288], "root");
  assert.equal(L.zones[0].depth, 0);
  assert.equal(L.zones[0].parent, null);
});
test("VO-9 ZN2/ZN3/ZN5 child inset 16, grandchild inset 26 with labelled middle zone, unlabelled root does not push", () => {
  const L = diagramLayout(zspec([
    { id: "root", c0: 0, r0: 0, c1: 3, r1: 2 },
    { id: "child", parent: "root", c0: 1, r0: 0, c1: 2, r1: 1, l: "child" },
    { id: "grand", parent: "child", c0: 1, r0: 0, c1: 2, r1: 1 },
  ]));
  assertBox(L.zones[1], [236, 36, 368, 168], "child (ZN2, ZN5)");
  assert.equal(L.zones[1].depth, 1);
  assert.equal(L.zones[1].parent, "root");
  assertBox(L.zones[2], [246, 62, 348, 132], "grandchild (ZN3, ZN4 on child label)");
  assert.equal(L.zones[2].depth, 2);
  assert.equal(L.zones[2].parent, "child");
  assert.deepEqual(L.zones.map((z) => z.id), ["root", "child", "grand"]);
});
test("VO-9 ZN4 child is pushed below a labelled parent", () => {
  const L = diagramLayout(zspec([
    { id: "root", c0: 0, r0: 0, c1: 3, r1: 2, l: "root" },
    { id: "child", parent: "root", c0: 1, r0: 0, c1: 2, r1: 1 },
  ]));
  assertBox(L.zones[1], [236, 52, 368, 152], "child");
  assert.ok(L.zones[1].y >= L.zones[0].y + 26);
});
test("VO-9 ZN6 child extending past the parent is clipped to the parent's inner box", () => {
  const L = diagramLayout(zspec([
    { id: "root", c0: 0, r0: 0, c1: 1, r1: 1 },
    { id: "child", parent: "root", c0: 1, r0: 1, c1: 3, r1: 2 },
  ]));
  assertBox(L.zones[0], [26, 26, 388, 188], "root");
  assertBox(L.zones[1], [236, 136, 168, 68], "child clipped");
});
test("VO-9 ZN7 pixel zones (no inset) and pixel child clipped to labelled parent", () => {
  const L = diagramLayout(zspec([
    { id: "root", x: 30, y: 40, w: 200, h: 100, l: "p" },
    { id: "kid", parent: "root", x: 50, y: 60, w: 300, h: 200 },
  ]));
  assertBox(L.zones[0], [50, 60, 200, 100], "pixel root");
  assertBox(L.zones[1], [70, 86, 170, 64], "pixel child");
  assert.equal(L.zones[1].depth, 1);
});
test("VO-9 ZN9 child listed before its parent, parent referenced by default id", () => {
  const L = diagramLayout(zspec([
    { id: "kid", parent: "z1", c0: 1, r0: 0, c1: 2, r1: 1 },
    { c0: 0, r0: 0, c1: 3, r1: 2, l: "p" },
  ]));
  assert.deepEqual(L.zones.map((z) => z.id), ["kid", "z1"]);
  assertBox(L.zones[0], [236, 52, 368, 152], "kid");
  assertBox(L.zones[1], [26, 26, 788, 288], "parent");
  assert.equal(L.zones[0].parent, "z1");
  assert.equal(L.zones[0].depth, 1);
  assert.equal(L.zones[1].depth, 0);
});
test("VO-9 ZN10 grandchild is clipped against the parent's final (clipped) box", () => {
  const L = diagramLayout(zspec([
    { id: "root", c0: 0, r0: 0, c1: 3, r1: 2, l: "root" },
    { id: "mid", parent: "root", c0: 1, r0: 0, c1: 2, r1: 1 },
    { id: "grand", parent: "mid", c0: 1, r0: 0, c1: 2, r1: 1 },
  ]));
  assertBox(L.zones[1], [236, 52, 368, 152], "mid clipped");
  assertBox(L.zones[2], [246, 62, 348, 132], "grand against clipped mid");
});
test("VO-9 ZN11 child exceeding the parent on the left is clipped at P.x + 10", () => {
  const L = diagramLayout(zspec([
    { id: "root", c0: 1, r0: 0, c1: 3, r1: 2 },
    { id: "kid", parent: "root", c0: 0, r0: 0, c1: 2, r1: 1 },
  ]));
  assertBox(L.zones[0], [226, 26, 588, 288], "root");
  assertBox(L.zones[1], [236, 36, 368, 168], "kid clipped left");
});
test("VO-9 ZN8 default ids are z<index>, parent defaults to null, output keeps input order", () => {
  const L = diagramLayout(zspec([
    { c0: 0, r0: 0, c1: 0, r1: 0 },
    { id: "k", c0: 1, r0: 0, c1: 1, r1: 0 },
    { c0: 2, r0: 0, c1: 2, r1: 0 },
  ]));
  assert.deepEqual(L.zones.map((z) => z.id), ["z0", "k", "z2"]);
  for (const z of L.zones) assert.equal(z.parent, null);
});

// ---------- VO-10 multi-line, pixel input, label point ----------
const MLN = (n) => diagramLayout({ pad: 0, cell: [200, 100], node: [100, 60], nodes: [{ id: "n", c: 0, r: 0, ...n }], edges: [] }).nodes.n;
test("VO-10 ML1 multi-line l grows the box (C-11)", () => {
  const n = MLN({ l: "가\n나\n다" });
  assert.deepEqual(Array.from(n.lines), ["가", "나", "다"]);
  assert.deepEqual(Array.from(n.sub), []);
  near(n.h, 78);
  assert.deepEqual(Array.from(MLN({}).lines), ["n"]);
  near(MLN({ l: "한 줄" }).h, 60);
});
test("VO-10 ML2 multi-line s grows the box", () => {
  const n = MLN({ l: "단일", s: "x\ny" });
  assert.deepEqual(Array.from(n.lines), ["단일"]);
  assert.deepEqual(Array.from(n.sub), ["x", "y"]);
  near(n.h, 74);
});
test("VO-10 ML3 explicit h wins over the automatic height", () => {
  near(MLN({ l: "가\n나\n다", h: 30 }).h, 30);
  near(MLN({ l: "가\n나\n다", h: 200 }).h, 200);
});
test("VO-10 PX1 pixel node position is P(x, y)", () => {
  const L = diagramLayout({ node: [100, 40], nodes: [{ id: "p", x: 30, y: 40 }, { id: "q", x: 300, y: 40, w: 60, h: 20 }], edges: [] });
  const p = L.nodes.p;
  near(p.cx, 50); near(p.cy, 60); near(p.x, 0); near(p.y, 40); near(p.w, 100); near(p.h, 40);
  const q = L.nodes.q;
  near(q.cx, 320); near(q.x, 290); near(q.y, 50); near(q.w, 60); near(q.h, 20);
});
test("VO-10 PX2 points with straight: anchors P(points), from/to/via ignored", () => {
  const L = diagramLayout({ node: [100, 40], nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 300 }], edges: [{ f: "a", t: "b", id: "pe", points: [[10, 10], [100, 10], [100, 80]], from: "top", to: "bottom", via: [[3, 3]] }] });
  const e = L.edges[0];
  assertPts(e.pts, [[30, 30], [120, 30], [120, 100]]);
  assertD(e.d, ["M", 30, 30, "L", 120, 30, "L", 120, 100]);
  near(e.x1, 30); near(e.y1, 30); near(e.x2, 120); near(e.y2, 100);
  const half = polyHalf([[30, 30], [120, 30], [120, 100]]);
  near(e.lx, half[0]); near(e.ly, half[1]);
});
test("VO-10 PX3 points with ortho: free·free elbows and corner arcs", () => {
  const L = diagramLayout({ node: [100, 40], nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 300 }], edges: [{ f: "a", t: "b", shape: "ortho", points: [[0, 0], [100, 50], [200, 50]] }] });
  const e = L.edges[0];
  const exp = [[20, 20], [120, 20], [120, 70], [220, 70]];
  assertPts(e.pts, exp);
  assertD(e.d, orthoD(exp, 10));
});
test("VO-10 PX4 width/height grow to include pixel nodes and pixel zones", () => {
  const spec = {
    nodes: [{ id: "g", c: 0, r: 0 }, { id: "p", x: 400, y: 10, w: 100, h: 40 }],
    zones: [{ id: "pz", x: 30, y: 200, w: 100, h: 80 }], edges: [],
  };
  const L = diagramLayout(spec);
  near(L.width, 490); // pixel node cx 420 + 50 + 20 beats 2*20 + 210
  near(L.height, 320); // pixel zone (pad + y) + h + pad = 320 beats 2*20 + 120
  const T = diagramLayout({ nodes: [{ id: "g", c: 0, r: 0 }, { id: "p", x: 10, y: 600, w: 100, h: 60 }], edges: [] });
  near(T.width, 250); // grid term 2*20 + 210 beats pixel cx 80 + 50... = 150
  near(T.height, 670); // pixel cy 620 + 30 + 20 beats 2*20 + 120
});
test("VO-10 PX4 zone-dominated width and height use (pad + x) + w + pad", () => {
  const W = diagramLayout({ nodes: [{ id: "g", c: 0, r: 0 }], zones: [{ id: "pz", x: 600, y: 10, w: 100, h: 50 }], edges: [] });
  near(W.width, 740); near(W.height, 160);
  const H = diagramLayout({ nodes: [{ id: "g", c: 0, r: 0 }], zones: [{ id: "pz", x: 10, y: 500, w: 50, h: 100 }], edges: [] });
  near(H.width, 250); near(H.height, 640);
});
test("VO-10 ML4 empty l falls back to the node id, empty s gives no sub lines", () => {
  const n = MLN({ l: "", s: "" });
  assert.deepEqual(Array.from(n.lines), ["n"]);
  assert.deepEqual(Array.from(n.sub), []);
  near(n.h, 60);
});
test("VO-10 PX6 width and height fall back to 2*pad when no term is larger", () => {
  const E0 = diagramLayout({ nodes: [], edges: [] });
  near(E0.width, 40); near(E0.height, 40);
  const N = diagramLayout({ nodes: [{ id: "n", x: -100, y: -100 }], edges: [] });
  near(N.width, 40); near(N.height, 40);
  const P = diagramLayout({ pad: 30, nodes: [{ id: "n", x: -100, y: -100 }], edges: [] });
  near(P.width, 60); near(P.height, 60);
});
test("VO-10 PX5 spec.width/height take priority", () => {
  const L = diagramLayout({ width: 100, height: 50, nodes: [{ id: "g", c: 0, r: 0 }, { id: "p", x: 400, y: 400 }], edges: [] });
  near(L.width, 100); near(L.height, 50);
});
test("VO-10 LB1 ortho label is at half the polyline length", () => {
  const e = one(zNodes, ORTHO({ from: "right", to: "left" }));
  near(e.lx, 248); near(e.ly, 150);
  const f = one([PN("a", 100, 100), PN("b", 400, 300)], ORTHO({ from: "bottom", to: "left" }));
  near(f.lx, 133); near(f.ly, 300);
});
test("VO-10 LB2 curve label is at half the curve length within 1.5px", () => {
  const e1 = one([PN("a", 100, 100), PN("b", 400, 300)], { f: "a", t: "b", shape: "curve", from: "right", to: "top" });
  const h1 = curveHalf(curveRef([[154, 100], [400, 272]], NORMAL.right, NORMAL.top));
  near(e1.lx, h1[0], 1.5, "CV1 lx"); near(e1.ly, h1[1], 1.5, "CV1 ly");
  const e2 = one([PN("a", 100, 100), PN("b", 600, 300)], { f: "a", t: "b", shape: "curve", from: "right", to: "left", via: [[1, 2]] });
  const h2 = curveHalf(curveRef([[154, 100], [300, 250], [542, 300]], NORMAL.right, NORMAL.left));
  near(e2.lx, h2[0], 1.5, "CV2 lx"); near(e2.ly, h2[1], 1.5, "CV2 ly");
});

// ---------- VO-11 errors ----------
const E = (nodes, edges, zones) => () => diagramLayout({ ...PAD0, nodes, edges, zones });
const AB = [GN("a", 0, 0), GN("b", 1, 0)];
test("VO-11 ER1 edge points to a missing node; message names the edge", () => {
  assert.throws(E(AB, [{ f: "a", t: "b" }, { id: "badedge", f: "a", t: "zz" }]), (err) => err.message.includes("badedge"));
  assert.throws(E(AB, [{ f: "nope", t: "b" }]), (err) => err.message.includes("nope>b") || err.message.includes("0"));
});
test("VO-11 ER2 self loop", () => {
  assert.throws(E(AB, [{ f: "a", t: "a" }]));
});
test("VO-11 ER3 node without position", () => {
  assert.throws(E([GN("a", 0, 0), { id: "lost" }], []), (err) => err.message.includes("lost"));
});
test("VO-11 ER4 invalid from/to side", () => {
  assert.throws(E(AB, [{ id: "E4", f: "a", t: "b", from: "middle" }]), (err) => err.message.includes("E4"));
  assert.throws(E(AB, [{ id: "E4b", f: "a", t: "b", to: "center" }]), (err) => err.message.includes("E4b"));
});
test("VO-11 ER5 invalid shape", () => {
  assert.throws(E(AB, [{ id: "E5", f: "a", t: "b", shape: "zigzag" }]), (err) => err.message.includes("E5"));
});
test("VO-11 ER6 points array shorter than 2", () => {
  assert.throws(E(AB, [{ f: "a", t: "b", points: [[1, 1]] }]));
  assert.throws(E(AB, [{ f: "a", t: "b", points: [] }]));
});
test("VO-11 ER7 zone parent does not exist", () => {
  assert.throws(E(AB, [], [{ id: "k", parent: "nope", c0: 0, r0: 0, c1: 1, r1: 1 }]));
});
test("VO-11 ER8 zone parent cycle", () => {
  assert.throws(E(AB, [], [{ id: "x", parent: "y", c0: 0, r0: 0, c1: 1, r1: 1 }, { id: "y", parent: "x", c0: 0, r0: 0, c1: 1, r1: 1 }]));
  assert.throws(E(AB, [], [{ id: "s", parent: "s", c0: 0, r0: 0, c1: 1, r1: 1 }]));
});
test("VO-11 ER9 duplicate zone id", () => {
  assert.throws(E(AB, [], [{ id: "d", c0: 0, r0: 0, c1: 0, r1: 0 }, { id: "d", c0: 1, r0: 0, c1: 1, r1: 0 }]));
});
test("VO-11 ER10 child zone with empty intersection names the zone", () => {
  assert.throws(E(AB, [], [{ id: "root", c0: 0, r0: 0, c1: 0, r1: 0 }, { id: "kid", parent: "root", c0: 2, r0: 0, c1: 2, r1: 0 }]), (err) => err.message.includes("kid"));
});

test("VO-11 ER10b child disjoint vertically only", () => {
  assert.throws(E(AB, [], [{ id: "root", c0: 0, r0: 0, c1: 0, r1: 0 }, { id: "kidv", parent: "root", c0: 0, r0: 2, c1: 0, r1: 2 }]), (err) => err.message.includes("kidv"));
});
test("VO-11 ER10c touching child: intersection width 0 and height 0", () => {
  const root = { id: "r", x: 0, y: 0, w: 100, h: 100 };
  assert.throws(E(AB, [], [root, { id: "kidw", parent: "r", x: 90, y: 0, w: 50, h: 50 }]), (err) => err.message.includes("kidw"));
  assert.throws(E(AB, [], [root, { id: "kidh", parent: "r", x: 0, y: 90, w: 50, h: 50 }]), (err) => err.message.includes("kidh"));
});
test("VO-11 ER11 zone with neither a full grid nor a full pixel field set", () => {
  assert.throws(E(AB, [], [{ id: "half", c0: 0, r0: 0, c1: 1 }]), (err) => err.message.includes("half"));
  assert.throws(E(AB, [], [{ id: "halfpx", x: 0, y: 0, w: 10 }]), (err) => err.message.includes("halfpx"));
  assert.throws(E(AB, [], [{ id: "none" }]), (err) => err.message.includes("none"));
  assert.throws(E(AB, [], [{ id: "mix", c0: 0, r0: 0, x: 5, y: 5 }]), (err) => err.message.includes("mix"));
});

// ---------- VO-12 random properties ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randomSpec(rnd) {
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[ri(0, arr.length - 1)];
  const SIDES = ["top", "right", "bottom", "left"];
  const nodes = [];
  const n = ri(2, 8);
  for (let i = 0; i < n; i++) {
    const node = rnd() < 0.5 ? { id: "n" + i, c: ri(0, 5), r: ri(0, 4) + (rnd() < 0.3 ? 0.5 : 0) } : { id: "n" + i, x: ri(0, 1000), y: ri(0, 600) };
    if (rnd() < 0.3) node.w = ri(40, 200);
    if (rnd() < 0.3) node.h = ri(20, 120);
    if (rnd() < 0.3) node.l = "줄" + i + "\n둘째";
    if (rnd() < 0.2) node.s = "부제\n둘";
    nodes.push(node);
  }
  const coincide = rnd() < 0.15;
  if (coincide) { const src = nodes[0]; for (const k of ["c", "r", "x", "y"]) delete nodes[1][k]; for (const k of ["c", "r", "x", "y"]) if (src[k] != null) nodes[1][k] = src[k]; }
  const edges = [];
  const m = ri(1, 10);
  for (let i = 0; i < m; i++) {
    let f, t;
    if (coincide && i === 0) { f = nodes[0].id; t = nodes[1].id; }
    else if (edges.length && rnd() < 0.3 && !edges[edges.length - 1].via && !edges[edges.length - 1].points) {
      const prev = edges[edges.length - 1];
      [f, t] = rnd() < 0.5 ? [prev.f, prev.t] : [prev.t, prev.f];
    } else { f = pick(nodes).id; do t = pick(nodes).id; while (t === f); }
    const e = { f, t, shape: pick(["straight", "ortho", "curve"]) };
    if (rnd() < 0.4) e.from = pick(SIDES);
    if (rnd() < 0.4) e.to = pick(SIDES);
    if (rnd() < 0.35) {
      const k = ri(1, 2), via = [];
      while (via.length < k) { const v = [ri(0, 5), ri(0, 4)]; if (!via.some((u) => u[0] === v[0] && u[1] === v[1])) via.push(v); }
      e.via = via;
    }
    if (rnd() < 0.1) {
      const k = ri(2, 4), pts = [];
      while (pts.length < k) { const p = [ri(0, 1000), ri(0, 600)]; if (!pts.length || pts[pts.length - 1][0] !== p[0] || pts[pts.length - 1][1] !== p[1]) pts.push(p); }
      e.points = pts;
    }
    if (rnd() < 0.3) e.radius = pick([0, 4, 10, 30]);
    edges.push(e);
  }
  const zones = [];
  if (rnd() < 0.6) {
    zones.push({ id: "z_root", c0: 0, r0: 0, c1: 5, r1: 4, ...(rnd() < 0.5 ? { l: "root" } : {}) });
    if (rnd() < 0.6) {
      const c0 = ri(1, 2), c1 = ri(3, 4), r0 = ri(0, 1), r1 = ri(2, 3);
      zones.push({ id: "z_child", parent: "z_root", c0, r0, c1, r1, ...(rnd() < 0.5 ? { l: "child" } : {}) });
      if (rnd() < 0.5) {
        const g0 = ri(c0, c1), g1 = ri(g0, c1), h0 = ri(r0, r1), h1 = ri(h0, r1);
        zones.push({ id: "z_grand", parent: "z_child", c0: g0, r0: h0, c1: g1, r1: h1 });
      }
    }
  }
  if (rnd() < 0.3) zones.push({ id: "z_pix", x: ri(0, 800), y: ri(0, 500), w: ri(50, 300), h: ri(50, 300), l: "p" });
  const spec = { nodes, edges, zones };
  if (rnd() < 0.3) spec.parallel = ri(4, 24);
  return { spec, coincide };
}
function finiteProblems(L) {
  const bad = [];
  const num = (v, what) => { if (typeof v !== "number" || !Number.isFinite(v)) bad.push(what + "=" + v); };
  num(L.width, "width"); num(L.height, "height");
  for (const [id, n] of Object.entries(L.nodes)) for (const k of ["x", "y", "w", "h", "cx", "cy"]) num(n[k], `node ${id}.${k}`);
  for (const e of L.edges) {
    for (const k of ["x1", "y1", "x2", "y2", "lx", "ly"]) num(e[k], `edge ${e.id}.${k}`);
    Array.from(e.pts).forEach((p, i) => pt(p).forEach((v, j) => num(v, `edge ${e.id}.pts[${i}][${j}]`)));
    if (/NaN|Infinity/.test(e.d)) bad.push(`edge ${e.id}.d=${e.d}`);
  }
  for (const z of L.zones) for (const k of ["x", "y", "w", "h"]) num(z[k], `zone ${z.id}.${k}`);
  return bad;
}
test("VO-12 RN1-RN7 500 seeded random specs (seed 20261015)", () => {
  const rnd = mulberry32(20261015);
  const viol = { RN1: [], RN2: [], RN3: [], RN4: [], RN5: [], RN6: [], RN7: [] };
  let coincideCount = 0;
  for (let i = 0; i < 500; i++) {
    const { spec, coincide } = randomSpec(rnd);
    let L;
    try { L = diagramLayout(spec); } catch (err) { viol.RN1.push(`spec ${i} threw ${err.message}`); continue; }
    const bad = finiteProblems(L);
    if (bad.length) viol.RN1.push(`spec ${i}: ${bad[0]}`);
    spec.edges.forEach((es, k) => {
      const e = L.edges[k], p = ptsOf(e);
      if (es.shape === "ortho") for (let j = 1; j < p.length; j++) if (!axisAligned(p[j - 1], p[j], 0.5 + 1e-6)) viol.RN2.push(`spec ${i} edge ${k} seg ${j}: ${JSON.stringify(p)}`);
      const tk = tokens(e.d);
      const okStart = tk[0] === "M" && Math.abs(tk[1] - p[0][0]) <= 0.01 && Math.abs(tk[2] - p[0][1]) <= 0.01;
      const okEnd = Math.abs(tk[tk.length - 2] - p[p.length - 1][0]) <= 0.01 && Math.abs(tk[tk.length - 1] - p[p.length - 1][1]) <= 0.01;
      if (!okStart || !okEnd) viol.RN3.push(`spec ${i} edge ${k}: d=${e.d} pts=${JSON.stringify(p)}`);
      const same = Math.abs(e.x1 - p[0][0]) <= TOL && Math.abs(e.y1 - p[0][1]) <= TOL && Math.abs(e.x2 - p[p.length - 1][0]) <= TOL && Math.abs(e.y2 - p[p.length - 1][1]) <= TOL;
      if (!same) viol.RN4.push(`spec ${i} edge ${k}`);
    });
    for (const z of L.zones) {
      if (z.parent == null) continue;
      const P = L.zones.find((q) => q.id === z.parent), lab = spec.zones.find((q) => q.id === P.id).l;
      const [x0, y0, x1, y1] = [P.x + 10, P.y + (lab ? 26 : 10), P.x + P.w - 10, P.y + P.h - 10];
      if (z.x < x0 - TOL || z.y < y0 - TOL || z.x + z.w > x1 + TOL || z.y + z.h > y1 + TOL) viol.RN6.push(`spec ${i} zone ${z.id}`);
    }
    spec.edges.forEach((es, k) => {
      if (es.shape === "curve") return;
      const e = L.edges[k], p = ptsOf(e);
      let best = Infinity;
      for (let j = 1; j < p.length; j++) {
        const [ax, ay, bx, by] = [...p[j - 1], ...p[j]], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
        const u = l2 ? Math.max(0, Math.min(1, ((e.lx - ax) * dx + (e.ly - ay) * dy) / l2)) : 0;
        best = Math.min(best, Math.hypot(e.lx - (ax + u * dx), e.ly - (ay + u * dy)));
      }
      if (!(best <= TOL)) viol.RN7.push(`spec ${i} edge ${k} dist ${best}`);
    });
    if (coincide) coincideCount++;
    if (coincide && bad.length) viol.RN5.push(`spec ${i}: ${bad[0]}`);
  }
  assert.ok(coincideCount > 20, "generator produced coincident-centre specs: " + coincideCount);
  for (const [k, v] of Object.entries(viol)) assert.equal(v.length, 0, `${k} violations (${v.length}): ${v.slice(0, 3).join(" | ")}`);
});

test("VO-12 RN5 C-20 coincident centres: straight edge uses direction (1, 0) and stays finite", () => {
  for (const spec of [
    { ...PAD0, nodes: [GN("a", 1, 1), GN("b", 1, 1)], edges: [{ f: "a", t: "b" }] },
    { ...PAD0, nodes: [PN("a", 300, 200), PN("b", 300, 200)], edges: [{ f: "a", t: "b" }] },
  ]) {
    const L = diagramLayout(spec), e = L.edges[0];
    assert.deepEqual(finiteProblems(L), []);
    const a = L.nodes.a, b = L.nodes.b;
    near(e.x1, a.cx + 50 + 4); near(e.y1, a.cy);
    near(e.x2, b.cx + 50 + 8); near(e.y2, b.cy);
  }
  for (const shape of ["ortho", "curve"]) {
    const L = diagramLayout({ ...PAD0, nodes: [PN("a", 300, 200), PN("b", 300, 200)], edges: [{ f: "a", t: "b", shape }] });
    assert.deepEqual(finiteProblems(L), []);
  }
  const P = diagramLayout({ ...PAD0, nodes: [PN("a", 300, 200), PN("b", 300, 200)], edges: [{ f: "a", t: "b", id: "x" }, { f: "b", t: "a", id: "y" }] });
  assert.deepEqual(finiteProblems(P), []);
});

// ---------- VO-13 performance ----------
test("VO-13 PF1 QR-1 spec (60 nodes, 120 edges, 6 zones): median of 5 runs <= 20 ms", () => {
  const nodes = Array.from({ length: 60 }, (_, i) => ({ id: "n" + i, c: i % 10, r: Math.floor(i / 10), l: "노드 " + i }));
  const shapes = ["straight", "ortho", "curve"];
  const edges = Array.from({ length: 120 }, (_, i) => {
    const f = i % 60, t = (f + 1 + ((i * 7) % 58)) % 60;
    const e = { f: "n" + f, t: "n" + t, shape: shapes[i % 3] };
    if (i % 4 === 0) e.via = [[(i * 3) % 10, (i * 5) % 6]];
    if (i % 5 === 0 && e.shape !== "straight") { e.from = "right"; e.to = "left"; }
    return e;
  });
  const zones = [
    { id: "z0", c0: 0, r0: 0, c1: 9, r1: 5, l: "root" },
    { id: "z1", parent: "z0", c0: 1, r0: 0, c1: 4, r1: 3, l: "a" },
    { id: "z2", parent: "z1", c0: 2, r0: 0, c1: 3, r1: 2 },
    { id: "z3", parent: "z0", c0: 5, r0: 1, c1: 8, r1: 4, l: "b" },
    { id: "z4", parent: "z3", c0: 6, r0: 2, c1: 7, r1: 3 },
    { id: "z5", c0: 0, r0: 0, c1: 1, r1: 1 },
  ];
  const spec = { nodes, edges, zones };
  diagramLayout(spec);
  const times = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    diagramLayout(spec);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  assert.ok(times[2] <= 20, `median ${times[2].toFixed(2)} ms (runs ${times.map((t) => t.toFixed(2)).join(", ")})`);
});
