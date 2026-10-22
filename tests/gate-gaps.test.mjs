import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as AUDIT from "../skills/learn-to-tell/server/audit.mjs";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";

// Spec df4d5d6613e9ad3c v2 VO-1..VO-6. Expected values come from the spec's FR/Cases, from geometry computed here,
// and from the existing check-rule message format (tests/check.test.mjs); never from running the implementation.
// Fixtures: tests/fixtures/gate-gaps/, installed into a temporary LTT home as lessons.

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FIX = join(ROOT, "tests/fixtures/gate-gaps");
const KIT = join(ROOT, "skills/learn-to-tell");
const { exitCode, findChrome } = AUDIT;
const chrome = findChrome?.();
const skip = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
  : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;
const T = { skip, timeout: 300_000 };

const scratch = [];
const tmp = (prefix) => {
  const d = mkdtempSync(join(tmpdir(), prefix));
  scratch.push(d);
  return d;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let home, server, port, seq = 0, browser;

function install(fixture, subst = {}) {
  const id = `20261022-gg${++seq}`;
  const dir = join(home, "lessons", id);
  mkdirSync(dir, { recursive: true });
  let html = readFileSync(join(FIX, fixture), "utf8");
  for (const [k, v] of Object.entries(subst)) html = html.replaceAll(k, String(v));
  assert.equal(/__[A-Z_]+__/.test(html), false, `unreplaced placeholder in ${fixture}`);
  writeFileSync(join(dir, "lesson.html"), html);
  return id;
}

// ---------- minimal CDP driver over --remote-debugging-pipe ----------

function launchBrowser() {
  const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    `--user-data-dir=${tmp("ltt-gg-chrome-")}`, "--window-size=1440,900", "--remote-debugging-pipe", "about:blank"];
  if (process.getuid?.() === 0) args.unshift("--no-sandbox");
  const child = spawn(chrome, args, { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
  const out = child.stdio[3], inp = child.stdio[4];
  let nextId = 0, buf = "";
  const pending = new Map();
  inp.setEncoding("utf8");
  inp.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\0")) >= 0) {
      const msg = JSON.parse(buf.slice(0, i));
      buf = buf.slice(i + 1);
      const p = msg.id != null && pending.get(msg.id);
      if (p) {
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`));
        else p.resolve(msg.result);
      }
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject, method });
    out.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + "\0");
  });

  async function open(url, readyAttr = "data-ltt-check", vp = [1440, 900]) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    await s("Page.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: vp[0], height: vp[1], deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url });
    const page = {
      async eval(expression) {
        const r = await s("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
      },
      mouse: (type, x, y, extra = {}) => s("Input.dispatchMouseEvent", { type, x, y, button: type === "mouseMoved" && !extra.buttons ? "none" : "left", clickCount: type === "mouseMoved" ? 0 : 1, pointerType: "mouse", ...extra }),
      async png() { return Buffer.from((await s("Page.captureScreenshot", { format: "png" })).data, "base64"); },
      close: () => send("Target.closeTarget", { targetId }),
    };
    const deadline = Date.now() + 20_000;
    for (;;) {
      try { if (await page.eval(`document.documentElement.hasAttribute(${JSON.stringify(readyAttr)})`)) break; } catch {}
      if (Date.now() > deadline) throw new Error(`${url}: ${readyAttr} never appeared`);
      await sleep(100);
    }
    await sleep(300);
    return page;
  }
  return { open, close: () => { child.kill("SIGKILL"); } };
}

before(async () => {
  if (skip) return;
  home = tmp("ltt-gg-home-");
  server = createLttServer({ home });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
  browser = launchBrowser();
});
after(async () => {
  browser?.close();
  if (server) await new Promise((r) => server.close(r));
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

const urlOf = (id, q = "") => `http://127.0.0.1:${port}/lessons/${id}/lesson.html${q}`;
async function withPage(id, q, fn, readyAttr, vp) {
  const page = await browser.open(urlOf(id, q), readyAttr, vp);
  try { return await fn(page); } finally { await page.close().catch(() => {}); }
}
const runAudit = async (opts) => AUDIT.audit({ sizes: ["1440x900"], chrome, home, jobs: 2, ...opts });
const auditOne = async (fixture, subst, opts = {}) => {
  const id = install(fixture, subst);
  const results = await runAudit({ targets: [id], ...opts });
  assert.equal(results.length, 1);
  return { id, r: results[0], results };
};

// ---------- VO-1: predict question (FR-1, C-1..C-3), equivalence partitioning x {before, after reveal} ----------

const OBS_Q = `(function () {
  var w = document.querySelector(".dk-pred"), q = w.querySelector(".dk-pq"), pv = w.querySelector(".dk-pvis");
  var qr = q && q.getBoundingClientRect(), pr = pv && pv.getBoundingClientRect();
  var term = q && q.querySelector(".ltt-term");
  return {
    done: w.classList.contains("done"),
    hasQ: !!q, text: q ? q.textContent.trim() : null,
    pvis: !!pv,
    qBeforePvis: !!(q && pv && (q.compareDocumentPosition(pv) & Node.DOCUMENT_POSITION_FOLLOWING)),
    qAbovePvis: !!(qr && pr && qr.bottom <= pr.top + 1),
    qShown: !!(q && qr.width > 0 && qr.height > 0 && getComputedStyle(q).display !== "none" && (!q.checkVisibility || q.checkVisibility())),
    term: term ? { key: term.getAttribute("data-term"), text: term.textContent } : null,
    termLinks: q ? q.querySelectorAll(".ltt-term").length : 0,
    cursor: q ? getComputedStyle(q).cursor : null, font: q ? getComputedStyle(q).fontFamily : null,
    nTerms: w.querySelectorAll(".dk-pq").length,
  };
})()`;
const NEXT = `(function () {
  var b = [].find.call(document.querySelectorAll("button"), function (x) { return x.textContent.trim().indexOf("다음") === 0; });
  b.click();
})()`;
const CHIP = `(function () {
  var c = document.querySelector(".dk-stage .dk-q, .dk-q");
  return c ? { cursor: getComputedStyle(c).cursor, font: getComputedStyle(c).fontFamily } : null;
})()`;
const REVEAL = `(function () {
  var w = document.querySelector(".dk-pred");
  w.querySelector("[data-choice=a]").click();
  var lock = [].find.call(w.querySelectorAll("button"), function (b) { return b.textContent.trim() === "정답 보기"; });
  lock.click();
})()`;

const VO1 = [
  { name: "question present (C-1)", prop: `question:${JSON.stringify("두 집단 평균 답의 차이는?")},`, text: "두 집단 평균 답의 차이는?", term: null },
  { name: "question absent (C-2)", prop: "", text: null },
  { name: "question empty string (C-2, Errors)", prop: 'question:"",', text: null },
  { name: "question with {{용어}} (C-3)", prop: `question:${JSON.stringify("{{적중률}}은 얼마인가?")},`, text: "적중률은 얼마인가?", term: { key: "적중률", text: "적중률" } },
];
for (const v of VO1) {
  test(`VO-1 predict ${v.name}: .dk-pq before and after reveal`, T, async () => {
    const id = install("predict-deck.html", { __QPROP__: v.prop });
    await withPage(id, "", async (page) => {
      let pq = null;
      for (const phase of ["before reveal", "after reveal"]) {
        if (phase === "after reveal") {
          await page.eval(REVEAL);
          await sleep(1000);
        }
        const o = await page.eval(OBS_Q);
        const at = `${v.name} ${phase}`;
        assert.equal(o.done, phase === "after reveal", `${at}: reveal state`);
        assert.equal(o.pvis, true, `${at}: .dk-pvis condition visual missing`);
        if (v.text === null) {
          assert.equal(o.hasQ, false, `${at}: .dk-pq must not exist`);
          continue;
        }
        assert.equal(o.hasQ, true, `${at}: .dk-pq missing`);
        assert.equal(o.nTerms, 1, `${at}: exactly one .dk-pq in the scene`);
        assert.equal(o.text, v.text, `${at}: text`);
        assert.equal(o.qBeforePvis, true, `${at}: .dk-pq must precede .dk-pvis in document order`);
        assert.equal(o.qAbovePvis, true, `${at}: .dk-pq must be drawn above .dk-pvis`);
        assert.equal(o.qShown, true, `${at}: .dk-pq must stay visible`);
        assert.notEqual(o.cursor, "copy", `${at}: question must not inherit the copy cursor`);
        pq = o;
        if (v.term) assert.deepEqual(o.term, v.term, `${at}: {{용어}} becomes a .ltt-term link`);
        else assert.equal(o.termLinks, 0, `${at}: no term link expected`);
      }
      if (pq) {
        await page.eval(NEXT);
        await sleep(1200);
        const chip = await page.eval(CHIP);
        assert.ok(chip, "keywords scene search chip .dk-q not found");
        assert.equal(chip.cursor, "copy", "precondition: the chip really is the copy chip");
        assert.notEqual(pq.font, chip.font, "question must not use the chip's font-family");
      }
    });
  });
}

// ---------- VO-2: dial/pad drag geometry (FR-3, C-4..C-6, QR-3), scenario with trusted pointer input ----------

const FLEX = "display:flex;gap:20px;align-items:center;flex-wrap:wrap;justify-content:center";
const READ = {
  dial: `document.getElementById("ctl").getAttribute("aria-valuenow")`,
  pad: `document.querySelector("#ctl .dot").getAttribute("aria-valuetext")`,
};
const RECT = {
  dial: `(function(){var r=document.getElementById("ctl").getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};})()`,
  pad: `(function(){var r=document.querySelector("#ctl .area").getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};})()`,
};
const dragFixture = (which, shifting, step = 1) => install("sweep-drag.html", {
  __WHICH__: which, __STEP__: step,
  __ROWSTYLE__: shifting ? FLEX : "",
  __CTLSTYLE__: which === "pad" ? "width:200px" : "",
});
// Angle in degrees clockwise from 12 o'clock, radius 60 px from the dial centre (the dial is 168 px wide).
const dialPoint = (r, deg) => ({ x: r.left + r.width / 2 + 60 * Math.sin(deg * Math.PI / 180), y: r.top + r.height / 2 - 60 * Math.cos(deg * Math.PI / 180) });
const padPoint = (r, fx, fy) => ({ x: r.left + r.width * fx, y: r.top + r.height * fy });

async function dragAt(page, which, start, hold) {
  const before = await page.eval(RECT[which]);
  await page.mouse("mouseMoved", start.x, start.y);
  await page.mouse("mousePressed", start.x, start.y, { buttons: 1 });
  await sleep(60);
  const values = [await page.eval(READ[which])];
  const rects = [before];
  for (let i = 0; i < hold; i++) {
    await page.mouse("mouseMoved", start.x, start.y, { buttons: 1 });
    await sleep(40);
    values.push(await page.eval(READ[which]));
  }
  rects.push(await page.eval(RECT[which]));
  return { values, rects };
}
const changes = (values) => values.slice(1).filter((v, i) => v !== values[i]).length;

for (const [which, shifting, pt, expect, caseId] of [
  ["dial", true, (r) => dialPoint(r, 135), "135", "C-4"],
  ["pad", true, (r) => padPoint(r, 0.8, 0.3), "80, 70", "C-5"],
]) {
  test(`VO-2 ${which} fixed pointer in a layout that shifts with the value (${caseId}, QR-3): value never changes after the press`, T, async () => {
    const id = dragFixture(which, true);
    await withPage(id, "", async (page) => {
      const r0 = await page.eval(RECT[which]);
      const { values, rects } = await dragAt(page, which, pt(r0), 10);
      assert.equal(values[0], expect, "value at press (from geometry at pointerdown)");
      assert.ok(await page.eval("window.__pm") >= 5, "trusted pointermove events must reach the page");
      // Precondition that makes the oracle sensitive: the neighbour readout really moved the control during the hold.
      assert.ok(Math.abs(rects[1].left - rects[0].left) >= 20, `control did not shift (${rects[0].left} -> ${rects[1].left})`);
      assert.equal(changes(values), 0, `value changed while the pointer stood still: ${values.join(" | ")}`);
      await page.mouse("mouseReleased", pt(r0).x, pt(r0).y, { buttons: 0 });
    });
  });
}

test("VO-2 dial without layout shift: press at 92.4 deg with step 5 reads 90, drag on to 268 deg reads 270 (C-6)", T, async () => {
  const id = dragFixture("dial", false, 5);
  await withPage(id, "", async (page) => {
    const r = await page.eval(RECT.dial);
    const a = dialPoint(r, 92.4);
    const { values } = await dragAt(page, "dial", a, 3);
    assert.deepEqual(values, ["90", "90", "90", "90"]);
    for (let d = 120; d <= 268; d += 28) {
      const p = dialPoint(r, d);
      await page.mouse("mouseMoved", p.x, p.y, { buttons: 1 });
      await sleep(30);
    }
    const end = dialPoint(r, 268);
    await page.mouse("mouseMoved", end.x, end.y, { buttons: 1 });
    await sleep(60);
    assert.equal(await page.eval(READ.dial), "270");
    await page.mouse("mouseReleased", end.x, end.y, { buttons: 0 });
  });
});

test("VO-2 pad without layout shift: press at (0.8, 0.3) reads 80, 70; drag to (0.25, 0.9) reads 25, 10 (normal drag)", T, async () => {
  const id = dragFixture("pad", false);
  await withPage(id, "", async (page) => {
    const r = await page.eval(RECT.pad);
    const a = padPoint(r, 0.8, 0.3);
    const { values } = await dragAt(page, "pad", a, 3);
    assert.deepEqual(values, ["80, 70", "80, 70", "80, 70", "80, 70"]);
    for (const [fx, fy] of [[0.6, 0.5], [0.4, 0.7], [0.25, 0.9]]) {
      const p = padPoint(r, fx, fy);
      await page.mouse("mouseMoved", p.x, p.y, { buttons: 1 });
      await sleep(40);
    }
    assert.equal(await page.eval(READ.pad), "25, 10");
    const e = padPoint(r, 0.25, 0.9);
    await page.mouse("mouseReleased", e.x, e.y, { buttons: 0 });
  });
});

// ---------- VO-3: audit check = ?check union ?shot (FR-4, C-7..C-9, C-15), decision table ----------

const UBD = (where) => ({ where, rule: "used-before-defined", msg: "'적중률'가 풀이(첫 {{적중률}})보다 먼저 쓰였다" });
const ONE = [UBD("구역 '그림'")];

for (const [label, fixture, subst, want] of [
  ["error only in the learner (?check) state, answer block shown only under ?shot (C-7)", "ubd-answer.html", {}, ONE],
  ["error only in the learner (?check) state, flag fixture (C-7)", "ubd-flags.html", { __CHECK_BARE__: "true", __SHOT_BARE__: "false" }, ONE],
  ["error only in the ?shot state (C-8)", "ubd-flags.html", { __CHECK_BARE__: "false", __SHOT_BARE__: "true" }, ONE],
  ["same error in both states is reported once (C-9)", "ubd-flags.html", { __CHECK_BARE__: "true", __SHOT_BARE__: "true" }, ONE],
  ["error in neither state", "ubd-flags.html", { __CHECK_BARE__: "false", __SHOT_BARE__: "false" }, []],
]) {
  test(`VO-3 audit check: ${label}`, T, async () => {
    const { r } = await auditOne(fixture, subst);
    assert.equal(r.error, undefined);
    assert.deepEqual(r.check, want);
    assert.equal(exitCode([r]), want.length ? 1 : 0);
  });
}

test("VO-3 audit: kit loads under ?shot but not under ?check gives an error item and exit code 2; other targets are still measured (C-15)", T, async () => {
  const bad = install("kit-late.html");
  const good = install("ubd-flags.html", { __CHECK_BARE__: "false", __SHOT_BARE__: "false" });
  // Precondition: the page is healthy under ?shot, so the error below can only come from the ?check load.
  await withPage(bad, "?shot", async () => {}, "data-ltt-shot");
  const results = await runAudit({ targets: [bad, good], budget: 4000 });
  const rb = results.find((r) => r.target.includes(bad)), rg = results.find((r) => r.target.includes(good));
  assert.ok(rb && rg, "both targets must be reported");
  assert.equal(typeof rb.error, "string");
  assert.ok(rb.error.length > 0);
  assert.equal(rg.error, undefined);
  assert.deepEqual(rg.check, []);
  assert.equal(exitCode(results), 2);
});

// ---------- VO-4: control-shift (FR-5, C-10..C-14), BVA 2-value + EP ----------

const shiftOpts = (kinds, over = {}) => ({ __KINDS__: kinds, __PX__: 2, __MOVE__: 1, __HIDE__: 0, ...over });
const shifts = (r) => r.check.filter((c) => c.rule === "control-shift");
const pxOf = (msg) => {
  const m = /(\d+(?:\.\d+)?)\s*px/.exec(msg);
  assert.ok(m, `no px number in msg: ${msg}`);
  return Number(m[1]);
};

test("VO-4 range moving exactly 1 px stays quiet (C-11 lower bound)", T, async () => {
  const { r } = await auditOne("shift.html", shiftOpts("range", { __PX__: 1 }));
  assert.equal(r.error, undefined);
  assert.deepEqual(shifts(r), []);
  assert.equal(r.check.some((c) => c.rule === "probe-failed"), false);
});

test("VO-4 range moving 2 px gives one control-shift naming the id and 2 px (C-11 upper bound)", T, async () => {
  const { r } = await auditOne("shift.html", shiftOpts("range", { __PX__: 2 }));
  const s = shifts(r);
  assert.equal(s.length, 1, JSON.stringify(r.check));
  assert.equal(s[0].where, "페이지");
  assert.ok(s[0].msg.includes("r1"), s[0].msg);
  assert.ok(Math.abs(pxOf(s[0].msg) - 2) < 0.1, s[0].msg);
});

for (const [kind, id] of [["dial", "hue"], ["pad", "xy"]]) {
  test(`VO-4 ${kind} pushed by a readout that changes width gives one control-shift with the id and px (C-10)`, T, async () => {
    const { r } = await auditOne("shift.html", shiftOpts(kind));
    const s = shifts(r);
    assert.equal(s.length, 1, JSON.stringify(r.check));
    assert.equal(s[0].where, "페이지");
    assert.ok(s[0].msg.includes(id), s[0].msg);
    assert.ok(pxOf(s[0].msg) > 1, s[0].msg);
  });
}

test("VO-4 range, dial and pad all moving: one control-shift per control", T, async () => {
  const { r } = await auditOne("shift.html", shiftOpts("range,dial,pad"));
  const s = shifts(r);
  assert.equal(s.length, 3, JSON.stringify(r.check));
  for (const id of ["r1", "hue", "xy"]) assert.equal(s.filter((c) => c.msg.includes(id)).length, 1, `${id}: ${JSON.stringify(s)}`);
});

test("VO-4 stable range, dial and pad (fixed-width readouts) give no control-shift (C-12 page)", T, async () => {
  const { r } = await auditOne("shift.html", shiftOpts("range,dial,pad", { __MOVE__: 0 }));
  assert.equal(r.error, undefined);
  assert.deepEqual(shifts(r), []);
  assert.equal(r.check.some((c) => c.rule === "probe-failed"), false);
});

test("VO-4 hidden (display:none) controls whose neighbours would move are not checked (C-13)", T, async () => {
  const { r } = await auditOne("shift.html", shiftOpts("range,dial,pad", { __HIDE__: 1 }));
  assert.equal(r.error, undefined);
  assert.deepEqual(shifts(r), []);
  assert.equal(r.check.some((c) => c.rule === "probe-failed"), false);
});

test("VO-4 deck: a moving dial only in scene 3 is reported at 장면 3 (C-14)", T, async () => {
  const { r } = await auditOne("shift-deck.html", { __MOVE_SCENE__: "3" });
  assert.equal(r.error, undefined);
  const s = shifts(r);
  assert.equal(s.length, 1, JSON.stringify(r.check));
  assert.equal(s[0].where, "장면 3");
  assert.ok(s[0].msg.includes("hue3"), s[0].msg);
  assert.ok(pxOf(s[0].msg) > 1, s[0].msg);
});

test("VO-4 deck with only stable controls gives no control-shift (C-12 deck)", T, async () => {
  const { r } = await auditOne("shift-deck.html", { __MOVE_SCENE__: "none" });
  assert.equal(r.error, undefined);
  assert.deepEqual(shifts(r), []);
  assert.equal(r.check.some((c) => c.rule === "probe-failed"), false);
});

// C-19 / C-20: fixtures that isolate one box dimension; the page's own geometry is measured through CDP first so the
// other dimensions are known to stay fixed, then audit must still report exactly one control-shift.
const dimsInstall = (mode, low = 0, high = 0) => install("shift-dims.html", { __MODE__: mode, __LOW__: low, __HIGH__: high });
const BOX = `(function(s){var r=document.querySelector(s).getBoundingClientRect();return {left:r.left,top:r.top,width:r.width};})`;
const boxAfter = (page, sel, act) => page.eval(`(function(){${act};return ${BOX}(${JSON.stringify(sel)});})()`);
const setRange = (v) => `var i=document.getElementById("r1");i.value=${v};i.dispatchEvent(new Event("input",{bubbles:true}))`;
const keys = (n) => `var h=document.getElementById("hue");for(var k=0;k<${n};k++)h.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}))`;
const delta = (a, b) => ({ left: b.left - a.left, top: b.top - a.top, width: b.width - a.width });
const near = (x, y) => Math.abs(x - y) < 0.1;

async function auditDims(id) {
  const [r] = await runAudit({ targets: [id] });
  assert.equal(r.error, undefined);
  assert.equal(r.check.some((c) => c.rule === "probe-failed"), false);
  return shifts(r);
}

test("VO-4 C-19 top only: a block above the range grows with the value; left and width stay fixed; one control-shift", T, async () => {
  const id = dimsInstall("top");
  await withPage(id, "", async (page) => {
    const a = await boxAfter(page, "#r1", "");
    const d = delta(a, await boxAfter(page, "#r1", setRange(100)));
    assert.ok(near(d.top, 5) && near(d.left, 0) && near(d.width, 0), JSON.stringify(d));
  });
  const s = await auditDims(id);
  assert.equal(s.length, 1, JSON.stringify(s));
  assert.ok(s[0].msg.includes("r1"), s[0].msg);
  assert.ok(Math.abs(pxOf(s[0].msg) - 5) < 0.1, s[0].msg);
});

test("VO-4 C-19 width only: the range's own width grows with the value; left and top stay fixed; one control-shift", T, async () => {
  const id = dimsInstall("width");
  await withPage(id, "", async (page) => {
    const a = await boxAfter(page, "#r1", "");
    const d = delta(a, await boxAfter(page, "#r1", setRange(100)));
    assert.ok(near(d.width, 5) && near(d.left, 0) && near(d.top, 0), JSON.stringify(d));
  });
  const s = await auditDims(id);
  assert.equal(s.length, 1, JSON.stringify(s));
  assert.ok(s[0].msg.includes("r1"), s[0].msg);
  assert.ok(Math.abs(pxOf(s[0].msg) - 5) < 0.1, s[0].msg);
});

for (const [low, high] of [[4, 6], [6, 4]]) {
  test(`VO-4 C-20 range moves only mid-sweep (30..40 by ${low} px, 60..70 by ${high} px) and returns; msg px is the larger, 6`, T, async () => {
    const id = dimsInstall("mid-range", low, high);
    await withPage(id, "", async (page) => {
      const a = await boxAfter(page, "#r1", "");
      const lo = delta(a, await boxAfter(page, "#r1", setRange(35)));
      const hi = delta(a, await boxAfter(page, "#r1", setRange(65)));
      const end = delta(a, await boxAfter(page, "#r1", setRange(100)));
      assert.ok(near(lo.left, low) && near(lo.top, 0) && near(lo.width, 0), JSON.stringify(lo));
      assert.ok(near(hi.left, high) && near(hi.top, 0) && near(hi.width, 0), JSON.stringify(hi));
      assert.deepEqual([end.left, end.top, end.width], [0, 0, 0], "control must be back at the start at the end of the sweep");
    });
    const s = await auditDims(id);
    assert.equal(s.length, 1, JSON.stringify(s));
    assert.ok(Math.abs(pxOf(s[0].msg) - 6) < 0.1, s[0].msg);
  });
}

for (const [low, high] of [[4, 6], [6, 4]]) {
  test(`VO-4 C-20 dial moves only mid-sweep (key steps 8..12 by ${low} px, 26..30 by ${high} px) and returns after 40 steps; msg px is 6`, T, async () => {
    const id = dimsInstall("mid-dial", low, high);
    await withPage(id, "", async (page) => {
      const a = await boxAfter(page, "#hue", "");
      const lo = delta(a, await boxAfter(page, "#hue", keys(10)));
      const hi = delta(a, await boxAfter(page, "#hue", keys(18)));
      const end = delta(a, await boxAfter(page, "#hue", keys(12)));
      assert.ok(near(lo.left, low) && near(lo.top, 0) && near(lo.width, 0), JSON.stringify(lo));
      assert.ok(near(hi.left, high) && near(hi.top, 0) && near(hi.width, 0), JSON.stringify(hi));
      assert.deepEqual([end.left, end.top, end.width], [0, 0, 0], "40 key steps must wrap back to the start");
    });
    const s = await auditDims(id);
    assert.equal(s.length, 1, JSON.stringify(s));
    assert.ok(s[0].msg.includes("hue"), s[0].msg);
    assert.ok(Math.abs(pxOf(s[0].msg) - 6) < 0.1, s[0].msg);
  });
}

test("VO-4 C-18: an exception during the probe gives one trailing probe-failed, keeps other check errors and screenshots, exit code 1", T, async () => {
  const dir = tmp("ltt-gg-shots-");
  const { r } = await auditOne("probe-throw.html", {}, { shots: dir });
  assert.equal(r.error, undefined);
  assert.equal(r.check.filter((c) => c.rule === "probe-failed").length, 1, JSON.stringify(r.check));
  assert.equal(r.check[r.check.length - 1].rule, "probe-failed");
  assert.equal(typeof r.check[r.check.length - 1].msg, "string");
  assert.deepEqual(shifts(r), []);
  assert.deepEqual(r.check.filter((c) => c.rule === "used-before-defined"), [UBD("구역 '그림'")]);
  assert.equal(r.check.length, 2);
  assert.equal(exitCode([r]), 1);
  assert.ok(r.shots.length >= 1);
  for (const f of r.shots) assert.ok(existsSync(f) && readFileSync(f).subarray(1, 4).toString() === "PNG", f);
});

// ---------- VO-5: probe leaves no events and no screenshot trace (FR-6, C-16, C-17, QR-4), scenario ----------

const INPUT_TYPES = ["range-input", "sweep-render"];
const eventTypes = (id) => {
  const f = join(home, "lessons", id, "events.jsonl");
  return existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).type) : [];
};

test("VO-5 C-16 precondition: real input on the events fixture does record input-only event types", T, async () => {
  const id = install("events.html");
  await withPage(id, "", async (page) => {
    await page.eval(`(function(){var i=document.getElementById("r1");i.value=100;i.dispatchEvent(new Event("input",{bubbles:true}));
      document.getElementById("hue").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));
      document.querySelector("#xy .dot").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));})()`);
    await sleep(800);
  });
  const types = eventTypes(id);
  for (const t of INPUT_TYPES) assert.ok(types.includes(t), `${t} not recorded by real input: ${types.join(",")}`);
});

test("VO-5 C-16: audit of a lesson whose page records on input adds no input-type event lines", T, async () => {
  const id = install("events.html");
  const before = eventTypes(id).filter((t) => INPUT_TYPES.includes(t)).length;
  const results = await runAudit({ targets: [id] });
  assert.equal(results[0].error, undefined);
  assert.ok(results[0].check.some((c) => c.rule === "control-shift"), "the probe must have run (the range neighbour moves 2 px, dial and pad are pushed)");
  await sleep(500);
  const after = eventTypes(id).filter((t) => INPUT_TYPES.includes(t)).length;
  assert.equal(after - before, 0, `events.jsonl gained input-type lines: ${eventTypes(id).join(",")}`);
});

test("VO-5 FR-6: blocking is lifted after the probe, so the kit's lint event for a page with a check error still reaches events.jsonl", T, async () => {
  const subst = { __CHECK_BARE__: "true", __SHOT_BARE__: "true" };
  const pre = install("ubd-flags.html", subst);
  await withPage(pre, "", async () => { await sleep(800); });
  assert.ok(eventTypes(pre).filter((t) => t === "lint").length >= 1, "precondition: a plain load of this page records a lint event");
  const id = install("ubd-flags.html", subst);
  const [r] = await runAudit({ targets: [id] });
  assert.equal(r.check.length, 1);
  await sleep(500);
  // FR-4 reads the check from two loads (?shot and ?check), each recording a lint event for this page; a block that is
  // never lifted after the probe would leave only the load that precedes it.
  const lints = eventTypes(id).filter((t) => t === "lint").length;
  assert.ok(lints >= 2, `expected >= 2 lint events (one per check load), got ${lints}: ${eventTypes(id).join(",")}`);
});

test("VO-5 C-17: audit --shots PNG of a page with moving controls equals an independent capture of the untouched ?shot load; moving the controls would change it", T, async () => {
  const id = install("shift.html", shiftOpts("range,dial,pad"));
  const dir = tmp("ltt-gg-shots-");
  const [r1] = await runAudit({ targets: [id], shots: dir });
  assert.equal(r1.error, undefined);
  assert.ok(r1.shots.length >= 1);
  const png1 = readFileSync(r1.shots[0]);
  const dir2 = tmp("ltt-gg-shots-");
  const [r2] = await runAudit({ targets: [id], shots: dir2 });
  assert.ok(png1.equals(readFileSync(r2.shots[0])), "two audit runs of the same page produced different first PNGs");
  await withPage(id, "?shot", async (page) => {
    const initial = await page.png();
    assert.ok(png1.equals(initial), "audit PNG differs from an independent capture of the initial ?shot state");
    await page.eval(`(function(){var i=document.getElementById("r1");i.value=100;i.dispatchEvent(new Event("input",{bubbles:true}));
      for(var k=0;k<20;k++)document.getElementById("hue").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));})()`);
    await sleep(300);
    assert.ok(!initial.equals(await page.png()), "oracle is blind: moving the controls does not change the screenshot");
  }, "data-ltt-shot", r1.viewport);
});

// ---------- VO-6: documents (FR-2, FR-7, QR-5), unit ----------

const read = (p) => readFileSync(join(KIT, p), "utf8");

test("VO-6 kit/api/rules.md lists control-shift", () => {
  assert.match(read("kit/api/rules.md"), /`control-shift`/);
});

test("VO-6 kit/API.md predict row describes question as the question shown on screen", () => {
  const row = read("kit/API.md").split("\n").find((l) => l.startsWith("| `predict`"));
  assert.ok(row, "predict row missing");
  assert.match(row, /`question`[^|]*?화면에 보이는 질문|화면에 보이는 질문[^|]*?`question`/);
});

test("VO-6 kit/api/controls.md states the fixed-width readout rule", () => {
  const line = read("kit/api/controls.md").split("\n").find((l) => /폭을? 고정/.test(l) && /가운데 정렬/.test(l));
  assert.ok(line, "no line with 폭 ... 고정 and 가운데 정렬");
  assert.match(line, /두지 않는다/);
});

const SKILL = read("SKILL.md");
const A4_CRITERIA = [
  "질문을 던지는 화면(예측, 떠올리기)은 화면에 보이는 글과 그림만으로 무엇을 묻는지 한 문장으로 말할 수 있어야 한다.",
  "자료의 흐름은 논리적으로 이어져야 하며, 새로운 대상·사례·예·변형 등은 논리적 흐름 위에서 소개되거나, 확장되어야 한다.",
  "서로 이어진 그림의 숫자는 화면에 보이는 값만으로 이어져야 한다.",
];
const A4_CHECKLIST = [
  "질문 화면마다: 화면만 보고 이 화면이 묻는 것을 한 문장으로 적는다.",
  "새 대상·사례·변형마다: 처음 나온 화면에서 앞 흐름과 무엇으로 이어지는지 적는다.",
  "숫자가 이어진 그림 쌍마다: 한쪽 숫자를 다른 쪽 화면에 보이는 값으로 계산해 본다.",
];
for (const [i, s] of A4_CRITERIA.entries()) {
  test(`VO-6 SKILL.md criteria sentence ${i + 1} (A-4) appears verbatim after the 평가 기준 heading`, () => {
    const head = SKILL.indexOf("### 평가 기준");
    assert.ok(head >= 0, "### 평가 기준 heading missing");
    assert.ok(SKILL.indexOf(s, head) > head, s);
  });
}
for (const [i, s] of A4_CHECKLIST.entries()) {
  test(`VO-6 SKILL.md checklist line ${i + 1} (A-4) appears verbatim`, () => {
    assert.ok(SKILL.includes(s), s);
  });
}
test("VO-6 SKILL.md verification section says check is read in the ?check state", () => {
  assert.ok(SKILL.includes("?check"), "SKILL.md never mentions ?check");
});

test("VO-4 C-21: a range whose neighbour resizes only in the next animation frame gives one control-shift of about 40 px", T, async () => {
  const { r } = await auditOne("raf-shift.html");
  const s = shifts(r);
  assert.equal(s.length, 1, JSON.stringify(r.check));
  assert.ok(s[0].msg.includes("r1"), s[0].msg);
  assert.ok(Math.abs(pxOf(s[0].msg) - 40) <= 1, s[0].msg);
});
