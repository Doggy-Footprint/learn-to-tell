// VO-10 (FR-14, C-28..C-32, QR-9) checkLesson decision table; VO-9 integration part (C-26).
// Oracle: spec Signatures "check" rule conditions and path format; each violation is a single mutation of a check-clean base.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHECK, EXAMPLE, FIXTURE_LESSONS, importFile } from "./fixtures/m1.mjs";
import { base, VIOLATIONS, LAYOUT_RULES, UNIMPLEMENTED, unimplementedLesson } from "./fixtures/check-cases.mjs";

const { checkLesson, RULES } = await import(CHECK);

const SPEC_RULES = ["load-error", "check-fail", "model-pure", "figure-eval", "focus-unknown-id", "binding", "data-in-domain", "goal-reachable", "goal-at-start", "reveal-marks-exist", "input-binding", "term-defined-before-use", "accent-focus-only", "unimplemented", "unknown-region", "text-no-room", "graph-too-large"];

/** Report-wide invariants: rule in RULES, layer matches rule, message 1..300 chars, (rule, path, viewport) unique. */
function wellFormed(rep) {
  assert.equal(typeof rep.ok, "boolean");
  assert.equal(rep.ok, rep.errors.length === 0, "ok iff no errors");
  const seen = new Set();
  for (const e of rep.errors) {
    assert.ok(RULES.includes(e.rule), `rule ${e.rule} not in RULES`);
    assert.equal(e.layer, LAYOUT_RULES.has(e.rule) ? "layout" : "check", `layer of ${e.rule}`);
    if (e.layer === "layout") assert.ok(["desktop", "mobile"].includes(e.viewport), `layout error viewport ${e.viewport}`);
    assert.equal(typeof e.path, "string");
    assert.equal(typeof e.message, "string");
    assert.ok(e.message.length > 0 && e.message.length <= 300, `message length ${e.message.length}`);
    const k = `${e.rule}|${e.path}|${e.viewport ?? ""}`;
    assert.ok(!seen.has(k), `duplicate ${k}`);
    seen.add(k);
  }
}

test("VO-10 RULES is exactly the 17 spec rule ids", () => {
  assert.deepEqual([...RULES].sort(), [...SPEC_RULES].sort());
});

test("VO-10 base lesson (all rules, normal partition) -> ok, 0 errors", async () => {
  const rep = await checkLesson(base());
  wellFormed(rep);
  assert.deepEqual(rep.errors, []);
  assert.equal(rep.ok, true);
});

test("VO-10 C-28 example lesson -> ok, 0 errors", async () => {
  const rep = await checkLesson(await importFile(EXAMPLE), { file: EXAMPLE });
  wellFormed(rep);
  assert.deepEqual(rep.errors, []);
});

for (const f of FIXTURE_LESSONS) {
  test(`VO-10 fixture lesson ${f.split("/").pop()} is check-clean`, { timeout: 120000 }, async () => {
    const rep = await checkLesson(await importFile(f), { file: f });
    wellFormed(rep);
    assert.deepEqual(rep.errors, []);
  });
}

for (const [label, rule, factory, pathOk, pathDesc, paths] of VIOLATIONS) {
  test(`VO-10 C-29 ${label} -> only rule ${rule}, path ${pathDesc}`, { timeout: 120000 }, async () => {
    const rep = await checkLesson(factory);
    wellFormed(rep);
    assert.equal(rep.ok, false);
    assert.ok(rep.errors.length >= 1, "expected an error");
    assert.deepEqual([...new Set(rep.errors.map((e) => e.rule))], [rule], JSON.stringify(rep.errors));
    for (const e of rep.errors) assert.ok(pathOk(e.path), `path ${e.path} should be ${pathDesc}`);
    if (rule === "accent-focus-only") for (const e of rep.errors) assert.match(e.message, /\b(acc|qa)\b/, "message names the mark id");
    if (paths) assert.deepEqual([...new Set(rep.errors.map((e) => e.path))].sort(), [...paths].sort(), "exact path set");
  });
}

