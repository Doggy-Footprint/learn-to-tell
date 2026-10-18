import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const KIT = fileURLToPath(new URL("../skills/learn-to-tell/kit/", import.meta.url));
const DECK_CHAIN = ["vendor/d3.min.js", "ltt.js", "ltt-parts.js", "ltt-ui.js", "ltt-mock.js", "ltt-deck.js"];

function newContext() {
  const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
  vm.createContext(context);
  return context;
}
const runFile = (context, f) => vm.runInContext(readFileSync(join(KIT, f), "utf8"), context, { filename: f });

function loadKit() {
  const context = newContext();
  runFile(context, "ltt.js");
  return context.LTT;
}

function loadDeck() {
  const context = newContext();
  for (const f of DECK_CHAIN) runFile(context, f);
  return context.LTT;
}

// ---------- oracle: Signatures meta field table (spec v1) ----------

const TYPES = ["hook", "explain", "terms", "compare", "figure", "overview", "statement", "contrast", "predict", "summary", "keywords", "map-related"];
const BOOL_DEFAULTS = {
  head: true,
  autoSplit: true,
  fullByDefault: false,
  pointsOnMock: false,
  sumVisualAreas: false,
  needsReadingGuide: false,
  titleOptional: false,
  bookend: false,
  signature: false,
  auditHero: false,
  auditSmallVisual: true,
  auditLooseFigure: false,
};
const NON_DEFAULT = {
  head: ["hook", "statement"],
  autoSplit: ["map-related", "hook", "keywords", "summary", "terms", "contrast", "predict", "figure", "overview", "statement"],
  fullByDefault: ["figure", "overview"],
  pointsOnMock: ["figure", "overview"],
  sumVisualAreas: ["compare"],
  needsReadingGuide: ["compare", "contrast", "figure", "overview"],
  titleOptional: ["hook", "keywords", "summary"],
  bookend: ["hook", "keywords"],
  signature: ["figure", "contrast"],
  auditHero: ["figure"],
  auditSmallVisual: ["hook", "terms", "summary", "keywords", "statement", "predict"],
  auditLooseFigure: ["figure"],
};
const CARD_GRID_TYPES = ["explain", "compare", "summary", "terms"];
const META_FIELDS = [...Object.keys(BOOL_DEFAULTS), "cardGrid"];
const meta = (type, field) => (NON_DEFAULT[field].includes(type) ? !BOOL_DEFAULTS[field] : BOOL_DEFAULTS[field]);
const label = (type) => (type === "" ? '""' : type);

// ---------- VO-1 table values (ltt.js only) ----------

test("VO-1 C-2: oracle covers 13 meta fields", () => {
  assert.equal(META_FIELDS.length, 13);
  assert.equal(TYPES.length, 12);
});

test("VO-1 C-2: LTT.sceneTypes has exactly the 12 spec types as keys", () => {
  const t = loadKit().sceneTypes;
  assert.ok(t && typeof t === "object", "LTT.sceneTypes is missing after loading ltt.js alone");
  assert.deepEqual(Object.keys(t).sort(), [...TYPES].sort());
});

test("VO-1 FR-1: LTT.sceneTypes has no prototype, so constructor and toString are not types", () => {
  const t = loadKit().sceneTypes;
  assert.equal(Object.getPrototypeOf(t), null);
  for (const name of ["constructor", "toString"]) assert.equal(name in t, false, `"${name}" in LTT.sceneTypes`);
});

for (const type of TYPES) {
  test(`VO-1 C-2 ${type}: every meta field is an own property with the Signatures value`, () => {
    const entry = loadKit().sceneTypes[type];
    assert.ok(entry, `LTT.sceneTypes["${type}"] is missing`);
    const wrong = [];
    for (const field of Object.keys(BOOL_DEFAULTS)) {
      if (!Object.prototype.hasOwnProperty.call(entry, field)) wrong.push(`${field}: not an own property`);
      else if (entry[field] !== meta(type, field)) wrong.push(`${field}: expected ${meta(type, field)}, got ${String(entry[field])}`);
    }
    if (!Object.prototype.hasOwnProperty.call(entry, "cardGrid")) wrong.push("cardGrid: not an own property");
    else if (CARD_GRID_TYPES.includes(type)) {
      if (typeof entry.cardGrid !== "function") wrong.push(`cardGrid: expected a function, got ${String(entry.cardGrid)}`);
    } else if (entry.cardGrid !== false) wrong.push(`cardGrid: expected false, got ${String(entry.cardGrid)}`);
    assert.deepEqual(wrong, [], `${type}:\n${wrong.join("\n")}`);
  });
}

