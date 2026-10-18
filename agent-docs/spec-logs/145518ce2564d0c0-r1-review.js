// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// R-1 review for spec 145518ce2564d0c0 (diagram auto layout). Run in the page context of
// /gallery/catalog.html; loads catalog in iframes at both declared sizes and measures the
// autoLayout demo ("주문 처리 시스템 구성도"), then exercises its player and one send().
// Console errors (SC1) are read with the browser tool's console reader (errors only) after a
// reload of /gallery/catalog.html. `sweep` below is the SC4 gallery audit/lint sweep: every
// lint warning goes through LTT.warn into #ltt-expect, so warn/fail rows count lint and audit.
// Screenshot (SC5 visual check) is taken with the browser tool after scrolling the demo into view.
const sweep = async (pages, sizes) => { const out = [];
  for (const [w, h] of sizes) for (const p of pages) {
    const f = document.createElement("iframe"); f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;opacity:0;pointer-events:none`;
    f.src = p + "?audit"; document.body.appendChild(f);
    await new Promise((r) => (f.onload = r)); await new Promise((r) => setTimeout(r, 2500));
    const d = f.contentDocument;
    out.push({ p, w, audit: d.documentElement.getAttribute("data-ltt-audit"), warns: [...d.querySelectorAll("#ltt-expect div.warn, #ltt-expect div.fail")].map((x) => x.textContent) }); f.remove(); }
  return out; };
// Pages: every non-stale gallery deck (gpu/single-gpu-dataflow, scenes, cognition/anchoring, finance/diversification,
// linear-algebra/matrix-as-transform, pedagogy/retrieval-practice, physics/projectile-drag, uiux/visual-hierarchy-spacing,
// uiux/color-contrast, cache-ttl) at [[1440, 900], [390, 844]]; expected audit "0" and warns [] everywhere.
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = [];
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const f = document.createElement("iframe");
    f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;opacity:0;pointer-events:none`;
    f.src = "/gallery/catalog.html"; document.body.appendChild(f);
    await new Promise((r) => (f.onload = r)); await wait(3500);
    const d = f.contentDocument;
    const sv = [...d.querySelectorAll("svg.ltt-dg")].find((s) => s.getAttribute("aria-label") === "주문 처리 시스템 구성도");
    const nodes = [...sv.querySelectorAll("g.n")], boxes = nodes.map((g) => g.querySelector("rect.box").getBoundingClientRect());
    let overlap = 0;
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j];
      if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) overlap++; }
    const labelOut = [];
    nodes.forEach((g, i) => { const r = boxes[i]; for (const t of g.querySelectorAll("text.l,text.s")) { const b = t.getBoundingClientRect();
      if (b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5) labelOut.push(t.textContent); } });
    const host = sv.parentElement, next = [...host.querySelectorAll("button")].find((b) => /다음/.test(b.textContent));
    const caps = [];
    for (let k = 0; k < 2; k++) { next.click(); await wait(400); caps.push((host.textContent.match(/[②③][^—]*/) || [""])[0].trim()); }
    await wait(300);
    const packets = sv.querySelectorAll("circle.pk").length;
    out.push({ size: w + "x" + h, nodes: nodes.length, zones: sv.querySelectorAll("g.z").length, edges: sv.querySelectorAll("path.e").length,
      overlap, labelOut, steps: caps, packetsDuringStep3: packets, scrollWidth: d.documentElement.scrollWidth });
    f.remove();
  }
  return JSON.stringify(out);
})();
