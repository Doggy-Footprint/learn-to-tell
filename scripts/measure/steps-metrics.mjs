#!/usr/bin/env node
// Usage: node scripts/measure/steps-metrics.mjs <set-dir> [--json]
// Counts how figure `steps` scenes are authored in each run's lesson, served with the kit snapshot the run used
// (<set-dir>/snap-<variant>, variant from runs/<topic>-<variant>-<rep>). The page opens with ?audit so the deck
// pre-draws every step; LTT.deck and LTT.diagram are wrapped before the lesson script runs, so the same probe
// works on kits with and without cumulative reveal. Reveal at step 0 is derived from the highlight sets (first
// highlight shows a node; a never-highlighted node shows from the start), so it describes the authoring, not the kit.
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const json = args.includes("--json");
const set = args.find((a) => !a.startsWith("--"));
if (!set) { console.error("usage: node scripts/measure/steps-metrics.mjs <set-dir> [--json]"); process.exit(2); }
const SET = resolve(set);

const PROBE = `<script>(function () {
  var rec = { scenes: [], diagrams: [] }, CUR = null, seq = 0;
  var D = LTT.diagram;
  LTT.diagram = function (svg, spec) {
    var dg = D.apply(this, arguments), meta = { id: ++seq, nodes: (spec.nodes || []).map(function (n) { return n.id; }),
      edges: (spec.edges || []).map(function (e) { return e.id || e.f + ">" + e.t; }), calls: [] };
    rec.diagrams.push(meta);
    var h = dg.highlight;
    dg.highlight = function (ids) { meta.calls.push({ cur: CUR ? [CUR.s, CUR.k] : null, ids: ids && ids.length ? ids.slice() : null }); return h.apply(this, arguments); };
    return dg;
  };
  // Kits with cumulative reveal hang their step scope off LTT.diagram itself.
  Object.getOwnPropertyNames(D).forEach(function (k) { if (!(k in LTT.diagram) || k === "_step") Object.defineProperty(LTT.diagram, k, Object.getOwnPropertyDescriptor(D, k)); });
  var K = LTT.deck;
  LTT.deck = function (spec) {
    (spec.scenes || []).forEach(function (s, si) {
      if (s.type !== "figure" || !Array.isArray(s.steps)) return;
      rec.scenes.push({ si: si, title: String(s.title || "").replace(/<[^>]*>/g, ""), autoplay: s.autoplay === undefined ? null : s.autoplay,
        caps: s.steps.map(function (x) { return typeof x.caption === "string" ? x.caption : ""; }), holds: s.steps.map(function (x) { return x.hold || null; }) });
      s.steps.forEach(function (x, k) {
        var e = x.enter;
        if (typeof e === "function") x.enter = function () { var p = CUR; CUR = { s: si, k: k }; try { return e.apply(this, arguments); } finally { CUR = p; } };
      });
    });
    return K.apply(this, arguments);
  };
  addEventListener("load", function () { setTimeout(function () {
    var p = document.createElement("pre"); p.id = "steps-metrics-out"; p.textContent = JSON.stringify(rec); document.body.appendChild(p);
  }, 4000); });
})();</script>`;

function chromePath() {
  const c = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"];
  return process.env.LTT_CHROME || c.find((p) => existsSync(p));
}

function dump(chrome, url, profile) {
  return new Promise((done) => {
    const child = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, "--window-size=1440,900",
      "--virtual-time-budget=30000", "--dump-dom", url], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); done(out); }, 90000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => { out += d; });
    child.on("close", () => { clearTimeout(timer); done(out); });
  });
}

const plain = (s) => s.replace(/<[^>]*>/g, "").replace(/\{\{([^}|]+)\|([^}]*)\}\}/g, "$2").replace(/\{\{([^}]+)\}\}/g, "$1").replace(/\s+/g, " ").trim();
const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&");

