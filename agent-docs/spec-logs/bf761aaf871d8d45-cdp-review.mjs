// R-2 (spec bf761aaf871d8d45, from 74cb05d7da21907e-cdp-review.mjs; errors mode rewritten for TV-6): drives headless Chrome over the DevTools protocol against <repo>'s server.
// Usage: node 74cb05d7da21907e-cdp-review.mjs <reveal|resize|errors|timing> <repo> <out.json> [jobs=2]
//   reveal  every gallery predict scene × 1440×813·1280×713 × every choice: entry zoom, zoom after pick + reveal (VO-6)
//   resize  revealed scene resized A→B (both ways) for the answer and the first wrong choice, and re-entered after a resize,
//           compared with a fresh load at B revealed the same way (VO-7)
//   errors  bf761aaf871d8d45-error-fixture.html: answerVisual / step enter throwing during measurement, with discrimination guards (VO-9)
//   timing  1440×813: synchronous go(i) time into each predict scene from the scene before it, 5 fresh loads
//   requests 1440×813: every gallery page's request URLs (query stripped) after load, and the .css ones outside /kit/vendor/
// Viewport sizes are the audit window sizes minus the headless toolbar (audit.mjs reports 1440×813 and 1280×713).
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const [mode, repo, outFile, jobsArg = "2"] = process.argv.slice(2);
const here = dirname(fileURLToPath(import.meta.url));
const { findChrome, galleryTargets } = await import(join(repo, "skills/learn-to-tell/server/audit.mjs"));
const { createLttServer } = await import(join(repo, "skills/learn-to-tell/server/server.mjs"));
const gallery = join(repo, "site/gallery");
const home = mkdtempSync(join(tmpdir(), "ltt-cdp-home-"));
mkdirSync(join(home, "lessons", "cdp-fixture"), { recursive: true });
copyFileSync(join(here, "bf761aaf871d8d45-error-fixture.html"), join(home, "lessons", "cdp-fixture", "lesson.html"));
const server = createLttServer({ home, galleryDir: gallery });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const SIZES = { "1440x813": [1440, 813], "1280x713": [1280, 713] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let loadNo = 0;

async function openBrowser() {
  const prof = mkdtempSync(join(tmpdir(), "ltt-cdp-p-"));
  const proc = spawn(findChrome(), ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    `--user-data-dir=${prof}`, "--remote-debugging-port=0", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  const portFile = join(prof, "DevToolsActivePort");
  for (let k = 0; k < 200 && !(existsSync(portFile) && readFileSync(portFile, "utf8").split("\n")[0]); k++) await sleep(50);
  const port = readFileSync(portFile, "utf8").split("\n")[0];
  const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pend = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const m = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (m.result.exceptionDetails) throw new Error("page: " + JSON.stringify(m.result.exceptionDetails).slice(0, 300));
    return m.result.result.value;
  };
  await send("Page.enable");
  const b = {
    ev,
    async size(key) { const [w, h] = SIZES[key]; await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false }); },
    async load(path, scene, sizeKey) {
      await b.size(sizeKey);
      const sep = path.includes("?") ? "&" : "?";
      await send("Page.navigate", { url: `${base}${path}${sep}cdp=${++loadNo}#${scene}` });
      for (let k = 0; k < 200; k++) {
        await sleep(50);
        try { if (await ev(`document.readyState === "complete" && document.fonts.status === "loaded" && !!document.querySelector(".dk-scene.cur")`)) break; } catch { /* navigating */ }
      }
      await sleep(700);
    },
    async close() {
      ws.close();
      const gone = new Promise((r) => proc.once("exit", r));
      proc.kill("SIGKILL");
      await Promise.race([gone, sleep(3000)]);
      try { rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* Chrome helpers may still hold the profile */ }
    },
  };
  return b;
}

