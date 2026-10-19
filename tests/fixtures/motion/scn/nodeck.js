// VO-2 B12 (C-24) and VO-14: no deck on the page.
document.body.insertAdjacentHTML("beforeend", `<div id="st"><div class="pic"></div></div>
  <label class="ltt-param">x <b id="x-v"></b><input type="range" id="x" min="0" max="10" step="1" value="2"></label>`);
LTT.motion.loop(H.draw("N"), { period: 1000 });
H.bind("NB");
H.stepperHandle = LTT.stepper(document.getElementById("st"), [0, 1, 2].map((i) => ({ caption: "단계 " + i, hold: 300, enter: H.step("ST") })));
const sw = LTT.sweep({ params: { x: {} }, render(v) { H.log.push(["X", v.x, H.now()]); } });
H.samples.sweepKeys = sw && typeof sw === "object" ? Object.keys(sw) : String(sw);
H.samples.stepperKeys = H.stepperHandle && typeof H.stepperHandle === "object" ? Object.keys(H.stepperHandle) : String(H.stepperHandle);
H.at(1000, () => { H.act("hide", () => { H.setHidden(true); }); });
H.at(2000, () => { H.act("show", () => { H.setHidden(false); }); });
H.done(3000);
