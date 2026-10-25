// VO-6 shared assertion helper (QR-4, FR-1 R-ok / R-summary). Oracle: spec 6ed8f04e251d4b22 v1 Signatures and QR-4.
import assert from "node:assert/strict";

export const RULE_IDS = [
  "lib-version", "lib-source", "lib-missing", "chart-json", "chart-id", "chart-schema", "chart-url",
  "chart-build", "chart-no-points", "point-invalid", "point-mark", "point-param-unknown", "point-param-range",
  "point-row", "point-mismatch", "quiz-id", "quiz-kind", "quiz-options", "quiz-correct", "quiz-answer",
  "quiz-from", "quiz-mismatch", "point-group",
];

let mod;
export async function loadIndex() {
  mod ??= await import(new URL("../../src/index.mjs", import.meta.url));
  return mod;
}

export function assertReport(r, counts) {
  assert.equal(typeof r, "object");
  assert.deepEqual(Object.keys(r).sort(), ["errors", "ok", "summary", "unchecked"]);
  assert.ok(Array.isArray(r.errors) && Array.isArray(r.unchecked));
  assert.equal(r.ok, r.errors.length === 0, "R-ok");
  if (counts) {
    assert.deepEqual(r.summary, { ...counts, unchecked: r.unchecked.length }, "R-summary");
  }
  assert.equal(r.summary.unchecked, r.unchecked.length, "R-summary unchecked");
  for (const u of r.unchecked) {
    assert.equal(typeof u.quiz, "string");
    assert.ok(["no-from", "linked-point-unevaluated"].includes(u.reason));
  }
  for (const i of r.errors) {
    assert.ok(RULE_IDS.includes(i.rule), `rule ${i.rule}`);
    assert.equal(typeof i.message, "string");
    assert.ok(i.message.length >= 1 && i.message.length <= 300, "message length");
    if (i.rule.startsWith("chart-") || i.rule.startsWith("point-")) assert.equal(typeof i.chart, "string", `chart on ${i.rule}`);
    if (i.rule.startsWith("point-") && i.rule !== "point-invalid") assert.equal(typeof i.point, "string", `point on ${i.rule}`);
    if (i.rule === "point-invalid" && "point" in i) assert.equal(typeof i.point, "string");
    if (i.rule.startsWith("quiz-")) assert.equal(typeof i.quiz, "string", `quiz on ${i.rule}`);
    if (i.rule === "lib-version" || i.rule === "lib-source") assert.equal(typeof i.src, "string", `src on ${i.rule}`);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(r)), r, "JSON round-trip");
}

// QR-5: every checkHtml call in the suite goes through these spies (no rejection, zero writes).
export async function quietCheckHtml(html) {
  const { checkHtml } = await loadIndex();
  const writes = [];
  const saved = {};
  for (const m of ["log", "info", "warn", "error", "debug"]) {
    saved[m] = console[m];
    console[m] = (...a) => writes.push([m, a]);
  }
  const so = process.stdout.write, se = process.stderr.write;
  process.stdout.write = (...a) => (writes.push(["stdout", a]), true);
  process.stderr.write = (...a) => (writes.push(["stderr", a]), true);
  let r, err, rejected = false;
  try {
    r = await checkHtml(html);
  } catch (e) {
    rejected = true;
    err = e;
  } finally {
    Object.assign(console, saved);
    process.stdout.write = so;
    process.stderr.write = se;
  }
  assert.equal(rejected, false, `checkHtml rejected: ${err}`);
  assert.deepEqual(writes, [], "module wrote output");
  return r;
}

export async function check(pg) {
  const r = await quietCheckHtml(pg.html);
  assertReport(r, pg.counts);
  return r;
}

// Each expected entry lists only fields the spec states; a function value is a predicate.
export function assertIssues(r, expected) {
  assert.equal(r.errors.length, expected.length, `errors: ${JSON.stringify(r.errors)}`);
  expected.forEach((e, n) => {
    for (const [k, v] of Object.entries(e)) {
      if (typeof v === "function") assert.ok(v(r.errors[n][k]), `issue ${n} field ${k}: ${JSON.stringify(r.errors[n][k])}`);
      else assert.deepEqual(r.errors[n][k], v, `issue ${n} field ${k}`);
    }
  });
}

export const absent = (v) => v === undefined;
