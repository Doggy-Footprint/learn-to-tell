import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {validateDocument} from '../contracts/index.mjs';
import {context, profileDir, validProfileId} from '../knowledge/paths.mjs';
import {fail, guarded, profileFail, readFileOrNull, readMap, unreadableFail, writeMap} from '../knowledge/store.mjs';
import {checkFail, checkModel} from './check-model.mjs';

const attempt = async action => { try { await action(); } catch { /* cleanup failures are deliberately ignored */ } };
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = (errors, next) => fail('INVALID', '문서가 계약 검증을 통과하지 못했습니다.', next, errors);

function parseJson(text, label) {
  try {
    return {value: JSON.parse(text)};
  } catch {
    return {outcome: invalid([{code: 'JSON', path: `/${label}`}], `${label} 파일을 올바른 JSON으로 다시 만드세요.`)};
  }
}

// A present-but-malformed profileId must be reported as PROFILE before any fs call; a missing one is a contract error.
const badProfile = document => isObject(document) && Object.hasOwn(document, 'profileId') && !validProfileId(document.profileId);

function parseDocumentFor(text, kind) {
  const parsed = parseJson(text, kind);
  if (parsed.outcome) return parsed;
  if (badProfile(parsed.value)) return {outcome: profileFail()};
  const checked = validateDocument(parsed.value, kind);
  return checked.ok ? parsed : {outcome: invalid(checked.errors, `${kind} 문서를 계약에 맞게 고친 뒤 다시 배치하세요.`)};
}

// Found before mkdir because a recursive mkdir that fails midway does not report which ancestors it already created.
async function topmostMissing(fs, dir) {
  let missing = null;
  for (let current = dir; ; current = path.dirname(current)) {
    try {
      await fs.stat(current);
      return missing;
    } catch {
      missing = current;
    }
  }
}

async function writeAll(fs, entries) {
  const temps = [];
  const renamed = [];
  const created = [];
  let handle;
  try {
    for (const dir of new Set(entries.map(entry => path.dirname(entry.file)))) {
      const first = await topmostMissing(fs, dir);
      if (first !== null) created.push(first);
      await fs.mkdir(dir, {recursive: true});
    }
    for (const entry of entries) {
      entry.temp = path.join(path.dirname(entry.file), `.${path.basename(entry.file)}.tmp-${process.pid}-${randomBytes(6).toString('hex')}`);
      temps.push(entry.temp);
      handle = await fs.open(entry.temp, 'wx');
      await handle.writeFile(entry.bytes);
      await handle.sync();
      const opened = handle;
      handle = undefined;
      await opened.close();
    }
    for (const entry of entries) {
      await fs.rename(entry.temp, entry.file);
      renamed.push(entry.file);
    }
    return null;
  } catch (error) {
    if (handle) await attempt(() => handle.close());
    for (const file of [...temps, ...renamed]) await attempt(() => fs.rm(file, {force: true}));
    for (const dir of created) await attempt(() => fs.rm(dir, {recursive: true, force: true}));
    return fail('IO', `파일 배치에 실패했습니다: ${error.message}`, '디스크 공간과 권한을 확인한 뒤 다시 시도하세요. 기존 파일과 profile 폴더는 그대로입니다.');
  }
}

// Entries are in rename order; the lesson goes last so a lesson file never exists without its model and oracle.
async function place(fs, dir, entries) {
  const pending = [];
  const conflicts = [];
  for (const entry of entries) {
    const existing = await readFileOrNull(fs, entry.file);
    if (existing === null) pending.push(entry);
    else if (!existing.equals(entry.bytes)) conflicts.push({code: 'CONFLICT', path: path.relative(dir, entry.file)});
  }
  if (conflicts.length) return {outcome: fail('CONFLICT', '같은 id·revision에 내용이 다른 파일이 이미 있습니다. 아무 파일도 쓰지 않았습니다.', 'id 또는 revision을 올려 새로 만들고 다시 배치하세요.', conflicts)};
  const failure = pending.length ? await writeAll(fs, pending) : null;
  return failure ? {outcome: failure} : {action: pending.length ? 'placed' : 'unchanged'};
}

export const placeDiagnostic = (text, opts) => guarded(async () => {
  const parsed = parseDocumentFor(text, 'diagnostic');
  if (parsed.outcome) return parsed.outcome;
  const diagnostic = parsed.value;
  const file = path.join(profileDir(diagnostic.profileId, opts), 'diagnostics', `${diagnostic.diagnosticId}.json`);
  const placed = await place(context(opts).fs, profileDir(diagnostic.profileId, opts), [{file, bytes: Buffer.from(text, 'utf8')}]);
  return placed.outcome ?? {ok: true, action: placed.action, path: file};
});

export const placeLesson = ({lessonText, modelPath, oracleText}, opts) => guarded(async () => {
  const {fs} = context(opts);
  const parsed = parseDocumentFor(lessonText, 'lesson');
  if (parsed.outcome) return parsed.outcome;
  const lesson = parsed.value;
  if (lesson.version !== 2) return invalid([{code: 'VERSION', path: '/version'}], 'lesson v2 문서만 배치할 수 있습니다.');
  const [read] = await Promise.allSettled([fs.readFile(modelPath)]);
  if (read.status !== 'fulfilled') return checkFail([{code: 'LOAD', path: '/model'}]);
  const checked = await checkModel({lessonText, modelPath, oracleText});
  if (!checked.ok) return checkFail(checked.errors);
  const dir = profileDir(lesson.profileId, opts);
  const lessonFile = path.join(dir, 'lessons', `${lesson.lessonId}.${lesson.lessonRevision}.json`);
  const modelFile = path.join(dir, 'models', `${lesson.modelId}.${lesson.modelRevision}.mjs`);
  const oracleFile = path.join(dir, 'models', `${lesson.modelId}.${lesson.modelRevision}.oracle.json`);
  const placed = await place(fs, dir, [
    {file: modelFile, bytes: read.value},
    {file: oracleFile, bytes: Buffer.from(oracleText, 'utf8')},
    {file: lessonFile, bytes: Buffer.from(lessonText, 'utf8')},
  ]);
  return placed.outcome ?? {ok: true, action: placed.action, paths: [lessonFile, modelFile, oracleFile]};
});

export const setNextPaths = (profileId, nextPathsText, opts) => guarded(async () => {
  if (!validProfileId(profileId)) return profileFail();
  const parsed = parseJson(nextPathsText, 'nextPaths');
  if (parsed.outcome) return parsed.outcome;
  const current = await readMap(profileId, opts);
  if (current.status === 'absent') return fail('MAP_MISSING', 'map.json이 없습니다. 먼저 결과를 가져와 map을 만드세요.', 'map.mjs import로 결과를 가져온 뒤 다시 실행하세요.');
  if (current.status === 'unreadable') return unreadableFail();
  const next = {...current.map, revision: current.map.revision + 1, nextPaths: parsed.value};
  const checked = validateDocument(next, 'map');
  if (!checked.ok) return invalid(checked.errors, 'nextPaths를 계약에 맞게 고친 뒤 다시 실행하세요.');
  const written = await writeMap(profileId, current.generation, next, opts);
  return written.ok ? {ok: true, revision: next.revision, generation: written.generation} : written;
});
