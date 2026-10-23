import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { audit, exitCode, findChrome, formatReport } from "../skills/learn-to-tell/server/audit.mjs";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";

// Spec 80a1b2f18f50b1df v2 (VO-4..VO-10, VO-14). Expected values come from the spec and the base_commit message templates,
// never from running the implementation. Each test loads a fixture from tests/fixtures/check/ into a temporary LTT home.

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FIX = join(ROOT, "tests/fixtures/check");
const BASE_COMMIT = "2b3df17a7d740dcfe0b6bf30eacb4c82d5bfdb3a";
const chrome = findChrome();
const skip = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
  : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;
const T = { skip, timeout: 240_000 };

let home, server, port, baseHome, baseServer, basePort, baseSkill;
let seq = 0;

before(async () => {
  if (skip) return;
  home = mkdtempSync(join(tmpdir(), "ltt-check-"));
  server = createLttServer({ home });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
after(async () => {
  for (const s of [server, baseServer]) if (s) await new Promise((r) => s.close(r));
  for (const d of [home, baseHome, baseSkill]) if (d) rmSync(d, { recursive: true, force: true });
});

function install(fixture, homeDir = home) {
  const id = `20261021-ck${++seq}`;
  const dir = join(homeDir, "lessons", id);
  mkdirSync(dir, { recursive: true });
  copyFileSync(join(FIX, fixture), join(dir, "lesson.html"));
  return id;
}

function dumpDom(url) {
  const userDir = mkdtempSync(join(tmpdir(), "ltt-check-chrome-"));
  const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    `--user-data-dir=${userDir}`, "--window-size=1440,900", "--virtual-time-budget=12000", "--dump-dom", url];
  if (process.getuid?.() === 0) args.unshift("--no-sandbox");
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 60_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.resume();
    child.on("error", reject);
    child.on("close", () => {
      clearTimeout(timer);
      rmSync(userDir, { recursive: true, force: true });
      resolve(out);
    });
  });
}

const scriptJson = (dom, id) => {
  const m = new RegExp(`<script[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</script>`).exec(dom);
  return m ? m[1] : null;
};
const events = (homeDir, id) => {
  const file = join(homeDir, "lessons", id, "events.jsonl");
  return existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
};

async function runPage(fixture, { query = "", homeDir = home, srvPort = port } = {}) {
  const id = install(fixture, homeDir);
  const dom = await dumpDom(`http://127.0.0.1:${srvPort}/lessons/${id}/lesson.html${query}`);
  const rawCheck = scriptJson(dom, "ltt-check");
  const rawProbe = scriptJson(dom, "probe");
  return {
    id,
    dom,
    rawCheck,
    check: rawCheck === null ? null : JSON.parse(rawCheck),
    probe: rawProbe === null ? null : JSON.parse(rawProbe),
    attr: /<html[^>]*\bdata-ltt-check="(\d*)"/.exec(dom)?.[1] ?? null,
    events: events(homeDir, id),
  };
}

// Each record() is its own POST, so events.jsonl holds concurrent events in arrival order; the spec fixes no cross-event order.
const byKey = (a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0);

const E = (where, rule, msg) => ({ where, rule, msg });
const unknown = (where, key) => E(where, "unknown-term", `풀이가 없는 용어 {{${key}}}`);
const early = (where, key) => E(where, "used-before-defined", `'${key}'가 풀이(첫 {{${key}}})보다 먼저 쓰였다`);
const filler = (where, match) => E(where, "filler-content", `채움 글 '${match}' (실제 사례·값으로 바꿀 것)`);
const unreachable = (where, n) => E(where, "goal-unreachable", `목표를 맞추는 손잡이 위치가 없다 (표본 ${n}개 중 0개). 기준이나 손잡이 범위를 고칠 것`);
const atStart = (where) => E(where, "goal-at-start", "시작 위치에서 이미 목표가 맞는다. 시작값을 목표 밖으로 옮길 것");
const mismatch = (label, a, b) => E("페이지", "expect-mismatch", `${label} (모델 ${a}, 기대 ${b})`);

// ---------- VO-5 SC-clean ----------

