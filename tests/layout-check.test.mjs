import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { HELPERS, J, KW, ST, FIG, MOUNT, WIDE, createHarness } from "./fixtures/layout-check/harness.mjs";

// Spec e48ead05eb246d3c v1 VO-1, VO-2, VO-3, VO-11, VO-13 (layout measurements, card/SVG auto-fixes, vw-size, measurement fault tolerance).
// Expected values come from the spec's FR-1..FR-4, FR-14, Errors and Cases C-1..C-8, C-24, C-25, C-28; never from running the implementation.
// Kit elements are found by text and geometry, not by class names (the spec fixes none). Decks are lint-clean enough that the
// asserted sets are exact for the rules under test (scene-overflow, box-overflow, vw-size, check-failed); other rules are ignored by design.

const H = createHarness("lc");
const T = H.T;
before(H.setup);
after(H.teardown);

const rulesOf = (chk, rule) => chk.errors.filter((e) => e.rule === rule);
const whereOf = (chk, rule) => rulesOf(chk, rule).map((e) => e.where).sort();
const PX = /\d+(\.\d+)?\s*px/;

// ---------- VO-1 scene-overflow: 2-value boundary analysis (FR-1, C-1..C-3) ----------

// v5 FR-1 measures content (text lines, outermost svg/img/canvas/video/iframe, form controls), not empty boxes: the filler is an svg.
const FILL = (h, extra = "") => MOUNT("S3", `<svg id="fill" width="100" height="${h}" style="display:block;height:${h}px"></svg>${extra}`);
const D1 = (scene3) => [ST("하나"), ST("둘"), scene3, ST("넷"), KW];

test("VO-1 C-1 normal: a 2400px fixed div in scene 3 (1440x900) gives one scene-overflow at 장면 3 with direction and px; no other scene is flagged", T, async () => {
  const id = H.installDeck(D1(FILL(2400)));
  await H.withPage(id, "?check", "#3", async (page) => {
    const chk = await H.readCheck(page);
    const so = rulesOf(chk, "scene-overflow");
    assert.deepEqual(so.map((e) => e.where), ["장면 3"]);
    assert.match(so[0].msg, /세로/);
    assert.match(so[0].msg, PX);
  });
});

// v4 measures rendered element boxes against the section's inner box (border box minus border; padding counts as inside). The fit height is
// bisected in the page: the largest filler height whose lowest rendered descendant ends at or above the inner bottom, after the fit has
// reached its 78% floor with a tall filler. The padding-only case needs that content to end inside the bottom padding, so scrollHeight > clientHeight there.
let fitCal;
async function calibrate() {
  fitCal ??= (async () => {
    const id = H.installDeck(D1(FILL(2400)));
    return H.withPage(id, "?check", "#3", async (page) => {
      await page.eval(HELPERS);
      return page.eval(`(function(){
        var f=document.getElementById("fill"), s=window.__lc.sceneOf(f), cs=getComputedStyle(s);
        function low(){
          var sr=s.getBoundingClientRect(), inner=sr.bottom-parseFloat(cs.borderBottomWidth), mb=-Infinity;
          [].forEach.call(s.querySelectorAll("svg,img,canvas,video,iframe,input,button,select,textarea"),function(e){
            if (e.parentElement && e.parentElement.closest("svg") ) return;
            var r=e.getBoundingClientRect(); if(r.width>0&&r.height>0) mb=Math.max(mb,r.bottom);});
          var w=document.createTreeWalker(s,NodeFilter.SHOW_TEXT), n;
          while((n=w.nextNode())){ if(!n.nodeValue.trim()||(n.parentElement&&n.parentElement.closest("svg,script,style"))) continue;
            var rg=document.createRange(); rg.selectNodeContents(n); [].forEach.call(rg.getClientRects(),function(r){ if(r.width>0&&r.height>0) mb=Math.max(mb,r.bottom); }); }
          return mb-inner;
        }
        function over(h){ f.style.height=h+"px"; return low(); }
        var lo=0, hi=2400;
        if (over(hi) <= 0) return {error:"2400px does not overflow the scene section"};
        while (hi-lo>1){ var mid=(lo+hi)>>1; if (over(mid)<=0) lo=mid; else hi=mid; }
        over(lo);
        return {h:lo, padBottom:parseFloat(cs.paddingBottom), scrollExcess:s.scrollHeight-s.clientHeight};
      })()`);
    });
  })();
  const r = await fitCal;
  assert.equal(r.error, undefined, r.error);
  assert.ok(r.h > 100 && r.h < 2400, `calibrated fit height ${r.h}`);
  return r;
}

