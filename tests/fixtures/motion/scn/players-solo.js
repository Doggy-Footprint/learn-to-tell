// VO-AUTO / VO-RM / VO-ONE / VO-HOLD / VO-ERR with no deck: standalone stepper, diagram.player and sequence.player start when made.
// Run once plain and once with --force-prefers-reduced-motion. Step ids "#k#" in captions let H.poll read the step from the DOM.
const NS = "http://www.w3.org/2000/svg";
H.samples.reduced = LTT.motion.reduced();
const ids = ["st", "dp", "sq", "st1", "st2", "si4", "si1", "sm", "sp", "det"];
document.body.insertAdjacentHTML("beforeend", ids.map((i) => `<div id="${i}"></div>`).join(""));
const $ = (i) => document.getElementById(i);
const caps = (p, n) => Array.from({ length: n }, (_, k) => p + "#" + k + "#");
const mk = (p, n, label, extra) => caps(p, n).map((caption, k) => ({ caption, enter: H.step(label), ...(extra && extra[k]) }));
const svgIn = (host) => host.appendChild(document.createElementNS(NS, "svg"));

LTT.stepper($("st"), mk("ST", 3, "ST"));
H.poll("ST", $("st"));

const dg = LTT.diagram(svgIn($("dp")), { cols: 3, rows: 1, cell: [160, 110], node: [80, 44],
  nodes: [{ id: "a", c: 0, r: 0, l: "A" }, { id: "b", c: 1, r: 0, l: "B" }, { id: "c", c: 2, r: 0, l: "C" }], edges: [{ f: "a", t: "b" }, { f: "b", t: "c" }] });
dg.player($("dp"), caps("DP", 3).map((caption, k) => ({ caption, hot: [["a"], ["b"], ["c"]][k], enter: (d, i) => H.step("DP")(i) })));
H.poll("DP", $("dp"));

const sq = LTT.sequence(svgIn($("sq")), { actors: [{ id: "x", l: "X" }, { id: "y", l: "Y" }],
  items: [{ f: "x", t: "y", l: "m1" }, { f: "y", t: "x", l: "m2", kind: "reply" }, { f: "x", t: "y", l: "m3" }] });
sq.player($("sq"), caps("SQ", 3).map((caption) => ({ caption })));
H.poll("SQ", $("sq"));

LTT.stepper($("st1"), mk("O1", 1, "ST1"));
LTT.stepper($("st2"), mk("O2", 2, "ST2"));
H.poll("ST2", $("st2"));

LTT.stepper($("si4"), mk("I4", 3, "SI4"), { interval: 4000 });
LTT.stepper($("si1"), mk("I1", 3, "SI1"), { interval: 1000 });
LTT.stepper($("sm"), mk("SM", 3, "SM", { 0: { hold: 2500 } }), { interval: 4000 });

const sp = LTT.stepper($("sp"), mk("SP", 3, "SP"));
H.at(500, () => sp.stop());
H.at(1000, () => sp.play(true));

LTT.stepper($("det"), mk("DE", 3, "DET"));
const det = $("det");
H.at(1000, () => det.remove());
H.at(7000, () => document.body.appendChild(det));
H.done(12000);
