import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Spec: agent-docs/spec-logs/145518ce2564d0c0-diagram-auto-layout.md v3. elk produces the coordinates, so no elk number is
// hard-coded: every expectation is a spec property (overlap, containment, axis alignment, endpoint gaps, sizes) computed
// here from the output boxes, or a formula from the spec (FR-1 heights, FR-7 sizes).

const kit = (f) => readFileSync(new URL("../skills/learn-to-tell/kit/" + f, import.meta.url), "utf8");
function load(withElk) {
  const c = { console: { info() {}, warn() {} }, setTimeout, clearTimeout };
  c.global = c;
  vm.createContext(c);
  for (const f of [...(withElk ? ["vendor/elk.bundled.js"] : []), "vendor/d3.min.js", "ltt.js", "ltt-parts.js"]) {
    vm.runInContext(kit(f), c, { filename: f });
  }
  return c.LTT;
}
const LTT = load(true);
const auto = (spec) => LTT.autoLayout(spec);
// structuredClone (not JSON) so undefined-valued keys survive and key-presence checks see the real shape.
const J = (v) => structuredClone(v);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// ---------- reference helpers ----------
const near = (a, b, tol, msg = "") => assert.ok(typeof a === "number" && Math.abs(a - b) <= tol, `${msg} expected ${b} ±${tol}, got ${a}`);
const nbox = (n) => ({ x0: n.x - n.w / 2, y0: n.y - n.h / 2, x1: n.x + n.w / 2, y1: n.y + n.h / 2 });
const zbox = (z) => ({ x0: z.x, y0: z.y, x1: z.x + z.w, y1: z.y + z.h });
const distTo = (p, b) => Math.hypot(Math.max(b.x0 - p[0], 0, p[0] - b.x1), Math.max(b.y0 - p[1], 0, p[1] - b.y1));
const strictlyInside = (p, b, m = 0.5) => p[0] > b.x0 + m && p[0] < b.x1 - m && p[1] > b.y0 + m && p[1] < b.y1 - m;
const overlaps = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 1e-6 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 1e-6;
const within = (inner, outer, tol = 1e-6) => inner.x0 >= outer.x0 - tol && inner.y0 >= outer.y0 - tol && inner.x1 <= outer.x1 + tol && inner.y1 <= outer.y1 + tol;
const innerBox = (z) => ({ x0: z.x + 10, y0: z.y + (z.l ? 26 : 10), x1: z.x + z.w - 10, y1: z.y + z.h - 10 });
const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
const lineCount = (s) => (s ? String(s).split("\n").length : 0);
function expectH(n, nd) {
  if (n.h != null) return n.h;
  const lc = n.l ? lineCount(n.l) : 1, sc = lineCount(n.s);
  return lc >= 2 || sc >= 2 ? Math.max(nd[1], 24 + 18 * lc + 16 * sc) : nd[1];
}

