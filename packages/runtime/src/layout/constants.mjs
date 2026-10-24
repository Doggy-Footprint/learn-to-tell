export const VIEWPORTS = Object.freeze({ desktop: Object.freeze({ width: 1280, height: 800 }), mobile: Object.freeze({ width: 390, height: 844 }) });

/** Shell geometry shared with src/ui so the stage element is exactly the stageBox. */
export const SHELL = Object.freeze({
  desktop: { bar: 56, card: 420, pad: 24 },
  mobile: { bar: 48, pad: 16, stage: 340 },
});

/** @param {"desktop" | "mobile"} viewport */
export function stageBox(viewport) {
  if (viewport === "mobile") return { width: VIEWPORTS.mobile.width - 2 * SHELL.mobile.pad, height: SHELL.mobile.stage };
  if (viewport !== "desktop") throw new RangeError(`unknown viewport: ${viewport}`);
  const s = SHELL.desktop;
  return { width: VIEWPORTS.desktop.width - s.card - 2 * s.pad, height: VIEWPORTS.desktop.height - s.bar - 2 * s.pad };
}

export const TEXT = Object.freeze({ figure: Object.freeze({ m: 14, s: 12, l: 17 }), card: 16, min: 12 });
export const LEADER_PX = 20;
export const LINE_HEIGHT = 1.3;

export const BACKGROUND = "#ffffff";
export const INK = "#1d2127";
export const INK_DIM = "#5b616b";

/** Every non-muted tone has contrast >= 3 against BACKGROUND (strokes), checked by contrast(). */
export const TONES = Object.freeze({
  focus: "#d9480f",
  ref: "#6b7280",
  muted: "#a3aab5",
  good: "#2b8a3e",
  warn: "#b35900",
  bad: "#c92a2a",
  series1: "#1c6dd0",
  series2: "#0b7a75",
  series3: "#8a3ffc",
  series4: "#a2470e",
  series5: "#c0287f",
  series6: "#4d5a1e",
});

/** @param {string} hex */
function rgb(hex) {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new RangeError(`not a #rrggbb color: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

/** @param {string} hex */
export function luminance(hex) {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** @param {string} fg @param {string} bg */
export function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** @param {string} a @param {string} b @param {number} f */
export function mix(a, b, f) {
  const x = rgb(a);
  const y = rgb(b);
  return `#${x.map((v, i) => Math.round((v + (y[i] - v) * f) * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** Text color for a tone: the tone itself when it reaches 4.5:1, otherwise ink. */
export function textColor(tone, dim) {
  if (dim) return INK_DIM;
  const c = tone && TONES[tone];
  return c && contrast(c, BACKGROUND) >= 4.5 ? c : INK;
}

const SEQ = ["#eef4fb", "#c6dbef", "#9ecae1", "#6baed6", "#3d8dc4", "#1f6aa8", "#0d4a85", "#08306b"];

/** Sequential cell color for f in [0, 1]. */
export function sequential(f) {
  const x = Math.min(1, Math.max(0, Number.isFinite(f) ? f : 0)) * (SEQ.length - 1);
  const i = Math.min(SEQ.length - 2, Math.floor(x));
  return mix(SEQ[i], SEQ[i + 1], x - i);
}

/** Black or white, whichever contrasts more; max contrast is always >= 4.58. */
export function onColor(bg) {
  return contrast("#000000", bg) >= contrast("#ffffff", bg) ? "#000000" : "#ffffff";
}

/** Boxes for n figures sharing the stage (summary grid, predict reveal beside the scene figure). @param {"desktop" | "mobile"} viewport @param {number} n */
export function stageBoxes(viewport, n, gap = 16) {
  const b = stageBox(viewport);
  let cols = 1;
  let score = -1;
  for (let c = 1; c <= Math.max(1, n); c++) {
    const r = Math.ceil(n / c);
    const s = Math.min((b.width - gap * (c - 1)) / c, (b.height - gap * (r - 1)) / r);
    if (s > score + 1e-9) {
      score = s;
      cols = c;
    }
  }
  const rows = Math.ceil(Math.max(1, n) / cols);
  const width = (b.width - gap * (cols - 1)) / cols;
  const height = (b.height - gap * (rows - 1)) / rows;
  return Array.from({ length: Math.max(1, n) }, (_, i) => ({ x: (i % cols) * (width + gap), y: Math.floor(i / cols) * (height + gap), width, height }));
}

/** Summary figures: a grid on desktop; on mobile one figure at a time at the full stage box (a 3-figure grid leaves ~170x160 px cells, too small for 12 px text). @param {"desktop" | "mobile"} viewport @param {number} n */
export function summaryBoxes(viewport, n, gap = 16) {
  if (viewport === "desktop") return stageBoxes(viewport, n, gap);
  const b = stageBox(viewport);
  return Array.from({ length: Math.max(1, n) }, () => ({ x: 0, y: 0, width: b.width, height: b.height }));
}
