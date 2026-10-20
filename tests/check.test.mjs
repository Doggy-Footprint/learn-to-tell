import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { findChrome, launch } from "../skills/learn-to-tell/server/cdp.mjs";
import { check, exitCode } from "../skills/learn-to-tell/server/check.mjs";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";

const chrome = findChrome();
const FIXTURES = fileURLToPath(new URL("./fixtures", import.meta.url));
const skip = !chrome && "Chrome이 없다";
let home, server, base;

const page = (body) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><script src="/kit/ltt.js"></script></head><body><script>${body}</script></body></html>`;
const tail = `{ type: "summary", title: "정리", items: [{ q: "q1", a: "a1" }, { q: "q2", a: "a2" }] }, { type: "overview", title: "한 장", visual: g }, { type: "keywords", remember: ["a"], signals: ["b"], queries: ["c"] }`;

before(async () => {
  if (skip) return;
  home = await mkdtemp(join(tmpdir(), "ltt-check-"));
  const lesson = async (id, body) => { await mkdir(join(home, "lessons", id), { recursive: true }); await writeFile(join(home, "lessons", id, "lesson.html"), page(body)); };
  await lesson("broken", `const g = LTT.graph({ layout: "manual", aspect: 2, nodes: [{ id: "a", label: "왼쪽 상자", at: [40, 50] }, { id: "b", label: "겹친 상자", at: [44, 50] }] });
    LTT.deck({ title: "t", theme: "paper", scenes: [{ type: "hook", text: "훅" }, { type: "figure", title: "겹친다", visual: g, sub: "s" }, { type: "figure", title: "오류", visual: g, motion: [["fly", {}]] }, ${tail}] });`);
  await lesson("routing", `const ch = (ids) => LTT.chart({ x: { cats: ["가", "나"] }, y: { domain: [0, 10] }, series: ids.map((id) => ({ id, label: id, type: "bar", values: [2, 4] })) });
    const gr = (id) => LTT.graph({ nodes: [{ id, label: id }, { id: id + "2", label: "둘" }], edges: [{ from: id, to: id + "2" }] });
    LTT.deck({ title: "t", exemplar: true, scenes: [
      { type: "compare", title: "양쪽", left: { label: "왼", visual: ch(["a"]) }, right: { label: "오", visual: ch(["a", "b"]) },
        motion: [["highlight", { id: "b" }], { side: "right", par: [["to", { id: "a", values: [5, 6] }]] }] },
      { type: "figure", title: "계수판", visual: gr("x"), side: LTT.ledger([{ id: "cost", label: "비용", value: 1 }]),
        motion: [["pulse", { node: "x" }], ["count", { id: "cost", to: 5 }], ["count", { id: "cost", to: 9 }]] },
      { type: "figure", title: "여러 칸", visual: LTT.multiples({ panels: [{ title: "1", part: gr("p") }, { title: "2", part: gr("q") }] }),
        motion: [["pulse", { node: "q" }], ["highlight", { id: "p0" }], ["flow", { edges: ["p>p2"] }]] },
      { type: "figure", title: "도형", visual: LTT.morph({ aspect: 2, shapes: { s: { kind: "path", d: "M10 20 L50 40" }, c: { kind: "circle", x: 50, y: 50, r: 10 } } }) },
      { type: "figure", title: "없는 id", visual: gr("z"), motion: [["highlight", { id: "nope" }]] }] });`);
  server = createLttServer({ home });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (skip) return;
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await rm(home, { recursive: true, force: true });
});

test("the all-parts fixture has nothing to fix on desktop and phone, and sheets go only to moving scenes", { skip }, async () => {
  const out = join(home, "sheets");
  const [r] = await check({ targets: ["v2-all"], home: FIXTURES, chrome, out });
  assert.deepEqual(r.errors, []);
  for (const m of ["desktop", "mobile"]) {
    assert.deepEqual(r.modes[m].console, [], m);
    assert.deepEqual(r.modes[m].scenes.flatMap((s) => s.issues.map((x) => `${s.i + 1} ${x.rule} ${x.msg}`)), [], m);
  }
  assert.deepEqual(r.modes.desktop.lint.filter((l) => l.level === "fix"), []);
  const moving = r.modes.desktop.scenes.filter((s) => s.tier !== "S").map((s) => `s${String(s.i + 1).padStart(2, "0")}.jpg`);
  assert.deepEqual(r.sheets.map((f) => f.split("/").pop()), moving);
  assert.ok(moving.length >= 8);
  assert.equal(exitCode([r]), 0);
});

test("overlaps and schema errors are reported per scene in both sizes", { skip }, async () => {
  const [r] = await check({ targets: ["broken"], home, chrome, sheets: false });
  const d = r.modes.desktop.scenes;
  assert.ok(d[1].issues.some((x) => x.rule === "overlap" && /왼쪽 상자/.test(x.msg)), JSON.stringify(d[1].issues));
  assert.ok(d[2].issues.some((x) => x.rule === "schema" && /fly/.test(x.msg)));
  assert.ok(r.modes.mobile.scenes[2].issues.some((x) => x.rule === "schema"));
  assert.equal(exitCode([r]), 1);
});

// Compared as DOM state, not pixels: Chrome's anti-aliasing of moving svg dots differs by a few pixels between identical frames.
test("a frame depends only on its time: seeking away and back gives the same scene state", { skip }, async () => {
  const fx = createLttServer({ home: FIXTURES });
  await new Promise((r) => fx.listen(0, "127.0.0.1", r));
  const browser = await launch(chrome);
  try {
    const pg = await browser.page({ width: 1280, height: 800 });
    await pg.goto(`http://127.0.0.1:${fx.address().port}/lessons/v2-all/lesson.html?check`);
    await pg.eval("document.fonts.ready");
    const hash = async (i, t) => { await pg.eval(`LTT.seek(${i}, ${t})`); return createHash("sha1").update(await pg.eval(`document.getElementById("s${i + 1}").outerHTML`)).digest("hex"); };
    for (const [i, t, other] of [[2, 1.0, 6.5], [7, 2.2, 0.3], [8, 1.7, 4.4], [11, 2.0, 5.0]]) {
      const a = await hash(i, t);
      const moved = await hash(i, other);
      const b = await hash(i, t);
      assert.equal(a, b, `scene ${i + 1} at ${t}s`);
      assert.notEqual(a, moved, `scene ${i + 1} moves between ${t}s and ${other}s`);
    }
  } finally {
    await browser.close();
    fx.closeAllConnections();
    await new Promise((r) => fx.close(r));
  }
});

