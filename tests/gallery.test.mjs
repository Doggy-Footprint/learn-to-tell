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

// ---------- spec 74cb05d7da21907e VO-4 (FR-7, C-15): figure picture widths are not pinned with vw ----------

const LESSON_PAGES = pages.filter((p) => !["index.html", "catalog.html"].includes(p) && p.split("/").length <= 2);
const WIDTH_PROPS = new Set(["width", "min-width", "max-width"]);
const VW_ALLOWED = [{ page: "cache-ttl.html", selector: ".ans-row .ltt-units" }];
const normSelector = (s) => s.trim().replace(/\s+/g, " ");

// Innermost `selector { declarations }` blocks, so rules nested in @media/@supports keep their own selector.
function cssRules(css) {
  const out = [];
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(";").pop().split(",").map(normSelector).filter(Boolean);
    const decls = m[2].split(";").map((d) => d.split(":")).filter((kv) => kv.length >= 2)
      .map(([k, ...v]) => ({ prop: k.trim().toLowerCase(), value: v.join(":").trim() }));
    out.push({ selectors, decls });
  }
  return out;
}
const styleRules = (page) => [...read(page).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].flatMap((m) => cssRules(m[1]));
const vwWidths = (rule) => rule.decls.filter((d) => WIDTH_PROPS.has(d.prop) && /vw/i.test(d.value));

test("VO-4 css parser: nested @media rules, comments, non-width properties and grouped selectors", () => {
  const rules = cssRules("/* .x { width: 9vw } */ .a, .b  .c { gap: 2vw; font-size: clamp(1px, 1vw, 2px); border-width: 1vw; width: 50% }\n@media (max-width: 900px) { .d { max-width: 40vw; } }");
  assert.deepEqual(rules.map((r) => r.selectors), [[".a", ".b .c"], [".d"]]);
  assert.deepEqual(rules.map((r) => vwWidths(r).map((d) => `${d.prop}: ${d.value}`)), [[], ["max-width: 40vw"]]);
});

test("VO-4 FR-7: the scan covers the 13 gallery lesson pages (site/gallery/*.html and */*.html, minus index, catalog, stale/)", () => {
  assert.equal(LESSON_PAGES.length, 13, LESSON_PAGES.join(", "));
  for (const p of ["cache-ttl.html", "scenes.html", "network/tls13-quic.html", "knowledge-graph/ontology-triples.html"]) assert.ok(LESSON_PAGES.includes(p), `scan misses ${p}`);
  for (const p of LESSON_PAGES) assert.ok(styleRules(p).length > 0, `${p} has no <style> rule`);
});

test("VO-4 FR-7: no <style> width, min-width or max-width declaration uses vw outside the allow-list (cache-ttl .ans-row .ltt-units)", () => {
  const offenders = [];
  for (const page of LESSON_PAGES) {
    for (const rule of styleRules(page)) {
      const vw = vwWidths(rule);
      if (vw.length === 0) continue;
      const allowed = rule.selectors.every((s) => VW_ALLOWED.some((a) => a.page === page && a.selector === s));
      if (!allowed) offenders.push(`${page} ${rule.selectors.join(", ")} { ${vw.map((d) => `${d.prop}: ${d.value}`).join("; ")} }`);
    }
  }
  assert.deepEqual(offenders, [], `vw widths outside the allow-list:\n${offenders.join("\n")}`);
});

for (const [page, need] of [["network/tls13-quic.html", [".seqwrap"]], ["knowledge-graph/ontology-triples.html", [".kg.wide", ".ladder"]]]) {
  test(`VO-4 FR-7 C-15: ${page} has a rule for ${need.join(", ")} and no rule naming them pins a width with vw`, () => {
    const rules = styleRules(page);
    assert.ok(rules.some((r) => need.every((s) => r.selectors.includes(s))), `${page} has no <style> rule whose selector list includes ${need.join(" and ")}`);
    const pinned = rules.filter((r) => need.some((s) => r.selectors.includes(s)) && vwWidths(r).length > 0)
      .map((r) => `${r.selectors.join(", ")} { ${vwWidths(r).map((d) => `${d.prop}: ${d.value}`).join("; ")} }`);
    assert.deepEqual(pinned, [], `${page} still pins a width with vw:\n${pinned.join("\n")}`);
  });
}