test("VO-5 SC-clean (C-1, C-5): no errors, attribute 0, terms linked, no lint event", T, async () => {
  const r = await runPage("page-clean.html");
  assert.ok(r.check, "no #ltt-check in the DOM");
  assert.equal(r.check.source, "page");
  assert.ok(Array.isArray(r.check.viewport) && r.check.viewport.length === 2 && r.check.viewport.every((n) => Number.isFinite(n) && n > 0), JSON.stringify(r.check.viewport));
  assert.deepEqual(r.check.viewport, r.probe.vp, "viewport differs from the page's [innerWidth, innerHeight]");
  assert.deepEqual(r.check.errors, []);
  assert.equal(r.attr, "0");
  assert.equal(r.probe.errs, 0);
  assert.equal(r.probe.rawMarks, false, "{{ }} marks were left in the page text");
  assert.deepEqual(r.probe.termKeys, ["적중"]);
  assert.deepEqual(r.events.filter((e) => e.type === "lint"), []);
});

// ---------- VO-5 SC-defects ----------

test("VO-5 SC-defects (C-2, C-3, C-4, C-9): exact ordered errors, data-ltt-check, panel lines, lint event without expect-mismatch", T, async () => {
  const r = await runPage("page-defects.html");
  const staticErrors = [
    early("구역 '개요'", "적중률"),
    filler("구역 '개요'", "샘플 텍스트"),
    unknown("구역 '둘째'", "없는말"),
    unknown("구역 '셋째'", "또없는말"),
    filler("구역 '셋째'", "TODO"),
  ];
  const goalErrors = [atStart("구역 '둘째'"), unreachable("구역 '셋째'", 3)];
  const expectErrors = [mismatch("x", 2, 3), mismatch("z", 5, 6)];
  assert.deepEqual(r.check.errors, [...staticErrors, ...goalErrors, ...expectErrors]);
  assert.equal(r.attr, String(staticErrors.length + goalErrors.length + expectErrors.length));
  assert.equal(r.probe.errs, 0);
  // Panel warning lines: each message is shown in the page outside the serialized #ltt-check JSON.
  const visible = r.dom.replace(/<script[^>]*\bid="(ltt-check|probe|ltt-meta)"[^>]*>[\s\S]*?<\/script>/g, "");
  for (const e of r.check.errors) assert.ok(visible.includes(e.msg), `no panel line for ${e.rule}: ${e.msg}`);
  const lint = r.events.filter((e) => e.type === "lint");
  assert.equal(lint.length, 1, "exactly one lint event per automatic run");
  assert.deepEqual(lint[0].data, [...staticErrors, ...goalErrors], "lint event carries the errors without expect-mismatch");
});

// ---------- VO-5 C-6 ----------

test("VO-5 C-6 (C-3, C-4): a page without headings is one unit named 구역 (처음); filler reports only the first match", T, async () => {
  const r = await runPage("page-noheadings.html");
  assert.deepEqual(r.check.errors, [unknown("구역 (처음)", "없는말"), filler("구역 (처음)", "샘플 텍스트")]);
});

// ---------- VO-5 SC-script-textarea (C-14) / VO-8 ----------

test("VO-5 SC-script-textarea / VO-8 C-14: script, textarea, template, noscript and style are neither checked nor linked", T, async () => {
  const r = await runPage("page-script-textarea.html");
  assert.deepEqual(r.check.errors, []);
  assert.equal(r.probe.script, 'window.__s1 = "{{a}}";');
  assert.equal(r.probe.s1var, "{{a}}");
  assert.equal(r.probe.textarea, "{{b}}");
  assert.equal(r.probe.template, "<p>{{c}}</p>");
  assert.equal(r.probe.style, "/* {{e}} */");
  assert.equal(r.probe.terms, 0);
  assert.ok(r.dom.includes("{{d}}"), "noscript text changed");
});

// ---------- VO-5 SC-prelinked (C-15) ----------

test("VO-5 SC-prelinked (C-15): an already linked .ltt-term[data-term] counts as the display; bare later is quiet", T, async () => {
  const r = await runPage("page-prelinked.html");
  assert.deepEqual(r.check.errors, []);
});

test("VO-5 SC-prelinked (C-15 BVA): bare k in an earlier section than the pre-linked display is used-before-defined", T, async () => {
  const r = await runPage("page-prelinked-after.html");
  assert.deepEqual(r.check.errors, [early("구역 '앞'", "k")]);
});

// ---------- VO-4 glossary merge ----------

const POP = (r) => r.probe.pop;

