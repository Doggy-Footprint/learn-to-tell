// E2E helpers: build a lesson with `ltt html` into a temp dir, serve it with a local static server, drive Chrome via playwright-core.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { ltt, copyLesson, tmpdir } from "./m1.mjs";

export const CHROME = process.env.LTT_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf", ".png": "image/png", ".svg": "image/svg+xml", ".wasm": "application/wasm", ".map": "application/json" };

export function buildSite(lessonFile) {
  const f = copyLesson(lessonFile);
  const out = path.join(path.dirname(f), "site");
  const r = ltt(["html", f, "--out", out]);
  if (r.status !== 0) throw new Error(`ltt html failed (${r.status}): ${r.stderr}`);
  return { lesson: f, out };
}
export function buildSiteFromSource(source) {
  const dir = tmpdir("ltt-src-");
  const f = path.join(dir, "lesson.js");
  fs.writeFileSync(f, source);
  return buildSite(f);
}

export function serve(dir) {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let p = path.join(dir, u);
    if (!p.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((r) => server.close(r)) })));
}

export async function launch() {
  const { chromium } = await import("playwright-core");
  if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}; set LTT_CHROME`);
  return chromium.launch({ executablePath: CHROME, headless: true });
}

export const VP = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };

/** Open a served lesson; returns { page, ctx, consoleErrors, pageErrors }. */
export async function open(browser, url, { viewport = "desktop", reducedMotion = "no-preference" } = {}) {
  const ctx = await browser.newContext({ viewport: VP[viewport], deviceScaleFactor: 1, reducedMotion, hasTouch: viewport === "mobile", isMobile: false });
  const page = await ctx.newPage();
  const consoleErrors = [], pageErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.__ltt === "object" && window.__ltt !== null, null, { timeout: 30000 });
  await page.evaluate(() => window.__ltt.ready());
  return { page, ctx, consoleErrors, pageErrors };
}

export async function goto(page, n) {
  await page.evaluate((k) => window.__ltt.goto(k), n);
  await page.evaluate(() => window.__ltt.ready());
}
export const state = (page) => page.evaluate(() => window.__ltt.state());

/** Wait until [data-ltt-text] rects and stage/card rects stop moving (two equal samples 100 ms apart, max 3 s). */
export async function settle(page) {
  let prev = "";
  for (let i = 0; i < 30; i++) {
    const cur = await page.evaluate(() => JSON.stringify([...document.querySelectorAll("[data-ltt-text], [data-ltt-stage], [data-ltt-card]")].map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, getComputedStyle(e).opacity]; })));
    if (cur === prev) return;
    prev = cur;
    await page.waitForTimeout(100);
  }
}

/** Press Tab until the focused element matches selector (keyboard-only reachability). */
export async function tabTo(page, selector, max = 300) {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((s) => !!document.activeElement && document.activeElement.matches(s), selector)) return true;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab never reached ${selector}`);
}
