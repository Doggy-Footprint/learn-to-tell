H.deck = LTT.deck({ title: "sweep a", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { title: "단계 손잡이", sub: "s", mount(body) {
    body.innerHTML = `<div class="ltt-param">w <b id="w-v"></b><div id="w"></div></div>`;
    LTT.sweep({ params: { w: { kind: "steps", stops: [1, 2, 3, 4, 5], value: 1 } }, render(v) { H.log.push(["w", v.w, H.now()]); } });
    return {};
  } },
  H.sweepScene("x"),
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.at(100, () => H.go("eW", 1));
H.at(3100, () => H.go("eX", 2));
H.watchKnob("x", 3200, 9300);
H.at(6100, () => {
  const i = document.getElementById("x");
  H.act("touch", () => i.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
  i.value = "5";
  i.dispatchEvent(new Event("input", { bubbles: true }));
});
H.at(6800, () => H.act("goalSet", () => { const i = document.getElementById("x"); i.value = "8"; i.dispatchEvent(new Event("input", { bubbles: true })); }));
H.at(7600, () => H.go("away", 3));
H.at(7900, () => H.go("back", 2));
H.done(9400);
