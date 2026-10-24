// VO-3 (FR-2, C-7, C-31..C-33), syntax testing of <script src> forms S1..S10; also feeds VO-6.
// Oracle: spec 6ed8f04e251d4b22 v1 "Library scripts" grammar and Cases.
import { test } from "node:test";
import assert from "node:assert/strict";
import { C1 } from "./fixtures/html.mjs";
import { check, assertIssues } from "./fixtures/report.mjs";

const s = (src) => `<script src="${src}"></script>`;
const EMBED = s("https://cdn.jsdelivr.net/npm/vega-embed@6.0.0");
const VEGA = s("https://cdn.jsdelivr.net/npm/vega@6.4.0");
const VL = s("https://cdn.jsdelivr.net/npm/vega-lite@6.5.0");
const noLib = (r) => assert.deepEqual(r.errors.filter((e) => e.rule.startsWith("lib-")), []);

test("S1 cdnjs pinned + S9 vega-embed ignored (C-7 a)", async () => {
  const r = await check(C1({ libs: s("https://cdnjs.cloudflare.com/ajax/libs/vega/6.4.0/vega.min.js") + s("https://cdnjs.cloudflare.com/ajax/libs/vega-lite/6.5.0/vega-lite.min.js") + EMBED }));
  noLib(r);
  assertIssues(r, []);
});

test("S2 jsDelivr pinned (LIBS)", async () => {
  assertIssues(await check(C1()), []);
});

test("S3 unpkg pinned with and without path + S9 (C-7 b)", async () => {
  const r = await check(C1({ libs: s("https://unpkg.com/vega@6.4.0") + s("https://unpkg.com/vega-lite@6.5.0/build/vega-lite.min.js") + EMBED }));
  assertIssues(r, []);
});

test("S4 wrong version: jsDelivr vega-lite@6.4.0, cdnjs vega 6.3.0; no lib-missing (C-31)", async () => {
  const a = "https://cdn.jsdelivr.net/npm/vega-lite@6.4.0";
  assertIssues(await check(C1({ libs: VEGA + s(a) })), [{ rule: "lib-version", src: a, expected: "6.5.0", actual: "6.4.0" }]);
  const b = "https://cdnjs.cloudflare.com/ajax/libs/vega/6.3.0/vega.min.js";
  assertIssues(await check(C1({ libs: s(b) + VL })), [{ rule: "lib-version", src: b, expected: "6.4.0", actual: "6.3.0" }]);
});

test("S5 no version: jsDelivr vega-lite (C-31)", async () => {
  const a = "https://cdn.jsdelivr.net/npm/vega-lite";
  assertIssues(await check(C1({ libs: VEGA + s(a) })), [{ rule: "lib-version", src: a, expected: "6.5.0", actual: "" }]);
});

test("S6 partial version: vega-lite@6 (C-31)", async () => {
  const a = "https://cdn.jsdelivr.net/npm/vega-lite@6";
  assertIssues(await check(C1({ libs: VEGA + s(a) })), [{ rule: "lib-version", src: a, expected: "6.5.0", actual: "6" }]);
});

test("S7 other host vega-lite file and S8 other host vega@ segment, plus relative src (C-32 v2)", async () => {
  const a = "https://example.com/js/vega-lite.min.js";
  const b = "https://example.com/vega@6.4.0/vega.js";
  const c = "vendor/vega-lite.min.js";
  assertIssues(await check(C1({ libs: LIBSPlus(s(a) + s(b) + s(c)) })),
    [{ rule: "lib-source", src: a }, { rule: "lib-source", src: b }, { rule: "lib-source", src: c }]);
});

function LIBSPlus(x) {
  return VEGA + VL + x;
}

test("S10 chart without libs, only vega-embed (C-33)", async () => {
  const r = await check(C1({ libs: EMBED }));
  assert.deepEqual(r.errors.map((e) => e.rule), ["lib-missing", "lib-missing"]);
  assert.deepEqual(r.errors.map((e) => e.actual).sort(), ["vega", "vega-lite"]);
});
