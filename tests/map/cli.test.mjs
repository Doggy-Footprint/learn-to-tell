import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { L, concept, tmpHome, writeHome, ltt, readJson, exists, snapshot, edgeKeys, lessonText, ago, realToday, yamlLoad } from "./helpers.mjs";

const lesson = (id, date, cs, extra) => ({ id, ...L(id, date, cs, extra) });
const many = (n, prefix = "c") => Array.from({ length: n }, (_, i) => concept(`${prefix}${String(i).padStart(2, "0")}`));
const derivedState = (home) => ({ concepts: snapshot(join(home, "concepts")), map: snapshot(home) });

// VO-7 scenario -------------------------------------------------------------------------
function baseHome() {
  const home = tmpHome();
  writeHome(home, {
    lessons: [
      lesson("l1", "2026-10-01", [
        concept("zeta", { title: "Titlezeta", domains: ["alpha"], level: 1 }),
        concept("aleph", { title: "Titlealeph", domains: ["alpha"], level: 1, leads_to: ["ghost-next"] }),
        concept("mid", { title: "Titlemid", domains: ["alpha"], level: 3, quiz: "pass" }),
      ]),
      lesson("l2", "2026-10-02", [concept("beta", { title: "Titlebeta", domains: ["bravo"], level: 2, quiz: "fail" })]),
    ],
  });
  return home;
}
test("VO-7 C-1 rebuild writes concepts/, map.md (sorted domain, level, title), map-data.json; frontier gets no file", () => {
  const home = baseHome();
  const r = ltt(home, ["rebuild"]);
  assert.equal(r.code, 0, r.all);
  for (const id of ["zeta", "aleph", "mid", "beta"]) assert.ok(exists(join(home, "concepts", `${id}.md`)), id);
  assert.ok(!exists(join(home, "concepts", "ghost-next.md")));
  const md = readFileSync(join(home, "map.md"), "utf8");
  const pos = ["Titlealeph", "Titlezeta", "Titlemid", "Titlebeta"].map((t) => md.indexOf(t));
  assert.ok(pos.every((p) => p >= 0), md);
  assert.deepEqual([...pos].sort((a, b) => a - b), pos, "row order alpha/1/aleph, alpha/1/zeta, alpha/3/mid, bravo/2/beta");
  const cf = readFileSync(join(home, "concepts", "mid.md"), "utf8");
  assert.match(cf, /^---\n[\s\S]*\bid: ["']?mid["']?[\s\S]*\n---/);
  assert.match(cf, /generated/i);
  const data = readJson(join(home, "map-data.json"));
  assert.ok(JSON.stringify(data).includes("ghost-next"));
  assert.deepEqual(edgeKeys(data.edges), ["aleph>ghost-next"]);
  const fr = Array.isArray(data.frontier) ? data.frontier : Object.values(data.frontier);
  assert.deepEqual(fr.map((f) => ({ ...f })), [{ id: "ghost-next", status: "frontier" }]);
});
test("VO-7 rebuild twice is byte-identical; delete concepts/ + map.md + map-data.json then rebuild reproduces (C-18)", () => {
  const home = baseHome();
  ltt(home, ["rebuild"]);
  const first = derivedState(home);
  assert.equal(ltt(home, ["rebuild"]).code, 0);
  assert.deepEqual(derivedState(home), first);
  rmSync(join(home, "concepts"), { recursive: true });
  rmSync(join(home, "map.md"));
  rmSync(join(home, "map-data.json"));
  assert.equal(ltt(home, ["rebuild"]).code, 0);
  assert.deepEqual(derivedState(home), first);
});
test("VO-7 stale concept files not derived are removed; removed concept's file is deleted (C-19)", () => {
  const home = baseHome();
  ltt(home, ["rebuild"]);
  writeFileSync(join(home, "concepts", "hand-made.md"), "stale");
  assert.equal(ltt(home, ["rebuild"]).code, 0);
  assert.ok(!exists(join(home, "concepts", "hand-made.md")));
  writeHome(home, { lessons: [lesson("l2", "2026-10-02", [])] });
  assert.equal(ltt(home, ["rebuild"]).code, 0);
  assert.ok(!exists(join(home, "concepts", "beta.md")));
  assert.ok(exists(join(home, "concepts", "mid.md")));
});
test("VO-7 LTT_HOME unset falls back to $HOME/.learn-to-tell", () => {
  const fakeHome = tmpHome();
  mkdirSync(join(fakeHome, ".learn-to-tell"));
  writeHome(join(fakeHome, ".learn-to-tell"), { lessons: [lesson("l1", "2026-10-01", [concept("a")])] });
  const r = ltt(fakeHome, ["rebuild"], { env: { LTT_HOME: "", HOME: fakeHome } });
  assert.equal(r.code, 0, r.all);
  assert.ok(exists(join(fakeHome, ".learn-to-tell", "concepts", "a.md")));
});

// errors / VO-6 CLI side ----------------------------------------------------------------
test("VO-6 C-13 malformed YAML lesson: error names path, exit 1, valid lesson still written", () => {
  const home = tmpHome();
  writeHome(home, { lessons: [lesson("good", "2026-10-02", [concept("fine")]), { id: "broken", path: "x", text: "---\nconcepts: [ {id: a,\n : :\n---\n" }] });
  for (const cmd of ["rebuild", "check"]) {
    const r = ltt(home, [cmd]);
    assert.equal(r.code, 1, r.all);
    assert.match(r.all, /error [^\n]*broken[/\\]result\.md: /);
  }
  assert.ok(exists(join(home, "concepts", "fine.md")));
  assert.ok(exists(join(home, "map-data.json")));
});
test("VO-6 C-14 requires cycle: check exit 1 naming ids; edges kept in map-data.json", () => {
  const home = tmpHome();
  writeHome(home, { lessons: [lesson("l1", "2026-10-01", [concept("a", { requires: ["b"] }), concept("b", { requires: ["a"] })])] });
  const r = ltt(home, ["check"]);
  assert.equal(r.code, 1);
  assert.match(r.all, /\ba\b[\s\S]*\bb\b|\bb\b[\s\S]*\ba\b/);
  ltt(home, ["rebuild"]);
  assert.deepEqual(edgeKeys(readJson(join(home, "map-data.json")).edges), ["a>b", "b>a"]);
});
test("VO-6 C-21 / C-20 warnings alone keep check at exit 0 and are printed", () => {
  const home = tmpHome();
  writeHome(home, { lessons: [lesson("l1", "2026-10-01", [concept("pre", { level: 4 }), concept("dep", { level: 2, requires: ["pre"] })])] });
  const r = ltt(home, ["check"]);
  assert.equal(r.code, 0, r.all);
  assert.match(r.all, /pre/);
  assert.match(r.all, /dep/);
  assert.equal(ltt(tmpHome(), ["check"]).code, 0);
});
test("VO-6 C-17 lesson field != directory: error, skipped (CLI)", () => {
  const home = tmpHome();
  writeHome(home, { lessons: [{ id: "dirname", path: "x", text: lessonText({ lesson: "other", date: "2026-10-01", concepts: [concept("a")] }) }] });
  const r = ltt(home, ["rebuild"]);
  assert.equal(r.code, 1);
  assert.match(r.all, /dirname[/\\]result\.md/);
  assert.ok(!exists(join(home, "concepts", "a.md")));
});
test("VO-1 C-22 old-format result.md is ignored without error (CLI)", () => {
  const home = tmpHome();
  writeHome(home, { lessons: [{ id: "old", path: "x", text: "# Old result\n\nno frontmatter\n" }, lesson("l1", "2026-10-01", [concept("a")])] });
  const r = ltt(home, ["rebuild"]);
  assert.equal(r.code, 0, r.all);
});

// QR-8 / VO-12 id syntax --------------------------------------------------------------------
for (const [name, id] of [["slash traversal", "../evil"], ["uppercase", "Upper"], ["empty", ""], ["nested slash", "a/b"]]) {
  test(`VO-12 QR-8 invalid id (${name}) is rejected and nothing is written outside concepts/`, () => {
    const home = tmpHome();
    writeHome(home, { lessons: [lesson("l1", "2026-10-01", [concept(id)]), lesson("l2", "2026-10-02", [concept("fine")])] });
    const parent = dirname(home);
    const before = readdirSync(parent).sort();
    const r = ltt(home, ["rebuild"]);
    assert.equal(r.code, 1, r.all);
    assert.match(r.all, /l1[/\\]result\.md/);
    assert.deepEqual(readdirSync(parent).sort(), before);
    const stray = Object.keys(snapshot(home)).filter((p) => !/^\/(lessons\/|concepts\/fine\.md$|map\.md$|map-data\.json$)/.test(p));
    assert.deepEqual(stray, []);
    assert.ok(exists(join(home, "concepts", "fine.md")));
  });
}

// VO-9 --------------------------------------------------------------------------------------------
const seeded = () => {
  const home = tmpHome();
  writeHome(home, { lessons: [lesson("l1", "2026-10-01", [concept("a"), concept("b")])], decisions: [{ op: "reject", a: "a", b: "b", date: "2026-10-02" }] });
  ltt(home, ["rebuild"]);
  return home;
};
test("VO-9 show unknown id: stderr 'unknown concept', exit 2 (C-16)", () => {
  const home = seeded();
  const r = ltt(home, ["show", "nope"]);
  assert.equal(r.code, 2);
  assert.match(r.err, /unknown concept nope/);
});
test("VO-9 decide with unknown id: exit 2, stderr, no file changed", () => {
  const home = seeded();
  const before = snapshot(home);
  for (const args of [["merge", "nope", "a"], ["merge", "a", "nope"], ["link", "nope", "b"], ["reject", "a", "nope"]]) {
    const r = ltt(home, ["decide", ...args]);
    assert.equal(r.code, 2, args.join(" ") + r.all);
    assert.match(r.err, /unknown concept nope/);
  }
  assert.deepEqual(snapshot(home), before);
});
test("VO-9 decide merge appends exactly one jsonl line then rebuilds (args: from, into)", () => {
  const home = seeded();
  const before = readFileSync(join(home, "decisions.jsonl"), "utf8").split("\n").filter(Boolean);
  const r = ltt(home, ["decide", "merge", "a", "b"]);
  assert.equal(r.code, 0, r.all);
  const after = readFileSync(join(home, "decisions.jsonl"), "utf8").split("\n").filter(Boolean);
  assert.equal(after.length, before.length + 1);
  assert.deepEqual(after.slice(0, before.length), before);
  const rec = JSON.parse(after.at(-1));
  assert.deepEqual([rec.op, rec.from, rec.into], ["merge", "a", "b"]);
  assert.ok(typeof rec.date === "string" && rec.date.length >= 10);
  assert.ok(!exists(join(home, "concepts", "a.md")));
  assert.ok(exists(join(home, "concepts", "b.md")));
});
test("VO-9 decide link appends a link record and the edge appears after rebuild (args: prereq, dependent)", () => {
  const home = seeded();
  assert.equal(ltt(home, ["decide", "link", "a", "b"]).code, 0);
  const rec = JSON.parse(readFileSync(join(home, "decisions.jsonl"), "utf8").trim().split("\n").at(-1));
  assert.deepEqual([rec.op, rec.from, rec.to], ["link", "a", "b"]);
  assert.deepEqual(edgeKeys(readJson(join(home, "map-data.json")).edges), ["a>b"]);
});
test("VO-9 decide reject appends a reject record", () => {
  const home = tmpHome();
  writeHome(home, { lessons: [lesson("l1", "2026-10-01", [concept("a"), concept("b")])] });
  assert.equal(ltt(home, ["decide", "reject", "a", "b"]).code, 0);
  const rec = JSON.parse(readFileSync(join(home, "decisions.jsonl"), "utf8").trim());
  assert.equal(rec.op, "reject");
  assert.deepEqual([rec.a, rec.b].sort(), ["a", "b"]);
});
test("VO-9 malformed decisions.jsonl line: error decisions.jsonl:<line>, line ignored, other lines applied", () => {
  const home = tmpHome();
  writeHome(home, {
    lessons: [lesson("l1", "2026-10-01", [concept("x"), concept("y")])],
    decisions: `{"op":"reject","a":"x","b":"y","date":"2026-10-02"}\n{not json\n{"op":"merge","from":"y","into":"x","date":"2026-10-03"}\n`,
  });
  const r = ltt(home, ["rebuild"]);
  assert.equal(r.code, 1, r.all);
  assert.match(r.all, /decisions\.jsonl:2\b/);
  assert.doesNotMatch(r.all, /decisions\.jsonl:[13]\b/);
  assert.ok(!exists(join(home, "concepts", "y.md")), "line 3 merge applied");
  assert.ok(exists(join(home, "concepts", "x.md")));
});

// VO-4 sweep ------------------------------------------------------------------------------------
const sweepHome = (n, decisions) => {
  const home = tmpHome();
  writeHome(home, { lessons: [lesson("l1", "2026-10-01", many(n))], decisions });
  ltt(home, ["rebuild"]);
  return home;
};
const sweep = (home) => {
  const r = ltt(home, ["sweep"]);
  assert.equal(r.code, 0, r.all);
  return JSON.parse(r.out);
};
for (const [n, due] of [[9, false], [10, true], [12, true]]) {
  test(`VO-4 BVA ${n} unswept -> due ${due}`, () => {
    const s = sweep(sweepHome(n));
    assert.equal(s.due, due);
    assert.equal(s.new.length, n);
    assert.deepEqual(s.existing, []);
  });
}
test("VO-4 C-6 12 concepts: sweep-done of all -> due false, new empty, all existing; swept persisted", () => {
  const home = sweepHome(12);
  const all = many(12).map((c) => c.id);
  const r = ltt(home, ["sweep-done", ...all]);
  assert.equal(r.code, 0, r.all);
  assert.deepEqual([...readJson(join(home, "map-state.json")).swept].sort(), all);
  const s = sweep(home);
  assert.equal(s.due, false);
  assert.equal(s.new.length, 0);
  assert.equal(s.existing.length, 12);
  for (const k of ["id", "title", "definition", "domains", "level"]) assert.ok(k in s.existing[0], k);
});
test("VO-4 partial sweep-done 3 of 12 leaves 9 new -> due false; 2 of 12 leaves 10 -> due true", () => {
  const home = sweepHome(12);
  ltt(home, ["sweep-done", "c00", "c01", "c02"]);
  assert.deepEqual([sweep(home).due, sweep(home).new.length], [false, 9]);
  const h2 = sweepHome(12);
  ltt(h2, ["sweep-done", "c00", "c01"]);
  assert.deepEqual([sweep(h2).due, sweep(h2).new.length], [true, 10]);
});
test("VO-4 sweep-done is cumulative and idempotent", () => {
  const home = sweepHome(12);
  ltt(home, ["sweep-done", "c00"]);
  ltt(home, ["sweep-done", "c01", "c00"]);
  assert.deepEqual(readJson(join(home, "map-state.json")).swept.sort(), ["c00", "c01"]);
});
test("VO-4 C-20 rejected pair: listed in sweep, edge kept, warning from check, exit 0", () => {
  const home = tmpHome();
  writeHome(home, {
    lessons: [lesson("l1", "2026-10-01", [concept("a", { leads_to: ["b"] }), concept("b"), concept("c")])],
    decisions: [{ op: "reject", a: "b", b: "a", date: "2026-10-02" }],
  });
  ltt(home, ["rebuild"]);
  const s = sweep(home);
  const rej = JSON.stringify(s.rejected);
  assert.ok(rej.includes('"a"') && rej.includes('"b"') && !rej.includes('"c"'), rej);
  assert.deepEqual(edgeKeys(s.edges), ["a>b"]);
  assert.deepEqual(s.new.map((x) => x.id).sort(), ["a", "b", "c"]);
  const c = ltt(home, ["check"]);
  assert.equal(c.code, 0);
  assert.match(c.all, /\ba\b[\s\S]*\bb\b/);
  assert.ok(exists(join(home, "concepts", "a.md")) && exists(join(home, "concepts", "b.md")));
});

// F-4 FR-14: new entries carry id, title, definition, domains, level
test("VO-4 FR-14 new entries carry id, title, definition, domains, level with the derived values", () => {
  const home = tmpHome();
  writeHome(home, {
    lessons: [
      lesson("l1", "2026-10-01", [
        concept("zz-one", { title: "Zed One", definition: "first def", domains: ["os", "gpu"], level: 4 }),
        concept("aa-two", { title: "Aye Two", definition: "second def", domains: ["law"], level: 1 }),
      ]),
    ],
  });
  ltt(home, ["rebuild"]);
  const s = sweep(home);
  const by = Object.fromEntries(s.new.map((x) => [x.id, x]));
  assert.deepEqual(Object.keys(by).sort(), ["aa-two", "zz-one"]);
  const pick = (x) => ({ id: x.id, title: x.title, definition: x.definition, domains: [...x.domains].sort(), level: x.level });
  assert.deepEqual(pick(by["zz-one"]), { id: "zz-one", title: "Zed One", definition: "first def", domains: ["gpu", "os"], level: 4 });
  assert.deepEqual(pick(by["aa-two"]), { id: "aa-two", title: "Aye Two", definition: "second def", domains: ["law"], level: 1 });
  ltt(home, ["sweep-done", "zz-one"]);
  const s2 = sweep(home);
  assert.deepEqual(s2.existing.map(pick), [{ id: "zz-one", title: "Zed One", definition: "first def", domains: ["gpu", "os"], level: 4 }]);
  assert.deepEqual(s2.new.map((x) => x.id), ["aa-two"]);
});

// F-7 FR-11
test("VO-7 FR-11 map.md table has the 7 columns with hand-computed values; concept file frontmatter is YAML with derived fields", async () => {
  const T = realToday();
  const home = tmpHome();
  writeHome(home, {
    lessons: [
      lesson("lp1", ago(5, T), [concept("c-pass", { title: "TitlePass", definition: "pass def", domains: ["gpu"], level: 2, quiz: "pass" })]),
      lesson("lf1", ago(40, T), [concept("c-fail", { title: "TitleFail", definition: "fail def", domains: ["os"], level: 4, quiz: "fail" })]),
      lesson("ls1", ago(100, T), [concept("c-old", { title: "TitleOld", definition: "old def", domains: ["os"], level: 3, quiz: "pass" })]),
      lesson("ln1", ago(3, T), [concept("c-none", { title: "TitleNone", definition: "none def", domains: ["law"], level: 1, quiz: "none" })]),
    ],
  });
  assert.equal(ltt(home, ["rebuild"]).code, 0);
  const rows = readFileSync(join(home, "map.md"), "utf8")
    .split("\n")
    .filter((l) => l.trim().startsWith("|"))
    .map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim()));
  const header = rows[0].map((x) => x.toLowerCase());
  for (const [i, re] of [/domain/, /level/, /title/, /status/, /fresh/, /last/, /lesson/].entries()) assert.match(header[i], re, `column ${i}: ${header[i]}`);
  const row = (title) => rows.find((r) => r.includes(title));
  assert.deepEqual(row("TitlePass"), ["gpu", "2", "TitlePass", "learned", "fresh", ago(5, T), "lp1"]);
  assert.deepEqual(row("TitleFail"), ["os", "4", "TitleFail", "weak", "weak", ago(40, T), "lf1"]);
  assert.deepEqual(row("TitleOld"), ["os", "3", "TitleOld", "learned", "stale", ago(100, T), "ls1"]);
  assert.deepEqual(row("TitleNone"), ["law", "1", "TitleNone", "diagnosed", "unquizzed", ago(3, T), "ln1"]);

  const text = readFileSync(join(home, "concepts", "c-pass.md"), "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(m, text);
  const fm = await yamlLoad(m[1]);
  assert.deepEqual(
    { id: fm.id, title: fm.title, definition: fm.definition, domains: fm.domains, level: fm.level, status: fm.status, lessons: fm.lessons },
    { id: "c-pass", title: "TitlePass", definition: "pass def", domains: ["gpu"], level: 2, status: "learned", lessons: ["lp1"] },
  );
  assert.match(text.slice(m[0].length) + text.slice(0, m.index), /generated/i);
});