function assertFinite(v, path = "out") {
  if (typeof v === "number") assert.ok(Number.isFinite(v), `${path} is finite, got ${v}`);
  else if (Array.isArray(v)) v.forEach((x, i) => assertFinite(x, `${path}[${i}]`));
  else if (v && typeof v === "object") for (const k of Object.keys(v)) assertFinite(v[k], `${path}.${k}`);
}
function assertNoOverlap(out, tag = "") {
  const b = out.nodes.map(nbox);
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
    assert.ok(!overlaps(b[i], b[j]), `${tag} nodes ${out.nodes[i].id} and ${out.nodes[j].id} overlap`);
  }
}
function assertAligned(out, tag = "") {
  for (const e of out.edges) {
    assert.ok(Array.isArray(e.points) && e.points.length >= 2, `${tag} edge ${e.id} has >= 2 points`);
    e.points.forEach((p) => assert.ok(Array.isArray(p) && p.length === 2, `${tag} point is [x, y]`));
    for (let i = 1; i < e.points.length; i++) {
      const a = e.points[i - 1], b = e.points[i];
      assert.ok(Math.abs(a[0] - b[0]) <= 0.5 || Math.abs(a[1] - b[1]) <= 0.5, `${tag} edge ${e.id} segment ${i} not axis aligned: ${JSON.stringify([a, b])}`);
    }
  }
}
// FR-6 (v2): >= 3 points: start gap = min(4, m0), end gap = min(8, mn) with m0/mn the OUTPUT first/last segment
// lengths (±1px). 2 points: L = output length + both gaps, start gap = min(4, L/6), end gap = min(8, L/3), remaining >= L/2.
function assertEndpoints(out, tag = "", strict = false) {
  const N = byId(out.nodes);
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  for (const e of out.edges) {
    const P = e.points, n = P.length, S = nbox(N[e.f]), T = nbox(N[e.t]);
    const ds = distTo(P[0], S), dt = distTo(P[n - 1], T);
    const w = `${tag} edge ${e.id}`;
    assert.ok(!strictlyInside(P[0], S), `${w} starts inside its source box`);
    assert.ok(!strictlyInside(P[n - 1], T), `${w} ends inside its target box`);
    assert.ok(distTo(P[1], S) >= ds - 1e-6, `${w} first segment points away from the source`);
    assert.ok(distTo(P[n - 2], T) >= dt - 1e-6, `${w} last segment points toward the target`);
    if (n >= 3) {
      near(ds, Math.min(4, len(P[0], P[1])), 1, `${w} start gap vs min(4, m0)`);
      near(dt, Math.min(8, len(P[n - 2], P[n - 1])), 1, `${w} end gap vs min(8, mn)`);
    } else {
      const m = len(P[0], P[1]), L = m + ds + dt;
      near(ds, Math.min(4, L / 6), 1, `${w} 2-point start gap vs min(4, L/6), L=${L}`);
      near(dt, Math.min(8, L / 3), 1, `${w} 2-point end gap vs min(8, L/3), L=${L}`);
      assert.ok(m >= L / 2 - 1, `${w} remaining ${m} >= L/2 (L=${L})`);
    }
    if (strict) {
      near(ds, 4, 1, `${w} start gap`);
      near(dt, 8, 1, `${w} end gap`);
    }
  }
}
function assertDirection(out, dir = "RIGHT") {
  const N = byId(out.nodes), k = dir === "DOWN" ? "y" : "x";
  for (const e of out.edges) assert.ok(N[e.f][k] < N[e.t][k], `edge ${e.id}: ${e.f}.${k} < ${e.t}.${k} (${dir})`);
}
function assertZones(out, spec, tag = "") {
  const groups = spec.groups ?? [];
  const children = (id) => groups.filter((g) => g.parent === id);
  const nonEmpty = (g) => spec.nodes.some((n) => n.group === g.id) || children(g.id).some(nonEmpty);
  const expected = groups.filter(nonEmpty);
  assert.deepEqual(out.zones.map((z) => z.id), expected.map((g) => g.id), `${tag} zone ids/order`);
  const Z = byId(out.zones);
  expected.forEach((g, i) => {
    const z = out.zones[i];
    assert.equal(z.parent, g.parent ?? null, `${tag} zone ${g.id} parent`);
    assert.ok(own(z, "parent"), `${tag} zone ${g.id} always has parent`);
    for (const key of ["l", "k"]) {
      if (g[key] !== undefined) assert.equal(z[key], g[key], `${tag} zone ${g.id} ${key}`);
      else assert.ok(!own(z, key), `${tag} zone ${g.id} has no ${key} key`);
    }
    if (g.parent != null) assert.ok(within(zbox(z), innerBox(Z[g.parent])), `${tag} zone ${g.id} inside parent ${g.parent} inner box`);
  });
  for (const n of out.nodes) {
    if (n.group != null) assert.ok(within(nbox(n), innerBox(Z[n.group])), `${tag} node ${n.id} inside zone ${n.group} inner box`);
    else for (const z of out.zones) assert.ok(!overlaps(nbox(n), zbox(z)), `${tag} ungrouped node ${n.id} overlaps zone ${z.id}`);
  }
}
function assertSize(out, spec, tag = "") {
  const pad = spec.pad ?? 20;
  assert.equal(out.pad, pad, `${tag} pad`);
  for (const key of ["label", "maxWidth"]) {
    if (spec[key] === undefined) assert.ok(!own(out, key), `${tag} no ${key} key when absent`);
    else assert.deepEqual(J(out[key]), J(spec[key]), `${tag} ${key} passed through`);
  }
  const boxes = [...out.nodes.map(nbox), ...out.zones.map(zbox)];
  assert.ok(boxes.length > 0);
  const minX = Math.min(...boxes.map((b) => b.x0)), minY = Math.min(...boxes.map((b) => b.y0));
  assert.ok(minX >= -1e-6 && minY >= -1e-6, `${tag} boxes start at >= 0 (${minX}, ${minY})`);
  near(out.width, Math.max(...boxes.map((b) => b.x1)) + 2 * pad, 1e-6, `${tag} width`);
  near(out.height, Math.max(...boxes.map((b) => b.y1)) + 2 * pad, 1e-6, `${tag} height`);
}
function assertFields(out, spec, tag = "") {
  const nd = spec.node ?? [164, 60];
  assert.deepEqual(out.nodes.map((n) => n.id), spec.nodes.map((n) => n.id), `${tag} node order`);
  spec.nodes.forEach((n, i) => {
    const o = out.nodes[i];
    for (const k of Object.keys(n)) assert.deepEqual(J(o[k]), J(n[k]), `${tag} node ${n.id}.${k} preserved`);
    near(o.w, n.w ?? nd[0], 1e-9, `${tag} node ${n.id}.w`);
    near(o.h, expectH(n, nd), 1e-9, `${tag} node ${n.id}.h`);
  });
  assert.equal(out.edges.length, spec.edges.length, `${tag} edge count`);
  spec.edges.forEach((e, i) => {
    const o = out.edges[i];
    for (const k of Object.keys(e)) assert.deepEqual(J(o[k]), J(e[k]), `${tag} edge ${i}.${k} preserved`);
    assert.equal(o.shape, "ortho");
    assert.equal(o.radius, e.radius ?? spec.radius ?? 10);
  });
}
function checkAll(out, spec, { strict = false, tag = "" } = {}) {
  assertFinite(out);
  assertFields(out, spec, tag);
  assertNoOverlap(out, tag);
  assertAligned(out, tag);
  assertEndpoints(out, tag, strict);
  assertZones(out, spec, tag);
  assertSize(out, spec, tag);
}

// ---------- fixtures ----------
const N = (id, o = {}) => ({ id, l: id, ...o });
const chain = (ids, o = {}) => ({
  ...o,
  nodes: ids.map((i) => N(i)),
  edges: ids.slice(1).map((t, i) => ({ f: ids[i], t, id: "e" + i })),
});
function fanSpec() {
  // Tree fork (n_i <- n_floor((i-1)/2), 23 edges) plus a join node n23 with 7 more in-edges: 24 nodes, 30 edges.
  const nodes = Array.from({ length: 24 }, (_, i) => N("n" + i));
  const edges = [];
  for (let i = 1; i < 24; i++) edges.push({ f: "n" + Math.floor((i - 1) / 2), t: "n" + i, id: "e" + edges.length });
  for (let i = 16; i < 23; i++) edges.push({ f: "n" + i, t: "n23", id: "e" + edges.length });
  return { nodes, edges };
}

