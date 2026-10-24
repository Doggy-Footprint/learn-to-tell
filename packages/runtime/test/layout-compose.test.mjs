// VO-8 (FR-10, FR-13, C-23, C-24, C-27) split/multiples panels, params merge, focus emphasis; VO-9 unit part (C-26) layoutFigure.
// Oracles: spec Signatures layoutFigure/Panel/Item rules; params observed through text a draw function writes from ctx.params.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LAYOUT, CORE, wcag, parseColor, over } from "./fixtures/m1.mjs";
import { input } from "./fixtures/helpers.mjs";
import { UNIMPLEMENTED, unimplementedLesson } from "./fixtures/check-cases.mjs";

const { layoutFigure, BACKGROUND } = await import(LAYOUT);
const { load } = await import(CORE);
const lay = (factory, key, o = {}) => layoutFigure(load(factory).input, key, { viewport: "desktop", t: 0, step: 0, ...o });
const frame = (api) => api.cartesian({ x: [0, 10, "m"], y: [0, 10, "m"], static: "s" });
const textsOf = (fl, id) => fl.items.filter((i) => i.kind === "text" && i.markId === id).map((i) => i.lines.join(" "));

const lesson = (api) => api.lesson(input({
  models: { m: api.model({ v0: 3, vt: 10 }, (p) => ({ s: p.v0 * 2 }), "m") },
  figures: {
    a: api.figure(frame(api), (m, t, { params }) => [api.label([2, 8], `v0=${params.v0} vt=${params.vt}`, { id: "pa" }), api.dot([params.v0, 5], { id: "da" }), api.label([2, 2], `s=${m.m.s}`, { id: "sa" })]),
    b: api.figure(frame(api), (m, t, { params }) => [api.label([2, 8], `v0=${params.v0} vt=${params.vt}`, { id: "pb" }), api.dot([5, params.v0], { id: "db" })]),
    pair: api.split(["a", "b"], { link: "v0" }),
    many: api.multiples("a", { over: { vt: [10, 20, 40] } }),
  },
}));

