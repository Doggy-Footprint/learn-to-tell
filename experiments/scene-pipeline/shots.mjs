// usage: node shots.mjs <outDir> <prefix> <rel.html> [--small] [--checks-only]  (rel는 gallery/ 기준)
// 기본 화면(시각 3개, 단계마다 마지막 상태, 손잡이 양 끝)과 장면 안 #ltt-checks 지점을 찍고 <outDir>/<prefix>-index.json에 남긴다.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { createLttServer } from "/home/user/learn-to-tell/skills/learn-to-tell/server/server.mjs";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"; import { tmpdir } from "node:os"; import { join, resolve, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), flags = new Set(args.filter((a) => a.startsWith("--")));
const [outDir, prefix, rel] = args.filter((a) => !a.startsWith("--")); mkdirSync(outDir, { recursive: true });
const small = flags.has("--small"), checksOnly = flags.has("--checks-only");
const server = createLttServer({ home: mkdtempSync(join(tmpdir(), "ltth-")), galleryDir: resolve(here, "gallery") });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/gallery/${rel}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "#ltt-expect{display:none!important}"; document.head.append(s); }));
const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
const index = [];
const open = async () => { await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(300); };
const snap = async (name, note = "") => {
  const file = `${prefix}-${name}.${small ? "jpg" : "png"}`;
  await page.screenshot({ path: join(outDir, file), ...(small ? { type: "jpeg", quality: 70, scale: "css" } : {}) });
  index.push({ name, file, note });
};
const next = () => page.locator(".ltt-stepper button", { hasText: "다음" }).first();
async function act(a) {
  if (a.wait != null) return page.waitForTimeout(a.wait);
  if (a.step != null) { for (let i = 1; i < a.step; i++) { await next().click({ timeout: 2000 }); await page.waitForTimeout(400); } return; }
  if (a.knob != null) {
    const el = page.locator(`#${a.knob}`);
    if (a.stop != null) return el.locator("button").nth(a.stop).click({ timeout: 2000 });
    return el.evaluate((n, v) => { n.value = v; n.dispatchEvent(new Event("input", { bubbles: true })); n.dispatchEvent(new Event("change", { bubbles: true })); }, a.value);
  }
  if (a.click != null) return page.locator(a.click).first().click({ timeout: 2000 });
  throw new Error("모르는 동작 " + JSON.stringify(a));
}
try {
  await open();
  if (!checksOnly) {
    await page.waitForTimeout(700); await snap("t1s");
    await page.waitForTimeout(3000); await snap("t4s");
    await page.waitForTimeout(4000); await snap("t8s");
    const nSteps = await page.locator(".ltt-stepper .ltt-dots i").count();
    if (nSteps) { await open(); for (let i = 0; i < Math.min(nSteps, 8); i++) { if (i) await next().click(); await page.waitForTimeout(2500); await snap(`step${i + 1}`); } }
    const knobs = await page.$$eval(".ltt-steps[id], input[type=range][id]", (ns) => ns.map((n) => ({ id: n.id, range: n.tagName === "INPUT", min: n.min, max: n.max, n: n.querySelectorAll("button").length })));
    for (const k of knobs.slice(0, 3)) for (const end of ["min", "max"]) {
      await open();
      await act(k.range ? { knob: k.id, value: end === "min" ? k.min : k.max } : { knob: k.id, stop: end === "min" ? 0 : k.n - 1 });
      await page.waitForTimeout(2000); await snap(`knob-${k.id}-${end}`);
    }
  }
  const checks = await page.$eval("#ltt-checks", (n) => JSON.parse(n.textContent)).catch(() => null);
  if (!checks) index.push({ name: "checks", file: null, note: "#ltt-checks 없음 또는 JSON 오류" });
  for (const c of checks || []) {
    await open();
    try { for (const a of c.reach || []) await act(a); if (!(c.reach || []).some((a) => a.wait != null)) await page.waitForTimeout(1500); await snap(`check-${c.id}`, c.expect); }
    catch (e) { index.push({ name: `check-${c.id}`, file: null, note: `도달 실패: ${String(e.message).split("\n")[0]}`, expect: c.expect }); }
  }
} catch (e) { index.push({ name: "load", file: null, note: String(e.message).split("\n")[0] }); }
writeFileSync(join(outDir, `${prefix}-index.json`), JSON.stringify({ rel, errors, shots: index }, null, 1));
await browser.close(); server.closeAllConnections(); server.close();
console.log(`${prefix}: ${index.filter((x) => x.file).length} shots, ${index.filter((x) => !x.file).length} misses, ${errors.length} errors`);
