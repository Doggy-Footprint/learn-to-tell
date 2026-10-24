// VO-14 (FR-20..FR-28, FR-30, C-41..C-50, C-55, QR-8) scene/input UI in Chrome through the DOM contract and window.__ltt;
// VO-18 QR-4 frame-interval p95. State-transition + scenario tests on fixture lessons (scene indices from globalScenes()).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { shuffledOrder, CORE, EXAMPLE, LESSONS_DIR, globalScenes, importFile } from "./fixtures/m1.mjs";
import { buildSite, buildSiteFromSource, serve, launch, open, goto, state, settle, tabTo } from "./fixtures/browser.mjs";

const { load } = await import(CORE);
const COFFEE = path.join(LESSONS_DIR, "coffee-cooling.js"), BATTERY = path.join(LESSONS_DIR, "battery-supply.js");
const coffeeScenes = globalScenes(load(await importFile(COFFEE)).input);
const batteryScenes = globalScenes(load(await importFile(BATTERY)).input);
const idx = (scenes, pred) => scenes.findIndex(pred);
const C = {
  hook: idx(coffeeScenes, (s) => s.type === "hook"),
  choice: idx(coffeeScenes, (s) => s.type === "predict" && s.scene.input.kind === "choice"),
  drag: idx(coffeeScenes, (s) => s.type === "predict" && s.scene.input.kind === "drag"),
  draw: idx(coffeeScenes, (s) => s.type === "predict" && s.scene.input.kind === "draw"),
  quiz1: idx(coffeeScenes, (s) => s.type === "quiz" && s.scene.items.length === 3),
  explore: idx(coffeeScenes, (s) => s.type === "explore"),
  compare: idx(coffeeScenes, (s) => s.type === "compare"),
  camera: idx(coffeeScenes, (s) => s.scene.figure === "camera"),
  steam: idx(coffeeScenes, (s) => s.scene.figure === "steam"),
  final: coffeeScenes.length - 2,
  summary: coffeeScenes.length - 1,
  defineK: idx(coffeeScenes, (s) => s.type === "define" && s.scene.term === "냉각 상수"),
};
const B = { steps: idx(batteryScenes, (s) => s.type === "steps") };

const GLOSSARY = `export default (api) => api.lesson({
  meta: { title: "t", objectives: [{ id: "o1", text: "x" }], learner: { knows: [], misconceptions: [] }, domains: ["d"] },
  glossary: { 속도계: "속도를 재는 계기판 바늘" },
  checks: [], models: {},
  figures: { f: api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.dot([0.5, 0.5], { id: "a" })]) },
  sections: [{ concept: { id: "k", title: "k", definition: "d", level: 1 }, scenes: [
    { type: "hook", title: "앞 장면", say: "속도계가 아직 정의되지 않았다.", figure: "f", focus: ["a"] },
    { type: "define", term: "속도계", definition: "속도계는 속도를 잰다.", focus: [] },
    { type: "explain", title: "뒤 장면", say: "이제 속도계를 읽는다.", figure: "f", focus: ["a"] },
  ] }],
  quiz: [], summary: { figures: ["f"] },
});
`;

let browser, sites = {};
before(async () => {
  browser = await launch();
  for (const [k, f] of [["coffee", COFFEE], ["battery", BATTERY], ["example", EXAMPLE]]) sites[k] = await serve(buildSite(f).out);
  sites.glossary = await serve(buildSiteFromSource(GLOSSARY).out);
});
after(async () => { for (const s of Object.values(sites)) await s.close(); await browser?.close(); });

async function at(site, scene, o = {}) {
  const r = await open(browser, sites[site].url, o);
  await goto(r.page, scene);
  await settle(r.page);
  return r;
}
const T = { timeout: 60000 };
const count = (page, sel) => page.locator(sel).count();
const cardText = (page) => page.locator("[data-ltt-card]").first().innerText();
async function submitAll(page) {
  for (let guard = 0; guard < 10; guard++) {
    const btns = page.locator("[data-ltt-submit]:enabled");
    if (!(await btns.count())) return;
    await btns.first().click();
    await page.waitForTimeout(50);
  }
}
async function feedback(page, k) {
  const inItem = page.locator(`[data-ltt-item="${k}"] [data-ltt-feedback]`);
  const el = (await inItem.count()) ? inItem.first() : page.locator("[data-ltt-feedback]").nth(k);
  return el.getAttribute("data-ltt-correct");
}
/** After rewind, make sure the clock runs (rewind may or may not pause); returns wall ms when running started. */
async function rewindAndPlay(page) {
  await page.click("[data-ltt-rewind]");
  const t0 = (await state(page)).t;
  await page.waitForTimeout(150);
  if ((await state(page)).t === t0) { await page.click("[data-ltt-play]"); return Date.now(); }
  return Date.now() - 150;
}
const domOrder = (page) => page.locator("[data-ltt-order-item]").evaluateAll((els) => els.map((e) => e.getAttribute("data-ltt-order-item")));

