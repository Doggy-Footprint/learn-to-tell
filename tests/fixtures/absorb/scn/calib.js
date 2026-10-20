// Calibration: one figure scene per spacer height N (natural figure 480px wide -> 300px high). The Node side picks the largest N
// that the page left unadapted (figure still 300px, zoom 1) and derives the free height A from DOM geometry only.
const NS_LIST = (A.q.get("ns") || "1,100,200,300,400,500").split(",").map(Number);
H.deck = LTT.deck({ title: "calib", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  ...NS_LIST.map((n) => ({ type: "figure", title: "n" + n, caption: "c", figure(st) { st.appendChild(A.col(A.svg("fig", A.num("w", 480), null), A.spacer(n))); } })),
  { type: "keywords", terms: [] },
] });
(async () => {
  for (let i = 0; i < NS_LIST.length; i++) {
    await A.wait(150); H.deck.go(i + 1);
    await A.wait(400);
    H.samples["n" + NS_LIST[i]] = A.snap();
  }
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
