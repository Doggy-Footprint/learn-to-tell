import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { audit, exitCode, findChrome, formatReport, galleryTargets, NO_CHROME } from "../skills/learn-to-tell/server/audit.mjs";

const BASELINE = fileURLToPath(new URL("../tests/gallery-audit.baseline.json", import.meta.url));
const write = process.argv.includes("--write-baseline");
const chrome = findChrome();
if (!chrome) {
  console.error(NO_CHROME);
  process.exit(2);
}
const home = await mkdtemp(join(tmpdir(), "ltt-audit-"));
try {
  const results = await audit({ targets: galleryTargets(), chrome, home });
  console.log(formatReport(results));
  const code = exitCode(results);
  if (write && code < 2) {
    // still-visual keeps its own allowance (ADR 61d6c4210ba48008: gallery lessons are not edited for new rules).
    const baseline = {}, still = {};
    for (const r of results) {
      const n = r.audit.filter((w) => w.rule === "still-visual").length;
      (baseline[r.size] ??= {})[r.target] = r.audit.length - n;
      (still[r.size] ??= {})[r.target] = n;
    }
    baseline["still-visual"] = still;
    await writeFile(BASELINE, JSON.stringify(baseline, null, 2) + "\n");
    console.log(`기준선을 ${BASELINE}에 썼다`);
    process.exit(0);
  }
  process.exit(code);
} finally {
  await rm(home, { recursive: true, force: true });
}