// ---------- every scene type ----------
for (const [site, scenes] of [["coffee", coffeeScenes], ["battery", batteryScenes]]) {
  test(`VO-14 ${site}: every scene renders as [data-ltt-scene=n][data-ltt-type=type] with no error panel`, { timeout: 120000 }, async () => {
    const { page, ctx, pageErrors } = await open(browser, sites[site].url);
    for (const s of scenes) {
      await goto(page, s.index);
      assert.equal(await count(page, `[data-ltt-scene="${s.index}"][data-ltt-type="${s.type}"]`), 1, `scene ${s.index} ${s.type}`);
      assert.equal(await count(page, "[data-ltt-error]"), 0, `scene ${s.index}`);
      assert.equal((await state(page)).scene, s.index);
    }
    assert.deepEqual(pageErrors, []);
    await ctx.close();
  });
}
test("VO-14 coffee covers all 8 scene types + summary", () => {
  assert.deepEqual([...new Set(coffeeScenes.map((s) => s.type))].sort(), ["compare", "define", "explain", "explore", "hook", "predict", "quiz", "steps", "summary"]);
});

// ---------- FR-20 shell ----------
for (const viewport of ["desktop", "mobile"]) {
  test(`VO-14 FR-20 shell ${viewport}: stage/card arrangement, progress, prev/next, no horizontal scroll`, T, async () => {
    const { page, ctx } = await at("coffee", C.hook, { viewport });
    const s = await page.locator("[data-ltt-stage]").first().boundingBox(), c = await page.locator("[data-ltt-card]").first().boundingBox();
    if (viewport === "desktop") { assert.ok(s.x + s.width <= c.x + 0.5, "stage left of card"); assert.ok(c.width >= 400 - 0.5 && c.width <= 440 + 0.5, `card width ${c.width}`); }
    else assert.ok(s.y + s.height <= c.y + 0.5, "stage above card");
    for (const sel of ["[data-ltt-progress]", "[data-ltt-next]", "[data-ltt-prev]"]) assert.ok(await count(page, sel) >= 1, sel);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    await page.click("[data-ltt-next]");
    assert.equal((await state(page)).scene, C.hook + 1);
    await page.click("[data-ltt-prev]");
    assert.equal((await state(page)).scene, C.hook);
    await ctx.close();
  });
}

// ---------- hook / explain / define / glossary ----------
test("VO-14 FR-21 hook shows title and say; define shows term and definition", T, async () => {
  const { page, ctx } = await at("coffee", C.hook);
  const h = coffeeScenes[C.hook].scene;
  const txt = await cardText(page);
  assert.ok(txt.includes(h.title) && txt.includes(h.say));
  await goto(page, C.defineK);
  const d = coffeeScenes[C.defineK].scene;
  const dt = await cardText(page);
  assert.ok(dt.includes(d.term) && dt.includes(d.definition));
  await ctx.close();
});
test("VO-14 C-55 glossary: no term button before the define scene, button after; opening shows the definition", T, async () => {
  const { page, ctx } = await at("glossary", 0);
  assert.equal(await count(page, '[data-ltt-term="속도계"]'), 0, "before define");
  await goto(page, 2);
  assert.ok(await count(page, '[data-ltt-term="속도계"]') >= 1, "after define");
  await page.locator('[data-ltt-term="속도계"]').first().click();
  const g = page.locator("[data-ltt-glossary]").first();
  assert.ok(await g.isVisible());
  assert.ok((await g.innerText()).includes("속도를 재는 계기판 바늘"));
  await ctx.close();
});

// FR-26 v9: a glossary term inside option text flows inline with the text after it (measured via a Range on the following text node).
async function inlineTerm(page, optionSel, term) {
  return page.evaluate(([sel, term]) => {
    const opt = document.querySelector(sel);
    const btn = opt && opt.querySelector(`[data-ltt-term="${term}"]`);
    if (!btn) return { missing: true };
    const walker = document.createTreeWalker(opt, NodeFilter.SHOW_TEXT);
    let node, after = null;
    while ((node = walker.nextNode())) if (!btn.contains(node) && node.textContent.trim() && (btn.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) { after = node; break; }
    if (!after) return { noAfter: true };
    const i = after.textContent.search(/\S/);
    const r = document.createRange(); r.setStart(after, i); r.setEnd(after, i + 1);
    const a = r.getBoundingClientRect(), b = btn.getBoundingClientRect();
    return { dy: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2), dx: a.left - b.right };
  }, [optionSel, term]);
}
const termCases = coffeeScenes.flatMap((s) => {
  const opts = s.type === "quiz" ? s.scene.items.flatMap((it, k) => (it.options ?? []).map((o, j) => [`[data-ltt-item="${k}"] [data-ltt-option="${j}"]`, o.text])) : s.type === "predict" && s.scene.input.kind === "choice" ? s.scene.input.options.map((o, j) => [`[data-ltt-option="${j}"]`, o.text]) : [];
  return opts.filter(([, t]) => typeof t === "string" && /^냉각 상수\S*\s+\S/.test(t)).map(([sel]) => [s.index, s.type, sel]);
});
test("VO-14 fixture has option texts starting with a glossary term after its define scene", () => assert.ok(termCases.length >= 2, JSON.stringify(termCases)));
for (const [scene, type, sel] of termCases) {
  test(`VO-14 FR-26 v9 inline glossary term in ${type} option (scene ${scene}): same line (Δy ≤ 4), gap < 12 px`, T, async () => {
    const { page, ctx } = await at("coffee", scene);
    const r = await inlineTerm(page, sel, "냉각 상수");
    assert.ok(!r.missing && !r.noAfter, JSON.stringify(r));
    assert.ok(r.dy <= 4, `vertical centre diff ${r.dy}`);
    assert.ok(r.dx >= -0.5 && r.dx < 12, `horizontal gap ${r.dx}`);
    await ctx.close();
  });
}

