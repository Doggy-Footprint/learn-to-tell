// VO-12: error injection. Scene 2 throws when anything reads or writes the figure's inline style, scene 3 throws when the kit searches its
// body for figures (the hit counter H.cnt.bodyQuery tells whether the injected search was ever reached), scene 4's step enter throws on step 2 (reached while the kit pre-draws every step). Scene 5 is a normal overflowing figure that must
// still be absorbed. Scenes 2-4 overflow through a plain spacer, so the kit has a reason to try absorbing them.
const boom = (m) => { throw new Error(m); };
const fig = (title, mk) => ({ type: "figure", title, caption: "c", figure(st) { const s = A.svg("fig", 480, null); mk(s); st.appendChild(A.col(s, A.spacer(500))); } });
H.deck = LTT.deck({ title: "vo12", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  fig("style throws", (s) => Object.defineProperty(s, "style", { configurable: true, get() { boom("boom-style"); } })),
  { title: "query throws", narration: "n", mount(body) {
      body.appendChild(A.col(A.svg("fig", 480, null), A.spacer(500)));
      // ?noquery=1 (the audit run) leaves this scene alone: the audit pass reads the body through the same members and would die for reasons outside the absorb path.
      if (A.q.get("noquery")) return;
      for (const m of ["querySelectorAll", "querySelector", "getElementsByTagName", "getElementsByClassName"]) body[m] = () => { H.inc("bodyQuery"); boom("boom-" + m); };
    } },
  { type: "figure", title: "enter throws", caption: "c",
    figure(st) { st.appendChild(A.col(A.svg("fig", 480, null), A.spacer(500))); },
    steps: [0, 1, 2].map((k) => ({ caption: "단계 " + (k + 1), hold: 600000, enter() { if (k === 1) boom("boom-enter"); } })) },
  { type: "figure", title: "normal", caption: "c", figure(st) { st.appendChild(A.col(A.svg("fig", 480, null), A.spacer(500))); } },
  { type: "keywords", terms: [] },
] });
(async () => {
  for (let i = 1; i <= 5; i++) {
    await A.wait(150); H.deck.go(i); await A.wait(450);
    const sc = A.cur();
    H.samples["s" + (i + 1)] = { ...A.snap(), rendered: !!sc.querySelector(".dk-body svg"), index: [...document.querySelectorAll(".dk-scene")].indexOf(sc) };
  }
  H.samples.cnt = { ...H.cnt }; H.samples.sceneCount = document.querySelectorAll(".dk-scene").length;
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
