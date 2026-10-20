// Spec 2d467cf453771b95 VO-5 E1-E6 (C-12, C-13). One fault family per scene so every warn is attributed by its text.
// E1-E4 state is read at ms 1500 of the scene's cycle (all good beats finished, so a 16ms start offset cannot matter) by freezing the clock there.
const E = (H.samples.e = {});
const later = {};
const dg = () => { const svg = document.createElementNS(V.NS, "svg"); LTT.diagram(svg, { width: 600, height: 300, node: [80, 40], nodes: [{ id: "a", x: 100, y: 100, l: "A" }, { id: "b", x: 400, y: 100, l: "B" }], edges: [{ f: "a", t: "b" }] }); return svg; };
const fig = (title, build) => ({ type: "figure", title, caption: "c", figure(st) { st.appendChild(LTT.h("div")); build(st); } });
const handIn = (st) => { const h = V.hand(false); st.appendChild(h.svg); return h; };
const html = (h) => ({ ln: h.ln.outerHTML, ci: h.ci.outerHTML, t1: h.t[0].outerHTML, m: h.m.outerHTML, mc: h.mc.outerHTML });
const look = (h) => ({ dash: V.dash(h.p), L: h.p.getTotalLength(), mw: parseFloat(h.m.getAttribute("width")), mcr: parseFloat(h.mc.getAttribute("r")), vb: V.vb(h.svg), html: html(h) });

H.deck = LTT.deck({ title: "verbs-errors", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  fig("e1", (st) => {
    const h = handIn(st), before = html(h), vb0 = V.vb(h.svg);
    const handle = LTT.motion.play(h.svg, [
      { t: [0, 1000], draw: "#p" }, { t: [800, 400], draw: "#ln" }, { t: [0, 9999], draw: "#ci" }, { t: 500, draw: "#t1" }, { t: [0, 1000], morph: "#m", to: { width: 200 } },
    ], { period: 2000 });
    later.e1 = () => ({ before, vb0, running: handle.running, at: look(h) });
  }),
  fig("e2", (st) => {
    const h = handIn(st), before = html(h), vb0 = V.vb(h.svg);
    const handle = LTT.motion.play(h.svg, [
      { t: [0, 1000], draw: "#p" }, { t: [0, 1000], draw: "#ln", camera: [0, 0, 50, 50] }, { t: [0, 1000], morph: "#m", to: { width: 200 } },
    ], { period: 2000 });
    later.e2 = () => ({ before, vb0, running: handle.running, at: look(h) });
  }),
  fig("e3", (st) => {
    const svg = dg(); st.appendChild(svg);
    const e0 = svg.querySelector("path.e"), vb0 = V.vb(svg);
    const h1 = LTT.motion.play(svg, [{ t: [0, 1000], draw: "a>b" }, { t: [0, 1000], camera: "nothere" }, { t: [0, 1000], flow: "x>y" }], { period: 2000 });
    const h = handIn(st), before = html(h);
    const h2 = LTT.motion.play(h.svg, [{ t: [0, 1000], draw: "#p" }, { t: [0, 1000], draw: "#nope" }, { t: [0, 1000], morph: "#m", to: { width: 200 } }], { period: 2000 });
    later.e3 = () => ({ dg: { vb0, vb: V.vb(svg), dash: V.dash(e0), L: e0.getTotalLength(), flow: V.flow(svg), running: h1.running }, hand: { before, running: h2.running, at: look(h) } });
  }),
  fig("e4", (st) => {
    const h = handIn(st), before = html(h), vb0 = V.vb(h.svg);
    const handle = LTT.motion.play(h.svg, [
      { t: [0, 1000], draw: "#p" }, { t: [0, 1000], camera: 42 }, { t: [0, 1000], camera: [10, 20, 30] }, { t: [0, 1000], morph: "#m", to: 99 }, { t: [0, 1000], morph: "#m" },
      { t: [0, 1000], camera: "x" }, { t: [0, 1000], morph: "#mc", to: { r: 60 } },
    ], { period: 2000 });
    later.e4 = () => ({ before, vb0, running: handle.running, at: look(h) });
  }),
  fig("e5", (st) => {
    const div = document.createElement("div");
    st.appendChild(div);
    let thrown = null, handle = null;
    try { handle = LTT.motion.play(div, [{ t: [0, 1000], draw: "#p" }], { period: 2000 }); } catch (e) { thrown = String(e); }
    later.e5 = () => ({ thrown, running: handle && handle.running, hasHandle: !!handle });
  }),
  fig("e6", (st) => {
    const bad = handIn(st), ok = handIn(st);
    later.okWatch = V.watch(ok.svg, ok.p);
    later.badHandle = LTT.motion.play(bad.svg, [{ t: [0, 1900], draw: "#p" }], { period: 2000 });
    later.okHandle = LTT.motion.play(ok.svg, [{ t: [0, 1900], draw: "#p" }], { period: 2000 });
    later.bad = bad;
  }),
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
// Every step waits for the previous one (go -> wait -> freeze/sample -> thaw), so a late timer delays the rest instead of letting the next go overtake a sample.
const main = async () => {
  for (const [i, name] of [[1, "e1"], [2, "e2"], [3, "e3"], [4, "e4"], [5, "e5"]]) {
    H.go(name + "In", i);
    await V.wait(300);
    V.freeze(V.clock(H.marks[name + "In"].t) + 1500);
    await V.wait(60);
    try { E[name] = later[name](); } catch (e) { H.errors.push(name + ": " + (e && e.stack || e)); }
    V.thaw();
    await V.wait(40);
  }
  // E6: the fault is armed 50ms after entry, once the plays are running, on every write path a verb could use.
  H.go("e6In", 6);
  await V.wait(50);
  const p = later.bad.p, boom = () => { throw new Error("boom-verb"); };
  p.getTotalLength = boom; p.getPointAtLength = boom; p.setAttribute = boom; p.setAttributeNS = boom; p.style.setProperty = boom;
  for (const k of ["strokeDashoffset", "strokeDasharray"]) Object.defineProperty(p.style, k, { configurable: true, get: () => "", set: boom });
  await V.wait(1450);
  E.e6 = { badRunning: later.badHandle.running, okRunning: later.okHandle.running, okTicks: later.okWatch.ticks };
  H.go("after", 7);
  H.samples.indexAfter = H.deck.index;
};
H.at(100, () => main().catch((e) => H.errors.push("main: " + (e && e.stack || e))).then(() => H.done(H.now())));
