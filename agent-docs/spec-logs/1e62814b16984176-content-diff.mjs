// R-3/R-4 (spec 1e62814b16984176): compares two `review.mjs dump` outputs on the FR-6 (a)-(d) invariants.
// Usage: node 1e62814b16984176-content-diff.mjs <base.json> <final.json>   (exit 1 when any invariant differs)
import { readFileSync } from "node:fs";

const [baseFile, finalFile] = process.argv.slice(2);
const base = JSON.parse(readFileSync(baseFile, "utf8"));
const fin = JSON.parse(readFileSync(finalFile, "utf8"));
const META_KEPT = ["domain", "topic", "audience", "theme", "medium", "decision", "lesson"];
const J = (v) => JSON.stringify(v ?? null);

function facts(page) {
  const scenes = page.spec.scenes;
  const predicts = scenes.filter((s) => s.type === "predict").map((s) => ({ question: s.question, choices: s.choices, answer: s.answer }));
  const terms = scenes.filter((s) => s.type === "terms").flatMap((s) => (s.terms || []).map((t) => t.key)).sort();
  const keywords = scenes.filter((s) => s.type === "keywords");
  // What the summaries show: explicit `cards` when given, otherwise every scene's takeaway (LTT.summaryCards' default).
  // A split summary lists its share of cards explicitly, so the shown cards are compared in order, not counted twice.
  const auto = scenes.map((x) => ({ title: x.title, text: x.takeaway, ask: x.ask, recall: x.recall })).filter((c) => c.text);
  const shown = scenes.filter((s) => s.type === "summary")
    .flatMap((s) => (Array.isArray(s.cards) ? s.cards.map((c) => ({ title: c.title, text: c.text, ask: c.ask, recall: c.recall })) : auto));
  const own = scenes.filter((s) => s.type !== "summary");
  const count = (f) => own.filter((s) => s[f]).length;
  return {
    meta: Object.fromEntries(META_KEPT.map((k) => [k, page.meta?.[k]])),
    predicts, terms, keywords,
    glossary: Object.keys(page.spec.glossary || {}).sort(),
    expects: page.expects,
    counts: { takeaway: count("takeaway"), recall: count("recall"), ask: count("ask") },
    summaryShown: shown,
  };
}

let bad = 0;
const rows = [];
for (const rel of Object.keys(base)) {
  if (!fin[rel]) { console.log(`${rel}: 최종 덤프에 없음`); bad++; continue; }
  const a = facts(base[rel]), b = facts(fin[rel]);
  const diffs = Object.keys(a).filter((k) => J(a[k]) !== J(b[k]));
  bad += diffs.length;
  const sa = base[rel].spec.scenes.length, sb = fin[rel].spec.scenes.length;
  rows.push(`| ${rel} | ${sa} | ${sb} | ${sb - sa} | ${J(base[rel].meta?.pattern) === J(fin[rel].meta?.pattern) ? "같음" : "바뀜"} | ${J(base[rel].meta?.mode) === J(fin[rel].meta?.mode) ? "같음" : "바뀜"} | ${diffs.length ? diffs.join(", ") : "없음"} |`);
  for (const k of diffs) console.log(`${rel} ${k}:\n  기준 ${J(a[k]).slice(0, 400)}\n  최종 ${J(b[k]).slice(0, 400)}`);
}
console.log("| 페이지 | 기준 장면 | 최종 장면 | 증가 | pattern | mode | FR-6 a–d 차이 |\n| --- | --- | --- | --- | --- | --- | --- |\n" + rows.join("\n"));
console.log(`FR-6 a–d 차이 합: ${bad}`);
process.exit(bad ? 1 : 0);
