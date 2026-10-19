// VO-11 QR-1/QR-2: three scenes each with one loop; scene index 2 stays current.
const fig = (label) => ({ type: "figure", title: label, caption: "c", figure(st) { st.appendChild(LTT.h("div")); LTT.motion.loop(H.draw(label), { period: 2000 }); } });
H.deck = LTT.deck({ title: "perf", theme: "paper", scenes: [{ type: "hook", text: "시작" }, fig("L1"), fig("L2"), fig("L3"), { type: "keywords", terms: [] }] });
H.at(100, () => H.go("e1", 1));
H.at(300, () => H.go("e3", 3));
H.at(500, () => H.go("e2", 2));
H.done(3700);
