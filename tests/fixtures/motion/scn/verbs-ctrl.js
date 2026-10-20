// Spec 2d467cf453771b95 VO-4 hidden tab, `el`, handle stop()/play(). Writes are stamped at write time (V.watch rows) and compared to the marks below.
const W = (H.samples.watch = {});
const svgIn = (st, label, withWatch = true) => {
  const h = V.hand(false);
  st.appendChild(h.svg);
  if (withWatch) W[label] = V.watch(h.svg, h.p);
  return h;
};
const slow = [{ t: [0, 1900], draw: "#p" }];
let hid, hnd, elA, elB, elC, elD, el, handle;
H.deck = LTT.deck({ title: "verbs-ctrl", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "hid", caption: "c", figure(st) { const h = svgIn(st, "hid"); LTT.motion.play(h.svg, slow, { period: 2000 }); } },
  { type: "figure", title: "el", caption: "c", figure(st) {
    el = document.createElement("div"); st.appendChild(el);
    elA = svgIn(st, "A"); elB = svgIn(st, "B"); elC = svgIn(st, "C"); elD = svgIn(st, "D");
    LTT.motion.play(elA.svg, slow, { period: 2000, el });
    LTT.motion.play(elC.svg, slow, { period: 2000 });
    LTT.motion.play(elD.svg, slow, { period: 2000 });
  } },
  { type: "figure", title: "hnd", caption: "c", figure(st) { const h = svgIn(st, "hnd"); handle = LTT.motion.play(h.svg, [{ t: [0, 2900], draw: "#p" }], { period: 3000 }); } },
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.at(100, () => H.go("hidIn", 1));
H.at(700, () => H.act("hide", () => H.setHidden(true)));
H.at(1700, () => H.act("show", () => H.setHidden(false)));
H.at(2600, () => H.go("elIn", 2));
H.at(3100, () => H.act("el2", () => {
  LTT.motion.play(elB.svg, slow, { period: 2000, el });
  LTT.motion.play(elC.svg, [{ t: [0, 1900], draw: "#ln" }], { period: 2000 });
  elD.svg.remove();
}));
H.at(4600, () => H.go("hndIn", 3));
H.at(5100, () => H.act("stop", () => handle.stop()));
H.at(5100, () => { H.samples.runningStopped = handle.running; });
H.at(5800, () => H.act("play", () => handle.play()));
H.at(5800, () => { H.samples.runningPlayed = handle.running; });
H.at(7000, () => { H.samples.end = true; });
H.done(7100);
