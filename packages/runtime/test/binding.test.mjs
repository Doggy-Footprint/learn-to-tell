// VO-17 (FR-21, FR-37, C-45, C-46) bindingErrors export and count binding check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { STUB, COUNT, tmpdir, input } from "./fixtures/helpers.mjs";
import { valid, writeFragment, fragmentSource } from "./fixtures/fragments.mjs";

const stub = await import(STUB);
const { evaluate, load, createApi } = stub;
const bindingErrors = stub.bindingErrors;

// Several FR-20 kinds at once: handle mark, handle param, knob key, multiples key, split link, predict/quiz/summary figure.
const badFactory = (api) => api.lesson(input({
  models: { m: api.model({ q: 1 }, (p) => ({ v: p.q }), "m") },
  figures: {
    f: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([0, 0], { id: "h" })]),
    g: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([1, 1], { id: "k" })]),
    pair: api.split(["f", "g"], { link: "ghost" }),
    many: api.multiples("f", { over: { zz: [1, 2] } }),
  },
  sections: [{ concept: { id: "c", title: "c", definition: "d", level: 1 }, scenes: [
    { type: "explore", title: "x", say: "s", figure: "f", focus: ["h"], knobs: { nope: [0, 1] }, handles: [{ mark: "nomark", x: "q" }, { mark: "h", x: "noparam" }] },
    { type: "predict", title: "p", ask: "a", figure: "f", focus: ["h"], input: { kind: "choice", options: [{ text: "a", correct: true }] }, reveal: { say: "r", figure: "nofig" } },
    { type: "quiz", items: [{ kind: "choice", prompt: "p", options: [{ text: "a", correct: true }], objective: "o1", reveal: { figure: "nofig2" } }] },
  ] }],
  summary: { figures: ["f", "lost"] },
}));

const sortKey = (e) => `${e.section}/${e.scene}/${e.id}`;

test("VO-17 C-46 bindingErrors(input) deep-equals evaluate().bindingErrors for multi-kind errors", () => {
  assert.equal(typeof bindingErrors, "function");
  const inp = load(badFactory).input;
  const direct = bindingErrors(inp);
  const viaEval = evaluate(badFactory).bindingErrors;
  assert.ok(direct.length >= 8, JSON.stringify(direct));
  assert.deepEqual(direct, viaEval);
  const ids = direct.map((e) => e.id);
  for (const id of ["nomark", "noparam", "nope", "zz", "ghost", "nofig", "nofig2", "lost"]) assert.ok(ids.includes(id), id);
  for (const e of direct) assert.deepEqual(Object.keys(e).sort(), ["id", "message", "scene", "section"]);
  assert.deepEqual(direct.map(sortKey).sort(), viaEval.map(sortKey).sort());
});

test("VO-17 C-46 bindingErrors on a fully valid input is []", () => {
  const f = (api) => api.lesson(input({
    models: { m: api.model({ q: 1 }, (p) => ({ v: p.q }), "m") },
    figures: { f: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([0, 0], { id: "h" })]) },
    sections: [{ concept: { id: "c", title: "c", definition: "d", level: 1 }, scenes: [
      { type: "explore", title: "x", say: "s", figure: "f", focus: ["h"], knobs: { q: [0, 1] }, handles: [{ mark: "h", x: "q" }] },
    ] }],
    summary: { figures: ["f"] },
  }));
  assert.deepEqual(bindingErrors(load(f).input), []);
  assert.deepEqual(evaluate(f).bindingErrors, []);
});

const figs = (api) => ({ f: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([0, 0], { id: "h" })]) });

test("VO-17 C-46 models+figures+sections only (no quiz/summary): scene reference errors computed, no throw", () => {
  const { api } = createApi();
  const inp = {
    models: { m: api.model({ q: 1 }, (p) => ({ v: p.q }), "m") },
    figures: figs(api),
    sections: [{ concept: { id: "c", title: "c", definition: "d", level: 1 }, scenes: [
      { type: "explore", title: "x", say: "s", figure: "f", focus: ["h"], knobs: { zz: [0, 1] } },
    ] }],
  };
  let r;
  assert.doesNotThrow(() => { r = bindingErrors(inp); });
  assert.equal(r.length, 1);
  assert.equal(r[0].id, "zz");
  assert.deepEqual([r[0].section, r[0].scene], [0, 0]);
});

