import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import vm from "node:vm";
import { HELPERS, J, KW, ST, FIG, MOUNT, ROOT, createHarness, key, pollUntil, vis } from "./fixtures/layout-check/harness.mjs";

// Spec e48ead05eb246d3c v1 VO-4..VO-8, VO-10, VO-14 (hook art and unknown-icon, summary paging, rendered-text term checks,
// attach timing and figure return forms, LTT.compare, ?shot clock repaint, SKILL.md/API.md sentence location).
// Expected values come from the spec's FR/Cases/Signatures, never from running the implementation. Kit elements are found by text
// and geometry (the spec fixes no class names); the summary h2 is the one element the spec names (FR-7).

const H = createHarness("kd");
const T = H.T;
before(H.setup);
after(H.teardown);

const rulesOf = (chk, rule) => chk.errors.filter((e) => e.rule === rule);

function loadKit() {
  const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
  vm.createContext(context);
  vm.runInContext(readFileSync(join(ROOT, "skills/learn-to-tell/kit/ltt.js"), "utf8"), context);
  return { LTT: context.LTT, run: (src) => vm.runInContext(src, context) };
}

// ---------- VO-4 lint unknown-icon (FR-6, C-10): equivalence partitioning, 3 fields x {known, unknown, HTML} ----------

const { LTT: KIT } = loadKit();
const iconKnown = (n) => (typeof KIT.icons?.has === "function" ? KIT.icons.has(n) : Array.isArray(KIT.icons) ? KIT.icons.includes(n) : n in (KIT.icons ?? {}));
const lintIcons = (spec) => Array.from(KIT.lintDeck(spec), (w) => ({ scene: w.scene, rule: w.rule, msg: w.msg })).filter((w) => w.rule === "unknown-icon");
const NEXT = [{ term: "다음", why: "이유" }];
const kwS = () => ({ type: "keywords", terms: [], next: NEXT });
const figS0 = () => ({ type: "figure", title: "t", caption: "c", figure: "그림" });
const hookO = (art) => ({ type: "hook", text: "h", ...(art === undefined ? {} : { art }) });
const explainO = (...icons) => ({ type: "explain", form: "strip", title: "e", steps: icons.map((icon) => ({ icon, title: "s", text: "t" })) });
const termsO = (icon) => ({ type: "terms", title: "용어", terms: [{ key: "k", plain: "p", visual: false, icon }] });
const deckO = (scenes) => ({ theme: "paper", scenes });

test("VO-4 C-10 precondition (spec): 'cpu' is a kit icon; 'database' and 'rocketship' are not", () => {
  assert.equal(iconKnown("cpu"), true);
  assert.equal(iconKnown("database"), false);
  assert.equal(iconKnown("rocketship"), false);
  assert.equal(iconKnown("submarine"), false, "fixture value assumed unknown");
});

const ICON_CASES = [
  ["hook art", (v) => deckO([hookO(v), figS0(), kwS()]), 1],
  ["explain step icon", (v) => deckO([figS0(), explainO(v), kwS()]), 2],
  ["terms icon", (v) => deckO([figS0(), termsO(v), kwS()]), 2],
];
for (const [field, build, scene] of ICON_CASES) {
  for (const [kind, value, n] of [["known name", "cpu", 0], ["unknown name", "rocketship", 1], ["HTML string", "<svg></svg>", 0]]) {
    test(`VO-4 FR-6 ${field} ${kind} (${JSON.stringify(value)}): ${n} unknown-icon at 장면 ${scene}`, () => {
      const got = lintIcons(build(value));
      assert.deepEqual(got.map((w) => w.scene), n ? [scene] : []);
      if (n) assert.ok(got[0].msg.includes(value), got[0].msg);
    });
  }
}

test("VO-4 FR-6 hook art absent and hook art function: no unknown-icon", () => {
  assert.deepEqual(lintIcons(deckO([hookO(undefined), figS0(), kwS()])), []);
  assert.deepEqual(lintIcons(deckO([hookO(() => {}), figS0(), kwS()])), []);
});

test("VO-4 FR-6 one finding per unknown value: two different unknown step icons in one scene give two findings at that scene", () => {
  const got = lintIcons(deckO([figS0(), explainO("rocketship", "submarine", "cpu"), kwS()]));
  assert.deepEqual(got.map((w) => w.scene), [2, 2]);
  assert.deepEqual(got.map((w) => w.msg.includes("rocketship") || w.msg.includes("submarine")), [true, true]);
});

test("VO-4 C-10: hook art 'database', explain step icon 'rocketship' and terms icon 'cpu' give 2 findings (hook scene, explain scene), cpu none", () => {
  const got = lintIcons(deckO([hookO("database"), termsO("cpu"), explainO("rocketship"), kwS()]));
  assert.deepEqual(got.map((w) => w.scene).sort(), [1, 3]);
});

test("VO-4 C-10 (?check): the same deck gives unknown-icon at 장면 1 and 장면 3 in #ltt-check errors, naming the values", T, async () => {
  const scenes = [`{type:"hook",art:"database",text:"HOOKTXT"}`, `{type:"terms",title:"용어",terms:[{key:"TERMK",plain:"P",visual:false,icon:"cpu"}]}`,
    `{type:"explain",form:"strip",title:"E",steps:[{icon:"rocketship",title:"s",text:"t"}]}`, KW];
  const id = H.installDeck(scenes);
  await H.withPage(id, "?check", "", async (page) => {
    const ui = rulesOf(await H.readCheck(page), "unknown-icon");
    assert.deepEqual(ui.map((e) => e.where).sort(), ["장면 1", "장면 3"]);
    assert.ok(ui.find((e) => e.where === "장면 1").msg.includes("database"));
    assert.ok(ui.find((e) => e.where === "장면 3").msg.includes("rocketship"));
  });
});

// ---------- VO-4 hook art kinds (FR-5, C-9): icon, HTML, Node, function, none ----------

const MEDIA = `<div><svg id="art-svg" viewBox="0 0 900 300" width="900" height="300"></svg><canvas id="art-cv" width="900" height="300"></canvas>`
  + `<img id="art-img" width="900" height="300" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='300'/%3E"></div>`;
