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

test("gallery decks stay at or under the audit baseline in both sizes", { skip }, async () => {
  const home = await mkdtemp(join(tmpdir(), "ltt-audit-test-"));
  try {
    const results = await audit({ targets: galleryTargets(), sizes: Object.keys(baseline), chrome, home });
    const problems = [];
    for (const r of results) {
      const at = `${r.size} ${r.target}`;
      if (r.error) {
        problems.push(`${at}: ${r.error}`);
        continue;
      }
      const allowed = baseline[r.size][r.target] ?? 0;
      if (r.audit.length > allowed) problems.push(`${at}: audit ${r.audit.length} > ${allowed}\n` + r.audit.map((w) => `    장면 ${w.scene} [${w.rule}]: ${w.msg}`).join("\n"));
      if (r.lint.length) problems.push(`${at}: lint ${r.lint.map((w) => w.msg).join(" / ")}`);
      if (r.expectFails.length) problems.push(`${at}: ${r.expectFails.join(" / ")}`);
    }
    assert.deepEqual(problems, []);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