// C-6 rows, evaluated through the table's cardGrid function.
const CARD_GRID_CASES = [
  { id: "explain form none", type: "explain", s: { type: "explain", title: "e" }, card: true },
  { id: "explain form cards", type: "explain", s: { type: "explain", title: "e", form: "cards" }, card: true },
  { id: "explain form strip", type: "explain", s: { type: "explain", title: "e", form: "strip" }, card: false },
  { id: "explain form stack", type: "explain", s: { type: "explain", title: "e", form: "stack" }, card: false },
  { id: "compare form none", type: "compare", s: { type: "compare", title: "c", items: [] }, card: true },
  { id: "compare form table", type: "compare", s: { type: "compare", title: "c", form: "table", items: [] }, card: false },
  { id: "summary with a recall card", type: "summary", s: { type: "summary", cards: [{ text: "t", recall: "q" }] }, card: false },
  { id: "summary without recall", type: "summary", s: { type: "summary", cards: [{ text: "t" }] }, card: true },
  { id: "terms", type: "terms", s: { type: "terms", title: "용어", terms: [] }, card: true },
];

for (const { id, type, s, card } of CARD_GRID_CASES) {
  test(`VO-1 C-6 ${id}: cardGrid returns ${card}`, () => {
    const fn = loadKit().sceneTypes[type].cardGrid;
    assert.equal(typeof fn, "function", `${type}.cardGrid is not a function`);
    assert.equal(fn(s, [s]), card);
  });
}

// ---------- VO-2 deck attaches render (6 files, DOM-free) ----------

const BASE_NAMES = [
  "theme, themes, palette, mark, marks, icon, icons, expect, record, lintDeck, math, MOTION_MS, deck",
  "themeTokens, summaryCards, linkTerms, warn",
  "narration, annotate, beforeAfter, facts, chips, badge, callout, swatches, takeaway, chartFrame, inspector, redline, h, fill, contrast",
  "mock",
  "diagram, graphOverlaps, diagramLayout, autoLayout, state, stateSpec",
  "sequence, sequenceLayout",
  "map",
  "sweep, drag, predict, stepper, sim, tween",
  "axisPlot, hbars, lanes, sankey, plot, plotTheme, plane, units, bar",
  "kitBase, lessonId, compare, termsIn, sceneText, termIndex, rectHit, freeSlot, stepValues, goalReach, setGlossary, auditScene, mobile, measure, $, deckTypes",
].flatMap((s) => s.split(", "));

test("VO-2 C-3: every one of the 12 entries has a render function after ltt-deck.js loads", () => {
  const t = loadDeck().sceneTypes;
  const missing = TYPES.filter((type) => !t[type] || typeof t[type].render !== "function");
  assert.deepEqual(missing, [], `entries without render: ${missing.join(", ")}`);
});

test("VO-2 FR-3: LTT.deckTypes is the same object as LTT.sceneTypes", () => {
  const LTT = loadDeck();
  assert.ok(LTT.sceneTypes, "LTT.sceneTypes is missing");
  assert.equal(LTT.deckTypes, LTT.sceneTypes);
});

test("VO-2 FR-11 C-3: public names are the 73 base names plus sceneTypes", () => {
  assert.equal(new Set(BASE_NAMES).size, 73);
  assert.deepEqual(Object.keys(loadDeck()).sort(), [...BASE_NAMES, "sceneTypes"].sort());
});

// ---------- VO-3 load errors (error guessing) ----------

