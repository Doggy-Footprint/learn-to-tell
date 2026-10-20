// VO-5 (C-10..C-12): figure steps auto-play with autoplay default, "once" and false.
const steps = (label, holds) => holds.map((hold, i) => ({ caption: ["첫 <b>단계</b>", "{{만료 시간|TTL}} 둘", "셋 {{TTL}}"][i], hold, enter: H.step(label) }));
const fig = (title, label, extra) => ({ type: "figure", title, caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = title; }, steps: steps(label, [1000, 1000, 1000]), ...extra });
H.deck = LTT.deck({ title: "autoplay", theme: "paper", glossary: { TTL: "유효 시간" }, scenes: [
  { type: "hook", text: "{{TTL}} 시작" },
  fig("기본", "S1", {}),
  fig("한 번", "S2", { autoplay: "once" }),
  fig("끔", "S3", { autoplay: false }),
  { type: "statement", title: "쉼" },
  { type: "figure", title: "하나", caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = "하나"; }, steps: [{ caption: "only", hold: 300, enter: H.step("S5") }] },
  { type: "figure", title: "hold", caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = "hold"; },
    steps: [500, 1500, 1000].map((hold, i) => ({ caption: "h" + i, hold, enter: H.step("S6") })) },
  { type: "keywords", terms: [] },
] });
const attr = (i) => document.querySelectorAll("section.dk-scene")[i].getAttribute("data-ltt-beats");
H.at(100, () => H.go("e1", 1));
H.at(3000, () => { H.samples.beats1 = attr(1); });
H.at(3800, () => { H.act("click", () => { H.click(H.cur().querySelectorAll(".ltt-stepper button")[1]); }); });
H.at(6000, () => H.go("away", 4));
H.at(6300, () => H.go("e2", 1));
H.at(7800, () => { H.act("resize", () => { Object.defineProperty(window, "innerWidth", { configurable: true, get: () => 1279 }); window.dispatchEvent(new Event("resize")); }); });
H.at(8900, () => H.go("e3", 2));
H.at(13900, () => H.go("e4", 3));
H.at(16500, () => { H.samples.beats3 = attr(3); });
H.at(16600, () => H.go("e5", 5));
H.at(18000, () => { H.samples.beats5 = attr(5); });
H.at(18100, () => H.go("e6", 6));
H.done(21000);
