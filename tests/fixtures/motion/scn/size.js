// VO-SIZE (C-17, QR-6): cumulative-reveal figure steps; scene zoom and figure height at every step. "tall" adds a spacer so the scene overflows.
const NS = "http://www.w3.org/2000/svg";
const ids = "abcdef";
const mk = (title, spacer) => ({ type: "figure", title, caption: "c", figure(st) {
  const host = st.appendChild(LTT.h("div"));
  const svg = host.appendChild(document.createElementNS(NS, "svg"));
  const dg = LTT.diagram(svg, { cols: 3, rows: 2, cell: [220, 150], node: [120, 56],
    nodes: [...ids].map((id, i) => ({ id, c: i % 3, r: Math.floor(i / 3), l: "N" + id })),
    edges: [{ f: "a", t: "b", l: "ab" }, { f: "b", t: "c", l: "bc" }, { f: "c", t: "f", l: "cf" }, { f: "d", t: "e", l: "de" }] });
  if (spacer) host.appendChild(LTT.h("div")).style.height = spacer + "px";
  H.refs[title] = { st, host, svg };
  return { el: host, dg };
}, steps: [["a"], ["b", "c"], ["d", "e"], ["f"]].map((hot, k) => ({ caption: "s#" + k + "#", enter: (kk, f) => f.dg.highlight(hot) })) });
H.refs = {};
H.deck = LTT.deck({ title: "size", theme: "paper", scenes: [{ type: "hook", text: "시작" }, mk("plain", 0), mk("tall", 420), { type: "keywords", terms: [] }] });
const measure = (title, k) => {
  const r = H.refs[title], cur = H.cur();
  H.samples[title].push({ k, shown: +/s#(\d+)#/.exec(cur.textContent)[1], zoomIn: parseFloat(getComputedStyle(cur.querySelector(".dk-in")).zoom),
    zoomScene: parseFloat(getComputedStyle(cur).zoom), host: r.host.offsetHeight, stage: r.st.offsetHeight, svg: r.svg.getBoundingClientRect().height });
};
let T = 100;
["plain", "tall"].forEach((title, i) => {
  H.samples[title] = [];
  H.at(T, () => H.go(title + ":e", i + 1));
  for (let k = 0; k < 4; k++) {
    if (k) H.at(T + 300 + 400 * k - 150, () => H.click(H.cur().querySelectorAll(".ltt-stepper button")[1]));
    H.at(T + 300 + 400 * k, () => measure(title, k));
  }
  T += 2500;
});
H.done(T + 200);
