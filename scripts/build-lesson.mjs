import {spawnSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {validateDocument} from '../contracts/index.mjs';
import {validateModelBinding} from '../contracts/model.mjs';
import {validateSessionConfig} from '../learning/session-config.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const fail = (code, path, status = 1) => {
  process.stderr.write(`${code} ${path}\n`);
  process.exit(status);
};
const failErrors = errors => {
  for (const error of errors) process.stderr.write(`${error.code} ${error.path || '/'}\n`);
  process.exit(1);
};

const OPTIONS = ['session', 'lesson', 'model'];
const parsedArgs = parseArgs({options: {session: {type: 'string'}, lesson: {type: 'string'}, model: {type: 'string'}}, strict: false, allowPositionals: true, tokens: true});
for (const token of parsedArgs.tokens) {
  if (token.kind === 'positional') fail('ARGUMENT', token.value, 2);
  if (token.kind === 'option' && !OPTIONS.includes(token.name)) fail('ARGUMENT', `--${token.name}`, 2);
}
for (const name of OPTIONS) if (typeof parsedArgs.values[name] !== 'string') fail('ARGUMENT', `--${name}`, 2);
const {session: sessionPath, lesson: lessonPath, model: modelPath} = parsedArgs.values;

const read = (path, code) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return fail(code, path);
  }
};
const parse = (text, path, code) => {
  try {
    return JSON.parse(text);
  } catch {
    return fail(code, path);
  }
};

const sessionText = read(sessionPath, 'SESSION_FILE');
const lessonText = read(lessonPath, 'LESSON_FILE');
const modelText = read(modelPath, 'MODEL_FILE');
const sessionValue = parse(sessionText, sessionPath, 'SESSION_JSON');
const lessonValue = parse(lessonText, lessonPath, 'LESSON_JSON');
const checked = validateSessionConfig(sessionValue);
if (!checked.ok) failErrors(checked.errors);

const lessonChecked = validateDocument(lessonValue, 'lesson');
const lessonErrors = [...lessonChecked.errors];
if (lessonValue !== null && typeof lessonValue === 'object' && lessonValue.version === 1) lessonErrors.push({code: 'VERSION', path: '/version'});
if (lessonErrors.length) failErrors(lessonErrors);

// Mirrors authoring/model-runner.mjs, which runs on import and so cannot be shared; a model must be one self-contained file.
const importPattern = /\bimport\b|\brequire\s*\(|\bexport\s*(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\})\s*from\b/;
let loadedModel;
try {
  if (importPattern.test(modelText)) throw new Error('import');
  loadedModel = (await import(pathToFileURL(resolve(modelPath)).href)).model;
  if (typeof loadedModel?.calculate !== 'function') throw new Error('calculate');
} catch {
  fail('MODEL_LOAD', modelPath);
}
const binding = validateModelBinding(loadedModel, lessonValue);
if (!binding.ok) failErrors(binding.errors);

// The Framework root must contain learning/ for relative imports, so the site is assembled in a scratch tree and swapped into dist/ only after a successful build.
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
  mkdirSync(join(src, 'contracts'));
  for (const file of ['definitions.mjs', 'content-hash.mjs']) cpSync(join(root, 'contracts', file), join(src, 'contracts', file));
  asJs(src);
  const {default: baseConfig} = await import(pathToFileURL(join(root, 'observablehq.config.js')).href);
  writeFileSync(join(work, 'observablehq.config.js'), `export default ${JSON.stringify({...baseConfig, title: 'Learn to Tell 수업'})};\n`);
  writeFileSync(join(src, 'session.js'), `export default ${JSON.stringify(checked.value)};\n`);
  writeFileSync(join(src, 'lesson.js'), `export default ${JSON.stringify(lessonValue)};\n`);
  writeFileSync(join(src, 'model.js'), modelText);

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
