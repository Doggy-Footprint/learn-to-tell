// VO-4: beat normalization, read from data-ltt-beats and the ?audit JSON `beats`.
const loopFig = (title, ...loops) => ({ type: "figure", title, caption: "c", figure(st) {
  st.appendChild(LTT.h("div")).textContent = title;
  for (const o of loops) LTT.motion.loop(H.draw(title), o);
} });
const stepsFig = (title, captions, holds) => ({ type: "figure", title, caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = title; },
  steps: captions.map((caption, i) => ({ caption, hold: holds[i], enter() {} })) });
const SVG = '<svg viewBox="0 0 400 200" style="width:100%;height:auto"><rect x="10" y="10" width="380" height="180" fill="currentColor" opacity=".2"/></svg>';
// FR-11 v4 oracle: the same before/after built off-deck; t = max(550 + 90 × (n − 1), ms).
const BA = LTT.beforeAfter({ before: { visual: SVG }, after: { visual: SVG } });
H.samples.contrast = { n: BA.el.children.length, ms: BA.ms, t: Math.max(550 + 90 * (BA.el.children.length - 1), BA.ms) };
H.deck = LTT.deck({ title: "beats", theme: "paper", glossary: { TTL: "유효 시간" }, scenes: [
  { type: "hook", text: "{{TTL}} 시작" },
  loopFig("b1", { period: 3000 }),
  loopFig("b2", { period: 3000, once: true }),
  loopFig("b3", { period: 1000, beats: [{ t: 0 }, { t: 1 }, { t: 999 }, { t: 1000 }, { t: 1001 }] }),
  loopFig("b4", { period: 1000, beats: [{ t: -1 }, { t: "x" }, { t: NaN }, { t: 500, text: "반" }] }),
  loopFig("b5", { period: 1000, beats: [250, 750] }),
  loopFig("b6", { period: 1000, beats: [{ t: 400, text: "가" }, { t: 400, text: "가" }] }),
  loopFig("b7", { period: 1000, beats: [300] }, { period: 1000, beats: [100, 300] }),
  loopFig("b8", { period: 0 }),
  stepsFig("b9", ["첫 <b>단계</b>", "{{만료 시간|TTL}} 둘", "셋 {{TTL}}"], [1000, 1000, 1000]),
  stepsFig("b10", ["가", "나", "다"], [500, 1000, 2000]),
  { type: "contrast", title: "b11", sub: "s", before: { visual: SVG }, after: { visual: SVG } },
  { type: "statement", title: "b12" },
  { type: "keywords", terms: [] },
] });
H.at(9000, () => { H.samples.attrs = [...document.querySelectorAll("section.dk-scene")].map((s) => s.getAttribute("data-ltt-beats")); });
H.done(9100);
