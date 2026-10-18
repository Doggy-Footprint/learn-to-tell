// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// Ledger 4 (spec 74cb05d7da21907e): E re-measurement with the predict scene current (visible) instead of hidden audit mounts.
// Usage: node 74cb05d7da21907e-e-remeasure.mjs <patched repo copy (measure-patch.py --visible-only)> <out.json>
// Scene list = predict scenes found by R-2 (74cb05d7da21907e-r2-base-reveal.json). Loads <page>?audit#<scene> at 1440x900 and 1280x800.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const [repo, outFile] = process.argv.slice(2);
const here = dirname(fileURLToPath(import.meta.url));
const { findChrome } = await import(join(repo, "skills/learn-to-tell/server/audit.mjs"));
const { createLttServer } = await import(join(repo, "skills/learn-to-tell/server/server.mjs"));
const home = mkdtempSync(join(tmpdir(), "ltt-e2-home-"));
const server = createLttServer({ home, galleryDir: join(repo, "site/gallery") });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const rows = JSON.parse(readFileSync(join(here, "74cb05d7da21907e-r2-base-reveal.json"), "utf8")).rows;
const scenes = [...new Map(rows.map((r) => [r.rel + "#" + r.scene, { rel: r.rel, scene: r.scene }])).values()];
const runs = scenes.flatMap((s) => ["1440x900", "1280x800"].map((size) => ({ ...s, size })));
function dump(r) {
  const prof = mkdtempSync(join(tmpdir(), "ltt-e2-p-"));
  return new Promise((done) => {
    const c = spawn(findChrome(), ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", `--user-data-dir=${prof}`,
      `--window-size=${r.size.replace("x", ",")}`, "--virtual-time-budget=12000", "--dump-dom", `${base}/gallery/${r.rel}?audit#${r.scene}`], { stdio: ["ignore", "pipe", "ignore"] });
    let s = ""; c.stdout.setEncoding("utf8"); c.stdout.on("data", (d) => (s += d));
    c.on("close", () => { try { rmSync(prof, { recursive: true, force: true }); } catch {} done(s); });
  });
}
const out = [];
let next = 0;
await Promise.all([0, 1].map(async () => {
  while (next < runs.length) {
    const r = runs[next++];
    const s = await dump(r);
    const m = /<script[^>]*id="ltt-measure"[^>]*>([\s\S]*?)<\/script>/.exec(s);
    const rec = m ? JSON.parse(m[1]).predict[r.scene] : null;
    out.push({ ...r, zInflow: rec && +rec.zInflow.toFixed(4), zFloat: rec && +rec.zFloat.toFixed(4), gain: rec && +rec.gain.toFixed(4),
      floats: rec && rec.choices.map((c) => `${c.id}:${c.floats ? "F" : "-"}`).join(" "), missing: !rec });
  }
}));
server.closeAllConnections(); server.close(); rmSync(home, { recursive: true, force: true });
out.sort((a, b) => (a.size + a.rel + a.scene).localeCompare(b.size + b.rel + b.scene));
const res = { threshold: 0.02, realCases: out.filter((r) => r.gain > 0.02).length, maxGain: Math.max(0, ...out.map((r) => r.gain || 0)), rows: out };
writeFileSync(outFile, JSON.stringify(res, null, 1));
console.log("real", res.realCases, "max", res.maxGain, "missing", out.filter((r) => r.missing).length);
