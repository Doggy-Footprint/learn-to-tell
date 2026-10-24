import { existsSync, mkdirSync, appendFileSync, statSync } from "node:fs";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve, join, extname, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { checkLesson } from "../check/index.mjs";
import { digest } from "./digest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const PKG = resolve(here, "../..");
export const DIST = join(PKG, "dist");
const DTS = join(PKG, "types/lesson.d.ts");
const MAX_MESSAGE = 300;

const USAGE = `usage:
  ltt check <lesson.js> [--json]
  ltt html <lesson.js> --out <dir>
  ltt serve <dir> [--port n]
  ltt sheet <lesson.js> --out <dir>
  ltt digest <lesson.js>
`;

export class Exit extends Error {
  /** @param {number} code @param {string} [message] */
  constructor(code, message) {
    super(message ?? "");
    this.code = code;
  }
}

/** @param {string[]} argv */
export function parseArgs(argv) {
  /** @type {string[]} */
  const pos = [];
  /** @type {Record<string, string | boolean>} */
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") flags.json = true;
    else if (a === "--out" || a === "--port") {
      const v = argv[++i];
      if (v === undefined) throw new Exit(2, `${a} needs a value`);
      flags[a.slice(2)] = v;
    } else if (a.startsWith("--")) throw new Exit(2, `unknown option ${a}`);
    else pos.push(a);
  }
  return { pos, flags };
}

/** @param {string | undefined} file */
function lessonPath(file) {
  if (!file) throw new Exit(2, "missing <lesson.js>");
  const abs = resolve(file);
  if (!existsSync(abs) || !statSync(abs).isFile()) throw new Exit(2, `file not found: ${file}`);
  return abs;
}

/** @param {string} abs */
export async function importLesson(abs) {
  const mod = await import(`${pathToFileURL(abs).href}?ltt=${Date.now()}-${Math.random().toString(36).slice(2)}`);
  if (typeof mod.default !== "function") throw new Error("default export is not a function (expected the lesson factory)");
  return mod.default;
}

/** @param {string} abs @param {string} cmd @param {number} ms @param {number} exit @param {Record<string, number>} counts */
export function logRun(abs, cmd, ms, exit, counts) {
  try {
    const dir = join(dirname(abs), ".ltt");
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, "log.jsonl"), `${JSON.stringify({ ts: new Date().toISOString(), cmd, file: abs, ms: Math.round(ms), exit, counts })}\n`);
  } catch {
    // the run log is best effort and must not change the command result
  }
}

/** @param {string} s */
const clip = (s) => (s.length > MAX_MESSAGE ? `${s.slice(0, MAX_MESSAGE - 3)}...` : s);

/**
 * Type errors in the lesson file, with the root tsconfig options and "ltt" mapped to this package's lesson.d.ts.
 * @param {string} abs
 */