test("VO-17 C-46 input with only models and figures -> [] and no throw", () => {
  const { api } = createApi();
  const inp = { models: { m: api.model({ q: 1 }, (p) => ({ v: p.q }), "m") }, figures: figs(api) };
  let r;
  assert.doesNotThrow(() => { r = bindingErrors(inp); });
  assert.deepEqual(r, []);
});

test("VO-17 C-46 input with no models key does not throw", () => {
  const { api } = createApi();
  const inp = { figures: figs(api) };
  let r;
  assert.doesNotThrow(() => { r = bindingErrors(inp); });
  assert.deepEqual(r, []);
});

// count CLI (FR-37, C-45)
const runCli = (args) => spawnSync(process.execPath, [COUNT, ...args], { encoding: "utf8" });
const fragBody = (knobs) => `(api) => ({
  models: { m: api.model({ q: 1 }, (p) => ({ v: p.q }), "m") },
  figures: { f: api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([0, 0], { id: "h" })]) },
  scenes: [{ type: "explore", title: "x", say: "s", figure: "f", focus: ["h"], knobs: ${knobs} }],
})`;

test("VO-17 C-45 count: knob key not a model param -> exit 1, stderr names file and binding, no outputs", () => {
  const dir = tmpdir("ltt-bind-in-"), out = tmpdir("ltt-bind-out-");
  writeFragment(dir, "frag.js", [valid.V()], { body: fragBody("{ zz: [0, 1] }") });
  const r = runCli([dir, "--out", out]);
  assert.equal(r.status, 1, `stdout ${r.stdout} stderr ${r.stderr}`);
  assert.match(r.stderr, /frag\.js/);
  assert.match(r.stderr, /binding/);
  assert.deepEqual(fs.readdirSync(out), []);
});

test("VO-17 C-45 count: binding failure leaves pre-existing summary.json byte-identical, no figures.tsv", () => {
  const dir = tmpdir("ltt-bind-keep-in-"), out = tmpdir("ltt-bind-keep-out-");
  writeFragment(dir, "frag.js", [valid.V()], { body: fragBody("{ zz: [0, 1] }") });
  fs.writeFileSync(path.join(out, "summary.json"), '{"old":true}\n');
  const r = runCli([dir, "--out", out]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /binding/);
  assert.equal(fs.readFileSync(path.join(out, "summary.json"), "utf8"), '{"old":true}\n');
  assert.deepEqual(fs.readdirSync(out), ["summary.json"]);
});

test("VO-17 FR-37 count: binding message follows 'binding <id>: <message>' with the offending id", () => {
  const dir = tmpdir("ltt-bind-fmt-in-"), out = tmpdir("ltt-bind-fmt-out-");
  writeFragment(dir, "frag.js", [valid.V()], { body: fragBody("{ zz: [0, 1] }") });
  const r = runCli([dir, "--out", out]);
  assert.match(r.stderr, /binding zz: \S/);
});

test("VO-17 C-45 count: correct knob key -> exit 0 and outputs written", () => {
  const dir = tmpdir("ltt-bind-ok-in-"), out = tmpdir("ltt-bind-ok-out-");
  writeFragment(dir, "frag.js", [valid.V()], { body: fragBody("{ q: [0, 1] }") });
  const r = runCli([dir, "--out", out]);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stderr, /binding/);
  assert.deepEqual(fs.readdirSync(out).sort(), ["figures.tsv", "summary.json"]);
});

test("VO-17 FR-37 count: fragment without scenes and without models still passes", () => {
  const dir = tmpdir("ltt-bind-noscene-in-"), out = tmpdir("ltt-bind-noscene-out-");
  writeFragment(dir, "frag.js", [valid.V()]);
  const r = runCli([dir, "--out", out]);
  assert.equal(r.status, 0, r.stderr);
});

