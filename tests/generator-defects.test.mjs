import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import * as AUDIT_RULES from "../skills/learn-to-tell/server/audit.mjs";

// Spec 753ff3c539424409 v1 VO-1, VO-9, VO-10, VO-11. Expected values come from the spec's FR/Cases and from independent
// reference definitions written in this file, never from running the implementation.

function loadKit() {
  const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/ltt.js", import.meta.url), "utf8"), context);
  return context.LTT;
}
const LTT = loadKit();

// ---------- shared building blocks ----------

const THEME = "paper";
const NEXT1 = [{ term: "다음", why: "이유" }];
const KW = (o = {}) => ({ type: "keywords", terms: [], next: NEXT1, ...o });
const FIG = () => ({ type: "figure", title: "t", caption: "c", figure: "그림" });
const deck = (scenes, extra = {}) => ({ theme: THEME, ...extra, scenes });
const NEW_RULES = ["predict-choices", "figure-no-type", "keywords-no-next"];
const lintNew = (spec) => Array.from(LTT.lintDeck(spec), (w) => [w.scene, w.rule]).filter(([, r]) => NEW_RULES.includes(r));
const CH = [{ id: "a", text: "가" }, { id: "b", text: "나" }];
const PRED = (o = {}) => ({ type: "predict", title: "p", question: "q", choices: CH, answer: "a", ...o });

// ---------- VO-1 equivalence partitioning + BVA (2-value) ----------

const PREDICT_CASES = [
  // EP partitions
  ["EP non-array choices (string)", { choices: "가,나" }, 1],
  ["EP non-array choices (object)", { choices: { a: "가", b: "나" } }, 1],
  ["EP string elements (C-4)", { choices: ["1시간", "2시간"], answer: "1시간" }, 1],
  ["EP text missing, {id, label} (C-4)", { choices: [{ id: "a", label: "가" }, { id: "b", label: "나" }] }, 1],
  ["EP text missing on one element", { choices: [{ id: "a", text: "가" }, { id: "b" }] }, 1],
  ["EP id missing on one element", { choices: [{ id: "a", text: "가" }, { text: "나" }] }, 1],
  ["EP answer matches no id (C-4)", { answer: "zz" }, 1],
  ["EP answer absent", { answer: undefined }, 1],
  ["EP normal, answer is the first id (C-5)", {}, 0],
  ["EP normal, answer is the last id", { answer: "b" }, 0],
  // BVA on the element count
  ["BVA one choice (C-4)", { choices: [{ id: "a", text: "가" }], answer: "a" }, 1],
  ["BVA two choices (C-5)", { choices: CH, answer: "a" }, 0],
  ["BVA three choices", { choices: [...CH, { id: "c", text: "다" }], answer: "c" }, 0],
];
for (const [label, over, n] of PREDICT_CASES) {
  test(`VO-1 FR-4 C-4/C-5 predict-choices ${label}: ${n} finding(s) at scene 2`, () => {
    const got = lintNew(deck([FIG(), PRED(over), KW()])).filter(([, r]) => r === "predict-choices");
    assert.deepEqual(got, Array.from({ length: n }, () => [2, "predict-choices"]));
  });
}

test("VO-1 FR-4 predict-choices: a scene with several faults at once gives exactly one finding", () => {
  const got = lintNew(deck([FIG(), PRED({ choices: ["x"], answer: "zz" }), KW()])).filter(([, r]) => r === "predict-choices");
  assert.deepEqual(got, [[2, "predict-choices"]]);
});

test("VO-1 FR-4 predict-choices: each faulty predict scene is reported at its own number", () => {
  const got = lintNew(deck([FIG(), PRED({ answer: "zz" }), PRED(), PRED({ choices: ["x", "y"] }), KW()]));
  assert.deepEqual(got.filter(([, r]) => r === "predict-choices"), [[2, "predict-choices"], [4, "predict-choices"]]);
});

const OVERVIEW = () => ({ type: "overview", title: "o", figure: "<svg></svg>", caption: "c" });
const FIGURE_CASES = [
  ["no type (C-6)", { title: "t", figure: "그림", caption: "c" }, 1],
  ["type explain with a figure field", { type: "explain", title: "t", form: "strip", steps: [], figure: "그림" }, 1],
  ["type figure", { type: "figure", title: "t", figure: "그림", caption: "c" }, 0],
  ["type overview", OVERVIEW(), 0],
];
for (const [label, scene, n] of FIGURE_CASES) {
  test(`VO-1 FR-5 C-6 figure-no-type ${label}: ${n} finding(s) at scene 2`, () => {
    const got = lintNew(deck([FIG(), scene, KW()])).filter(([, r]) => r === "figure-no-type");
    assert.deepEqual(got, Array.from({ length: n }, () => [2, "figure-no-type"]));
  });
}

