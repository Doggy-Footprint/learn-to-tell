import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createLttServer } from "../../skills/learn-to-tell/server/server.mjs";
import { L, concept, tmpHome, writeHome, ltt, ROOT } from "./helpers.mjs";

let home, server, port;
before(async () => {
  home = tmpHome();
  writeFileSync(join(home, "secret.txt"), "SECRET-OUTSIDE");
  server = createLttServer({ home });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
after(() => new Promise((r) => server.close(r)));

const raw = (path) =>
  new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "GET" }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.end();
  });

test("VO-12 C-23 /map/data.json before rebuild: 404 JSON {error:'run ltt-map rebuild'}", async () => {
  const r = await raw("/map/data.json");
  assert.equal(r.status, 404);
  assert.match(r.headers["content-type"], /application\/json/);
  assert.deepEqual(JSON.parse(r.body), { error: "run ltt-map rebuild" });
});
test("VO-12 /map/data.json serves <home>/map-data.json after rebuild", async () => {
  writeHome(home, { lessons: [{ id: "l1", ...L("l1", "2026-10-01", [concept("a")]) }] });
  assert.equal(ltt(home, ["rebuild"]).code, 0);
  const r = await raw("/map/data.json");
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.body), JSON.parse(readFileSync(join(home, "map-data.json"), "utf8")));
});

const attacks = [
  ["dotdot", "/map/../server/server.mjs"],
  ["dotdot-deep", "/map/../../server/server.mjs"],
  ["encoded dotdot", "/map/%2e%2e/server/server.mjs"],
  ["encoded dotdot x2", "/map/%2e%2e/%2e%2e/server/server.mjs"],
  ["encoded slash", "/map/..%2fserver%2fserver.mjs"],
  ["absolute path", "/map//etc/passwd"],
  ["encoded absolute path", "/map/%2Fetc%2Fpasswd"],
  ["traversal to home secret", "/map/../../../secret.txt"],
  ["traversal after data.json", "/map/data.json/../../server/server.mjs"],
  ["backslash", "/map/..\\server\\server.mjs"],
  ["map-data via traversal", "/map/../map-data.json"],
];
for (const [name, path] of attacks) {
  test(`VO-12 syntax: ${name} (${path}) -> 403/404, no file content`, async () => {
    const r = await raw(path);
    assert.ok([403, 404].includes(r.status), `${r.status}`);
    for (const leak of ["createLttServer", "SECRET-OUTSIDE", "root:"]) assert.ok(!r.body.includes(leak), leak);
  });
}

test("VO-10 FR-17 grid.html and focus.html are served, load /kit/ltt.js, use --ltt- tokens, no external network", async () => {
  for (const page of ["/map/grid.html", "/map/focus.html"]) {
    const r = await raw(page);
    assert.equal(r.status, 200, page);
    assert.match(r.headers["content-type"], /text\/html/);
    assert.ok(r.body.includes("/kit/ltt.js"), page);
    assert.doesNotMatch(r.body, /(?:src|href)\s*=\s*["']\s*(?:https?:)?\/\//i, page);
    const local = [...r.body.matchAll(/(?:src|href)\s*=\s*["'](\/map\/[^"'?#]+)/g)].map((m) => m[1]);
    let all = r.body;
    for (const u of local) all += (await raw(u)).body;
    assert.ok(all.includes("--ltt-"), `${page} uses kit tokens`);
    assert.doesNotMatch(all, /(?:fetch|import|src\s*=|href\s*=|url\()\s*\(?\s*["']?https?:\/\//i);
  }
});
test("VO-12 static asset under /map/ missing -> 404", async () => {
  assert.equal((await raw("/map/does-not-exist.js")).status, 404);
});
test("VO-14 QR-3 existing routes unchanged: /kit/ltt.js and health", async () => {
  assert.equal((await raw("/kit/ltt.js")).status, 200);
  assert.equal((await raw("/api/health")).status, 200);
});
