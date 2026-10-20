// Spec 2d467cf453771b95 VO-1 (leave -> return, live ticks), VO-4 (leave stops, once holds its end), A-5 (default period).
// Ticks are observed as batches of DOM changes (V.watch) because the play's loop is internal; rows are [time, stroke-dashoffset/L of #p].
const W = (H.samples.watch = {}), handles = {};
const figure = (label, beats, opts) => ({ type: "figure", title: label, caption: "c", figure(st) {
  const h = V.hand(false);
  st.appendChild(h.svg);
  W[label] = V.watch(h.svg, h.p);
  handles[label] = LTT.motion.play(h.svg, beats, opts);
} });
H.deck = LTT.deck({ title: "verbs-life", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  figure("life", [{ t: [0, 1000], draw: "#p" }], { period: 2000 }),
  { type: "statement", title: "쉼" },
  figure("once", [{ t: [0, 1000], draw: "#p" }], { period: 2000, once: true }),
  { type: "statement", title: "쉼2" },
  figure("dflt", [{ t: [0, 1500], draw: "#p" }]),
  { type: "keywords", terms: [] },
] });
H.at(100, () => H.go("life1", 1));
H.at(1700, () => H.go("lifeOut", 2));
H.at(2000, () => H.go("life2", 1));
H.at(3500, () => H.go("lifeOut2", 2));
H.at(3600, () => H.go("once1", 3));
H.at(5600, () => H.go("onceOut", 4));
H.at(5800, () => H.go("once2", 3));
H.at(7600, () => H.go("onceOut2", 4));
H.at(7700, () => H.go("dflt", 5));
H.at(8400, () => { H.samples.dfltBeats = H.cur().getAttribute("data-ltt-beats"); });
H.at(10700, () => { H.samples.running = Object.fromEntries(Object.entries(handles).map(([k, v]) => [k, v && v.running])); });
H.done(10800);
