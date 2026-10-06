import {spawnSync} from 'node:child_process';
import {cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {validateSetup} from '../learning/diagnostic-setup.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const fail = (code, path, status = 1) => {
  process.stderr.write(`${code} ${path}\n`);
  process.exit(status);
};

const parsedArgs = parseArgs({options: {setup: {type: 'string'}}, strict: false, allowPositionals: true, tokens: true});
for (const token of parsedArgs.tokens) {
  if (token.kind === 'positional') fail('ARGUMENT', token.value, 2);
  if (token.kind === 'option' && token.name !== 'setup') fail('ARGUMENT', `--${token.name}`, 2);
}
const setupPath = parsedArgs.values.setup;
if (typeof setupPath !== 'string') fail('ARGUMENT', '--setup', 2);

let text;
try {
  text = readFileSync(setupPath, 'utf8');
} catch {
  fail('SETUP_FILE', setupPath);
}
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  fail('SETUP_JSON', setupPath);
}
const checked = validateSetup(parsed);
if (!checked.ok) {
  for (const error of checked.errors) process.stderr.write(`${error.code} ${error.path || '/'}\n`);
  process.exit(1);
}

// The site is assembled in a scratch tree and swapped into dist-diagnostic/ only after a successful build.
const work = mkdtempSync(join(root, '.build-'));
let status = 1;
try {
  const src = join(work, 'src');
  cpSync(join(root, 'site', 'diagnostic'), src, {recursive: true});
  const {default: baseConfig} = await import(pathToFileURL(join(root, 'observablehq.config.js')).href);
  writeFileSync(join(work, 'observablehq.config.js'), `export default ${JSON.stringify({...baseConfig, title: 'Learn to Tell 진단'})};\n`);
  writeFileSync(join(src, 'setup.js'), `export default ${JSON.stringify(checked.value)};\n`);

  const bin = join(root, 'node_modules', '@observablehq', 'framework', 'dist', 'bin', 'observable.js');
  const build = spawnSync(process.execPath, [bin, 'build', '--root', 'src', '--config', join(work, 'observablehq.config.js')], {cwd: work, stdio: ['ignore', 'inherit', 'inherit'], env: {...process.env, OBSERVABLE_TELEMETRY_DISABLE: '1'}});
  if (build.status === 0 && existsSync(join(work, 'dist', 'index.html'))) {
    const dist = join(root, 'dist-diagnostic');
    const previous = `${work}-previous`;
    if (existsSync(dist)) renameSync(dist, previous);
    try {
      renameSync(join(work, 'dist'), dist);
    } catch (error) {
      if (existsSync(previous)) renameSync(previous, dist);
      throw error;
    }
    rmSync(previous, {recursive: true, force: true});
    status = 0;
  }
} finally {
  rmSync(work, {recursive: true, force: true});
}
process.exit(status);