// ---------- VO-1 ----------
test("VO-1 EP1 chain RIGHT: x increases, no overlap, aligned points, gaps 4±1 / 8±1, layer gap >= spacing[0]", async () => {
  const spec = chain(["a", "b", "c"]);
  const out = J(await auto(spec));
  checkAll(out, spec, { strict: true });
  assertDirection(out, "RIGHT");
  for (let i = 1; i < out.nodes.length; i++) assert.ok(nbox(out.nodes[i]).x0 - nbox(out.nodes[i - 1]).x1 >= 72 - 0.5, "layer gap >= 72");
  const wide = J(await auto({ ...chain(["a", "b", "c"]), spacing: [120, 36] }));
  for (let i = 1; i < wide.nodes.length; i++) assert.ok(nbox(wide.nodes[i]).x0 - nbox(wide.nodes[i - 1]).x1 >= 120 - 0.5, "layer gap >= 120");
});
test("VO-1 EP2 chain DOWN: y increases, no overlap, aligned points, gaps 4±1 / 8±1, layer gap >= spacing[0]", async () => {
  const spec = { ...chain(["a", "b", "c"]), direction: "DOWN" };
  const out = J(await auto(spec));
  checkAll(out, spec, { strict: true });
  assertDirection(out, "DOWN");
  for (let i = 1; i < out.nodes.length; i++) assert.ok(nbox(out.nodes[i]).y0 - nbox(out.nodes[i - 1]).y1 >= 72 - 0.5, "layer gap >= 72");
});
test("VO-1 EP3 fork/join 24 nodes 30 edges RIGHT: no overlap, direction, aligned, endpoint gaps, node spacing", async () => {
  const spec = fanSpec();
  const out = J(await auto(spec));
  assert.equal(out.nodes.length, 24);
  assert.equal(out.edges.length, 30);
  checkAll(out, spec);
  assertDirection(out, "RIGHT");
  const b = out.nodes.map(nbox);
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
    if (Math.min(b[i].x1, b[j].x1) - Math.max(b[i].x0, b[j].x0) > 1e-6) {
      const gap = Math.max(b[i].y0, b[j].y0) - Math.min(b[i].y1, b[j].y1);
      assert.ok(gap >= 36 - 0.5, `same-layer nodes ${out.nodes[i].id}/${out.nodes[j].id} gap ${gap} >= spacing[1]`);
    }
  }
});

test("VO-1 EP3b fork/join DOWN with spacing [72, 50]: same-layer nodes are >= spacing[1] apart", async () => {
  const spec = { ...fanSpec(), direction: "DOWN", spacing: [72, 50] };
  const out = J(await auto(spec));
  checkAll(out, spec);
  assertDirection(out, "DOWN");
  const b = out.nodes.map(nbox);
  let pairs = 0;
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
    if (Math.min(b[i].y1, b[j].y1) - Math.max(b[i].y0, b[j].y0) > 1e-6) {
      pairs++;
      const gap = Math.max(b[i].x0, b[j].x0) - Math.min(b[i].x1, b[j].x1);
      assert.ok(gap >= 50 - 0.5, `same-layer nodes ${out.nodes[i].id}/${out.nodes[j].id} gap ${gap} >= 50`);
    }
  }
  assert.ok(pairs > 0, "graph has same-layer pairs");
});

