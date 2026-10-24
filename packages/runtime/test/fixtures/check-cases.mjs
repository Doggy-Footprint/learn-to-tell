// VO-9/VO-10 decision table: one check-clean base lesson and one mutation per rule (spec C-29..C-32, C-26).
const meta = { title: "속도 재기", objectives: [{ id: "o1", text: "속도를 읽는다" }], learner: { knows: [], misconceptions: [] }, domains: ["physics"] };
const concept = { id: "k", title: "속도", definition: "빠르기", level: 1 };

/**
 * Base lesson; `mut(inp, api)` edits the input before api.lesson. Global scene indices:
 * 0 hook(f), 1 define 속도계, 2 predict choice(f, reveal.marks curve), 3 predict drag(h), 4 predict draw(curve), 5 explore(q, goal v>=0.9).
 * `extra(api, params, t)` adds marks to figure f.
 */
export function base(mut = () => {}, extra = () => []) {
  return (api) => {
    const inp = {
      meta,
      glossary: { 속도계: "속도를 재는 계기" },
      checks: [{ model: "m", expect: { v: 0.5 }, tol: 1e-9 }],
      models: { m: api.model({ q: 0.5 }, (p) => ({ v: p.q }), "identity") },
      figures: {
        f: api.figure(api.cartesian({ x: [0, 10, "m"], y: [0, 10, "m"], static: "점 두 개와 선" }), (m, t, { params }) => [
          api.axis("x"),
          api.axis("y"),
          api.dot([5, 5], { id: "a", tone: "series1" }),
          api.dot([Number(params.q ?? 0.5) * 10, 2], { id: "h", tone: "series2" }),
          api.line([[0, 1], [10, 1]], { id: "curve", tone: "series3" }),
          ...extra(api, params, t),
        ]),
      },
      sections: [{ concept, scenes: [
        { type: "hook", title: "출발", say: "점을 본다.", figure: "f", focus: ["a"] },
        { type: "define", term: "속도계", definition: "속도계는 속도를 잰다.", focus: [] },
        { type: "predict", title: "예측", ask: "어디일까?", figure: "f", focus: ["a"], input: { kind: "choice", options: [{ text: "위", correct: true }, { text: "아래", feedback: "아니다." }] }, reveal: { say: "위다.", marks: ["curve"] } },
        { type: "predict", title: "끌기", ask: "끌어 보자.", figure: "f", focus: ["h"], input: { kind: "drag", mark: "h", axis: "x", answer: () => 5, tol: 1 }, reveal: { say: "5다." } },
        { type: "predict", title: "그리기", ask: "그려 보자.", figure: "f", focus: ["a"], input: { kind: "draw", x: [0, 10], answer: "curve", tol: 1 }, reveal: { say: "수평선이다." } },
        { type: "explore", title: "탐색", say: "q를 바꾼다.", figure: "f", focus: ["h"], knobs: { q: [0, 1] }, goal: { say: "끝까지", done: (m) => m.m.v >= 0.9 } },
      ] }],
      quiz: [{ kind: "choice", prompt: "속도는?", objective: "o1", options: [{ text: "빠르기", correct: true }, { text: "무게", feedback: "아니다." }] }],
      summary: { figures: ["f"] },
    };
    mut(inp, api);
    return api.lesson(inp);
  };
}
const addScene = (inp, scene) => inp.sections[0].scenes.push(scene);
const hookOn = (key) => ({ type: "hook", title: "추가", say: "추가 장면.", figure: key, focus: [] });

/** [label, rule, factory, pathCheck(path) -> boolean, pathDescription]. layout-layer rules are marked by LAYOUT_RULES. */
export const LAYOUT_RULES = new Set(["text-no-room", "graph-too-large", "unknown-region", "unimplemented"]);
/** [predicate, description, expected path set]; the set of distinct reported paths must equal `paths` (spec v2 per-rule paths). */
const exact = (...paths) => [(x) => paths.includes(x), `= ${paths.join(" | ")}`, paths];

