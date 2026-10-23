import type { Api, Figure, Model, Scene } from "ltt";

/** Audit fragment default export; figures are drawn once to count vocabulary usage. */
export type Fragment = (api: Api) => { models?: Record<string, Model<any, any>>; figures: Record<string, Figure>; scenes?: Scene[] };

/** by: what keeps a kept prop; diff: what an approx prop loses. Categories are defined in protocol.md. */
export type Prop = {
  id: string;
  cat: "Q" | "G" | "T" | "I" | "E" | "S" | "X";
  text: string;
  essential: boolean;
  why: string;
  status: "kept" | "approx" | "lost" | "custom" | "ambiguous";
  by?: string;
  diff?: string;
};

/** Verdict rules are validated by count.mjs; candidates are proposed vocabulary names. */
export type AuditRow = {
  fig: string;
  src: string;
  corpus: "shot" | "shot-extra" | "lesson" | "new-b1" | "new-b2";
  domain: string;
  props: Prop[];
  verdict: "V" | "C" | "G" | "X" | "N";
  custom: string[];
  candidates: string[];
  reason?: string;
};
