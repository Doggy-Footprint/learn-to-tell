import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile, mkdir} from 'node:fs/promises';
import {validateDocument} from '../contracts/index.mjs';
import {importResult} from '../knowledge/import.mjs';
import {readMap, writeMap} from '../knowledge/store.mjs';
import {planDelete, applyDelete} from '../knowledge/delete.mjs';
import {planRestore, applyRestore} from '../knowledge/restore.mjs';
import {summarize} from '../knowledge/summary.mjs';
import {profileDir} from '../knowledge/paths.mjs';
import {
  PROFILE, STATUSES, makeLesson, makeDiagnostic, tempHome, layout, makeChain, makeResult, item, obsId, mapFor, sortedObs, nextPath, wrapperText, tokenFor,
  placeFixtures, seedMapText, seedBackupText, readText, readDisk, listDir, backupGenerations, snapshot, strayFiles,
  truncatedText, noWrapperText, contractViolationText
} from './fixtures/knowledge/world.mjs';
import {recordingFs, faultFs} from './fixtures/knowledge/faults.mjs';

// Every ok:false Outcome observed by V4-V10 (Outcome-level only; writeMap's raw {ok,code} is not an Outcome).
const failures = [];
const note = (label, out) => { if (out && out.ok === false) failures.push({label, out}); return out; };
const tokenOf = out => {
  assert.equal(typeof out.token, 'string');
  assert.equal(out.preview.token, out.token, 'preview.token equals Outcome.token');
  return out.token;
};
const textOf = result => JSON.stringify(result);

const LEVELS = [
  [item(1, 'supported', 'a')],
  [item(1, 'supported', 'a'), item(2, 'partial', 'b')],
  [item(1, 'supported', 'a'), item(2, 'partial', 'b'), item(3, 'supported', 'a'), item(4, 'pending', 'b')]
];
const normalize = map => sortedObs(map);
async function expectDiskMap(home, generation, expectedMap) {
  const disk = await readDisk(home);
  assert.equal(disk.storage, 1);
  assert.equal(disk.generation, generation);
  assert.deepEqual(normalize(disk.map), normalize(expectedMap));
  assert.equal(validateDocument(disk.map, 'map').ok, true);
}

// ---------- V1 importResult decision table ----------
test('[V1.rule-1 no-map,new] imports into absent map as generation 1, revision untouched', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const [r1] = await makeChain([LEVELS[0]]);
  const out = await importResult(textOf(r1), {home});
  assert.equal(out.ok, true);
  assert.equal(out.action, 'imported');
  assert.equal(out.generation, 1);
  await expectDiskMap(home, 1, mapFor([r1], {revision: 1}));
  assert.deepEqual(await strayFiles(home), []);
});

// T5-4: the stored diagnostic may be v1 (no reactions) or v2 (reactions); import accepts both (R5, R6, Q1).
const diagnosticV2 = () => ({...makeDiagnostic(), version: 2, reactions: [
  {round: 1, candidateId: 'candidate-x', reaction: 'surprising', askedBack: '이 개념은 무엇인가요?'},
  {round: 2, candidateId: 'candidate-a', reaction: 'similar', askedBack: null}
], ladder: [
  {step: 3, conceptId: 'concept-mid', label: '중간 개념', answer: 'vague', askedBack: '이 개념은 무엇인가요?'},
  {step: 2, conceptId: 'concept-low', label: '낮은 개념', answer: 'known', askedBack: null},
  {step: 4, conceptId: 'concept-high', label: '높은 개념', answer: 'unknown', askedBack: null}
]});
for (const [label, make, version] of [['v1', makeDiagnostic, 1], ['v2', diagnosticV2, 2]]) {
  test(`[T54-Q1.import-diagnostic-${label}] a stored diagnostic of version ${version} lets the matching result import: imported, generation 1`, async t => {
    const home = await tempHome(t);
    await placeFixtures(home);
    const doc = make();
    assert.equal(doc.version, version);
    assert.equal('reactions' in doc, version === 2);
    assert.equal('ladder' in doc, version === 2, 'v1 carries no ladder (R4 compatibility), v2 carries one');
    await writeFile(path.join(layout(home).dir, 'diagnostics', 'diagnostic-a.json'), JSON.stringify(doc));
    const [r1] = await makeChain([LEVELS[0]]);
    const out = await importResult(textOf(r1), {home});
    assert.equal(out.ok, true, JSON.stringify(out));
    assert.equal(out.action, 'imported');
    assert.equal(out.generation, 1);
  });
}
test('[T54-O3.import-diagnostic-v2-invalid] a stored v2 diagnostic with a duplicate (round, candidateId) is INVALID under /diagnostic, nothing changes', async t => {
  const world = await rejectionWorld(t);
  const doc = diagnosticV2();
  doc.reactions = [doc.reactions[0], {...doc.reactions[0], reaction: 'unknown'}];
  await writeFile(path.join(layout(world.home).dir, 'diagnostics', 'diagnostic-a.json'), JSON.stringify(doc));
  world.before = await snapshot(world.home);
  const result = await makeResult({resultId: 'result-1', items: LEVELS[0]});
  await expectRejected(world, textOf(result), 'INVALID', errors => assert.ok(errors.some(e => e.code === 'DUPLICATE' && e.path === '/diagnostic/reactions/1'), JSON.stringify(errors)), 'T54-O3.import-v2-invalid');
});

const putDiagnostic = (home, doc) => writeFile(path.join(layout(home).dir, 'diagnostics', 'diagnostic-a.json'), JSON.stringify(doc));
for (const [name, edit, code, pointer] of [
  ['duplicate-step', d => { d.ladder = [{...d.ladder[0], step: 2}, d.ladder[1]]; }, 'DUPLICATE', '/diagnostic/ladder/1'],
  ['missing-ladder', d => { delete d.ladder; }, 'REQUIRED', '/diagnostic/ladder'],
  ['empty-ladder', d => { d.ladder = []; }, 'RANGE', '/diagnostic/ladder'],
  ['v1-with-ladder', d => { d.version = 1; delete d.reactions; }, 'UNKNOWN_FIELD', '/diagnostic/ladder'],
]) {
  test(`[T54L-O3.import-diagnostic-${name} C10 C12] a stored diagnostic with an invalid ladder is INVALID under /diagnostic, nothing changes`, async t => {
    const world = await rejectionWorld(t);
    const doc = diagnosticV2();
    edit(doc);
    await putDiagnostic(world.home, doc);
    world.before = await snapshot(world.home);
    const result = await makeResult({resultId: 'result-1', items: LEVELS[0]});
    await expectRejected(world, textOf(result), 'INVALID', errors => assert.ok(errors.some(e => e.code === code && e.path === pointer), JSON.stringify(errors)), `T54L-O3.import-${name}`);
  });
}
// Q2: the existing rename-failure injection on import, with a stored ladder v2 diagnostic; changed files must be 0.
test('[T54L-Q2.import-IO ladder v2] injected rename failure with a ladder diagnostic: IO, map bytes unchanged, no stray files', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  await putDiagnostic(home, diagnosticV2());
  const bytes = wrapperText(1, mapFor([]));
  await seedMapText(home, bytes);
  const [r1] = await makeChain([LEVELS[0]]);
  const {fs, events} = faultFs(home, {fail: 'rename'});
  const out = note('T54L-Q2.import-IO', await importResult(textOf(r1), {fs, home}));
  assert.ok(events.includes('rename'), 'fault rename never reached');
  assert.equal(out.ok, false);
  assert.equal(out.code, 'IO');
  assert.equal(await readText(layout(home).map), bytes);
  assert.deepEqual(await strayFiles(home), []);
});

test('[V1.rule-2 map,new] imports into existing map as generation+1, keeps revision and single lesson', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const [r1, r2] = await makeChain(LEVELS.slice(0, 2), {baseMapRevision: 4});
  await seedMapText(home, wrapperText(3, mapFor([r1], {revision: 4})));
  const out = await importResult(textOf(r2), {home});
  assert.equal(out.ok, true);
  assert.equal(out.action, 'imported');
  assert.equal(out.generation, 4);
  await expectDiskMap(home, 4, mapFor([r1, r2], {revision: 4}));
});

test('[V1.rule-3 same-id-same-content] duplicate leaves map.json bytes unchanged', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const [r1] = await makeChain([LEVELS[0]]);
  const bytes = wrapperText(2, mapFor([r1]));
  await seedMapText(home, bytes);
  const before = await snapshot(home);
  const out = await importResult(textOf(r1), {home});
  assert.deepEqual(out, {ok: true, action: 'duplicate', duplicateOf: 'result-1'});
  assert.equal(await readText(layout(home).map), bytes);
  assert.deepEqual(await snapshot(home), before);
});

