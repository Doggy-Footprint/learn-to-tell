#!/usr/bin/env node
// Differential fuzz for spec 80a1b2f18f50b1df (QR-1, VO-3).
// Oracle: the B-rule items (unknown-term, used-before-defined, predict-new-term, filler-content) of base_commit's
// lintDeck(spec), as [scene, rule, msg], must equal the current deckIssues(spec) mapped ["장면 n" -> n, rule, msg].
// Usage: node tests/check-differential.fuzz.mjs --seed 1 --n 3000 [--out failing-spec.json]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const BASE_COMMIT = "2b3df17a7d740dcfe0b6bf30eacb4c82d5bfdb3a";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const KIT_PATH = "skills/learn-to-tell/kit/ltt.js";
const B_RULES = new Set(["unknown-term", "used-before-defined", "predict-new-term", "filler-content"]);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}
const seed = Number(arg("seed", "1"));
const count = Number(arg("n", "3000"));
const outPath = arg("out", join(tmpdir(), `check-differential-failure-${seed}.json`));
if (!Number.isInteger(seed) || !Number.isInteger(count) || count < 0) {
  console.error("usage: check-differential.fuzz.mjs --seed <int> --n <count> [--out <file>]");
  process.exit(2);
}

function load(source) {
  const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.LTT;
}
const baseSource = execFileSync("git", ["show", `${BASE_COMMIT}:${KIT_PATH}`], { cwd: ROOT, maxBuffer: 1 << 28 }).toString("utf8");
const oldKit = load(baseSource);
const newKit = load(readFileSync(join(ROOT, KIT_PATH), "utf8"));

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(seed);
const int = (n) => Math.floor(rand() * n);
const pick = (a) => a[int(a.length)];
const chance = (p) => rand() < p;

const KEYS = ["적중", "적중률", "TTL", "캐시", "만료", "k"];
const UNKNOWN = ["없는말", "미정의", "zz"];
const FILLERS = ["TODO", "TBD", "샘플 텍스트", "항목 1", "Item A", "lorem ipsum", "xxx", "더미 데이터", "임시텍스트", "placeholder"];
const WORDS = ["가", "나", "값이", "커진다", "hit", "ratio", "하면", "그래서", "3건"];

function piece() {
  const r = rand();
  if (r < 0.2) return pick(WORDS);
  if (r < 0.4) return `{{${pick(KEYS)}}}`;
  if (r < 0.5) return `{{${pick(WORDS)}|${pick(KEYS)}}}`;
  if (r < 0.65) return pick(KEYS);
  if (r < 0.72) return `{{${pick(UNKNOWN)}}}`;
  if (r < 0.77) return `{{${pick(FILLERS)}|${pick(KEYS)}}}`;
  if (r < 0.9) return pick(FILLERS);
  return pick(WORDS) + pick(KEYS);
}
const text = () => Array.from({ length: int(5) }, piece).join(pick(["", " ", " "]));
const maybe = (p, make) => (chance(p) ? make() : undefined);

function scene() {
  const t = pick(["hook", "terms", "explain", "figure", "predict", "statement", "summary", "keywords", "untyped", "compare", "contrast", "overview"]);
  const s = t === "untyped" ? {} : { type: t };
  const setIf = (k, p, v) => { if (chance(p)) s[k] = v(); };
  setIf("title", 0.7, text);
  setIf("sub", 0.3, text);
  if (t !== "untyped") setIf("narration", 0.3, () => (chance(0.5) ? text() : [text(), text()]));
  switch (t) {
    case "hook":
      setIf("text", 0.9, text);
      break;
    case "terms":
      s.terms = Array.from({ length: int(4) }, () => {
        const e = { key: pick(KEYS) };
        if (chance(0.6)) e.plain = text();
        if (chance(0.5)) e.visual = chance(0.5) ? "<svg></svg>" : false;
        return e;
      });
      break;
    case "explain":
      s.steps = Array.from({ length: int(3) }, () => (chance(0.5) ? text() : { title: text(), text: text(), sub: text() }));
      setIf("form", 0.5, () => pick(["strip", "cards", "stack"]));
      setIf("takeaway", 0.3, text);
      break;
    case "figure":
      setIf("caption", 0.6, text);
      setIf("figure", 0.6, () => "그림");
      break;
    case "predict":
      setIf("question", 0.9, text);
      s.choices = Array.from({ length: int(3) }, text);
      setIf("hint", 0.4, text);
      break;
    case "summary":
      s.cards = Array.from({ length: int(3) }, () => ({ text: text(), ...(chance(0.5) ? { recall: text() } : {}) }));
      break;
    case "compare":
      s.items = Array.from({ length: int(3) }, () => ({ title: text(), text: text(), sub: text() }));
      setIf("form", 0.5, () => "table");
      break;
    case "contrast":
      setIf("left", 0.7, text);
      setIf("right", 0.7, text);
      break;
    case "overview":
      setIf("caption", 0.6, text);
      setIf("figure", 0.6, () => "<svg></svg>");
      break;
    case "keywords":
      s.terms = [];
      break;
    case "untyped":
      setIf("narration", 0.4, text);
      break;
  }
  return s;
}