export function typeErrors(abs) {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const options = {
    allowJs: true,
    checkJs: true,
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    lib: ["lib.es2022.d.ts"],
    types: [],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    paths: { ltt: [DTS] },
    skipLibCheck: false,
  };
  const program = ts.createProgram({ rootNames: [abs], options });
  const norm = (/** @type {string} */ p) => resolve(p);
  const diags = [...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics(), ...ts.getPreEmitDiagnostics(program)];
  /** @type {{ layer: "type"; rule: string; path: string; message: string }[]} */
  const out = [];
  const seen = new Set();
  for (const d of diags) {
    if (d.file && norm(d.file.fileName) !== abs) continue;
    let path = "0:0";
    if (d.file && d.start !== undefined) {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      path = `${line + 1}:${character + 1}`;
    }
    const message = clip(ts.flattenDiagnosticMessageText(d.messageText, " ").replace(/\s+/g, " "));
    const key = `${d.code}|${path}|${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ layer: "type", rule: `TS${d.code}`, path, message });
  }
  return out;
}

/** @param {string[]} pos @param {Record<string, any>} flags */
async function cmdCheck(pos, flags) {
  const abs = lessonPath(pos[0]);
  const t0 = performance.now();
  /** @type {any[]} */
  let errors = typeErrors(abs);
  if (!errors.length) {
    let factory;
    try {
      factory = await importLesson(abs);
    } catch (e) {
      errors = [{ layer: "check", rule: "load-error", path: "lesson", message: clip(`cannot load the lesson: ${e instanceof Error ? e.message : String(e)}`) }];
    }
    if (factory) errors = (await checkLesson(factory, { file: abs })).errors;
  }
  const ok = errors.length === 0;
  if (flags.json) process.stdout.write(`${JSON.stringify({ ok, errors }, null, 2)}\n`);
  else {
    const shown = relative(process.cwd(), abs) || abs;
    for (const e of errors) process.stdout.write(`${shown} ${e.path} [${e.rule}] ${e.message}${e.viewport ? ` (${e.viewport})` : ""}\n`);
    process.stdout.write(ok ? "ok\n" : `${errors.length} errors\n`);
  }
  const exit = ok ? 0 : 1;
  const count = (/** @type {string} */ layer) => errors.filter((e) => e.layer === layer).length;
  logRun(abs, "check", performance.now() - t0, exit, { type: count("type"), check: count("check"), layout: count("layout") });
  return exit;
}

export function requireDist() {
  if (!existsSync(join(DIST, "ltt-runtime.js"))) throw new Exit(1, `runtime bundle not found in ${DIST}; run: npm run build:runtime`);
}

const INDEX_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Learn to Tell</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="ltt/ltt.css">
</head>
<body>
<div id="ltt"></div>
<script type="module">
import { mount } from "./ltt/ltt-runtime.js";
const el = document.getElementById("ltt");
let factory;
try {
  factory = (await import("./lesson.js")).default;
} catch (err) {
  const failure = err;
  factory = () => { throw failure; };
}
mount(el, factory);
</script>
</body>
</html>
`;

/** @param {string} abs @param {string} out */
export async function writeHtml(abs, out) {
  requireDist();
  await mkdir(out, { recursive: true });
  await writeFile(join(out, "index.html"), INDEX_HTML);
  await cp(abs, join(out, "lesson.js"));
  await cp(DIST, join(out, "ltt"), { recursive: true });
}

/** @param {string[]} pos @param {Record<string, any>} flags */
async function cmdHtml(pos, flags) {
  if (typeof flags.out !== "string") throw new Exit(2, "missing --out <dir>");
  const abs = lessonPath(pos[0]);
  const t0 = performance.now();
  let exit = 0;
  try {
    await writeHtml(abs, resolve(flags.out));
    process.stdout.write(`${join(resolve(flags.out), "index.html")}\n`);
  } catch (e) {
    if (e instanceof Exit) exit = e.code;
    else throw e;
    process.stderr.write(`ltt html: ${e.message}\n`);
  }
  logRun(abs, "html", performance.now() - t0, exit, {});
  return exit;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

/** @param {string} root @param {number} port @returns {Promise<{ url: string; close: () => Promise<void> }>} */
export function serveDir(root, port) {
  const base = resolve(root);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      let p = resolve(base, `.${decodeURIComponent(url.pathname)}`);
      if (p !== base && !p.startsWith(base + sep)) {
        res.writeHead(403).end();
        return;
      }
      if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
      const body = await readFile(p);
      res.writeHead(200, { "content-type": /** @type {any} */ (MIME)[extname(p)] ?? "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(port, "127.0.0.1", () => {
      const a = /** @type {any} */ (server.address());
      ok({ url: `http://127.0.0.1:${a.port}/`, close: () => new Promise((r) => server.close(() => r(undefined))) });
    });
  });
}

/** @param {string[]} pos @param {Record<string, any>} flags */
async function cmdServe(pos, flags) {
  const dir = pos[0];
  if (!dir) throw new Exit(2, "missing <dir>");
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Exit(2, `directory not found: ${dir}`);
  const port = flags.port !== undefined ? Number(flags.port) : 4173;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Exit(2, `bad --port ${flags.port}`);
  const s = await serveDir(dir, port);
  process.stdout.write(`${s.url}\n`);
  await new Promise(() => {});
  return 0;
}

/** @param {string[]} pos */
async function cmdDigest(pos) {
  const abs = lessonPath(pos[0]);
  const t0 = performance.now();
  let exit = 0;
  try {
    const factory = await importLesson(abs);
    process.stdout.write(digest(factory));
  } catch (e) {
    process.stderr.write(`ltt digest: cannot load ${pos[0]}: ${e instanceof Error ? e.message : String(e)}\n`);
    exit = 1;
  }
  logRun(abs, "digest", performance.now() - t0, exit, {});
  return exit;
}

/** @param {string[]} argv */
export async function main(argv) {
  const [cmd, ...rest] = argv;
  try {
    const { pos, flags } = parseArgs(rest);
    if (cmd === "check") return await cmdCheck(pos, flags);
    if (cmd === "html") return await cmdHtml(pos, flags);
    if (cmd === "serve") return await cmdServe(pos, flags);
    if (cmd === "digest") return await cmdDigest(pos);
    if (cmd === "sheet") {
      const { cmdSheet } = await import("./sheet.mjs");
      return await cmdSheet(pos, flags);
    }
    throw new Exit(2, cmd ? `unknown command ${cmd}` : "missing command");
  } catch (e) {
    if (e instanceof Exit) {
      process.stderr.write(`ltt: ${e.message}\n${e.code === 2 && /usage|command|missing|option/.test(e.message) ? USAGE : ""}`);
      return e.code;
    }
    throw e;
  }
}

