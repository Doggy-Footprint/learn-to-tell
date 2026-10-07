import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as contractsIndex from '../contracts/index.mjs';
import {inspectionLesson} from '../examples/manufacturing-inspection/lesson.mjs';
import {fixed} from './fixtures/simulation/cases.mjs';
import {cases, mxExpected, mxInputIds, mxLesson, mxOracle, mxDeclaration, clone, EPS, CARD_FIELDS} from './fixtures/contracts-v2/cases.mjs';

const attempt = async path => { try { return await import(path); } catch (error) { return {loadError: error}; } };
const modelContract = await attempt('../contracts/model.mjs');
const modelExample = await attempt('../examples/manufacturing-inspection/model.mjs');
const lessonV2Module = await attempt('../examples/manufacturing-inspection/lesson-v2.mjs');
const oracleJson = (() => { try { return JSON.parse(readFileSync(new URL('../examples/manufacturing-inspection/oracle.json', import.meta.url), 'utf8')); } catch { return null; } })();
const manifest = JSON.parse(readFileSync(new URL('./fixtures/contracts-v2/manifest.json', import.meta.url), 'utf8'));

const declaredItems = (() => {
  const items = ['V1.v1', 'V1.v2', 'V1.0', 'V1.3', 'V1.str2'];
  for (const f of CARD_FIELDS) for (const c of ['valid', 'missing', 'blank', 'number']) items.push(`T53-V1.${f}.${c}`);
  items.push('T53-V1.v1-card-fields');
  for (const id of mxInputIds) for (const b of ['min', 'max']) for (const v of ['minus', 'eq', 'plus']) items.push(`V2.bva.${id}.${b}-${v}`);
  items.push('V2.absolute.minus', 'V2.absolute.zero', 'V2.c3');
  for (const r of ['required-minutes-14', 'missing-stage', 'missing-dimension', 'role-mismatch-reference']) items.push(`V2.v1rule.${r}`);
  for (const r of ['duplicate-output', 'duplicate-scenario', 'scenario-input-unknown', 'scenario-missing-input', 'scenario-duplicate-input', 'transfer-scenario-unknown', 'tolerance-output-unknown', 'tolerance-duplicate-output', 'tolerance-missing-output', 'scale-zero', 'scale-negative']) items.push(`V2.f3.${r}`);
  items.push('V3.null.nullable-null', 'V3.null.nullable-value', 'V3.null.strict-null', 'V3.null.strict-value');
  for (const id of mxInputIds) for (const b of ['min', 'max']) for (const p of ['present', 'absent']) items.push(`V3.cover.${id}.${b}.${p}`);
  for (const r of ['modelId', 'modelRevision', 'inputId', 'outputId', 'range']) items.push(`V3.ref.${r}`);
  items.push('V3.f4.absolute-negative');
  items.push('V4.match', 'V4.modelId', 'V4.revision', 'V4.input-missing', 'V4.input-extra', 'V4.output-missing', 'V4.output-extra', 'V4.non-object', 'V4.field-missing', 'V4.field-type');
  for (const l of ['v1', 'v2']) items.push(`V5.lesson.${l}`, `V5.result.${l}`);
  for (const o of ['duplicate', 'conflict', 'ok']) items.push(`V5.outcome.${o}`);
  for (const k of ['getter', 'symbol', 'cycle', 'depth', 'length', 'non-plain']) items.push(`V8.${k}`);
  // T5-4 spec 7e3b1a94c2d05f68: O1 classification tree + boundaries, O2 decision-table rows (written from the spec, not from the fixtures).
  items.push('T54-O1.version.1', 'T54-O1.version.2', 'T54-O1.version.3', 'T54-O1.presence.v1-with-reactions', 'T54-O1.presence.v2-without-reactions', 'T54-O1.reactions.len0', 'T54-O1.reactions.len1');
  for (const c of ['valid', 'invalid-0', 'invalid-3', 'invalid-1.5', 'invalid-string-1']) items.push(`T54-O1.round.${c}`);
  items.push('T54-O1.reaction.valid', 'T54-O1.reaction.invalid', 'T54-O1.reaction.all-four', 'T54-O1.askedBack.string', 'T54-O1.askedBack.null', 'T54-O1.askedBack.invalid-number', 'T54-O1.askedBack.invalid-missing', 'T54-O1.unknownKey.invalid');
  items.push('T54-O2.row1.duplicate-pair', 'T54-O2.row2.max-round-reference', 'T54-O2.row3.only-max-round', 'T54-O2.row4.lower-round-valid-id', 'T54-O2.row5.lower-round-bad-id', 'T54-O2.row6.selection-null');
  // T5-4 concept ladder spec 5a2c9e7d1b4f8036: O1 classification tree + length/presence boundaries, O2 step boundaries, duplicates, A1.
  items.push('T54L-O1.presence.v2-with', 'T54L-O1.presence.v1-without', 'T54L-O1.presence.v1-with', 'T54L-O1.presence.v2-without');
  for (const n of [0, 1, 5, 6]) items.push(`T54L-O1.len.${n}`);
  for (const f of ['step', 'conceptId', 'label']) items.push(`T54L-O1.${f}.valid`);
  items.push('T54L-O1.step.invalid-1.5', 'T54L-O1.step.invalid-string-1', 'T54L-O1.conceptId.invalid', 'T54L-O1.label.invalid-missing');
  for (const a of ['known', 'vague', 'unknown']) items.push(`T54L-O1.answer.${a}`);
  items.push('T54L-O1.answer.invalid', 'T54L-O1.askedBack.string', 'T54L-O1.askedBack.null', 'T54L-O1.askedBack.invalid-number', 'T54L-O1.askedBack.invalid-missing', 'T54L-O1.unknownKey.invalid', 'T54L-O1.answers.all-known', 'T54L-O1.answers.all-unknown');
  for (const n of [0, 1, 5, 6]) items.push(`T54L-O2.step.${n}`);
  items.push('T54L-O2.dup.step', 'T54L-O2.dup.conceptId', 'T54L-O2.order.non-contiguous', 'T54L-O2.order.reverse');
  // Item-position variation (verifier F-T54L-1): the invalid item also sits at index 2 of a valid 3-item ladder.
  for (const r of ['step.invalid-1.5', 'step.invalid-string-1', 'conceptId.invalid', 'label.invalid-missing', 'answer.invalid', 'askedBack.invalid-number', 'askedBack.invalid-missing', 'unknownKey.invalid']) items.push(`T54L-O1.${r}@2`);
  for (const n of [0, 1, 5, 6]) items.push(`T54L-O2.step.${n}@2`);
  return items;
})();
const caseItemNames = () => new Set(cases.flatMap(c => c.items));

