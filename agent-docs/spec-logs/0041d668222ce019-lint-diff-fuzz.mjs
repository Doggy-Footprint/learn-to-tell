// Run record for spec 0041d668222ce019 (VO-9): differential random testing of LTT.lintDeck and LTT.auditScene,
// base commit ltt.js vs working-tree ltt.js, each in its own vm context. Not part of npm test.
// Usage: node agent-docs/spec-logs/0041d668222ce019-lint-diff-fuzz.mjs [seed=20261019] [n=20000] [base=00bba01]
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const [seedArg, nArg, baseArg] = process.argv.slice(2);
const SEED = Number(seedArg ?? 20261019), N = Number(nArg ?? 20000), BASE = baseArg ?? "00bba01";
const ROOT = new URL("../../", import.meta.url);
const KIT = "skills/learn-to-tell/kit/ltt.js";

function load(src) {
  const c = { console: { info() {}, warn() {} } };
  vm.createContext(c);
  vm.runInContext(src, c);
  return c.LTT;
}
const oldK = load(execFileSync("git", ["show", `${BASE}:${KIT}`], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }));
const newK = load(readFileSync(new URL(KIT, ROOT), "utf8"));

function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const result = { seed: SEED, n: N, base: BASE, malformed: 0, lint: { execs: 0, violations: 0, throwsBoth: 0, oneSided: 0, nonEmpty: 0, rules: {} }, audit: { execs: 0, violations: 0, nonEmpty: 0, rules: {} }, examples: [] };
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
const coin = (p = 0.5) => rand() < p;
const upto = (n) => Math.floor(rand() * (n + 1));

const TYPES = ["hook", "explain", "terms", "compare", "figure", "overview", "statement", "contrast", "predict", "summary", "keywords", "map-related", undefined, "", "foo"];
const KEYS = ["TTL", "적중", "캐시", "만료", "부하"];
const THEMES = Array.from(newK.themes, (t) => t.name);
function text() {
  const parts = [];
  for (let k = upto(3); k > 0; k--) {
    parts.push(pick([
      () => `{{${pick(KEYS)}}}`, () => `{{보임|${pick(KEYS)}}}`, () => pick(KEYS), () => pick(["TODO", "항목 1", "placeholder", "lorem", "샘플 텍스트"]),
      () => "평범한 문장", () => "",
    ])());
  }
  return parts.join(" ");
}
function scene() {
  const s = {};
  const type = pick(TYPES);
  if (type !== undefined) s.type = type;
  const maybe = (k, f, p) => { if (coin(p)) s[k] = f(); };
  maybe("title", text); maybe("sub", text); maybe("narration", text); maybe("points", () => [{ at: [1, 2], text: text() }]);
  maybe("caption", text); maybe("before", () => (coin() ? { points: [{ text: text() }] } : {}));
  maybe("mount", () => function () {}); maybe("layout", () => pick(["full", "split", "stack"]));
  maybe("form", () => pick(["cards", "strip", "stack", "table"])); maybe("takeaway", text); maybe("recall", text);
  maybe("figure", text); maybe("question", text); maybe("hint", text);
  maybe("choices", () => Array.from({ length: upto(3) }, (_, i) => ({ id: "c" + i, text: text() })));
  maybe("cards", () => Array.from({ length: upto(3) }, () => ({ title: text(), text: coin() ? text() : "", recall: coin() ? text() : undefined })), 0.3);
  if (s.type === "terms" || coin(0.1)) {
    s.terms = Array.from({ length: upto(3) }, () => {
      const t = { key: pick(KEYS) };
      if (coin()) t.plain = text();
      const v = pick([undefined, false, "그림", "skip"]);
      if (v !== "skip") t.visual = v;
      return t;
    });
  }
  return s;
}
function spec() {
  const sp = { scenes: Array.from({ length: upto(9) }, scene) };
  if (coin()) { sp.glossary = {}; for (let k = upto(4); k > 0; k--) sp.glossary[pick(KEYS)] = text(); }
  const th = pick(["none", "real", "nope"]);
  if (th === "real") sp.theme = pick(THEMES); else if (th === "nope") sp.theme = "nope";
  // Malformed partition (spec v3): one broken shape per chosen spec, so E-4 (both sides throw) is observed.
  if (coin(0.1)) {
    const at = upto(sp.scenes.length);
    pick([
      () => sp.scenes.splice(at, 0, null),
      () => sp.scenes.splice(at, 0, 7),
      () => sp.scenes.splice(at, 0, { type: "terms", title: "t", terms: "문자열" }),
      () => sp.scenes.splice(at, 0, { type: "summary", cards: "문자열" }),
      () => sp.scenes.splice(at, 0, { type: "predict", title: "t", choices: "문자열" }),
      () => { sp.glossary = null; },
    ])();
    result.malformed++;
  }
  return sp;
}
function measurement() {
  const m = {
    type: pick(TYPES.map((t) => t ?? "")), layout: pick(["", "full", "split"]), compact: coin(), zoom: pick([0.7, 0.879, 0.88, 1]),
    visualRatio: pick([null, 0.05, 0.0999, 0.1, 0.15, 0.2199, 0.22, 0.5]), figRatio: pick([null, 0.2, 0.349, 0.35, 0.8]),
    fill: pick([null, 0.3, 0.599, 0.6, 0.9]), fontSizes: 5 + upto(4), hscroll: pick([0, 12]), overflow: coin(),
    panelOverlap: pick([0, 2]), graphOverlaps: pick([0, 1]),
    goals: Array.from({ length: upto(2) }, () => ({ hits: upto(3), samples: 10, start: coin() })),
  };
  return m;
}
function run(f, x) {
  try { return JSON.stringify(f(x)); } catch (e) { return "THROW"; }
}
for (let i = 0; i < N; i++) {
  const sp = spec();
  const a = run(oldK.lintDeck, sp), b = run(newK.lintDeck, sp);
  result.lint.execs++;
  if (a === "THROW" && b === "THROW") result.lint.throwsBoth++;
  if ((a === "THROW") !== (b === "THROW")) result.lint.oneSided++;
  if (a !== b) { result.lint.violations++; if (result.examples.length < 5) result.examples.push({ kind: "lint", spec: sp, base: a, now: b }); }
  if (a !== "THROW") for (const w of JSON.parse(a)) result.lint.rules[w.rule] = (result.lint.rules[w.rule] || 0) + 1;
  if (a !== "THROW" && a !== "[]") result.lint.nonEmpty++;
}
for (let i = 0; i < N; i++) {
  const m = measurement();
  const a = run(oldK.auditScene, m), b = run(newK.auditScene, m);
  result.audit.execs++;
  if (a !== b) { result.audit.violations++; if (result.examples.length < 10) result.examples.push({ kind: "audit", m, base: a, now: b }); }
  if (a !== "THROW") for (const w of JSON.parse(a)) result.audit.rules[w.rule] = (result.audit.rules[w.rule] || 0) + 1;
  if (a !== "THROW" && a !== "[]") result.audit.nonEmpty++;
}
console.log(JSON.stringify(result, null, 1));
process.exit(result.lint.violations || result.audit.violations || !result.lint.throwsBoth ? 1 : 0);
