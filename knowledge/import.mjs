import {createHash} from 'node:crypto';
import path from 'node:path';
import {parseDocument, validateBundle, validateDocument} from '../contracts/index.mjs';
import {context, profileDir} from './paths.mjs';
import {fail, guarded, parseStored, readRaw, unreadableFail, writeMap} from './store.mjs';

const emptyMap = profileId => ({kind: 'map', version: 2, profileId, revision: 1, lessons: [], results: [], observations: [], nextPaths: []});
const invalid = (errors, next) => fail('INVALID', '문서가 계약 검증을 통과하지 못했습니다.', next, errors);
const observationId = (resultId, assessmentId) => 'obs-' + createHash('sha256').update(`${resultId}:${assessmentId}`).digest('hex').slice(0, 16);

async function loadDocument(fs, file, label, missingCode) {
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    return error?.code === 'ENOENT'
      ? {outcome: fail(missingCode, `${label} 파일이 profile 폴더에 없습니다.`, `${label} 파일을 profile 폴더에 둔 뒤 다시 가져오세요.`)}
      : {outcome: fail('IO', `${label} 파일을 읽지 못했습니다: ${error.message}`, '파일 권한을 확인한 뒤 다시 시도하세요.')};
  }
  try {
    return {document: JSON.parse(text)};
  } catch {
    return {outcome: invalid([{code: 'JSON', path: `/${label}`}], `${label} 파일을 다시 만들어 두세요.`)};
  }
}

export const importResult = (resultText, opts) => guarded(() => importUnguarded(resultText, opts));

async function importUnguarded(resultText, opts) {
  const {fs} = context(opts);
  const parsed = parseDocument(resultText, 'result');
  if (!parsed.ok) return invalid(parsed.errors, '브라우저에서 결과를 다시 내보내 가져오세요.');
  const result = JSON.parse(resultText);
  const profileId = result.profileId;
  const dir = profileDir(profileId, opts);
  const current = parseStored(await readRaw(profileId, opts));
  if (current.status === 'unreadable') return unreadableFail();
  const map = current.status === 'ok' ? current.map : emptyMap(profileId);

  const lessonLoad = await loadDocument(fs, path.join(dir, 'lessons', `${result.lessonId}.${result.lessonRevision}.json`), 'lesson', 'MISSING_LESSON');
  if (lessonLoad.outcome) return lessonLoad.outcome;
  const lesson = lessonLoad.document;
  const lessonCheck = validateDocument(lesson, 'lesson');
  if (!lessonCheck.ok) return invalid(lessonCheck.errors.map(error => ({code: error.code, path: `/lesson${error.path}`})), 'lesson 파일을 올바르게 다시 만드세요.');
  const diagnosticLoad = await loadDocument(fs, path.join(dir, 'diagnostics', `${lesson.diagnosticId}.json`), 'diagnostic', 'MISSING_DIAGNOSTIC');
  if (diagnosticLoad.outcome) return diagnosticLoad.outcome;

  const previousResult = map.results.find(item => item.resultId === result.previousResultId) ?? null;
  const bundle = validateBundle({diagnostic: diagnosticLoad.document, lesson, result, map, previousResult});
  if (!bundle.ok) {
    const needsPrevious = result.sequence > 1 && bundle.errors.some(error => error.code === 'REFERENCE' && error.path === '/result/previousResultId');
    return invalid(bundle.errors, needsPrevious ? `먼저 ${result.previousResultId} 결과를 가져오세요.` : '오류를 고친 결과를 다시 내보내 가져오세요.');
  }
  if (bundle.duplicateOf) return {ok: true, action: 'duplicate', duplicateOf: bundle.duplicateOf};

  const byId = new Map(map.results.map(item => [item.resultId, item]));
  const ancestors = new Set();
  for (let id = result.previousResultId; id !== null; id = byId.get(id)?.previousResultId ?? null) ancestors.add(id);
  const observed = new Set(map.observations.filter(item => ancestors.has(item.resultId)).map(item => item.assessmentId));
  const created = result.assessments
    .filter(item => (item.status === 'supported' || item.status === 'partial') && !observed.has(item.assessmentId))
    .map(item => {
      const response = result.responses.find(candidate => candidate.responseId === item.responseId);
      return {observationId: observationId(result.resultId, item.assessmentId), resultId: result.resultId, assessmentId: item.assessmentId, conceptId: response.conceptId, conceptRevision: response.conceptRevision};
    });
  const hasLesson = map.lessons.some(item => item.lessonId === lesson.lessonId && item.lessonRevision === lesson.lessonRevision);
  const next = {...map, lessons: hasLesson ? map.lessons : [...map.lessons, lesson], results: [...map.results, result], observations: [...map.observations, ...created]};
  const written = await writeMap(profileId, current.status === 'ok' ? current.generation : 0, next, opts);
  return written.ok ? {ok: true, action: 'imported', generation: written.generation} : written;
}
