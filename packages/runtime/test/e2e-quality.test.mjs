// VO-15 (QR-7, QR-14, C-51, C-56): every scene of every fixture lesson and the example × desktop/mobile × initial/settled,
// measured in Chrome with getBoundingClientRect/getComputedStyle; contrast by own WCAG formula over the effective background.
// VO-16 (FR-31, C-52, QR-6): __ltt.layout() and DOM text boxes vs Node layoutFigure, ≤ 1 px, 2 text-heaviest scenes per lesson × 2 viewports.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { CORE, LAYOUT, EXAMPLE, FIXTURE_LESSONS, globalScenes, stateTime, importFile, wcag, over, parseColor } from "./fixtures/m1.mjs";
import { buildSite, serve, launch, open, goto, settle } from "./fixtures/browser.mjs";

const { load } = await import(CORE);
const { layoutFigure } = await import(LAYOUT);
const LESSONS = [...FIXTURE_LESSONS, EXAMPLE];
let suiteLinesMeasured = 0;
const seen = { desktop: { marks: new Set(), frames: new Set(), multi: 0 }, mobile: { marks: new Set(), frames: new Set(), multi: 0 } };

let browser; const sites = new Map();
before(async () => {
  browser = await launch();
  for (const f of LESSONS) sites.set(f, await serve(buildSite(f).out));
});
after(async () => { for (const s of sites.values()) await s.close(); await browser?.close(); });

