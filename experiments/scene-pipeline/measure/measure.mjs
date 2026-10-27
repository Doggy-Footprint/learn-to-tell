// usage: node measure.mjs <out.json> <rel.html> [--inject shake|choppy|below] [--seconds 12] [--viewport 1280x800]  (rel는 round-hsh/ 기준)
// 장면을 1280x800에서 열고 50ms마다 요소 상자·실효 불투명도·보이는 글자·실행 중 애니메이션 수를 기록한다.
// 수집기는 주입보다 먼저 원래 setInterval을 잡아 두므로, rAF를 늦추는 choppy 주입이 표본 간격을 바꾸지 않는다.
import { chromium } from "playwright";
import { createLttServer } from "../../../skills/learn-to-tell/server/server.mjs";
import { mkdtempSync, writeFileSync } from "node:fs"; import { tmpdir } from "node:os"; import { join, resolve, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const [out, rel] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const inject = opt("--inject", null), seconds = Number(opt("--seconds", 12));
const [W, H] = opt("--viewport", "1280x800").split("x").map(Number), DT = 50;

function collector({ DT, H, W }) {
  const setI = window.setInterval.bind(window), now = performance.now.bind(performance);
  let id = 0; const ids = new WeakMap(), samples = [], t0 = now();
  const key = (n) => { if (!ids.has(n)) ids.set(n, ++id); return ids.get(n); };
  const opacity = (n) => { let o = 1; for (let e = n; e && e.nodeType === 1; e = e.parentNode) { const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden") return 0; o *= Number(s.opacity); } return o; };
  // 1 if the box is inside the viewport and every clipping ancestor (scroll containers such as the deck card, overflow:hidden, the SVG itself)
  const shown = (n, r) => {
    if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return 0;
    for (let e = n.parentElement; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e); if (!/auto|scroll|hidden|clip/.test(s.overflowX + s.overflowY)) continue;
      const p = e.getBoundingClientRect(); if (r.bottom <= p.top || r.top >= p.bottom || r.right <= p.left || r.left >= p.right) return 0;
    }
    return 1;
  };
  const LEAF = "svg rect, svg circle, svg ellipse, svg line, svg path, svg polygon, svg polyline, svg text, svg image, svg use";
  const mainSvg = () => [...document.querySelectorAll("svg")].map((s) => [s, s.getBoundingClientRect()]).sort((a, b) => b[1].width * b[1].height - a[1].width * a[1].height)[0];
  function sample() {
    const t = Math.round(now() - t0), els = [], texts = [];
    for (const n of document.querySelectorAll(LEAF)) {
      const r = n.getBoundingClientRect(); if (!r.width && !r.height) continue;
      els.push([key(n), +r.x.toFixed(1), +r.y.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1), +opacity(n).toFixed(2), shown(n, r)]);
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let tn = walker.nextNode(); tn; tn = walker.nextNode()) {
      const s = tn.textContent.trim(), p = tn.parentElement; if (!s || !p || p.closest("script,style,#ltt-expect,#ltt-checks")) continue;
      const r = p.getBoundingClientRect(); if (!r.width) continue;
      const o = opacity(p); if (o < 0.05) continue;
      texts.push([key(p), s, +r.y.toFixed(0), +parseFloat(getComputedStyle(p).fontSize).toFixed(1), +r.height.toFixed(1), shown(p, r)]);
    }
    // learner controls (deck navigation excluded): a control the learner must scroll to reach is the predict-scene defect users reported
    const controls = [...document.querySelectorAll("button, input, select, textarea, [role=button], [role=slider]")].filter((n) => !n.closest(".dk-nav, .dk-top, .dk-foot, #ltt-expect"))
      .map((n) => { const r = n.getBoundingClientRect(); return r.width ? [key(n), (n.textContent || n.value || n.type || "").trim().slice(0, 30), shown(n, r)] : null; }).filter(Boolean);
    const m = mainSvg();
    samples.push({ t, scrollY: scrollY, svg: m && [+m[1].x.toFixed(1), +m[1].y.toFixed(1), +m[1].width.toFixed(1), +m[1].height.toFixed(1)],
      anims: document.getAnimations().filter((a) => a.playState === "running").length, els, texts, controls });
  }
  window.__ltt_measure = { samples, start: () => setI(sample, DT) };
}

const INJECT = {
  // 주 SVG를 감싼 상자가 1.2초마다 6px씩 위아래로 튄다(사용자 메모 "진행 마다 그림의 frame이 움직임").
  shake: () => { const setI = window.setInterval.bind(window); addEventListener("load", () => { const s = [...document.querySelectorAll("svg")].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]; const box = s?.parentElement; if (!box) return; let k = 0; setI(() => { box.style.transform = `translateY(${(k++ % 2) * 6}px)`; }, 1200); }); },
  // CSS 전환·애니메이션은 즉시 끝나게, rAF는 250ms마다 한 번만 돌게 한다(d3 전환이 4fps로 끊긴다).
  choppy: () => {
    const raf = window.requestAnimationFrame.bind(window); let last = 0, q = [];
    window.requestAnimationFrame = (cb) => { q.push(cb); if (q.length === 1) { const tick = (ts) => { if (ts - last < 250) return raf(tick); last = ts; const c = q; q = []; c.forEach((f) => f(ts)); }; raf(tick); } return 0; };
    document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "*{transition-duration:0s!important;animation-duration:0s!important}"; document.head.append(s); });
  },
  // 본문 앞에 900px 빈 상자를 넣어 그림을 첫 화면 밖으로 민다.
  below: () => document.addEventListener("DOMContentLoaded", () => { const d = document.createElement("div"); d.style.height = "900px"; document.body.prepend(d); }),
};

const server = createLttServer({ home: mkdtempSync(join(tmpdir(), "ltth-")), galleryDir: resolve(here, "..", "round-hsh") });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
await ctx.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "#ltt-expect{display:none!important}"; document.head.append(s); }));
await ctx.addInitScript(collector, { DT, H, W });
if (inject) await ctx.addInitScript(INJECT[inject]);
const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
await page.goto(`http://127.0.0.1:${server.address().port}/gallery/${rel}`, { waitUntil: "domcontentloaded" });
await page.evaluate(() => window.__ltt_measure.start());
// stepper 장면은 2초 뒤부터 3초마다 "다음"을 누른다(사람이 넘기는 속도의 대용).
const clicks = [];
for (let t = 0; t < seconds * 1000; t += 500) {
  await page.waitForTimeout(500);
  if (t >= 2000 && (t - 2000) % 3000 === 0) {
    const b = page.locator(".ltt-stepper button", { hasText: "다음" }).first();
    if (await b.count() && await b.isEnabled().catch(() => false)) { await b.click({ timeout: 1000 }).catch(() => {}); clicks.push(t); }
  }
}
const samples = await page.evaluate(() => window.__ltt_measure.samples);
writeFileSync(out, JSON.stringify({ rel, inject, viewport: [W, H], dt: DT, clicks, errors, samples }));
await browser.close(); server.closeAllConnections(); server.close();
console.log(`${rel} ${inject || "orig"}: ${samples.length} samples, ${clicks.length} clicks, ${errors.length} errors`);