for (const vp of ["desktop", "mobile"]) {
  test(`VO-8 C-23 split ${vp}: 2 panels, both halves get the same params`, async () => {
    const fl = await lay(lesson, "pair", { viewport: vp, params: { v0: 7 } });
    assert.equal(fl.panels.length, 2);
    assert.deepEqual(textsOf(fl, "pa"), ["v0=7 vt=10"]);
    assert.deepEqual(textsOf(fl, "pb"), ["v0=7 vt=10"]);
    const [p0, p1] = fl.panels.map((p) => p.plot);
    assert.ok(!(p0.x < p1.x + p1.width && p1.x < p0.x + p0.width && p0.y < p1.y + p1.height && p1.y < p0.y + p0.height), "panels side by side, not overlapping");
  });
  test(`VO-8 C-24 multiples over vt [10,20,40] ${vp}: 3 panels with equal domain, one copy per value`, async () => {
    const fl = await lay(lesson, "many", { viewport: vp });
    assert.equal(fl.panels.length, 3);
    for (const p of fl.panels) assert.deepEqual(p.domain, fl.panels[0].domain);
    assert.deepEqual(textsOf(fl, "pa").sort(), ["v0=3 vt=10", "v0=3 vt=20", "v0=3 vt=40"]);
  });
}
test("VO-8 single figure -> 1 panel; params merge over model defaults and feed the model", async () => {
  const fl = await lay(lesson, "a", { params: { v0: 4 } });
  assert.equal(fl.panels.length, 1);
  assert.deepEqual(textsOf(fl, "pa"), ["v0=4 vt=10"]);
  assert.deepEqual(textsOf(fl, "sa"), ["s=8"]);
  assert.deepEqual(textsOf(await lay(lesson, "a"), "sa"), ["s=6"]);
});
test("VO-8 split link as mark id -> items with that markId carry link: true in both panels; others not (spec v2)", async () => {
  const f = (api) => api.lesson(input({
    figures: {
      a: api.figure(frame(api), () => [api.dot([2, 2], { id: "shared" }), api.dot([5, 5], { id: "x1" })]),
      b: api.figure(frame(api), () => [api.dot([3, 3], { id: "shared2" }), api.dot([6, 6], { id: "x2" })]),
      pr: api.split(["a", "b"], { link: "shared" }),
    },
  }));
  const fl = await lay(f, "pr");
  const linked = fl.items.filter((i) => i.link === true);
  assert.ok(linked.length >= 1);
  assert.ok(linked.every((i) => i.markId === "shared"));
  assert.ok(!fl.items.some((i) => (i.markId === "x1" || i.markId === "x2") && i.link === true));
});
const focusLesson = (api) => api.lesson(input({
  figures: { f: api.figure(frame(api), () => [api.dot([2, 2], { id: "a", tone: "series1", label: "에이" }), api.dot([6, 6], { id: "b", tone: "series2", label: "비" }), api.line([[0, 0], [10, 1]], { id: "c", tone: "series3" })]) },
}));
const emph = (fl, id) => [...new Set(fl.items.filter((i) => i.markId === id).map((i) => i.emphasis))];
const colors = (fl, id) => fl.items.filter((i) => i.markId === id).map((i) => i.color ?? i.stroke ?? i.fill);
/** Own HSL: [hue degrees or null if achromatic, saturation]. */
function hue(c) {
  const [r, g, b] = parseColor(c).map((v, i) => (i < 3 ? v / 255 : v));
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 1 / 255 * 2) return null;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const bgRGB = () => over(parseColor(BACKGROUND), [255, 255, 255]);
const textOf = (fl, id) => fl.items.find((i) => i.kind === "text" && i.markId === id);
const shapeOf = (fl, id) => fl.items.find((i) => i.kind === "shape" && i.markId === id);
test("VO-8 C-27 focus ['a'] -> a focus, b and c dim", async () => {
  const on = await lay(focusLesson, "f", { focus: ["a"] });
  assert.deepEqual(emph(on, "a"), ["focus"]);
  assert.deepEqual(emph(on, "b"), ["dim"]);
  assert.deepEqual(emph(on, "c"), ["dim"]);
});
test("VO-8 C-27 dim text keeps tone hue (≤ 10°), contrast ≥ 4.5 and lower than when focused (spec v2)", async () => {
  const dimB = await lay(focusLesson, "f", { focus: ["a"] }), focB = await lay(focusLesson, "f", { focus: ["b"] }), none = await lay(focusLesson, "f", { focus: null });
  const td = textOf(dimB, "b"), tf = textOf(focB, "b"), tn = textOf(none, "b");
  const hd = hue(td.color), hn = hue(tn.color);
  if (hn === null) assert.equal(hd, null, "achromatic tone stays achromatic");
  else { assert.notEqual(hd, null, "dim text keeps a hue"); const dh = Math.abs(hd - hn); assert.ok(Math.min(dh, 360 - dh) <= 10, `hue ${hd} vs ${hn}`); }
  const cd = wcag(td.color, bgRGB()), cf = wcag(tf.color, bgRGB());
  assert.ok(cd >= 4.5, `dim contrast ${cd.toFixed(2)}`);
  assert.ok(cd < cf, `dim ${cd.toFixed(2)} < focus ${cf.toFixed(2)}`);
});
test("VO-8 C-27 dim shapes keep the same color with lower opacity (spec v2)", async () => {
  const dimL = await lay(focusLesson, "f", { focus: ["a"] }), none = await lay(focusLesson, "f", { focus: null });
  for (const id of ["b", "c"]) {
    const d = shapeOf(dimL, id), n = shapeOf(none, id);
    assert.equal(d.stroke, n.stroke, `${id} stroke`);
    assert.equal(d.fill, n.fill, `${id} fill`);
    assert.ok(d.opacity < n.opacity, `${id} opacity ${d.opacity} < ${n.opacity}`);
  }
});
test("VO-8 C-27 focus null -> every item emphasis none", async () => {
  const off = await lay(focusLesson, "f", { focus: null });
  assert.deepEqual([...new Set(off.items.map((i) => i.emphasis))], ["none"]);
});
test("VO-8 focus [] (empty array) -> listed none, so every id mark is dim", async () => {
  const fl = await lay(focusLesson, "f", { focus: [] });
  for (const id of ["a", "b", "c"]) assert.deepEqual(emph(fl, id), ["dim"]);
});
test("VO-8 focus ['a','c'] -> a and c focus, b dim; mark text follows its mark", async () => {
  const fl = await lay(focusLesson, "f", { focus: ["a", "c"] });
  assert.deepEqual(emph(fl, "a"), ["focus"]);
  assert.deepEqual(emph(fl, "c"), ["focus"]);
  assert.deepEqual(emph(fl, "b"), ["dim"]);
});

// VO-9 unit: layoutFigure reports `unimplemented` located at the frame or mark.
for (const [name, make, prefix] of UNIMPLEMENTED) {
  for (const vp of ["desktop", "mobile"]) {
    test(`VO-9 C-26 layoutFigure ${name} ${vp} -> unimplemented at ${prefix}`, async () => {
      const fl = await layoutFigure(load(unimplementedLesson(make)).input, "u", { viewport: vp, t: 0, step: 0 });
      const u = fl.errors.filter((e) => e.rule === "unimplemented");
      assert.ok(u.length >= 1, JSON.stringify(fl.errors));
      assert.ok(u.every((e) => e.path === prefix), JSON.stringify(u));
      assert.ok(u.every((e) => e.message.length > 0 && e.message.length <= 300));
    });
  }
}
test("VO-9 an implemented sibling mark in the same figure is still laid out next to an unimplemented mark", async () => {
  const f = (api) => api.lesson(input({ figures: { u: api.figure(frame(api), () => [api.glyph("star", [1, 1]), api.dot([5, 5], { id: "ok" })]) } }));
  const fl = await layoutFigure(load(f).input, "u", { viewport: "desktop", t: 0, step: 0 });
  assert.ok(fl.errors.some((e) => e.rule === "unimplemented"));
  assert.ok(fl.items.some((i) => i.markId === "ok"));
});

