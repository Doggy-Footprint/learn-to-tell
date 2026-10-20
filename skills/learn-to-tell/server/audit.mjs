import { spawn } from "node:child_process";
import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createLttServer, lttHome } from "./server.mjs";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GALLERY_DIR = join(SKILL_DIR, "..", "..", "site", "gallery");
export const DEFAULT_SIZES = ["1440x900", "1280x800"];
const DEFAULT_BUDGET = 12000;
const DEFAULT_JOBS = 4;
const RUN_TIMEOUT = 60_000;
const SHEET_SIZE = "1280x800";
const SHEET_FILE = /^sheet(-\d+)?\.jpg$/;
const SHEET_MAX_SIDE = 1568;
const SHEET_MAX_AREA = 1_200_000;
const SHEET_COLS = 4;
const CELL_W = 320;
const CELL_GAP = 8;
const LABEL_H = 22;
const FOOT_LINE = 17;
const FOOT_H = 3 * FOOT_LINE + 5;
const MAX_CELLS = 4;
const COMPOSE_BUDGET = 10000;
const LESSON_ID = /^[a-z0-9][a-z0-9-]*$/;
// Linked from the gallery index but they run no deck of their own, so `?audit` never fires there.
const GALLERY_SKIP = new Set(["index.html", "catalog.html"]);
// stale/ needs the old kit; shots/ holds single-scene exemplars, where deck-order lint (hook first, keywords last) always fires.
const GALLERY_SKIP_DIRS = ["stale/", "shots/"];
const CHROME_PATHS = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
const CHROME_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
export const NO_CHROME = "Chrome을 찾지 못했다. --chrome <경로>나 LTT_CHROME으로 알려 주거나, 브라우저에서 수업 URL에 ?audit을 붙여 1440×900과 1280×800으로 연다.";

