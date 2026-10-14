import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const GALLERY = new URL("../skills/learn-to-tell/gallery/", import.meta.url);
const pages = readdirSync(GALLERY, { recursive: true })
  .filter((f) => f.endsWith(".html") && !f.startsWith("stale"))
  .map((f) => f.split("\\").join("/"));
const read = (f) => readFileSync(new URL(f, GALLERY), "utf8");
const scripts = (f) => [...read(f).matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

test("index links every live gallery page and only existing ones", () => {
  const links = new Set([...read("index.html").matchAll(/href="([^"#?]+\.html)"/g)].map((m) => m[1]));
  for (const page of pages.filter((p) => p !== "index.html")) assert.ok(links.has(page), `index.html does not link ${page}`);
  for (const link of links) assert.ok(pages.includes(link), `index.html links missing ${link}`);
});

test("gallery pages load vendor scripts before the kit", () => {
  for (const page of pages) {
    const srcs = scripts(page);
    const kit = srcs.indexOf("/kit/ltt.js");
    assert.ok(kit >= 0, `${page} does not load /kit/ltt.js`);
    srcs.forEach((src, i) => { if (src.startsWith("/kit/vendor/")) assert.ok(i < kit, `${page} loads ${src} after the kit`); });
    for (const [use, need] of [[/LTT\.map\(/, "/kit/vendor/topojson-client.min.js"], [/LTT\.sankey\(/, "/kit/vendor/d3-sankey.min.js"], [/LTT\.plot\(/, "/kit/vendor/plot.umd.min.js"]])
      if (use.test(read(page))) assert.ok(srcs.includes(need), `${page} uses ${use.source} without ${need}`);
  }
});

test("deck pages load kit modules in dependency order", () => {
  const order = ["/kit/ltt.js", "/kit/ltt-parts.js", "/kit/ltt-ui.js", "/kit/ltt-mock.js", "/kit/ltt-deck.js"];
  for (const page of pages) {
    const srcs = scripts(page);
    if (!srcs.includes("/kit/ltt-deck.js")) continue;
    const at = order.map((s) => srcs.indexOf(s)).filter((i) => i >= 0);
    assert.deepEqual(at, [...at].sort((a, b) => a - b), `${page} loads kit modules out of order`);
    for (const need of ["/kit/ltt-parts.js", "/kit/ltt-ui.js"]) assert.ok(srcs.includes(need), `${page} uses the deck without ${need}`);
    if (/LTT\.mock\./.test(read(page))) assert.ok(srcs.includes("/kit/ltt-mock.js"), `${page} uses LTT.mock without ltt-mock.js`);
  }
});

test("lesson examples carry ltt-meta for picking a reference", () => {
  for (const page of pages) {
    if (!scripts(page).includes("/kit/ltt-deck.js")) continue;
    const m = /<script type="application\/json" id="ltt-meta">(.*?)<\/script>/s.exec(read(page));
    assert.ok(m, `${page} has no ltt-meta`);
    const meta = JSON.parse(m[1]);
    for (const k of ["domain", "topic", "audience", "pattern", "theme", "medium", "mode", "decision"]) assert.ok(meta[k], `${page} ltt-meta lacks ${k}`);
  }
});

test("lesson examples pass their theme to the deck and span several media", () => {
  const used = new Set();
  for (const page of pages) {
    if (!scripts(page).includes("/kit/ltt-deck.js") || page === "scenes.html") continue;
    const meta = JSON.parse(/<script type="application\/json" id="ltt-meta">(.*?)<\/script>/s.exec(read(page))[1]);
    assert.match(read(page), new RegExp(`theme:\\s*"${meta.theme}"`), `${page} ltt-meta theme is not the deck theme`);
    used.add(meta.theme);
  }
  assert.ok(used.size >= 5, `examples use only ${[...used].join(", ")}`);
});
