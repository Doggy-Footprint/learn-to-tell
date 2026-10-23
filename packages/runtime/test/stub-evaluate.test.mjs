// VO-3 (FR-13, C-3..C-9) check decision table + 2-value boundaries; VO-4 (FR-14..FR-17, C-10..C-15).
import { test } from "node:test";
import assert from "node:assert/strict";
import { STUB, input } from "./fixtures/helpers.mjs";

const { evaluate } = await import(STUB);

/** Lesson with scalar model `s` (returns p.x), object model `o` ({range, time}) and boolean model `b`. */
function checksLesson(checks) {
  return (api) => api.lesson(input({
    checks,
    models: {
      s: api.model({ x: 0 }, (p) => p.x, "scalar"),
      o: api.model({ range: 40.77, time: 1.5 }, (p) => ({ range: p.range, time: p.time }), "object"),
      b: api.model({ flag: true }, (p) => p.flag, "bool"),
    },
  }));
}
const one = (check) => evaluate(checksLesson([check])).checks[0];

const table = [
  ["C-3 number+tol 40.77 vs 40.8 tol 0.2", { model: "s", at: { x: 40.77 }, expect: 40.8, tol: 0.2 }, true],
  ["C-4 |diff| = tol exactly (above)", { model: "s", at: { x: 1.5 }, expect: 1, tol: 0.5 }, true],
  ["C-4 |diff| = tol exactly (below)", { model: "s", at: { x: 0.5 }, expect: 1, tol: 0.5 }, true],
  ["C-4 |diff| = tol + 1e-9 (above)", { model: "s", at: { x: 1.5 + 1e-9 }, expect: 1, tol: 0.5 }, false],
  ["C-4 |diff| = tol + 1e-9 (below)", { model: "s", at: { x: 0.5 - 1e-9 }, expect: 1, tol: 0.5 }, false],
  ["C-5 range [1,2] at 1", { model: "s", at: { x: 1 }, expect: [1, 2] }, true],
  ["C-5 range [1,2] at 2", { model: "s", at: { x: 2 }, expect: [1, 2] }, true],
  ["C-5 range [1,2] at 2+1e-9", { model: "s", at: { x: 2 + 1e-9 }, expect: [1, 2] }, false],
  ["C-5 range [1,2] at 1-1e-9", { model: "s", at: { x: 1 - 1e-9 }, expect: [1, 2] }, false],
  ["C-6 lt 45 at 45", { model: "s", at: { x: 45 }, expect: { lt: 45 } }, false],
  ["C-6 lt 45 at 44.999", { model: "s", at: { x: 44.999 }, expect: { lt: 45 } }, true],
  ["gt 45 at 45", { model: "s", at: { x: 45 }, expect: { gt: 45 } }, false],
  ["gt 45 at 45.001", { model: "s", at: { x: 45.001 }, expect: { gt: 45 } }, true],
  ["lt+gt (1,2) at 1.5", { model: "s", at: { x: 1.5 }, expect: { lt: 2, gt: 1 } }, true],
  ["lt+gt (1,2) at 1", { model: "s", at: { x: 1 }, expect: { lt: 2, gt: 1 } }, false],
  ["lt+gt (1,2) at 2", { model: "s", at: { x: 2 }, expect: { lt: 2, gt: 1 } }, false],
  ["C-7 rel 0.01 expect 100 actual 100.9", { model: "s", at: { x: 100.9 }, expect: 100, rel: 0.01 }, true],
  ["C-7 rel 0.01 expect 100 actual 101.1", { model: "s", at: { x: 101.1 }, expect: 100, rel: 0.01 }, false],
  ["boolean true = true", { model: "b", expect: true }, true],
  ["boolean false vs true", { model: "b", at: { flag: false }, expect: true }, false],
  ["object keyed all pass", { model: "o", expect: { range: 40.8, time: [1, 2] }, tol: 0.2 }, true],
  ["object keyed one key fails", { model: "o", expect: { range: 40.8, time: [2, 3] }, tol: 0.2 }, false],
  ["object keyed relation", { model: "o", expect: { time: { gt: 1 } } }, true],
  ["C-8 value(run) boolean true vs expect true", { model: "s", value: (o, run) => run({ x: 2 }) > run({ x: 1 }), expect: true }, true],
  ["C-8 value(run) boolean true vs expect false", { model: "s", value: (o, run) => run({ x: 2 }) > run({ x: 1 }), expect: false }, false],
  ["value number uses returned value not output", { model: "o", value: (o) => o.range * 2, expect: 81.54, tol: 1e-9 }, true],
  ["V1-8 FR-13 epsilon: value 0.1+0.2 vs expect 0.3, tol 0", { model: "s", value: () => 0.1 + 0.2, expect: 0.3, tol: 0 }, true],
  ["value receives at-merged output", { model: "s", at: { x: 3 }, value: (o) => o, expect: 3, tol: 0 }, true],
];
for (const [name, check, pass] of table) {
  test(`VO-3 ${name} -> pass ${pass}`, () => {
    const r = one(check);
    assert.equal(r.pass, pass, JSON.stringify(r));
    assert.equal(r.index, 0);
  });
}

