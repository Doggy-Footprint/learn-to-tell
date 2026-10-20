import { createServer } from "node:http";
import { existsSync, realpathSync } from "node:fs";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { homePage } from "./home.mjs";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const DEFAULT_PORT = 47823;
// Installed copies (plugin, claude.ai zip) ship without the gallery; it lives in the repo and on the public site.
const GALLERY_SITE = "https://learn-to-tell.vercel.app";
const MAX_BODY = 64 * 1024;
const LESSON_ID = /^[a-z0-9][a-z0-9-]*$/;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

export function lttHome() {
  return process.env.LTT_HOME || join(homedir(), ".learn-to-tell");
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function serveFile(res, root, relPath) {
  const base = resolve(root);
  const file = resolve(base, relPath);
  if (!file.startsWith(base + sep)) return send(res, 403, { error: "forbidden" });
  const ext = file.slice(file.lastIndexOf("."));
  if (!TYPES[ext]) return send(res, 404, { error: "not found" });
  try {
    send(res, 200, await readFile(file), TYPES[ext]);
  } catch {
    send(res, 404, { error: "not found" });
  }
}

// Responding 413 before the body is fully read made Node close the socket on
// `Connection: close` clients, which surfaced as intermittent `write EPIPE` in v0.
// So the whole body is always drained first and only the size is checked.
async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size <= MAX_BODY) chunks.push(chunk);
  }
  return size > MAX_BODY ? null : Buffer.concat(chunks).toString("utf8");
}

async function recordEvent(req, res, home, lessonId) {
  const body = await readBody(req);
  if (body === null) return send(res, 413, { error: "body too large" });
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return send(res, 400, { error: "invalid json" });
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return send(res, 400, { error: "event must be an object" });
  }
  const dir = join(home, "lessons", lessonId);
  await mkdir(dir, { recursive: true });
  await appendFile(join(dir, "events.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...event }) + "\n");
  send(res, 204, "");
}

export function createLttServer({ home = lttHome(), skillDir = SKILL_DIR, galleryDir = join(skillDir, "..", "..", "site", "gallery"), siteDir = join(skillDir, "..", "..", "site"), onRequest = () => {} } = {}) {
  const hasGallery = existsSync(galleryDir);
  return createServer(async (req, res) => {
    onRequest();
    try {
      const { pathname } = new URL(req.url, "http://localhost");
      const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);

      if (req.method === "GET" && pathname === "/api/health") {
        return send(res, 200, { app: "learn-to-tell" });
      }
      if ((req.method === "GET" || req.method === "HEAD") && (pathname === "/" || pathname === "/index.html")) {
        return send(res, 200, homePage(home), TYPES[".html"]);
      }
      if (req.method === "GET" && parts[0] === "gallery" && parts.length > 1) {
        if (hasGallery) return await serveFile(res, galleryDir, parts.slice(1).join("/"));
        res.writeHead(302, { Location: GALLERY_SITE + pathname });
        return res.end();
      }
      if (req.method === "GET" && parts[0] === "legacy" && parts.length > 1) {
        if (existsSync(join(siteDir, "legacy"))) return await serveFile(res, join(siteDir, "legacy"), parts.slice(1).join("/"));
        res.writeHead(302, { Location: GALLERY_SITE + pathname });
        return res.end();
      }
      if (req.method === "POST" && parts[0] === "api" && parts[1] === "lessons" && parts[3] === "events" && parts.length === 4) {
        if (!LESSON_ID.test(parts[2])) return send(res, 400, { error: "invalid lesson id" });
        return await recordEvent(req, res, home, parts[2]);
      }
      if (req.method === "GET" && parts[0] === "kit" && parts.length > 1) {
        return await serveFile(res, join(skillDir, parts[0]), parts.slice(1).join("/"));
      }
      if (req.method === "GET" && parts[0] === "lessons" && parts.length > 2) {
        if (!LESSON_ID.test(parts[1])) return send(res, 400, { error: "invalid lesson id" });
        return await serveFile(res, join(home, "lessons", parts[1]), parts.slice(2).join("/"));
      }
      send(res, 404, { error: "not found" });
    } catch (err) {
      if (res.headersSent) return;
      if (err instanceof URIError) return send(res, 400, { error: "malformed path" });
      send(res, 500, { error: String(err?.message ?? err) });
    }
  });
}

async function isLttServer(port) {
  try {
    const res = await fetch(`http://${HOST}:${port}/api/health`);
    return (await res.json()).app === "learn-to-tell";
  } catch {
    return false;
  }
}

async function main() {
  const port = Number(process.env.LTT_PORT || DEFAULT_PORT);
  const idleMs = Number(process.env.LTT_IDLE_MINUTES || 40) * 60_000;
  let timer;
  const touch = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log("learn-to-tell server: idle timeout, exiting");
      process.exit(0);
    }, idleMs);
  };
  const server = createLttServer({ onRequest: touch });
  server.on("error", async (err) => {
    if (err.code === "EADDRINUSE" && (await isLttServer(port))) {
      console.log(`learn-to-tell server already running at http://${HOST}:${port}/`);
      process.exit(0);
    }
    console.error(`learn-to-tell server: ${err.message}`);
    process.exit(1);
  });
  server.listen(port, HOST, () => {
    touch();
    console.log(`learn-to-tell server running at http://${HOST}:${port}/ (home: ${lttHome()})`);
  });
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
