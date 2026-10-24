// VO-17 (FR-29, FR-12, C-53, C-54, QR-10, QR-11) error guessing in Chrome: load-error blank page, render exception taking down
// the lesson, HTML interpretation of text, custom on*/script passthrough, KaTeX \href/\htmlClass, unimplemented figure breaking other scenes.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buildSiteFromSource, serve, launch, open, goto, settle, state } from "./fixtures/browser.mjs";

const META = `meta: { title: "t", objectives: [{ id: "o1", text: "x" }], learner: { knows: [], misconceptions: [] }, domains: ["d"] }`;
const CONCEPT = `concept: { id: "k", title: "k", definition: "d", level: 1 }`;
const XSS = `<img src=x onerror="window.__pwned=1">`;
const SOURCES = {
  loadError: `export default () => { throw new Error("factory exploded"); };\n`,
  noLesson: `export default () => undefined;\n`,
  inject: `export default (api) => api.lesson({ ${META}, checks: [], models: {},
  figures: {
    f: api.figure(api.cartesian({ x: [0, 10, "m"], y: [0, 10, "m"], static: "s" }), () => [
      api.label([5, 5], ${JSON.stringify(XSS)}, { id: "evil-label" }),
      api.math([2, 8], String.raw\`\\href{javascript:window.__pwned=3}{x} + \\htmlClass{evilclass}{y}\`, { id: "evil-math" }),
      api.custom({ id: "cu", why: "injection probe", bounds: [[6, 1], [9, 4]] }, ({ h }) => [
        h("script", {}, "window.__pwned = 4"),
        h("rect", { x: 0.1, y: 0.1, width: 0.8, height: 0.8, fill: "#336699", onclick: "window.__pwned = 5", onmouseover: "window.__pwned = 6" }),
        h("foreignObject", {}, "<b>x</b>"),
        h("circle", { cx: 0.5, cy: 0.5, r: 0.2, href: "javascript:window.__pwned=7" }),
      ]),
    ]),
  },
  sections: [{ ${CONCEPT}, scenes: [{ type: "hook", title: ${JSON.stringify(XSS)}, say: ${JSON.stringify("본문 " + XSS)}, figure: "f", focus: [] }] }],
  quiz: [], summary: { figures: ["f"] } });
`,
  partial: `export default (api) => api.lesson({ ${META}, checks: [], models: {},
  figures: {
    ok: api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.dot([0.5, 0.5], { id: "a" })]),
    boom: api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.custom({ id: "c", why: "throws", bounds: [[0, 0], [1, 1]] }, () => { throw new Error("render exploded"); })]),
    polar: api.figure(api.polar({ r: [0, 1, "m"], static: "s" }), () => [api.dot([0.5, 30], { id: "p" })]),
  },
  sections: [{ ${CONCEPT}, scenes: [
    { type: "hook", title: "정상", say: "정상 장면.", figure: "ok", focus: ["a"] },
    { type: "explain", title: "렌더 예외", say: "예외 장면.", figure: "boom", focus: [] },
    { type: "explain", title: "미구현", say: "polar 장면.", figure: "polar", focus: [] },
    { type: "explain", title: "다시 정상", say: "정상 장면 둘.", figure: "ok", focus: ["a"] },
  ] }],
  quiz: [], summary: { figures: ["ok"] } });
`,
};

let browser; const sites = {};
before(async () => {
  browser = await launch();
  for (const [k, src] of Object.entries(SOURCES)) sites[k] = await serve(buildSiteFromSource(src).out);
});
after(async () => { for (const s of Object.values(sites)) await s.close(); await browser?.close(); });

