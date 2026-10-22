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
  needsReadingGuide: false,
  titleOptional: false,
  bookend: false,
  signature: false,
};
const NON_DEFAULT = {
  head: ["hook", "statement"],
  autoSplit: ["map-related", "hook", "keywords", "summary", "terms", "contrast", "predict", "figure", "overview", "statement"],
  fullByDefault: ["figure", "overview"],
  pointsOnMock: ["figure", "overview"],
  needsReadingGuide: ["compare", "contrast", "figure", "overview"],
  titleOptional: ["hook", "keywords", "summary"],
  bookend: ["hook", "keywords"],
  signature: ["figure", "contrast"],
};
const CARD_GRID_TYPES = ["explain", "compare", "summary", "terms"];
const META_FIELDS = [...Object.keys(BOOL_DEFAULTS), "cardGrid"];
const meta = (type, field) => (NON_DEFAULT[field].includes(type) ? !BOOL_DEFAULTS[field] : BOOL_DEFAULTS[field]);
const label = (type) => (type === "" ? '""' : type);

// ---------- VO-1 table values (ltt.js only) ----------

test("VO-1 C-2: oracle covers 9 meta fields (sumVisualAreas and the three audit* fields removed, spec 76b739afacf5b868 FR-14)", () => {
  assert.equal(META_FIELDS.length, 9);
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
    for (const gone of ["sumVisualAreas", "auditHero", "auditSmallVisual", "auditLooseFigure"]) if (Object.prototype.hasOwnProperty.call(entry, gone)) wrong.push(`${gone}: removed field still present`);
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
  "theme, themes, palette, mark, marks, icon, icons, expect, record, lintDeck, math, MOTION_MS, deck, clock",
  "themeTokens, summaryCards, linkTerms, warn",
  "narration, annotate, beforeAfter, facts, chips, badge, callout, swatches, takeaway, chartFrame, inspector, redline, h, fill, contrast",
  "mock",
  "diagram, graphOverlaps, diagramLayout, autoLayout, state, stateSpec",
  "sequence, sequenceLayout",
  "map",
  "sweep, drag, predict, stepper, sim, tween",
  "axisPlot, hbars, lanes, sankey, plot, plotTheme, plane, units, bar",
  "kitBase, lessonId, compare, termsIn, sceneText, termIndex, rectHit, freeSlot, stepValues, goalReach, setGlossary, mobile, measure, $, deckTypes",
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

// Spec 74cb05d7da21907e v3 FR-3 adds placement (defined by ltt-deck.js) to the public set.
// Spec 80a1b2f18f50b1df FR-15 adds check, recall, termIssues, goalIssues, deckIssues and checkSource.
test("VO-2 FR-11 C-3 (74cb05d7da21907e FR-3): public names are the 73 base names (auditScene out, clock in) plus sceneTypes, placement and the 6 check names", () => {
  assert.equal(new Set(BASE_NAMES).size, 73);
  const checkNames = ["check", "recall", "termIssues", "goalIssues", "deckIssues", "checkSource"];
  // Spec 753ff3c539424409 v3 Signatures: plus usesTerm and isAdvice.
  assert.deepEqual(Object.keys(loadDeck()).sort(), [...BASE_NAMES, "sceneTypes", "placement", ...checkNames, "usesTerm", "isAdvice"].sort());
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

// ---------- VO-7 runtime-added partial entry (C-15) ----------

// Spec 753ff3c539424409 FR-6: the last keywords scene carries a non-empty next, else lint keywords-no-next fires.
const KW = { type: "keywords", terms: [], next: [{ term: "다음", why: "이유" }] };
const FIG = { type: "figure", title: "t", caption: "c", figure: "그림" };
const ST = { type: "statement", title: "s" };
const pairs = (LTT, spec) => Array.from(LTT.lintDeck(spec), (w) => [w.scene, w.rule]);

function withTimeline() {
  const LTT = loadKit();
  LTT.sceneTypes.timeline = { needsReadingGuide: true, titleOptional: true, cardGrid: () => true };
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

// ---------- VO-7 C-19 MR-2 copy of a built-in entry's 9 meta fields ----------

function withCopyOf(type) {
  const LTT = loadKit();
  const copy = {};
  for (const field of META_FIELDS) copy[field] = LTT.sceneTypes[type][field];
  LTT.sceneTypes.copy = copy;
  return LTT;
}

const MR2_LINT_TYPES = ["hook", "explain", "terms", "compare", "figure", "statement", "contrast", "predict", "map-related"];
// Spec 753ff3c539424409 FR-4/FR-6: a predict scene carries valid choices and answer (so predict-choices stays quiet for it) and
// the keywords scene carries next (keywords-no-next). The copy keeps the base type's other lint findings by design.
const mr2Deck = (x, form, base = x) => ({
  theme: "paper",
  scenes: [{ type: "figure", title: "t", caption: "c", figure: "그림" }, ...Array.from({ length: 3 }, () => ({ type: x, ...(form ? { form } : {}), ...(base === "predict" ? { choices: [{ id: "a", text: "가" }, { id: "b", text: "나" }], answer: "a" } : {}) })), { type: "keywords", terms: [], next: [{ term: "다음", why: "이유" }] }],
});

for (const type of MR2_LINT_TYPES) {
  for (const form of [undefined, "table"]) {
    test(`VO-7 C-19 MR-2 lint ${type}${form ? " form table" : " no form"}: three copy scenes lint like three ${type} scenes`, () => {
      const LTT = withCopyOf(type);
      assert.equal(JSON.stringify(LTT.lintDeck(mr2Deck("copy", form, type))), JSON.stringify(LTT.lintDeck(mr2Deck(type, form, type))));
    });
  }
}
// Spec 76b739afacf5b868 FR-14: the deck audit judge is gone; no helper under the old name remains on the kit.
test("76b739afacf5b868 FR-14: LTT.auditScene is undefined", () => {
  assert.equal(loadKit().auditScene, undefined);
});
