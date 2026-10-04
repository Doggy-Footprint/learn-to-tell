const fields = ['defectPercent', 'detectionPercent', 'falsePositivePercent'];
const defaults = {defectPercent: 1, detectionPercent: 90, falsePositivePercent: 5};
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const own = (object, key) => Object.hasOwn(object, key);
const child = (path, key) => `${path}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;
const add = (errors, code, path) => errors.push({code, path});
const plain = value => value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

function record(value, schema, path, errors, exact = true) {
  if (!plain(value)) {
    add(errors, 'TYPE', path);
    return null;
  }
  const result = {};
  const blocked = new Set();
  for (const key of Reflect.ownKeys(value)) {
    const target = typeof key === 'symbol' ? path : child(path, key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === 'symbol' || !own(descriptor, 'value')) {
      add(errors, 'TYPE', target);
      blocked.add(key);
    } else if (exact && !own(schema, key)) add(errors, 'UNKNOWN_FIELD', target);
  }
  for (const [key, type] of Object.entries(schema)) {
    const target = child(path, key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) add(errors, 'REQUIRED', target);
    else if (!blocked.has(key)) {
      const item = descriptor.value;
      if (type === 'array' ? !Array.isArray(item) : type === 'object' ? !plain(item) : typeof item !== type || (type === 'number' && !Number.isFinite(item))) add(errors, 'TYPE', target);
      else result[key] = item;
    }
  }
  return result;
}

function finish(errors) {
  const unique = new Map(errors.map(error => [`${error.code}\u0000${error.path}`, error]));
  const sorted = [...unique.values()].sort((left, right) => left.code < right.code ? -1 : left.code > right.code ? 1 : left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  return {ok: sorted.length === 0, errors: sorted};
}

export const inspectionModel = {
  modelId: 'manufacturing-inspection',
  modelRevision: 1,
  sampleSize: 10000,
  simulationContentId: 'inspection-simulation',
  inputIds: {defectPercent: 'defect-percent', detectionPercent: 'detection-percent', falsePositivePercent: 'false-positive-percent'},
};

export function calculateInspection(inputs) {
  const errors = [];
  const values = record(inputs, Object.fromEntries(fields.map(field => [field, 'number'])), '', errors);
  if (values) {
    for (const field of fields) if (own(values, field) && (values[field] < 0 || values[field] > 100)) add(errors, 'RANGE', child('', field));
  }
  if (errors.length) return finish(errors);
  const p = values.defectPercent / 100;
  const s = values.detectionPercent / 100;
  const f = values.falsePositivePercent / 100;
  const sampleSize = 10000;
  const truePositive = sampleSize * p * s;
  const falsePositive = sampleSize * (1 - p) * f;
  const falseNegative = sampleSize * p * (1 - s);
  const trueNegative = sampleSize * (1 - p) * (1 - f);
  const positiveCount = truePositive + falsePositive;
  return {ok: true, value: {sampleSize, truePositive, falsePositive, falseNegative, trueNegative, positiveCount, positivePredictiveValue: positiveCount === 0 ? null : truePositive / positiveCount, accuracy: (truePositive + trueNegative) / sampleSize}};
}

function collection(value, schema, path, errors) {
  const items = [];
  for (const key of Reflect.ownKeys(value)) {
    if (key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === 'symbol' || !/^(0|[1-9][0-9]*)$/.test(key) || !own(descriptor, 'value')) add(errors, 'TYPE', typeof key === 'symbol' ? path : child(path, key));
  }
  for (let index = 0; index < value.length; index++) {
    const target = child(path, index);
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor) add(errors, 'TYPE', target);
    else if (own(descriptor, 'value')) {
      const item = record(descriptor.value, schema, target, errors, false);
      if (item) items.push({item, path: target});
    }
  }
  return items;
}

export function validateSimulationBinding(model, lesson) {
  const errors = [];
  const declaration = record(model, {modelId: 'string', modelRevision: 'number', sampleSize: 'number', simulationContentId: 'string', inputIds: 'object'}, '/model', errors);
  let inputIds;
  if (declaration && own(declaration, 'inputIds')) inputIds = record(declaration.inputIds, Object.fromEntries(fields.map(field => [field, 'string'])), '/model/inputIds', errors);
  const modelStructureValid = errors.length === 0;
  const lessonStart = errors.length;
  const document = record(lesson, {content: 'array', inputs: 'array'}, '/lesson', errors, false);
  let content;
  let inputs;
  if (document && own(document, 'content')) content = collection(document.content, {contentId: 'string', role: 'string'}, '/lesson/content', errors);
  if (document && own(document, 'inputs')) inputs = collection(document.inputs, {inputId: 'string', unit: 'string', min: 'number', max: 'number', default: 'number'}, '/lesson/inputs', errors);
  const lessonStructureValid = errors.length === lessonStart;
  const semanticsStart = errors.length;
  if (modelStructureValid) {
    if (declaration.modelId !== 'manufacturing-inspection') add(errors, 'KIND', '/model/modelId');
    if (declaration.modelRevision !== 1) add(errors, 'VERSION', '/model/modelRevision');
    if (declaration.sampleSize !== 10000) add(errors, 'RANGE', '/model/sampleSize');
    if (!idPattern.test(declaration.simulationContentId)) add(errors, 'VALUE', '/model/simulationContentId');
    const seen = new Set();
    for (const field of fields) {
      const path = child('/model/inputIds', field);
      if (!idPattern.test(inputIds[field])) add(errors, 'VALUE', path);
      else {
        if (seen.has(inputIds[field])) add(errors, 'DUPLICATE', path);
        seen.add(inputIds[field]);
      }
    }
  }
  if (modelStructureValid && lessonStructureValid && errors.length === semanticsStart) {
    if (idPattern.test(declaration.simulationContentId)) {
      const target = content.find(({item}) => item.contentId === declaration.simulationContentId);
      if (!target || target.item.role !== 'simulation') add(errors, 'REFERENCE', '/model/simulationContentId');
    }
    for (const field of fields) {
      if (!idPattern.test(inputIds[field])) continue;
      const target = inputs.find(({item}) => item.inputId === inputIds[field]);
      if (!target) add(errors, 'REFERENCE', child('/model/inputIds', field));
      else {
        if (target.item.unit !== '%') add(errors, 'VALUE', child(target.path, 'unit'));
        for (const [key, expected] of [['min', 0], ['max', 100], ['default', defaults[field]]]) if (target.item[key] !== expected) add(errors, 'RANGE', child(target.path, key));
      }
    }
  }
  return finish(errors);
}