// ---------- predict ----------
const choice = coffeeScenes[C.choice].scene;
test("VO-14 C-41 predict choice before commit: reveal marks and reveal text absent; selecting does not apply Option params", T, async () => {
  const { page, ctx } = await at("coffee", C.choice);
  const before = (await state(page)).params;
  for (const m of choice.reveal.marks) assert.equal(await count(page, `[data-ltt-mark="${m}"]`), 0, m);
  assert.equal(await count(page, "[data-ltt-reveal]"), 0);
  await page.click('[data-ltt-option="2"]');
  await settle(page);
  const s = await state(page);
  assert.deepEqual(s.params, before);
  assert.equal(s.committed, false);
  for (const m of choice.reveal.marks) assert.equal(await count(page, `[data-ltt-mark="${m}"]`), 0, `${m} after selecting`);
  await ctx.close();
});
test("VO-14 C-42 predict choice wrong commit: its feedback, reveal.say, reveal.marks shown; Option params applied", T, async () => {
  const { page, ctx } = await at("coffee", C.choice);
  await page.click('[data-ltt-option="2"]');
  await page.click("[data-ltt-commit]");
  await settle(page);
  const s = await state(page);
  assert.equal(s.committed, true);
  assert.equal(s.params.k, 0.16);
  assert.ok((await cardText(page)).includes(choice.input.options[2].feedback));
  assert.ok((await page.locator("[data-ltt-reveal]").first().innerText()).includes("이 조건에서는 60°C까지 약"));
  for (const m of choice.reveal.marks) assert.ok(await count(page, `[data-ltt-mark="${m}"]`) >= 1, m);
  await ctx.close();
});
test("VO-14 predict choice correct commit: reveal shown, correct option params applied, no wrong feedback", T, async () => {
  const { page, ctx } = await at("coffee", C.choice);
  await page.click('[data-ltt-option="0"]');
  await page.click("[data-ltt-commit]");
  await settle(page);
  const s = await state(page);
  assert.equal(s.committed, true);
  assert.equal(s.params.lid, true);
  const txt = await cardText(page);
  for (const o of choice.input.options.slice(1)) assert.ok(!txt.includes(o.feedback));
  assert.ok(await count(page, "[data-ltt-reveal]") >= 1);
  await ctx.close();
});
test("VO-14 C-43 predict drag: reveal marks hidden before; keyboard drag then commit leaves mark 'guess'", T, async () => {
  const { page, ctx } = await at("coffee", C.drag);
  const sc = coffeeScenes[C.drag].scene;
  for (const m of sc.reveal.marks) assert.equal(await count(page, `[data-ltt-mark="${m}"]`), 0);
  assert.equal(await count(page, '[data-ltt-mark="guess"]'), 0);
  await page.locator("[data-ltt-drag]").first().focus();
  const b0 = await page.locator("[data-ltt-drag]").first().boundingBox();
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowLeft");
  await settle(page);
  const b1 = await page.locator("[data-ltt-drag]").first().boundingBox();
  assert.ok(b1.x < b0.x - 1, "arrow keys move the drag target along x");
  await page.click("[data-ltt-commit]");
  await settle(page);
  assert.equal((await state(page)).committed, true);
  assert.ok(await count(page, '[data-ltt-mark="guess"]') >= 1);
  for (const m of sc.reveal.marks) assert.ok(await count(page, `[data-ltt-mark="${m}"]`) >= 1);
  await ctx.close();
});
test("VO-14 predict draw: answer curve hidden before; pointer sketch then commit leaves 'guess' and reveals the answer", T, async () => {
  const { page, ctx } = await at("coffee", C.draw);
  assert.equal(await count(page, '[data-ltt-mark="true-curve"]'), 0);
  const b = await page.locator("[data-ltt-draw]").first().boundingBox();
  await page.mouse.move(b.x + 4, b.y + 6);
  await page.mouse.down();
  for (let i = 1; i <= 24; i++) await page.mouse.move(b.x + 4 + ((b.width - 8) * i) / 24, b.y + 6 + (b.height - 12) * (1 - Math.exp(-i / 6)) * 0.8);
  await page.mouse.up();
  await page.click("[data-ltt-commit]");
  await settle(page);
  assert.equal((await state(page)).committed, true);
  assert.ok(await count(page, '[data-ltt-mark="guess"]') >= 1);
  assert.ok(await count(page, '[data-ltt-mark="true-curve"]') >= 1);
  await ctx.close();
});

