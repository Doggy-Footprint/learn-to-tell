import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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
const MAX_PAGE_SHOTS = 30;
// An id becomes part of a PNG file name, so this is also the path-escape guard.
const SHOT_ID = /^[A-Za-z0-9_-]+$/;
const LESSON_ID = /^[a-z0-9][a-z0-9-]*$/;
// Linked from the gallery index but they hold no lesson of their own, so there is nothing to check.
const GALLERY_SKIP = new Set(["index.html", "catalog.html"]);
// stale/ needs the old kit; shots/ holds single-scene exemplars, not whole lessons.
const GALLERY_SKIP_DIRS = ["stale/", "shots/"];
const CHROME_PATHS = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
const CHROME_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
export const NO_CHROME = "Chrome을 찾지 못했다. --chrome <경로>나 LTT_CHROME으로 알려 주거나, 브라우저에서 수업 URL에 ?shot을 붙여 1440×900과 1280×800으로 열어 눈으로 본다.";

const USAGE = `사용법: node audit.mjs <대상>... [옵션]
       node audit.mjs --gallery [옵션]

대상: 수업 파일(<home>/lessons/<id>/lesson.html), 수업 id, 갤러리 파일(site/gallery/...), 또는 http(s) URL
옵션:
  --size WxH         측정 크기(반복 가능, 기본 ${DEFAULT_SIZES.join(" ")})
  --shots <dir>      덱은 장면마다, 덱 아닌 페이지는 스크롤 위치마다 스크린샷 PNG를 <dir>에 남긴다(크기당 ${MAX_PAGE_SHOTS}장까지)
  --checklist <file> checklist의 [shot <id> <ms>] 표식마다 그 시점의 PNG를 한 장씩 더 남긴다(--shots와 함께)
  --json             결과를 JSON으로 출력
  --chrome <경로>     Chrome 실행 파일(기본: LTT_CHROME, 설치 경로, PATH)
  --budget <ms>      페이지가 준비되길 기다리는 시간(기본 ${DEFAULT_BUDGET})
  --jobs <n>         동시에 띄울 Chrome 수(기본 ${DEFAULT_JOBS})
  --home <dir>       수업 폴더 루트(기본: LTT_HOME 또는 ~/.learn-to-tell)
종료 코드: 0 오류 없음 · 1 check 오류나 표식 오류 있음 · 2 Chrome 없음/측정 실패/checklist 파일 없음`;

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

const CDP_TIMEOUT = 30_000;

// Chrome 155 headless `--screenshot` paints a scrolled document blank, so shots go through CDP over a pipe
// (fd 3: to Chrome, fd 4: from Chrome, NUL-terminated JSON). The kill timers stand in for the old whole-run timeout: a hung Chrome cannot stall the audit.
function openCdp(chrome, profile, size) {
  const child = spawn(chrome, chromeArgs(profile, size, "--remote-debugging-pipe", "about:blank"), { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
  const pending = new Map();
  let id = 0;
  let buf = "";
  let dead = null;
  const fail = (msg) => {
    dead ||= msg;
    for (const p of pending.values()) p.reject(new Error(dead));
    pending.clear();
  };
  child.on("error", (err) => fail(err.message));
  const exited = new Promise((r) => child.on("exit", () => { fail("Chrome이 끝났다"); r(); }));
  child.stdio[3].on("error", () => {});
  child.stdio[4].setEncoding("utf8");
  child.stdio[4].on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\0")) >= 0) {
      const text = buf.slice(0, i);
      buf = buf.slice(i + 1);
      let m;
      try { m = JSON.parse(text); } catch { continue; }
      const p = m.id && pending.get(m.id);
      if (!p) continue;
      pending.delete(m.id);
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result);
    }
  });
  const send = (method, params = {}, sessionId, timeout = CDP_TIMEOUT) => new Promise((resolve, reject) => {
    if (dead) return reject(new Error(dead));
    const n = ++id;
    const timer = setTimeout(() => { pending.delete(n); reject(new Error(`${method}가 ${timeout / 1000}초 안에 끝나지 않았다`)); }, timeout);
    pending.set(n, { resolve: (r) => { clearTimeout(timer); resolve(r); }, reject: (e) => { clearTimeout(timer); reject(e); } });
    child.stdio[3].write(JSON.stringify({ id: n, method, params, sessionId }) + "\0");
  });
  // Waits for the exit (bounded) so Chrome is no longer writing into the profile when the caller removes it.
  return {
    send,
    close: async () => {
      fail("닫음");
      child.kill("SIGKILL");
      await Promise.race([exited, sleep(5000)]);
    }
  };
}

