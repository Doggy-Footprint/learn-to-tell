import {createHash} from 'node:crypto';
import {definitions, bundleDefinition} from './definitions.mjs';
import {canonicalContent} from './content-hash.mjs';

const pointer = (path, key) => `${path}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;
const add = (errors, code, path) => errors.push({code, path});
export const output = errors => {
  errors.sort((a, b) => a.code < b.code ? -1 : a.code > b.code ? 1 : a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const unique = errors.filter((error, index) => index === 0 || error.code !== errors[index - 1].code || error.path !== errors[index - 1].path);
  return {ok: unique.length === 0, errors: unique};
};
const computeHash = result => 'sha256-' + createHash('sha256').update(canonicalContent(result)).digest('hex');
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value, key);

export function inspect(value, path, depth, ancestors, blocked, errors) {
  if (typeof value === 'string') {
    if (Buffer.byteLength(value, 'utf8') > 65536) {
      add(errors, 'LIMIT', path);
      blocked.add(path);
    }
    return;
  }
  if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return;
  if (typeof value !== 'object') {
    add(errors, 'TYPE', path);
    blocked.add(path);
    return;
  }
  if (ancestors.has(value) || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    add(errors, 'TYPE', path);
    blocked.add(path);
    return;
  }
  if (depth > 32) {
    add(errors, 'LIMIT', path);
    blocked.add(path);
    return;
  }
  const keys = Reflect.ownKeys(value);
  if ((Array.isArray(value) ? value.length : keys.length) > 1000) {
    add(errors, 'LIMIT', path);
    blocked.add(path);
    return;
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      if (!own(value, index)) {
        const child = pointer(path, index);
        add(errors, 'TYPE', child);
        blocked.add(child);
      }
    }
  }
  for (const key of keys) {
    if (Array.isArray(value) && key === 'length') continue;
    const child = typeof key === 'symbol' ? path : pointer(path, key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === 'symbol' || !own(descriptor, 'value') || (Array.isArray(value) && !/^(0|[1-9][0-9]*)$/.test(key))) {
      add(errors, 'TYPE', child);
      blocked.add(child);
      continue;
    }
    inspect(descriptor.value, child, depth + 1, ancestors, blocked, errors);
  }
  ancestors.delete(value);
}

function versioned(value, definition, path, blocked, errors) {
  if (!isObject(value)) return add(errors, 'TYPE', path);
  const versionPath = pointer(path, 'version');
  if (!own(value, 'version')) return add(errors, 'REQUIRED', versionPath);
  if (blocked.has(versionPath)) return;
  const version = Object.getOwnPropertyDescriptor(value, 'version').value;
  if (typeof version !== 'number') return add(errors, 'TYPE', versionPath);
  if (!own(definition.versions, version)) return add(errors, 'VERSION', versionPath);
  structure(value, definition.versions[version], path, blocked, errors);
}

function structure(value, definition, path, blocked, errors) {
  if (blocked.has(path)) return;
  if (definition.nullable && value === null) return;
  if (definition.versions) {
    versioned(value, definition, path, blocked, errors);
    return;
  }
  const type = definition.type;
  if ((type === 'object' && !isObject(value)) || (type === 'array' && !Array.isArray(value)) || (type !== 'object' && type !== 'array' && typeof value !== type) || value === null) {
    add(errors, 'TYPE', path);
    return;
  }
  if (type === 'object') {
    for (const key of Object.keys(definition.fields)) {
      const child = pointer(path, key);
      if (!own(value, key)) add(errors, 'REQUIRED', child);
      else structure(Object.getOwnPropertyDescriptor(value, key).value, definition.fields[key], child, blocked, errors);
    }
    for (const key of Object.getOwnPropertyNames(value)) {
      if (!own(definition.fields, key) && !blocked.has(pointer(path, key))) add(errors, 'UNKNOWN_FIELD', pointer(path, key));
    }
  } else if (type === 'array') {
    if (value.length < definition.min) add(errors, 'RANGE', path);
    if (definition.max && value.length > definition.max) add(errors, 'LIMIT', path);
    for (let index = 0; index < value.length; index++) structure(Object.getOwnPropertyDescriptor(value, index)?.value, definition.items, pointer(path, index), blocked, errors);
  } else if (definition.kind) {
    if (value !== definition.kind) add(errors, 'KIND', path);
  } else if (definition.version) {
    if (value !== definition.version) add(errors, 'VERSION', path);
  } else if (definition.format === 'integer') {
    if (!Number.isSafeInteger(value)) add(errors, 'VALUE', path);
    else if (value < 1) add(errors, 'RANGE', path);
  } else if (type === 'string') {
    const valid = definition.format === 'id' ? /^[a-z][a-z0-9-]{0,63}$/.test(value)
      : definition.format === 'timestamp' ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
      : definition.format === 'content-hash' ? /^sha256-[0-9a-f]{64}$/.test(value)
      : definition.values ? definition.values.includes(value) : value.trim().length > 0;
    if (!valid) add(errors, 'VALUE', path);
  } else if ((definition.positive && value <= 0) || (definition.nonNegative && value < 0)) add(errors, 'RANGE', path);
}

function documentStructure(value, kind, path, errors) {
  const blocked = new Set();
  const start = errors.length;
  inspect(value, path, 1, new Set(), blocked, errors);
  structure(value, definitions[kind], path, blocked, errors);
  return errors.length === start;
}

function collection(items, key, path, errors, secondKey) {
  const index = new Map();
  for (let position = 0; position < items.length; position++) {
    const item = items[position];
    const identity = secondKey ? `${item[key]}:${item[secondKey]}` : item[key];
    if (index.has(identity)) add(errors, 'DUPLICATE', pointer(pointer(path, position), key));
    else index.set(identity, item);
  }
  return index;
}
function reference(index, value, path, errors) {
  if (!index.has(value)) add(errors, 'REFERENCE', path);
  return index.get(value);
}
function equal(left, right) {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every(key => own(right, key) && equal(left[key], right[key]));
}
function diagnosticSemantics(document, path, errors) {
  const candidates = collection(document.candidates, 'candidateId', pointer(path, 'candidates'), errors);
  if (document.selection !== null) reference(candidates, document.selection, pointer(path, 'selection'), errors);
  if ((document.confirmation === 'confirmed') !== (document.selection !== null)) add(errors, 'STATE', pointer(path, 'confirmation'));
  for (let index = 0; index < document.hypotheses.length; index++) reference(candidates, document.hypotheses[index].candidateId, `${path}/hypotheses/${index}/candidateId`, errors);
  if (document.version === 2) {
    reactionSemantics(document.reactions, candidates, path, errors);
    ladderSemantics(document.ladder, path, errors);
  }
}
function ladderSemantics(ladder, path, errors) {
  const steps = new Set();
  const concepts = new Set();
  for (let index = 0; index < ladder.length; index++) {
    const item = ladder[index];
    const child = `${path}/ladder/${index}`;
    if (item.step < 1 || item.step > 5) add(errors, 'RANGE', `${child}/step`);
    if (steps.has(item.step) || concepts.has(item.conceptId)) add(errors, 'DUPLICATE', child);
    steps.add(item.step);
    concepts.add(item.conceptId);
  }
}
function reactionSemantics(reactions, candidates, path, errors) {
  const seen = new Set();
  const last = Math.max(...reactions.map(item => item.round));
  for (let index = 0; index < reactions.length; index++) {
    const item = reactions[index];
    const child = `${path}/reactions/${index}`;
    if (item.round > 2) add(errors, 'RANGE', `${child}/round`);
    const identity = `${item.round}:${item.candidateId}`;
    if (seen.has(identity)) add(errors, 'DUPLICATE', child);
    seen.add(identity);
    if (item.round === last) reference(candidates, item.candidateId, `${child}/candidateId`, errors);
  }
}
function idReferences(values, targets, path, errors) {
  const ids = new Set();
  for (let index = 0; index < values.length; index++) {
    const child = pointer(path, index);
    if (ids.has(values[index])) add(errors, 'DUPLICATE', child);
    ids.add(values[index]);
    reference(targets, values[index], child, errors);
  }
}
function lessonSemantics(document, path, errors) {
  const concepts = collection(document.concepts, 'conceptId', `${path}/concepts`, errors);
  const content = collection(document.content, 'contentId', `${path}/content`, errors);
  collection(document.decisions, 'decisionId', `${path}/decisions`, errors);
  const inputs = collection(document.inputs, 'inputId', `${path}/inputs`, errors);
  collection(document.activities, 'activityId', `${path}/activities`, errors);
  collection(document.rubric.criteria, 'criterionId', `${path}/rubric/criteria`, errors);
  for (let index = 0; index < document.content.length; index++) idReferences(document.content[index].conceptIds, concepts, `${path}/content/${index}/conceptIds`, errors);
  for (let index = 0; index < document.decisions.length; index++) {
    const decision = document.decisions[index];
    for (const role of ['explanation', 'simulation', 'application', 'failure', 'assessment']) {
      const field = `${role}Id`;
      const target = reference(content, decision[field], `${path}/decisions/${index}/${field}`, errors);
      if (target && target.role !== role) add(errors, 'REFERENCE', `${path}/decisions/${index}/${field}`);
    }
  }
  for (let index = 0; index < document.inputs.length; index++) {
    const input = document.inputs[index];
    if (input.min >= input.max) add(errors, 'RANGE', `${path}/inputs/${index}/max`);
    if (input.default < input.min || input.default > input.max) add(errors, 'RANGE', `${path}/inputs/${index}/default`);
  }
  const requiredStages = new Set();
  let minutes = 0;
  for (let index = 0; index < document.activities.length; index++) {
    const activity = document.activities[index];
    idReferences(activity.contentIds, content, `${path}/activities/${index}/contentIds`, errors);
    if (activity.required) {
      requiredStages.add(activity.stage);
      minutes += activity.minutes;
    }
  }
  if (requiredStages.size !== 6) add(errors, 'STATE', `${path}/activities`);
  if (minutes < 15 || minutes > 20) add(errors, 'RANGE', `${path}/activities`);
  const dimensions = new Set();
  for (let index = 0; index < document.rubric.criteria.length; index++) {
    const criterion = document.rubric.criteria[index];
    dimensions.add(criterion.dimension);
    idReferences(criterion.conceptIds, concepts, `${path}/rubric/criteria/${index}/conceptIds`, errors);
    const target = reference(content, criterion.contentId, `${path}/rubric/criteria/${index}/contentId`, errors);
    if (target && target.role !== 'assessment') add(errors, 'REFERENCE', `${path}/rubric/criteria/${index}/contentId`);
  }
  if (dimensions.size !== 5) add(errors, 'STATE', `${path}/rubric/criteria`);
  if (document.version === 2) lessonV2Semantics(document, path, inputs, errors);
}
function lessonV2Semantics(document, path, inputs, errors) {
  const outputs = collection(document.outputs, 'outputId', `${path}/outputs`, errors);
  const scenarios = collection(document.scenarios, 'scenarioId', `${path}/scenarios`, errors);
  for (let index = 0; index < document.scenarios.length; index++) {
    const values = document.scenarios[index].values;
    const child = `${path}/scenarios/${index}/values`;
    const seen = new Set();
    for (let position = 0; position < values.length; position++) {
      const entry = values[position];
      const input = reference(inputs, entry.inputId, `${child}/${position}/inputId`, errors);
      if (seen.has(entry.inputId)) add(errors, 'STATE', child);
      seen.add(entry.inputId);
      if (input && (entry.value < input.min || entry.value > input.max)) add(errors, 'RANGE', `${child}/${position}/value`);
    }
    if ([...inputs.keys()].some(key => !seen.has(key))) add(errors, 'STATE', child);
  }
  reference(scenarios, document.transfer.scenarioId, `${path}/transfer/scenarioId`, errors);
  const tolerances = collection(document.transfer.tolerances, 'outputId', `${path}/transfer/tolerances`, errors);
  for (let index = 0; index < document.transfer.tolerances.length; index++) reference(outputs, document.transfer.tolerances[index].outputId, `${path}/transfer/tolerances/${index}/outputId`, errors);
  if ([...outputs.keys()].some(key => !tolerances.has(key))) add(errors, 'STATE', `${path}/transfer/tolerances`);
}
function oracleSemantics(document, path, errors) {
  collection(document.cases, 'caseId', `${path}/cases`, errors);
  for (let index = 0; index < document.cases.length; index++) {
    for (const [list, key] of [['values', 'inputId'], ['expected', 'outputId']]) {
      const ids = document.cases[index][list].map(item => item[key]);
      if (new Set(ids).size !== ids.length) add(errors, 'STATE', `${path}/cases/${index}/${list}`);
    }
  }
}
function resultSemantics(document, path, errors) {
  if (document.contentHash !== computeHash(document)) add(errors, 'HASH', `${path}/contentHash`);
  collection(document.responses, 'responseId', `${path}/responses`, errors);
  collection(document.assessments, 'assessmentId', `${path}/assessments`, errors);
  if ((document.sequence === 1) !== (document.previousResultId === null)) add(errors, 'STATE', `${path}/previousResultId`);
  const preceding = new Map();
  for (let index = 0; index < document.responses.length; index++) {
    const response = document.responses[index];
    const child = `${path}/responses/${index}`;
    if (response.attempt === 1) {
      if (response.previousResponseId !== null) add(errors, 'STATE', `${child}/previousResponseId`);
    } else {
      const previous = reference(preceding, response.previousResponseId, `${child}/previousResponseId`, errors);
      if (previous) {
        for (const field of ['activityId', 'conceptId', 'purpose']) if (response[field] !== previous[field]) add(errors, 'STATE', `${child}/${field}`);
        if (response.attempt !== previous.attempt + 1) add(errors, 'STATE', `${child}/attempt`);
        if (response.recordedAt < previous.recordedAt) add(errors, 'STATE', `${child}/recordedAt`);
      }
    }
    if (response.purpose === 'prediction' && response.visibility !== (response.attempt === 1 ? 'before-output' : 'after-output')) add(errors, 'STATE', `${child}/visibility`);
    preceding.set(response.responseId, response);
  }
  for (let index = 0; index < document.assessments.length; index++) {
    const assessment = document.assessments[index];
    const child = `${path}/assessments/${index}`;
    const response = reference(preceding, assessment.responseId, `${child}/responseId`, errors);
    const neutral = assessment.status === 'pending' || assessment.status === 'skipped';
    if (!neutral && assessment.reviewer === 'unreviewed') add(errors, 'STATE', `${child}/status`);
    if (response) {
      if (assessment.help !== response.help) add(errors, 'STATE', `${child}/help`);
      if (!neutral && (response.answer === null || response.purpose === 'view' || response.purpose === 'calculation-error')) add(errors, 'STATE', `${child}/status`);
    }
  }
}
function lessonResult(result, lesson, path, errors) {
  if (result.profileId !== lesson.profileId) add(errors, 'PROFILE', `${path}/profileId`);
  if (result.lessonId !== lesson.lessonId) add(errors, 'REFERENCE', `${path}/lessonId`);
  if (result.lessonRevision !== lesson.lessonRevision) add(errors, 'REVISION', `${path}/lessonRevision`);
  const activities = new Map(lesson.activities.map(item => [item.activityId, item]));
  const concepts = new Map(lesson.concepts.map(item => [item.conceptId, item]));
  const criteria = new Map(lesson.rubric.criteria.map(item => [item.criterionId, item]));
  const responses = new Map(result.responses.map(item => [item.responseId, item]));
  for (let index = 0; index < result.responses.length; index++) {
    const response = result.responses[index];
    const child = `${path}/responses/${index}`;
    reference(activities, response.activityId, `${child}/activityId`, errors);
    const concept = reference(concepts, response.conceptId, `${child}/conceptId`, errors);
    if (concept && concept.conceptRevision !== response.conceptRevision) add(errors, 'REVISION', `${child}/conceptRevision`);
  }
  for (let index = 0; index < result.assessments.length; index++) {
    const assessment = result.assessments[index];
    const child = `${path}/assessments/${index}`;
    const criterion = reference(criteria, assessment.criterionId, `${child}/criterionId`, errors);
    if (assessment.rubricVersion !== lesson.rubric.rubricVersion) add(errors, 'REVISION', `${child}/rubricVersion`);
    if (criterion) {
      const response = responses.get(assessment.responseId);
      if (response && !criterion.conceptIds.includes(response.conceptId)) add(errors, 'REFERENCE', `${child}/criterionId`);
      if (assessment.status !== 'pending' && assessment.status !== 'skipped' && assessment.reviewer !== criterion.mode) add(errors, 'STATE', `${child}/reviewer`);
    }
  }
}
function checkpoint(result, previous, path, errors) {
  if (!previous) {
    if (result.sequence > 1) add(errors, 'REFERENCE', `${path}/previousResultId`);
    return;
  }
  if (result.previousResultId !== previous.resultId) add(errors, 'REFERENCE', `${path}/previousResultId`);
  if (result.profileId !== previous.profileId) add(errors, 'PROFILE', `${path}/profileId`);
  if (result.lessonId !== previous.lessonId) add(errors, 'REFERENCE', `${path}/lessonId`);
  for (const field of ['lessonRevision', 'baseMapRevision']) if (result[field] !== previous[field]) add(errors, 'REVISION', `${path}/${field}`);
  if (result.sequence !== previous.sequence + 1) add(errors, 'STATE', `${path}/sequence`);
  for (const field of ['responses', 'assessments']) {
    if (result[field].length < previous[field].length || previous[field].some((item, index) => !equal(item, result[field][index]))) add(errors, 'STATE', `${path}/${field}`);
  }
}
function mapSemantics(document, path, errors) {
  const lessons = collection(document.lessons, 'lessonId', `${path}/lessons`, errors, 'lessonRevision');
  const results = collection(document.results, 'resultId', `${path}/results`, errors);
  collection(document.observations, 'observationId', `${path}/observations`, errors);
  collection(document.nextPaths, 'pathId', `${path}/nextPaths`, errors);
  for (let index = 0; index < document.lessons.length; index++) {
    const lesson = document.lessons[index];
    const child = `${path}/lessons/${index}`;
    lessonSemantics(lesson, child, errors);
    if (lesson.profileId !== document.profileId) add(errors, 'PROFILE', `${child}/profileId`);
  }
  for (let index = 0; index < document.results.length; index++) {
    const result = document.results[index];
    const child = `${path}/results/${index}`;
    resultSemantics(result, child, errors);
    if (result.profileId !== document.profileId) add(errors, 'PROFILE', `${child}/profileId`);
    const lesson = lessons.get(`${result.lessonId}:${result.lessonRevision}`);
    if (lesson) lessonResult(result, lesson, child, errors);
    else if (document.lessons.some(item => item.lessonId === result.lessonId)) add(errors, 'REVISION', `${child}/lessonRevision`);
    else add(errors, 'REFERENCE', `${child}/lessonId`);
    if (result.baseMapRevision > document.revision) add(errors, 'REVISION', `${child}/baseMapRevision`);
    if (result.sequence > 1) checkpoint(result, results.get(result.previousResultId), child, errors);
  }
  for (let index = 0; index < document.observations.length; index++) {
    const observation = document.observations[index];
    const child = `${path}/observations/${index}`;
    const result = reference(results, observation.resultId, `${child}/resultId`, errors);
    if (result) {
      const assessments = new Map(result.assessments.map(item => [item.assessmentId, item]));
      const assessment = reference(assessments, observation.assessmentId, `${child}/assessmentId`, errors);
      if (assessment) {
        const response = result.responses.find(item => item.responseId === assessment.responseId);
        if (response) {
          if (observation.conceptId !== response.conceptId) add(errors, 'REFERENCE', `${child}/conceptId`);
          if (observation.conceptRevision !== response.conceptRevision) add(errors, 'REVISION', `${child}/conceptRevision`);
        }
      }
    }
  }
  const nextConcepts = new Map();
  for (const lesson of document.lessons) {
    if (!nextConcepts.has(lesson.lessonId)) nextConcepts.set(lesson.lessonId, new Map());
    const concepts = nextConcepts.get(lesson.lessonId);
    for (const concept of lesson.concepts) {
      if (!concepts.has(concept.conceptId)) concepts.set(concept.conceptId, new Set());
      concepts.get(concept.conceptId).add(concept.conceptRevision);
    }
  }
  for (let index = 0; index < document.nextPaths.length; index++) {
    const next = document.nextPaths[index];
    const child = `${path}/nextPaths/${index}`;
    if (next.lessonStatus !== 'placed') continue;
    const concepts = nextConcepts.get(next.lessonId);
    if (!concepts) add(errors, 'REFERENCE', `${child}/lessonId`);
    else {
      const revisions = concepts.get(next.conceptId);
      if (!revisions) add(errors, 'REFERENCE', `${child}/conceptId`);
      else if (!revisions.has(next.conceptRevision)) add(errors, 'REVISION', `${child}/conceptRevision`);
    }
  }
}
const semantics = {diagnostic: diagnosticSemantics, lesson: lessonSemantics, result: resultSemantics, map: mapSemantics, oracle: oracleSemantics};

export function validateDocument(document, expectedKind) {
  const errors = [];
  if (typeof expectedKind !== 'string' || !own(definitions, expectedKind)) return output([{code: 'KIND', path: ''}]);
  if (documentStructure(document, expectedKind, '', errors)) semantics[expectedKind](document, '', errors);
  return output(errors);
}
export function parseDocument(text, expectedKind) {
  if (typeof expectedKind !== 'string' || !own(definitions, expectedKind)) return output([{code: 'KIND', path: ''}]);
  if (typeof text !== 'string') return output([{code: 'TYPE', path: ''}]);
  if (Buffer.byteLength(text, 'utf8') > 1048576) return output([{code: 'LIMIT', path: ''}]);
  let document;
  try {
    document = JSON.parse(text);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return output([{code: 'JSON', path: ''}]);
  }
  return validateDocument(document, expectedKind);
}
export function validateBundle(bundle) {
  const errors = [];
  const envelopeBlocked = new Set();
  if (!isObject(bundle) || (Object.getPrototypeOf(bundle) !== Object.prototype && Object.getPrototypeOf(bundle) !== null)) return output([{code: 'TYPE', path: ''}]);
  const keys = Reflect.ownKeys(bundle);
  if (keys.length > 1000) return output([{code: 'LIMIT', path: ''}]);
  for (const key of keys) {
    const path = typeof key === 'symbol' ? '' : pointer('', key);
    const descriptor = Object.getOwnPropertyDescriptor(bundle, key);
    if (typeof key === 'symbol' || !own(descriptor, 'value')) {
      add(errors, 'TYPE', path);
      envelopeBlocked.add(path);
    } else if (!own(bundleDefinition.fields, key)) {
      inspect(descriptor.value, path, 1, new Set([bundle]), envelopeBlocked, errors);
      if (!envelopeBlocked.has(path)) add(errors, 'UNKNOWN_FIELD', path);
    }
  }
  let validStructure = errors.length === 0;
  for (const kind of Object.keys(bundleDefinition.fields)) {
    const path = pointer('', kind);
    if (!own(bundle, kind)) {
      add(errors, 'REQUIRED', path);
      validStructure = false;
    } else if (!envelopeBlocked.has(path)) {
      const document = Object.getOwnPropertyDescriptor(bundle, kind).value;
      if (kind === 'previousResult' && document === null) continue;
      const expected = kind === 'previousResult' ? 'result' : kind;
      const valid = documentStructure(document, expected, path, errors);
      if (valid) semantics[expected](document, path, errors);
      else validStructure = false;
    }
  }
  if (!validStructure) return output(errors);
  const {diagnostic, lesson, result, map, previousResult} = bundle;
  if (diagnostic.confirmation !== 'confirmed') add(errors, 'STATE', '/diagnostic/confirmation');
  if (lesson.diagnosticId !== diagnostic.diagnosticId) add(errors, 'REFERENCE', '/lesson/diagnosticId');
  if (lesson.candidateId !== diagnostic.selection) add(errors, 'REFERENCE', '/lesson/candidateId');
  if (lesson.contextKind !== diagnostic.contextKind) add(errors, 'REFERENCE', '/lesson/contextKind');
  for (const [kind, document] of [['lesson', lesson], ['result', result], ['map', map]]) if (document.profileId !== diagnostic.profileId) add(errors, 'PROFILE', `/${kind}/profileId`);
  lessonResult(result, lesson, '/result', errors);
  if (result.baseMapRevision !== map.revision) add(errors, 'REVISION', '/result/baseMapRevision');
  checkpoint(result, previousResult, '/result', errors);
  const existingResult = map.results.find(item => item.resultId === result.resultId);
  if (existingResult && !equal(existingResult, result)) add(errors, 'CONFLICT', '/result/resultId');
  const duplicate = existingResult ?? map.results.find(item => item.contentHash === result.contentHash);
  const existingLesson = map.lessons.find(item => item.lessonId === lesson.lessonId && item.lessonRevision === lesson.lessonRevision);
  if (existingLesson && !equal(existingLesson, lesson)) add(errors, 'CONFLICT', '/lesson/lessonRevision');
  const final = output(errors);
  return final.ok && duplicate ? {...final, duplicateOf: duplicate.resultId} : final;
}
