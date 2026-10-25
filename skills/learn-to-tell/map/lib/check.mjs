import { DOMAIN_RE, ID_RE, cmp, conceptList, normalize, uniqSorted } from "./common.mjs";

function pathOf(derived, id) {
  return derived.sources?.[id]?.[0] ?? `concept ${id}`;
}

function findCycles(edges) {
  const adj = new Map();
  for (const { from, to } of edges) {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
  }
  for (const list of adj.values()) list.sort(cmp);
  const color = new Map();
  const seen = new Set();
  const cycles = [];
  for (const start of [...adj.keys()].sort(cmp)) {
    if (color.has(start)) continue;
    const path = [start];
    const iters = [0];
    color.set(start, 1);
    while (path.length) {
      const node = path[path.length - 1];
      const i = iters[iters.length - 1]++;
      const next = adj.get(node)?.[i];
      if (next === undefined) {
        color.set(node, 2);
        path.pop();
        iters.pop();
      } else if (color.get(next) === 1) {
        const ring = path.slice(path.indexOf(next));
        const lead = ring.indexOf([...ring].sort(cmp)[0]);
        const canon = [...ring.slice(lead), ...ring.slice(0, lead)];
        const key = canon.join(">");
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(canon);
        }
      } else if (!color.has(next)) {
        color.set(next, 1);
        path.push(next);
        iters.push(0);
      }
    }
  }
  return cycles;
}

// Diagnostics must not depend on lesson input order (rebuild output is compared byte-for-byte).
function diagnosticKey(message) {
  const m = /^([^:]*?)(?::(\d+))?(?=[:,])/.exec(message);
  return m ? [m[1], Number(m[2] ?? 0)] : [message, 0];
}

function sortDiagnostics(list) {
  return [...new Set(list)].sort((a, b) => {
    const [pa, la] = diagnosticKey(a);
    const [pb, lb] = diagnosticKey(b);
    return cmp(pa, pb) || la - lb || cmp(a, b);
  });
}

export function check(derived) {
  const concepts = conceptList(derived.concepts);
  const edges = derived.edges ?? [];
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const errors = [...(derived.errors ?? [])];
  const warnings = [...(derived.warnings ?? [])];

  for (const c of concepts) {
    const where = pathOf(derived, c.id);
    if (typeof c.id !== "string" || !ID_RE.test(c.id)) errors.push(`${where}: invalid concept id ${JSON.stringify(c.id)}`);
    if (!c.title) errors.push(`${where}: concept ${c.id} is missing title`);
    if (!c.definition) errors.push(`${where}: concept ${c.id} is missing definition`);
    if (!Array.isArray(c.domains) || c.domains.length === 0) errors.push(`${where}: concept ${c.id} is missing domains`);
    else for (const d of c.domains) if (typeof d !== "string" || !DOMAIN_RE.test(d)) errors.push(`${where}: concept ${c.id} has invalid domain ${JSON.stringify(d)}`);
    if (!Number.isInteger(c.level) || c.level < 1 || c.level > 5) errors.push(`${where}: concept ${c.id} level ${JSON.stringify(c.level)} is outside 1-5`);
  }

  for (const ring of findCycles(edges)) {
    const files = uniqSorted(ring.map((id) => pathOf(derived, id)));
    errors.push(`${files.join(", ")}: requires cycle ${[...ring, ring[0]].join(" -> ")}`);
  }

  for (const { from, to } of edges) {
    const a = byId.get(from);
    const b = byId.get(to);
    if (a && b && a.level > b.level) {
      warnings.push(`${pathOf(derived, from)}: prerequisite ${from} (level ${a.level}) is above dependent ${to} (level ${b.level})`);
    }
  }

  const owners = new Map();
  for (const c of concepts) {
    for (const name of [c.title, ...(c.aliases ?? [])]) {
      const key = normalize(name);
      if (!key) continue;
      if (!owners.has(key)) owners.set(key, new Set());
      owners.get(key).add(c.id);
    }
  }
  for (const key of [...owners.keys()].sort(cmp)) {
    const ids = [...owners.get(key)].sort(cmp);
    if (ids.length > 1) warnings.push(`${pathOf(derived, ids[0])}: concepts ${ids.join(", ")} share the name "${key}"`);
  }

  const edgeKeys = new Set(edges.flatMap(({ from, to }) => [`${from}\0${to}`, `${to}\0${from}`]));
  for (const [a, b] of derived.rejected ?? []) {
    if (edgeKeys.has(`${a}\0${b}`)) warnings.push(`decisions.jsonl: rejected pair ${a}, ${b} has an edge`);
  }

  return { errors: sortDiagnostics(errors), warnings: sortDiagnostics(warnings) };
}