const NODE_ART = `(function(){var s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("id","art-svg");s.setAttribute("viewBox","0 0 900 300");s.setAttribute("width","900");s.setAttribute("height","300");return s;})()`;
const FN_ART = `function(el,ctx){var SRCMARK="x";window.__art={c:el.isConnected,s:!!el.closest(".dk-scene, section")};var d=document.createElement("div");d.id="hook-x";d.textContent="FN-ART";el.appendChild(d);}`;
const HOOK_GEOM = `(function(){
  var L=window.__lc, t=L.pick("HOOKTXT");
  var ids=["art-svg","art-cv","art-img"].filter(function(i){return document.getElementById(i);});
  if (!t||!ids.length) return {error:"hook text or art not drawn"};
  var first=document.getElementById(ids[0]), row=L.lca(first,t), cell=first;
  while (cell.parentElement && cell.parentElement!==row) cell=cell.parentElement;
  var rr=row.getBoundingClientRect(), cr=cell.getBoundingClientRect();
  return {rowW:rr.width, cellW:cr.width, cellRight:cr.right, objText:document.body.innerText.indexOf("[object")>=0, srcText:document.body.innerText.indexOf("SRCMARK")>=0,
    media:ids.map(function(i){var r=document.getElementById(i).getBoundingClientRect();return {id:i,w:r.width,h:r.height,right:r.right};})};
})()`;
const hookDeck = (art) => H.installDeck([`{type:"hook",art:${art},text:"HOOKTXT"}`, ST("둘"), KW]);

for (const [label, art, ids] of [["HTML string (svg, canvas, img 900px wide)", J(MEDIA), 3], ["Node (900px viewBox svg)", NODE_ART, 1]]) {
  test(`VO-4 FR-5 C-9 hook art ${label}: no "[object", cell <= 40% of the hook row + 1, media inside the cell with aspect kept, no box-overflow`, T, async () => {
    const id = hookDeck(art);
    await H.withPage(id, "?check", "", async (page) => {
      await page.eval(HELPERS);
      const g = await page.eval(HOOK_GEOM);
      assert.equal(g.error, undefined, g.error);
      assert.equal(g.media.length, ids);
      assert.equal(g.objText, false, "a Node was printed as [object …]");
      assert.ok(g.cellW <= 0.4 * g.rowW + 1, `cell ${g.cellW} > 40% of row ${g.rowW}`);
      for (const m of g.media) {
        assert.ok(m.right <= g.cellRight + 1, `${m.id} right ${m.right} > cell right ${g.cellRight}`);
        assert.ok(m.w <= g.cellW + 1, `${m.id} wider than the cell`);
        assert.ok(Math.abs(m.h / m.w - 1 / 3) < 0.02, `${m.id} aspect ${m.h}/${m.w}`);
      }
      assert.deepEqual(rulesOf(await H.readCheck(page), "box-overflow"), []);
    });
  });
}

test("VO-4 FR-5 C-9 hook art function: called with a connected node inside the scene section, its #hook-x exists, the source text is not printed, no box-overflow", T, async () => {
  const id = hookDeck(FN_ART);
  await H.withPage(id, "?check", "", async (page) => {
    assert.deepEqual(await page.eval(`window.__art`), { c: true, s: true });
    assert.equal(await page.eval(`!!document.getElementById("hook-x")`), true);
    assert.equal(await page.eval(`document.body.innerText.indexOf("SRCMARK")>=0 || document.body.innerText.indexOf("=>")>=0`), false);
    const chk = await H.readCheck(page);
    assert.deepEqual(rulesOf(chk, "box-overflow"), []);
    assert.deepEqual(rulesOf(chk, "scene-error"), []);
  });
});

test("VO-4 FR-5 hook art icon name and no art: drawn without scene-error, box-overflow or unknown-icon", T, async () => {
  for (const art of [`"cpu"`, null]) {
    const scene = art ? `{type:"hook",art:${art},text:"HOOKTXT"}` : `{type:"hook",text:"HOOKTXT"}`;
    const id = H.installDeck([scene, ST("둘"), KW]);
    await H.withPage(id, "?check", "", async (page) => {
      const chk = await H.readCheck(page);
      for (const r of ["scene-error", "box-overflow", "unknown-icon"]) assert.deepEqual(rulesOf(chk, r), [], `${art}: ${r}`);
      assert.equal(await vis(page, "HOOKTXT"), true);
      assert.equal(await page.eval(`document.body.innerText.indexOf("[object")>=0`), false);
    });
  }
});

// ---------- VO-5 summary paging: state transition, 0-switch (FR-7, C-11, C-12, QR-4) ----------

const EXS = (k, recall, title = `EXT${k}`) => `{type:"explain",form:"strip",title:${J(title)},steps:[{icon:"check",title:"s",text:"t"}],takeaway:"TKW${k}X"${recall ? `,recall:"RQ${k}X?"` : ""}}`;
const SUMS = (extra = "") => `{type:"summary",title:"SUMTITLE"${extra}}`;
const OVS = `{type:"overview",title:"OVTITLE",figure:"<svg></svg>",caption:"c"}`;
const sumDeck = (n, recall, extra = "") => [FIG, ...Array.from({ length: n }, (_, i) => EXS(i + 1, recall)), SUMS(extra), OVS, KW];
const tok = (recall) => (recall ? "RQ" : "TKW");
const sumN = (n) => n + 2;
const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

