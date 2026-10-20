// VO-REV C-19 / C-21 off deck: a direct highlight call hides nothing.
const NS = "http://www.w3.org/2000/svg";
const c = { id: "OFF", nodes: "abcd", edges: ["a>b", "b>c", "c>d"] };
document.body.insertAdjacentHTML("beforeend", '<div id="h"></div>');
const svg = document.getElementById("h").appendChild(document.createElementNS(NS, "svg"));
const dg = LTT.diagram(svg, { cols: 4, rows: 1, cell: [150, 110], node: [80, 44],
  nodes: [...c.nodes].map((id, i) => ({ id, c: i, r: 0, l: "N" + id })),
  edges: c.edges.map((e) => { const [f, t] = e.split(">"); return { f, t, l: "E" + f + t }; }) });
const take = (name) => { H.samples[name] = REV.snap(dg, svg, c); };
const tryCall = (name, ids) => { try { dg.highlight(ids); } catch (e) { H.errors.push(name + ": " + e); } };
take("plain");
tryCall("a", ["a"]); take("a");
tryCall("null", null); take("null");
tryCall("unknown", ["a", "zz", "a>zz"]); take("unknown");
tryCall("pair", ["b", "c"]); take("pair");
H.at(200, () => { tryCall("late", ["d"]); take("late"); });
H.done(500);
