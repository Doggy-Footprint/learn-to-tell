// Spec 2d467cf453771b95 VO-4 beat exposure (data-ltt-beats and ?audit JSON `beats`), read per scene index.
const figure = (label, beats, opts) => ({ type: "figure", title: label, caption: "c", figure(st) {
  const h = V.hand(false);
  st.appendChild(h.svg);
  LTT.motion.play(h.svg, beats, opts);
} });
H.deck = LTT.deck({ title: "verbs-beats", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  figure("loopText", [{ t: [0, 1000], text: "가", draw: "#p" }, { t: [1000, 3000], text: "나" }], { period: 3000 }),
  figure("onceText", [{ t: [0, 1000], text: "가", draw: "#p" }, { t: [1000, 3000], text: "나" }], { period: 3000, once: true }),
  figure("noText", [{ t: [0, 500], draw: "#p" }, { t: [500, 1500], camera: "#cam" }, { t: [1500, 2000], morph: "#m", to: { width: 200 } }], { period: 2000 }),
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.at(9000, () => {
  H.samples.attrs = [...document.querySelectorAll("section.dk-scene")].map((s) => s.getAttribute("data-ltt-beats"));
});
H.done(9100);
