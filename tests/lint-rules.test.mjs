import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadKit() {
  const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/ltt.js", import.meta.url), "utf8"), context);
  return context.LTT;
}

const lint = (spec) => Array.from(loadKit().lintDeck(spec), (w) => [w.scene, w.rule]);

// Clean building blocks, each checked by hand against lint rules R1–R16 of the spec.
// FIG: counted, not a card, signature, guide = caption. KW: bookend, last. ST: counted, not a card.
const THEME = "paper";
const KW = () => ({ type: "keywords", terms: [] });
const FIG = () => ({ type: "figure", title: "t", caption: "c", figure: "그림" });
const ST = () => ({ type: "statement", title: "s" });
const HOOK = () => ({ type: "hook", text: "h" });
const EX = (o = {}) => ({ type: "explain", title: "e", steps: [], ...o });
const STRIP = (o = {}) => EX({ form: "strip", ...o });
const SUM_RECALL = () => ({ type: "summary", cards: [{ text: "t", recall: "q" }] });
const SUM_NO_RECALL = () => ({ type: "summary", cards: [{ text: "t" }] });
const OV = (o = {}) => ({ type: "overview", title: "o", figure: "<svg></svg>", caption: "c", ...o });
const TERMS = (terms) => ({ type: "terms", title: "용어", terms });

const deck = (scenes, extra = {}) => ({ theme: THEME, ...extra, scenes });
const mid = (...middle) => deck([FIG(), ...middle, KW()]);

// ---------- isolation ----------

test("VO-4 isolation: the clean base deck gives no warning", () => {
  assert.deepEqual(lint(mid()), []);
});

// ---------- VO-4 per-rule partitions (17 rule names x {fires, does not fire}) ----------

