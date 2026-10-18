// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// R-5 (spec 0041d668222ce019 v3): dumps the ?audit DOM of the R-5 fixture lesson served by <repo>'s server.
// Usage: node r5-dump.mjs <repo> <fixture.html> <out.html> [query]
import { spawn } from "node:child_process";
import { mkdirSync, copyFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [repo, fixture, out, query = ""] = process.argv.slice(2);
const { findChrome } = await import(join(repo, "skills/learn-to-tell/server/audit.mjs"));
const { createLttServer } = await import(join(repo, "skills/learn-to-tell/server/server.mjs"));
const home = mkdtempSync(join(tmpdir(), "ltt-r5-home-"));
mkdirSync(join(home, "lessons", "r5-fixture"), { recursive: true });
copyFileSync(fixture, join(home, "lessons", "r5-fixture", "lesson.html"));
const server = createLttServer({ home, galleryDir: join(repo, "site/gallery") });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/lessons/r5-fixture/lesson.html?audit${query ? "&" + query : ""}`;
const prof = mkdtempSync(join(tmpdir(), "ltt-r5-p-"));
const s = await new Promise((done) => {
  const c = spawn(findChrome(), ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", `--user-data-dir=${prof}`, "--window-size=1440,900", "--virtual-time-budget=12000", "--dump-dom", url], { stdio: ["ignore", "pipe", "ignore"] });
  let o = ""; c.stdout.setEncoding("utf8"); c.stdout.on("data", (d) => (o += d)); c.on("close", () => done(o));
});
server.closeAllConnections(); server.close(); rmSync(prof, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true });
writeFileSync(out, s.replace(/\?audit&partial/g, "?audit"));
console.log(s.includes('id="ltt-audit"') ? "audit-ok" : "NO-AUDIT", s.length);
