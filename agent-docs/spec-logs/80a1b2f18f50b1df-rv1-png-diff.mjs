// RV-1: fraction of differing pixels between same-named PNGs in two dirs (8-bit RGB/RGBA, non-interlaced).
import { readFileSync, readdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { join } from "node:path";

function decode(buf) {
  let p = 8, w, h, ct, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12]) throw new Error("unsupported"); }
    else if (type === "IDAT") idat.push(data);
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : (() => { throw new Error("color type " + ct); })();
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[row + x - bpp] : 0, b = y ? px[row - stride + x] : 0, c = x >= bpp && y ? px[row - stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[row + x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}

const [a, b] = process.argv.slice(2);
let worst = 0;
for (const f of readdirSync(a).filter((f) => f.endsWith(".png")).sort()) {
  let A, B;
  try { A = decode(readFileSync(join(a, f))); B = decode(readFileSync(join(b, f))); } catch (e) { console.log(`${f}: ${e.message}`); continue; }
  if (A.w !== B.w || A.h !== B.h) { console.log(`${f}: size ${A.w}x${A.h} vs ${B.w}x${B.h}`); worst = 1; continue; }
  let diff = 0;
  for (let i = 0; i < A.w * A.h; i++) {
    for (let k = 0; k < 3; k++) if (A.px[i * A.bpp + k] !== B.px[i * B.bpp + k]) { diff++; break; }
  }
  const r = diff / (A.w * A.h); worst = Math.max(worst, r);
  console.log(`${f}: ${(r * 100).toFixed(4)}%`);
}
console.log(`worst ${(worst * 100).toFixed(4)}%`);
