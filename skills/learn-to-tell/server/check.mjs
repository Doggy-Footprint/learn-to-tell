import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome, launch, NO_CHROME } from "./cdp.mjs";
import { createLttServer, lttHome } from "./server.mjs";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_DIR = join(SKILL_DIR, "..", "..", "site");
const LESSON_ID = /^[a-z0-9][a-z0-9-]*$/;
export const SIZES = { desktop: { width: 1280, height: 800, mobile: false }, mobile: { width: 390, height: 844, mobile: true } };
const SHEET_W = 1568;

const USAGE = `사용법: node check.mjs <수업 id | lesson.html | site/... | URL>... [옵션]

모든 장면: 데스크톱 1280×800과 폰 390×844에서 겹침·넘침·작은 글자·schema·lint·expect를 잰다.
움직이는 장면(M·B): beat 시각의 프레임을 장면마다 한 장(check/sNN.jpg)으로 모은다. 그 장만 눈으로 본다.

옵션:
  --scenes 3,5    이 장면만 다시 잰다(번호는 1부터)
  --cover         overview 마지막 프레임을 cover.jpg(640×400)로 남긴다
  --no-sheets     프레임 sheet를 만들지 않는다
  --out <dir>     sheet를 둘 곳(기본: 수업 폴더의 check/)
  --json          결과를 JSON으로
  --chrome <경로>  Chrome 실행 파일(기본: LTT_CHROME, 설치 경로, PATH)
  --home <dir>    수업 폴더 루트(기본: LTT_HOME 또는 ~/.learn-to-tell)
종료 코드: 0 고칠 것 없음 · 1 고칠 것 있음 · 2 Chrome 없음/열기 실패`;

function under(base, file) {
  const rel = relative(base, file);
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel.split("\\").join("/") : null;
}

export function resolveTarget(target, home) {
  if (/^https?:\/\//.test(target)) return { label: target, url: target, dir: null };
  let file = resolve(target);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "lesson.html");
  if (!existsSync(file) && LESSON_ID.test(target)) file = join(home, "lessons", target, "lesson.html");
  if (!existsSync(file)) throw new Error(`${target}: 파일이 없다 (${file})`);
  file = realpathSync(file);
  const lessons = existsSync(join(home, "lessons")) ? realpathSync(join(home, "lessons")) : null;
  let rel;
  if (lessons && (rel = under(lessons, file))) return { label: `lessons/${rel}`, path: `/lessons/${rel}`, dir: dirname(file) };
  if (existsSync(SITE_DIR) && (rel = under(realpathSync(SITE_DIR), file))) return { label: rel, path: `/${rel}`, dir: dirname(file) };
  throw new Error(`${target}: ${join(home, "lessons")} 또는 site/ 아래 파일만 열 수 있다`);
}

function withQuery(url, q) { const [main, hash] = url.split("#"); return main + (main.includes("?") ? "&" : "?") + q + (hash ? "#" + hash : ""); }

async function openLesson(browser, url, size) {
  const pg = await browser.page(SIZES[size]);
  await pg.goto(withQuery(url, "check"));
  await pg.eval("document.fonts.ready.then(() => new Promise(r => setTimeout(r, 250)))");
  const ok = await pg.eval("typeof LTT !== 'undefined' && !!LTT.info()");
  return { pg, ok };
}

// Frames for one scene: up to four beats, the predict answer after its "ask" mark.
function frameTimes(sc) {
  const beats = (sc.beats || []).filter((t) => t > 0);
  if (!beats.length) return [sc.dur || 0];
  return beats.slice(-4);
}

function sheetHtml(title, desk, mob) {
  const img = (b) => `data:image/jpeg;base64,${b.toString("base64")}`;
  const dw = Math.floor((SHEET_W - 400 - 36) / 2);
  return `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#17181b;color:#e8e8ea;font:600 15px/1.4 -apple-system,'Apple SD Gothic Neo',sans-serif;width:${SHEET_W}px}
h1{font-size:17px;margin:0;padding:12px 16px 4px}.wrap{display:flex;gap:12px;padding:8px 12px 14px}
.desk{display:grid;grid-template-columns:repeat(2,${dw}px);gap:10px;align-content:start}
.mob{display:flex;gap:10px;align-items:flex-start}
figure{margin:0;display:flex;flex-direction:column;gap:4px}figure img{display:block;border:1px solid #333;border-radius:4px}
figcaption{color:#9fb6ff;font-size:14px}</style><h1>${title}</h1><div class="wrap">
<div class="desk">${desk.map((f) => `<figure><img width="${dw}" src="${img(f.buf)}"><figcaption>데스크톱 t=${f.t}s</figcaption></figure>`).join("")}</div>
<div class="mob">${mob.map((f) => `<figure><img width="190" src="${img(f.buf)}"><figcaption>폰 t=${f.t}s</figcaption></figure>`).join("")}</div></div>`;
}

