// RV-1: screenshot every gallery deck's summary-recall scene before and after revealing all answers, via CDP.
// Usage: node recall-shots.mjs <repo-or-copy root> <out dir>
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const [root, out] = process.argv.slice(2).map((p) => resolve(p));
mkdirSync(out, { recursive: true });
const { createLttServer } = await import(join(root, "skills/learn-to-tell/server/server.mjs"));
const PAGES = ["cache-ttl.html", "scenes.html", "finance/diversification.html", "gpu/single-gpu-dataflow.html", "cognition/anchoring.html",
  "knowledge-graph/ontology-triples.html", "pedagogy/retrieval-practice.html", "network/tls13-quic.html", "linear-algebra/matrix-as-transform.html",
  "philosophy/trolley-ethics.html", "physics/projectile-drag.html", "uiux/color-contrast.html", "uiux/visual-hierarchy-spacing.html"];

const home = mkdtempSync(join(tmpdir(), "ltt-rv1-"));
const server = createLttServer({ home, skillDir: join(root, "skills/learn-to-tell") });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const profile = mkdtempSync(join(tmpdir(), "ltt-rv1-chrome-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
  `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--window-size=1440,900", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((done) => {
  let buf = "";
  chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/ws:\/\/\S+/); if (m) done(m[0]); });
});
const targets = await (await fetch(wsUrl.replace("ws://", "http://").replace(/\/devtools\/browser\/.*/, "/json/list"))).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const report = {};
for (const page of PAGES) {
  await send("Page.navigate", { url: `${base}/gallery/${page}` });
  await sleep(2500);
  const n = await evalJs(`(async () => { const dots = document.querySelectorAll('.dk-dots i');
    for (let k = 0; k < dots.length; k++) { dots[k].click(); await new Promise(r => setTimeout(r, 50)); if (document.querySelector('.dk-scene.cur .dk-rc')) return k + 1; } return 0; })()`);
  if (!n) { report[page] = "no recall scene"; continue; }
  await sleep(1500);
  const slug = page.replace(/[\/.]/g, "_");
  const shot = async (tag) => writeFileSync(join(out, `${slug}-${tag}.png`), Buffer.from((await send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
  await shot("before");
  await evalJs(`document.querySelectorAll('.dk-scene.cur .dk-rc button').forEach(b => b.click())`);
  await sleep(1500);
  await shot("after");
  report[page] = n;
}
writeFileSync(join(out, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
ws.close(); chrome.kill(); server.closeAllConnections(); server.close();