const CASES = [
  // unknown-term (R1, R2)
  { id: "unknown-term R1 fires: explain marks a key missing from the glossary", spec: mid(STRIP({ title: "{{없는말}}" })), out: [[2, "unknown-term"]] },
  { id: "unknown-term R1 quiet: the marked key is in spec.glossary", spec: deck([FIG(), STRIP({ title: "{{적중}}" }), KW()], { glossary: { 적중: "x" } }), out: [] },
  { id: "unknown-term R1 quiet: a terms-scene key counts as a glossary key", spec: mid(TERMS([{ key: "적중", plain: "캐시에 있음", visual: "<svg></svg>" }]), STRIP({ title: "{{적중}}" })), out: [] },
  { id: "unknown-term R1 quiet: R1 skips marks on a terms scene", spec: mid({ type: "terms", title: "{{없는말}}", terms: [] }), out: [] },
  { id: "unknown-term R2 fires: a terms entry without plain", spec: mid(TERMS([{ key: "적중", visual: "<svg></svg>" }])), out: [[2, "unknown-term"]] },
  { id: "unknown-term R2 quiet: a terms entry with plain and visual", spec: mid(TERMS([{ key: "적중", plain: "캐시에 있음", visual: "<svg></svg>" }])), out: [] },
  // term-no-visual (R2)
  { id: "term-no-visual fires: visual undefined", spec: mid(TERMS([{ key: "적중", plain: "캐시에 있음" }])), out: [[2, "term-no-visual"]] },
  { id: "term-no-visual quiet: visual false", spec: mid(TERMS([{ key: "적중", plain: "캐시에 있음", visual: false }])), out: [] },
  { id: "term-no-visual quiet: visual string", spec: mid(TERMS([{ key: "적중", plain: "캐시에 있음", visual: "<svg></svg>" }])), out: [] },
  // summary-no-recall (R3)
  { id: "summary-no-recall fires: a summary card without recall", spec: mid(SUM_NO_RECALL(), OV()), out: [[2, "summary-no-recall"]] },
  { id: "summary-no-recall quiet: every summary card has recall", spec: mid(SUM_RECALL(), OV()), out: [] },
  // overview-no-visual (R4)
  { id: "overview-no-visual fires: overview without figure", spec: mid(SUM_RECALL(), OV({ figure: undefined })), out: [[3, "overview-no-visual"]] },
  { id: "overview-no-visual quiet: overview with figure", spec: mid(SUM_RECALL(), OV()), out: [] },
  // used-before-defined (R5)
  { id: "used-before-defined fires: the bare key appears before its first mark", spec: deck([FIG(), { type: "hook", text: "TTL을 늘리면" }, STRIP({ title: "{{TTL}}의 뜻" }), KW()], { glossary: { TTL: "유효 시간" } }), out: [[2, "used-before-defined"]] },
  { id: "used-before-defined quiet: the key is marked where it first appears", spec: deck([FIG(), { type: "hook", text: "{{TTL}}을 늘리면" }, STRIP({ title: "{{TTL}}의 뜻" }), KW()], { glossary: { TTL: "유효 시간" } }), out: [] },
  // predict-new-term (R6)
  { id: "predict-new-term fires: the predict question first marks a glossary key", spec: deck([FIG(), { type: "predict", title: "몇 건?", question: "{{적중률}}은?", choices: [] }, KW()], { glossary: { 적중률: "x" } }), out: [[2, "predict-new-term"]] },
  { id: "predict-new-term quiet: the key was marked in an earlier scene", spec: deck([FIG(), STRIP({ title: "{{적중률}}" }), { type: "predict", title: "몇 건?", question: "{{적중률}}은?", choices: [] }, KW()], { glossary: { 적중률: "x" } }), out: [] },
  // no-reading-guide (R7): needsReadingGuide 4 types + statement + untyped with/without mount
  { id: "no-reading-guide fires: compare without a guide", spec: mid({ type: "compare", form: "table", title: "c", items: [] }), out: [[2, "no-reading-guide"]] },
  { id: "no-reading-guide fires: contrast without a guide", spec: mid({ type: "contrast", title: "c" }), out: [[2, "no-reading-guide"]] },
  { id: "no-reading-guide fires: figure without a guide", spec: mid({ type: "figure", title: "f", figure: "그림" }), out: [[2, "no-reading-guide"]] },
  { id: "no-reading-guide fires: overview without a guide", spec: mid(SUM_RECALL(), OV({ caption: undefined })), out: [[3, "no-reading-guide"]] },
  { id: "no-reading-guide fires: untyped scene with mount (C-7)", spec: mid({ title: "m", mount() {} }), out: [[2, "no-reading-guide"]] },
  { id: "no-reading-guide quiet: compare with narration", spec: mid({ type: "compare", form: "table", title: "c", narration: "n", items: [] }), out: [] },
  { id: "no-reading-guide quiet: statement without a guide", spec: mid(ST()), out: [] },
  { id: "no-reading-guide quiet: untyped scene without mount (C-7)", spec: mid({ title: "m" }), out: [] },
  // no-title (R8): titleOptional 3 types + explain + "foo" + untyped
  { id: "no-title quiet: hook without title", spec: mid(HOOK()), out: [] },
  { id: "no-title quiet: keywords without title (the closing scene)", spec: mid(), out: [] },
  { id: "no-title quiet: summary without title", spec: mid(SUM_RECALL(), OV()), out: [] },
  { id: "no-title quiet: explain with title", spec: mid(STRIP()), out: [] },
  { id: "no-title fires: explain without title", spec: mid({ type: "explain", form: "strip", steps: [] }), out: [[2, "no-title"]] },
  { id: "no-title fires: unknown type foo without title (C-8)", spec: mid({ type: "foo" }), out: [[2, "no-title"]] },
  { id: "no-title fires: untyped scene without title", spec: mid({ narration: "n" }), out: [[2, "no-title"]] },
  // filler-content (R9)
  { id: "filler-content fires: filler words, first match only", spec: mid(STRIP({ title: "항목 1과 샘플 텍스트" })), out: [[2, "filler-content"]] },
  { id: "filler-content quiet: the UI word placeholder", spec: mid(STRIP({ title: "placeholder 글자색은 옅다" })), out: [] },
  // no-signature (R11): figure, contrast, layout full, untyped mount, none
  { id: "no-signature quiet: figure", spec: deck([FIG(), KW()]), out: [] },
  { id: "no-signature quiet: contrast", spec: deck([{ type: "contrast", title: "c", narration: "n" }, KW()]), out: [] },
  { id: "no-signature quiet: layout full", spec: deck([STRIP({ layout: "full" }), KW()]), out: [] },
  { id: "no-signature quiet: untyped scene with mount (C-7)", spec: deck([{ title: "m", narration: "n", mount() {} }, KW()]), out: [] },
  { id: "no-signature fires: no signature scene", spec: deck([STRIP(), KW()]), out: [[0, "no-signature"]] },
  { id: "no-signature fires: untyped scene without mount (C-7)", spec: deck([{ title: "m" }, KW()]), out: [[0, "no-signature"]] },
  { id: "no-signature fires: unknown type foo is not a signature (C-8)", spec: deck([{ type: "foo", title: "f" }, KW()]), out: [[0, "no-signature"]] },
  { id: "no-signature quiet: a deck without scenes (only keywords-last)", spec: deck([]), out: [[0, "keywords-last"]] },
  // no-theme / unknown-theme (R12)
  { id: "no-theme fires: theme missing", spec: { scenes: [FIG(), KW()] }, out: [[0, "no-theme"]] },
  { id: "no-theme quiet: theme given", spec: mid(), out: [] },
  { id: "unknown-theme fires: theme nope", spec: { theme: "nope", scenes: [FIG(), KW()] }, out: [[0, "unknown-theme"]] },
  // keywords-last (R13)
  { id: "keywords-last fires: the last scene is not keywords", spec: deck([FIG()]), out: [[0, "keywords-last"]] },
  { id: "keywords-last quiet: keywords last", spec: mid(), out: [] },
  // overview-missing (R14)
  { id: "overview-missing fires: summary without overview", spec: mid(SUM_RECALL()), out: [[0, "overview-missing"]] },
  { id: "overview-missing quiet: summary followed by overview", spec: mid(SUM_RECALL(), OV()), out: [] },
  // overview-order (R15)
  { id: "overview-order fires: overview before the last summary", spec: mid(OV(), SUM_RECALL()), out: [[2, "overview-order"]] },
  { id: "overview-order fires: overview after summary but not second to last", spec: mid(SUM_RECALL(), OV(), ST()), out: [[3, "overview-order"]] },
  { id: "overview-order quiet: overview right before keywords after the summary", spec: mid(SUM_RECALL(), OV()), out: [] },
  // unused-term (R16)
  { id: "unused-term fires: a glossary key never used", spec: deck([FIG(), KW()], { glossary: { 미사용: "x" } }), out: [[0, "unused-term"]] },
  { id: "unused-term fires: once per unused key", spec: deck([FIG(), KW()], { glossary: { 미사용: "x", 안씀: "y" } }), out: [[0, "unused-term"], [0, "unused-term"]] },
  { id: "unused-term quiet: the key is marked", spec: deck([{ ...FIG(), caption: "{{적중}}" }, KW()], { glossary: { 적중: "x" } }), out: [] },
];

