// Test world for T4 (spec 6c7d86d736dae677 v1). Expected values are computed here from fixture data only;
// nothing in knowledge/ or scripts/ is imported.
import {createHash} from 'node:crypto';
import {mkdir, writeFile, readFile, readdir, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validBundle, clone} from '../contracts/cases.mjs';
import {computeContentHash} from '../../../contracts/content-hash.mjs';

export {clone};
export const PROFILE = 'profile-a';
export const STATUSES = ['pending', 'supported', 'partial', 'not_demonstrated', 'skipped'];
const CONCEPTS = {a: {id: 'concept-a', rev: 1}, b: {id: 'concept-b', rev: 2}};

export const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');

export async function tempHome(t) {
  const home = await mkdtemp(path.join(tmpdir(), 'ltt-t4-'));
  t.after(() => rm(home, {recursive: true, force: true}));
  return home;
}

export function layout(home, profileId = PROFILE) {
  const dir = path.join(home, '.learn-to-tell', 'profiles', profileId);
  return {dir, map: path.join(dir, 'map.json'), backups: path.join(dir, 'backups'), backup: g => path.join(dir, 'backups', `map.${g}.json`)};
}

export function makeLesson(profileId = PROFILE) {
  const lesson = clone(validBundle().lesson);
  lesson.profileId = profileId;
  lesson.concepts.push({conceptId: 'concept-b', conceptRevision: 2, label: 'Defect escape'});
  for (const criterion of lesson.rubric.criteria) criterion.conceptIds = ['concept-a', 'concept-b'];
  return lesson;
}
export function makeDiagnostic(profileId = PROFILE) {
  const diagnostic = clone(validBundle().diagnostic);
  diagnostic.profileId = profileId;
  return diagnostic;
}

const neutral = status => status === 'pending' || status === 'skipped';

// items: [{n, status, concept:'a'|'b'}]; response-n / assessment-n ids.
export async function makeResult({resultId, sequence = 1, previousResultId = null, items, profileId = PROFILE, baseMapRevision = 1, state = 'partial', salt = 'Compare cost and missed defects', version = 2}) {
  const responses = items.map(item => {
    const concept = CONCEPTS[item.concept ?? 'a'];
    return {responseId: `response-${item.n}`, activityId: 'activity-assessment', conceptId: concept.id, conceptRevision: concept.rev, purpose: 'explanation', attempt: 1, previousResponseId: null, answer: `${salt} ${item.n}`, help: 'none', recordedAt: '2026-10-04T00:00:00.000Z', visibility: 'unknown'};
  });
  const assessments = items.map(item => ({assessmentId: `assessment-${item.n}`, responseId: `response-${item.n}`, criterionId: 'criterion-concept', rubricVersion: 1, status: item.status, reviewer: neutral(item.status) ? 'unreviewed' : 'agent', context: 'Manufacturing inspection', help: 'none'}));
  const result = {kind: 'result', version, resultId, profileId, lessonId: 'lesson-a', lessonRevision: 1, baseMapRevision, sequence, previousResultId, state, responses, assessments};
  result.contentHash = await computeContentHash(result);
  return result;
}

// levels[k] = items of checkpoint k+1; each level must extend the previous one as a prefix.
export async function makeChain(levels, {prefix = 'result-', baseMapRevision = 1, salt, profileId = PROFILE} = {}) {
  const out = [];
  for (let k = 0; k < levels.length; k++) {
    out.push(await makeResult({resultId: `${prefix}${k + 1}`, sequence: k + 1, previousResultId: k ? `${prefix}${k}` : null, items: levels[k], baseMapRevision, salt, profileId, state: k === levels.length - 1 ? 'completed' : 'partial'}));
  }
  return out;
}
export const item = (n, status, concept = 'a') => ({n, status, concept});

export const obsId = (resultId, assessmentId) => 'obs-' + sha(`${resultId}:${assessmentId}`).slice(0, 16);

