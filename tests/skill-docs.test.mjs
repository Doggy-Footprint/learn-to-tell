import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, lstatSync, readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFileSync(join(root, file), 'utf8');
const SKILL = 'skills/learn-to-tell/SKILL.md';
const REFERENCE = 'skills/learn-to-tell/reference.md';

// Removed identifiers are assembled from parts so this file never matches the Q4 search it implements.
const dash = (...parts) => parts.join('-');
const camel = (...parts) => parts.map((p, i) => (i ? p[0].toUpperCase() + p.slice(1) : p)).join('');
const REMOVED_IDENTIFIERS = [
  dash('build', 'diagnostic'), dash('diagnostic', 'setup'), camel('diagnose', 'outcome'),
  camel('build', 'diagnostic'), dash('diagnostic', 'choices'), dash('dist', 'diagnostic'),
];

// ---- O7 (C22, R10, R11): absent strings {5}, present strings {6}
const ABSENT = [dash('build', 'diagnostic'), `--target ${'diag' + 'nostic'}`, `lesson.mjs ${'diag' + 'nose'}`, dash('diagnostic', 'choices'), dash('diagnostic', 'setup')];
// T5-4 concept ladder (spec 5a2c9e7d1b4f8036 O6): SKILL present strings {11}, reference present strings {4}.
const PRESENT_SKILL = ['ladder', '사다리', 'known', 'vague', 'unknown', '5문항', 'reactions', 'place-diagnostic', '한 번에 하나', '2라운드', '$W/diagnostic.json'];
const PRESENT_REFERENCE = ['ladder', 'reactions', 'askedBack', 'vague'];

for (const file of [SKILL, REFERENCE]) {
  for (const needle of ABSENT) test(`[T54L-O6.absent ${file.split('/').pop()}] does not contain "${needle}" (R10, R11, C22)`, () => {
    assert.equal(read(file).includes(needle), false);
  });
  test(`[T54-O7.absent-diagnose-word ${file.split('/').pop()}] never mentions the removed diagnose command as a word (R10, R11)`, () => {
    assert.doesNotMatch(read(file), new RegExp(`\\b${'diag' + 'nose'}\\b`));
  });
}
for (const needle of PRESENT_SKILL) test(`[T54L-O6.present SKILL.md] contains "${needle}" (R6, C16)`, () => {
  assert.equal(read(SKILL).includes(needle), true);
});
for (const needle of PRESENT_REFERENCE) test(`[T54L-O6.present reference.md] contains "${needle}" (R7, C16)`, () => {
  assert.equal(read(REFERENCE).includes(needle), true);
});
test('[T54-O7.present askedBack] askedBack appears in the skill documents (R10 records asked-back reactions, R11 documents the field)', () => {
  assert.equal(read(SKILL).includes('askedBack') || read(REFERENCE).includes('askedBack'), true);
});

// ---- O8 (Q4): removed identifiers have no reference in tracked files outside agent-docs
export function findIdentifiers(files, readText, identifiers = REMOVED_IDENTIFIERS) {
  const hits = [];
  for (const file of files) {
    if (file === 'agent-docs' || file.startsWith('agent-docs/')) continue;
    const text = readText(file);
    if (text === null) continue;
    for (const id of identifiers) if (text.includes(id)) hits.push(`${file}: ${id}`);
  }
  return hits;
}
const listFiles = () => {
  const r = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.split('\0').filter(Boolean);
};
const readOrNull = file => {
  let stat;
  try { stat = lstatSync(join(root, file)); } catch { return null; }
  return stat.isFile() ? readFileSync(join(root, file), 'utf8') : null;
};

test('[T54-O8.scanner-controls] the scanner reports every identifier outside agent-docs, ignores agent-docs, and skips missing files', () => {
  const files = ['a.mjs', 'agent-docs/x.md', 'agent-docs', 'gone.mjs'];
  const texts = Object.fromEntries(REMOVED_IDENTIFIERS.map((id, i) => [`f${i}.txt`, `x ${id} y`]));
  assert.deepEqual(findIdentifiers([...files, ...Object.keys(texts)], f => (f === 'gone.mjs' ? null : f === 'agent-docs/x.md' ? REMOVED_IDENTIFIERS.join(' ') : texts[f] ?? 'clean')).sort(),
    REMOVED_IDENTIFIERS.map((id, i) => `f${i}.txt: ${id}`).sort());
  assert.equal(REMOVED_IDENTIFIERS.length, 6);
  assert.equal(new Set(REMOVED_IDENTIFIERS).size, 6);
});
test('[T54-O8.no-references Q4] none of the six removed identifiers appears in any repository file outside agent-docs', () => {
  const files = listFiles();
  assert.ok(files.includes('package.json') && files.some(f => f.startsWith('tests/')), 'file listing sanity');
  assert.deepEqual(findIdentifiers(files, readOrNull), []);
});

// ---- T5-4 result submit (spec 3c9d5e71a0b84f26 v1) O6: files x (present strings, absent strings). Files are read as plain text.
const CONTENT_JS = 'site/src/components/content.js';
const exportNotice = () => {
  const m = read(CONTENT_JS).match(/export const EXPORT_NOTICE\s*=\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/);
  assert.ok(m, 'EXPORT_NOTICE declaration found');
  return m[2];
};
const HTTP_SERVER = ['http', 'server'].join('-');

for (const needle of ['--out', 'result-', '$W/result-<resultId>.json', 'serve.mjs --out $W']) test(`[T54S-O6.present SKILL.md] contains "${needle}" (R12, C18)`, () => {
  assert.equal(read(SKILL).includes(needle), true);
});
for (const needle of ['내려받', '파일 경로']) test(`[T54S-O6.absent SKILL.md] does not contain "${needle}" (R12, C18)`, () => {
  assert.equal(read(SKILL).includes(needle), false);
});
test('[T54S-O6.present reference.md] contains "--out" (R12, C18)', () => {
  assert.equal(read(REFERENCE).includes('--out'), true);
});
for (const needle of ['다운로드', '내려받', '경로']) test(`[T54S-O6.absent EXPORT_NOTICE] does not contain "${needle}" (R11, C18)`, () => {
  assert.equal(exportNotice().includes(needle), false);
});
for (const needle of ['제출', 'agent', 'map', '검증']) test(`[T54S-O6.present EXPORT_NOTICE] contains "${needle}" (R11, C18)`, () => {
  assert.equal(exportNotice().includes(needle), true);
});
for (const file of ['package.json', 'package-lock.json']) test(`[T54S-O6.absent ${file}] does not contain the removed static-server dependency (R13, C19)`, () => {
  assert.equal(read(file).includes(HTTP_SERVER), false);
});
test('[T54S-O6.absent scripts] no file under scripts/ mentions the removed static-server dependency (R13, C19)', () => {
  const names = readdirSync(join(root, 'scripts'));
  assert.ok(names.length > 0);
  for (const name of names) { const stat = lstatSync(join(root, 'scripts', name)); if (stat.isFile()) assert.equal(read(`scripts/${name}`).includes(HTTP_SERVER), false, name); }
});
test('[T54S-O6.controls] the EXPORT_NOTICE extractor reads the declared string', () => {
  assert.ok(exportNotice().length > 0);
});