const NEXT_CASES = [
  ["next absent (C-7)", {}, undefined, 1],
  ["next empty array (C-7)", { next: [] }, undefined, 1],
  ["next with one entry", { next: [{ term: "A", why: "a" }] }, undefined, 0],
];
for (const [label, over, , n] of NEXT_CASES) {
  test(`VO-1 FR-6 C-7 keywords-no-next ${label}: ${n} finding(s) at the keywords scene`, () => {
    const kw = { type: "keywords", terms: [], ...over };
    const got = lintNew(deck([FIG(), kw])).filter(([, r]) => r === "keywords-no-next");
    assert.deepEqual(got, Array.from({ length: n }, () => [2, "keywords-no-next"]));
  });
}

test("VO-1 FR-6 keywords-no-next judges the last keywords scene: an earlier next-less keywords scene is not reported when the last has next", () => {
  const got = lintNew(deck([FIG(), { type: "keywords", terms: [] }, FIG(), KW()])).filter(([, r]) => r === "keywords-no-next");
  assert.deepEqual(got, []);
});

test("VO-1 FR-4..FR-6: a deck with none of the three defects reports none of the three rules", () => {
  assert.deepEqual(lintNew(deck([FIG(), PRED(), OVERVIEW(), KW()])), []);
});

// ---------- VO-9 usesTerm: reference table, partitions and BVA ----------

test("VO-9 FR-14 usesTerm is exposed on LTT as a function of (text, key)", () => {
  assert.equal(typeof LTT.usesTerm, "function");
});

const C15 = [
  ["perceptual", "pt", false],
  ["FLOPS", "FLOP", false],
  ["a b", "a", true],
  ["상관없이", "상관", false],
  ["분산이", "분산", true],
  ["분산 투자", "분산", true],
  ["pt.", "pt", true],
  ["FLOP", "FLOP", true],
];
for (const [text, key, want] of C15) {
  test(`VO-9 C-15 usesTerm(${JSON.stringify(text)}, ${JSON.stringify(key)}) is ${want}`, () => {
    assert.equal(LTT.usesTerm(text, key), want);
  });
}

const C16 = [
  ["empty text", "", "x", false],
  ["key at the end of the sentence", "그래서 분산", "분산", true],
  ["key at the very start", "분산 후", "분산", true],
  ["two occurrences, only the second satisfies the boundary", "분산률 분산", "분산", true],
  ["two occurrences, only the second satisfies the boundary (Latin)", "FLOPS FLOP", "FLOP", true],
  ["two occurrences, neither satisfies the boundary", "분산률 분산률", "분산", false],
];
for (const [label, text, key, want] of C16) {
  test(`VO-9 C-16 usesTerm ${label}: ${want}`, () => {
    assert.equal(LTT.usesTerm(text, key), want);
  });
}

const PARTICLES = "은 는 이 가 을 를 의 에 와 과 도 로 으로 에서 에게 만 까지 부터 보다 처럼 이다 이고 이며 이나 이란 이라 라 란 나 랑 하 한 할 해 했 된 되 될 적 들".split(" ");
test("VO-9 FR-14: the particle/ending list in this test has the 40 entries the spec names", () => {
  assert.equal(PARTICLES.length, 40);
  assert.equal(new Set(PARTICLES).size, 40);
});
for (const p of PARTICLES) {
  test(`VO-9 FR-14 listed particle ${JSON.stringify(p)} after a Hangul key counts as a use`, () => {
    assert.equal(LTT.usesTerm(`분산${p}`, "분산"), true);
    assert.equal(LTT.usesTerm(`그 분산${p} 크다`, "분산"), true);
  });
}

