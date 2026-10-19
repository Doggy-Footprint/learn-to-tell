// Spec 2d467cf453771b95 VO-4 reduced-motion (C-11); run with --force-prefers-reduced-motion. Flow is left out: its p = 1 appearance is not pinned by the spec.
let w = null, hh = null;
const state = () => { const d = V.dashRaw(hh.p); return { frac: d.off / d.L, vb: V.vb(hh.svg), mw: parseFloat(hh.m.getAttribute("width")), bars: hh.bars.map((b) => V.rel(b)[3]) }; };
H.deck = LTT.deck({ title: "verbs-reduced", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "줄인 움직임", caption: "c", figure(st) {
    hh = V.hand(false);
    st.appendChild(hh.svg);
    w = V.watch(hh.svg, hh.p);
    LTT.motion.play(hh.svg, [
      { t: [0, 500], draw: "#p" }, { t: [500, 1000], camera: [0, 0, 100, 50] }, { t: [1000, 1500], morph: "#m", to: { width: 200 } },
      { t: [0, 1500], stack: ".bar" },
    ], { period: 2000 });
  } },
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.samples.reduced = LTT.motion.reduced();
H.at(100, () => H.go("in1", 1));
H.at(700, () => { H.samples.state1 = state(); });
H.at(1100, () => H.go("out1", 2));
H.at(1300, () => H.go("in2", 1));
H.at(1900, () => { H.samples.state2 = state(); });
H.at(2300, () => { H.samples.ticks = w.ticks; });
H.done(2400);
