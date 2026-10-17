import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const GALLERY = new URL("../site/gallery/", import.meta.url);
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
    for (const [use, need] of [[/LTT\.map\(/, "/kit/vendor/topojson-client.min.js"], [/LTT\.sankey\(/, "/kit/vendor/d3-sankey.min.js"], [/LTT\.plot\(/, "/kit/vendor/plot.umd.min.js"], [/LTT\.autoLayout\(/, "/kit/vendor/elk.bundled.js"], [/LTT\.state\(/, "/kit/vendor/elk.bundled.js"], [/LTT\.math\(/, "/kit/vendor/katex/katex.min.js"]])
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

const vendorEntries = () => readFileSync(new URL("../skills/learn-to-tell/kit/vendor/VERSIONS", import.meta.url), "utf8")
  .split("\n").filter((l) => l.trim() && !l.startsWith("font subsets:"))
  .map((l) => { const t = l.trim().split(/\s+/); return { name: t[0], version: t[1] }; });
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\\/-]/g, "\\$&");
const supportSlice = () => {
  const html = read("index.html");
  const at = html.indexOf('id="support"');
  assert.ok(at >= 0, 'index.html has no id="support"');
  const end = html.indexOf("</section>", at);
  assert.ok(end >= 0, "#support has no closing </section>");
  return html.slice(at, end);
};
const textOf = (s) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
const chips = (slice) => [...slice.matchAll(/<[^<>]*\bdata-group="([^"]*)"[^<>]*>/g)].map((m) => ({ name: m[1], tag: m[0], from: m.index }));
const attrCount = (s, attr) => s.split(`${attr}=`).length - 1;

test("VO-1 support table lists every VERSIONS entry with its version", () => {
  const entries = vendorEntries();
  assert.ok(entries.length > 0, "no VERSIONS entries parsed");
  const html = read("index.html");
  for (const { name, version } of entries) {
    const m = new RegExp(`<tr\\b[^>]*\\sdata-vendor="${escapeRe(name)}"[^>]*>([\\s\\S]*?)</tr>`).exec(html);
    assert.ok(m, `index.html has no data-vendor row for ${name}`);
    assert.ok(m[1].includes(version), `index.html row for ${name} lacks version ${version}`);
  }
});

test("VO-2 support table rows match VERSIONS in both directions and appear once", () => {
  const names = new Set(vendorEntries().map((e) => e.name));
  const rowList = [...read("index.html").matchAll(/data-vendor="([^"]*)"/g)].map((m) => m[1]);
  const rows = new Set(rowList);
  const missing = [...names].filter((n) => !rows.has(n));
  assert.deepEqual(missing, [], `VERSIONS entries without a row: ${missing.join(", ")}`);
  const extra = [...rows].filter((n) => !names.has(n));
  assert.deepEqual(extra, [], `rows not in VERSIONS: ${extra.join(", ")}`);
  const dup = [...rows].filter((n) => rowList.filter((r) => r === n).length > 1);
  assert.deepEqual(dup, [], `duplicated data-vendor rows: ${dup.join(", ")}`);
});

test("VO-3 catalog loads the katex stylesheet before the kit script", () => {
  const html = read("catalog.html");
  const css = html.search(/<link\b[^>]*href="\/kit\/vendor\/katex\/katex\.min\.css"/);
  const kit = html.indexOf('<script src="/kit/ltt.js"');
  assert.ok(css >= 0, "catalog.html does not link katex.min.css");
  assert.ok(kit >= 0, "catalog.html does not load /kit/ltt.js");
  assert.ok(css < kit, "catalog.html links katex.min.css after the kit script");
});

test("VO-4 catalog math demo span has inline and display tex and the LTT.math call", () => {
  const html = read("catalog.html");
  const parts = html.indexOf('group("움직이는 그림 · ltt-parts.js")');
  const deck = html.indexOf('group("장면 덱 · ltt-deck.js")');
  const math = html.indexOf('demo("math"');
  assert.ok(math >= 0, 'catalog.html lacks demo("math"');
  assert.ok(parts >= 0 && deck > parts, "catalog.html group calls missing or out of order");
  assert.ok(math > parts && math < deck, 'demo("math" is outside the ltt-parts.js group');
  const body = html.indexOf("=> {", math);
  assert.ok(body >= 0, 'demo("math" has no builder body');
  const rest = html.slice(body + "=> {".length);
  const next = rest.search(/\b(demo|group)\(/);
  const span = rest.slice(0, next < 0 ? undefined : next);
  const tags = [...span.matchAll(/<[^<>]*\bdata-tex\b[^<>]*>/g)].map((m) => m[0]);
  assert.ok(tags.some((t) => !/\bdata-display\b/.test(t)), "math demo has no inline data-tex element");
  assert.ok(/\bdata-display\b/.test(span), "math demo has no data-display block");
  assert.ok(span.includes("LTT.math("), "math demo does not call LTT.math(");
});

test("VO-5 support card sits after the lib grid; groups, features and vendor rows lie inside it", () => {
  const html = read("index.html");
  assert.equal(html.split('id="support"').length - 1, 1, 'index.html must have exactly one id="support"');
  const at = html.indexOf('id="support"');
  const tag = html.slice(html.lastIndexOf("<", at), html.indexOf(">", at) + 1);
  assert.match(tag, /class="[^"]*\bltt-card\b/, "#support is not an ltt-card");
  const lib = html.indexOf('class="lib"');
  assert.ok(lib >= 0 && lib < at, '#support is not after class="lib"');
  assert.ok(!html.slice(lib, at).includes('<h3 class="group"'), "an h3.group sits between .lib and #support");
  const slice = supportSlice();
  const found = chips(slice);
  for (const g of ["ltt.js", "ltt-ui.js", "ltt-mock.js", "ltt-parts.js", "ltt-deck.js"]) {
    const c = found.find((x) => x.name === g);
    assert.ok(c, `#support lacks data-group="${g}"`);
    assert.ok(/^<a\s/.test(c.tag), `chip ${g} is not an <a> opening tag`);
    assert.ok(c.tag.includes('href="catalog.html"'), `chip ${g} lacks href="catalog.html"`);
  }
  for (const f of ["math", "map", "code", "layout", "flow", "sketch"]) assert.ok(slice.includes(`data-feature="${f}"`), `#support lacks data-feature="${f}"`);
  for (const attr of ["data-group", "data-feature", "data-vendor"])
    assert.equal(attrCount(html, attr), attrCount(slice, attr), `${attr} appears outside #support`);
});

test("VO-6 gallery index and catalog styles use no hex color literals", () => {
  for (const page of ["index.html", "catalog.html"]) {
    const blocks = [...read(page).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
    assert.ok(blocks.length > 0, `${page} has no <style> block`);
    for (const css of blocks) assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, `${page} <style> contains a hex color literal`);
  }
});

test("VO-8 support card content: chips, vendor rows, feature items", () => {
  const slice = supportSlice();
  for (const c of chips(slice)) {
    const end = slice.indexOf("</a>", c.from);
    assert.ok(end >= 0, `chip ${c.name} has no closing </a>`);
    const n = (slice.slice(c.from, end).match(/<code\b/g) || []).length;
    assert.ok(n >= 2 && n <= 3, `chip ${c.name} has ${n} <code> parts, want 2-3`);
  }
  for (const { name } of vendorEntries()) {
    const m = new RegExp(`<tr\\b[^>]*\\sdata-vendor="${escapeRe(name)}"[^>]*>([\\s\\S]*?)</tr>`).exec(slice);
    assert.ok(m, `#support has no row for ${name}`);
    const cells = [...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((x) => x[1]);
    assert.equal(cells.length, 4, `row ${name} has ${cells.length} <td> cells, want 4`);
    cells.forEach((cell, i) => assert.ok(textOf(cell).length > 0, `row ${name} cell ${i + 1} is empty`));
  }
  const items = {};
  for (const m of slice.matchAll(/<[^<>]*\bdata-feature="([^"]*)"[^<>]*>/g)) {
    const end = slice.indexOf("</li>", m.index);
    assert.ok(end >= 0, `feature ${m[1]} has no closing </li>`);
    items[m[1]] = slice.slice(m.index, end);
  }
  for (const f of ["math", "map", "code", "layout", "flow", "sketch"]) {
    assert.ok(items[f], `feature ${f} missing`);
    assert.ok(items[f].includes("/kit/vendor/"), `feature ${f} names no /kit/vendor/ file`);
  }
  for (const lang of ["javascript", "typescript", "python", "bash", "json", "sql"]) assert.ok(items.code?.includes(lang), `feature code lacks ${lang}`);
  assert.ok(items.math?.includes("LTT.math"), "feature math lacks LTT.math");
  assert.ok(items.map?.includes("LTT.map"), "feature map lacks LTT.map");
});
