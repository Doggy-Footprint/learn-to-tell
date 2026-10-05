import path from 'node:path';
import {context, profileDir, validProfileId} from './paths.mjs';
import {fail, guarded, listBackups, readFileOrNull, makeToken, parseStored, profileFail, readRaw, unreadableFail, writeMap} from './store.mjs';

const build = async (...args) => {
  const plan = await guarded(() => buildUnguarded(...args));
  return plan.ok === false ? {outcome: plan} : plan;
};

async function buildUnguarded(profileId, resultId, opts) {
  if (!validProfileId(profileId)) return {outcome: profileFail()};
  const {fs} = context(opts);
  const raw = await readRaw(profileId, opts);
  const current = parseStored(raw);
  if (current.status === 'unreadable') return {outcome: unreadableFail()};
  const results = current.status === 'ok' ? current.map.results : [];
  const inMap = results.some(item => item.resultId === resultId);
  const resultIds = [resultId];
  if (inMap) {
    for (let index = 0; index < resultIds.length; index++) {
      for (const item of results) if (item.previousResultId === resultIds[index]) resultIds.push(item.resultId);
    }
  }
  const removed = new Set(resultIds);
  const observationIds = inMap ? current.map.observations.filter(item => removed.has(item.resultId)).map(item => item.observationId) : [];
  const dir = profileDir(profileId, opts);
  const backupGenerations = [];
  for (const generation of (await listBackups(fs, dir)).reverse()) {
    const bytes = await readFileOrNull(fs, path.join(dir, 'backups', `map.${generation}.json`));
    let stored;
    try {
      stored = JSON.parse(bytes?.toString('utf8'));
    } catch {
      continue;
    }
    if (Array.isArray(stored?.map?.results) && stored.map.results.some(item => removed.has(item.resultId))) backupGenerations.push(generation);
  }
  if (!inMap && backupGenerations.length === 0) {
    return {outcome: fail('NOT_FOUND', `resultId ${resultId}를 map과 백업 어디에서도 찾을 수 없습니다.`, 'show 명령으로 저장된 결과를 확인하세요.')};
  }
  if (inMap) backupGenerations.push(current.generation);
  return {inMap, raw, current, removed, resultIds, observationIds, backupGenerations, token: makeToken('delete', raw, resultId)};
}

const previewOf = plan => ({ok: true, action: 'preview', preview: {resultIds: plan.resultIds, observationIds: plan.observationIds, backupGenerations: plan.backupGenerations, mapChange: plan.inMap, token: plan.token}, token: plan.token});

export async function planDelete(profileId, resultId, opts) {
  const plan = await build(profileId, resultId, opts);
  return plan.outcome ?? previewOf(plan);
}

export async function applyDelete(profileId, resultId, token, opts) {
  const plan = await build(profileId, resultId, opts);
  if (plan.outcome) return plan.outcome;
  if (!token) return previewOf(plan);
  if (token !== plan.token) return fail('TOKEN', '확인 token이 현재 상태와 맞지 않습니다. 아무것도 바꾸지 않았습니다.', '삭제 미리 보기를 다시 실행해 새 token으로 확인하세요.');
  const {fs} = context(opts);
  const dir = profileDir(profileId, opts);
  let generation = plan.current.generation ?? 0;
  if (plan.inMap) {
    const {map} = plan.current;
    const next = {...map, results: map.results.filter(item => !plan.removed.has(item.resultId)), observations: map.observations.filter(item => !plan.removed.has(item.resultId))};
    const written = await writeMap(profileId, generation, next, opts);
    if (!written.ok) return written;
    generation = written.generation;
  }
  // For a map change, the backup writeMap just made of the pre-delete map is already in backupGenerations.
  const remainingBackups = [];
  for (const old of plan.backupGenerations) {
    try {
      await fs.rm(path.join(dir, 'backups', `map.${old}.json`), {force: true});
    } catch {
      remainingBackups.push(old);
    }
  }
  if (remainingBackups.length > 0) {
    return {ok: false, code: 'PARTIAL_DELETE', generation, remainingBackups, message: '백업 일부를 삭제하지 못했습니다. map 변경은 저장되었습니다.', next: `같은 resultId ${resultId}로 delete를 다시 실행해 남은 백업을 정리하세요.`};
  }
  return {ok: true, action: 'deleted', generation};
}
