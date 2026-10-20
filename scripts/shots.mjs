// Builds the shot cards the skill reads at generation time (skills/learn-to-tell/look/) from the gallery shots.
// Each card is one image: frames captured at the beat times the page exposes (data-ltt-beats with text), else at those in
// site/gallery/shots/beats/sNN.json, the beat lines under them and the principle. Motion has to be carried this way because the
// model sees only still images.
//   node scripts/shots.mjs [NN ...]   cards for the given shots (default: every shot with a beats file)
//   node scripts/shots.mjs --board    the mood board of every card's last frame, and the index table in look.md
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findChrome } from "../skills/learn-to-tell/server/audit.mjs";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = join(ROOT, "site", "gallery", "shots");
const LOOK = join(ROOT, "skills", "learn-to-tell", "look");
const OUT = join(LOOK, "shots");
const W = 1568;
const JOBS = Number(process.env.LTT_SHOT_JOBS || 4);

const axes = JSON.parse(readFileSync(join(SHOTS, "axes.json"), "utf8"));
const beatsOf = (n) => JSON.parse(readFileSync(join(SHOTS, "beats", `s${n}.json`), "utf8"));
const withBeats = () => readdirSync(join(SHOTS, "beats")).filter((f) => /^s\d\d\.json$/.test(f)).map((f) => f.slice(1, 3)).sort();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const chrome = findChrome();
if (!chrome) throw new Error("Chrome을 찾지 못했다 (LTT_CHROME)");

function shoot(url, file, size, budget) {
  return new Promise((done) => {
    const profile = join(tmpdir(), `ltt-shot-${process.pid}-${Math.random().toString(36).slice(2)}`);
    const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", `--user-data-dir=${profile}`,
      `--window-size=${size}`, `--virtual-time-budget=${budget}`, `--screenshot=${file}`, url];
    const p = spawn(chrome, args, { stdio: "ignore" });
    p.on("close", () => { rmSync(profile, { recursive: true, force: true }); done(existsSync(file)); });
  });
}

function dumpDom(url, budget) {
  return new Promise((done) => {
    const profile = join(tmpdir(), `ltt-shot-${process.pid}-${Math.random().toString(36).slice(2)}`);
    const p = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, "--window-size=1280,800",
      `--virtual-time-budget=${budget}`, "--dump-dom", url], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => { rmSync(profile, { recursive: true, force: true }); done(out); });
  });
}

// A page that names its beats (LTT.motion.play text) is the source of truth; the beats file then only supplies crop and
// principle. Beats without text are timing only and do not get a frame.
const pageBeats = new Map();
async function beatsFor(n, base) {
  if (!pageBeats.has(n)) {
    const dom = await dumpDom(`${base}/gallery/shots/${axes[n].file}`, 400);
    const m = dom.match(/class="[^"]*dk-scene[^"]*cur[^"]*"[^>]*data-ltt-beats="([^"]*)"|data-ltt-beats="([^"]*)"[^>]*class="[^"]*dk-scene[^"]*cur/);
    const list = m ? JSON.parse((m[1] || m[2]).replace(/&quot;/g, '"').replace(/&amp;/g, "&")).filter((b) => b.text) : [];
    pageBeats.set(n, list.length ? list : beatsOf(n).beats ?? []);
    if (!pageBeats.get(n).length) throw new Error(`s${n}: no beats on the page or in beats/s${n}.json`);
  }
  return pageBeats.get(n);
}

// JPEG keeps the skill package small; sips ships with macOS, elsewhere the PNG stays.
function toJpeg(png, jpg) {
  return new Promise((done) => {
    const p = spawn("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "72", png, "--out", jpg], { stdio: "ignore" });
    p.on("error", () => done(false));
    p.on("close", (code) => done(code === 0 && existsSync(jpg)));
  });
}

async function pool(items, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(JOBS, items.length) }, async () => {
    while (next < items.length) await fn(items[next++]);
  }));
}

