// usage: node record.mjs <outDir> <rel.html>...  (rel는 gallery/ 기준) -> <outDir>/<slug>.webm
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { createLttServer } from "/home/user/learn-to-tell/skills/learn-to-tell/server/server.mjs";
import { mkdtempSync, mkdirSync, renameSync } from "node:fs"; import { tmpdir } from "node:os"; import { join, resolve, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const [outDir, ...rels] = process.argv.slice(2); mkdirSync(outDir, { recursive: true });
const server = createLttServer({ home: mkdtempSync(join(tmpdir(), "ltth-")), galleryDir: resolve(here, "gallery") });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/gallery/`;
const browser = await chromium.launch();
await Promise.all(rels.map(async (rel) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: join(outDir, "tmp-" + rel.replace(/\W+/g, "-")), size: { width: 1280, height: 800 } } });
  const page = await ctx.newPage();
  await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "#ltt-expect{display:none!important}"; document.head.append(s); }));
  await page.goto(base + rel, { waitUntil: "load" }).catch(() => {});
  await page.waitForTimeout(11500);
  const v = page.video(); await ctx.close();
  renameSync(await v.path(), join(outDir, rel.split("/").at(-2) === "orig" ? rel.split("/").at(-1).slice(0, 3) + "-orig.webm" : rel.split("/").at(-2) + ".webm"));
}));
await browser.close(); server.closeAllConnections(); server.close();
