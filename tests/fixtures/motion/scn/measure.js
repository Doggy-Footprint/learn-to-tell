// VO-3 M6-M8 (C-6): loops and binds made inside the measurement pre-draws (figure steps, predict answerVisual).
let n6 = 0, n7 = 0;
H.deck = LTT.deck({ title: "measure", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "단계", caption: "c", autoplay: false, figure(st) { st.appendChild(LTT.h("div")); },
    steps: [0, 1, 2].map((i) => ({ caption: "단계 " + i, enter() { LTT.motion.loop(H.draw("M6#" + (++n6)), { period: 2000 }); (H.samples.m6binds ||= []).push("M6b#" + n6); H.bind("M6b#" + n6); } })) },
  { type: "predict", title: "짐작", question: "어느 쪽?", choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a", why: "이유",
    answerVisual(node) { node.appendChild(LTT.h("div")).textContent = "답"; LTT.motion.loop(H.draw("M7#" + (++n7)), { period: 2000 }); H.bind("M8b"); } },
  { type: "statement", title: "쉼" },
  { type: "keywords", terms: [] },
] });
H.at(100, () => H.go("stepsIn", 1));
H.at(1100, () => H.go("stepsOut", 3));
H.at(1300, () => H.go("stepsBack", 1));
H.at(1800, () => H.go("predIn", 2));
H.at(2800, () => H.go("predOut", 3));
H.at(3000, () => H.go("predBack", 2));
H.at(3500, () => { H.mark("reveal"); H.click(H.cur().querySelector('[data-choice="b"]')); });
H.at(4500, () => H.go("predLeave", 3));
H.done(4800);
