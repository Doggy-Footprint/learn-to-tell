// Pure layout and string rendering for the map views; shared by Node tests and
// the browser, so it must not touch DOM or Node-only APIs.

export const LEVELS = [1, 2, 3, 4, 5];

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const byTitle = (a, b) => cmp(a.title, b.title) || cmp(a.id, b.id);

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function concepts(data) {
  return Array.isArray(data?.concepts) ? data.concepts : [];
}

function neighborMap(data) {
  const map = new Map();
  const add = (a, b) => {
    if (a === b) return;
    if (!map.has(a)) map.set(a, new Set());
    map.get(a).add(b);
  };
  for (const { from, to } of data?.edges ?? []) {
    add(from, to);
    add(to, from);
  }
  return map;
}

export function layoutGrid(data) {
  const list = concepts(data);
  const near = neighborMap(data);
  const domains = [...new Set(list.flatMap((c) => c.domains ?? []))].sort(cmp);
  const rows = domains.map((domain) => ({
    domain,
    cells: LEVELS.map((level) => ({
      level,
      chips: list
        .filter((c) => c.level === level && (c.domains ?? []).includes(domain))
        .sort(byTitle)
        .map((c) => ({
          key: `${domain}:${c.id}`,
          id: c.id,
          title: c.title,
          domain,
          level,
          status: c.status,
          freshness: c.freshness,
          className: `chip ${c.freshness}`,
          href: `focus.html?id=${encodeURIComponent(c.id)}`,
          neighbors: [...(near.get(c.id) ?? [])].sort(cmp),
        })),
    })),
  }));
  return { empty: rows.length === 0, levels: LEVELS, rows };
}

export function layoutFocus(data, id) {
  const list = concepts(data);
  const center = list.find((c) => c.id === id);
  const frontierIds = new Set((data?.frontier ?? []).map((f) => f.id));
  if (!center && !frontierIds.has(id)) return { found: false, id, empty: list.length === 0 && frontierIds.size === 0 };

  const byId = new Map(list.map((c) => [c.id, c]));
  const home = new Set(center?.domains ?? []);
  const node = (nid) => {
    const c = byId.get(nid);
    if (!c) return { id: nid, title: nid, frontier: true, dashed: true, status: "frontier", freshness: null, domains: [], href: `focus.html?id=${encodeURIComponent(nid)}` };
    return { id: nid, title: c.title, frontier: false, dashed: false, status: c.status, freshness: c.freshness, domains: c.domains ?? [], href: `focus.html?id=${encodeURIComponent(nid)}` };
  };
  const prereqs = new Set();
  const dependents = new Set();
  for (const { from, to } of data?.edges ?? []) {
    if (to === id && from !== id) prereqs.add(from);
    if (from === id && to !== id) dependents.add(to);
  }
  const sharesDomain = (n) => n.frontier || home.size === 0 || n.domains.some((d) => home.has(d));
  const place = (ids) => {
    const nodes = [...ids].map(node).sort(byTitle);
    return { near: nodes.filter(sharesDomain), far: nodes.filter((n) => !sharesDomain(n)) };
  };
  const pre = place(prereqs);
  const dep = place(dependents);
  return {
    found: true,
    id,
    center: center ? { ...node(id), definition: center.definition, level: center.level, last_date: center.last_date } : node(id),
    below: pre.near,
    above: dep.near,
    left: pre.far,
    right: dep.far,
  };
}

const EMPTY_MESSAGE = "아직 개념이 없습니다. 학습을 마치면 이곳에 쌓입니다.";
const MISSING_MESSAGE = "map-data.json이 없습니다. <code>ltt-map rebuild</code>를 실행하세요.";

export function renderGrid(layout, { missing = false } = {}) {
  if (missing) return `<p class="map-empty">${MISSING_MESSAGE}</p>`;
  if (layout.empty) return `<p class="map-empty">${EMPTY_MESSAGE}</p>`;
  const head = `<div class="grid-head"><span></span>${layout.levels.map((l) => `<span>L${l}</span>`).join("")}</div>`;
  const rows = layout.rows
    .map(
      (row) =>
        `<div class="grid-row" data-domain="${escapeHtml(row.domain)}"><h2 class="row-label">${escapeHtml(row.domain)}</h2>` +
        row.cells
          .map(
            (cell) =>
              `<div class="cell" data-level="${cell.level}">` +
              cell.chips
                .map(
                  (c) =>
                    `<a class="${escapeHtml(c.className)}" href="${escapeHtml(c.href)}" data-id="${escapeHtml(c.id)}" data-neighbors="${escapeHtml(c.neighbors.join(" "))}">` +
                    `<span class="t">${escapeHtml(c.title)}</span><span class="fr">${escapeHtml(c.freshness)}</span></a>`,
                )
                .join("") +
              `</div>`,
          )
          .join("") +
        `</div>`,
    )
    .join("");
  return `<div class="grid">${head}${rows}</div>`;
}

function renderNode(n, side) {
  const tag = side && n.domains.length ? `<span class="dom">${escapeHtml(n.domains.join(", "))}</span>` : "";
  const cls = ["node", n.freshness ?? "frontier", n.dashed ? "dashed" : ""].filter(Boolean).join(" ");
  return `<a class="${cls}" href="${escapeHtml(n.href)}" data-id="${escapeHtml(n.id)}"><span class="t">${escapeHtml(n.title)}</span>${tag}</a>`;
}

export function renderFocus(layout, { missing = false } = {}) {
  if (missing) return `<p class="map-empty">${MISSING_MESSAGE}</p><p><a href="grid.html">격자로 돌아가기</a></p>`;
  if (!layout.found) {
    return `<p class="map-empty">개념 <code>${escapeHtml(layout.id ?? "")}</code>을(를) 찾을 수 없습니다.</p><p><a href="grid.html">격자로 돌아가기</a></p>`;
  }
  const c = layout.center;
  const col = (cls, nodes, side) => `<div class="${cls}">${nodes.map((n) => renderNode(n, side)).join("")}</div>`;
  const meta = c.frontier
    ? `<p class="meta">아직 학습하지 않은 개념입니다.</p>`
    : `<p class="def">${escapeHtml(c.definition)}</p><p class="meta">${escapeHtml(c.domains.join(", "))} · L${c.level} · ${escapeHtml(c.status)} · ${escapeHtml(c.freshness)} · ${escapeHtml(c.last_date)}</p>`;
  return (
    `<div class="focus">` +
    col("side left", layout.left, true) +
    `<div class="mid">${col("above", layout.above, false)}<div class="center ${c.freshness ?? "frontier"}"><h2>${escapeHtml(c.title)}</h2>${meta}</div>${col("below", layout.below, false)}</div>` +
    col("side right", layout.right, true) +
    `</div><p><a href="grid.html">격자로 돌아가기</a></p>`
  );
}
