// Shared Chrome/CDP + server harness for tests/layout-check.test.mjs, tests/kit-defects.test.mjs and tests/rule-registry.test.mjs
// (spec e48ead05eb246d3c). Pattern of tests/generator-defects-audit.test.mjs. Not matched by `npm test` (no .test.mjs suffix).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as AUDIT from "../../../skills/learn-to-tell/server/audit.mjs";
import { createLttServer } from "../../../skills/learn-to-tell/server/server.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const FIX = join(ROOT, "tests/fixtures/layout-check");
export { AUDIT, ROOT };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const J = JSON.stringify;
export const D3 = '<script src="/kit/vendor/d3.min.js"></script>';

export function createHarness(tag) {
  const chrome = AUDIT.findChrome?.();
  const skip = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
    : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
    : !chrome ? "no Chrome found (set LTT_CHROME)"
    : false;
  const T = { skip, timeout: 600_000 };
  const scratch = [];
  const tmp = (prefix) => {
    const d = mkdtempSync(join(tmpdir(), prefix));
    scratch.push(d);
    return d;
  };
  let home, server, port, browser, seq = 0;

  function launchBrowser() {
    const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
      `--user-data-dir=${tmp(`ltt-${tag}-chrome-`)}`, "--window-size=1440,900", "--remote-debugging-pipe", "about:blank"];
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
    async function open(url, readyAttr, vp = [1440, 900]) {
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
        close: () => send("Target.closeTarget", { targetId }),
      };
      const deadline = Date.now() + 20_000;
      for (;;) {
        try { if (await page.eval(`document.documentElement.hasAttribute(${J(readyAttr)}) && !!document.getElementById("ltt-check")`)) break; } catch {}
        if (Date.now() > deadline) throw new Error(`${url}: ${readyAttr} / #ltt-check never appeared`);
        await sleep(100);
      }
      await sleep(400);
      return page;
    }
    return { open, close: () => child.kill("SIGKILL") };
  }

  async function setup() {
    if (skip) return;
    home = tmp(`ltt-${tag}-home-`);
    server = createLttServer({ home });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    port = server.address().port;
    browser = launchBrowser();
  }
  async function teardown() {
    browser?.close();
    if (server) await new Promise((r) => server.close(r));
    for (const d of scratch) rmSync(d, { recursive: true, force: true });
  }

  function install(template, subst) {
    const id = `20261023-${tag}${++seq}`;
    const dir = join(home, "lessons", id);
    mkdirSync(dir, { recursive: true });
    let html = readFileSync(join(FIX, template), "utf8");
    for (const [k, v] of Object.entries(subst)) html = html.replaceAll(k, () => String(v));
    assert.equal(/__[A-Z]+__/.test(html), false, `unreplaced placeholder in ${template}`);
    writeFileSync(join(dir, "lesson.html"), html);
    return id;
  }
  const deckSrc = (scenes, extra = "") => `{title:"ROOT-DECK-TITLE",theme:"paper",${extra}scenes:[\n${scenes.join(",\n")}]}`;
  const installDeck = (scenes, { extra = "", head = "", body = "", after = "", vendor = D3 } = {}) =>
    install("deck.html", { __HEAD__: head, __BODY__: body, __VENDOR__: vendor, __DECK__: deckSrc(scenes, extra), __AFTER__: after });
  const installPage = (inline, { head = "", body = "", vendor = D3 } = {}) =>
    install("page.html", { __HEAD__: head, __BODY__: body, __VENDOR__: vendor, __INLINE__: inline });

  const urlOf = (id, query = "", hash = "") => `http://127.0.0.1:${port}/lessons/${id}/lesson.html${query}${hash}`;
  async function withPage(id, query, hash, fn, vp) {
    const ready = /[?&]shot\b/.test(query) ? "data-ltt-shot" : "data-ltt-check";
    const page = await browser.open(urlOf(id, query, hash), ready, vp);
    try { return await fn(page); } finally { await page.close().catch(() => {}); }
  }
  const readCheck = (page) => page.eval(`JSON.parse(document.getElementById("ltt-check").textContent)`);
  const runAudit = (opts) => AUDIT.audit({ sizes: ["1440x900"], chrome, home, jobs: 2, ...opts });

  return { chrome, skip, T, tmp, setup, teardown, install, installDeck, installPage, urlOf, withPage, readCheck, runAudit, home: () => home };
}

// In-page helpers (injected once per page). Elements are found by text and geometry, never by kit class names.
export const HELPERS = `(function(){
  if (window.__lc) return true;
  function shown(el){
    if (el.checkVisibility && !el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})) return false;
    var b = el.getBoundingClientRect();
    return b.width>0 && b.height>0 && b.right>0 && b.left<innerWidth && b.bottom>0 && b.top<innerHeight;
  }
  function els(token){
    var out=[], w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT), n;
    while ((n=w.nextNode())) {
      if (n.nodeValue.indexOf(token)<0) continue;
      var p=n.parentElement;
      if (!p || p.closest("script,style,#ltt-expect,#ltt-check")) continue;
      out.push(p);
    }
    return out;
  }
  function lca(a,b){ var x=a; while (x && !x.contains(b)) x=x.parentElement; return x; }
  function textRight(el, token){
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT), n, best=-Infinity;
    while ((n=w.nextNode())) {
      if (n.nodeValue.indexOf(token)<0) continue;
      var r=document.createRange(); r.selectNodeContents(n);
      var rs=r.getClientRects();
      for (var i=0;i<rs.length;i++) if (rs[i].width>0) best=Math.max(best, rs[i].right);
    }
    return best;
  }
  function sceneOf(el){ return el.closest("section.dk-scene") || el.closest(".dk-scene") || el.closest("section"); }
  window.__lc = { shown:shown, els:els, lca:lca, textRight:textRight, sceneOf:sceneOf,
    visible:function(t){ return els(t).some(shown); },
    pick:function(t){ var e=els(t); return e.find(shown) || e[0] || null; } };
  return true;
})()`;
export const vis = async (page, token) => { await page.eval(HELPERS); return page.eval(`window.__lc.visible(${J(token)})`); };
export const pollUntil = async (fn, ms = 4000, step = 100) => {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return v;
    await sleep(step);
  }
};

// Scene source snippets (field shapes follow tests/lint-rules.test.mjs and the gallery lessons).
export const NEXT1 = `[{term:"다음",why:"이유"}]`;
export const KW = `{type:"keywords",title:"끝",terms:[],next:${NEXT1}}`;
export const ST = (t = "문장") => `{type:"statement",title:${J(t)}}`;
export const FIG = `{type:"figure",title:"그림",caption:"c",figure:"그림"}`;
export const MOUNT = (title, html, extra = "") => `{title:${J(title)},narration:"n",mount:function(body){window.__mounted.push(${J(title)});body.innerHTML=${J(html)};${extra}return {};}}`;
// flex:none + min-width keep the child 2000px wide inside flex/grid cells, so it really overflows whatever the kit's layout is.
export const WIDE = `<div data-wide="1" style="flex:none;min-width:2000px;width:2000px;height:20px;background:#ccc"></div>`;
export const key = (name) => `document.dispatchEvent(new KeyboardEvent("keydown",{key:${J(name)},bubbles:true}))`;
