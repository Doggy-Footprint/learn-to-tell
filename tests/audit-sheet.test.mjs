// Spec a96c8781ab82e025 v3 (audit contact sheet): VO-1..VO-12 end to end (VO-13 is the Test command, VO-14 and R-2 are review).
// Fixture lessons (tests/fixtures/sheet/) are written into a temp home and served by audit itself. Expected beats, cell selections (FR-3) and
// cell colours come from the fixtures' own beat windows; sheet JPEGs are decoded by headless Chrome through a canvas, never by the audit module.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { audit, findChrome, galleryTargets } from "../skills/learn-to-tell/server/audit.mjs";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CLI = join(ROOT, "skills/learn-to-tell/server/audit.mjs");
const FIX = fileURLToPath(new URL("./fixtures/sheet/", import.meta.url));
const SHEETS = join(tmpdir(), "ltt-audit-sheets");
const chrome = findChrome();
const skip = process.env.LTT_AUDIT === "0" ? "LTT_AUDIT=0"
  : process.env.CI && process.env.LTT_AUDIT !== "1" ? "CI without LTT_AUDIT=1"
  : !chrome ? "no Chrome found (set LTT_CHROME)"
  : false;
const T = { timeout: 900_000 };
const JOBS = 2;
const PALETTE = ["#808080", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#000000"];
const LONG = "가나다라마바사아자차카타파하".repeat(5);

// ---------- harness ----------

function run(cmd, args, { env, timeout = 600_000 } = {}) {
  return new Promise((done) => {
    const child = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.stdout.setEncoding("utf8").on("data", (d) => { out += d; });
    child.stderr.setEncoding("utf8").on("data", (d) => { err += d; });
    child.on("close", (code) => { clearTimeout(timer); done({ out, err, code }); });
  });
}

const cli = (args, env) => run(process.execPath, [CLI, ...args], { env });
const lastLine = (out) => out.trimEnd().split("\n").at(-1);
const sheetLines = (out) => out.split("\n").filter((l) => l.startsWith("sheet "));

const HEAD = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>sheet fixture</title>
<link rel="stylesheet" href="/kit/vendor/katex/katex.min.css">
<script src="/kit/vendor/d3.min.js"></script>
<script src="/kit/vendor/katex/katex.min.js"></script>
<script src="/kit/ltt.js"></script>
<script src="/kit/ltt-parts.js"></script>
<script src="/kit/ltt-ui.js"></script>
<script src="/kit/ltt-deck.js"></script>
</head>
<body>
`;

async function writeLesson(home, id, deckFile) {
  const dir = join(home, "lessons", id);
  await mkdir(dir, { recursive: true });
  const lib = await readFile(join(FIX, "lib.js"), "utf8");
  const deck = await readFile(join(FIX, deckFile), "utf8");
  await writeFile(join(dir, "lesson.html"), `${HEAD}<script>\n${lib}\n</script>\n<script>\n${deck}\n</script>\n</body>\n</html>\n`);
  return dir;
}

const newHome = () => mkdtemp(join(tmpdir(), "ltt-sheet-test-"));

async function withServer(home, fn) {
  const server = createLttServer({ home });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    return await fn(server.address().port);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

async function chromeDump(url, { size = "1280,800", budget = 8000 } = {}) {
  const profile = await mkdtemp(join(tmpdir(), "ltt-sheet-chrome-"));
  try {
    const { out } = await run(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
      "--allow-file-access-from-files", `--user-data-dir=${profile}`, `--window-size=${size}`, `--virtual-time-budget=${budget}`, "--dump-dom", url],
    { timeout: 180_000 });
    return out;
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
}

const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

// Independent read of the kit's ?audit JSON and the scene attributes, from our own server (not the audit module).
async function kitAudit(home, id) {
  return withServer(home, async (port) => {
    let out = "";
    for (let budget = 8000; budget <= 72_000 && !/id="ltt-audit"/.test(out); budget *= 3) out = await chromeDump(`http://127.0.0.1:${port}/lessons/${id}/lesson.html?audit`, { budget });
    const m = out.match(/<script[^>]*id="ltt-audit"[^>]*>([\s\S]*?)<\/script>/);
    assert.ok(m, `no #ltt-audit in dump of ${id}`);
    const json = JSON.parse(m[1]);
    const attrs = [...out.matchAll(/<section\b[^>]*class="[^"]*dk-scene[^"]*"[^>]*>/g)].map((s) => {
      const a = s[0].match(/data-ltt-beats="([^"]*)"/);
      return a ? JSON.parse(unescape(a[1])) : null;
    });
    return { json, attrs };
  });
}

