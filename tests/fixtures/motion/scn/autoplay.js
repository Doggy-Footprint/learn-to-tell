// VO-AUTO / VO-COMP / VO-ONE / VO-HOLD (C-1, C-4, C-5, C-11): figure steps auto-play whatever `autoplay` says. Captions are short (n <= 6), so every
// hold is the 1800 floor even though the author hold is 1000 (or 2500/4000/1000 in S6).
const caps = ["첫 <b>단계</b>", "{{만료 시간|TTL}} 둘", "셋 {{TTL}}"];
const steps = (label, holds) => holds.map((hold, i) => ({ caption: caps[i], hold, enter: H.step(label) }));
const fig = (title, label, extra) => ({ type: "figure", title, caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = title; }, steps: steps(label, [1000, 1000, 1000]), ...extra });
H.deck = LTT.deck({ title: "autoplay", theme: "paper", glossary: { TTL: "유효 시간" }, scenes: [
  { type: "hook", text: "{{TTL}} 시작" },
  fig("기본", "S1", {}),
  fig("참", "S2", { autoplay: true }),
  fig("한 번", "S3", { autoplay: "once" }),
  fig("끔", "S4", { autoplay: false }),
  { type: "statement", title: "쉼" },
  { type: "figure", title: "하나", caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = "하나"; }, steps: [{ caption: "only", hold: 300, enter: H.step("S5") }] },
  { type: "figure", title: "hold", caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = "hold"; },
    steps: [2500, 4000, 1000].map((hold, i) => ({ caption: "h" + i, hold, enter: H.step("S6") })) },
  { type: "figure", title: "둘", caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = "둘"; },
    steps: ["a", "b"].map((caption) => ({ caption, enter: H.step("S7") })) },
  { type: "keywords", terms: [] },
] });
const attr = (i) => document.querySelectorAll("section.dk-scene")[i].getAttribute("data-ltt-beats");
const S = (i) => { H.samples["beats" + i] = attr(i); };
H.at(100, () => H.go("e1", 1));
H.at(6500, () => { S(1); H.go("e2", 2); });
H.at(13100, () => { S(2); H.go("e3", 3); });
H.at(19700, () => { S(3); H.go("e4", 4); });
H.at(26300, () => { S(4); H.go("e5", 6); });
H.at(28800, () => { S(6); H.go("e6", 7); });
H.at(38000, () => H.go("e7", 8));
H.at(42500, () => { S(8); });
H.done(43500);
