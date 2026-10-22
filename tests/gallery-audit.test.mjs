import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { audit, findChrome, galleryTargets } from "../skills/learn-to-tell/server/audit.mjs";

const baseline = JSON.parse(readFileSync(new URL("./gallery-audit.baseline.json", import.meta.url), "utf8"));
const chrome = findChrome();
const skip = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
  : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;

test("gallery decks report no error and the baseline check count in both sizes", { skip }, async () => {
  const home = await mkdtemp(join(tmpdir(), "ltt-audit-test-"));
  try {
    const results = await audit({ targets: galleryTargets(), sizes: Object.keys(baseline), chrome, home, jobs: 2 });
    // Spec 1e62814b16984176 VO-3 GA-1..GA-26: a page or size missing from the run would otherwise pass unaudited.
    const want = Object.entries(baseline).flatMap(([size, pages]) => Object.keys(pages).map((p) => `${size} ${p}`)).sort();
    assert.deepEqual(results.map((r) => `${r.size} ${r.target}`).sort(), want, "audited size × page pairs differ from the baseline keys");
    const problems = [];
    for (const r of results) {
      const at = `${r.size} ${r.target}`;
      if (r.error) {
        problems.push(`${at}: ${r.error}`);
        continue;
      }
      // Spec 76b739afacf5b868 VO-10 (QR-3, D-7): the baseline is the per-target #ltt-check error count; equality, not a ceiling.
      assert.ok(Array.isArray(r.check), `${at}: result has no check array`);
      const want = baseline[r.size][r.target];
      if (r.check.length !== want) problems.push(`${at}: check ${r.check.length} != baseline ${want}\n` + r.check.map((w) => `    ${w.where} [${w.rule}]: ${w.msg}`).join("\n"));
    }
    assert.deepEqual(problems, []);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
