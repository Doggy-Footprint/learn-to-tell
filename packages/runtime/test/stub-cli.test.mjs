// VO-7 (FR-18, C-30, QR-6) stub CLI exit codes and streams.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { STUB, tmpdir } from "./fixtures/helpers.mjs";

const dir = tmpdir("ltt-stubcli-");
const lesson = (check) => `export default (api) => api.lesson({
  meta: { title: "t", objectives: [{ id: "o1", text: "x" }], learner: { knows: [], misconceptions: [] }, domains: ["d"] },
  checks: [${check}],
  models: { m: api.model({ x: 1 }, (p) => p.x, "m") },
  figures: {}, sections: [], quiz: [], summary: { figures: [] },
});
`;
const write = (name, src) => { const f = path.join(dir, name); fs.writeFileSync(f, src); return f; };
const run = (file) => spawnSync(process.execPath, [STUB, file], { encoding: "utf8" });

test("VO-7 exit 0 for ok lesson, stdout is Report JSON with ok true", () => {
  const r = run(write("ok.mjs", lesson(`{ model: "m", expect: 1, tol: 0 }`)));
  assert.equal(r.status, 0, r.stderr);
  const rep = JSON.parse(r.stdout);
  assert.equal(rep.ok, true);
  assert.equal(rep.checks.length, 1);
});
test("VO-7 exit 1 for failing lesson, stdout is Report JSON with ok false", () => {
  const r = run(write("bad.mjs", lesson(`{ model: "m", expect: 2, tol: 0 }`)));
  assert.equal(r.status, 1, r.stderr);
  const rep = JSON.parse(r.stdout);
  assert.equal(rep.ok, false);
  assert.equal(rep.checks[0].pass, false);
});
test("VO-7 C-30 missing file -> exit 2, empty stdout, stderr reason, no file written", () => {
  const before = fs.readdirSync(dir).sort();
  const r = run(path.join(dir, "nope.mjs"));
  assert.equal(r.status, 2);
  assert.equal(r.stdout, "");
  assert.ok(r.stderr.trim().length > 0);
  assert.deepEqual(fs.readdirSync(dir).sort(), before);
});
for (const [name, src] of [["default is a number", "export default 42;\n"], ["no default export", "export const x = 1;\n"]]) {
  test(`VO-7 ${name} -> exit 2, empty stdout, stderr reason`, () => {
    const r = run(write(name.replace(/\W+/g, "-") + ".mjs", src));
    assert.equal(r.status, 2);
    assert.equal(r.stdout, "");
    assert.ok(r.stderr.trim().length > 0);
  });
}