function loadError(fn) {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return undefined;
}

function assertPlainError(err) {
  assert.ok(err !== undefined, "ltt-deck.js loaded without throwing");
  assert.equal(Object.prototype.toString.call(err), "[object Error]", `threw a non-Error value: ${String(err)}`);
  assert.equal(err.name, "Error", `threw ${err.name}: ${err.message}`);
}

test("VO-3 EG-1 E-1 C-13: a deleted keywords entry makes ltt-deck.js throw an Error naming keywords, and LTT.deck stays undefined", () => {
  const context = newContext();
  runFile(context, "vendor/d3.min.js");
  runFile(context, "ltt.js");
  assert.equal(Reflect.deleteProperty(context.LTT.sceneTypes, "keywords"), true, "LTT.sceneTypes.keywords could not be deleted");
  for (const f of ["ltt-parts.js", "ltt-ui.js", "ltt-mock.js"]) runFile(context, f);
  const err = loadError(() => runFile(context, "ltt-deck.js"));
  assertPlainError(err);
  assert.ok(String(err.message).includes("keywords"), `message lacks the type name: ${err.message}`);
  assert.equal(context.LTT.deck, undefined);
});

const E2_MESSAGE = "ltt-deck.js needs ltt.js, ltt-parts.js and ltt-ui.js loaded first";

test("VO-3 EG-2 E-2 C-14: ltt-deck.js without ltt.js throws the existing first-line Error", () => {
  const context = newContext();
  // A browser global may be how the guard looks for LTT; without it a ReferenceError would mask the guard.
  context.window = vm.runInContext("this", context);
  const err = loadError(() => runFile(context, "ltt-deck.js"));
  assertPlainError(err);
  assert.equal(err.message, E2_MESSAGE);
  assert.equal(context.LTT?.deck, undefined);
});

test("VO-3 EG-2 E-2: an ltt.js without LTT.sceneTypes makes ltt-deck.js throw the same first-line Error", () => {
  const context = newContext();
  for (const f of DECK_CHAIN.slice(0, -1)) runFile(context, f);
  assert.equal(Reflect.deleteProperty(context.LTT, "sceneTypes"), true, "LTT.sceneTypes could not be deleted to simulate an old ltt.js");
  const err = loadError(() => runFile(context, "ltt-deck.js"));
  assertPlainError(err);
  assert.equal(err.message, E2_MESSAGE);
  assert.equal(context.LTT.deck, undefined);
});

// ---------- VO-6 auditScene (BVA + decision table) ----------

const M = { type: "explain", layout: "", compact: false, zoom: 1, visualRatio: 0.4, figRatio: 0.8, fill: 0.9, fontSizes: 5, hscroll: 0, overflow: false, panelOverlap: 0, graphOverlaps: 0, goals: [] };
const audit = (LTT, m) => Array.from(LTT.auditScene({ ...M, ...m }), (w) => w.rule);
const AUDIT_TYPES = [...TYPES, "", "foo", "constructor"];

// Per-type decision-table columns; also the measurement variants reused by VO-7 MR-1 and MR-2.
const TYPE_VARIANTS = [
  { id: "isolation", what: "the non-triggering measurement", m: {}, out: () => [] },
  { id: "C-9", what: "visualRatio 0.05 (auditSmallVisual)", m: { visualRatio: 0.05 }, out: (t) => (meta(t, "auditSmallVisual") ? ["small-visual"] : []) },
  { id: "C-9", what: "visualRatio 0.15 (22% hero bar)", m: { visualRatio: 0.15 }, out: (t) => (meta(t, "auditSmallVisual") && meta(t, "auditHero") ? ["small-visual"] : []) },
  { id: "C-10", what: "figRatio 0.2 (auditLooseFigure)", m: { figRatio: 0.2 }, out: (t) => (meta(t, "auditLooseFigure") ? ["loose-figure"] : []) },
  { id: "C-10", what: "fill 0.3 (auditHero)", m: { fill: 0.3 }, out: (t) => (meta(t, "auditHero") ? ["empty-stage"] : []) },
];

