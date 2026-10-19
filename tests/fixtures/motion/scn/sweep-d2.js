H.deck = LTT.deck({ title: "sweep d", theme: "paper", scenes: [{ type: "hook", text: "시작" },
  H.sweepScene("x", { attract: false }), H.sweepScene("y", { attract: { param: "nope" } }), { type: "keywords", terms: [] }] });
H.at(100, () => H.go("eX", 1));
H.watchKnob("x", 200, 2100);
H.at(2200, () => H.go("eY", 2));
H.watchKnob("y", 2300, 4200);
H.at(4300, () => { H.act("input", () => { const i = document.getElementById("y"); i.value = "4"; i.dispatchEvent(new Event("input", { bubbles: true })); }); });
H.done(4600);