function jpegSize(buf) {
  assert.ok(buf[0] === 0xff && buf[1] === 0xd8, "JPEG magic FF D8 missing");
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { i += m === 0xff ? 1 : 2; continue; }
    if (m === 0xc0 || m === 0xc1 || m === 0xc2) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error("no SOF marker");
}

// Decodes a JPEG in headless Chrome and returns [r,g,b] at each integer point.
async function pixels(file, points) {
  const dir = await mkdtemp(join(tmpdir(), "ltt-sheet-px-"));
  try {
    const b64 = (await readFile(file)).toString("base64");
    const page = join(dir, "px.html");
    await writeFile(page, `<!doctype html><body><pre id="R"></pre><script>
const P = ${JSON.stringify(points.map(([x, y]) => [Math.round(x), Math.round(y)]))};
const img = new Image();
img.onload = () => { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
  document.getElementById("R").textContent = JSON.stringify(P.map(([x, y]) => { const k = (y * c.width + x) * 4; return [d[k], d[k + 1], d[k + 2]]; })); };
img.src = "data:image/jpeg;base64,${b64}";
</script></body>`);
    const out = await chromeDump(pathToFileURL(page).href, { budget: 2000 });
    const m = out.match(/<pre id="R">([^<]+)<\/pre>/);
    assert.ok(m, `pixel page produced no data for ${file}`);
    return JSON.parse(m[1]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// [x, y] point per cell at fraction (fx, fy) of its capture rect, decoded per file.
async function cellPixels(sheet, cells, fx = 0.5, fy = 0.5) {
  const out = new Map();
  for (const f of sheet.files) {
    const cs = cells.filter((c) => c.file === f);
    if (!cs.length) continue;
    const px = await pixels(f, cs.map((c) => [c.x + c.w * fx, c.y + c.h * fy]));
    cs.forEach((c, i) => out.set(c, px[i]));
  }
  return out;
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const near = (a, b, tol = 40) => a.every((v, i) => Math.abs(v - b[i]) <= tol);

// FR-3, computed here from the spec formula.
function pickBeats(beats) {
  const texted = beats.filter((b) => b.text != null && b.text !== "");
  const pool = (texted.length ? texted : beats).slice().sort((a, b) => a.t - b.t);
  if (!pool.length) return [{ t: null, text: null }];
  const sel = pool.length <= 4 ? pool : [0, 1, 2, 3].map((k) => pool[Math.round((k * (pool.length - 1)) / 3)]);
  return sel.map((b) => ({ t: b.t, text: b.text ?? null }));
}

const warnUnion = (results, target, scene) => [...new Set(results.filter((r) => r.target === target && !r.error).flatMap((r) => [
  ...r.audit.filter((w) => w.scene === scene).map((w) => w.rule),
  ...r.lint.filter((w) => w.scene != null && w.scene === scene).map((w) => w.rule || "lint"),
]))].sort();

const byScene = (cells) => {
  const m = new Map();
  for (const c of cells) m.set(c.scene, [...(m.get(c.scene) ?? []), c]);
  return m;
};

// FR-8 / QR-2 checks shared by every sheet this file produces.
async function checkLayout(sheet, viewport, label) {
  assert.ok(sheet.files.length >= 1, `${label}: no sheet files`);
  sheet.files.forEach((f, i) => assert.equal(f, join(sheet.dir, i === 0 ? "sheet.jpg" : `sheet-${i + 1}.jpg`), `${label}: file name ${i}`));
  const dims = {};
  for (const f of sheet.files) {
    const buf = readFileSync(f);
    const d = jpegSize(buf);
    dims[f] = d;
    assert.ok(Math.max(d.w, d.h) <= 1568, `${label}: ${f} long side ${Math.max(d.w, d.h)} > 1568`);
    assert.ok(d.w * d.h <= 1_200_000, `${label}: ${f} area ${d.w * d.h} > 1,200,000`);
  }
  const want = viewport[0] / viewport[1];
  for (const c of sheet.cells) {
    const d = dims[c.file];
    assert.ok(d, `${label}: cell file ${c.file} not in files`);
    assert.ok(c.w >= 280, `${label}: scene ${c.scene} cell width ${c.w} < 280`);
    assert.ok(Math.abs(c.w / c.h / want - 1) <= 0.02, `${label}: scene ${c.scene} cell aspect ${c.w / c.h} vs ${want}`);
    assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= d.w && c.y + c.h <= d.h, `${label}: scene ${c.scene} cell outside ${c.file}`);
  }
  for (const f of sheet.files) {
    const cs = sheet.cells.filter((c) => c.file === f);
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const a = cs[i], b = cs[j];
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      assert.ok(!overlap, `${label}: cells ${i} and ${j} overlap in ${f}`);
    }
  }
  for (const [s, cs] of byScene(sheet.cells)) assert.equal(new Set(cs.map((c) => c.file)).size, 1, `${label}: scene ${s} split across files`);
  const fileIdx = (c) => sheet.files.indexOf(c.file);
  for (let i = 1; i < sheet.cells.length; i++) {
    const a = sheet.cells[i - 1], b = sheet.cells[i];
    assert.ok(b.scene >= a.scene, `${label}: scene order ${a.scene} -> ${b.scene}`);
    assert.ok(fileIdx(b) >= fileIdx(a), `${label}: file order`);
    if (fileIdx(a) === fileIdx(b)) {
      const sameRow = Math.abs(b.y - a.y) < a.h / 2 && b.x >= a.x + a.w;
      const nextRow = b.y >= a.y + a.h;
      assert.ok(sameRow || nextRow, `${label}: cell ${i} (scene ${b.scene}) not in reading order after scene ${a.scene}`);
    }
  }
  return dims;
}

async function rmSheetDir(sheet) {
  if (!sheet?.dir || !existsSync(sheet.dir)) return;
  const real = realpathSync(sheet.dir);
  if (existsSync(SHEETS) && real.startsWith(realpathSync(SHEETS) + sep)) await rm(sheet.dir, { recursive: true, force: true });
}

const closedPort = () => new Promise((r) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });

// ---------- fixtures' own expectations ----------

const w = (k, text) => (text === undefined ? { t: 1000 * k } : { t: 1000 * k, text });
const MAIN_TYPES = ["hook", "figure", "figure", "figure", "figure", "figure", "figure", "figure", "figure", "figure", "statement", "keywords"];
const MAIN_BEATS = [
  [], [],
  [w(1, "첫째"), w(2, "둘째")],
  [w(1), w(2), w(3)],
  [w(1, "a1"), w(2, LONG), w(3, "a3"), w(4, "a4")],
  [1, 2, 3, 4, 5].map((k) => w(k, "b" + k)),
  [1, 2, 3, 4, 5, 6, 7].map((k) => w(k, "c" + k)),
  [w(1), w(2, "섞임")],
  // C-12: textless→texted at 300, texted→texted at 500, textless→textless at 700, texted→textless at 900; 200 is untouched.
  [{ t: 200, text: "다른" }, { t: 300, text: "뒤글" }, { t: 500, text: "먼저" }, { t: 700 }, { t: 900, text: "남음" }],
  [{ t: 300, text: "둘째" }],
  [], [],
];
const COLOUR_SCENES = new Set([2, 3, 4, 5, 6, 7, 8]);

const state = {};

test.after(async () => {
  for (const h of Object.values(state).filter((v) => v?.home)) await rm(h.home, { recursive: true, force: true });
});

// ---------- VO-10 / VO-4 (FR-12) kit surface ----------

test("VO-10 C-12 + VO-4 C-13: kit merges same-t beats and exposes scene types", { skip, ...T }, async () => {
  const home = await newHome();
  state.main = { home };
  await writeLesson(home, "sheet-main", "main.js");
  const { json, attrs } = await kitAudit(home, "sheet-main");
  state.main.viewport = json.viewport;
  assert.deepEqual(json.types, MAIN_TYPES, "#ltt-audit types (C-13)");
  assert.deepEqual(json.beats, MAIN_BEATS, "#ltt-audit beats (C-12 and fixture beat ends)");
  assert.deepEqual(attrs.map((a) => a ?? []), MAIN_BEATS, "section data-ltt-beats");
});

// ---------- VO-2 / VO-3 / VO-4 / VO-5 / VO-9 on the main lesson ----------

test("VO-2 VO-3 VO-4 VO-9 C-1 C-2 C-3: cells follow FR-3, show the beat-end colour, carry labels", { skip, ...T }, async () => {
  const home = state.main?.home;
  assert.ok(home, "VO-10 fixture setup did not run");
  const results = await audit({ targets: ["sheet-main"], chrome, home, jobs: JOBS, sheet: true });
  const r = results.find((x) => x.size === "1280x800");
  assert.ok(r && !r.error, `no clean 1280x800 result: ${r?.error}`);
  const sheet = r.sheet;
  assert.ok(sheet, "1280x800 result has no sheet");
  assert.equal(sheet.size, "1280x800");
  assert.equal(sheet.error, null);
  assert.equal(sheet.failed, 0);
  assert.equal(realpathSync(sheet.dir), realpathSync(join(home, "lessons", "sheet-main", "audit")));

  // VO-2: per scene t/text lists equal FR-3 applied to the fixture beats (bit 0, texted 4/5/7, textless 3, mixed).
  const got = byScene(sheet.cells);
  MAIN_BEATS.forEach((beats, i) => {
    const s = i + 1;
    const want = pickBeats(beats);
    const cs = got.get(s) ?? [];
    assert.deepEqual(cs.map((c) => c.t), want.map((b) => b.t), `scene ${s} cell times`);
    cs.forEach((c, j) => {
      const wt = want[j].text;
      assert.equal(c.text, wt, `scene ${s} cell ${j} text`);
      assert.equal(c.type, MAIN_TYPES[i], `scene ${s} type`);
      assert.equal(c.failed, false);
    });
  });
  assert.equal(sheet.cells.length, MAIN_BEATS.reduce((n, b) => n + pickBeats(b).length, 0), "total cell count");

  // VO-4: warn = sorted dedup union over sizes; both badge partitions present.
  for (const c of sheet.cells) assert.deepEqual(c.warn, warnUnion(results, r.target, c.scene), `scene ${c.scene} warn`);
  assert.ok(sheet.cells.some((c) => c.warn.length) && sheet.cells.some((c) => !c.warn.length), "fixture must cover badge present and absent");

  // VO-9 + VO-5 limits.
  await checkLayout(sheet, state.main.viewport, "main");

  // VO-3: centre colour of every colour-scene cell; VO-4: label bands above/below the capture contain contrast.
  for (const f of sheet.files) {
    const cs = sheet.cells.filter((c) => c.file === f);
    const { w: W, h: H } = jpegSize(readFileSync(f));
    const pts = [];
    const bands = [];
    for (const c of cs) {
      pts.push([c.x + c.w / 2, c.y + c.h / 2]);
      const band = [];
      for (const dy of [-24, -18, -12, -6, c.h + 4, c.h + 10, c.h + 16, c.h + 22]) for (let k = 1; k < 16; k++) {
        const x = c.x + (c.w * k) / 16, y = c.y + dy;
        if (y >= 0 && y < H && x < W) band.push([x, y]);
      }
      bands.push([pts.length, band.length]);
      pts.push(...band);
    }
    const px = await pixels(f, pts);
    let at = 0;
    cs.forEach((c, i) => {
      const centre = px[at];
      const band = px.slice(at + 1, at + 1 + bands[i][1]);
      at += 1 + bands[i][1];
      if (COLOUR_SCENES.has(c.scene)) {
        const want = c.t == null ? PALETTE[0] : PALETTE[c.t / 1000];
        assert.ok(near(centre, hex(want)), `scene ${c.scene} t=${c.t}: centre ${centre} not ${want}`);
      }
      const contrast = band.some((p) => band.some((q) => !near(p, q)));
      assert.ok(contrast, `scene ${c.scene} t=${c.t}: label band has no contrast`);
    });
  }
  state.main.results = results;
});

// ---------- VO-3 FR-4 rest cell at the --budget time (F-2) ----------

test("VO-3 FR-4: a no-beat cell is captured at the budget time", { skip, ...T }, async () => {
  const home = await newHome();
  state.late = { home };
  await writeLesson(home, "sheet-late", "late.js");
  const { json } = await kitAudit(home, "sheet-late");
  assert.deepEqual(json.beats[1], [], "late scene must expose no beats");
  for (const [budget, colour] of [[2000, "#808080"], [6000, "#0000ff"]]) {
    const results = await audit({ targets: ["sheet-late"], sizes: ["1280x800"], chrome, home, jobs: JOBS, sheet: true, budget });
    const sheet = results[0].sheet;
    assert.ok(sheet && !sheet.error, `sheet: ${sheet?.error}`);
    const cells = sheet.cells.filter((c) => c.scene === 2);
    assert.deepEqual(cells.map((c) => c.t), [null]);
    const [[, p]] = await cellPixels(sheet, cells);
    assert.ok(near(p, hex(colour)), `rest cell ${p} at budget ${budget} is not ${colour} (repaint at 3000 ms)`);
  }
});

// ---------- VO-5 C-4 ----------

test("VO-5 C-4: a 25-scene lesson splits into sheets within the FR-8 limits", { skip, ...T }, async () => {
  const home = await newHome();
  state.many = { home };
  await writeLesson(home, "sheet-many", "many.js");
  const { json } = await kitAudit(home, "sheet-many");
  assert.equal(json.beats.length, 25);
  const results = await audit({ targets: ["sheet-many"], sizes: ["1280x800"], chrome, home, jobs: JOBS, sheet: true });
  const sheet = results[0].sheet;
  assert.ok(sheet && !sheet.error, `sheet: ${sheet?.error}`);
  assert.ok(sheet.files.length >= 2, `expected ≥2 sheets, got ${sheet.files.length}`);
  assert.deepEqual([...new Set(sheet.cells.map((c) => c.scene))], Array.from({ length: 25 }, (_, i) => i + 1));
  await checkLayout(sheet, json.viewport, "many");
});

// ---------- VO-6 C-5 C-6 ----------

test("VO-6 C-5 C-6: sheet size decision table and warn union", { skip, ...T }, async (t) => {
  const home = await newHome();
  state.small = { home };
  await writeLesson(home, "sheet-small", "small.js");
  const table = [[["1440x900", "1280x800"], "1280x800"], [["1440x900"], "1440x900"], [["1280x800", "1440x900"], "1280x800"]];
  for (const [sizes, want] of table) {
    const results = await audit({ targets: ["sheet-small"], sizes, chrome, home, jobs: JOBS, sheet: true });
    assert.deepEqual(results.map((r) => r.size).sort(), [...sizes].sort());
    for (const r of results) {
      if (r.size === want) {
        assert.ok(r.sheet, `${sizes}: ${r.size} lacks sheet`);
        assert.equal(r.sheet.size, want);
        for (const c of r.sheet.cells) assert.deepEqual(c.warn, warnUnion(results, r.target, c.scene), `${sizes}: scene ${c.scene} warn`);
      } else assert.equal(r.sheet, undefined, `${sizes}: ${r.size} must not carry sheet`);
    }
    if (results.length === 2) {
      // C-6: small.js scene 3 (the 860 px block) must warn at one size only; that rule must still reach the sheet badge.
      const rules = results.map((r) => new Set(r.audit.filter((x) => x.scene === 3).map((x) => x.rule)));
      const oneSided = [...new Set([...rules[0], ...rules[1]])].filter((x) => rules[0].has(x) !== rules[1].has(x));
      assert.ok(oneSided.length, `${sizes}: fixture scene 3 no longer warns at only one size (${[...rules[0]]} / ${[...rules[1]]})`);
      t.diagnostic(`${sizes}: scene 3 one-size rules ${oneSided}`);
      const sheetItem = results.find((r) => r.size === want);
      const warn3 = sheetItem.sheet.cells.filter((c) => c.scene === 3).map((c) => c.warn);
      assert.ok(warn3.length, "scene 3 has no cell");
      for (const w of warn3) for (const rule of oneSided) assert.ok(w.includes(rule), `${sizes}: scene 3 warn ${w} lacks ${rule}`);
    }
  }
});

// ---------- VO-7 C-8 ----------

test("VO-7 C-8: only sheet(-n).jpg files are replaced", { skip, ...T }, async () => {
  const home = state.small?.home ?? await newHome();
  if (!state.small) { state.small = { home }; await writeLesson(home, "sheet-small", "small.js"); }
  const dir = join(home, "lessons", "sheet-small", "audit");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const f of ["sheet.jpg", "sheet-2.jpg", "sheet-3.jpg", "notes.txt", "sheets.jpg"]) await writeFile(join(dir, f), "old " + f);
  const results = await audit({ targets: ["sheet-small"], sizes: ["1280x800"], chrome, home, jobs: JOBS, sheet: true });
  assert.equal(results[0].sheet.files.length, 1, "fixture must produce one sheet");
  assert.deepEqual((await readdir(dir)).sort(), ["notes.txt", "sheet.jpg", "sheets.jpg"]);
  assert.equal(await readFile(join(dir, "notes.txt"), "utf8"), "old notes.txt");
  assert.equal(await readFile(join(dir, "sheets.jpg"), "utf8"), "old sheets.jpg");
  const buf = await readFile(join(dir, "sheet.jpg"));
  assert.ok(buf[0] === 0xff && buf[1] === 0xd8, "sheet.jpg was not rewritten");
});

