// VO-2 B1-B11 and VO-14 T1: a loop and a bind made at each binding site.
const both = (label) => { LTT.motion.loop(H.draw(label), { period: 2000 }); H.bind(label); };
const vis = (label) => (el) => { el.appendChild(LTT.h("div")).textContent = label; both(label); };
H.deck = LTT.deck({ title: "bind", theme: "paper", glossary: {}, scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "B1", caption: "c", figure(st) { st.appendChild(LTT.h("div")); both("B1"); }, takeaway: "t1", recall: "r1" },
  { type: "figure", title: "B2", caption: "c", autoplay: false, figure(st) { st.appendChild(LTT.h("div")); },
    steps: [{ caption: "하나", enter() {} }, { caption: "둘", enter() { if (H.armB2) { H.armB2 = false; both("B2"); } } }] },
  { type: "statement", title: "B3", visual: vis("B3") },
  { type: "compare", title: "B4", sub: "s", items: [{ label: "가", visual: vis("B4") }, { label: "나", visual: "<div>나</div>" }] },
  { type: "contrast", title: "B5", sub: "s", before: { visual: vis("B5") }, after: { visual: vis("B5a") } },
  { type: "terms", title: "B6", terms: [{ key: "용어", plain: "뜻", visual: vis("B6") }] },
  { type: "predict", title: "B7 B8", question: "어느 쪽?", visual: vis("B7"),
    choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a", why: "이유",
    answerVisual(node) { node.appendChild(LTT.h("div")).textContent = "답"; LTT.motion.loop(H.draw("B8"), { period: 2000 }); H.bind("B8"); } },
  { title: "B10", sub: "s", mount(body) {
    body.appendChild(LTT.h("div")).textContent = "m";
    both("B10");
    return { enter() { H.inc("M:enter"); }, leave() { H.inc("M:leave"); } };
  } },
  { type: "statement", title: "B11", enter(body) { if (!H.b11) { H.b11 = true; both("B11"); } } },
  { type: "summary", title: "정리" },
  { type: "overview", title: "B9", caption: "c", figure(st) { st.appendChild(LTT.h("div")); both("B9"); } },
  { type: "keywords", terms: [] },
] });
const SITES = [["B1", 1], ["B2", 2], ["B3", 3], ["B4", 4], ["B5", 5], ["B5a", 5], ["B6", 6], ["B7", 7], ["B8", 7], ["B10", 8], ["B11", 9], ["B9", 11]];
let t = 100;
for (const [label, i] of SITES) {
  H.at(t, () => H.go(label + ":in", i));
  if (label === "B2") H.at(t + 150, () => { H.act("B2:act", () => { H.armB2 = true; H.click(H.cur().querySelectorAll(".ltt-stepper button")[1]); }); });
  if (label === "B8") H.at(t + 150, () => H.act("B8:act", () => {
    H.click(H.cur().querySelector('[data-choice="a"]'));
  }));
  H.at(t + 800, () => H.go(label + ":out", 0));
  H.at(t + 1300, () => H.go(label + ":back", i));
  H.at(t + 2000, () => H.go(label + ":out2", 0));
  t += 2300;
}
H.done(t + 200);
