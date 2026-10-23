// Spec e48ead05eb246d3c "Fuzzing": differential check of LTT.compare(actual, expected, tol).ok against a reference written from FR-12's text.
// Run: node tests/expect-compare.fuzz.mjs   (prints the difference count; exit 1 and a minimized counterexample on any difference)
// Not matched by `npm test` (the file name does not end in .test.mjs).
//
// FR-12 reference: both finite numbers -> |a - e| <= tol (tol default 1e-9 * max(1, |e|)); both strings, both booleans, both null -> ===;
// both arrays -> same length and every element pair ok under this rule (a numeric element uses the given tol, else its own default);
// anything else (different types, NaN, +-Infinity, undefined, objects) -> mismatch.
// FR-12 says "the current rule" for numbers without fixing whether a difference exactly equal to tol passes. Cases whose
// finite-number comparison lands exactly on that boundary are therefore not compared; the count of such cases is printed.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SEED = 1, CASES = 20000;
const TOLS = [undefined, 0, 1e-9, 0.5];
const NUMS = [0, 1, -1, 2, 3, 7, 10, 100, 1e9, 0.5, 1.5, -2.5, 0.1, 0.25, 1e-10, 2e-9, 1 + 1e-9, 1 + 2e-9, 123.456, 0.161016, 1e-300, 1e300];

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
let boundary = false;

function ref(a, e, tol) {
  if (isNum(a) && isNum(e)) {
    const t = tol === undefined ? 1e-9 * Math.max(1, Math.abs(e)) : tol;
    const d = Math.abs(a - e);
    if (d === t && d !== 0) boundary = true;
    return d <= t;
  }
  if (typeof a === "string" && typeof e === "string") return a === e;
  if (typeof a === "boolean" && typeof e === "boolean") return a === e;
  if (a === null && e === null) return true;
  if (Array.isArray(a) && Array.isArray(e)) {
    if (a.length !== e.length) return false;
    let all = true;
    for (let i = 0; i < a.length; i++) if (!ref(a[i], e[i], tol)) all = false;
    return all;
  }
  return false;
}

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];

// Values are described as plain data so the same description can be built in the main realm (reference) and in the kit's vm realm,
// where arrays must be created by the kit's own Array constructor.
const CH = ["a", "b", "1", " "];
function genNumber() {
  const r = rnd();
  if (r < 0.1) return { k: "negzero" };
  if (r < 0.3) return { k: "num", v: Math.floor(rnd() * 21) - 10 };
  if (r < 0.5) return { k: "num", v: Math.round((rnd() * 20 - 10) * 100) / 100 };
  return { k: "num", v: pick(NUMS) };
}
function genValue(depth) {
  const r = rnd();
  if (r < 0.30) return genNumber();
  if (r < 0.34) return { k: "nan" };
  if (r < 0.37) return { k: "inf", v: 1 };
  if (r < 0.40) return { k: "inf", v: -1 };
  if (r < 0.52) { const n = Math.floor(rnd() * 5); return { k: "str", v: Array.from({ length: n }, () => pick(CH)).join("") }; }
  if (r < 0.58) return { k: "bool", v: rnd() < 0.5 };
  if (r < 0.64) return { k: "null" };
  if (r < 0.70) return { k: "undef" };
  if (r < 0.76) return { k: "obj" };
  if (depth >= 2) return genNumber();
  const n = Math.floor(rnd() * 4);
  return { k: "arr", v: Array.from({ length: n }, () => genValue(depth + 1)) };
}
const copy = (d) => (d.k === "arr" ? { k: "arr", v: d.v.map(copy) } : { ...d });

const plain = (d) => {
  switch (d.k) {
    case "negzero": return -0;
    case "num": return d.v;
    case "nan": return NaN;
    case "inf": return d.v * Infinity;
    case "str": case "bool": return d.v;
    case "null": return null;
    case "undef": return undefined;
    case "obj": return {};
    case "arr": return d.v.map(plain);
  }
};
const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
vm.createContext(context);
vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/ltt.js", import.meta.url), "utf8"), context);
if (typeof context.LTT?.compare !== "function") {
  console.error("LTT.compare is not a function");
  process.exit(1);
}
vm.runInContext(`globalThis.__build = function build(d){
  switch (d.k) {
    case "negzero": return -0;
    case "num": return d.v;
    case "nan": return NaN;
    case "inf": return d.v * Infinity;
    case "str": case "bool": return d.v;
    case "null": return null;
    case "undef": return undefined;
    case "obj": return {};
    case "arr": { var out = []; for (var i = 0; i < d.v.length; i++) out.push(build(d.v[i])); return out; }
  }
};`, context);
const build = context.__build;
const show = (d) => (d.k === "arr" ? `[${d.v.map(show).join(",")}]` : d.k === "str" ? JSON.stringify(d.v) : d.k === "num" || d.k === "bool" ? String(d.v) : d.k === "inf" ? (d.v > 0 ? "Infinity" : "-Infinity") : d.k === "negzero" ? "-0" : d.k === "nan" ? "NaN" : d.k === "obj" ? "{}" : d.k);

function disagree(a, e, tol) {
  boundary = false;
  const want = ref(plain(a), plain(e), tol);
  if (boundary) return null;
  let got;
  try { got = context.LTT.compare(build(a), build(e), tol); } catch (err) { return `threw ${err}`; }
  if (!got || typeof got.ok !== "boolean") return `result has no boolean ok: ${JSON.stringify(got)}`;
  return got.ok === want ? null : `compare.ok=${got.ok} reference=${want}`;
}

function shrink(a, e, tol) {
  let cur = [a, e];
  for (let changed = true; changed;) {
    changed = false;
    for (let side = 0; side < 2 && !changed; side++) {
      const d = cur[side];
      if (d.k !== "arr") continue;
      for (let i = 0; i < d.v.length && !changed; i++) {
        const cand = { k: "arr", v: d.v.filter((_, j) => j !== i) };
        const next = side === 0 ? [cand, cur[1]] : [cur[0], cand];
        if (disagree(next[0], next[1], tol)) { cur = next; changed = true; }
      }
    }
  }
  return cur;
}

let differences = 0, skipped = 0, okCount = 0;
for (let n = 0; n < CASES; n++) {
  const a = genValue(0);
  const e = rnd() < 0.5 ? copy(a) : genValue(0);
  const tol = pick(TOLS);
  boundary = false;
  ref(plain(a), plain(e), tol);
  if (boundary) { skipped++; continue; }
  if (ref(plain(a), plain(e), tol)) okCount++;
  const why = disagree(a, e, tol);
  if (why) {
    const [sa, se] = shrink(a, e, tol);
    console.error(`DIFFERENCE case ${n}: actual=${show(a)} expected=${show(e)} tol=${tol}: ${why}`);
    console.error(`  minimized: actual=${show(sa)} expected=${show(se)} tol=${tol} -> ${disagree(sa, se, tol)}`);
    differences++;
  }
}
console.log(`differences: ${differences} in ${CASES} cases (seed ${SEED}; ${skipped} exact-tolerance-boundary cases not compared; ${okCount} cases where the reference says ok)`);
if (differences) process.exit(1);
