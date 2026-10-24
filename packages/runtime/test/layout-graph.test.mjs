// VO-6 (FR-6, C-12..C-15) graph panel. Oracles: spec "graph" semantic decisions (direction, union layout fixed over t,
// at in the [0,1]² window with y up, centered/unscaled, graph-too-large) and own px formula for at.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LAYOUT, CORE, center, inside, overlapPairs, closePairs, oraclePx } from "./fixtures/m1.mjs";
import { input } from "./fixtures/helpers.mjs";

const { layoutFigure, dataToPx } = await import(LAYOUT);
const { load } = await import(CORE);
const close = (a, b, tol, msg = "") => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b} (tol ${tol})`);
const one = (frame, draw) => (api) => api.lesson(input({ figures: { f: api.figure(frame(api), draw(api)) } }));
const lay = (factory, o = {}) => layoutFigure(load(factory).input, "f", { viewport: "desktop", t: 0, step: 0, ...o });
const nodes = (fl) => fl.items.filter((i) => i.kind === "shape" && i.mark === "node").map((i) => ({ id: i.markId, box: i.bbox }));
const node = (fl, id) => fl.items.find((i) => i.kind === "shape" && i.mark === "node" && i.markId === id);
const texts = (fl) => fl.items.filter((i) => i.kind === "text").map((i) => ({ id: i.id, box: i.box }));
const BOX = (fl) => ({ x: 0, y: 0, width: fl.width, height: fl.height });

const SIX = (api, extra = {}) => [
  api.node("mine", "광산(리튬 원광 채굴)"), api.node("recycle", "폐배터리 재활용"), api.node("refine", "정련 공장"),
  api.node("cell", "배터리 셀 공장"), api.node("pack", "팩 조립 라인"), api.node("car", "완성차 공장"),
  api.edge("mine", "refine", { text: "원광", ...extra }), api.edge("recycle", "refine", { text: "회수 리튬", ...extra }),
  api.edge("refine", "cell", { text: "수산화리튬", ...extra }), api.edge("refine", "pack", { text: "긴급 직송", ...extra }),
  api.edge("cell", "car", { text: "셀 직납", ...extra }), api.edge("pack", "car", { text: "배터리 팩", ...extra }),
];
const CHAIN = [["mine", "refine"], ["recycle", "refine"], ["refine", "cell"], ["refine", "pack"], ["cell", "car"], ["pack", "car"]];
const EDGE_TEXTS = ["원광", "회수 리튬", "수산화리튬", "긴급 직송", "셀 직납", "배터리 팩"];

for (const [dir, axis, vp] of [["down", 1, "desktop"], ["down", 1, "mobile"], ["right", 0, "desktop"]]) {
  {
    test(`VO-6 C-12 layered ${dir} ${vp}: 6 nodes/6 edges, nodes and edge texts non-overlapping, inside, edges follow direction`, async () => {
      const fl = await lay(one((api) => api.graph({ layout: "layered", direction: dir, static: "s" }), (api) => () => SIX(api)), { viewport: vp });
      assert.deepEqual(fl.errors, []);
      assert.equal(fl.panels.length, 1);
      assert.equal(fl.panels[0].frame, "graph");
      assert.deepEqual(fl.panels[0].domain, { x: [0, 1], y: [0, 1] });
      const ns = nodes(fl);
      assert.equal(ns.length, 6);
      assert.deepEqual(overlapPairs(ns), []);
      assert.deepEqual(closePairs(texts(fl)), [], "texts ≥ 6 px apart");
      for (const n of [...ns, ...texts(fl)]) assert.ok(inside(n.box, BOX(fl)), `${n.id} inside`);
      const edgeTexts = fl.items.filter((i) => i.kind === "text" && i.mark === "edge").map((i) => ({ id: i.id, box: i.box }));
      assert.equal(edgeTexts.length, 6, "six edge texts");
      for (const tx of edgeTexts) for (const n of ns) assert.ok(!require_no_overlap(tx, n), `edge text ${tx.id} over node ${n.id}`);
      for (const [a, b] of CHAIN) assert.ok(center(node(fl, b).bbox)[axis] > center(node(fl, a).bbox)[axis], `${a} before ${b} along ${dir}`);
      assert.ok(fl.items.filter((i) => i.mark === "edge" && i.kind === "shape").length >= 6, "edge shapes");
      for (const t of EDGE_TEXTS) assert.ok(fl.items.some((i) => i.kind === "text" && i.lines.join(" ").replace(/\s+/g, "") === t.replace(/\s+/g, "")), `edge text ${t}`);
    });
  }
}
function require_no_overlap(a, b) {
  return a.box.x < b.box.x + b.box.width - 0.5 && b.box.x < a.box.x + a.box.width - 0.5 && a.box.y < b.box.y + b.box.height - 0.5 && b.box.y < a.box.y + a.box.height - 0.5;
}
test("VO-6 default direction is down (same as direction 'down')", async () => {
  const a = await lay(one((api) => api.graph({ layout: "layered", static: "s" }), (api) => () => SIX(api)));
  const b = await lay(one((api) => api.graph({ layout: "layered", direction: "down", static: "s" }), (api) => () => SIX(api)));
  assert.deepEqual(nodes(a), nodes(b));
});
for (const vp of ["desktop", "mobile"]) {
  test(`VO-6 tree ${vp}: root above children, children above grandchildren, no overlap, inside`, async () => {
    const fl = await lay(one((api) => api.graph({ layout: "tree", static: "s" }), (api) => () => [
      api.node("r", "납품 지연"), api.node("a", "원료 부족"), api.node("b", "공장 문제"), api.node("c", "운송 문제"),
      api.node("b1", "파업"), api.node("b2", "설비 화재"), api.node("c1", "항만 적체"),
      api.edge("r", "a"), api.edge("r", "b"), api.edge("r", "c"), api.edge("b", "b1"), api.edge("b", "b2"), api.edge("c", "c1"),
    ]), { viewport: vp });
    assert.deepEqual(fl.errors, []);
    const ns = nodes(fl);
    assert.equal(ns.length, 7);
    assert.deepEqual(overlapPairs(ns), []);
    for (const n of ns) assert.ok(inside(n.box, BOX(fl)));
    const y = (id) => center(node(fl, id).bbox)[1];
    for (const k of ["a", "b", "c"]) assert.ok(y(k) > y("r"));
    for (const [p, k] of [["b", "b1"], ["b", "b2"], ["c", "c1"]]) assert.ok(y(k) > y(p));
  });
}
test("VO-6 C-13 loop figure whose nodes grow 3 -> 6: node positions identical across samples (union layout)", async () => {
  const f = one((api) => api.graph({ layout: "layered", loop: { ms: 1000, span: [0, 3] } }), (api) => (m, t) => [
    api.node("g1", "주문"), api.node("g2", "생산 계획"), api.node("g3", "원료 구매"),
    t >= 1 && api.node("g4", "셀 생산"), t >= 2 && api.node("g5", "팩 조립"), t >= 2 && api.node("g6", "출하"),
    api.edge("g1", "g2"), api.edge("g2", "g3"), t >= 1 && api.edge("g3", "g4"), t >= 2 && api.edge("g4", "g5"), t >= 2 && api.edge("g5", "g6"),
  ]);
  const early = await lay(f, { t: 0 }), late = await lay(f, { t: 3 });
  assert.equal(nodes(early).length, 3);
  assert.equal(nodes(late).length, 6);
  for (const id of ["g1", "g2", "g3"]) assert.deepEqual(node(early, id).bbox, node(late, id).bbox, id);
  assert.deepEqual(early.panels[0].plot, late.panels[0].plot);
});
test("VO-6 steps graph: positions fixed across steps", async () => {
  const f = one((api) => api.graph({ layout: "layered", direction: "right", steps: ["a", "b"] }), (api) => (m, t, { step }) => [
    api.node("x", "원광"), api.node("y", "화학 처리"), step >= 1 && api.node("z", "양극재"), api.edge("x", "y"), step >= 1 && api.edge("y", "z"),
  ]);
  const a = await lay(f, { t: 0, step: 0 }), b = await lay(f, { t: 1, step: 1 });
  for (const id of ["x", "y"]) assert.deepEqual(node(a, id).bbox, node(b, id).bbox);
});
for (const vp of ["desktop", "mobile"]) {
  test(`VO-6 C-15 at [0,0] and [1,1] ${vp}: node centers at the window corners (y up), others laid out; edges to pinned nodes straight`, async () => {
    const fl = await lay(one((api) => api.graph({ layout: "layered", static: "s" }), (api) => () => [
      api.node("lo", "한국 셀 공장", { at: [0, 0] }), api.node("hi", "헝가리 팩 공장", { at: [1, 1] }), api.node("mid", "물류 허브", { at: [0.5, 0.5] }),
      api.node("free", "칠레 광산"), api.edge("free", "mid"), api.edge("mid", "lo"), api.edge("mid", "hi"),
      api.label([0.5, 0.15], "고정 위치", { id: "note" }),
    ]), { viewport: vp });
    assert.deepEqual(fl.errors, []);
    const P = fl.panels[0];
    for (const [id, p] of [["lo", [0, 0]], ["hi", [1, 1]], ["mid", [0.5, 0.5]]]) {
      const [cx, cy] = center(node(fl, id).bbox), [ex, ey] = oraclePx(P, p), [dx, dy] = dataToPx(P, p);
      close(cx, ex, 0.5, `${id} x`); close(cy, ey, 0.5, `${id} y`);
      close(dx, ex, 0.5); close(dy, ey, 0.5);
    }
    close(center(node(fl, "lo").bbox)[0], P.plot.x, 0.5); close(center(node(fl, "lo").bbox)[1], P.plot.y + P.plot.height, 0.5);
    assert.deepEqual(overlapPairs(nodes(fl)), []);
    for (const n of nodes(fl)) assert.ok(inside(n.box, BOX(fl)));
    const e = fl.items.find((i) => i.kind === "shape" && i.markId === "mid->lo");
    assert.ok(e && e.d, "edge path");
    assert.ok(!/[CQSTA]/i.test(e.d) && (e.d.match(/[LHV]/gi) ?? []).length <= 1, `straight edge to pinned node: ${e.d}`);
    const lab = fl.items.find((i) => i.kind === "text" && i.markId === "note");
    const [rx, ry] = oraclePx(P, [0.5, 0.15]);
    close(lab.ref[0], rx, 0.5); close(lab.ref[1], ry, 0.5);
  });
}
test("VO-6 layout not stretched: bounding box of the nodes centered in the figure area", async () => {
  const fl = await lay(one((api) => api.graph({ layout: "layered", direction: "right", static: "s" }), (api) => () => [api.node("a", "가"), api.node("b", "나"), api.edge("a", "b")]));
  const ns = nodes(fl);
  const x0 = Math.min(...ns.map((n) => n.box.x)), x1 = Math.max(...ns.map((n) => n.box.x + n.box.width));
  const y0 = Math.min(...ns.map((n) => n.box.y)), y1 = Math.max(...ns.map((n) => n.box.y + n.box.height));
  close((x0 + x1) / 2, fl.width / 2, 2, "centered x"); close((y0 + y1) / 2, fl.height / 2, 2, "centered y");
  assert.ok(x1 - x0 < fl.width * 0.8, "two small nodes are not stretched across the stage");
});
test("VO-6 overflow -> spacing shrinks and the graph still fits without error (6 one-letter nodes in a chain, right, mobile)", async () => {
  const fl = await lay(one((api) => api.graph({ layout: "layered", direction: "right", static: "s" }), (api) => () => [
    ...Array.from({ length: 6 }, (_, i) => api.node(`c${i}`, "가나다라마바"[i])), ...Array.from({ length: 5 }, (_, i) => api.edge(`c${i}`, `c${i + 1}`)),
  ]), { viewport: "mobile" });
  assert.deepEqual(fl.errors, []);
  assert.deepEqual(overlapPairs(nodes(fl)), []);
  for (const n of nodes(fl)) assert.ok(inside(n.box, BOX(fl)), n.id);
});
test("VO-6 C-14 60 long-text nodes on mobile -> graph-too-large at figures.f", async () => {
  const fl = await lay(one((api) => api.graph({ layout: "layered", static: "s" }), (api) => () => Array.from({ length: 60 }, (_, i) => api.node(`n${i}`, `아주 긴 이름을 가진 공급망 노드 번호 ${i}`))), { viewport: "mobile" });
  const e = fl.errors.filter((x) => x.rule === "graph-too-large");
  assert.equal(e.length, 1, JSON.stringify(fl.errors));
  assert.ok(e[0].path.startsWith("figures.f"));
  assert.ok(e[0].message.length <= 300);
});
test("VO-6 edge text sits at its edge: text ref on the straight segment midpoint between pinned nodes", async () => {
  const fl = await lay(one((api) => api.graph({ layout: "layered", static: "s" }), (api) => () => [
    api.node("a", "출발", { at: [0.1, 0.5] }), api.node("b", "도착", { at: [0.9, 0.5] }), api.edge("a", "b", { text: "해상 운송" }),
  ]));
  const t = fl.items.find((i) => i.kind === "text" && i.markId === "a->b");
  const [ax, ay] = center(node(fl, "a").bbox), [bx, by] = center(node(fl, "b").bbox);
  assert.ok(t.ref, "edge text has ref");
  close(t.ref[0], (ax + bx) / 2, 1); close(t.ref[1], (ay + by) / 2, 1);
});
test("VO-6 graph layout deterministic", async () => {
  const f = one((api) => api.graph({ layout: "layered", static: "s" }), (api) => () => SIX(api));
  assert.deepEqual(await lay(f), await lay(f));
});

test("VO-7 edge directed defaults to false: omitted == directed:false, directed:true differs (arrowhead) (spec v4)", async () => {
  const mk = (o) => one((api) => api.graph({ layout: "layered", static: "s" }), (api) => () => [api.node("a", "가", { at: [0.2, 0.5] }), api.node("b", "나", { at: [0.8, 0.5] }), api.edge("a", "b", o)]);
  const edgeItems = (fl) => fl.items.filter((i) => i.mark === "edge");
  const none = edgeItems(await lay(mk(undefined))), off = edgeItems(await lay(mk({ directed: false }))), on = edgeItems(await lay(mk({ directed: true })));
  assert.deepEqual(none, off);
  assert.notDeepEqual(on, off);
});