for (const type of AUDIT_TYPES) {
  for (const { id, what, m, out } of TYPE_VARIANTS) {
    const expected = out(type);
    test(`VO-6 ${id} ${label(type)}: ${what} gives ${expected.length ? expected.join(", ") : "no warning"}`, () => {
      assert.deepEqual(audit(loadKit(), { ...m, type }), expected);
    });
  }
}

const AUDIT_BOUNDARIES = [
  { id: "C-9 general explain visualRatio 0.0999", m: { type: "explain", visualRatio: 0.0999 }, out: ["small-visual"] },
  { id: "C-9 general explain visualRatio 0.1", m: { type: "explain", visualRatio: 0.1 }, out: [] },
  { id: "C-9 general explain visualRatio 0.1001", m: { type: "explain", visualRatio: 0.1001 }, out: [] },
  { id: "C-9 hero figure visualRatio 0.2199", m: { type: "figure", visualRatio: 0.2199 }, out: ["small-visual"] },
  { id: "C-9 hero figure visualRatio 0.22", m: { type: "figure", visualRatio: 0.22 }, out: [] },
  { id: "C-9 hero figure visualRatio 0.2201", m: { type: "figure", visualRatio: 0.2201 }, out: [] },
  { id: "C-9 hero explain layout full visualRatio 0.2199", m: { type: "explain", layout: "full", visualRatio: 0.2199 }, out: ["small-visual"] },
  { id: "C-9 hero explain layout full visualRatio 0.22", m: { type: "explain", layout: "full", visualRatio: 0.22 }, out: [] },
  { id: "C-9 hero explain layout full visualRatio 0.2201", m: { type: "explain", layout: "full", visualRatio: 0.2201 }, out: [] },
  { id: "C-9 compact figure visualRatio 0.05", m: { type: "figure", compact: true, visualRatio: 0.05 }, out: [] },
  { id: "C-9 compact explain visualRatio 0.05", m: { type: "explain", compact: true, visualRatio: 0.05 }, out: [] },
  { id: "C-10 loose-figure figure figRatio 0.349", m: { type: "figure", figRatio: 0.349 }, out: ["loose-figure"] },
  { id: "C-10 loose-figure figure figRatio 0.35", m: { type: "figure", figRatio: 0.35 }, out: [] },
  { id: "C-10 loose-figure figure figRatio 0.351", m: { type: "figure", figRatio: 0.351 }, out: [] },
  { id: "C-10 loose-figure overview figRatio 0.1", m: { type: "overview", figRatio: 0.1 }, out: [] },
  { id: "C-10 empty-stage figure fill 0.599", m: { type: "figure", fill: 0.599 }, out: ["empty-stage"] },
  { id: "C-10 empty-stage figure fill 0.6", m: { type: "figure", fill: 0.6 }, out: [] },
  { id: "C-10 empty-stage figure fill 0.601", m: { type: "figure", fill: 0.601 }, out: [] },
  { id: "C-10 empty-stage explain layout full fill 0.599", m: { type: "explain", layout: "full", fill: 0.599 }, out: ["empty-stage"] },
  { id: "C-10 empty-stage explain layout full fill 0.6", m: { type: "explain", layout: "full", fill: 0.6 }, out: [] },
  { id: "C-10 empty-stage explain layout full fill 0.601", m: { type: "explain", layout: "full", fill: 0.601 }, out: [] },
  { id: "C-10 empty-stage general explain fill 0.1", m: { type: "explain", fill: 0.1 }, out: [] },
  { id: "C-11 overview without layout, visualRatio 0.15 and fill 0.3", m: { type: "overview", layout: "", visualRatio: 0.15, fill: 0.3 }, out: [] },
];

for (const { id, m, out } of AUDIT_BOUNDARIES) {
  test(`VO-6 ${id}: ${out.length ? out.join(", ") : "no warning"}`, () => {
    assert.deepEqual(audit(loadKit(), m), out);
  });
}

// ---------- VO-7 runtime-added partial entry (C-15) ----------