// ---------- VO-2 ----------
test("VO-2 GR1 one-level group: zone id/parent/l/k, members inside inner box", async () => {
  const spec = {
    nodes: [N("a", { group: "g1" }), N("b", { group: "g1" }), N("c")],
    edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "c", id: "e1" }],
    groups: [{ id: "g1", l: "Group One", k: "accent" }],
  };
  const out = J(await auto(spec));
  assert.equal(out.zones.length, 1);
  assert.equal(out.zones[0].id, "g1");
  assert.equal(out.zones[0].parent, null);
  assert.equal(out.zones[0].l, "Group One");
  assert.equal(out.zones[0].k, "accent");
  checkAll(out, spec);
});
test("VO-2 GR2 two-level group: g2 inside g1 inner box, parent relation, member containment, zone order", async () => {
  const spec = {
    nodes: [N("a", { group: "g2" }), N("b", { group: "g2" }), N("c", { group: "g1" }), N("d")],
    edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "c", id: "e1" }, { f: "c", t: "d", id: "e2" }],
    groups: [{ id: "g1", l: "Outer" }, { id: "g2", l: "Inner", k: "bad", parent: "g1" }],
  };
  const out = J(await auto(spec));
  assert.deepEqual(out.zones.map((z) => [z.id, z.parent]), [["g1", null], ["g2", "g1"]]);
  checkAll(out, spec);
});
test("VO-2 GR3 nodes outside groups never overlap any zone", async () => {
  const spec = {
    nodes: [N("o1"), N("o2"), N("o3"), N("a", { group: "g1" }), N("b", { group: "g1" }), N("c", { group: "g2" }), N("o4")],
    edges: [
      { f: "o1", t: "a", id: "e0" }, { f: "o2", t: "a", id: "e1" }, { f: "a", t: "b", id: "e2" }, { f: "o3", t: "c", id: "e3" },
      { f: "b", t: "o4", id: "e4" }, { f: "c", t: "o4", id: "e5" }, { f: "o1", t: "o3", id: "e6" },
    ],
    groups: [{ id: "g1", l: "One" }, { id: "g2", l: "Two" }],
  };
  const out = J(await auto(spec));
  assert.equal(out.nodes.filter((n) => n.group == null).length, 4);
  checkAll(out, spec);
});
test("VO-2 GR4 edges crossing groups: points are absolute (endpoints sit at the real node boxes)", async () => {
  const spec = {
    nodes: [N("o1"), N("a", { group: "g1" }), N("b", { group: "g2" }), N("c", { group: "g2" }), N("o2")],
    edges: [
      { f: "o1", t: "a", id: "e0" }, { f: "a", t: "b", id: "e1" }, { f: "b", t: "c", id: "e2" },
      { f: "c", t: "o2", id: "e3" }, { f: "o1", t: "o2", id: "e4" }, { f: "o1", t: "c", id: "e5" },
    ],
    groups: [{ id: "g1", l: "A" }, { id: "g2", l: "B", parent: "g1" }],
  };
  for (const direction of ["RIGHT", "DOWN"]) {
    const s = { ...spec, direction };
    const out = J(await auto(s));
    checkAll(out, s, { tag: direction });
    const Nd = byId(out.nodes);
    for (const e of out.edges) {
      assert.ok(distTo(e.points[0], nbox(Nd[e.f])) <= 5, `${direction} ${e.id} start near source`);
      assert.ok(distTo(e.points[e.points.length - 1], nbox(Nd[e.t])) <= 9, `${direction} ${e.id} end near target`);
    }
  }
});
test("VO-2 GR5 empty groups (alone, or as child of a non-empty group) make no zone; remaining zones keep input order", async () => {
  const spec = {
    nodes: [N("a", { group: "g2" }), N("b", { group: "g1" }), N("c")],
    edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "c", id: "e1" }],
    groups: [{ id: "gEmpty", l: "none" }, { id: "g2", l: "Two" }, { id: "gKid", l: "kid", parent: "g1" }, { id: "g1", l: "One" }],
  };
  const out = J(await auto(spec));
  assert.deepEqual(out.zones.map((z) => z.id), ["g2", "g1"]);
  checkAll(out, spec);
});
test("VO-2 GR6 label-less group: top margin 12 (labelled: 30), other sides 12, inside the 10 / 26 inner box", async () => {
  const spec = {
    nodes: [N("a", { group: "plain" }), N("b", { group: "titled" }), N("c")],
    edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "c", id: "e1" }],
    groups: [{ id: "plain" }, { id: "titled", l: "Titled" }],
  };
  const out = J(await auto(spec));
  checkAll(out, spec);
  const Z = byId(out.zones), Nd = byId(out.nodes);
  for (const [gid, nid, top] of [["plain", "a", 12], ["titled", "b", 30]]) {
    const z = zbox(Z[gid]), n = nbox(Nd[nid]);
    near(n.y0 - z.y0, top, 0.5, `${gid} top margin`);
    near(n.x0 - z.x0, 12, 0.5, `${gid} left margin`);
    near(z.x1 - n.x1, 12, 0.5, `${gid} right margin`);
    near(z.y1 - n.y1, 12, 0.5, `${gid} bottom margin`);
  }
});

test("VO-2 GR2b group holding only child groups (no direct nodes) still makes a zone containing the child zone", async () => {
  const spec = {
    nodes: [N("a", { group: "kid" }), N("b", { group: "kid" }), N("c")],
    edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "c", id: "e1" }],
    groups: [{ id: "shell", l: "Shell" }, { id: "kid", l: "Kid", parent: "shell" }],
  };
  const out = J(await auto(spec));
  assert.deepEqual(out.zones.map((z) => [z.id, z.parent]), [["shell", null], ["kid", "shell"]]);
  checkAll(out, spec);
});
test("VO-8 C-13 cyclic graphs (a>b>a and a 3-cycle) lay out without rejection: finite, aligned, FR-6 gaps", async () => {
  const two = { nodes: [N("a"), N("b")], edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "a", id: "e1" }] };
  const three = { nodes: [N("a"), N("b"), N("c")], edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "c", id: "e1" }, { f: "c", t: "a", id: "e2" }] };
  for (const [name, base] of [["2-cycle", two], ["3-cycle", three]]) {
    for (const direction of ["RIGHT", "DOWN"]) {
      const spec = { ...base, direction };
      const out = J(await auto(spec));
      checkAll(out, spec, { tag: `${name} ${direction}` });
    }
  }
});

