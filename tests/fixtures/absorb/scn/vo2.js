// VO-2: seven figure classes. Every scene overflows far past the 35% cap, so an absorbed figure ends at 0.65 of its natural height.
// Natural heights: 480px wide viewBox 640x400 -> 300; data-visual div -> 300; compare svgs 520px wide -> 325; excluded probes keep their authored px.
const html = (s) => { const d = document.createElement("div"); d.innerHTML = s; return d.firstElementChild; };
const dv = (k, w, h, extra = "") => { const d = document.createElement("div"); d.setAttribute("data-visual", ""); d.setAttribute("data-k", k); d.setAttribute("style", `width:${w}px;height:${h}px;background:#cde;${extra}`); return d; };
const wrap = (cls, k, w) => { const d = document.createElement("div"); d.className = cls; d.appendChild(A.svg(k, w, null)); return d; };
const BIG = 500;
H.deck = LTT.deck({ title: "vo2", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { type: "figure", title: "figure stage svg", caption: "c", figure(st) { st.appendChild(A.col(A.svg("t", 480, null), A.spacer(BIG))); } },
  { type: "figure", title: "data-visual", caption: "c", figure(st) { st.appendChild(A.col(dv("t", 480, 300), A.spacer(BIG))); } },
  { type: "compare", title: "compare vis", narration: "n", items: [
    { label: "가", visual: A.col(A.svg("t1", 520, null), A.spacer(300)), verdict: "good" },
    { label: "나", visual: A.col(A.svg("t2", 520, null), A.spacer(300)), verdict: "bad" }] },
  { title: "untyped mount", narration: "n", mount(body) { body.appendChild(A.col(A.svg("t", 480, null), A.spacer(BIG))); } },
  { type: "figure", title: "icon", caption: "c", figure(st) { st.appendChild(A.col(A.svg("c", 480, null), wrap("ltt-ic", "x", 200), A.spacer(BIG))); } },
  { type: "figure", title: "mock", caption: "c", figure(st) { st.appendChild(A.col(A.svg("c", 480, null), wrap("ltt-phone", "x", 200), A.spacer(BIG))); } },
  { type: "figure", title: "nested", caption: "c", figure(st) {
      const outer = dv("c", 480, 300); const inner = A.svg("x", 200, null); outer.appendChild(inner);
      st.appendChild(A.col(outer, A.spacer(BIG))); } },
  { type: "keywords", terms: [] },
] });
(async () => {
  for (let i = 1; i <= 7; i++) {
    await A.wait(150); H.deck.go(i);
    await A.wait(500);
    H.samples["s" + i] = A.snap();
  }
  H.done(H.now());
})().catch((e) => H.errors.push("chain: " + (e && e.stack || e)));
