import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
export const STUB = path.join(ROOT, "packages/runtime/dev/spec-stub.mjs");
export const COUNT = path.join(ROOT, "bench/coverage/count.mjs");
export const EXAMPLE = path.join(ROOT, "skill/learn-to-tell/examples/projectile-drag.js");

export const API_MEMBERS = [
  "lesson", "model", "figure", "custom",
  "cartesian", "polar", "lanes", "graph", "cells", "space3d", "geo",
  "axis", "grid", "legend", "line", "area", "dot", "circle", "rect", "arc", "arrow", "path", "label", "dim", "angle", "brace", "node", "edge", "cell", "field", "glyph", "icon", "math", "code", "mock",
  "trace", "flow", "sweep", "inset",
  "split", "multiples",
  "ode", "rng", "argmax", "root", "sample", "histogram", "interpolate",
];

export function tmpdir(prefix = "ltt-test-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Minimal LessonInput with overrides; the stub is a black box so only spec'd fields are used. */
export function input(over = {}) {
  return {
    meta: { title: "t", objectives: [{ id: "o1", text: "x" }], learner: { knows: [], misconceptions: [] }, domains: ["physics"] },
    checks: [],
    models: {},
    figures: {},
    sections: [],
    quiz: [],
    summary: { figures: [] },
    ...over,
  };
}

export const near = (a, b, tol) => Math.abs(a - b) <= tol;
