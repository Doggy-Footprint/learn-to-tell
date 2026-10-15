import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
const SP = process.argv[2];
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9333", "--user-data-dir=" + mkdtempSync(SP + "/prof-"), "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver; for (let i = 0; i < 50 && !ver; i++) { await sleep(200); try { ver = await (await fetch("http://127.0.0.1:9333/json/list")).json(); } catch {} }
const page = ver.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => ws.onopen = r);
let id = 0; const pend = new Map(), errors = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
  if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" ")); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable"); await send("Page.enable");
const scenarios = [["S1", "/gallery/", 1440, "light"], ["S2", "/gallery/", 720, "dark"], ["S3", "/gallery/catalog.html#math", 1440, "dark"], ["S4", "/gallery/catalog.html#math", 720, "light"]];
const out = [];
for (const [sid, path, w, scheme] of scenarios) {
  errors.length = 0;
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
  await send("Page.navigate", { url: "http://127.0.0.1:47900" + path }); await sleep(2500);
  const target = path.includes("catalog") ? "#math" : "#support";
  const r = await send("Runtime.evaluate", { returnByValue: true, expression: `(() => { const t = document.querySelector(${JSON.stringify(target)}); t.scrollIntoView(); const m = document.querySelector('#math');
    const tbl = document.querySelector('#support .sp-scroll');
    return { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, katex: m ? m.querySelectorAll('.katex').length : null, katexDisplay: m ? m.querySelectorAll('.katex-display').length : null,
      katexError: m ? m.querySelectorAll('.katex-error').length : null, tableOverflow: tbl ? tbl.scrollWidth - tbl.clientWidth : null,
      bg: getComputedStyle(document.body).backgroundColor, ink: t ? getComputedStyle(t).color : null }; })()` });
  await sleep(300);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const file = `${SP}/${sid}-${w}-${scheme}.png`; writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  out.push({ sid, path, w, scheme, ...r.result.result.value, consoleErrors: [...errors], file });
}
console.log(JSON.stringify(out, null, 1));
ws.close(); chrome.kill();
