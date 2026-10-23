import type { Axis } from "../lesson.js";

export type Space3dOpts = {
  x: Axis;
  y: Axis;
  z: Axis;
  /** Degrees. */
  view?: { yaw: number; pitch: number };
  projection?: "ortho" | "perspective";
};
