// Spec 37a2365a466d3e8b v1: VO-9 (formatReport, classification tree), VO-10 (exitCode decision table + CLI end to end), the audit() side of VO-11 and VO-8's
// report-facing severity. Expected text comes from the Signatures block of the spec; synthetic result objects follow its result shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";
import { audit, exitCode, findChrome, formatReport } from "../skills/learn-to-tell/server/audit.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CLI = join(ROOT, "skills/learn-to-tell/server/audit.mjs");
const chrome = findChrome();
const skipChrome = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
  : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;

// ---------- synthetic results ----------

const res = (o = {}) => ({ target: "https://example.invalid/lesson.html", size: "1280x800", url: "https://example.invalid/lesson.html", scenes: 5, viewport: [1280, 713], audit: [], lint: [], expectFails: [], measures: [], ...o });
const w = (scene, rule, severity, msg) => ({ scene, rule, msg, severity });
const lines = (text) => text.split("\n");
const has = (text, line) => assert.ok(lines(text).includes(line), `missing line:\n${line}\n--- in ---\n${text}`);
const countLines = (text, re) => lines(text).filter((l) => re.test(l)).length;
const grade = (sev) => (sev === "fix" ? "고침" : "권고");

// ---------- VO-9 formatReport (each choice of every classification) ----------

test("VO-9 URL target, one size, fix audit warning, no lint, no expect: header without bytes, size line, audit line with one size", () => {
  const r = res({ scenes: 4, audit: [w(2, "hscroll", "fix", "가로로 320px 넘친다")] });
  const out = formatReport([r]);
  has(out, "https://example.invalid/lesson.html  장면 4");
  has(out, "  1280x800 (화면 1280×713): audit 1");
  has(out, "  장면 2 [hscroll·고침] 1280x800: 가로로 320px 넘친다");
  assert.equal(countLines(out, /^\s+lint /), 0, "a lint line without lint warnings");
  assert.equal(countLines(out, /^\s+expect:/), 0, "an expect line without expect mismatches");
  assert.ok(!/ B$/m.test(out.split("\n")[0]), "a URL target printed a byte count");
});

test("VO-9 file target with bytes: the header carries '· <bytes> B' read from the result's bytes field", () => {
  const out = formatReport([res({ target: "lessons/x/lesson.html", url: "http://127.0.0.1:1/lessons/x/lesson.html", scenes: 7, bytes: 1234 })]);
  has(out, "lessons/x/lesson.html  장면 7 · 1234 B");
});

test("VO-9 URL target with bytes null: the header has no byte count", () => {
  const out = formatReport([res({ scenes: 7, bytes: null })]);
  has(out, "https://example.invalid/lesson.html  장면 7");
});

