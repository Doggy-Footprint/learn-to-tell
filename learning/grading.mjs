export const COUNT_FIELDS = ['truePositive', 'falsePositive', 'falseNegative', 'trueNegative', 'positiveCount'];
export const RATIO_FIELDS = ['positivePredictiveValue', 'accuracy'];
export const PREDICTION_FIELDS = [...COUNT_FIELDS, ...RATIO_FIELDS];

// Tolerance absorbs binary rounding only; it must stay far below the 0.01 boundary probes.
const EPSILON = 1e-9;
const TOLERANCE = 1;

function matches(field, given, expected) {
  if (field === 'positivePredictiveValue' && expected === null) return given === null;
  if (typeof given !== 'number' || !Number.isFinite(given) || expected === null) return false;
  const reference = COUNT_FIELDS.includes(field) ? expected : expected * 100;
  return Math.abs(given - reference) <= TOLERANCE + EPSILON;
}

// Prediction ratios are percent as typed by the learner; expected ratios are raw fractions from the T2 model.
export function gradeTransferPrediction(prediction, expected) {
  if (prediction === null || prediction === undefined) return {status: 'skipped', matched: [], mismatched: []};
  const matched = PREDICTION_FIELDS.filter(field => matches(field, prediction[field], expected[field]));
  const mismatched = PREDICTION_FIELDS.filter(field => !matched.includes(field));
  const status = mismatched.length === 0 ? 'supported' : matched.length === 0 ? 'not_demonstrated' : 'partial';
  return {status, matched, mismatched};
}
