// Fixture builders from spec fd0231d3293c45b1 v1 "Fixture conventions" (GROUPS, HDATA, HGDATA, C-62..C-65).
// Expected values are the spec arithmetic: GROUPS y=(g=a?1:2)*k*x; HDATA y=(h=p?10:20)+x; HGDATA y=(h=p?10:20)+(g=a?1:2)*x.
export const Q = (f) => ({ field: f, type: "quantitative" });
export const XY = () => ({ x: Q("x"), y: Q("y") });

export const gpt = (id, mark, where, value, more = {}) => ({ id, mark, where, field: "y", value, tol: 0, ...more });

export function GROUPS(k, ch, points, extra = {}) {
  return {
    name: "curves",
    params: [{ name: "k", value: k, bind: { input: "range", min: 1, max: 5 } }],
    data: { values: ["a", "b"].flatMap((g) => [0, 1, 2].map((x) => ({ x, g }))) },
    transform: [{ calculate: "(datum.g==='a'?1:2)*k*datum.x", as: "y" }],
    mark: "line",
    encoding: { ...XY(), [ch]: { field: "g", type: "nominal" } },
    usermeta: { ltt: { points } },
    ...extra,
  };
}

export const HDATA_VALUES = () => [{ x: 0, h: "p" }, { x: 1, h: "p" }, { x: 0, h: "q" }, { x: 1, h: "q" }];
export const HDATA_CALC = { calculate: "(datum.h==='p'?10:20)+datum.x", as: "y" };

export const HGDATA_VALUES = () =>
  ["p", "q"].flatMap((h) => ["a", "b"].flatMap((g) => [0, 1].map((x) => ({ h, g, x }))));
export const HGDATA_CALC = { calculate: "(datum.h==='p'?10:20)+(datum.g==='a'?1:2)*datum.x", as: "y" };

export const hFacet = (inner, points, extra = {}, values = HDATA_VALUES()) => ({
  data: { values },
  transform: [HDATA_CALC],
  facet: { column: { field: "h", type: "nominal" } },
  spec: inner,
  usermeta: { ltt: { points } },
  ...extra,
});

// C-64 shape
export const hgFacet = (points, values = HGDATA_VALUES()) => ({
  data: { values },
  transform: [HGDATA_CALC],
  facet: { column: { field: "h", type: "nominal" } },
  spec: { name: "c", mark: "line", encoding: { ...XY(), color: { field: "g", type: "nominal" } } },
  usermeta: { ltt: { points } },
});

// C-65 shape: 2-D facet over a layer of line A and filtered point B
export const layerFacet = (points, values = HDATA_VALUES()) => ({
  data: { values },
  transform: [HDATA_CALC],
  facet: { row: { field: "h", type: "nominal" }, column: { field: "x", type: "ordinal" } },
  spec: {
    layer: [
      { name: "A", mark: "line", encoding: XY() },
      { name: "B", mark: "point", transform: [{ filter: "datum.y>10" }], encoding: XY() },
    ],
  },
  usermeta: { ltt: { points } },
});
