// VO-1 (FR-1, C-1) src/core carries the M0 stub exports and dev/spec-stub.mjs re-exports the same bindings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CORE } from "./fixtures/m1.mjs";
import { STUB } from "./fixtures/helpers.mjs";

const core = await import(CORE);
const stub = await import(STUB);
const NAMES = ["createApi", "load", "evaluate", "bindingErrors", "ode", "rng", "argmax", "root", "sample", "histogram", "interpolate"];

test("VO-1 src/core exports every M0 stub export as a function", () => {
  for (const n of NAMES) assert.equal(typeof core[n], "function", n);
});
test("VO-1 dev/spec-stub.mjs re-exports the src/core bindings (same function objects)", () => {
  for (const n of NAMES) assert.equal(stub[n], core[n], n);
});