// ---------- VO-3 ----------
test("VO-3 BV1 one node, no edges: edges [], zones [], width = w + 2*pad", async () => {
  const out = J(await auto({ nodes: [N("solo")], edges: [] }));
  assert.equal(out.nodes.length, 1);
  assert.deepEqual(out.edges, []);
  assert.deepEqual(out.zones, []);
  near(out.nodes[0].w, 164, 1e-9);
  near(out.nodes[0].h, 60, 1e-9);
  near(out.width, 164 + 40, 1e-6, "width");
  near(out.height, 60 + 40, 1e-6, "height");
  const custom = J(await auto({ nodes: [N("solo")], edges: [], node: [100, 40], pad: 7 }));
  near(custom.width, 100 + 14, 1e-6, "custom width");
  near(custom.height, 40 + 14, 1e-6, "custom height");
  assert.equal(custom.pad, 7);
});
test("VO-3 BV2 label height: 1 line stays node[1]; 2+ lines use 24 + 18*l + 16*s", async () => {
  const nd = [164, 40];
  const spec = {
    node: nd,
    nodes: [
      N("one"), // 1 line, no sub: 40
      N("oneOne", { s: "sub" }), // 1 + 1 lines: base 40 (formula would give 58 but is not applicable below 2 lines)
      N("two", { l: "a\nb" }), // 24 + 36 = 60
      N("sub2", { l: "x", s: "p\nq" }), // 24 + 18 + 32 = 74
      N("both", { l: "a\nb\nc", s: "p\nq" }), // 24 + 54 + 32 = 110
    ],
    edges: [],
  };
  const out = J(await auto(spec));
  const h = Object.fromEntries(out.nodes.map((n) => [n.id, n.h]));
  assert.deepEqual(h, { one: 40, oneOne: 40, two: 60, sub2: 74, both: 110 });
  assertNoOverlap(out);
  const d = J(await auto({ nodes: [N("m", { l: "a\nb\nc" }), N("n")], edges: [] }));
  assert.deepEqual(d.nodes.map((n) => n.h), [78, 60]);
});
test("VO-3 BV2 max(): formula below node[1] keeps node[1]; formula above node[1] wins (node [164, 100])", async () => {
  const spec = {
    node: [164, 100],
    nodes: [
      N("small", { l: "a\nb" }), // 24 + 36 = 60 < 100 -> 100
      N("smallSub", { l: "x", s: "p\nq" }), // 24 + 18 + 32 = 74 < 100 -> 100
      N("big", { l: "a\nb\nc\nd\ne", s: "p\nq" }), // 24 + 90 + 32 = 146 > 100 -> 146
    ],
    edges: [],
  };
  const out = J(await auto(spec));
  assert.deepEqual(Object.fromEntries(out.nodes.map((n) => [n.id, n.h])), { small: 100, smallSub: 100, big: 146 });
  assertNoOverlap(out);
});
test("VO-3 BV3 explicit h and w win over the formula and node default", async () => {
  const spec = { nodes: [N("a", { l: "a\nb\nc", s: "p\nq", h: 100, w: 200 }), N("b", { h: 30 }), N("c")], edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "c", id: "e1" }] };
  const out = J(await auto(spec));
  assert.deepEqual(out.nodes.map((n) => [n.w, n.h]), [[200, 100], [164, 30], [164, 60]]);
  checkAll(out, spec);
});
test("VO-3 BV4 short last segment (spacing [10,10]) is halved without reversing; long segments keep the full 4 / 8", async () => {
  const spec = {
    nodes: ["a", "b", "c", "d"].map((i) => N(i)),
    edges: [{ f: "a", t: "b", id: "e0" }, { f: "a", t: "c", id: "e1" }, { f: "b", t: "d", id: "e2" }, { f: "c", t: "d", id: "e3" }, { f: "a", t: "d", id: "e4" }],
    spacing: [10, 10],
  };
  const out = J(await auto(spec));
  assertFinite(out);
  assertNoOverlap(out);
  assertAligned(out);
  assertEndpoints(out);
  const Nd = byId(out.nodes);
  for (const e of out.edges) {
    if (e.points.length !== 2) continue;
    const [p, q] = e.points, S = nbox(Nd[e.f]), T = nbox(Nd[e.t]);
    const full = T.x0 - S.x1;
    assert.ok(q[0] >= p[0] - 1e-6, `edge ${e.id} single segment not reversed (${p[0]} -> ${q[0]})`);
    assert.ok(distTo(q, T) <= Math.max(full, 0) + 1e-6, `edge ${e.id} shortened end gap <= full gap ${full}`);
    assert.ok(distTo(p, S) <= Math.max(full, 0) + 1e-6, `edge ${e.id} shortened start gap <= full gap ${full}`);
  }
  const long = J(await auto(chain(["a", "b", "c"])));
  assertEndpoints(long, "long", true);
});
test("VO-3 BV5 radius: default 10, explicit value passed through", async () => {
  const base = chain(["a", "b", "c"]);
  const d = J(await auto(base));
  assert.ok(d.edges.every((e) => e.radius === 10));
  const r = J(await auto({ ...base, radius: 4 }));
  assert.ok(r.edges.every((e) => e.radius === 4));
  const per = J(await auto({ ...base, radius: 4, edges: [{ ...base.edges[0], radius: 7 }, base.edges[1]] }));
  assert.deepEqual(per.edges.map((e) => e.radius), [7, 4], "edge radius wins over spec radius");
  const perDefault = J(await auto({ ...base, edges: [{ ...base.edges[0], radius: 7 }, base.edges[1]] }));
  assert.deepEqual(perDefault.edges.map((e) => e.radius), [7, 10]);
});
test("VO-3 FP1 extra node/edge fields kept verbatim; pad, label, maxWidth passed through", async () => {
  const spec = {
    nodes: [
      N("a", { s: "sub", k: "accent", icon: "db", flaw: "leaks", group: "g" }),
      N("b", { s: "sub b", k: "bad", icon: "cpu", flaw: "slow", group: "g" }),
    ],
    edges: [{ f: "a", t: "b", id: "link", l: "calls", lo: 0.4, k: "bad", dash: true, both: true, arrow: false, radius: 3 }],
    groups: [{ id: "g", l: "G", k: "accent" }],
    pad: 13, label: "Figure caption", maxWidth: 777, radius: 5,
  };
  const out = J(await auto(spec));
  assertFields(out, spec);
  assert.equal(out.pad, 13);
  assert.equal(out.label, "Figure caption");
  assert.equal(out.maxWidth, 777);
  assert.equal(out.nodes[0].group, "g");
  assert.equal(out.edges[0].radius, 3, "edge radius wins over spec radius 5");
  assertSize(out, spec);
});
test("VO-3 FP3 absent label/maxWidth give no such keys; zone l/k only when the group has them; zone parent always present", async () => {
  const spec = {
    nodes: [N("a", { group: "bare" }), N("b", { group: "kid" }), N("c", { group: "titled" })],
    edges: [{ f: "a", t: "b", id: "e0" }, { f: "b", t: "c", id: "e1" }],
    groups: [{ id: "bare" }, { id: "top" }, { id: "kid", parent: "top" }, { id: "titled", l: "T", k: "bad" }],
  };
  const out = J(await auto(spec));
  assert.ok(!own(out, "label") && !own(out, "maxWidth"), Object.keys(out).join());
  const Z = byId(out.zones);
  assert.deepEqual(out.zones.map((z) => z.id), ["bare", "top", "kid", "titled"]);
  assert.ok(!own(Z.bare, "l") && !own(Z.bare, "k"), "no l/k keys on a bare zone: " + Object.keys(Z.bare).join());
  assert.ok(own(Z.top, "parent") && own(Z.bare, "parent"));
  assert.equal(Z.bare.parent, null);
  assert.equal(Z.kid.parent, "top");
  assert.equal(Z.top.parent, null);
  assert.equal(Z.titled.l, "T");
  assert.equal(Z.titled.k, "bad");
  assertZones(out, spec);
  assertSize(out, spec);
});
test("VO-3 FP2 input order preserved for nodes, edges and zones (ids deliberately unsorted)", async () => {
  const spec = {
    nodes: [N("z", { group: "gb" }), N("m"), N("a", { group: "ga" }), N("q", { group: "gb" })],
    edges: [{ f: "q", t: "a", id: "e9" }, { f: "z", t: "m", id: "e3" }, { f: "m", t: "a", id: "e5" }],
    groups: [{ id: "gb", l: "B" }, { id: "ga", l: "A" }],
  };
  const out = J(await auto(spec));
  assert.deepEqual(out.nodes.map((n) => n.id), ["z", "m", "a", "q"]);
  assert.deepEqual(out.edges.map((e) => e.id), ["e9", "e3", "e5"]);
  assert.deepEqual(out.zones.map((z) => z.id), ["gb", "ga"]);
});

