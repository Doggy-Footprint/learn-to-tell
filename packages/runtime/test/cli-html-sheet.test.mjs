// VO-12 (FR-16, FR-17, FR-29, C-35..C-38, QR-3) ltt html / serve / sheet as child processes plus a Chrome render of the html output.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { LESSONS_DIR, EXAMPLE, CORE, RT, ROOT, ltt, lttAsync, copyLesson, writeLesson, readLog, globalScenes, importFile, tmpdir } from "./fixtures/m1.mjs";
import { buildSite, serve, launch, open } from "./fixtures/browser.mjs";

const { load } = await import(CORE);
const exampleScenes = globalScenes(load(await importFile(EXAMPLE)).input).length;

const THROWING = `export default (api) => api.lesson({
  meta: { title: "t", objectives: [{ id: "o1", text: "x" }], learner: { knows: [], misconceptions: [] }, domains: ["d"] },
  checks: [], models: {},
  figures: {
    ok: api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [api.dot([0.5, 0.5], { id: "a" })]),
    boom: api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [
      api.custom({ id: "c", why: "render throws on purpose", bounds: [[0, 0], [1, 1]] }, () => { throw new Error("render exploded"); }),
    ]),
  },
  sections: [{ concept: { id: "k", title: "k", definition: "d", level: 1 }, scenes: [
    { type: "hook", title: "정상", say: "정상 장면.", figure: "ok", focus: ["a"] },
    { type: "explain", title: "깨짐", say: "렌더 중 예외.", figure: "boom", focus: [] },
    { type: "explain", title: "다시 정상", say: "정상 장면.", figure: "ok", focus: ["a"] },
  ] }],
  quiz: [], summary: { figures: ["ok"] },
});
`;

test("VO-12 C-35 ltt html: index.html, lesson.js copy, ltt/ with runtime bundle and font; exit 0; log line", () => {
  const f = copyLesson(EXAMPLE);
  const out = path.join(path.dirname(f), "site");
  const r = ltt(["html", f, "--out", out]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(out, "index.html")));
  assert.deepEqual(fs.readFileSync(path.join(out, "lesson.js")), fs.readFileSync(EXAMPLE));
  const files = fs.readdirSync(path.join(out, "ltt"), { recursive: true }).map(String);
  assert.ok(files.some((x) => x.endsWith("ltt-runtime.js")), "runtime bundle");
  assert.ok(files.some((x) => /\.(woff2?|ttf|otf)$/.test(x)), "font files");
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  assert.match(html, /lesson\.js/);
  assert.match(html, /ltt-runtime\.js/);
  const log = readLog(f);
  assert.equal(log.at(-1).cmd, "html");
  assert.equal(log.at(-1).exit, 0);
});
test("VO-12 ltt html errors: missing lesson -> 2 (no output dir), missing --out -> 2", () => {
  const dir = tmpdir();
  const r = ltt(["html", path.join(dir, "nope.js"), "--out", path.join(dir, "o")]);
  assert.equal(r.status, 2);
  assert.ok(!fs.existsSync(path.join(dir, "o")));
  assert.equal(ltt(["html", copyLesson(EXAMPLE)]).status, 2);
});
test("VO-12 ltt html on a factory that throws still writes output (error shown in browser)", () => {
  const f = writeLesson(`export default () => { throw new Error("boom"); };\n`);
  const out = path.join(path.dirname(f), "site");
  assert.equal(ltt(["html", f, "--out", out]).status, 0);
  assert.ok(fs.existsSync(path.join(out, "index.html")));
});