const CUR = `document.querySelector(".dk-scene.cur")`;
const ZOOM = `(parseFloat(${CUR}.firstChild.style.zoom) || 1)`;
const STATE = `(() => { const c = ${CUR}, a = c.querySelector(".dk-ans"), p = c.querySelector(".dk-pred");
  return { zoom: ${ZOOM}, shown: !!a && !a.classList.contains("ltt-hidden") && getComputedStyle(a).visibility !== "hidden",
    float: !!a && a.classList.contains("dk-float"), done: !!p && p.classList.contains("done"), still: !!c.querySelector(".dk-still"),
    pressed: [...c.querySelectorAll(".ltt-choices button[aria-pressed=true]")].map((b) => b.dataset.choice),
    right: [...c.querySelectorAll(".ltt-choices button.right")].map((b) => b.dataset.choice),
    wrong: [...c.querySelectorAll(".ltt-choices button.wrong")].map((b) => b.dataset.choice),
    avText: (c.querySelector(".dk-avis") || {}).textContent || "", avNodes: c.querySelectorAll(".dk-avis *").length,
    warns: [...document.querySelectorAll("#ltt-expect .warn")].map((d) => d.textContent) }; })()`;
const pick = (choice) => `(() => { const c = ${CUR}; c.querySelector('.ltt-choices button[data-choice="${choice}"]').click();
  c.querySelector(".dk-pred > .dk-actions button").click(); return true; })()`;

async function discover(b, rel) {
  await b.load(`/gallery/${rel}`, 1, "1440x813");
  return b.ev(`(() => { const out = [], dots = document.querySelectorAll(".dk-dots i");
    for (let i = 0; i < dots.length; i++) { dots[i].click(); const c = ${CUR};
      if (c.querySelector(".dk-pred")) out.push({ scene: i + 1, choices: [...c.querySelectorAll(".ltt-choices button")].map((x) => x.dataset.choice) }); }
    return out; })()`);
}

async function pool(tasks, jobs, fn) {
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: jobs }, async () => {
    const b = await openBrowser();
    try { while (next < tasks.length) { const i = next++; results[i] = await fn(b, tasks[i]).catch((e) => ({ ...tasks[i], error: String(e.message || e) })); } }
    finally { await b.close(); }
  }));
  return results;
}

async function predictScenes(jobs) {
  const pages = galleryTargets(gallery).map((f) => f.slice(gallery.length + 1));
  const found = await pool(pages, jobs, async (b, rel) => ({ rel, scenes: await discover(b, rel) }));
  return found.flatMap((p) => p.scenes.map((s) => ({ rel: p.rel, ...s })));
}