// ---------- VO-4 ----------
const richSpec = () => ({
  nodes: [N("a", { group: "g2", s: "s\nt", k: "accent" }), N("b", { group: "g1" }), N("c"), N("d", { group: "g2" })],
  edges: [{ f: "a", t: "b", id: "e0", l: "x" }, { f: "b", t: "c", id: "e1" }, { f: "d", t: "c", id: "e2", dash: true }, { f: "a", t: "d", id: "e3" }],
  groups: [{ id: "g1", l: "One" }, { id: "g2", l: "Two", parent: "g1" }],
  direction: "DOWN", spacing: [50, 20], pad: 9, radius: 6, label: "cap", maxWidth: 500,
});
test("VO-4 DT1 two calls with the same spec give deep-equal output", async () => {
  const spec = richSpec();
  const a = J(await auto(spec)), b = J(await auto(spec));
  assert.deepStrictEqual(a, b);
  assert.deepStrictEqual(J(await auto(richSpec())), a);
});
test("VO-4 DT2 input spec is unchanged by the call", async () => {
  const spec = richSpec(), before = J(spec);
  await auto(spec);
  assert.deepStrictEqual(J(spec), before);
  const keys = (o) => Object.keys(o).sort();
  assert.deepStrictEqual(keys(spec), keys(before));
  spec.nodes.forEach((n, i) => assert.deepStrictEqual(keys(n), keys(before.nodes[i])));
});

// ---------- VO-5 ----------
async function interop(spec, tag) {
  const out = await auto(spec);
  const o = J(out), pad = spec.pad ?? 20;
  let L;
  assert.doesNotThrow(() => { L = LTT.diagramLayout(out); }, `${tag} diagramLayout accepts the output`);
  for (const n of o.nodes) {
    const m = L.nodes[n.id];
    assert.ok(m, `${tag} node ${n.id} laid out`);
    near(m.cx, pad + n.x, 1e-6, `${tag} ${n.id}.cx`);
    near(m.cy, pad + n.y, 1e-6, `${tag} ${n.id}.cy`);
    near(m.w, n.w, 1e-6, `${tag} ${n.id}.w`);
    near(m.h, n.h, 1e-6, `${tag} ${n.id}.h`);
  }
  assert.equal(L.edges.length, o.edges.length);
  assert.equal(L.zones.length, o.zones.length);
  for (const z of o.zones) {
    const m = L.zones.find((q) => q.id === z.id);
    assert.ok(m, `${tag} zone ${z.id} laid out`);
    near(m.x, pad + z.x, 1e-6, `${tag} ${z.id}.x`);
    near(m.y, pad + z.y, 1e-6, `${tag} ${z.id}.y`);
    near(m.w, z.w, 1e-6, `${tag} ${z.id}.w (not clipped)`);
    near(m.h, z.h, 1e-6, `${tag} ${z.id}.h (not clipped)`);
  }
  assertSize(o, spec, tag);
  near(L.width, o.width, 1e-6, `${tag} layout width`);
  near(L.height, o.height, 1e-6, `${tag} layout height`);
}
test("VO-5 IO1 ungrouped output feeds diagramLayout: centre = pad + x/y, width/height per FR-7", async () => {
  await interop(fanSpec(), "IO1");
});
test("VO-5 IO2 grouped output feeds diagramLayout: zone box = pad + x/y with unchanged w/h", async () => {
  await interop({ ...richSpec(), pad: 12 }, "IO2");
  await interop({ ...richSpec(), direction: "RIGHT" }, "IO2 default pad");
});