export function checkManifest(rows, items = cases) {
  assert.equal(new Set(rows.map(r => r.id)).size, rows.length, 'duplicate manifest id');
  assert.deepEqual(rows.map(r => r.id).sort(), items.map(c => c.id).sort(), 'every evidence case must be declared');
  for (const row of rows) {
    const item = items.find(c => c.id === row.id);
    assert.equal(row.obligationId, item.obligationId);
    assert.deepEqual(row.items, item.items);
  }
}
test('manifest is complete and removing any declared case fails the check', () => {
  checkManifest(manifest);
  for (const row of manifest) {
    assert.throws(() => checkManifest(manifest.filter(r => r.id !== row.id)), {name: 'AssertionError'});
    assert.throws(() => checkManifest(manifest, cases.filter(c => c.id !== row.id)), {name: 'AssertionError'});
  }
});
test('every spec-declared coverage item is exercised by at least one case', () => {
  const have = caseItemNames();
  const missing = declaredItems.filter(i => !have.has(i));
  assert.deepEqual(missing, []);
  assert.equal(declaredItems.filter(i => i.startsWith('V2.bva.')).length, 18);
});

function freeze(value, seen = new Set()) {
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    for (const d of Object.values(Object.getOwnPropertyDescriptors(value))) if ('value' in d) freeze(d.value, seen);
    Object.freeze(value);
  }
  return value;
}
function snapshot(root) {
  const seen = new Map(), records = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return {ref: seen.get(value)};
    const id = records.length; seen.set(value, id); records.push(null);
    records[id] = {prototype: Object.getPrototypeOf(value), descriptors: Reflect.ownKeys(value).map(key => { const d = Object.getOwnPropertyDescriptor(value, key); return [key, 'value' in d ? {...d, value: visit(d.value)} : d]; })};
    return {ref: id};
  }
  visit(root); return records;
}
const rooted = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);
// The spec leaves the root prefix of oracle-binding paths open (/cases vs /oracle/cases); prefix-style expectations accept both,
// exact-path expectations (`path:`) stay literal.
const under = (path, prefix) => rooted(path, prefix) || rooted(path.replace(/^\/oracle(?=\/)/, ''), prefix);
function matches(error, m) {
  if (!([].concat(m.code)).includes(error.code)) return false;
  if (m.path !== undefined) return error.path === m.path;
  if (m.under !== undefined) return under(error.path, m.under);
  if (m.re) return m.re.test(error.path);
  return true;
}
const byCodePath = (a, b) => a.code.localeCompare(b.code) || a.path.localeCompare(b.path);
function assertExpect(actual, expect) {
  assert.equal(typeof actual?.ok, 'boolean', 'result.ok is boolean');
  assert.ok(Array.isArray(actual.errors));
  for (const e of actual.errors) { assert.deepEqual(Object.keys(e).sort(), ['code', 'path']); assert.equal(typeof e.code, 'string'); assert.equal(typeof e.path, 'string'); }
  assert.deepEqual(actual.errors, [...actual.errors].sort(byCodePath), 'errors sorted by code then path');
  assert.equal(new Set(actual.errors.map(e => `${e.code}\u0000${e.path}`)).size, actual.errors.length, 'errors deduplicated');
  if (expect.parity) { assert.equal(expect.parity.ok, false, 'v1 oracle mutation must be rejected'); assert.deepEqual(actual, expect.parity); return; }
  if (expect.ok) { assert.deepEqual(actual, {ok: true, errors: [], ...(expect.duplicateOf ? {duplicateOf: expect.duplicateOf} : {})}); return; }
  assert.equal(actual.ok, false);
  assert.deepEqual(Object.keys(actual).sort(), ['errors', 'ok']);
  if (expect.exact) {
    assert.equal(actual.errors.length, expect.exact.length, `expected exactly ${expect.exact.length} error(s), got ${JSON.stringify(actual.errors)}`);
    const pool = [...actual.errors];
    for (const m of expect.exact) { const i = pool.findIndex(e => matches(e, m)); assert.ok(i >= 0, `no error matches ${String(m.code)} ${m.path ?? m.under ?? m.re} in ${JSON.stringify(actual.errors)}`); pool.splice(i, 1); }
  }
  for (const m of expect.has ?? []) assert.ok(actual.errors.some(e => matches(e, m)), `no error matches ${String(m.code)} ${m.path ?? m.under ?? m.re} in ${JSON.stringify(actual.errors)}`);
  if (expect.rejected) assert.ok(actual.errors.some(e => under(e.path, expect.rejected)), `no error under ${expect.rejected}: ${JSON.stringify(actual.errors)}`);
}

