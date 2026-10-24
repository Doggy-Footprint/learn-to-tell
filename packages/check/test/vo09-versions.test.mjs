// VO-9 (QR-3, FR-13): installed vega/vega-lite, exported constants, root package.json.
// Oracle: QR-3 exact strings and FR-13 manifest clauses.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./fixtures/cli.mjs";
import { loadIndex } from "./fixtures/report.mjs";

const json = (p) => JSON.parse(readFileSync(join(REPO, p), "utf8"));
const root = () => json("package.json");

test("V1 vega installed = VEGA_VERSION = 6.4.0", async () => {
  const { VEGA_VERSION } = await loadIndex();
  assert.equal(VEGA_VERSION, "6.4.0");
  assert.equal(json("node_modules/vega/package.json").version, "6.4.0");
});

test("V2 vega-lite installed = VEGA_LITE_VERSION = 6.5.0", async () => {
  const { VEGA_LITE_VERSION } = await loadIndex();
  assert.equal(VEGA_LITE_VERSION, "6.5.0");
  assert.equal(json("node_modules/vega-lite/package.json").version, "6.5.0");
});

test("V3 exact dependency strings; ajv ^8, parse5 ^8", () => {
  const d = root().dependencies;
  assert.equal(d.vega, "6.4.0");
  assert.equal(d["vega-lite"], "6.5.0");
  assert.match(d.ajv, /^\^8(\.|$)/);
  assert.match(d.parse5, /^\^8(\.|$)/);
});

test("V4 private and type module", () => {
  const p = root();
  assert.equal(p.private, true);
  assert.equal(p.type, "module");
});

test("V5 engines.node >=22", () => {
  assert.equal(root().engines?.node, ">=22");
});
