// VO-18 (FR-16): how often the kit runs author code while pre-drawing one scene. ?w=steps|plain|pred picks the class; the scene is entered once
// and every enter(k) / answerVisual(node, id) call is counted from page start (nothing else draws the scene).
const W = A.q.get("w");
const calls = {};
const hit = (k) => { calls[k] = (calls[k] || 0) + 1; };
let scene;
if (W === "steps" || W === "plain") {
  const absorbing = W === "steps";
  // "plain": every step fits at ratio 1 (extras up to 40px against about 150px of free height), so nothing may be absorbed or written.
  const EXTRAS = absorbing ? [0, 60, 330, 120] : [0, 20, 40, 10];
  let extra, fig;
  scene = { type: "figure", title: "S", caption: "c",
    figure(st) { extra = A.spacer(0); fig = A.svg("fig", 480, null); st.appendChild(A.col(fig, extra)); },
    steps: EXTRAS.map((px, k) => ({ caption: "단계 " + (k + 1), hold: 600000, enter() { hit("enter" + k); extra.style.height = px + "px"; } })) };
} else {
  scene = { type: "predict", title: "P", question: "Q?", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "b",
    visual: A.col(A.svg("q", 360, null)),
    answerVisual(node, id) { hit("av" + id); node.appendChild(A.col(A.svg("a_" + id, id === "b" ? 480 : 240, null), A.spacer(id === "b" ? 220 : 0))); },
    why: "이유" };
}
H.deck = LTT.deck({ title: "vo18", theme: "paper", scenes: [{ type: "hook", text: "시작" }, scene, { type: "keywords", terms: [] }] });
(async () => {
  await A.wait(150); H.deck.go(1); await A.wait(800);
  H.samples.calls = { ...calls };
  H.samples.snap = A.snap();
  if (A.q.get("resize")) {
    // A size-key change that keeps a fitting scene fitting (1280 -> 1279 wide), then the resize debounce settles.
    A.fakeWidth(1279); await A.wait(1500);
    H.samples.calls2 = { ...calls };
    H.samples.snap2 = A.snap();
  }
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
