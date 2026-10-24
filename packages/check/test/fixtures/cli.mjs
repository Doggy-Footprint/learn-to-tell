// CLI helpers for VO-4, VO-7, VO-8: spawn the public CLI path, write temp files under os.tmpdir().
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = fileURLToPath(new URL("../../../../", import.meta.url));
export const CLI = join(REPO, "packages/check/bin/ltt-check.mjs");
const dir = mkdtempSync(join(tmpdir(), "ltt-check-test-"));
let n = 0;

export function tempHtml(html) {
  const p = join(dir, `f${n++}.html`);
  writeFileSync(p, html, "utf8");
  return p;
}

export const tempMissing = () => join(dir, "does-not-exist.html");

export function runCli(args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: "utf8", timeout: 60000 });
}
