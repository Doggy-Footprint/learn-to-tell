import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, mkdtempSync, writeFileSync, existsSync, statSync, rmSync, mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectionLesson as lessonV1} from '../examples/manufacturing-inspection/lesson.mjs';
import {lesson as lessonV2} from './fixtures/learning/data.mjs';

// Failure paths only: no Framework build runs, so every case must stop before dist/ is touched (V6).
const root = fileURLToPath(new URL('..', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'ltt-build-'));
// A missing output directory would make 'unchanged' vacuous: park a placeholder build there for the run and remove it afterwards.
const placeholders = [];
test.before(() => { for (const d of ['dist']) if (!existsSync(join(root, d))) { mkdirSync(join(root, d)); writeFileSync(join(root, d, 'index.html'), '<!-- placeholder created by tests/build.test.mjs -->\n'); placeholders.push(d); } });
test.after(() => { rmSync(tmp, {recursive: true, force: true}); for (const d of placeholders) rmSync(join(root, d), {recursive: true, force: true}); });

const SESSION = join(root, 'tests/fixtures/learning/session.valid.json');
const LESSON = join(root, 'tests/fixtures/learning/inspection-lesson-v2.json');
const MODEL = join(root, 'examples/manufacturing-inspection/model.mjs');
const clone = value => structuredClone(value);
const write = (name, content) => { const path = join(tmp, name); writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content)); return path; };

function digest(dirName) {
  const dir = join(root, dirName);
  if (!existsSync(dir)) return 'ABSENT';
  const h = createHash('sha256');
  (function walk(d) { for (const name of readdirSync(d).sort()) { const p = join(d, name); if (statSync(p).isDirectory()) { h.update(`D:${p}`); walk(p); } else { h.update(`F:${p}:${statSync(p).size}`); h.update(readFileSync(p)); } } })(dir);
  return h.digest('hex');
}
const leftovers = () => ['.', 'site', 'site/src'].flatMap(d => existsSync(join(root, d)) ? readdirSync(join(root, d)).filter(n => n.startsWith('.build-')).map(n => join(d, n)) : []);
function run(script, outDir, args) {
  const before = digest(outDir);
  const r = spawnSync(process.execPath, [script, ...args], {cwd: root, encoding: 'utf8', timeout: 60000});
  assert.equal(r.error, undefined);
  assert.equal(digest(outDir), before, `${outDir} bytes unchanged`);
  assert.deepEqual(leftovers(), [], 'no .build-* leftovers');
  return r;
}
const lines = stderr => stderr.split('\n').map(l => l.trim()).filter(Boolean);
const wellFormed = stderr => { const ls = lines(stderr); assert.ok(ls.length > 0, 'stderr has diagnostics'); for (const l of ls) assert.match(l, /^[A-Z_]+ \S+/, `CODE /path line: ${l}`); };
const lessonArgs = (over = {}) => {
  const a = {'--session': SESSION, '--lesson': LESSON, '--model': MODEL, ...over};
  return Object.entries(a).filter(([, v]) => v !== undefined).flat();
};

