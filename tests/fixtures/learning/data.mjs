// Runtime-free fixture data shared by node tests and Playwright specs (must not import learning/ or contracts/).
import {readFileSync} from 'node:fs';

const json = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
export const session = json('./session.valid.json');
export const session2 = json('./session.second.json');
export const lesson = json('./inspection-lesson-v2.json');
export const syntheticLesson = json('./synthetic-lesson-v2.json');
export const NOW = '2026-10-05T00:00:00.000Z';

export const INPUT_IDS = ['defect-percent', 'detection-percent', 'false-positive-percent'];
export const OUTPUT_IDS = ['true-positive', 'false-positive', 'false-negative', 'true-negative', 'positive-count', 'positive-predictive-value', 'accuracy'];
export const COUNT_FIELDS = OUTPUT_IDS.slice(0, 5);
export const RATIO_FIELDS = OUTPUT_IDS.slice(5);
export const STAGES = ['context', 'prediction', 'simulation', 'assessment', 'return', 'map'];
export const storageKey = (s = session, l = lesson) => `learn-to-tell:${l.lessonId}:${l.lessonRevision}:${s.resultId}`;
export const pred = (...v) => Object.fromEntries(OUTPUT_IDS.map((id, i) => [id, v[i]]));

// Display-unit values computed by hand: scenario baseline-a (1,90,5), transfer-case (2,80,2).
export const baselinePrediction = pred(90, 495, 10, 9405, 585, 15.38, 94.95);
export const retryPrediction = pred(91, 494, 9, 9406, 585, 15.56, 94.97);
export const predC4 = pred(160, 196, 40, 9604, 356, 44.94, 97.64);
export const expectedC4 = pred(160, 196, 40, 9604, 356, 40 / 89 * 100, 97.64);
