// This script is here only for record purpose. Do not read this unless you are looking for spec-logs.
// R-3 (spec 74cb05d7da21907e FR-1/QR-7, v5 FR-5/FR-8): counts measuring identifiers inside the figure, predict and recallList handler
// bodies; whole-file widen/unwiden/grown; button-mark and scene-style writes inside placement.predict.
// Usage: node 74cb05d7da21907e-r3-grep.mjs <ltt-deck.js>
import { readFileSync } from "node:fs";
const src = readFileSync(process.argv[2], "utf8");
function body(startRe) {
  const m = startRe.exec(src);
  if (!m) throw new Error("no " + startRe);
  let i = src.indexOf("{", m.index + m[0].length - 1), depth = 0, j = i;
  for (; j < src.length; j++) { if (src[j] === "{") depth++; else if (src[j] === "}" && --depth === 0) break; }
  return src.slice(i, j + 1);
}
const bodies = { figure: body(/\n    figure: function \(s, body, ctx\) \{/), predict: body(/\n    predict: function \(s, body, ctx\) \{/), recallList: body(/\n  function recallList\(s, cards, body, ctx\) \{/) };
const ids = ["LTT.measure", "dk-still", "dk-probe", "pending", "innerWidth", "getBoundingClientRect", "solidRects", "offsetHeight", "probe", "measureAll", "under", "eachStep", "lockZoom", "widen", "unwiden", "tallest"];
const rows = [];
for (const [name, b] of Object.entries(bodies)) for (const id of ids) {
  const n = (b.match(new RegExp("\\b" + id.replace(/[.-]/g, (c) => "\\" + c) + "\\b", "g")) || []).length;
  if (n) rows.push({ handler: name, id, n });
}
const pp = body(/\n    predict: function \(ctx, o\) \{/);
const markRe = /aria-pressed|["'.]right\b|["'.]wrong\b|\.el\.style|ctx\.el\.setAttribute|setAttribute\(\s*["']style|removeAttribute\(\s*["']style/g;
const placementPredict = { lines: pp.split("\n").length, markOrStyleWrites: (pp.match(markRe) || []).length };
const leftovers = { widen: (src.match(/\bwiden\b/g) || []).length, unwiden: (src.match(/\bunwiden\b/g) || []).length, grown: (src.match(/\bgrown\b/g) || []).length };
const key = /innerWidth \+ "x" \+ innerHeight \+ document\.fonts\.status/.test(src);
console.log(JSON.stringify({ lines: Object.fromEntries(Object.entries(bodies).map(([k, v]) => [k, v.split("\n").length])), hits: rows, sizeKeyHasFontStatus: key, leftovers, placementPredict }));
