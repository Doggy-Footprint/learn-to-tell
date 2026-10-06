import {isDeepStrictEqual} from 'node:util';

class Thrown extends Error {}

const epsilon = bound => Math.max(1e-9, Math.abs(bound) * 1e-9);
const finite = value => typeof value === 'number' && Number.isFinite(value);

function probeSet(lesson, oracle) {
  const defaults = Object.fromEntries(lesson.inputs.map(input => [input.inputId, input.default]));
  const sets = oracle.cases.map(item => Object.fromEntries(item.values.map(entry => [entry.inputId, entry.value])));
  for (const input of lesson.inputs) for (const key of ['min', 'max', 'default']) sets.push({...defaults, [input.inputId]: input[key]});
  for (const key of ['min', 'max']) sets.push(Object.fromEntries(lesson.inputs.map(input => [input.inputId, input[key]])));
  return {defaults, sets};
}

// `mark` runs before every calculate call so the parent can name the probe if the process dies mid-call.
export function runProbes(model, lesson, oracle, mark) {
  const errors = [];
  const add = (code, path) => void errors.push({code, path});
  const call = (values, path) => {
    mark(path);
    try {
      return model.calculate(values);
    } catch {
      throw new Thrown(path);
    }
  };
  const {defaults, sets} = probeSet(lesson, oracle);
  const outputs = lesson.outputs;
  try {
    oracle.cases.forEach((item, index) => {
      const result = call(structuredClone(sets[index]), `/cases/${index}`);
      item.expected.forEach((entry, position) => {
        const actual = result?.ok === true ? result.value?.[entry.outputId] : undefined;
        const matches = entry.value === null ? actual === null : typeof actual === 'number' && Math.abs(actual - entry.value) <= item.absolute;
        if (!matches) add('MISMATCH', `/cases/${index}/expected/${position}`);
      });
    });
    for (const input of lesson.inputs) {
      for (const [bound, shifted] of [['min', input.min - epsilon(input.min)], ['max', input.max + epsilon(input.max)]]) {
        const path = `/inputs/${input.inputId}/${bound}`;
        if (call({...defaults, [input.inputId]: shifted}, path)?.ok !== false) add('PROBE_RANGE', path);
      }
    }
    sets.forEach((values, index) => {
      const path = `/probes/${index}`;
      const snapshot = structuredClone(values);
      const first = call(values, path);
      if (!isDeepStrictEqual(values, snapshot)) add('MUTATION', path);
      if (!isDeepStrictEqual(first, call(structuredClone(snapshot), path))) add('NONDETERMINISTIC', path);
      if (first?.ok !== true) return;
      const value = first.value;
      const plain = value !== null && typeof value === 'object' && !Array.isArray(value);
      if (!plain || !isDeepStrictEqual(Object.keys(value).sort(), outputs.map(output => output.outputId).sort())) return add('SHAPE', path);
      for (const output of outputs) if (!finite(value[output.outputId]) && !(output.nullable && value[output.outputId] === null)) add('NON_FINITE', `${path}/${output.outputId}`);
    });
  } catch (error) {
    if (!(error instanceof Thrown)) throw error;
    add('THROW', error.message);
  }
  return errors;
}
