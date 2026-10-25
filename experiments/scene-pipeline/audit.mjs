// 실험용 audit: node audit.mjs <scene.html 절대/상대경로>  (gallery 루트 = 이 파일 옆 gallery/)
import { execFileSync } from "node:child_process";
import { resolve, relative, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url)), gal = resolve(here, "gallery");
const rel = relative(gal, resolve(process.argv[2]));
const res = JSON.parse(execFileSync("node", [resolve(here, "audit-pw.mjs"), gal, rel], { encoding: "utf8" }));
const ADV = new Set(["shrunk","small-visual","loose-figure","empty-stage","many-sizes","goal-narrow","card-monotony","no-signature","unused-term"]);
let fix = 0;
for (const r of res) {
  console.log(`## ${r.size}`);
  if (r.error) { fix++; console.log(`  고침 load: ${r.error}`); }
  for (const e of r.errors || []) { fix++; console.log(`  고침 pageerror: ${e}`); }
  for (const a of r.audit || []) { const k = ADV.has(a.rule) ? "권고" : (fix++, "고침"); console.log(`  ${k} 장면${a.scene} ${a.rule}: ${a.msg}`); }
  for (const l of (r.lint || []).filter((l) => l.rule !== "keywords-last" && l.rule !== "deck-order")) { const k = ADV.has(l.rule) ? "권고" : (fix++, "고침"); console.log(`  ${k} lint ${l.rule}: ${l.msg}`); }
  for (const x of r.expectFails || []) { fix++; console.log(`  고침 expect: ${JSON.stringify(x)}`); }
}
console.log(fix ? `고침 ${fix}건` : "고침 0건");
process.exit(fix ? 1 : 0);