test("VO-9 same (scene, rule, msg) in two sizes: one line listing both sizes joined by '·' (C-13)", () => {
  const same = (sev) => w(3, "still-visual", sev, "그림이 움직이지 않는다");
  const out = formatReport([
    res({ size: "1440x900", viewport: [1440, 813], audit: [same("advise")] }),
    res({ size: "1280x800", viewport: [1280, 713], audit: [same("advise")] }),
  ]);
  has(out, "  장면 3 [still-visual·권고] 1440x900·1280x800: 그림이 움직이지 않는다");
  assert.equal(countLines(out, /\[still-visual·/), 1);
});

test("VO-9 same (scene, rule) with a different msg per size: one line per msg, each with its own size", () => {
  const out = formatReport([
    res({ size: "1440x900", viewport: [1440, 813], audit: [w(2, "hscroll", "fix", "가로로 160px 넘친다")] }),
    res({ size: "1280x800", viewport: [1280, 713], audit: [w(2, "hscroll", "fix", "가로로 320px 넘친다")] }),
  ]);
  has(out, "  장면 2 [hscroll·고침] 1440x900: 가로로 160px 넘친다");
  has(out, "  장면 2 [hscroll·고침] 1280x800: 가로로 320px 넘친다");
  assert.equal(countLines(out, /\[hscroll·/), 2);
});

test("VO-9 same msg in different scenes or rules is not merged", () => {
  const out = formatReport([
    res({ size: "1440x900", viewport: [1440, 813], audit: [w(2, "shrunk", "advise", "m"), w(3, "shrunk", "advise", "m"), w(3, "small-visual", "advise", "m")] }),
    res({ size: "1280x800", viewport: [1280, 713], audit: [w(2, "shrunk", "advise", "m")] }),
  ]);
  has(out, "  장면 2 [shrunk·권고] 1440x900·1280x800: m");
  has(out, "  장면 3 [shrunk·권고] 1440x900: m");
  has(out, "  장면 3 [small-visual·권고] 1440x900: m");
});

test("VO-9 lint and expect: printed once per target even when both sizes carry them (C-15); deck lint reads 'lint 덱'", () => {
  const lint = [w(2, "used-before-defined", "fix", "TTL을 먼저 썼다"), w(0, "no-theme", "fix", "theme이 없다"), w(0, "unused-term", "advise", "안 쓴 용어")];
  const exp = ["TTL 기대 2, 실제 3"];
  const out = formatReport([
    res({ size: "1440x900", viewport: [1440, 813], lint, expectFails: exp }),
    res({ size: "1280x800", viewport: [1280, 713], lint, expectFails: exp }),
  ]);
  has(out, "  lint 장면 2 [used-before-defined·고침]: TTL을 먼저 썼다");
  has(out, "  lint 덱 [no-theme·고침]: theme이 없다");
  has(out, "  lint 덱 [unused-term·권고]: 안 쓴 용어");
  has(out, "  expect: TTL 기대 2, 실제 3");
  assert.equal(countLines(out, /^\s+lint /), 3, "lint lines repeated per size");
  assert.equal(countLines(out, /^\s+expect:/), 1, "expect line repeated per size");
});

test("VO-9 line order inside a target: header, size lines, audit lines, lint lines, expect line", () => {
  const out = formatReport([res({ audit: [w(2, "hscroll", "fix", "x")], lint: [w(0, "no-theme", "fix", "t")], expectFails: ["e"] })]);
  const at = (s) => lines(out).findIndex((l) => l.includes(s));
  const order = [at("장면 5"), at("(화면 1280×713): audit 1"), at("[hscroll·고침]"), at("lint 덱"), at("expect: e")];
  assert.ok(order.every((i) => i >= 0), `lines missing: ${order}`);
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "order is not header < size < audit < lint < expect");
});

test("VO-9 error item: '<size> <target>  오류: ...' and the other target is still reported", () => {
  const ok = res({ target: "https://example.invalid/ok.html", url: "https://example.invalid/ok.html", audit: [w(1, "hscroll", "fix", "x")] });
  const bad = { target: "https://example.invalid/bad.html", size: "1280x800", url: "https://example.invalid/bad.html", error: "Chrome 실패" };
  const out = formatReport([ok, bad]);
  assert.ok(lines(out).some((l) => /^1280x800 {1,2}https:\/\/example\.invalid\/bad\.html {2}오류: Chrome 실패$/.test(l)), `no error line in:\n${out}`);
  has(out, "https://example.invalid/ok.html  장면 5");
  has(out, "  장면 1 [hscroll·고침] 1280x800: x");
});

// ---------- VO-10 exitCode decision table ----------

const fixA = () => res({ audit: [w(1, "overflow", "fix", "m")] });
const advA = () => res({ audit: [w(1, "shrunk", "advise", "m")] });
const fixL = () => res({ lint: [w(0, "no-theme", "fix", "m")] });
const advL = () => res({ lint: [w(0, "unused-term", "advise", "m")] });
const expF = () => res({ expectFails: ["e"] });
const errR = () => ({ target: "t", size: "1280x800", url: "u", error: "boom" });

for (const [id, build, want] of [
  ["error + fix audit + expect: measurement error outranks everything", () => [errR(), fixA(), expF()], 2],
  ["error only (C-17)", () => [errR()], 2],
  ["fix audit only", () => [fixA()], 1],
  ["fix lint only (C-15)", () => [fixL()], 1],
  ["expect mismatch only", () => [expF()], 1],
  ["advise audit + advise lint only (C-14, C-16)", () => [advA(), advL()], 0],
  ["advise only in one result, fix lint in another", () => [advA(), fixL()], 1],
  ["advise audit + expect mismatch", () => [advA(), expF()], 1],
  ["clean result", () => [res()], 0],
]) {
  test(`VO-10 exitCode: ${id} -> ${want}`, () => {
    assert.equal(exitCode(build()), want);
  });
}

// ---------- VO-10 USAGE ----------

function run(args, { timeout = 600_000 } = {}) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [CLI, ...args], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.stdout.setEncoding("utf8").on("data", (d) => { out += d; });
    child.stderr.setEncoding("utf8").on("data", (d) => { err += d; });
    child.on("close", (code) => { clearTimeout(timer); done({ out, err, code }); });
  });
}

