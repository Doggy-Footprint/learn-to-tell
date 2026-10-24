import { existsSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Exit, writeHtml, serveDir, requireDist, logRun } from "./main.mjs";
import { VIEWPORTS } from "../layout/constants.mjs";

export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PER_SHEET = 6;

/** Chrome path from LTT_CHROME, else the macOS default unless LTT_CHROME_DEFAULT_OFF is set. */
export function chromePath() {
  const env = process.env.LTT_CHROME;
  if (env && existsSync(env)) return env;
  if (!process.env.LTT_CHROME_DEFAULT_OFF && existsSync(DEFAULT_CHROME)) return DEFAULT_CHROME;
  return null;
}

/**
 * In-page measurement of rendered text; runs in the browser.
 * @returns {{ kind: string; ids: string[] }[]}
 */
function measurePage() {
  const out = [];
  const lum = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    const f = (v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return { l: 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b), a, rgb: [r, g, b] };
  };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      const p = lum(c);
      if (p && p.a > 0.5) return p;
    }
    return { l: 1, a: 1, rgb: [255, 255, 255] };
  };
  const opacityOf = (el) => {
    let o = 1;
    for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  };
  const ratio = (fg, bg, op) => {
    const rgb = fg.rgb.map((v, i) => v * fg.a * op + bg.rgb[i] * (1 - fg.a * op));
    const f = (v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    const l = 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    return (Math.max(l, bg.l) + 0.05) / (Math.min(l, bg.l) + 0.05);
  };
  const vw = document.documentElement.clientWidth;
  if (document.scrollingElement.scrollWidth > vw + 1) out.push({ kind: "text-clipped", ids: ["document"] });
  const figTexts = [...document.querySelectorAll("[data-ltt-text]")].filter((e) => !e.closest(".ltt-ghost"));
  const rects = figTexts.map((e) => ({ id: e.getAttribute("data-ltt-text-id"), r: e.getBoundingClientRect(), e }));
  const over = new Set();
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].r;
      const b = rects[j].r;
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 1 && h > 1) over.add(`${rects[i].id}|${rects[j].id}`);
    }
  }
  for (const k of over) out.push({ kind: "text-overlap", ids: k.split("|") });
  const clipped = [];
  for (const { id, r, e } of rects) {
    const fig = e.closest("[data-ltt-figure]")?.getBoundingClientRect();
    if (fig && (r.left < fig.left - 1 || r.top < fig.top - 1 || r.right > fig.right + 1 || r.bottom > fig.bottom + 1)) clipped.push(id);
    if (r.right > vw + 1 || r.left < -1) clipped.push(id);
  }
  if (clipped.length) out.push({ kind: "text-clipped", ids: [...new Set(clipped)] });
  const small = [];
  const low = [];
  const label = (e) => e.getAttribute("data-ltt-text-id") ?? `${e.tagName.toLowerCase()}:${(e.textContent ?? "").trim().slice(0, 24)}`;
  const cardTexts = [];
  const card = document.querySelector("[data-ltt-card]");
  const stage = document.querySelector("[data-ltt-stage]");
  for (const root of [card, document.querySelector(".ltt-bar"), stage]) {
    if (!root) continue;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest("[data-ltt-text]") || el.closest(".ltt-ghost") || el.closest(".katex")) continue;
      if (!cardTexts.includes(el)) cardTexts.push(el);
    }
  }
  for (const e of figTexts) {
    const cs = getComputedStyle(e);
    if (parseFloat(cs.fontSize) < 12 - 0.01) small.push(label(e));
    const fg = lum(cs.color);
    const hint = e.getAttribute("data-ltt-bg");
    const hb = hint ? lum(`rgb(${[1, 3, 5].map((i) => parseInt(hint.slice(i, i + 2), 16)).join(",")})`) : null;
    if (fg && ratio(fg, hb ?? bgOf(e), opacityOf(e)) < 4.5 - 0.005) low.push(label(e));
  }
  for (const e of cardTexts) {
    if (e.closest("[disabled]") || e.closest(":disabled")) continue;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (parseFloat(cs.fontSize) < 16 - 0.01) small.push(label(e));
    const fg = lum(cs.color);
    if (fg && ratio(fg, bgOf(e), opacityOf(e)) < 4.5 - 0.005) low.push(label(e));
    if (card && card.contains(e)) {
      const cr = card.getBoundingClientRect();
      if (r.right > cr.right + 1 || r.left < cr.left - 1) clipped.push(label(e));
      const view = (e.closest(".ltt-card-body") ?? card).getBoundingClientRect();
      const x0 = Math.max(r.left, view.left);
      const x1 = Math.min(r.right, view.right);
      const y0 = Math.max(r.top, view.top);
      const y1 = Math.min(r.bottom, view.bottom);
      if (x1 - x0 < 1 || y1 - y0 < 1) continue;
      const hit = document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2);
      if (hit && hit !== e && !e.contains(hit) && !hit.contains(e)) clipped.push(label(e));
    }
  }
  if (small.length) out.push({ kind: "text-small", ids: small });
  if (low.length) out.push({ kind: "low-contrast", ids: low });
  const more = clipped.filter((x) => !out.some((o) => o.kind === "text-clipped" && o.ids.includes(x)));
  if (more.length) out.push({ kind: "text-clipped", ids: more });
  return out;
}

