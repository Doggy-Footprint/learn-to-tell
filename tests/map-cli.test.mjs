import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {writeFile, mkdtemp, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {
  PROFILE, tempHome, layout, makeChain, item, mapFor, wrapperText, tokenFor, truncatedText,
  placeFixtures, seedMapText, seedBackupText, readText, readDisk, snapshot
} from './fixtures/knowledge/world.mjs';

const SCRIPT = path.resolve(import.meta.dirname, '..', 'scripts', 'map.mjs');
const ROOT = path.resolve(import.meta.dirname, '..');
const LEVELS = [
  [item(1, 'supported', 'a')],
  [item(1, 'supported', 'a'), item(2, 'partial', 'b')],
  [item(1, 'supported', 'a'), item(2, 'partial', 'b'), item(3, 'supported', 'a'), item(4, 'pending', 'b')]
];

// A fresh process per call; LEARN_TO_TELL_HOME is the only knowledge-base input.
function run(home, ...args) {
  const proc = spawnSync(process.execPath, [SCRIPT, ...args], {cwd: ROOT, env: {...process.env, LEARN_TO_TELL_HOME: home}, encoding: 'utf8'});
  return {code: proc.status, stdout: proc.stdout, stderr: proc.stderr};
}
function outcomeOf(proc) {
  assert.match(proc.stdout, /^[^\n]+\n$/, `stdout must be one JSON line: ${JSON.stringify(proc.stdout)}`);
  return JSON.parse(proc.stdout);
}
async function resultFile(t, result) {
  const dir = await mkdtemp(path.join(tmpdir(), 'ltt-t4-files-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const file = path.join(dir, 'result.json');
  await writeFile(file, JSON.stringify(result));
  return file;
}
async function importable(t) {
  const home = await tempHome(t);
  await placeFixtures(home);
  await seedMapText(home, wrapperText(1, mapFor([])));
  const chain = await makeChain(LEVELS);
  return {home, chain};
}

test('[V12.import-success] exit 0, one-line imported Outcome, map written', async t => {
  const {home, chain} = await importable(t);
  const proc = run(home, 'import', await resultFile(t, chain[0]));
  assert.equal(proc.code, 0, proc.stderr);
  const out = outcomeOf(proc);
  assert.equal(out.ok, true);
  assert.equal(out.action, 'imported');
  assert.equal(out.generation, 2);
  assert.deepEqual((await readDisk(home)).map.results, [chain[0]]);
});

test('[V12.import-duplicate] second import: exit 0, duplicate Outcome, bytes unchanged', async t => {
  const {home, chain} = await importable(t);
  const file = await resultFile(t, chain[0]);
  assert.equal(run(home, 'import', file).code, 0);
  const bytes = await readText(layout(home).map);
  const proc = run(home, 'import', file);
  assert.equal(proc.code, 0);
  assert.deepEqual(outcomeOf(proc), {ok: true, action: 'duplicate', duplicateOf: 'result-1'});
  assert.equal(await readText(layout(home).map), bytes);
});

test('[V12.import-failure exit 1] result file missing: IO Outcome (V4.result-file-missing), nothing changes', async t => {
  const {home} = await importable(t);
  const before = await snapshot(home);
  const proc = run(home, 'import', path.join(home, 'no-such-result.json'));
  assert.equal(proc.code, 1);
  const out = outcomeOf(proc);
  assert.equal(out.ok, false);
  assert.equal(out.code, 'IO');
  assert.ok(typeof out.next === 'string' && out.next.trim());
  assert.deepEqual(await snapshot(home), before);
});

test('[V12.import-failure exit 1] missing lesson file: MISSING_LESSON JSON, exit 1', async t => {
  const home = await tempHome(t);
  await placeFixtures(home, PROFILE, {lesson: false});
  const [r1] = await makeChain([LEVELS[0]]);
  const proc = run(home, 'import', await resultFile(t, r1));
  assert.equal(proc.code, 1);
  assert.equal(outcomeOf(proc).code, 'MISSING_LESSON');
});

test('[V12.delete preview→confirm] preview exit 0 with token, confirm deletes', async t => {
  const home = await tempHome(t);
  const chain = await makeChain(LEVELS);
  const bytes = wrapperText(5, mapFor(chain));
  await seedMapText(home, bytes);
  const before = await snapshot(home);
  const preview = run(home, 'delete', PROFILE, 'result-2');
  assert.equal(preview.code, 0, preview.stderr);
  const plan = outcomeOf(preview);
  assert.equal(plan.action, 'preview');
  assert.deepEqual(plan.preview.resultIds, ['result-2', 'result-3']);
  const token = plan.token;
  assert.equal(plan.preview.token, token);
  assert.equal(token, tokenFor('delete', bytes, 'result-2'));
  assert.deepEqual(await snapshot(home), before);
  const wrong = run(home, 'delete', PROFILE, 'result-2', '--confirm', 'sha256-' + '0'.repeat(64));
  assert.equal(wrong.code, 1);
  assert.equal(outcomeOf(wrong).code, 'TOKEN');
  assert.deepEqual(await snapshot(home), before);
  const done = run(home, 'delete', PROFILE, 'result-2', '--confirm', token);
  assert.equal(done.code, 0, done.stderr);
  const out = outcomeOf(done);
  assert.equal(out.action, 'deleted');
  assert.deepEqual((await readDisk(home)).map.results.map(r => r.resultId), ['result-1']);
});

test('[V12.restore preview→confirm] preview exit 0, confirm restores newest valid backup and keeps the corrupt file', async t => {
  const home = await tempHome(t);
  const chain = await makeChain(LEVELS);
  const maps = {3: mapFor(chain.slice(0, 1)), 4: mapFor(chain.slice(0, 2))};
  for (const g of [3, 4]) await seedBackupText(home, g, wrapperText(g, maps[g]));
  const corrupt = truncatedText(5, mapFor(chain));
  await seedMapText(home, corrupt);
  const before = await snapshot(home);
  const preview = run(home, 'restore', PROFILE);
  assert.equal(preview.code, 0, preview.stderr);
  const plan = outcomeOf(preview);
  assert.equal(plan.action, 'preview');
  assert.deepEqual(plan.preview.candidates.map(c => c.generation), [4, 3]);
  const token = plan.token;
  assert.equal(plan.preview.token, token);
  assert.equal(plan.preview.candidates[0].token, token);
  assert.equal(token, tokenFor('restore', corrupt, 4));
  assert.deepEqual(await snapshot(home), before);
  const done = run(home, 'restore', PROFILE, '--generation', '4', '--confirm', token);
  assert.equal(done.code, 0, done.stderr);
  const out = outcomeOf(done);
  assert.equal(out.action, 'restored');
  assert.equal(out.generation, 5);
  const disk = await readDisk(home);
  assert.equal(disk.generation, 5);
  assert.deepEqual(disk.map, maps[4]);
  const kept = (await readdir(layout(home).dir)).filter(n => n.startsWith('map.json.corrupt-'));
  assert.equal(kept.length, 1);
  assert.equal(await readText(path.join(layout(home).dir, kept[0])), corrupt);
});

test('[V12.show restart] show in a new process after import prints the stored state as text, exit 0', async t => {
  const {home, chain} = await importable(t);
  assert.equal(run(home, 'import', await resultFile(t, chain[0])).code, 0);
  assert.equal(run(home, 'import', await resultFile(t, chain[1])).code, 0);
  const proc = run(home, 'show', PROFILE);
  assert.equal(proc.code, 0, proc.stderr);
  assert.throws(() => JSON.parse(proc.stdout), 'show prints text, not Outcome JSON');
  const lines = proc.stdout.split('\n');
  assert.deepEqual(lines.slice(0, 4), ['profile: profile-a', 'revision: 1', 'generation: 3', 'results: completed 0, partial 2']);
  assert.ok(lines.includes('concept concept-a@1: supported 1, partial 0'));
  assert.ok(lines.includes('concept concept-b@2: supported 0, partial 1'));
  assert.ok(lines.includes('unresolved: pending 0, skipped 0, not_demonstrated 0'));
});

test('[V12.show failure] no map: Outcome JSON NO_MAP, exit 1', async t => {
  const home = await tempHome(t);
  const proc = run(home, 'show', PROFILE);
  assert.equal(proc.code, 1);
  const out = outcomeOf(proc);
  assert.equal(out.code, 'NO_MAP');
  assert.ok(out.next.trim());
});

test('[V12.usage-error no arguments] exit 2 with usage on stderr', async t => {
  const proc = run(await tempHome(t));
  assert.equal(proc.code, 2);
  assert.ok(proc.stderr.trim().length > 0);
});
test('[V12.usage-error unknown command] exit 2 with usage on stderr', async t => {
  const proc = run(await tempHome(t), 'frobnicate', PROFILE);
  assert.equal(proc.code, 2);
  assert.ok(proc.stderr.trim().length > 0);
});
test('[V12.usage-error missing argument] delete without resultId: exit 2 with usage on stderr', async t => {
  const home = await tempHome(t);
  const proc = run(home, 'delete', PROFILE);
  assert.equal(proc.code, 2);
  assert.ok(proc.stderr.trim().length > 0);
  assert.deepEqual(await snapshot(home), {});
});

test('[V10.cli-profile-escape] ../x and uppercase ids: PROFILE Outcome, exit 1, nothing created', async t => {
  const home = await tempHome(t);
  for (const id of ['../x', 'A']) {
    for (const args of [['show', id], ['delete', id, 'result-1'], ['restore', id]]) {
      const proc = run(home, ...args);
      assert.equal(proc.code, 1, args.join(' '));
      assert.equal(outcomeOf(proc).code, 'PROFILE');
    }
  }
  assert.deepEqual(await snapshot(home), {});
  assert.deepEqual(await readdir(path.dirname(home)).then(names => names.filter(n => n === 'x')), []);
});
