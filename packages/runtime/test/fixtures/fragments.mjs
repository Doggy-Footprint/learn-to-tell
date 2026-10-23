import fs from "node:fs";
import path from "node:path";

export const prop = (over = {}) => ({ id: "p1", cat: "Q", text: "shape", essential: true, why: "core", status: "kept", by: "line", ...over });
export const row = (verdict, over = {}) => ({
  fig: "f", src: "s01", corpus: "shot", domain: "physics", props: [prop()], verdict, custom: [], candidates: [], ...over,
});
/** Valid canonical rows per verdict. */
export const valid = {
  V: (o) => row("V", o),
  C: (o) => row("C", { custom: ["swirl"], ...o }),
  G: (o) => row("G", { props: [prop({ status: "lost", by: undefined })], ...o }),
  X: (o) => row("X", { reason: "out of scope", props: [], ...o }),
  N: (o) => row("N", { reason: "not a figure", props: [], ...o }),
};

export function fragmentSource(rows, { body, extra = "" } = {}) {
  const def = body ?? `(api) => {
  const d = api.dot([0, 0]);
  return { figures: { f: api.figure(api.cartesian({ x: [0, 1, "m"], y: [0, 1, "m"], static: "s" }), () => [d]) } };
}`;
  return `${extra}\nexport default ${def};\nexport const audit = ${JSON.stringify(rows, null, 1)};\n`;
}

export function writeFragment(dir, rel, rows, opts) {
  const f = path.join(dir, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, typeof rows === "string" ? rows : fragmentSource(rows, opts));
  return f;
}
