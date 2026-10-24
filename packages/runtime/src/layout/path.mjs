/** @typedef {[number, number]} Pt */
/** @typedef {{ c: "M" | "L" | "C" | "Z"; p: number[] }} Cmd */

const r2 = (/** @type {number} */ v) => Math.round(v * 100) / 100;
export const fmt = (/** @type {number} */ v) => {
  const x = r2(v);
  return Object.is(x, -0) ? "0" : String(x);
};

/** @param {Pt[]} pts */
export const polyD = (pts, close = false) => (pts.length ? `M${pts.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join("L")}${close ? "Z" : ""}` : "");

/** @param {Cmd[]} cmds */
export function serialize(cmds) {
  return cmds
    .map((k) => {
      if (k.c === "Z") return "Z";
      const pairs = [];
      for (let i = 0; i < k.p.length; i += 2) pairs.push(`${fmt(k.p[i])},${fmt(k.p[i + 1])}`);
      return k.c + pairs.join(" ");
    })
    .join("");
}

/**
 * Arc endpoint parameterization to cubic segments (SVG implementation notes F.6).
 * @returns {number[][]} each [c1x, c1y, c2x, c2y, x, y]
 */
export function arcToCubics(x1, y1, rx, ry, phiDeg, large, sweep, x2, y2) {
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return [[x1, y1, x2, y2, x2, y2]];
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const xp = cos * dx + sin * dy;
  const yp = -sin * dx + cos * dy;
  const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lam > 1) {
    rx *= Math.sqrt(lam);
    ry *= Math.sqrt(lam);
  }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  const den = rx * rx * yp * yp + ry * ry * xp * xp;
  let co = Math.sqrt(Math.max(0, num / den));
  if (large === sweep) co = -co;
  const cxp = (co * rx * yp) / ry;
  const cyp = (-co * ry * xp) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (/** @type {number} */ ux, /** @type {number} */ uy, /** @type {number} */ vx, /** @type {number} */ vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  else if (sweep && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const step = dt / n;
  const k = (4 / 3) * Math.tan(step / 4);
  const out = [];
  let a = t1;
  const pt = (/** @type {number} */ t) => [cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos];
  const dpt = (/** @type {number} */ t) => [-rx * Math.sin(t) * cos - ry * Math.cos(t) * sin, -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos];
  for (let i = 0; i < n; i++) {
    const b = a + step;
    const [ax, ay] = pt(a);
    const [bx, by] = pt(b);
    const [dax, day] = dpt(a);
    const [dbx, dby] = dpt(b);
    out.push([ax + k * dax, ay + k * day, bx - k * dbx, by - k * dby, bx, by]);
    a = b;
  }
  out[out.length - 1][4] = x2;
  out[out.length - 1][5] = y2;
  return out;
}

/**
 * Parses SVG path data into absolute M/L/C/Z commands.
 * @param {string} d @returns {Cmd[]}
 */
export function parseD(d) {
  const toks = String(d).match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  /** @type {Cmd[]} */
  const out = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  /** @type {number[] | null} */
  let lastC = null;
  /** @type {number[] | null} */
  let lastQ = null;
  const num = () => {
    const v = Number(toks[i++]);
    if (!Number.isFinite(v)) throw new Error("bad path data");
    return v;
  };
  const isNum = () => i < toks.length && !/^[a-zA-Z]$/.test(toks[i]);
  while (i < toks.length) {
    if (/^[a-zA-Z]$/.test(toks[i])) cmd = toks[i++];
    else if (!cmd) throw new Error("bad path data");
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    if (C === "Z") {
      out.push({ c: "Z", p: [] });
      x = sx;
      y = sy;
      lastC = lastQ = null;
      continue;
    }
    if (!isNum()) break;
    if (C === "M") {
      x = ox + num();
      y = oy + num();
      sx = x;
      sy = y;
      out.push({ c: "M", p: [x, y] });
      cmd = rel ? "l" : "L";
      lastC = lastQ = null;
    } else if (C === "L" || C === "H" || C === "V") {
      if (C === "L") {
        x = ox + num();
        y = oy + num();
      } else if (C === "H") x = (rel ? x : 0) + num();
      else y = (rel ? y : 0) + num();
      out.push({ c: "L", p: [x, y] });
      lastC = lastQ = null;
    } else if (C === "C" || C === "S") {
      let c1x;
      let c1y;
      if (C === "C") {
        c1x = ox + num();
        c1y = oy + num();
      } else {
        c1x = lastC ? 2 * x - lastC[0] : x;
        c1y = lastC ? 2 * y - lastC[1] : y;
      }
      const c2x = ox + num();
      const c2y = oy + num();
      x = ox + num();
      y = oy + num();
      out.push({ c: "C", p: [c1x, c1y, c2x, c2y, x, y] });
      lastC = [c2x, c2y];
      lastQ = null;
    } else if (C === "Q" || C === "T") {
      let qx;
      let qy;
      if (C === "Q") {
        qx = ox + num();
        qy = oy + num();
      } else {
        qx = lastQ ? 2 * x - lastQ[0] : x;
        qy = lastQ ? 2 * y - lastQ[1] : y;
      }
      const nx = ox + num();
      const ny = oy + num();
      out.push({ c: "C", p: [x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), nx + (2 / 3) * (qx - nx), ny + (2 / 3) * (qy - ny), nx, ny] });
      x = nx;
      y = ny;
      lastQ = [qx, qy];
      lastC = null;
    } else if (C === "A") {
      const rx = num();
      const ry = num();
      const rot = num();
      const la = num();
      const sw = num();
      const nx = ox + num();
      const ny = oy + num();
      for (const c of arcToCubics(x, y, rx, ry, rot, la ? 1 : 0, sw ? 1 : 0, nx, ny)) out.push({ c: "C", p: c });
      x = nx;
      y = ny;
      lastC = lastQ = null;
    } else throw new Error(`bad path command ${cmd}`);
  }
  return out;
}