test("VO-14 predict draw keyboard fallback: y0/y1 inputs + draw-line, commit leaves 'guess' (spec v2)", T, async () => {
  const { page, ctx } = await at("coffee", C.draw);
  await tabTo(page, "input[data-ltt-draw-y0]"); await page.keyboard.type("90");
  await tabTo(page, "input[data-ltt-draw-y1]"); await page.keyboard.type("22");
  await tabTo(page, "[data-ltt-draw-line]"); await page.keyboard.press("Enter");
  await tabTo(page, "[data-ltt-commit]"); await page.keyboard.press("Enter");
  await settle(page);
  assert.equal((await state(page)).committed, true);
  assert.ok(await count(page, '[data-ltt-mark="guess"]') >= 1);
  assert.ok(await count(page, '[data-ltt-mark="true-curve"]') >= 1);
  await ctx.close();
});

// Own oracle: mean |line − (22 + 68e^(−0.08x))| over x∈[0,60] vs tol 8 → 7.36 / 9.36 / 19.95.
for (const [y0, y1, expect] of [[45, 22, "true"], [35, 25, "false"], [90, 22, "false"]]) {
  test(`VO-14 predict draw graded by mean vertical gap ≤ tol: line ${y0}→${y1} -> correct ${expect} (spec v4/v5)`, T, async () => {
    const { page, ctx } = await at("coffee", C.draw);
    await page.fill("input[data-ltt-draw-y0]", String(y0));
    await page.fill("input[data-ltt-draw-y1]", String(y1));
    await page.click("[data-ltt-draw-line]");
    await page.click("[data-ltt-commit]");
    await settle(page);
    assert.equal(await page.locator("[data-ltt-reveal]").first().getAttribute("data-ltt-correct"), expect);
    await ctx.close();
  });
}
for (const [opt, expect] of [["0", "true"], ["1", "false"]]) {
  test(`VO-14 predict choice option ${opt} -> [data-ltt-reveal][data-ltt-correct="${expect}"] (spec v5)`, T, async () => {
    const { page, ctx } = await at("coffee", C.choice);
    await page.click(`[data-ltt-option="${opt}"]`);
    await page.click("[data-ltt-commit]");
    await settle(page);
    assert.equal(await page.locator("[data-ltt-reveal]").first().getAttribute("data-ltt-correct"), expect);
    await ctx.close();
  });
}