test("VO-4 glossary from #ltt-meta only: popover shows the meta text, no unknown-term", T, async () => {
  const r = await runPage("glossary-meta.html");
  assert.deepEqual(r.check.errors, []);
  assert.ok(POP(r).via, "no popover opened by mouseover, focusin or click");
  assert.ok(POP(r).text.includes("메타 풀이"), POP(r).text);
});

test("VO-4 glossary from the deck spec only: popover shows the deck text, no unknown-term", T, async () => {
  const r = await runPage("glossary-deck.html", { query: "?check" });
  assert.deepEqual(r.check.errors, []);
  assert.ok(POP(r).text.includes("덱 풀이"), JSON.stringify(POP(r)));
});

test("VO-4 glossary from a terms scene only: popover shows the plain text, no unknown-term", T, async () => {
  const r = await runPage("glossary-terms.html", { query: "?check" });
  assert.deepEqual(r.check.errors, []);
  assert.ok(POP(r).text.includes("terms 풀이"), JSON.stringify(POP(r)));
});

// FR-5: the first-registered entry stays; the spec lists #ltt-meta first, so the meta text wins (see report: ordering is inferred).
test("VO-4 meta and deck glossary conflict: the first registered (meta) text stays", T, async () => {
  const r = await runPage("glossary-conflict.html", { query: "?check" });
  assert.deepEqual(r.check.errors, []);
  assert.ok(POP(r).text.includes("메타 d"), JSON.stringify(POP(r)));
  assert.ok(!POP(r).text.includes("덱 d"), JSON.stringify(POP(r)));
});

test("VO-4 broken #ltt-meta: no glossary, the mark becomes unknown-term", T, async () => {
  const r = await runPage("meta-broken.html");
  assert.deepEqual(r.check.errors, [unknown("구역 (처음)", "a")]);
});

// ---------- VO-9 ----------

for (const [id, fixture] of [["broken JSON", "meta-broken.html"], ["no #ltt-meta", "meta-missing.html"]]) {
  test(`VO-9 C-12 QR-5: ${id} gives no page error and an unknown-term`, T, async () => {
    const r = await runPage(fixture);
    assert.equal(r.probe.errs, 0, "page raised errors");
    assert.deepEqual(r.check.errors, [unknown("구역 (처음)", "a")]);
    assert.equal(r.attr, "1");
    assert.equal(r.probe.warns.filter((m) => m.includes("#ltt-meta")).length, 1, `console.warn calls: ${JSON.stringify(r.probe.warns)}`);
  });
}

// ---------- VO-6 ----------

const DECK_STATIC = unknown("장면 2", "없는말");
const DECK_GOAL = unreachable("장면 3", 3);

for (const [query, want] of [
  ["?check", [DECK_STATIC, DECK_GOAL]],
  ["?shot", [DECK_STATIC, DECK_GOAL]],
  ["", [DECK_STATIC]],
]) {
  test(`VO-6 C-18 FR-9: deck page with query "${query}" ${want.length === 2 ? "mounts all scenes and reports the scene-3 goal" : "reports only mounted-scene goals (none)"}`, T, async () => {
    const r = await runPage("deck-goal.html", { query });
    assert.deepEqual(r.check.errors, want);
    assert.equal(r.check.source, "deck");
    assert.equal(r.attr, String(want.length));
    assert.equal(r.probe.errs, 0);
  });
}

// ---------- VO-7 recall ----------

test("VO-7 C-11 C-13 LTT.recall: hidden -> revealed, no re-click, hold/onReveal, event shape, missing question throws", T, async () => {
  const r = await runPage("recall.html");
  const p = r.probe;
  assert.equal(p.errs, 0);
  assert.equal(p.hasTa, true);
  assert.equal(p.hasBtn, true);
  assert.equal(p.beforeVisible, false, "answer is visible before reveal");
  assert.equal(p.beforeDisabled, false);
  assert.deepEqual(p.callsBefore, ["hold"], "hold is called once at creation, onReveal not yet");
  assert.equal(p.afterVisible, true);
  assert.equal(p.afterDisabled, true);
  assert.deepEqual(p.termKeys, ["k"], "{{k}} in the answer is linked");
  assert.equal(p.afterVisible2, true);
  assert.deepEqual(p.holdCallsAfter, ["hold", "reveal"]);
  assert.equal(p.holdIsAnswer, true);
  assert.equal(p.revealIsAnswer, true);
  assert.deepEqual(p.holdCallsAfter2, ["hold", "reveal"], "a second click on a revealed recall calls nothing");
  assert.equal(p.hbDisabled, true);
  assert.equal(p.threw, true);
  assert.equal(p.msg, "recall: question이 필요하다");
  assert.equal(p.childrenBefore, 2);
  assert.equal(p.childrenAfter, 2, "a failed recall changed the element");
  const recalls = r.events.filter((e) => e.type === "recall").map((e) => e.data).sort(byKey);
  assert.deepEqual(recalls, [
    { scene: "T", question: "무엇인가?", answer: "네" },
    { scene: "H", question: "홀드 질문", answer: "답" },
  ].sort(byKey));
});

