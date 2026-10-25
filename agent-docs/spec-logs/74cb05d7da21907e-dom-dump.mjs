// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// Usage: node 74cb05d7da21907e-dom-dump.mjs <repo> <outDir> [sizes=1440x900,1280x800]
// 0041d668222ce019-dom-dump.mjs와 같고 크기 목록만 인자로 받는다.
// Dumps the ?audit DOM of every gallery page at 1440x900 and 1280x800 (all scenes mounted by audit()).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [repo, out, sizeArg = "1440x900,1280x800"] = process.argv.slice(2);
const SIZES = sizeArg.split(",");
const { galleryTargets, findChrome } = await import(join(repo, "skills/learn-to-tell/server/audit.mjs"));
const { createLttServer } = await import(join(repo, "skills/learn-to-tell/server/server.mjs"));
const gallery = join(repo, "site/gallery");
const home = mkdtempSync(join(tmpdir(), "ltt-dom-home-"));
const server = createLttServer({ home, galleryDir: gallery });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const chrome = findChrome();
mkdirSync(out, { recursive: true });
const runs = [];
for (const f of galleryTargets(gallery)) for (const size of SIZES) runs.push({ rel: f.slice(gallery.length + 1), size });
function run(r, i, budget = 12000, attempt = 1) {
  const prof = mkdtempSync(join(tmpdir(), "ltt-dom-p-"));
  return new Promise((done) => {
    const c = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", `--user-data-dir=${prof}`, `--window-size=${r.size.replace("x", ",")}`, `--virtual-time-budget=${budget}`, "--dump-dom", `${base}/gallery/${r.rel}?audit`], { stdio: ["ignore", "pipe", "ignore"] });
    let s = ""; c.stdout.setEncoding("utf8"); c.stdout.on("data", (d) => (s += d));
    c.on("close", () => { rmSync(prof, { recursive: true, force: true }); done(s); });
  }).then((s) => (!s.includes('id="ltt-audit"') && attempt < 3 ? run(r, i, budget * 3, attempt + 1) : s));
}
let next = 0;
await Promise.all([0, 1].map(async () => {
  while (next < runs.length) {
    const i = next++, r = runs[i];
    const s = await run(r, i);
    writeFileSync(join(out, `${r.size}__${r.rel.replace(/\//g, "__")}`), s);
  }
}));
server.closeAllConnections(); server.close(); rmSync(home, { recursive: true, force: true });
console.log("dumped", runs.length);