// ---------- quiz ----------
test("VO-14 C-44 quiz before/after submit: choice correct, numeric 7.5 (=answer+tol) correct, 14.51 (>answer+tol) wrong; reveal marks after only", T, async () => {
  const { page, ctx } = await at("coffee", C.quiz1);
  assert.equal(await count(page, "[data-ltt-feedback]"), 0);
  assert.equal(await count(page, '[data-ltt-mark="mug-dot"]'), 0, "reveal mark hidden before submit");
  await page.click('[data-ltt-item="0"] [data-ltt-option="0"]');
  await page.fill('[data-ltt-item="1"] input[data-ltt-numeric]', "7.5");
  await page.fill('[data-ltt-item="2"] input[data-ltt-numeric]', "14.51");
  await submitAll(page);
  await settle(page);
  assert.equal(await feedback(page, 0), "true");
  assert.equal(await feedback(page, 1), "true");
  assert.equal(await feedback(page, 2), "false");
  assert.ok(await count(page, '[data-ltt-mark="mug-dot"]') >= 1, "reveal mark after submit");
  await ctx.close();
});
test("VO-14 numeric boundary below: 6.5 (=answer−tol) correct, 6.49 wrong", T, async () => {
  const { page, ctx } = await at("coffee", C.quiz1);
  await page.click('[data-ltt-item="0"] [data-ltt-option="1"]');
  await page.fill('[data-ltt-item="1"] input[data-ltt-numeric]', "6.5");
  await page.fill('[data-ltt-item="2"] input[data-ltt-numeric]', "13.49");
  await submitAll(page);
  await settle(page);
  assert.equal(await feedback(page, 0), "false");
  assert.ok((await cardText(page)).includes("부피에 비해 표면이 작아"), "wrong-option feedback");
  assert.equal(await feedback(page, 1), "true");
  assert.equal(await feedback(page, 2), "false");
  await ctx.close();
});
test("VO-14 numeric input not a number -> submit disabled, no grading", T, async () => {
  const { page, ctx } = await at("coffee", C.quiz1);
  await page.click('[data-ltt-item="0"] [data-ltt-option="0"]');
  await page.fill('[data-ltt-item="2"] input[data-ltt-numeric]', "14");
  await page.fill('[data-ltt-item="1"] input[data-ltt-numeric]', "abc");
  const inItem = page.locator('[data-ltt-item="1"] [data-ltt-submit]');
  const btn = (await inItem.count()) ? inItem.first() : page.locator("[data-ltt-submit]").first();
  assert.equal(await btn.isEnabled(), false);
  assert.equal(await page.locator('[data-ltt-item="1"] [data-ltt-feedback]').count(), 0);
  await ctx.close();
});
test("VO-14 C-45 final quiz: order and classify operated by keyboard, then submitted and graded", T, async () => {
  const { page, ctx } = await at("coffee", C.final);
  const items = coffeeScenes[C.final].scene.items;
  const kOrder = items.findIndex((i) => i.kind === "order"), kClass = items.findIndex((i) => i.kind === "classify");
  await page.click(`[data-ltt-item="0"] [data-ltt-option="0"]`);
  await page.fill(`[data-ltt-item="1"] input[data-ltt-numeric]`, "7.27");
  // order: move the first item down once by keyboard (observable change), then sort into spec order with ArrowUp.
  const o0 = await domOrder(page);
  assert.deepEqual(o0, shuffledOrder(items[kOrder].items.length).map(String), "initial order = mulberry32(1) Fisher–Yates (spec v3)");
  await page.locator(`[data-ltt-order-item="${o0[0]}"]`).focus();
  await page.keyboard.press("ArrowDown");
  const o1 = await domOrder(page);
  assert.deepEqual([o1[0], o1[1]], [o0[1], o0[0]], "ArrowDown swaps with next");
  for (let target = 0; target < o1.length; target++) {
    let cur = await domOrder(page);
    let pos = cur.indexOf(String(target));
    await page.locator(`[data-ltt-order-item="${target}"]`).focus();
    while (pos > target) { await page.keyboard.press("ArrowUp"); cur = await domOrder(page); const np = cur.indexOf(String(target)); assert.ok(np < pos, "ArrowUp moves up"); pos = np; }
  }
  assert.deepEqual(await domOrder(page), items[kOrder].items.map((_, i) => String(i)));
  // classify: focus item, Enter; focus bin, Enter.
  for (const [k, it] of items[kClass].items.entries()) {
    await page.locator(`[data-ltt-classify-item="${k}"]`).focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(`[data-ltt-classify-item="${k}"]`).getAttribute("data-ltt-picked"), "true", "picked");
    await page.locator(`[data-ltt-bin="${it.bin}"]`).focus();
    await page.keyboard.press("Enter");
  }
  await submitAll(page);
  await settle(page);
  assert.equal(await feedback(page, kOrder), "true");
  assert.equal(await feedback(page, kClass), "true");
  await ctx.close();
});

test("VO-14 C-45 final quiz wrong answers: order left in the shuffled (wrong) order and classify all into one bin -> data-ltt-correct=false", T, async () => {
  const { page, ctx } = await at("coffee", C.final);
  const items = coffeeScenes[C.final].scene.items;
  const kOrder = items.findIndex((i) => i.kind === "order"), kClass = items.findIndex((i) => i.kind === "classify");
  await page.click(`[data-ltt-item="0"] [data-ltt-option="0"]`);
  await page.fill(`[data-ltt-item="1"] input[data-ltt-numeric]`, "7.27");
  assert.notDeepEqual(await domOrder(page), items[kOrder].items.map((_, i) => String(i)), "order differs from the answer");
  const bin0 = items[kClass].bins[0];
  assert.ok(items[kClass].items.some((it) => it.bin !== bin0), "at least one item belongs elsewhere");
  for (const k of items[kClass].items.keys()) {
    await page.locator(`[data-ltt-classify-item="${k}"]`).focus();
    await page.keyboard.press("Enter");
    await page.locator(`[data-ltt-bin="${bin0}"]`).focus();
    await page.keyboard.press("Enter");
  }
  await submitAll(page);
  await settle(page);
  assert.equal(await feedback(page, kOrder), "false");
  assert.equal(await feedback(page, kClass), "false");
  assert.equal(await feedback(page, 0), "true", "the correct choice in the same scene still grades true");
  await ctx.close();
});