// ---------- spec 1e62814b16984176 VO-4 (FR-5, C-13, C-14, E-6): ltt-meta.mode format and tls13 dead code ----------

// Signatures: "<형>: <서술>", 형 ∈ 체험형·설명형·카탈로그용, 서술 at least 20 characters (JS string length).
const MODE_FORM = /^(체험형|설명형|카탈로그용): ([\s\S]*)$/;
const MODE_MIN = 20;
function modeError(mode) {
  if (typeof mode !== "string") return `mode is not a string: ${JSON.stringify(mode)}`;
  const m = MODE_FORM.exec(mode);
  if (!m) return `mode does not start with 체험형: , 설명형: or 카탈로그용: — ${JSON.stringify(mode)}`;
  if (m[2].length < MODE_MIN) return `mode description has ${m[2].length} characters < ${MODE_MIN} — ${JSON.stringify(mode)}`;
  return null;
}
const DESC = "핸드셰이크와 0-RTT를 그림으로 보고 스트림이 막히는지 짐작한다";
const desc = (n) => DESC.slice(0, n);

const MODE_CASES = [
  { id: 'C-14 "체험형: " + 19 characters', mode: `체험형: ${desc(19)}`, ok: false },
  { id: 'C-14 "체험형: " + 20 characters', mode: `체험형: ${desc(20)}`, ok: true },
  { id: 'C-14 "simulation"', mode: "simulation", ok: false },
  { id: 'C-14 "체험형:" + 20 characters, no space', mode: `체험형:${desc(20)}`, ok: false },
  { id: 'C-14 "실습형: " + 30 characters', mode: `실습형: ${desc(30)}`, ok: false },
];

test("VO-4 SY-1 C-14 fixtures: the description parts have the intended lengths", () => {
  assert.ok(DESC.length >= 30, `fixture text has only ${DESC.length} characters`);
  assert.deepEqual([desc(19).length, desc(20).length, desc(30).length], [19, 20, 30]);
});

for (const { id, mode, ok } of MODE_CASES) {
  test(`VO-4 SY-1 ${id}: the mode checker ${ok ? "passes" : "fails"}`, () => {
    const err = modeError(mode);
    if (ok) assert.equal(err, null);
    else assert.ok(err !== null, `checker accepted ${JSON.stringify(mode)}`);
  });
}

const DECK_PAGES = pages.filter((p) => scripts(p).includes("/kit/ltt-deck.js"));
const lttMeta = (page) => {
  const m = /<script type="application\/json" id="ltt-meta">(.*?)<\/script>/s.exec(read(page));
  assert.ok(m, `${page} has no ltt-meta`);
  return JSON.parse(m[1]);
};

test("VO-4 SY-2 FR-5: the deck pages (those loading /kit/ltt-deck.js) are the 13 gallery lessons", () => {
  assert.equal(DECK_PAGES.length, 13, DECK_PAGES.join(", "));
  assert.ok(DECK_PAGES.includes("network/tls13-quic.html"), "network/tls13-quic.html is not a deck page");
});

test("VO-4 SY-2 FR-5 E-6: every deck page's ltt-meta.mode is \"<체험형|설명형|카탈로그용>: <20+ characters>\"", () => {
  const bad = DECK_PAGES.map((page) => [page, modeError(lttMeta(page).mode)]).filter(([, err]) => err).map(([page, err]) => `${page}: ${err}`);
  assert.deepEqual(bad, [], `ltt-meta.mode format violations:\n${bad.join("\n")}`);
});

test("VO-4 SY-2 FR-5 C-13: network/tls13-quic.html ltt-meta.mode starts with 체험형: ", () => {
  const mode = lttMeta("network/tls13-quic.html").mode;
  assert.ok(typeof mode === "string" && mode.startsWith("체험형: "), `network/tls13-quic.html mode is ${JSON.stringify(mode)}`);
});

test("VO-4 SY-3 FR-5 C-13 E-6: network/tls13-quic.html contains no streamsMiniOld (definition, call or comment)", () => {
  const html = read("network/tls13-quic.html");
  const at = html.indexOf("streamsMiniOld");
  assert.equal(at, -1, `network/tls13-quic.html still contains streamsMiniOld at line ${html.slice(0, at).split("\n").length}`);
});