const SNAP = (prefix, n) => `(function(){
  var L=window.__lc;
  var hs=[].filter.call(document.querySelectorAll("h2"),function(h){return h.textContent.indexOf("SUMTITLE")>=0;});
  var h=hs.find(L.shown)||hs[0]; if(!h) return null;
  var sec=L.sceneOf(h), items=[];
  for (var k=1;k<=${n};k++){ var tk=${J(prefix)}+k+"X"; if (L.els(tk).some(function(e){return sec.contains(e)&&L.shown(e);})) items.push(k); }
  var pager=null, w=document.createTreeWalker(sec,NodeFilter.SHOW_TEXT), t;
  while((t=w.nextNode())){ var m=/^\\s*(\\d+)\\s*\\/\\s*(\\d+)\\s*$/.exec(t.nodeValue); if(m && t.parentElement && L.shown(t.parentElement)){ pager={k:+m[1],m:+m[2]}; break; } }
  return {titleShown:L.shown(h), h:h.getBoundingClientRect().height, items:items, pager:pager};
})()`;
const h2Shown = (token) => `[].some.call(document.querySelectorAll("h2"),function(h){return h.textContent.indexOf(${J(token)})>=0 && window.__lc.shown(h);})`;
const CLICK = (which) => `(function(){
  var L=window.__lc;
  var hs=[].filter.call(document.querySelectorAll("h2"),function(h){return h.textContent.indexOf("SUMTITLE")>=0;});
  var sec=L.sceneOf(hs.find(L.shown)||hs[0]), ind=null, w=document.createTreeWalker(sec,NodeFilter.SHOW_TEXT), t;
  while((t=w.nextNode())){ if(/^\\s*\\d+\\s*\\/\\s*\\d+\\s*$/.test(t.nodeValue) && t.parentElement && L.shown(t.parentElement)){ ind=t.parentElement; break; } }
  if(!ind) return "no pager indicator";
  function label(b){ return b.textContent+" "+(b.getAttribute("aria-label")||"")+" "+(b.title||""); }
  for (var a=ind; a && a!==sec.parentElement; a=a.parentElement){
    var bs=[].filter.call(a.querySelectorAll("button"),L.shown);
    var prev=bs.find(function(b){return /이전/.test(label(b));}), next=bs.find(function(b){return /다음/.test(label(b));});
    if (prev && next){ (${J(which)}==="next"?next:prev).click(); return "clicked"; }
  }
  return "no 이전/다음 button pair next to the indicator";
})()`;
const snapOf = (page, recall, n) => page.eval(SNAP(tok(recall), n));
const settle = async (page, recall, n, pred, ms = 4000) => pollUntil(async () => { const s = await snapOf(page, recall, n); return s && pred(s) ? s : null; }, ms);
async function openSum(page) { await page.eval(HELPERS); }

for (const [label, recall] of [["recall form", true], ["card form", false]]) {
  for (const [n, extra, pages] of [[6, "", 1], [7, "", 2]]) {
    test(`VO-5 C-12 boundary ${label} ${n} items: ${pages === 1 ? "no paging, sceneList states []" : "2 pages, states [page-2]; 다음/이전 buttons switch pages and h2 height is constant"}`, T, async () => {
      const id = H.installDeck(sumDeck(n, recall, extra));
      await H.withPage(id, "?check", `#${sumN(n)}`, async (page) => {
        await openSum(page);
        const chk = await H.readCheck(page);
        assert.deepEqual(chk.sceneList.find((s) => s.n === sumN(n)).states, pages === 1 ? [] : ["page-2"]);
        const s1 = await settle(page, recall, n, (s) => s.titleShown);
        assert.ok(s1, "summary not shown");
        if (pages === 1) {
          assert.deepEqual(s1.items, range(1, n));
          assert.equal(s1.pager, null, "a pager is shown for 6 items");
          return;
        }
        assert.deepEqual(s1.items, range(1, 6));
        assert.deepEqual(s1.pager, { k: 1, m: 2 });
        assert.equal(await page.eval(CLICK("next")), "clicked");
        const s2 = await settle(page, recall, n, (s) => s.pager && s.pager.k === 2);
        assert.ok(s2, "다음 did not switch to page 2");
        assert.deepEqual(s2.items, [7]);
        assert.ok(Math.abs(s2.h - s1.h) <= 1, `h2 height ${s1.h} -> ${s2.h}`);
        assert.equal(await page.eval(CLICK("prev")), "clicked");
        const s3 = await settle(page, recall, n, (s) => s.pager && s.pager.k === 1);
        assert.ok(s3, "이전 did not switch back to page 1");
        assert.deepEqual(s3.items, range(1, 6));
        assert.ok(Math.abs(s3.h - s1.h) <= 1);
      });
    });
  }
}

test("VO-5 FR-7 boundary with extra: 5 takeaways + extra = 6 items have no paging; 6 + extra = 7 items have page-2", T, async () => {
  const extra = `,extra:{title:"EXTRATITLE",text:"EXTRATEXT"}`;
  for (const [n, states] of [[5, []], [6, ["page-2"]]]) {
    const id = H.installDeck(sumDeck(n, true, extra));
    await H.withPage(id, "?check", "", async (page) => {
      assert.deepEqual((await H.readCheck(page)).sceneList.find((s) => s.n === sumN(n)).states, states, `${n} takeaways + extra`);
    });
  }
});

test("VO-5 C-11: 9 recall items: pages 6+3, states [page-2]; ?shot&state=page-2#11 shows items 7-9 only; page-3 (out of range) behaves like no state", T, async () => {
  const id = H.installDeck(sumDeck(9, true));
  await H.withPage(id, "?check", "#11", async (page) => {
    assert.deepEqual((await H.readCheck(page)).sceneList.find((s) => s.n === 11).states, ["page-2"]);
  });
  await H.withPage(id, "?shot&state=page-2", "#11", async (page) => {
    await openSum(page);
    const s = await settle(page, true, 9, (x) => x.titleShown);
    assert.deepEqual(s.items, [7, 8, 9]);
    assert.deepEqual(s.pager, { k: 2, m: 2 });
  });
  const plain = await H.withPage(id, "?shot", "#11", async (page) => { await openSum(page); return settle(page, true, 9, (x) => x.titleShown); });
  assert.deepEqual(plain.items, range(1, 6));
  await H.withPage(id, "?shot&state=page-3", "#11", async (page) => {
    await openSum(page);
    const s = await settle(page, true, 9, (x) => x.titleShown);
    assert.deepEqual(s.items, plain.items);
    assert.deepEqual(s.pager, plain.pager);
  });
});

test("VO-5 FR-7: 13 items give three pages with states [page-2, page-3]; ?shot&state=page-3 shows item 13 only", T, async () => {
  const id = H.installDeck(sumDeck(13, true));
  await H.withPage(id, "?check", "", async (page) => {
    assert.deepEqual((await H.readCheck(page)).sceneList.find((s) => s.n === 15).states, ["page-2", "page-3"]);
  });
  await H.withPage(id, "?shot&state=page-3", "#15", async (page) => {
    await openSum(page);
    const s = await settle(page, true, 13, (x) => x.titleShown);
    assert.deepEqual(s.items, [13]);
    assert.deepEqual(s.pager, { k: 3, m: 3 });
  });
});