const jobs = +jobsArg;
let out;
try {
  if (mode === "reveal") {
    const scenes = await predictScenes(jobs);
    const tasks = scenes.flatMap((s) => Object.keys(SIZES).flatMap((size) => s.choices.map((choice) => ({ rel: s.rel, scene: s.scene, size, choice }))));
    const rows = await pool(tasks, jobs, async (b, t) => {
      await b.load(`/gallery/${t.rel}`, t.scene, t.size);
      const entry = await b.ev(ZOOM);
      await b.ev(pick(t.choice));
      await sleep(900);
      const after = await b.ev(STATE);
      return { ...t, entry, revealed: after.zoom, delta: +(after.zoom - entry).toFixed(5), shown: after.shown, float: after.float };
    });
    const bad = rows.filter((r) => r.error || Math.abs(r.delta) > 0.001 || !r.shown);
    out = { mode, cases: rows.length, bad: bad.length, rows };
  } else if (mode === "resize") {
    const scenes = await predictScenes(jobs);
    const tasks = [];
    for (const s of scenes) for (const [from, to] of [["1440x813", "1280x713"], ["1280x713", "1440x813"]]) tasks.push({ rel: s.rel, scene: s.scene, choices: s.choices, from, to });
    const rows = (await pool(tasks, jobs, async (b, t) => {
      await b.load(`/gallery/${t.rel}`, t.scene, t.from);
      await b.ev(pick(t.choices[0]));
      await sleep(900);
      const answer = (await b.ev(STATE)).right[0];
      const wrong = t.choices.find((c) => c !== answer && c !== "unsure") || t.choices.find((c) => c !== answer);
      const res = [];
      for (const [kind, choice] of [["answer", answer], ["wrong", wrong], ["reenter", answer]]) {
        if (kind === "reenter" && t.from !== "1440x813") continue;
        await b.load(`/gallery/${t.rel}`, t.scene, t.to);
        await b.ev(pick(choice));
        await sleep(900);
        const fresh = await b.ev(STATE);
        await b.load(`/gallery/${t.rel}`, t.scene, t.from);
        await b.ev(pick(choice));
        await sleep(900);
        if (kind === "reenter") {
          await b.ev(`document.querySelectorAll(".dk-dots i")[${t.scene > 1 ? t.scene - 2 : t.scene}].click()`);
          await sleep(300);
          await b.ev(`(window.__records = 0, window.__recWrapped || (window.__recWrapped = true, (function (f) { LTT.record = function () { window.__records++; return f.apply(this, arguments); }; })(LTT.record)), true)`);
          await b.size(t.to);
          await sleep(600);
          await b.ev(`document.querySelectorAll(".dk-dots i")[${t.scene - 1}].click()`);
          await sleep(600);
        } else {
          await b.ev(`(() => { const c = ${CUR}; window.__mut = { btn: 0, sec: 0 }; if (window.__obs) window.__obs.disconnect(); window.__obs = new MutationObserver((ms) => ms.forEach((m) => { if (m.target === c) window.__mut.sec++; else window.__mut.btn++; })); window.__obs.observe(c, { attributes: true, attributeFilter: ["style", "class"] }); c.querySelectorAll(".ltt-choices button").forEach((x) => window.__obs.observe(x, { attributes: true, attributeFilter: ["class", "aria-pressed"] })); return true; })()`);
          await b.ev(`(window.__records = 0, window.__recWrapped || (window.__recWrapped = true, (function (f) { LTT.record = function () { window.__records++; return f.apply(this, arguments); }; })(LTT.record)), true)`);
          await b.size(t.to);
          await sleep(700);
        }
        const records = await b.ev(`window.__records`);
        const mut = kind === "reenter" ? null : await b.ev(`(() => { const c = ${CUR}; window.__obs.takeRecords().forEach((m) => { if (m.target === c) window.__mut.sec++; else window.__mut.btn++; }); return window.__mut; })()`);
        const got = await b.ev(STATE);
        const ok = Math.abs(got.zoom - fresh.zoom) <= 0.001 && got.shown && got.done && !got.still &&
          JSON.stringify([got.pressed, got.right, got.wrong]) === JSON.stringify([fresh.pressed, fresh.right, fresh.wrong]) && got.avText === fresh.avText && got.float === fresh.float && got.avNodes === fresh.avNodes &&
          (kind === "reenter" || (records === 0 && mut.btn === 0 && mut.sec === 0));
        res.push({ rel: t.rel, scene: t.scene, from: t.from, to: t.to, kind, choice, zoom: got.zoom, fresh: fresh.zoom, delta: +(got.zoom - fresh.zoom).toFixed(5),
          shown: got.shown, float: got.float, freshFloat: fresh.float, sameMarks: JSON.stringify([got.pressed, got.right, got.wrong]) === JSON.stringify([fresh.pressed, fresh.right, fresh.wrong]),
          sameAnswerText: got.avText === fresh.avText, records, mut, ok });
      }
      return res;
    })).flat();
    out = { mode, cases: rows.length, bad: rows.filter((r) => r.error || !r.ok).length, rows };
  } else if (mode === "errors") {
    const [b] = [await openBrowser()];
    try {
      const qs = process.env.FX_QS ? "?" + process.env.FX_QS : "";
      const path = "/lessons/cdp-fixture/lesson.html" + qs;
      const amp = qs ? "&" : "?";
      const rows = {};
      const warnsOf = (st, n) => st.warns.filter((w) => w.startsWith(`⚠ 장면 ${n}: answerVisual`));
      const W = (n) => `⚠ 장면 ${n}: answerVisual을 미리 그려 보다 실패해 정답을 열 때 배율이 바뀔 수 있다 (fixture b)`;
      const wrap = `(window.__records = 0, window.__recWrapped || (window.__recWrapped = true, (function (f) { LTT.record = function () { window.__records++; return f.apply(this, arguments); }; })(LTT.record)), true)`;
      // EG-1: answerVisual throws for choice "b" while the entry lock measures it.
      await b.load(path, 1, "1440x813");
      const s1 = await b.ev(STATE);
      rows.EG1 = { zoomEntry: s1.zoom, warns: warnsOf(s1, 1).length, exactWarn: warnsOf(s1, 1).every((w) => w === W(1)),
        still: s1.still, shown: s1.shown, done: s1.done, pressed: s1.pressed, right: s1.right, wrong: s1.wrong };
      rows.EG1.ok = rows.EG1.zoomEntry === 1 && rows.EG1.warns >= 1 && rows.EG1.exactWarn && !s1.still && !s1.shown && !s1.done && !s1.pressed.length && !s1.right.length && !s1.wrong.length;
      // EG-2 / EG-5 (scene 5): the 1440 entry lock succeeds; revealed with "a", a resize to 1280 re-locks and "b" throws.
      await b.load(path, 5, "1440x813");
      const e5 = await b.ev(STATE);
      await b.ev(pick("a"));
      await sleep(900);
      const revealsOnPick = await b.ev(`window.__reveals || 0`);
      const r5 = await b.ev(STATE);
      await b.ev(wrap);
      await b.ev(`(window.__reveals = 0, true)`);
      await b.size("1280x713");
      await sleep(700);
      const s2 = await b.ev(STATE);
      const eg5 = { revealsOnPick, reveals: await b.ev(`window.__reveals`), records: await b.ev(`window.__records`) };
      // Independent expectations at 1280: a fresh load revealed with "a" (b throws on entry, so zmax 1 caps the fit),
      // and the same scene with ?eg2safe (b draws nothing), whose zoom is what a lock over the succeeded states gives.
      await b.load(path, 5, "1280x713");
      await b.ev(pick("a"));
      await sleep(900);
      const fresh = await b.ev(STATE);
      await b.load(path + amp + "eg2safe", 5, "1280x713");
      await b.ev(pick("a"));
      await sleep(900);
      const safe = await b.ev(STATE);
      const newWarns = warnsOf(s2, 5).slice(warnsOf(r5, 5).length);
      rows.EG2 = { entry1440: e5.zoom, entryWarns: warnsOf(e5, 5).length, zoomBefore: r5.zoom, warnsBefore: warnsOf(r5, 5).length, warnsAfter: warnsOf(s2, 5).length,
        newWarns, zoom: s2.zoom, fresh: fresh.zoom, freshFloat: fresh.float, float: s2.float, successOnly: safe.zoom,
        shown: s2.shown, done: s2.done, still: s2.still, pressed: s2.pressed, right: s2.right, wrong: s2.wrong, avText: s2.avText };
      const g = rows.EG2;
      // Discrimination guard: the expected zoom must stand apart from the 0.78 floor, from the succeeded-states lock and from the old zmax.
      g.guard = { aboveFloor: g.fresh >= 0.79, aboveSuccessOnly: g.fresh - g.successOnly >= 0.01, aboveOld: g.fresh - g.entry1440 >= 0.01, entryLockSucceeded: g.entryWarns === 0 };
      g.discriminating = Object.values(g.guard).every(Boolean);
      g.ok = Math.abs(g.zoom - g.fresh) <= 0.001 && newWarns.length === 1 && newWarns[0] === W(5) && g.shown && g.done && !g.still &&
        JSON.stringify([g.pressed, g.right, g.wrong]) === JSON.stringify([["a"], ["a"], []]) && g.avText === "답 a";
      rows.EG5 = { ...eg5, ok: eg5.revealsOnPick === 1 && eg5.reveals === 0 && eg5.records === 0 };
      // EG-3 / EG-4: figure step 3 enter throws while probing; step 0's packet from the entry draw is in flight.
      await b.load(path, 2, "1440x813");
      const s3 = await b.ev(`(() => { const ws = [...document.querySelectorAll("#ltt-expect .warn")].map((d) => d.textContent).filter((w) => w.includes("단계를 미리"));
        const p = ${CUR}.querySelector(".dk-figsteps .pic");
        return { warns: ws.length, exactWarn: ws.every((w) => w === "⚠ 장면 2: 단계를 미리 그려 보다 실패해 단계마다 배율이 바뀔 수 있다 (fixture step)"),
          still: !!${CUR}.querySelector(".dk-still"), pk: ${CUR}.querySelectorAll(".pk").length, cap: (${CUR}.querySelector(".ltt-caption:not(.ghost)") || {}).textContent || "",
          drawing: (p.querySelector(".fx-text") || {}).textContent || "", minHeight: p.style.minHeight }; })()`);
      s3.ok = s3.warns >= 1 && s3.exactWarn && !s3.still && s3.pk === 1 && s3.cap === "하나" && s3.drawing === "단계 0" && s3.minHeight !== "320px";
      await b.size("1280x713");
      await sleep(700);
      const s4 = await b.ev(`[...document.querySelectorAll("#ltt-expect .warn")].map((d) => d.textContent).filter((w) => w.includes("단계를 미리")).length`);
      rows.EG3 = s3;
      rows.EG4 = { warnsBefore: s3.warns, warnsAfterResize: s4, ok: s4 > s3.warns };
      // C-16: a one-parameter answerVisual is drawn once per lock.
      await b.load(path, 3, "1440x813");
      await b.ev(`(window.__oneCalls = 0, true)`);
      await b.size("1280x713");
      await sleep(700);
      rows.C16 = { callsPerLock: await b.ev(`window.__oneCalls`) };
      rows.C16.ok = rows.C16.callsPerLock === 1;
      // C-17: every step is drawn ahead, so the picture keeps the last (tallest) step's height while step 0 shows.
      await b.load(path, 4, "1440x813");
      rows.C17 = await b.ev(`(() => { const p = ${CUR}.querySelector(".dk-figsteps .pic"); return { minHeight: p.style.minHeight, shown: p.offsetHeight }; })()`);
      rows.C17.ok = parseFloat(rows.C17.minHeight) >= 300;
      const failed = Object.entries(rows).filter(([, r]) => !r.ok).map(([k]) => k);
      out = { mode, qs, discriminating: rows.EG2.discriminating, failed, cases: Object.keys(rows).length, bad: failed.length + (rows.EG2.discriminating ? 0 : 1), rows };
    } finally { await b.close(); }
  } else if (mode === "timing") {
    const scenes = (await predictScenes(jobs)).filter((s) => s.scene > 1);
    const rows = await pool(scenes, 1, async (b, s) => {
      const ms = [];
      for (let k = 0; k < 5; k++) {
        await b.load(`/gallery/${s.rel}`, s.scene - 1, "1440x813");
        ms.push(await b.ev(`(() => { const t = performance.now(); document.querySelectorAll(".dk-dots i")[${s.scene - 1}].click(); return performance.now() - t; })()`));
      }
      ms.sort((x, y) => x - y);
      return { rel: s.rel, scene: s.scene, median: +ms[2].toFixed(1), ms: ms.map((x) => +x.toFixed(1)) };
    });
    out = { mode, rows };
  } else if (mode === "requests") {
    const pages = galleryTargets(gallery).map((f) => f.slice(gallery.length + 1));
    const rows = await pool(pages, 1, async (b, rel) => {
      await b.load(`/gallery/${rel}`, 1, "1440x813");
      const urls = await b.ev(`[...new Set(performance.getEntriesByType("resource").map((e) => new URL(e.name).pathname))].sort()`);
      return { rel, urls, kitCss: urls.filter((u) => u.endsWith(".css") && !u.startsWith("/kit/vendor/")) };
    });
    out = { mode, cases: rows.length, bad: rows.filter((r) => r.error || r.kitCss.length).length, rows };
  } else throw new Error("mode: reveal | resize | errors | timing | requests");
} finally {
  server.closeAllConnections(); server.close(); rmSync(home, { recursive: true, force: true });
}
writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(mode, out.cases ?? "", "bad", out.bad ?? "-");