async function openSession(cdp) {
  const { targetInfos } = await cdp.send("Target.getTargets");
  const target = targetInfos.find((t) => t.type === "page");
  if (!target) throw new Error("Chrome에 페이지가 없다");
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const call = (method, params) => cdp.send(method, params, sessionId);
  await call("Page.enable");
  await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  return call;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Opens `url` as a new document (via about:blank, so a hash-only change never reuses the old one) and waits for the kit's `data-ltt-shot`.
async function load(call, url, wait) {
  await call("Page.navigate", { url: "about:blank" });
  await call("Page.navigate", { url });
  const end = Date.now() + wait;
  while (Date.now() < end) {
    const r = await call("Runtime.evaluate", { expression: "document.documentElement.hasAttribute('data-ltt-shot')", returnByValue: true });
    if (r.result.value === true) return true;
    await sleep(100);
  }
  return false;
}

function withQuery(url, q) {
  const [main, hash] = url.split("#");
  return main + (main.includes("?") ? "&" : "?") + q + (hash ? "#" + hash : "");
}

export function parseChecklist(text) {
  const marks = [];
  const errors = [];
  const seen = new Set();
  const valid = /\[shot[ \t]+([A-Za-z0-9_-]+)[ \t]+(\d+)\]/y;
  const start = /\[shot/g;
  let m;
  while ((m = start.exec(text))) {
    valid.lastIndex = m.index;
    const ok = valid.exec(text);
    if (ok) {
      const id = ok[1];
      const ms = Number(ok[2]);
      const key = `${id}\0${ms}`;
      if (!seen.has(key)) {
        seen.add(key);
        marks.push({ id, ms });
      }
      start.lastIndex = valid.lastIndex;
      continue;
    }
    const rest = text.slice(m.index).split("\n")[0];
    const close = rest.indexOf("]");
    const fragment = (close >= 0 ? rest.slice(0, close + 1) : rest).trimEnd();
    errors.push({ where: "checklist", rule: "shot-format", msg: `표식 형식이 아니다: ${fragment.slice(0, 60)} ([shot <id> <ms>] 형식. id는 영문·숫자·_·-, ms는 0 이상 정수)` });
    start.lastIndex = m.index + Math.max(fragment.length, 1);
  }
  return { marks, errors };
}

function checkMarks(parsed, clocks) {
  const out = [...parsed.errors];
  const valid = [];
  for (const mark of parsed.marks) {
    const c = clocks.find((k) => k.id === mark.id);
    if (!c) out.push({ where: "checklist", rule: "shot-unknown-clock", msg: `[shot ${mark.id} ${mark.ms}]: 이 페이지에 clock id '${mark.id}'가 없다 (있는 id: ${clocks.map((k) => k.id).join(", ") || "없음"})` });
    else if (mark.ms > c.dur) out.push({ where: "checklist", rule: "shot-bad-time", msg: `[shot ${mark.id} ${mark.ms}]: ms가 clock '${mark.id}'의 길이 ${c.dur}를 넘는다` });
    else valid.push(mark);
  }
  return { errors: out, valid };
}

async function readCheck(call, url, budget) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (!(await load(call, url, budget))) continue;
    const r = await call("Runtime.evaluate", { expression: "(document.getElementById('ltt-check')||{}).textContent||''", returnByValue: true });
    try {
      return { check: JSON.parse(r.result.value) };
    } catch {
      return { error: "#ltt-check JSON을 읽을 수 없다" };
    }
  }
  return { error: "#ltt-check가 없다. kit(ltt.js)을 불러오는 페이지인지, 서버 경로가 맞는지 본다" };
}

async function takeShot(call, budget, file, url) {
  try {
    if (!(await load(call, url, budget))) return false;
    // The deck's scene transition outlasts the signal; two frames then let the compositor settle.
    await sleep(500);
    await call("Runtime.evaluate", { expression: "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))", awaitPromise: true });
    const shot = await call("Page.captureScreenshot", { format: "png" });
    await writeFile(file, Buffer.from(shot.data, "base64"));
    return true;
  } catch {
    return false;
  }
}