async function renderSheet(browser, html, file) {
  const pg = await browser.page({ width: SHEET_W, height: 600 });
  await pg.goto("about:blank");
  await pg.html(html);
  await pg.eval("Promise.all([...document.images].map(i => i.decode()))");
  const h = await pg.eval("document.body.scrollHeight");
  const buf = await pg.shot({ x: 0, y: 0, width: SHEET_W, height: h }, { quality: 72, beyond: true });
  await pg.close();
  await writeFile(file, buf);
}

export async function check({ targets, chrome = findChrome(), home = lttHome(), scenes = null, cover = false, sheets = true, out = null }) {
  if (!chrome) throw new Error(NO_CHROME);
  const resolved = targets.map((t) => resolveTarget(t, home));
  const server = resolved.some((t) => t.path) ? createLttServer({ home }) : null;
  let base = "";
  if (server) { await new Promise((r) => server.listen(0, "127.0.0.1", r)); base = `http://127.0.0.1:${server.address().port}`; }
  const browser = await launch(chrome);
  const results = [];
  try {
    for (const t of resolved) {
      const url = t.url || base + t.path;
      const r = { target: t.label, modes: {}, sheets: [], cover: null, errors: [] };
      for (const size of ["desktop", "mobile"]) {
        const { pg, ok } = await openLesson(browser, url, size);
        if (!ok) { r.errors.push(`${size}: LTT.deck이 돌지 않았다. ${pg.logs.join(" | ") || "콘솔 오류 없음"}`); await pg.close(); continue; }
        const rep = await pg.eval("JSON.stringify(LTT.check())").then(JSON.parse);
        rep.console = pg.logs.slice();
        r.modes[size] = rep;
        await pg.close();
      }
      const desk = r.modes.desktop;
      if (desk && (sheets || cover)) {
        const dir = out ? resolve(out) : t.dir ? join(t.dir, "check") : null;
        const pick = desk.scenes.filter((sc) => (scenes ? scenes.includes(sc.i + 1) : sc.tier !== "S"));
        const frames = {};
        if (sheets && dir && pick.length) {
          await mkdir(dir, { recursive: true });
          for (const size of ["desktop", "mobile"]) {
            const { pg, ok } = await openLesson(browser, url, size);
            if (!ok) { await pg.close(); continue; }
            for (const sc of pick) {
              let times = frameTimes(sc);
              if (size === "mobile") times = times.length > 2 ? [times[Math.floor(times.length / 2) - 1], times[times.length - 1]] : times;
              for (const tt of times) {
                const reveal = sc.ask != null && tt > sc.ask;
                await pg.eval(`LTT.seek(${sc.i}, ${tt}, {reveal: ${reveal}}), new Promise(r => setTimeout(r, 60))`);
                let clip;
                if (size === "desktop") clip = { x: 0, y: 0, width: 1280, height: 800 };
                else { const rc = await pg.eval(`LTT.sceneRect(${sc.i})`); clip = { x: 0, y: rc.y, width: 390, height: Math.min(rc.h, 2400) }; await pg.eval(`window.scrollTo(0, ${Math.max(0, rc.y - 10)})`); }
                const buf = await pg.shot(clip, { quality: 78, beyond: size === "mobile" });
                ((frames[sc.i] ||= { desktop: [], mobile: [] })[size]).push({ t: tt, buf });
              }
            }
            await pg.close();
          }
          for (const sc of pick) {
            const f = frames[sc.i];
            if (!f) continue;
            const file = join(dir, `s${String(sc.i + 1).padStart(2, "0")}.jpg`);
            await renderSheet(browser, sheetHtml(`장면 ${sc.i + 1} · ${sc.type} · ${sc.tier} · ${sc.title.replace(/\{\{([^}|]+)(?:\|[^}]*)?\}\}/g, "$1").replace(/</g, "&lt;")}`, f.desktop, f.mobile), file);
            r.sheets.push(file);
          }
        }
        if (cover && t.dir) {
          const ov = desk.scenes.find((sc) => sc.type === "overview") || desk.scenes[0];
          const { pg, ok } = await openLesson(browser, url, "desktop");
          if (ok) {
            await pg.eval(`LTT.seek(${ov.i}, ${ov.dur || 0}, {reveal: true}), new Promise(r => setTimeout(r, 80))`);
            const buf = await pg.shot({ x: 0, y: 0, width: 1280, height: 800, scale: 0.5 }, { quality: 82 });
            r.cover = join(t.dir, "cover.jpg");
            await writeFile(r.cover, buf);
          }
          await pg.close();
        }
      }
      results.push(r);
    }
  } finally {
    await browser.close();
    if (server) { server.closeAllConnections(); await new Promise((r) => server.close(r)); }
  }
  return results;
}

