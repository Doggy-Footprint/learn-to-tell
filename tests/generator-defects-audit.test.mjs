import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as AUDIT from "../skills/learn-to-tell/server/audit.mjs";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";
import { L, concept, ltt } from "./map/helpers.mjs";

// Spec 753ff3c539424409 v1 VO-2..VO-8. Expected values come from the spec's FR/Cases/Signatures and from the lint
// scene numbers fixed by tests/lint-rules.test.mjs; never from running the implementation.
// Fixtures: tests/fixtures/generator-defects/{deck,page}.html templates, filled with scene source text by this file.
// Observation uses text content, computed style, getBoundingClientRect and DOM containment only; the spec fixes no class names.

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FIX = join(ROOT, "tests/fixtures/generator-defects");
const { formatReport, exitCode, findChrome } = AUDIT;
const chrome = findChrome?.();
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let home, server, port, seq = 0, browser;

// ---------- fixture assembly ----------

const D3 = '<script src="/kit/vendor/d3.min.js"></script>';
function install(template, subst) {
  const id = `20261023-gd${++seq}`;
  const dir = join(home, "lessons", id);
  mkdirSync(dir, { recursive: true });
  let html = readFileSync(join(FIX, template), "utf8");
  for (const [k, v] of Object.entries(subst)) html = html.replaceAll(k, () => String(v));
  assert.equal(/__[A-Z]+__/.test(html), false, `unreplaced placeholder in ${template}`);
  writeFileSync(join(dir, "lesson.html"), html);
  return id;
}
const J = JSON.stringify;
const deckSrc = (scenes, extra = "") => `{title:"ROOT-DECK-TITLE",theme:"paper",${extra}scenes:[\n${scenes.join(",\n")}]}`;
const installDeck = (scenes, { extra = "", vendor = D3 } = {}) => install("deck.html", { __VENDOR__: vendor, __DECK__: deckSrc(scenes, extra) });
const installPage = (inline, vendor = D3) => install("page.html", { __VENDOR__: vendor, __INLINE__: inline });

const FIG = `{type:"figure",title:"그림",caption:"c",figure:"그림"}`;
const ST = (t = "문장") => `{type:"statement",title:${J(t)}}`;
const NEXT1 = `[{term:"다음",why:"이유"}]`;
const KW = (next = NEXT1) => `{type:"keywords",title:"끝",terms:[],next:${next}}`;
const SUM = `{type:"summary",title:"정리",cards:[{text:"t",recall:"q"}]}`;
const OV = `{type:"overview",title:"한 장",figure:"<svg></svg>",caption:"c"}`;
const CMP_ITEMS = `[{label:"가",visual:"<b>x</b>",tone:"bad",verdict:"VERD-1"},{label:"나",visual:"<b>y</b>",tone:"good",verdict:"VERD-2"}]`;
const PRED = (take = "TK-PRED", answer = "a") => `{type:"predict",title:"예측",question:"q",choices:[{id:"a",text:"가"},{id:"b",text:"나"}],answer:${J(answer)},visual:"<div>조건</div>",why:"WHY-PRED",takeaway:${J(take)}}`;
const CMP = (take, extra = "") => `{type:"compare",title:"비교",narration:"n",${extra}items:${CMP_ITEMS},takeaway:${J(take)}}`;
const FIGSTEPS = (title = "그림 단계") => `{type:"figure",title:${J(title)},caption:"c",figure:function(el){el.innerHTML='<div style="padding:20px">F</div>';return {};},steps:[{caption:"STEPCAP-1",enter:function(){}},{caption:"STEPCAP-2",enter:function(){}},{caption:"STEPCAP-3",enter:function(){}}]}`;

// ---------- minimal CDP driver (pattern of tests/gate-gaps.test.mjs) ----------

