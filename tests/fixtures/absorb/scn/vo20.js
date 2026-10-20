// VO-20: a text-only scene (untyped mount, one spacer, no absorbable drawing, so absorb stays 1 and only zoom acts) whose height is ?n px.
// The Node side derives n from the calibration of the same fixture (cap and inH at n=1) so that the settled zoom lands where it wants.
H.deck = LTT.deck({ title: "vo20", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { title: "글만 있는 장면", narration: "n", mount(body) { body.appendChild(A.spacer(A.num("n", 1))); } },
  { type: "keywords", terms: [] },
] });
(async () => {
  await A.wait(150); H.deck.go(1); await A.wait(600);
  H.samples.s = A.snap();
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
