// R-2 selection (spec 1e62814b16984176 v2): pairs base and final scenes by (type, title), falling back to position for
// untitled scenes, and lists every final scene whose box layout, text or zoom signature differs at either size, plus
// scenes with no base partner (split halves, whose partner is the unmatched base scene at the same place).
// Usage: node 1e62814b16984176-changed-scenes.mjs <sig-base.json> <sig-final.json> > changed-scenes.json
import { readFileSync } from "node:fs";
const [bf, ff] = process.argv.slice(2);
const B = JSON.parse(readFileSync(bf, "utf8")), F = JSON.parse(readFileSync(ff, "utf8"));
const out = {};
for (const key of Object.keys(F)) {
  const [size, page] = key.split(" "), bs = B[key], fs = F[key];
  const used = new Set();
  const match = fs.map((s) => {
    let j = bs.findIndex((b, k) => !used.has(k) && b.title && b.type === s.type && b.title === s.title);
    if (j < 0 && !s.title) j = bs.findIndex((b, k) => !used.has(k) && !b.title && b.type === s.type);
    if (j >= 0) used.add(j);
    return j;
  });
  const lostBase = bs.map((b, k) => k).filter((k) => !used.has(k));
  fs.forEach((s, i) => {
    const j = match[i];
    let why = [];
    if (j < 0) why.push("짝 없음(나뉜/새 장면)");
    else for (const f of ["boxes", "textHash", "zoom"]) if (bs[j][f] !== s[f]) why.push(f);
    if (!why.length) return;
    const e = ((out[page] ??= {})[s.i] ??= { final: s.i, base: j >= 0 ? bs[j].i : null, type: s.type, title: s.title, sizes: {} });
    e.sizes[size] = { why, zoom: [j >= 0 ? bs[j].zoom : null, s.zoom], minFont: [j >= 0 ? bs[j].minFont : null, s.minFont] };
    if (j < 0) e.unmatchedBase = lostBase.map((k) => bs[k].i);
  });
}
console.log(JSON.stringify(out, null, 1));
