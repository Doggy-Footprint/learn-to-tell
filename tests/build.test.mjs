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

// Failure paths only: no Framework build runs, so every case must stop before dist/ or dist-diagnostic/ is touched (V6, V7).
const root = fileURLToPath(new URL('..', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'ltt-build-'));
// A missing output directory would make 'unchanged' vacuous: park a placeholder build there for the run and remove it afterwards.
const placeholders = [];
test.before(() => { for (const d of ['dist', 'dist-diagnostic']) if (!existsSync(join(root, d))) { mkdirSync(join(root, d)); writeFileSync(join(root, d, 'index.html'), '<!-- placeholder created by tests/build.test.mjs -->\n'); placeholders.push(d); } });
test.after(() => { rmSync(tmp, {recursive: true, force: true}); for (const d of placeholders) rmSync(join(root, d), {recursive: true, force: true}); });

const SESSION = join(root, 'tests/fixtures/learning/session.valid.json');
const LESSON = join(root, 'tests/fixtures/learning/inspection-lesson-v2.json');
const MODEL = join(root, 'examples/manufacturing-inspection/model.mjs');
const SETUP = JSON.parse(readFileSync(join(root, 'tests/fixtures/diagnostic/setup.two-rounds.json'), 'utf8'));
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

// ---- V7: build-diagnostic, classification tree (each rejected choice once; accepted choices are built in tests/e2e/diagnostic.spec.mjs)
const edit = fn => { const s = clone(SETUP); fn(s); return s; };
const cand = (candidateId, n = candidateId) => ({candidateId, title: `제목 ${n}`, decisionQuestion: `질문 ${n}?`, reason: `이유 ${n}`, preview: `미리보기 ${n}`});
const V7_REJECT = [
  ['diagnosticId-format', s => { s.diagnosticId = 'Bad Id'; }, /^VALUE \/diagnosticId$/m],
  ['profileId-format', s => { s.profileId = 'Bad Id'; }, /^VALUE \/profileId$/m],
  ['candidate-empty-title', s => { s.rounds[0].candidates[0].title = ''; }, /^VALUE \/rounds\/0\/candidates\/0\/title$/m],
  ['candidate-missing-preview', s => { delete s.rounds[0].candidates[0].preview; }, /^REQUIRED \/rounds\/0\/candidates\/0\/preview$/m],
  ['round-unknown-field', s => { s.rounds[0].extra = 1; }, /^UNKNOWN_FIELD \/rounds\/0\/extra$/m],
  ['candidate-unknown-field', s => { s.rounds[0].candidates[0].extra = 1; }, /^UNKNOWN_FIELD \/rounds\/0\/candidates\/0\/extra$/m],
  ['rounds-0', s => { s.rounds = []; }, /^RANGE \/rounds$/m],
  ['rounds-3', s => { s.rounds = [s.rounds[0], s.rounds[1], {candidates: [cand('third-a')]}]; }, /^RANGE \/rounds$/m],
  ['candidates-0', s => { s.rounds[1].candidates = []; }, /^RANGE \/rounds\/1\/candidates$/m],
  ['candidates-4', s => { s.rounds[0].candidates = ['a', 'b', 'c', 'd'].map(n => cand(`four-${n}`)); }, /^RANGE \/rounds\/0\/candidates$/m],
  ['duplicate-candidate-id', s => { s.rounds[0].candidates[1].candidateId = s.rounds[0].candidates[0].candidateId; }, /^DUPLICATE \/rounds\/0\/candidates\/1\/candidateId$/m],
  ['unknown-field', s => { s.extra = 1; }, /^UNKNOWN_FIELD \/extra$/m],
  ['kind-error', s => { s.kind = 'diagnostic'; }, /^KIND \/kind$/m],
  ['version-error', s => { s.version = 2; }, /^VERSION \/version$/m],
  ['contextKind-error', s => { s.contextKind = 'hobby'; }, /^[A-Z_]+ \/contextKind$/m],
];
for (const [name, mutate, expected] of V7_REJECT) test(`[T53-V7.${name}] build-diagnostic exits 1 with the contract code and path; dist-diagnostic/ unchanged (R15, R16, C11)`, () => {
  const path = write(`setup-${name}.json`, edit(mutate));
  const r = run('scripts/build-diagnostic.mjs', 'dist-diagnostic', ['--setup', path]);
  assert.equal(r.status, 1, r.stderr);
  wellFormed(r.stderr);
  assert.match(r.stderr, expected);
});
test('[T53-V7.setup-file-missing] SETUP_FILE <path>, exit 1', () => {
  const path = join(tmp, 'no-such-setup.json');
  const r = run('scripts/build-diagnostic.mjs', 'dist-diagnostic', ['--setup', path]);
  assert.equal(r.status, 1); assert.ok(lines(r.stderr).includes(`SETUP_FILE ${path}`), r.stderr);
});
test('[T53-V7.setup-json-error] SETUP_JSON <path>, exit 1', () => {
  const path = write('broken-setup.json', '{"kind": ');
  const r = run('scripts/build-diagnostic.mjs', 'dist-diagnostic', ['--setup', path]);
  assert.equal(r.status, 1); assert.ok(lines(r.stderr).includes(`SETUP_JSON ${path}`), r.stderr);
});
test('[T53-V7.missing-setup] omitting --setup exits 2 with ARGUMENT --setup', () => {
  const r = run('scripts/build-diagnostic.mjs', 'dist-diagnostic', []);
  assert.equal(r.status, 2, r.stderr);
  assert.ok(lines(r.stderr).includes('ARGUMENT --setup'), r.stderr);
});

// ---- S-2: unknown flag is a usage error naming that flag, with the otherwise valid arguments present
test('[T53-V6.unknown-flag] build-lesson --bogus exits 2 with ARGUMENT --bogus', () => {
  const r = run('scripts/build-lesson.mjs', 'dist', [...lessonArgs(), '--bogus', 'x']);
  assert.equal(r.status, 2, r.stderr);
  assert.ok(lines(r.stderr).includes('ARGUMENT --bogus'), r.stderr);
});
test('[T53-V7.unknown-flag] build-diagnostic --bogus exits 2 with ARGUMENT --bogus', () => {
  const r = run('scripts/build-diagnostic.mjs', 'dist-diagnostic', ['--setup', join(root, 'tests/fixtures/diagnostic/setup.two-rounds.json'), '--bogus', 'x']);
  assert.equal(r.status, 2, r.stderr);
  assert.ok(lines(r.stderr).includes('ARGUMENT --bogus'), r.stderr);
});
