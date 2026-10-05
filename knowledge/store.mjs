import {createHash, randomBytes} from 'node:crypto';
import path from 'node:path';
import {validateDocument} from '../contracts/index.mjs';
import {context, profileDir} from './paths.mjs';

const KEEP_BACKUPS = 5;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const missing = error => error?.code === 'ENOENT';
const attempt = async action => { try { await action(); } catch { /* cleanup failures are deliberately ignored */ } };

export const fail = (code, message, next, errors) => ({ok: false, code, message, ...(errors && {errors}), next});
export const profileFail = () => fail('PROFILE', 'profileId 형식이 올바르지 않습니다.', '소문자로 시작하고 소문자·숫자·하이픈만 쓰는 64자 이하 profileId를 입력하세요.');
export const unreadableFail = () => fail('MAP_UNREADABLE', 'map.json을 읽을 수 없습니다. 파일은 그대로 두었습니다.', 'restore 명령으로 백업 복구 미리 보기를 확인하세요.');

export const makeToken = (action, bytes, target) => 'sha256-' + createHash('sha256')
  .update(Buffer.concat([Buffer.from(`${action}\n`), bytes ?? Buffer.from('absent'), Buffer.from(`\n${target}`)]))
  .digest('hex');

class ReadError extends Error {}
const readFailure = error => Object.assign(new ReadError(error.message), {cause: error});

export const guarded = async run => {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ReadError) return fail('IO', `파일을 읽지 못했습니다: ${error.message}`, '파일 권한과 디스크 상태를 확인한 뒤 다시 시도하세요. 저장된 기록은 바꾸지 않았습니다.');
    throw error;
  }
};

export async function readFileOrNull(fs, file) {
  try {
    return await fs.readFile(file);
  } catch (error) {
    if (missing(error)) return null;
    throw readFailure(error);
  }
}

export const readRaw = (profileId, opts) => readFileOrNull(context(opts).fs, path.join(profileDir(profileId, opts), 'map.json'));

// Generation extracted without contract validation; used to compare disk state across a write.
export function looseGeneration(bytes) {
  if (bytes === null) return 0;
  try {
    const generation = JSON.parse(bytes.toString('utf8'))?.generation;
    return Number.isSafeInteger(generation) ? generation : null;
  } catch {
    return null;
  }
}

const unreadable = (reason, errors) => ({status: 'unreadable', reason, errors});

export function parseStored(bytes) {
  if (bytes === null) return {status: 'absent'};
  let wrapper;
  try {
    wrapper = JSON.parse(bytes.toString('utf8'));
  } catch {
    return unreadable('JSON', [{code: 'JSON', path: ''}]);
  }
  if (!isObject(wrapper) || wrapper.storage !== 1 || !Number.isSafeInteger(wrapper.generation) || wrapper.generation < 1 || !Object.hasOwn(wrapper, 'map') || Object.keys(wrapper).length !== 3) {
    return unreadable('WRAPPER', [{code: 'WRAPPER', path: ''}]);
  }
  const validation = validateDocument(wrapper.map, 'map');
  if (!validation.ok) return unreadable('CONTRACT', validation.errors);
  return {status: 'ok', generation: wrapper.generation, map: wrapper.map, bytes};
}

export const readMap = (profileId, opts) => guarded(async () => parseStored(await readRaw(profileId, opts)));

export async function listBackups(fs, dir) {
  let names;
  try {
    names = await fs.readdir(path.join(dir, 'backups'));
  } catch (error) {
    if (missing(error)) return [];
    throw readFailure(error);
  }
  return names.map(name => /^map\.(0|[1-9][0-9]*)\.json$/.exec(name)).filter(Boolean).map(match => Number(match[1])).sort((a, b) => b - a);
}

// opts.generation overrides expected+1 (restore); opts.backup === false skips copying an unreadable current file into backups/.
export async function writeMap(profileId, expectedGeneration, map, opts) {
  const {fs} = context(opts);
  const dir = profileDir(profileId, opts);
  const file = path.join(dir, 'map.json');
  const generation = opts?.generation ?? expectedGeneration + 1;
  const content = JSON.stringify({storage: 1, generation, map}, null, 2) + '\n';
  const temp = path.join(dir, `.map.json.tmp-${process.pid}-${randomBytes(6).toString('hex')}`);
  let handle;
  let failure;
  let detail;
  try {
    await fs.mkdir(path.join(dir, 'backups'), {recursive: true});
    if (expectedGeneration > 0 && opts?.backup !== false) await fs.copyFile(file, path.join(dir, 'backups', `map.${expectedGeneration}.json`));
    handle = await fs.open(temp, 'wx');
    await handle.writeFile(content);
    await handle.sync();
    const opened = handle;
    handle = undefined;
    await opened.close();
    if (looseGeneration(await readFileOrNull(fs, file)) !== expectedGeneration) failure = 'STALE';
    else await fs.rename(temp, file);
  } catch (error) {
    failure = 'IO';
    detail = error.message;
  }
  if (failure) {
    if (handle) await attempt(() => handle.close());
    await attempt(() => fs.rm(temp, {force: true}));
    return failure === 'STALE'
      ? fail('STALE', '저장하는 동안 map이 다른 곳에서 바뀌었습니다. 디스크의 map은 그대로입니다.', '결과를 다시 가져오세요.')
      : fail('IO', `map 저장에 실패했습니다: ${detail}`, '디스크 공간과 권한을 확인한 뒤 다시 시도하세요. 기존 map은 그대로입니다.');
  }
  await attempt(async () => {
    for (const old of (await listBackups(fs, dir)).slice(KEEP_BACKUPS)) await fs.rm(path.join(dir, 'backups', `map.${old}.json`));
  });
  return {ok: true, generation};
}
