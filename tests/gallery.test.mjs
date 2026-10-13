import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const GALLERY = new URL("../skills/learn-to-tell/gallery/", import.meta.url);
const pages = readdirSync(GALLERY).filter((f) => f.endsWith(".html"));
const read = (f) => readFileSync(new URL(f, GALLERY), "utf8");

test("index links every gallery page and only existing ones", () => {
  const links = new Set([...read("index.html").matchAll(/href="([^"#?]+\.html)"/g)].map((m) => m[1]));
  for (const page of pages.filter((p) => p !== "index.html")) assert.ok(links.has(page), `index.html does not link ${page}`);
  for (const link of links) assert.ok(pages.includes(link), `index.html links missing ${link}`);
});

test("gallery pages load vendor scripts before the kit", () => {
  for (const page of pages) {
    const srcs = [...read(page).matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
    const kit = srcs.indexOf("/kit/ltt.js");
    assert.ok(kit >= 0, `${page} does not load /kit/ltt.js`);
    for (const vendor of ["/kit/vendor/d3.min.js", "/kit/vendor/plot.umd.min.js"]) {
      const i = srcs.indexOf(vendor);
      if (i >= 0) assert.ok(i < kit, `${page} loads ${vendor} after the kit`);
    }
  }
});
