import { spawn } from "node:child_process";
import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLttServer, lttHome } from "./server.mjs";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GALLERY_DIR = join(SKILL_DIR, "..", "..", "site", "gallery");
export const DEFAULT_SIZES = ["1440x900", "1280x800"];
const DEFAULT_BUDGET = 12000;
const DEFAULT_JOBS = 4;
const RUN_TIMEOUT = 60_000;
const LESSON_ID = /^[a-z0-9][a-z0-9-]*$/;
// Linked from the gallery index but they run no deck of their own, so `?audit` never fires there.
const GALLERY_SKIP = new Set(["index.html", "catalog.html"]);
const CHROME_PATHS = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
const CHROME_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
export const NO_CHROME = "Chrome을 찾지 못했다. --chrome <경로>나 LTT_CHROME으로 알려 주거나, 브라우저에서 수업 URL에 ?audit을 붙여 1440×900과 1280×800으로 연다.";

const USAGE = `사용법: node audit.mjs <대상>... [옵션]
       node audit.mjs --gallery [옵션]

대상: 수업 파일(<home>/lessons/<id>/lesson.html), 수업 id, 갤러리 파일(site/gallery/...), 또는 http(s) URL
옵션:
  --size WxH      측정 크기(반복 가능, 기본 ${DEFAULT_SIZES.join(" ")})
  --shots <dir>   장면마다 스크린샷 PNG를 <dir>에 남긴다
  --json          결과를 JSON으로 출력
  --chrome <경로>  Chrome 실행 파일(기본: LTT_CHROME, 설치 경로, PATH)
  --budget <ms>   가상 시간 예산(기본 ${DEFAULT_BUDGET})
  --jobs <n>      동시에 띄울 Chrome 수(기본 ${DEFAULT_JOBS})
  --home <dir>    수업 폴더 루트(기본: LTT_HOME 또는 ~/.learn-to-tell)
종료 코드: 0 경고 없음 · 1 경고 있음 · 2 Chrome 없음/측정 실패`;

export function findChrome(explicit = process.env.LTT_CHROME) {
  if (explicit) return existsSync(explicit) ? explicit : null;
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  for (const dir of (process.env.PATH || "").split(delimiter)) {
    if (!dir) continue;
    for (const name of CHROME_NAMES) if (existsSync(join(dir, name))) return join(dir, name);
  }
  return null;
}

export function galleryTargets(galleryDir = GALLERY_DIR) {
  if (!existsSync(galleryDir)) throw new Error(`갤러리가 없다: ${galleryDir} (갤러리는 저장소에만 있다)`);
  return readdirSync(galleryDir, { recursive: true })
    .map((f) => f.split("\\").join("/"))
    .filter((f) => f.endsWith(".html") && !f.startsWith("stale/") && !GALLERY_SKIP.has(f))
    .sort()
    .map((f) => join(galleryDir, f));
}

function realpathIfExists(p) {
  return existsSync(p) ? realpathSync(p) : null;
}

function under(base, file) {
  const rel = relative(base, file);
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel.split("\\").join("/") : null;
}

function resolveTarget(target, { home, galleryDir }) {
  if (/^https?:\/\//.test(target)) return { label: target, url: target };
  let file = resolve(target);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "lesson.html");
  if (!existsSync(file) && LESSON_ID.test(target)) file = join(home, "lessons", target, "lesson.html");
  if (!existsSync(file)) throw new Error(`${target}: 파일이 없다 (${file})`);
  file = realpathSync(file);
  const lessons = realpathIfExists(join(home, "lessons"));
  const gallery = realpathIfExists(galleryDir);
  let rel;
  if (lessons && (rel = under(lessons, file))) return { label: `lessons/${rel}`, path: `/lessons/${rel}` };
  if (gallery && (rel = under(gallery, file))) return { label: rel, path: `/gallery/${rel}` };
  throw new Error(`${target}: ${join(home, "lessons")} 또는 ${galleryDir} 아래 파일만 열 수 있다. 수업 폴더에 두거나 URL을 넘긴다.`);
}