test("VO-3 C-9 object number without tol/rel -> error 'tol or rel required', ok false, later checks still evaluated", () => {
  const rep = evaluate(checksLesson([
    { id: "bad", model: "o", expect: { range: 40.8 } },
    { id: "good", model: "s", at: { x: 1 }, expect: 1, tol: 0 },
  ]));
  assert.equal(rep.checks[0].pass, false);
  assert.match(String(rep.checks[0].error), /tol or rel required/);
  assert.equal(rep.checks[0].id, "bad");
  assert.equal(rep.checks[1].pass, true);
  assert.equal(rep.checks[1].index, 1);
  assert.equal(rep.ok, false);
});

test("VO-3 unknown model key -> pass false with error, later checks continue", () => {
  const rep = evaluate(checksLesson([
    { model: "nope", expect: 1, tol: 1 },
    { model: "b", expect: true },
  ]));
  assert.equal(rep.checks[0].pass, false);
  assert.equal(typeof rep.checks[0].error, "string");
  assert.equal(rep.checks[1].pass, true);
  assert.equal(rep.ok, false);
});

test("VO-3/FR-17 all checks pass, deterministic, no figures -> ok true", () => {
  const rep = evaluate(checksLesson([{ model: "s", at: { x: 1 }, expect: 1, tol: 0 }]));
  assert.equal(rep.ok, true, JSON.stringify(rep));
  assert.deepEqual(rep.figureErrors, []);
  assert.deepEqual(rep.focusErrors, []);
});

test("VO-3 failing check alone makes ok false", () => {
  assert.equal(evaluate(checksLesson([{ model: "s", at: { x: 9 }, expect: 1, tol: 0 }])).ok, false);
});

// VO-4 determinism
test("VO-4 C-10 Math.random model -> deterministic ok false, Report.ok false; pure and Series models ok true", () => {
  const rep = evaluate((api) => api.lesson(input({
    models: {
      rnd: api.model({}, () => Math.random(), "random"),
      pure: api.model({ a: 1 }, (p) => ({ v: [p.a, { w: p.a }] }), "pure"),
      ser: api.model({}, () => api.ode((t, y) => [-y[0]], [1], [0, 1], 0.1), "ode"),
    },
  })));
  const d = Object.fromEntries(rep.deterministic.map((e) => [e.model, e.ok]));
  assert.deepEqual(d, { rnd: false, pure: true, ser: true });
  assert.equal(rep.ok, false);
});