const PAGE_CSS = `*{box-sizing:border-box}body{margin:0;width:${W}px;background:#17181b;color:#e9e9e6;font:15px/1.4 "Apple SD Gothic Neo","Pretendard","Noto Sans KR",sans-serif}`;

// `crop: [x, y, w, h]` in the 1280×800 frame keeps only the figure, so it stays legible at a quarter of the card width.
const cropOf = (n) => beatsOf(n).crop ?? [0, 0, 1280, 800];
const frameW = (count) => Math.floor((W - 32 - 10 * (count - 1)) / count);
const frameH = (n, count) => { const [, , cw, ch] = cropOf(n); return Math.round(frameW(count) * ch / cw); };

function framed(n, f, fw, fh) {
  const [x, y, cw] = cropOf(n), k = fw / cw;
  return `<div style="width:${fw}px;height:${fh}px;overflow:hidden;border-radius:4px;position:relative"><img src="${pathToFileURL(f)}" style="position:absolute;left:${-x * k}px;top:${-y * k}px;width:${1280 * k}px;height:${800 * k}px"></div>`;
}

// A `failure` in the beats file is a frame from a generated lesson that broke this card's principle; the card shows it
// under the beats as a contrast pair, since a bad screen alone invites copying it.
const FAIL_W = 560;
const failH = (n) => { const f = beatsOf(n).failure; return f ? Math.round(FAIL_W * f.crop[3] / f.crop[2]) + 24 : 0; };

function failureHtml(n) {
  const f = beatsOf(n).failure;
  if (!f) return "";
  const [x, y, cw, ch] = f.crop, k = FAIL_W / cw, src = pathToFileURL(join(SHOTS, f.file));
  return `<div style="display:flex;gap:16px;align-items:flex-start;margin-top:14px;padding-top:12px;border-top:1px solid #34363b">` +
    `<div style="width:${FAIL_W}px;height:${Math.round(ch * k)}px;overflow:hidden;border-radius:4px;position:relative;flex:none;outline:2px solid #e0705f">` +
    `<img src="${src}" style="position:absolute;left:${-x * k}px;top:${-y * k}px;width:${f.size[0] * k}px;height:${f.size[1] * k}px"></div>` +
    `<div style="font-size:15px;line-height:1.55"><b style="color:#f08a78">흔한 실패</b> ${esc(f.text)}<br><b style="color:#9fb6ff">위 프레임</b> ${esc(f.fix)}</div></div>`;
}

function cardHtml(n, frames, beats) {
  const a = axes[n], b = beatsOf(n), gap = 10, fw = frameW(frames.length), fh = frameH(n, frames.length);
  const cols = frames.map((f, i) => `<figure style="margin:0;width:${fw}px">${framed(n, f, fw, fh)}` +
    `<figcaption style="margin-top:8px;font-size:14px;line-height:1.45;color:#d6d6d2"><b style="color:#9fb6ff">${i + 1}</b> ${esc(beats[i].text)}</figcaption></figure>`).join("");
  return `<!doctype html><meta charset="utf-8"><style>${PAGE_CSS}</style><body>
<div style="padding:14px 16px 16px">
<div style="display:flex;gap:10px;align-items:baseline;margin-bottom:10px"><b style="font-size:20px">s${n}</b>
<span style="color:#a9aaa6">${esc([a.structure, a.motion, a.role, a.composition, a.theme].join(" · "))}</span></div>
<div style="display:flex;gap:${gap}px;align-items:flex-start">${cols}</div>
<div style="margin-top:12px;font-size:15px"><b style="color:#9fb6ff">옮길 원리</b> ${esc(b.principle)}</div>
${failureHtml(n)}
</div></body>`;
}