// ---------- explore ----------
test("VO-14 C-46 explore knobs: slider, log slider, select, toggle update params; goal done flips", T, async () => {
  const { page, ctx } = await at("coffee", C.explore);
  assert.equal(await page.locator("[data-ltt-goal]").getAttribute("data-ltt-done"), "false");
  const p0 = (await state(page)).params;
  await page.locator('[data-ltt-knob="Ta"]').focus();
  await page.keyboard.press("ArrowRight");
  assert.equal((await state(page)).params.Ta, p0.Ta + 1, "slider step 1");
  await page.locator('[data-ltt-knob="cup"]').selectOption({ label: "종이컵" });
  assert.equal((await state(page)).params.cup, "종이컵");
  await page.locator('[data-ltt-knob="lid"]').focus();
  await page.keyboard.press("Space");
  assert.equal((await state(page)).params.lid, !p0.lid);
  await page.keyboard.press("Space");
  assert.equal((await state(page)).params.lid, p0.lid);
  await page.locator('[data-ltt-knob="k"]').focus();
  await page.keyboard.press("ArrowRight");
  const k1 = (await state(page)).params.k;
  assert.ok(k1 > p0.k && k1 <= 0.4, `log slider moved k ${p0.k} -> ${k1}`);
  await page.keyboard.press("End");
  await settle(page);
  const k2 = (await state(page)).params.k;
  assert.ok(Math.abs(k2 - 0.4) <= 1e-9, `End -> max ${k2}`);
  await page.keyboard.press("Home");
  assert.ok(Math.abs((await state(page)).params.k - 0.02) <= 1e-9, "Home -> min");
  await page.keyboard.press("End");
  await settle(page);
  assert.equal(await page.locator("[data-ltt-goal]").getAttribute("data-ltt-done"), "true");
  await ctx.close();
});
test("VO-14 C-47 explore handle dragged beyond the plot clamps the param to the range ends", T, async () => {
  const { page, ctx } = await at("coffee", C.explore);
  const h = page.locator('[data-ltt-handle="probe"]').first();
  for (const [toX, expect] of [[1278, 60], [2, 0]]) {
    const b = await h.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 15; i++) await page.mouse.move(b.x + b.width / 2 + ((toX - b.x - b.width / 2) * i) / 15, b.y + b.height / 2);
    await page.mouse.up();
    await settle(page);
    assert.equal((await state(page)).params.tx, expect);
  }
  await ctx.close();
});

// ---------- compare / summary ----------
test("VO-14 FR-24 compare: two panels, labels a/b visible, params a and b differ", T, async () => {
  const { page, ctx } = await at("coffee", C.compare);
  const lay = await page.evaluate(() => window.__ltt.layout());
  const panels = lay.flatMap((f) => f.panels);
  assert.ok(panels.length >= 2, `panels ${panels.length}`);
  for (const p of panels) assert.deepEqual(p.domain, panels[0].domain, "same scale");
  const txt = await page.locator(`[data-ltt-scene="${C.compare}"]`).innerText();
  for (const l of coffeeScenes[C.compare].scene.labels) assert.ok(txt.includes(l), l);
  await ctx.close();
});
/** Top-level visible figure svgs in the stage and the stage's vertical scroll overflow. */
const stageFigures = (page) => page.evaluate(() => {
  const st = document.querySelector("[data-ltt-stage]"); const b = st.getBoundingClientRect();
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const figs = [...st.querySelectorAll("svg")].filter((e) => !e.parentElement.closest("svg") && vis(e)).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  const texts = [...st.querySelectorAll("[data-ltt-text]")].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { id: e.getAttribute("data-ltt-text-id"), x: r.x, y: r.y, width: r.width, height: r.height }; });
  return { scroll: st.scrollHeight - st.clientHeight, b: { x: b.x, y: b.y, width: b.width, height: b.height }, figs, texts };
});
const inStage = (f, b) => f.x >= b.x - 0.5 && f.y >= b.y - 0.5 && f.x + f.width <= b.x + b.width + 0.5 && f.y + f.height <= b.y + b.height + 0.5;
test("VO-14 FR-27 summary desktop: grid of every summary figure inside the stage, no stage scroll (spec v6)", T, async () => {
  const { page, ctx } = await at("coffee", C.summary, { viewport: "desktop" });
  const r = await stageFigures(page);
  assert.ok(r.scroll <= 0, `stage scrolls ${r.scroll}px`);
  assert.equal(r.figs.length, coffeeScenes[C.summary].scene.figures.length);
  for (const f of r.figs) assert.ok(inStage(f, r.b), JSON.stringify(f));
  await ctx.close();
});
test("VO-14 FR-27 summary mobile: one figure per page, page buttons ≥ 44 px switch pages, no stage scroll, texts inside (spec v6)", T, async () => {
  const { page, ctx } = await at("coffee", C.summary, { viewport: "mobile" });
  const n = coffeeScenes[C.summary].scene.figures.length;
  assert.equal(await count(page, "[data-ltt-card] [data-ltt-summary-page]"), n);
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const btn = page.locator(`[data-ltt-summary-page="${i}"]`).first();
    const bb = await btn.boundingBox();
    assert.ok(bb.width >= 43.5 && bb.height >= 43.5, `page button ${i} ${bb.width}×${bb.height}`);
    await btn.click();
    await settle(page);
    const r = await stageFigures(page);
    assert.ok(r.scroll <= 0, `page ${i} stage scrolls ${r.scroll}px`);
    assert.equal(r.figs.length, 1, `page ${i} shows exactly one figure`);
    assert.ok(inStage(r.figs[0], r.b));
    for (const t of r.texts) assert.ok(inStage(t, r.b), `page ${i} text ${t.id} inside stage`);
    seen.add(JSON.stringify(r.texts.map((t) => t.id)));
  }
  assert.equal(seen.size, n, "each page shows a different figure");
  await ctx.close();
});
test("VO-14 FR-27 summary: one figure per summary.figures, say shown", T, async () => {
  const { page, ctx } = await at("coffee", C.summary);
  const lay = await page.evaluate(() => window.__ltt.layout());
  assert.equal(lay.length, load(await importFile(COFFEE)).input.summary.figures.length);
  assert.ok((await cardText(page)).includes("60°C가 되고"));
  await ctx.close();
});