// FR-12: deck summary recall behaves as at base_commit. The same deck runs against a copy of the base kit and the current kit.
test("VO-7 FR-12 UI-3: deck summary recall cards behave like the base_commit kit (states and recall events)", T, async () => {
  baseHome = mkdtempSync(join(tmpdir(), "ltt-check-base-home-"));
  baseSkill = mkdtempSync(join(tmpdir(), "ltt-check-base-kit-"));
  execSync(`git archive ${BASE_COMMIT} skills/learn-to-tell/kit | tar -x -C ${JSON.stringify(baseSkill)}`, { cwd: ROOT });
  baseServer = createLttServer({ home: baseHome, skillDir: join(baseSkill, "skills/learn-to-tell") });
  await new Promise((r) => baseServer.listen(0, "127.0.0.1", r));
  basePort = baseServer.address().port;
  const oldRun = await runPage("recall-deck-summary.html", { query: "?audit", homeDir: baseHome, srvPort: basePort });
  // Spec 76b739afacf5b868 FR-14: ?audit is gone from the current kit; ?shot mounts every scene. The base kit copy still needs ?audit.
  const newRun = await runPage("recall-deck-summary.html", { query: "?shot" });
  assert.ok(oldRun.probe && newRun.probe, "probe missing");
  assert.ok(oldRun.probe.textareas >= 2, `base summary has ${oldRun.probe.textareas} answer boxes; fixture cannot observe it`);
  assert.deepEqual(newRun.probe.rows, oldRun.probe.rows);
  assert.equal(newRun.probe.textareas, oldRun.probe.textareas);
  assert.equal(newRun.probe.errs, 0);
  const pick = (run) => run.events.filter((e) => e.type === "recall").map((e) => e.data).sort(byKey);
  assert.ok(pick(oldRun).length >= 2, "base produced no recall events");
  assert.deepEqual(pick(newRun), pick(oldRun));
});

// ---------- VO-8 ----------

test("VO-8 C-16 QR-6: a </script> and <!-- inside a marked key keep #ltt-check parseable", T, async () => {
  const r = await runPage("serialize-markup.html");
  assert.ok(r.rawCheck, "no #ltt-check");
  assert.ok(!r.rawCheck.includes("</script") && !r.rawCheck.includes("<!--"), "raw < survived in #ltt-check");
  assert.ok(r.rawCheck.includes("\\u003c"));
  assert.deepEqual(r.check.errors, [unknown("구역 '제목'", "</script><!--x")]);
});

test("VO-8 C-16 QR-6: a checkSource message with </script> and <!-- round-trips exactly", T, async () => {
  const r = await runPage("serialize-source.html");
  assert.ok(!r.rawCheck.includes("</script") && !r.rawCheck.includes("<!--"));
  // Spec e48ead05eb246d3c FR-15: the fixture's rule id "r" is unregistered, so the check adds a check-failed after the original item.
  assert.deepEqual(r.check.errors, [E("w", "r", "a </script> b <!-- c"), E("페이지", "check-failed", "등록되지 않은 rule r")]);
  assert.equal(r.probe.errs, 0);
});

// ---------- VO-10 ----------

for (const [id, fixture, msg] of [["whereOf throws", "source-throw-where.html", "boom where"], ["issues throws", "source-throw-issues.html", "boom issues"]]) {
  test(`VO-10 C-17 QR-5: checkSource ${id} gives one check-failed and the page keeps running`, T, async () => {
    const r = await runPage(fixture);
    assert.deepEqual(r.check.errors, [E("페이지", "check-failed", msg)]);
    assert.equal(r.attr, "1");
    assert.equal(r.probe.errs, 0);
    assert.ok(r.probe, "page stopped before its own timer ran");
  });
}