function analyse(rec) {
  return rec.scenes.map((sc) => {
    const n = sc.caps.length;
    const reading = sc.caps.map((c) => [...plain(c)].length);
    const baseHold = sc.holds.map((h) => h || 1800);
    const floor = reading.map((m) => Math.max(1800, 1000 + 100 * m));
    const diagrams = rec.diagrams.map((d) => {
      const sets = [];
      for (const c of d.calls) if (c.cur && c.cur[0] === sc.si && sets[c.cur[1]] === undefined) sets[c.cur[1]] = c.ids;
      if (!sets.length) return null;
      const first = {};
      for (let k = 0; k < n; k++) {
        const ids = sets[k] === undefined ? [] : sets[k] === null ? d.nodes : sets[k];
        for (const id of ids) if (d.nodes.includes(id) && first[id] === undefined) first[id] = k;
      }
      const shown0 = d.nodes.filter((id) => first[id] === undefined || first[id] === 0).length;
      let newSteps = 0;
      for (let k = 1; k < n; k++) if (d.nodes.some((id) => first[id] === k)) newSteps++;
      return { nodes: d.nodes.length, shown0, newSteps };
    }).filter(Boolean);
    return {
      scene: sc.si + 1, title: sc.title.slice(0, 40), steps: n, autoplay: sc.autoplay,
      maxChars: Math.max(0, ...reading),
      // Reading time at 12 characters per second (Netflix Korean adult subtitle limit).
      shortBase: reading.filter((m, k) => baseHold[k] < (m / 12) * 1000).length,
      shortNew: reading.filter((m, k) => Math.max(sc.holds[k] || 0, floor[k]) < (m / 12) * 1000).length,
      diagram: diagrams[0] || null,
    };
  });
}

const runsDir = join(SET, "runs");
const chrome = chromePath();
if (!chrome) { console.error("Chrome not found (set LTT_CHROME)"); process.exit(2); }
const rows = [];
for (const run of readdirSync(runsDir).sort()) {
  const m = run.match(/^(.+)-([^-]+)-(\d+)$/);
  const lessons = join(runsDir, run, "home", "lessons");
  if (!m || !existsSync(lessons)) continue;
  const snap = join(SET, "snap-" + m[2]);
  const id = readdirSync(lessons).find((d) => existsSync(join(lessons, d, "lesson.html")));
  if (!id) continue;
  const { createLttServer } = await import(pathToFileURL(join(snap, "skills/learn-to-tell/server/server.mjs")).href);
  const home = mkdtempSync(join(tmpdir(), "steps-metrics-"));
  mkdirSync(join(home, "lessons"), { recursive: true });
  cpSync(join(lessons, id), join(home, "lessons", id), { recursive: true });
  const file = join(home, "lessons", id, "lesson.html");
  const html = readFileSync(file, "utf8");
  const at = html.search(/<script>(?![^]*?<script src)/);
  const inject = at >= 0 ? html.slice(0, at) + PROBE + html.slice(at) : html.replace(/<\/body>/, PROBE + "</body>");
  writeFileSync(file, inject);
  const server = createLttServer({ home, skillDir: join(snap, "skills/learn-to-tell") });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}/lessons/${id}/lesson.html?audit`;
  const profile = mkdtempSync(join(tmpdir(), "steps-metrics-prof-"));
  const out = await dump(chrome, url, profile);
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  rmSync(home, { recursive: true, force: true });
  rmSync(profile, { recursive: true, force: true });
  const hit = out.match(/<pre id="steps-metrics-out">([^]*?)<\/pre>/);
  if (!hit) { rows.push({ run, error: "no probe output" }); continue; }
  rows.push({ run, scenes: analyse(JSON.parse(decode(hit[1]))) });
}

if (json) { console.log(JSON.stringify(rows, null, 2)); process.exit(0); }
for (const r of rows) {
  if (r.error) { console.log(`${r.run}: ${r.error}`); continue; }
  const s = r.scenes, d = s.filter((x) => x.diagram);
  const all0 = d.filter((x) => x.diagram.shown0 === x.diagram.nodes).length;
  console.log(`${r.run}: steps 장면 ${s.length}, autoplay 끔/once ${s.filter((x) => x.autoplay === false || x.autoplay === "once").length}, ` +
    `도식 단계 장면 ${d.length}(1단계에 전부 ${all0}), 읽기보다 짧은 단계 base ${s.reduce((a, x) => a + x.shortBase, 0)} / new ${s.reduce((a, x) => a + x.shortNew, 0)}`);
  for (const x of s) {
    const dg = x.diagram ? ` 도식 노드 ${x.diagram.nodes}, 1단계 노출 ${x.diagram.shown0}, 새 노드 단계 ${x.diagram.newSteps}/${x.steps - 1}` : "";
    console.log(`  장면 ${x.scene} [${x.steps}단계${x.autoplay === null ? "" : ", autoplay " + x.autoplay}] 최장 자막 ${x.maxChars}자${dg}  ${x.title}`);
  }
}
