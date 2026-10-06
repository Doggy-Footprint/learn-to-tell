// Independent oracle: exact integer arithmetic on thousandths of a percent; no production code participates.
// Percent inputs in thousandths of a percent (S = 100%); every count = numerator / 10^6 (N = 10,000).
const S = 100000n;
const thousandths = x => BigInt(Math.round(x * 1000));
const SCALE = {'true-positive': 1, 'false-positive': 1, 'false-negative': 1, 'true-negative': 1, 'positive-count': 1, 'positive-predictive-value': 100, accuracy: 100};

export function oracleOutput(defect, detection, falsePositive) {
  const d = thousandths(defect), s = thousandths(detection), f = thousandths(falsePositive);
  return {tp: d * s, fn: d * (S - s), fp: (S - d) * f, tn: (S - d) * (S - f)};
}
// raw = model value, display = raw * scale (null stays null)
export function oracleValues(defect, detection, falsePositive) {
  const {tp, fp, fn, tn} = oracleOutput(defect, detection, falsePositive);
  const pos = tp + fp;
  const raw = {
    'true-positive': Number(tp) / 1e6, 'false-positive': Number(fp) / 1e6, 'false-negative': Number(fn) / 1e6, 'true-negative': Number(tn) / 1e6, 'positive-count': Number(pos) / 1e6,
    'positive-predictive-value': pos === 0n ? null : Number(tp) / Number(pos),
    accuracy: Number(tp + tn) / 1e10,
  };
  const display = Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, v === null ? null : v * SCALE[id]]));
  return {raw, display};
}
export const PPV_UNDEFINED_TEXT = '정의되지 않음';

// Mirrors the spec-declared T1 cross-reference rules a result must satisfy against the lesson (contracts only checks them for bundles).
export function crossCheckResult(result, lesson) {
  const problems = [];
  if (result.lessonId !== lesson.lessonId) problems.push('lessonId');
  if (result.lessonRevision !== lesson.lessonRevision) problems.push('lessonRevision');
  const activities = new Set(lesson.activities.map(a => a.activityId));
  const concepts = new Map(lesson.concepts.map(c => [c.conceptId, c.conceptRevision]));
  const criteria = new Map(lesson.rubric.criteria.map(c => [c.criterionId, c]));
  const responses = new Map(result.responses.map(r => [r.responseId, r]));
  for (const r of result.responses) {
    if (!activities.has(r.activityId)) problems.push(`activity:${r.activityId}`);
    if (concepts.get(r.conceptId) !== r.conceptRevision) problems.push(`concept:${r.conceptId}`);
  }
  for (const a of result.assessments) {
    const c = criteria.get(a.criterionId);
    if (!c) { problems.push(`criterion:${a.criterionId}`); continue; }
    if (a.rubricVersion !== lesson.rubric.rubricVersion) problems.push('rubricVersion');
    const r = responses.get(a.responseId);
    if (r && !c.conceptIds.includes(r.conceptId)) problems.push(`criterionConcept:${a.criterionId}`);
    const neutral = a.status === 'pending' || a.status === 'skipped';
    if (!neutral && a.reviewer !== c.mode) problems.push(`reviewer:${a.criterionId}`);
  }
  return problems;
}

// R11: every response carries the first conceptId of the prediction-model criterion; baseline-chain predictions sit in the first
// exploration activity; transfer predictions and free responses sit in the first assessment activity (hint views and calculation errors are not specified).
export function crossCheckR11(result, lesson) {
  const problems = [];
  const criterion = lesson.rubric.criteria.find(c => c.dimension === 'prediction-model');
  const conceptId = criterion.conceptIds[0];
  const revision = lesson.concepts.find(c => c.conceptId === conceptId).conceptRevision;
  const exploration = lesson.activities.find(a => a.stage === 'exploration').activityId;
  const assessment = lesson.activities.find(a => a.stage === 'assessment').activityId;
  const byId = new Map(result.responses.map(r => [r.responseId, r]));
  const root = r => { let x = r; while (x.previousResponseId !== null) x = byId.get(x.previousResponseId); return x; };
  const predictions = result.responses.filter(r => r.purpose === 'prediction');
  const baselineRoot = predictions.length ? predictions[0].responseId : null;
  for (const r of result.responses) {
    if (r.conceptId !== conceptId || r.conceptRevision !== revision) problems.push(`concept:${r.responseId}`);
    if (r.purpose === 'prediction') {
      const expected = root(r).responseId === baselineRoot ? exploration : assessment;
      if (r.activityId !== expected) problems.push(`activity:${r.responseId}:${r.activityId}`);
    } else if (!['view', 'calculation-error'].includes(r.purpose) && r.activityId !== assessment) problems.push(`activity:${r.responseId}:${r.activityId}`);
  }
  return problems;
}
