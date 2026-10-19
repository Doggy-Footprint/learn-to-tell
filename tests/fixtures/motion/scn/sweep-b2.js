H.deck = LTT.deck({ title: "sweep b", theme: "paper", scenes: [{ type: "hook", text: "시작" }, H.sweepScene("x"), { type: "keywords", terms: [] }] });
H.at(100, () => H.go("e", 1));
H.watchKnob("x", 200, 3500);
H.at(1600, () => { H.act("touch", () => { document.getElementById("x").dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", bubbles: true })); }); });
H.done(3600);
