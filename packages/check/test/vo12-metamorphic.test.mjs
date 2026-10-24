// VO-12 (FR-8 fresh View, FR-1 ordering, C-54), metamorphic relations MR1, MR2; also feeds VO-6.
// Oracle: relation between source and follow-up reports; C-1 expected result (no issues) from y = k*x.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LINE, pt, chart, page, C1_POINTS, C1_QUIZZES } from "./fixtures/html.mjs";
import { check } from "./fixtures/report.mjs";

const multiset = (r) => r.errors.map((e) => JSON.stringify(e, Object.keys(e).sort())).sort();
const OTHER = () => chart("other", LINE(3, [pt("o1", { x: 2 }, 6), pt("o2", { x: 2 }, 7)]));

test("MR1 reversed point order: same issue multiset, C-1 points still pass", async () => {
  const fwd = await check(page({ charts: [chart("traj", LINE(2, C1_POINTS())), OTHER()], quizzes: C1_QUIZZES() }));
  const rev = await check(page({ charts: [chart("traj", LINE(2, C1_POINTS().reverse())), OTHER()], quizzes: C1_QUIZZES() }));
  assert.deepEqual(multiset(rev), multiset(fwd));
  assert.deepEqual(rev.errors.filter((e) => e.chart === "traj"), []);
  assert.equal(fwd.errors.length, 1);
});

test("MR2 swapped chart order: same issue multiset", async () => {
  const a = await check(page({ charts: [chart("traj", LINE(2, C1_POINTS())), OTHER()], quizzes: C1_QUIZZES() }));
  const b = await check(page({ charts: [OTHER(), chart("traj", LINE(2, C1_POINTS()))], quizzes: C1_QUIZZES() }));
  assert.deepEqual(multiset(b), multiset(a));
  assert.equal(a.errors.length, 1);
});
