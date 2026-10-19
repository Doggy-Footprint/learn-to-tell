import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { audit, findChrome, galleryTargets } from "../skills/learn-to-tell/server/audit.mjs";

const raw = JSON.parse(readFileSync(new URL("./gallery-audit.baseline.json", import.meta.url), "utf8"));
// Spec 6cc24f891a69c407 A-10/QR-3: still-visual has its own per-page allowance (measured after the run); every other rule stays at the per-page counts.
const STILL = "still-visual";
const stillAllow = raw[STILL] ?? {};
const baseline = Object.fromEntries(Object.entries(raw).filter(([k]) => k !== STILL));
const chrome = findChrome();
const skip = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
  : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;

test("gallery decks stay at or under the audit baseline in both sizes", { skip }, async () => {
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
      const allowed = baseline[r.size][r.target] ?? 0;
      const others = r.audit.filter((w) => w.rule !== STILL);
      const still = r.audit.filter((w) => w.rule === STILL);
      const stillAllowed = stillAllow[r.size]?.[r.target] ?? 0;
      if (others.length > allowed) problems.push(`${at}: audit ${others.length} > ${allowed}\n` + others.map((w) => `    장면 ${w.scene} [${w.rule}]: ${w.msg}`).join("\n"));
      if (still.length > stillAllowed) problems.push(`${at}: ${STILL} ${still.length} > ${stillAllowed}\n` + still.map((w) => `    장면 ${w.scene}: ${w.msg}`).join("\n"));
      if (r.lint.length) problems.push(`${at}: lint ${r.lint.map((w) => w.msg).join(" / ")}`);
      if (r.expectFails.length) problems.push(`${at}: ${r.expectFails.join(" / ")}`);
    }
    assert.deepEqual(problems, []);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