// VO-4 sampling
function spyLesson(frameOpts, samples) {
  const calls = [];
  let seen;
  const factory = (api) => api.lesson(input({
    models: { m: api.model({ a: 7 }, (p) => ({ a: p.a }), "m") },
    figures: { f: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], ...frameOpts }), (m, t, ctx) => { seen = m; calls.push([t, ctx.step]); return [api.dot([0, 0])]; }) },
  }));
  const rep = evaluate(factory, samples === undefined ? undefined : { samples });
  const uniq = [...new Map(calls.map((c) => [c.join(","), c])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { rep, uniq, seen: () => seen };
}
const closeSet = (actual, expected) => {
  assert.equal(actual.length, expected.length, JSON.stringify(actual));
  actual.forEach(([t], i) => assert.ok(Math.abs(t - expected[i][0]) <= 1e-12, `t ${t} vs ${expected[i][0]}`));
};

test("VO-4 C-11 loop span [0,4], samples 2 -> t = 0, 2, 4", () => {
  const { uniq, rep, seen } = spyLesson({ loop: { ms: 1000, span: [0, 4] } }, 2);
  closeSet(uniq, [[0], [2], [4]]);
  assert.equal(rep.ok, true);
  assert.deepEqual(seen().m, { a: 7 }, "draw receives model outputs at defaults");
});
test("VO-4 loop default samples 5, span [1,2] -> 6 points 1..2", () => {
  closeSet(spyLesson({ loop: { ms: 1000, span: [1, 2] } }).uniq, [[1], [1.2], [1.4], [1.6], [1.8], [2]]);
});
test("VO-4 C-12 steps [a,b,c] -> (t,step) = (0,0),(1,1),(2,2)", () => {
  assert.deepEqual(spyLesson({ steps: ["a", "b", "c"] }).uniq, [[0, 0], [1, 1], [2, 2]]);
});
test("VO-4 C-13 idle samples 4 -> t = 0, .25, .5, .75", () => {
  closeSet(spyLesson({ idle: { ms: 500 } }, 4).uniq, [[0], [0.25], [0.5], [0.75]]);
});
test("VO-4 C-13 static -> t = 0 once", () => {
  closeSet(spyLesson({ static: "s" }, 4).uniq, [[0]]);
});

function badFigure(draw) {
  let otherCalled = false;
  const rep = evaluate((api) => api.lesson(input({
    figures: {
      bad: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => draw(api)),
      good: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => { otherCalled = true; return [api.dot([0, 0])]; }),
    },
  })));
  return { rep, otherCalled };
}
const badCases = [
  ["C-14 throw", () => { throw new Error("boom"); }],
  ["C-14 NaN coordinate", (api) => [api.dot([NaN, 0])]],
  ["Infinity in point array", (api) => [api.line([[0, 0], [Infinity, 1]])]],
  ["-Infinity scalar arg", (api) => [api.arc([0, 0], -Infinity, [0, 90])]],
  ["nested NaN inside options object", (api) => [api.label([0, 0], "x", { leader: [NaN, 1] })]],
  ["NaN inside nested MarkTree array", (api) => [false, [null, [api.dot([0, NaN])]]]],
];
for (const [name, draw] of badCases) {
  test(`VO-4 ${name} -> figureErrors entry, ok false, other figure still evaluated`, () => {
    const { rep, otherCalled } = badFigure(draw);
    assert.ok(rep.figureErrors.length >= 1);
    assert.ok(rep.figureErrors.every((e) => e.figure === "bad"), JSON.stringify(rep.figureErrors));
    assert.equal(rep.figureErrors[0].t, 0);
    assert.equal(rep.figureErrors[0].step, 0);
    assert.equal(typeof rep.figureErrors[0].message, "string");
    assert.equal(rep.ok, false);
    assert.equal(otherCalled, true);
  });
}
test("VO-4 function args are not executed; falsy tree entries are fine", () => {
  let called = false;
  const { rep } = badFigure((api) => [api.field(() => { called = true; return NaN; }), false, null, undefined]);
  assert.deepEqual(rep.figureErrors, []);
  assert.equal(called, false);
  assert.equal(rep.ok, true);
});

// VO-4 focus
function focusLesson(scenes) {
  return (api) => api.lesson(input({
    figures: {
      f1: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], loop: { ms: 1, span: [0, 1] } }), (m, t) => [api.dot([0, 0], { id: "a" }), t > 0.5 && api.dot([1, 1], { id: "late" })]),
      f2: api.figure(api.graph({ layout: "tree", steps: ["x", "y"] }), () => [api.node("b", "B"), api.node("c", "C"), api.edge("b", "c")]),
      both: api.split(["f1", "f2"]),
    },
    sections: [{ concept: { id: "k", title: "k", definition: "d", level: 1 }, scenes }],
  }));
}
test("VO-4 focus present (incl. id only in a later sample, generated ids) -> no focusErrors", () => {
  const rep = evaluate(focusLesson([
    { type: "hook", title: "h", say: "s", figure: "f1", focus: ["a", "late"] },
    { type: "hook", title: "h", say: "s", figure: "f2", focus: ["b", "b->c"] },
  ]));
  assert.deepEqual(rep.focusErrors, []);
  assert.equal(rep.ok, true, JSON.stringify(rep));
});
test("VO-4 C-15 focus id missing -> focusErrors {section, scene, id}, ok false", () => {
  const rep = evaluate(focusLesson([
    { type: "hook", title: "h", say: "s", figure: "f1", focus: ["a"] },
    { type: "hook", title: "h", say: "s", figure: "f1", focus: ["zzz"] },
  ]));
  assert.equal(rep.focusErrors.length, 1);
  assert.deepEqual({ section: rep.focusErrors[0].section, scene: rep.focusErrors[0].scene, id: rep.focusErrors[0].id }, { section: 0, scene: 1, id: "zzz" });
  assert.equal(rep.focusErrors[0].step, undefined);
  assert.equal(rep.ok, false);
});
test("VO-4 steps scene checks focus per step and reports the step index", () => {
  const rep = evaluate(focusLesson([
    { type: "steps", title: "s", figure: "f2", steps: [{ say: "a", focus: ["b"] }, { say: "b", focus: ["missing"] }] },
  ]));
  assert.equal(rep.focusErrors.length, 1);
  assert.deepEqual({ ...rep.focusErrors[0] }, { section: 0, scene: 0, step: 1, id: "missing" });
});
test("VO-4 split figure focus uses union of sub-figures", () => {
  const ok = evaluate(focusLesson([{ type: "compare", title: "c", say: "s", figure: "both", focus: ["a", "b"], a: {}, b: {}, labels: ["x", "y"] }]));
  assert.deepEqual(ok.focusErrors, []);
  const bad = evaluate(focusLesson([{ type: "compare", title: "c", say: "s", figure: "both", focus: ["a", "nothere"], a: {}, b: {}, labels: ["x", "y"] }]));
  assert.deepEqual(bad.focusErrors.map((e) => e.id), ["nothere"]);
});

