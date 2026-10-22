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
const home = await mkdtemp(join(tmpdir(), "ltt-shots-"));
try {
  const results = await audit({ targets: galleryTargets(), chrome, home });
  console.log(formatReport(results));
  const code = exitCode(results);
  if (write && code < 2) {
    const baseline = {};
    for (const r of results) (baseline[r.size] ??= {})[r.target] = r.check.length;
    await writeFile(BASELINE, JSON.stringify(baseline, null, 2) + "\n");
    console.log(`기준선을 ${BASELINE}에 썼다`);
    process.exit(0);
  }
  process.exit(code);
} finally {
  await rm(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
}