/** Runs in the page. Returns raw measurements; thresholds are applied in Node. */
function measureInPage() {
  const style = document.getElementById("__ltt_probe") ?? Object.assign(document.head.appendChild(document.createElement("style")), { id: "__ltt_probe", textContent: "[data-ltt-scene] * { pointer-events: auto !important; }" });
  void style;
  const opacityOf = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement ?? e.parentNode) o *= parseFloat(getComputedStyle(e).opacity || "1"); return o; };
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && opacityOf(el) > 0.01; };
  const isSvg = (el) => el instanceof SVGElement;
  const fgOf = (el) => { const cs = getComputedStyle(el); return isSvg(el) && el.tagName.toLowerCase().match(/^(text|tspan|textpath)$/) ? { color: cs.fill, alpha: parseFloat(cs.fillOpacity || "1") * opacityOf(el) } : { color: cs.color, alpha: opacityOf(el) }; };
  const layersAt = (el) => {
    const r = el.getBoundingClientRect(); const x = r.x + r.width / 2, y = r.y + r.height / 2;
    const layers = [];
    const stack = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight ? document.elementsFromPoint(x, y) : [];
    const consider = (e) => {
      const cs = getComputedStyle(e);
      if (isSvg(e)) {
        if (!/^(rect|circle|ellipse|path|polygon)$/.test(e.tagName.toLowerCase()) || cs.fill === "none") return false;
        layers.push({ color: cs.fill, alpha: parseFloat(cs.fillOpacity || "1") * opacityOf(e) });
      } else if (cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) layers.push({ color: cs.backgroundColor, alpha: opacityOf(e) });
      return false;
    };
    if (!isSvg(el)) consider(el);
    const self = stack.findIndex((e) => e === el || el.contains(e));
    if (stack.length) stack.slice(self + 1).forEach(consider);
    else for (let e = el.parentElement; e; e = e.parentElement) consider(e);
    return layers;
  };
  const disabledOf = (el) => !!el.closest(":disabled, [aria-disabled='true']");
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
  const stageEl = document.querySelector("[data-ltt-stage]");
  const stage = stageEl ? box(stageEl) : null;
  const texts = [...document.querySelectorAll("[data-ltt-stage] [data-ltt-text]")].filter(visible).map((el) => {
    const cs = getComputedStyle(el);
    let size = parseFloat(cs.fontSize);
    if (isSvg(el) && el.getScreenCTM) { const m = el.getScreenCTM(); if (m) size *= Math.hypot(m.a, m.b); }
    return { id: el.getAttribute("data-ltt-text-id") ?? el.textContent.slice(0, 20), text: el.textContent, box: box(el), size, fg: fgOf(el), layers: layersAt(el), disabled: disabledOf(el) };
  });
  const card = [...document.querySelectorAll("[data-ltt-card] *")].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visible(el) && !el.closest("[data-ltt-stage]")).map((el) => ({ text: el.textContent.trim().slice(0, 30), size: parseFloat(getComputedStyle(el).fontSize), fg: fgOf(el), layers: layersAt(el), disabled: disabledOf(el) }));
  const TOUCH = "button, [role=button], select, input, [data-ltt-option], [data-ltt-knob], [data-ltt-next], [data-ltt-prev], [data-ltt-play], [data-ltt-rewind], [data-ltt-step-next], [data-ltt-submit], [data-ltt-commit], [data-ltt-order-item], [data-ltt-classify-item], [data-ltt-bin], [data-ltt-summary-page]";
  const touch = [...document.querySelectorAll(TOUCH)].filter((el) => visible(el) && !el.closest("[data-ltt-term]") && !el.matches("[data-ltt-term]")).map((el) => {
    const target = el.matches("input[type=checkbox], input[type=radio], input[type=range]") && el.closest("label") ? el.closest("label") : el;
    return { what: el.outerHTML.slice(0, 80), box: box(target) };
  });
  const stageScroll = stageEl ? stageEl.scrollHeight - stageEl.clientHeight : 0;
  // QR-7 v13: line/shape contrast ≥ 3 for focus/series/semantic tones, measured on drawn SVG elements.
  const LINE_TONES = new Set(["focus", "series1", "series2", "series3", "series4", "series5", "series6", "good", "warn", "bad"]);
  const STROKE_KINDS = new Set(["line", "arrow", "path", "trace", "edge"]), OUTLINE_KINDS = new Set(["circle", "rect", "arc"]);
  const lines = [], unmeasured = [];
  let eligibleFound = 0;
  const LINEAR = new Set(["dot", "line", "arrow", "path", "trace", "edge"]);
  // v16: other linear data marks are not background; casings are.
  const isBackground = (e) => { if (e.closest("[data-ltt-casing]")) return true; const m = e.closest("[data-ltt-mark]"); return !(m && LINEAR.has(m.getAttribute("data-ltt-kind"))); };
  const paintOf = (cs, which) => {
    const c = cs[which], o = parseFloat((which === "stroke" ? cs.strokeOpacity : cs.fillOpacity) || "1");
    if (!c || c === "none" || /rgba\(.*,\s*0\)$/.test(c) || o <= 0) return null;
    return { color: c, paintAlpha: o };
  };
  for (const g of document.querySelectorAll("[data-ltt-stage] [data-ltt-mark]")) {
    const tone = g.getAttribute("data-ltt-tone"), kind = g.getAttribute("data-ltt-kind");
    if (!LINE_TONES.has(tone) || g.getAttribute("data-ltt-emphasis") === "dim") continue;
    if (!(kind === "dot" || STROKE_KINDS.has(kind) || OUTLINE_KINDS.has(kind))) continue;
    let eligible = 0, painted = 0;
    for (const el of g.querySelectorAll("path, line, polyline, polygon, circle, rect, ellipse")) {
      if (!visible(el) || el.closest("[data-ltt-text]") || el.closest("[data-ltt-casing]")) continue;
      const cs = getComputedStyle(el);
      // v15: kind decides eligibility only (outline kinds count only unfilled elements); contrast = best paint.
      if (OUTLINE_KINDS.has(kind) && cs.fill !== "none") continue;
      eligible++;
      const paints = [paintOf(cs, "stroke"), paintOf(cs, "fill")].filter(Boolean);
      if (!paints.length) continue;
      painted++;
      eligibleFound++;
      const pts = [];
      try { if (typeof el.getTotalLength === "function") { const L = el.getTotalLength(); if (L > 0) for (const f of [0.5, 0.1, 0.3, 0.7, 0.9]) { const q = el.getPointAtLength(L * f); pts.push(new DOMPoint(q.x, q.y).matrixTransform(el.getScreenCTM())); } } } catch {}
      const r = el.getBoundingClientRect();
      pts.push({ x: r.x + r.width / 2, y: r.y + r.height / 2 }, { x: r.x + r.width / 4, y: r.y + r.height / 4 }, { x: r.x + 3 * r.width / 4, y: r.y + r.height / 4 }, { x: r.x + r.width / 4, y: r.y + 3 * r.height / 4 }, { x: r.x + 3 * r.width / 4, y: r.y + 3 * r.height / 4 });
      let below = null;
      for (const p of pts) {
        if (!(p.x >= 0 && p.y >= 0 && p.x < innerWidth && p.y < innerHeight)) continue;
        const stack = document.elementsFromPoint(p.x, p.y);
        const at = stack.indexOf(el);
        if (at >= 0) { below = stack.slice(at + 1); break; }
      }
      if (!below) continue; // v15: covered at every sample point -> not measured
      const layers = [];
      for (const e of below) {
        if (!isBackground(e)) continue;
        const c2 = getComputedStyle(e);
        if (e instanceof SVGElement && e.closest("[data-ltt-casing]")) {
          if (c2.fill !== "none") layers.push({ color: c2.fill, alpha: parseFloat(c2.fillOpacity || "1") * opacityOf(e) });
          if (c2.stroke && c2.stroke !== "none") layers.push({ color: c2.stroke, alpha: parseFloat(c2.strokeOpacity || "1") * opacityOf(e) });
        } else if (e instanceof SVGElement) { if (/^(rect|circle|ellipse|path|polygon)$/.test(e.tagName.toLowerCase()) && c2.fill !== "none") layers.push({ color: c2.fill, alpha: parseFloat(c2.fillOpacity || "1") * opacityOf(e) }); }
        else if (c2.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(c2.backgroundColor)) layers.push({ color: c2.backgroundColor, alpha: opacityOf(e) });
      }
      const op = opacityOf(el);
      lines.push({ id: g.getAttribute("data-ltt-mark"), kind, tone, fgs: paints.map((x) => ({ color: x.color, alpha: x.paintAlpha * op })), layers });
    }
    if (eligible > 0 && painted === 0) unmeasured.push(`${g.getAttribute("data-ltt-mark")} (${kind}/${tone})`);
  }
  return { stage, stageScroll, texts, card, touch, lines, unmeasured, eligibleFound, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, errors: document.querySelectorAll("[data-ltt-error]").length };
}