test('[V1.rule-4 different-id-same-hash] duplicate of the existing id, no write', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const [r1] = await makeChain([LEVELS[0]]);
  const twin = {...r1, resultId: 'result-twin'};
  assert.equal(twin.contentHash, r1.contentHash);
  const bytes = wrapperText(2, mapFor([r1]));
  await seedMapText(home, bytes);
  const out = await importResult(textOf(twin), {home});
  assert.deepEqual(out, {ok: true, action: 'duplicate', duplicateOf: 'result-1'});
  assert.equal(await readText(layout(home).map), bytes);
});

// ---------- V2 observation creation ----------
const OBSERVED = new Set(['supported', 'partial']);
for (const status of STATUSES) {
  const expected = () => OBSERVED.has(status) ? [{observationId: 'obs-' + (obsId('result-1', 'assessment-1').slice(4)), resultId: 'result-1', assessmentId: 'assessment-1', conceptId: 'concept-b', conceptRevision: 2}] : [];
  test(`[V2.${status}/first-appearance] observation only for supported/partial, id and concept from response`, async t => {
    const home = await tempHome(t);
    await placeFixtures(home);
    await seedMapText(home, wrapperText(1, mapFor([])));
    const [r1] = await makeChain([[item(1, status, 'b')]]);
    const out = await importResult(textOf(r1), {home});
    assert.equal(out.ok, true);
    const disk = await readDisk(home);
    assert.deepEqual(disk.map.observations, expected());
  });
  test(`[V2.${status}/already-observed] checkpoint 2 repeating the assessment adds no observation`, async t => {
    const home = await tempHome(t);
    await placeFixtures(home);
    await seedMapText(home, wrapperText(1, mapFor([])));
    const [r1, r2] = await makeChain([[item(1, status, 'b')], [item(1, status, 'b')]]);
    assert.equal((await importResult(textOf(r1), {home})).ok, true);
    const second = await importResult(textOf(r2), {home});
    assert.equal(second.action, 'imported');
    const disk = await readDisk(home);
    assert.equal(disk.map.results.length, 2);
    assert.deepEqual(disk.map.observations, expected());
  });
}

test('[V2.supported/first-appearance in independent chain] same assessmentId in another chain is observed again', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  await seedMapText(home, wrapperText(1, mapFor([])));
  const [a1] = await makeChain([[item(1, 'supported')]]);
  const [b1] = await makeChain([[item(1, 'supported')]], {prefix: 'other-', salt: 'A different answer'});
  assert.equal((await importResult(textOf(a1), {home})).ok, true);
  assert.equal((await importResult(textOf(b1), {home})).ok, true);
  const ids = (await readDisk(home)).map.observations.map(o => o.observationId).sort();
  assert.deepEqual(ids, [obsId('result-1', 'assessment-1'), obsId('other-1', 'assessment-1')].sort());
});

test('[V2.pending/first-appearance C18] pending-only partial result creates zero observations', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  await seedMapText(home, wrapperText(1, mapFor([])));
  const r1 = await makeResult({resultId: 'result-1', items: [item(1, 'pending'), item(2, 'pending', 'b')], state: 'partial'});
  const out = await importResult(textOf(r1), {home});
  assert.equal(out.ok, true);
  assert.deepEqual((await readDisk(home)).map.observations, []);
});

// ---------- V3 checkpoint order ----------
test('[V3.∅→1] first checkpoint into a map without results', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  await seedMapText(home, wrapperText(1, mapFor([])));
  const chain = await makeChain(LEVELS);
  const out = await importResult(textOf(chain[0]), {home});
  assert.deepEqual([out.ok, out.action, out.generation], [true, 'imported', 2]);
  await expectDiskMap(home, 2, mapFor(chain.slice(0, 1)));
});
test('[V3.1→2] second checkpoint after first', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const chain = await makeChain(LEVELS);
  await seedMapText(home, wrapperText(1, mapFor(chain.slice(0, 1))));
  const out = await importResult(textOf(chain[1]), {home});
  assert.deepEqual([out.ok, out.action, out.generation], [true, 'imported', 2]);
  await expectDiskMap(home, 2, mapFor(chain.slice(0, 2)));
});
test('[V3.2→3] third checkpoint after second', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const chain = await makeChain(LEVELS);
  await seedMapText(home, wrapperText(2, mapFor(chain.slice(0, 2))));
  const out = await importResult(textOf(chain[2]), {home});
  assert.deepEqual([out.ok, out.action, out.generation], [true, 'imported', 3]);
  await expectDiskMap(home, 3, mapFor(chain));
});
test('[V3.∅→2 rejected] checkpoint 2 before 1: REFERENCE and next names result-1', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  await seedMapText(home, wrapperText(1, mapFor([])));
  const chain = await makeChain(LEVELS);
  const before = await snapshot(home);
  const out = note('V3.∅→2', await importResult(textOf(chain[1]), {home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'INVALID');
  assert.deepEqual(out.errors, [{code: 'REFERENCE', path: '/result/previousResultId'}]);
  assert.ok(out.next.includes('result-1'));
  assert.deepEqual(await snapshot(home), before);
});
test('[V3.1→3 rejected] checkpoint 3 with only 1 imported: REFERENCE and next names result-2', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const chain = await makeChain(LEVELS);
  await seedMapText(home, wrapperText(1, mapFor(chain.slice(0, 1))));
  const before = await snapshot(home);
  const out = note('V3.1→3', await importResult(textOf(chain[2]), {home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'INVALID');
  assert.deepEqual(out.errors, [{code: 'REFERENCE', path: '/result/previousResultId'}]);
  assert.ok(out.next.includes('result-2'));
  assert.deepEqual(await snapshot(home), before);
});
test('[V3.3 re-import] duplicate of checkpoint 3, bytes unchanged', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const chain = await makeChain(LEVELS);
  const bytes = wrapperText(3, mapFor(chain));
  await seedMapText(home, bytes);
  const out = await importResult(textOf(chain[2]), {home});
  assert.deepEqual(out, {ok: true, action: 'duplicate', duplicateOf: 'result-3'});
  assert.equal(await readText(layout(home).map), bytes);
});
test('[V3.chain 1→2→3 via import] observations equal independent oracle, no duplicates', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  await seedMapText(home, wrapperText(1, mapFor([])));
  const chain = await makeChain(LEVELS);
  for (const [k, result] of chain.entries()) {
    const out = await importResult(textOf(result), {home});
    assert.deepEqual([out.ok, out.action, out.generation], [true, 'imported', k + 2]);
  }
  await expectDiskMap(home, 4, mapFor(chain));
  const ids = (await readDisk(home)).map.observations.map(o => o.observationId);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 3);
});

