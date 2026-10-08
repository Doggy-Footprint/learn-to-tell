// Generic v2 / v3 lessons derived from any v1 lesson (spec 0dcd8454f6e5111d v1); used with the shared contracts bundle and knowledge world fixtures.
import {toV2} from '../contracts-v2/cases.mjs';

export {toV2};
export function toV3(v1, revision = v1.lessonRevision) {
  const lesson = toV2(v1, revision);
  lesson.version = 3;
  lesson.inputs = lesson.inputs.map(x => ({...x, label: 'Input A', step: 1, practical: {min: 1, max: 9, basis: 'Observed range'}}));
  lesson.visuals = [{visualId: 'visual-a', kind: 'sweep', inputId: lesson.inputs[0].inputId, outputIds: ['output-a'], caption: 'Output over input'}];
  return lesson;
}