test("VO-10 --help: the exit-code line says 0 = no fix needed (advice allowed), 1 = fix warning / fix lint / expect mismatch, 2 = measurement failure", async () => {
  const { out } = await run(["--help"]);
  const line = lines(out).find((l) => l.includes("종료 코드"));
  assert.ok(line, `no 종료 코드 line in:\n${out}`);
  const part = (n) => (line.split(" · ").map((s) => s.trim()).find((s) => new RegExp(`(^|:\\s*)${n}\\s`).test(s)) ?? "");
  assert.ok(/권고/.test(part(0)), `0 does not say that advice alone is fine: ${line}`);
  assert.ok(/고침/.test(part(1)) && /expect/.test(part(1)), `1 does not name fix warnings and expect mismatches: ${line}`);
  assert.ok(/Chrome|측정/.test(part(2)), `2 does not name measurement failure: ${line}`);
  assert.ok(!/경고 있음/.test(line), `old meaning "경고 있음" is still in: ${line}`);
});

// ---------- VO-10 / VO-11 end to end ----------

const HEAD = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>report fixture</title>
<link rel="stylesheet" href="/kit/vendor/katex/katex.min.css">
<script src="/kit/vendor/d3.min.js"></script>
<script src="/kit/vendor/katex/katex.min.js"></script>
<script src="/kit/ltt.js"></script>
<script src="/kit/ltt-parts.js"></script>
<script src="/kit/ltt-ui.js"></script>
<script src="/kit/ltt-deck.js"></script>
</head>
<body>
<script>
LTT.deck({ title: "report", theme: "paper", scenes: [
  { type: "hook", text: "시작" },
  { title: "넓은 칸", narration: "고정 폭 1600px 칸이 가로로 넘친다", mount(body) {
      const d = document.createElement("div");
      d.className = "wide";
      d.style.cssText = "width:1600px;height:40px;background:#ccd";
      d.textContent = "wide";
      body.appendChild(d);
  } },
  { type: "keywords", terms: [] },
] });
</script>
</body>
</html>
`;

const closedPort = () => new Promise((r) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const T = { timeout: 600_000 };
let shared = null;
async function fixture() {
  if (shared) return shared;
  shared = (async () => {
    const home = await mkdtemp(join(tmpdir(), "ltt-report-home-"));
    await mkdir(join(home, "lessons", "report-fix"), { recursive: true });
    const file = join(home, "lessons", "report-fix", "lesson.html");
    await writeFile(file, HEAD);
    const results = await audit({ targets: ["report-fix"], chrome, home, jobs: 2 });
    return { home, file, results };
  })();
  return shared;
}

test.after(async () => {
  if (shared) await rm((await shared).home, { recursive: true, force: true });
});

test("VO-9/VO-10 audit() on a fixed-width page: fix hscroll warnings, formatReport groups them per the spec, exitCode is 1", { skip: skipChrome, ...T }, async () => {
  const { file, results } = await fixture();
  assert.ok(results.length >= 2 && results.every((r) => !r.error), JSON.stringify(results.map((r) => r.error)));
  const text = formatReport(results);
  const bytes = statSync(file).size;
  const header = lines(text).find((l) => / 장면 \d+ · \d+ B$/.test(l));
  assert.ok(header, `no file header in:\n${text}`);
  assert.equal(header.match(/ 장면 (\d+) · (\d+) B$/).slice(1).map(Number).join(","), `3,${bytes}`);
  // Independent merge: group every item by (scene, rule, severity, msg), sizes in result order.
  const groups = new Map();
  for (const r of results) for (const a of r.audit) {
    const k = JSON.stringify([a.scene, a.rule, a.severity, a.msg]);
    groups.set(k, [...(groups.get(k) ?? []), r.size]);
  }
  assert.ok([...groups.keys()].some((k) => JSON.parse(k)[1] === "hscroll"), "the 1600px div did not produce an hscroll warning");
  for (const [k, sizes] of groups) {
    const [scene, rule, severity, msg] = JSON.parse(k);
    assert.ok(severity === "fix" || severity === "advise", `${rule}: severity ${severity}`);
    has(text, `  장면 ${scene} [${rule}·${grade(severity)}] ${sizes.join("·")}: ${msg}`);
  }
  assert.equal(countLines(text, /^  장면 \d+ \[/), groups.size, "audit lines are not exactly the merged groups");
  const hs = results.flatMap((r) => r.audit).filter((a) => a.rule === "hscroll");
  assert.ok(hs.every((a) => a.severity === "fix" && /div/.test(a.msg)), `hscroll warnings: ${JSON.stringify(hs)}`);
  assert.ok(hs.every((a) => (a.msg.match(/\d+/g) ?? []).map(Number).some((n) => n >= 1550 && n <= 1650)), `no width near 1600 in: ${hs.map((a) => a.msg).join(" | ")}`);
  assert.equal(exitCode(results), 1);
});

test("VO-11 audit() results keep the size array shape and add measures (one per scene) and bytes", { skip: skipChrome, ...T }, async () => {
  const { file, results } = await fixture();
  for (const r of results) assert.equal(r.bytes, statSync(file).size, "bytes is the lesson file's size");
  assert.deepEqual(results.map((r) => r.size).sort(), ["1280x800", "1440x900"]);
  for (const r of results) {
    for (const k of ["target", "size", "url", "scenes", "viewport", "audit", "lint", "expectFails", "measures"]) assert.ok(k in r, `${r.size}: ${k} missing`);
    assert.equal(r.measures.length, r.scenes);
    for (const m of r.measures) {
      assert.deepEqual(Object.keys(m).sort(), ["absorb", "floor", "zoom", "zoomBy"]);
      assert.ok(typeof m.zoom === "number" && typeof m.absorb === "number" && typeof m.floor === "boolean" && (m.zoomBy === null || typeof m.zoomBy === "string"));
    }
    for (const x of [...r.audit, ...r.lint]) assert.ok(x.severity === "fix" || x.severity === "advise", `${x.rule}: ${x.severity}`);
  }
});

test("VO-10 CLI: a page with a fix warning exits 1 and prints grade-tagged lines (C-11)", { skip: skipChrome, ...T }, async () => {
  const { home } = await fixture();
  const r = await run(["report-fix", "--home", home, "--chrome", chrome]);
  assert.equal(r.code, 1, r.out + r.err);
  assert.match(r.out, /^  장면 2 \[hscroll·고침\] /m);
  assert.match(r.out, / 장면 3 · \d+ B$/m);
});

test("VO-10 CLI: only advisory warnings (gallery page cache-ttl) exits 0 and still prints 권고 lines (C-14)", { skip: skipChrome, ...T }, async () => {
  const baseline = JSON.parse(readFileSync(new URL("./gallery-audit.baseline.json", import.meta.url), "utf8"));
  assert.ok(baseline["still-visual"]["1440x900"]["cache-ttl.html"] > 0, "baseline has no still-visual to show");
  const r = await run(["site/gallery/cache-ttl.html", "--chrome", chrome]);
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /\[still-visual·권고\]/);
  assert.equal(countLines(r.out, /·고침\]/), 0, "a fix-graded line in an advisory-only run");
});

test("VO-10 CLI: a target that cannot be measured exits 2 with an 오류 line (C-17)", { skip: skipChrome, ...T }, async () => {
  const url = `http://127.0.0.1:${await closedPort()}/missing.html`;
  const r = await run([url, "--chrome", chrome]);
  assert.equal(r.code, 2, r.out + r.err);
  assert.match(r.out, /오류: /);
});

test("VO-11 audit() on a URL target: bytes is null and measures are still present", { skip: skipChrome, ...T }, async () => {
  const { home } = await fixture();
  const server = createLttServer({ home });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const url = `http://127.0.0.1:${server.address().port}/lessons/report-fix/lesson.html`;
    const results = await audit({ targets: [url], sizes: ["1280x800"], chrome, home, jobs: 1 });
    assert.equal(results.length, 1);
    assert.ok(!results[0].error, results[0].error);
    assert.equal(results[0].bytes, null);
    assert.equal(results[0].measures.length, results[0].scenes);
    assert.doesNotMatch(formatReport(results).split("\n")[0], / B$/, "a URL header printed a byte count");
  } finally {
    await new Promise((r) => server.close(r));
  }
});
