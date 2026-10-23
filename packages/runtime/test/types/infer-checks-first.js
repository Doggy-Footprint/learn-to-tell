// @ts-check
// VO-1 (FR-4, V1-1): with checks written before models, value's o and run argument are inferred from the model.
/** @type {import("ltt").LessonFactory} */
export default (api) => api.lesson({
  meta: {
    title: "t",
    objectives: [{ id: "o1", text: "x" }],
    learner: { knows: [], misconceptions: [] },
    domains: ["physics"],
  },
  checks: [
    { model: "m", value: (o, run) => o.v + run({ a: 3 }).v, expect: 8, tol: 0.1 },
    // @ts-expect-error V1-1a output key that the model does not return
    { model: "m", value: (o) => o.notAnOutput, expect: 1, tol: 0.1 },
    // @ts-expect-error V1-1b run argument key that is not a model param
    { model: "m", value: (o, run) => run({ notAParam: 1 }).v, expect: 1, tol: 0.1 },
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
      { type: "quiz", items: [{ kind: "choice", prompt: "p", options: [{ text: "a", correct: true }, { text: "b", feedback: "no" }], objective: "o1" }] },
    ],
  }],
  quiz: [
    { kind: "order", prompt: "p", items: ["a", "b"], objective: "o1" },
  ],
  summary: { figures: ["f"] },
});