const toRGB = ({ color, alpha }) => { const c = parseColor(color); return [c[0], c[1], c[2], c[3] * alpha]; };
function effectiveContrast(fg, layers) {
  let bg = [255, 255, 255, 1];
  for (const l of [...layers].reverse()) bg = over(toRGB(l), bg);
  return wcag(over(toRGB(fg), bg), bg);
}
/** Spec v11: text boxes ≥ 6 px apart; DOM rounding allowance 0.5 px → threshold 5.5 px. */
const ovl = (a, b) => Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), b.y - (a.y + a.height), a.y - (b.y + b.height)) < 5.5;
const within = (a, b) => a.x >= b.x - 0.5 && a.y >= b.y - 0.5 && a.x + a.width <= b.x + b.width + 0.5 && a.y + a.height <= b.y + b.height + 0.5;

function judge(m, viewport, where) {
  const bad = [];
  if (m.errors) bad.push(`${where} error panel`);
  if (m.stageScroll > 0) bad.push(`${where} stage scrolls ${m.stageScroll}px`);
  if (m.overflow > 0) bad.push(`${where} horizontal overflow ${m.overflow}px`);
  for (let i = 0; i < m.texts.length; i++) for (let j = i + 1; j < m.texts.length; j++) if (ovl(m.texts[i].box, m.texts[j].box)) bad.push(`${where} text-overlap/gap<5.5px ${m.texts[i].id} / ${m.texts[j].id}`);
  for (const t of m.texts) {
    if (m.stage && !within(t.box, m.stage)) bad.push(`${where} text-clipped ${t.id}`);
    if (t.size < 12 - 0.01) bad.push(`${where} text-small ${t.id} ${t.size.toFixed(1)}px`);
    const c = effectiveContrast(t.fg, t.layers);
    if (!t.disabled && c < 4.5) bad.push(`${where} low-contrast ${t.id} ${c.toFixed(2)}`);
  }
  for (const t of m.card) {
    if (t.size < 16 - 0.01) bad.push(`${where} card text-small "${t.text}" ${t.size}px`);
    const c = effectiveContrast(t.fg, t.layers);
    if (!t.disabled && c < 4.5) bad.push(`${where} card low-contrast "${t.text}" ${c.toFixed(2)}`);
  }
  for (const u of m.unmeasured) bad.push(`${where} toned mark ${u} has eligible elements but no non-casing stroke/fill paint`);
  for (const l of m.lines) {
    const c = Math.max(...l.fgs.map((fg) => effectiveContrast(fg, l.layers)));
    if (c < 3) bad.push(`${where} line-contrast ${l.id} (${l.kind}/${l.tone}) ${c.toFixed(2)}`);
  }
  if (viewport === "mobile") for (const t of m.touch) if (t.box.width < 44 - 0.5 || t.box.height < 44 - 0.5) bad.push(`${where} touch ${Math.round(t.box.width)}×${Math.round(t.box.height)} ${t.what}`);
  return bad;
}

