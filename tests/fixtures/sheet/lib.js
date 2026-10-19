// Fixture helpers for tests/audit-sheet.test.mjs (spec a96c8781ab82e025). A colour scene pins a full-viewport SVG (position: fixed, so the
// capture centre lands on it whatever the deck layout) whose top visible rect changes colour once per beat; expected colours live in Node.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  window.SHEET = {
    PALETTE: ["#808080", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#000000"],
    colourFig(title, beats) {
      return { type: "figure", title, caption: "색 칸 " + title, figure(st) {
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("style", "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none");
        const add = (i, op) => {
          const r = document.createElementNS(NS, "rect");
          r.setAttribute("class", "c" + i);
          r.setAttribute("x", "0"); r.setAttribute("y", "0"); r.setAttribute("width", "100"); r.setAttribute("height", "100");
          r.setAttribute("fill", SHEET.PALETTE[i]);
          r.setAttribute("opacity", op);
          svg.appendChild(r);
        };
        add(0, "1");
        beats.forEach((b, i) => add(i + 1, "0"));
        st.appendChild(svg);
        if (beats.length) LTT.motion.play(svg, beats.map((b, i) => ({ ...b, morph: ".c" + (i + 1), to: { opacity: 1 } })));
      } };
    },
    loopFig(title, ...loops) {
      return { type: "figure", title, caption: "loop " + title, figure(st) {
        const d = st.appendChild(LTT.h("div"));
        d.textContent = title;
        for (const o of loops) LTT.motion.loop((u) => { d.style.opacity = String(0.5 + u / 2); }, o);
      } };
    },
  };
})();
// F-2 rest-time oracle: a plain setTimeout (not LTT.motion, so the scene exposes no beats) repaints the full-viewport rect after `ms`.
SHEET.lateFig = (title, ms, colour) => {
  const fig = SHEET.colourFig(title, []);
  const draw = fig.figure;
  fig.figure = (st) => { draw(st); const r = st.querySelector("rect.c0"); setTimeout(() => r.setAttribute("fill", colour), ms); };
  return fig;
};
