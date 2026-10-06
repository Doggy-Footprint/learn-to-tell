// Tolerance absorbs binary rounding only; it must stay far below the 0.01 boundary probes.
const EPSILON = 1e-9;

function matches(given, expected, absolute) {
  if (expected === null) return given === null;
  if (typeof given !== 'number' || !Number.isFinite(given)) return false;
  return Math.abs(given - expected) <= absolute + EPSILON;
}

// Predictions and expected values are display-unit values (raw * scale) keyed by outputId.
export function gradeTransferPrediction(prediction, expected, lesson) {
  if (prediction === null || prediction === undefined) return {status: 'skipped', matched: [], mismatched: []};
  const absolutes = new Map(lesson.transfer.tolerances.map(item => [item.outputId, item.absolute]));
  const matched = [];
  const mismatched = [];
  for (const {outputId} of lesson.outputs) (matches(prediction[outputId], expected[outputId], absolutes.get(outputId) ?? 0) ? matched : mismatched).push(outputId);
  const status = mismatched.length === 0 ? 'supported' : matched.length === 0 ? 'not_demonstrated' : 'partial';
  return {status, matched, mismatched};
}

export function toleranceText(lesson) {
  const absolutes = new Map(lesson.transfer.tolerances.map(item => [item.outputId, item.absolute]));
  return lesson.outputs.map(({outputId, label, unit}) => `${label} ±${absolutes.get(outputId)}${unit}`).join(', ');
}
