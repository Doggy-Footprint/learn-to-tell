// VO-7 (FR-8, FR-9, FR-11, C-18..C-22, C-25) mark items. Oracles: spec "runtime 의미 결정" placement rules, own px formula,
// arc-length ratio of a straight line for reveal, determinism by repeated evaluation.
import { test } from "node:test";
import assert from "node:assert/strict";
import { tooClose, segHitsBox, LAYOUT, CORE, center, inside, overlaps, overlapPairs, closePairs, oraclePx, distToBox } from "./fixtures/m1.mjs";
import { input } from "./fixtures/helpers.mjs";

const { layoutFigure, dataToPx, LEADER_PX } = await import(LAYOUT);
const { load, createApi } = await import(CORE);
const close = (a, b, tol, msg = "") => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b} (tol ${tol})`);
const one = (frame, draw, models = () => ({})) => (api) => api.lesson(input({ models: models(api), figures: { f: api.figure(frame(api), draw(api)) } }));
const lay = (factory, o = {}) => layoutFigure(load(factory).input, "f", { viewport: "desktop", t: 0, step: 0, ...o });
const cart = (time = { static: "s" }) => (api) => api.cartesian({ x: [0, 10, "m"], y: [0, 10, "m"], ...time });
const of = (fl, mark) => fl.items.filter((i) => i.mark === mark);
const textOf = (fl, markId) => fl.items.filter((i) => i.kind === "text" && i.markId === markId);
const shapeOf = (fl, markId) => fl.items.find((i) => i.kind === "shape" && i.markId === markId);
const BOX = (fl) => ({ x: 0, y: 0, width: fl.width, height: fl.height });
const allTexts = (fl) => fl.items.filter((i) => i.kind === "text").map((i) => ({ id: i.id, box: i.box }));

test("VO-7 each of the 18 cartesian/cells-free marks yields items named by its api member", async () => {
  const fl = await lay(one(cart(), (api) => () => [
    api.axis("x", { label: "거리" }), api.axis("y"), api.grid({ x: 2, y: 2 }), api.legend([{ tone: "series1", text: "공기" }], { id: "lg" }),
    api.line([[0, 1], [5, 2]], { id: "ln" }), api.area([[0, 1], [5, 3]], { id: "ar" }), api.dot([2, 2], { id: "dt" }), api.circle([7, 7], 1, { id: "ci" }),
    api.rect([1, 6], [3, 8], { id: "re" }), api.arc([5, 5], 1, [0, 90], { id: "ac" }), api.arrow([1, 1], [3, 3], { id: "aw" }),
    api.path([["M", 6, 1], ["Q", 7, 3, 8, 1], ["Z"]], { id: "pa" }), api.label([9, 9], "표지", { id: "lb" }), api.dim([1, 4], [4, 4], "3 m", { id: "dm" }),
    api.angle([6, 3], [8, 3], [7, 4.5], { id: "an", text: "40°" }), api.brace([5, 0.5], [9, 0.5], "4 m", { id: "br" }),
    api.math([2, 9], String.raw`E = mc^2`, { id: "mt" }), api.code([6, 9.5], "x += v*dt", { id: "cd" }), api.mock("window", [[4, 6], [6, 8]], [], { id: "mk", title: "창" }),
  ]));
  for (const m of ["axis", "grid", "legend", "line", "area", "dot", "circle", "rect", "arc", "arrow", "path", "label", "dim", "angle", "brace", "math", "code", "mock"]) {
    assert.ok(of(fl, m).length >= 1, `items for ${m}`);
  }
  for (const id of ["ln", "ar", "dt", "ci", "re", "ac", "aw", "pa", "lb", "dm", "an", "br", "mt", "cd", "mk", "lg"]) assert.ok(fl.items.some((i) => i.markId === id), `markId ${id}`);
  assert.deepEqual(closePairs(allTexts(fl)), []);
  for (const t of allTexts(fl)) assert.ok(inside(t.box, BOX(fl)), t.id);
});
test("VO-7 node, edge (graph) and cell (cells) yield items named by their api member", async () => {
  const g = await lay(one((api) => api.graph({ layout: "tree", static: "s" }), (api) => () => [api.node("a", "가"), api.node("b", "나"), api.edge("a", "b", { text: "선" })]));
  for (const m of ["node", "edge"]) assert.ok(of(g, m).length >= 1, m);
  const c = await lay(one((api) => api.cells({ cols: 2, rows: 2, static: "s" }), (api) => () => [api.cell(1, 1, { id: "k", value: 1, text: "1" })]));
  assert.ok(of(c, "cell").length >= 1);
});

// ---------- axis ----------
for (const vp of ["desktop", "mobile"]) {
  test(`VO-7 C-18 axis x [0,170,"m"] ${vp}: tick texts non-overlapping, unit "m" appears in a tick or title text`, async () => {
    const fl = await lay(one((api) => api.cartesian({ x: [0, 170, "m"], y: [0, 60, "m"], static: "s" }), (api) => () => [api.axis("x", { id: "ax", label: "수평 거리" }), api.axis("y", { id: "ay", label: "공의 높이" })]), { viewport: vp });
    const ticks = of(fl, "axis").filter((i) => i.kind === "text");
    assert.ok(ticks.length >= 3, "several tick texts");
    assert.deepEqual(closePairs(ticks.map((i) => ({ id: i.id, box: i.box }))), []);
    assert.ok(ticks.some((i) => i.lines.join(" ").includes("m")), "unit m attached");
    for (const t of ticks) assert.ok(inside(t.box, BOX(fl)), t.id);
    for (const t of ticks) assert.ok(t.size >= 12);
    // spec v12: axis titles are like ticks — inside the figure, never text-no-room.
    for (const title of ["수평 거리", "공의 높이"]) {
      const t = ticks.find((i) => i.lines.join(" ").includes(title));
      assert.ok(t, `axis title ${title} drawn`);
      assert.ok(inside(t.box, BOX(fl)), `axis title ${title} inside the figure`);
    }
    assert.deepEqual(fl.errors.filter((e) => e.rule === "text-no-room"), [], "no text-no-room for axis tick or title text");
  });
}
test("VO-7 axis thinning: 51 explicit ticks on mobile -> fewer tick texts shown, none overlapping", async () => {
  const ticks = Array.from({ length: 51 }, (_, i) => i * 20000);
  const fl = await lay(one((api) => api.cartesian({ x: [0, 1000000, "원"], y: [0, 1, ""], static: "s" }), (api) => () => [api.axis("x", { ticks })]), { viewport: "mobile" });
  const shown = of(fl, "axis").filter((i) => i.kind === "text");
  assert.ok(shown.length >= 2 && shown.length < 51, `shown ${shown.length}`);
  assert.deepEqual(closePairs(shown.map((i) => ({ id: i.id, box: i.box }))), []);
  for (const t of shown) assert.ok(inside(t.box, BOX(fl)), `tick ${t.lines} inside the figure (end ticks pushed inward or dropped)`);
  assert.deepEqual(fl.errors.filter((e) => e.rule === "text-no-room"), [], "tick text never yields text-no-room (spec v2)");
});

// ---------- legend ----------
for (const vp of ["desktop", "mobile"]) {
  test(`VO-7 C-19 legend without at ${vp}: texts outside the plot (desktop right/top side, mobile below)`, async () => {
    const fl = await lay(one(cart(), (api) => () => [api.legend([{ tone: "series1", text: "뚜껑 없음" }, { tone: "series2", text: "뚜껑 덮음" }, { tone: "ref", text: "실온" }], { id: "key" })]), { viewport: vp });
    const P = fl.panels[0].plot;
    const ts = of(fl, "legend").filter((i) => i.kind === "text");
    const all = ts.flatMap((t) => t.lines).join("\n");
    for (const e of ["뚜껑 없음", "뚜껑 덮음", "실온"]) assert.ok(all.includes(e), e);
    for (const t of ts) {
      assert.ok(!overlaps(t.box, P), `${t.lines} outside plot`);
      assert.ok(inside(t.box, BOX(fl)));
      if (vp === "desktop") assert.ok(t.box.x >= P.x + P.width - 0.5, "right of plot");
      else assert.ok(t.box.y >= P.y + P.height - 0.5, "below plot");
    }
  });
}
test("VO-7 legend with at: texts inside the plot near at", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.legend([{ tone: "series1", text: "공기" }], { at: [8, 9] })]));
  const t = of(fl, "legend").find((i) => i.kind === "text");
  assert.ok(overlaps(t.box, fl.panels[0].plot, 0));
});

// ---------- dim / brace / angle / edge / MarkOpts label ----------
const straddles = (box, y) => box.y < y - 0.5 && box.y + box.height > y + 0.5;
for (const vp of ["desktop", "mobile"]) {
  test(`VO-7 C-20 dim [0,0]->[10,0] "10 m" ${vp}: text centered (±2 px) and not crossing the dimension line`, async () => {
    const fl = await lay(one((api) => api.cartesian({ x: [0, 10, "m"], y: [-5, 5, "m"], static: "s" }), (api) => () => [api.dim([0, 0], [10, 0], "10 m", { id: "d" })]), { viewport: vp });
    const P = fl.panels[0];
    const [x0, y0] = oraclePx(P, [0, 0]), [x1] = oraclePx(P, [10, 0]);
    const [t] = textOf(fl, "d");
    assert.equal(t.lines.join(" "), "10 m");
    close(center(t.box)[0], (x0 + x1) / 2, 2);
    assert.ok(!straddles(t.box, y0));
    assert.ok(distToBox([(x0 + x1) / 2, y0], t.box) <= 20, "text next to the line");
  });
  test(`VO-7 brace ${vp}: text outside the brace, centered ±2 px`, async () => {
    const fl = await lay(one((api) => api.cartesian({ x: [0, 10, "m"], y: [-5, 5, "m"], static: "s" }), (api) => () => [api.brace([2, 0], [8, 0], "지름 6 m", { id: "b" })]), { viewport: vp });
    const P = fl.panels[0];
    const [x0, y0] = oraclePx(P, [2, 0]), [x1] = oraclePx(P, [8, 0]);
    const [t] = textOf(fl, "b");
    close(center(t.box)[0], (x0 + x1) / 2, 2);
    assert.ok(!straddles(t.box, y0));
    const s = shapeOf(fl, "b");
    assert.ok(!overlaps(t.box, s.bbox), "text outside the brace shape");
  });
}
test("VO-7 angle: text outside the arc (beyond its radius from the vertex)", async () => {
  const fl = await lay(one((api) => api.cartesian({ x: [-5, 5, "m"], y: [-5, 5, "m"], aspect: "equal", static: "s" }), (api) => () => [api.angle([0, 0], [4, 0], [0, 4], { id: "an", text: "90°" })]));
  const P = fl.panels[0];
  const v = oraclePx(P, [0, 0]);
  const s = shapeOf(fl, "an");
  const r = Math.max(s.bbox.width, s.bbox.height);
  const [t] = textOf(fl, "an");
  assert.ok(distToBox(v, t.box) >= r - 1, `text distance ${distToBox(v, t.box)} vs arc radius ${r}`);
});
const labelRef = async (mk, expected, frame = cart()) => {
  const fl = await lay(one(frame, (api) => () => [mk(api)]));
  const [t] = textOf(fl, "m1");
  assert.ok(t, "label text");
  const e = expected(fl.panels[0]);
  close(t.ref[0], e[0], 0.5, "ref x"); close(t.ref[1], e[1], 0.5, "ref y");
  return { fl, t };
};
test("VO-7 MarkOpts label on dot: ref = center", () => labelRef((api) => api.dot([4, 6], { id: "m1", label: "점" }), (P) => oraclePx(P, [4, 6])));
test("VO-7 MarkOpts label on circle: ref = center", () => labelRef((api) => api.circle([4, 6], 1, { id: "m1", label: "원" }), (P) => oraclePx(P, [4, 6])));
test("VO-7 MarkOpts label on line: ref = last point", () => labelRef((api) => api.line([[0, 0], [3, 4], [7, 5]], { id: "m1", label: "선" }), (P) => oraclePx(P, [7, 5])));
test("VO-7 MarkOpts label on area: ref = last point", () => labelRef((api) => api.area([[0, 2], [3, 4], [7, 5]], { id: "m1", label: "넓이" }), (P) => oraclePx(P, [7, 5])));
test("VO-7 MarkOpts label on rect: ref = top center", () => labelRef((api) => api.rect([2, 3], [6, 7], { id: "m1", label: "상자" }), (P) => oraclePx(P, [4, 7])));
test("VO-7 label mark: ref = at, text not moved onto another text", async () => {
  const { fl } = await labelRef((api) => [api.label([5, 5], "첫째", { id: "m1" }), api.label([5, 5], "둘째", { id: "m2" })], (P) => oraclePx(P, [5, 5]));
  assert.deepEqual(closePairs(allTexts(fl)), []);
});
test("VO-7 label leader option draws a leader to that point", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.label([5, 5], "지시", { id: "m1", leader: [2, 2] })]));
  const [t] = textOf(fl, "m1");
  assert.ok(t.leader, "leader present");
  const [lx, ly] = oraclePx(fl.panels[0], [2, 2]);
  assert.ok([[t.leader[0], t.leader[1]], [t.leader[2], t.leader[3]]].some(([x, y]) => Math.abs(x - lx) <= 0.5 && Math.abs(y - ly) <= 0.5));
});
test("VO-7 MarkOpts size s/m/l -> text sizes 12/14/17; weight", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.label([2, 2], "작게", { id: "s1", size: "s" }), api.label([5, 5], "보통", { id: "s2" }), api.label([8, 8], "크게", { id: "s3", size: "l" })]));
  assert.deepEqual(["s1", "s2", "s3"].map((id) => textOf(fl, id)[0].size), [12, 14, 17]);
});

// ---------- trace / flow / sweep / reveal ----------
const series = (api) => api.ode((t, y) => [1, -0.5 * y[1]], [0, 8], [0, 10], 0.01);
test("VO-7 trace: head at series point at t (dims), deterministic, grows with t", async () => {
  const f = one(cart({ loop: { ms: 1000, span: [0, 10] } }), (api) => (m, t) => api.trace(m.s.s, t, { id: "tr", head: true, trail: true, dims: [0, 1] }), (api) => ({ s: api.model({}, () => ({ s: series(api) }), "ode") }));
  const { api } = createApi();
  const s = series(api);
  for (const t of [2, 6]) {
    const fl = await lay(f, { t });
    const p = s.at(t);
    const [ex, ey] = oraclePx(fl.panels[0], [p[0], p[1]]);
    const tr = of(fl, "trace").filter((i) => i.kind === "shape");
    assert.ok(tr.length >= 1);
    assert.ok(tr.some((i) => Math.abs(center(i.bbox)[0] - ex) <= 0.5 && Math.abs(center(i.bbox)[1] - ey) <= 0.5), `head centered at (${ex},${ey})`);
    assert.deepEqual(fl, await lay(f, { t }));
  }
  const w2 = Math.max(...of(await lay(f, { t: 2 }), "trace").map((i) => i.bbox.width)), w6 = Math.max(...of(await lay(f, { t: 6 }), "trace").map((i) => i.bbox.width));
  assert.ok(w6 > w2, "trail extends with t");
});
test("VO-7 C-22 flow n 5 seed 1 t 0.3 twice -> identical particle items; t changes them", async () => {
  const f = one(cart({ idle: { ms: 1000 } }), (api) => (m, t) => api.flow([[1, 1], [9, 1], [9, 9]], { id: "fl", n: 5, rate: 0.5, seed: 1, t }));
  const a = await lay(f, { t: 0.3 }), b = await lay(f, { t: 0.3 }), c = await lay(f, { t: 0.6 });
  assert.ok(of(a, "flow").length >= 1);
  assert.deepEqual(of(a, "flow"), of(b, "flow"));
  assert.notDeepEqual(of(a, "flow"), of(c, "flow"));
});
test("VO-7 sweep x at 4: vertical line across the plot at px(4)", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.sweep("x", 4, { id: "sw" })]));
  const s = shapeOf(fl, "sw"), P = fl.panels[0];
  close(center(s.bbox)[0], oraclePx(P, [4, 0])[0], 0.5);
  assert.ok(s.bbox.height >= P.plot.height - 1);
});
test("VO-7 sweep y with width: band of that data height", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.sweep("y", 5, { id: "sw", width: 2 })]));
  const s = shapeOf(fl, "sw"), P = fl.panels[0];
  close(s.bbox.height, P.plot.height * 0.2, 1);
  close(center(s.bbox)[1], oraclePx(P, [0, 5])[1], 0.5);
});
for (const [r, frac] of [[0, 0], [0.5, 0.5], [1, 1]]) {
  test(`VO-7 MarkOpts reveal ${r}: straight line drawn to ${frac} of its length`, async () => {
    const fl = await lay(one(cart(), (api) => () => [api.line([[0, 5], [10, 5]], { id: "rv", reveal: r })]));
    const s = shapeOf(fl, "rv"), P = fl.panels[0].plot;
    const w = s ? s.bbox.width : 0;
    close(w, P.width * frac, 1);
    if (s && frac > 0) close(s.bbox.x, P.x, 0.5, "starts at path start");
  });
}

// ---------- mock ----------
test("VO-7 C-21 mock browser: frame outside box, children clipped to box, children texts non-overlapping", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.mock("browser", [[2, 1], [8, 7]], [
    api.rect([0, 2], [5, 4], { id: "spill" }), api.label([3, 5], "부산항 대기 12일", { id: "c1" }), api.label([3, 5], "운임 1,600달러", { id: "c2" }),
  ], { id: "mk", title: "logistics.example.com" })]));
  const P = fl.panels[0];
  const [bx0, by1] = oraclePx(P, [2, 1]), [bx1, by0] = oraclePx(P, [8, 7]);
  const box = { x: bx0, y: by0, width: bx1 - bx0, height: by1 - by0 };
  const frame = of(fl, "mock");
  const top = Math.min(...frame.map((i) => (i.kind === "shape" ? i.bbox.y : i.box.y)));
  assert.ok(top < box.y - 1, "browser chrome drawn above the content box");
  const spill = shapeOf(fl, "spill");
  assert.ok(inside(spill.bbox, box, 0.5), "child rect clipped to box");
  close(spill.bbox.x, box.x, 0.5, "visible extent starts at the box edge");
  close(spill.bbox.x + spill.bbox.width, oraclePx(P, [5, 0])[0], 0.5, "visible extent ends at the rect edge");
  const kids = [...textOf(fl, "c1"), ...textOf(fl, "c2")].map((i) => ({ id: i.id, box: i.box }));
  assert.equal(kids.length, 2);
  assert.deepEqual(closePairs(kids), []);
  assert.ok(fl.items.some((i) => i.kind === "text" && i.lines.join("").includes("logistics.example.com")), "title text");
});
test("VO-7 mock title that cannot fit -> text-no-room", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.mock("window", [[0, 0], [10, 10]], [], { id: "mk", title: "아주 긴 제목 ".repeat(20) })]), { viewport: "mobile" });
  assert.ok(fl.errors.some((e) => e.rule === "text-no-room"), JSON.stringify(fl.errors));
});

// ---------- custom ----------
test("VO-7 C-25 custom: script tag and on* attr dropped, allowed shapes kept, href ignored", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.custom({ id: "cu", why: "시험", bounds: [[2, 2], [6, 6]] }, ({ h }) => [
    h("script", {}, "window.__pwned = 1"),
    h("rect", { x: 0.1, y: 0.1, width: 0.5, height: 0.5, fill: "#336699", onclick: "window.__pwned = 2" }),
    h("a", { href: "javascript:alert(1)" }, h("circle", { cx: 0.5, cy: 0.5, r: 0.1 })),
    h("circle", { cx: 0.8, cy: 0.8, r: 0.1, href: "javascript:alert(2)" }),
  ])]));
  const cs = of(fl, "custom");
  assert.ok(cs.length >= 1, "custom output kept");
  const json = JSON.stringify(fl.items);
  for (const bad of ["script", "__pwned", "onclick", "javascript:", "href"]) assert.ok(!json.includes(bad), `no ${bad}`);
});
test("VO-7 custom coordinates are bounds units; output beyond bounds is clipped to bounds", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.custom({ id: "cu", why: "시험", bounds: [[2, 2], [6, 6]] }, ({ h }) => [
    h("rect", { x: 0, y: 0, width: 1, height: 1, fill: "#336699" }), h("rect", { x: 40, y: 0, width: 20, height: 1, fill: "#993333" }),
  ])]));
  const P = fl.panels[0];
  const [x0, y1] = oraclePx(P, [2, 2]), [x1, y0] = oraclePx(P, [6, 6]);
  const b = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  for (const i of of(fl, "custom")) if (i.kind === "shape") assert.ok(inside(i.bbox, b, 0.5), JSON.stringify(i.bbox));
  assert.equal(of(fl, "custom").filter((i) => i.kind === "shape").length, 1, "fully clipped shape has no item (spec v2)");
  const full = of(fl, "custom").filter((i) => i.kind === "shape").find((i) => Math.abs(i.bbox.width - b.width) <= 0.5 && Math.abs(i.bbox.height - b.height) <= 0.5);
  assert.ok(full, "unit rect fills the bounds box");
});

// ---------- math / code ----------
test("VO-7 math: KaTeX-measured box with positive size inside the figure", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.math([5, 5], String.raw`\frac{dT}{dt} = -k(T - T_a)`, { id: "mt" })]));
  const it = fl.items.find((i) => i.markId === "mt");
  const b = it.kind === "text" ? it.box : it.bbox;
  assert.ok(b.width > 10 && b.height > 10);
  assert.ok(inside(b, BOX(fl)));
});
test("VO-7 code: highlight adds a background shape; lines kept", async () => {
  const plain = await lay(one(cart(), (api) => () => [api.code([1, 9], "a = 1\nb = 2\nc = 3", { id: "cd" })]));
  const hl = await lay(one(cart(), (api) => () => [api.code([1, 9], "a = 1\nb = 2\nc = 3", { id: "cd", highlight: [2] })]));
  assert.ok(of(hl, "code").filter((i) => i.kind === "shape").length > of(plain, "code").filter((i) => i.kind === "shape").length);
  assert.ok(JSON.stringify(of(hl, "code")).includes("b = 2"));
});
test("VO-7 hidden ids are not drawn", async () => {
  const f = one(cart(), (api) => () => [api.dot([2, 2], { id: "keep" }), api.dot([5, 5], { id: "gone", label: "숨김" })]);
  const fl = await layoutFigure(load(f).input, "f", { viewport: "desktop", t: 0, step: 0, hidden: ["gone"] });
  assert.ok(fl.items.some((i) => i.markId === "keep"));
  assert.ok(!fl.items.some((i) => i.markId === "gone"));
});

// ---------- path commands (lesson.d.ts PathCmd; "A" sweep 1 is counterclockwise in data coordinates, y up) ----------
const square = (api) => api.cartesian({ x: [0, 10, "m"], y: [0, 10, "m"], aspect: "equal", static: "s" });
/** aspect equal so arc length in data units and in px are proportional (spec does not say which space "arc length" uses). */
const pathBox = async (cmds, o = {}) => {
  const fl = await lay(one(square, (api) => () => [api.path(cmds, { id: "p", ...o })]));
  return { fl, s: shapeOf(fl, "p"), P: fl.panels[0] };
};
for (const [sweep, lowY, highY] of [[1, 2, 5], [0, 5, 8]]) {
  test(`VO-7 path A semicircle (2,5)->(8,5) r 3 sweep ${sweep}: arc spans y ${lowY}..${highY}`, async () => {
    const { s, P } = await pathBox([["M", 2, 5], ["A", 3, 3, 0, 0, sweep, 8, 5]]);
    const [, yTop] = oraclePx(P, [5, highY]), [, yBot] = oraclePx(P, [5, lowY]);
    close(s.bbox.y, yTop, 1, "top"); close(s.bbox.y + s.bbox.height, yBot, 1, "bottom");
    close(s.bbox.x, oraclePx(P, [2, 5])[0], 1); close(s.bbox.x + s.bbox.width, oraclePx(P, [8, 5])[0], 1);
  });
}
test("VO-7 path C and Q curves stay inside their control hull; Z closes", async () => {
  const { s, P } = await pathBox([["M", 1, 1], ["C", 1, 9, 9, 9, 9, 1], ["Q", 5, 0, 1, 1], ["Z"]]);
  const [x0, y1] = oraclePx(P, [1, 0]), [x1, y0] = oraclePx(P, [9, 9]);
  assert.ok(inside(s.bbox, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, 0.5));
  const [, yPeak] = oraclePx(P, [5, 7]);
  close(s.bbox.y, yPeak, 1, "cubic peak at t=0.5 is y = 1 + 0.75·8 = 7");
  assert.match(s.d, /[Zz]\s*$/);
});
for (const r of [0.25, 0.5, 0.75]) {
  test(`VO-7 path reveal ${r} on an L polyline: drawn up to that fraction of total length`, async () => {
    // M(0,5) L(4,5) L(4,9): lengths 4 and 4 → total 8.
    const { s, P } = await pathBox([["M", 0, 5], ["L", 4, 5], ["L", 4, 9]], { reveal: r });
    const d = 8 * r;
    const end = d <= 4 ? [d, 5] : [4, 5 + (d - 4)];
    const [ex, ey] = oraclePx(P, end), [sx] = oraclePx(P, [0, 5]);
    close(s.bbox.x, sx, 0.5);
    close(s.bbox.x + s.bbox.width, Math.max(ex, sx), 0.6, "right end");
    if (d > 4) close(s.bbox.y, ey, 0.6, "top end");
  });
}
test("VO-7 path reveal 0.5 on a semicircle arc ends at the arc midpoint (arc-length ratio)", async () => {
  const { s, P } = await pathBox([["M", 2, 5], ["A", 3, 3, 0, 0, 0, 8, 5]], { reveal: 0.5 });
  const [mx, my] = oraclePx(P, [5, 8]), [sx, sy] = oraclePx(P, [2, 5]);
  close(s.bbox.x, sx, 1); close(s.bbox.x + s.bbox.width, mx, 1); close(s.bbox.y, my, 1); close(s.bbox.y + s.bbox.height, sy, 1);
});
test("VO-7 line curve smooth/step: step curve goes through corners, smooth stays near the points", async () => {
  const fl = await lay(one(cart(), (api) => () => [api.line([[1, 1], [5, 9], [9, 1]], { id: "st", curve: "step" }), api.line([[1, 1], [5, 9], [9, 1]], { id: "sm", curve: "smooth" })]));
  const P = fl.panels[0];
  for (const id of ["st", "sm"]) {
    const b = shapeOf(fl, id).bbox;
    close(b.x, oraclePx(P, [1, 1])[0], 0.5); close(b.x + b.width, oraclePx(P, [9, 1])[0], 0.5);
    assert.ok(b.y <= oraclePx(P, [5, 9])[1] + 0.5, `${id} reaches the peak`);
  }
});

test("VO-7 reveal uses px arc length on a non-square plot (spec v2): L polyline at 0.25/0.5/0.75", async () => {
  for (const r of [0.25, 0.5, 0.75]) {
    const fl = await lay(one(cart(), (api) => () => [api.path([["M", 0, 5], ["L", 4, 5], ["L", 4, 9]], { id: "p", reveal: r })]));
    const P = fl.panels[0], s = shapeOf(fl, "p");
    const a = oraclePx(P, [0, 5]), b = oraclePx(P, [4, 5]), c = oraclePx(P, [4, 9]);
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const d = (l1 + l2) * r;
    const end = d <= l1 ? [a[0] + d, a[1]] : [b[0], b[1] - (d - l1)];
    close(s.bbox.x + s.bbox.width, end[0], 0.6, `r=${r} right end`);
    if (d > l1) close(s.bbox.y, end[1], 0.6, `r=${r} top end`);
  }
});

test("VO-7 v11 label whose anchor sits on a linear line is placed clear of the line's segments", async () => {
  const pts = [[0, 2], [3, 5], [6, 5], [10, 8]];
  for (const vp of ["desktop", "mobile"]) {
    const fl = await lay(one(cart(), (api) => () => [api.line(pts, { id: "ln", curve: "linear" }), api.label([4.5, 5], "온도 곡선", { id: "lb", anchor: "c" }), api.label([1.5, 3.5], "상승 구간", { id: "lb2", anchor: "c" })]), { viewport: vp });
    const P = fl.panels[0];
    const px = pts.map((p) => dataToPx(P, p));
    const segs = px.slice(1).map((q, i) => [px[i][0], px[i][1], q[0], q[1]]);
    for (const id of ["lb", "lb2"]) {
      const [t] = textOf(fl, id);
      assert.ok(t, id);
      for (const sg of segs) assert.ok(!segHitsBox(sg, t.box), `${vp} ${id} box ${JSON.stringify(t.box)} crosses segment ${sg.map((v) => v.toFixed(1))}`);
    }
  }
});

// spec v17: legend text never has a leader; without at it stays outside its panel's plot.
const legendCheck = (fl, where) => {
  const ts = fl.items.filter((i) => i.kind === "text" && i.mark === "legend");
  assert.ok(ts.length >= 1, `${where} legend text`);
  for (const t of ts) {
    assert.equal(t.leader, undefined, `${where} legend text has no leader`);
    const P = fl.panels[t.panel ?? 0].plot;
    assert.ok(!overlaps(t.box, P, 0), `${where} legend ${t.lines} outside plot ${JSON.stringify(P)}`);
  }
};
for (const vp of ["desktop", "mobile"]) {
  test(`VO-7 v17 legend ${vp}: no leader, outside the plot`, async () => {
    legendCheck(await lay(one(cart(), (api) => () => [api.legend([{ tone: "series1", text: "뚜껑 없음" }, { tone: "series2", text: "뚜껑 덮음" }], { id: "key" })]), { viewport: vp }), vp);
  });
  test(`VO-7 v17 legend ${vp} with a busy top-right plot (lines through top-right and right): no leader, outside the plot`, async () => {
    legendCheck(await lay(one(cart(), (api) => () => [
      api.line([[0, 9.5], [10, 9.5]], { id: "top", tone: "series1", curve: "linear" }),
      api.line([[5, 10], [10, 5]], { id: "diag", tone: "series2", curve: "linear" }),
      api.line([[9.5, 0], [9.5, 10]], { id: "right", tone: "series3", curve: "linear" }),
      api.line([[0, 7], [10, 8], [7, 10]], { id: "zig", tone: "series4", curve: "linear" }),
      api.legend([{ tone: "series1", text: "상한선" }, { tone: "series2", text: "대각선" }, { tone: "series3", text: "오른쪽 경계" }, { tone: "series4", text: "꺾은선" }], { id: "key" }),
    ]), { viewport: vp }), `${vp} busy`);
  });
}

// spec v18: legend with `at` sits at `at` (≤ LEADER_PX) regardless of line avoidance; if texts occupy the spot it moves, still without leader.
const legendTexts = (fl) => fl.items.filter((i) => i.kind === "text" && i.mark === "legend");
/** Legend box = union of every legend item (frame, swatches, text). */
const legendBox = (fl) => { const ts = fl.items.filter((i) => i.mark === "legend").map((i) => ({ box: i.box ?? i.bbox })); const x = Math.min(...ts.map((t) => t.box.x)), y = Math.min(...ts.map((t) => t.box.y)); return { x, y, width: Math.max(...ts.map((t) => t.box.x + t.box.width)) - x, height: Math.max(...ts.map((t) => t.box.y + t.box.height)) - y }; };
for (const vp of ["desktop", "mobile"]) {
  test(`VO-7 v18 legend at a free spot crossed by lines (${vp}): stays within LEADER_PX of at, no leader`, async () => {
    const fl = await lay(one(cart(), (api) => () => [
      api.line([[0, 6], [10, 6]], { id: "h", tone: "series1", curve: "linear" }),
      api.line([[6, 0], [6, 10]], { id: "v", tone: "series2", curve: "linear" }),
      api.line([[2, 2], [10, 10]], { id: "d", tone: "series3", curve: "linear" }),
      api.legend([{ tone: "series1", text: "가로선" }, { tone: "series2", text: "세로선" }], { id: "key", at: [6, 6] }),
    ]), { viewport: vp });
    const ts = legendTexts(fl);
    assert.ok(ts.length >= 1);
    for (const t of ts) assert.equal(t.leader, undefined, "no leader");
    const at = dataToPx(fl.panels[0], [6, 6]);
    const d = distToBox(at, legendBox(fl));
    assert.ok(d <= LEADER_PX, `legend ${d.toFixed(1)} px from at (> LEADER_PX ${LEADER_PX}); line avoidance must not push it`);
  });
  test(`VO-7 v18 legend at a spot occupied by fixed node texts (${vp}): moves beyond LEADER_PX, no leader, ≥ 6 px from them`, async () => {
    // Movable labels yield to the legend, so the occupants are pinned graph nodes whose texts are fixed.
    const pins = [[0.5, 0.5], [0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.5, 0.7], [0.3, 0.3], [0.7, 0.7], [0.3, 0.7], [0.7, 0.3]];
    const fl = await lay(one((api) => api.graph({ layout: "layered", static: "s" }), (api) => () => [
      ...pins.map((p, i) => api.node(`occ${i}`, `고정 노드 ${i + 1}`, { at: p })),
      api.legend([{ tone: "series1", text: "범례 첫째" }, { tone: "series2", text: "범례 둘째" }], { id: "key", at: [0.5, 0.5] }),
    ]), { viewport: vp });
    const ts = legendTexts(fl);
    assert.ok(ts.length >= 1, "legend placed");
    for (const t of ts) assert.equal(t.leader, undefined, "no leader");
    const at = dataToPx(fl.panels[0], [0.5, 0.5]);
    const d = distToBox(at, legendBox(fl));
    assert.ok(d > LEADER_PX, `precondition: legend moved ${d.toFixed(1)} px, must exceed LEADER_PX ${LEADER_PX} for this case to exercise the rule`);
    const occ = fl.items.filter((i) => i.kind === "text" && /^occ/.test(i.markId ?? ""));
    assert.ok(occ.some((i) => i.markId === "occ0"), `centre node text present (${occ.map((i) => i.markId)})`);
    for (const t of ts) for (const l of occ) assert.ok(!tooClose(t.box, l.box), `legend ${t.lines} within 6 px of ${l.markId}`);
  });
}
