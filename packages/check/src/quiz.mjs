import { issue } from './issue.mjs';
import { ID_PATTERN } from './chart.mjs';

function parseNumber(raw) {
  if (raw === undefined) return null;
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function checkQuiz(quiz, seenQuizIds, charts, unchecked) {
  const errors = [];
  const id = quiz.id;
  if (!ID_PATTERN.test(id) || seenQuizIds.has(id)) {
    errors.push(issue('quiz-id', `quiz id "${id}" is invalid or repeats an earlier quiz id`, { quiz: id, actual: id }));
  }
  seenQuizIds.add(id);
  if (quiz.kind !== 'choice' && quiz.kind !== 'number') {
    errors.push(issue('quiz-kind', 'data-kind must be "choice" or "number"', { quiz: id, actual: quiz.kind ?? null }));
  }
  if (errors.length > 0) return errors;

  if (quiz.kind === 'choice') {
    if (quiz.options < 2) {
      errors.push(issue('quiz-options', `choice quiz needs at least 2 options, found ${quiz.options}`, { quiz: id, actual: quiz.options }));
    }
    if (quiz.correct !== 1) {
      errors.push(issue('quiz-correct', `choice quiz needs exactly 1 data-correct option, found ${quiz.correct}`, { quiz: id, actual: quiz.correct }));
    }
    return errors;
  }

  const answer = parseNumber(quiz.answer);
  const tol = parseNumber(quiz.tol);
  if (answer === null || tol === null || tol < 0) {
    errors.push(issue('quiz-answer', 'number quiz needs a finite data-answer and a finite data-tol >= 0', { quiz: id }));
    return errors;
  }
  if (quiz.from === undefined) {
    unchecked.push({ quiz: id, reason: 'no-from' });
    return errors;
  }
  const parts = quiz.from.split('.');
  const chart = parts.length === 2 && parts[0] !== '' && parts[1] !== '' ? charts.get(parts[0]) : undefined;
  const points = chart && Array.isArray(chart.points) ? chart.points : [];
  const exists = chart !== undefined && points.some((p) => typeof p === 'object' && p !== null && p.id === parts[1]);
  if (!exists) {
    errors.push(issue('quiz-from', `data-from "${quiz.from}" names no point of a valid chart`, { quiz: id, actual: quiz.from }));
    return errors;
  }
  if (!chart.evaluated.has(parts[1])) {
    unchecked.push({ quiz: id, reason: 'linked-point-unevaluated' });
    return errors;
  }
  const rowValue = chart.evaluated.get(parts[1]);
  if (Math.abs(answer - rowValue) > tol) {
    errors.push(issue('quiz-mismatch', `answer ${answer} differs from the chart value ${rowValue} by more than ${tol}`, {
      quiz: id,
      expected: rowValue,
      actual: answer,
    }));
  }
  return errors;
}
