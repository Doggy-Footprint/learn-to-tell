import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";

const CHROME_PATHS = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"];
const CHROME_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
export const NO_CHROME = "Chrome을 찾지 못했다. --chrome <경로>나 LTT_CHROME으로 알려 주거나, 브라우저에서 수업 URL에 ?check를 붙여 열고 패널을 본다.";

export function findChrome(explicit = process.env.LTT_CHROME) {
  if (explicit) return existsSync(explicit) ? explicit : null;
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  for (const dir of (process.env.PATH || "").split(delimiter)) {
    if (!dir) continue;
    for (const name of CHROME_NAMES) if (existsSync(join(dir, name))) return join(dir, name);
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One headless Chrome for the whole run; pages are driven over the DevTools protocol so frames are taken after LTT.seek(t),
// not after a virtual-time budget (requestAnimationFrame does not advance under --virtual-time-budget).
export async function launch(chrome, { timeout = 20000 } = {}) {
  const profile = await mkdtemp(join(tmpdir(), "ltt-chrome-"));
  const child = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  const portFile = join(profile, "DevToolsActivePort");
  const t0 = Date.now();
  while (!existsSync(portFile) || !readFileSync(portFile, "utf8").includes("\n")) {
    if (Date.now() - t0 > timeout) { child.kill("SIGKILL"); throw new Error("Chrome DevTools 포트가 열리지 않았다"); }
    await sleep(50);
  }
  const [port, path] = readFileSync(portFile, "utf8").trim().split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = () => bad(new Error("CDP 연결 실패")); });
  let seq = 0;
  const pending = new Map(), listeners = new Set();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.bad(new Error(`${p.method}: ${m.error.message}`)) : p.ok(m.result);
    } else for (const fn of listeners) fn(m);
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, bad) => {
    const id = ++seq;
    pending.set(id, { ok, bad, method });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  async function page({ width, height, mobile }) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const s = (method, params) => send(method, params, sessionId);
    const logs = [];
    let loaded = null;
    const on = (m) => {
      if (m.sessionId !== sessionId) return;
      if (m.method === "Runtime.exceptionThrown") logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") logs.push(m.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
      if (m.method === "Page.loadEventFired" && loaded) { loaded(); loaded = null; }
    };
    listeners.add(on);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: !!mobile });
    return {
      logs,
      async goto(url) {
        const done = new Promise((r) => { loaded = r; });
        await s("Page.navigate", { url });
        await Promise.race([done, sleep(15000)]);
      },
      async html(content) {
        const { frameTree } = await s("Page.getFrameTree");
        await s("Page.setDocumentContent", { frameId: frameTree.frame.id, html: content });
      },
      async eval(expr) {
        const r = await s("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
      },
      async shot(clip, { format = "jpeg", quality = 80, beyond = false } = {}) {
        const params = { format, captureBeyondViewport: beyond };
        if (format === "jpeg") params.quality = quality;
        if (clip) params.clip = { ...clip, scale: clip.scale || 1 };
        const r = await s("Page.captureScreenshot", params);
        return Buffer.from(r.data, "base64");
      },
      async close() { listeners.delete(on); await send("Target.closeTarget", { targetId }); }
    };
  }
  async function close() {
    try { await send("Browser.close"); } catch {}
    ws.close();
    child.kill("SIGKILL");
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
  return { page, close };
}
