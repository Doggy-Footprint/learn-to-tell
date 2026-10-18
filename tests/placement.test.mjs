import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const KIT = fileURLToPath(new URL("../skills/learn-to-tell/kit/", import.meta.url));
const DECK_CHAIN = ["vendor/d3.min.js", "ltt.js", "ltt-parts.js", "ltt-ui.js", "ltt-mock.js", "ltt-deck.js"];

function loadDeckContext() {
  const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
  vm.createContext(context);
  for (const f of DECK_CHAIN) vm.runInContext(readFileSync(join(KIT, f), "utf8"), context, { filename: f });
  return context;
}

let shared = null;
const deck = () => (shared ??= loadDeckContext());

// Arguments are evaluated inside the kit realm so Array.isArray / typeof see same-realm values, as page code would pass them.
function zoomLock(args) {
  const context = deck();
  assert.equal(typeof context.LTT?.placement?.zoomLock, "function", "LTT.placement.zoomLock is not a function after loading the deck chain");
  let out;
  assert.doesNotThrow(() => {
    out = vm.runInContext(`LTT.placement.zoomLock(${args})`, context);
  }, `zoomLock(${args}) threw (E-3: invalid input must return 1, never throw)`);
  return out;
}

// Expected values are hand-computed from spec v4 Signatures:
// Math.min(question, ...zs); [] -> question; invalid -> 1 (question or any element not a finite number in (0, 1], zs not an Array).
function cases(group, list) {
  for (const [id, args, expected] of list) {
    test(`${group} ${id}: zoomLock(${args}) === ${expected}`, () => {
      const got = zoomLock(args);
      assert.equal(typeof got, "number", `zoomLock(${args}) returned ${typeof got}`);
      assert.equal(got, expected, `zoomLock(${args})`);
    });
  }
}

// ---------- VO-1 decision table (v4): 5 cells by where the minimum comes from ----------

cases("VO-1 DT", [
  ["DT-1 zs empty", "0.78, []", 0.78],
  ["DT-2 minimum is question (C-2)", "0.85, [0.9, 1]", 0.85],
  ["DT-3 minimum is the first element (C-1)", "0.95, [0.9, 0.97]", 0.9],
  ["DT-4 minimum is the last element", "0.95, [0.97, 0.92, 0.8]", 0.8],
  ["DT-5 minimum shared by question and an element", "0.9, [0.95, 0.9]", 0.9],
]);

// ---------- VO-1 C-3 boundary cases ----------

cases("VO-1 C-3", [
  ["empty zs, q = 1", "1, []", 1],
  ["empty zs, q = 0.78", "0.78, []", 0.78],
  ["single element 1 = question", "1, [1]", 1],
  ["single element equal to question", "0.9, [0.9]", 0.9],
  ["single element above question", "0.9, [0.95]", 0.9],
]);

// ---------- VO-1 C-4 3-value BVA on question (0 / 1e-9 / 1 / 1+1e-7) ----------
// Each point runs with [] (spec C-4 row) and with one lowering element, so a clamp-instead-of-reject defect at either bound returns 0 or 0.5 instead of 1.

cases("VO-1 C-4 question", [
  ["q = 0 (invalid), []", "0, []", 1],
  ["q = 1e-9 (valid), []", "1e-9, []", 1e-9],
  ["q = 1 (valid), []", "1, []", 1],
  ["q = 1.0000001 (invalid), []", "1.0000001, []", 1],
  ["q = 0 (invalid), lowering element", "0, [0.5]", 1],
  ["q = 1e-9 (valid), lowering element", "1e-9, [0.5]", 1e-9],
  ["q = 1 (valid), lowering element", "1, [0.5]", 0.5],
  ["q = 1.0000001 (invalid), lowering element", "1.0000001, [0.5]", 1],
]);

// ---------- VO-1 C-4 3-value BVA on elements (0 / 1e-9 / 1 / 1+1e-7), question 0.9 ----------

cases("VO-1 C-4 element", [
  ["element 0 (invalid)", "0.9, [0]", 1],
  ["element 1e-9 (valid, minimum)", "0.9, [1e-9]", 1e-9],
  ["element 1 (valid, question wins)", "0.9, [1]", 0.9],
  ["element 1.0000001 (invalid)", "0.9, [1.0000001]", 1],
]);

// ---------- VO-1 C-5 invalid-input partition (E-3: return 1, no throw) ----------
// Valid companions are chosen so that every non-rejecting defect returns something other than 1; element faults sit second, after a valid element.

cases("VO-1 C-5", [
  ["question NaN", "NaN, [0.5]", 1],
  ["question Infinity", "Infinity, [0.5]", 1],
  ['question "0.9"', '"0.9", [0.5]', 1],
  ["question undefined", "undefined, [0.5]", 1],
  ["zs null", "0.9, null", 1],
  ["zs {}", "0.9, {}", 1],
  ['zs "x"', '0.9, "x"', 1],
  ["second element null", "0.9, [0.95, null]", 1],
  ['second element "0.8"', '0.9, [0.95, "0.8"]', 1],
  ["second element NaN", "0.9, [0.95, NaN]", 1],
  ["second element undefined", "0.9, [0.95, undefined]", 1],
]);

// ---------- VO-1 C-6 edges: an array-like is not an Array; the v3 {z} element shape is invalid ----------

cases("VO-1 C-6", [
  ["array-like {length:1, 0:0.5}", "0.9, {length: 1, 0: 0.5}", 1],
  ["element {z:0.5} (v3 shape)", "0.9, [{z: 0.5}]", 1],
]);

// ---------- VO-1 argument immutability (Signatures: 인자를 바꾸지 않는다) ----------

test("VO-1 immutability: zs keeps its order, length and values after zoomLock(0.95, [0.97, 0.8, 0.9])", () => {
  const context = deck();
  assert.equal(typeof context.LTT?.placement?.zoomLock, "function", "LTT.placement.zoomLock is not a function after loading the deck chain");
  const out = vm.runInContext("(() => { const zs = [0.97, 0.8, 0.9]; const r = LTT.placement.zoomLock(0.95, zs); return { r, zs: Array.from(zs), keys: Object.keys(zs) }; })()", context);
  assert.equal(out.r, 0.8);
  assert.deepEqual(Array.from(out.zs), [0.97, 0.8, 0.9], "zs contents changed (sorted, rewritten or truncated)");
  assert.deepEqual(Array.from(out.keys), ["0", "1", "2"], "zs gained or lost own keys");
});

// ---------- VO-2 LTT.placement surface ----------

test("VO-2 FR-3: Object.keys(LTT.placement) is exactly [\"zoomLock\"] and it has no other own property", () => {
  const p = deck().LTT?.placement;
  assert.ok(p && typeof p === "object", `LTT.placement is ${p === null ? "null" : typeof p}`);
  assert.deepEqual(Object.keys(p), ["zoomLock"]);
  assert.deepEqual(Reflect.ownKeys(p).map(String), ["zoomLock"], "Signatures: LTT.placement has no other property");
});

test("VO-2 FR-3: LTT.placement.zoomLock is a function", () => {
  assert.equal(typeof deck().LTT?.placement?.zoomLock, "function");
});

test("VO-2 FR-3: zoomLock is callable in a vm context with no document and no window", () => {
  const context = deck();
  assert.equal(vm.runInContext("typeof document", context), "undefined", "test precondition: the vm context must have no document");
  assert.equal(vm.runInContext("typeof window", context), "undefined", "test precondition: the vm context must have no window");
  assert.equal(zoomLock("0.95, [0.9, 0.97]"), 0.9);
});
