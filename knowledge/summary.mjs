import {validProfileId} from './paths.mjs';
import {fail, profileFail, readMap, unreadableFail} from './store.mjs';

const count = (items, key) => items.filter(item => item === key).length;

export async function summarize(profileId, opts) {
  if (!validProfileId(profileId)) return profileFail();
  const current = await readMap(profileId, opts);
  if (current.ok === false) return current;
  if (current.status === 'absent') return fail('NO_MAP', '저장된 map이 없습니다.', '결과 파일을 import 명령으로 가져오세요.');
  if (current.status === 'unreadable') return unreadableFail();
  const {map, generation} = current;
  const statusOf = new Map(map.results.flatMap(result => result.assessments.map(item => [`${result.resultId}:${item.assessmentId}`, item.status])));
  const previousIds = new Set(map.results.map(result => result.previousResultId));
  const tailStatuses = map.results.filter(result => !previousIds.has(result.resultId)).flatMap(result => result.assessments.map(item => item.status));
  const states = map.results.map(result => result.state);
  const concepts = new Map();
  for (const observation of map.observations) {
    const key = `${observation.conceptId}@${observation.conceptRevision}`;
    concepts.set(key, [...(concepts.get(key) ?? []), statusOf.get(`${observation.resultId}:${observation.assessmentId}`)]);
  }
  const lines = [
    `profile: ${map.profileId}`,
    `revision: ${map.revision}`,
    `generation: ${generation}`,
    `results: completed ${count(states, 'completed')}, partial ${count(states, 'partial')}`,
    ...[...concepts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, statuses]) => `concept ${key}: supported ${count(statuses, 'supported')}, partial ${count(statuses, 'partial')}`),
    `unresolved: pending ${count(tailStatuses, 'pending')}, skipped ${count(tailStatuses, 'skipped')}, not_demonstrated ${count(tailStatuses, 'not_demonstrated')}`
  ];
  return {ok: true, text: lines.join('\n') + '\n'};
}
