// VO-4: author max-height x (desktop overflow / desktop fit / phone). ?author=<px> sets the authored limit (0 = none).
// Default run: overflow -> fit (spacer hidden, innerWidth 1279 + resize) -> overflow again. ?pre=fit starts without overflow.
// A phone is a real narrow window (the Node side passes --window-size 390): LTT.mobile() is decided from the real viewport at load
// and does not follow a faked innerWidth or an iframe resize, so a live desktop -> phone switch cannot be driven from a page.
const AUTHOR = A.num("author", 0);
const authorStyle = AUTHOR ? `max-height:${AUTHOR}px;` : "";
let svg, sp;
H.deck = LTT.deck({ title: "vo4", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "그림", caption: "c", figure(st) { svg = A.svg("fig", 480, null, authorStyle); sp = A.spacer(A.q.get("pre") === "fit" ? 1 : 600); st.appendChild(A.col(svg, sp)); } },
  { type: "keywords", terms: [] },
] });
const snap = (name) => {
  const s = A.snap();
  s.mobile = LTT.mobile(); s.iw = innerWidth;
  H.samples[name] = s;
};
(async () => {
  await A.wait(150); H.deck.go(1); await A.wait(500);
  H.samples.init = A.init.fig;
  snap("entry");
  if (A.q.get("pre") === "fit" || A.q.get("once")) { H.done(H.now()); return; }
  sp.style.display = "none"; A.fakeWidth(1279); await A.wait(500); snap("fit");
  sp.style.display = ""; A.fakeWidth(1280); await A.wait(500); snap("overflowAgain");
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