function chromeArgs(profile, size, ...rest) {
  return ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", `--user-data-dir=${profile}`, `--window-size=${size.replace("x", ",")}`, ...rest];
}

function runChrome(chrome, args, timeout = RUN_TIMEOUT) {
  return new Promise((done) => {
    const child = spawn(chrome, args, { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeout);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => { out += d; });
    child.on("error", (err) => { clearTimeout(timer); done({ out, error: err.message }); });
    child.on("close", () => { clearTimeout(timer); done({ out, error: timedOut ? `Chrome이 ${timeout / 1000}초 안에 끝나지 않았다` : null }); });
  });
}

function withQuery(url, q) {
  const [main, hash] = url.split("#");
  return main + (main.includes("?") ? "&" : "?") + q + (hash ? "#" + hash : "");
}

async function runOne(chrome, profile, run, budget, attempt = 1) {
  const base = { target: run.target, size: run.size, url: run.url };
  const { out, error } = await runChrome(chrome, chromeArgs(profile, run.size, `--virtual-time-budget=${budget}`, "--dump-dom", withQuery(run.url, "audit")));
  if (error) return { ...base, error };
  const m = out.match(/<script[^>]*id="ltt-audit"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) {
    // Under CPU load the deck's deferred audit can miss the virtual-time budget; each retry waits, then starts a fresh Chrome with triple the budget.
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
      return runOne(chrome, profile, run, budget * 3, attempt + 1);
    }
    return { ...base, error: out.trim() ? "audit이 돌지 않았다(#ltt-audit 없음). LTT.deck 페이지인지, 서버 경로가 맞는지 본다" : "Chrome이 아무것도 출력하지 않았다" };
  }
  try {
    const data = JSON.parse(m[1]);
    return { ...base, scenes: data.scenes, viewport: data.viewport, audit: data.audit, lint: data.lint, expectFails: data.expectFails };
  } catch {
    return { ...base, error: "#ltt-audit JSON을 읽을 수 없다" };
  }
}

async function takeShots(chrome, profile, run, scenes, budget, dir) {
  const slug = run.target.replace(/^https?:\/\//, "").replace(/\.html$/, "").replace(/[^\w.-]+/g, "-");
  const files = [];
  for (let i = 1; i <= scenes; i++) {
    const file = join(dir, `${slug}-${run.size}-${String(i).padStart(2, "0")}.png`);
    const { error } = await runChrome(chrome, chromeArgs(profile, run.size, `--virtual-time-budget=${budget}`, `--screenshot=${file}`, run.url.split("#")[0] + "#" + i));
    if (!error) files.push(file);
  }
  return files;
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }));
  return results;
}

export async function audit({ targets, sizes = DEFAULT_SIZES, chrome = findChrome(), budget = DEFAULT_BUDGET, jobs = DEFAULT_JOBS, home = lttHome(), galleryDir = GALLERY_DIR, shots = null }) {
  if (!chrome) throw new Error(NO_CHROME);
  const resolved = targets.map((t) => resolveTarget(t, { home, galleryDir }));
  const server = resolved.some((t) => t.path) ? createLttServer({ home, galleryDir }) : null;
  const tmp = await mkdtemp(join(tmpdir(), "ltt-audit-"));
  try {
    let base = "";
    if (server) {
      await new Promise((r) => server.listen(0, "127.0.0.1", r));
      base = `http://127.0.0.1:${server.address().port}`;
    }
    if (shots) await mkdir(shots, { recursive: true });
    const runs = [];
    for (const t of resolved) for (const size of sizes) runs.push({ target: t.label, url: t.url || base + t.path, size });
    return await pool(runs, Math.max(1, jobs), async (run, i) => {
      const profile = join(tmp, `p${i}`);
      const r = await runOne(chrome, profile, run, budget);
      if (shots && r.scenes) r.shots = await takeShots(chrome, profile, run, r.scenes, budget, shots);
      return r;
    });
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    }
    await rm(tmp, { recursive: true, force: true });
  }
}

