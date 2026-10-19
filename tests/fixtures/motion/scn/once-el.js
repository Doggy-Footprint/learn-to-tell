// VO-1 T8-T11: a once loop (period 1000) and a loop bound to a node (opts.el) that the page later removes.
H.deck = LTT.deck({ title: "once", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "한 번", caption: "c", figure(st) { st.appendChild(LTT.h("div")); LTT.motion.loop(H.draw("O"), { period: 1000, once: true }); } },
  { type: "figure", title: "노드", caption: "c", figure(st) {
    const n = st.appendChild(LTT.h("div", "el-node"));
    n.textContent = "노드";
    H.elNode = n;
    H.samples.elConnectedAtCreate = n.isConnected;
    LTT.motion.loop(H.draw("E"), { period: 2000, el: n });
  } },
  { type: "figure", title: "같은 노드", caption: "c", figure(st) {
    H.sameNode = st.appendChild(LTT.h("div"));
    H.sameNode.textContent = "같은";
    LTT.motion.loop(H.draw("S1"), { period: 2000, el: H.sameNode });
  } },
  { type: "figure", title: "단계 노드", caption: "c", figure(st) { H.stepNode = st.appendChild(LTT.h("div")); H.stepNode.textContent = "단계"; },
    steps: [0, 1].map((i) => ({ caption: "단계 " + i, hold: 500, enter() { LTT.motion.loop(H.draw("SE#" + (H.nse = (H.nse || 0) + 1)), { period: 2000, el: H.stepNode }); } })) },
  { type: "statement", title: "공통 enter", enter() { LTT.motion.loop(H.draw("CE#" + (H.nce = (H.nce || 0) + 1)), { period: 2000 }); H.bind("CEB"); } },
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.at(100, () => H.go("enterO1", 1));
H.at(3100, () => H.go("enterE1", 2));
H.at(3600, () => { H.act("removed", () => { H.elNode.remove(); }); });
H.at(4100, () => H.go("enterO2", 1));
H.at(5300, () => H.go("enterE2", 2));
H.at(6300, () => H.go("enterS", 3));
H.at(6800, () => { H.act("swap", () => { LTT.motion.loop(H.draw("S2"), { period: 2000, el: H.sameNode }); }); });
H.at(7800, () => H.go("enterSE", 4));
for (let v = 0; v < 3; v++) {
  H.at(10200 + v * 1200, () => H.go("ce" + v, 5));
  H.at(10200 + v * 1200 + 800, () => H.go("ceOut" + v, 6));
}
H.done(14000);
