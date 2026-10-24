// VO-2 (FR-8, FR-10, FR-11, C-10..C-15), 2-value boundary analysis B1..B6; also feeds VO-6.
// Oracle: spec 6ed8f04e251d4b22 v1 Cases C-10..C-15, y = k*x and y = 10*x arithmetic.
import { test } from "node:test";
import { LINE, pt, chart, choice, number, C1 } from "./fixtures/html.mjs";
import { check, assertIssues } from "./fixtures/report.mjs";

const one = (spec) => check(C1({ charts: [chart("b", spec)] }));

test("B1 point tol: 6.5 tol 0.5 pass, tol 0.49 mismatch (C-10)", async () => {
  assertIssues(await one(LINE(2, [pt("a", { x: 3 }, 6.5, 0.5)])), []);
  assertIssues(await one(LINE(2, [pt("a", { x: 3 }, 6.5, 0.49)])), [{ rule: "point-mismatch", chart: "b", point: "a", expected: 6.5, actual: 6 }]);
});

test("B1 point tol: tol 0 exact value passes (C-11)", async () => {
  assertIssues(await one(LINE(2, [pt("a", { x: 3 }, 6, 0)])), []);
});

test("B2 bind min: k=1 passes, k=0.999 range issue (C-12)", async () => {
  assertIssues(await one(LINE(2, [pt("a", { x: 3 }, 3, 0, { params: { k: 1 } })])), []);
  assertIssues(await one(LINE(2, [pt("a", { x: 3 }, 2.997, 0, { params: { k: 0.999 } })])),
    [{ rule: "point-param-range", chart: "b", point: "a", expected: [1, 5], actual: 0.999 }]);
});

test("B3 bind max: k=5 passes, k=5.001 range issue (C-12)", async () => {
  assertIssues(await one(LINE(2, [pt("a", { x: 3 }, 15, 0, { params: { k: 5 } })])), []);
  assertIssues(await one(LINE(2, [pt("a", { x: 3 }, 15.003, 0, { params: { k: 5.001 } })])),
    [{ rule: "point-param-range", chart: "b", point: "a", expected: [1, 5], actual: 5.001 }]);
});

test("B4 where float: x 0.3 matches one accumulated row, 0.3001 matches none (C-13)", async () => {
  const spec = (where) => ({
    name: "curve", data: { sequence: { start: 0, stop: 1, step: 0.1, as: "x" } },
    transform: [{ calculate: "10*datum.x", as: "y" }], mark: "line",
    encoding: { x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" } },
    usermeta: { ltt: { points: [pt("a", where, 3, 1e-9)] } },
  });
  assertIssues(await one(spec({ x: 0.3 })), []);
  assertIssues(await one(spec({ x: 0.3001 })), [{ rule: "point-row", chart: "b", point: "a", actual: 0 }]);
});

test("B5 option count: 2 options pass, 1 option quiz-options (C-14)", async () => {
  assertIssues(await check(C1({ quizzes: [choice("c", 2, 1)] })), []);
  assertIssues(await check(C1({ quizzes: [choice("c", 1, 1)] })), [{ rule: "quiz-options", quiz: "c", actual: 1 }]);
});

test("B6 quiz tol: 8.5 tol 0.5 pass, tol 0.49 mismatch vs row 8 (C-15)", async () => {
  assertIssues(await check(C1({ quizzes: [number("n", { answer: "8.5", tol: "0.5", from: "traj.p2" })] })), []);
  assertIssues(await check(C1({ quizzes: [number("n", { answer: "8.5", tol: "0.49", from: "traj.p2" })] })),
    [{ rule: "quiz-mismatch", quiz: "n", expected: 8, actual: 8.5 }]);
});