export function formatReport(results) {
  const width = Math.max(...results.map((r) => r.target.length));
  const lines = [];
  const totals = {};
  for (const r of results) {
    const head = `${r.size.padEnd(9)} ${r.target.padEnd(width)}`;
    if (r.error) {
      lines.push(`${head}  오류: ${r.error}`);
      continue;
    }
    const total = totals[r.size] ||= { n: 0, viewport: r.viewport };
    total.n += r.audit.length;
    lines.push(`${head}  audit ${r.audit.length} · lint ${r.lint.length} · expect ${r.expectFails.length}${r.shots ? ` · shots ${r.shots.length}` : ""}`);
    r.audit.forEach((w) => lines.push(`    장면 ${w.scene} [${w.rule}]: ${w.msg}`));
    r.lint.forEach((w) => lines.push(`    lint${w.scene ? ` 장면 ${w.scene}` : ""}: ${w.msg}`));
    r.expectFails.forEach((t) => lines.push(`    ${t}`));
  }
  // Headless `--window-size` is the outer window, so the page sees a shorter viewport; the summary shows what was actually measured.
  lines.push(Object.keys(totals).map((s) => `${s} (화면 ${totals[s].viewport.join("×")}): audit ${totals[s].n}건`).join(" · ") || "측정된 결과 없음");
  return lines.join("\n");
}

export function exitCode(results) {
  if (results.some((r) => r.error)) return 2;
  return results.some((r) => r.audit.length || r.lint.length || r.expectFails.length) ? 1 : 0;
}

function parseArgs(argv) {
  const opts = { targets: [], sizes: [], json: false, gallery: false, shots: null, chrome: undefined, budget: DEFAULT_BUDGET, jobs: DEFAULT_JOBS, home: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a}: 값이 필요하다`);
      return argv[++i];
    };
    if (a === "--size") opts.sizes.push(next());
    else if (a === "--shots") opts.shots = next();
    else if (a === "--json") opts.json = true;
    else if (a === "--gallery") opts.gallery = true;
    else if (a === "--chrome") opts.chrome = next();
    else if (a === "--budget") opts.budget = Number(next());
    else if (a === "--jobs") opts.jobs = Number(next());
    else if (a === "--home") opts.home = next();
    else if (a === "--help" || a === "-h") opts.help = true;
    else if (a.startsWith("-")) throw new Error(`모르는 옵션: ${a}`);
    else opts.targets.push(a);
  }
  for (const s of opts.sizes) if (!/^\d+x\d+$/.test(s)) throw new Error(`--size는 WxH 형식이다: ${s}`);
  if (!(opts.budget > 0) || !(opts.jobs > 0)) throw new Error("--budget과 --jobs는 양수여야 한다");
  return opts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message + "\n\n" + USAGE);
    process.exit(2);
  }
  if (opts.help) return console.log(USAGE);
  const chrome = findChrome(opts.chrome);
  if (!chrome) {
    console.error(NO_CHROME);
    process.exit(2);
  }
  let results;
  try {
    const targets = [...opts.targets, ...(opts.gallery ? galleryTargets() : [])];
    if (!targets.length) throw new Error("대상이 없다.\n\n" + USAGE);
    results = await audit({
      targets,
      sizes: opts.sizes.length ? opts.sizes : DEFAULT_SIZES,
      chrome,
      budget: opts.budget,
      jobs: opts.jobs,
      home: opts.home ? resolve(opts.home) : lttHome(),
      shots: opts.shots ? resolve(opts.shots) : null,
    });
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }
  console.log(opts.json ? JSON.stringify(results, null, 2) : formatReport(results));
  process.exit(exitCode(results));
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