for (const { id, spec, out } of CASES) {
  test(`VO-4 ${id}`, () => {
    assert.deepEqual(lint(spec), out);
  });
}

test("VO-4 unknown-theme quiet: every LTT.themes name is accepted", () => {
  const names = Array.from(loadKit().themes, (t) => t.name);
  assert.ok(names.length > 0, "LTT.themes is empty");
  const bad = names.filter((name) => lint({ theme: name, scenes: [FIG(), KW()] }).length > 0);
  assert.deepEqual(bad, [], `themes that warn: ${bad.join(", ")}`);
});

// ---------- VO-4 C-8 prototype name ----------

const PROTO_CASES = [
  { id: "no-title fires", spec: mid({ type: "constructor" }), out: [[2, "no-title"]] },
  { id: "no reading guide needed", spec: mid({ type: "constructor", title: "x" }), out: [] },
  { id: "not a card grid", spec: mid(ST(), ST(), { type: "constructor", title: "x" }, { type: "constructor", title: "x" }, { type: "constructor", title: "x" }), out: [] },
  { id: "not a signature", spec: deck([{ type: "constructor", title: "x" }, KW()]), out: [[0, "no-signature"]] },
  { id: "unknown type foo is not a card grid", spec: mid(ST(), ST(), { type: "foo", title: "x" }, { type: "foo", title: "x" }, { type: "foo", title: "x" }), out: [] },
];

