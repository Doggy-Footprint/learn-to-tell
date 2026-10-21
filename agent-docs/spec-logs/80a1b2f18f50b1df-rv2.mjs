// RV-2: keyboard-only LTT.recall on a non-deck lesson page via CDP key events.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const root = "/Users/hwansu/toy-projects/learn-to-tell";
const { createLttServer } = await import(join(root, "skills/learn-to-tell/server/server.mjs"));
const home = mkdtempSync(join(tmpdir(), "ltt-rv2-"));
mkdirSync(join(home, "lessons/rv2"), { recursive: true });
writeFileSync(join(home, "lessons/rv2/lesson.html"), `<!doctype html><html><head><meta charset="utf-8">
<script type="application/json" id="ltt-meta">{"topic":"t","audience":"a","theme":"paper","medium":"m","decision":"d","glossary":{"적중":"캐시에 있음"}}</script></head>
<body><h1>떠올리기</h1><div id="r"></div>
<script src="/kit/vendor/d3.min.js"></script><script src="/kit/ltt.js"></script><script src="/kit/ltt-parts.js"></script><script src="/kit/ltt-ui.js"></script>
<script>window.rc = LTT.recall(document.getElementById("r"), { title: "T", question: "{{적중}}이란?", answer: "{{적중}}은 캐시에 있다" });</script></body></html>`);
const server = createLttServer({ home });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/lessons/rv2/lesson.html`;
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${mkdtempSync(join(tmpdir(), "rv2c-"))}`, "--remote-debugging-port=0", "--window-size=1280,800", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((d) => { let b = ""; chrome.stderr.on("data", (x) => { b += x; const m = b.match(/ws:\/\/\S+/); if (m) d(m[0]); }); });
const t = (await (await fetch(wsUrl.replace("ws://", "http://").replace(/\/devtools\/browser\/.*/, "/json/list"))).json()).find((x) => x.type === "page");
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = async (k, code, vk) => { await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk, ...(k === "Enter" ? { text: "\r" } : {}) }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk }); };
await send("Page.enable"); await send("Page.navigate", { url }); await sleep(2500);
const log = [];
const hiddenBefore = await ev(`!rc.answer.checkVisibility()`); log.push(["answer hidden before", hiddenBefore]);
let tabs = 0;
while (tabs < 10 && (await ev(`document.activeElement.tagName`)) !== "TEXTAREA") { await key("Tab", "Tab", 9); tabs++; }
log.push(["tabs to textarea", tabs]);
await send("Input.insertText", { text: " 네 " });
await key("Tab", "Tab", 9);
log.push(["focused after tab", await ev(`document.activeElement.tagName + ':' + document.activeElement.textContent`)]);
await key("Enter", "Enter", 13); await sleep(800);
log.push(["answer visible after Enter", await ev(`rc.answer.checkVisibility()`)]);
log.push(["button disabled", await ev(`document.querySelector('#r button').disabled`)]);
log.push(["linked terms in answer", await ev(`rc.answer.querySelectorAll('.ltt-term').length`)]);
await sleep(500);
log.push(["recall events", (() => { try { return readFileSync(join(home, "lessons/rv2/events.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)).filter((e) => e.type === "recall").map((e) => e.data); } catch (e) { return e.code; } })()]);
console.log(JSON.stringify(log, null, 1));
ws.close(); chrome.kill(); server.closeAllConnections(); server.close();