// A checkpoint's assessments are a prefix extension of its predecessor's; only the extension is a first appearance.
export function expectedObservations(results) {
  const out = [];
  for (const result of results) {
    const previous = results.find(other => other.resultId === result.previousResultId);
    for (const assessment of result.assessments.slice(previous ? previous.assessments.length : 0)) {
      if (assessment.status !== 'supported' && assessment.status !== 'partial') continue;
      const response = result.responses.find(r => r.responseId === assessment.responseId);
      out.push({observationId: obsId(result.resultId, assessment.assessmentId), resultId: result.resultId, assessmentId: assessment.assessmentId, conceptId: response.conceptId, conceptRevision: response.conceptRevision});
    }
  }
  return out;
}

export function nextPath(reason) {
  return {pathId: 'path-x', lessonId: 'lesson-a', conceptId: 'concept-a', conceptRevision: 1, reason, lessonStatus: 'placed'};
}
export function mapFor(results, {profileId = PROFILE, revision = 1, nextPaths = []} = {}) {
  return {kind: 'map', version: 2, profileId, revision, lessons: [makeLesson(profileId)], results: clone(results), observations: expectedObservations(results), nextPaths: clone(nextPaths)};
}
export const sortedObs = map => ({...map, observations: [...map.observations].sort((a, b) => a.observationId < b.observationId ? -1 : 1)});

export const wrapperText = (generation, map) => JSON.stringify({storage: 1, generation, map});
export const tokenFor = (action, bytes, target) => 'sha256-' + sha(`${action}\n${bytes ?? 'absent'}\n${target}`);

export async function placeFixtures(home, profileId = PROFILE, {lesson = true, diagnostic = true} = {}) {
  const {dir} = layout(home, profileId);
  await mkdir(path.join(dir, 'lessons'), {recursive: true});
  await mkdir(path.join(dir, 'diagnostics'), {recursive: true});
  if (lesson) await writeFile(path.join(dir, 'lessons', 'lesson-a.1.json'), JSON.stringify(makeLesson(profileId)));
  if (diagnostic) await writeFile(path.join(dir, 'diagnostics', 'diagnostic-a.json'), JSON.stringify(makeDiagnostic(profileId)));
}
export async function seedMapText(home, text, profileId = PROFILE) {
  const l = layout(home, profileId);
  await mkdir(l.dir, {recursive: true});
  await writeFile(l.map, text);
}
export async function seedBackupText(home, generation, text, profileId = PROFILE) {
  const l = layout(home, profileId);
  await mkdir(l.backups, {recursive: true});
  await writeFile(l.backup(generation), text);
}

export async function readText(file) {
  try { return await readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export async function readDisk(home, profileId = PROFILE) {
  const text = await readText(layout(home, profileId).map);
  return text === null ? null : {text, ...JSON.parse(text)};
}
export async function listDir(dir) {
  try { return (await readdir(dir)).sort(); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
export async function backupGenerations(home, profileId = PROFILE) {
  const names = await listDir(layout(home, profileId).backups);
  return names.map(name => Number(/^map\.(\d+)\.json$/.exec(name)?.[1] ?? NaN)).sort((a, b) => a - b);
}
// Every file under home with its bytes.
export async function snapshot(home) {
  const out = {};
  for (const entry of await readdir(home, {recursive: true, withFileTypes: true})) {
    if (entry.isFile()) {
      const file = path.join(entry.parentPath, entry.name);
      out[path.relative(home, file)] = await readFile(file, 'utf8');
    }
  }
  return out;
}
// Files that are neither map.json, a preserved corrupt file, nor a final backup: leftover temps.
export async function strayFiles(home, profileId = PROFILE) {
  const l = layout(home, profileId);
  const stray = [];
  for (const entry of await listDir(l.dir)) {
    if (['map.json', 'backups', 'lessons', 'diagnostics'].includes(entry) || entry.startsWith('map.json.corrupt-')) continue;
    stray.push(entry);
  }
  for (const entry of await listDir(l.backups)) if (!/^map\.\d+\.json$/.test(entry)) stray.push(`backups/${entry}`);
  return stray;
}

export const truncatedText = (generation, map) => wrapperText(generation, map).slice(0, 30);
export const noWrapperText = map => JSON.stringify(map);
export async function contractViolationText(generation, profileId = PROFILE) {
  const results = await makeChain([[item(1, 'supported')]], {profileId});
  const map = mapFor(results, {profileId});
  map.results[0].contentHash = 'sha256-' + '0'.repeat(64);
  return wrapperText(generation, map);
}
