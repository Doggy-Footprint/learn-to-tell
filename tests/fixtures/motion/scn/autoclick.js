// VO-AUTO (C-6, C-7, FR-3 v2: prev/next/arrow keys stop, dots are not controls; QR-4): one 3-step figure scene "I" visited many times; each visit exercises one transition of the player's state machine.
const btns = () => H.cur().querySelectorAll(".ltt-stepper button");
H.deck = LTT.deck({ title: "autoclick", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "I", caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = "I"; },
    steps: ["i0", "i1", "i2"].map((caption) => ({ caption, enter: H.step("I") })) },
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
let T = 100;
const visit = (name, dur, plan) => {
  const t0 = T;
  H.at(t0, () => H.go(name, 1));
  if (plan) plan(t0);
  H.at(t0 + dur, () => H.go(name + "x", 2));
  T = t0 + dur + 1000;
};
visit("prev", 6000, (t0) => H.at(t0 + 2100, () => H.act("prev:c", () => H.click(btns()[0]))));
visit("next", 5500, (t0) => H.at(t0 + 500, () => H.act("next:c", () => H.click(btns()[1]))));
const key = (k) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
visit("keyl", 5500, (t0) => H.at(t0 + 2100, () => H.act("keyl:c", () => key("ArrowLeft"))));
visit("key", 5500, (t0) => H.at(t0 + 500, () => H.act("key:c", () => key("ArrowRight"))));
visit("re", 3500);
visit("loop", 14000, (t0) => {
  H.at(t0 + 500, () => H.act("loop:s", () => H.click(btns()[2])));
  H.at(t0 + 5000, () => H.act("loop:p", () => H.click(btns()[2])));
});
visit("q1", 2500);
visit("q2", 2500);
visit("q3", 2500);
visit("q4", 6200);
visit("rs", 6000, (t0) => H.at(t0 + 2500, () => H.act("rs:resize", () => {
  Object.defineProperty(window, "innerWidth", { configurable: true, get: () => 1279 });
  window.dispatchEvent(new Event("resize"));
})));
H.done(T + 200);
