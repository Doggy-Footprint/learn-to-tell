import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { J, ROOT, AUDIT, createHarness } from "./fixtures/layout-check/harness.mjs";

// Spec e48ead05eb246d3c v1 VO-12 (FR-15, C-26, C-27, QR-6): the rule id registry equals the rules.md tables, and a rule outside it
// is reported at run time. Expected sets come from the spec's Signatures and FR-15, not from running the implementation.

const H = createHarness("rr");
const T = H.T;
before(H.setup);
after(H.teardown);

function loadKit() {
  const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
  vm.createContext(context);
  vm.runInContext(readFileSync(join(ROOT, "skills/learn-to-tell/kit/ltt.js"), "utf8"), context);
  return context.LTT;
}
const LTT = loadKit();
const kitIds = () => Array.from(LTT.ruleIds ?? []);
const auditIds = () => Array.from(AUDIT.AUDIT_RULE_IDS ?? []);

// First-cell code spans of every table row in rules.md.
function tableIds(text) {
  const ids = [];
  for (const l of text.split(/\r?\n/)) {
    if (!l.startsWith("|") || /^\|[\s:|-]*$/.test(l)) continue;
    const first = l.split("|")[1] ?? "";
    for (const m of first.matchAll(/`([^`]+)`/g)) ids.push(m[1]);
  }
  return ids;
}
const RULES_MD = readFileSync(join(ROOT, "skills/learn-to-tell/kit/api/rules.md"), "utf8");
const NEW_RULES = ["scene-overflow", "box-overflow", "vw-size", "unknown-icon"];

test("VO-12 Signatures: LTT.ruleIds is an array of unique non-empty strings; AUDIT_RULE_IDS is exactly the five audit-only ids", () => {
  const k = kitIds();
  assert.ok(k.length > 0, "LTT.ruleIds is missing or empty");
  assert.ok(k.every((x) => typeof x === "string" && x.length > 0));
  assert.equal(new Set(k).size, k.length, "duplicate ids in LTT.ruleIds");
  const a = auditIds();
  assert.ok(a.every((x) => typeof x === "string"));
  assert.deepEqual([...a].sort(), ["control-shift", "probe-failed", "shot-bad-time", "shot-format", "shot-unknown-clock"]);
});

test("VO-12 C-26 (QR-6): LTT.ruleIds union AUDIT_RULE_IDS equals the first-cell code spans of the rules.md tables (difference 0 in both directions)", () => {
  const registry = new Set([...kitIds(), ...auditIds()]);
  const listed = new Set(tableIds(RULES_MD));
  const missingInDoc = [...registry].filter((x) => !listed.has(x));
  const missingInKit = [...listed].filter((x) => !registry.has(x));
  assert.deepEqual({ missingInDoc, missingInKit }, { missingInDoc: [], missingInKit: [] });
});

test("VO-12 FR-15: the registry holds the four new rules and the rules the existing contracts already name", () => {
  const registry = new Set([...kitIds(), ...auditIds()]);
  const required = [...NEW_RULES, "unknown-term", "used-before-defined", "predict-new-term", "filler-content", "goal-unreachable", "goal-at-start",
    "expect-mismatch", "check-failed", "script-error", "scene-error", "clock-duplicate-id", "no-reading-guide", "no-title", "overview-missing",
    "overview-order", "overview-no-visual", "keywords-last", "unused-term", "term-no-visual", "summary-no-recall", "card-monotony", "no-signature",
    "no-theme", "unknown-theme", "predict-choices", "figure-no-type", "keywords-no-next"];
  assert.deepEqual(required.filter((x) => !registry.has(x)), []);
});

test("VO-12 FR-15: the five audit-only ids are not claimed by the kit registry, and the four new rules are kit ids (not audit-only)", () => {
  const k = new Set(kitIds());
  assert.deepEqual(auditIds().filter((x) => k.has(x)), []);
  assert.deepEqual(NEW_RULES.filter((x) => !k.has(x)), []);
});

// ---------- C-27: a rule outside the registry is reported (Chrome) ----------

const SRC = (rule) => `LTT.checkSource({issues:function(){return [{where:"w",rule:${J(rule)},msg:"m"}];}});`;

test("VO-12 C-27: a page whose checkSource emits the unregistered rule zz-test keeps that error and gets one check-failed '등록되지 않은 rule zz-test'", T, async () => {
  const id = H.installPage(SRC("zz-test"));
  await H.withPage(id, "?check", "", async (page) => {
    const chk = await H.readCheck(page);
    assert.ok(chk.errors.some((e) => e.where === "w" && e.rule === "zz-test" && e.msg === "m"), `original item dropped: ${JSON.stringify(chk.errors)}`);
    const cf = chk.errors.filter((e) => e.rule === "check-failed");
    assert.deepEqual(cf.map((e) => [e.where, e.msg]), [["페이지", "등록되지 않은 rule zz-test"]]);
    assert.equal(chk.errors.length, 2, JSON.stringify(chk.errors));
    assert.equal(await page.eval(`document.documentElement.getAttribute("data-ltt-check")`), "2");
  });
});

test("VO-12 C-27 partition registered rule: a checkSource issue with a registered id (unknown-term) gets no check-failed", T, async () => {
  const id = H.installPage(SRC("unknown-term"));
  await H.withPage(id, "?check", "", async (page) => {
    const chk = await H.readCheck(page);
    assert.deepEqual(chk.errors.map((e) => e.rule), ["unknown-term"]);
  });
});

test("VO-12 C-27 audit: the audit result of the zz-test page carries the item and the check-failed line", T, async () => {
  const id = H.installPage(SRC("zz-test"));
  const [r] = await H.runAudit({ targets: [id] });
  assert.equal(r.error, undefined, r.error);
  assert.ok(r.check.some((e) => e.rule === "zz-test"), JSON.stringify(r.check));
  assert.ok(r.check.some((e) => e.rule === "check-failed" && e.msg === "등록되지 않은 rule zz-test"), JSON.stringify(r.check));
  assert.equal(AUDIT.exitCode([r]), 1);
});

// A-7: the guard also covers advice.
test("VO-12 A-7: a checkSource advice() item with an unregistered rule is kept in advice and one check-failed is added to errors", T, async () => {
  const id = H.installPage(`LTT.checkSource({issues:function(){return [];},advice:function(){return [{where:"w",rule:"zz-adv",msg:"a"}];}});`);
  await H.withPage(id, "?check", "", async (page) => {
    const chk = await H.readCheck(page);
    assert.ok((chk.advice || []).some((a) => a.rule === "zz-adv" && a.msg === "a"), JSON.stringify(chk.advice));
    assert.deepEqual(chk.errors.filter((e) => e.rule === "check-failed").map((e) => [e.where, e.msg]), [["페이지", "등록되지 않은 rule zz-adv"]]);
  });
});

// F-3: bypass the in-page guard. The page rewrites #ltt-check once after the kit wrote it: an unregistered zz-audit error, no check-failed.
const REWRITE = `(function(){var done=false;function rw(){if(done)return;var el=document.getElementById("ltt-check");if(!el)return;var j;try{j=JSON.parse(el.textContent);}catch(e){return;}
  if(!j||!Array.isArray(j.errors))return;done=true;j.errors=j.errors.filter(function(e){return e.rule!=="check-failed";}).concat([{where:"페이지",rule:"zz-audit",msg:"x"}]);
  j.ruleIds=Array.from(LTT.ruleIds);el.textContent=JSON.stringify(j);document.documentElement.setAttribute("data-ltt-check",String(j.errors.length));}
  new MutationObserver(rw).observe(document.documentElement,{childList:true,subtree:true,attributes:true,characterData:true});rw();})();`;
test("VO-12 F-3 audit clause: a page whose published #ltt-check holds zz-audit and no check-failed makes the audit report zz-audit plus check-failed '등록되지 않은 rule zz-audit'", T, async () => {
  const id = H.installPage(REWRITE);
  await H.withPage(id, "?check", "", async (page) => {
    const chk = await H.readCheck(page);
    assert.ok(chk.errors.some((e) => e.rule === "zz-audit"), `precondition: rewrite did not take effect: ${JSON.stringify(chk.errors)}`);
    assert.deepEqual(chk.errors.filter((e) => e.rule === "check-failed"), [], "precondition: the in-page JSON must carry no check-failed");
    assert.equal(chk.ruleIds.includes("zz-audit"), false);
  });
  const [r] = await H.runAudit({ targets: [id] });
  assert.equal(r.error, undefined, r.error);
  assert.ok(r.check.some((e) => e.rule === "zz-audit"), JSON.stringify(r.check));
  assert.ok(r.check.some((e) => e.rule === "check-failed" && e.msg === "등록되지 않은 rule zz-audit"), JSON.stringify(r.check));
});