function deckSpec() {
  const spec = { scenes: Array.from({ length: 1 + int(7) }, scene) };
  if (chance(0.8)) spec.theme = "paper";
  if (chance(0.6)) {
    spec.glossary = {};
    for (let i = int(5); i > 0; i--) spec.glossary[pick(KEYS)] = chance(0.8) ? "풀이" : "";
  }
  return spec;
}

function extraGlossary() {
  if (!chance(0.5)) return undefined;
  const g = {};
  for (let i = 1 + int(3); i > 0; i--) g[pick(KEYS)] = "메타 풀이";
  return g;
}

const clone = (x) => JSON.parse(JSON.stringify(x));
const run = (fn) => {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    return { ok: false, error: String(e && e.message) };
  }
};

function compare(spec, extra) {
  // The base kit has no extra argument: the extra keys are merged into the old spec.glossary (extra first, FR-5).
  const oldSpec = clone(spec);
  if (extra) oldSpec.glossary = { ...extra, ...(oldSpec.glossary ?? {}) };
  const oldRes = run(() => Array.from(oldKit.lintDeck(oldSpec), (w) => [w.scene, w.rule, w.msg]).filter(([, rule]) => B_RULES.has(rule)));
  if (!oldRes.ok) return { skipped: true };
  const newRes = run(() => Array.from((extra === undefined ? newKit.deckIssues(clone(spec)) : newKit.deckIssues(clone(spec), clone(extra))), (w) => {
    const m = /^장면 (\d+)$/.exec(w.where);
    return [m ? Number(m[1]) : w.where, w.rule, w.msg];
  }));
  const want = JSON.stringify(oldRes.value);
  const got = newRes.ok ? JSON.stringify(newRes.value) : `throws: ${newRes.error}`;
  return want === got ? { ok: true, nonEmpty: oldRes.value.length > 0 } : { ok: false, want, got };
}
let currentExtra;
const fails = (spec) => compare(spec, currentExtra).ok === false;

function minimize(spec) {
  let cur = clone(spec);
  let changed = true;
  const tryReplace = (next) => {
    if (fails(next)) { cur = next; changed = true; return true; }
    return false;
  };
  while (changed) {
    changed = false;
    for (let i = cur.scenes.length - 1; i >= 0; i--) {
      const next = clone(cur);
      next.scenes.splice(i, 1);
      tryReplace(next);
    }
    for (const k of Object.keys(cur.glossary ?? {})) {
      const next = clone(cur);
      delete next.glossary[k];
      tryReplace(next);
    }
    for (const field of ["theme", "glossary"]) {
      if (field in cur) { const next = clone(cur); delete next[field]; tryReplace(next); }
    }
    for (let i = 0; i < cur.scenes.length; i++) {
      for (const k of Object.keys(cur.scenes[i])) {
        if (k === "type") continue;
        const next = clone(cur);
        delete next.scenes[i][k];
        if (tryReplace(next)) continue;
        const v = cur.scenes[i][k];
        if (typeof v === "string") {
          for (let at = 0; at < v.length; at++) {
            const s2 = clone(cur);
            s2.scenes[i][k] = v.slice(0, at) + v.slice(at + 1);
            if (tryReplace(s2)) break;
          }
        } else if (Array.isArray(v)) {
          for (let j = v.length - 1; j >= 0; j--) {
            const s2 = clone(cur);
            s2.scenes[i][k].splice(j, 1);
            tryReplace(s2);
          }
        }
      }
    }
  }
  return cur;
}

let violationsWithExtra = 0, execs = 0, skipped = 0, violations = 0, nonEmpty = 0, first = null;
for (let i = 0; i < count; i++) {
  const spec = deckSpec();
  const extra = extraGlossary();
  const r = compare(spec, extra);
  if (r.skipped) { skipped++; continue; }
  execs++;
  if (r.nonEmpty) nonEmpty++;
  if (r.ok === false) {
    violations++;
    if (extra) violationsWithExtra++;
    if (!first) first = { spec, extra, want: r.want, got: r.got };
  }
}
console.log(`seed ${seed}: execs ${execs} (${nonEmpty} with B items), skipped (base lintDeck threw) ${skipped}, violations ${violations} (${violationsWithExtra} with extraGlossary)`);
if (first) {
  currentExtra = first.extra;
  const small = minimize(first.spec);
  const r = compare(small, first.extra);
  writeFileSync(outPath, JSON.stringify({ seed, spec: small, extraGlossary: first.extra, want: r.want, got: r.got }, null, 2));
  console.log(`first failing spec (minimized) written to ${outPath}`);
  console.log(`  want ${r.want}\n  got  ${r.got}`);
  process.exit(1);
}
if (count >= 100 && nonEmpty < count / 10) {
  console.error("oracle produced B items for fewer than 10% of specs; generator is too weak");
  process.exit(1);
}
if (count > 0 && execs === 0) {
  console.error("no usable executions");
  process.exit(1);
}
