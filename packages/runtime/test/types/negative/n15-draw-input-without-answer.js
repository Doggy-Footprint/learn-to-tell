// @ts-check
// VO-2 (FR-3, QR-5, C-2) N15 draw input without answer
/** @type {import("ltt").LessonFactory} */
export default (api) => api.lesson({
  meta: {
    title: "t",
    objectives: [{ id: "o1", text: "x" }],
    learner: { knows: [], misconceptions: [] },
    domains: ["physics"],
  },
  checks: [
    { model: "m", expect: { v: 2 }, tol: 0.1 },
  ],
  models: {
    m: api.model({ a: 1 }, (p) => ({ v: p.a * 2 }), "v = 2a"),
  },
  figures: {
    f: api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 2, "m"], static: "s" }), () => [
      api.dot([0, 1], { id: "d" }),
    ]),
  },
  sections: [{
    concept: { id: "c", title: "c", definition: "d", level: 1 },
    scenes: [
      { type: "hook", title: "h", say: "s", figure: "f", focus: ["d"] },
      { type: "predict", title: "p", ask: "a", figure: "f", focus: ["d"], reveal: { say: "r" },
        // @ts-expect-error N15
        input: { kind: "draw", x: [0, 1], tol: 0.1 } },
      { type: "quiz", items: [{ kind: "choice", prompt: "p", options: [{ text: "a", correct: true }, { text: "b", feedback: "no" }], objective: "o1" }] },
    ],
  }],
  quiz: [
    { kind: "order", prompt: "p", items: ["a", "b"], objective: "o1" },
  ],
  summary: { figures: ["f"] },
});