export const VIOLATIONS = [
  ["load-error: factory throws", "load-error", () => { throw new Error("boom"); }, ...exact("lesson")],
  ["load-error: lesson not returned", "load-error", (api) => { base()(api); return undefined; }, ...exact("lesson")],
  ["check-fail", "check-fail", base((inp) => { inp.checks = [{ model: "m", expect: { v: 0.7 }, tol: 1e-9 }]; }), ...exact("checks[0]")],
  ["model-pure", "model-pure", base((inp, api) => { inp.models.rnd = api.model({}, () => ({ n: Math.random() }), "noise"); }), ...exact("models.rnd")],
  ["figure-eval", "figure-eval", base((inp, api) => { inp.figures.bad = api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => { throw new Error("draw failed"); }); }), (p) => /^figures\.bad@t=[-\d.e]+,step=\d+$/.test(p), "figures.bad@t=<t>,step=<n>"],
  ["focus-unknown-id", "focus-unknown-id", base((inp) => { inp.sections[0].scenes[0].focus = ["nope"]; }), ...exact("sections[0].scenes[0].focus[0]")],
  ["binding: handle param undeclared", "binding", base((inp) => { inp.sections[0].scenes[5].handles = [{ mark: "h", x: "nope" }]; }), ...exact("sections[0].scenes[5].handles[0].x")],
  ["data-in-domain: x = max + 1e-6", "data-in-domain", base(undefined, (api) => [api.dot([10 + 1e-6, 5], { id: "out" })]), ...exact("figures.f#out")],
  ["goal-reachable: never true", "goal-reachable", base((inp) => { inp.sections[0].scenes[5].goal.done = (m) => m.m.v > 2; }), ...exact("sections[0].scenes[5].goal")],
  ["goal-at-start: true at start", "goal-at-start", base((inp) => { inp.sections[0].scenes[5].goal.done = (m) => m.m.v >= 0; }), ...exact("sections[0].scenes[5].goal")],
  ["reveal-marks-exist", "reveal-marks-exist", base((inp) => { inp.sections[0].scenes[2].reveal.marks = ["ghost"]; }), ...exact("sections[0].scenes[2].reveal.marks[0]")],
  ["input-binding: drag mark", "input-binding", base((inp) => { inp.sections[0].scenes[3].input.mark = "ghost"; }), ...exact("sections[0].scenes[3].input.mark")],
  ["input-binding: draw answer", "input-binding", base((inp) => { inp.sections[0].scenes[4].input.answer = "ghost"; }), ...exact("sections[0].scenes[4].input.answer")],
  ["term-defined-before-use", "term-defined-before-use", base((inp) => { inp.sections[0].scenes[0].say = "속도계를 본다."; }), ...exact("sections[0].scenes[0].say")],
  ["accent-focus-only: focus tone not in scene focus", "accent-focus-only", base((inp) => { inp.summary.figures = []; }, (api) => [api.dot([3, 3], { id: "acc", tone: "focus" })]), ...exact("sections[0].scenes[0]", "sections[0].scenes[2]", "sections[0].scenes[3]", "sections[0].scenes[4]", "sections[0].scenes[5]")],
  ["accent-focus-only: focus tone in a summary figure", "accent-focus-only", base((inp) => {
    for (const s of inp.sections[0].scenes) if (s.figure === "f") s.focus = [...s.focus, "acc"];
  }, (api) => [api.dot([3, 3], { id: "acc", tone: "focus" })]), ...exact("summary.figures[0]")],
  ["accent-focus-only: focus tone in quiz item figure", "accent-focus-only", base((inp, api) => {
    inp.figures.qf = api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.dot([0.5, 0.5], { id: "qa", tone: "focus" })]);
    inp.quiz[0].figure = "qf";
  }), ...exact("quiz[0]")],
  ["text-no-room: cell text wider than its cell", "text-no-room", base((inp, api) => {
    inp.figures.c = api.figure(api.cells({ cols: 40, rows: 40, static: "s" }), () => [api.cell(0, 0, { id: "c0", value: 1, text: "가나다라마바사아자차카타파하" })]);
    addScene(inp, hookOn("c"));
  }), ...exact("figures.c#c0")],
  ["graph-too-large: 60 long nodes", "graph-too-large", base((inp, api) => {
    inp.figures.g = api.figure(api.graph({ layout: "layered", static: "s" }), () => Array.from({ length: 60 }, (_, i) => api.node(`n${i}`, `아주 긴 이름을 가진 공급망 노드 번호 ${i}`)));
    addScene(inp, hookOn("g"));
  }), ...exact("figures.g")],
  ["unknown-region: mars", "unknown-region", base((inp, api) => {
    inp.figures.w = api.figure(api.geo({ projection: "equalEarth", region: "mars", static: "s" }), () => [api.dot([0, 0], { id: "p" })]);
    addScene(inp, hookOn("w"));
  }), ...exact("figures.w")],
];

/** Spec C-26: every unimplemented target. Each builds figure "u" and a hook scene on it. */
export const UNIMPLEMENTED = [
  ["polar", (api) => api.figure(api.polar({ r: [0, 1, "m"], static: "s" }), () => [api.dot([0.5, 30])]), "figures.u"],
  ["lanes", (api) => api.figure(api.lanes({ time: [0, 1, "s"], lanes: ["a", "b"], static: "s" }), () => [api.dot([0.5, 0])]), "figures.u"],
  ["space3d", (api) => api.figure(api.space3d({ x: [0, 1, "m"], y: [0, 1, "m"], z: [0, 1, "m"], static: "s" }), () => [api.dot([0.5, 0.5])]), "figures.u"],
  ["force", (api) => api.figure(api.graph({ layout: "force", static: "s" }), () => [api.node("a", "A"), api.node("b", "B"), api.edge("a", "b")]), "figures.u"],
  ["sankey", (api) => api.figure(api.graph({ layout: "sankey", static: "s" }), () => [api.node("a", "A"), api.node("b", "B"), api.edge("a", "b", { value: 2 })]), "figures.u"],
  ["orthographic", (api) => api.figure(api.geo({ projection: "orthographic", static: "s" }), () => [api.dot([0, 0])]), "figures.u"],
  ["field", (api) => api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.field((x, y) => x + y, { id: "fld" })]), "figures.u#fld"],
  ["glyph", (api) => api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.glyph("star", [0.5, 0.5], { id: "gly" })]), "figures.u#gly"],
  ["icon", (api) => api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.icon("ship", [0.5, 0.5], { id: "ico" })]), "figures.u#ico"],
  ["inset", (api) => api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.inset("f", { at: [[0, 0], [0.5, 0.5]], id: "ins" })]), "figures.u#ins"],
  ["from", (api) => api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.dot([0.5, 0.5], { id: "fr", from: "a" })]), "figures.u#fr"],
];
export const unimplementedLesson = (make) => base((inp, api) => { inp.figures.u = make(api); addScene(inp, hookOn("u")); });