// QR-4: m pages -> (m-1) presses of → keep the scene, one more goes to the next scene; ← goes back through the pages, then to the previous scene.
for (const [label, recall, n, m] of [["recall form, 3 pages", true, 13, 3], ["card form, 2 pages", false, 7, 2]]) {
  test(`VO-5 QR-4 transitions ${label}: ${m - 1} x ArrowRight stay on the summary page by page, the next one leaves; ArrowLeft returns through the pages to the previous scene; h2 height constant`, T, async () => {
    const id = H.installDeck(sumDeck(n, recall));
    await H.withPage(id, "?check", `#${sumN(n)}`, async (page) => {
      await openSum(page);
      let s = await settle(page, recall, n, (x) => x.titleShown && x.pager);
      assert.ok(s && s.pager.k === 1 && s.pager.m === m, JSON.stringify(s));
      const h0 = s.h;
      for (let k = 2; k <= m; k++) {
        await page.eval(key("ArrowRight"));
        s = await settle(page, recall, n, (x) => x.pager && x.pager.k === k);
        assert.ok(s, `after ${k - 1} x ArrowRight the pager is not at ${k} / ${m}`);
        assert.ok(s.titleShown);
        assert.ok(Math.abs(s.h - h0) <= 1, `h2 height ${h0} -> ${s.h}`);
        assert.deepEqual(s.items, range((k - 1) * 6 + 1, Math.min(n, k * 6)));
      }
      await page.eval(key("ArrowRight"));
      assert.equal(await pollUntil(() => page.eval(h2Shown("OVTITLE"))), true, "one more ArrowRight did not reach the next scene");
      assert.equal((await snapOf(page, recall, n)).titleShown, false, "the summary is still shown");
      await page.eval(key("ArrowLeft"));
      s = await settle(page, recall, n, (x) => x.titleShown && x.pager);
      assert.ok(s, "ArrowLeft from the next scene did not return to the summary");
      for (let k = s.pager.k - 1; k >= 1; k--) {
        await page.eval(key("ArrowLeft"));
        const t = await settle(page, recall, n, (x) => x.pager && x.pager.k === k);
        assert.ok(t, `ArrowLeft did not go back to page ${k}`);
        assert.ok(t.titleShown);
      }
      await page.eval(key("ArrowLeft"));
      assert.equal(await pollUntil(() => page.eval(h2Shown(`EXT${n}`))), true, "ArrowLeft from page 1 did not reach the previous scene");
      assert.equal((await snapOf(page, recall, n)).titleShown, false);
    });
  });
}

test("VO-5 FR-7 audit --shots: the 9-item summary gets an sNN-page2.png beside its base shot, different bytes, and an index.md row with state page-2", T, async () => {
  const id = H.installDeck(sumDeck(9, true));
  const dir = join(H.tmp("ltt-kd-out-"), "shots");
  const [r] = await H.runAudit({ targets: [id], shots: dir });
  assert.equal(r.error, undefined, r.error);
  const names = r.shots.map((p) => basename(p));
  const base = names.find((x) => /-s11\.png$/.test(x));
  assert.ok(base, names.join(", "));
  const page2 = base.replace(/-s11\.png$/, "-s11-page2.png");
  assert.ok(names.includes(page2), `${page2} not among ${names.join(", ")}`);
  assert.equal(names.filter((x) => /-page\d+\.png$/.test(x)).length, 1);
  assert.ok(!readFileSync(r.shots.find((p) => basename(p) === page2)).equals(readFileSync(r.shots.find((p) => basename(p) === base))), "page2 shot equals the base shot");
  const rows = readFileSync(join(dir, "index.md"), "utf8").split("\n").filter((l) => l.includes(page2));
  assert.equal(rows.length, 1, rows.join("\n"));
  assert.match(rows[0], /page-2/);
  assert.ok(existsSync(join(dir, page2)));
});

// ---------- VO-6 rendered-text term checks: decision table (FR-8, FR-9, C-13..C-17) ----------

const GL = `glossary:{"캐시":"자주 쓰는 값을 가까이 둔 곳"},`;
const DEF = `{type:"explain",form:"strip",title:"DEF",steps:[{icon:"check",title:"s",text:"{{캐시}}를 쓴다"}]}`;
const termRows = (chk) => chk.errors.filter((e) => ["used-before-defined", "unknown-term"].includes(e.rule)).map((e) => `${e.where}|${e.rule}`).sort();
const termDeck = async (scenes, query = "?shot", hash = "") => {
  const id = H.installDeck(scenes, { extra: GL });
  return { id, run: (fn) => H.withPage(id, query, hash, fn) };
};

test("VO-6 C-13 drawn plain term before the first mark: used-before-defined at 장면 2 (once)", T, async () => {
  const d = await termDeck([ST("시작"), MOUNT("M2", "<p>캐시를 쓴다</p>"), ST("셋"), DEF, KW]);
  await d.run(async (page) => assert.deepEqual(termRows(await H.readCheck(page)), ["장면 2|used-before-defined"]));
});

test("VO-6 C-14 a mark that exists only in drawn text defines the term: the later plain use in scene 3 data is not early", T, async () => {
  const d = await termDeck([ST("시작"), MOUNT("M2", "<p>{{캐시}}를 쓴다</p>"), ST("캐시는 빠르다"), KW]);
  await d.run(async (page) => assert.deepEqual(termRows(await H.readCheck(page)), []));
});

test("VO-6 C-14 variant with a later data mark (scene 4): the drawn mark in scene 2 still wins over the later data mark", T, async () => {
  const d = await termDeck([ST("시작"), MOUNT("M2", "<p>{{캐시}}를 쓴다</p>"), ST("캐시는 빠르다"), DEF, KW]);
  await d.run(async (page) => assert.deepEqual(termRows(await H.readCheck(page)), []));
});