/** @param {Cmd[]} cmds @param {(p: Pt) => Pt} f @returns {Cmd[]} */
export function mapCmds(cmds, f) {
  return cmds.map((k) => {
    const p = [];
    for (let i = 0; i < k.p.length; i += 2) p.push(...f([k.p[i], k.p[i + 1]]));
    return { c: k.c, p };
  });
}

/**
 * Subpaths as polylines; cubic segments sampled at n points.
 * @param {Cmd[]} cmds @returns {{ pts: Pt[]; closed: boolean }[]}
 */
export function flatten(cmds, n = 16) {
  /** @type {{ pts: Pt[]; closed: boolean }[]} */
  const subs = [];
  /** @type {{ pts: Pt[]; closed: boolean } | null} */
  let cur = null;
  /** @type {Pt} */
  let at = [0, 0];
  for (const k of cmds) {
    if (k.c === "M") {
      cur = { pts: [[k.p[0], k.p[1]]], closed: false };
      subs.push(cur);
      at = [k.p[0], k.p[1]];
      continue;
    }
    if (!cur) {
      cur = { pts: [at], closed: false };
      subs.push(cur);
    }
    if (k.c === "L") {
      at = [k.p[0], k.p[1]];
      cur.pts.push(at);
    } else if (k.c === "C") {
      const [x0, y0] = at;
      const [a, b, c, d, e, f] = k.p;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const u = 1 - t;
        cur.pts.push([u * u * u * x0 + 3 * u * u * t * a + 3 * u * t * t * c + t * t * t * e, u * u * u * y0 + 3 * u * u * t * b + 3 * u * t * t * d + t * t * t * f]);
      }
      at = [e, f];
    } else if (k.c === "Z") {
      cur.closed = true;
      cur.pts.push(cur.pts[0]);
      at = cur.pts[0];
      cur = null;
    }
  }
  return subs;
}

/** @param {Pt[]} pts */
export const polyLength = (pts) => {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
};

/**
 * First fraction f of the total arc length of the subpaths.
 * @param {{ pts: Pt[] }[]} subs @param {number} f @returns {Pt[][]}
 */
export function cutFraction(subs, f) {
  const total = subs.reduce((s, x) => s + polyLength(x.pts), 0);
  let left = Math.max(0, Math.min(1, f)) * total;
  /** @type {Pt[][]} */
  const out = [];
  for (const { pts } of subs) {
    if (left <= 0) break;
    /** @type {Pt[]} */
    const keep = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (seg <= left) {
        keep.push(pts[i]);
        left -= seg;
      } else {
        const g = seg === 0 ? 0 : left / seg;
        keep.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * g, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * g]);
        left = 0;
        break;
      }
    }
    out.push(keep);
  }
  return out;
}

/** @param {Pt[]} pts @returns {{ x: number; y: number; width: number; height: number }} */
export function bboxOf(pts) {
  if (!pts.length) return { x: 0, y: 0, width: 0, height: 0 };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** @param {Cmd[]} cmds */
export const cmdsBBox = (cmds) => bboxOf(flatten(cmds, 8).flatMap((s) => s.pts));

/** 2D affine [a, b, c, d, e, f] as in SVG matrix(). */
export const IDENTITY = [1, 0, 0, 1, 0, 0];
/** @param {number[]} m @param {number[]} n */
export const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
/** @param {number[]} m @param {Pt} p @returns {Pt} */
export const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/** Parses an SVG transform attribute; unknown parts are ignored. @param {string} s */
export function parseTransform(s) {
  let m = IDENTITY;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let g;
  while ((g = re.exec(String(s)))) {
    const a = (g[2].match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
    if (a.some((v) => !Number.isFinite(v))) continue;
    let n = IDENTITY;
    if (g[1] === "matrix" && a.length === 6) n = a;
    else if (g[1] === "translate") n = [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0];
    else if (g[1] === "scale") n = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0];
    else if (g[1] === "rotate") {
      const r = ((a[0] ?? 0) * Math.PI) / 180;
      const [cx, cy] = [a[1] ?? 0, a[2] ?? 0];
      n = mul(mul([1, 0, 0, 1, cx, cy], [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    } else if (g[1] === "skewX") n = [1, 0, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 1, 0, 0];
    else if (g[1] === "skewY") n = [1, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0];
    m = mul(m, n);
  }
  return m;
}
