// VO-10 E1-E4 (C-19, C-20): each fault sits in its own scene, entered at its own mark, so every warn is attributed by time.
H.deck = LTT.deck({ title: "errors", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "오류", caption: "c", figure(st) {
    st.appendChild(LTT.h("div"));
    let n = 0;
    LTT.motion.loop((u) => { n++; H.log.push(["T", u, H.now()]); if (n === 2) throw new Error("boom-draw"); }, { period: 2000 });
    LTT.motion.loop(H.draw("OK"), { period: 2000 });
    LTT.motion.bind({ enter() { throw new Error("boom-enter"); }, leave() { throw new Error("boom-leave"); } });
    H.bind("K");
  } },
  { type: "figure", title: "주기 0", caption: "c", figure(st) { st.appendChild(LTT.h("div")); LTT.motion.loop(H.draw("P0"), { period: 0 }); } },
  { type: "figure", title: "나쁜 비트", caption: "c", figure(st) { st.appendChild(LTT.h("div")); LTT.motion.loop(H.draw("BB"), { period: 1000, beats: [{ t: -1 }, { t: 99999 }, { t: 500 }] }); } },
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.at(100, () => H.go("in", 1));
H.at(2600, () => H.go("out", 4));
H.at(2700, () => { H.samples.indexAfterOut = H.deck.index; });
H.at(3000, () => H.go("back", 1));
H.at(3100, () => { H.samples.indexAfterBack = H.deck.index; });
H.at(3600, () => H.go("p0", 2));
H.at(5600, () => H.go("bb", 3));
H.done(6600);
