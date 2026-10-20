// VO-1: one figure scene (480px wide svg -> 300px high) followed by a spacer of ?n px; the observation is taken after entering scene 2.
const N = A.num("n", 1);
H.deck = LTT.deck({ title: "vo1", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "그림", caption: "c", figure(st) { st.appendChild(A.col(A.svg("fig", A.num("w", 480), null), A.spacer(N))); } },
  { type: "keywords", terms: [] },
] });
(async () => {
  await A.wait(150); H.deck.go(1);
  await A.wait(500);
  H.samples.s = A.snap();
  H.samples.init = A.init.fig;
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
