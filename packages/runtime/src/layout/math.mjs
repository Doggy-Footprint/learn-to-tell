/** KaTeX renders .katex at 1.21em of its container (katex.css); layout and DOM both use this scale. */
export const KATEX_SCALE = 1.21;
export const KATEX_OPTIONS = Object.freeze({ throwOnError: false, trust: false, output: "html", strict: "ignore" });

const SIZES = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.44, 1.728, 2.074, 2.488];
/** CSS widths KaTeX sets in katex.css rather than inline styles, in em. */
const CSS_WIDTH = { nulldelimiter: 0.12 };
/** .vlist-s is a 2px-wide table cell (katex.css), independent of font size. */
const VLIST_S_PX = 2;

/** @type {any} */
let katexMod = null;
export async function loadKatex() {
  if (!katexMod) katexMod = (await import("katex")).default;
  return katexMod;
}
export const katexLoaded = () => katexMod;

/** @param {string | undefined} v */
const em = (v) => {
  if (!v) return 0;
  const m = /^(-?[\d.]+)em$/.exec(String(v));
  return m ? Number(m[1]) : 0;
};

/** @param {string[]} classes */
function sizeScale(classes) {
  let reset = 0;
  let size = 0;
  for (const c of classes) {
    const r = /^reset-size(\d+)$/.exec(c);
    if (r) reset = Number(r[1]);
    const s = /^size(\d+)$/.exec(c);
    if (s) size = Number(s[1]);
  }
  return reset && size ? SIZES[size - 1] / SIZES[reset - 1] : 1;
}

/**
 * Inline width of a KaTeX HTML tree node, emulating katex.css box rules.
 * @param {any} n @param {number} fs current font size in px
 * @returns {number} px
 */
function widthOf(n, fs) {
  const classes = Array.isArray(n.classes) ? n.classes.filter(Boolean) : [];
  const style = n.style ?? {};
  const margins = (em(style.marginLeft) + em(style.marginRight)) * fs;
  if (typeof n.text === "string") {
    const w = (n.width ?? 0) + (n.italic > 0 ? n.italic : 0);
    return w * fs + margins;
  }
  if (classes.includes("pstrut") || classes.includes("strut") || classes.includes("katex-strut") || classes.includes("rlap") || classes.includes("llap") || classes.includes("clap")) return margins;
  for (const [cls, w] of Object.entries(CSS_WIDTH)) if (classes.includes(cls)) return w * fs + margins;
  const own = sizeScale(classes);
  const f = fs * own;
  if (style.width && /em$/.test(style.width)) return em(style.width) * fs + margins;
  if (style.minWidth && /em$/.test(style.minWidth)) return Math.max(em(style.minWidth) * fs, sum(n, f)) + margins;
  if (classes.includes("vlist-t")) {
    let w = 0;
    let extra = 0;
    for (const r of n.children ?? []) {
      for (const cell of r.children ?? []) {
        const cc = (cell.classes ?? []).filter(Boolean);
        if (cc.includes("vlist-s")) extra = VLIST_S_PX;
        else for (const row of cell.children ?? []) w = Math.max(w, widthOf(row, f));
      }
    }
    return w + extra + margins;
  }
  return sum(n, f) + margins;
}

/** @param {any} n @param {number} fs */
const sum = (n, fs) => (n.children ?? []).reduce((/** @type {number} */ s, /** @type {any} */ c) => s + widthOf(c, fs), 0);

/** @type {Map<string, { width: number; height: number }>} */
const cache = new Map();

/**
 * Box of rendered TeX at figure text size; requires loadKatex() first.
 * @param {string} tex @param {number} size figure text size in px
 */
export function measureMath(tex, size) {
  const key = `${size}|${tex}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (!katexMod) throw new Error("KaTeX not loaded");
  const fs = size * KATEX_SCALE;
  const tree = katexMod.__renderToHTMLTree(String(tex), KATEX_OPTIONS);
  const width = widthOf(tree, fs);
  const height = Math.max(tree.height + tree.depth, 1) * fs;
  const out = { width: Math.ceil(width * 100) / 100, height: Math.ceil(height * 100) / 100 };
  cache.set(key, out);
  return out;
}

/** HTML for the browser; same options as measurement. @param {string} tex */
export function renderMath(tex) {
  if (!katexMod) throw new Error("KaTeX not loaded");
  return katexMod.renderToString(String(tex), KATEX_OPTIONS);
}
