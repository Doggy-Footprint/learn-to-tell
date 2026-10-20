// VO-1 T1-T7, T12 and VO-11: one repeating loop (period 2000) made in a figure function.
H.deck = LTT.deck({ title: "loop", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "반복", caption: "c", figure(st) { st.appendChild(LTT.h("div")); H.handle = LTT.motion.loop(H.draw("A"), { period: 2000 }); } },
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.at(100, () => H.go("enter1", 1));
H.at(3100, () => H.go("leave1", 2));
H.at(4100, () => H.go("enter2", 1));
H.at(4600, () => { H.act("hide", () => { H.setHidden(true); }); });
H.at(5600, () => { H.act("show", () => { H.setHidden(false); }); });
H.at(6000, () => { H.act("stop", () => { H.samples.runningBeforeStop = H.handle.running; H.handle.stop(); }); H.samples.runningAfterStop = H.handle.running; });
H.at(7000, () => { H.act("play", () => { H.handle.play(); }); H.samples.runningAfterPlay = H.handle.running; });
H.at(7500, () => { H.act("stop2", () => { H.handle.stop(); }); });
H.at(7800, () => H.go("leave2", 2));
H.at(8000, () => H.go("enter3", 1));
H.done(9000);