// VO-19 (FR-20 v6, C-48, C-49): screen params count as declared params.
const concept = { id: "c", title: "c", definition: "d", level: 1 };
const fig2 = (api) => api.figure(api.cartesian({ x: [0, 1, "u"], y: [0, 1, "u"], static: "s" }), () => [api.dot([0, 0], { id: "h" })]);
const exploreTab = (extra = {}) => ({ type: "explore", title: "x", say: "s", figure: "f", focus: ["h"], knobs: { tab: ["a", "b"] }, ...extra });
const choiceOpts = (o) => ({ kind: "choice", options: [{ text: "a", correct: true, ...o }] });
const predict = (o = {}) => ({ type: "predict", title: "p", ask: "a", figure: "f", focus: ["h"], input: choiceOpts(), reveal: { say: "r" }, ...o });
const quizItem = (o = {}) => ({ kind: "choice", prompt: "p", options: [{ text: "a", correct: true }], objective: "o1", ...o });

const mk = ({ scenes = [], quiz = [], figures = {} }) => (api) => api.lesson(input({
  models: { m: api.model({ q: 1 }, (p) => ({ v: p.q }), "m") },
  figures: { f: fig2(api), g: fig2(api), ...Object.fromEntries(Object.entries(figures).map(([k, fn]) => [k, fn(api)])) },
  sections: [{ concept, scenes }],
  quiz,
}));
const errs = (factory) => {
  const direct = bindingErrors(load(factory).input);
  assert.deepEqual(direct, evaluate(factory).bindingErrors);
  return direct;
};

const sources = {
  "scene params": { scenes: [{ type: "explain", title: "e", say: "s", figure: "f", focus: ["h"], params: { tab: "a" } }] },
  "explore scene's own params": { scenes: [], own: true },
  "predict Option params": { scenes: [predict({ input: choiceOpts({ params: { tab: "a" } }) })] },
  "predict reveal.params": { scenes: [predict({ reveal: { say: "r", params: { tab: "a" } } })] },
  "compare a": { scenes: [{ type: "compare", title: "c", say: "s", figure: "f", focus: ["h"], a: { tab: "a" }, b: {}, labels: ["A", "B"] }] },
  "compare b": { scenes: [{ type: "compare", title: "c", say: "s", figure: "f", focus: ["h"], a: {}, b: { tab: "b" }, labels: ["A", "B"] }] },
  "quiz item params": { scenes: [{ type: "quiz", items: [quizItem({ figure: "f", params: { tab: "a" } })] }] },
  "quiz item reveal.params": { scenes: [{ type: "quiz", items: [quizItem({ reveal: { params: { tab: "a" } } })] }] },
  "quiz item Option params": { scenes: [{ type: "quiz", items: [quizItem({ options: [{ text: "a", correct: true, params: { tab: "a" } }] })] }] },
  "lesson-level quiz params": { quiz: [quizItem({ figure: "f", params: { tab: "a" } })] },
  "lesson-level quiz reveal.params": { quiz: [quizItem({ reveal: { params: { tab: "a" } } })] },
};
for (const [name, src] of Object.entries(sources)) {
  test(`VO-19 C-48 knob key declared only via ${name} -> no binding error`, () => {
    const scenes = [...(src.scenes ?? []), exploreTab(src.own ? { params: { tab: "a" } } : {})];
    assert.deepEqual(errs(mk({ scenes, quiz: src.quiz })), []);
  });
}

test(`VO-19 C-49 knob key undeclared anywhere -> exactly 1 error`, () => {
  const r = errs(mk({ scenes: [exploreTab()] }));
  assert.equal(r.length, 1, JSON.stringify(r));
  assert.equal(r[0].id, "tab");
});