const USAGE = `사용법: node audit.mjs <대상>... [옵션]
       node audit.mjs --gallery [옵션]

대상: 수업 파일(<home>/lessons/<id>/lesson.html), 수업 id, 갤러리 파일(site/gallery/...), 또는 http(s) URL
옵션:
  --size WxH      측정 크기(반복 가능, 기본 ${DEFAULT_SIZES.join(" ")})
  --shots <dir>   장면마다 스크린샷 PNG를 <dir>에 남긴다
  --sheet         장면 전체를 칸으로 줄여 담은 contact sheet JPEG를 만든다(수업은 <수업>/audit/, 그 밖은 OS 임시 폴더)
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
    .filter((f) => f.endsWith(".html") && !GALLERY_SKIP_DIRS.some((d) => f.startsWith(d)) && !GALLERY_SKIP.has(f))
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
    let settled = false;
    const finish = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done(r);
    };
    // A hung Chrome helper can hold the stdout pipe open after the browser process is killed, so "close" may never
    // fire; the timeout resolves on its own instead of waiting for it.
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({ out, error: `Chrome이 ${timeout / 1000}초 안에 끝나지 않았다` });
    }, timeout);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => { out += d; });
    child.on("error", (err) => finish({ out, error: err.message }));
    child.on("close", () => finish({ out, error: null }));
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
    return { ...base, scenes: data.scenes, viewport: data.viewport, audit: data.audit, lint: data.lint, expectFails: data.expectFails, beats: data.beats, types: data.types };
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

function sheetDir(label, home) {
  const lesson = label.match(/^lessons\/([^/]+)\//);
  if (lesson) return join(home, "lessons", lesson[1], "audit");
  const root = join(tmpdir(), "ltt-audit-sheets");
  // The label can be an arbitrary URL; a slug made only of dots would resolve to the root or above it.
  let slug = label.replace(/[^\w.-]/g, "-");
  if (/^\.*$/.test(slug)) slug = slug.replace(/\./g, "-") || "-";
  return join(root, slug);
}

function pickBeats(beats) {
  const texted = beats.filter((b) => b.text);
  const list = (texted.length ? texted : beats).slice().sort((a, b) => a.t - b.t);
  if (list.length <= MAX_CELLS) return list;
  return Array.from({ length: MAX_CELLS }, (_, k) => list[Math.round((k * (list.length - 1)) / (MAX_CELLS - 1))]);
}

function sheetWarnings(results, target) {
  const warn = {};
  for (const r of results) {
    if (r.target !== target || r.error) continue;
    for (const w of r.audit) (warn[w.scene] ||= new Set()).add(w.rule);
    for (const w of r.lint) if (w.scene) (warn[w.scene] ||= new Set()).add(w.rule || "lint");
  }
  return (scene) => [...(warn[scene] || [])].sort();
}

function sheetCells(r, warnOf) {
  const cells = [];
  for (let i = 0; i < r.scenes; i++) {
    const scene = i + 1;
    const base = { file: null, scene, type: (r.types && r.types[i]) || "", warn: warnOf(scene) };
    const beats = pickBeats((r.beats && r.beats[i]) || []);
    if (!beats.length) cells.push({ ...base, t: null, text: null });
    for (const b of beats) cells.push({ ...base, t: b.t, text: b.text || null });
  }
  return cells;
}

function layoutSheets(cells, viewport) {
  const capH = Math.round((CELL_W * viewport[1]) / viewport[0]);
  const pitchX = CELL_W + CELL_GAP;
  const pitchY = LABEL_H + capH + FOOT_H + CELL_GAP;
  const width = CELL_GAP + SHEET_COLS * pitchX;
  const maxH = Math.min(SHEET_MAX_SIDE, Math.floor(SHEET_MAX_AREA / width));
  const perSheet = SHEET_COLS * Math.max(1, Math.floor((maxH - CELL_GAP) / pitchY));
  const sheets = [];
  let start = 0;
  while (start < cells.length) {
    let end = start;
    // A scene's cells never straddle two sheets.
    while (end < cells.length) {
      let next = end;
      while (next < cells.length && cells[next].scene === cells[end].scene) next++;
      if (next - start > perSheet && end > start) break;
      end = next;
    }
    sheets.push(cells.slice(start, end));
    start = end;
  }
  return sheets.map((list) => {
    list.forEach((c, k) => {
      c.x = CELL_GAP + (k % SHEET_COLS) * pitchX;
      c.y = CELL_GAP + Math.floor(k / SHEET_COLS) * pitchY + LABEL_H;
      c.w = CELL_W;
      c.h = capH;
    });
    return { cells: list, width, height: CELL_GAP + Math.ceil(list.length / SHEET_COLS) * pitchY };
  });
}

function labelText(text, max = 60) {
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max).join("") + "…" : text;
}

const COMPOSE_SCRIPT = `
const S = JSON.parse(document.getElementById("spec").textContent);
const cv = document.createElement("canvas");
cv.width = S.width; cv.height = S.height;
const g = cv.getContext("2d");
g.fillStyle = "#fff"; g.fillRect(0, 0, S.width, S.height);
const font = "14px -apple-system, 'Apple SD Gothic Neo', 'Noto Sans CJK KR', 'Malgun Gothic', sans-serif";
function wrap(text, w, max) {
  const lines = [];
  let rest = text;
  while (rest && lines.length < max) {
    let n = rest.length;
    while (n > 1 && g.measureText(rest.slice(0, n)).width > w) n--;
    if (n < rest.length) { const sp = rest.lastIndexOf(" ", n); if (sp > 0) n = sp; }
    lines.push(rest.slice(0, n).trim());
    rest = rest.slice(n).trim();
  }
  if (rest) {
    let last = lines[max - 1];
    while (last && g.measureText(last + "…").width > w) last = last.slice(0, -1);
    lines[max - 1] = last + "…";
  }
  return lines;
}
function clipped(x, y, w, h, fn) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(); g.restore(); }
Promise.all(S.cells.map((c) => c.src ? new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = c.src; }) : null)).then((imgs) => {
  S.cells.forEach((c, i) => {
    const im = imgs[i];
    g.font = font; g.textBaseline = "middle";
    if (im) {
      g.drawImage(im, 0, 0, Math.min(im.width, S.vw), Math.min(im.height, S.vh), c.x, c.y, c.w, c.h);
    } else {
      g.fillStyle = "#bbb"; g.fillRect(c.x, c.y, c.w, c.h);
      g.fillStyle = "#333"; g.textAlign = "center"; g.fillText("촬영 실패", c.x + c.w / 2, c.y + c.h / 2); g.textAlign = "left";
    }
    g.strokeStyle = "#999"; g.lineWidth = 1; g.strokeRect(c.x - 0.5, c.y - 0.5, c.w + 1, c.h + 1);
    const ty = c.y - S.label, by = c.y + c.h;
    let left = c.w;
    if (c.badge) {
      const bw = Math.min(g.measureText(c.badge).width + 10, c.w / 2);
      left = c.w - bw - 4;
      g.fillStyle = "#c62828"; g.fillRect(c.x + c.w - bw, ty + 2, bw, S.label - 4);
      clipped(c.x + c.w - bw, ty, bw, S.label, () => { g.fillStyle = "#fff"; g.fillText(c.badge, c.x + c.w - bw + 5, ty + S.label / 2); });
    }
    clipped(c.x, ty, left, S.label, () => { g.fillStyle = "#111"; g.fillText(c.head, c.x + 2, ty + S.label / 2); });
    if (c.foot) clipped(c.x, by, c.w, S.foot, () => {
      g.fillStyle = "#333";
      wrap(c.foot, c.w - 4, 3).forEach((l, k) => g.fillText(l, c.x + 2, by + 3 + S.line * (k + 0.5)));
    });
  });
  document.getElementById("out").textContent = cv.toDataURL("image/jpeg", 0.8);
});
`;

async function composeSheet(chrome, profile, tmp, n, sheet, viewport, srcs) {
  const spec = {
    width: sheet.width, height: sheet.height, vw: viewport[0], vh: viewport[1], label: LABEL_H, foot: FOOT_H, line: FOOT_LINE,
    cells: sheet.cells.map((c, i) => ({
      x: c.x, y: c.y, w: c.w, h: c.h, src: srcs[i],
      head: `${c.scene}${c.type ? " · " + c.type : ""}`,
      badge: c.warn.join(", "),
      foot: c.t == null ? "" : c.text ? labelText(c.text) : `${c.t / 1000}s`,
    })),
  };
  const page = join(tmp, `compose-${n}.html`);
  await writeFile(page, `<!doctype html><meta charset="utf-8"><script type="application/json" id="spec">${JSON.stringify(spec).replace(/</g, "\\u003c")}</script><pre id="out"></pre><script>${COMPOSE_SCRIPT}</script>`);
  const { out, error } = await runChrome(chrome, chromeArgs(profile, "800x600", `--virtual-time-budget=${COMPOSE_BUDGET}`, "--dump-dom", pathToFileURL(page).href));
  if (error) throw new Error(error);
  const m = out.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/);
  const jpg = m && Buffer.from(m[1], "base64");
  if (!jpg || jpg[0] !== 0xff || jpg[1] !== 0xd8) throw new Error("Chrome이 JPEG를 만들지 못했다");
  return jpg;
}

async function makeSheets(chrome, tmp, results, sizes, jobs, home, budget) {
  const size = sizes.includes(SHEET_SIZE) ? SHEET_SIZE : sizes[0];
  const jobsList = results.filter((r) => r.size === size && !r.error).map((r, ti) => {
    const cells = sheetCells(r, sheetWarnings(results, r.target));
    r.sheet = { size, dir: sheetDir(r.target, home), files: [], cells, failed: 0, error: null };
    return { r, ti, sheets: layoutSheets(cells, r.viewport) };
  });
  const ready = [];
  for (const job of jobsList) {
    try {
      await mkdir(job.r.sheet.dir, { recursive: true });
      for (const f of await readdir(job.r.sheet.dir)) if (SHEET_FILE.test(f)) await rm(join(job.r.sheet.dir, f), { force: true });
      ready.push(job);
    } catch (err) {
      job.r.sheet.error = `폴더를 쓸 수 없다 (${job.r.sheet.dir}): ${err.message}`;
    }
  }
  const shots = ready.flatMap((job) => job.r.sheet.cells.map((c, ci) => ({ job, c, ci })));
  await pool(shots, Math.max(1, jobs), async ({ job, c, ci }) => {
    const png = join(tmp, `sheet${job.ti}-${ci}.png`);
    const at = c.t == null ? budget : Math.max(1, c.t);
    const url = job.r.url.split("#")[0] + "#" + c.scene;
    const { error } = await runChrome(chrome, chromeArgs(join(tmp, `sp${job.ti}-${ci}`), size, `--virtual-time-budget=${at}`, `--screenshot=${png}`, url));
    c.src = !error && existsSync(png) ? "data:image/png;base64," + (await readFile(png)).toString("base64") : null;
    c.failed = !c.src;
  });
  await pool(ready, Math.max(1, jobs), async (job) => {
    const { sheet } = job.r;
    try {
      for (let n = 0; n < job.sheets.length; n++) {
        const file = join(sheet.dir, n ? `sheet-${n + 1}.jpg` : "sheet.jpg");
        const jpg = await composeSheet(chrome, join(tmp, `sc${job.ti}-${n}`), tmp, `${job.ti}-${n}`, job.sheets[n], job.r.viewport, job.sheets[n].cells.map((c) => c.src));
        await writeFile(file, jpg);
        job.sheets[n].cells.forEach((c) => { c.file = file; });
        sheet.files.push(file);
      }
    } catch (err) {
      sheet.error = err.message;
    }
  });
  for (const job of jobsList) {
    for (const c of job.r.sheet.cells) {
      delete c.src;
      c.failed = !!c.failed;
    }
    job.r.sheet.failed = job.r.sheet.cells.filter((c) => c.failed).length;
  }
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

export async function audit({ targets, sizes = DEFAULT_SIZES, chrome = findChrome(), budget = DEFAULT_BUDGET, jobs = DEFAULT_JOBS, home = lttHome(), galleryDir = GALLERY_DIR, shots = null, sheet = false }) {
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
    const results = await pool(runs, Math.max(1, jobs), async (run, i) => {
      const profile = join(tmp, `p${i}`);
      const r = await runOne(chrome, profile, run, budget);
      if (shots && r.scenes) r.shots = await takeShots(chrome, profile, run, r.scenes, budget, shots);
      return r;
    });
    if (sheet) await makeSheets(chrome, tmp, results, sizes, jobs, home, budget);
    return results;
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
  for (const r of results) {
    if (!r.sheet) continue;
    const s = r.sheet;
    lines.push(`sheet ${r.target}: ${s.error ? `오류: ${s.error}` : s.files.join(" ") + (s.failed ? ` (칸 ${s.failed}개 촬영 실패)` : "")}`);
  }
  return lines.join("\n");
}

export function exitCode(results) {
  if (results.some((r) => r.error || (r.sheet && r.sheet.error))) return 2;
  return results.some((r) => r.audit.length || r.lint.length || r.expectFails.length) ? 1 : 0;
}

function parseArgs(argv) {
  const opts = { targets: [], sizes: [], json: false, gallery: false, shots: null, sheet: false, chrome: undefined, budget: DEFAULT_BUDGET, jobs: DEFAULT_JOBS, home: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a}: 값이 필요하다`);
      return argv[++i];
    };
    if (a === "--size") opts.sizes.push(next());
    else if (a === "--shots") opts.shots = next();
    else if (a === "--json") opts.json = true;
    else if (a === "--sheet") opts.sheet = true;
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
      sheet: opts.sheet,
    });
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }
  console.log(opts.json ? JSON.stringify(results, null, 2) : formatReport(results));
  // process.exit would cut a piped stdout short once the JSON passes the pipe buffer.
  process.exitCode = exitCode(results);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