// ---------- time ----------
test("VO-14 C-48 steps: auto-advances, pause holds, step-next advances, per-step focus emphasis", { timeout: 90000 }, async () => {
  const { page, ctx } = await at("battery", B.steps);
  const t0 = Date.now(), s0 = (await state(page)).step;
  let s1 = s0;
  while (s1 === s0 && Date.now() - t0 < 15000) { await page.waitForTimeout(100); s1 = (await state(page)).step; }
  assert.notEqual(s1, s0, "auto-advance");
  const interval = Date.now() - t0;
  await page.click("[data-ltt-play]");
  const held = (await state(page)).step;
  await page.waitForTimeout(Math.min(1.5 * interval + 300, 20000));
  assert.equal((await state(page)).step, held, "paused");
  await page.click("[data-ltt-rewind]");
  await settle(page);
  assert.equal((await state(page)).step, 0, "rewind -> step 0");
  await page.click("[data-ltt-step-next]");
  await settle(page);
  const next = (await state(page)).step;
  assert.equal(next, 1);
  const steps = batteryScenes[B.steps].scene.steps;
  for (const id of steps[next].focus) assert.equal(await page.locator(`[data-ltt-mark="${id}"]`).first().getAttribute("data-ltt-emphasis"), "focus", id);
  const other = steps[(next + 1) % 3].focus.filter((id) => !steps[next].focus.includes(id));
  for (const id of other) if (await count(page, `[data-ltt-mark="${id}"]`)) assert.equal(await page.locator(`[data-ltt-mark="${id}"]`).first().getAttribute("data-ltt-emphasis"), "dim", id);
  await ctx.close();
});
test("VO-14 loop: plays, pause holds t, rewind returns to span start, Space toggles", T, async () => {
  const { page, ctx } = await at("coffee", C.hook);
  const a = (await state(page)).t;
  await page.waitForTimeout(500);
  assert.notEqual((await state(page)).t, a, "playing");
  await page.click("[data-ltt-play]");
  const p = (await state(page)).t;
  await page.waitForTimeout(600);
  assert.equal((await state(page)).t, p, "paused");
  await page.click("[data-ltt-rewind]");
  await settle(page);
  assert.equal((await state(page)).t, 0, "rewound to span[0]");
  await page.locator("body").focus();
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  assert.ok((await state(page)).t > 0, "Space resumes");
  await ctx.close();
});
test("VO-14 loop warp: at ~25% wall time model t is in the slow part (< 10 of span 60, not the linear 15)", T, async () => {
  const { page, ctx } = await at("coffee", C.hook);
  const start = await rewindAndPlay(page);
  await page.waitForTimeout(Math.max(0, 1500 - (Date.now() - start)));
  const t = (await state(page)).t;
  assert.ok(t > 0 && t < 10, `t ${t}`);
  await ctx.close();
});
test("VO-14 warp slow display: [data-ltt-slow] visible during the slow segment (t < 10), absent after (spec v2)", { timeout: 30000 }, async () => {
  const { page, ctx } = await at("coffee", C.hook);
  await rewindAndPlay(page);
  await page.waitForTimeout(600);
  assert.ok((await state(page)).t < 10);
  assert.ok(await page.locator("[data-ltt-slow]").first().isVisible(), "slow marker during slow part");
  const t0 = Date.now();
  while ((await state(page)).t < 15 && Date.now() - t0 < 8000) await page.waitForTimeout(100);
  const t = (await state(page)).t;
  assert.ok(t >= 15 && t < 60, `t ${t}`);
  assert.equal(await count(page, "[data-ltt-slow]"), 0, "no slow marker in the fast part");
  await ctx.close();
});
test("VO-14 loop once: after ms the end state holds at span end", { timeout: 30000 }, async () => {
  const { page, ctx } = await at("coffee", C.camera);
  const start = await rewindAndPlay(page);
  await page.waitForTimeout(Math.max(0, 4600 - (Date.now() - start)));
  const t1 = (await state(page)).t;
  await page.waitForTimeout(700);
  assert.equal(t1, 60);
  assert.equal((await state(page)).t, 60);
  await ctx.close();
});
for (const [name, scene] of [["loop", C.hook], ["idle", C.steam]]) {
  test(`VO-14 C-49 reduced motion (${name}): state().t equal 1 s apart without freeze`, T, async () => {
    const { page, ctx } = await at("coffee", scene, { reducedMotion: "reduce" });
    const a = (await state(page)).t;
    await page.waitForTimeout(1000);
    assert.equal((await state(page)).t, a);
    await ctx.close();
  });
}

