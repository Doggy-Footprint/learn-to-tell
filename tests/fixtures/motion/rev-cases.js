// VO-REV decision table, shared by scn/rev-*.js (browser) and motion.test.mjs (node, via createRequire).
// `steps[k]` is the highlight list of step k (null = highlight(null)); `want[k]` is the hand-derived set of visible nodes (string of ids) and
// visible edges after step k, from the spec's FR-7 rule: a node is visible if highlighted in a step <= k or never highlighted; an edge is visible
// if both ends are visible and it was switched on (id listed, or both ends listed together) in a step <= k or never switched on.
(function () {
  const ALL3 = { n: "abc", e: ["a>b", "b>c"] };
  const ALL4 = { n: "abcd", e: ["a>b", "b>c", "c>d"] };
  const CASES = [
    { id: "C12", nodes: "abcd", edges: ["a>b", "b>c", "c>d"], steps: [["a", "b"], ["c"], ["d"]], path: [0, 1, 2, 1, 0],
      want: [{ n: "ab", e: ["a>b"] }, { n: "abc", e: ["a>b", "b>c"] }, ALL4] },
    { id: "C12w", auto: true, nodes: "abcd", edges: ["a>b", "b>c", "c>d"], steps: [["a", "b"], ["c"], ["d"]], path: [0, 1, 2, 0],
      want: [{ n: "ab", e: ["a>b"] }, { n: "abc", e: ["a>b", "b>c"] }, ALL4] },
    { id: "C12b", nodes: "ab", edges: ["a>b"], steps: [["a"], ["b"], ["a", "b"]], path: [0, 1, 2],
      want: [{ n: "a", e: [] }, { n: "ab", e: [] }, { n: "ab", e: ["a>b"] }] },
    { id: "C13", nodes: "abcd", edges: ["a>b", "b>c", "c>d"], steps: [["a", "b", "a>b"], ["b", "c", "b>c"], ["c", "d"]], path: [0, 1, 2],
      want: [{ n: "ab", e: ["a>b"] }, { n: "abc", e: ["a>b", "b>c"] }, ALL4] },
    { id: "C14", nodes: "abcde", edges: ["a>b", "b>c", "c>d", "e>a"], steps: [["a", "b"], ["c"], ["d"]], path: [0, 1, 2],
      want: [{ n: "abe", e: ["a>b", "e>a"] }, { n: "abce", e: ["a>b", "b>c", "e>a"] }, { n: "abcde", e: ["a>b", "b>c", "c>d", "e>a"] }] },
    { id: "C15n", nodes: "abcd", edges: ["a>b", "b>c", "c>d"], steps: [null, ["a"], ["b"]], path: [0, 1, 2], want: [ALL4, ALL4, ALL4] },
    { id: "C15e", nodes: "abc", edges: ["a>b", "b>c"], steps: [[], ["a"]], path: [0, 1], want: [ALL3, ALL3] },
    { id: "C15b", nodes: "abc", edges: ["a>b", "b>c"], steps: [["a"], null, ["c"]], path: [0, 1, 2], want: [{ n: "a", e: [] }, ALL3, ALL3] },
    { id: "C18", nodes: "abc", edges: ["a>b", "b>c"], pre: ["c"], steps: [["a"], ["b"], ["c"]], path: [0, 1, 2],
      want: [{ n: "a", e: [] }, { n: "ab", e: ["a>b"] }, ALL3] },
    { id: "C21", nodes: "abc", edges: ["a>b", "b>c"], steps: [["a", "zz", "a>zz"], ["b", "qq"], ["c"]], path: [0, 1, 2],
      want: [{ n: "a", e: [] }, { n: "ab", e: ["a>b"] }, ALL3] },
    // FR-7 v2: an enter that calls highlight twice records only the last call. Deck mode only (a player step has one `hot`).
    { id: "MULTI", deckOnly: true, nodes: "abc", edges: ["a>b", "b>c"], multi: ["a", "b", "c"], steps: [["a"], ["b"], ["c"]], path: [0, 1, 2],
      want: [{ n: "a", e: [] }, { n: "ab", e: ["a>b"] }, ALL3] },
    // Edge lit by id while an end node is still hidden: it stays hidden (and its label) until both ends show.
    { id: "EIDHID", nodes: "ab", edges: ["a>b"], steps: [["a", "a>b"], ["b"]], path: [0, 1],
      want: [{ n: "a", e: [] }, { n: "ab", e: ["a>b"] }] },
    { id: "OUT", nodes: "abc", edges: ["a>b", "b>c"], ext: ["c"], steps: [["a"], ["b"], ["c"]], path: [0, 1, 2],
      want: [{ n: "a", e: [] }, { n: "ab", e: ["a>b"] }, ALL3] },
  ];

  if (typeof module !== "undefined" && module.exports) { module.exports = CASES; return; }

  const NS = "http://www.w3.org/2000/svg";
  const REV = (globalThis.REV = { CASES, dgs: {}, svgs: {} });
  const edgeParts = (id) => id.split(">");
  const graph = (c) => ({ cols: c.nodes.length, rows: 1, cell: [150, 110], node: [80, 44],
    nodes: [...c.nodes].map((id, i) => ({ id, c: i, r: 0, l: "N" + id })),
    edges: c.edges.map((e) => { const [f, t] = edgeParts(e); return { f, t, l: "E" + f + t }; }) });
  const labelOf = (svg, text) => [...svg.querySelectorAll("text")].find((t) => t.textContent.trim() === text);
  const info = (el) => ({ v: H.vis(el), dim: !!el && el.classList.contains("dim"), hot: !!el && el.classList.contains("hot") });

  // Observation through the documented diagram API: node(id)/edge(id) are d3 selections, .node() the element.
  REV.snap = (dg, svg, c) => {
    const n = {}, e = {};
    for (const id of c.nodes) n[id] = info(dg.node(id).node());
    for (const id of c.edges) { const [f, t] = edgeParts(id); e[id] = { ...info(dg.edge(id).node()), lv: H.vis(labelOf(svg, "E" + f + t)) }; }
    return { n, e };
  };
  REV.build = (c, mode) => {
    const figure = (st) => {
      const host = st.appendChild(LTT.h("div"));
      const svg = host.appendChild(document.createElementNS(NS, "svg"));
      const dg = LTT.diagram(svg, graph(c));
      REV.dgs[c.id] = dg; REV.svgs[c.id] = svg;
      if (c.pre) dg.highlight(c.pre);
      // Player steps cannot hold null: an empty list is the same "all highlighted" call.
      if (mode === "player") dg.player(host, c.steps.map((hot, k) => ({ caption: "s#" + k + "#", hot: hot ?? [] })));
      return { el: host, dg };
    };
    const scene = { type: "figure", title: c.id, caption: "c", figure };
    if (mode === "deck") scene.steps = c.steps.map((hot, k) => ({ caption: "s#" + k + "#", enter: (kk, f) => { REV.dgs[c.id] = f.dg; if (c.multi) f.dg.highlight(c.multi); f.dg.highlight(hot); } }));
    return scene;
  };
  REV.run = (mode) => {
    const cases = CASES.filter((c) => mode === "deck" || !c.deckOnly);
    H.deck = LTT.deck({ title: "rev", theme: "paper", scenes: [{ type: "hook", text: "시작" }, ...cases.map((c) => REV.build(c, mode)), { type: "keywords", terms: [] }] });
    const btns = () => H.cur().querySelectorAll(".ltt-stepper button");
    const move = (from, to) => (to === from + 1 ? H.click(btns()[1]) : to === from - 1 ? H.click(btns()[0]) : H.click(H.cur().querySelectorAll(".ltt-dots > *")[to]));
    const shown = () => { const m = /s#(\d+)#/.exec(H.cur().textContent); return m ? +m[1] : null; };
    const take = (c, k) => { const s = REV.snap(REV.dgs[c.id], REV.svgs[c.id], c); H.samples[c.id].push({ k, shown: shown(), ...s }); };
    let T = 100;
    cases.forEach((c, i) => {
      H.samples[c.id] = [];
      const t0 = T;
      H.at(t0, () => H.go(c.id + ":e", i + 1));
      let last = 0, end = t0;
      c.path.forEach((k, j) => {
        const from = j ? c.path[j - 1] : null;
        const snapAt = c.auto ? t0 + 900 + 1800 * j : t0 + 300 + 400 * j;
        if (j && !c.auto) H.at(snapAt - 150, () => move(from, k));
        H.at(snapAt, () => take(c, k));
        end = snapAt + 400;
      });
      if (c.ext) H.at(t0 + 420, () => { REV.dgs[c.id].highlight(c.ext); });
      T = end + 300;
    });
    H.done(T + 300);
  };
})();