// ---------- VO-6 ----------
async function rejection(spec, check) {
  let p;
  assert.doesNotThrow(() => { p = auto(spec); }, "autoLayout must not throw synchronously");
  assert.equal(typeof (p && p.then), "function", "returns a Promise-like");
  await assert.rejects(p, (e) => {
    assert.ok(e && typeof e.message === "string", "rejects with an Error-like value");
    assert.ok(/Error$/.test(e.name), "error name " + e.name);
    check(e.message);
    return true;
  });
}
const base2 = () => ({ nodes: [N("a"), N("b")], edges: [{ f: "a", t: "b", id: "ok" }] });
test("VO-6 ER1 edge with a missing node rejects, message names the edge id or f>t", async () => {
  await rejection({ ...base2(), edges: [{ f: "a", t: "ghost", id: "e-bad" }] }, (m) => assert.ok(m.includes("e-bad") || m.includes("a>ghost"), m));
  await rejection({ ...base2(), edges: [{ f: "ghost", t: "b", id: "e-bad2" }] }, (m) => assert.ok(m.includes("e-bad2") || m.includes("ghost>b"), m));
});
test("VO-6 ER2 self loop (f === t) rejects", async () => {
  await rejection({ ...base2(), edges: [{ f: "a", t: "a", id: "loop" }] }, () => {});
});
test("VO-6 ER3 duplicate node id rejects, message names the id", async () => {
  await rejection({ nodes: [N("a"), N("dupnode"), N("dupnode")], edges: [] }, (m) => assert.ok(m.includes("dupnode"), m));
});
test("VO-6 ER4 duplicate group id rejects, message names the id", async () => {
  await rejection({ ...base2(), groups: [{ id: "dupgroup" }, { id: "dupgroup" }] }, (m) => assert.ok(m.includes("dupgroup"), m));
});
test("VO-6 ER5 node with an unknown group rejects, message names the group", async () => {
  await rejection({ nodes: [N("a", { group: "nogroup" }), N("b")], edges: [{ f: "a", t: "b", id: "e" }], groups: [{ id: "g1" }] }, (m) => assert.ok(m.includes("nogroup"), m));
});
test("VO-6 ER6 group with an unknown parent rejects, message names the parent", async () => {
  await rejection({ nodes: [N("a", { group: "g1" }), N("b")], edges: [{ f: "a", t: "b", id: "e" }], groups: [{ id: "g1", parent: "noparent" }] }, (m) => assert.ok(m.includes("noparent"), m));
});
test("VO-6 ER7 group parent cycle rejects (two-cycle and self-parent)", async () => {
  const nodes = [N("a", { group: "g1" }), N("b")], edges = [{ f: "a", t: "b", id: "e" }];
  await rejection({ nodes, edges, groups: [{ id: "g1", parent: "g2" }, { id: "g2", parent: "g1" }] }, () => {});
  await rejection({ nodes, edges, groups: [{ id: "g1", parent: "g1" }] }, () => {});
});
test("VO-6 ER8 direction outside RIGHT/DOWN rejects", async () => {
  for (const direction of ["LEFT", "right", "UP"]) await rejection({ ...base2(), direction }, () => {});
});

// ---------- VO-7 ----------
test("VO-7 NE1 without ELK the kit loads cleanly and diagramLayout still works", () => {
  let L;
  assert.doesNotThrow(() => { L = load(false); });
  assert.equal(typeof L.autoLayout, "function");
  const lay = L.diagramLayout({ pad: 0, cell: [200, 100], node: [100, 40], nodes: [{ id: "a", x: 50, y: 30 }, { id: "b", x: 250, y: 30 }], edges: [{ f: "a", t: "b", id: "e" }] });
  near(lay.nodes.a.cx, 50, 1e-6);
  near(lay.nodes.b.cx, 250, 1e-6);
  assert.equal(lay.edges.length, 1);
});
test("VO-7 NE2 without ELK autoLayout rejects (no sync throw) with a message naming elk.bundled.js", async () => {
  const L = load(false);
  let p;
  assert.doesNotThrow(() => { p = L.autoLayout(base2()); });
  assert.equal(typeof (p && p.then), "function");
  await assert.rejects(p, (e) => { assert.ok(String(e.message).includes("elk.bundled.js"), e.message); return true; });
});

