export type GeoOpts = {
  projection: "equalEarth" | "mercator" | "orthographic";
  /** Region name the runtime fits the view to; omitted means whole world. */
  region?: string;
};
