import fs from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {checkFail, checkModel} from '../authoring/check-model.mjs';
import {diagnoseOutcome} from '../authoring/diagnose.mjs';
import {placeDiagnostic, placeLesson, setNextPaths} from '../authoring/place.mjs';
import {fail} from '../knowledge/store.mjs';

const usage = `usage:
  lesson.mjs check-model --lesson <lesson.json> --model <model.mjs> --oracle <oracle.json>
  lesson.mjs diagnose --choices <choices.json> --hypotheses <hypotheses.json>
  lesson.mjs place-diagnostic <diagnostic.json>
  lesson.mjs place-lesson <lesson.json> --model <model.mjs> --oracle <oracle.json>
  lesson.mjs set-next-paths <profileId> <nextPaths.json>
`;

const commands = {
  'check-model': {positionals: 0, flags: ['lesson', 'model', 'oracle']},
  diagnose: {positionals: 0, flags: ['choices', 'hypotheses']},
  'place-diagnostic': {positionals: 1, flags: []},
  'place-lesson': {positionals: 1, flags: ['model', 'oracle']},
  'set-next-paths': {positionals: 2, flags: []},
};

function usageError() {
  process.stderr.write(usage);
  process.exitCode = 2;
}

const emit = outcome => {
  process.stdout.write(JSON.stringify(outcome) + '\n');
  process.exitCode = outcome.ok ? 0 : 1;
};

async function readAll(files) {
  const texts = {};
  for (const [label, file] of Object.entries(files)) {
    try {
      texts[label] = await fs.readFile(file, 'utf8');
    } catch (error) {
      return {outcome: fail('IO', `${label} 파일을 읽지 못했습니다: ${error.message}`, '파일 경로와 권한을 확인한 뒤 다시 실행하세요.')};
    }
  }
  return {texts};
}

async function run(command, args, values) {
  if (command === 'set-next-paths') {
    const {texts, outcome} = await readAll({nextPaths: args[1]});
    return outcome ?? setNextPaths(args[0], texts.nextPaths);
  }
  if (command === 'diagnose') {
    const {texts, outcome} = await readAll({choices: values.choices, hypotheses: values.hypotheses});
    return outcome ?? diagnoseOutcome(texts.choices, texts.hypotheses);
  }
  if (command === 'place-diagnostic') {
    const {texts, outcome} = await readAll({diagnostic: args[0]});
    return outcome ?? placeDiagnostic(texts.diagnostic);
  }
  const {texts, outcome} = await readAll({lesson: values.lesson ?? args[0], oracle: values.oracle, model: values.model});
  if (outcome) return outcome;
  const input = {lessonText: texts.lesson, modelPath: values.model, oracleText: texts.oracle};
  if (command === 'place-lesson') return placeLesson(input);
  const checked = await checkModel(input);
  return checked.ok ? {ok: true} : checkFail(checked.errors);
}

async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({args: argv, allowPositionals: true, options: {lesson: {type: 'string'}, model: {type: 'string'}, oracle: {type: 'string'}, choices: {type: 'string'}, hypotheses: {type: 'string'}}});
  } catch {
    return usageError();
  }
  const [command, ...args] = parsed.positionals;
  const spec = Object.hasOwn(commands, command ?? '') ? commands[command] : null;
  const given = Object.keys(parsed.values).sort().join();
  if (!spec || args.length !== spec.positionals || given !== [...spec.flags].sort().join()) return usageError();
  emit(await run(command, args, parsed.values));
}

await main(process.argv.slice(2));
