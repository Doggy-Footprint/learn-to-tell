import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { concept, exists, lessonText, ltt, readJson, tmpHome } from "./helpers.mjs";

const result = (lesson = "20261017-mobile") =>
  lessonText({ lesson, date: "2026-10-17", concepts: [concept("cache-ttl", { title: "캐시 TTL", domains: ["backend"], level: 2, quiz: "pass" })] });
const artifact = (md) => `<!doctype html><html><head><title>LTT · 캐시</title>
<script type="application/ltt-result" data-lesson="x">
${md}</script></head><body><script src="https://cdn.jsdelivr.net/npm/@doggy-footprint/ltt-kit@1.0.0/ltt.js"></script></body></html>`;
const put = (home, name, text) => {
  const file = join(dirname(home), name);
  writeFileSync(file, text);
  return file;
};

test("import extracts the result block from an artifact, keeps the page, and rebuilds the map", () => {
  const home = tmpHome();
  const r = ltt(home, ["import", put(home, "a.html", artifact(result()))]);
  assert.equal(r.code, 0, r.all);
  assert.match(r.out, /imported 20261017-mobile/);
  assert.equal(readFileSync(join(home, "lessons/20261017-mobile/result.md"), "utf8"), result());
  assert.ok(exists(join(home, "lessons/20261017-mobile/lesson.html")));
  assert.ok(readJson(join(home, "map-data.json")).concepts.some((c) => c.id === "cache-ttl"));
});

test("import accepts a pasted result.md and writes no lesson page", () => {
  const home = tmpHome();
  const r = ltt(home, ["import", put(home, "r.md", result())]);
  assert.equal(r.code, 0, r.all);
  assert.ok(exists(join(home, "lessons/20261017-mobile/result.md")));
  assert.ok(!exists(join(home, "lessons/20261017-mobile/lesson.html")));
});

test("re-import leaves an existing result untouched", () => {
  const home = tmpHome();
  ltt(home, ["import", put(home, "a.html", artifact(result()))]);
  const again = ltt(home, ["import", put(home, "a.html", artifact(result()))]);
  assert.equal(again.code, 0, again.all);
  assert.match(again.out, /already imported/);
  const edited = result().replace("free text", "changed");
  const differs = ltt(home, ["import", put(home, "b.html", artifact(edited))]);
  assert.match(differs.out, /exists and differs/);
  assert.equal(readFileSync(join(home, "lessons/20261017-mobile/result.md"), "utf8"), result());
});

test("import rejects pages without a result and unsafe lesson ids", () => {
  const home = tmpHome();
  assert.equal(ltt(home, ["import", put(home, "none.html", "<html><body>hi</body></html>")]).code, 1);
  const bad = ltt(home, ["import", put(home, "bad.html", artifact(result("../escape")))]);
  assert.equal(bad.code, 1);
  assert.match(bad.err, /invalid lesson id/);
  assert.ok(!exists(join(dirname(home), "escape")));
});

const unfinished = (lesson) => `<!doctype html><html><head><title>LTT · 캐시</title>
<script type="application/json" id="ltt-meta">{"topic":"캐시","lesson":${JSON.stringify(lesson)}}</script></head><body></body></html>`;

test("import keeps an unfinished artifact's page without touching the map, and a finished one replaces it", () => {
  const home = tmpHome();
  const r = ltt(home, ["import", put(home, "u.html", unfinished("20261017-mobile"))]);
  assert.equal(r.code, 0, r.all);
  assert.match(r.out, /imported 20261017-mobile \(unfinished/);
  assert.ok(exists(join(home, "lessons/20261017-mobile/lesson.html")));
  assert.ok(!exists(join(home, "lessons/20261017-mobile/result.md")));
  assert.ok(!exists(join(home, "map-data.json")));
  assert.match(ltt(home, ["import", put(home, "u.html", unfinished("20261017-mobile"))]).out, /already imported/);
  assert.match(ltt(home, ["import", put(home, "u2.html", unfinished("20261017-mobile") + " ")]).out, /exists and differs/);
  assert.match(ltt(home, ["lessons"]).out, /^20261017-mobile \| unfinished \| lesson\.html$/m);
  const done = ltt(home, ["import", put(home, "a.html", artifact(result()))]);
  assert.match(done.out, /imported 20261017-mobile$/m);
  assert.match(readFileSync(join(home, "lessons/20261017-mobile/lesson.html"), "utf8"), /application\/ltt-result/);
  assert.match(ltt(home, ["import", put(home, "u.html", unfinished("20261017-mobile"))]).out, /already finished/);
  assert.match(ltt(home, ["lessons"]).out, /^20261017-mobile \| finished \| lesson\.html, result\.md$/m);
});

test("import rejects an unsafe lesson id in ltt-meta", () => {
  const home = tmpHome();
  const bad = ltt(home, ["import", put(home, "u.html", unfinished("../escape"))]);
  assert.equal(bad.code, 1);
  assert.match(bad.err, /invalid lesson id/);
});