const runners = {
  diagnostic: x => contractsIndex.validateDocument(x, 'diagnostic'),
  lesson: x => contractsIndex.validateDocument(x, 'lesson'),
  oracle: x => contractsIndex.validateDocument(x, 'oracle'),
  map: x => contractsIndex.validateDocument(x, 'map'),
  bundle: x => contractsIndex.validateBundle(x),
  modelBinding: x => modelContract.validateModelBinding(x.declaration, x.lesson),
  oracleBinding: x => modelContract.validateOracleBinding(x.oracle, x.lesson),
  lessonParity: x => contractsIndex.validateDocument(x.v2, 'lesson'),
  oracleAny: x => {
    const a = contractsIndex.validateDocument(x.oracle, 'oracle'), b = modelContract.validateOracleBinding(x.oracle, x.lesson);
    const errors = [...a.errors, ...b.errors].sort(byCodePath);
    return {ok: a.ok && b.ok, errors: errors.filter((e, i) => i === 0 || e.code !== errors[i - 1].code || e.path !== errors[i - 1].path)};
  },
};

for (const c of cases) test(`${c.id} [${c.items.join(', ')}]`, () => {
  const {input, calls = () => 0} = c.build();
  freeze(input);
  const before = snapshot(input);
  let actual;
  assert.doesNotThrow(() => { actual = runners[c.surface](input); });
  assertExpect(actual, c.surface === 'lessonParity' ? {parity: contractsIndex.validateDocument(input.v1, 'lesson')} : c.expect);
  assert.deepEqual(runners[c.surface](input), actual, 'deterministic repeated call');
  assert.equal(calls(), 0, 'getter must never execute');
  assert.deepEqual(snapshot(input), before, 'input and nested descriptors unchanged');
  assert.ok(!JSON.stringify(actual).includes('SECRET-RESPONSE'), 'errors reveal only code and path');
});

