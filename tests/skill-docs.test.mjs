import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, lstatSync} from 'node:fs';
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
const PRESENT_SKILL = ['reactions', 'place-diagnostic', '한 번에 하나', '3', '2라운드', '$W/diagnostic.json'];
const PRESENT_REFERENCE = ['reactions', 'askedBack'];

for (const file of [SKILL, REFERENCE]) {
  for (const needle of ABSENT) test(`[T54-O7.absent ${file.split('/').pop()}] does not contain "${needle}" (R10, R11, C22)`, () => {
    assert.equal(read(file).includes(needle), false);
  });
  test(`[T54-O7.absent-diagnose-word ${file.split('/').pop()}] never mentions the removed diagnose command as a word (R10, R11)`, () => {
    assert.doesNotMatch(read(file), new RegExp(`\\b${'diag' + 'nose'}\\b`));
  });
}
for (const needle of PRESENT_SKILL) test(`[T54-O7.present SKILL.md] contains "${needle}" (R10, C22)`, () => {
  assert.equal(read(SKILL).includes(needle), true);
});
for (const needle of PRESENT_REFERENCE) test(`[T54-O7.present reference.md] contains "${needle}" (R11, C22)`, () => {
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