const KW = { type: "keywords", terms: [] };
const FIG = { type: "figure", title: "t", caption: "c", figure: "그림" };
const ST = { type: "statement", title: "s" };
const pairs = (LTT, spec) => Array.from(LTT.lintDeck(spec), (w) => [w.scene, w.rule]);

function withTimeline() {
  const LTT = loadKit();
  LTT.sceneTypes.timeline = { needsReadingGuide: true, titleOptional: true, cardGrid: () => true, auditSmallVisual: false };
  return LTT;
}

test("VO-7 C-15 isolation: a timeline scene with title and narration gives no warning", () => {
  assert.deepEqual(pairs(withTimeline(), { theme: "paper", scenes: [FIG, { type: "timeline", title: "x", narration: "n" }, KW] }), []);
});

test("VO-7 C-15 needsReadingGuide: a timeline scene without a guide warns no-reading-guide", () => {
  assert.deepEqual(pairs(withTimeline(), { theme: "paper", scenes: [FIG, { type: "timeline", title: "x" }, KW] }), [[2, "no-reading-guide"]]);
});

test("VO-7 C-15 titleOptional: a timeline scene without a title gives no no-title", () => {
  assert.deepEqual(pairs(withTimeline(), { theme: "paper", scenes: [FIG, { type: "timeline", narration: "n" }, KW] }), []);
});

test("VO-7 C-15 cardGrid: three timeline scenes in a row count as a card run", () => {
  const tl = { type: "timeline", title: "x", narration: "n" };
  assert.deepEqual(pairs(withTimeline(), { theme: "paper", scenes: [FIG, ST, ST, tl, tl, tl, KW] }), [[6, "card-monotony"]]);
});

test("VO-7 C-15 signature default: a timeline-only deck warns no-signature", () => {
  assert.deepEqual(pairs(withTimeline(), { theme: "paper", scenes: [{ type: "timeline", title: "x", narration: "n" }, KW] }), [[0, "no-signature"]]);
});

test("VO-7 C-15 auditSmallVisual: timeline visualRatio 0.05 is not judged", () => {
  assert.deepEqual(audit(withTimeline(), { type: "timeline", visualRatio: 0.05 }), []);
});

test("VO-7 C-15 auditHero default: timeline fill 0.3 gives no empty-stage", () => {
  assert.deepEqual(audit(withTimeline(), { type: "timeline", fill: 0.3 }), []);
});

test("VO-7 C-15 auditLooseFigure default: timeline figRatio 0.2 gives no loose-figure", () => {
  assert.deepEqual(audit(withTimeline(), { type: "timeline", figRatio: 0.2 }), []);
});

// ---------- VO-7 C-17 empty and cardGrid-less runtime entries ----------

const midDeck = (...middle) => ({ theme: "paper", scenes: [FIG, ...middle, KW] });

function withEntries(entries) {
  const LTT = loadKit();
  Object.assign(LTT.sceneTypes, entries);
  return LTT;
}
const withFooBar = () => withEntries({ foo: {}, bar: { needsReadingGuide: true } });

const C17_LINT = [
  { id: "foo without title warns no-title", spec: midDeck({ type: "foo" }), out: [[2, "no-title"]] },
  { id: "bar with a guide but no title warns no-title", spec: midDeck({ type: "bar", narration: "n" }), out: [[2, "no-title"]] },
  { id: "foo without a guide needs none", spec: midDeck({ type: "foo", title: "x" }), out: [] },
  { id: "bar without a guide warns no-reading-guide", spec: midDeck({ type: "bar", title: "x" }), out: [[2, "no-reading-guide"]] },
  { id: "three foo scenes in a row are not a card run", spec: midDeck(ST, ST, { type: "foo", title: "x" }, { type: "foo", title: "x" }, { type: "foo", title: "x" }), out: [] },
  { id: "three bar scenes in a row are not a card run", spec: midDeck(ST, ST, ...Array.from({ length: 3 }, () => ({ type: "bar", title: "x", narration: "n" }))), out: [] },
];