test("VO-6 C-15 a mark with an unknown key that exists only in drawn text: unknown-term at 장면 2, exactly once", T, async () => {
  const d = await termDeck([ST("시작"), MOUNT("M2", "<p>{{없는말}}을 쓴다</p>"), ST("셋"), KW]);
  await d.run(async (page) => assert.deepEqual(termRows(await H.readCheck(page)), ["장면 2|unknown-term"]));
});

test("VO-6 C-16 the same early term in scene data and in drawn text gives one used-before-defined for that scene", T, async () => {
  const d = await termDeck([ST("시작"), MOUNT("캐시 소개", "<p>캐시를 쓴다</p>"), ST("셋"), DEF, KW]);
  await d.run(async (page) => {
    const ubd = rulesOf(await H.readCheck(page), "used-before-defined");
    assert.deepEqual(ubd.map((e) => e.where), ["장면 2"], JSON.stringify(ubd));
  });
});

test("VO-6 aria-hidden drawn text is not read: a plain term and an unknown mark inside aria-hidden give nothing", T, async () => {
  const d = await termDeck([ST("시작"), MOUNT("M2", `<div aria-hidden="true"><span>캐시를 쓴다 {{없는말}}</span></div>`), ST("셋"), DEF, KW]);
  await d.run(async (page) => assert.deepEqual(termRows(await H.readCheck(page)), []));
});

// F-2: a plain load mounts only the current scene (#1) while the automatic check still runs. Scene 7 has 캐시 in its data (title) and 버퍼 only in its mount HTML.
const GL2 = `glossary:{"캐시":"자주 쓰는 값을 가까이 둔 곳","버퍼":"잠시 모아 두는 곳"},`;
const DEF_BUF = `{type:"explain",form:"strip",title:"DEFB",steps:[{icon:"check",title:"s",text:"{{버퍼}}를 쓴다"}]}`;
const unmountedScenes = () => [ST("1"), ST("2"), ST("3"), ST("4"), ST("5"), ST("6"), MOUNT("캐시 장면", "<p>버퍼를 쓴다</p>"), DEF, DEF_BUF, KW];
test("VO-6 unmounted scene: on a plain load scene 7 is not mounted, so its data term (캐시) is flagged and its mount-only term (버퍼) is not", T, async () => {
  const id = H.installDeck(unmountedScenes(), { extra: GL2 });
  await H.withPage(id, "", "", async (page) => {
    assert.equal(await page.eval(`window.__mounted.indexOf("캐시 장면")>=0`), false, "precondition: scene 7 mount must not have run on a plain load");
    const ubd = rulesOf(await H.readCheck(page), "used-before-defined");
    assert.deepEqual(ubd.map((e) => e.where), ["장면 7"], JSON.stringify(ubd));
    assert.ok(ubd[0].msg.includes("캐시") && !ubd[0].msg.includes("버퍼"), ubd[0].msg);
  });
});
test("VO-6 mounted contrast: with ?shot scene 7 is mounted, so both its data term and its mount-only term are flagged", T, async () => {
  const id = H.installDeck(unmountedScenes(), { extra: GL2 });
  await H.withPage(id, "?shot", "", async (page) => {
    assert.equal(await page.eval(`window.__mounted.indexOf("캐시 장면")>=0`), true, "precondition: scene 7 mounted");
    const ubd = rulesOf(await H.readCheck(page), "used-before-defined");
    assert.deepEqual(ubd.map((e) => e.where), ["장면 7", "장면 7"], JSON.stringify(ubd));
    assert.deepEqual(ubd.map((e) => e.msg.includes("캐시") ? "캐시" : e.msg.includes("버퍼") ? "버퍼" : "?").sort(), ["버퍼", "캐시"]);
  });
});

test("VO-6 FR-9 C-17 SVG tspan: {{보이는|캐시}} in figure SVG text is drawn as 보이는 with no '{{', counts as a mark (later plain use not early), and an unknown mark in SVG text is unknown-term", T, async () => {
  const svg1 = `<svg id="sv1" width="300" height="60"><text id="tx1" x="10" y="40" font-size="20">{{보이는|캐시}}</text></svg>`;
  const svg2 = `<svg width="300" height="60"><text x="10" y="40" font-size="20">{{저것|없는말}}</text></svg>`;
  const fig = (title, svg) => `{type:"figure",title:${J(title)},caption:"c",figure:${J(svg)}}`;
  const d = await termDeck([ST("시작"), fig("F2", svg1), ST("캐시는 빠르다"), fig("F4", svg2), DEF, KW]);
  await d.run(async (page) => {
    const r = await page.eval(`(function(){
      var t=document.getElementById("tx1"); if(!t) return {error:"svg text not drawn"};
      var ts=[].filter.call(t.querySelectorAll("tspan"),function(x){return x.textContent==="보이는";});
      return {text:t.textContent, tspans:ts.length, w:ts.length?ts[0].getBBox().width:0};
    })()`);
    assert.equal(r.error, undefined, r.error);
    assert.equal(r.text.includes("{{"), false, `SVG text still holds a mark: ${r.text}`);
    assert.ok(r.text.includes("보이는"));
    assert.equal(r.tspans, 1, "no tspan 보이는");
    assert.ok(r.w > 0, "tspan has no drawn width");
    assert.deepEqual(termRows(await H.readCheck(page)), ["장면 4|unknown-term"]);
  });
});

// ---------- VO-7 attach timing (FR-10, C-18) and figure return forms (FR-11, C-19) ----------

const REC_HEAD = `<script>window.__rec={};window.__ret={};window.__enter={};window.__sweep={};window.__len={};
window.R=function(name,n){(window.__rec[name]=window.__rec[name]||[]).push({c:n.isConnected,s:!!(n.closest&&n.closest(".dk-scene, section")),b:document.body.contains(n)});};</script>`;
const FN = (name) => `function(n){R(${J(name)},n);}`;
const FIGWORK = (name) => `function(n){R(${J(name)},n);n.innerHTML='<input type="range" id="k-${name}" min="0" max="10" value="3"><svg width="100" height="20"><path id="p-${name}" d="M0 0 L100 0"/></svg>';`
  + `window.__sweep[${J(name)}]=[];LTT.sweep({params:{"k-${name}":{min:0,max:10,value:3}},render:function(v){window.__sweep[${J(name)}].push(v);}});window.__len[${J(name)}]=document.getElementById("p-${name}").getTotalLength();return {};}`;