/** open() waits for __ltt.ready(); an erroring lesson may still expose the hook, so fall back to a plain load. */
async function openAny(site) {
  try { return await open(browser, sites[site].url); } catch {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const consoleErrors = []; page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    await page.goto(sites[site].url, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    return { page, ctx, consoleErrors, pageErrors: [] };
  }
}

for (const site of ["loadError", "noLesson"]) {
  test(`VO-17 C-53 ${site} lesson -> visible [data-ltt-error] panel (not a blank page) and a console error`, { timeout: 60000 }, async () => {
    const { page, ctx, consoleErrors } = await openAny(site);
    await page.waitForSelector("[data-ltt-error]", { state: "visible", timeout: 10000 });
    assert.ok((await page.locator("[data-ltt-error]").first().innerText()).trim().length > 0);
    assert.ok(consoleErrors.length >= 1);
    await ctx.close();
  });
}

test("VO-17 C-54 text, title, say, KaTeX and custom injection -> literal text shown, no executable element/attribute, nothing ran", { timeout: 60000 }, async () => {
  const { page, ctx } = await open(browser, sites.inject.url);
  await goto(page, 0);
  await settle(page);
  await page.mouse.move(10, 10);
  const r = await page.evaluate(() => {
    const root = document.querySelector("[data-ltt-scene]");
    const all = [...root.querySelectorAll("*")];
    return {
      pwned: window.__pwned,
      imgs: root.querySelectorAll("img").length,
      scripts: root.querySelectorAll("script").length,
      foreign: root.querySelectorAll("foreignObject b").length,
      onAttrs: all.flatMap((e) => [...e.attributes].filter((a) => /^on/i.test(a.name)).map((a) => `${e.tagName}.${a.name}`)),
      jsHref: all.filter((e) => [...e.attributes].some((a) => /href$/i.test(a.name) && /javascript:/i.test(a.value))).length,
      evilClass: root.querySelectorAll(".evilclass").length,
      katex: root.querySelectorAll('[data-ltt-mark="evil-math"] .katex').length,
      text: root.textContent,
      customShapes: root.querySelectorAll('[data-ltt-mark="cu"] :is(path, rect, circle, ellipse, line, polyline, polygon)').length,
    };
  });
  const rect = page.locator('[data-ltt-mark="cu"] :is(path, rect, circle, ellipse, line, polyline, polygon)').first();
  if (await rect.count()) { await rect.hover({ force: true }); await rect.click({ force: true }); }
  assert.equal(await page.evaluate(() => window.__pwned), undefined, "no injected code ran");
  assert.equal(r.pwned, undefined);
  assert.equal(r.imgs, 0);
  assert.equal(r.scripts, 0);
  assert.equal(r.foreign, 0);
  assert.deepEqual(r.onAttrs, []);
  assert.equal(r.jsHref, 0);
  assert.ok(r.katex >= 1, "math mark rendered by KaTeX (else the href/htmlClass checks are vacuous)");
  assert.equal(r.evilClass, 0);
  assert.ok(r.text.includes("<img src=x"), "label/title/say text shown literally");
  assert.ok(r.customShapes >= 1, "allowed custom shapes still drawn (any SVG shape element, spec v4)");
  await ctx.close();
});

test("VO-17 render exception and unimplemented figure stay local: error panel in that scene only, other scenes render", { timeout: 60000 }, async () => {
  const { page, ctx } = await open(browser, sites.partial.url);
  const panels = [];
  for (const n of [0, 1, 2, 3]) {
    await goto(page, n);
    await settle(page);
    assert.equal((await state(page)).scene, n);
    assert.equal(await page.locator(`[data-ltt-scene="${n}"]`).count(), 1);
    panels.push(await page.locator("[data-ltt-error]").count());
  }
  assert.equal(panels[0], 0);
  assert.ok(panels[1] >= 1, "render exception -> error panel");
  assert.ok(panels[2] >= 1, "unimplemented -> error panel in place of the figure");
  assert.equal(panels[3], 0, "later scene renders normally");
  await goto(page, 3);
  assert.ok(await page.locator('[data-ltt-mark="a"]').count() >= 1);
  await ctx.close();
});