for (const { id, spec, out } of C17_LINT) {
  test(`VO-7 C-17 ${id}`, () => {
    assert.deepEqual(pairs(withFooBar(), spec), out);
  });
}

for (const type of ["foo", "bar"]) {
  test(`VO-7 C-17 ${type}: visualRatio 0.05 warns small-visual (default auditSmallVisual true)`, () => {
    assert.deepEqual(audit(withFooBar(), { type, visualRatio: 0.05 }), ["small-visual"]);
  });
  test(`VO-7 C-17 ${type}: visualRatio 0.15 passes (10% non-hero bar)`, () => {
    assert.deepEqual(audit(withFooBar(), { type, visualRatio: 0.15 }), []);
  });
}

// ---------- VO-7 C-18 MR-1 (auditScene part; the lintDeck part is in tests/lint-rules.test.mjs) ----------

const AUDIT_INPUTS = [
  ...AUDIT_TYPES.flatMap((type) => TYPE_VARIANTS.map((v) => ({ id: `${v.id} ${label(type)} ${v.what}`, m: { ...v.m, type } }))),
  ...AUDIT_BOUNDARIES.map(({ id, m }) => ({ id, m })),
];
const auditJson = (LTT, m) => JSON.stringify(LTT.auditScene({ ...M, ...m }));

test("VO-7 C-18 MR-1: every VO-6 auditScene input with type foo gives the same output before and after sceneTypes.foo = {}", () => {
  const inputs = AUDIT_INPUTS.filter(({ m }) => m.type === "foo");
  assert.ok(inputs.length >= TYPE_VARIANTS.length, `only ${inputs.length} foo inputs collected`);
  const diff = inputs.filter(({ m }) => auditJson(loadKit(), m) !== auditJson(withEntries({ foo: {} }), m)).map(({ id }) => id);
  assert.deepEqual(diff, [], `outputs differ for: ${diff.join("; ")}`);
});

// ---------- VO-7 C-19 MR-2 copy of a built-in entry's 13 meta fields ----------

function withCopyOf(type) {
  const LTT = loadKit();
  const copy = {};
  for (const field of META_FIELDS) copy[field] = LTT.sceneTypes[type][field];
  LTT.sceneTypes.copy = copy;
  return LTT;
}

const MEASURE_VARIANTS = [...TYPE_VARIANTS.map((v) => ({ id: `${v.id} ${v.what}`, m: v.m })), ...AUDIT_BOUNDARIES.map(({ id, m }) => ({ id, m }))]
  .map(({ id, m }) => {
    const { type, ...rest } = m;
    return { id, m: rest };
  });

for (const type of TYPES) {
  test(`VO-7 C-19 MR-2 audit ${type}: type copy matches type ${type} on all ${MEASURE_VARIANTS.length} VO-6 measurement variants`, () => {
    const LTT = withCopyOf(type);
    const diff = MEASURE_VARIANTS.filter(({ m }) => auditJson(LTT, { ...m, type: "copy" }) !== auditJson(LTT, { ...m, type })).map(({ id }) => id);
    assert.deepEqual(diff, [], `outputs differ for: ${diff.join("; ")}`);
  });
}

const MR2_LINT_TYPES = ["hook", "explain", "terms", "compare", "figure", "statement", "contrast", "predict", "map-related"];
const mr2Deck = (x, form) => ({
  theme: "paper",
  scenes: [{ type: "figure", title: "t", caption: "c", figure: "그림" }, ...Array.from({ length: 3 }, () => (form ? { type: x, form } : { type: x })), { type: "keywords", terms: [] }],
});

for (const type of MR2_LINT_TYPES) {
  for (const form of [undefined, "table"]) {
    test(`VO-7 C-19 MR-2 lint ${type}${form ? " form table" : " no form"}: three copy scenes lint like three ${type} scenes`, () => {
      const LTT = withCopyOf(type);
      assert.equal(JSON.stringify(LTT.lintDeck(mr2Deck("copy", form))), JSON.stringify(LTT.lintDeck(mr2Deck(type, form))));
    });
  }
}
