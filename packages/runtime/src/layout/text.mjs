import WIDTHS from "./widths.json" with { type: "json" };
import { LINE_HEIGHT } from "./constants.mjs";

/** @type {Map<string, Map<number, number>>} */
const caches = new Map();

/** @type {Record<string, { upm: number; runs: number[][] }>} */
const TABLES = {};
for (const [face, t] of Object.entries(/** @type {Record<string, { upm: number; runs: string }>} */ (WIDTHS))) {
  let at = 0;
  const runs = t.runs.split(";").map((r) => {
    const [d, a, c] = r.split(",");
    const start = at + parseInt(d, 36);
    const count = c === undefined ? 1 : parseInt(c, 36);
    at = start + count;
    return [start, count, parseInt(a, 36)];
  });
  TABLES[face] = { upm: t.upm, runs };
}

/**
 * Advance of one code point in em. Code points missing from the font fall back to the browser's
 * fallback font, which Node cannot know; 1 em for wide scripts and 0.6 em otherwise approximates it.
 * @param {"400" | "600" | "mono"} face @param {number} cp
 */
function advance(face, cp) {
  let cache = caches.get(face);
  if (!cache) caches.set(face, (cache = new Map()));
  const hit = cache.get(cp);
  if (hit !== undefined) return hit;
  const t = TABLES[face];
  const runs = t.runs;
  let lo = 0;
  let hi = runs.length - 1;
  let em = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, count, adv] = runs[mid];
    if (cp < start) hi = mid - 1;
    else if (cp >= start + count) lo = mid + 1;
    else {
      em = adv / t.upm;
      break;
    }
  }
  if (em < 0) {
    if (face === "mono") em = advance("400", cp);
    else em = isWide(cp) ? 1 : 0.6;
  }
  cache.set(cp, em);
  return em;
}

/** @param {number} cp */
const isWide = (cp) => (cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xff00 && cp <= 0xff60);

/** @param {string} line @param {number} size @param {"400" | "600" | "mono"} face */
export function lineWidth(line, size, face = "400") {
  let em = 0;
  for (const ch of line) em += advance(face, /** @type {number} */ (ch.codePointAt(0)));
  return em * size;
}

/** @param {{ weight?: 400 | 600; mono?: boolean }} o */
const faceOf = (o) => (o.mono ? "mono" : o.weight === 600 ? "600" : "400");

/**
 * @param {string} text
 * @param {{ size: number; weight?: 400 | 600; mono?: boolean }} o
 * @returns {{ width: number; height: number }}
 */
export function measureText(text, o) {
  if (String(text) === "") return { width: 0, height: 0 };
  const lines = String(text).split("\n");
  const face = faceOf(o);
  let width = 0;
  for (const l of lines) width = Math.max(width, lineWidth(l, o.size, face));
  return { width, height: lines.length * o.size * LINE_HEIGHT };
}

/** @param {string[]} lines @param {number} size @param {"400" | "600" | "mono"} [face] */
export const linesBox = (lines, size, face = "400") => ({
  width: Math.max(0, ...lines.map((l) => lineWidth(l, size, face))),
  height: lines.length * size * LINE_HEIGHT,
});

/**
 * Breaks at spaces; a token wider than maxWidth is split between characters.
 * @param {string} text
 * @param {{ size: number; weight?: 400 | 600; mono?: boolean; maxWidth: number }} o
 * @returns {string[]}
 */
export function wrapText(text, o) {
  const face = faceOf(o);
  const max = o.maxWidth + 1e-9;
  /** @param {string} s */
  const w = (s) => lineWidth(s, o.size, face);
  /** @type {string[]} */
  const out = [];
  for (const para of String(text).split("\n")) {
    const tokens = para.split(/ +/).filter((t, i, a) => t !== "" || a.length === 1);
    let line = "";
    for (const tok of tokens) {
      const candidate = line === "" ? tok : `${line} ${tok}`;
      if (w(candidate) <= max) {
        line = candidate;
        continue;
      }
      if (line !== "") out.push(line);
      line = "";
      if (w(tok) <= max) {
        line = tok;
        continue;
      }
      let piece = "";
      for (const ch of tok) {
        if (piece !== "" && w(piece + ch) > max) {
          out.push(piece);
          piece = "";
        }
        piece += ch;
      }
      line = piece;
    }
    out.push(line);
  }
  return out;
}
