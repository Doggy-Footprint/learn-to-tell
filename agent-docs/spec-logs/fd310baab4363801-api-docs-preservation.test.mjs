// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// Archived run evidence for spec fd310baab4363801 FR-4 (moved from tests/ at run close; not part of npm test). Paths resolve from agent-docs/spec-logs/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const KIT = join(ROOT, "skills/learn-to-tell/kit");
const API_DIR = join(KIT, "api");
const FIXTURE = new URL("./fd310baab4363801-api-md-base-codespans.json", import.meta.url);

// Same extraction that produced the fixture from b514c52 kit/API.md: one-line spans outside fenced blocks, \| -> |.
function spanTexts(text) {
  const out = new Set();
  let fenced = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    for (const m of line.matchAll(/`([^`]+)`/g)) out.add(m[1].replaceAll("\\|", "|"));
  }
  return out;
}

function lostSpans(fixture, files) {
  const have = new Set(Object.values(files).flatMap((t) => [...spanTexts(t)]));
  return fixture.filter((s) => !have.has(s));
}

function realDocs() {
  const api = join(KIT, "API.md");
  assert.ok(existsSync(api), `kit/API.md is missing: ${api}`);
  assert.ok(existsSync(API_DIR), `kit/api/ directory is missing: ${API_DIR}`);
  const files = { "kit/API.md": readFileSync(api, "utf8") };
  for (const f of readdirSync(API_DIR).filter((f) => f.endsWith(".md"))) files[`kit/api/${f}`] = readFileSync(join(API_DIR, f), "utf8");
  return files;
}

const fixture = () => JSON.parse(readFileSync(FIXTURE, "utf8"));

test("VO-5 fixture: 454 distinct base code-span texts", () => {
  const f = fixture();
  assert.ok(Array.isArray(f) && f.every((s) => typeof s === "string"), "fixture is not a string array");
  assert.equal(f.length, 454);
  assert.equal(new Set(f).size, 454, "fixture has duplicates");
  assert.equal(f.some((s) => s.includes("\\|")), false, "fixture keeps an escaped \\|");
});

test("VO-5 preserved: a fixture span present in D (after \\| -> |) is not reported", () => {
  const files = { "a.md": "| `LTT.palette(t, \"light\"\\|\"dark\")` | x |\n", "b.md": "본문 `kept`\n" };
  assert.deepEqual(lostSpans(["LTT.palette(t, \"light\"|\"dark\")", "kept"], files), []);
});

test("VO-5 C-7 lost: a fixture span absent from D is reported by name", () => {
  const lost = lostSpans(["kept", "zz-missing"], { "a.md": "`kept` 문장\n" });
  assert.deepEqual(lost, ["zz-missing"]);
});

test("VO-5 FR-4: every base kit/API.md code span survives somewhere in D", () => {
  const lost = lostSpans(fixture(), realDocs());
  assert.deepEqual(lost, [], `${lost.length} base code spans lost:\n${lost.join("\n")}`);
});