function fixCount(rep, withLint = true) {
  if (!rep) return 1;
  return rep.scenes.reduce((n, s) => n + s.issues.length, 0) + (withLint ? rep.lint.filter((l) => l.level === "fix").length + rep.expect.length : 0) + rep.console.length;
}

export function formatReport(results, scenes = null) {
  const lines = [];
  for (const r of results) {
    lines.push(`■ ${r.target}`);
    r.errors.forEach((e) => lines.push(`  오류: ${e}`));
    const desk = r.modes.desktop;
    if (desk) {
      const tiers = desk.scenes.map((s) => s.tier);
      lines.push(`  장면 ${desk.scenes.length}개 · 정적 ${tiers.filter((x) => x === "S").length} · 움직임 ${tiers.filter((x) => x === "M").length} · 손그림 ${tiers.filter((x) => x === "B").length}`);
    }
    for (const size of ["desktop", "mobile"]) {
      const rep = r.modes[size];
      if (!rep) continue;
      const label = size === "desktop" ? "데스크톱" : "폰";
      rep.console.forEach((c) => lines.push(`  [${label}] 콘솔 오류: ${c}`));
      rep.scenes.filter((s) => !scenes || scenes.includes(s.i + 1)).forEach((s) => s.issues.forEach((x) => lines.push(`  [${label}] 장면 ${s.i + 1} ${x.rule}: ${x.msg}`)));
      if (size === "desktop") {
        rep.lint.forEach((l) => lines.push(`  ${l.level === "fix" ? "고침" : "권고"} 장면 ${l.scene + 1} ${l.rule}: ${l.msg}`));
        rep.expect.forEach((e) => lines.push(`  expect 불일치: ${e.label} (모델 ${e.actual}, 기대 ${e.expected})`));
      }
    }
    const n = (r.modes.desktop ? fixCount(r.modes.desktop) : 0) + (r.modes.mobile ? fixCount(r.modes.mobile, false) : 0) + r.errors.length;
    lines.push(n ? `  고칠 것 ${n}건` : "  고칠 것 0건");
    if (r.sheets.length) lines.push(`  눈으로 볼 sheet ${r.sheets.length}장:`, ...r.sheets.map((f) => `    ${f}`));
    if (r.cover) lines.push(`  cover: ${r.cover}`);
  }
  return lines.join("\n");
}

export function exitCode(results) {
  if (results.some((r) => r.errors.length && !Object.keys(r.modes).length)) return 2;
  return results.some((r) => r.errors.length || fixCount(r.modes.desktop) || fixCount(r.modes.mobile, false)) ? 1 : 0;
}

function parseArgs(argv) {
  const o = { targets: [], scenes: null, cover: false, sheets: true, out: null, json: false, chrome: undefined, home: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => { if (i + 1 >= argv.length) throw new Error(`${a}: 값이 필요하다`); return argv[++i]; };
    if (a === "--scenes") o.scenes = next().split(",").map(Number).filter((n) => n > 0);
    else if (a === "--cover") o.cover = true;
    else if (a === "--no-sheets") o.sheets = false;
    else if (a === "--out") o.out = next();
    else if (a === "--json") o.json = true;
    else if (a === "--chrome") o.chrome = next();
    else if (a === "--home") o.home = next();
    else if (a === "--help" || a === "-h") o.help = true;
    else if (a.startsWith("-")) throw new Error(`모르는 옵션: ${a}`);
    else o.targets.push(a);
  }
  return o;
}

export function galleryTargets(dir = join(SITE_DIR, "gallery")) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true }).map((f) => f.split("\\").join("/")).filter((f) => f.endsWith(".html") && !/(^|\/)index\.html$/.test(f)).sort().map((f) => join(dir, f));
}

async function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message + "\n\n" + USAGE); process.exit(2); }
  if (o.help) return console.log(USAGE);
  const targets = o.targets.flatMap((t) => (t === "--gallery" ? galleryTargets() : [t]));
  if (!targets.length) { console.error(USAGE); process.exit(2); }
  const chrome = findChrome(o.chrome);
  if (!chrome) { console.error(NO_CHROME); process.exit(2); }
  let results;
  try {
    results = await check({ targets, chrome, home: o.home ? resolve(o.home) : lttHome(), scenes: o.scenes, cover: o.cover, sheets: o.sheets, out: o.out });
  } catch (e) { console.error(e.message); process.exit(2); }
  // exitCode instead of exit(): a large --json report piped to another process must flush first.
  process.stdout.write((o.json ? JSON.stringify(results, null, 2) : formatReport(results, o.scenes)) + "\n");
  process.exitCode = exitCode(results);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