const STEPS2 = `[{caption:"CAP-1",enter:function(){}},{caption:"CAP-2",enter:function(){}}]`;
const SLOT_SCENES = [
  `{type:"hook",art:${FN("hook")},text:"HK"}`,
  `{type:"terms",title:"용어",terms:[{key:"TERMK",plain:"P",visual:${FN("terms")}}]}`,
  `{type:"explain",form:"stack",title:"EX",steps:[{icon:"check",title:"s",text:"t",visual:${FN("explain")}}]}`,
  `{type:"compare",title:"CMP",narration:"n",items:[{label:"L1",visual:${FN("compare")},tone:"good",verdict:"V1"},{label:"L2",visual:"<b>y</b>",tone:"bad",verdict:"V2"}]}`,
  `{type:"statement",title:"문장",visual:${FN("statement")}}`,
  `{type:"predict",title:"PRD",question:"q",choices:[{id:"a",text:"가"},{id:"b",text:"나"}],answer:"a",visual:${FN("predict")},answerVisual:${FN("answerVisual")},why:"w"}`,
  `{type:"contrast",title:"CON",narration:"n",before:{visual:${FN("before")},foot:{label:"BF",visual:${FN("beforeFoot")}}},after:{visual:${FN("after")},foot:{label:"AF",visual:${FN("afterFoot")}}}}`,
  `{type:"figure",title:"FIG",caption:"c",figure:${FIGWORK("fig")}}`,
  `{type:"figure",title:"FIGS",caption:"c",figure:${FIGWORK("figs")},steps:${STEPS2}}`,
  `{type:"figure",title:"FIGA",caption:"c",layout:"split",figure:"그림",aside:${FN("aside")}}`,
  `{type:"overview",title:"OV",figure:${FN("overview")},caption:"c"}`,
  KW,
];
const SLOTS = ["hook", "terms", "explain", "compare", "statement", "predict", "before", "after", "beforeFoot", "afterFoot", "fig", "figs", "aside", "overview"];

test("VO-7 FR-10 C-18: every visual slot function is called with a node that is connected and inside the scene section; sweep finds #k, getTotalLength > 0; no scene-error", T, async () => {
  const id = H.installDeck(SLOT_SCENES, { head: REC_HEAD });
  await H.withPage(id, "?shot", "", async (page) => {
    const rec = await page.eval(`window.__rec`);
    for (const name of SLOTS) {
      assert.ok(rec[name] && rec[name].length >= 1, `slot ${name} was never called`);
      assert.deepEqual(rec[name].filter((x) => !(x.c && x.s && x.b)), [], `slot ${name} got a node that is not attached to the scene section`);
    }
    for (const name of ["fig", "figs"]) {
      assert.ok((await page.eval(`window.__len[${J(name)}]`)) > 0, `${name}: getTotalLength`);
      assert.ok((await page.eval(`window.__sweep[${J(name)}].length`)) >= 1, `${name}: sweep never rendered`);
    }
    const chk = await H.readCheck(page);
    assert.deepEqual(chk.errors.filter((e) => ["scene-error", "check-failed"].includes(e.rule)), [], JSON.stringify(chk.errors));
  });
});

test("VO-7 FR-10: predict answerVisual is called with an attached node (shown with ?shot&state=reveal)", T, async () => {
  const id = H.installDeck(SLOT_SCENES, { head: REC_HEAD });
  await H.withPage(id, "?shot&state=reveal", "#6", async (page) => {
    const calls = await page.eval(`window.__rec.answerVisual||[]`);
    assert.ok(calls.length >= 1, "answerVisual was never called");
    assert.deepEqual(calls.filter((x) => !(x.c && x.s && x.b)), []);
  });
});

const NS = `"http://www.w3.org/2000/svg"`;
const MK = (m, tag = "svg") => `var s=document.createElementNS(${NS},${J(tag)});s.setAttribute("data-m",${J(m)});s.setAttribute("viewBox","0 0 10 10");`;
const FORMS = [
  ["a", (m) => `n.innerHTML='<i data-m="${m}">A</i>';`],
  ["bnode", (m) => `${MK(m)}return s;`],
  ["bhtml", (m) => `return '<svg data-m="${m}" viewBox="0 0 10 10"></svg>';`],
  ["cnew", (m) => `${MK(m)}var ret={el:s,api:{hello:1}};window.__ret[${J(m)}]=ret;return ret;`],
  ["crecv", (m) => `var i=document.createElement("i");i.setAttribute("data-m",${J(m)});n.appendChild(i);return {el:n,api:{}};`],
  ["cinside", (m) => `var i=document.createElement("i");i.setAttribute("data-m",${J(m)});n.appendChild(i);return {el:i};`],
  ["dself", (m) => `var i=document.createElement("i");i.setAttribute("data-m",${J(m)});n.appendChild(i);return n;`],
];
const formScene = (form, body, m, steps) => `{type:"figure",title:${J("F-" + m)},caption:"c",figure:function(n){${body(m)}}${steps ? `,steps:[{caption:"S1",enter:function(k,fig){(window.__enter[${J(m)}]=window.__enter[${J(m)}]||[]).push(fig);}},{caption:"S2",enter:function(k,fig){(window.__enter[${J(m)}]=window.__enter[${J(m)}]||[]).push(fig);}}]` : ""}}`;
const FORM_NAMES = FORMS.flatMap(([f]) => [f, `${f}-s`]);
test("VO-7 FR-11 C-19: return forms (nothing, new Node, HTML string, {el: new}, {el: received}, {el: inside}, received node) x steps on/off: no scene-error or check-failed, each marker exactly once", T, async () => {
  const scenes = [...FORMS.flatMap(([f, body]) => [formScene(f, body, f, false), formScene(f, body, `${f}-s`, true)]), KW];
  const id = H.installDeck(scenes, { head: REC_HEAD });
  await H.withPage(id, "?shot", "", async (page) => {
    const chk = await H.readCheck(page);
    assert.deepEqual(chk.errors.filter((e) => ["scene-error", "check-failed"].includes(e.rule)), [], JSON.stringify(chk.errors));
    const counts = await page.eval(`${J(FORM_NAMES)}.map(function(m){var els=document.querySelectorAll('[data-m="'+m+'"]');return {m:m,n:els.length,inScene:els.length?!!els[0].closest(".dk-scene, section"):false};})`);
    for (const c of counts) {
      assert.equal(c.n, 1, `${c.m}: ${c.n} copies of the drawn node`);
      assert.equal(c.inScene, true, `${c.m}: not inside a scene section`);
    }
  });
});