const EP = [
  // (a) key starts/ends with a Latin letter or digit
  ["Latin key preceded by a letter", "apt", "pt", false],
  ["Latin key preceded by a digit", "1pt", "pt", false],
  ["Latin key followed by a digit", "pt2", "pt", false],
  ["Latin key followed by a letter", "ptx", "pt", false],
  ["Latin key between spaces", "an pt is", "pt", true],
  ["Latin key at both ends of the text", "pt", "pt", true],
  ["Latin key followed by punctuation", "(pt)", "pt", true],
  ["Latin key followed by a Hangul syllable (no boundary condition for other kinds)", "pt가", "pt", true],
  ["Latin key preceded by a Hangul syllable", "가pt", "pt", true],
  ["digit key preceded by a digit", "12", "2", false],
  ["digit key isolated", "a 2 b", "2", true],
  ["key is case sensitive on content", "flop", "FLOP", false],
  // (b) key starts/ends with a Hangul syllable
  ["Hangul key preceded by a Hangul syllable", "무분산", "분산", false],
  ["Hangul key followed by an unlisted syllable", "분산률", "분산", false],
  ["Hangul key followed by '으' alone (only '으로' is listed)", "분산으", "분산", false],
  ["Hangul key followed by the two-letter ending '으로'", "분산으로", "분산", true],
  ["Hangul key followed by a Latin letter (not a Hangul syllable)", "분산x", "분산", true],
  ["Hangul key followed by a digit", "분산2", "분산", true],
  ["Hangul key preceded by a Latin letter", "a분산", "분산", true],
  ["Hangul key preceded by a space and followed by punctuation", " 분산.", "분산", true],
  ["Hangul key followed by the closing quote 』", "『분산』", "분산", true],
  ["Hangul key followed by a hyphen", "분산-투자", "분산", true],
  ["Hangul key ending in a particle-like syllable, itself listed", "이", "이", true],
  ["Hangul key '이' inside a longer word", "이상", "이", false],
  ["Hangul key '이' followed by a listed ending", "이는", "이", true],
];
for (const [label, text, key, want] of EP) {
  test(`VO-9 FR-14 EP ${label}: usesTerm(${JSON.stringify(text)}, ${JSON.stringify(key)}) is ${want}`, () => {
    assert.equal(LTT.usesTerm(text, key), want);
  });
}

// ---------- VO-10 used-before-defined goes through usesTerm ----------

const ubd = (spec, extra) => Array.from(LTT.deckIssues(spec, extra), (w) => [w.where, w.rule]).filter(([, r]) => r === "used-before-defined");
const hookThenMark = (earlier, key) => deck([FIG(), { type: "hook", text: earlier }, { type: "explain", form: "strip", title: `{{${key}}}의 뜻`, steps: [] }, KW()], { glossary: { [key]: "풀이" } });

const UBD = [
  ["Latin key only as a substring of an earlier word", "perceptual", "pt", 0],
  ["Hangul key only as a prefix of a longer earlier word", "상관없이 논다", "상관", 0],
  ["Hangul key followed by an unlisted syllable earlier", "분산률이 높다", "분산", 0],
  ["Latin key at a word boundary earlier", "the pt value", "pt", 1],
  ["Hangul key with a listed particle earlier", "분산이 크다", "분산", 1],
  ["Hangul key as a whole word earlier", "분산 투자", "분산", 1],
];
for (const [label, earlier, key, n] of UBD) {
  test(`VO-10 FR-14 used-before-defined ${label}: ${n} finding(s)`, () => {
    assert.deepEqual(ubd(hookThenMark(earlier, key)), Array.from({ length: n }, () => ["장면 2", "used-before-defined"]));
  });
}

// ---------- VO-11 documentation facts ----------

const ROOT = new URL("../", import.meta.url);
const read = (rel) => readFileSync(new URL(rel, ROOT), "utf8");
const SKILL = read("skills/learn-to-tell/SKILL.md");
const API = read("skills/learn-to-tell/kit/API.md");
const RULES = read("skills/learn-to-tell/kit/api/rules.md");
const READ = `${SKILL}\n${API}`;
const lines = (t) => t.split(/\r?\n/);
const lineWith = (t, ...tokens) => lines(t).some((l) => tokens.every((k) => (k instanceof RegExp ? k.test(l) : l.includes(k))));
const inOrder = (l, ...tokens) => {
  let at = -1;
  for (const k of tokens) {
    at = l.indexOf(k, at + 1);
    if (at < 0) return false;
  }
  return true;
};