for (const { id, spec, out } of PROTO_CASES) {
  test(`VO-4 C-8 type constructor/foo: ${id}`, () => {
    assert.deepEqual(lint(spec), out);
  });
}

// ---------- VO-4 card-monotony C-4 / C-5 (3-value BVA) ----------

const CARD_CASES = [
  // C-4 runs; two statement fillers keep cards/counted <= 0.5 so only run warnings can appear.
  { id: "C-4 run 2: no warning", scenes: [FIG(), ST(), EX(), EX(), KW()], out: [] },
  { id: "C-4 run 3: warning on the third card", scenes: [FIG(), ST(), ST(), EX(), EX(), EX(), KW()], out: [[6, "card-monotony"]] },
  { id: "C-4 run 4: warning on the third card only", scenes: [FIG(), ST(), ST(), ST(), EX(), EX(), EX(), EX(), KW()], out: [[7, "card-monotony"]] },
  { id: "C-4 run 3, non-card, run 3: one warning per run", scenes: [FIG(), ST(), ST(), ST(), ST(), EX(), EX(), EX(), ST(), EX(), EX(), EX(), KW()], out: [[8, "card-monotony"], [12, "card-monotony"]] },
  // C-5 ratio
  { id: "C-5 2 of 4 counted are cards (0.5): no deck warning", scenes: [FIG(), EX(), ST(), EX(), KW()], out: [] },
  { id: "C-5 3 of 4 counted are cards: deck warning", scenes: [EX(), EX(), FIG(), EX(), KW()], out: [[0, "card-monotony"]] },
  { id: "C-5 3 of 3 counted are cards: run warning only", scenes: [EX(), EX(), EX({ layout: "full" }), KW()], out: [[3, "card-monotony"]] },
  { id: "C-5 bookend: two hooks do not enter the denominator (3 of 4)", scenes: [HOOK(), HOOK(), EX(), EX(), FIG(), EX(), KW()], out: [[0, "card-monotony"]] },
  { id: "C-5 bookend: a hook does not lift 3 counted scenes to 4", scenes: [HOOK(), EX(), EX(), EX({ layout: "full" }), KW()], out: [[4, "card-monotony"]] },
  { id: "C-5 bookend: a hook inside a run does not break it", scenes: [FIG(), ST(), ST(), EX(), EX(), HOOK(), EX(), KW()], out: [[7, "card-monotony"]] },
  { id: "C-5 bookend: a keywords scene inside a run does not break it", scenes: [FIG(), ST(), ST(), EX(), EX(), KW(), EX(), KW()], out: [[7, "card-monotony"]] },
];

for (const { id, scenes, out } of CARD_CASES) {
  test(`VO-4 card-monotony ${id}`, () => {
    assert.deepEqual(lint(deck(scenes)), out);
  });
}

// ---------- VO-4 card-monotony C-6 cardGrid variants through lint ----------

const GRID_VARIANTS = [
  { id: "explain form none", x: () => EX(), card: true },
  { id: "explain form cards", x: () => EX({ form: "cards" }), card: true },
  { id: "explain form strip", x: () => EX({ form: "strip" }), card: false },
  { id: "explain form stack", x: () => EX({ form: "stack" }), card: false },
  { id: "compare form none", x: () => ({ type: "compare", title: "c", narration: "n", items: [] }), card: true },
  { id: "compare form table", x: () => ({ type: "compare", form: "table", title: "c", narration: "n", items: [] }), card: false },
  { id: "terms", x: () => TERMS([]), card: true },
];

