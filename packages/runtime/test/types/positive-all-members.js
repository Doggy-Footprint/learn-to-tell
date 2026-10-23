// @ts-check
// VO-1 (FR-1, FR-2, FR-4, QR-1, C-1; spec v4): every Api member (48), 8 scene types, 4 quiz kinds, 4 TimeSpecs, checks before models.
/** @type {import("ltt").LessonFactory} */
export default (api) => api.lesson({
  meta: {
    title: "Flight",
    objectives: [{ id: "o1", text: "Predict landing time" }, { id: "o2", text: "Read a histogram" }],
    learner: { knows: ["speed"], misconceptions: ["heavier falls faster"], review: ["vectors"] },
    domains: ["physics", "statistics"],
  },
  glossary: { range: "horizontal distance", apex: "highest point" },
  checks: [
    { id: "c1", model: "proj", value: (o, run) => o.land - run({ v0: 5 }).land, expect: { gt: 0 } },
    { model: "proj", value: (o) => o.s.end.y[0] + o.top, expect: 5.1, tol: 0.1 },
    { model: "proj", expect: { top: [4, 6] } },
    { model: "proj", at: { v0: 20 }, expect: { land: { lt: 5, gt: 3 } }, limit: "no drag", source: "kinematics" },
    { model: "proj", expect: { land: 2.04 }, rel: 0.01 },
    { model: "stats", expect: { y: 1 }, tol: 1e-9 },
    { model: "stats", expect: { pos: true } },
    { model: "stats", value: (o) => o.xs.length === 100, expect: true },
    { model: "stats", expect: { z: { lt: 0.01 } } },
  ],
  models: {
    proj: api.model({ v0: 10, g: 9.8 }, (p) => {
      const s = api.ode((t, y) => [y[1], -p.g], [0, p.v0], [0, 5], 0.01, { event: (t, y) => y[0] });
      return { s, top: api.argmax((t) => s.at(t)[0], [0, 2], { tol: 1e-6 }).y, land: s.end.t };
    }, "free flight without drag"),
    stats: api.model({ seed: 1 }, (p) => {
      const r = api.rng(p.seed);
      const xs = api.sample(r, 100, { normal: [0, 1] });
      const us = api.sample(r, 10, { uniform: [0, 1] });
      return {
        xs, us, pos: xs.length > 0,
        h: api.histogram(xs, { bins: 5, range: [-3, 3] }),
        z: api.root((x) => x, [-1, 1], { tol: 1e-9 }),
        y: api.interpolate([0, 1], [0, 2], 0.5),
      };
    }, { illustrative: true }),
  },
  figures: {
    main: api.figure(api.cartesian({ x: [0, 5, "s"], y: [0, 6, "m"], aspect: "equal", loop: { ms: 2000, span: [0, 2], once: true, warp: [[0, 0], [1, 0.8], [2, 1]] } }), (m, t) => [
      api.axis("x", { label: "t" }),
      api.axis("y", { ticks: 5 }),
      api.grid({ x: 1, y: [0, 2, 4] }),
      api.legend([{ tone: "series1", text: "path" }, { tone: "good", text: (mm) => String(mm.proj) }], { at: [4, 5] }),
      api.circle([1, 1], 0.5, { tone: "warn", fill: "soft", opacity: 0.5 }),
      api.line([[0, 0], [1, 1]], { id: "path", curve: "smooth", tone: "series1", dash: true }),
      api.area([[0, 0], [1, 1]], { base: 0, tone: "muted" }),
      api.dot([t, t], { id: "ball", tone: "focus", size: "l" }),
      api.rect([0, 0], [1, 1], { weight: "thin", dash: true }),
      api.arc([0, 0], 1, [0, 90], { sector: true, tone: "bad", fill: "solid" }),
      api.arrow([0, 0], [1, 1], { id: "v", from: "ball", reveal: 0.5 }),
      api.path([["M", 0, 0], ["L", 1, 1], ["Q", 1, 2, 2, 2], ["C", 0, 1, 1, 1, 2, 0], ["A", 1, 1, 0, 0, 1, 3, 3], ["Z"]], { dash: true }),
      api.label([1, 1], (mm) => `land ${String(mm.proj)}`, { anchor: "ne", leader: [0, 0] }),
      api.dim([0, 0], [1, 0], "1 m"),
      api.angle([0, 0], [1, 0], [0, 1], { text: "90" }),
      api.brace([0, 0], [0, 1], "h"),
      api.field((x, y) => x + y, { as: "color", density: 4 }),
      api.glyph("ball", [0, 0], { rotate: 0, scale: 1 }),
      api.icon("clock", [1, 1]),
      api.math([2, 2], "y = vt"),
      api.code([3, 3], "x = 1", { lang: "js", highlight: [1] }),
      api.mock("browser", [[0, 0], [1, 1]], [api.dot([0.5, 0.5]), false, null, undefined], { title: "demo" }),
      t > 1 && api.sweep("x", t, { width: 0.1 }),
      api.flow([[0, 0], [1, 1]], { n: 3, rate: 1, seed: 1, t }),
      api.inset("tree", { source: [[0, 0], [1, 1]], at: [[3, 3], [4, 4]] }),
      api.inset("board", { at: [[4, 4], [5, 5]] }),
      api.custom({ id: "cu", why: "no mark draws this shape", bounds: [[0, 0], [1, 1]] }, ({ h, t: tt }) => h("g", { x: tt }, h("circle", { r: 1 }), "text")),
    ]),
    traj: api.figure(api.cartesian({ x: [0, 5, "s"], y: [0, 6, "m"], log: "y", static: "trajectory" }), () => [
      api.trace(api.ode(() => [1], [0], [0, 1], 0.1), 1, { trail: true, head: true, dims: [0, 0] }),
    ]),
    tree: api.figure(api.graph({ layout: "tree", direction: "down", steps: ["root", "child"] }), (m, t, ctx) => [
      api.node("n1", "root", { shape: "box", group: "g" }),
      api.node("n2", "kid", { at: [1, 1] }),
      ctx.step > 0 && api.edge("n1", "n2", { directed: true, value: 1, text: "link", dash: true }),
    ]),
    lanes: api.figure(api.lanes({ time: [0, 10, "s"], lanes: ["a", "b"], idle: { ms: 1000 } }), () => [api.axis("time")]),
    board: api.figure(api.cells({ cols: 2, rows: 2, static: "board" }), () => [api.cell(0, 0, { value: 1, text: "1" })]),
    radar: api.figure(api.polar({ r: [0, 1, "m"], theta: [0, 360], ring: true, static: "polar" }), () => [api.axis("r"), api.axis("theta")]),
    room: api.figure(api.space3d({ x: [0, 1, "m"], y: [0, 1, "m"], z: [0, 1, "m"], view: { yaw: 30, pitch: 20 }, projection: "ortho", static: "3d" }), () => [api.dot([0, 0])]),
    map: api.figure(api.geo({ projection: "equalEarth", region: "world", static: "map" }), () => [api.dot([0, 0])]),
    pair: api.split(["main", "tree"], { link: "ball" }),
    many: api.multiples("main", { over: { v0: [5, 10], g: [9.8] } }),
  },
  sections: [{
    concept: { id: "flight", title: "Flight", definition: "motion under gravity", level: 2, requires: ["speed"], leadsTo: ["drag"] },
    scenes: [
      { type: "hook", title: "Throw", say: (m) => `see ${String(m.proj)}`, figure: "main", focus: ["ball"], params: { v0: 12 } },
      { type: "predict", title: "p", ask: "Which?", figure: "main", focus: ["ball"], input: { kind: "choice", options: [{ text: "up", correct: true, params: { v0: 15 } }, { text: "down", feedback: "no", params: { v0: 5 } }] }, reveal: { say: "r", marks: ["path"], figure: "traj", params: { v0: 12 } }, targets: "heavier falls faster" },
      { type: "predict", title: "p", ask: "Drag it", figure: "main", focus: ["ball"], input: { kind: "drag", mark: "ball", axis: "x", answer: () => 2, tol: 0.1 }, reveal: { say: "r" } },
      { type: "predict", title: "p", ask: "Draw it", figure: "main", focus: ["path"], input: { kind: "draw", x: [0, 2], answer: "path", tol: 0.5 }, reveal: { say: "r" } },
      { type: "explain", title: "Why", say: "because", figure: "main", focus: ["path"], params: { v0: 8 } },
      { type: "define", term: "range", definition: "distance", figure: "main", focus: ["path"] },
      { type: "steps", title: "s", figure: "tree", steps: [{ say: "a", focus: ["n1"] }, { say: "b", focus: ["n2"] }] },
      { type: "explore", title: "e", say: "s", figure: "main", focus: ["ball"], params: { tab: "a" }, knobs: { v0: [1, 20, 1], g: { range: [1, 100], step: 1, log: true }, seed: { range: [1, 9] }, mode: ["a", "b"], on: true }, handles: [{ mark: "ball", x: "v0" }, { mark: "v", y: "g" }], goal: { say: "g", done: () => true } },
      { type: "compare", title: "c", say: "s", figure: "pair", focus: ["ball"], a: { v0: 5 }, b: { v0: 10 }, labels: ["slow", "fast"] },
      { type: "quiz", items: [
        { kind: "choice", prompt: "p", options: [{ text: "a", correct: true }, { text: "b", feedback: "no" }], objective: "o1", figure: "main", params: { v0: 3 }, reveal: { say: "see", marks: ["ball"], figure: "traj", params: { v0: 4 } } },
        { kind: "numeric", prompt: "p", answer: 2, tol: 0.1, unit: "s", objective: "o1", reveal: { say: "2 s" } },
        { kind: "numeric", prompt: "p", answer: { check: "c1" }, tol: 0.1, unit: "s", objective: "o1", transfer: true },
        { kind: "order", prompt: "p", items: ["a", "b"], objective: "o2" },
        { kind: "classify", prompt: "p", bins: ["x", "y"], items: [{ text: "a", bin: "x" }], objective: "o2", transfer: true },
      ] },
    ],
  }],
  quiz: [
    { kind: "choice", prompt: "p", options: [{ text: "a", correct: true }, { text: "b", feedback: "no" }], objective: "o1" },
    { kind: "numeric", prompt: "p", answer: 2, tol: 0.1, unit: "s", objective: "o1" },
    { kind: "order", prompt: "p", items: ["a", "b"], objective: "o2" },
    { kind: "classify", prompt: "p", bins: ["x"], items: [{ text: "a", bin: "x" }], objective: "o2", transfer: true },
  ],
  summary: { figures: ["main", "board", "lanes", "radar", "room", "map", "many", "traj"], say: "done" },
});