const FACTS = [
  ["FR-15 predict choices are [{id, text}] objects", () => lineWith(READ, "choices", /\{\s*id\s*,\s*text\s*\}|id\s*:[^,}]*,\s*text\s*:/)],
  ["FR-15 predict answer is an id", () => lineWith(READ, "answer", /\bid\b/)],
  ["FR-15 keywords next is the concept tree {term, why}", () => lineWith(READ, "keywords", "next") && lineWith(READ, "next", "term", "why")],
  ["FR-15 next is the last scene the author writes", () => lineWith(READ, "next", "마지막")],
  ["FR-15 fixed deck order hook ... summary -> overview -> keywords", () => lines(READ).some((l) => inOrder(l, "hook", "summary", "overview", "keywords"))],
  ["FR-15 predict and compare takeaway appear after the reveal", () => lineWith(READ, "takeaway", "predict", "compare", "공개")],
  ["FR-15 d3 is required", () => lineWith(READ, "d3", "필수")],
  ["FR-15 ltt.js, ltt-parts.js and ltt-ui.js are required", () => ["ltt.js", "ltt-parts.js", "ltt-ui.js"].every((f) => READ.includes(f)) && lineWith(READ, "ltt-parts.js", "필수")],
  ["FR-15 audit output: check means 고침", () => lineWith(READ, "check", "고침")],
  ["FR-15 audit output: advice means 권고", () => lineWith(READ, "advice", "권고")],
  ["FR-15 audit output: script-error line carries its meaning (load-time exception)", () => lineWith(READ, "script-error", "로드", "예외")],
  ["FR-15 audit output: scene-error line carries its meaning (scene drawing exception)", () => lineWith(READ, "scene-error", "장면", "예외")],
  ["FR-15 state shots: a state=reveal token and a step- token", () => READ.includes("state=reveal") && READ.includes("step-")],
  ["FR-15 shot index.md is named", () => READ.includes("index.md")],
  ["FR-15 checklist refers to scenes by title", () => lineWith(READ, "checklist", "제목")],
  ["FR-15 renumbering fixes may repair only the reference, not question or answer", () => lineWith(READ, "checklist", "순서") && lineWith(READ, "정답")],
  ["FR-15 background.md goes to the verifier only when it exists", () => lineWith(READ, "background.md", /있(을 때|으면|는 경우)/)],
  ["FR-15 the verifier gets the shot index.md", () => lineWith(READ, "index.md", /검증|verifier/i)],
  ["FR-15 미검증 rule for result.md", () => lineWith(READ, "미검증", "result.md")],
  ["FR-15 result.md frontmatter quoting: 큰따옴표 for ': ', '#' and quotes", () => lineWith(READ, "frontmatter", "큰따옴표")],
];
for (const [label, fn] of FACTS) {
  test(`VO-11 ${label}`, () => {
    assert.equal(fn(), true, `${label}: not found in SKILL.md + kit/API.md`);
  });
}

// QR-7: expected set = ids the spec names plus the lint/check ids that existing tests assert (tests/api-docs.test.mjs, shots, gate-gaps).
const LINT_IDS = ["no-reading-guide", "no-title", "overview-missing", "overview-order", "overview-no-visual", "keywords-last", "unused-term",
  "term-no-visual", "summary-no-recall", "card-monotony", "no-signature", "no-theme", "unknown-theme", ...NEW_RULES];
const CHECK_IDS = ["unknown-term", "used-before-defined", "predict-new-term", "filler-content", "goal-unreachable", "goal-at-start",
  "expect-mismatch", "check-failed", "control-shift", "probe-failed", "clock-duplicate-id", "script-error", "scene-error"];
const MARK_IDS = ["shot-format", "shot-bad-time", "shot-unknown-clock"]; // spec v3 QR-7: required members
const tableIds = (text) => {
  const ids = [];
  for (const l of lines(text)) {
    if (!l.startsWith("|") || /^\|[\s:|-]*$/.test(l)) continue;
    const first = l.split("|")[1] ?? "";
    for (const m of first.matchAll(/`([^`]+)`/g)) ids.push(m[1]);
  }
  return ids;
};
// Spec e48ead05eb246d3c FR-15: the expected set is the kit registry (LTT.ruleIds) plus AUDIT_RULE_IDS instead of a hand-maintained
// superset; the hand lists above stay as required members so a rule dropped from the registry still fails here.
test("VO-11 QR-7 rules.md tables list every lint and check rule id, and nothing else (incl. clock-duplicate-id and the 3 shot-* ids)", () => {
  const listed = new Set(tableIds(RULES));
  const registry = new Set([...Array.from(LTT.ruleIds ?? []), ...Array.from(AUDIT_RULES.AUDIT_RULE_IDS ?? [])]);
  assert.deepEqual([...LINT_IDS, ...CHECK_IDS, ...MARK_IDS].filter((i) => !registry.has(i)), [], "hand-listed rule missing from the registry");
  const missing = [...registry].filter((i) => !listed.has(i));
  const extra = [...listed].filter((i) => !registry.has(i));
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] });
});

// ---------- isAdvice (spec v3 Signatures) ----------

for (const [rule, want] of [["unused-term", true], ["card-monotony", true], ["no-signature", true], ["overview-order", false], ["keywords-no-next", false], ["no-such-rule", false], ["", false]]) {
  test(`VO-2 FR-1 isAdvice(${JSON.stringify(rule)}) is ${want}`, () => {
    assert.equal(LTT.isAdvice(rule), want);
  });
}
