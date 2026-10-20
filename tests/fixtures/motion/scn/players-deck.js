// VO-AUTO / VO-RM with a deck: four hosted players (figure steps, LTT.stepper, diagram.player, sequence.player) in one scene each.
// Visit 1 (5300ms) is left on step 2 while it autoplays; visit 2 (7000ms) must restart on step 0 and wrap. Under reduced motion neither moves.
const NS = "http://www.w3.org/2000/svg";
H.samples.reduced = LTT.motion.reduced();
const caps = (p) => [0, 1, 2].map((k) => p + "#" + k + "#");
const svgIn = (host) => host.appendChild(document.createElementNS(NS, "svg"));
const hosted = (title, build) => ({ type: "figure", title, caption: "c", figure(st) { const host = st.appendChild(LTT.h("div")); build(host); return { el: host }; } });
const scenes = [
  { type: "hook", text: "시작" },
  { type: "figure", title: "F", caption: "c", figure(st) { st.appendChild(LTT.h("div")).textContent = "F"; },
    steps: caps("F").map((caption) => ({ caption, enter: H.step("F") })) },
  hosted("SS", (host) => { LTT.stepper(host, caps("SS").map((caption) => ({ caption, enter: H.step("SS") }))); H.poll("SS", host); }),
  hosted("DPS", (host) => {
    const dg = LTT.diagram(svgIn(host), { cols: 3, rows: 1, cell: [160, 110], node: [80, 44],
      nodes: [{ id: "a", c: 0, r: 0, l: "A" }, { id: "b", c: 1, r: 0, l: "B" }, { id: "c", c: 2, r: 0, l: "C" }], edges: [{ f: "a", t: "b" }, { f: "b", t: "c" }] });
    dg.player(host, caps("DPS").map((caption, k) => ({ caption, hot: [["a"], ["b"], ["c"]][k], enter: (d, i) => H.step("DPS")(i) })));
    H.poll("DPS", host);
  }),
  hosted("SQS", (host) => {
    const sq = LTT.sequence(svgIn(host), { actors: [{ id: "x", l: "X" }, { id: "y", l: "Y" }],
      items: [{ f: "x", t: "y", l: "m1" }, { f: "y", t: "x", l: "m2", kind: "reply" }, { f: "x", t: "y", l: "m3" }] });
    sq.player(host, caps("SQS").map((caption) => ({ caption })));
    H.poll("SQS", host);
  }),
  { type: "keywords", terms: [] },
];
H.deck = LTT.deck({ title: "players", theme: "paper", scenes });
[1, 2, 3, 4].forEach((idx, i) => {
  const b = 100 + i * 14000, L = ["F", "SS", "DPS", "SQS"][i];
  H.at(b, () => H.go(L + ":e1", idx));
  H.at(b + 5300, () => H.go(L + ":l1", 0));
  H.at(b + 6300, () => H.go(L + ":e2", idx));
  H.at(b + 13300, () => H.go(L + ":l2", 0));
});
H.done(100 + 4 * 14000 + 500);
