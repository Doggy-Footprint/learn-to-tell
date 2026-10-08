import {inspect, output} from './index.mjs';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const add = (errors, code, path) => void errors.push({code, path});
const own = (value, key) => Object.hasOwn(value, key);

// Reads only after `inspect` has proven the tree is plain data, so no getter can run here.
function shape(value, spec, path, errors) {
  if (spec === 'array' ? !Array.isArray(value) : spec === 'object' ? !isObject(value) : spec === 'null-number' ? value !== null && typeof value !== 'number' : typeof value !== spec) {
    add(errors, 'TYPE', path);
    return false;
  }
  return true;
}
function fields(value, spec, path, errors) {
  if (!shape(value, 'object', path, errors)) return false;
  let valid = true;
  for (const [key, type] of Object.entries(spec)) {
    if (!own(value, key)) {
      add(errors, 'REQUIRED', `${path}/${key}`);
      valid = false;
    } else if (typeof type === 'string') valid = shape(value[key], type, `${path}/${key}`, errors) && valid;
    else if (shape(value[key], 'array', `${path}/${key}`, errors)) {
      for (let index = 0; index < value[key].length; index++) valid = fields(value[key][index], type.items, `${path}/${key}/${index}`, errors) && valid;
    } else valid = false;
  }
  return valid;
}
function intake(value, name, spec, errors, skip) {
  const path = `/${name}`;
  if (!isObject(value)) return add(errors, 'TYPE', path);
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return add(errors, 'TYPE', path);
  const copy = Object.create(null);
  for (const key of Reflect.ownKeys(value)) if (key !== skip) Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(value, key));
  const start = errors.length;
  inspect(copy, path, 1, new Set(), new Set(), errors);
  if (errors.length === start && fields(copy, spec, path, errors)) return copy;
}
const lessonSpec = {version: 'number', modelId: 'string', modelRevision: 'number', inputs: {items: {inputId: 'string', min: 'number', max: 'number'}}, outputs: {items: {outputId: 'string', nullable: 'boolean'}}};

function lessonIntake(lesson, errors) {
  const head = intake(lesson, 'lesson', {version: 'number'}, errors);
  if (!head) return undefined;
  if (head.version !== 2 && head.version !== 3) return add(errors, 'VERSION', '/lesson/version');
  return intake(lesson, 'lesson', lessonSpec, errors);
}
function sameModel(subject, lesson, name, errors) {
  if (subject.modelId !== lesson.modelId) add(errors, 'REFERENCE', `/${name}/modelId`);
  if (subject.modelRevision !== lesson.modelRevision) add(errors, 'REVISION', `/${name}/modelRevision`);
}
function sameSet(ids, expected, path, errors) {
  const seen = new Set();
  ids.forEach((id, index) => {
    if (seen.has(id)) add(errors, 'DUPLICATE', `${path}/${index}`);
    seen.add(id);
    if (!expected.has(id)) add(errors, 'REFERENCE', `${path}/${index}`);
  });
  if ([...expected.keys()].some(id => !seen.has(id))) add(errors, 'REFERENCE', path);
}

export function validateModelBinding(declaration, lesson) {
  const errors = [];
  const model = intake(declaration, 'model', {modelId: 'string', modelRevision: 'number', inputIds: 'array', outputIds: 'array'}, errors, 'calculate');
  if (model) for (const key of ['inputIds', 'outputIds']) model[key].forEach((id, index) => shape(id, 'string', `/model/${key}/${index}`, errors));
  const document = lessonIntake(lesson, errors);
  if (model && document && errors.length === 0) {
    sameModel(model, document, 'model', errors);
    sameSet(model.inputIds, new Map(document.inputs.map(item => [item.inputId, item])), '/model/inputIds', errors);
    sameSet(model.outputIds, new Map(document.outputs.map(item => [item.outputId, item])), '/model/outputIds', errors);
  }
  return output(errors);
}

export function validateOracleBinding(oracle, lesson) {
  const errors = [];
  const spec = {modelId: 'string', modelRevision: 'number', cases: {items: {caseId: 'string', values: {items: {inputId: 'string', value: 'number'}}, expected: {items: {outputId: 'string', value: 'null-number'}}}}};
  const document = intake(oracle, 'oracle', spec, errors);
  const target = lessonIntake(lesson, errors);
  if (document && target && errors.length === 0) {
    sameModel(document, target, 'oracle', errors);
    const inputs = new Map(target.inputs.map(item => [item.inputId, item]));
    const outputs = new Map(target.outputs.map(item => [item.outputId, item]));
    const reached = new Set();
    document.cases.forEach((item, index) => {
      const base = `/oracle/cases/${index}`;
      item.values.forEach((entry, position) => {
        const input = inputs.get(entry.inputId);
        if (!input) return add(errors, 'REFERENCE', `${base}/values/${position}/inputId`);
        if (entry.value < input.min || entry.value > input.max) add(errors, 'RANGE', `${base}/values/${position}/value`);
        if (entry.value === input.min) reached.add(`min:${entry.inputId}`);
        if (entry.value === input.max) reached.add(`max:${entry.inputId}`);
      });
      item.expected.forEach((entry, position) => {
        const found = outputs.get(entry.outputId);
        if (!found) add(errors, 'REFERENCE', `${base}/expected/${position}/outputId`);
        else if (entry.value === null && !found.nullable) add(errors, 'STATE', `${base}/expected/${position}/value`);
      });
      for (const [list, key, known] of [['values', 'inputId', inputs], ['expected', 'outputId', outputs]]) {
        const ids = item[list].map(entry => entry[key]);
        if (new Set(ids).size !== ids.length || [...known.keys()].some(id => !ids.includes(id))) add(errors, 'STATE', `${base}/${list}`);
      }
    });
    if ([...inputs.keys()].some(id => !reached.has(`min:${id}`) || !reached.has(`max:${id}`))) add(errors, 'STATE', '/oracle/cases');
  }
  return output(errors);
}
