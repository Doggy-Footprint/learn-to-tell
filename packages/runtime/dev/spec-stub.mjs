// @ts-check
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { evaluate } from "../src/core/index.mjs";

export { createApi, load, evaluate, bindingErrors, ode, rng, argmax, root, sample, histogram, interpolate } from "../src/core/index.mjs";

async function main() {
  const file = process.argv[2];
  if (!file || !existsSync(file)) {
    process.stderr.write(`spec-stub: file not found: ${file ?? "(none)"}\n`);
    return 2;
  }
  let report;
  try {
    const mod = await import(pathToFileURL(resolve(file)).href);
    if (typeof mod.default !== "function") {
      process.stderr.write(`spec-stub: default export of ${file} is not a function\n`);
      return 2;
    }
    report = evaluate(mod.default);
  } catch (err) {
    process.stderr.write(`spec-stub: cannot load ${file}: ${err instanceof Error ? err.message : String(err)}\n`);
    return 2;
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
