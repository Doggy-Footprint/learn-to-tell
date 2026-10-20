H.deck = LTT.deck({ title: "sweep c", theme: "paper", scenes: [{ type: "hook", text: "시작" },
  H.sweepScene("x", { presets: "#x-p button" }, `<div id="x-p"><button data-preset='{"x":6}'>6</button></div>`), { type: "keywords", terms: [] }] });
H.at(100, () => H.go("e", 1));
H.watchKnob("x", 200, 3500);
H.at(1600, () => { H.act("touch", () => { H.click(document.querySelector('#x-p [data-preset]')); }); });
H.done(3600);