// v3 additions
test("VO-3 value run(x) merges defaults <- check.at <- x", () => {
  const rep = evaluate((api) => api.lesson(input({
    checks: [
      { model: "p", at: { b: 20 }, value: (o, run) => { const r = run({ c: 300 }); return r.a === 1 && r.b === 20 && r.c === 300; }, expect: true },
      { model: "p", at: { b: 20, c: 30 }, value: (o, run) => { const r = run({ b: 200 }); return r.a === 1 && r.b === 200 && r.c === 30; }, expect: true },
      { model: "p", at: { b: 20 }, value: (o, run) => { const r = run({}); return r.a === 1 && r.b === 20 && r.c === 3; }, expect: true },
    ],
    models: { p: api.model({ a: 1, b: 2, c: 3 }, (q) => ({ ...q }), "params") },
  })));
  assert.deepEqual(rep.checks.map((c) => c.pass), [true, true, true], JSON.stringify(rep.checks));
});

test("VO-4 ctx.params equals all model defaults merged into one object", () => {
  const seen = [];
  evaluate((api) => api.lesson(input({
    models: { m1: api.model({ a: 1, b: 2 }, (p) => p.a, "m1"), m2: api.model({ c: "x", d: true }, (p) => p.c, "m2") },
    figures: { f: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), (m, t, ctx) => { seen.push(ctx.params); return []; }) },
  })));
  assert.ok(seen.length > 0);
  for (const p of seen) assert.deepEqual({ ...p }, { a: 1, b: 2, c: "x", d: true });
});

// v4 additions: C-43 explain focus; FR-20 bindingErrors (C-41, C-42, C-44)
function bindLesson(mut = {}) {
  return (api) => {
    const s = {
      knobs: { q: [0, 1] },
      handles: [{ mark: "h", x: "q", y: "r" }],
      over: { q: [1, 2] },
      link: "q",
      predictFig: "f",
      quizFig: "f",
      summary: ["f", "pair"],
      explainFocus: ["h"],
      ...mut,
    };
    return api.lesson(input({
      models: { m: api.model({ q: 1, r: 2 }, (p) => ({ v: p.q + p.r }), "m") },
      figures: {
        f: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([0, 0], { id: "h" })]),
        g: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([1, 1], { id: "k" })]),
        pair: api.split(["f", "g"], { link: s.link }),
        many: api.multiples("f", { over: s.over }),
      },
      sections: [{ concept: { id: "c", title: "c", definition: "d", level: 1 }, scenes: [
        { type: "explain", title: "e", say: "s", figure: "f", focus: s.explainFocus },
        { type: "explore", title: "x", say: "s", figure: "f", focus: ["h"], knobs: s.knobs, handles: s.handles },
        { type: "predict", title: "p", ask: "a", figure: "f", focus: ["h"], input: { kind: "choice", options: [{ text: "a", correct: true }] }, reveal: { say: "r", figure: s.predictFig } },
        { type: "quiz", items: [{ kind: "choice", prompt: "p", options: [{ text: "a", correct: true }], objective: "o1", reveal: { figure: s.quizFig } }] },
      ] }],
      summary: { figures: s.summary },
    }));
  };
}