for (const [label, delta, count] of [["content 1px under the exact fit (0 overflow)", -1, 0], ["content 8px over the exact fit (>= 4px overflow after the 78% fit)", 8, 1]]) {
  test(`VO-1 C-2 boundary: ${label} -> ${count} scene-overflow`, T, async () => {
    const { h } = await calibrate();
    const id = H.installDeck(D1(FILL(h + delta)));
    await H.withPage(id, "?check", "#3", async (page) => {
      const chk = await H.readCheck(page);
      assert.deepEqual(whereOf(chk, "scene-overflow"), count ? ["장면 3"] : []);
    });
  });
}

test("VO-1 C-2 boundary padding-only: content ending exactly at the section's inner bottom (only the bottom padding makes scrollHeight exceed clientHeight) -> 0 scene-overflow", T, async (t) => {
  const cal = await calibrate();
  assert.ok(cal.padBottom > 0 && cal.scrollExcess > 0, `precondition: the section needs bottom padding that overflows (padding ${cal.padBottom}px, scroll excess ${cal.scrollExcess}px)`);
  const id = H.installDeck(D1(FILL(cal.h)));
  await H.withPage(id, "?check", "#3", async (page) => {
    await page.eval(HELPERS);
    t.diagnostic(`scrollHeight - clientHeight after the fit: ${await page.eval(`(function(){var s=window.__lc.sceneOf(document.getElementById("fill"));return s.scrollHeight-s.clientHeight;})()`)}`);
    assert.deepEqual(whereOf(await H.readCheck(page), "scene-overflow"), []);
  });
});

// F-1 (FR-1 v6): text lines are the main content kind. (a) only text lines overflow; (b) a line box clipped vertically to its block does not count.
const RANGE_BOUNDS = (id) => `(function(){
  var L=window.__lc, root=document.getElementById(${J(id)}), s=L.sceneOf(root), sr=s.getBoundingClientRect(), cs=getComputedStyle(s);
  var inner={top:sr.top+parseFloat(cs.borderTopWidth), bottom:sr.bottom-parseFloat(cs.borderBottomWidth)};
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT), n, top=Infinity, bottom=-Infinity;
  while((n=w.nextNode())){ if(!n.nodeValue.trim()) continue; var rg=document.createRange(); rg.selectNodeContents(n);
    [].forEach.call(rg.getClientRects(),function(r){ if(r.width>0&&r.height>0){ top=Math.min(top,r.top); bottom=Math.max(bottom,r.bottom); } }); }
  var b=root.getBoundingClientRect();
  return {innerTop:inner.top, innerBottom:inner.bottom, textTop:top, textBottom:bottom, blockTop:b.top, blockBottom:b.bottom};
})()`;

test("VO-1 F-1(a) positive: a scene whose overflowing content is only text lines (120 <p> lines, no svg/img/controls) ends >= 4px past the inner bottom after the fit -> one scene-overflow 세로", T, async () => {
  const lines = Array.from({ length: 120 }, (_, i) => `<p style="margin:0;font-size:16px">TEXTLINE ${i}</p>`).join("");
  const id = H.installDeck(D1(MOUNT("S3", `<div id="tx">${lines}</div>`)));
  await H.withPage(id, "?check", "#3", async (page) => {
    await page.eval(HELPERS);
    const b = await page.eval(RANGE_BOUNDS("tx"));
    assert.ok(b.textBottom >= b.innerBottom + 4, `precondition: text bottom ${b.textBottom} is not >= 4px past the inner bottom ${b.innerBottom}`);
    const so = rulesOf(await H.readCheck(page), "scene-overflow");
    assert.deepEqual(so.map((e) => e.where), ["장면 3"]);
    assert.match(so[0].msg, /세로/);
    assert.match(so[0].msg, PX);
  });
});

