// @ts-check
// VO-2 (FR-3, QR-5, C-2) N8 MarkOpts with px, color, style, className, fontSize
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
      // @ts-expect-error N8 color
      api.dot([0, 1], { color: "red" }),
      // @ts-expect-error N8 style
      api.dot([0, 1], { style: "fill: red" }),
      // @ts-expect-error N8 px
      api.dot([0, 1], { px: 4 }),
      // @ts-expect-error N8 className
      api.dot([0, 1], { className: "big" }),
      // @ts-expect-error N8 fontSize
      api.label([0, 1], "x", { fontSize: 12 }),
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
