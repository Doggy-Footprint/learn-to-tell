/** Region name to [lonMin, latMin, lonMax, latMax]; lonMax may exceed 180 for regions across the antimeridian. */
export const REGIONS = Object.freeze({
  world: [-180, -90, 180, 90],
  europe: [-25, 34, 45, 72],
  asia: [25, -12, 150, 60],
  "east-asia": [95, 15, 150, 55],
  "southeast-asia": [90, -12, 142, 25],
  "south-asia": [60, 5, 98, 38],
  "middle-east": [25, 10, 65, 43],
  africa: [-20, -36, 53, 38],
  "north-america": [-170, 5, -50, 75],
  "south-america": [-85, -57, -32, 14],
  oceania: [110, -50, 180, 0],
  atlantic: [-80, -60, 20, 65],
  "indian-ocean": [20, -50, 120, 28],
  pacific: [120, -50, 290, 60],
});
const MERCATOR_WORLD = [-180, -60, 180, 80];

/** @type {any} */
let d3geo = null;
/** @type {any} */
let land = null;

export async function loadGeo() {
  if (!d3geo) d3geo = await import("d3-geo");
  return d3geo;
}

export async function loadLand() {
  if (!land) {
    const [topo, tc] = await Promise.all([import("world-atlas/land-110m.json", { with: { type: "json" } }), import("topojson-client")]);
    const t = topo.default ?? topo;
    land = tc.feature(t, t.objects.land);
  }
  return land;
}

/** @param {number[]} b */
function outline([x0, y0, x1, y1]) {
  /** @type {[number, number][]} */
  const pts = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    pts.push([x, y0], [x, y1], [x0, y], [x1, y]);
  }
  return { type: "MultiPoint", coordinates: pts };
}

/**
 * Projection fitted to plot for a region; plot is the full extent box.
 * @param {"equalEarth" | "mercator"} kind @param {string} region
 * @param {{ x: number; y: number; width: number; height: number }} plot
 */
export function makeProjection(kind, region, plot) {
  if (!d3geo) throw new Error("d3-geo not loaded; call layoutFigure first");
  const bbox = /** @type {number[]} */ (/** @type {any} */ (REGIONS)[region] ?? REGIONS.world);
  const p = kind === "mercator" ? d3geo.geoMercator() : d3geo.geoEqualEarth();
  const extent = [[plot.x, plot.y], [plot.x + plot.width, plot.y + plot.height]];
  if (region === "world" || !(region in REGIONS)) {
    if (kind === "mercator") p.fitExtent(extent, outline(MERCATOR_WORLD));
    else p.fitExtent(extent, { type: "Sphere" });
  } else {
    p.rotate([-(bbox[0] + bbox[2]) / 2, 0]);
    p.fitExtent(extent, outline(bbox));
  }
  return p;
}

export const geoModule = () => d3geo;