test("VO-1 F-1(b) clamp: a block of 200px text with line-height .5 whose block box ends inside the scene while its Range line box pokes >= 4px past the inner bottom -> 0 scene-overflow", T, async () => {
  const id = H.installDeck(D1(MOUNT("S3", `<svg id="fill" width="100" height="100" style="display:block;height:100px"></svg><div id="lh" style="margin:0;padding:0;height:100px;font-size:200px;line-height:.5;white-space:nowrap">LHTEXT</div>`)));
  await H.withPage(id, "?check", "#3", async (page) => {
    await page.eval(HELPERS);
    // The svg height is bisected in the loaded page with the real fixture until the block ends 2px inside the inner bottom, then the check is re-run on that state.
    const b = await page.eval(`(function(){
      var f=document.getElementById("fill"), blk=document.getElementById("lh"), s=window.__lc.sceneOf(f), cs=getComputedStyle(s);
      function inner(){ return s.getBoundingClientRect().bottom-parseFloat(cs.borderBottomWidth); }
      function fits(h){ f.style.height=h+"px"; return blk.getBoundingClientRect().bottom <= inner()-2; }
      var lo=0, hi=3000; if (!fits(lo)) return {error:"block does not fit even with a 0px filler"};
      while (hi-lo>1){ var mid=(lo+hi)>>1; if (fits(mid)) lo=mid; else hi=mid; }
      f.style.height=lo+"px"; return {h:lo};
    })()`);
    assert.equal(b.error, undefined, b.error);
    const g = await page.eval(RANGE_BOUNDS("lh"));
    assert.ok(g.blockBottom <= g.innerBottom, `precondition: block bottom ${g.blockBottom} is not inside the scene (${g.innerBottom})`);
    assert.ok(g.textBottom >= g.innerBottom + 4, `precondition: line box bottom ${g.textBottom} does not poke >= 4px past the inner bottom ${g.innerBottom}`);
    const chk = await page.eval(`JSON.parse(JSON.stringify(LTT.check()))`);
    assert.deepEqual(whereOf(chk, "scene-overflow"), []);
  });
});

test("VO-1 C-2 boundary empty width only: a box whose text ends inside the scene but whose min-width pushes its empty box >= 40px past the section's right edge -> 0 scene-overflow", T, async () => {
  const id = H.installDeck(D1(MOUNT("S3", `<div id="mw" style="min-width:3000px;height:30px;background:#eee">MWTEXT</div>`)));
  await H.withPage(id, "?check", "#3", async (page) => {
    await page.eval(HELPERS);
    const pre = await page.eval(`(function(){
      var L=window.__lc, b=document.getElementById("mw"), s=L.sceneOf(b), sr=s.getBoundingClientRect(), cs=getComputedStyle(s);
      return {boxRight:b.getBoundingClientRect().right, secInnerRight:sr.right-parseFloat(cs.borderRightWidth), textRight:L.textRight(b,"MWTEXT")};
    })()`);
    assert.ok(pre.boxRight >= pre.secInnerRight + 40, `precondition: box right ${pre.boxRight} is not >= 40px past the section ${pre.secInnerRight}`);
    assert.ok(pre.textRight <= pre.secInnerRight, `precondition: text right ${pre.textRight} is not inside the section ${pre.secInnerRight}`);
    assert.deepEqual(whereOf(await H.readCheck(page), "scene-overflow"), []);
  });
});

test("VO-1 FR-1 horizontal: a 4000px wide child in scene 3 gives one scene-overflow at 장면 3 naming the horizontal direction", T, async () => {
  const id = H.installDeck(D1(MOUNT("S3", `<svg width="4000" height="20" style="display:block"></svg>`)));
  await H.withPage(id, "?check", "#3", async (page) => {
    const so = rulesOf(await H.readCheck(page), "scene-overflow");
    assert.deepEqual(so.map((e) => e.where), ["장면 3"]);
    assert.match(so[0].msg, /가로/);
    assert.match(so[0].msg, PX);
  });
});

test("VO-1 C-3 edge: phone mode (390x844) with the C-1 deck gives no scene-overflow", T, async () => {
  const id = H.installDeck(D1(FILL(2400)));
  await H.withPage(id, "?check", "#3", async (page) => {
    assert.equal(await page.eval(`innerWidth`), 390);
    assert.equal(await page.eval(`document.querySelector("[data-ltt-mobile]") !== null`), true, "precondition: the kit is in phone mode at 390px");
    assert.deepEqual(whereOf(await H.readCheck(page), "scene-overflow"), []);
  }, [390, 844]);
});

// ---------- VO-2 box-overflow: 7 box kinds x {overflow, normal} (FR-2, C-4), equivalence partitioning ----------