// ---------- V4 import rejection ----------
async function rejectionWorld(t, {lesson = true, diagnostic = true} = {}) {
  const home = await tempHome(t);
  await placeFixtures(home, PROFILE, {lesson, diagnostic});
  const emptyBytes = wrapperText(3, mapFor([]));
  await seedMapText(home, emptyBytes);
  return {home, bytes: emptyBytes, before: await snapshot(home)};
}
async function expectRejected(world, text, code, errorsCheck, label) {
  const out = note(label, await importResult(text, {home: world.home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, code);
  if (errorsCheck) errorsCheck(out.errors);
  assert.equal(await readText(layout(world.home).map), world.bytes);
  assert.deepEqual(await snapshot(world.home), world.before);
  return out;
}
const hasError = (code, pathValue) => errors => assert.ok(errors.some(e => e.code === code && (pathValue === undefined || e.path === pathValue)), JSON.stringify(errors));

test('[V4.same-id-different-content] CONFLICT /result/resultId', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const [r1] = await makeChain([LEVELS[0]]);
  const bytes = wrapperText(2, mapFor([r1]));
  await seedMapText(home, bytes);
  const before = await snapshot(home);
  const other = await makeResult({resultId: 'result-1', items: LEVELS[0], state: 'partial'});
  assert.notEqual(other.contentHash, r1.contentHash);
  const out = note('V4.conflict', await importResult(textOf(other), {home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'INVALID');
  hasError('CONFLICT', '/result/resultId')(out.errors);
  assert.deepEqual(await snapshot(home), before);
});
test('[V4.other-profile] PROFILE error when result/lesson/diagnostic profiles disagree', async t => {
  const home = await tempHome(t);
  await placeFixtures(home, 'profile-b', {lesson: false});
  await mkdir(path.join(layout(home, 'profile-b').dir, 'lessons'), {recursive: true});
  await writeFile(path.join(layout(home, 'profile-b').dir, 'lessons', 'lesson-a.1.json'), JSON.stringify(makeLesson('profile-a')));
  await seedMapText(home, wrapperText(1, mapFor([], {profileId: 'profile-b'})), 'profile-b');
  const result = await makeResult({resultId: 'result-1', items: LEVELS[0], profileId: 'profile-b'});
  const before = await snapshot(home);
  const out = note('V4.profile', await importResult(textOf(result), {home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'INVALID');
  hasError('PROFILE')(out.errors);
  assert.deepEqual(await snapshot(home), before);
});
test('[V4.baseMapRevision≠revision] REVISION /result/baseMapRevision', async t => {
  const world = await rejectionWorld(t);
  const result = await makeResult({resultId: 'result-1', items: LEVELS[0], baseMapRevision: 2});
  await expectRejected(world, textOf(result), 'INVALID', hasError('REVISION', '/result/baseMapRevision'), 'V4.revision');
});
test('[V4.v1-result] VERSION /version', async t => {
  const world = await rejectionWorld(t);
  const result = await makeResult({resultId: 'result-1', items: LEVELS[0], version: 1});
  await expectRejected(world, textOf(result), 'INVALID', hasError('VERSION', '/version'), 'V4.v1');
});
test('[V4.HASH-tampered] HASH /contentHash only', async t => {
  const world = await rejectionWorld(t);
  const result = await makeResult({resultId: 'result-1', items: LEVELS[0]});
  result.contentHash = 'sha256-' + 'f'.repeat(64);
  await expectRejected(world, textOf(result), 'INVALID', errors => assert.deepEqual(errors, [{code: 'HASH', path: '/contentHash'}]), 'V4.hash');
});
test('[V4.broken-JSON] JSON error at root', async t => {
  const world = await rejectionWorld(t);
  await expectRejected(world, '{"kind":"result"', 'INVALID', errors => assert.deepEqual(errors, [{code: 'JSON', path: ''}]), 'V4.json');
});
test('[V4.lesson-missing] MISSING_LESSON', async t => {
  const world = await rejectionWorld(t, {lesson: false});
  const result = await makeResult({resultId: 'result-1', items: LEVELS[0]});
  await expectRejected(world, textOf(result), 'MISSING_LESSON', undefined, 'V4.lesson');
});
test('[V4.diagnostic-missing] MISSING_DIAGNOSTIC', async t => {
  const world = await rejectionWorld(t, {diagnostic: false});
  const result = await makeResult({resultId: 'result-1', items: LEVELS[0]});
  await expectRejected(world, textOf(result), 'MISSING_DIAGNOSTIC', undefined, 'V4.diagnostic');
});
for (const [label, file, pointer] of [['lesson', 'lessons/lesson-a.1.json', '/lesson'], ['diagnostic', 'diagnostics/diagnostic-a.json', '/diagnostic']]) {
  test(`[V4.${label}-broken-JSON] INVALID with exactly [JSON ${pointer}], nothing changes`, async t => {
    const world = await rejectionWorld(t);
    await writeFile(path.join(layout(world.home).dir, file), '{"kind":');
    world.before = await snapshot(world.home);
    const result = await makeResult({resultId: 'result-1', items: LEVELS[0]});
    await expectRejected(world, textOf(result), 'INVALID', errors => assert.deepEqual(errors, [{code: 'JSON', path: pointer}]), `V4.${label}-json`);
  });
}
const underPath = prefix => errors => {
  assert.ok(errors.length > 0);
  for (const e of errors) assert.ok(e.path === prefix || e.path.startsWith(prefix + '/'), JSON.stringify(e));
};
for (const [label, file, prefix, mutate, code, errPath] of [
  ['lesson-version-3', 'lessons/lesson-a.1.json', '/lesson', l => { l.version = 3; }, 'VERSION', '/lesson/version'],
  ['lesson-minutes-over-20', 'lessons/lesson-a.1.json', '/lesson', l => { for (const a of l.activities) a.minutes = 4; }, 'RANGE', '/lesson/activities'],
  ['diagnostic-version-3', 'diagnostics/diagnostic-a.json', '/diagnostic', d => { d.version = 3; }, 'VERSION', '/diagnostic/version']
]) {
  test(`[V4.${label}] valid JSON that breaks the ${prefix.slice(1)} contract: INVALID under ${prefix}, nothing changes`, async t => {
    const world = await rejectionWorld(t);
    const doc = prefix === '/lesson' ? makeLesson() : makeDiagnostic();
    mutate(doc);
    await writeFile(path.join(layout(world.home).dir, file), JSON.stringify(doc));
    world.before = await snapshot(world.home);
    const result = await makeResult({resultId: 'result-1', items: LEVELS[0]});
    await expectRejected(world, textOf(result), 'INVALID', errors => { underPath(prefix)(errors); hasError(code, errPath)(errors); }, `V4.${label}`);
  });
}
// V4.result-file-missing (IO) is a file-reading failure of the CLI: see tests/map-cli.test.mjs.

// ---------- V5 writeMap fault injection ----------
const mapA = mapFor([], {nextPaths: [nextPath('reason-a')]});
const mapB = mapFor([], {nextPaths: [nextPath('reason-b')]});
const bytesA = wrapperText(1, mapA);
async function faultWorld(t, {absent = false} = {}) {
  const home = await tempHome(t);
  if (!absent) await seedMapText(home, bytesA);
  return home;
}
test('[V5.baseline] no fault: ok, generation 2, backup holds previous bytes', async t => {
  const home = await faultWorld(t);
  const out = await writeMap(PROFILE, 1, mapB, {home});
  assert.deepEqual(out, {ok: true, generation: 2});
  await expectDiskMap(home, 2, mapB);
  assert.equal(await readText(layout(home).backup(1)), bytesA);
});
for (const point of ['mkdir', 'copy', 'open', 'write', 'sync', 'close', 'rename']) {
  test(`[V5.${point}] failure at ${point}: IO, map.json bytes unchanged, no temp`, async t => {
    const absent = point === 'mkdir';
    const home = await faultWorld(t, {absent});
    const {fs, events} = faultFs(home, {fail: point});
    const out = await writeMap(PROFILE, absent ? 0 : 1, mapB, {fs, home});
    assert.ok(events.includes(point), `fault ${point} never reached`);
    assert.equal(out.ok, false);
    assert.equal(out.code, 'IO');
    assert.equal(await readText(layout(home).map), absent ? null : bytesA);
    assert.deepEqual(await strayFiles(home), []);
  });
}
test('[V5.prune] backup cleanup failure after success: ok:true and map holds the new state', async t => {
  const home = await tempHome(t);
  for (let g = 1; g <= 5; g++) await seedBackupText(home, g, wrapperText(g, mapA));
  await seedMapText(home, wrapperText(6, mapA));
  const {fs, events} = faultFs(home, {fail: 'prune'});
  const out = await writeMap(PROFILE, 6, mapB, {fs, home});
  assert.ok(events.includes('prune'), 'fault prune never reached');
  assert.deepEqual(out, {ok: true, generation: 7});
  await expectDiskMap(home, 7, mapB);
  assert.deepEqual(await strayFiles(home), []);
});

// ---------- V6 concurrent write ----------
test('[V6.generation+1 injected before rename] STALE, injected content kept, no temp', async t => {
  const home = await faultWorld(t);
  const injected = wrapperText(2, mapFor([], {nextPaths: [nextPath('injected')]}));
  const {fs} = faultFs(home, {afterSync: () => writeFile(layout(home).map, injected)});
  const out = await writeMap(PROFILE, 1, mapB, {fs, home});
  assert.equal(out.ok, false);
  assert.equal(out.code, 'STALE');
  assert.equal(await readText(layout(home).map), injected);
  assert.deepEqual(await strayFiles(home), []);
});
test('[V6.same generation, different bytes] policy is by generation: write succeeds', async t => {
  const home = await faultWorld(t);
  const injected = JSON.stringify({storage: 1, generation: 1, map: mapA}, null, 2);
  assert.notEqual(injected, bytesA);
  let fired = false;
  const {fs} = faultFs(home, {afterSync: async () => { fired = true; await writeFile(layout(home).map, injected); }});
  const out = await writeMap(PROFILE, 1, mapB, {fs, home});
  assert.ok(fired);
  assert.deepEqual(out, {ok: true, generation: 2});
  await expectDiskMap(home, 2, mapB);
  assert.deepEqual(await strayFiles(home), []);
});

// ---------- V7 backup rotation ----------
test('[V7.4/5/6 backups] rotation keeps the newest 5 with the exact previous bytes', async t => {
  const home = await tempHome(t);
  const bytesAt = {};
  for (let k = 1; k <= 12; k++) {
    const out = await writeMap(PROFILE, k - 1, mapFor([], {nextPaths: [nextPath(`reason-${k}`)]}), {home});
    assert.deepEqual(out, {ok: true, generation: k});
    bytesAt[k] = await readText(layout(home).map);
    const expectedGens = [];
    for (let g = Math.max(1, k - 5); g <= k - 1; g++) expectedGens.push(g);
    if (k >= 5) {
      assert.deepEqual(await backupGenerations(home), expectedGens, `after write ${k}`);
      for (const g of expectedGens) assert.equal(await readText(layout(home).backup(g)), bytesAt[g]);
      assert.equal(expectedGens.length, k === 5 ? 4 : 5);
      assert.deepEqual((await listDir(layout(home).backups)).map(n => Number(/^map\.(\d+)\.json$/.exec(n)[1])).sort((a, b) => a - b), expectedGens);
    }
  }
  assert.deepEqual(await strayFiles(home), []);
});

// ---------- V8 delete ----------
async function deleteWorld(t) {
  const home = await tempHome(t);
  const chain = await makeChain(LEVELS);
  const seeded = {1: mapFor([]), 2: mapFor(chain.slice(0, 1)), 3: mapFor(chain.slice(0, 2)), 4: mapFor(chain)};
  await seedMapText(home, wrapperText(5, mapFor(chain)));
  for (const [g, map] of Object.entries(seeded)) await seedBackupText(home, Number(g), wrapperText(Number(g), map));
  return {home, chain, seeded, bytes: wrapperText(5, mapFor(chain))};
}
function deleteOracle(world, resultId) {
  const closure = [resultId];
  for (const r of world.chain) if (closure.includes(r.previousResultId) && !closure.includes(r.resultId)) closure.push(r.resultId);
  const chainOrder = world.chain.map(r => r.resultId).filter(id => closure.includes(id));
  const observationIds = mapFor(world.chain).observations.filter(o => chainOrder.includes(o.resultId)).map(o => o.observationId).sort();
  // the current map.json contains the target, so its pre-delete backup is included too
  const backups = [...Object.entries(world.seeded).filter(([, map]) => map.results.some(r => chainOrder.includes(r.resultId))).map(([g]) => Number(g)), world.current ?? 5].sort((a, b) => a - b);
  return {resultIds: chainOrder, observationIds, backups, remaining: mapFor(world.chain.filter(r => !chainOrder.includes(r.resultId)))};
}
for (const [position, resultId, expectIds, expectBackups] of [['chain-first', 'result-1', ['result-1', 'result-2', 'result-3'], [2, 3, 4, 5]], ['chain-middle', 'result-2', ['result-2', 'result-3'], [3, 4, 5]], ['chain-end', 'result-3', ['result-3'], [4, 5]]]) {
  test(`[V8.token-matches/${position}] preview equals independent closure; confirm removes it, keeps lessons`, async t => {
    const world = await deleteWorld(t);
    const oracle = deleteOracle(world, resultId);
    assert.deepEqual(oracle.resultIds, expectIds);
    assert.deepEqual(oracle.backups, expectBackups);
    const before = await snapshot(world.home);
    const plan = await planDelete(PROFILE, resultId, {home: world.home});
    assert.equal(plan.ok, true);
    assert.equal(plan.action, 'preview');
    const preview = plan.preview;
    assert.equal(preview.mapChange, true);
    assert.deepEqual(preview.resultIds, oracle.resultIds);
    assert.deepEqual([...preview.observationIds].sort(), oracle.observationIds);
    assert.deepEqual(preview.backupGenerations, oracle.backups);
    const token = tokenFor('delete', world.bytes, resultId);
    assert.equal(tokenOf(plan), token);
    assert.deepEqual(await snapshot(world.home), before, 'preview must not change anything');
    const out = await applyDelete(PROFILE, resultId, token, {home: world.home});
    assert.equal(out.ok, true);
    assert.equal(out.action, 'deleted');
    assert.equal(out.generation, 6);
    await expectDiskMap(world.home, 6, oracle.remaining);
    assert.deepEqual((await readDisk(world.home)).map.lessons, mapFor([]).lessons);
    assert.equal(await readText(layout(world.home).backup(5)), null, 'pre-delete backup of the current generation must be removed');
    for (const g of [1, 2, 3, 4]) {
      const file = layout(world.home).backup(g);
      if (oracle.backups.includes(g)) assert.equal(await readText(file), null, `backup ${g} must be deleted`);
      else assert.equal(await readText(file), wrapperText(g, world.seeded[g]), `backup ${g} must stay`);
    }
    assert.deepEqual(await strayFiles(world.home), []);
  });
}
test('[V8.token-missing] apply without token returns preview and changes nothing', async t => {
  const world = await deleteWorld(t);
  const before = await snapshot(world.home);
  const out = await applyDelete(PROFILE, 'result-2', undefined, {home: world.home});
  assert.equal(out.ok, true);
  assert.equal(out.action, 'preview');
  assert.deepEqual(out.preview.resultIds, ['result-2', 'result-3']);
  assert.equal(tokenOf(out), tokenFor('delete', world.bytes, 'result-2'));
  assert.deepEqual(await snapshot(world.home), before);
});
test('[V8.token-mismatch] wrong token: TOKEN, nothing changes', async t => {
  const world = await deleteWorld(t);
  const before = await snapshot(world.home);
  for (const token of ['sha256-' + '0'.repeat(64), tokenFor('delete', world.bytes, 'result-3'), tokenFor('restore', world.bytes, 'result-2')]) {
    const out = note('V8.mismatch', await applyDelete(PROFILE, 'result-2', token, {home: world.home}));
    assert.equal(out.ok, false);
    assert.equal(out.code, 'TOKEN');
    assert.deepEqual(await snapshot(world.home), before);
  }
});
test('[V8.map-changed-after-preview] stale token: TOKEN, changed map kept', async t => {
  const world = await deleteWorld(t);
  const plan = await planDelete(PROFILE, 'result-2', {home: world.home});
  const token = tokenOf(plan);
  const changed = wrapperText(6, mapFor(world.chain, {nextPaths: [nextPath('changed')]}));
  await seedMapText(world.home, changed);
  const before = await snapshot(world.home);
  const out = note('V8.changed', await applyDelete(PROFILE, 'result-2', token, {home: world.home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'TOKEN');
  assert.equal(await readText(layout(world.home).map), changed);
  assert.deepEqual(await snapshot(world.home), before);
});
test('[V8.unknown-id] NOT_FOUND for plan and apply, nothing changes', async t => {
  const world = await deleteWorld(t);
  const before = await snapshot(world.home);
  const plan = note('V8.notfound-plan', await planDelete(PROFILE, 'result-9', {home: world.home}));
  assert.equal(plan.ok, false);
  assert.equal(plan.code, 'NOT_FOUND');
  const apply = note('V8.notfound-apply', await applyDelete(PROFILE, 'result-9', tokenFor('delete', world.bytes, 'result-9'), {home: world.home}));
  assert.equal(apply.ok, false);
  assert.equal(apply.code, 'NOT_FOUND');
  assert.deepEqual(await snapshot(world.home), before);
});

test('[V8.partial-delete → cleanup-only] backup rm failure: PARTIAL_DELETE, then same-id rerun cleans backups without touching map', async t => {
  const world = await deleteWorld(t);
  const targets = [3, 4, 5];
  const plan = await planDelete(PROFILE, 'result-2', {home: world.home});
  const token = tokenOf(plan);
  assert.deepEqual(plan.preview.backupGenerations, targets);
  const {fs, events} = faultFs(world.home, {rmFail: p => p === layout(world.home).backup(4)});
  const out = note('V8.partial-delete', await applyDelete(PROFILE, 'result-2', token, {fs, home: world.home}));
  assert.ok(events.includes('prune'), 'rm failure never reached');
  assert.equal(out.ok, false);
  assert.equal(out.code, 'PARTIAL_DELETE');
  assert.equal(out.generation, 6);
  assert.ok(out.next.trim());
  const remaining = (await backupGenerations(world.home)).filter(g => targets.includes(g));
  assert.ok(remaining.includes(4));
  assert.deepEqual(out.remainingBackups, remaining);
  assert.deepEqual(await backupGenerations(world.home).then(all => all.filter(g => g < 3)), [1, 2], 'non-target backups untouched');
  await expectDiskMap(world.home, 6, mapFor(world.chain.slice(0, 1)));

  // rerun: the id is gone from the map but still inside the remaining backups
  const mapBytes = await readText(layout(world.home).map);
  const holding = [];
  for (const g of await backupGenerations(world.home)) {
    const parsed = JSON.parse(await readText(layout(world.home).backup(g)));
    if (parsed.map.results.some(r => r.resultId === 'result-2')) holding.push(g);
  }
  assert.ok(holding.includes(4));
  const cleanPlan = await planDelete(PROFILE, 'result-2', {home: world.home});
  assert.equal(cleanPlan.ok, true);
  assert.equal(cleanPlan.action, 'preview');
  assert.equal(cleanPlan.preview.mapChange, false);
  assert.deepEqual(cleanPlan.preview.resultIds, ['result-2']);
  assert.deepEqual(cleanPlan.preview.observationIds, []);
  assert.deepEqual(cleanPlan.preview.backupGenerations, holding);
  const cleanToken = tokenFor('delete', mapBytes, 'result-2');
  assert.equal(tokenOf(cleanPlan), cleanToken);
  const beforeWrong = await snapshot(world.home);
  const wrong = note('V8.cleanup-token', await applyDelete(PROFILE, 'result-2', 'sha256-' + '0'.repeat(64), {home: world.home}));
  assert.equal(wrong.code, 'TOKEN');
  assert.deepEqual(await snapshot(world.home), beforeWrong);
  const done = await applyDelete(PROFILE, 'result-2', cleanToken, {home: world.home});
  assert.equal(done.ok, true);
  assert.equal(done.action, 'deleted');
  assert.equal(done.generation, 6);
  assert.equal(await readText(layout(world.home).map), mapBytes);
  for (const g of holding) assert.equal(await readText(layout(world.home).backup(g)), null);
  assert.deepEqual(await backupGenerations(world.home).then(all => all.filter(g => g < 3)), [1, 2]);
  const gone = note('V8.neither-map-nor-backup', await planDelete(PROFILE, 'result-2', {home: world.home}));
  assert.equal(gone.code, 'NOT_FOUND');
  assert.equal(await readText(layout(world.home).map), mapBytes);
});

// ---------- V9 restore and corruption ----------
const BACKUP_GENS = [2, 3, 4, 5];
async function restoreWorld(t, currentKind, backupKind) {
  const home = await tempHome(t);
  const chain = await makeChain(LEVELS);
  const maps = {2: mapFor([]), 3: mapFor(chain.slice(0, 1)), 4: mapFor(chain.slice(0, 2)), 5: mapFor(chain)};
  const contract = await contractViolationText(0);
  const badText = {truncated: g => truncatedText(g, maps[g]), noWrapper: g => noWrapperText(maps[g]), contract: g => contract.replace('"generation":0', `"generation":${g}`)};
  const plan = {
    valid: {2: 'ok', 3: 'ok', 4: 'ok', 5: 'ok'},
    some: {2: 'ok', 3: 'truncated', 4: 'contract', 5: 'ok'},
    none: {2: 'truncated', 3: 'noWrapper', 4: 'contract', 5: 'truncated'}
  }[backupKind];
  const validGens = [];
  for (const g of BACKUP_GENS) {
    const text = plan[g] === 'ok' ? wrapperText(g, maps[g]) : badText[plan[g]](g);
    if (plan[g] === 'ok') validGens.push(g);
    await seedBackupText(home, g, text);
  }
  const curMap = mapFor(chain, {nextPaths: [nextPath('current')]});
  const current = {
    truncated: {text: truncatedText(6, curMap), status: 'unreadable', tag: 0},
    wrapper: {text: noWrapperText(curMap), status: 'unreadable', tag: 0},
    contract: {text: contract.replace('"generation":0', '"generation":2'), status: 'unreadable', tag: 2},
    normal: {text: wrapperText(6, curMap), status: 'ok', generation: 6},
    absent: {text: null, status: 'absent'}
  }[currentKind];
  if (current.text !== null) await seedMapText(home, current.text);
  return {home, maps, validGens, current};
}
for (const currentKind of ['truncated', 'wrapper', 'contract', 'normal', 'absent']) {
  for (const backupKind of ['valid', 'some', 'none']) {
    test(`[V9.current-${currentKind} x backups-${backupKind}] plan/apply restore`, async t => {
      const w = await restoreWorld(t, currentKind, backupKind);
      const before = await snapshot(w.home);
      const plan = await planRestore(PROFILE, {home: w.home});
      assert.deepEqual(await snapshot(w.home), before, 'plan must not change anything');
      if (w.validGens.length === 0) {
        note('V9.no-candidates', plan);
        assert.equal(plan.ok, false);
        assert.equal(plan.code, 'NOT_FOUND');
        return;
      }
      assert.equal(plan.ok, true);
      assert.equal(plan.action, 'preview');
      const wanted = [...w.validGens].sort((a, b) => b - a);
      assert.deepEqual(plan.preview.candidates.map(c => c.generation), wanted);
      const allBackupGens = BACKUP_GENS;
      for (const c of plan.preview.candidates) {
        const lost = [...allBackupGens, ...(w.current.generation !== undefined ? [w.current.generation] : [])].filter(g => g > c.generation).sort((a, b) => a - b);
        assert.deepEqual(c.lostGenerations, lost, `lost for ${c.generation}`);
        assert.equal(c.token, tokenFor('restore', w.current.text, c.generation));
      }
      assert.equal(plan.preview.current.status, w.current.status);
      if (w.current.generation !== undefined) assert.equal(plan.preview.current.generation, w.current.generation);
      const selected = wanted[0];
      const token = tokenFor('restore', w.current.text, selected);
      assert.equal(tokenOf(plan), token);
      assert.equal(plan.token, plan.preview.candidates[0].token);

      const missing = await applyRestore(PROFILE, selected, undefined, {home: w.home});
      assert.equal(missing.ok, true);
      assert.equal(missing.action, 'preview');
      const wrong = note('V9.token-wrong', await applyRestore(PROFILE, selected, 'sha256-' + '0'.repeat(64), {home: w.home}));
      assert.equal(wrong.ok, false);
      assert.equal(wrong.code, 'TOKEN');
      assert.deepEqual(await snapshot(w.home), before, 'missing/mismatched token must not change anything');

      const out = await applyRestore(PROFILE, selected, token, {home: w.home});
      assert.equal(out.ok, true);
      assert.equal(out.action, 'restored');
      const expectedGeneration = Math.max(w.current.generation ?? w.current.tag ?? 0, ...BACKUP_GENS) + 1;
      assert.equal(out.generation, expectedGeneration);
      await expectDiskMap(w.home, expectedGeneration, w.maps[selected]);
      const corrupt = (await listDir(layout(w.home).dir)).filter(n => n.startsWith('map.json.corrupt-'));
      if (w.current.status === 'unreadable') {
        assert.deepEqual(corrupt, [`map.json.corrupt-${w.current.tag}-1`]);
        assert.equal(await readText(path.join(layout(w.home).dir, corrupt[0])), w.current.text);
      } else {
        assert.deepEqual(corrupt, []);
      }
      if (w.current.status === 'ok') assert.equal(await readText(layout(w.home).backup(6)), w.current.text);
      assert.deepEqual(await strayFiles(w.home), []);
    });
  }
}
test('[V9.unknown-generation] restore of a generation without backup: NOT_FOUND, nothing changes', async t => {
  const w = await restoreWorld(t, 'normal', 'valid');
  const before = await snapshot(w.home);
  const out = note('V9.unknown-gen', await applyRestore(PROFILE, 99, tokenFor('restore', w.current.text, 99), {home: w.home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'NOT_FOUND');
  assert.deepEqual(await snapshot(w.home), before);
});

test('[V9.apply-order] NOT_FOUND before missing-token preview before TOKEN', async t => {
  const w = await restoreWorld(t, 'normal', 'valid');
  const before = await snapshot(w.home);
  const wrongToken = 'sha256-' + '0'.repeat(64);
  for (const token of [undefined, wrongToken, tokenFor('restore', w.current.text, 99)]) {
    const out = note('V9.order-notfound', await applyRestore(PROFILE, 99, token, {home: w.home}));
    assert.equal(out.code, 'NOT_FOUND');
  }
  const preview = await applyRestore(PROFILE, 4, undefined, {home: w.home});
  assert.equal(preview.action, 'preview');
  const bad = note('V9.order-token', await applyRestore(PROFILE, 4, wrongToken, {home: w.home}));
  assert.equal(bad.code, 'TOKEN');
  assert.deepEqual(await snapshot(w.home), before);
});

for (const currentKind of ['truncated', 'wrapper', 'contract']) {
  test(`[V9.corrupt-preserve-copy-fails/current-${currentKind}] IO and the whole home is unchanged`, async t => {
    const w = await restoreWorld(t, currentKind, 'valid');
    const plan = await planRestore(PROFILE, {home: w.home});
    const before = await snapshot(w.home);
    const {fs, events} = faultFs(w.home, {fail: 'corrupt-copy'});
    const out = note('V9.corrupt-copy', await applyRestore(PROFILE, 5, tokenOf(plan), {fs, home: w.home}));
    assert.ok(events.includes('corrupt-copy'), 'fault never reached');
    assert.equal(out.ok, false);
    assert.equal(out.code, 'IO');
    assert.deepEqual(await snapshot(w.home), before);
  });
}

for (const existing of [[1], [1, 2]]) {
  test(`[V9.corrupt-name-collision/existing-${existing.join(',')}] next free -n is used, seeded corrupt files stay byte-identical`, async t => {
    const w = await restoreWorld(t, 'truncated', 'valid');
    const dir = layout(w.home).dir;
    const seeded = {};
    for (const n of existing) {
      seeded[n] = `seeded corrupt file ${n}`;
      await writeFile(path.join(dir, `map.json.corrupt-0-${n}`), seeded[n]);
    }
    const plan = await planRestore(PROFILE, {home: w.home});
    const out = await applyRestore(PROFILE, 5, tokenOf(plan), {home: w.home});
    assert.equal(out.ok, true);
    const next = existing.length + 1;
    const names = (await listDir(dir)).filter(n => n.startsWith('map.json.corrupt-'));
    assert.deepEqual(names, Array.from({length: next}, (_, k) => `map.json.corrupt-0-${k + 1}`));
    for (const n of existing) assert.equal(await readText(path.join(dir, `map.json.corrupt-0-${n}`)), seeded[n]);
    assert.equal(await readText(path.join(dir, `map.json.corrupt-0-${next}`)), w.current.text);
  });
}

// ---------- KT4-F1: non-newest candidate, corrupt backup above the newest valid one ----------
async function offsetRestoreWorld(t, {currentText}) {
  const home = await tempHome(t);
  const chain = await makeChain(LEVELS);
  const maps = {2: mapFor([]), 3: mapFor(chain.slice(0, 1)), 5: mapFor(chain)};
  await seedBackupText(home, 2, wrapperText(2, maps[2]));
  await seedBackupText(home, 3, wrapperText(3, maps[3]));
  await seedBackupText(home, 4, truncatedText(4, maps[3]));
  await seedBackupText(home, 5, wrapperText(5, maps[5]));
  await seedBackupText(home, 6, noWrapperText(maps[5]));
  await seedMapText(home, currentText);
  return {home, maps};
}
for (const [label, build, tag] of [
  ['current-truncated', async () => truncatedText(4, mapFor([])), 0],
  ['current-contract-wrapper-g4', async () => (await contractViolationText(0)).replace('"generation":0', '"generation":4'), 4]
]) {
  test(`[V9.non-newest-candidate/${label}] apply candidate 2: its map, generation max(tag, all backups)+1, exact corrupt name, foreign token rejected`, async t => {
    const currentText = await build();
    const w = await offsetRestoreWorld(t, {currentText});
    const plan = await planRestore(PROFILE, {home: w.home});
    assert.deepEqual(plan.preview.candidates.map(c => c.generation), [5, 3, 2]);
    assert.deepEqual(plan.preview.candidates.map(c => c.lostGenerations), [[6], [4, 5, 6], [3, 4, 5, 6]]);
    for (const c of plan.preview.candidates) assert.equal(c.token, tokenFor('restore', currentText, c.generation));
    const before = await snapshot(w.home);
    const foreign = note('V9.foreign-token', await applyRestore(PROFILE, 2, tokenFor('restore', currentText, 5), {home: w.home}));
    assert.equal(foreign.code, 'TOKEN');
    assert.deepEqual(await snapshot(w.home), before);
    const out = await applyRestore(PROFILE, 2, tokenFor('restore', currentText, 2), {home: w.home});
    assert.equal(out.ok, true);
    assert.equal(out.action, 'restored');
    const expectedGeneration = Math.max(tag, 2, 3, 4, 5, 6) + 1;
    assert.equal(out.generation, expectedGeneration);
    await expectDiskMap(w.home, expectedGeneration, w.maps[2]);
    const corrupt = (await listDir(layout(w.home).dir)).filter(n => n.startsWith('map.json.corrupt-'));
    assert.deepEqual(corrupt, [`map.json.corrupt-${tag}-1`]);
    assert.equal(await readText(path.join(layout(w.home).dir, corrupt[0])), currentText);
  });
}
test('[V9.corrupt-tag-dominates] unreadable wrapper at generation 20 above every backup: new generation 21, corrupt-20-1, lost excludes the unreadable current', async t => {
  const currentText = (await contractViolationText(0)).replace('"generation":0', '"generation":20');
  const w = await offsetRestoreWorld(t, {currentText});
  const plan = await planRestore(PROFILE, {home: w.home});
  assert.deepEqual(plan.preview.candidates.map(c => c.generation), [5, 3, 2]);
  assert.deepEqual(plan.preview.candidates.map(c => c.lostGenerations), [[6], [4, 5, 6], [3, 4, 5, 6]]);
  const out = await applyRestore(PROFILE, 5, tokenFor('restore', currentText, 5), {home: w.home});
  assert.equal(out.ok, true);
  assert.equal(out.generation, 21);
  await expectDiskMap(w.home, 21, w.maps[5]);
  const corrupt = (await listDir(layout(w.home).dir)).filter(n => n.startsWith('map.json.corrupt-'));
  assert.deepEqual(corrupt, ['map.json.corrupt-20-1']);
  assert.equal(await readText(path.join(layout(w.home).dir, corrupt[0])), currentText);
});
test('[V9.exact-corrupt-tag/contract-wrapper-g9] tag 9 above all backups: corrupt-9-1, new generation 10, numeric order of lists', async t => {
  const home = await tempHome(t);
  const chain = await makeChain(LEVELS);
  const maps = {2: mapFor([]), 9: mapFor(chain.slice(0, 1)), 10: mapFor(chain)};
  for (const g of [2, 9, 10]) await seedBackupText(home, g, wrapperText(g, maps[g]));
  const currentText = (await contractViolationText(0)).replace('"generation":0', '"generation":9');
  await seedMapText(home, currentText);
  const plan = await planRestore(PROFILE, {home});
  assert.deepEqual(plan.preview.candidates.map(c => c.generation), [10, 9, 2]);
  assert.deepEqual(plan.preview.candidates.map(c => c.lostGenerations), [[], [10], [9, 10]]);
  const out = await applyRestore(PROFILE, 10, tokenOf(plan), {home});
  assert.equal(out.generation, 11);
  await expectDiskMap(home, 11, maps[10]);
  assert.deepEqual((await listDir(layout(home).dir)).filter(n => n.startsWith('map.json.corrupt-')), ['map.json.corrupt-9-1']);
});

// ---------- KT4-F2: unrelated results survive delete ----------
test('[V8.unrelated-results-kept] unrelated result, observations and backups are untouched; ascending numeric lists with generation >= 10', async t => {
  const home = await tempHome(t);
  const off = 6;
  const chain = await makeChain(LEVELS);
  const other = await makeChain([[item(1, 'supported', 'b'), item(2, 'partial', 'a')]], {prefix: 'other-', salt: 'unrelated'});
  const all = [...chain, ...other];
  const seeded = {[1 + off]: mapFor([]), [2 + off]: mapFor(chain.slice(0, 1)), [3 + off]: mapFor(chain.slice(0, 2)), [4 + off]: mapFor(chain), [5 + off]: mapFor(other), [6 + off]: mapFor(all)};
  for (const [g, map] of Object.entries(seeded)) await seedBackupText(home, Number(g), wrapperText(Number(g), map));
  const current = 7 + off;
  const bytes = wrapperText(current, mapFor(all));
  await seedMapText(home, bytes);
  const oracle = deleteOracle({chain: all, seeded, current}, 'result-2');
  assert.deepEqual(oracle.resultIds, ['result-2', 'result-3']);
  assert.deepEqual(oracle.backups, [3 + off, 4 + off, 6 + off, current]);
  assert.ok(oracle.backups.includes(10) && oracle.backups.includes(12));
  const plan = await planDelete(PROFILE, 'result-2', {home});
  assert.deepEqual(plan.preview.resultIds, oracle.resultIds);
  assert.deepEqual([...plan.preview.observationIds].sort(), oracle.observationIds);
  assert.deepEqual(plan.preview.backupGenerations, oracle.backups);
  const out = await applyDelete(PROFILE, 'result-2', tokenOf(plan), {home});
  assert.equal(out.ok, true);
  assert.equal(out.generation, current + 1);
  await expectDiskMap(home, current + 1, oracle.remaining);
  const disk = await readDisk(home);
  assert.deepEqual(disk.map.results.map(r => r.resultId), ['result-1', 'other-1']);
  assert.ok(disk.map.observations.some(o => o.resultId === 'other-1'));
  assert.equal(await readText(layout(home).backup(5 + off)), wrapperText(5 + off, seeded[5 + off]), 'unrelated-only backup stays byte-identical');
  for (const g of oracle.backups) assert.equal(await readText(layout(home).backup(g)), null);
  // backups 7 and 8 fall out of the newest-5 window of the delete's own write, so they are not asserted
});

// ---------- KT4-F3: lesson added to an existing map without it ----------
for (const [label, existing] of [
  ['different-lesson', l => { l.lessonId = 'lesson-z'; }],
  ['different-revision', l => { l.lessonRevision = 2; }]
]) {
  test(`[V1.lesson-added-once/${label}] map holding another lesson gains exactly lesson-a@1, existing lessons unchanged`, async t => {
    const home = await tempHome(t);
    await placeFixtures(home);
    const other = makeLesson();
    existing(other);
    const base = mapFor([]);
    base.lessons = [other];
    await seedMapText(home, wrapperText(1, base));
    const [r1, r2] = await makeChain(LEVELS.slice(0, 2));
    for (const [k, result] of [r1, r2].entries()) {
      const out = await importResult(textOf(result), {home});
      assert.equal(out.ok, true);
      assert.equal(out.generation, k + 2);
      const lessons = (await readDisk(home)).map.lessons;
      assert.equal(lessons.length, 2);
      assert.deepEqual(lessons.filter(l => l.lessonId === 'lesson-z' || l.lessonRevision === 2), [other]);
      assert.deepEqual(lessons.filter(l => l.lessonId === 'lesson-a' && l.lessonRevision === 1), [makeLesson()]);
    }
  });
}

const UNREADABLE = {
  truncated: async () => truncatedText(3, mapFor([])),
  wrapperMissing: async () => noWrapperText(mapFor([])),
  contract: () => contractViolationText(3)
};
for (const [kind, build] of Object.entries(UNREADABLE)) {
  test(`[V9.unreadable-${kind}] import, delete and show refuse with MAP_UNREADABLE and keep the file`, async t => {
    const home = await tempHome(t);
    await placeFixtures(home);
    const bytes = await build();
    await seedMapText(home, bytes);
    const before = await snapshot(home);
    const [r1] = await makeChain([LEVELS[0]]);
    const outs = {
      import: await importResult(textOf(r1), {home}),
      planDelete: await planDelete(PROFILE, 'result-1', {home}),
      applyDelete: await applyDelete(PROFILE, 'result-1', 'sha256-' + '0'.repeat(64), {home}),
      show: await summarize(PROFILE, {home})
    };
    for (const [name, out] of Object.entries(outs)) {
      note(`V9.unreadable-${kind}.${name}`, out);
      assert.equal(out.ok, false, name);
      assert.equal(out.code, 'MAP_UNREADABLE', name);
      assert.match(out.next, /restore/, name);
    }
    assert.equal(await readText(layout(home).map), bytes);
    assert.deepEqual(await snapshot(home), before);
  });
}

// ---------- V10 profileId syntax ----------
const INVALID_IDS = [['../x', '../x'], ['a/b', 'a/b'], ['A', 'A'], ['empty', ''], ['65-chars', 'a'.repeat(65)]];
const VALID_64 = 'a' + 'b'.repeat(63);
for (const [label, id] of INVALID_IDS) {
  test(`[V10.${label}] PROFILE and zero fs calls on every profile-taking entry point`, async t => {
    const home = await tempHome(t);
    const {fs, calls} = recordingFs();
    const opts = {fs, home};
    const outs = [
      await planDelete(id, 'result-1', opts), await applyDelete(id, 'result-1', 'sha256-x', opts),
      await planRestore(id, opts), await applyRestore(id, 1, 'sha256-x', opts), await summarize(id, opts)
    ];
    for (const out of outs) {
      note(`V10.${label}`, out);
      assert.equal(out.ok, false);
      assert.equal(out.code, 'PROFILE');
    }
    assert.doesNotThrow(() => profileDir(id, {home}));
    assert.deepEqual(calls, []);
    assert.deepEqual(await snapshot(home), {});
  });
}
test('[V10.valid-64] a 64-char id passes the syntax gate and reaches the file system', async t => {
  const home = await tempHome(t);
  const {fs, calls} = recordingFs();
  const show = await summarize(VALID_64, {fs, home});
  assert.equal(show.ok, false);
  assert.equal(show.code, 'NO_MAP');
  assert.ok(calls.length > 0);
  assert.notEqual((await planRestore(VALID_64, {fs, home})).code, 'PROFILE');
  assert.notEqual((await planDelete(VALID_64, 'result-1', {fs, home})).code, 'PROFILE');
  assert.equal(profileDir(VALID_64, {home}), path.join(home, '.learn-to-tell', 'profiles', VALID_64));
});

// ---------- V11 summarize (exact line format, spec v2 Signatures) ----------
const linesOf = text => text.split('\n').filter(line => line !== '');
const statusOf = (result, assessmentId) => result.assessments.find(a => a.assessmentId === assessmentId).status;
function expectedSummary(map, generation) {
  const count = (list, pred) => list.filter(pred).length;
  const tails = map.results.filter(r => !map.results.some(o => o.previousResultId === r.resultId));
  const tailAssessments = tails.flatMap(r => r.assessments);
  const concepts = new Map();
  for (const o of map.observations) {
    const key = `${o.conceptId}@${o.conceptRevision}`;
    const entry = concepts.get(key) ?? {supported: 0, partial: 0};
    entry[statusOf(map.results.find(r => r.resultId === o.resultId), o.assessmentId)]++;
    concepts.set(key, entry);
  }
  return {
    head: [`profile: ${map.profileId}`, `revision: ${map.revision}`, `generation: ${generation}`,
      `results: completed ${count(map.results, r => r.state === 'completed')}, partial ${count(map.results, r => r.state === 'partial')}`],
    concepts: [...concepts].map(([key, c]) => `concept ${key}: supported ${c.supported}, partial ${c.partial}`),
    tail: `unresolved: pending ${count(tailAssessments, a => a.status === 'pending')}, skipped ${count(tailAssessments, a => a.status === 'skipped')}, not_demonstrated ${count(tailAssessments, a => a.status === 'not_demonstrated')}`
  };
}
function assertSummary(text, map, generation) {
  const exp = expectedSummary(map, generation);
  const lines = linesOf(text);
  assert.deepEqual(lines.slice(0, 4), exp.head, text);
  assert.equal(lines.at(-1), exp.tail, text);
  assert.deepEqual([...lines.slice(4, -1)].sort(), [...exp.concepts].sort(), text);
  return exp;
}
async function summaryMap() {
  const r = (resultId, items, state, salt) => makeResult({resultId, items, state, salt});
  const standalone = [
    await r('s-1', [item(1, 'supported', 'a'), item(2, 'pending', 'b')], 'partial', 'one'),
    await r('s-2', [item(1, 'partial', 'b'), item(2, 'pending', 'a'), item(3, 'skipped', 'a'), item(4, 'skipped', 'b')], 'partial', 'two'),
    await r('s-3', [item(1, 'not_demonstrated', 'a'), item(2, 'supported', 'b')], 'completed', 'three'),
    await r('s-4', [item(1, 'supported', 'b'), item(2, 'supported', 'b'), item(3, 'supported', 'b')], 'completed', 'four'),
    await r('s-5', [item(1, 'pending', 'a')], 'partial', 'five')
  ];
  const chain = await makeChain([
    [item(1, 'pending', 'a'), item(2, 'skipped', 'b')],
    [item(1, 'pending', 'a'), item(2, 'skipped', 'b'), item(3, 'supported', 'a'), item(4, 'not_demonstrated', 'b')]
  ], {prefix: 'c-', salt: 'chain'});
  return mapFor([...standalone, ...chain], {revision: 7});
}
test('[V11.results-and-observations] exact lines; unresolved counts only chain-tail results', async t => {
  const home = await tempHome(t);
  const map = await summaryMap();
  const bytes = wrapperText(11, map);
  await seedMapText(home, bytes);
  const before = await snapshot(home);
  const out = await summarize(PROFILE, {home});
  assert.equal(out.ok, true);
  const exp = assertSummary(out.text, map, 11);
  // fixture facts: non-tail c-1 would add pending 1, skipped 1 if it were counted
  assert.equal(exp.tail, 'unresolved: pending 4, skipped 3, not_demonstrated 2');
  assert.equal(exp.head[3], 'results: completed 3, partial 4');
  assert.deepEqual([...exp.concepts].sort(), ['concept concept-a@1: supported 2, partial 0', 'concept concept-b@2: supported 4, partial 1']);
  const lines = linesOf(out.text);
  assert.ok(lines.indexOf(exp.head[3]) === 3 && lines.indexOf(exp.tail) === lines.length - 1);
  assert.equal(await readText(layout(home).map), bytes);
  assert.deepEqual(await snapshot(home), before);
});
test('[V11.pending-only C18] pending count shown, no concept lines', async t => {
  const home = await tempHome(t);
  const r1 = await makeResult({resultId: 'result-1', items: [item(1, 'pending'), item(2, 'pending', 'b')], state: 'partial'});
  const map = mapFor([r1]);
  await seedMapText(home, wrapperText(2, map));
  const out = await summarize(PROFILE, {home});
  assert.equal(out.ok, true);
  assertSummary(out.text, map, 2);
  assert.deepEqual(linesOf(out.text), ['profile: profile-a', 'revision: 1', 'generation: 2', 'results: completed 0, partial 1', 'unresolved: pending 2, skipped 0, not_demonstrated 0']);
});
test('[V11.empty-map] zero counts, no concept lines', async t => {
  const home = await tempHome(t);
  await seedMapText(home, wrapperText(13, mapFor([], {revision: 9})));
  const out = await summarize(PROFILE, {home});
  assert.equal(out.ok, true);
  assert.deepEqual(linesOf(out.text), ['profile: profile-a', 'revision: 9', 'generation: 13', 'results: completed 0, partial 0', 'unresolved: pending 0, skipped 0, not_demonstrated 0']);
});
test('[V11.no-map] NO_MAP and nothing written', async t => {
  const home = await tempHome(t);
  const out = note('V11.no-map', await summarize(PROFILE, {home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'NO_MAP');
  assert.deepEqual(await snapshot(home), {});
});

// ---------- non-ENOENT read errors give IO Outcomes (spec v2 Signatures) ----------
test('[V5.read-error map.json EACCES] import, delete, show, restore preview return IO, no throw, no change', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const bytes = wrapperText(2, mapFor([]));
  await seedMapText(home, bytes);
  const before = await snapshot(home);
  const [r1] = await makeChain([LEVELS[0]]);
  const {fs, events} = faultFs(home, {readFail: file => file === layout(home).map});
  const outs = {import: await importResult(textOf(r1), {fs, home}), planDelete: await planDelete(PROFILE, 'result-1', {fs, home}), show: await summarize(PROFILE, {fs, home}), planRestore: await planRestore(PROFILE, {fs, home})};
  assert.ok(events.includes('read'));
  for (const [name, out] of Object.entries(outs)) {
    note(`V5.read-error-map.${name}`, out);
    assert.equal(out.ok, false, name);
    assert.equal(out.code, 'IO', name);
  }
  assert.deepEqual(await snapshot(home), before);
});
test('[V5.read-error lesson/diagnostic EACCES] import returns IO', async t => {
  for (const [label, file] of [['lesson', 'lessons/lesson-a.1.json'], ['diagnostic', 'diagnostics/diagnostic-a.json']]) {
    const home = await tempHome(t);
    await placeFixtures(home);
    await seedMapText(home, wrapperText(1, mapFor([])));
    const before = await snapshot(home);
    const [r1] = await makeChain([LEVELS[0]]);
    const {fs, events} = faultFs(home, {readFail: p => p === path.join(layout(home).dir, file)});
    const out = note(`V5.read-error-${label}`, await importResult(textOf(r1), {fs, home}));
    assert.ok(events.includes('read'), label);
    assert.equal(out.ok, false, label);
    assert.equal(out.code, 'IO', label);
    assert.deepEqual(await snapshot(home), before);
  }
});
test('[V5.read-error backup EACCES] restore preview returns IO', async t => {
  const w = await restoreWorld(t, 'normal', 'valid');
  const before = await snapshot(w.home);
  const {fs, events} = faultFs(w.home, {readFail: p => p === layout(w.home).backup(4)});
  const out = note('V5.read-error-backup', await planRestore(PROFILE, {fs, home: w.home}));
  assert.ok(events.includes('read'));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'IO');
  assert.deepEqual(await snapshot(w.home), before);
});
test('[V5.read-error backups dir EACCES] restore preview returns IO', async t => {
  const w = await restoreWorld(t, 'normal', 'valid');
  const before = await snapshot(w.home);
  const {fs, events} = faultFs(w.home, {readFail: p => p === layout(w.home).backups});
  const out = note('V5.read-error-backups-dir', await planRestore(PROFILE, {fs, home: w.home}));
  assert.ok(events.includes('read'));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'IO');
  assert.deepEqual(await snapshot(w.home), before);
});

// ---------- readMap observation (support for V5-V9 reading) ----------
test('[V9.readMap-statuses] absent / ok / unreadable reasons JSON, WRAPPER, CONTRACT', async t => {
  const home = await tempHome(t);
  assert.deepEqual(await readMap(PROFILE, {home}), {status: 'absent'});
  const map = mapFor([]);
  await seedMapText(home, wrapperText(4, map));
  const ok = await readMap(PROFILE, {home});
  assert.equal(ok.status, 'ok');
  assert.equal(ok.generation, 4);
  assert.deepEqual(ok.map, map);
  assert.ok(Buffer.isBuffer(ok.bytes));
  assert.equal(ok.bytes.toString('utf8'), wrapperText(4, map));
  for (const [reason, text] of [['JSON', truncatedText(4, map)], ['WRAPPER', noWrapperText(map)], ['CONTRACT', await contractViolationText(4)]]) {
    await seedMapText(home, text);
    const out = await readMap(PROFILE, {home});
    assert.equal(out.status, 'unreadable');
    assert.equal(out.reason, reason);
  }
});

// ---------- V13 error outcomes ----------
test('[V13.IO-import] import-level IO Outcome from an injected rename failure', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  const bytes = wrapperText(1, mapFor([]));
  await seedMapText(home, bytes);
  const [r1] = await makeChain([LEVELS[0]]);
  const {fs, events} = faultFs(home, {fail: 'rename'});
  const out = note('V13.IO-import', await importResult(textOf(r1), {fs, home}));
  assert.ok(events.includes('rename'));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'IO');
  assert.equal(await readText(layout(home).map), bytes);
  assert.deepEqual(await strayFiles(home), []);
});
test('[V13.STALE-import] import-level STALE Outcome when the disk generation moves before rename', async t => {
  const home = await tempHome(t);
  await placeFixtures(home);
  await seedMapText(home, wrapperText(1, mapFor([])));
  const injected = wrapperText(2, mapFor([], {nextPaths: [nextPath('injected')]}));
  const [r1] = await makeChain([LEVELS[0]]);
  const {fs} = faultFs(home, {afterSync: () => writeFile(layout(home).map, injected)});
  const out = note('V13.STALE-import', await importResult(textOf(r1), {fs, home}));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'STALE');
  assert.equal(await readText(layout(home).map), injected);
  assert.deepEqual(await strayFiles(home), []);
});

test('[V13.all-error-outcomes] every collected ok:false Outcome has a code and a non-empty next', t => {
  assert.ok(failures.length > 0);
  for (const {label, out} of failures) {
    assert.equal(typeof out.code, 'string', label);
    assert.ok(out.code.length > 0, label);
    assert.equal(typeof out.next, 'string', label);
    assert.ok(out.next.trim().length > 0, label);
  }
});
for (const code of ['INVALID', 'IO', 'MISSING_LESSON', 'MISSING_DIAGNOSTIC', 'MAP_UNREADABLE', 'STALE', 'TOKEN', 'NOT_FOUND', 'PROFILE', 'NO_MAP', 'PARTIAL_DELETE']) {
  test(`[V13.code-${code}] code kind observed in V4-V11 and carries next`, () => {
    const seen = failures.filter(f => f.out.code === code);
    assert.ok(seen.length > 0, `no ${code} outcome collected`);
    for (const {out} of seen) assert.ok(typeof out.next === 'string' && out.next.trim().length > 0);
  });
}