// ---------- VO-1 C-1 C-7 C-11 ----------

test("VO-1 C-1 C-7 C-11: CLI partitions lesson+flag, gallery+flag, no flag", { skip, ...T }, async () => {
  const home = await newHome();
  state.cli = { home };
  await writeLesson(home, "sheet-small", "small.js");
  const auditDir = join(home, "lessons", "sheet-small", "audit");
  const base = ["--home", home, "--chrome", chrome];

  // P3 first, so the audit/ dir cannot pre-exist. FR-1: Chrome calls are logged through a wrapper; without --sheet only ?audit calls happen.
  const log = join(home, "chrome-calls.log");
  const logger = join(home, "chrome-logger.sh");
  await writeFile(logger, `#!/bin/sh\nprintf '%s\\n' "$*" >> ${JSON.stringify(log)}\nexec ${JSON.stringify(chrome)} "$@"\n`);
  await chmod(logger, 0o755);
  const plain = await cli(["sheet-small", "--home", home, "--chrome", logger]);
  const calls = (await readFile(log, "utf8")).trimEnd().split("\n");
  assert.equal(sheetLines(plain.out).length, 0, "no-flag run printed a sheet line");
  assert.ok(!existsSync(auditDir), "no-flag run created audit/");
  const plainJson = await cli(["sheet-small", "--json", ...base]);
  const baseline = JSON.parse(plainJson.out);
  assert.ok(calls.length >= baseline.length, `${calls.length} Chrome calls < ${baseline.length} targets×sizes`);
  for (const c of calls) {
    assert.ok(c.includes("/lessons/sheet-small/lesson.html?audit"), `non-audit Chrome call without --sheet: ${c}`);
    assert.ok(!/lesson\.html#\d+(\s|$)/.test(c), `capture-shaped call without --sheet: ${c}`);
  }
  assert.ok(baseline.every((r) => !("sheet" in r)), "no-flag --json has sheet field");
  assert.ok(!existsSync(auditDir));

  // P1
  const lesson = await cli(["sheet-small", "--sheet", ...base]);
  const line = lastLine(lesson.out);
  const m = line.match(/^sheet (.+?): (\/.+)$/);
  assert.ok(m, `last line is not a sheet line: ${line}`);
  const paths = m[2].split(" ");
  for (const p of paths) {
    assert.ok(existsSync(p), `${p} missing`);
    assert.equal(realpathSync(dirname(p)), realpathSync(auditDir));
  }
  assert.equal(lesson.code, plain.code, "exit code changed by --sheet");
  const withJson = JSON.parse((await cli(["sheet-small", "--json", "--sheet", ...base])).out);
  const sized = withJson.filter((r) => r.sheet);
  assert.deepEqual(sized.map((r) => r.size), ["1280x800"]);
  const strip = (rs) => rs.map((r) => ({ target: r.target, size: r.size, audit: r.audit, lint: r.lint, expectFails: r.expectFails }));
  assert.deepEqual(strip(withJson), strip(baseline), "audit results differ with --sheet");

  // P2
  const gallery = "site/gallery/philosophy/trolley-ethics.html";
  const g = await cli([gallery, "--json", "--sheet", ...base]);
  const gs = JSON.parse(g.out).find((r) => r.sheet)?.sheet;
  try {
    assert.ok(gs, "gallery run has no sheet");
    assert.equal(dirname(gs.dir), SHEETS);
    assert.match(gs.dir.slice(SHEETS.length + 1), /^[\w.-]+$/);
    assert.deepEqual([...new Set(gs.cells.map((c) => c.scene))], [1, 2, 3, 4]);
    for (const f of gs.files) assert.ok(existsSync(f));
  } finally {
    await rmSheetDir(gs);
  }
  const gt = await cli([gallery, "--sheet", ...base]);
  const gl = lastLine(gt.out);
  assert.match(gl, /^sheet .+: \//);
  const gp = gl.replace(/^sheet .+?: /, "").split(" ");
  try {
    for (const p of gp) assert.equal(dirname(dirname(p)), SHEETS);
  } finally {
    await rmSheetDir({ dir: dirname(gp[0]) });
  }
});

// ---------- VO-8 C-9 C-10 C-14 ----------

test("VO-8 C-9 C-10 C-14: cell failure, composition failure, target error", { skip, ...T }, async () => {
  const home = await newHome();
  state.err = { home };
  await writeLesson(home, "sheet-small", "small.js");
  const base = ["--home", home, "--chrome", chrome];
  const plain = await cli(["sheet-small", ...base]);

  // (a) per the Signatures call contract: capture calls carry `#<scene>` and no `?audit`.
  const wrapper = join(home, "chrome-wrapper.sh");
  await writeFile(wrapper, `#!/bin/sh
for a in "$@"; do case "$a" in *'?audit'*) exec ${JSON.stringify(chrome)} "$@";; esac; done
for a in "$@"; do case "$a" in *'#3') exit 1;; esac; done
exec ${JSON.stringify(chrome)} "$@"
`);
  await chmod(wrapper, 0o755);
  const wb = ["--home", home, "--chrome", wrapper];
  const failed = await cli(["sheet-small", "--json", "--sheet", ...wb]);
  const sheet = JSON.parse(failed.out).find((r) => r.sheet).sheet;
  const bad = sheet.cells.filter((c) => c.failed);
  assert.ok(bad.length >= 1 && bad.every((c) => c.scene === 3), "only scene 3 cells fail");
  assert.deepEqual(sheet.cells.filter((c) => c.scene === 3).map((c) => c.failed), sheet.cells.filter((c) => c.scene === 3).map(() => true));
  assert.ok(sheet.cells.filter((c) => c.scene !== 3).every((c) => c.failed === false), "QR-4: other cells fine");
  // QR-4: colour scenes of small.js (2: beats ending 1000/2000 ms, 4: still grey) still show their oracle colours.
  const centres = await cellPixels(sheet, sheet.cells.filter((c) => c.scene === 2 || c.scene === 4));
  for (const [c, p] of centres) {
    const want = c.scene === 4 ? PALETTE[0] : PALETTE[c.t / 1000];
    assert.ok(near(p, hex(want)), `scene ${c.scene} t=${c.t}: centre ${p} not ${want} next to a failed cell`);
  }
  assert.equal(centres.size, sheet.cells.filter((c) => c.scene === 2 || c.scene === 4).length);
  for (const [c, p] of await cellPixels(sheet, bad, 0.15, 0.5)) {
    const grey = Math.max(...p) - Math.min(...p) <= 40 && p.every((v) => v >= 140 && v <= 220);
    assert.ok(grey, `failed cell scene ${c.scene}: ${p} is not the grey placeholder`);
  }
  assert.equal(sheet.failed, bad.length);
  assert.equal(sheet.error, null);
  for (const f of sheet.files) jpegSize(readFileSync(f));
  const text = await cli(["sheet-small", "--sheet", ...wb]);
  assert.ok(lastLine(text.out).endsWith(`(칸 ${bad.length}개 촬영 실패)`), lastLine(text.out));
  assert.equal(text.code, plain.code, "cell failure changed the exit code");

  // (b) audit/ is a regular file.
  await rm(join(home, "lessons", "sheet-small", "audit"), { recursive: true, force: true });
  await writeFile(join(home, "lessons", "sheet-small", "audit"), "not a dir");
  await writeLesson(home, "sheet-ok", "small.js");
  const comp = await cli(["sheet-small", "sheet-ok", "--sheet", ...base]);
  const tail = comp.out.trimEnd().split("\n").slice(-2);
  assert.ok(tail.every((l) => l.startsWith("sheet ")), `last two lines are not sheet lines: ${tail}`);
  const errLines = tail.filter((l) => /^sheet .+: 오류: .+/.test(l));
  assert.equal(errLines.length, 1, `exactly one 오류 line: ${tail}`);
  const okLine = tail.find((l) => !errLines.includes(l));
  const okPaths = okLine.replace(/^sheet .+?: /, "").split(" ");
  for (const p of okPaths) {
    assert.ok(existsSync(p), `${p} missing`);
    assert.equal(realpathSync(dirname(p)), realpathSync(join(home, "lessons", "sheet-ok", "audit")));
  }
  assert.equal(comp.code, 2);
  const compApi = await audit({ targets: ["sheet-small"], sizes: ["1280x800"], chrome, home, jobs: JOBS, sheet: true });
  assert.ok(compApi[0].sheet && typeof compApi[0].sheet.error === "string" && compApi[0].sheet.error.length, "sheet.error not set");
  assert.ok(compApi[0].audit, "audit results kept");

  // (c) target audit error.
  const url = `http://127.0.0.1:${await closedPort()}/missing.html`;
  const te = await cli([url, "--sheet", ...base]);
  assert.equal(sheetLines(te.out).length, 0, "sheet line for an errored target");
  assert.equal(te.code, 2);
  const teJson = JSON.parse((await cli([url, "--json", "--sheet", ...base])).out);
  assert.ok(teJson.every((r) => r.error && !("sheet" in r)));
});

// ---------- VO-12 QR-5 ----------

test("VO-12 QR-5: URL label with .. / : stays under the sheet tmp dir", { skip, ...T }, async () => {
  const home = await newHome();
  state.url = { home };
  await writeLesson(home, "sheet-small", "small.js");
  await withServer(home, async (port) => {
    const url = `http://127.0.0.1:${port}/lessons/x/../../lessons/sheet-small/lesson.html`;
    const results = await audit({ targets: [url], sizes: ["1280x800"], chrome, home, jobs: JOBS, sheet: true });
    const sheet = results[0].sheet;
    try {
      assert.ok(sheet && !sheet.error, `sheet: ${sheet?.error}`);
      const real = realpathSync(sheet.dir);
      assert.ok(real.startsWith(realpathSync(SHEETS) + sep), `${real} escapes ${SHEETS}`);
      for (const f of sheet.files) assert.ok(realpathSync(f).startsWith(real + sep));
    } finally {
      await rmSheetDir(sheet);
    }
  });
});

// ---------- VO-11 QR-1 ----------

test("VO-11 QR-1: --sheet adds ≤60 s on ontology-triples", { skip, ...T }, async () => {
  const target = galleryTargets().find((t) => String(t).includes("ontology-triples"));
  assert.ok(target, "ontology-triples not in galleryTargets()");
  const home = await newHome();
  state.time = { home };
  let t0 = Date.now();
  await audit({ targets: [target], sizes: ["1280x800"], chrome, home });
  const plain = Date.now() - t0;
  t0 = Date.now();
  const results = await audit({ targets: [target], sizes: ["1280x800"], chrome, home, sheet: true });
  const withSheet = Date.now() - t0;
  const sheet = results[0].sheet;
  try {
    assert.ok(sheet && !sheet.error);
    assert.ok(withSheet - plain <= 60_000, `--sheet added ${(withSheet - plain) / 1000}s`);
  } finally {
    await rmSheetDir(sheet);
  }
});