test("VO-4 v4 all-valid binding lesson -> zero bindingErrors, ok true", () => {
  const rep = evaluate(bindLesson());
  assert.deepEqual(rep.bindingErrors, []);
  assert.deepEqual(rep.focusErrors, []);
  assert.equal(rep.ok, true, JSON.stringify(rep));
});
test("VO-4 v4 split link as mark id is valid", () => {
  assert.deepEqual(evaluate(bindLesson({ link: "k" })).bindingErrors, []);
});
test("VO-4 C-43 explain focus missing -> focusErrors 1", () => {
  const rep = evaluate(bindLesson({ explainFocus: ["nope"] }));
  assert.equal(rep.focusErrors.length, 1);
  assert.deepEqual({ section: rep.focusErrors[0].section, scene: rep.focusErrors[0].scene, id: rep.focusErrors[0].id }, { section: 0, scene: 0, id: "nope" });
  assert.equal(rep.ok, false);
});
const bindCases = [
  ["C-41 handle mark missing", { handles: [{ mark: "zz", x: "q" }] }, 0, 1, "zz"],
  ["C-41 handle x param missing", { handles: [{ mark: "h", x: "qq" }] }, 0, 1, "qq"],
  ["handle y param missing", { handles: [{ mark: "h", y: "rr" }] }, 0, 1, "rr"],
  ["knob key not a param", { knobs: { nope: [0, 1] } }, 0, 1, "nope"],
  ["C-42 multiples over key not a param", { over: { zz: [1, 2] } }, null, null, "zz"],
  ["split link neither mark id nor param", { link: "ghost" }, null, null, "ghost"],
  ["C-44 predict reveal.figure missing", { predictFig: "nofig" }, 0, 2, "nofig"],
  ["quiz reveal.figure missing", { quizFig: "nofig2" }, 0, 3, "nofig2"],
  ["summary figure missing (lesson level)", { summary: ["f", "lost"] }, -1, -1, "lost"],
];
for (const [name, mut, section, scene, id] of bindCases) {
  test(`VO-4 v4 binding: ${name} -> one bindingErrors entry, ok false`, () => {
    const rep = evaluate(bindLesson(mut));
    assert.equal(rep.bindingErrors.length, 1, JSON.stringify(rep.bindingErrors));
    const e = rep.bindingErrors[0];
    assert.equal(e.id, id);
    assert.equal(typeof e.message, "string");
    assert.ok(e.message.length > 0);
    if (section !== null) assert.deepEqual([e.section, e.scene], [section, scene]);
    assert.equal(rep.ok, false);
  });
}

// V1-2 (FR-16): focus on multiples figures and on predict / define / explore scenes.
function focusSceneLesson(scenes) {
  return (api) => api.lesson(input({
    models: { m: api.model({ k: 1 }, (p) => ({ v: p.k }), "m") },
    figures: {
      base: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([0, 0], { id: "a" })]),
      many: api.multiples("base", { over: { k: [1, 2] } }),
    },
    sections: [{ concept: { id: "k", title: "k", definition: "d", level: 1 }, scenes }],
  }));
}
const idsOf = (rep) => rep.focusErrors.map((e) => `${e.section}/${e.scene}/${e.id}`);
test("V1-2 multiples figure: base figure id in focus -> no focusError; unknown id -> one", () => {
  const ok = evaluate(focusSceneLesson([{ type: "explain", title: "e", say: "s", figure: "many", focus: ["a"] }]));
  assert.deepEqual(ok.focusErrors, []);
  const bad = evaluate(focusSceneLesson([{ type: "explain", title: "e", say: "s", figure: "many", focus: ["a", "ghost"] }]));
  assert.deepEqual(idsOf(bad), ["0/0/ghost"]);
  assert.equal(bad.ok, false);
});
const choice = { kind: "choice", options: [{ text: "a", correct: true }] };
const focusScenes = {
  predict: { type: "predict", title: "p", ask: "a", figure: "base", focus: ["ghost"], input: choice, reveal: { say: "r" } },
  define: { type: "define", term: "t", definition: "d", figure: "base", focus: ["ghost"] },
  explore: { type: "explore", title: "x", say: "s", figure: "base", focus: ["ghost"], knobs: { k: [0, 1] } },
};
for (const [kind, scene] of Object.entries(focusScenes)) {
  test(`V1-2 ${kind} scene with unknown focus id -> exactly one focusError at its position`, () => {
    const rep = evaluate(focusSceneLesson([{ type: "explain", title: "e", say: "s", figure: "base", focus: ["a"] }, scene]));
    assert.deepEqual(idsOf(rep), ["0/1/ghost"]);
    assert.equal(rep.ok, false);
  });
  test(`V1-2 ${kind} scene with known focus id -> no focusError`, () => {
    const rep = evaluate(focusSceneLesson([{ ...scene, focus: ["a"] }]));
    assert.deepEqual(rep.focusErrors, []);
  });
}
