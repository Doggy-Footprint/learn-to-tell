export type GeoOpts = {
  projection: "equalEarth" | "mercator" | "orthographic";
  /** Fitted view: world (default), europe, asia, east-asia, southeast-asia, south-asia, middle-east, africa, north-america, south-america, oceania, atlantic, indian-ocean, pacific. */
  region?: string;
};
