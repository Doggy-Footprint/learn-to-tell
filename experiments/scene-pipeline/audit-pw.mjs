// usage: node audit-pw.mjs <galleryDir> <rel.html>... -> JSON per target/size
import { chromium } from "playwright";
import { createLttServer } from "../../skills/learn-to-tell/server/server.mjs";
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
const [galleryDir, ...rels] = process.argv.slice(2);
const server = createLttServer({ home: mkdtempSync(join(tmpdir(), "ltth-")), galleryDir });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/gallery/`;
const browser = await chromium.launch();
const out = [];
for (const rel of rels) for (const [w, h] of [[1440, 900], [1280, 800]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = []; page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
  try {
    await page.goto(base + rel + "?audit", { waitUntil: "load", timeout: 20000 });
    await page.waitForSelector("#ltt-audit", { state: "attached", timeout: 15000 });
    const data = JSON.parse(await page.$eval("#ltt-audit", (n) => n.textContent));
    out.push({ rel, size: `${w}x${h}`, audit: data.audit, lint: data.lint, expectFails: data.expectFails, errors });
  } catch (e) { out.push({ rel, size: `${w}x${h}`, error: String(e.message).split("\n")[0], errors }); }
  await page.close();
}
await browser.close(); server.closeAllConnections(); server.close();
console.log(JSON.stringify(out, null, 1));