for (const { id, x, card } of GRID_VARIANTS) {
  test(`VO-4 C-6 ${id}: three in a row ${card ? "warn" : "do not warn"} card-monotony`, () => {
    assert.deepEqual(lint(deck([FIG(), ST(), ST(), x(), x(), x(), KW()])), card ? [[6, "card-monotony"]] : []);
  });
}

test("VO-4 C-6 summary with a recall card: three in a row are not a card run", () => {
  assert.deepEqual(lint(deck([FIG(), ST(), ST(), SUM_RECALL(), SUM_RECALL(), SUM_RECALL(), OV(), KW()])), []);
});

test("VO-4 C-6 summary without recall: three in a row are a card run", () => {
  assert.deepEqual(lint(deck([FIG(), ST(), ST(), SUM_NO_RECALL(), SUM_NO_RECALL(), SUM_NO_RECALL(), OV(), KW()])), [
    [4, "summary-no-recall"],
    [5, "summary-no-recall"],
    [6, "summary-no-recall"],
    [6, "card-monotony"],
  ]);
});

// Summary scenes without own cards take their cards from the deck's takeaways, so cardGrid depends on scenes.
const SUM_FROM_DECK = () => ({ type: "summary" });

test("VO-4 summary cardGrid reads scenes: three card-less summaries after a takeaway without recall are a card run", () => {
  const scenes = [FIG(), ST(), STRIP({ takeaway: "핵심" }), SUM_FROM_DECK(), SUM_FROM_DECK(), SUM_FROM_DECK(), OV(), KW()];
  assert.deepEqual(lint(deck(scenes)), [
    [4, "summary-no-recall"],
    [5, "summary-no-recall"],
    [6, "summary-no-recall"],
    [6, "card-monotony"],
  ]);
});

test("VO-4 summary cardGrid reads scenes: the same deck with recall on the takeaway is not a card run", () => {
  const scenes = [FIG(), ST(), STRIP({ takeaway: "핵심", recall: "q" }), SUM_FROM_DECK(), SUM_FROM_DECK(), SUM_FROM_DECK(), OV(), KW()];
  assert.deepEqual(lint(deck(scenes)), []);
});

// ---------- VO-7 C-18 MR-1 (lintDeck part; the auditScene part is in tests/scene-types.test.mjs) ----------

const LINT_INPUTS = [
  ...CASES.map(({ id, spec }) => ({ id, spec })),
  ...PROTO_CASES.map(({ id, spec }) => ({ id: `C-8 ${id}`, spec })),
  ...CARD_CASES.map(({ id, scenes }) => ({ id, spec: deck(scenes) })),
  ...GRID_VARIANTS.map(({ id, x }) => ({ id, spec: deck([FIG(), ST(), ST(), x(), x(), x(), KW()]) })),
];
const lintJson = (LTT, spec) => JSON.stringify(LTT.lintDeck(spec));

test("VO-7 C-18 MR-1: every VO-4 lintDeck input with a foo scene gives the same output before and after sceneTypes.foo = {}", () => {
  const inputs = LINT_INPUTS.filter(({ spec }) => spec.scenes.some((s) => s.type === "foo"));
  assert.ok(inputs.length >= 3, `only ${inputs.length} foo inputs collected`);
  const diff = inputs.filter(({ spec }) => {
    const withFoo = loadKit();
    withFoo.sceneTypes.foo = {};
    return lintJson(loadKit(), spec) !== lintJson(withFoo, spec);
  }).map(({ id }) => id);
  assert.deepEqual(diff, [], `outputs differ for: ${diff.join("; ")}`);
});

// ---------- VO-5 output order (scenario testing) ----------