// ---- V7: manufacturing-inspection materials ----
const pickLessonV2 = () => {
  assert.equal(lessonV2Module.loadError, undefined, 'lesson-v2.mjs must load');
  const found = Object.values(lessonV2Module).filter(v => v && typeof v === 'object' && v.kind === 'lesson' && v.version === 2);
  assert.equal(found.length, 1, 'exactly one exported v2 lesson object');
  return found[0];
};
const declarationOf = model => { const {calculate: _c, ...rest} = model; return rest; };
const aliases = {samplesize: 'sampleSize', n: 'sampleSize', truepositive: 'truePositive', tp: 'truePositive', falsepositive: 'falsePositive', fp: 'falsePositive', falsenegative: 'falseNegative', fn: 'falseNegative', truenegative: 'trueNegative', tn: 'trueNegative', positivecount: 'positiveCount', positivetotal: 'positiveCount', positives: 'positiveCount', ppv: 'positivePredictiveValue', positivepredictivevalue: 'positivePredictiveValue', accuracy: 'accuracy', overallaccuracy: 'accuracy'};
const quantityOf = outputId => { const q = aliases[outputId.toLowerCase().replace(/[^a-z]/g, '')]; assert.ok(q, `output id "${outputId}" is not recognised as a T2 quantity (sampleSize, TP, FP, FN, TN, positiveCount, PPV, accuracy)`); return q; };
const inputFields = ['defectPercent', 'detectionPercent', 'falsePositivePercent'];
const tupleOf = (lesson, c) => inputFields.map((_, i) => { const entry = c.values.filter(v => v.inputId === lesson.inputs[i].inputId); assert.equal(entry.length, 1); return entry[0].value; });
const near = (a, b) => b === null ? a === null : typeof a === 'number' && Math.abs(a - b) <= 1e-9;

