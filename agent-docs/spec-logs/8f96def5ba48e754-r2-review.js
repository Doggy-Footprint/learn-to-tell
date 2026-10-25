// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// R-2 review for spec 8f96def5ba48e754 (diagram edge paths). Run in the page context of
// /gallery/catalog.html (kit loaded, motion enabled). Returns a JSON report; every check
// lists its measured numbers so the ledger can record them.
(async () => {
  const NS = "http://www.w3.org/2000/svg", wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const mk = (spec) => { const sv = document.body.appendChild(document.createElementNS(NS, "svg")); sv.style.width = "900px"; return { sv, dg: LTT.diagram(sv, spec) }; };
  const near = (path, x, y, n = 200) => { const L = path.getTotalLength(); let best = 1e9, at = 0;
    for (let i = 0; i <= n; i++) { const q = path.getPointAtLength((L * i) / n), d = Math.hypot(q.x - x, q.y - y); if (d < best) { best = d; at = i / n; } } return [best, at]; };
  const R = {};
  const { sv, dg } = mk({ cols: 4, rows: 3, cell: [210, 120], node: [150, 56], zones: [{ id: "o", c0: 0, r0: 0, c1: 3, r1: 2, l: "outer" }, { id: "i", parent: "o", c0: 1, r0: 0, c1: 2, r1: 1, l: "inner" }],
    nodes: [{ id: "a", c: 0, r: 0, l: "<b>x</b>" }, { id: "b", c: 2, r: 0, l: "B", s: "sub" }, { id: "c", c: 1, r: 1, l: "one\ntwo\nthree", s: "s1\ns2" }, { id: "d", c: 3, r: 2, l: "D" }, { id: "e", c: 0, r: 2, l: "E" }],
    edges: [{ f: "a", t: "b", k: "accent", dash: true }, { f: "b", t: "a", both: true }, { f: "a", t: "c", shape: "ortho", arrow: false }, { f: "c", t: "d", shape: "curve" }, { id: "r", f: "b", t: "d", shape: "ortho", via: [[3, 0]] }] });
  const P = (id) => dg.edge(id).node();
  // SC1 markers
  R.SC1 = { lines: sv.querySelectorAll("line.e").length, paths: sv.querySelectorAll("path.e").length,
    defaultEnd: !!P("a>b").getAttribute("marker-end"), bothStart: !!P("b>a").getAttribute("marker-start") && !!P("b>a").getAttribute("marker-end"), arrowFalseEnd: P("a>c").getAttribute("marker-end") };
  // SC2 / SC9 / SC8 / SC7 text
  const box = (g) => g.querySelector("rect.box").getBoundingClientRect();
  R.SC2 = { overflow: [] }; R.SC9 = {}; R.SC8 = {};
  for (const id of ["a", "b", "c", "d", "e"]) { const g = dg.node(id).node(), r = box(g);
    for (const t of g.querySelectorAll("text.l,text.s")) { const b = t.getBoundingClientRect(); if (b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5) R.SC2.overflow.push(id + ":" + t.textContent); } }
  { const g = dg.node("c").node(), r = box(g), ts = [...g.querySelectorAll("text.l,text.s")].map((t) => t.getBoundingClientRect());
    const top = Math.min(...ts.map((b) => b.top)) - r.top, bot = r.bottom - Math.max(...ts.map((b) => b.bottom));
    R.SC9 = { tspans: g.querySelectorAll("tspan").length, top: +top.toFixed(2), bottom: +bot.toFixed(2), diff: +Math.abs(top - bot).toFixed(2) }; }
  { const h = dg.layout.nodes.b.h, g = dg.node("b").node(), l = g.querySelector("text.l"), s = g.querySelector("text.s"), ga = dg.node("d").node().querySelector("text.l");
    R.SC8 = { lWithS: +(l.getAttribute("y") ?? l.querySelector("tspan")?.getAttribute("y")), expectL: h / 2 - 3, s: +(s.getAttribute("y") ?? s.querySelector("tspan")?.getAttribute("y")), expectS: h / 2 + 14,
      lAlone: +(ga.getAttribute("y") ?? ga.querySelector("tspan")?.getAttribute("y")), expectAlone: dg.layout.nodes.d.h / 2 + 5 }; }
  { const t = dg.node("a").node().querySelector("text.l"); R.SC7 = { bElements: t.querySelectorAll("b").length, text: t.textContent }; }
  // SC3 zone order
  R.SC3 = [...sv.querySelectorAll("g.z text")].map((t) => t.textContent);
  // SC10 classes
  R.SC10 = P("a>b").getAttribute("class");
  // SC12 edge(), highlight, flow
  dg.highlight(["a", "b"]); R.SC12 = { edgeIsPath: P("a>b").tagName, dimC: dg.node("c").classed("dim"), hotA: dg.node("a").classed("hot"), dimEdgeCD: dg.edge("c>d").classed("dim"), litAB: !dg.edge("a>b").classed("dim") };
  dg.flow(["r"]); R.SC12.flowR = dg.edge("r").classed("run"); R.SC12.flowAB = dg.edge("a>b").classed("run"); dg.highlight(null); dg.flow([]);
  // SC4 / SC5 / SC11 packets
  const measure = async (from, to, path, n = 3) => { const samples = []; const pr = dg.send(from, to, { count: n, ms: 900, gap: 150 });
    for (let k = 0; k < 9; k++) { await wait(130); for (const c of sv.querySelectorAll("circle.pk")) { if (+c.getAttribute("opacity") > 0.2) samples.push(path ? near(path, +c.getAttribute("cx"), +c.getAttribute("cy")) : [+c.getAttribute("cx"), +c.getAttribute("cy")]); } }
    await pr; return samples; };
  const sc4 = {};
  for (const [f, t, id] of [["a", "c", "a>c"], ["c", "d", "c>d"], ["a", "b", "a>b"], ["b", "d", "r"]]) { const s = await measure(f, t, P(id)); sc4[id] = { packets: 3, samples: s.length, maxDist: +Math.max(...s.map((x) => x[0])).toFixed(2) }; }
  R.SC4 = sc4;
  { const s = await measure("d", "b", P("r"), 1); R.SC5 = { samples: s.length, maxDist: +Math.max(...s.map((x) => x[0])).toFixed(2), progress: s.map((x) => +x[1].toFixed(2)) }; }
  { const A = dg.layout.nodes.a, D = dg.layout.nodes.d, s = await measure("a", "d", null, 1);
    const off = s.map(([x, y]) => Math.abs((D.cy - A.cy) * x - (D.cx - A.cx) * y + D.cx * A.cy - D.cy * A.cx) / Math.hypot(D.cy - A.cy, D.cx - A.cx));
    R.SC11 = { samples: s.length, maxDistFromCentreLine: +Math.max(...off).toFixed(2) }; }
  sv.remove();
  return JSON.stringify(R);
})();
