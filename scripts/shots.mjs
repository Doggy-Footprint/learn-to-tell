// Builds what the skill reads at generation time (skills/learn-to-tell/look/) from the gallery shots: one card per shot
// (frames at the scene's own motion beats, what moves, the principle) and a mood board of resting frames.
// The model sees only still images, so the motion has to travel as a strip of frames plus words.
//   node scripts/shots.mjs [NN ...]   cards for the given shots (default: every shot in axes.json)
//   node scripts/shots.mjs --board    the board and the index table in look.md
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome, launch } from "../skills/learn-to-tell/server/cdp.mjs";
import { createLttServer } from "../skills/learn-to-tell/server/server.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = join(ROOT, "site", "gallery", "shots");
const LOOK = join(ROOT, "skills", "learn-to-tell", "look");
const OUT = join(LOOK, "shots");
const W = 1568;
const axes = JSON.parse(readFileSync(join(SHOTS, "axes.json"), "utf8"));
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fileOf = (n) => readdirSync(SHOTS).find((f) => f.startsWith(`s${n}-`) && f.endsWith(".html"));

const args = process.argv.slice(2);
const board = args.includes("--board");
const picks = args.filter((a) => /^\d\d$/.test(a));
const ids = (picks.length ? picks : Object.keys(axes)).filter((n) => axes[n] && !axes[n].skip && fileOf(n)).sort();

const chrome = findChrome();
if (!chrome) throw new Error("Chrome을 찾지 못했다 (LTT_CHROME)");
const server = createLttServer();
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/gallery/shots/`;
const browser = await launch(chrome);

async function frames(n, last) {
  const pg = await browser.page({ width: 1280, height: 800 });
  await pg.goto(base + fileOf(n) + "?check");
  await pg.eval("document.fonts.ready.then(() => new Promise(r => setTimeout(r, 200)))");
  const info = (await pg.eval("JSON.stringify(LTT.info())").then(JSON.parse))[0];
  const times = last ? [info.dur] : (info.beats.length ? info.beats.slice(-4) : [info.dur]);
  const out = [];
  for (const t of times) {
    await pg.eval(`LTT.seek(0, ${t}, { reveal: ${info.ask != null && t > info.ask} }), new Promise(r => setTimeout(r, 60))`);
    out.push({ t, buf: await pg.shot({ x: 0, y: 0, width: 1280, height: 800 }, { quality: 80 }) });
  }
  await pg.close();
  return out;
}

async function render(html, file) {
  const pg = await browser.page({ width: W, height: 600 });
  await pg.goto("about:blank");
  await pg.html(html);
  await pg.eval("Promise.all([...document.images].map(i => i.decode()))");
  const h = await pg.eval("document.body.scrollHeight");
  writeFileSync(file, await pg.shot({ x: 0, y: 0, width: W, height: h }, { quality: 72, beyond: true }));
  await pg.close();
}

const CSS = `*{box-sizing:border-box}body{margin:0;width:${W}px;background:#17181b;color:#e9e9e6;font:15px/1.45 -apple-system,"Apple SD Gothic Neo",sans-serif}`;
const img = (b) => `data:image/jpeg;base64,${b.toString("base64")}`;

function card(n, fr) {
  const a = axes[n], fw = Math.floor((W - 32 - 10 * (fr.length - 1)) / fr.length);
  return `<!doctype html><meta charset="utf-8"><style>${CSS}
h1{margin:0;padding:14px 16px 6px;font-size:18px}h1 span{color:#9fb6ff;font-weight:600;font-size:15px;margin-left:10px}
.row{display:flex;gap:10px;padding:6px 16px}figure{margin:0;width:${fw}px}img{width:100%;display:block;border-radius:4px;border:1px solid #333}
figcaption{color:#9fb6ff;font-size:14px;padding-top:4px}p{margin:6px 16px;font-size:16px}p b{color:#9fb6ff;margin-right:8px}
</style><h1>s${n}<span>${esc([a.structure, a.motion, a.role, a.composition].join(" · "))}</span></h1>
<div class="row">${fr.map((f) => `<figure><img src="${img(f.buf)}"><figcaption>t=${f.t}s</figcaption></figure>`).join("")}</div>
<p><b>움직임</b>${esc(a.moves)}</p><p style="padding-bottom:12px"><b>옮길 원리</b>${esc(a.principle)}</p>`;
}

try {
  mkdirSync(OUT, { recursive: true });
  if (board) {
    const tiles = [];
    for (const n of ids) tiles.push({ n, buf: (await frames(n, true))[0].buf });
    const cw = Math.floor((W - 32 - 6 * 8) / 7);
    await render(`<!doctype html><meta charset="utf-8"><style>${CSS}.g{display:grid;grid-template-columns:repeat(7,${cw}px);gap:8px;padding:16px}
figure{margin:0}img{width:100%;display:block;border-radius:3px}figcaption{font-size:12px;color:#9fb6ff}</style>
<div class="g">${tiles.map((t) => `<figure><img src="${img(t.buf)}"><figcaption>s${t.n}</figcaption></figure>`).join("")}</div>`, join(LOOK, "board.jpg"));
    const rows = ids.map((n) => { const a = axes[n]; return `| s${n} | ${a.structure} | ${a.motion} | ${a.role} | ${a.composition} | ${a.principle} |`; });
    const md = join(LOOK, "look.md"), text = readFileSync(md, "utf8");
    const table = ["<!-- shots:start -->", "| shot | 개념 구조 | 움직임 | 장면 역할 | 구도 | 옮길 원리 |", "| --- | --- | --- | --- | --- | --- |", ...rows, "<!-- shots:end -->"].join("\n");
    writeFileSync(md, text.replace(/<!-- shots:start -->[\s\S]*<!-- shots:end -->/, table));
    console.log(`board.jpg (${tiles.length}) · look.md 색인 ${rows.length}줄`);
  } else {
    for (const n of ids) {
      await render(card(n, await frames(n, false)), join(OUT, `s${n}.jpg`));
      console.log(`s${n}.jpg`);
    }
    for (const f of existsSync(OUT) ? readdirSync(OUT) : []) if (/^s\d\d\.jpg$/.test(f) && !axes[f.slice(1, 3)]) console.log(`주의: ${f}는 axes.json에 없다`);
  }
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