test("VO-7 FR-11 C-19 (c): steps enter(k, fig) receives the returned {el, api} object itself", T, async () => {
  const [, body] = FORMS.find(([f]) => f === "cnew");
  const id = H.installDeck([ST("앞"), formScene("cnew", body, "cnew-s", true), KW], { head: REC_HEAD });
  await H.withPage(id, "?shot&state=step-2", "#2", async (page) => {
    const r = await page.eval(`(function(){var calls=window.__enter["cnew-s"]||[];return {n:calls.length,same:calls.every(function(f){return f===window.__ret["cnew-s"];}),api:calls.every(function(f){return f&&f.api&&f.api.hello===1;})};})()`);
    assert.ok(r.n >= 1, "enter was never called");
    assert.equal(r.same, true, "enter did not receive the returned object");
    assert.equal(r.api, true);
  });
});

// ---------- VO-8 LTT.compare / LTT.expect decision table (FR-12, C-20, C-21), unit (vm) ----------

const CMP_ROWS = [
  // [label, actual, expected, tol, ok]
  ["number = number", "1", "1", "", true],
  ["number != number", "1", "2", "", false],
  ["-0 vs 0", "-0", "0", "", true],
  ["default tol inside (diff 0.9e-9)", "1+0.9e-9", "1", "", true],
  ["default tol outside (diff 2e-9)", "1+2e-9", "1", "", false],
  ["default tol scales with |expected| (1e9 + 0.5)", "1e9+0.5", "1e9", "", true],
  ["default tol scales with |expected| (1e9 + 2)", "1e9+2", "1e9", "", false],
  ["given tol inside", "1.4", "1", ",0.5", true],
  ["given tol outside", "1.6", "1", ",0.5", false],
  ["given tol 0, equal", "3", "3", ",0", true],
  ["given tol 0, differ", "3.0000001", "3", ",0", false],
  ["string = string", '"abc"', '"abc"', "", true],
  ["string != string (C-21)", '"abc"', '"abd"', "", false],
  ["empty strings", '""', '""', "", true],
  ["bool true = true", "true", "true", "", true],
  ["bool true != false", "true", "false", "", false],
  ["bool false = false", "false", "false", "", true],
  ["null = null", "null", "null", "", true],
  ["null vs 0", "null", "0", "", false],
  ["array = array with default tol per element (C-20)", "[1,2.0000000001]", "[1,2]", "", true],
  ["empty arrays", "[]", "[]", "", true],
  ["array length differs (C-21)", "[1]", "[1,2]", "", false],
  ["array element differs", "[1,2]", "[1,3]", "", false],
  ["nested arrays with mixed element types", '[["a",1],[true,null]]', '[["a",1],[true,null]]', "", true],
  ["array element type differs", '["1"]', "[1]", "", false],
  ["array with given tol inside", "[1.4]", "[1]", ",0.5", true],
  ["array with given tol 0, element differs by 1e-10", "[2.0000000001]", "[2]", ",0", false],
  ["array vs object", "[]", "{}", "", false],
  ["array vs number", "[1]", "1", "", false],
  ["string vs number (C-21)", '"1"', "1", "", false],
  ["number vs string", "1", '"1"', "", false],
  ["bool vs number", "true", "1", "", false],
  ["NaN = NaN (C-21)", "NaN", "NaN", "", false],
  ["NaN vs number", "NaN", "0", "", false],
  ["Infinity = Infinity", "Infinity", "Infinity", "", false],
  ["-Infinity = -Infinity", "-Infinity", "-Infinity", "", false],
  ["number vs Infinity", "1", "Infinity", "", false],
  ["undefined = undefined", "undefined", "undefined", "", false],
  ["null vs undefined", "null", "undefined", "", false],
  ["object = object (C-21)", "{}", "{}", "", false],
  ["object with same fields", "{a:1}", "{a:1}", "", false],
];
for (const [label, a, e, tol, ok] of CMP_ROWS) {
  test(`VO-8 FR-12 LTT.compare ${label}: ok ${ok}`, () => {
    const k = loadKit();
    assert.equal(k.run(`LTT.compare(${a},${e}${tol}).ok`), ok);
  });
}
test("VO-8 FR-12 C-20/C-21: LTT.expect returns the same verdict as compare for the spec's example calls", () => {
  const k = loadKit();
  for (const [a, e, ok] of [['"abc"', '"abc"', true], ["true", "true", true], ["null", "null", true], ["[1,2.0000000001]", "[1,2]", true],
    ['"abc"', '"abd"', false], ['"1"', "1", false], ["[1]", "[1,2]", false], ["{}", "{}", false], ["NaN", "NaN", false]]) {
    assert.equal(k.run(`LTT.expect("x",${a},${e})`), ok, `${a} vs ${e}`);
  }
});

const CMP_PAGE_OK = `LTT.expect("s","abc","abc");LTT.expect("b",true,true);LTT.expect("n",null,null);LTT.expect("v",[1,2.0000000001],[1,2]);`;
const CMP_PAGE_BAD = `LTT.expect("s","abc","abd");LTT.expect("t","1",1);LTT.expect("a",[1],[1,2]);LTT.expect("o",{},{});LTT.expect("x",NaN,NaN);`;
const PANEL = `(function(){var p=document.getElementById("ltt-expect");var t=p?p.textContent:null;return t===null?null:{ok:(t.match(/✓/g)||[]).length,bad:(t.match(/✗/g)||[]).length};})()`;
test("VO-8 C-20 (page): four ok expectations give no expect-mismatch and ✓ rows in the panel, no ✗", T, async () => {
  const id = H.installPage(CMP_PAGE_OK);
  await H.withPage(id, "?check", "", async (page) => {
    assert.deepEqual(rulesOf(await H.readCheck(page), "expect-mismatch"), []);
    const p = await page.eval(PANEL);
    assert.ok(p, "no #ltt-expect panel");
    assert.ok(p.ok >= 4, `✓ rows ${p.ok}`);
    assert.equal(p.bad, 0);
  });
});
test("VO-8 C-21 (page): five mismatching expectations give five expect-mismatch errors (one per label) and ✗ rows", T, async () => {
  const id = H.installPage(CMP_PAGE_BAD);
  await H.withPage(id, "?check", "", async (page) => {
    const em = rulesOf(await H.readCheck(page), "expect-mismatch");
    assert.equal(em.length, 5, JSON.stringify(em));
    for (const l of ["s", "t", "a", "o", "x"]) assert.ok(em.some((e) => e.msg.startsWith(l)), `no mismatch for ${l}`);
    const p = await page.eval(PANEL);
    assert.ok(p && p.bad >= 5, JSON.stringify(p));
  });
});

