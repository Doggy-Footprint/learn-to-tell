// Independent oracle: exact integer arithmetic on hundredths of a percent; no production code participates.
// Units: percent inputs in thousandths of a percent (S = 100%); every count = numerator / 10^6.
const S = 100000n;
const thousandths = x => BigInt(Math.round(x * 1000));

export function oracleOutput(defect, detection, falsePositive) {
  const d = thousandths(defect), s = thousandths(detection), f = thousandths(falsePositive);
  return {tp: d * s, fn: d * (S - s), fp: (S - d) * f, tn: (S - d) * (S - f)};
}
export const COUNT_DEN = 1000000n;
const group = intText => intText.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export function countText(numerator) {
  const scaled = (numerator + 500n) / 1000n; // 3 decimals, half-up
  const int = scaled / 1000n, frac = String(scaled % 1000n).padStart(3, '0').replace(/0+$/, '');
  return group(String(int)) + (frac ? `.${frac}` : '');
}
const pctText = h => `${h / 100n}.${String(h % 100n).padStart(2, '0')}%`;
export const PPV_UNDEFINED = '정의되지 않음(양성 0)';
export function oracleDisplay(defect, detection, falsePositive) {
  const {tp, fp, fn, tn} = oracleOutput(defect, detection, falsePositive);
  const pos = tp + fp;
  return {
    truePositive: countText(tp), falsePositive: countText(fp), falseNegative: countText(fn), trueNegative: countText(tn), positiveCount: countText(pos),
    positivePredictiveValue: pos === 0n ? PPV_UNDEFINED : pctText((tp * 20000n + pos) / (2n * pos)),
    accuracy: pctText((tp + tn + 500000n) / 1000000n),
    raw: {truePositive: Number(tp) / 1e6, falsePositive: Number(fp) / 1e6, falseNegative: Number(fn) / 1e6, trueNegative: Number(tn) / 1e6},
  };
}

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