// ---------- VO-14 audit.mjs decision table ----------

async function auditFixture(fixture) {
  const id = install(fixture);
  const results = await audit({ targets: [id], sizes: ["1440x900"], chrome, home, jobs: 1 });
  assert.equal(results.length, 1);
  return { r: results[0], results, report: formatReport(results), code: exitCode(results) };
}
const hasLine = (report, line) => report.split("\n").includes(line);

// Spec 76b739afacf5b868 FR-8/FR-13/D-6: result items carry check, marks, shots, truncated, scroll; audit/lint/expectFails/scenes are gone.
const REMOVED_FIELDS = ["audit", "lint", "expectFails", "scenes"];
const assertNoRemovedFields = (r) => { for (const k of REMOVED_FIELDS) assert.equal(k in r, false, `result still has ${k}`); };

test("VO-14 page, check 0: result has check [], marks [], shots [], truncated false, a numeric scroll, no removed fields; exit 0", T, async () => {
  const { r, report, code } = await auditFixture("audit-page-clean.html");
  assert.equal(r.error, undefined);
  assert.deepEqual(r.check, []);
  assert.deepEqual(r.marks, []);
  assert.deepEqual(r.shots, []);
  assert.equal(r.truncated, false);
  assert.ok(Number.isFinite(r.scroll) && r.scroll > 0, String(r.scroll));
  assert.ok(Array.isArray(r.viewport) && r.viewport.length === 2);
  assertNoRemovedFields(r);
  assert.equal(code, 0);
  const last = report.trimEnd().split("\n").at(-1);
  assert.equal(last, `1440x900 (화면 ${r.viewport[0]}×${r.viewport[1]}): check 0건`);
});

test("VO-14 page, check >= 1: check copied from #ltt-check, exact report lines, exit 1", T, async () => {
  const { r, report, code } = await auditFixture("audit-page-defect.html");
  assert.equal(r.error, undefined);
  assert.deepEqual(r.check, [unknown("구역 '제목'", "없는말"), mismatch("x", 2, 3)]);
  assertNoRemovedFields(r);
  assert.ok(hasLine(report, `1440x900 ${r.target}  check 2 · marks 0 · shots 0`), report);
  assert.ok(hasLine(report, "    check 구역 '제목' [unknown-term]: 풀이가 없는 용어 {{없는말}}"), report);
  assert.ok(hasLine(report, "    check 페이지 [expect-mismatch]: x (모델 2, 기대 3)"), report);
  assert.ok(hasLine(report, `1440x900 (화면 ${r.viewport[0]}×${r.viewport[1]}): check 2건`), report);
  assert.equal(code, 1);
});

test("VO-14 deck, check 0: no #ltt-audit needed, check empty, no scenes field, exit 0", T, async () => {
  const { r, code } = await auditFixture("audit-deck-clean.html");
  assert.equal(r.error, undefined);
  assert.deepEqual(r.check, []);
  assertNoRemovedFields(r);
  assert.equal(code, 0);
});

test("VO-14 deck, check >= 1: check copied, no lint field, exit 1", T, async () => {
  const { r, report, code } = await auditFixture("audit-deck-defect.html");
  assert.equal(r.error, undefined);
  assert.deepEqual(r.check, [unknown("장면 2", "없는말")]);
  assertNoRemovedFields(r);
  assert.ok(hasLine(report, "    check 장면 2 [unknown-term]: 풀이가 없는 용어 {{없는말}}"), report);
  assert.equal(code, 1);
});

test("VO-14 missing #ltt-check: the item is an error and the exit code is 2", T, async () => {
  const { r, report, code } = await auditFixture("audit-page-missing.html");
  assert.equal(typeof r.error, "string");
  assert.ok(r.error.length > 0);
  assert.ok(report.split("\n").some((l) => l.includes(`오류: ${r.error}`)), report);
  assert.equal(code, 2);
});

// Characterization (pre-existing wording, unchanged by spec 76b739afacf5b868).
test("VO-14 broken #ltt-check JSON: error text and exit 2", T, async () => {
  const { r, code } = await auditFixture("audit-page-broken.html");
  assert.equal(r.error, "#ltt-check JSON을 읽을 수 없다");
  assert.equal(code, 2);
});

// ---------- v4 additions ----------