// Precondition for every wide-child case: the 2000px child must really be rendered 2000px wide and extend beyond its cell's box on some side (a centering flex container overflows both sides),
// so the expectation does not depend on how the kit lays the cell out (flex items would otherwise shrink). The cell is the lowest
// ancestor holding the child and its pointing text, or for the hook (no text) the ancestor that is a child of the hook row.
async function assertWideRendered(page, tokens, n) {
  await page.eval(HELPERS);
  const rows = await page.eval(`(function(tokens){
    var L=window.__lc;
    return [].map.call(document.querySelectorAll("[data-wide]"),function(w,i){
      var t=L.els(tokens[i]||"")[0]; if(!t) return {error:"pointing text "+tokens[i]+" not drawn"};
      var a=L.lca(w,t), cell=a;
      if (tokens[i]==="HOOKTXT"){ cell=w; while(cell.parentElement && cell.parentElement!==a) cell=cell.parentElement; }
      var r=w.getBoundingClientRect(), c=cell.getBoundingClientRect();
      return {width:r.width, out:Math.max(c.left-r.left, r.right-c.right, c.top-r.top, r.bottom-c.bottom)};
    });
  })(${J(tokens)})`);
  assert.equal(rows.length, n, `wide children drawn: ${rows.length}`);
  for (const [i, r] of rows.entries()) {
    assert.equal(r.error, undefined, r.error);
    assert.ok(r.width >= 1999, `wide child ${i} was shrunk to ${r.width}px`);
    assert.ok(r.out > 1, `wide child ${i} does not extend beyond its cell on any side (max excess ${r.out}px)`);
  }
}

const SMALL = `<b data-small="1">ok</b>`;
const hookS = (art) => `{type:"hook",art:${J(art)},text:"HOOKTXT"}`;
const termsS = (visual) => `{type:"terms",title:"용어",terms:[{key:"TERMK",plain:"PLAIN-T",visual:${J(visual)}}]}`;
const explainS = (visual) => `{type:"explain",form:"cards",title:"EXPL",steps:[{icon:"check",title:"STEPT",text:"STEPX",visual:${J(visual)}}]}`;
const compareS = (visual) => `{type:"compare",title:"CMPT",narration:"n",items:[{label:"LAB1",visual:${J(visual)},tone:"good",verdict:"V1"},{label:"LAB2",visual:${J(SMALL)},tone:"bad",verdict:"V2"}]}`;
const contrastS = (visual) => `{type:"contrast",title:"CONT",narration:"n",before:{label:"BEFLAB",visual:${J(visual)}},after:{visual:${J(SMALL)}}}`;
const BOX_SCENES = (v) => [hookS(v), termsS(v), explainS(v), compareS(v), contrastS(v), ST("마무리"), KW];

test("VO-2 C-4 overflow x5 kinds: hook art, terms card, explain step, compare item, contrast side each give exactly one box-overflow at their scene", T, async () => {
  const id = H.installDeck(BOX_SCENES(WIDE));
  await H.withPage(id, "?check", "", async (page) => {
    await assertWideRendered(page, ["HOOKTXT", "TERMK", "STEPT", "LAB1", "BEFLAB"], 5);
    const chk = await H.readCheck(page);
    const bo = rulesOf(chk, "box-overflow");
    assert.deepEqual(bo.map((e) => e.where).sort(), ["장면 1", "장면 2", "장면 3", "장면 4", "장면 5"]);
    for (const e of bo) assert.match(e.msg, PX, e.msg);
    const at = (n) => bo.find((e) => e.where === `장면 ${n}`).msg;
    assert.ok(at(1).includes("hook 그림 칸"), at(1));
    assert.ok(at(2).includes("용어 카드") && at(2).includes("TERMK"), at(2));
    assert.ok(at(3).includes("STEPT"), at(3));
    assert.ok(at(4).includes("LAB1"), at(4));
  });
});

test("VO-2 C-4 normal: the same five kinds with a small child give no box-overflow, so a flagged card is the one that overflows", T, async () => {
  const id = H.installDeck(BOX_SCENES(SMALL));
  await H.withPage(id, "?check", "", async (page) => {
    assert.deepEqual(rulesOf(await H.readCheck(page), "box-overflow"), []);
  });
});

