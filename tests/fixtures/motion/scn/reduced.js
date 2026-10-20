// VO-3 M1-M5 (C-5); run with --force-prefers-reduced-motion.
const knob = (id) => `<div id="${id}-g"></div><label class="ltt-param">${id} <b id="${id}-v"></b><input type="range" id="${id}" min="0" max="10" step="1" value="2"></label>`;
H.deck = LTT.deck({ title: "reduced", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "줄인 움직임", caption: "c", figure(st) {
    st.appendChild(LTT.h("div"));
    LTT.motion.loop(H.draw("M1"), { period: 2000, beats: [{ t: 500 }, { t: 1500 }] });
    LTT.motion.loop(H.draw("M2"), { period: 2000 });
    LTT.motion.loop(H.draw("M3"), { period: 2000, rest: 0.3 });
  } },
  { type: "statement", title: "쉼" },
  { type: "figure", title: "단계", caption: "c", figure(st) { st.appendChild(LTT.h("div")); },
    steps: [0, 1, 2].map((i) => ({ caption: "단계 " + i, hold: 300, enter: H.step("S") })) },
  { title: "손잡이", sub: "s", mount(body) {
    body.innerHTML = knob("x");
    LTT.sweep({ params: { x: {} }, render(v) { H.log.push(["X", v.x, H.now()]); }, goal: { el: "x-g", text: "8을 찾는다", check: (v) => v.x === 8 } });
    return {};
  } },
  { type: "keywords", terms: [] },
] });
H.samples.reduced = LTT.motion.reduced();
H.at(100, () => H.go("in1", 1));
H.at(1100, () => H.go("out1", 2));
H.at(1300, () => H.go("in2", 1));
H.at(2300, () => H.go("steps", 3));
H.at(4300, () => H.go("sweep", 4));
for (let t = 4400; t <= 6200; t += 100) H.at(t, () => { const i = document.getElementById("x"); H.watch.push(["x", i && i.value, H.now()]); });
H.done(6300);
