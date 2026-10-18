// VO-14 (spec 74cb05d7da21907e): property-based random testing of LTT.placement.zoomLock(question, zs) (spec v4) against an independent reference model.
// Usage: node 74cb05d7da21907e-zoomlock-fuzz.mjs <repo> [seed=20261019] [n=100000] [out.json]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const [repo, seedArg = "20261019", nArg = "100000", outFile] = process.argv.slice(2);
const KIT = join(repo, "skills/learn-to-tell/kit");
const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
vm.createContext(context);
for (const f of ["vendor/d3.min.js", "ltt.js", "ltt-parts.js", "ltt-ui.js", "ltt-mock.js", "ltt-deck.js"]) vm.runInContext(readFileSync(join(KIT, f), "utf8"), context, { filename: f });
const zoomLock = context.LTT.placement.zoomLock;

function mulberry32(a) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rnd = mulberry32(+seedArg);
const pickOne = (xs) => xs[Math.floor(rnd() * xs.length)];
const zoomLike = () => (rnd() < 0.7 ? 0.78 + rnd() * 0.22 : pickOne([0, 1e-9, 0.5, 0.78, 1, 1 + 1e-7, -0.1, 2]));
const junk = () => pickOne([NaN, Infinity, -Infinity, "0.9", undefined, null, {}, [], true]);

const valid = (v) => typeof v === "number" && Number.isFinite(v) && v > 0 && v <= 1;
function reference(q, zs) {
  if (!valid(q) || !Array.isArray(zs)) return 1;
  let m = q;
  for (const z of zs) { if (!valid(z)) return 1; m = Math.min(m, z); }
  return m;
}
const enc = (v) => JSON.stringify(v, (k, x) => (typeof x === "number" && !Number.isFinite(x) ? String(x) : x === undefined ? "__u" : x));

const n = +nArg;
let violations = 0, malformed = 0, validChecked = 0, throws = 0;
const examples = [];
const bad = (e) => { violations++; if (examples.length < 10) examples.push(e); };
for (let i = 0; i < n; i++) {
  const q = rnd() < 0.08 ? junk() : zoomLike();
  let zs;
  if (rnd() < 0.1) {
    malformed++;
    zs = pickOne([null, undefined, {}, "x", 3, { length: 1, 0: 0.5 }, [null], ["0.8"], [0.9, NaN], [0.9, undefined], [{ z: 0.5 }], [0.9, -1], [0.9, 2]]);
  } else {
    zs = Array.from({ length: Math.floor(rnd() * 7) }, () => (rnd() < 0.05 ? junk() : zoomLike()));
  }
  const expected = reference(q, zs), snap = enc(zs);
  let got;
  try { got = zoomLock(q, zs); } catch (e) { got = "throw:" + e.message; throws++; }
  if (enc(zs) !== snap) bad({ property: "input unchanged", q: String(q), zs: snap });
  if (!Object.is(got, expected)) bad({ q: String(q), zs: snap, expected, got: String(got) });
  if (valid(q) && Array.isArray(zs) && zs.every(valid)) {
    validChecked++;
    if (!Object.is(got, Math.min(q, ...zs))) bad({ property: "valid = Math.min", q, zs: snap });
  }
}
const out = { seed: +seedArg, n, violations, malformed, validChecked, throws, examples };
if (outFile) writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
process.exit(violations ? 1 : 0);
