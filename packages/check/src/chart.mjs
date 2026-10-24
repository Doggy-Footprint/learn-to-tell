import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import * as vega from 'vega';
import { compile } from 'vega-lite';
import { issue, errorMessage } from './issue.mjs';

export const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

const require = createRequire(import.meta.url);
let validator = null;

function getValidator() {
  if (validator === null) {
    // vega-lite's package exports map build/vega-lite-schema.json to this subpath only.
    const schema = JSON.parse(readFileSync(require.resolve('vega-lite/vega-lite-schema.json'), 'utf8'));
    // logger: false — otherwise Ajv prints "unknown format" warnings for the VL schema to the console.
    const ajv = new Ajv({ strict: false, allowUnionTypes: true, logger: false });
    validator = ajv.compile(schema);
  }
  return validator;
}

// One shared method for every logger slot, so silenced log levels add no uncallable functions.
function returnThis() {
  return this;
}

const silentVlLogger = { level: returnThis, error: returnThis, warn: returnThis, info: returnThis, debug: returnThis };

// Vega's dataflow routes evaluation errors to logger.error instead of rejecting runAsync,
// so the logger captures them to surface as chart-build. Vega invokes these methods with
// `this` bound to the View, hence the closure over `errors`.
function capturingLogger() {
  const errors = [];
  return {
    errors,
    level: returnThis,
    error(...args) {
      const err = args.find((a) => a instanceof Error);
      errors.push(err ? errorMessage(err) : args.map(String).join(' '));
      return this;
    },
    warn: returnThis,
    info: returnThis,
    debug: returnThis,
  };
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function hasDataUrl(value) {
  if (Array.isArray(value)) return value.some(hasDataUrl);
  if (!isPlainObject(value)) return false;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'data' && isPlainObject(child) && Object.hasOwn(child, 'url')) return true;
    if (hasDataUrl(child)) return true;
  }
  return false;
}

export function pointsOf(spec) {
  const usermeta = spec.usermeta;
  if (!isPlainObject(usermeta)) return undefined;
  const ltt = usermeta.ltt;
  if (!isPlainObject(ltt)) return undefined;
  return ltt.points;
}

async function runView(runtime, signals) {
  const logger = capturingLogger();
  const view = new vega.View(runtime, { renderer: 'none', logger, logLevel: vega.None });
  try {
    for (const [name, value] of signals) view.signal(name, value);
    await view.runAsync();
    if (logger.errors.length > 0) throw new Error(logger.errors[0]);
    return view;
  } catch (err) {
    view.finalize();
    throw err;
  }
}

// Compiled mark names follow Vega-Lite's internal `<name>_marks` convention; it is not a
// documented contract, which is why vega-lite is pinned to an exact version.
function findMark(marks, name) {
  for (const mark of marks ?? []) {
    if (mark.name === name) return mark;
    const found = findMark(mark.marks, name);
    if (found) return found;
  }
  return null;
}

function validatePoint(point, index, seenIds) {
  const bad = () => {
    const fields = {};
    if (isPlainObject(point) && typeof point.id === 'string') fields.point = point.id;
    return fields;
  };
  if (!isPlainObject(point)) return bad();
  const { id } = point;
  const valid =
    typeof id === 'string' &&
    ID_PATTERN.test(id) &&
    !seenIds.has(id) &&
    typeof point.mark === 'string' &&
    point.mark !== '' &&
    typeof point.field === 'string' &&
    point.field !== '' &&
    isPlainObject(point.where) &&
    (point.params === undefined || isPlainObject(point.params)) &&
    isFiniteNumber(point.value) &&
    isFiniteNumber(point.tol) &&
    point.tol >= 0;
  if (typeof id === 'string' && ID_PATTERN.test(id)) seenIds.add(id);
  return valid ? null : bad();
}

function rowMatches(row, where) {
  return Object.entries(where).every(([f, w]) => {
    const v = row[f];
    if (typeof w === 'number' && typeof v === 'number') return Math.abs(v - w) <= 1e-9 * Math.max(1, Math.abs(w));
    return v === w;
  });
}