test("VO-10 C-30 data-in-domain boundary: coordinate exactly at axis max/min -> no error", async () => {
  const rep = await checkLesson(base(undefined, (api) => [api.dot([10, 10], { id: "edge-hi" }), api.dot([0, 0], { id: "edge-lo" })]));
  wellFormed(rep);
  assert.deepEqual(rep.errors, []);
});
test("VO-10 C-30 data-in-domain boundary: y = min - 1e-6 -> error", async () => {
  const rep = await checkLesson(base(undefined, (api) => [api.dot([5, -1e-6], { id: "below" })]));
  assert.deepEqual([...new Set(rep.errors.map((e) => e.rule))], ["data-in-domain"]);
});
test("VO-10 data-in-domain samples explore knob ends: violation only at q max -> error", async () => {
  const rep = await checkLesson(base(undefined, (api, params) => [api.dot([Number(params.q ?? 0.5) * 10 + (Number(params.q) === 1 ? 1 : 0), 6], { id: "knob-end" })]));
  assert.deepEqual([...new Set(rep.errors.map((e) => e.rule))], ["data-in-domain"]);
});
test("VO-10 data-in-domain samples Option params: violation only under an option's params -> error", async () => {
  const rep = await checkLesson(base((inp) => { inp.sections[0].scenes[2].input.options[1].params = { q: 1.5 }; }));
  assert.deepEqual([...new Set(rep.errors.map((e) => e.rule))], ["data-in-domain"], JSON.stringify(rep.errors));
});
test("VO-10 C-31 goal-reachable: true only at knob max end -> no error", async () => {
  const rep = await checkLesson(base((inp) => { inp.sections[0].scenes[5].goal.done = (m) => m.m.v >= 1; }));
  assert.deepEqual(rep.errors, []);
});
test("VO-10 C-31 goal-reachable: true only at knob min end -> no error", async () => {
  const rep = await checkLesson(base((inp) => { inp.sections[0].scenes[5].goal.done = (m) => m.m.v <= 0; }));
  assert.deepEqual(rep.errors, []);
});
test("VO-10 goal-reachable: stepped knob, goal only between grid points -> error", async () => {
  // knob [0,1,0.5] grid {0, 0.5, 1}; v in (0.6, 0.7) is never visited.
  const rep = await checkLesson(base((inp) => {
    inp.sections[0].scenes[5].knobs = { q: [0, 1, 0.5] };
    inp.sections[0].scenes[5].goal.done = (m) => m.m.v > 0.6 && m.m.v < 0.7;
  }));
  assert.deepEqual([...new Set(rep.errors.map((e) => e.rule))], ["goal-reachable"]);
});
const listBoolGoal = (done) => base((inp, api) => {
  inp.models.m = api.model({ q: 0.5, mode: "a", on: false }, (p) => ({ v: p.q, hit: p.mode === "c" && p.on }), "identity");
  inp.sections[0].scenes[5].knobs = { q: [0, 1], mode: ["a", "b", "c"], on: true };
  inp.sections[0].scenes[5].goal.done = done;
});
test("VO-10 goal-reachable: goal needing list value 'c' and boolean true -> no error (all list/boolean values searched)", async () => {
  const rep = await checkLesson(listBoolGoal((m) => m.m.hit));
  assert.deepEqual(rep.errors, [], JSON.stringify(rep.errors));
});
test("VO-10 goal-reachable: goal needing a list value that is not offered -> error", async () => {
  const rep = await checkLesson(listBoolGoal((m) => m.m.hit && m.m.v > 2));
  assert.deepEqual([...new Set(rep.errors.map((e) => e.rule))], ["goal-reachable"]);
});
test("VO-10 C-32 same violation at 6 time samples -> exactly 1 error", async () => {
  const rep = await checkLesson(base((inp, api) => {
    inp.figures.lp = api.figure(api.cartesian({ x: [0, 10, "m"], y: [0, 10, "m"], loop: { ms: 1000, span: [0, 5] } }), () => [api.dot([11, 5], { id: "stuck" })]);
    inp.sections[0].scenes.push({ type: "hook", title: "반복", say: "반복 장면.", figure: "lp", focus: ["stuck"] });
  }));
  wellFormed(rep);
  assert.equal(rep.errors.filter((e) => e.rule === "data-in-domain").length, 1, JSON.stringify(rep.errors));
  assert.equal(rep.errors.length, 1);
  assert.equal(rep.errors[0].path, "figures.lp#stuck", "no @t in data-in-domain path");
});
test("VO-10 term-defined-before-use: term after its define scene -> no error; case differs -> no error", async () => {
  const rep = await checkLesson(base((inp) => {
    inp.sections[0].scenes[2].ask = "속도계는 어디일까?";
    inp.sections[0].scenes[0].say = "SPEED 속도 계기를 본다.";
  }));
  assert.deepEqual(rep.errors, []);
});
test("VO-10 term-defined-before-use: term inside an earlier option feedback -> error", async () => {
  const rep = await checkLesson(base((inp) => {
    inp.sections[0].scenes.unshift({ type: "predict", title: "앞", ask: "고르자", figure: "f", focus: ["a"], input: { kind: "choice", options: [{ text: "가", correct: true }, { text: "나", feedback: "속도계가 필요하다." }] }, reveal: { say: "가." } });
  }));
  assert.deepEqual([...new Set(rep.errors.map((e) => e.rule))], ["term-defined-before-use"]);
});
test("VO-10 accent-focus-only: focus-tone mark listed in every scene focus that shows it -> no error", async () => {
  const rep = await checkLesson(base((inp) => {
    for (const s of inp.sections[0].scenes) if (s.figure === "f") s.focus = [...s.focus, "acc"];
    inp.summary.figures = [];
  }, (api) => [api.dot([3, 3], { id: "acc", tone: "focus" })]));
  assert.deepEqual(rep.errors, [], JSON.stringify(rep.errors));
});
test("VO-10 checkLesson is deterministic", async () => {
  const f = VIOLATIONS.find((v) => v[1] === "accent-focus-only")[2];
  assert.deepEqual(await checkLesson(f), await checkLesson(f));
});
test("VO-10 viewports option limits layout errors to the given viewport", async () => {
  const f = VIOLATIONS.find((v) => v[1] === "text-no-room")[2];
  const rep = await checkLesson(f, { viewports: ["mobile"] });
  assert.ok(rep.errors.length >= 1);
  assert.ok(rep.errors.every((e) => e.viewport === "mobile"));
});

// VO-9 integration: each unimplemented target is a layout-layer `unimplemented` error located at the figure/mark.
for (const [name, make, prefix] of UNIMPLEMENTED) {
  test(`VO-9 C-26 checkLesson: ${name} -> unimplemented at ${prefix}`, { timeout: 60000 }, async () => {
    const rep = await checkLesson(unimplementedLesson(make));
    wellFormed(rep);
    const u = rep.errors.filter((e) => e.rule === "unimplemented");
    assert.ok(u.length >= 1, JSON.stringify(rep.errors));
    assert.ok(u.every((e) => e.path === prefix), JSON.stringify(u));
    assert.ok(u.some((e) => e.message.includes(name)), `message names ${name}: ${u[0].message}`);
  });
}
