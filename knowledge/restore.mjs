import path from 'node:path';
import {constants} from 'node:fs';
import {context, profileDir, validProfileId} from './paths.mjs';
import {fail, guarded, listBackups, readFileOrNull, looseGeneration, makeToken, parseStored, profileFail, readRaw, writeMap} from './store.mjs';

const build = async (...args) => {
  const plan = await guarded(() => buildUnguarded(...args));
  return plan.ok === false ? {outcome: plan} : plan;
};

async function buildUnguarded(profileId, opts) {
  if (!validProfileId(profileId)) return {outcome: profileFail()};
  const {fs} = context(opts);
  const dir = profileDir(profileId, opts);
  const raw = await readRaw(profileId, opts);
  const current = parseStored(raw);
  const currentGeneration = looseGeneration(raw) ?? 0;
  const generations = await listBackups(fs, dir);
  const candidates = [];
  for (const generation of generations) {
    const stored = parseStored(await readFileOrNull(fs, path.join(dir, 'backups', `map.${generation}.json`)));
    if (stored.status !== 'ok') continue;
    const lostGenerations = [...new Set(current.status === 'ok' ? [...generations, currentGeneration] : generations)].filter(item => item > generation).sort((a, b) => a - b);
    candidates.push({generation, lostGenerations, token: makeToken('restore', raw, String(generation)), map: stored.map});
  }
  if (candidates.length === 0) return {outcome: fail('NOT_FOUND', '복구할 수 있는 유효한 백업이 없습니다.', '백업 폴더를 확인하거나 결과를 브라우저에서 다시 내보내 가져오세요.')};
  return {raw, current, currentGeneration, maxGeneration: Math.max(currentGeneration, ...generations), candidates, dir, fs};
}

const previewOf = plan => ({
  ok: true,
  action: 'preview',
  preview: {
    candidates: plan.candidates.map(({generation, lostGenerations, token}) => ({generation, lostGenerations, token})),
    current: plan.current.status === 'ok' ? {status: 'ok', generation: plan.current.generation} : {status: plan.current.status},
    token: plan.candidates[0].token
  },
  token: plan.candidates[0].token
});

export async function planRestore(profileId, opts) {
  const plan = await build(profileId, opts);
  return plan.outcome ?? previewOf(plan);
}

export async function applyRestore(profileId, backupGeneration, token, opts) {
  const plan = await build(profileId, opts);
  if (plan.outcome) return plan.outcome;
  const chosen = plan.candidates.find(item => item.generation === backupGeneration);
  if (!chosen) return fail('NOT_FOUND', `generation ${backupGeneration} 백업은 복구 후보에 없습니다.`, '복구 미리 보기에서 후보 generation을 확인하세요.');
  if (!token) return previewOf(plan);
  if (token !== chosen.token) return fail('TOKEN', '확인 token이 현재 상태와 맞지 않습니다. 아무것도 바꾸지 않았습니다.', '복구 미리 보기를 다시 실행해 새 token으로 확인하세요.');
  const unreadable = plan.current.status === 'unreadable';
  if (unreadable) {
    try {
      const prefix = `map.json.corrupt-${plan.currentGeneration}-`;
      const used = (await plan.fs.readdir(plan.dir)).filter(name => name.startsWith(prefix)).map(name => Number(name.slice(prefix.length)) || 0);
      await plan.fs.copyFile(path.join(plan.dir, 'map.json'), path.join(plan.dir, `${prefix}${Math.max(0, ...used) + 1}`), constants.COPYFILE_EXCL);
    } catch (error) {
      return fail('IO', `손상된 map.json을 보존하지 못했습니다: ${error.message}`, '디스크 공간과 권한을 확인한 뒤 다시 시도하세요. 기존 파일은 그대로입니다.');
    }
  }
  const written = await writeMap(profileId, looseGeneration(plan.raw), chosen.map, {...opts, generation: plan.maxGeneration + 1, backup: !unreadable});
  return written.ok ? {ok: true, action: 'restored', generation: written.generation} : written;
}