test("VO-12 ltt serve <dir> --port n: prints URL, serves index.html over HTTP", { timeout: 30000 }, async () => {
  const { out } = buildSite(EXAMPLE);
  const port = 20000 + Math.floor(Math.random() * 20000);
  const child = lttAsync(["serve", out, "--port", String(port)]);
  try {
    const url = await new Promise((resolve, reject) => {
      let buf = "";
      const to = setTimeout(() => reject(new Error(`no URL printed: ${buf}`)), 15000);
      child.stdout.on("data", (d) => { buf += d; const m = buf.match(/https?:\/\/\S+/); if (m) { clearTimeout(to); resolve(m[0]); } });
      child.on("exit", (c) => reject(new Error(`serve exited ${c}`)));
    });
    assert.ok(url.includes(String(port)));
    const res = await fetch(url);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /ltt-runtime\.js/);
  } finally { child.kill(); }
});

let browser;
after(async () => { await browser?.close(); });
test("VO-12 C-35 html example served -> Chrome renders scene 0, no [data-ltt-error], 0 console errors", { timeout: 60000 }, async () => {
  const { out } = buildSite(EXAMPLE);
  const srv = await serve(out);
  browser ??= await launch();
  try {
    for (const viewport of ["desktop", "mobile"]) {
      const { page, ctx, consoleErrors, pageErrors } = await open(browser, srv.url, { viewport });
      assert.equal(await page.locator('[data-ltt-scene="0"]').count(), 1);
      assert.ok(await page.locator("[data-ltt-stage]").first().isVisible());
      assert.ok(await page.locator("[data-ltt-card]").first().isVisible());
      assert.equal(await page.locator("[data-ltt-error]").count(), 0);
      assert.deepEqual(consoleErrors, []);
      assert.deepEqual(pageErrors, []);
      await ctx.close();
    }
  } finally { await srv.close(); }
});

