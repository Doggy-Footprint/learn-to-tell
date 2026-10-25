import { scanDocument } from './html.mjs';
import { checkLibraries } from './libs.mjs';
import { checkChart, pointsOf } from './chart.mjs';
import { checkQuiz } from './quiz.mjs';

export const VEGA_VERSION = '6.4.0';
export const VEGA_LITE_VERSION = '6.5.0';

export const RULES = Object.freeze([
  'lib-version',
  'lib-source',
  'lib-missing',
  'chart-json',
  'chart-id',
  'chart-schema',
  'chart-url',
  'chart-build',
  'chart-no-points',
  'point-invalid',
  'point-mark',
  'point-group',
  'point-param-unknown',
  'point-param-range',
  'point-row',
  'point-mismatch',
  'quiz-id',
  'quiz-kind',
  'quiz-options',
  'quiz-correct',
  'quiz-answer',
  'quiz-from',
  'quiz-mismatch',
]);

export async function checkHtml(html) {
  const { scripts, charts, quizzes } = scanDocument(html);
  const errors = checkLibraries(scripts, charts.length, { vega: VEGA_VERSION, 'vega-lite': VEGA_LITE_VERSION });

  let pointCount = 0;
  const seenChartIds = new Set();
  const validCharts = new Map();
  for (const chart of charts) {
    const r = await checkChart(chart, seenChartIds);
    errors.push(...r.errors);
    if (r.spec !== undefined) {
      const points = pointsOf(r.spec);
      if (Array.isArray(points)) pointCount += points.length;
    }
    if (r.valid) validCharts.set(chart.id, { points: pointsOf(r.spec), evaluated: r.evaluated });
  }

  const unchecked = [];
  const seenQuizIds = new Set();
  for (const quiz of quizzes) errors.push(...checkQuiz(quiz, seenQuizIds, validCharts, unchecked));

  return {
    ok: errors.length === 0,
    summary: { charts: charts.length, points: pointCount, quizzes: quizzes.length, unchecked: unchecked.length },
    errors,
    unchecked,
  };
}
