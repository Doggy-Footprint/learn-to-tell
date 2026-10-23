// VO-11 (FR-50, C-39) rules.md table; VO-12 (FR-5, FR-6, QR-3, QR-7, QR-8) contract/example file checks.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXAMPLE } from "./fixtures/helpers.mjs";

const RULE_IDS = "first-scene, section-count, scene-count, predict-before-explain, section-quiz, final-quiz-count, misconception-predict, predict-reveal-hidden, focus-required, focus-unknown-id, accent-focus-only, quiz-objective, quiz-distractor-feedback, quiz-transfer, term-defined-before-use, term-unknown, model-limit-check, check-tol-required, provenance, illustrative-label, model-pure, figure-or-none, time-declared, custom-why, custom-bounds, id-unique, data-in-domain, text-length, goal-reachable, goal-at-start, input-binding, figure-eval, handle-binding, multiples-param, reveal-figure-exists, legend-for-series".split(", ");

function rulesRows() {
  const md = fs.readFileSync(path.join(ROOT, "packages/runtime/rules.md"), "utf8");
  const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim());
  const lines = md.split("\n").filter((l) => l.trim().startsWith("|"));
  const header = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  return { header, rows };
}
test("VO-11 rules.md header has 6 columns", () => {
  assert.equal(RULE_IDS.length, 36);
  assert.equal(rulesRows().header.length, 6);
});
test("VO-11 C-39 all 36 FR-50 ids present, every row has 6 non-empty cells, layer is type/check/runtime", () => {
  const { rows } = rulesRows();
  const ids = rows.map((r) => r[0].replace(/`/g, ""));
  assert.deepEqual(RULE_IDS.filter((id) => !ids.includes(id)), []);
  for (const r of rows) {
    assert.equal(r.length, 6, r.join("|"));
    assert.ok(r.every((c) => c.length > 0), r.join("|"));
    assert.match(r[3], /type|check|runtime/, r[0]);
  }
});
test("VO-11 text-length row states 40 / 160 / 50", () => {
  const r = rulesRows().rows.find((x) => x[0].replace(/`/g, "") === "text-length");
  const t = r.join(" ");
  for (const n of ["40", "160", "50"]) assert.match(t, new RegExp(`(^|\\D)${n}(\\D|$)`), n);
});

const TYPES = path.join(ROOT, "packages/runtime/types");
const dts = () => fs.readFileSync(path.join(TYPES, "lesson.d.ts"), "utf8");
test("VO-12 QR-3 lesson.d.ts <= 21,000 bytes", () => {
  assert.ok(fs.statSync(path.join(TYPES, "lesson.d.ts")).size <= 21000);
});
test("VO-12 QR-3 example lesson <= 18,432 bytes", () => {
  assert.ok(fs.statSync(EXAMPLE).size <= 18432);
});
test("VO-12 QR-8 no Hangul in lesson.d.ts", () => {
  assert.doesNotMatch(dts(), /[ᄀ-ᇿ㄰-㆏가-힯]/);
});
test("VO-12 QR-8 every JSDoc block <= 25 words", () => {
  const over = (dts().match(/\/\*\*[\s\S]*?\*\//g) ?? [])
    .map((b) => b.replace(/^\/\*\*|\*\/$/g, "").replace(/^\s*\*/gm, " ").trim())
    .filter((b) => b.split(/\s+/).filter(Boolean).length > 25);
  assert.deepEqual(over, []);
});
test("VO-12 QR-7/FR-5 ext/space3d.d.ts and ext/geo.d.ts exist and core references both", () => {
  for (const f of ["space3d", "geo"]) {
    assert.ok(fs.existsSync(path.join(TYPES, "ext", `${f}.d.ts`)), f);
    assert.match(dts(), new RegExp(`["']\\./ext/${f}(\\.js|\\.d\\.ts|\\.mjs)?["']`), f);
  }
});