test('V7.C2.lesson-v2 passes validateDocument and keeps the v1 inputs', () => {
  const lesson = pickLessonV2();
  assert.deepEqual(contractsIndex.validateDocument(lesson, 'lesson'), {ok: true, errors: []});
  assert.deepEqual(lesson.inputs, inspectionLesson.inputs);
});
test('V7.C2.oracle.json passes validateDocument as an oracle', () => {
  assert.ok(oracleJson, 'oracle.json readable');
  assert.deepEqual(contractsIndex.validateDocument(oracleJson, 'oracle'), {ok: true, errors: []});
});
test('V7.C2.declaration and oracle bind to the lesson', () => {
  const lesson = pickLessonV2();
  assert.equal(modelExample.loadError, undefined, 'model.mjs must load');
  const model = modelExample.model;
  assert.equal(typeof model.calculate, 'function');
  assert.deepEqual(modelContract.validateModelBinding(declarationOf(model), lesson), {ok: true, errors: []});
  assert.deepEqual(modelContract.validateOracleBinding(oracleJson, lesson), {ok: true, errors: []});
  assert.equal(model.modelId, lesson.modelId); assert.equal(model.modelRevision, lesson.modelRevision);
  assert.equal(oracleJson.modelId, lesson.modelId); assert.equal(oracleJson.modelRevision, lesson.modelRevision);
});
test('V7.C2.declaration and oracle are JSON-stable and frozen inputs stay unchanged', () => {
  const lesson = pickLessonV2(), declaration = declarationOf(modelExample.model);
  const bundle = {declaration: JSON.parse(JSON.stringify(declaration)), lesson: JSON.parse(JSON.stringify(lesson)), oracle: JSON.parse(JSON.stringify(oracleJson))};
  freeze(bundle); const before = snapshot(bundle);
  assert.deepEqual(modelContract.validateModelBinding(bundle.declaration, bundle.lesson), {ok: true, errors: []});
  assert.deepEqual(modelContract.validateOracleBinding(bundle.oracle, bundle.lesson), {ok: true, errors: []});
  assert.deepEqual(snapshot(bundle), before);
});
test('V7.lesson-v2 PPV output is nullable and every lesson output is a recognised T2 quantity', () => {
  const lesson = pickLessonV2();
  for (const o of lesson.outputs) quantityOf(o.outputId);
  const ppv = lesson.outputs.find(o => quantityOf(o.outputId) === 'positivePredictiveValue');
  assert.ok(ppv && ppv.nullable === true);
});
test('V7.oracle values equal the independent T2 expectations within 1e-9 (raw model values)', t => {
  const lesson = pickLessonV2(); const table = [];
  assert.ok(oracleJson.cases.length >= 1);
  for (const c of oracleJson.cases) {
    const expected = mxExpected(tupleOf(lesson, c));
    assert.equal(c.expected.length, lesson.outputs.length, `${c.caseId}: every output once`);
    for (const e of c.expected) { const q = quantityOf(e.outputId); assert.ok(near(e.value, expected[q]), `${c.caseId}/${e.outputId}: ${e.value} vs ${expected[q]}`); table.push([c.caseId, e.outputId, e.value, expected[q]]); }
  }
  t.diagnostic(JSON.stringify(table));
});
test('V7.oracle.contains the T2 baseline-a, population-contrast and candidate-b expectations from the simulation fixture', () => {
  const lesson = pickLessonV2();
  for (const [, name, values, expected] of fixed.filter(([, n]) => ['baseline-a', 'population-contrast', 'candidate-b'].includes(n))) {
    const found = oracleJson.cases.filter(c => tupleOf(lesson, c).every((v, i) => v === values[i]));
    assert.ok(found.length >= 1, `${name}: a case with inputs ${values} exists`);
    for (const c of found) for (const e of c.expected) { const q = quantityOf(e.outputId); assert.ok(near(e.value, expected[q]), `${name}/${e.outputId}`); }
    assert.equal(found[0].expected.length, lesson.outputs.length, `${name}: every lesson output present`);
  }
});
test('V7.oracle.contains a PPV null case and an input min/max boundary for each input', () => {
  const lesson = pickLessonV2();
  const ppvNull = oracleJson.cases.filter(c => c.expected.some(e => quantityOf(e.outputId) === 'positivePredictiveValue' && e.value === null));
  assert.ok(ppvNull.length >= 1);
  for (const c of ppvNull) assert.equal(mxExpected(tupleOf(lesson, c)).positivePredictiveValue, null, 'null only where TP+FP = 0');
  lesson.inputs.forEach((input, i) => { for (const bound of [input.min, input.max]) assert.ok(oracleJson.cases.some(c => tupleOf(lesson, c)[i] === bound), `${input.inputId} ${bound}`); });
});
test('V7.oracle.cases are independent-agent or model-author with a source and a non-negative tolerance', () => {
  for (const c of oracleJson.cases) { assert.ok(['model-author', 'independent-agent'].includes(c.author)); assert.ok(c.source.trim().length > 0); assert.ok(c.absolute >= 0); }
  assert.equal(new Set(oracleJson.cases.map(c => c.caseId)).size, oracleJson.cases.length);
});
test('V7.model.calculate signature smoke (characterises the Signature only; oracle comparison belongs to T5-2)', () => {
  const lesson = pickLessonV2(), model = modelExample.model;
  assert.deepEqual([...model.inputIds].sort(), lesson.inputs.map(i => i.inputId).sort());
  assert.deepEqual([...model.outputIds].sort(), lesson.outputs.map(o => o.outputId).sort());
  const tuple = [1, 90, 5];
  const values = Object.fromEntries(lesson.inputs.map((input, i) => [input.inputId, tuple[i]]));
  const frozen = freeze(structuredClone(values));
  const result = model.calculate(frozen);
  assert.equal(result.ok, true); assert.deepEqual(Object.keys(result).sort(), ['ok', 'value']);
  const expected = mxExpected(tuple);
  assert.deepEqual(Object.keys(result.value).sort(), lesson.outputs.map(o => o.outputId).sort());
  for (const o of lesson.outputs) assert.ok(near(result.value[o.outputId], expected[quantityOf(o.outputId)]), o.outputId);
  const nullCase = model.calculate(Object.fromEntries(lesson.inputs.map((input, i) => [input.inputId, [0, 90, 0][i]])));
  assert.equal(nullCase.value[lesson.outputs.find(o => quantityOf(o.outputId) === 'positivePredictiveValue').outputId], null);
  const failure = model.calculate(Object.fromEntries(lesson.inputs.map((input, i) => [input.inputId, i === 0 ? 100 + EPS : 1])));
  assert.equal(failure.ok, false);
  assert.ok(failure.errors.length >= 1);
  for (const e of failure.errors) assert.deepEqual(Object.keys(e).sort(), ['code', 'path']);
});