async function evaluatePoint(ctx, point, index, seenIds) {
  const { chartId, spec, vgSpec, runtime } = ctx;
  const invalid = validatePoint(point, index, seenIds);
  if (invalid) {
    return {
      error: issue('point-invalid', `point at index ${index} does not follow the point format`, {
        chart: chartId,
        ...invalid,
        actual: index,
      }),
    };
  }
  const loc = { chart: chartId, point: point.id };
  const mark = findMark(vgSpec.marks, `${point.mark}_marks`);
  const datasets = new Set((vgSpec.data ?? []).map((d) => d.name));
  const dataName = mark?.from?.data;
  if (!mark || typeof dataName !== 'string' || !datasets.has(dataName)) {
    return {
      error: issue('point-mark', `no unit view named "${point.mark}" with a top-level dataset`, {
        ...loc,
        actual: point.mark,
      }),
    };
  }
  const topParams = new Map();
  if (Array.isArray(spec.params)) {
    for (const p of spec.params) {
      if (isPlainObject(p) && typeof p.name === 'string' && p.select === undefined) topParams.set(p.name, p);
    }
  }
  const params = point.params ?? {};
  for (const [key, value] of Object.entries(params)) {
    const param = topParams.get(key);
    if (!param) {
      return {
        error: issue('point-param-unknown', `"${key}" is not a top-level non-selection param`, {
          ...loc,
          actual: key,
        }),
      };
    }
    const bind = param.bind;
    if (isPlainObject(bind) && bind.input === 'range' && typeof bind.min === 'number' && typeof bind.max === 'number') {
      if (!(typeof value === 'number' && value >= bind.min && value <= bind.max)) {
        return {
          error: issue('point-param-range', `param "${key}" is outside its slider range`, {
            ...loc,
            expected: [bind.min, bind.max],
            actual: value,
          }),
        };
      }
    }
  }
  let rows;
  try {
    const view = await runView(runtime, Object.entries(params));
    try {
      rows = view.data(dataName).filter((row) => rowMatches(row, point.where));
    } finally {
      view.finalize();
    }
  } catch (err) {
    return { error: issue('chart-build', `building the view for the point failed`, { ...loc, actual: errorMessage(err) }) };
  }
  if (rows.length !== 1) {
    return {
      error: issue('point-row', `"where" must match exactly 1 row of "${dataName}", matched ${rows.length}`, {
        ...loc,
        actual: rows.length,
      }),
    };
  }
  const rowValue = rows[0][point.field];
  if (!isFiniteNumber(rowValue)) {
    return {
      error: issue('point-mismatch', `field "${point.field}" of the matched row is not a finite number`, {
        ...loc,
        expected: point.value,
        actual: String(rowValue),
      }),
    };
  }
  const result = { value: rowValue };
  if (Math.abs(rowValue - point.value) > point.tol) {
    result.error = issue('point-mismatch', `field "${point.field}" is ${rowValue}, expected ${point.value} ± ${point.tol}`, {
      ...loc,
      expected: point.value,
      actual: rowValue,
    });
  }
  return result;
}

export async function checkChart(chart, seenChartIds) {
  const errors = [];
  const chartId = chart.id;
  let spec;
  let jsonOk = false;
  if (chart.isJsonScript) {
    try {
      spec = JSON.parse(chart.text);
      jsonOk = isPlainObject(spec);
    } catch {
      jsonOk = false;
    }
  }
  const result = { errors, valid: false, spec: jsonOk ? spec : undefined, evaluated: new Map() };
  if (!jsonOk) errors.push(issue('chart-json', 'chart must be <script type="application/json"> holding a JSON object', { chart: chartId }));
  if (!ID_PATTERN.test(chartId) || seenChartIds.has(chartId)) {
    errors.push(issue('chart-id', `chart id "${chartId}" is invalid or repeats an earlier chart id`, { chart: chartId, actual: chartId }));
  }
  seenChartIds.add(chartId);
  if (errors.length > 0) return result;
  result.valid = true;

  let blocked = false;
  if (hasDataUrl(spec)) {
    errors.push(issue('chart-url', 'chart data must be inline; external "url" data is not allowed', { chart: chartId }));
    blocked = true;
  }
  const validate = getValidator();
  if (!validate(spec)) {
    const actual = (validate.errors ?? []).slice(0, 5).map((e) => ({ instancePath: e.instancePath, message: e.message ?? '' }));
    errors.push(issue('chart-schema', 'chart spec does not validate against the Vega-Lite schema', { chart: chartId, actual }));
    blocked = true;
  }

  let ctx = null;
  if (!blocked) {
    try {
      const vgSpec = compile(spec, { logger: silentVlLogger }).spec;
      const runtime = vega.parse(vgSpec);
      const view = await runView(runtime, []);
      view.finalize();
      ctx = { chartId, spec, vgSpec, runtime };
    } catch (err) {
      errors.push(issue('chart-build', 'compiling or running the chart failed', { chart: chartId, actual: errorMessage(err) }));
    }
  }

  const points = pointsOf(spec);
  if (!Array.isArray(points) || points.length === 0) {
    errors.push(issue('chart-no-points', 'usermeta.ltt.points must be a non-empty array', { chart: chartId }));
    return result;
  }
  if (!ctx) return result;
  const seenIds = new Set();
  for (let i = 0; i < points.length; i += 1) {
    const r = await evaluatePoint(ctx, points[i], i, seenIds);
    if (r.error) errors.push(r.error);
    if (r.value !== undefined && !result.evaluated.has(points[i].id)) result.evaluated.set(points[i].id, r.value);
  }
  return result;
}