const screen = { type: "explain", title: "e", say: "s", figure: "f", focus: ["h"], params: { tab: "a" } };
test("VO-19 C-48 handle x/y, multiples over key and split link declared as screen params -> 0 errors", () => {
  const f = mk({
    scenes: [screen, exploreTab({ knobs: {}, handles: [{ mark: "h", x: "tab", y: "tab" }] })],
    figures: { many: (api) => api.multiples("f", { over: { tab: ["a", "b"] } }), pair: (api) => api.split(["f", "g"], { link: "tab" }) },
  });
  assert.deepEqual(errs(f), []);
});
test("VO-19 C-48 split link that is a mark id -> 0 errors", () => {
  assert.deepEqual(errs(mk({ figures: { pair: (api) => api.split(["f", "g"], { link: "h" }) } })), []);
});
test("VO-19 C-49 undeclared handle x -> exactly 1 error with that id", () => {
  const r = errs(mk({ scenes: [screen, exploreTab({ knobs: {}, handles: [{ mark: "h", x: "nox" }] })] }));
  assert.equal(r.length, 1, JSON.stringify(r));
  assert.equal(r[0].id, "nox");
});
test("VO-19 C-49 undeclared handle y -> exactly 1 error with that id", () => {
  const r = errs(mk({ scenes: [screen, exploreTab({ knobs: {}, handles: [{ mark: "h", y: "noy" }] })] }));
  assert.equal(r.length, 1, JSON.stringify(r));
  assert.equal(r[0].id, "noy");
});
test("VO-19 C-49 undeclared multiples over key -> exactly 1 error with that id", () => {
  const r = errs(mk({ scenes: [screen], figures: { many: (api) => api.multiples("f", { over: { zz: [1, 2] } }) } }));
  assert.equal(r.length, 1, JSON.stringify(r));
  assert.equal(r[0].id, "zz");
});
test("VO-19 C-49 undeclared split link -> exactly 1 error with that id", () => {
  const r = errs(mk({ scenes: [screen], figures: { pair: (api) => api.split(["f", "g"], { link: "ghost" }) } }));
  assert.equal(r.length, 1, JSON.stringify(r));
  assert.equal(r[0].id, "ghost");
});
test("VO-19 C-48 model default key remains declared (knob q) -> 0 errors", () => {
  assert.deepEqual(errs(mk({ scenes: [exploreTab({ knobs: { q: [0, 1] } })] })), []);
});

// V1-3 (FR-20, VO-4/17/19): declared params come from every model, not just the first.
const multiModel = (mut = {}) => (api) => {
  const s = { knobs: {}, handles: undefined, over: { p1: [1, 2] }, link: "p1", ...mut };
  return api.lesson(input({
    models: {
      m1: api.model({ p1: 1 }, (p) => ({ v: p.p1 }), "m1"),
      m2: api.model({ p2: 1 }, (p) => ({ v: p.p2 }), "m2"),
      m3: api.model({ p3: 1 }, (p) => ({ v: p.p3 }), "m3"),
    },
    figures: {
      f: fig2(api), g: fig2(api),
      pair: api.split(["f", "g"], { link: s.link }),
      many: api.multiples("f", { over: s.over }),
    },
    sections: [{ concept, scenes: [{ type: "explore", title: "x", say: "s", figure: "f", focus: ["h"], knobs: s.knobs, handles: s.handles }] }],
  }));
};
const placements = {
  "knob": (k) => ({ knobs: { [k]: [0, 1] } }),
  "handle x": (k) => ({ handles: [{ mark: "h", x: k }] }),
  "handle y": (k) => ({ handles: [{ mark: "h", y: k }] }),
  "multiples over": (k) => ({ over: { [k]: [1, 2] } }),
  "split link": (k) => ({ link: k }),
};
for (const [place, mk2] of Object.entries(placements)) {
  for (const key of ["p2", "p3"]) {
    test(`V1-3 ${place} key '${key}' (param of a later model only) -> no binding entry`, () => {
      assert.deepEqual(errs(multiModel(mk2(key))), []);
    });
  }
  test(`V1-3 ${place} key in no model and no params -> exactly one entry`, () => {
    const r = errs(multiModel(mk2("nowhere")));
    assert.equal(r.length, 1, JSON.stringify(r));
    assert.equal(r[0].id, "nowhere");
  });
}

// V1-4 (FR-20): lesson-level quiz[] reveal.figure.
test("V1-4 lesson quiz[] reveal.figure not in figures -> one entry with section -1 and scene -1", () => {
  const r = errs(mk({ quiz: [quizItem({ reveal: { figure: "nofig" } })] }));
  assert.equal(r.length, 1, JSON.stringify(r));
  assert.deepEqual([r[0].section, r[0].scene, r[0].id], [-1, -1, "nofig"]);
});
test("V1-4 lesson quiz[] reveal.figure in figures -> no entry", () => {
  assert.deepEqual(errs(mk({ quiz: [quizItem({ reveal: { figure: "g" } })] })), []);
});