for (const f of LESSONS) {
  const inp = load(await importFile(f)).input;
  const scenes = globalScenes(inp);
  for (const viewport of ["desktop", "mobile"]) {
    test(`VO-15 C-51/C-56 ${f.split("/").pop()} ${viewport}: ${scenes.length} scenes × initial/settled -> no overlap, clipping, small text, low contrast, small touch target, overflow`, { timeout: 300000 }, async () => {
      const { page, ctx, pageErrors } = await open(browser, sites.get(f).url, { viewport });
      const bad = [];
      let linesMeasured = 0, linesEligible = 0;
      for (const s of scenes) {
        for (const st of ["initial", "settled"]) {
          await goto(page, s.index);
          const { t, step } = stateTime(inp, s, st === "initial" || s.type === "predict" || s.type === "quiz" ? "initial" : "settled");
          await page.evaluate(([a, b]) => window.__ltt.freeze(a, b), [t, step]);
          if (st === "settled" && (s.type === "predict" || s.type === "quiz")) await page.evaluate(() => window.__ltt.answer(true));
          await page.evaluate(() => window.__ltt.ready());
          await settle(page);
          const m = await page.evaluate(measureInPage);
          // v17: legend text never carries a leader (checked on __ltt.layout(); the DOM has no leader contract).
          for (const fl of await page.evaluate(() => window.__ltt.layout())) for (const it of fl.items) if (it.kind === "text" && it.mark === "legend" && it.leader) bad.push(`scene ${s.index} ${st} legend text ${it.id} has a leader`);
          bad.push(...judge(m, viewport, `scene ${s.index} (${s.type}) ${st}`));
          linesMeasured += m.lines.length;
          linesEligible += m.eligibleFound;
          // A-V1-1: scenes that show a figure must yield measured figure text (no vacuous pass).
          const hasFig = !!s.scene.figure || (s.type === "quiz" && s.scene.items.some((i) => i.figure)) || s.type === "summary";
          if (hasFig && m.texts.length === 0) bad.push(`scene ${s.index} (${s.type}) ${st}: no [data-ltt-text] measured in the stage`);
          if (s.type === "summary" && viewport === "mobile") {
            const pages = await page.locator("[data-ltt-summary-page]").count();
            if (pages !== s.scene.figures.length) bad.push(`summary mobile: ${pages} page buttons for ${s.scene.figures.length} figures`);
            for (let i = 0; i < pages; i++) {
              await page.locator(`[data-ltt-summary-page="${i}"]`).first().click();
              await settle(page);
              bad.push(...judge(await page.evaluate(measureInPage), viewport, `summary page ${i} ${st}`));
            }
          }
          if (FIXTURE_LESSONS.includes(f)) for (const fl of await page.evaluate(() => window.__ltt.layout())) {
            for (const it of fl.items) seen[viewport].marks.add(it.mark);
            for (const p of fl.panels) seen[viewport].frames.add(p.frame);
            if (fl.panels.length >= 2) seen[viewport].multi++;
          }
        }
      }
      assert.deepEqual(pageErrors, []);
      // v16: lessons without toned marks have nothing eligible; if any eligible element exists, at least one must be measured.
      if (linesEligible > 0) assert.ok(linesMeasured >= 1, `${linesEligible} eligible toned elements but none measured (V1-1 guard)`);
      suiteLinesMeasured += linesMeasured;
      assert.deepEqual(bad, []);
      await ctx.close();
    });
  }
}

