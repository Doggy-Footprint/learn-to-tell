import {spawnSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {validateSessionConfig} from '../learning/session-config.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const fail = (code, path, status = 1) => {
  process.stderr.write(`${code} ${path}\n`);
  process.exit(status);
};

let sessionPath;
try {
  sessionPath = parseArgs({options: {session: {type: 'string'}}}).values.session;
} catch {
  fail('ARGUMENT', '--session', 2);
}
if (sessionPath === undefined) fail('ARGUMENT', '--session', 2);

let text;
try {
  text = readFileSync(sessionPath, 'utf8');
} catch {
  fail('SESSION_FILE', sessionPath);
}
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  fail('SESSION_JSON', sessionPath);
}
const checked = validateSessionConfig(parsed);
if (!checked.ok) {
  for (const error of checked.errors) process.stderr.write(`${error.code} ${error.path || "/"}\n`);
  process.exit(1);
}

// The Framework root must contain learning/ and examples/ for relative imports, so the site is assembled in a scratch tree and swapped into dist/ only after a successful build.
// Framework 1.13.4 bundles only local imports ending in .js, so copied .mjs modules are renamed and their specifiers rewritten.
function asJs(directory) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) asJs(path);
    else if (/\.m?js$/.test(entry.name)) {
      writeFileSync(path.replace(/\.mjs$/, '.js'), readFileSync(path, 'utf8').replace(/(from\s+')([^']+)\.mjs(')/g, '$1$2.js$3'));
      if (entry.name.endsWith('.mjs')) rmSync(path);
    }
  }
}

const work = mkdtempSync(join(root, '.build-'));
let status = 1;
try {
  const src = join(work, 'src');
  cpSync(join(root, 'site', 'src'), src, {recursive: true});
  cpSync(join(root, 'learning'), join(src, 'learning'), {recursive: true});
  cpSync(join(root, 'examples', 'manufacturing-inspection'), join(src, 'examples', 'manufacturing-inspection'), {recursive: true});
  mkdirSync(join(src, 'contracts'));
  for (const file of ['definitions.mjs', 'content-hash.mjs']) cpSync(join(root, 'contracts', file), join(src, 'contracts', file));
  asJs(src);
  cpSync(join(root, 'observablehq.config.js'), join(work, 'observablehq.config.js'));
  writeFileSync(join(src, 'session.js'), `export default ${JSON.stringify(checked.value)};\n`);

  const bin = join(root, 'node_modules', '@observablehq', 'framework', 'dist', 'bin', 'observable.js');
  const build = spawnSync(process.execPath, [bin, 'build', '--root', 'src', '--config', join(work, 'observablehq.config.js')], {cwd: work, stdio: ['ignore', 'inherit', 'inherit'], env: {...process.env, OBSERVABLE_TELEMETRY_DISABLE: '1'}});
  if (build.status === 0 && existsSync(join(work, 'dist', 'index.html'))) {
    const dist = join(root, 'dist');
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
