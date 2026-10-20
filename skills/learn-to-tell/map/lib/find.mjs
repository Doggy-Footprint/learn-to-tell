import { cmp, conceptList, normalize } from "./common.mjs";

function grams(text) {
  const s = normalize(text);
  const out = new Set();
  if (!s) return out;
  if (s.length < 3) return out.add(s);
  for (let i = 0; i <= s.length - 3; i++) out.add(s.slice(i, i + 3));
  return out;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  return inter / (a.size + b.size - inter);
}

export function find(concepts, query, { k = 5, domain } = {}) {
  const q = normalize(query);
  if (!q) return [];
  const qGrams = grams(query);
  const hits = [];
  for (const c of conceptList(concepts)) {
    if (domain && !(c.domains ?? []).includes(domain)) continue;
    const names = [c.title, ...(c.aliases ?? [])];
    const exact = normalize(c.id) === q || names.some((n) => normalize(n) === q);
    if (exact) {
      hits.push({ id: c.id, title: c.title, definition: c.definition, score: 1, exact: true });
      continue;
    }
    const nameScore = Math.max(0, ...names.map((n) => jaccard(qGrams, grams(n))));
    const defScore = jaccard(qGrams, grams(c.definition));
    const score = (2 * nameScore + defScore) / 3;
    if (score > 0) hits.push({ id: c.id, title: c.title, definition: c.definition, score, exact: false });
  }
  hits.sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score || cmp(a.id, b.id));
  return hits.slice(0, Math.max(0, k));
}