// ---------- keyboard ----------
test("VO-14 arrow keys move between scenes when no input has focus", T, async () => {
  const { page, ctx } = await at("coffee", 0);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("ArrowRight");
  await settle(page);
  assert.equal((await state(page)).scene, 1);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("ArrowLeft");
  await settle(page);
  assert.equal((await state(page)).scene, 0);
  await ctx.close();
});
test("VO-14 C-50 keyboard only: first -> last scene, committing every choice/drag predict and choice/numeric/order quiz", { timeout: 240000 }, async () => {
  const { page, ctx } = await at("coffee", 0);
  const committed = [];
  for (const s of coffeeScenes) {
    assert.equal((await state(page)).scene, s.index);
    if (s.type === "predict" && s.scene.input.kind === "choice") {
      await tabTo(page, '[data-ltt-option="0"]'); await page.keyboard.press("Enter");
      await tabTo(page, "[data-ltt-commit]"); await page.keyboard.press("Enter");
      await settle(page);
      assert.equal((await state(page)).committed, true, `scene ${s.index}`); committed.push(s.index);
    } else if (s.type === "predict" && s.scene.input.kind === "drag") {
      await tabTo(page, "[data-ltt-drag]"); await page.keyboard.press("ArrowRight");
      await tabTo(page, "[data-ltt-commit]"); await page.keyboard.press("Enter");
      await settle(page);
      assert.equal((await state(page)).committed, true, `scene ${s.index}`); committed.push(s.index);
    } else if (s.type === "predict" && s.scene.input.kind === "draw") {
      await tabTo(page, "input[data-ltt-draw-y0]"); await page.keyboard.type("90");
      await tabTo(page, "input[data-ltt-draw-y1]"); await page.keyboard.type("22");
      await tabTo(page, "[data-ltt-draw-line]"); await page.keyboard.press("Enter");
      await tabTo(page, "[data-ltt-commit]"); await page.keyboard.press("Enter");
      await settle(page);
      assert.equal((await state(page)).committed, true, `scene ${s.index}`); committed.push(s.index);
    } else if (s.type === "quiz") {
      for (const [k, it] of s.scene.items.entries()) {
        if (it.kind === "choice") { await tabTo(page, `[data-ltt-item="${k}"] [data-ltt-option="0"]`); await page.keyboard.press("Enter"); }
        if (it.kind === "numeric") { await tabTo(page, `[data-ltt-item="${k}"] input[data-ltt-numeric]`); await page.keyboard.type(String(typeof it.answer === "number" ? it.answer : 7.27)); }
      }
      if (!s.scene.items.some((i) => i.kind === "classify")) {
        for (let g = 0; g < 6 && (await page.locator("[data-ltt-submit]:enabled").count()); g++) { await tabTo(page, "[data-ltt-submit]:enabled"); await page.keyboard.press("Enter"); await settle(page); }
        assert.ok((await count(page, "[data-ltt-feedback]")) >= s.scene.items.length, `quiz ${s.index} graded`);
        for (const k of s.scene.items.keys()) assert.equal(await feedback(page, k), "true", `quiz ${s.index} item ${k} correct answer graded true`);
        committed.push(s.index);
      }
    }
    if (s.index < coffeeScenes.length - 1) {
      await tabTo(page, "[data-ltt-next]"); await page.keyboard.press("Enter");
      await settle(page);
    }
  }
  assert.equal((await state(page)).scene, coffeeScenes.length - 1);
  assert.ok(committed.length >= 4, `committed ${committed}`);
  await ctx.close();
});

// ---------- QR-4 ----------
test("VO-18 QR-4 example hook loop on desktop: requestAnimationFrame interval p95 ≤ 20 ms over 3 s", T, async () => {
  const { page, ctx } = await at("example", 0);
  const p95 = await page.evaluate(() => new Promise((resolve) => {
    const d = []; let last = performance.now(); const end = last + 3000;
    const tick = (now) => { d.push(now - last); last = now; if (now < end) requestAnimationFrame(tick); else { d.sort((a, b) => a - b); resolve(d[Math.floor(d.length * 0.95)]); } };
    requestAnimationFrame(tick);
  }));
  assert.ok(p95 <= 20, `p95 ${p95} ms`);
  await ctx.close();
});