/** @param {any} page @param {{ kind: string; f: any; nsteps: number }} info */
async function settle(page, type, info) {
  if (type === "predict" || type === "quiz") {
    await page.evaluate(() => window.__ltt.answer(true));
    return;
  }
  if (info.kind === "loop") {
    const [a, b] = info.f.loop.span;
    await page.evaluate((t) => window.__ltt.freeze(t, 0), a + 0.6 * (b - a));
  } else if (info.nsteps > 0) await page.evaluate((n) => window.__ltt.freeze(n - 1, n - 1), info.nsteps);
  else if (info.kind === "idle") await page.evaluate(() => window.__ltt.freeze(0.5, 0));
}

/** @param {string[]} pos @param {Record<string, any>} flags */
export async function cmdSheet(pos, flags) {
  if (typeof flags.out !== "string") throw new Exit(2, "missing --out <dir>");
  const file = pos[0];
  if (!file) throw new Exit(2, "missing <lesson.js>");
  const abs = resolve(file);
  if (!existsSync(abs) || !statSync(abs).isFile()) throw new Exit(2, `file not found: ${file}`);
  const t0 = performance.now();
  const chrome = chromePath();
  if (!chrome) {
    process.stderr.write("ltt sheet: Chrome not found; set LTT_CHROME to the Chrome executable path\n");
    logRun(abs, "sheet", performance.now() - t0, 2, { runtimeErrors: 0, layoutViolations: 0, images: 0 });
    return 2;
  }
  try {
    requireDist();
  } catch (e) {
    process.stderr.write(`ltt sheet: ${e.message}\n`);
    logRun(abs, "sheet", performance.now() - t0, 1, { runtimeErrors: 0, layoutViolations: 0, images: 0 });
    return 1;
  }
  const out = resolve(flags.out);
  await mkdir(out, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "ltt-sheet-"));
  let server;
  let browser;
  /** @type {any} */
  const sheet = { scenes: [], runtimeErrors: [], layoutViolations: [] };
  let images = 0;
  let exit = 0;
  try {
    await writeHtml(abs, tmp);
    server = await serveDir(tmp, 0);
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--font-render-hinting=none"] });
    for (const vp of /** @type {const} */ (["desktop", "mobile"])) {
      const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], deviceScaleFactor: 1, hasTouch: vp === "mobile", isMobile: false });
      const page = await ctx.newPage();
      let current = -1;
      const runtimeError = (/** @type {string} */ message) => {
        if (!sheet.runtimeErrors.some((/** @type {any} */ r) => r.scene === current && r.message === message)) sheet.runtimeErrors.push({ scene: current, message: message.slice(0, 300) });
      };
      page.on("console", (/** @type {any} */ m) => {
        if (m.type() === "error") runtimeError(m.text());
      });
      page.on("pageerror", (/** @type {any} */ e) => runtimeError(String(e?.message ?? e)));
      await page.goto(server.url, { waitUntil: "load" });
      const ok = await page.waitForFunction(() => !!window.__ltt, null, { timeout: 15000 }).then(() => true, () => false);
      if (!ok) throw new Exit(2, "the lesson page did not start (no window.__ltt)");
      await page.evaluate(() => window.__ltt.ready());
      const info = await page.evaluate(() => window.__ltt.info());
      if (info.loadError) runtimeError(`load-error: ${info.loadError}`);
      if (vp === "desktop") sheet.scenes = info.scenes;
      /** @type {{ scene: number; state: string; type: string; png: string }[]} */
      const shots = [];
      for (const s of info.scenes) {
        current = s.index;
        await page.evaluate((n) => window.__ltt.goto(n), s.index);
        const ti = await page.evaluate(() => {
          const st = window.__ltt.state();
          return st;
        });
        void ti;
        const tinfo = await page.evaluate(timeInfoInPage);
        for (const state of /** @type {const} */ (["initial", "settled"])) {
          if (state === "initial") {
            const t0s = tinfo.kind === "loop" ? tinfo.f.loop.span[0] : 0;
            if (tinfo.kind !== "static" || tinfo.nsteps > 0) await page.evaluate(([t]) => window.__ltt.freeze(t, 0), [t0s]);
          } else await settle(page, s.type, tinfo);
          await page.evaluate(() => window.__ltt.ready());
          const v = await page.evaluate(measurePage);
          for (const x of v) sheet.layoutViolations.push({ scene: s.index, state, viewport: vp, kind: x.kind, ids: x.ids });
          const png = (await page.screenshot({ type: "png" })).toString("base64");
          shots.push({ scene: s.index, state, type: s.type, png });
        }
      }
      for (let g = 0; g * PER_SHEET < info.scenes.length; g++) {
        const group = shots.filter((x) => Math.floor(x.scene / PER_SHEET) === g);
        await composeSheet(ctx, group, vp, join(out, `${vp}-${g + 1}.png`));
        images++;
      }
      await ctx.close();
    }
    await writeFile(join(out, "sheet.json"), `${JSON.stringify(sheet, null, 2)}\n`);
    exit = sheet.runtimeErrors.length || sheet.layoutViolations.length ? 1 : 0;
    process.stdout.write(`${join(out, "sheet.json")}\n${images} images, ${sheet.runtimeErrors.length} runtime errors, ${sheet.layoutViolations.length} layout violations\n`);
  } catch (e) {
    exit = e instanceof Exit ? e.code : 2;
    process.stderr.write(`ltt sheet: ${e instanceof Error ? e.message : String(e)}\n`);
  } finally {
    await browser?.close().catch(() => {});
    await server?.close();
    rmSync(tmp, { recursive: true, force: true });
  }
  logRun(abs, "sheet", performance.now() - t0, exit, { runtimeErrors: sheet.runtimeErrors.length, layoutViolations: sheet.layoutViolations.length, images });
  return exit;
}