// Spec v3 FR-2 clipping: a descendant clipped by an overflow:hidden wrapper still counts; under an overflow:auto ancestor that fits in the
// cell, the scroll box is measured instead of the wide descendant.
const termsK = (k, visual) => `{type:"terms",title:"용어${k}",terms:[{key:"TERMK${k}",plain:"PLAIN-${k}",visual:${J(visual)}}]}`;
test("VO-2 v3 clipping: a 2000px descendant inside an overflow:hidden wrapper in a terms card -> one box-overflow; inside an overflow:auto box that fits the card -> none", T, async () => {
  const inner = `<div data-wide="1" style="flex:none;min-width:2000px;width:2000px;height:10px;background:#ccc"></div>`;
  const hidden = `<div style="flex:none;overflow:hidden;width:100px;height:20px">${inner}</div>`;
  const auto = `<div style="flex:none;overflow:auto;width:100px;height:40px">${inner}</div>`;
  const id = H.installDeck([termsK(1, hidden), termsK(2, auto), ST("마무리"), KW]);
  await H.withPage(id, "?check", "", async (page) => {
    await assertWideRendered(page, ["PLAIN-1", "PLAIN-2"], 2);
    const bo = rulesOf(await H.readCheck(page), "box-overflow");
    assert.deepEqual(bo.map((e) => e.where), ["장면 1"], JSON.stringify(bo));
  });
});

// Summary cards and recall items are kit-made, and the spec names no field that can hold a wide child. A MutationObserver
// installed before the deck builds appends a 2000px div next to the token text, but only inside the section that holds SUMTITLE.
const injector = (token) => `<script>(function(){var T=${J(token)};new MutationObserver(function(){
  var w0=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT),n0,sec=null;
  while((n0=w0.nextNode())){ if(n0.nodeValue.indexOf("SUMTITLE")>=0 && n0.parentElement){ sec=n0.parentElement.closest("section.dk-scene,.dk-scene,section"); if(sec) break; } }
  if(!sec) return;
  var w=document.createTreeWalker(sec,NodeFilter.SHOW_TEXT),n;
  while((n=w.nextNode())){ var p=n.parentElement; if(n.nodeValue.indexOf(T)>=0 && p && !p.hasAttribute("data-inj")){ p.setAttribute("data-inj","1"); var d=document.createElement("div"); d.style.cssText="flex:none;min-width:2000px;width:2000px;height:20px";d.setAttribute("data-wide-inj","1"); p.appendChild(d); } }
}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});})()</script>`;
const EXS = (k, recall, title = `EXT${k}`) => `{type:"explain",form:"strip",title:${J(title)},steps:[{icon:"check",title:"s",text:"t"}],takeaway:"TKW${k}X"${recall ? `,recall:"RQ${k}X?"` : ""}}`;
const SUM = `{type:"summary",title:"SUMTITLE"}`;
const OVS = `{type:"overview",title:"OVTITLE",figure:"<svg></svg>",caption:"c"}`;

for (const [label, recall, token, kind] of [["card form", false, "TKW2X", "카드 summary"], ["recall form", true, "RQ2X", "recall 항목"]]) {
  test(`VO-2 C-4 ${kind}: only the ${label} item with a 2000px child is flagged (one box-overflow at the summary), its siblings are not`, T, async () => {
    const id = H.installDeck([FIG, EXS(1, recall), EXS(2, recall), EXS(3, recall), SUM, OVS, KW], { head: injector(token) });
    await H.withPage(id, "?shot", "", async (page) => {
      assert.equal(await page.eval(`document.querySelectorAll("[data-inj]").length`) >= 1, true, "precondition: the wide child was injected");
      await page.eval(HELPERS);
      const pre = await page.eval(`(function(){
        var L=window.__lc, d=document.querySelector("[data-wide-inj]"); if(!d) return {error:"no injected child"};
        var sib=L.els(${J(token === "TKW2X" ? "TKW1X" : "RQ1X")}).filter(function(e){return L.sceneOf(e)===L.sceneOf(d);})[0];
        if(!sib) return {error:"sibling item not drawn in the summary"};
        var cell=L.lca(d,sib), r=d.getBoundingClientRect(), c=cell.getBoundingClientRect();
        return {width:r.width, out:Math.max(c.left-r.left, r.right-c.right, c.top-r.top, r.bottom-c.bottom)};
      })()`);
      assert.equal(pre.error, undefined, pre.error);
      assert.ok(pre.width >= 1999 && pre.out > 1, `injected child not really overflowing: ${JSON.stringify(pre)}`);
      // The observer runs after the synchronous load-time check, so the check is re-run now that the child exists (LTT.check returns the #ltt-check object).
      const chk = await page.eval(`JSON.parse(JSON.stringify(LTT.check()))`);
      const bo = rulesOf(chk, "box-overflow");
      assert.deepEqual(bo.map((e) => e.where), ["장면 5"]);
      assert.match(bo[0].msg, PX);
    });
  });
}