function launchBrowser() {
  const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    `--user-data-dir=${tmp("ltt-gd-chrome-")}`, "--window-size=1440,900", "--remote-debugging-pipe", "about:blank"];
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
  const send = (method, params = {}, sessionId) => new Promise((resolveMsg, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve: resolveMsg, reject, method });
    out.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + "\0");
  });
  async function open(url, readyAttr) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    await s("Page.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
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

before(async () => {
  if (skip) return;
  home = tmp("ltt-gd-home-");
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

const urlOf = (id, query = "", hash = "") => `http://127.0.0.1:${port}/lessons/${id}/lesson.html${query}${hash}`;
async function withPage(id, query, hash, fn) {
  const ready = /[?&]shot\b/.test(query) ? "data-ltt-shot" : "data-ltt-check";
  const page = await browser.open(urlOf(id, query, hash), ready);
  try { return await fn(page); } finally { await page.close().catch(() => {}); }
}
const readCheck = (page) => page.eval(`JSON.parse(document.getElementById("ltt-check").textContent)`);
const attrCheck = (page) => page.eval(`document.documentElement.getAttribute("data-ltt-check")`);

// In-page helpers. visible(token): a text node holding token whose element is rendered inside the viewport.
const HELPERS = `(function(){
  if (window.__gd) return true;
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
      if (!p || p.closest("script,style,#ltt-expect")) continue;
      out.push(p);
    }
    return out;
  }
  function lca(a,b){ var x=a; while (x && !x.contains(b)) x=x.parentElement; return x; }
  window.__gd = { shown:shown, els:els, lca:lca,
    visible:function(t){ return els(t).some(shown); },
    pick:function(t){ var e=els(t); return e.find(shown) || e[0] || null; },
    click:function(re){ var b=[].filter.call(document.querySelectorAll("button"),function(x){return shown(x) && new RegExp(re).test(x.textContent);})[0]; if(!b) return false; b.click(); return true; } };
  return true;
})()`;
const vis = async (page, token) => { await page.eval(HELPERS); return page.eval(`window.__gd.visible(${J(token)})`); };
const clickBtn = async (page, re) => { await page.eval(HELPERS); return page.eval(`window.__gd.click(${J(re)})`); };
const pageText = (page) => page.eval(`document.body.innerText`);
const rectDump = (page) => page.eval(`JSON.stringify([].map.call(document.body.querySelectorAll("*"),function(e){var r=e.getBoundingClientRect();return [e.tagName,Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)];}))`);

const runAudit = (opts) => AUDIT.audit({ sizes: ["1440x900"], chrome, home, jobs: 2, ...opts });
const auditDeck = async (scenes, opts = {}, deckOpts = {}) => {
  const id = installDeck(scenes, deckOpts);
  const [r] = await runAudit({ targets: [id], ...opts });
  return { id, r };
};
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isPng = (p) => existsSync(p) && readFileSync(p).subarray(0, 8).equals(PNG_MAGIC);

// ---------- VO-2 decision table: 고침 x 권고 (FR-1, FR-2, C-1, C-2) ----------

const FIX_DECK = [FIG, SUM, OV, ST(), KW()]; // overview is not right before keywords: overview-order at scene 3 (lint-rules.test.mjs)
const ADVICE_DECK = [FIG, ST(), KW()];
const GLOSS = `glossary:{"미사용":"x"},`;
const TABLE = [
  { label: "고침 only (C-1)", scenes: FIX_DECK, extra: "", fix: true, adv: false },
  { label: "권고 only (C-2)", scenes: ADVICE_DECK, extra: GLOSS, fix: false, adv: true },
  { label: "고침 and 권고", scenes: FIX_DECK, extra: GLOSS, fix: true, adv: true },
  { label: "neither", scenes: ADVICE_DECK, extra: "", fix: false, adv: false },
];
for (const c of TABLE) {
  test(`VO-2 FR-1/FR-2 decision table ${c.label}: #ltt-check errors/advice split, data-ltt-check count`, T, async () => {
    const id = installDeck(c.scenes, { extra: c.extra });
    await withPage(id, "?check", "", async (page) => {
      const chk = await readCheck(page);
      assert.ok(Array.isArray(chk.advice), "#ltt-check has no advice array");
      const order = chk.errors.filter((e) => e.rule === "overview-order");
      assert.deepEqual(order.map((e) => e.where), c.fix ? ["장면 3"] : []);
      assert.deepEqual(chk.errors.filter((e) => e.rule === "unused-term"), [], "an 권고 rule leaked into errors");
      const unused = chk.advice.filter((a) => a.rule === "unused-term");
      assert.equal(unused.length, c.adv ? 1 : 0);
      for (const a of chk.advice) {
        assert.ok(typeof a.where === "string" && typeof a.msg === "string" && a.msg.length > 0, JSON.stringify(a));
        assert.ok(["unused-term", "card-monotony", "no-signature"].includes(a.rule), `non-권고 rule in advice: ${a.rule}`);
      }
      if (!c.fix) assert.deepEqual(chk.errors, []);
      assert.equal(await attrCheck(page), String(chk.errors.length), "data-ltt-check must count errors only");
      if (c.adv) assert.match(unused[0].where, /^(덱|장면 \d+)$/);
    });
  });
  test(`VO-2 FR-2 decision table ${c.label}: audit result advice, report line, exit code ${c.fix ? 1 : 0}`, T, async () => {
    const { r } = await auditDeck(c.scenes, {}, { extra: c.extra });
    assert.equal(r.error, undefined, r.error);
    assert.ok(Array.isArray(r.advice), "audit result has no advice array");
    assert.deepEqual(r.check.filter((e) => e.rule === "overview-order").map((e) => e.where), c.fix ? ["장면 3"] : []);
    assert.equal(r.check.some((e) => e.rule === "unused-term"), false);
    assert.equal(r.advice.filter((a) => a.rule === "unused-term").length, c.adv ? 1 : 0);
    if (!c.fix) assert.deepEqual(r.check, []);
    assert.equal(exitCode([r]), c.fix ? 1 : 0);
    const report = formatReport([r]).split("\n");
    for (const a of r.advice) assert.ok(report.includes(`    advice ${a.where} [${a.rule}]: ${a.msg}`), `no advice line for ${a.rule}`);
    for (const e of r.check) assert.ok(report.includes(`    check ${e.where} [${e.rule}]: ${e.msg}`), `no check line for ${e.rule}`);
    if (!c.adv) assert.equal(report.some((l) => /^\s+advice /.test(l)), false);
  });
}

test("VO-2 FR-1: a deck-level fix rule (keywords-last) appears in check errors with where 덱, a scene-level one with 장면 n", T, async () => {
  const { r } = await auditDeck([FIG, ST()]);
  const kl = r.check.filter((e) => e.rule === "keywords-last");
  assert.deepEqual(kl.map((e) => e.where), ["덱"]);
  assert.equal(exitCode([r]), 1);
});

const EX = `{type:"explain",title:"e",steps:[]}`;
for (const [label, scenes, rule] of [
  ["no-signature", [ST("하나"), ST("둘"), KW()], "no-signature"],
  ["card-monotony", [FIG, ST("하나"), ST("둘"), EX, EX, EX, KW()], "card-monotony"],
]) {
  test(`VO-2 FR-1 A-1 page-level 권고 ${label}: in #ltt-check advice, not in errors, not counted in data-ltt-check`, T, async () => {
    const id = installDeck(scenes);
    await withPage(id, "?check", "", async (page) => {
      const chk = await readCheck(page);
      assert.ok(chk.advice.some((a) => a.rule === rule), JSON.stringify(chk.advice));
      assert.equal(chk.errors.some((e) => e.rule === rule), false, JSON.stringify(chk.errors));
      assert.equal(await attrCheck(page), String(chk.errors.length));
    });
  });
}

test("VO-2 FR-2 formatReport/exitCode on synthetic items (no Chrome): advice alone is exit 0 with its line, advice plus check is exit 1", () => {
  const base = { target: "t1", size: "1440x900", url: "http://x/", viewport: [1440, 800], scroll: 800, check: [], marks: [], shots: [], truncated: false };
  const A = { where: "덱", rule: "unused-term", msg: "쓰지 않은 용어 미사용" };
  const C = { where: "장면 3", rule: "overview-order", msg: "순서 오류" };
  const only = [{ ...base, advice: [A] }];
  assert.equal(exitCode(only), 0);
  assert.ok(formatReport(only).split("\n").includes(`    advice ${A.where} [${A.rule}]: ${A.msg}`), formatReport(only));
  const both = [{ ...base, advice: [A], check: [C] }];
  assert.equal(exitCode(both), 1);
  const lines = formatReport(both).split("\n");
  assert.ok(lines.includes(`    advice ${A.where} [${A.rule}]: ${A.msg}`));
  assert.ok(lines.includes(`    check ${C.where} [${C.rule}]: ${C.msg}`));
});

// ---------- VO-3 #ltt-expect visibility (FR-3, C-3) ----------

for (const [label, query, hidden] of [["?shot", "?shot", true], ["?check", "?check", false], ["no query", "", false]]) {
  test(`VO-3 FR-3 C-3 ${label}: #ltt-expect computed display is ${hidden ? "none" : "not none"}`, T, async () => {
    const id = installDeck(FIX_DECK);
    await withPage(id, query, "", async (page) => {
      const d = await page.eval(`(function(){var e=document.getElementById("ltt-expect");return e?getComputedStyle(e).display:null;})()`);
      assert.notEqual(d, null, "#ltt-expect is not in the document of a deck with a lint finding");
      if (hidden) assert.equal(d, "none");
      else assert.notEqual(d, "none");
    });
  });
}

// ---------- VO-4 keywords concept tree (FR-7, C-8) ----------

const TREE_NEXT = `[{term:"TERM-A",why:"WHY-a"},{term:"TERM-B",why:"WHY-b",from:"TERM-A"},{term:"TERM-C",why:"WHY-c",from:"TERM-Z"}]`;
const TREE_KW = `{type:"keywords",title:"끝",terms:[{ko:"기존용어",en:"legacy-term"}],signals:["SIG-ONE"],queries:["QRY-ONE"],next:${TREE_NEXT}}`;
let treeFacts;
const loadTree = () => (treeFacts ??= (async () => {
  const id = installDeck([FIG, TREE_KW]);
  return withPage(id, "?shot", "#2", async (page) => {
    await page.eval(HELPERS);
    return page.eval(`(function(){
      var g=window.__gd, P=g.pick, tokens=["TERM-A","TERM-B","TERM-C","WHY-a","WHY-b","WHY-c","legacy-term","SIG-ONE","QRY-ONE"], v={}, i;
      for (i=0;i<tokens.length;i++) v[tokens[i]]=g.visible(tokens[i]);
      var tA=P("TERM-A"), tB=P("TERM-B"), tC=P("TERM-C");
      var roots=g.els("ROOT-DECK-TITLE").filter(function(e){var l=g.lca(e,tA);return l && l.contains(tB) && l.contains(tC) && !e.contains(tA);});
      roots.sort(function(x,y){return g.lca(x,tA).querySelectorAll("*").length-g.lca(y,tA).querySelectorAll("*").length;});
      var rt=roots[0], R=rt && g.lca(rt,tA);
      function depth(e){ var d=0; while (e && e!==R){ d++; e=e.parentElement; } return d; }
      var lAB=g.lca(tA,tB), lAC=g.lca(tA,tC);
      return { visible:v, rootCount:roots.length,
        bBranchOfA: !!lAB && lAB!==R && !lAB.contains(tC) && !lAB.contains(rt),
        bDeeperThanA: depth(tB)>depth(tA),
        cSiblingOfA: g.lca(rt,tC)===R && depth(tC)===depth(tA),
        rootAboveA: depth(rt)<depth(tA) && !lAB.contains(rt) };
    })()`);
  });
})());

test("VO-4 FR-7 C-8 EP from absent: A is a branch directly under the deck-title root (same level as C), text shown", T, async () => {
  const f = await loadTree();
  assert.equal(f.visible["TERM-A"] && f.visible["WHY-a"], true);
  assert.ok(f.rootCount >= 1, "no deck-title root in the tree");
  assert.equal(f.rootAboveA, true, "the root is not above A");
  assert.equal(f.cSiblingOfA, true, "A and C are not siblings under the root");
});

test("VO-4 FR-7 C-8 EP from valid: B (from A) is deeper than A and inside A's branch only, with its term and why shown", T, async () => {
  const f = await loadTree();
  assert.equal(f.visible["TERM-B"] && f.visible["WHY-b"], true);
  assert.equal(f.bDeeperThanA, true, "B is not below A");
  assert.equal(f.bBranchOfA, true, "A and B do not form a branch separate from C and the root");
});

test("VO-4 FR-7 C-8 EP from invalid (Z is no term): C sits under the root at A's level, not inside A's branch, with its text shown", T, async () => {
  const f = await loadTree();
  assert.equal(f.visible["TERM-C"] && f.visible["WHY-c"], true);
  assert.equal(f.cSiblingOfA, true, "C is not a sibling of A under the root");
  assert.equal(f.bBranchOfA, true);
});

test("VO-4 FR-7: the existing keywords fields (terms, signals, queries) are still drawn next to the tree", T, async () => {
  const f = await loadTree();
  for (const t of ["legacy-term", "SIG-ONE", "QRY-ONE"]) assert.equal(f.visible[t], true, `${t} is not shown`);
});

// ---------- VO-5 error guessing: script and scene exceptions (FR-8, FR-9, C-9, C-10, QR-5) ----------

const mountMark = (n, extra = "") => `{title:"S${n}",narration:"n",mount:function(body){window.__mounted.push(${n});body.innerHTML='<div id="m${n}" style="padding:12px">MARK-${n}</div>';${extra}return {};}}`;
const MOUNT_DECK = [
  mountMark(1),
  mountMark(2),
  `{title:"S3",narration:"n",mount:function(body){window.__mounted.push(3);body.innerHTML='<p id="m3">MARK-3</p>';throw new Error("mount-boom-3");}}`, // writes content first, then throws (G-4)
  mountMark(4),
  mountMark(5, `LTT.clock(body.querySelector("#m5"),function(t){},{dur:1000,id:"c5"});`),
  mountMark(6),
  KW(),
];

test("VO-5 FR-8 C-9 guess: d3 script line removed -> a script-error at 페이지 naming the error and ltt-parts.js:line; page stays open", T, async () => {
  const id = installDeck([FIG, ST(), KW()], { vendor: "" });
  await withPage(id, "?check", "", async (page) => {
    const chk = await readCheck(page);
    const se = chk.errors.filter((e) => e.rule === "script-error");
    assert.ok(se.length >= 1, JSON.stringify(chk.errors));
    assert.ok(se.every((e) => e.where === "페이지"));
    assert.ok(se.some((e) => e.msg.includes("d3")), JSON.stringify(se));
    assert.ok(se.some((e) => /ltt-parts\.js:\d+/.test(e.msg)), JSON.stringify(se));
    assert.equal(await attrCheck(page), String(chk.errors.length));
  });
});

test("VO-5 FR-8 C-9 guess: audit of the d3-less deck gives a script-error check item and exit code 1", T, async () => {
  const { r } = await auditDeck([FIG, ST(), KW()], {}, { vendor: "" });
  assert.equal(r.error, undefined, r.error);
  assert.ok(r.check.some((e) => e.rule === "script-error" && e.where === "페이지"), JSON.stringify(r.check));
  assert.equal(exitCode([r]), 1);
});

test("VO-5 FR-8 guess: the same page with d3 present reports no script-error", T, async () => {
  const id = installDeck([FIG, ST(), KW()]);
  await withPage(id, "?check", "", async (page) => {
    assert.deepEqual((await readCheck(page)).errors.filter((e) => e.rule === "script-error"), []);
  });
});

test("VO-5 FR-8 guess: an unhandled rejection and a synchronous throw after ltt.js loaded become script-errors with their messages", T, async () => {
  const id = installPage(`Promise.reject(new Error("rej-boom"));\nthrow new Error("sync-boom");`);
  await withPage(id, "?check", "", async (page) => {
    const chk = await readCheck(page);
    const se = chk.errors.filter((e) => e.rule === "script-error");
    assert.ok(se.every((e) => e.where === "페이지"), JSON.stringify(se));
    assert.ok(se.some((e) => e.msg.includes("rej-boom")), `rejection missing: ${JSON.stringify(se)}`);
    const sync = se.find((e) => e.msg.includes("sync-boom"));
    assert.ok(sync, `sync throw missing: ${JSON.stringify(se)}`);
    assert.match(sync.msg, /lesson\.html:\d+/, "file name:line missing");
    assert.equal(await attrCheck(page), String(chk.errors.length));
  });
});

for (const query of ["?shot", "?check"]) {
  test(`VO-5 FR-9 C-10 guess ${query}: mount throw at scene 3 -> one scene-error 장면 3; the other mount calls ran (QR-5)`, T, async () => {
    const id = installDeck(MOUNT_DECK);
    await withPage(id, query, "", async (page) => {
      const chk = await readCheck(page);
      const se = chk.errors.filter((e) => e.rule === "scene-error");
      assert.deepEqual(se.map((e) => e.where), ["장면 3"]);
      assert.ok(se[0].msg.includes("mount-boom-3"), se[0].msg);
      const mounted = await page.eval(`window.__mounted.slice().sort()`);
      if (query === "?shot") assert.deepEqual(mounted, [1, 2, 3, 4, 5, 6], "scenes after the throwing one were not mounted");
      else assert.ok(mounted.includes(1) && mounted.includes(3), `mounted ${mounted}`);
    });
  });
}

test("VO-5 FR-9 C-10 guess: the clock registered by scene 5 is still listed, and the throwing scene is left with an empty body", T, async () => {
  const id = installDeck(MOUNT_DECK);
  await withPage(id, "?shot", "#3", async (page) => {
    const chk = await readCheck(page);
    assert.ok(chk.clocks.some((c) => c.id === "c5"), JSON.stringify(chk.clocks));
    assert.equal(await vis(page, "MARK-3"), false);
    assert.equal(await page.eval(`document.getElementById("m3")`), null);
  });
  await withPage(id, "?shot", "#4", async (page) => {
    assert.equal(await vis(page, "MARK-4"), true, "a scene after the failing one is not drawn");
  });
});

test("VO-5 FR-9 C-10 guess: audit gives scene-error 장면 3 and exit code 1", T, async () => {
  const { r } = await auditDeck(MOUNT_DECK);
  assert.equal(r.error, undefined, r.error);
  assert.deepEqual(r.check.filter((e) => e.rule === "scene-error").map((e) => e.where), ["장면 3"]);
  assert.equal(exitCode([r]), 1);
});

test("VO-5 FR-9 guess: a render exception (figure function throws) is a scene-error at that scene and later scenes still mount", T, async () => {
  const scenes = [mountMark(1), `{type:"figure",title:"깨짐",caption:"c",figure:function(){throw new Error("fig-boom");}}`, mountMark(3), KW()];
  const id = installDeck(scenes);
  await withPage(id, "?shot", "", async (page) => {
    const chk = await readCheck(page);
    const se = chk.errors.filter((e) => e.rule === "scene-error");
    assert.deepEqual(se.map((e) => e.where), ["장면 2"]);
    assert.ok(se[0].msg.includes("fig-boom"), se[0].msg);
    assert.deepEqual(await page.eval(`window.__mounted.slice().sort()`), [1, 3]);
  });
});

test("VO-5 FR-4/FR-9 guess: predict with string choices reports predict-choices at 장면 2 and the other scenes still mount; any scene-error is only that scene's", T, async () => {
  const bad = `{type:"predict",title:"예측",question:"q",choices:["1시간","2시간"],answer:"1시간",why:"w"}`;
  const id = installDeck([mountMark(1), bad, mountMark(3), KW()]);
  await withPage(id, "?shot", "", async (page) => {
    const chk = await readCheck(page);
    assert.deepEqual(chk.errors.filter((e) => e.rule === "predict-choices").map((e) => e.where), ["장면 2"]);
    for (const e of chk.errors.filter((x) => x.rule === "scene-error")) assert.equal(e.where, "장면 2");
    assert.deepEqual(await page.eval(`window.__mounted.slice().sort()`), [1, 3]);
  });
});

// ---------- VO-6 takeaway reveal transitions (FR-10, C-11, C-12, QR-4) ----------

const D6 = [FIG, PRED(), CMP("TK-CMP"), CMP("TK-NOREV", "reveal:false,"), `{type:"summary",title:"정리"}`, OV, KW()];
const REVEAL_PREDICT = `(function(){var w=document.querySelector(".dk-pred");w.querySelector("[data-choice=a]").click();
  var b=[].find.call(w.querySelectorAll("button"),function(x){return x.textContent.trim()==="정답 보기";});b.click();})()`;
const needBtn = (ok, what) => assert.equal(ok, true, `${what}: no visible button with that label (labels 판정/초기화 come from spec FR-10/VO-6 wording)`);

test("VO-6 FR-10 C-11 predict transitions: initial hidden -> revealed visible -> back to question hidden again", T, async () => {
  const id = installDeck(D6);
  await withPage(id, "?check", "#2", async (page) => {
    assert.equal(await vis(page, "WHY-PRED"), false, "precondition: question state at start");
    assert.equal(await vis(page, "TK-PRED"), false, "takeaway visible before the reveal");
    await page.eval(REVEAL_PREDICT);
    await sleep(1000);
    assert.equal(await page.eval(`document.querySelector(".dk-pred").classList.contains("done")`), true, "precondition: predict revealed");
    assert.equal(await vis(page, "TK-PRED"), true, "takeaway hidden after the reveal");
    await page.eval(`document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}))`);
    await sleep(900);
    assert.equal(await page.eval(`document.querySelector(".dk-pred").classList.contains("done")`), false, "precondition: back to the question state");
    assert.equal(await vis(page, "TK-PRED"), false, "takeaway still visible after going back to the question");
  });
});

// FR-10 v4 "자리 유지": before the reveal the takeaway keeps its box (height > 0) but is hidden (visibility hidden or opacity 0,
// on itself or an ancestor), and neither the scene title nor the takeaway moves by more than 1 px when it appears.
const PLACE = `(function(){
  var g=window.__gd, t=g.pick("TK-PRED"), h=g.pick("예측");
  function hidden(e){ for (var x=e; x && x!==document.body; x=x.parentElement){ var c=getComputedStyle(x); if (c.visibility==="hidden" || c.opacity==="0") return true; } return false; }
  return t && h ? { height:t.getBoundingClientRect().height, top:t.getBoundingClientRect().top, titleTop:h.getBoundingClientRect().top, hidden:hidden(t) } : null;
})()`;
test("VO-6 FR-10 S-1 predict takeaway keeps its place: box height > 0 and hidden before the reveal; title and takeaway tops move <= 1 px after it", T, async () => {
  const id = installDeck(D6);
  await withPage(id, "?check", "#2", async (page) => {
    await page.eval(HELPERS);
    const before = await page.eval(PLACE);
    assert.ok(before, "takeaway or title element not found by text");
    assert.ok(before.height > 0, `takeaway box height ${before.height} before the reveal`);
    assert.equal(before.hidden, true, "takeaway is not hidden by visibility/opacity before the reveal");
    await page.eval(REVEAL_PREDICT);
    await sleep(1000);
    const after = await page.eval(PLACE);
    assert.equal(after.hidden, false);
    assert.ok(Math.abs(after.top - before.top) <= 1, `takeaway top moved ${before.top} -> ${after.top}`);
    assert.ok(Math.abs(after.titleTop - before.titleTop) <= 1, `title top moved ${before.titleTop} -> ${after.titleTop}`);
  });
});

test("VO-6 FR-10 C-12 compare (reveal default) transitions: initial hidden -> verdict revealed visible -> reset hidden", T, async () => {
  const id = installDeck(D6);
  await withPage(id, "?check", "#3", async (page) => {
    assert.equal(await vis(page, "VERD-2"), false, "precondition: verdict hidden at start");
    assert.equal(await vis(page, "TK-CMP"), false, "takeaway visible before the verdict");
    needBtn(await clickBtn(page, "판정"), "reveal");
    await sleep(900);
    assert.equal(await vis(page, "VERD-2"), true, "precondition: verdict revealed");
    assert.equal(await vis(page, "TK-CMP"), true, "takeaway hidden after the verdict");
    needBtn(await clickBtn(page, "초기화"), "reset");
    await sleep(900);
    assert.equal(await vis(page, "TK-CMP"), false, "takeaway still visible after reset");
  });
});

test("VO-6 FR-10 C-12 compare reveal:false: the takeaway is visible from the start", T, async () => {
  const id = installDeck(D6);
  await withPage(id, "?check", "#4", async (page) => {
    assert.equal(await vis(page, "TK-NOREV"), true);
  });
});

test("VO-6 FR-10 C-11 summary still collects the predict and compare takeaways (summary card shows them)", T, async () => {
  const id = installDeck(D6);
  await withPage(id, "?check", "#5", async (page) => {
    for (const t of ["TK-PRED", "TK-CMP", "TK-NOREV"]) assert.equal(await vis(page, t), true, `${t} missing from the summary`);
  });
});

// ---------- VO-7 ?shot&state= and sceneList (FR-11, FR-12, C-13, C-14) ----------

const D7 = [ST("첫 문장"), PRED("TK-PRED", "b"), CMP("TK-CMP"), FIGSTEPS(), ST("문장 <em>강조</em>다"), KW()];

test("VO-7 FR-12 sceneList: n, tag-stripped title and states for predict, compare, figure steps and plain scenes (check and shot)", T, async () => {
  const id = installDeck(D7);
  const want = [
    { n: 1, title: "첫 문장", states: [] },
    { n: 2, title: "예측", states: ["reveal"] },
    { n: 3, title: "비교", states: ["reveal"] },
    { n: 4, title: "그림 단계", states: ["step-2", "step-3"] },
    { n: 5, title: "문장 강조다", states: [] },
    { n: 6, title: "끝", states: [] },
  ];
  for (const query of ["?check", "?shot"]) {
    await withPage(id, query, "", async (page) => assert.deepEqual((await readCheck(page)).sceneList, want, query));
  }
});

test("VO-7 FR-12 sceneList: compare with reveal:false has no state", T, async () => {
  const id = installDeck([ST(), CMP("TK-NOREV", "reveal:false,"), KW()]);
  await withPage(id, "?check", "", async (page) => {
    assert.deepEqual((await readCheck(page)).sceneList.map((s) => s.states), [[], [], []]);
  });
});

test("VO-7 FR-12 G-3: a deck whose lesson has related concepts gets a map-related scene appended; sceneList still lists only the authored scenes", T, async () => {
  const id = installDeck(D7);
  const other = "20261001-gdmap";
  for (const [lid, concepts] of [[id, [concept("alpha", { requires: ["beta"] })]], [other, [concept("beta")]]]) {
    mkdirSync(join(home, "lessons", lid), { recursive: true });
    writeFileSync(join(home, "lessons", lid, "result.md"), L(lid, "2026-10-01", concepts).text);
  }
  assert.equal(ltt(home, ["rebuild"]).code, 0, "ltt-map rebuild failed");
  await withPage(id, "?check", "", async (page) => {
    let n = 0;
    for (let i = 0; i < 60; i++) {
      n = await page.eval(`document.querySelectorAll(".dk-scene").length`);
      if (n > D7.length) break;
      await sleep(250);
    }
    assert.equal(n, D7.length + 1, `expected a map-related scene after the ${D7.length} authored ones (DOM scenes: ${n})`);
    const chk = await readCheck(page);
    assert.deepEqual(chk.sceneList.map((x) => x.n), [1, 2, 3, 4, 5, 6]);
    assert.equal(chk.sceneList.length, D7.length);
  });
});

test("VO-7 FR-11 C-13 EP reveal on predict: ?shot&state=reveal#2 draws the answered state (takeaway and why shown)", T, async () => {
  const id = installDeck(D7);
  await withPage(id, "?shot&state=reveal", "#2", async (page) => {
    assert.equal(await page.eval(`document.querySelector(".dk-pred").classList.contains("done")`), true, ".dk-pred is not in the revealed state");
    assert.equal(await vis(page, "WHY-PRED"), true);
    assert.equal(await vis(page, "TK-PRED"), true);
    // FR-11 v4: only the answer's choice button (answer is "b", not the first choice) is aria-pressed.
    const pressed = await page.eval(`[].map.call(document.querySelectorAll(".dk-pred [data-choice]"),function(b){return [b.getAttribute("data-choice"),b.getAttribute("aria-pressed")];})`);
    assert.ok(["a", "b"].every((c) => pressed.some((x) => x[0] === c)), JSON.stringify(pressed)); // the kit may add its own extra buttons (e.g. "unsure")
    assert.deepEqual(pressed.filter((x) => x[1] === "true").map((x) => x[0]), ["b"], JSON.stringify(pressed));
  });
});

test("VO-7 FR-11 EP reveal on compare: ?shot&state=reveal#3 draws the verdict and the takeaway", T, async () => {
  const id = installDeck(D7);
  await withPage(id, "?shot&state=reveal", "#3", async (page) => {
    assert.equal(await vis(page, "VERD-2"), true);
    assert.equal(await vis(page, "TK-CMP"), true);
  });
});

for (const [k, later] of [[2, "STEPCAP-3"], [3, null]]) {
  test(`VO-7 FR-11 EP step-${k} (${k === 2 ? "first state after the start" : "last state m"}): ?shot&state=step-${k}#4 shows caption ${k}${later ? `, not ${later}` : ""}`, T, async () => {
    const id = installDeck(D7);
    await withPage(id, `?shot&state=step-${k}`, "#4", async (page) => {
      assert.equal(await vis(page, `STEPCAP-${k}`), true, `caption ${k} not shown`);
      if (later) assert.equal(await vis(page, later), false, `${later} is shown too`);
    });
  });
}

for (const [label, query, hash, plainHash] of [
  ["unknown value", "?shot&state=zzz", "#2", "#2"],
  ["unknown step value", "?shot&state=step-x", "#4", "#4"],
  ["reveal on a statement scene (C-14)", "?shot&state=reveal", "#1", "#1"],
  ["step-2 on a statement scene", "?shot&state=step-2", "#5", "#5"],
]) {
  test(`VO-7 FR-11 C-14 EP ${label}: the screen and check errors equal the stateless ?shot${plainHash}`, T, async () => {
    const id = installDeck(D7);
    const plain = await withPage(id, "?shot", plainHash, async (p) => ({ text: await pageText(p), rects: await rectDump(p), errors: (await readCheck(p)).errors }));
    const withState = await withPage(id, query, hash, async (p) => ({ text: await pageText(p), rects: await rectDump(p), errors: (await readCheck(p)).errors }));
    assert.deepEqual(withState.errors, plain.errors);
    assert.equal(withState.text, plain.text);
    assert.equal(withState.rects, plain.rects);
    assert.equal(withState.errors.some((e) => e.rule === "script-error" || e.rule === "scene-error"), false);
  });
}

// ---------- VO-8 audit --shots files and index.md (FR-13, QR-2, QR-6, C-13) ----------

const clockScene = `{title:"시계 장면",narration:"n",mount:function(body){body.innerHTML='<div id="ck" style="padding:12px">clock</div>';LTT.clock(body.querySelector("#ck"),function(t){},{dur:1000,id:"clk"});return {};}}`;
const D13 = [`{type:"hook",title:"후크",text:"h"}`, clockScene, ST("문장"), PRED("TK-PRED", "b"), CMP("TK-CMP"), FIGSTEPS("그림 단계"), SUM, OV, KW()];
const SHOT_RE = /^(.+)-(\d+x\d+)-s(\d\d)(?:-(reveal)|-step(\d+))?\.png$/;
const writeChecklist = (text) => {
  const f = join(tmp("ltt-gd-cl-"), "checklist.md");
  writeFileSync(f, text);
  return f;
};
const indexRows = (dir) => readFileSync(join(dir, "index.md"), "utf8").split("\n").filter((l) => l.includes("|")).map((l) => l.split("|").map((c) => c.trim()).filter((c, i, a) => !(c === "" && (i === 0 || i === a.length - 1))));

test("VO-8 FR-13 C-13: s04-reveal, s05-reveal (compare), s06-step2, s06-step3 are written beside the scene shots, each differing in bytes from its base PNG; index.md rows carry file, scene, title and state", T, async () => {
  const dir = join(tmp("ltt-gd-out-"), "shots");
  const { r } = await auditDeck(D13, { shots: dir, checklist: writeChecklist("[shot clk 500]\n") });
  assert.equal(r.error, undefined, r.error);
  const names = r.shots.map((p) => basename(p));
  const parsed = names.map((n) => SHOT_RE.exec(n));
  const scenes = parsed.filter((m) => m && !m[4] && !m[5]).map((m) => Number(m[3]));
  assert.deepEqual(scenes, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const states = parsed.filter((m) => m && (m[4] || m[5])).map((m) => m[0]);
  const slug = parsed.find(Boolean)[1];
  const size = r.size;
  assert.deepEqual(states.sort(), [`${slug}-${size}-s04-reveal.png`, `${slug}-${size}-s05-reveal.png`, `${slug}-${size}-s06-step2.png`, `${slug}-${size}-s06-step3.png`].sort());
  const bytesOf = (n) => readFileSync(r.shots.find((p) => basename(p) === n));
  for (const [state, base] of [["s04-reveal", "s04"], ["s05-reveal", "s05"], ["s06-step2", "s06"], ["s06-step3", "s06"]]) {
    assert.ok(!bytesOf(`${slug}-${size}-${state}.png`).equals(bytesOf(`${slug}-${size}-${base}.png`)), `${state} is byte-identical to ${base}`);
  }
  assert.ok(!bytesOf(`${slug}-${size}-s06-step2.png`).equals(bytesOf(`${slug}-${size}-s06-step3.png`)), "step2 and step3 are byte-identical");
  for (const p of r.shots) {
    assert.ok(resolve(p).startsWith(resolve(dir) + "/"), `${p} is outside ${dir}`);
    assert.ok(isPng(p), `${p} is not a PNG`);
  }
  assert.equal(r.truncated, false);
  const clockPng = names.find((n) => /-clk-t500\.png$/.test(n));
  assert.ok(clockPng, `no clock PNG in ${names.join(", ")}`);
  assert.ok(existsSync(join(dir, "index.md")), "index.md missing");
  const rows = indexRows(dir);
  const row = (file) => rows.find((c) => c[0] === file);
  const sceneCell = (n) => new RegExp(`^(장면\\s*)?${n}$`);
  const want = [
    [`${slug}-${size}-s04-reveal.png`, 4, "예측", /reveal/],
    [`${slug}-${size}-s05-reveal.png`, 5, "비교", /reveal/],
    [`${slug}-${size}-s06-step2.png`, 6, "그림 단계", /step-?2/],
    [`${slug}-${size}-s06-step3.png`, 6, "그림 단계", /step-?3/],
    [`${slug}-${size}-s04.png`, 4, "예측", /^처음$/],
    [`${slug}-${size}-s01.png`, 1, "후크", /^처음$/],
    [`${slug}-${size}-s09.png`, 9, "끝", /^처음$/],
  ];
  for (const [file, n, title, stateRe] of want) {
    const c = row(file);
    assert.ok(c, `no index row for ${file}`);
    assert.match(c[1], sceneCell(n), file);
    assert.equal(c[2], title, file);
    assert.match(c[3], stateRe, file);
  }
  const indexText = readFileSync(join(dir, "index.md"), "utf8");
  assert.ok(indexText.split("\n").some((l) => l.includes(clockPng) && l.includes("clock clk 500")), "clock mark row missing");
});

test("VO-8 FR-13 QR-2 BVA 0 states: a deck without states gets only s01..s04 and index.md rows with state 처음", T, async () => {
  const dir = join(tmp("ltt-gd-out-"), "shots");
  const { r } = await auditDeck([ST("하나"), ST("둘"), ST("셋"), KW()], { shots: dir });
  assert.equal(r.error, undefined, r.error);
  const files = readdirSync(dir).filter((f) => f !== "index.md").sort();
  assert.equal(files.length, 4, files.join(", "));
  files.forEach((f, i) => assert.match(f, new RegExp(`-s0${i + 1}\\.png$`)));
  assert.deepEqual(readdirSync(dir).filter((f) => !f.endsWith(".png") && f !== "index.md"), []);
  const rows = indexRows(dir).filter((c) => c[0].endsWith(".png"));
  assert.equal(rows.length, 4);
  for (const c of rows) assert.equal(c[3], "처음");
});

test("VO-8 FR-13 sizes: with two sizes index.md lists every PNG of both sizes", T, async () => {
  const dir = join(tmp("ltt-gd-out-"), "shots");
  const id = installDeck(D7);
  const results = await AUDIT.audit({ targets: [id], sizes: ["1440x900", "1280x800"], chrome, home, jobs: 2, shots: dir });
  const text = readFileSync(join(dir, "index.md"), "utf8");
  for (const r of results) {
    assert.equal(r.error, undefined, r.error);
    assert.equal(r.shots.filter((p) => /-s0[1-6](-reveal|-step\d)?\.png$/.test(p)).length, 6 + 1 + 1 + 2, r.size);
    for (const p of r.shots) assert.ok(text.includes(basename(p)), `index.md lacks ${basename(p)}`);
  }
  assert.deepEqual([...new Set(results.map((r) => r.size))].sort(), ["1280x800", "1440x900"]);
});

// scenes + states = 30 / 31 (MAX_PAGE_SHOTS 30): 29 statements+predict... counts below include the predict's reveal state.
const bulk = (scenes) => [...Array.from({ length: scenes - 2 }, (_, i) => ST(`장면 ${i + 1}`)), PRED(), KW()];
for (const [label, scenes, truncated] of [["29 scenes + 1 state = 30", 29, false], ["30 scenes + 1 state = 31", 30, true]]) {
  test(`VO-8 FR-13 BVA ${label}: 30 PNGs, truncated ${truncated}`, T, async () => {
    const dir = join(tmp("ltt-gd-out-"), "shots");
    const { r } = await auditDeck(bulk(scenes), { shots: dir });
    assert.equal(r.error, undefined, r.error);
    assert.equal(r.truncated, truncated);
    assert.equal(r.shots.length, 30);
    assert.equal(readdirSync(dir).filter((f) => f.endsWith(".png")).length, 30);
    if (!truncated) assert.ok(r.shots.some((p) => /-reveal\.png$/.test(p)), "the reveal state of the 30th shot is missing");
  });
}

test("VO-8 QR-6: every file the audit makes is a PNG or index.md directly inside the --shots directory", T, async () => {
  const base = tmp("ltt-gd-sec-");
  const dir = join(base, "x", "shots");
  const { r } = await auditDeck(D13, { shots: dir });
  assert.equal(r.error, undefined, r.error);
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? [join(d, e.name), ...walk(join(d, e.name))] : [join(d, e.name)]));
  const inside = walk(base).filter((p) => p !== join(base, "x") && p !== dir);
  assert.deepEqual(inside.filter((p) => !p.startsWith(dir + "/")), []);
  for (const p of inside) assert.match(basename(p), /^[A-Za-z0-9_.-]+$/, `unsafe file name ${p}`);
  assert.deepEqual(readdirSync(dir).filter((f) => !f.endsWith(".png") && f !== "index.md"), []);
});