test("VO-15 V1-1 suite guard: line contrast measured on at least one toned mark across all lessons", () => {
  assert.ok(suiteLinesMeasured > 0, "no toned mark measured anywhere");
});
const QR1_MARKS = ["axis", "grid", "legend", "line", "area", "dot", "circle", "rect", "arc", "arrow", "path", "label", "dim", "angle", "brace", "node", "edge", "cell", "math", "code", "mock", "trace", "flow", "sweep", "custom"];
for (const viewport of ["desktop", "mobile"]) {
  test(`VO-15 QR-1 ${viewport}: fixture lessons rendered every implemented mark/motion item and all 4 frames, with multi-panel figures`, () => {
    assert.deepEqual(QR1_MARKS.filter((m) => !seen[viewport].marks.has(m)), []);
    assert.deepEqual(["cartesian", "graph", "cells", "geo"].filter((x) => !seen[viewport].frames.has(x)), []);
    assert.ok(seen[viewport].multi >= 3, "split, multiples and compare render ≥ 2 panels");
  });
}

// ---------- VO-16 ----------
const FIG_TYPES = new Set(["hook", "explain", "define", "explore", "steps"]);
for (const f of LESSONS) {
  const inp = load(await importFile(f)).input;
  const scenes = globalScenes(inp).filter((s) => FIG_TYPES.has(s.type) && s.scene.figure);
  for (const viewport of ["desktop", "mobile"]) {
    test(`VO-16 C-52 ${f.split("/").pop()} ${viewport}: 2 text-heaviest scenes, browser layout and DOM text boxes = Node layoutFigure ±1 px`, { timeout: 180000 }, async () => {
      const { page, ctx } = await open(browser, sites.get(f).url, { viewport });
      const counts = [];
      for (const s of scenes) {
        await goto(page, s.index);
        await page.evaluate(() => window.__ltt.freeze(0, 0));
        await page.evaluate(() => window.__ltt.ready());
        const lay = await page.evaluate(() => window.__ltt.layout());
        counts.push([lay[0]?.items.filter((i) => i.kind === "text").length ?? 0, s]);
      }
      const top = counts.sort((a, b) => b[0] - a[0]).slice(0, 2).map((c) => c[1]);
      assert.equal(top.length, 2);
      for (const s of top) {
        await goto(page, s.index);
        const { t, step } = stateTime(inp, s, "initial");
        await page.evaluate(([a, b]) => window.__ltt.freeze(a, b), [t, step]);
        await page.evaluate(() => window.__ltt.ready());
        await settle(page);
        const st = await page.evaluate(() => window.__ltt.state());
        const [blay] = await page.evaluate(() => window.__ltt.layout());
        const focus = s.type === "steps" ? s.scene.steps[st.step].focus : s.scene.focus ?? null;
        const nlay = await layoutFigure(inp, s.scene.figure, { viewport, t: st.t, step: st.step, params: st.params, focus });
        const nt = nlay.items.filter((i) => i.kind === "text"), bt = blay.items.filter((i) => i.kind === "text");
        assert.deepEqual(bt.map((i) => i.id).sort(), nt.map((i) => i.id).sort(), `scene ${s.index} text ids`);
        for (const n of nt) {
          const b = bt.find((i) => i.id === n.id);
          for (const k of ["x", "y", "width", "height"]) assert.ok(Math.abs(b.box[k] - n.box[k]) <= 1, `scene ${s.index} ${n.id} layout ${k} ${b.box[k]} vs ${n.box[k]}`);
        }
        const dom = await page.evaluate(() => [...document.querySelectorAll("[data-ltt-stage] [data-ltt-text]")].map((e) => { const r = e.getBoundingClientRect(); return { id: e.getAttribute("data-ltt-text-id"), x: r.x, y: r.y, width: r.width, height: r.height }; }));
        let off = null;
        for (const n of nt) {
          const d = dom.find((x) => x.id === n.id);
          assert.ok(d, `scene ${s.index} DOM text ${n.id}`);
          off ??= [d.x - n.box.x, d.y - n.box.y];
          assert.ok(Math.abs(d.x - n.box.x - off[0]) <= 1 && Math.abs(d.y - n.box.y - off[1]) <= 1, `scene ${s.index} ${n.id} DOM position`);
          assert.ok(Math.abs(d.width - n.box.width) <= 1 && Math.abs(d.height - n.box.height) <= 1, `scene ${s.index} ${n.id} DOM size ${d.width}×${d.height} vs ${n.box.width}×${n.box.height}`);
        }
      }
      await ctx.close();
    });
  }
}