test("VO-2 normal (all kinds in one deck): hook, terms, explain, compare, contrast and a recall summary, none overflowing -> 0 box-overflow", T, async () => {
  const id = H.installDeck([hookS(SMALL), termsS(SMALL), explainS(SMALL), compareS(SMALL), contrastS(SMALL), EXS(1, true), EXS(2, true), SUM, OVS, KW]);
  await H.withPage(id, "?shot", "", async (page) => {
    assert.deepEqual(rulesOf(await H.readCheck(page), "box-overflow"), []);
  });
});

// FR-3 / C-5: 60-char unbroken titles wrap inside their box. The box is the lowest ancestor holding both the title and a sibling text.
const A60 = "A".repeat(60), B60 = "B".repeat(60), C60 = "C".repeat(60), D60 = "D".repeat(60);
test("VO-2 FR-3 C-5: terms word, explain step title, compare label and summary card title of 60 unbroken chars wrap inside their box (right edge <= box right + 1), with no box-overflow", T, async () => {
  const scenes = [
    `{type:"terms",title:"용어",terms:[{key:${J(A60)},plain:"PLN-A",visual:false}]}`,
    `{type:"explain",form:"cards",title:"EXPL",steps:[{icon:"check",title:${J(B60)},text:"STX-B"}]}`,
    `{type:"compare",title:"CMPT",narration:"n",items:[{label:${J(C60)},visual:"<b>x</b>",tone:"good",verdict:"VRD-C"},{label:"LAB2",visual:"<b>y</b>",tone:"bad",verdict:"V2"}]}`,
    EXS(4, false, D60),
    SUM, OVS, KW,
  ];
  const id = H.installDeck(scenes);
  await H.withPage(id, "?shot", "", async (page) => {
    await page.eval(HELPERS);
    const rows = await page.eval(`(function(){
      var L=window.__lc, sum=L.sceneOf(L.pick("SUMTITLE"));
      function probe(name, titleTok, otherTok, within){
        var ts=L.els(titleTok).filter(function(e){return !within||within.contains(e);}), os=L.els(otherTok).filter(function(e){return !within||within.contains(e);});
        if (!ts.length||!os.length) return {name:name, error:"not drawn: "+(ts.length?otherTok:titleTok)};
        var box=L.lca(ts[0], os[0]), br=box.getBoundingClientRect(), right=L.textRight(box, titleTok);
        return {name:name, right:right, boxRight:br.right, boxWidth:br.width};
      }
      return [probe("terms word", ${J(A60)}, "PLN-A"), probe("explain step title", ${J(B60)}, "STX-B"),
        probe("compare label", ${J(C60)}, "VRD-C"), probe("summary card title", ${J(D60)}, "TKW4X", sum)];
    })()`);
    for (const r of rows) {
      assert.equal(r.error, undefined, `${r.name}: ${r.error}`);
      assert.ok(r.right <= r.boxRight + 1, `${r.name}: title text right edge ${r.right} > box right ${r.boxRight} + 1`);
    }
    const bo = rulesOf(await H.readCheck(page), "box-overflow");
    assert.deepEqual(bo.map((e) => e.where), [], JSON.stringify(bo));
  });
});

// ---------- VO-3 small SVG text: 3-value boundary 9/10/11 px (FR-4, C-6..C-8) ----------

const MEASURE = (ids) => `(function(ids){ return ids.map(function(id){
  var t=document.getElementById(id); if(!t) return {id:id, missing:true};
  var svg=t.closest("svg[viewBox]")||t.closest("svg"), vb=svg&&svg.viewBox&&svg.viewBox.baseVal, vbw=vb&&vb.width?vb.width:null;
  var w=svg.getBoundingClientRect().width, fs=parseFloat(getComputedStyle(t).fontSize);
  return {id:id, fs:fs, svgW:w, vbw:vbw, rendered: fs*(vbw? w/vbw : 1), inline:t.getAttribute("style")||"", attr:t.getAttribute("font-size")};
});})(${J(ids)})`;
const SVG_FIG = `<svg id="svgA" viewBox="0 0 1000 200" style="width:300px;display:block"><text id="t-c6" x="10" y="50" font-size="16">SMALL16</text></svg>`
  + `<svg id="svgB" viewBox="0 0 400 100" style="width:400px;display:block"><text id="t9" x="5" y="20" font-size="9">N9</text><text id="t10" x="5" y="40" font-size="10">N10</text><text id="t11" x="5" y="60" font-size="11">N11</text><text id="tempty" x="5" y="80" font-size="4"></text></svg>`
  + `<svg id="svgI" class="ltt-ic" viewBox="0 0 400 100" style="width:400px;display:block"><text id="tic" x="5" y="20" font-size="4">IC</text></svg>`;
