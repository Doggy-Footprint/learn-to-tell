// Spec 2d467cf453771b95 VO-3 T1-T4, VO-2 V11 (+ C-2, C-4, C-6, C-8) on LTT.diagram and LTT.axisPlot roots. No deck; clock frozen per play (see verbs-hand.js).
const S = (H.samples.g = {});
const SPEC = () => ({ width: 600, height: 300, node: [80, 40], nodes: [{ id: "a", x: 100, y: 100, l: "A" }, { id: "b", x: 400, y: 100, l: "B" }, { id: "c", x: 250, y: 220, l: "C" }],
  edges: [{ f: "a", t: "b", l: "lab" }, { f: "b", t: "c", id: "e2" }] });
const mkDg = () => {
  const svg = document.createElementNS(V.NS, "svg");
  document.body.appendChild(svg);
  LTT.diagram(svg, SPEC());
  return { svg, nodes: [...svg.querySelectorAll("g.n")], edges: [...svg.querySelectorAll("path.e")], labels: [...svg.querySelectorAll("text.el")] };
};
const snap = (d, ms) => ({
  ms, vb: V.vb(d.svg),
  nodes: d.nodes.map((n) => ({ rel: V.rel(n), html: n.outerHTML })),
  edges: d.edges.map((e) => ({ dash: V.dash(e), html: e.outerHTML, ends: (() => { const t = V.table(e, 2); return [t.pts[0], t.pts[2]]; })() })),
  labels: d.labels.map((l) => { const r = V.rect(l); return V.toRoot(d.svg, r.cx, r.cy); }),
  boxA: V.rootBox(d.nodes[0].querySelector("rect"), d.svg),
  flow: V.flow(d.svg),
});
const ref = (d, table) => ({ vb0: V.vb(d.svg), nodeBox: V.rootBox(d.nodes[0], d.svg), snap0: snap(d, -1), table: table ? V.table(d.edges[0]) : null, L: d.edges.map((e) => e.getTotalLength()) });
const sampleAll = async (F0, ms, read) => {
  const out = [];
  for (const m of ms) { V.freeze(F0 + m); await V.wait(50); out.push(read(m)); }
  return out;
};
const run1 = async (name, beats, opts, ms, table) => {
  const d = mkDg();
  const F0 = V.real();
  V.freeze(F0);
  const rf = ref(d, table);
  const handle = LTT.motion.play(d.svg, beats, opts);
  await V.wait(50);
  S[name] = { ref: rf, running: handle && handle.running, samples: await sampleAll(F0, ms, (m) => snap(d, m)) };
};
const main = async () => {
  await run1("t1cam", [{ t: [0, 1000], camera: "a" }], { period: 2000 }, [500, 1000, 0, 750]);
  await run1("t1move", [{ t: [0, 1000], morph: "a", to: { translate: [60, 40] } }], { period: 2000 }, [500, 1000, 0, 250]);
  await run1("t2", [{ t: [0, 1000], draw: "a>b" }], { period: 2000 }, [500, 0, 1000]);
  await run1("t3", [{ t: [0, 1000], draw: "e2" }], { period: 2000 }, [500, 0, 1000]);
  await run1("flow", [{ t: [0, 2000], flow: "a>b", count: 2 }], { period: 2000 }, [500, 0, 1000, 1500, 250, 1999], true);
  await run1("chain", [{ t: [0, 1000], camera: [0, 0, 100, 50] }, { t: [1000, 2000], camera: "a" }], { period: 2000 }, [1500, 500, 1000, 1999, 0, 1750]);

  // V11 / C-6: the reference layout comes from LTT.diagramLayout of the same spec with node a at the interpolated centre (A-7). The page uses its own
  // easeInOutCubic copy to place that centre; the Node side re-derives the centre and rejects a mismatch.
  {
    const d = mkDg();
    const F0 = V.real();
    V.freeze(F0);
    const rf = ref(d, false);
    const TO = { x: 300, y: 60 }, V0 = { x: 100, y: 100 };
    const lay = (pos) => { const sp = SPEC(); Object.assign(sp.nodes[0], pos); return { edges: LTT.diagramLayout(sp).edges.map((e) => ({ x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, lx: e.lx, ly: e.ly })) }; };
    rf.layout0 = lay(V0);
    const handle = LTT.motion.play(d.svg, [{ t: [0, 1000], morph: "a", to: TO }], { period: 2000 });
    await V.wait(50);
    S.move = { ref: rf, V0, TO, running: handle && handle.running, samples: await sampleAll(F0, [500, 1000, 0, 250, 750, 1500], (m) => {
      const p = V.clamp(m / 1000, 0, 1), e = V.e(p);
      const pos = { x: V0.x + (TO.x - V0.x) * e, y: V0.y + (TO.y - V0.y) * e };
      return { ...snap(d, m), p, pos, layout: lay(pos) };
    }) };
  }

  {
    const svg = document.createElementNS(V.NS, "svg");
    document.body.appendChild(svg);
    const ap = LTT.axisPlot(svg, { width: 400, height: 200, x: [0, 10], y: [0, 10], series: [{ id: "s1" }, { id: "s2" }] });
    ap.set("s1", [[0, 0], [5, 5], [10, 3]]).set("s2", [[0, 9], [4, 2], [10, 8]]);
    const lines = [...svg.querySelectorAll("path.sr")];
    const L = lines.map((l) => l.getTotalLength()), html0 = lines.map((l) => l.outerHTML);
    const F0 = V.real();
    V.freeze(F0);
    const handle = LTT.motion.play(svg, [{ t: [0, 1000], draw: "s1" }], { period: 2000 });
    await V.wait(50);
    S.axis = { L, html0, running: handle && handle.running, samples: await sampleAll(F0, [500, 0, 1000, 1500, 250], (m) => ({ ms: m, dash: lines.map(V.dash), html: lines.map((l) => l.outerHTML) })) };
  }
};
main().catch((e) => H.errors.push("main: " + (e && e.stack || e))).then(() => { V.thaw(); H.done(H.now()); });
