// R-2/R-3 (spec 1e62814b16984176): drives headless Chrome over the DevTools protocol against <repo>'s server.
// Usage:
//   node 1e62814b16984176-review.mjs dump <repo> <out.json>
//     every live gallery deck at 1440×813: the spec handed to LTT.deck (functions → "[fn]", nodes → "[node]"),
//     ltt-meta, LTT.expect labels, and the scene count after ?audit mounted every scene (R-3, R-4)
//   node 1e62814b16984176-review.mjs scenes <repo> <out.json>
//     every live gallery deck × 1440×813·1280×713 under ?audit: per scene the title, zoom, smallest body font size, the
//     normalized textContent, and hashes of the normalized outerHTML and of the body's element boxes (R-2 selection, R-3, R-6)
//   node 1e62814b16984176-review.mjs steps <repo> <out.json>
//     every live gallery deck at 1440×813: for each scene with an in-scene stepper, the scene textContent at every step,
//     reached by pressing the stepper's next button until it is disabled (TF-4 diagnostic: page-built step captions)
//   node 1e62814b16984176-review.mjs reveal <repo> <outdir> <page> <scene>[,<scene>…] [<page> <scenes>…]
//     revealed-state screenshots at 1440×813 and 1280×713: predict scenes with the answer picked and revealed,
//     summary scenes with every recall answer opened (R-2)
// LTT.deck and LTT.expect are wrapped through a property accessor installed before any page script, so the kit files
// themselves are not edited.
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [mode, repo, out, ...rest] = process.argv.slice(2);
const { findChrome, galleryTargets } = await import(join(repo, "skills/learn-to-tell/server/audit.mjs"));
const { createLttServer } = await import(join(repo, "skills/learn-to-tell/server/server.mjs"));
const gallery = join(repo, "site/gallery");
const home = mkdtempSync(join(tmpdir(), "ltt-rv-home-"));
const server = createLttServer({ home, galleryDir: gallery });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const SIZES = { "1440x813": [1440, 813], "1280x713": [1280, 713] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HOOK = `(() => {
  let real;
  const ser = (v, d) => {
    if (typeof v === "function") return "[fn]";
    if (v && typeof Node !== "undefined" && v instanceof Node) return "[node]";
    if (d > 6) return "[deep]";
    if (Array.isArray(v)) return v.map((x) => ser(x, d + 1));
    if (v && typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[k] = ser(v[k], d + 1); return o; }
    return v;
  };
  window.__expects = [];
  Object.defineProperty(window, "LTT", { configurable: true, get() { return real; }, set(obj) {
    real = obj;
    const ex = obj.expect;
    if (typeof ex === "function") obj.expect = function (label) { window.__expects.push(String(label)); return ex.apply(this, arguments); };
    let deck;
    Object.defineProperty(obj, "deck", { configurable: true, enumerable: true, get() { return deck; }, set(fn) {
      deck = function (spec) { window.__spec = ser(spec, 0); return fn.apply(this, arguments); };
    } });
  } });
})();`;

async function openBrowser() {
  const prof = mkdtempSync(join(tmpdir(), "ltt-rv-p-"));
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
  await send("Page.addScriptToEvaluateOnNewDocument", { source: HOOK });
  let n = 0;
  return {
    ev, send,
    async load(path, sizeKey, hash = "", query = "") {
      const [w, h] = SIZES[sizeKey];
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await send("Page.navigate", { url: `${base}${path}?rv=${++n}${query}${hash ? "#" + hash : ""}` });
      for (let k = 0; k < 300; k++) {
        await sleep(50);
        try { if (await ev(`document.readyState === "complete" && document.fonts.status === "loaded" && !!document.querySelector(".dk-scene.cur")`)) break; } catch { /* navigating */ }
      }
      await sleep(800);
    },
    async shot(file) {
      const m = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(file, Buffer.from(m.result.data, "base64"));
    },
    async close() {
      ws.close();
      proc.kill("SIGKILL");
      await sleep(300);
      try { rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* helpers may hold it */ }
    },
  };
}

const b = await openBrowser();
try {
  if (mode === "dump") {
    const pages = galleryTargets(gallery).map((f) => f.slice(gallery.length + 1));
    const res = {};
    for (const rel of pages) {
      await b.load(`/gallery/${rel}`, "1440x813", "", "&audit");
      for (let k = 0; k < 200 && !(await b.ev(`!!document.getElementById("ltt-audit")`)); k++) await sleep(100);
      res[rel] = await b.ev(`(() => {
        const meta = document.getElementById("ltt-meta");
        return { meta: meta ? JSON.parse(meta.textContent) : null, spec: window.__spec || null,
          expects: [...new Set(window.__expects)].sort(), renderedScenes: document.querySelectorAll(".dk-scene").length };
      })()`);
    }
    writeFileSync(out, JSON.stringify(res, null, 2) + "\n");
  } else if (mode === "scenes") {
    const pages = galleryTargets(gallery).map((f) => f.slice(gallery.length + 1));
    const res = {};
    for (const rel of pages) for (const size of Object.keys(SIZES)) {
      await b.load(`/gallery/${rel}`, size, "", "&audit");
      for (let k = 0; k < 200 && !(await b.ev(`!!document.getElementById("ltt-audit")`)); k++) await sleep(100);
      await sleep(1500);
      res[`${size} ${rel}`] = await b.ev(`(async () => {
        const hash = async (t) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].slice(0, 8).map((x) => x.toString(16).padStart(2, "0")).join("");
        const out = [];
        const scenes = [...document.querySelectorAll(".dk-scene")];
        for (let i = 0; i < scenes.length; i++) {
          const el = scenes[i], inner = el.firstChild, body = el.querySelector(".dk-body");
          const h2 = el.querySelector("h2"), spec = (window.__spec && window.__spec.scenes[i]) || {};
          const html = el.outerHTML.replace(/ style="[^"]*"/g, "").replace(/\s+/g, " ");
          const text = (el.textContent || "").replace(/\s+/g, " ").trim();
          const er = el.getBoundingClientRect(), z = parseFloat(inner && inner.style.zoom) || 1;
          let boxes = "", minFont = 99;
          if (body) for (const n of body.querySelectorAll("*")) {
            const r = n.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            boxes += [r.left - er.left, r.top - er.top, r.width, r.height].map((v) => Math.round(v / 4)).join(",") + ";";
            const own = [...n.childNodes].some((c) => c.nodeType === 3 && c.nodeValue.trim());
            if (own && !n.closest("svg")) minFont = Math.min(minFont, parseFloat(getComputedStyle(n).fontSize) * z);
          }
          out.push({ i: i + 1, type: spec.type || "", title: spec.title || (h2 ? h2.textContent : ""), zoom: +z.toFixed(3), minFont: +minFont.toFixed(1),
            html: await hash(html), boxes: await hash(boxes), textHash: await hash(text), text });
        }
        return out;
      })()`);
    }
    writeFileSync(out, JSON.stringify(res, null, 1) + "\n");
  } else if (mode === "steps") {
    const pages = galleryTargets(gallery).map((f) => f.slice(gallery.length + 1));
    const res = {};
    for (const rel of pages) {
      await b.load(`/gallery/${rel}`, "1440x813");
      const n = await b.ev(`document.querySelectorAll(".dk-dots i").length`);
      for (let i = 1; i <= n; i++) {
        await b.ev(`(document.querySelectorAll(".dk-dots i")[${i - 1}].click(), true)`);
        await sleep(400);
        const has = await b.ev(`!!document.querySelector(".dk-scene.cur .ltt-stepper")`);
        if (!has) continue;
        const texts = [];
        for (let k = 0; k < 30; k++) {
          texts.push(await b.ev(`(document.querySelector(".dk-scene.cur").textContent || "").replace(/\\s+/g, " ").trim()`));
          const moved = await b.ev(`(() => { const bs = document.querySelector(".dk-scene.cur .ltt-stepper").querySelectorAll("button"); const nx = bs[1]; if (!nx || nx.disabled) return false; nx.click(); return true; })()`);
          if (!moved) break;
          await sleep(500);
        }
        (res[rel] ??= {})[i] = { title: await b.ev(`(document.querySelector(".dk-scene.cur h2") || {}).textContent || ""`), steps: texts };
      }
    }
    writeFileSync(out, JSON.stringify(res, null, 1) + "\n");
  } else if (mode === "reveal") {
    mkdirSync(out, { recursive: true });
    for (let i = 0; i + 1 < rest.length; i += 2) {
      const rel = rest[i], scenes = rest[i + 1].split(",").map(Number);
      for (const size of Object.keys(SIZES)) for (const sc of scenes) {
        await b.load(`/gallery/${rel}`, size, String(sc));
        const did = await b.ev(`(() => {
          const c = document.querySelector(".dk-scene.cur"), s = window.__spec.scenes[${sc - 1}];
          if (c.querySelector(".dk-pred")) {
            c.querySelector('.ltt-choices button[data-choice="' + s.answer + '"]').click();
            c.querySelector(".dk-pred > .dk-actions button").click();
            return "predict";
          }
          const bs = [...c.querySelectorAll(".dk-rc .dk-actions button")];
          bs.forEach((x) => x.click());
          return bs.length ? "summary" : "none";
        })()`);
        await sleep(1200);
        const slug = rel.replace(/\.html$/, "").replace(/[^\w.-]+/g, "-");
        await b.shot(join(out, `${slug}-${size}-${String(sc).padStart(2, "0")}-revealed.png`));
        console.log(rel, size, sc, did);
      }
    }
  } else throw new Error("mode must be dump or reveal");
} finally {
  await b.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  rmSync(home, { recursive: true, force: true });
}