test("VO-5 C-12: scene order, then R1..R9 inside a scene, then deck R10..R16", () => {
  const spec = {
    glossary: { TTL: "유효 시간" },
    scenes: [
      { type: "compare", form: "table", items: [] },
      { type: "explain", form: "strip", title: "{{없는말}}과 TTL TODO", steps: [] },
    ],
  };
  assert.deepEqual(lint(spec), [
    [1, "no-reading-guide"],
    [1, "no-title"],
    [2, "unknown-term"],
    [2, "used-before-defined"],
    [2, "filler-content"],
    [0, "no-signature"],
    [0, "no-theme"],
    [0, "keywords-last"],
    [0, "unused-term"],
  ]);
});

test("VO-5 C-12 R2: terms entries are checked one by one (unknown-term, term-no-visual, unknown-term)", () => {
  const spec = mid(TERMS([{ key: "가" }, { key: "나", visual: "<svg></svg>" }]));
  assert.deepEqual(lint(spec), [
    [2, "unknown-term"],
    [2, "term-no-visual"],
    [2, "unknown-term"],
  ]);
});

// ---------- spec 84c07bf1dc6566cb v1: icon-not-string ----------

const lintFull = (spec) => Array.from(loadKit().lintDeck(spec), (w) => ({ scene: w.scene, rule: w.rule, msg: w.msg }));
const iconWarnings = (spec) => lintFull(spec).filter((w) => w.rule === "icon-not-string");
const FN = () => "x";

const ICON_FIELDS = [
  { id: "art", path: "art", scene: (v) => ({ type: "hook", text: "h", art: v }) },
  { id: "steps", path: "steps[0].icon", scene: (v) => EX({ steps: [{ title: "s", icon: v }] }) },
  { id: "terms", path: "terms[0].icon", scene: (v) => TERMS([{ key: "k", plain: "p", visual: false, icon: v }]) },
];
// kind is the independent oracle from FR-4/FR-5: truthy non-strings warn, naming array or typeof.
const VALUE_KINDS = [
  { id: "V1", label: "icon name string", v: "rocket", kind: null },
  { id: "V2", label: "HTML string", v: "<svg></svg>", kind: null },
  { id: "V3", label: "function", v: FN, kind: "function" },
  { id: "V4", label: "plain object", v: {}, kind: "object" },
  { id: "V5", label: "array", v: [1], kind: "array" },
  { id: "V6", label: "non-zero number", v: 3, kind: "number" },
  { id: "V7", label: "true", v: true, kind: "boolean" },
  { id: "V8", label: "undefined", v: undefined, kind: null },
  { id: "V9", label: "null", v: null, kind: null },
  { id: "V10", label: "empty string", v: "", kind: null },
  { id: "V11", label: "0", v: 0, kind: null },
  { id: "V12", label: "false", v: false, kind: null },
];

for (const f of ICON_FIELDS) {
  for (const k of VALUE_KINDS) {
    const expected = k.v && typeof k.v !== "string" ? 1 : 0;
    test(`84c0 VO-1 DT-${f.id}-${k.id}: ${f.path} = ${k.label} gives ${expected} icon-not-string`, () => {
      const got = iconWarnings(deck([FIG(), f.scene(k.v), KW()]));
      assert.equal(got.length, expected, JSON.stringify(got));
      if (expected) {
        assert.equal(got[0].scene, 2);
        assert.ok(got[0].msg.includes(f.path), `msg lacks ${f.path}: ${got[0].msg}`);
        assert.ok(got[0].msg.includes(k.kind), `msg lacks ${k.kind}: ${got[0].msg}`);
      }
    });
  }
}