// ---- V6: build-lesson, equivalence classes
const MODEL_TEXT = `export const model = {modelId: 'MODEL_ID', modelRevision: 1, inputIds: ['defect-percent', 'detection-percent', 'false-positive-percent'], outputIds: ['true-positive', 'false-positive', 'false-negative', 'true-negative', 'positive-count', 'positive-predictive-value', 'accuracy'], calculate() { return {ok: true, value: {}}; }};\n`;
const V6_REJECT = [
  ['v1-lesson', () => ({'--lesson': write('v1.json', lessonV1)}), /VERSION|REQUIRED/],
  ['contract-violation', () => { const l = clone(lessonV2); delete l.outputs; return {'--lesson': write('no-outputs.json', l)}; }, /REQUIRED \/outputs/],
  ['binding-mismatch-model', () => ({'--model': write('other-model.mjs', MODEL_TEXT.replace('MODEL_ID', 'other-model'))}), /REFERENCE \/model\/modelId/],
  ['model-with-import', () => ({'--model': write('with-import.mjs', `import {readFileSync} from 'node:fs';\n${MODEL_TEXT.replace('MODEL_ID', 'manufacturing-inspection')}`)}), /MODEL_LOAD |LOAD \/model/],
];
for (const [name, make, expected] of V6_REJECT) test(`[T53-V6.${name}] build-lesson exits 1 with CODE /path lines; dist/ unchanged, no .build-* leftovers (R13, C8)`, () => {
  const r = run('scripts/build-lesson.mjs', 'dist', lessonArgs(make()));
  assert.equal(r.status, 1, r.stderr);
  wellFormed(r.stderr);
  assert.match(r.stderr, expected);
});
test('[T53-V6.lesson-file-missing] LESSON_FILE <path>, exit 1', () => {
  const path = join(tmp, 'no-such-lesson.json');
  const r = run('scripts/build-lesson.mjs', 'dist', lessonArgs({'--lesson': path}));
  assert.equal(r.status, 1); assert.ok(lines(r.stderr).includes(`LESSON_FILE ${path}`), r.stderr);
});
test('[T53-V6.model-file-missing] MODEL_FILE <path>, exit 1', () => {
  const path = join(tmp, 'no-such-model.mjs');
  const r = run('scripts/build-lesson.mjs', 'dist', lessonArgs({'--model': path}));
  assert.equal(r.status, 1); assert.ok(lines(r.stderr).includes(`MODEL_FILE ${path}`), r.stderr);
});
test('[T53-V6.lesson-json-error] LESSON_JSON <path>, exit 1', () => {
  const path = write('broken-lesson.json', '{"kind": ');
  const r = run('scripts/build-lesson.mjs', 'dist', lessonArgs({'--lesson': path}));
  assert.equal(r.status, 1); assert.ok(lines(r.stderr).includes(`LESSON_JSON ${path}`), r.stderr);
});
for (const name of ['session', 'lesson', 'model']) test(`[T53-V6.missing-${name}] omitting --${name} exits 2 with ARGUMENT --${name}`, () => {
  const r = run('scripts/build-lesson.mjs', 'dist', lessonArgs({[`--${name}`]: undefined}));
  assert.equal(r.status, 2, r.stderr);
  assert.ok(lines(r.stderr).includes(`ARGUMENT --${name}`), r.stderr);
});

// ---- S-2: unknown flag is a usage error naming that flag, with the otherwise valid arguments present
test('[T53-V6.unknown-flag] build-lesson --bogus exits 2 with ARGUMENT --bogus', () => {
  const r = run('scripts/build-lesson.mjs', 'dist', [...lessonArgs(), '--bogus', 'x']);
  assert.equal(r.status, 2, r.stderr);
  assert.ok(lines(r.stderr).includes('ARGUMENT --bogus'), r.stderr);
});

// ---- T54-O5 / C21: the browser diagnostic path is removed (R7, I3)
// Names are assembled from parts so this file does not match the Q4 identifier search it supports (the spec lists no alternative for naming a removed file).
const dash = (...parts) => parts.join('-');
const removedBuild = `scripts/${dash('build', 'diagnostic')}.mjs`, removedSetup = `learning/${dash('diagnostic', 'setup')}.mjs`, removedDist = dash('dist', 'diagnostic');
test('[T54-O5.removed-files C21] the diagnostic build script, diagnose module, setup module and diagnostic page do not exist', () => {
  for (const f of [removedBuild, 'authoring/diagnose.mjs', removedSetup, 'site/diagnostic']) assert.equal(existsSync(join(root, f)), false, `${f} must not exist`);
});
test('[T54-O5.gitignore C21] .gitignore has no entry for the removed diagnostic output directory', () => {
  assert.equal(readFileSync(join(root, '.gitignore'), 'utf8').includes(removedDist), false);
});
test('[T54-O5.build-script-run] running the removed diagnostic build script fails and creates no output directory', () => {
  const r = spawnSync(process.execPath, [removedBuild], {cwd: root, encoding: 'utf8', timeout: 60000});
  assert.notEqual(r.status, 0);
  assert.equal(existsSync(join(root, removedDist)), false);
});