// ---------- VO-10 ?shot clock repaint (FR-13, C-22, C-23) ----------

const mark = `function mark(id){return function(t){var e=document.getElementById(id);if(e)e.setAttribute("data-t",String(t));};}`;
const clockDeck = (ow) => [
  ST("앞"),
  `{title:"DEAD",narration:"n",mount:function(body){window.__dead=[];body.innerHTML='<div id="dz" style="padding:12px">DEAD</div>';LTT.clock(body.querySelector("#dz"),function(t){window.__dead.push(t);throw new Error("dead-boom");},{dur:1000,id:"z"});return {};}}`,
  `{title:"LIVE",narration:"n",mount:function(body){body.innerHTML='<div id="cv" data-t="" style="padding:12px">LIVE</div><input type="range" id="kk" min="0" max="10" value="5">';var draw=mark("cv");LTT.clock(body.querySelector("#cv"),draw,{dur:1000,id:"c"});LTT.sweep({params:{kk:{min:0,max:10,value:5}},render:function(){draw(${ow});}});return {};}}`,
  `{title:"LIVE2",narration:"n",mount:function(body){body.innerHTML='<div id="cv2" data-t="" style="padding:12px">LIVE2</div>';LTT.clock(body.querySelector("#cv2"),mark("cv2"),{dur:1000,id:"c2"});return {};}}`,
  KW,
];
const CK_HEAD = `<script>${mark}</script>`;
const dataT = (page, id) => page.eval(`(function(){var e=document.getElementById(${J(id)});return e?e.getAttribute("data-t"):"(missing)";})()`);

test("VO-10 C-22: ?shot&clock=c&t=300 with a later sweep render drawing 1000: c ends in the draw(300) state, the unselected clock c2 in draw(dur)", T, async () => {
  const id = H.installDeck(clockDeck(1000), { head: CK_HEAD });
  await H.withPage(id, "?shot&clock=c&t=300", "", async (page) => {
    assert.equal(await dataT(page, "cv"), "300");
    assert.equal(await dataT(page, "cv2"), "1000");
  });
});

test("VO-10 C-22: t beyond dur is cut to dur (clock=c&t=5000 with a sweep render drawing 0 -> 1000)", T, async () => {
  const id = H.installDeck(clockDeck(0), { head: CK_HEAD });
  await H.withPage(id, "?shot&clock=c&t=5000", "", async (page) => {
    assert.equal(await dataT(page, "cv"), "1000");
  });
});

test("VO-10 C-23: ?shot with no clock selected and a sweep render drawing 0: every live clock ends in the draw(dur) state", T, async () => {
  const id = H.installDeck(clockDeck(0), { head: CK_HEAD });
  await H.withPage(id, "?shot", "", async (page) => {
    assert.equal(await dataT(page, "cv"), "1000");
    assert.equal(await dataT(page, "cv2"), "1000");
  });
});

test("VO-10 FR-13: a clock whose draw throws stays dead (its draw is called exactly once) and does not stop the repaint of the other clocks", T, async () => {
  const id = H.installDeck(clockDeck(0), { head: CK_HEAD });
  await H.withPage(id, "?shot&clock=c&t=300", "", async (page) => {
    assert.deepEqual(await page.eval(`window.__dead.length`), 1, "the throwing clock was drawn again after it died (or never drawn)");
    assert.equal(await dataT(page, "cv"), "300");
    assert.equal(await dataT(page, "cv2"), "1000");
  });
});

test("VO-10 FR-13: an enter() that overwrites the drawing after the state is applied is overwritten again by the repaint (draw(dur); with clock=&t= draw(t))", T, async () => {
  const fig = `{type:"figure",title:"FC",caption:"c",figure:function(n){n.innerHTML='<div id="cv3" data-t="" style="padding:12px">FC</div>';LTT.clock(n.querySelector("#cv3"),mark("cv3"),{dur:1000,id:"c3"});return {};},`
    + `steps:[{caption:"S1",enter:function(){var e=document.getElementById("cv3");if(e)e.setAttribute("data-t","ENTER");}},{caption:"S2",enter:function(){var e=document.getElementById("cv3");if(e)e.setAttribute("data-t","ENTER");}}]}`;
  const id = H.installDeck([fig, ST("둘"), KW], { head: CK_HEAD });
  await H.withPage(id, "?shot&state=step-2", "#1", async (page) => assert.equal(await dataT(page, "cv3"), "1000"));
  await H.withPage(id, "?shot&state=step-2&clock=c3&t=300", "#1", async (page) => assert.equal(await dataT(page, "cv3"), "300"));
});

// ---------- VO-14 sentence location (FR-16(a), C-29) ----------

const SENT = "걸리지 않으면 다른 축의 말로 한 번 더 찾고, 그래도 없으면 직접 짠다";
test("VO-14 C-29: SKILL.md has the retry sentence on the line with the @ltt-part grep", () => {
  const skill = readFileSync(join(ROOT, "skills/learn-to-tell/SKILL.md"), "utf8").split(/\r?\n/);
  assert.ok(skill.some((l) => l.includes("@ltt-part") && l.includes(SENT)), "no line holds both @ltt-part and the sentence");
});
test("VO-14 C-29: kit/API.md does not contain the retry sentence", () => {
  assert.equal(readFileSync(join(ROOT, "skills/learn-to-tell/kit/API.md"), "utf8").includes(SENT), false);
});
