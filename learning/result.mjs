import {definitions} from '../contracts/definitions.mjs';
import {inspectionAssessmentGuide} from '../examples/manufacturing-inspection/assessment-guide.mjs';
import {PREDICTION_FIELDS, RATIO_FIELDS, gradeTransferPrediction} from './grading.mjs';

const CONCEPT_ID = 'positive-predictive-value';
const ACTIVITY = {baseline: 'explore-inspection', transfer: 'assess-inspection'};
const FREE = {
  question: {purpose: 'question', dimension: 'question', label: '질문 만들기'},
  choice: {purpose: 'choice', dimension: 'choice-meaning', label: '선택 이유'},
  apply: {purpose: 'transfer', dimension: 'transfer', label: '내 상황에 적용'},
};

const shortHash = text => {
  let hash = 0x811c9dc5;
  for (const char of text) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

function serialize(values) {
  if (values === null) return null;
  return JSON.stringify(Object.fromEntries(PREDICTION_FIELDS.map(field => [RATIO_FIELDS.includes(field) ? `${field}Percent` : field, values[field]])));
}

export function buildResult(progress, lesson, session, now) {
  const fallback = new Date(typeof now === 'function' ? now() : now).toISOString();
  const prefix = shortHash(session.resultId);
  const concept = lesson.concepts.find(item => item.conceptId === CONCEPT_ID);
  const responses = [];
  const assessments = [];
  const addResponse = (fields, at) => {
    const response = {
      responseId: `r-${prefix}-${responses.length + 1}`,
      conceptId: concept.conceptId,
      conceptRevision: concept.conceptRevision,
      attempt: 1,
      previousResponseId: null,
      recordedAt: at ?? fallback,
      ...fields,
    };
    responses.push(response);
    return response;
  };
  const addAssessment = (dimension, response, status, reviewer, context) => {
    const criterion = lesson.rubric.criteria.find(item => item.dimension === dimension);
    assessments.push({
      assessmentId: `a-${prefix}-${assessments.length + 1}`,
      responseId: response.responseId,
      criterionId: criterion.criterionId,
      rubricVersion: lesson.rubric.rubricVersion,
      status,
      reviewer,
      context,
      help: response.help,
    });
  };
  const predictions = key => {
    const track = progress[key];
    const entries = track.original ? [track.original, ...track.retries] : [];
    let previous = null;
    return entries.map((entry, index) => {
      previous = addResponse({
        activityId: ACTIVITY[key],
        purpose: 'prediction',
        answer: serialize(entry.values),
        help: entry.help,
        visibility: index === 0 ? 'before-output' : 'after-output',
        ...(index === 0 ? {} : {attempt: index + 1, previousResponseId: previous.responseId}),
      }, entry.at);
      return previous;
    });
  };

  predictions('baseline');
  const [original] = predictions('transfer');
  const transfer = progress.transfer;
  const caseLabel = `새 사례 ${Object.values(transfer.inputs).join('/')}`;
  if (original) {
    const timing = `${caseLabel}, 결과 공개 전 최초 예측, 도움 ${original.help}`;
    let calculation = null;
    if (transfer.calculationError) {
      calculation = addResponse({activityId: ACTIVITY.transfer, purpose: 'calculation-error', answer: null, help: progress.help, visibility: 'before-output'}, null);
    }
    if (calculation) addAssessment('prediction-model', calculation, 'pending', 'unreviewed', `${timing}. 계산 도구 실패로 판정을 보류합니다. 이해 부족으로 기록하지 않습니다.`);
    else if (transfer.original.values === null) addAssessment('prediction-model', original, 'skipped', 'automatic', `${timing}. 예측을 건너뛰었습니다.`);
    else {
      const grade = gradeTransferPrediction(transfer.original.values, inspectionAssessmentGuide.transferCase.expected);
      addAssessment('prediction-model', original, grade.status, 'automatic', `${timing}. 허용 오차 개수 ±1, 비율 ±1%p. 일치 ${grade.matched.length}/${PREDICTION_FIELDS.length}: ${grade.matched.join(', ') || '없음'}. 불일치: ${grade.mismatched.join(', ') || '없음'}.`);
    }
    if (transfer.original.values === null) addAssessment('concept', original, 'skipped', 'unreviewed', `${timing}. 예측을 건너뛰어 개념 구분 관찰이 없습니다.`);
    else addAssessment('concept', original, 'pending', 'unreviewed', `${timing}. agent 검토 전입니다.`);
  }

  const revealed = transfer.revealed;
  for (const [kind, spec] of Object.entries(FREE)) {
    const entry = progress.responses[kind];
    if (entry === null) continue;
    const response = addResponse({activityId: ACTIVITY.transfer, purpose: spec.purpose, answer: entry.text, help: entry.help, visibility: revealed ? 'after-output' : 'before-output'}, entry.at);
    const timing = `${spec.label}, 새 사례 결과 ${revealed ? '공개 후' : '공개 전'}, 도움 ${entry.help}`;
    if (entry.text === null) addAssessment(spec.dimension, response, 'skipped', 'unreviewed', `${timing}. 건너뛰었습니다.`);
    else addAssessment(spec.dimension, response, 'pending', 'unreviewed', `${timing}. agent 검토 전입니다.`);
  }

  return {
    kind: 'result',
    version: 1,
    resultId: session.resultId,
    profileId: session.profileId,
    lessonId: lesson.lessonId,
    lessonRevision: lesson.lessonRevision,
    baseMapRevision: session.baseMapRevision,
    sequence: session.sequence,
    previousResultId: session.previousResultId,
    state: progress.completed ? 'completed' : 'partial',
    responses,
    assessments,
  };
}

const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function walk(value, definition, path, errors) {
  const add = code => errors.push({code, path});
  if (definition.nullable && value === null) return;
  const type = definition.type;
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'object' ? !isObject : type === 'array' ? !Array.isArray(value) : typeof value !== type || value === null) return add('TYPE');
  if (type === 'object') {
    for (const key of Object.keys(definition.fields)) {
      if (!Object.hasOwn(value, key)) errors.push({code: 'REQUIRED', path: `${path}/${key}`});
      else walk(value[key], definition.fields[key], `${path}/${key}`, errors);
    }
    for (const key of Object.keys(value)) if (!Object.hasOwn(definition.fields, key)) errors.push({code: 'UNKNOWN_FIELD', path: `${path}/${key}`});
  } else if (type === 'array') {
    if (value.length < definition.min) add('RANGE');
    value.forEach((item, index) => walk(item, definition.items, `${path}/${index}`, errors));
  } else if (definition.kind) {
    if (value !== definition.kind) add('KIND');
  } else if (definition.version) {
    if (value !== 1) add('VERSION');
  } else if (definition.format === 'integer') {
    if (!Number.isSafeInteger(value)) add('VALUE');
    else if (value < 1) add('RANGE');
  } else if (type === 'string') {
    const valid = definition.format === 'id' ? idPattern.test(value)
      : definition.format === 'timestamp' ? timestampPattern.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
      : definition.values ? definition.values.includes(value) : value.trim().length > 0;
    if (!valid) add('VALUE');
  } else if (definition.positive && value <= 0) add('RANGE');
}

// contracts/index.mjs needs Buffer, so browser code re-checks the result shape against the shared definitions.
export function validateResultShape(document) {
  const errors = [];
  walk(document, definitions.result, '', errors);
  if (!errors.length && (document.sequence === 1) !== (document.previousResultId === null)) errors.push({code: 'STATE', path: '/previousResultId'});
  return {ok: errors.length === 0, errors};
}
