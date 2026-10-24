/** @type {any} */
let elk = null;

async function getElk() {
  if (!elk) {
    const mod = await import("elkjs/lib/elk.bundled.js");
    const ELK = mod.default ?? mod;
    elk = new ELK();
  }
  return elk;
}

/**
 * Lays out nodes and edges with ELK. Positions are relative to the graph origin.
 * @param {{ algorithm: "layered" | "mrtree"; direction: "DOWN" | "RIGHT"; spacing: number;
 *   nodes: { id: string; width: number; height: number }[];
 *   edges: { id: string; from: string; to: string; label?: { width: number; height: number } }[] }} g
 */
export async function elkLayout(g) {
  const e = await getElk();
  const s = g.spacing;
  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": g.algorithm,
      "elk.direction": g.direction,
      "elk.spacing.nodeNode": String(28 * s),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(44 * s),
      "elk.spacing.edgeLabel": "4",
      "elk.spacing.edgeNode": String(14 * s),
      "elk.edgeLabels.placement": "CENTER",
      "elk.layered.edgeLabels.centerLabelPlacementStrategy": "TAIL_LAYER",
      "elk.mrtree.weighting": "CONSTRAINT",
      "elk.padding": "[top=0,left=0,bottom=0,right=0]",
      "elk.randomSeed": "1",
    },
    children: g.nodes.map((n) => ({ id: n.id, width: n.width, height: n.height })),
    edges: g.edges.map((x) => ({
      id: x.id,
      sources: [x.from],
      targets: [x.to],
      labels: x.label ? [{ id: `${x.id}#label`, text: " ", width: x.label.width, height: x.label.height }] : [],
    })),
  };
  const out = await e.layout(graph);
  /** @type {Map<string, { x: number; y: number; width: number; height: number }>} */
  const nodes = new Map();
  for (const c of out.children ?? []) nodes.set(c.id, { x: c.x, y: c.y, width: c.width, height: c.height });
  /** @type {Map<string, { points: [number, number][]; label?: [number, number] }>} */
  const edges = new Map();
  for (const ed of out.edges ?? []) {
    /** @type {[number, number][]} */
    const pts = [];
    for (const sec of ed.sections ?? []) {
      pts.push([sec.startPoint.x, sec.startPoint.y]);
      for (const b of sec.bendPoints ?? []) pts.push([b.x, b.y]);
      pts.push([sec.endPoint.x, sec.endPoint.y]);
    }
    const lab = ed.labels?.[0];
    edges.set(ed.id, { points: pts, label: lab && Number.isFinite(lab.x) ? [lab.x + lab.width / 2, lab.y + lab.height / 2] : undefined });
  }
  return { nodes, edges };
}
