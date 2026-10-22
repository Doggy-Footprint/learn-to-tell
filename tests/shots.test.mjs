import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as AUDIT from "../skills/learn-to-tell/server/audit.mjs";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";

// Spec 76b739afacf5b868 v1 VO-5..VO-9, VO-12. Expected values come from the spec's Signatures, FR-5..FR-13 and Cases;
// fixtures live in tests/fixtures/shots/ and are installed into a temporary LTT home.
// The audit() option names `shots` (directory) and `checklist` (file path) follow the CLI flags; the spec lists only the CLI.

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FIX = join(ROOT, "tests/fixtures/shots");
const { parseChecklist, formatReport, exitCode, findChrome } = AUDIT;
const chrome = findChrome?.();
const skip = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
  : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;
const T = { skip, timeout: 600_000 };
const AUDIT_JS = join(ROOT, "skills/learn-to-tell/server/audit.mjs");

let home, server, port, seq = 0;
const scratch = [];
const tmp = (prefix) => {
  const d = mkdtempSync(join(tmpdir(), prefix));
  scratch.push(d);
  return d;
};

before(async () => {
  if (skip) return;
  home = tmp("ltt-shots-home-");
  server = createLttServer({ home });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
after(async () => {
  if (server) await new Promise((r) => server.close(r));
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

function install(fixture, subst = {}) {
  const id = `20261022-sh${++seq}`;
  const dir = join(home, "lessons", id);
  mkdirSync(dir, { recursive: true });
  let html = readFileSync(join(FIX, fixture), "utf8");
  for (const [k, v] of Object.entries(subst)) html = html.replaceAll(k, String(v));
  writeFileSync(join(dir, "lesson.html"), html);
  return id;
}

function dumpDom(url) {
  const userDir = tmp("ltt-shots-chrome-");
  const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    `--user-data-dir=${userDir}`, "--window-size=1440,900", "--virtual-time-budget=12000", "--dump-dom", url];
  if (process.getuid?.() === 0) args.unshift("--no-sandbox");
  return new Promise((resolveDom, reject) => {
    const child = spawn(chrome, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 60_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.resume();
    child.on("error", reject);
    child.on("close", () => { clearTimeout(timer); resolveDom(out); });
  });
}
const scriptJson = (dom, id) => {
  const m = new RegExp(`<script[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</script>`).exec(dom);
  return m ? JSON.parse(m[1]) : null;
};
async function page(fixture, query = "", subst = {}) {
  const id = install(fixture, subst);
  const dom = await dumpDom(`http://127.0.0.1:${port}/lessons/${id}/lesson.html${query}`);
  const probe = scriptJson(dom, "probe");
  return { id, dom, shotAttr: /<html[^>]*\bdata-ltt-shot\b/.test(dom), check: scriptJson(dom, "ltt-check"), probe, el: (n) => probe?.els?.[n] };
}

const runAudit = (opts) => AUDIT.audit({ sizes: ["1440x900"], chrome, home, jobs: 4, ...opts });
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isPng = (p) => existsSync(p) && readFileSync(p).subarray(0, 8).equals(PNG_MAGIC);
const writeChecklist = (text) => {
  const f = join(tmp("ltt-shots-cl-"), "checklist.md");
  writeFileSync(f, text);
  return f;
};
const parsePng = (p) => /^(.+)-(\d+x\d+)-(?:([ps])(\d{2})|(.+)-t(\d+))\.png$/.exec(basename(p));

// ---------- VO-5 decision table (real Chrome) ----------

const CLOCKS = [{ id: "a", dur: 2000 }, { id: "b", dur: 1500 }];

test("VO-5 page / no query: #ltt-check has scroll, clocks in creation order, no scenes; offscreen clock b is not drawn", T, async () => {
  const r = await page("clocks.html");
  assert.equal(typeof r.check.scroll, "number");
  assert.equal(r.check.scroll, r.check.viewport[1] * 3, "fixture is 3 viewport heights tall");
  assert.equal("scenes" in r.check, false);
  assert.equal(r.shotAttr, false, "data-ltt-shot without ?shot");
  assert.deepEqual(r.check.clocks, CLOCKS);
  assert.notEqual(r.el("ca").t, null, "visible clock a was never drawn");
  assert.equal(r.el("cb").t, null, "offscreen clock b was drawn");
});

test("VO-5 page / ?shot: every clock draws its dur state, no scroll", T, async () => {
  const r = await page("clocks.html", "?shot");
  assert.equal(r.shotAttr, true, "<html data-ltt-shot> missing");
  assert.equal(r.el("ca").t, "2000");
  assert.equal(r.el("cb").t, "1500");
  assert.equal(r.probe.scrollY, 0);
  assert.deepEqual(r.check.clocks, CLOCKS);
});

test("VO-5 page / ?shot&y=700: scrollY is 700 after the check (FR-6)", T, async () => {
  const r = await page("clocks.html", "?shot&y=700");
  assert.equal(r.shotAttr, true);
  assert.equal(r.probe.scrollY, 700);
  assert.equal(r.el("ca").t, "2000");
});

test("VO-5 page / ?shot&clock=a&t=400 (C-9): a draws 400, b draws dur, a is inside the viewport", T, async () => {
  const r = await page("clocks.html", "?shot&clock=a&t=400");
  assert.equal(r.el("ca").t, "400");
  assert.equal(r.el("cb").t, "1500");
  assert.equal(r.el("ca").inView, true);
});

test("VO-5 page / ?shot&clock=b&t=0: b (below the fold) draws 0, a draws dur, the page scrolls so b is inside the viewport", T, async () => {
  const r = await page("clocks.html", "?shot&clock=b&t=0");
  assert.equal(r.shotAttr, true);
  assert.equal(r.el("cb").t, "0");
  assert.equal(r.el("ca").t, "2000");
  assert.ok(r.probe.scrollY > 0, `scrollY ${r.probe.scrollY}`);
  assert.equal(r.el("cb").inView, true);
});

test("VO-5 page / ?shot&clock=<unknown id>: all clocks draw dur and the page does not scroll", T, async () => {
  const r = await page("clocks.html", "?shot&clock=zz&t=100");
  assert.equal(r.el("ca").t, "2000");
  assert.equal(r.el("cb").t, "1500");
  assert.equal(r.probe.scrollY, 0);
});

test("VO-5 deck / no query: #ltt-check has scenes 3 and a numeric scroll", T, async () => {
  const r = await page("deck.html");
  assert.equal(r.check.scenes, 3);
  assert.equal(typeof r.check.scroll, "number");
});

test("VO-5 deck / ?shot: all scenes are mounted (clock a listed), a draws dur", T, async () => {
  const r = await page("deck.html", "?shot");
  assert.equal(r.check.scenes, 3);
  assert.deepEqual(r.check.clocks, [{ id: "a", dur: 2000 }]);
  assert.equal(r.el("cd").t, "2000");
});

test("VO-5 deck / ?shot&clock=a&t=0 (C-10): scene 2 is the visible one and a draws 0", T, async () => {
  const r = await page("deck.html", "?shot&clock=a&t=0");
  assert.equal(r.shotAttr, true);
  assert.equal(r.el("cd").t, "0");
  assert.deepEqual([r.el("s1m").vis, r.el("s2m").vis, r.el("s3m").vis], [false, true, false]);
});

test("VO-5 deck / ?shot&clock=<unknown id>: a draws dur", T, async () => {
  const r = await page("deck.html", "?shot&clock=zz&t=5");
  assert.equal(r.el("cd").t, "2000");
  assert.equal(r.probe.scrollY, 0);
});

test("VO-5 C-16: two clocks with the same id give exactly one clock-duplicate-id check error", T, async () => {
  const r = await page("dup.html");
  const dup = r.check.errors.filter((e) => e.rule === "clock-duplicate-id");
  assert.equal(dup.length, 1, JSON.stringify(r.check.errors));
  assert.equal(typeof dup[0].where, "string");
  assert.ok(dup[0].msg.length > 0);
});

for (const query of ["", "?shot"]) {
  test(`VO-5 C-20 page "${query}": a draw that throws stops only its own clock; the page check stays clean`, T, async () => {
    const r = await page("throwing.html", query);
    assert.deepEqual(r.check.errors, []);
    assert.equal(r.probe.errs, 0, "the throw escaped to the page");
    assert.notEqual(r.el("cn").t, null, "the other clock stopped drawing");
    assert.equal(r.el("ct").t, null);
  });
}

// ---------- VO-6 scroll and scene boundaries (audit() --shots) ----------

function assertShots(r, { kind, n, dir }) {
  assert.equal(r.error, undefined, r.error);
  const files = r.shots.filter((p) => parsePng(p)?.[3] === kind);
  assert.equal(files.length, n, `${kind} shots: ${r.shots.map((p) => basename(p)).join(", ")}`);
  const slugs = new Set();
  files.forEach((p, i) => {
    const m = parsePng(p);
    slugs.add(m[1]);
    assert.equal(m[2], r.size);
    assert.equal(m[4], String(i + 1).padStart(2, "0"), `file ${basename(p)}`);
    assert.ok(resolve(p).startsWith(resolve(dir) + "/"), `${p} is outside ${dir}`);
    assert.ok(isPng(p), `${p} is not a PNG`);
  });
  assert.ok(slugs.size <= 1 && [...slugs].every((s) => s.length > 0), `slugs ${[...slugs]}`);
}

test("VO-6 scroll BVA (C-11, C-12): scroll = h, h+1, 30h, 30h+1 and 2.5h give 1, 2, 30, 30 (truncated), 3 p-shots", T, async () => {
  const cases = [
    { label: "h", mult: 1, add: 0, n: 1, truncated: false },
    { label: "h+1", mult: 1, add: 1, n: 2, truncated: false },
    { label: "30h", mult: 30, add: 0, n: 30, truncated: false },
    { label: "30h+1", mult: 30, add: 1, n: 30, truncated: true },
    { label: "2.5h", mult: 2.5, add: 0, n: 3, truncated: false },
  ];
  const dirs = cases.map(() => tmp("ltt-shots-out-"));
  const targets = cases.map(({ mult, add }) => install("plain.html", { __MULT__: mult, __ADD__: add }));
  const results = [];
  for (const [i, c] of cases.entries()) results.push(...(await runAudit({ targets: [targets[i]], shots: dirs[i] })));
  results.forEach((r, i) => {
    const c = cases[i];
    const h = r.viewport[1];
    assert.equal(r.scroll, Math.floor(h * c.mult) + c.add, `${c.label}: fixture height (h ${h})`);
    assertShots(r, { kind: "p", n: c.n, dir: dirs[i] });
    assert.equal(r.truncated, c.truncated, c.label);
    assert.equal(readdirSync(dirs[i]).length, c.n, `${c.label}: files on disk`);
  });
});

for (const [file, n] of [["deck-1.html", 1], ["deck-4.html", 4]]) {
  test(`VO-6 deck with ${n} scene(s) (C-13): s01..s${String(n).padStart(2, "0")}, not truncated`, T, async () => {
    const dir = tmp("ltt-shots-out-");
    const [r] = await runAudit({ targets: [install(file)], shots: dir });
    assertShots(r, { kind: "s", n, dir });
    assert.equal(r.truncated, false);
    assert.equal(r.shots.filter((p) => parsePng(p)?.[3] === "p").length, 0, "a deck got scroll shots");
  });
}

// ---------- VO-7 parseChecklist (syntax testing, no Chrome) ----------

const M = (id, ms) => ({ id, ms });
const VALID = [
  ["one mark", "[shot a 0]", [M("a", 0)]],
  ["several marks on one line", "[shot a 0] [shot b 1200] [shot c_d-E 7]", [M("a", 0), M("b", 1200), M("c_d-E", 7)]],
  ["duplicate (id, ms) keeps the first", "[shot a 1] x [shot a 1]\n[shot a 2]", [M("a", 1), M("a", 2)]],
  ["marks inside markdown", "| 2 | 확인 `[shot a 500]` |\n- [ ] [shot b 0]", [M("a", 500), M("b", 0)]],
  ["document order across lines", "[shot z 5]\n[shot a 9]", [M("z", 5), M("a", 9)]],
  ["id character set", "[shot A-z_9 10]", [M("A-z_9", 10)]],
  ["no marks, other brackets", "plain [link](x) [x]", []],
  ["empty text", "", []],
];
for (const [label, text, marks] of VALID) {
  test(`VO-7 parseChecklist valid: ${label}`, () => {
    assert.deepEqual(parseChecklist(text), { marks, errors: [] });
  });
}

const INVALID = [
  ["missing ms", "[shot a]"],
  ["negative ms", "[shot a -1]"],
  ["decimal ms", "[shot a 1.5]"],
  ["exponent ms", "[shot a 1e3]"],
  ["non-numeric ms", "[shot a x]"],
  ["slash and dots in id", "[shot a/../x 1]"],
  ["parent path id", "[shot ../x 0]"],
  ["space in id", "[shot a b 1]"],
  ["bare [shot]", "[shot]"],
  ["no closing bracket", "[shot a 1"],
];
for (const [label, text] of INVALID) {
  test(`VO-7 parseChecklist invalid: ${label} gives no mark and one shot-format error`, () => {
    const r = parseChecklist(text);
    assert.deepEqual(r.marks, []);
    assert.equal(r.errors.length, 1, JSON.stringify(r.errors));
    assert.equal(r.errors[0].where, "checklist");
    assert.equal(r.errors[0].rule, "shot-format");
    assert.equal(typeof r.errors[0].msg, "string");
    assert.ok(r.errors[0].msg.length > 0);
  });
}

test("VO-7 parseChecklist: three invalid fragments on three lines give three errors and no marks", () => {
  const r = parseChecklist("[shot a]\n[shot a -1]\n[shot a/../x 1]");
  assert.deepEqual(r.marks, []);
  assert.deepEqual(r.errors.map((e) => e.rule), ["shot-format", "shot-format", "shot-format"]);
});

test("VO-7 parseChecklist: valid marks around an invalid one are kept and the invalid one is reported once", () => {
  const r = parseChecklist("[shot a 1] [shot a] [shot b 2]");
  assert.deepEqual(r.marks, [M("a", 1), M("b", 2)]);
  assert.equal(r.errors.length, 1);
});

// ---------- VO-7 marks through audit() (C-14, C-15, QR-6) ----------

const markFiles = (r) => r.shots.filter((p) => parsePng(p)?.[5] !== undefined).map((p) => basename(p));

test("VO-7 C-14: [shot a 0] [shot a 1200] and a repeated [shot a 1200] give exactly two mark PNGs; scroll PNGs stay 3", T, async () => {
  const dir = tmp("ltt-shots-out-");
  const checklist = writeChecklist("# 검증\n- [shot a 0] [shot a 1200]\n- 다시 [shot a 1200]\n");
  const [r] = await runAudit({ targets: [install("clocks.html")], shots: dir, checklist });
  assert.equal(r.error, undefined, r.error);
  assert.deepEqual(r.marks, []);
  assert.deepEqual(markFiles(r).map((f) => f.replace(/^.*-1440x900-/, "")).sort(), ["a-t0.png", "a-t1200.png"]);
  assertShots(r, { kind: "p", n: 3, dir });
  for (const p of r.shots) assert.ok(isPng(p), p);
  assert.equal(readdirSync(dir).length, 5);
});

test("VO-7 C-15: format, unknown clock, bad time give marks errors, no PNG for them; ms = dur is valid; exit 1", T, async () => {
  const dir = tmp("ltt-shots-out-");
  const checklist = writeChecklist("[shot a]\n[shot a -1]\n[shot a/../x 1]\n[shot zz 0]\n[shot a 9999]\n[shot a 2000]\n");
  const results = await runAudit({ targets: [install("clocks.html")], shots: dir, checklist });
  const [r] = results;
  assert.equal(r.error, undefined, r.error);
  const count = (rule) => r.marks.filter((m) => m.rule === rule).length;
  assert.deepEqual([count("shot-format"), count("shot-unknown-clock"), count("shot-bad-time")], [3, 1, 1]);
  assert.equal(r.marks.length, 5);
  for (const m of r.marks) {
    assert.equal(m.where, "checklist");
    assert.ok(typeof m.msg === "string" && m.msg.length > 0);
  }
  assert.deepEqual(markFiles(r).map((f) => f.replace(/^.*-1440x900-/, "")), ["a-t2000.png"]);
  assert.equal(readdirSync(dir).filter((f) => /-a-t|-zz-|-x-/.test(f)).length, 1, readdirSync(dir).join(", "));
  assert.equal(exitCode(results), 1);
  const report = formatReport(results).split("\n");
  for (const m of r.marks) assert.ok(report.includes(`    checklist [${m.rule}]: ${m.msg}`), `no report line for ${m.rule}`);
  assert.ok(report.some((l) => l.includes("marks 5")), formatReport(results));
});

test("VO-7 QR-6: marks with path characters or spaces create no file outside the shots directory", T, async () => {
  const base = tmp("ltt-shots-sec-");
  const dir = join(base, "x", "y", "shots");
  const checklist = join(base, "checklist.md");
  writeFileSync(checklist, "[shot ../../escape 0]\n[shot a b 1]\n[shot .. 0]\n[shot a\\b 0]\n[shot /abs 0]\n[shot a/b 0]\n");
  const [r] = await runAudit({ targets: [install("clocks.html")], shots: dir, checklist });
  assert.equal(r.error, undefined, r.error);
  assert.equal(r.marks.filter((m) => m.rule === "shot-format").length, 6, JSON.stringify(r.marks));
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? [join(d, e.name), ...walk(join(d, e.name))] : [join(d, e.name)]));
  const outside = walk(base).filter((p) => p !== checklist && !p.startsWith(dir + "/") && p !== join(base, "x") && p !== join(base, "x", "y") && p !== dir);
  assert.deepEqual(outside, []);
  assert.deepEqual(walk(dir).filter((p) => statSync(p).isDirectory()), [], "a subdirectory appeared in the shots directory");
  assert.deepEqual(markFiles(r), []);
});

// ---------- VO-8 formatReport / exitCode decision table (no Chrome) ----------

const item = (over = {}) => ({ target: "t1", size: "1440x900", url: "http://x/", viewport: [1440, 800], scroll: 2400, check: [], marks: [], shots: [], truncated: false, ...over });
const CK = { where: "구역 '가'", rule: "unknown-term", msg: "풀이가 없는 용어 {{k}}" };
const MK = { where: "checklist", rule: "shot-format", msg: "표식 형식 오류 [shot a]" };
const lines = (report) => report.split("\n").filter((l) => l !== "");

for (const truncated of [false, true]) {
  const suffix = truncated ? " (잘림)" : "";
  const shots = truncated ? ["/o/a-1440x900-p01.png", "/o/a-1440x900-p02.png"] : ["/o/a-1440x900-p01.png"];
  const cells = [
    { label: "all zero", over: { check: [], marks: [] }, code: 0, n: 0, m: 0, mid: [] },
    { label: "check > 0", over: { check: [CK], marks: [] }, code: 1, n: 1, m: 0, mid: [`    check ${CK.where} [${CK.rule}]: ${CK.msg}`] },
    { label: "marks > 0", over: { check: [], marks: [MK] }, code: 1, n: 0, m: 1, mid: [`    checklist [${MK.rule}]: ${MK.msg}`] },
    { label: "check and marks > 0", over: { check: [CK], marks: [MK] }, code: 1, n: 1, m: 1, mid: [`    check ${CK.where} [${CK.rule}]: ${CK.msg}`, `    checklist [${MK.rule}]: ${MK.msg}`] },
  ];
  for (const c of cells) {
    test(`VO-8 ${c.label}, truncated ${truncated}: exact lines and exit code ${c.code}`, () => {
      const results = [item({ ...c.over, shots, truncated })];
      assert.equal(exitCode(results), c.code);
      assert.deepEqual(lines(formatReport(results)), [
        `1440x900 t1  check ${c.n} · marks ${c.m} · shots ${shots.length}${suffix}`,
        ...c.mid,
        ...shots.map((p) => `    ${p}`),
        `1440x900 (화면 1440×800): check ${c.n}건`,
      ]);
    });
  }
}

test("VO-8 error item (truncated not applicable): exit 2 and an 오류 line carrying the message", () => {
  const results = [{ target: "t1", size: "1440x900", url: "http://x/", error: "#ltt-check JSON을 읽을 수 없다" }];
  assert.equal(exitCode(results), 2);
  assert.ok(lines(formatReport(results)).some((l) => l.includes("오류: #ltt-check JSON을 읽을 수 없다")), formatReport(results));
});

test("VO-8 exit code precedence over several items: error beats check, check beats nothing, empty list is 0", () => {
  const err = { target: "t2", size: "1440x900", url: "u", error: "e" };
  assert.equal(exitCode([item({ check: [CK] }), err, item()]), 2);
  assert.equal(exitCode([item(), item({ marks: [MK] })]), 1);
  assert.equal(exitCode([item(), item()]), 0);
  assert.equal(exitCode([]), 0);
});

test("VO-8 summary: the last line carries one 'size (화면 W×H): check N건' piece per size, summing that size's items (separator not fixed by the spec)", () => {
  const results = [
    item({ check: [CK, CK] }),
    item({ target: "t2", check: [CK], marks: [MK] }),
    item({ size: "1280x800", viewport: [1280, 700], check: [] }),
  ];
  const last = lines(formatReport(results)).at(-1);
  assert.ok(last.includes("1440x900 (화면 1440×800): check 3건"), last);
  assert.ok(last.includes("1280x800 (화면 1280×700): check 0건"), last);
  assert.ok(last.startsWith("1440x900 (화면 1440×800): check 3건"), "size order follows the results");
  for (const forbidden of ["auditScene", "lint", "expectFails"]) assert.ok(!formatReport(results).includes(forbidden), forbidden);
});

// ---------- VO-8 CLI ----------

const cli = (args) => spawnSync(process.execPath, [AUDIT_JS, ...args], { encoding: "utf8", timeout: 300_000 });

test("VO-8 C-18 Errors: --checklist pointing to a missing file exits 2 with a stderr message and takes no screenshot", T, async () => {
  const dir = join(tmp("ltt-shots-out-"), "shots");
  const id = install("clocks.html");
  const r = cli([id, "--home", home, "--chrome", chrome, "--size", "1440x900", "--shots", dir, "--checklist", join(tmpdir(), "ltt-no-such-checklist.md")]);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.ok(r.stderr.trim().length > 0, "empty stderr");
  assert.deepEqual(existsSync(dir) ? readdirSync(dir) : [], []);
});

test("VO-8 C-17: a clean page without checklist exits 0 and ends with the 'check 0건' summary", T, async () => {
  const id = install("plain.html", { __MULT__: 2, __ADD__: 0 });
  const r = cli([id, "--home", home, "--chrome", chrome, "--size", "1440x900"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const last = lines(r.stdout).at(-1);
  assert.match(last, /^1440x900 \(화면 \d+×\d+\): check 0건$/);
  assert.match(lines(r.stdout)[0], /^1440x900 \S+  check 0 · marks 0 · shots 0$/, r.stdout);
});

// ---------- VO-9 one screenshot fails (error guessing, spec v2) ----------

test("VO-9 QR-5: a directory squatting on the 2nd scroll PNG name makes only that PNG fail; the others exist and the exit code is not 2", T, async () => {
  const id = install("clocks.html");
  // The FR-12 name embeds an unspecified <slug>; a first run into another directory reveals it for this target.
  const probeDir = tmp("ltt-shots-out-");
  const [first] = await runAudit({ targets: [id], shots: probeDir });
  const second = first.shots.map((p) => basename(p)).find((n) => /-p02\.png$/.test(n));
  assert.ok(second, `no p02 in ${first.shots.map((p) => basename(p))}`);
  const dir = tmp("ltt-shots-out-");
  mkdirSync(join(dir, second));
  const results = await runAudit({ targets: [id], shots: dir });
  const [r] = results;
  assert.equal(r.error, undefined, r.error);
  assert.deepEqual(r.shots.map((p) => basename(p)).sort(), first.shots.map((p) => basename(p)).filter((n) => n !== second).sort());
  for (const p of r.shots) assert.ok(isPng(p), p);
  assert.ok(statSync(join(dir, second)).isDirectory());
  assert.equal(exitCode(results), 0);
});

// ---------- correction batch 3 ----------

test("VO-5 F-4 (FR-7, Errors): a rejected clock is not listed and is no duplicate; id-less clocks are not listed; creation order is kept", T, async () => {
  const r = await page("registry.html");
  assert.deepEqual(r.check.clocks, [{ id: "z", dur: 900 }, { id: "m", dur: 700 }, { id: "c", dur: 600 }]);
  assert.deepEqual(r.check.errors.filter((e) => e.rule === "clock-duplicate-id"), []);
});

test("VO-7 F-1 (FR-11): ms above the clock's own dur but below another clock's dur, and dur+1, are shot-bad-time; ms = dur stays valid", T, async () => {
  const dir = tmp("ltt-shots-out-");
  const checklist = writeChecklist("[shot b 1800]\n[shot a 2001]\n[shot a 2000]\n[shot b 1500]\n");
  const [r] = await runAudit({ targets: [install("clocks.html")], shots: dir, checklist });
  assert.equal(r.error, undefined, r.error);
  assert.deepEqual(r.marks.map((m) => m.rule), ["shot-bad-time", "shot-bad-time"]);
  assert.deepEqual(markFiles(r).map((f) => f.replace(/^.*-1440x900-/, "")).sort(), ["a-t2000.png", "b-t1500.png"]);
  assert.equal(readdirSync(dir).filter((f) => /-b-t1800|-a-t2001/.test(f)).length, 0);
});

test("VO-8 F-2 (Errors): one target without #ltt-check is an error item and the other target is reported in full; exit 2", T, async () => {
  const dir = tmp("ltt-shots-out-");
  const bad = install("nocheck.html");
  const good = install("plain.html", { __MULT__: 2, __ADD__: 0 });
  const results = await runAudit({ targets: [bad, good], shots: dir });
  const rb = results.find((r) => r.target.includes(bad));
  const rg = results.find((r) => r.target.includes(good));
  assert.ok(rb && rg, JSON.stringify(results.map((r) => r.target)));
  assert.equal(typeof rb.error, "string");
  assert.equal(rg.error, undefined);
  assert.deepEqual(rg.check, []);
  assert.equal(rg.shots.length, 2);
  for (const p of rg.shots) assert.ok(isPng(p), p);
  assert.equal(exitCode(results), 2);
});

test("VO-6 F-5 (FR-10): on a truncated 30h+1 page a valid mark is still shot: 31 PNGs, truncated true", T, async () => {
  const dir = tmp("ltt-shots-out-");
  const checklist = writeChecklist("[shot a 500]\n");
  const [r] = await runAudit({ targets: [install("tall-clock.html", { __MULT__: 30, __ADD__: 1 })], shots: dir, checklist });
  assert.equal(r.error, undefined, r.error);
  assert.equal(r.truncated, true);
  assertShots(r, { kind: "p", n: 30, dir });
  assert.deepEqual(markFiles(r).map((f) => f.replace(/^.*-1440x900-/, "")), ["a-t500.png"]);
  assert.equal(r.shots.length, 31);
  assert.equal(readdirSync(dir).length, 31);
});

test("VO-6 regression guard: p01 and p02 differ in bytes on a page whose viewports differ visibly; mark PNGs a-t0 and a-t1200 differ", T, async () => {
  const dir = tmp("ltt-shots-out-");
  const checklist = writeChecklist("[shot a 0]\n[shot a 1200]\n");
  const [r] = await runAudit({ targets: [install("clocks.html")], shots: dir, checklist });
  const by = (re) => r.shots.find((p) => re.test(basename(p)));
  const bytes = (re) => readFileSync(by(re));
  assert.ok(by(/-p01\.png$/) && by(/-p02\.png$/) && by(/-a-t0\.png$/) && by(/-a-t1200\.png$/), r.shots.join(", "));
  assert.ok(!bytes(/-p01\.png$/).equals(bytes(/-p02\.png$/)), "p01 and p02 are byte-identical");
  assert.ok(!bytes(/-a-t0\.png$/).equals(bytes(/-a-t1200\.png$/)), "a-t0 and a-t1200 are byte-identical");
});

// ---------- VO-12 QR-1 time ----------

test("VO-12 QR-1: 3 scroll pages + 2 marks, 2 sizes, jobs 4 take at most 60 s", T, async () => {
  const dir = tmp("ltt-shots-out-");
  const checklist = writeChecklist("[shot a 1000]\n[shot b 1500]\n");
  const id = install("clocks.html");
  const t0 = Date.now();
  const results = await AUDIT.audit({ targets: [id], sizes: ["1440x900", "1280x800"], chrome, home, jobs: 4, shots: dir, checklist });
  const seconds = (Date.now() - t0) / 1000;
  assert.equal(results.length, 2);
  for (const r of results) {
    assert.equal(r.error, undefined, r.error);
    assert.equal(r.shots.length, 5, `${r.size}: ${r.shots.length} shots`);
  }
  assert.ok(seconds <= 60, `took ${seconds.toFixed(1)} s`);
});
