// VO-5 (C-19): scene 2 holds an 880px-wide figure (550px high) above a 300px spacer in one stage. Unabsorbed the figure covers about half
// of the stage; once absorbed (0.65, both sides scaled) it covers about a quarter, below the 35% loose-figure bar. Run it at 1280x800
// (content overflows, figure absorbed) and at 1280x1700 (fits, figure untouched) to prove the pre-absorb size is above the bar.
// Scene 3 is a positive control: a small figure that must still be reported as loose.
H.deck = LTT.deck({ title: "vo5", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "넓은 그림", caption: "c", figure(st) { st.appendChild(A.col(A.svg("fig", 880, null), A.spacer(300))); } },
  { type: "figure", title: "작은 그림", caption: "c", figure(st) { st.appendChild(A.col(A.svg("fig", 187, null))); } },
  { type: "keywords", terms: [] },
] });
(async () => {
  for (const i of [1, 2]) { await A.wait(150); H.deck.go(i); await A.wait(450); H.samples["s" + (i + 1)] = A.snap(); const st = A.cur().querySelector(".dk-fig-stage"), f = H.samples["s" + (i + 1)].f, r = st.getBoundingClientRect(); H.samples["stage" + (i + 1)] = { w: r.width / f, h: r.height / f }; }
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
