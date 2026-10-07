import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const source = join(root, 'skills', 'learn-to-tell');
const usage = 'usage: install-skill.mjs [--dest <skills-dir>]... (default: ~/.claude/skills)\n';

let parsed;
try {
  parsed = parseArgs({options: {dest: {type: 'string', multiple: true}}});
} catch {
  process.stderr.write(usage);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));
const dests = (parsed.values.dest ?? [join(os.homedir(), '.claude', 'skills')]).map(dir => resolve(dir));

const ownedBy = dir => {
  try {
    return JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')).name === manifest.name;
  } catch {
    return false;
  }
};

for (const skillsDir of dests) {
  const target = join(skillsDir, manifest.name);
  // A same-named skill that is not ours (no matching manifest, e.g. a symlink or hand-written skill) is never replaced.
  if (existsSync(target) && !ownedBy(target)) {
    process.stderr.write(`CONFLICT ${target}\n`);
    process.exitCode = 1;
    continue;
  }
  mkdirSync(skillsDir, {recursive: true});
  const work = mkdtempSync(join(skillsDir, `.${manifest.name}-`));
  try {
    for (const file of manifest.files) cpSync(join(source, file), join(work, file));
    writeFileSync(join(work, 'config.json'), JSON.stringify({root}, null, 2) + '\n');
    const previous = `${work}-previous`;
    if (existsSync(target)) renameSync(target, previous);
    renameSync(work, target);
    rmSync(previous, {recursive: true, force: true});
    process.stdout.write(`installed ${manifest.name} ${manifest.version} -> ${target}\n`);
  } finally {
    rmSync(work, {recursive: true, force: true});
  }
}