test("VO-4 F-2: a deck page whose {{k}} is defined only in the #ltt-meta glossary has no unknown-term and shows the meta text", T, async () => {
  const r = await runPage("glossary-deck-metaonly.html", { query: "?check" });
  assert.deepEqual(r.check.errors, []);
  assert.ok(POP(r).text.includes("메타 k"), JSON.stringify(POP(r)));
});

test("VO-5 SC-heading-mark (F-3): a heading with {{shown|key}} and extra spaces names its unit by the visible words with single spaces", T, async () => {
  const r = await runPage("page-heading-mark.html");
  assert.deepEqual(r.check.errors, [filler("구역 '가 보이는 말 나'", "샘플 텍스트")]);
});

test("VO-5 SC-h4 (F-3): an h4 does not start a unit; an h2 nested in div/section does", T, async () => {
  const r = await runPage("page-h4.html");
  assert.deepEqual(r.check.errors, [unknown("구역 '위'", "없는말"), filler("구역 '위'", "TODO"), filler("구역 '중첩'", "항목 1")]);
});

test("VO-5 SC-kit-ui (F-3): the #ltt-expect panel text (expect label, LTT.warn line) is not checked; only expect-mismatch remains", T, async () => {
  const r = await runPage("page-kit-ui.html");
  assert.deepEqual(r.check.errors, [mismatch("적중 TODO", 2, 3)]);
});

test("VO-5 SC-panel (F-4): one #ltt-expect div.warn row per error, and a second LTT.check() keeps one #ltt-check and the same rows", T, async () => {
  const r = await runPage("page-panel.html");
  const { before, after } = r.probe;
  assert.equal(before.n, 3);
  assert.equal(before.rows, before.n, `warning rows ${before.rows} != errors ${before.n}`);
  assert.deepEqual(before.per, [1, 1, 1], "each error message appears in exactly one row");
  assert.equal(before.checkEls, 1);
  assert.deepEqual(after, before, "a second LTT.check() changed the panel, #ltt-check count or errors");
  assert.equal(r.attr, "3");
});

test("VO-5 SC-panel (F-4): with a failing LTT.expect there is still exactly one row per error (expect-mismatch included)", T, async () => {
  const r = await runPage("page-panel-expect.html");
  const { before, after } = r.probe;
  assert.equal(before.n, 2);
  assert.deepEqual(before.per, [1, 1]);
  assert.equal(before.rows, 2);
  assert.deepEqual(after, before);
});

test("VO-5 SC-lint-once (F-4): a manual LTT.check() after the automatic run sends no second lint event", T, async () => {
  const r = await runPage("page-panel.html");
  const lint = r.events.filter((e) => e.type === "lint");
  assert.equal(lint.length, 1);
  assert.deepEqual(lint[0].data, [unknown("구역 '제목'", "없는말"), filler("구역 '제목'", "TODO"), unreachable("구역 '제목'", 3)]);
});

test("VO-5 SC-lint-once (F-4): a deck under ?check with a B defect sends exactly one lint event carrying the check errors", T, async () => {
  const r = await runPage("deck-lint-once.html", { query: "?check" });
  assert.deepEqual(r.check.errors, [unknown("장면 2", "없는말")]);
  const lint = r.events.filter((e) => e.type === "lint");
  assert.equal(lint.length, 1);
  assert.deepEqual(lint[0].data, [unknown("장면 2", "없는말")]);
});

test("VO-10 SC-1: when fetch rejects, #ltt-check is still written with the normal errors and the page raises no error", T, async () => {
  const r = await runPage("page-fetch-reject.html");
  assert.deepEqual(r.check.errors, [unknown("구역 '제목'", "없는말")]);
  assert.equal(r.attr, "1");
  assert.equal(r.probe.errs, 0);
});

test("VO-6 A-c: a deck without a query reports an unreachable goal in the first (mounted) scene as 장면 1", T, async () => {
  const r = await runPage("deck-goal-first.html");
  assert.deepEqual(r.check.errors, [unreachable("장면 1", 3)]);
  assert.equal(r.probe.errs, 0);
});

test("VO-12 F-8 (revised by 76b739afacf5b868): a deck with a failing LTT.expect reports one check expect-mismatch and no expectFails", T, async () => {
  const { r, code } = await auditFixture("audit-deck-expect.html");
  assert.equal(r.error, undefined);
  assert.deepEqual(r.check, [mismatch("x", 2, 3)]);
  assertNoRemovedFields(r);
  assert.equal(code, 1);
});
