import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./helpers.mjs";

const text = readFileSync(join(ROOT, "skills/learn-to-tell/SKILL.md"), "utf8");

// A top-level section runs from its "## N" heading to the next "## " heading. Patterns accept Korean or English phrasing.
function section(n) {
  const start = text.search(new RegExp(`^##(?!#)\\s*(?:§\\s*)?${n}\\b`, "m"));
  assert.ok(start >= 0, `section ${n} heading ("## ${n}. ...") not found`);
  const rest = text.slice(start + 3);
  const end = rest.search(/^##(?!#)\s/m);
  return end >= 0 ? text.slice(start, start + 3 + end) : text.slice(start);
}
// §6 split into blocks at "###" headings; the first block is the text before any subsection.
const blocks = (sec) => sec.split(/^(?=###(?!#)\s)/m);
const CMD = (c) => new RegExp(`ltt-map(?:\\.mjs)?\\s+${c}`);

test("VO-16 §5 result.md template starts with the concepts frontmatter (lesson -> date -> concepts)", () => {
  const s5 = section(5);
  assert.match(s5, /---[ \t]*\n\s*lesson:[^\n]*\n\s*date:[^\n]*\n\s*concepts:[^\n]*\n/, "lesson/date/concepts template");
  for (const f of ["definition:", "domains:", "level:", "requires:", "leads_to:", "quiz:"]) assert.ok(s5.includes(f), `§5 lacks ${f}`);
  assert.match(s5, /quiz:[^\n]*pass\s*\|\s*fail\s*\|\s*skipped\s*\|\s*none/);
});
test("VO-16 §0 reads the map through ltt-map show/find and never instructs reading the whole map.md", () => {
  const s0 = section(0);
  assert.match(s0, CMD("show"));
  assert.match(s0, CMD("find"));
  const sentences = s0.split(/(?<=[.。])\s|\n/);
  for (const s of sentences.filter((x) => /map\.md/.test(x))) {
    assert.match(s, /(통째로\s*읽지\s*않|(?:do|does)\s*n['o]t\s+read\s+(?:the\s+)?whole|never\s+read\s+(?:the\s+)?whole)/i, `§0 mentions map.md without saying not to read it whole: ${s}`);
  }
});
test("VO-16 §6 find-before-create (scoped to §6): find, exact -> reuse, compare definitions, ambiguous -> ask the user", () => {
  const s6 = section(6);
  const block = blocks(s6).find((b) => CMD("find").test(b));
  assert.ok(block, "no §6 subsection runs ltt-map find");
  assert.match(block, /(exact|정확)[^\n]*(reuse|재사용)|(reuse|재사용)[^\n]*(exact|정확)/i);
  assert.match(block, /(정의|definition)[^\n]*(비교|compare)|(비교|compare)[^\n]*(정의|definition)/i);
  assert.match(block, /(ambiguous|애매|모호)[^\n]*(ask|묻|질문)|(ask|묻|질문)[^\n]*(ambiguous|애매|모호)/i);
});
test("VO-16 §6 granularity rule: one concept = one decision variable checkable by one quiz item", () => {
  const s6 = section(6);
  const dv = "(?:결정\\s*변수\\s*(?:하나|한\\s*개|1\\s*개)|(?:하나의|한\\s*개의|1\\s*개의)\\s*결정\\s*변수|one\\s+decision\\s+variable)";
  const qi = "(?:문항\\s*(?:하나|한\\s*개|1\\s*개)|(?:하나의|한|1)\\s*(?:퀴즈\\s*)?문항|퀴즈\\s*(?:한|1)\\s*(?:문항|개)|one\\s+quiz\\s+item)";
  assert.match(s6, new RegExp(`${dv}[^\\n]{0,80}${qi}|${qi}[^\\n]{0,80}${dv}`, "i"));
});
test("VO-16 §6 level rubric: levels 1..5 present; 1 = freshman/new hire/신입, 5 = research/expert/연구/전문가 on the rubric", () => {
  const s6 = section(6);
  const near = (d, words) => new RegExp(`(?<![\\d.])${d}(?![\\d.])[^\\n]{0,60}?(?:${words})`, "i");
  const hint = s6.split("\n").filter((l) => /freshman|new\s*hire|신입|research|expert|연구|전문가/i.test(l)).join(" // ");
  assert.match(s6, near(1, "freshman|new\\s*hire|신입|1학년"), `level 1 -> freshman/new hire/신입 not found; candidate lines: ${hint}`);
  assert.match(s6, near(5, "research|expert|연구|전문가"), `level 5 -> research/expert/연구/전문가 not found; candidate lines: ${hint}`);
  for (const d of [2, 3, 4]) assert.match(s6, new RegExp(`(?<![\\d.])${d}(?![\\d.])\\s*(?:[:=)\\-–—→]|\\*\\*|\\s)\\s*\\S`), `no rubric entry for level ${d}`);
});
test("VO-16 §6 sweep subsection: sweep, due, Haiku, zero suggestions normal, one-sentence reason, decide link|reject, sweep-done", () => {
  const block = blocks(section(6)).find((b) => /sweep-done/.test(b));
  assert.ok(block, "no §6 subsection mentions sweep-done");
  assert.match(block, /ltt-map(?:\.mjs)?\s+sweep\b(?!-)/);
  assert.match(block, /\bdue\b/);
  assert.match(block, /haiku/i);
  assert.match(block, /((0|zero|제로|없)[^\n]*(normal|정상)|(normal|정상)[^\n]*(0|zero|없))/i);
  assert.match(block, /((one[- ]sentence|한\s*문장)[^\n]*(reason|이유)|(reason|이유)[^\n]*(one[- ]sentence|한\s*문장))/i);
  assert.match(block, /decide\s+link/);
  assert.match(block, /decide\s+reject/);
});
test("VO-16 §6 gives both view URLs", () => {
  const s6 = section(6);
  assert.ok(s6.includes("/map/grid.html"));
  assert.ok(s6.includes("/map/focus.html"));
});
