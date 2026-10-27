// usage: node measure.mjs <out.json> <rel.html> [--inject shake|choppy|below|small|freeze|fast] [--seconds 90] [--viewport 1280x800]  (rel는 round-hsh/ 기준)
// 장면을 1280x800에서 열고 50ms마다 요소 상자·실효 불투명도·보이는 글자·실행 중 애니메이션 수를 기록한다.
// 수집기는 주입보다 먼저 원래 setInterval을 잡아 두므로, rAF를 늦추는 choppy 주입이 표본 간격을 바꾸지 않는다.
import { chromium } from "playwright";
import { createLttServer } from "../../../skills/learn-to-tell/server/server.mjs";
import { mkdtempSync, writeFileSync } from "node:fs"; import { tmpdir } from "node:os"; import { join, resolve, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const [out, rel] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const inject = opt("--inject", null), seconds = Number(opt("--seconds", 90));
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
    const m = mainSvg(), st = document.querySelector(".dk-stage");
    samples.push({ t, scrollY: scrollY, stageY: st ? st.scrollTop : 0, page: document.querySelector(".dk-count")?.textContent || "", svgKey: m && key(m[0]), svg: m && [+m[1].x.toFixed(1), +m[1].y.toFixed(1), +m[1].width.toFixed(1), +m[1].height.toFixed(1)],
      anims: document.getAnimations().filter((a) => a.playState === "running").length, els, texts, controls });
  }
  window.__ltt_measure = { samples, start: () => setI(sample, DT) };
}

const INJECT = {
  // 주 SVG를 감싼 상자가 1.2초마다 6px씩 위아래로 튄다(사용자 메모 "진행 마다 그림의 frame이 움직임").
  shake: () => { const setI = window.setInterval.bind(window); let k = 0; setI(() => { const s = [...document.querySelectorAll("svg")].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]; if (s?.parentElement) s.parentElement.style.transform = `translateY(${(k++ % 2) * 6}px)`; }, 1200); },
  // CSS 전환·애니메이션은 즉시 끝나게, rAF는 250ms마다 한 번만 돌게 한다(d3 전환이 4fps로 끊긴다).
  choppy: () => {
    const raf = window.requestAnimationFrame.bind(window); let last = 0, q = [];
    window.requestAnimationFrame = (cb) => { q.push(cb); if (q.length === 1) { const tick = (ts) => { if (ts - last < 250) return raf(tick); last = ts; const c = q; q = []; c.forEach((f) => f(ts)); }; raf(tick); } return 0; };
    document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "*{transition-duration:0s!important;animation-duration:0s!important}"; document.head.append(s); });
  },
  // 본문 앞에 900px 빈 상자를 넣어 그림을 첫 화면 밖으로 민다.
  below: () => document.addEventListener("DOMContentLoaded", () => { const d = document.createElement("div"); d.style.height = "900px"; document.body.prepend(d); }),
  // 주 SVG를 왼쪽 위 기준 0.4배로 줄인다(사용자 메모 "그림이 많이 작음").
  small: () => { const setI = window.setInterval.bind(window); setI(() => { for (const s of document.querySelectorAll("svg:not([data-small])")) { const r = s.getBoundingClientRect(); if (r.width * r.height < 0.01 * innerWidth * innerHeight) continue; s.dataset.small = 1; s.style.transformOrigin = "0 0"; s.style.transform = "scale(0.4)"; } }, 100); },
  // rAF 콜백을 버리고 CSS 애니메이션·전환을 멈춘다(사용자 메모 "infographic animation이 없음"). 단추로 바뀌는 상태는 그대로 바뀐다.
  freeze: () => {
    window.requestAnimationFrame = () => 0;
    document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "*{animation-play-state:paused!important;transition:none!important}"; document.head.append(s); });
  },
  // 장면 시계를 3배로 돌린다: performance.now·Date.now·타이머 지연·Web Animations 재생 속도(사용자 메모 "좀 빨라서 보기 어려움", "설명(글)은 너무 빠르고").
  fast: () => {
    const K = 3, pn = performance.now.bind(performance), dn = Date.now, p0 = pn(), d0 = dn(), setI = window.setInterval.bind(window), setT = window.setTimeout.bind(window), raf = window.requestAnimationFrame.bind(window);
    performance.now = () => p0 + (pn() - p0) * K; Date.now = () => d0 + (dn() - d0) * K;
    window.setTimeout = (f, d, ...a) => setT(f, (d || 0) / K, ...a); window.setInterval = (f, d, ...a) => setI(f, (d || 0) / K, ...a);
    window.requestAnimationFrame = (cb) => raf(() => cb(performance.now()));
    setI(() => document.getAnimations().forEach((a) => { if (a.playbackRate !== K) a.playbackRate = K; }), 20);
  },
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
// 학습자 대용: 2초 뒤부터 3초마다 한 동작. 현재 쪽에 정답을 안 본 예측이 있으면 첫 선택지를 고르고 다음 동작에서 "정답 보기"를 누른다.
// 단계 단추가 화면 밖이면(덱의 → 키는 보이는 단계 단추만 누른다) 스크롤 없이 직접 누르고, 아니면 → 키를 누른다. 덱이 "아직 안 봤어요"로 막은 단추(.ltt-nudge)는 누른다.
// 마지막 쪽에서 남은 단계·예측이 없어진 뒤 6초 더 보고 끝낸다.
const act = () => {
  const st = document.querySelector(".dk-stage"), [cur, n] = (document.querySelector(".dk-count")?.textContent || "1/1").split("/").map((x) => parseInt(x));
  const el = st?.children[cur - 1] || document.body;
  const pred = [...el.querySelectorAll(".dk-pred:not(.done)")].find((p) => p.getBoundingClientRect().width);
  const step = [...el.querySelectorAll(".ltt-stepper")].map((b) => b.querySelectorAll("button")[1]).find((b) => b && !b.disabled);
  const done = cur === n && !pred && !step;
  if (pred) {
    if (!pred.querySelector("[aria-pressed=true]")) { const c = pred.querySelector("button[data-choice]:not(.unsure)") || pred.querySelector("button[data-choice]"); c?.click(); return [done, "choice"]; }
    const lock = pred.querySelector(".dk-actions button.accent"); if (lock && !lock.disabled) { lock.click(); return [done, "reveal"]; }
  }
  if (step) { const r = step.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) { step.click(); return [done, "step-offscreen"]; } }
  return [done, "key"];
};
const clicks = []; let doneAt = null;
for (let t = 0; t < seconds * 1000; t += 500) {
  await page.waitForTimeout(500);
  if (t < 2000 || (t - 2000) % 3000) continue;
  const [done, kind] = await page.evaluate(act);
  if (done) { doneAt ??= t; if (t - doneAt >= 6000) break; } else doneAt = null;
  if (kind === "key") {
    await page.keyboard.press("ArrowRight"); await page.waitForTimeout(150);
    const nudge = await page.evaluate(() => { const n = document.querySelector(".ltt-nudge"); if (!n) return null; const c = n.matches("button") ? n : n.querySelector("button[data-choice]"); c?.click(); return c ? "nudge" : null; });
    clicks.push([t, kind, nudge]);
  } else clicks.push([t, kind]);
}
const samples = await page.evaluate(() => window.__ltt_measure.samples);
writeFileSync(out, JSON.stringify({ rel, inject, viewport: [W, H], dt: DT, clicks, errors, samples }));
await browser.close(); server.closeAllConnections(); server.close();
console.log(`${rel} ${inject || "orig"}: ${samples.length} samples, ${clicks.length} clicks, ${errors.length} errors`);