const figS = (svg) => `{type:"figure",title:"그림",caption:"c",figure:${J(svg)}}`;

test("VO-3 C-6..C-8 (?check): 16-unit text at scale 0.3 and the 9px text grow to >= 9.9 rendered px; the 10px and 11px texts keep their size; icon text and empty text are untouched", T, async () => {
  const id = H.installDeck([figS(SVG_FIG), ST(), KW]);
  await H.withPage(id, "?check", "", async (page) => {
    const m = Object.fromEntries((await page.eval(MEASURE(["t-c6", "t9", "t10", "t11", "tempty", "tic"]))).map((x) => [x.id, x]));
    for (const x of Object.values(m)) assert.equal(x.missing, undefined, `${x.id} not drawn`);
    assert.equal(Math.round(m.t10.svgW), 400, "precondition: the 400px svg is drawn at scale 1");
    assert.ok(m["t-c6"].rendered >= 9.9 && m["t-c6"].rendered <= 10.5, `C-6 rendered ${m["t-c6"].rendered}`);
    assert.ok(m.t9.rendered >= 9.9 && m.t9.rendered <= 10.5, `9px text rendered ${m.t9.rendered}`);
    assert.equal(m.t10.fs, 10, "10px text must keep font-size");
    assert.equal(m.t10.inline, "", "10px text got an inline style");
    assert.equal(m.t11.fs, 11);
    assert.equal(m.t11.inline, "");
    assert.equal(m.tic.fs, 4, "icon text changed");
    assert.equal(m.tic.inline, "");
    assert.equal(m.tempty.fs, 4, "empty text changed");
    assert.equal(m.tempty.inline, "");
    const chk = await H.readCheck(page);
    assert.deepEqual(chk.errors.filter((e) => ["box-overflow", "scene-overflow"].includes(e.rule)), [], "the fix must not be reported or cause overflow errors");
  });
});

test("VO-3 FR-4 signal time: tiny SVG text drawn by a steps enter() and applied by ?shot&state=step-2 is >= 9.9 rendered px when data-ltt-shot is set", T, async () => {
  const fig = `{type:"figure",title:"단계",caption:"c",figure:function(n){n.innerHTML='<svg id="s2" viewBox="0 0 400 100" style="width:400px;display:block"></svg>';return {};},`
    + `steps:[{caption:"CAP-1",enter:function(){var s=document.getElementById("s2");s.innerHTML='<text id="late" x="5" y="50" font-size="6">LATE</text>';}},{caption:"CAP-2",enter:function(){var s=document.getElementById("s2");s.innerHTML='<text id="late" x="5" y="50" font-size="6">LATE</text>';}}]}`;
  const id = H.installDeck([fig, ST(), KW]);
  await H.withPage(id, "?shot&state=step-2", "#1", async (page) => {
    const [m] = await page.eval(MEASURE(["late"]));
    assert.equal(m.missing, undefined, "the step text was not drawn");
    assert.ok(m.rendered >= 9.9 && m.rendered <= 10.5, `rendered ${m.rendered}`);
  });
});

test("VO-3 FR-4 non-deck page: before check, a 16-unit text at scale 0.3 is >= 9.9 rendered px; 10px, icon and empty text are untouched", T, async () => {
  const body = SVG_FIG;
  const id = H.installPage("", { body });
  await H.withPage(id, "?check", "", async (page) => {
    const m = Object.fromEntries((await page.eval(MEASURE(["t-c6", "t9", "t10", "tempty", "tic"]))).map((x) => [x.id, x]));
    assert.ok(m["t-c6"].rendered >= 9.9 && m["t-c6"].rendered <= 10.5, `rendered ${m["t-c6"].rendered}`);
    assert.ok(m.t9.rendered >= 9.9 && m.t9.rendered <= 10.5, `rendered ${m.t9.rendered}`);
    assert.equal(m.t10.fs, 10);
    assert.equal(m.t10.inline, "");
    assert.equal(m.tic.inline, "");
    assert.equal(m.tempty.inline, "");
  });
});

// ---------- VO-11 vw-size (FR-14, C-24, C-25) ----------