/** Runs in the page: time kind of the current scene's main figure. */
function timeInfoInPage() {
  const L = window.__ltt;
  return L.timeInfo ? L.timeInfo() : { kind: "static", f: {}, nsteps: 0 };
}

/**
 * Lays screenshots out on a page and captures it: rows of scenes, initial and settled side by side.
 * @param {any} ctx @param {{ scene: number; state: string; type: string; png: string }[]} shots @param {"desktop" | "mobile"} vp @param {string} file
 */
async function composeSheet(ctx, shots, vp, file) {
  const scale = vp === "desktop" ? 0.6 : 0.75;
  const w = Math.round(VIEWPORTS[vp].width * scale);
  const h = Math.round(VIEWPORTS[vp].height * scale);
  const cap = 22;
  const gap = 12;
  const scenes = [...new Set(shots.map((s) => s.scene))].sort((a, b) => a - b);
  /** @type {{ c: any; col: number; row: number }[]} */
  const cells = [];
  if (vp === "desktop") scenes.forEach((n, row) => ["initial", "settled"].forEach((st, col) => cells.push({ c: shots.find((x) => x.scene === n && x.state === st), col, row })));
  else ["initial", "settled"].forEach((st, row) => scenes.forEach((n, col) => cells.push({ c: shots.find((x) => x.scene === n && x.state === st), col, row })));
  const cols = vp === "desktop" ? 2 : scenes.length;
  const rows = vp === "desktop" ? scenes.length : 2;
  const W = gap + cols * (w + gap);
  const H = gap + rows * (h + cap + gap);
  const html = `<!doctype html><html><body style="margin:0;width:${W}px;height:${H}px;position:relative;background:#d9dde3;font:600 14px system-ui,sans-serif;overflow:hidden">
${cells
  .filter((x) => x.c)
  .map(({ c, col, row }) => `<div style="position:absolute;left:${gap + col * (w + gap)}px;top:${gap + row * (h + cap + gap)}px;width:${w}px"><div style="height:${cap}px;color:#1d2127">#${c.scene} ${c.type} · ${c.state}</div><img src="data:image/png;base64,${c.png}" style="display:block;width:${w}px;height:${h}px;background:#fff"></div>`)
  .join("\n")}
</body></html>`;
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => undefined))));
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H } });
  await page.close();
}
