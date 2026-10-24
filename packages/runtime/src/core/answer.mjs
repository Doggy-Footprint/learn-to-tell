import { evaluateChecks, isPlainObject, rng } from "./model.mjs";

/**
 * Numeric quiz answer; a { check } answer resolves to that check's computed value.
 * @param {any} input @param {number | { check: string }} answer @returns {number}
 */
export function numericAnswer(input, answer) {
  if (typeof answer === "number") return answer;
  const id = answer?.check;
  const idx = (input.checks ?? []).findIndex((/** @type {any} */ c) => c.id === id);
  if (idx < 0) throw new Error(`numeric answer names unknown check "${id}"`);
  const r = evaluateChecks({ ...input, checks: [input.checks[idx]] })[0];
  if (r.error) throw new Error(`check "${id}" threw: ${r.error}`);
  const a = r.actual;
  if (typeof a === "number") return a;
  if (isPlainObject(a)) {
    const nums = Object.values(a).filter((v) => typeof v === "number");
    if (nums.length === 1) return /** @type {number} */ (nums[0]);
  }
  throw new Error(`check "${id}" does not yield a single number`);
}

/** Initial order-item order: mulberry32(1) Fisher-Yates, rotated by one when it equals the answer (n >= 2). @param {number} n */
export function orderShuffle(n) {
  const idx = Array.from({ length: n }, (_, i) => i);
  const r = rng(1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  if (n >= 2 && idx.every((v, i) => v === i)) idx.push(/** @type {number} */ (idx.shift()));
  return idx;
}