const VW_CSS = `<style>
.a{width:41vw}
@media(min-width:1px){.b{max-width:min(440px,34vw)!important}}
.c{font-size:7vw}
.d{height:51vh}
.e{flex-basis:31dvw}
.f{inline-size:22vw}
@supports(display:grid){.g{width:13lvw}}
.h{width:52vh}
.k{width:11vw;max-width:23vw}
</style>`;
const VW_EL = `<div id="vwel" class="vwc" style="flex-basis:32vw">VWEL</div><div id="vwok" style="font-size:9vw;height:53vh">VWOK</div>`;
const VW_FIND = [["41vw", 1], ["34vw", 1], ["31dvw", 1], ["22vw", 1], ["13lvw", 1], ["11vw", -1], ["23vw", -1], ["32vw", 1], ["7vw", 0], ["51vh", 0], ["52vh", 0], ["9vw", 0], ["53vh", 0]];
function assertVw(chk) {
  const vw = rulesOf(chk, "vw-size");
  assert.ok(vw.every((e) => e.where === "페이지"), JSON.stringify(vw));
  assert.equal(vw.length, 8, JSON.stringify(vw.map((e) => e.msg)));
  for (const [needle, n] of VW_FIND) {
    const hits = vw.filter((e) => e.msg.includes(needle));
    if (n < 0) assert.ok(hits.length >= 1, `declaration ${needle} missing`);
    else assert.equal(hits.length, n, `declaration ${needle}: ${hits.length} message(s) in ${JSON.stringify(vw.map((e) => e.msg))}`);
  }
  assert.ok(vw.find((e) => e.msg.includes("41vw")).msg.includes(".a"));
  assert.ok(vw.find((e) => e.msg.includes("34vw")).msg.includes(".b"));
  assert.ok(vw.find((e) => e.msg.includes("32vw")).msg.includes("vwel"), "attribute finding names the element id");
}

test("VO-11 C-24 non-deck page: width/max-width/flex-basis/inline-size with vw/dvw/lvw in <style>, @media, @supports and a style attribute -> 8 findings; font-size and vh -> none", T, async () => {
  const id = H.installPage("", { head: VW_CSS, body: VW_EL });
  await H.withPage(id, "?check", "", async (page) => assertVw(await H.readCheck(page)));
});

test("VO-11 C-24 deck: the same styles in a deck page (style element and a style attribute inside a mounted scene) give the same 8 findings", T, async () => {
  const id = H.installDeck([MOUNT("VW", VW_EL), ST(), KW], { head: VW_CSS });
  await H.withPage(id, "?shot", "", async (page) => assertVw(await H.readCheck(page)));
});

test("VO-11 C-25 edge: a deck and a page that use only the kit have no vw-size", T, async () => {
  const deck = H.installDeck([ST("하나"), ST("둘"), KW]);
  await H.withPage(deck, "?check", "", async (page) => assert.deepEqual(rulesOf(await H.readCheck(page), "vw-size"), []));
  const pg = H.installPage("");
  await H.withPage(pg, "?check", "", async (page) => assert.deepEqual(rulesOf(await H.readCheck(page), "vw-size"), []));
});

// ---------- VO-13 measurement exception (Errors, C-28, QR-5), error guessing ----------

test("VO-13 C-28: a measured box element whose getBoundingClientRect throws gives exactly one check-failed naming the exception, and the unknown-term of another scene is kept; no scene-error", T, async () => {
  const head = `<script>(function(){var o=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){if(this.hasAttribute&&this.hasAttribute("data-boom"))throw new Error("rect-boom");return o.call(this);};})();</script>`;
  const scenes = [
    `{type:"terms",title:"용어",terms:[{key:"TERMK",plain:"PLAIN-T",visual:${J(`<div><i data-boom="1">x</i></div>`)}}]}`,
    ST("가운데"),
    ST("{{없는말}}을 쓴다"),
    KW,
  ];
  const id = H.installDeck(scenes, { head });
  await H.withPage(id, "?check", "", async (page) => {
    const chk = await H.readCheck(page);
    assert.equal(await page.eval(`!!document.querySelector("[data-boom]")`), true, "precondition: the throwing element is drawn");
    const cf = rulesOf(chk, "check-failed");
    assert.equal(cf.length, 1, JSON.stringify(chk.errors));
    assert.ok(cf[0].msg.includes("rect-boom"), cf[0].msg);
    assert.deepEqual(rulesOf(chk, "unknown-term").map((e) => e.where), ["장면 3"], JSON.stringify(chk.errors));
    assert.deepEqual(rulesOf(chk, "scene-error"), []);
    assert.equal(await page.eval(`document.documentElement.getAttribute("data-ltt-check")`), String(chk.errors.length));
  });
});