test("verbs go to the part that owns their id: compare sides, the side panel, panels inside multiples", { skip }, async () => {
  const browser = await launch(chrome);
  try {
    const pg = await browser.page({ width: 1280, height: 800 });
    await pg.goto(`${base}/lessons/routing/lesson.html?check`);
    await pg.eval("document.fonts.ready");
    const errors = await pg.eval("JSON.stringify(LTT.current.errors)").then(JSON.parse);
    assert.deepEqual(errors.map((e) => e.scene), [4]);
    assert.match(errors[0].msg, /'nope'.*있는 id: z>z2, z, z2/);
    const right = await pg.eval(`LTT.seek(0, 99), [...document.querySelectorAll("#s1 .ltt-side")[1].querySelectorAll(".ltt-label")].map((l) => l.textContent).join(",")`);
    assert.match(right, /5/, "to on the right chart, not the left");
    const mid = await pg.eval(`LTT.seek(1, 0.9 + 1.2 + 0.2), +document.querySelector("#s2 .ltt-ledger b").textContent`);
    assert.ok(mid > 5 && mid < 9, `second count starts where the first ended: ${mid}`);
    assert.equal(await pg.eval(`LTT.seek(1, 99), document.querySelector("#s2 .ltt-ledger b").textContent`), "9");
    const d = await pg.eval(`document.querySelector("#s4 path.ltt-ms").getAttribute("d")`);
    assert.equal(d, "M100 100L500 200");
    assert.equal(await pg.eval(`document.querySelector("#s4 circle.ltt-ms").getAttribute("cx")`), "500");
  } finally {
    await browser.close();
  }
});

test("cover is written next to the lesson from the overview scene", { skip }, async () => {
  const [r] = await check({ targets: ["broken"], home, chrome, sheets: false, cover: true });
  assert.ok(r.cover && existsSync(r.cover));
});
