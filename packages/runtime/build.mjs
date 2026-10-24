// Builds the browser bundle into dist/. `--widths` regenerates src/layout/widths.json from the bundled fonts.
import { build } from "esbuild";
import { mkdir, rm, cp, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`));
const dist = join(here, "dist");

const PRETENDARD = { 400: "Pretendard-Regular.woff2", 600: "Pretendard-SemiBold.woff2" };

async function widths() {
  const fontkit = await import("fontkit");
  const open = (file) => (fontkit.default ?? fontkit).openSync(file);
  /** Run-length table "gap,advance[,count];..." in base 36; gap is from the previous run end. */
  const table = (font) => {
    const cps = [...font.characterSet].sort((a, b) => a - b);
    const runs = [];
    for (const cp of cps) {
      const adv = font.glyphForCodePoint(cp).advanceWidth;
      const last = runs[runs.length - 1];
      if (last && last[0] + last[1] === cp && last[2] === adv) last[1]++;
      else runs.push([cp, 1, adv]);
    }
    let prev = 0;
    const enc = runs.map(([cp, count, adv]) => {
      const d = (cp - prev).toString(36);
      prev = cp + count;
      return count === 1 ? `${d},${adv.toString(36)}` : `${d},${adv.toString(36)},${count.toString(36)}`;
    });
    return { upm: font.unitsPerEm, runs: enc.join(";") };
  };
  const pd = join(pkgDir("pretendard"), "dist/web/static/woff2");
  const kd = join(pkgDir("katex"), "dist/fonts");
  const out = {
    400: table(open(join(pd, PRETENDARD[400]))),
    600: table(open(join(pd, PRETENDARD[600]))),
    mono: table(open(join(kd, "KaTeX_Typewriter-Regular.ttf"))),
  };
  await writeFile(join(here, "src/layout/widths.json"), JSON.stringify(out));
}

async function bundle() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(join(dist, "fonts"), { recursive: true });
  const result = await build({
    entryPoints: { "ltt-runtime": join(here, "src/ui/index.jsx") },
    outdir: dist,
    bundle: true,
    splitting: true,
    format: "esm",
    minify: true,
    target: "es2022",
    jsx: "automatic",
    chunkNames: "chunks/[name]-[hash]",
    loader: { ".json": "json" },
    define: { "process.env.NODE_ENV": '"production"' },
    legalComments: "none",
    metafile: true,
    logLevel: "warning",
  });
  const pd = join(pkgDir("pretendard"), "dist/web/static/woff2");
  for (const f of Object.values(PRETENDARD)) await cp(join(pd, f), join(dist, "fonts", f));
  const kd = join(pkgDir("katex"), "dist");
  await mkdir(join(dist, "katex/fonts"), { recursive: true });
  await cp(join(kd, "katex.min.css"), join(dist, "katex/katex.min.css"));
  for (const f of await readdir(join(kd, "fonts"))) if (f.endsWith(".woff2")) await cp(join(kd, "fonts", f), join(dist, "katex/fonts", f));
  await cp(join(here, "src/ui/ltt.css"), join(dist, "ltt.css"));
  const main = (await stat(join(dist, "ltt-runtime.js"))).size;
  let firstLoad = main;
  const meta = result.metafile.outputs;
  const entry = Object.entries(meta).find(([k]) => k.endsWith("ltt-runtime.js"));
  for (const imp of entry?.[1].imports ?? []) if (imp.kind === "import-statement" && existsSync(resolve(imp.path))) firstLoad += (await stat(resolve(imp.path))).size;
  process.stdout.write(`dist/ltt-runtime.js ${main} B, first load ${firstLoad} B\n`);
}

if (process.argv.includes("--widths")) await widths();
await bundle();