async function takeShots(call, run, check, validMarks, budget, dir) {
  const slug = run.target.replace(/^https?:\/\//, "").replace(/\.html$/, "").replace(/[^\w.-]+/g, "-");
  const pad = (n) => String(n).padStart(2, "0");
  const page = run.url.split("#")[0];
  const jobs = [];
  let truncated = false;
  if (typeof check.scenes === "number") {
    truncated = check.scenes > MAX_PAGE_SHOTS;
    for (let i = 1; i <= Math.min(check.scenes, MAX_PAGE_SHOTS); i++) jobs.push([`${slug}-${run.size}-s${pad(i)}.png`, withQuery(page, "shot") + "#" + i]);
  } else {
    const h = check.viewport[1];
    const count = Math.max(1, Math.ceil(check.scroll / h));
    truncated = count > MAX_PAGE_SHOTS;
    for (let i = 0; i < Math.min(count, MAX_PAGE_SHOTS); i++) jobs.push([`${slug}-${run.size}-p${pad(i + 1)}.png`, withQuery(page, `shot&y=${i * h}`)]);
  }
  for (const { id, ms } of validMarks) {
    if (!SHOT_ID.test(id) || !Number.isInteger(ms)) continue;
    jobs.push([`${slug}-${run.size}-${id}-t${ms}.png`, withQuery(page, `shot&clock=${id}&t=${ms}`)]);
  }
  const files = [];
  for (const [name, url] of jobs) {
    const file = join(dir, name);
    if (await takeShot(call, budget, file, url)) files.push(file);
  }
  return { files, truncated };
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

export async function audit({ targets, sizes = DEFAULT_SIZES, chrome = findChrome(), budget = DEFAULT_BUDGET, jobs = DEFAULT_JOBS, home = lttHome(), galleryDir = GALLERY_DIR, shots = null, checklist = null }) {
  if (!chrome) throw new Error(NO_CHROME);
  if (checklist && !existsSync(checklist)) throw new Error(`--checklist 파일이 없다: ${checklist}`);
  const parsed = checklist ? parseChecklist(readFileSync(checklist, "utf8")) : { marks: [], errors: [] };
  const resolved = targets.map((t) => resolveTarget(t, { home, galleryDir }));
  const server = resolved.some((t) => t.path) ? createLttServer({ home, galleryDir }) : null;
  const tmp = await mkdtemp(join(tmpdir(), "ltt-shots-"));
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
      const base = { target: run.target, size: run.size, url: run.url };
      const cdp = openCdp(chrome, profile, run.size);
      try {
        const call = await openSession(cdp);
        const r = await readCheck(call, withQuery(run.url, "shot"), budget);
        if (r.error) return { ...base, error: r.error };
        const { check } = r;
        const marks = checkMarks(parsed, check.clocks || []);
        const result = { ...base, viewport: check.viewport, scroll: check.scroll, check: check.errors, marks: marks.errors, shots: [], truncated: false };
        if (shots) {
          const t = await takeShots(call, run, check, marks.valid, budget, shots);
          result.shots = t.files;
          result.truncated = t.truncated;
        }
        return result;
      } catch (err) {
        return { ...base, error: err.message };
      } finally {
        await cdp.close();
      }
    });
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    }
    // Chrome helper processes can outlive the browser for a moment; a leftover temp dir must not turn a finished result into an error.
    await rm(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
  }
}

export function formatReport(results) {
  const lines = [];
  const totals = {};
  for (const r of results) {
    const head = `${r.size} ${r.target}`;
    if (r.error) {
      lines.push(`${head}  오류: ${r.error}`);
      continue;
    }
    const total = totals[r.size] ||= { n: 0, viewport: r.viewport };
    total.n += r.check.length;
    lines.push(`${head}  check ${r.check.length} · marks ${r.marks.length} · shots ${r.shots.length}${r.truncated ? " (잘림)" : ""}`);
    r.check.forEach((w) => lines.push(`    check ${w.where} [${w.rule}]: ${w.msg}`));
    r.marks.forEach((w) => lines.push(`    checklist [${w.rule}]: ${w.msg}`));
    r.shots.forEach((f) => lines.push(`    ${f}`));
  }
  // Headless `--window-size` is the outer window, so the page sees a shorter viewport; the summary shows what was actually measured.
  lines.push(Object.keys(totals).map((s) => `${s} (화면 ${totals[s].viewport.join("×")}): check ${totals[s].n}건`).join(" · ") || "측정된 결과 없음");
  return lines.join("\n");
}

export function exitCode(results) {
  if (results.some((r) => r.error)) return 2;
  return results.some((r) => r.check.length || r.marks.length) ? 1 : 0;
}

function parseArgs(argv) {
  const opts = { targets: [], sizes: [], json: false, gallery: false, shots: null, checklist: null, chrome: undefined, budget: DEFAULT_BUDGET, jobs: DEFAULT_JOBS, home: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a}: 값이 필요하다`);
      return argv[++i];
    };
    if (a === "--size") opts.sizes.push(next());
    else if (a === "--shots") opts.shots = next();
    else if (a === "--checklist") opts.checklist = next();
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
      checklist: opts.checklist ? resolve(opts.checklist) : null,
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
