import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, request } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";

const SERVER_PATH = fileURLToPath(new URL("../skills/learn-to-tell/server/server.mjs", import.meta.url));

let home;
let server;
let base;

before(async () => {
  home = await mkdtemp(join(tmpdir(), "ltt-test-"));
  await mkdir(join(home, "lessons", "20261013-demo"), { recursive: true });
  await writeFile(join(home, "lessons", "20261013-demo", "lesson.html"), "<h1>demo</h1>");
  await writeFile(join(home, "secret.html"), "secret");
  server = createLttServer({ home });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await rm(home, { recursive: true, force: true });
});

function post(path, body, headers = {}) {
  return fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body });
}

function freePort() {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function runMain(port, { waitFor } = {}) {
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: { ...process.env, LTT_PORT: String(port), LTT_HOME: home },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  const ready = new Promise((resolve, reject) => {
    const onData = (d) => {
      out += d;
      if (waitFor && out.includes(waitFor)) resolve(out);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => (waitFor ? reject(new Error(`exited ${code}: ${out}`)) : resolve({ code, out })));
  });
  return { child, ready };
}

test("health identifies the server", async () => {
  const res = await fetch(base + "/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { app: "learn-to-tell" });
});

test("serves kit and vendor files from the skill directory, legacy pages from site/legacy", async () => {
  for (const path of ["/kit/ltt.js", "/kit/vendor/d3.min.js"]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get("content-type"), /text\/javascript/);
  }
  for (const path of ["/legacy/gallery/cache-ttl.html", "/legacy/kit-v1/ltt.js", "/legacy/compare1/index.html"]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, path);
  }
  assert.equal((await fetch(base + "/legacy/%2e%2e%2fgallery%2findex.html")).status, 403);
});

test("redirects gallery requests to the public site when the gallery is not installed", async () => {
  const bare = createLttServer({ home, galleryDir: join(home, "no-gallery") });
  await new Promise((r) => bare.listen(0, "127.0.0.1", r));
  try {
    const res = await fetch(`http://127.0.0.1:${bare.address().port}/gallery/catalog.html`, { redirect: "manual" });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://learn-to-tell.vercel.app/gallery/catalog.html");
  } finally {
    await new Promise((r) => bare.close(r));
  }
});

test("serves lesson files from LTT_HOME", async () => {
  const res = await fetch(base + "/lessons/20261013-demo/lesson.html");
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "<h1>demo</h1>");
  assert.equal((await fetch(base + "/lessons/20261013-demo/missing.html")).status, 404);
});

test("rejects path traversal out of each root", async () => {
  assert.equal((await fetch(base + "/kit/%2e%2e%2fgallery%2fcache-ttl.html")).status, 403);
  assert.equal((await fetch(base + "/lessons/20261013-demo/%2e%2e%2f%2e%2e%2fsecret.html")).status, 403);
  assert.equal((await fetch(base + "/lessons/Bad_Id/lesson.html")).status, 400);
  assert.equal((await fetch(base + "/kit/%E0%A4%A")).status, 400);
});

test("appends posted events to events.jsonl with a server timestamp", async () => {
  assert.equal((await post("/api/lessons/20261013-demo/events", JSON.stringify({ type: "predict", data: 0.5 }))).status, 204);
  assert.equal((await post("/api/lessons/20261013-demo/events", JSON.stringify({ type: "reveal" }))).status, 204);
  const lines = (await readFile(join(home, "lessons", "20261013-demo", "events.jsonl"), "utf8")).trim().split("\n");
  const events = lines.map((l) => JSON.parse(l));
  assert.deepEqual(events.map((e) => e.type), ["predict", "reveal"]);
  assert.equal(events[0].data, 0.5);
  assert.ok(!Number.isNaN(Date.parse(events[0].at)));
});

test("rejects invalid lesson ids and malformed events", async () => {
  assert.equal((await post("/api/lessons/Bad_Id/events", "{}")).status, 400);
  assert.equal((await post("/api/lessons/20261013-demo/events", "{not json")).status, 400);
  assert.equal((await post("/api/lessons/20261013-demo/events", "[1,2]")).status, 400);
});

test("oversized body gets 413 after the body is read, without EPIPE", async () => {
  const body = JSON.stringify({ type: "big", data: "x".repeat(70 * 1024) });
  const { port } = server.address();
  const status = await new Promise((resolve, reject) => {
    const req = request(
      { host: "127.0.0.1", port, method: "POST", path: "/api/lessons/20261013-demo/events",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), Connection: "close" } },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode));
      },
    );
    req.on("error", reject);
    req.end(body);
  });
  assert.equal(status, 413);
});

test("main binds to 127.0.0.1 and a second start reuses the running server", async () => {
  const port = await freePort();
  const first = runMain(port, { waitFor: "running at" });
  try {
    const out = await first.ready;
    assert.match(out, new RegExp(`http://127\\.0\\.0\\.1:${port}/`));
    const second = await runMain(port).ready;
    assert.equal(second.code, 0);
    assert.match(second.out, /already running/);
  } finally {
    first.child.kill();
  }
});

test("main exits 1 when the port belongs to another program", async () => {
  const other = createServer((req, res) => res.end("other"));
  await new Promise((r) => other.listen(0, "127.0.0.1", r));
  try {
    const result = await runMain(other.address().port).ready;
    assert.equal(result.code, 1);
  } finally {
    await new Promise((r) => other.close(r));
  }
});

test("the home page lists lessons newest first with their cover, goal and decision from result.md", async () => {
  const dir = join(home, "lessons", "20261020-cache-ttl");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "lesson.html"), "<title>캐시 TTL</title>");
  await writeFile(join(dir, "cover.jpg"), "jpg");
  await writeFile(join(dir, "result.md"), '---\nlesson: 20261020-cache-ttl\ndate: 2026-10-20\ntitle: "캐시 TTL을 늘리면 무엇을 잃나"\ngoal: TTL과 원본 부하의 관계를 설명한다\ndecision: TTL 60초 유지  # 변경 주기 5분\nconcepts:\n  - id: ttl\n---\n# 본문\n');
  const res = await fetch(base + "/");
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.indexOf("캐시 TTL을 늘리면 무엇을 잃나") < html.indexOf("20261013-demo"), "newest first");
  assert.match(html, /src="\/lessons\/20261020-cache-ttl\/cover\.jpg"/);
  assert.match(html, /TTL 60초 유지</);
  assert.match(html, /TTL과 원본 부하의 관계를 설명한다/);
  assert.match(html, /진행 중/, "lesson without result.md is marked in progress");
  assert.match(html, /href="\/legacy\/gallery\/index\.html"/);
  assert.equal((await fetch(base + "/lessons/20261020-cache-ttl/cover.jpg")).headers.get("content-type"), "image/jpeg");
});