const EP_FIELDS = { art: FN, steps: [{ icon: FN }], terms: [{ icon: FN }] };
const EP_CASES = [
  { id: "EP-1 figure", scene: { ...FIG(), ...EP_FIELDS } },
  { id: "EP-2 statement", scene: { ...ST(), ...EP_FIELDS } },
  { id: "EP-3 predict", scene: { type: "predict", title: "p", question: "q", choices: [], ...EP_FIELDS } },
  { id: "EP-4 compare", scene: { type: "compare", form: "table", title: "c", narration: "n", items: [], ...EP_FIELDS } },
  { id: "EP-5 untyped scene with mount", scene: { title: "m", narration: "n", mount() {}, ...EP_FIELDS } },
  { id: "EP-6 hook icon", scene: { ...HOOK(), icon: FN } },
];

for (const { id, scene } of EP_CASES) {
  test(`84c0 VO-2 ${id}: function values outside group A give no icon-not-string`, () => {
    assert.deepEqual(iconWarnings(deck([FIG(), scene, KW()])), []);
  });
}

const term = (icon) => ({ key: "k", plain: "p", visual: false, ...(icon === undefined ? {} : { icon }) });
const BV_CASES = [
  { id: "BV-0 steps", scene: EX({ steps: [{ icon: "a" }, {}, { icon: "b" }] }), paths: [] },
  { id: "BV-1 steps (first)", scene: EX({ steps: [{ icon: FN }, { icon: "a" }, {}] }), paths: ["steps[0].icon"] },
  { id: "BV-2 steps (first and last)", scene: EX({ steps: [{ icon: FN }, { icon: "a" }, { icon: {} }] }), paths: ["steps[0].icon", "steps[2].icon"] },
  { id: "BV-0 terms", scene: TERMS([term("a"), term(), term("b")]), paths: [] },
  { id: "BV-1 terms (first)", scene: TERMS([term(FN), term("a"), term()]), paths: ["terms[0].icon"] },
  { id: "BV-2 terms (first and last)", scene: TERMS([term(FN), term("a"), term(7)]), paths: ["terms[0].icon", "terms[2].icon"] },
];

for (const { id, scene, paths } of BV_CASES) {
  test(`84c0 VO-3 ${id}: one warning per bad element, in order, with the 0-based index`, () => {
    const got = iconWarnings(deck([FIG(), scene, KW()]));
    assert.equal(got.length, paths.length, JSON.stringify(got));
    got.forEach((w, i) => {
      assert.equal(w.scene, 2);
      assert.ok(w.msg.includes(paths[i]), `warning ${i} lacks ${paths[i]}: ${w.msg}`);
    });
  });
}

test("84c0 VO-3 BV-S2: two bad scenes warn in scene order", () => {
  const got = iconWarnings(deck([FIG(), { ...HOOK(), art: FN }, ST(), EX({ steps: [{ icon: 3 }] }), KW()]));
  assert.deepEqual(got.map((w) => w.scene), [2, 4]);
  assert.ok(got[0].msg.includes("art") && got[0].msg.includes("function"), got[0].msg);
  assert.ok(got[1].msg.includes("steps[0].icon") && got[1].msg.includes("number"), got[1].msg);
});

test("84c0 VO-4 SC-1: icon-not-string follows the scene's other warnings and precedes the next scene and deck warnings", () => {
  const spec = {
    scenes: [
      { type: "explain", steps: [{ title: "TODO", icon: FN }] },
      { type: "compare", form: "table", items: [] },
    ],
  };
  assert.deepEqual(lint(spec), [
    [1, "no-title"],
    [1, "filler-content"],
    [1, "icon-not-string"],
    [2, "no-reading-guide"],
    [2, "no-title"],
    [0, "no-signature"],
    [0, "no-theme"],
    [0, "keywords-last"],
  ]);
});

for (const [id, steps] of [["ER-1 steps string", "x"], ["ER-2 steps object", {}], ["ER-3 steps [null, 3]", [null, 3]]]) {
  test(`84c0 VO-5 ${id}: no throw and the output is unchanged`, () => {
    assert.deepEqual(lint({ theme: "paper", scenes: [{ type: "explain", title: "e", steps }] }), [[0, "no-signature"], [0, "keywords-last"]]);
  });
}