test("VO-12 C-36 QR-3 ltt sheet example -> exit 0, ⌈N/6⌉ PNGs per viewport, sheet.json scenes = N, ≤ 120 s, log counts", { timeout: 300000 }, () => {
  const f = copyLesson(EXAMPLE);
  const out = path.join(path.dirname(f), "sheet");
  const t0 = Date.now();
  const r = ltt(["sheet", f, "--out", out], { timeout: 280000 });
  const ms = Date.now() - t0;
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(ms <= 120000, `sheet took ${ms} ms`);
  const pages = Math.ceil(exampleScenes / 6);
  const files = fs.readdirSync(out);
  for (const vp of ["desktop", "mobile"]) {
    const pngs = files.filter((x) => new RegExp(`^${vp}-\\d+\\.png$`).test(x));
    assert.equal(pngs.length, pages, `${vp} PNGs ${pngs}`);
    for (const p of pngs) assert.deepEqual([...fs.readFileSync(path.join(out, p)).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
  const sj = JSON.parse(fs.readFileSync(path.join(out, "sheet.json"), "utf8"));
  assert.equal(sj.scenes.length, exampleScenes);
  sj.scenes.forEach((s, i) => { assert.equal(s.index, i); assert.equal(typeof s.path, "string"); assert.equal(typeof s.type, "string"); });
  assert.deepEqual(sj.runtimeErrors, []);
  assert.deepEqual(sj.layoutViolations, []);
  const log = readLog(f).at(-1);
  assert.equal(log.cmd, "sheet");
  assert.equal(log.exit, 0);
  assert.deepEqual(log.counts, { runtimeErrors: 0, layoutViolations: 0, images: 2 * pages });
});
test("VO-12 C-37 ltt sheet with a custom that throws while rendering -> exit 1, runtimeErrors names scene 1", { timeout: 300000 }, () => {
  const f = writeLesson(THROWING);
  const out = path.join(path.dirname(f), "sheet");
  const r = ltt(["sheet", f, "--out", out], { timeout: 280000 });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  const sj = JSON.parse(fs.readFileSync(path.join(out, "sheet.json"), "utf8"));
  assert.ok(sj.runtimeErrors.some((e) => e.scene === 1), JSON.stringify(sj.runtimeErrors));
  assert.ok(sj.runtimeErrors.every((e) => e.scene === 1 && typeof e.message === "string"), JSON.stringify(sj.runtimeErrors));
  assert.ok(readLog(f).at(-1).counts.runtimeErrors >= 1);
});
test("VO-12 C-38 ltt sheet with LTT_CHROME missing and default path disabled -> exit 2, stderr mentions LTT_CHROME", { timeout: 60000 }, () => {
  const f = copyLesson(EXAMPLE);
  const r = ltt(["sheet", f, "--out", path.join(path.dirname(f), "sheet")], { env: { LTT_CHROME: "/nonexistent/chrome", LTT_CHROME_DEFAULT_OFF: "1" } });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /LTT_CHROME/);
});
test("VO-12 ltt sheet missing lesson -> exit 2", () => {
  const dir = tmpdir();
  assert.equal(ltt(["sheet", path.join(dir, "nope.js"), "--out", path.join(dir, "o")]).status, 2);
});

test("VO-12 dist missing (temp copy of the package without dist) -> html and sheet exit 1 with build hint", { timeout: 120000 }, () => {
  const root = tmpdir("ltt-nodist-");
  fs.cpSync(RT, path.join(root, "packages/runtime"), { recursive: true, filter: (src) => !/^(dist|node_modules)([\\/]|$)|(^|[\\/])\.ltt([\\/]|$)/.test(path.relative(RT, src)) });
  for (const x of ["package.json", "tsconfig.json"]) if (fs.existsSync(path.join(ROOT, x))) fs.copyFileSync(path.join(ROOT, x), path.join(root, x));
  fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(root, "node_modules"), "dir");
  assert.ok(!fs.existsSync(path.join(root, "packages/runtime/dist")));
  const bin = path.join(root, "packages/runtime/bin/ltt.mjs");
  const f = copyLesson(EXAMPLE);
  for (const cmd of ["html", "sheet"]) {
    const out = path.join(path.dirname(f), `o-${cmd}`);
    const r = spawnSync(process.execPath, [bin, cmd, f, "--out", out], { encoding: "utf8", cwd: root });
    assert.equal(r.status, 1, `${cmd}: ${r.stderr}`);
    assert.match(r.stderr, /npm run build:runtime/);
  }
});

/** PNG IHDR: width at bytes 16..19, height at 20..23 (big-endian). */
const pngSize = (f) => { const b = fs.readFileSync(f); return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }; };
test("VO-12 v9 sheet composition (port-congestion): one row per scene, equal row height on every desktop PNG, last page = remaining rows", { timeout: 300000 }, () => {
  const src = path.join(LESSONS_DIR, "port-congestion.js");
  const f = copyLesson(src);
  const out = path.join(path.dirname(f), "sheet");
  const r = ltt(["sheet", f, "--out", out], { timeout: 280000 });
  assert.ok(r.status === 0 || r.status === 1, r.stderr);
  const n = JSON.parse(fs.readFileSync(path.join(out, "sheet.json"), "utf8")).scenes.length;
  const pages = Math.ceil(n / 6);
  assert.ok(n % 6 !== 0, `fixture leaves a partial last page (n=${n})`);
  // Model h = pad + n·r (constant page margin allowed); solve from the first and last page, which hold different scene counts.
  const rowsOf = (p) => (p < pages ? 6 : n - 6 * (pages - 1));
  const h = (p) => pngSize(path.join(out, `desktop-${p}.png`)).height;
  const [n1, nL] = [rowsOf(1), rowsOf(pages)];
  const rowH = (h(1) - h(pages)) / (n1 - nL), pad = h(1) - n1 * rowH;
  assert.ok(rowH > 0, `row height ${rowH}`);
  assert.ok(pad >= 0 && pad < rowH / 4, `pad ${pad} vs row ${rowH}`);
  for (let p = 1; p <= pages; p++) assert.ok(Math.abs(h(p) - (pad + rowsOf(p) * rowH)) <= 2, `desktop-${p}.png height ${h(p)} vs ${pad} + ${rowsOf(p)} × ${rowH}`);
});
