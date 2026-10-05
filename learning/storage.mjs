import {calculateInspection} from '../examples/manufacturing-inspection/model.mjs';
import {initialProgress} from './progress.mjs';

export const storageKey = ({lessonId, lessonRevision, resultId}) => `learn-to-tell:${lessonId}:${lessonRevision}:${resultId}`;

// Returns {progress, notice}; notice is null, 'load-failed' (stored value unusable) or 'unavailable' (storage inaccessible).
export function loadProgress(storage, session) {
  const initial = initialProgress(session);
  let raw;
  try {
    raw = storage.getItem(storageKey(initial));
  } catch {
    return {progress: initial, notice: 'unavailable'};
  }
  if (raw === null) return {progress: initial, notice: null};
  let stored;
  try {
    stored = JSON.parse(raw);
  } catch {
    return {progress: initial, notice: 'load-failed'};
  }
  const progress = stored?.progress;
  const usable = stored?.schemaVersion === 1 && progress !== null && typeof progress === 'object'
    && ['lessonId', 'lessonRevision', 'resultId'].every(field => progress[field] === initial[field])
    && Object.keys(progress).sort().join() === Object.keys(initial).sort().join()
    && calculateInspection(progress.inputs).ok;
  return usable ? {progress, notice: null} : {progress: initial, notice: 'load-failed'};
}

export function saveProgress(storage, progress) {
  try {
    storage.setItem(storageKey(progress), JSON.stringify({schemaVersion: 1, progress}));
  } catch {
    return {ok: false, reason: 'unavailable'};
  }
  return {ok: true};
}