test("VO-8 compare option: 2 panels, same domain, a and b params drive what is drawn (spec v4)", async () => {
  for (const vp of ["desktop", "mobile"]) {
    const fl = await lay(lesson, "a", { viewport: vp, compare: { a: { v0: 2 }, b: { v0: 8 }, labels: ["왼쪽", "오른쪽"] } });
    assert.equal(fl.panels.length, 2);
    assert.deepEqual(fl.panels[1].domain, fl.panels[0].domain);
    assert.deepEqual(textsOf(fl, "pa").sort(), ["v0=2 vt=10", "v0=8 vt=10"]);
    assert.deepEqual(textsOf(fl, "sa").sort(), ["s=16", "s=4"]);
  }
});

// ---------- spec v9: Panel.box, Item.panel, panel titles (mark "title") as 4 px obstacles ----------
const gap = (a, b) => Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), b.y - (a.y + a.height), a.y - (b.y + b.height));
const insideB = (r, b) => r.x >= b.x - 0.5 && r.y >= b.y - 0.5 && r.x + r.width <= b.x + b.width + 0.5 && r.y + r.height <= b.y + b.height + 0.5;
const ptIn = ([x, y], b) => x >= b.x - 0.5 && x <= b.x + b.width + 0.5 && y >= b.y - 0.5 && y <= b.y + b.height + 0.5;
function panelInvariants(fl, n, where, needTitle = true) {
  assert.equal(fl.panels.length, n, where);
  for (const p of fl.panels) assert.ok(p.box && typeof p.box.width === "number", `${where} panel box`);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) assert.ok(gap(fl.panels[i].box, fl.panels[j].box) >= -0.5, `${where} panel boxes ${i}/${j} overlap`);
  for (const it of fl.items) assert.ok(Number.isInteger(it.panel) && it.panel >= 0 && it.panel < n, `${where} item.panel ${it.panel}`);
  const texts = fl.items.filter((i) => i.kind === "text");
  for (const t of texts) {
    const pb = fl.panels[t.panel].box;
    assert.ok(insideB(t.box, pb), `${where} text ${t.id} inside its panel box`);
    if (t.leader) { assert.ok(ptIn([t.leader[0], t.leader[1]], pb) && ptIn([t.leader[2], t.leader[3]], pb), `${where} leader of ${t.id} inside panel`); }
  }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) assert.ok(gap(texts[i].box, texts[j].box) >= 6 - 1e-6, `${where} ${texts[i].id}/${texts[j].id} gap ${gap(texts[i].box, texts[j].box).toFixed(2)} < 6 (spec v11)`);
  const titles = texts.filter((t) => t.mark === "title"), others = texts.filter((t) => t.mark !== "title");
  if (needTitle) assert.ok(titles.length >= 1, `${where} panel titles present`);
  for (const t of titles) for (const o of others) assert.ok(gap(t.box, o.box) >= 4 - 1e-6, `${where} ${o.id} is ${gap(t.box, o.box).toFixed(1)} px from title ${t.lines}`);
}
const COFFEE = (await import("./fixtures/m1.mjs")).LESSONS_DIR + "/coffee-cooling.js";
const coffeeInp = load((await import(COFFEE)).default).input;
for (const vp of ["desktop", "mobile"]) {
  test(`VO-8 v9 split ${vp}: panel boxes disjoint, texts in own panel, ≥ 4 px from titles`, async () => panelInvariants(await lay(lesson, "pair", { viewport: vp, params: { v0: 7 } }), 2, `split ${vp}`, false));
  test(`VO-8 v9 multiples ×3 ${vp}: panel boxes disjoint, texts in own panel, ≥ 4 px from titles`, async () => panelInvariants(await lay(lesson, "many", { viewport: vp }), 3, `multiples ${vp}`));
  test(`VO-8 v9 compare option ${vp}: panel boxes disjoint, texts in own panel, ≥ 4 px from titles`, async () => panelInvariants(await lay(lesson, "a", { viewport: vp, compare: { a: { v0: 2 }, b: { v0: 8 }, labels: ["왼쪽", "오른쪽"] } }), 2, `compare ${vp}`));
  test(`VO-8 v9 coffee multiples k = 0.05/0.1/0.2 ${vp} (F4: label touched "k = 0.1" title)`, async () => panelInvariants(await layoutFigure(coffeeInp, "byk", { viewport: vp, t: 0, step: 0 }), 3, `byk ${vp}`));
  test(`VO-7 v9 single figure ${vp}: one panel with box, every item panel 0`, async () => {
    const fl = await lay(lesson, "a", { viewport: vp });
    assert.equal(fl.panels.length, 1);
    assert.ok(fl.panels[0].box);
    assert.ok(fl.items.every((i) => i.panel === 0));
    for (const t of fl.items.filter((i) => i.kind === "text")) assert.ok(insideB(t.box, fl.panels[0].box));
  });
}
