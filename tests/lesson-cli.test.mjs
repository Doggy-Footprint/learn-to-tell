import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {mkdtemp, rm, writeFile, readFile, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {performance} from 'node:perf_hooks';
import {PROFILE as KB_PROFILE, tempHome, makeChain, item, mapFor, wrapperText, seedMapText, readDisk} from './fixtures/knowledge/world.mjs';
import {ROOT, EXAMPLE_MODEL, PROFILE, baseLesson, asText, exampleOracleText, modelSource, pidTop} from './fixtures/authoring/models.mjs';

const SCRIPT = path.join(ROOT, 'scripts', 'lesson.mjs');

// A fresh process per call; LEARN_TO_TELL_HOME is the only knowledge-base input.
function run(home, ...args) {
  const proc = spawnSync(process.execPath, [SCRIPT, ...args], {cwd: ROOT, env: {...process.env, LEARN_TO_TELL_HOME: home}, encoding: 'utf8', timeout: 60000});
  return {code: proc.status, stdout: proc.stdout, stderr: proc.stderr};
}
function outcomeOf(proc) {
  assert.match(proc.stdout, /^[^\n]+\n$/, `stdout must be exactly one JSON line: ${JSON.stringify(proc.stdout)}`);
  return JSON.parse(proc.stdout);
}
function assertFailureOutcome(proc, code) {
  assert.equal(proc.code, 1, proc.stderr);
  const out = outcomeOf(proc);
  assert.equal(out.ok, false);
  if (code) assert.equal(out.code, code);
  for (const key of ['code', 'message', 'next']) assert.ok(typeof out[key] === 'string' && out[key].trim(), `failure outcome needs ${key}: ${JSON.stringify(out)}`);
  return out;
}
function assertUsageError(proc) {
  assert.equal(proc.code, 2);
  assert.equal(proc.stdout, '');
  assert.match(proc.stderr, /usage/i);
}
async function workDir(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'ltt-t52-cli-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  return dir;
}
async function put(dir, name, content) {
  const file = path.join(dir, name);
  await writeFile(file, typeof content === 'string' ? content : JSON.stringify(content));
  return file;
}
const cand = id => ({candidateId: id, title: `Title ${id}`, decisionQuestion: `Question ${id}?`, reason: `Reason ${id}`, preview: `Preview ${id}`});
const react = (candidateId, reaction) => ({candidateId, reaction});
const CHOICES = {
  kind: 'diagnostic-choices', version: 1, diagnosticId: 'inspection-diagnostic', profileId: PROFILE, contextKind: 'interest',
  rounds: [
    {candidates: [cand('cand-a'), cand('cand-b')], reactions: [react('cand-a', 'similar'), react('cand-b', 'surprising')]},
    {candidates: [cand('inspection-candidate'), cand('cand-d')], reactions: [react('inspection-candidate', 'not-applicable'), react('cand-d', 'unknown')]},
  ],
};
const HYPOTHESES = [{candidateId: 'inspection-candidate', category: 'common-knowledge-gap', rationale: 'Unknown decision variable', status: 'hypothesis'}];
const EXPECTED_DIAGNOSTIC = {kind: 'diagnostic', version: 1, diagnosticId: 'inspection-diagnostic', profileId: PROFILE, contextKind: 'interest', candidates: CHOICES.rounds[1].candidates, selection: null, confirmation: 'unconfirmed', hypotheses: HYPOTHESES};
const DIAGNOSTIC = {...EXPECTED_DIAGNOSTIC, selection: 'inspection-candidate', confirmation: 'confirmed'};
const NEXT_PATHS = [{pathId: 'path-n1', lessonId: 'lesson-a', conceptId: 'concept-b', conceptRevision: 2, reason: 'Defect escape', lessonStatus: 'placed'}];

async function inputs(t) {
  const dir = await workDir(t);
  const home = await tempHome(t);
  const results = await makeChain([[item(1, 'supported', 'a')], [item(1, 'supported', 'a'), item(2, 'partial', 'b')]]);
  const map = mapFor(results, {revision: 3});
  return {
    dir, home, map,
    lesson: await put(dir, 'lesson.json', asText(baseLesson())),
    model: EXAMPLE_MODEL,
    oracle: await put(dir, 'oracle.json', exampleOracleText()),
    choices: await put(dir, 'choices.json', CHOICES),
    hypotheses: await put(dir, 'hypotheses.json', HYPOTHESES),
    diagnostic: await put(dir, 'diagnostic.json', DIAGNOSTIC),
    nextPaths: await put(dir, 'nextPaths.json', NEXT_PATHS),
    missing: path.join(dir, 'absent.json'),
  };
}
const commands = {
  'check-model': f => ['check-model', '--lesson', f.lesson, '--model', f.model, '--oracle', f.oracle],
  diagnose: f => ['diagnose', '--choices', f.choices, '--hypotheses', f.hypotheses],
  'place-diagnostic': f => ['place-diagnostic', f.diagnostic],
  'place-lesson': f => ['place-lesson', f.lesson, '--model', f.model, '--oracle', f.oracle],
  'set-next-paths': f => ['set-next-paths', KB_PROFILE, f.nextPaths],
};
// Dropping the last option/positional leaves the command one argument short.
const dropLast = args => (args.at(-2)?.startsWith('--') ? args.slice(0, -2) : args.slice(0, -1));
const treeOf = async home => (await readdir(home, {recursive: true})).sort();

for (const [name, build] of Object.entries(commands)) {
  test(`[V11.${name} valid args] exit 0 and one-line ok Outcome`, async t => {
    const f = await inputs(t);
    if (name === 'set-next-paths') await seedMapText(f.home, wrapperText(4, f.map));
    const proc = run(f.home, ...build(f));
    assert.equal(proc.code, 0, proc.stderr);
    const out = outcomeOf(proc);
    assert.equal(out.ok, true);
    if (name === 'check-model') assert.deepEqual(out, {ok: true});
    if (name === 'diagnose') assert.deepEqual(out.diagnostic, EXPECTED_DIAGNOSTIC);
    if (name === 'place-diagnostic') {
      assert.equal(out.action, 'placed');
      assert.equal(await readFile(path.join(f.home, '.learn-to-tell', 'profiles', PROFILE, 'diagnostics', 'inspection-diagnostic.json'), 'utf8'), JSON.stringify(DIAGNOSTIC));
    }
    if (name === 'place-lesson') {
      assert.equal(out.action, 'placed');
      assert.equal(out.paths.length, 3);
      for (const file of out.paths) assert.ok((await readFile(path.resolve(f.home, '.learn-to-tell', 'profiles', PROFILE, file))).length > 0);
    }
    if (name === 'set-next-paths') {
      assert.deepEqual(out, {ok: true, revision: 4, generation: 5});
      assert.deepEqual((await readDisk(f.home)).map.nextPaths, NEXT_PATHS);
    }
  });
  test(`[V11.${name} missing argument C17] exit 2, usage on stderr, empty stdout, nothing written`, async t => {
    const f = await inputs(t);
    const proc = run(f.home, ...dropLast(build(f)));
    assertUsageError(proc);
    assert.deepEqual(await treeOf(f.home), []);
  });
  test(`[V11.${name} unknown option] exit 2, usage on stderr, empty stdout, nothing written`, async t => {
    const f = await inputs(t);
    const proc = run(f.home, ...build(f), '--bogus');
    assertUsageError(proc);
    assert.deepEqual(await treeOf(f.home), []);
  });
}
test('[V11.unknown command] exit 2, usage on stderr, empty stdout', async t => {
  const f = await inputs(t);
  assertUsageError(run(f.home, 'frobnicate', f.lesson));
});
const missingFile = {
  'check-model': f => ['check-model', '--lesson', f.missing, '--model', f.model, '--oracle', f.oracle],
  diagnose: f => ['diagnose', '--choices', f.missing, '--hypotheses', f.hypotheses],
  'place-diagnostic': f => ['place-diagnostic', f.missing],
  'place-lesson': f => ['place-lesson', f.missing, '--model', f.model, '--oracle', f.oracle],
  'set-next-paths': f => ['set-next-paths', KB_PROFILE, f.missing],
};
for (const [name, build] of Object.entries(missingFile)) {
  test(`[V11.${name} input file missing R17] exit 1, IO Outcome with code, message, next; nothing written`, async t => {
    const f = await inputs(t);
    if (name === 'set-next-paths') await seedMapText(f.home, wrapperText(4, f.map));
    const before = await treeOf(f.home);
    assertFailureOutcome(run(f.home, ...build(f)), 'IO');
    assert.deepEqual(await treeOf(f.home), before);
  });
}
// R17: JSON parse failure is an INVALID Outcome with a JSON error whose path is the input label.
const jsonFailures = [
  ['diagnose choices', f => ['diagnose', '--choices', f.broken, '--hypotheses', f.hypotheses], '/choices'],
  ['diagnose hypotheses', f => ['diagnose', '--choices', f.choices, '--hypotheses', f.broken], '/hypotheses'],
  ['check-model lesson', f => ['check-model', '--lesson', f.broken, '--model', f.model, '--oracle', f.oracle]],
  ['check-model oracle', f => ['check-model', '--lesson', f.lesson, '--model', f.model, '--oracle', f.broken]],
  ['place-diagnostic document', f => ['place-diagnostic', f.broken]],
  ['place-lesson lesson', f => ['place-lesson', f.broken, '--model', f.model, '--oracle', f.oracle]],
  ['place-lesson oracle', f => ['place-lesson', f.lesson, '--model', f.model, '--oracle', f.broken]],
  ['set-next-paths nextPaths', f => ['set-next-paths', KB_PROFILE, f.broken], '/nextPaths'],
];
for (const [label, build, pointer] of jsonFailures) {
  test(`[V11.json failure R17 ${label}] exit 1, INVALID with a JSON error, nothing written`, async t => {
    const f = await inputs(t);
    f.broken = await put(f.dir, 'broken.json', '{not json');
    if (label.startsWith('set-next-paths')) await seedMapText(f.home, wrapperText(4, f.map));
    const before = await treeOf(f.home);
    const out = assertFailureOutcome(run(f.home, ...build(f)), 'INVALID');
    const json = out.errors.filter(error => error.code === 'JSON');
    assert.equal(json.length, 1, JSON.stringify(out.errors));
    assert.match(json[0].path, /^\/[A-Za-z]+$/);
    if (pointer) assert.equal(json[0].path, pointer);
    assert.deepEqual(await treeOf(f.home), before);
  });
}
test('[V11.json failure R17 labels differ] the lesson and the oracle of check-model are told apart', async t => {
  const f = await inputs(t);
  f.broken = await put(f.dir, 'broken.json', '{not json');
  const pathOf = proc => assertFailureOutcome(proc, 'INVALID').errors.find(error => error.code === 'JSON').path;
  const lesson = pathOf(run(f.home, 'check-model', '--lesson', f.broken, '--model', f.model, '--oracle', f.oracle));
  const oracle = pathOf(run(f.home, 'check-model', '--lesson', f.lesson, '--model', f.model, '--oracle', f.broken));
  assert.notEqual(lesson, oracle);
});
test('[V11.failure outcome exit 1] a rejected model is a CHECK Outcome with code, message, next and errors', async t => {
  const f = await inputs(t);
  const model = await put(f.dir, 'bad-model.mjs', modelSource({modelRevision: 2}));
  const out = assertFailureOutcome(run(f.home, 'check-model', '--lesson', f.lesson, '--model', model, '--oracle', f.oracle), 'CHECK');
  assert.deepEqual(out.errors, [{code: 'REVISION', path: '/model/modelRevision'}]);
});
test('[V11.diagnose C9] zero rounds is an INVALID Outcome (exit 1)', async t => {
  const f = await inputs(t);
  const choices = await put(f.dir, 'zero.json', {...CHOICES, rounds: []});
  assertFailureOutcome(run(f.home, 'diagnose', '--choices', choices, '--hypotheses', f.hypotheses), 'INVALID');
});
test('[V11.place-diagnostic C17] a document with a malformed profileId is a PROFILE Outcome and writes nothing', async t => {
  const f = await inputs(t);
  const file = await put(f.dir, 'bad-diagnostic.json', {...DIAGNOSTIC, profileId: 'Bad_ID'});
  assertFailureOutcome(run(f.home, 'place-diagnostic', file), 'PROFILE');
  assert.deepEqual(await treeOf(f.home), []);
});

// Q6 / C7 through the real CLI process
async function pidAlive(pidFile) {
  let text;
  try { text = await readFile(pidFile, 'utf8'); } catch { return assert.fail('model never ran'); }
  const pid = Number(text);
  for (let attempt = 0; attempt < 40; attempt++) {
    try { process.kill(pid, 0); } catch (error) { assert.equal(error.code, 'ESRCH'); return; }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
  assert.fail(`child ${pid} still alive`);
}
test('[V2.cli infinite-loop Q2 Q6] default 5000ms limit: exit 1 with a TIMEOUT Outcome within 7000ms, no lingering child', async t => {
  const f = await inputs(t);
  const pidFile = path.join(f.dir, 'pid');
  const model = await put(f.dir, 'loop.mjs', modelSource({top: `${pidTop(pidFile)}\nwhile (true) {}`}));
  const started = performance.now();
  const proc = run(f.home, 'check-model', '--lesson', f.lesson, '--model', model, '--oracle', f.oracle);
  const elapsed = performance.now() - started;
  const out = assertFailureOutcome(proc, 'CHECK');
  assert.deepEqual(out.errors, [{code: 'TIMEOUT', path: '/model'}]);
  assert.ok(elapsed <= 7000 + 1000, `elapsed ${elapsed} (7000ms limit plus node start-up)`);
  await pidAlive(pidFile);
});
test('[V2.cli process.exit Q6] the CLI still prints one failure Outcome and exits 1', async t => {
  const f = await inputs(t);
  const pidFile = path.join(f.dir, 'pid');
  const model = await put(f.dir, 'exit.mjs', modelSource({top: pidTop(pidFile), pre: 'process.exit(0);'}));
  assertFailureOutcome(run(f.home, 'check-model', '--lesson', f.lesson, '--model', model, '--oracle', f.oracle));
  await pidAlive(pidFile);
});
test('[V2.cli global-pollution Q6] the CLI prints exactly one Outcome line and exits with 0 or 1 matching its ok', async t => {
  const f = await inputs(t);
  const top = "globalThis.JSON = {parse: () => 1, stringify: () => 'x'};\nObject.defineProperty(Object.prototype, '__ltt_polluted', {value: 1, configurable: true, writable: true});\nglobalThis.process.stdout.write = () => true;";
  const model = await put(f.dir, 'pollute.mjs', modelSource({top}));
  const proc = run(f.home, 'check-model', '--lesson', f.lesson, '--model', model, '--oracle', f.oracle);
  const out = outcomeOf(proc);
  assert.equal(typeof out.ok, 'boolean');
  assert.equal(proc.code, out.ok ? 0 : 1);
});
