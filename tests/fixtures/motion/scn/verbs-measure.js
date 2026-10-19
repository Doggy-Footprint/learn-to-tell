// Spec 2d467cf453771b95 VO-4 measurement mode (C-16): plays made inside figure-steps pre-draws. Each play's DOM-change batches are recorded.
let n = 0, ST = null;
const plays = [];
H.deck = LTT.deck({ title: "verbs-measure", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "단계", caption: "c", autoplay: false, figure(st) { ST = st; st.appendChild(LTT.h("div")); },
    steps: [0, 1, 2].map((i) => ({ caption: "단계 " + i, enter() {
      const h = V.hand(false);
      ST.appendChild(h.svg);
      const w = V.watch(h.svg, h.p), created = H.now();
      LTT.motion.play(h.svg, [{ t: [0, 1000], draw: "#p" }, { t: [500, 1500], morph: "#m", to: { width: 200 } }], { period: 2000 });
      plays.push({ label: "M" + (++n), step: i, created, w, h });
    } })) },
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.at(100, () => H.go("in", 1));
H.at(1100, () => H.go("out", 2));
H.at(1300, () => H.go("back", 1));
H.at(2300, () => {
  H.samples.plays = plays.map((p) => { const d = V.dashRaw(p.h.p); return { label: p.label, step: p.step, created: p.created, ticks: p.w.ticks, frac: d.off / d.L, mw: parseFloat(p.h.m.getAttribute("width")) }; });
});
H.done(2400);