async function cards(ids, base, tmp) {
  mkdirSync(OUT, { recursive: true });
  await pool(ids, async (n) => {
    const beats = await beatsFor(n, base);
    const frames = [];
    for (const [i, beat] of beats.entries()) {
      const f = join(tmp, `s${n}-${i + 1}.png`);
      if (!(await shoot(`${base}/gallery/shots/${axes[n].file}`, f, "1280,800", beat.t))) throw new Error(`s${n}: frame ${i + 1} failed`);
      frames.push(f);
    }
    const html = join(tmp, `card-${n}.html`);
    writeFileSync(html, cardHtml(n, frames, beats));
    const h = frameH(n, frames.length) + 150 + failH(n);
    const png = join(tmp, `card-${n}.png`);
    if (!(await shoot(pathToFileURL(html).href, png, `${W},${h}`, 500))) throw new Error(`s${n}: card failed`);
    rmSync(join(OUT, `s${n}.jpg`), { force: true });
    if (!(await toJpeg(png, join(OUT, `s${n}.jpg`)))) writeFileSync(join(OUT, `s${n}.png`), readFileSync(png));
    console.log(`s${n}: ${frames.length} frames`);
  });
}

async function board(base, tmp) {
  const ids = withBeats(), cols = 7, gap = 6, tw = Math.floor((W - 2 * gap - gap * (cols - 1)) / cols), th = Math.round(tw * 0.625);
  const frames = [];
  await pool(ids, async (n) => {
    const f = join(tmp, `rest-${n}.png`);
    if (!(await shoot(`${base}/gallery/shots/${axes[n].file}`, f, "1280,800", (await beatsFor(n, base)).at(-1).t))) throw new Error(`s${n}: rest frame failed`);
  });
  for (const n of ids) frames.push([n, join(tmp, `rest-${n}.png`)]);
  const cells = frames.map(([n, f]) => `<figure style="margin:0;position:relative"><img src="${pathToFileURL(f)}" style="width:${tw}px;height:${th}px;display:block">` +
    `<b style="position:absolute;left:4px;top:4px;background:#000c;padding:0 5px;font-size:13px">${n}</b></figure>`).join("");
  const rows = Math.ceil(ids.length / cols), h = gap * 2 + rows * th + (rows - 1) * gap;
  const html = join(tmp, "board.html");
  writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${PAGE_CSS}</style><body><div style="display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:${gap}px;padding:${gap}px">${cells}</div></body>`);
  const png = join(tmp, "board.png");
  if (!(await shoot(pathToFileURL(html).href, png, `${W},${h}`, 500))) throw new Error("board failed");
  rmSync(join(LOOK, "board.jpg"), { force: true });
  if (!(await toJpeg(png, join(LOOK, "board.jpg")))) writeFileSync(join(LOOK, "board.png"), readFileSync(png));

  const table = ["| shot | 개념 구조 | 움직임 | 장면 역할 | 구도 | 옮길 원리 |", "| --- | --- | --- | --- | --- | --- |",
    ...ids.map((n) => { const a = axes[n], b = beatsOf(n); return `| s${n} | ${a.structure} | ${a.motion} | ${a.role} | ${a.composition} | ${b.principle}${b.failure ? " (실패 짝)" : ""} |`; })].join("\n");
  const look = join(LOOK, "look.md"), text = readFileSync(look, "utf8");
  const start = "<!-- shots:start -->", end = "<!-- shots:end -->";
  if (!text.includes(start) || !text.includes(end)) throw new Error(`look.md에 ${start} … ${end} 자리가 없다`);
  writeFileSync(look, text.slice(0, text.indexOf(start) + start.length) + "\n" + table + "\n" + text.slice(text.indexOf(end)));
  console.log(`board: ${ids.length} shots, look.md index updated`);
}

const args = process.argv.slice(2);
const server = createLttServer({});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const tmp = await mkdtemp(join(tmpdir(), "ltt-shots-"));
try {
  if (args.includes("--board")) await board(base, tmp);
  else await cards(args.length ? args : withBeats(), base, tmp);
} finally {
  server.close();
  rmSync(tmp, { recursive: true, force: true });
}