// ---------- VO-8 ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function genGraph(r) {
  const n = 3 + Math.floor(r() * 23), ng = Math.floor(r() * 4);
  const groups = [];
  for (let g = 0; g < ng; g++) {
    const tops = groups.filter((x) => x.parent === undefined);
    const o = { id: "g" + g };
    if (r() < 0.75) o.l = "Group " + g;
    if (r() < 0.3) o.k = "accent";
    if (g > 0 && tops.length && r() < 0.5) o.parent = tops[Math.floor(r() * tops.length)].id;
    groups.push(o);
  }
  const nodes = [];
  for (let i = 0; i < n; i++) {
    const o = { id: "n" + i, l: r() < 0.2 ? "n" + i + "\nsecond" : "n" + i };
    if (r() < 0.2) o.s = r() < 0.3 ? "s1\ns2" : "sub";
    if (ng && r() < 0.65) o.group = groups[Math.floor(r() * ng)].id;
    nodes.push(o);
  }
  const cyclic = r() < 0.35, m = Math.floor(r() * 1.6 * n), seen = new Set(), edges = [];
  for (let k = 0; k < m * 3 && edges.length < m; k++) {
    let f = Math.floor(r() * n), t = Math.floor(r() * n);
    if (f === t) continue;
    if (!cyclic && f > t) [f, t] = [t, f];
    const key = f + ">" + t;
    if (seen.has(key)) continue;
    seen.add(key);
    const e = { f: "n" + f, t: "n" + t, id: "e" + edges.length };
    if (r() < 0.3) e.l = "lbl";
    edges.push(e);
  }
  return { nodes, edges, groups, direction: r() < 0.5 ? "RIGHT" : "DOWN" };
}
let rnMemo;
function randomRuns() {
  rnMemo ??= (async () => {
    const r = mulberry32(20261015), runs = [];
    for (let i = 0; i < 60; i++) {
      const spec = genGraph(r);
      runs.push({ i, spec, out: J(await auto(spec)) });
    }
    return runs;
  })();
  return rnMemo;
}
const forEachRun = async (fn) => {
  const runs = await randomRuns();
  assert.equal(runs.length, 60);
  for (const { i, spec, out } of runs) fn(out, spec, `graph#${i}`);
};
function hasCycle(spec) {
  const adj = {};
  for (const e of spec.edges) (adj[e.f] ??= []).push(e.t);
  const state = {};
  const visit = (u) => {
    state[u] = 1;
    for (const v of adj[u] ?? []) if (state[v] === 1 || (!state[v] && visit(v))) return true;
    state[u] = 2;
    return false;
  };
  return spec.nodes.some((n) => !state[n.id] && visit(n.id));
}
test("VO-8 generator coverage: >= 1 cyclic graph, both directions, groups present", async () => {
  const runs = await randomRuns();
  assert.ok(runs.some((r) => hasCycle(r.spec)), "a cyclic graph was generated");
  assert.ok(runs.some((r) => r.spec.direction === "DOWN") && runs.some((r) => r.spec.direction === "RIGHT"));
  assert.ok(runs.some((r) => r.spec.groups.length > 0));
});
test("VO-8 RN1 random graphs: no NaN/Infinity anywhere in the output", async () => {
  await forEachRun((out, _s, tag) => { assertFinite(out, tag); assert.ok(out.nodes.length >= 3); });
});
test("VO-8 RN2 random graphs: node boxes never overlap", async () => {
  await forEachRun((out, _s, tag) => assertNoOverlap(out, tag));
});
test("VO-8 RN3 random graphs: consecutive edge points are axis aligned (0.5px)", async () => {
  await forEachRun((out, _s, tag) => assertAligned(out, tag));
});
test("VO-8 RN4 random graphs: endpoint gaps follow FR-6 (4 / 8, only smaller on short segments, direction kept)", async () => {
  await forEachRun((out, _s, tag) => assertEndpoints(out, tag));
});
test("VO-8 RN5 random graphs: zones, members and child zones respect the inner-box containment; empty groups make no zone", async () => {
  await forEachRun((out, spec, tag) => assertZones(out, spec, tag));
});
test("VO-8 RN6 random graphs: width/height = max box edge + 2*pad, boxes start at >= 0", async () => {
  await forEachRun((out, spec, tag) => assertSize(out, spec, tag));
});

// ---------- VO-9 ----------
test("VO-9 PF1 30 nodes / 40 edges / 3 groups (2 levels): median of 3 calls (first discarded) <= 300 ms", async () => {
  const nodes = Array.from({ length: 30 }, (_, i) => N("n" + i, i < 8 ? { group: "g2" } : i < 14 ? { group: "g1" } : i < 20 ? { group: "g3" } : {}));
  const edges = [];
  for (let i = 0; i < 29; i++) edges.push({ f: "n" + i, t: "n" + (i + 1), id: "e" + edges.length });
  for (let i = 0; i < 11; i++) edges.push({ f: "n" + (i * 2), t: "n" + (i * 2 + 3), id: "e" + edges.length });
  assert.equal(edges.length, 40);
  const spec = { nodes, edges, groups: [{ id: "g1", l: "One" }, { id: "g2", l: "Two", parent: "g1" }, { id: "g3", l: "Three" }] };
  await auto(spec);
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    const out = await auto(spec);
    times.push(performance.now() - t0);
    assert.equal(out.nodes.length, 30);
  }
  times.sort((a, b) => a - b);
  assert.ok(times[1] <= 300, `median ${times[1].toFixed(1)} ms > 300 (samples ${times.map((t) => t.toFixed(1))})`);
});

// Labels are sized and placed by elk, so a labelled graph with cross-group and reversed edges must lay out with no
// label/node/edge collisions. The fixture is the knowledge graph of the earlier ontology gallery lesson (it had 18 before).
test("autoLayout: ontology knowledge graph has no label, node or edge collisions", async () => {
  const spec = JSON.parse(readFileSync(new URL("./fixtures/autolayout/ontology-kg.json", import.meta.url), "utf8"));
  const out = await auto(spec);
  assert.deepEqual(J(LTT.graphOverlaps(out)), []);
  for (const e of out.edges) if (e.l) assert.ok(Array.isArray(e.at), `edge ${e.f}>${e.t} has an elk label position`);
});

test("graphOverlaps: reports a label drawn on a node", () => {
  const found = LTT.graphOverlaps({ nodes: [{ id: "a", x: 50, y: 50 }, { id: "b", x: 400, y: 50 }, { id: "c", x: 225, y: 50, w: 60, h: 40 }],
    edges: [{ f: "a", t: "b", l: "label", at: [205, 30] }] });
  assert.ok(found.some((f) => f.kind === "label-node" && f.b === "c"));
  assert.ok(found.some((f) => f.kind === "edge-node" && f.b === "c"));
});
