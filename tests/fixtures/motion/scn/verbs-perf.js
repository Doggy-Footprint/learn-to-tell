// Spec 2d467cf453771b95 VO-7: a play with five verbs + one dwell beat (6 beats) at 1280x800. Run several times by the test (host-load retry).
const perf = { type: "figure", title: "perf", caption: "c", figure(st) {
  const h = V.hand(false);
  st.appendChild(h.svg);
  H.samples.w = V.watch(h.svg, h.p);
  LTT.motion.play(h.svg, [
    { t: [0, 500], draw: "#p" }, { t: [500, 1000], flow: "#q" }, { t: [1000, 1500], camera: "#cam" },
    { t: [1500, 2000], morph: "#m", to: { width: 200 } }, { t: [2000, 2500], stack: ".bar" }, { t: [2500, 3000], text: "쉼" },
  ], { period: 4000 });
} };
H.deck = LTT.deck({ title: "verbs-perf", theme: "paper", scenes: [{ type: "hook", text: "시작" }, perf, { type: "statement", title: "쉼" }] });
H.at(100, () => H.go("perf", 1));
H.at(400, () => { H.samples.perfBeats = H.cur().getAttribute("data-ltt-beats"); });
H.done(1500);
