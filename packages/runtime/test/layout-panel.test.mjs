// VO-5 (FR-4, FR-5, FR-7, C-8..C-11, C-16, C-17, QR-2) panel px mapping.
// Oracles: own linear/log10 formula over Panel.plot/domain (fixtures/m1 oraclePx); own WCAG formula;
// geo: d3-geo raw projections (geoEqualEarthRaw, geoMercatorRaw) — geoProject must equal a uniform-scale affine image of the raw
// projection (fit/translate are not spec'd, so they are solved from two points and the third point is predicted), plus d3.geoInterpolate for great circles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LAYOUT, CORE, oraclePx, center, wcag, parseColor, over, inside } from "./fixtures/m1.mjs";
import { input } from "./fixtures/helpers.mjs";

const L = await import(LAYOUT);
const { load } = await import(CORE);
const d3 = await import("d3-geo");
const { layoutFigure, dataToPx, geoProject, stageBox, VIEWPORTS, BACKGROUND } = L;

const close = (a, b, tol, msg = "") => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b} (tol ${tol})`);
const one = (frame, draw) => (api) => api.lesson(input({ figures: { f: api.figure(frame(api), draw(api)) } }));
const lay = (factory, o = {}) => layoutFigure(load(factory).input, "f", { viewport: "desktop", t: 0, step: 0, ...o });
const shape = (fl, id) => fl.items.find((i) => i.kind === "shape" && i.markId === id);

test("VO-5 VIEWPORTS and stageBox: desktop card 400–440 px wide, mobile stage = 390 − 32", () => {
  assert.deepEqual(VIEWPORTS, { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } });
  const d = stageBox("desktop"), m = stageBox("mobile");
  assert.ok(d.width > 0 && d.width <= 1280 - 400, `desktop stage width ${d.width} leaves ≥ 400 px for the card`);
  assert.ok(d.height > 0 && d.height <= 800);
  assert.equal(m.width, 390 - 32);
  assert.ok(m.height > 0 && m.height < 844);
});
test("VO-5 layoutFigure default box is stageBox(viewport)", async () => {
  const f = one((api) => api.cartesian({ x: [0, 10, "m"], y: [0, 5, "m"], static: "s" }), (api) => () => [api.dot([5, 2.5], { id: "d" })]);
  for (const vp of ["desktop", "mobile"]) {
    const fl = await lay(f, { viewport: vp });
    assert.deepEqual({ width: fl.width, height: fl.height }, stageBox(vp));
  }
  const fl = await lay(f, { box: { width: 500, height: 300 } });
  assert.deepEqual({ width: fl.width, height: fl.height }, { width: 500, height: 300 });
  assert.ok(inside(fl.panels[0].plot, { x: 0, y: 0, width: 500, height: 300 }));
});

// ---------- cartesian ----------
const CART = [
  ["linear", { x: [0, 10, "m"], y: [0, 5, "m"] }, [[0, 0], [10, 5], [2.5, 1], [7, 4.5]]],
  ["log x", { x: [1, 1000, "Hz"], y: [0, 5, "m"], log: "x" }, [[1, 0], [1000, 5], [10, 2], [31.6, 1]]],
  ["log y", { x: [0, 10, "m"], y: [0.01, 100, "%"], log: "y" }, [[0, 0.01], [10, 100], [5, 1], [2, 0.1]]],
  ["log xy", { x: [0.1, 100, "cm"], y: [0.1, 1000, "s"], log: "xy" }, [[0.1, 0.1], [100, 1000], [1, 10], [3, 30]]],
];
for (const [name, opts, pts] of CART) {
  for (const vp of ["desktop", "mobile"]) {
    test(`VO-5 cartesian ${name} ${vp}: dataToPx and dot centers = own formula ±0.5 px`, async () => {
      const f = one((api) => api.cartesian({ ...opts, static: "s" }), (api) => () => pts.map((p, i) => api.dot(p, { id: `p${i}` })));
      const fl = await lay(f, { viewport: vp });
      assert.equal(fl.panels.length, 1);
      const P = fl.panels[0];
      assert.equal(P.frame, "cartesian");
      assert.equal(P.log, opts.log);
      assert.deepEqual(P.domain, { x: opts.x.slice(0, 2), y: opts.y.slice(0, 2) });
      pts.forEach((p, i) => {
        const [ex, ey] = oraclePx(P, p);
        const [ax, ay] = dataToPx(P, p);
        close(ax, ex, 0.5, `dataToPx x ${p}`); close(ay, ey, 0.5, `dataToPx y ${p}`);
        // Edge points: the dot is clipped to the frame (bbox = visible extent, v2), so only interior dots are checked by bbox centre.
        const interior = p[0] > opts.x[0] && p[0] < opts.x[1] && p[1] > opts.y[0] && p[1] < opts.y[1];
        if (interior) { const [cx, cy] = center(shape(fl, `p${i}`).bbox); close(cx, ex, 0.5, `dot x ${p}`); close(cy, ey, 0.5, `dot y ${p}`); }
      });
    });
  }
}
test("VO-5 C-8 cartesian x[0,10] y[0,5], dot [5,2.5] -> bbox center = plot center ±0.5", async () => {
  const fl = await lay(one((api) => api.cartesian({ x: [0, 10, "m"], y: [0, 5, "m"], static: "s" }), (api) => () => [api.dot([5, 2.5], { id: "d" })]));
  const [cx, cy] = center(shape(fl, "d").bbox), [px, py] = center(fl.panels[0].plot);
  close(cx, px, 0.5); close(cy, py, 0.5);
});
test("VO-5 C-9 log x [1,1000], dot [10, y] -> x = plot.x + plot.width/3 ±0.5", async () => {
  const fl = await lay(one((api) => api.cartesian({ x: [1, 1000, "Hz"], y: [0, 5, "m"], log: "x", static: "s" }), (api) => () => [api.dot([10, 2], { id: "d" })]));
  const P = fl.panels[0].plot;
  close(center(shape(fl, "d").bbox)[0], P.x + P.width / 3, 0.5);
});
for (const vp of ["desktop", "mobile"]) {
  test(`VO-5 C-10 aspect equal x[0,100] y[0,20] ${vp}: same px per unit, plot centered in the free plot area`, async () => {
    const mk = (aspect) => one((api) => api.cartesian({ x: [0, 100, "m"], y: [0, 20, "m"], ...(aspect ? { aspect: "equal" } : {}), static: "s" }), (api) => () => [api.dot([50, 10], { id: "d" })]);
    const eq = (await lay(mk(true), { viewport: vp })).panels[0], free = (await lay(mk(false), { viewport: vp })).panels[0];
    const sx = eq.plot.width / 100, sy = eq.plot.height / 20;
    close(sx, sy, 0.01 * Math.max(sx, sy), "px/unit");
    assert.ok(inside(eq.plot, free.plot, 0.5), "aspect plot inside the free plot area");
    const [a, b] = [center(eq.plot), center(free.plot)];
    close(a[0], b[0], 1, "centered x"); close(a[1], b[1], 1, "centered y");
    const [ex, ey] = oraclePx(eq, [100, 20]), [ax, ay] = dataToPx(eq, [100, 20]);
    close(ax, ex, 0.5); close(ay, ey, 0.5);
  });
}
test("VO-5 camera: domain is the camera window at t, dot at window center -> plot center", async () => {
  const f = one((api) => api.cartesian({ x: [0, 60, "s"], y: [0, 10, "m"], loop: { ms: 1000, span: [0, 50] }, camera: (m, t) => ({ x: [t, t + 10], y: [0, 5] }) }), (api) => (m, t) => [api.dot([t + 5, 2.5], { id: "d" })]);
  for (const t of [0, 20, 50]) {
    const fl = await lay(f, { t });
    assert.deepEqual(fl.panels[0].domain, { x: [t, t + 10], y: [0, 5] }, `t=${t}`);
    const [cx, cy] = center(shape(fl, "d").bbox), [px, py] = center(fl.panels[0].plot);
    close(cx, px, 0.5); close(cy, py, 0.5);
  }
});

// ---------- cells ----------
const opaque = (c) => over(parseColor(c), over(parseColor(BACKGROUND), [255, 255, 255]));
test("VO-5 C-11 cells 4×3: cell(0,0) covers the plot top-left cell, row grows downward, domain x[0,4] y[0,3]", async () => {
  const fl = await lay(one((api) => api.cells({ cols: 4, rows: 3, static: "s" }), (api) => () => [api.cell(0, 0, { id: "c00", value: 1, text: "A" }), api.cell(3, 2, { id: "c32", value: 0 }), api.cell(1, 2, { id: "c12" })]));
  const P = fl.panels[0];
  assert.equal(P.frame, "cells");
  assert.deepEqual(P.domain, { x: [0, 4], y: [0, 3] });
  const cw = P.plot.width / 4, ch = P.plot.height / 3;
  for (const [id, c, r] of [["c00", 0, 0], ["c32", 3, 2], ["c12", 1, 2]]) {
    const b = shape(fl, id).bbox;
    close(b.x, P.plot.x + c * cw, 0.5, `${id} x`); close(b.y, P.plot.y + r * ch, 0.5, `${id} y`);
    close(b.width, cw, 0.5, `${id} w`); close(b.height, ch, 0.5, `${id} h`);
    const [ex, ey] = dataToPx(P, [c, r]);
    close(ex, P.plot.x + c * cw, 0.5); close(ey, P.plot.y + r * ch, 0.5);
  }
  const txt = fl.items.find((i) => i.kind === "text" && i.markId === "c00");
  assert.ok(txt, "cell text item");
  const [tx, ty] = center(txt.box), [bx, by] = center(shape(fl, "c00").bbox);
  close(tx, bx, 1, "text centered x"); close(ty, by, 1, "text centered y");
});
test("VO-5 C-11 cells value colors: text contrast ≥ 4.5 against its cell fill for low/mid/high values; values map to distinct fills", async () => {
  const vals = [0, 0.25, 0.5, 0.75, 1, 10, -3];
  const fl = await lay(one((api) => api.cells({ cols: vals.length, rows: 1, static: "s" }), (api) => () => vals.map((v, c) => api.cell(c, 0, { id: `v${c}`, value: v, text: String(v) }))));
  const fills = new Set();
  vals.forEach((v, c) => {
    const s = shape(fl, `v${c}`), t = fl.items.find((i) => i.kind === "text" && i.markId === `v${c}`);
    assert.ok(s.fill, `cell ${v} has a fill`);
    fills.add(s.fill);
    const bg = over([...parseColor(s.fill).slice(0, 3), parseColor(s.fill)[3] * s.opacity], opaque(BACKGROUND));
    const ratio = wcag(t.color, bg);
    assert.ok(ratio >= 4.5, `value ${v}: ${t.color} on ${s.fill} = ${ratio.toFixed(2)}`);
  });
  assert.ok(fills.size >= 3, "sequential scale yields different fills");
});

// ---------- geo ----------
const SEOUL = [126.98, 37.57], TOKYO = [139.69, 35.69], SHANGHAI = [121.47, 31.23], LONDON = [-0.13, 51.51], LA = [-118.24, 34.05];
const geoFig = (o, marks = (api) => [api.dot(SEOUL, { id: "seoul" })]) => one((api) => api.geo({ ...o, static: "s" }), (api) => () => marks(api));
const deg = (p) => p.map((v) => (v * Math.PI) / 180);
/** Solve px = tx + k·rx, py = ty − k·ry from two points, predict the rest. */
function affineCheck(panel, raw, pts) {
  const R = pts.map((p) => raw(...deg(p))), Px = pts.map((p) => geoProject(panel, p));
  const kx = (Px[1][0] - Px[0][0]) / (R[1][0] - R[0][0]), ky = -(Px[1][1] - Px[0][1]) / (R[1][1] - R[0][1]);
  close(kx, ky, 1e-3 * Math.abs(kx), "uniform scale");
  const tx = Px[0][0] - kx * R[0][0], ty = Px[0][1] + kx * R[0][1];
  for (let i = 2; i < pts.length; i++) {
    close(Px[i][0], tx + kx * R[i][0], 0.5, `x of ${pts[i]}`);
    close(Px[i][1], ty - kx * R[i][1], 0.5, `y of ${pts[i]}`);
  }
  return kx;
}
for (const [proj, raw] of [["equalEarth", d3.geoEqualEarthRaw], ["mercator", d3.geoMercatorRaw]]) {
  for (const vp of ["desktop", "mobile"]) {
    test(`VO-5 C-16 geo ${proj} world ${vp}: geoProject = d3-geo ${proj} raw (affine) ±0.5 px; dot center = geoProject ±0.5`, async () => {
      const fl = await lay(geoFig({ projection: proj }), { viewport: vp });
      const P = fl.panels[0];
      assert.equal(P.frame, "geo");
      affineCheck(P, raw, [[0, 0], [100, 40], SEOUL, LONDON, LA, [-60, -30]]);
      const [ex, ey] = geoProject(P, SEOUL), [cx, cy] = center(shape(fl, "seoul").bbox);
      close(cx, ex, 0.5); close(cy, ey, 0.5);
      for (const p of [[-179.9, 0], [179.9, 0], [0, 60], [0, -60]]) {
        const [x, y] = geoProject(P, p);
        assert.ok(x >= P.plot.x - 1 && x <= P.plot.x + P.plot.width + 1 && y >= P.plot.y - 1 && y <= P.plot.y + P.plot.height + 1, `${p} inside plot`);
      }
      assert.ok(fl.items.some((i) => i.kind === "shape" && i.mark !== "dot"), "base land map drawn");
    });
  }
}
const inPlot = (P, p) => { const [x, y] = geoProject(P, p); return x >= P.plot.x && x <= P.plot.x + P.plot.width && y >= P.plot.y && y <= P.plot.y + P.plot.height; };
test("VO-5 geo region east-asia: Seoul/Tokyo/Shanghai inside plot, London and LA outside, zoomed vs world", async () => {
  const world = (await lay(geoFig({ projection: "mercator" }))).panels[0];
  const P = (await lay(geoFig({ projection: "mercator", region: "east-asia" }))).panels[0];
  for (const p of [SEOUL, TOKYO, SHANGHAI]) assert.ok(inPlot(P, p), `${p} in east-asia`);
  for (const p of [LONDON, LA]) assert.ok(!inPlot(P, p), `${p} not in east-asia`);
  const kW = affineCheck(world, d3.geoMercatorRaw, [[0, 0], [100, 40], SEOUL]), kR = affineCheck(P, d3.geoMercatorRaw, [SHANGHAI, TOKYO, SEOUL]);
  assert.ok(kR > 1.5 * kW, `region scale ${kR} vs world ${kW}`);
});
test("VO-5 geo region indian-ocean: [80,-20] and Colombo inside, Seoul and LA outside", async () => {
  const P = (await lay(geoFig({ projection: "equalEarth", region: "indian-ocean" }))).panels[0];
  for (const p of [[80, -20], [79.86, 6.93]]) assert.ok(inPlot(P, p), `${p} in indian-ocean`);
  for (const p of [SEOUL, LA]) assert.ok(!inPlot(P, p), `${p} not in indian-ocean`);
});
test("VO-5 C-17 geo region 'mars' -> unknown-region error at figures.f, drawn as world", async () => {
  const bad = await lay(geoFig({ projection: "equalEarth", region: "mars" }));
  const errs = bad.errors.filter((e) => e.rule === "unknown-region");
  assert.equal(errs.length, 1, JSON.stringify(bad.errors));
  assert.ok(errs[0].path.startsWith("figures.f"), errs[0].path);
  assert.ok(errs[0].message.length <= 300 && errs[0].message.includes("mars"));
  const world = await lay(geoFig({ projection: "equalEarth" }));
  for (const p of [SEOUL, LA, [0, 0]]) {
    const [a, b] = [geoProject(bad.panels[0], p), geoProject(world.panels[0], p)];
    close(a[0], b[0], 0.5); close(a[1], b[1], 0.5);
  }
});
test("VO-5 geo line between two points follows the great circle (passes d3.geoInterpolate midpoint)", async () => {
  const fl = await lay(geoFig({ projection: "equalEarth" }, (api) => [api.line([SEOUL, LA], { id: "route" })]));
  const P = fl.panels[0];
  const mid = d3.geoInterpolate(SEOUL, LA)(0.5);
  const [mx, my] = geoProject(P, mid);
  const b = shape(fl, "route").bbox;
  assert.ok(my >= b.y - 0.5 && my <= b.y + b.height + 0.5 && mx >= b.x - 0.5 && mx <= b.x + b.width + 0.5, "midpoint inside route bbox");
  const top = Math.min(geoProject(P, SEOUL)[1], geoProject(P, LA)[1]);
  assert.ok(b.y < top - 5, "route bulges poleward of both ends (not a straight screen line)");
});

test("VO-5 C-16 geo Panel carries projection and region; geoProject works on a JSON copy (mercator, east-asia) (spec v4)", async () => {
  const fl = await lay(geoFig({ projection: "mercator", region: "east-asia" }));
  const P = fl.panels[0];
  assert.equal(P.projection, "mercator");
  assert.equal(P.region, "east-asia");
  const copy = JSON.parse(JSON.stringify(P));
  for (const p of [SEOUL, TOKYO, SHANGHAI]) { const [a, b] = [geoProject(P, p), geoProject(copy, p)]; close(a[0], b[0], 1e-9); close(a[1], b[1], 1e-9); }
  const w = (await lay(geoFig({ projection: "equalEarth" }))).panels[0];
  assert.equal(w.projection, "equalEarth");
  assert.ok(w.region === undefined || w.region === "world");
});
