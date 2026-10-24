// Fixture builders from spec 6ed8f04e251d4b22 v1 "Fixture conventions". Each part carries
// independently counted summary contributions (FR-1) so Reports can be checked without the checker.
export const LIBS =
  '<script src="https://cdn.jsdelivr.net/npm/vega@6.4.0"></script><script src="https://cdn.jsdelivr.net/npm/vega-lite@6.5.0"></script>';

export function LINE(k, points, extra = {}) {
  return {
    name: "curve",
    params: [{ name: "k", value: k, bind: { input: "range", min: 1, max: 5 } }],
    data: { sequence: { start: 0, stop: 4, step: 1, as: "x" } },
    transform: [{ calculate: "k*datum.x", as: "y" }],
    mark: "line",
    encoding: { x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" } },
    usermeta: { ltt: { points } },
    ...extra,
  };
}

export const pt = (id, where, value, tol = 0, more = {}) => ({ id, mark: "curve", where, field: "y", value, tol, ...more });

function pointsOf(text) {
  try {
    const v = JSON.parse(text);
    if (v === null || typeof v !== "object" || Array.isArray(v)) return 0;
    const p = v?.usermeta?.ltt?.points;
    return Array.isArray(p) ? p.length : 0;
  } catch {
    return 0;
  }
}

export function rawChart(id, text, { tag = "script", type = "application/json" } = {}) {
  const attrs = tag === "script" && type !== null ? ` type="${type}"` : "";
  return { html: `<${tag}${attrs} data-ltt-chart="${id}">${text}</${tag}>`, charts: 1, points: tag === "script" ? pointsOf(text) : 0 };
}

export const chart = (id, spec) => rawChart(id, JSON.stringify(spec));

export function choice(id, nOpts, nCorrect, inner = "") {
  let opts = "";
  for (let i = 0; i < nOpts; i++) opts += `<button data-ltt-option${i < nCorrect ? " data-correct" : ""}>o${i}</button>`;
  return { html: `<div data-ltt-quiz="${id}" data-kind="choice">${opts}${inner}</div>`, quizzes: 1 };
}

export function number(id, { answer, tol, from, kind = "number" } = {}) {
  const a = (n, v) => (v === undefined ? "" : ` ${n}="${v}"`);
  return { html: `<div data-ltt-quiz="${id}"${a("data-kind", kind)}${a("data-answer", answer)}${a("data-tol", tol)}${a("data-from", from)}><input></div>`, quizzes: 1 };
}

export function rawQuiz(html, quizzes = 1) {
  return { html, quizzes };
}

export function page({ libs = LIBS, charts = [], quizzes = [], prefix = "" } = {}) {
  const html = `${prefix}<!doctype html><html><head><meta charset="utf-8">${libs}</head><body><p>lesson</p>${charts.map((c) => c.html).join("")}${quizzes.map((q) => q.html).join("")}</body></html>`;
  return {
    html,
    counts: {
      charts: charts.reduce((s, c) => s + c.charts, 0),
      points: charts.reduce((s, c) => s + c.points, 0),
      quizzes: quizzes.reduce((s, q) => s + q.quizzes, 0),
    },
  };
}

export const C1_POINTS = () => [
  { id: "p1", mark: "curve", where: { x: 3 }, field: "y", value: 6, tol: 0 },
  { id: "p2", mark: "curve", params: { k: 4 }, where: { x: 2 }, field: "y", value: 8, tol: 0 },
];
export const C1_CHART = () => chart("traj", LINE(2, C1_POINTS()));
export const C1_QUIZZES = () => [choice("q1", 3, 1), number("q2", { answer: "8", tol: "0", from: "traj.p2" })];

export function C1(add = {}) {
  return page({
    libs: add.libs ?? LIBS,
    charts: [C1_CHART(), ...(add.charts ?? [])],
    quizzes: [...C1_QUIZZES(), ...(add.quizzes ?? [])],
    prefix: add.prefix ?? "",
  });
}
