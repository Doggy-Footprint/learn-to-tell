import fs from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {importResult} from '../knowledge/import.mjs';
import {applyDelete, planDelete} from '../knowledge/delete.mjs';
import {applyRestore, planRestore} from '../knowledge/restore.mjs';
import {summarize} from '../knowledge/summary.mjs';
import {fail} from '../knowledge/store.mjs';

const usage = `usage:
  map.mjs import <result.json>
  map.mjs delete <profileId> <resultId> [--confirm <token>]
  map.mjs restore <profileId> [--generation <n> --confirm <token>]
  map.mjs show <profileId>
`;

function usageError() {
  process.stderr.write(usage);
  process.exitCode = 2;
}

const emit = outcome => {
  process.stdout.write(JSON.stringify(outcome) + '\n');
  process.exitCode = outcome.ok ? 0 : 1;
};

async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({args: argv, allowPositionals: true, options: {confirm: {type: 'string'}, generation: {type: 'string'}}});
  } catch {
    return usageError();
  }
  const [command, ...args] = parsed.positionals;
  const {confirm, generation} = parsed.values;
  const flagsOk = command === 'delete' ? generation === undefined : command === 'restore' ? generation === undefined ? confirm === undefined : /^(0|[1-9][0-9]*)$/.test(generation) && confirm !== undefined : generation === undefined && confirm === undefined;
  const arity = {import: 1, delete: 2, restore: 1, show: 1}[command];
  if (!flagsOk || args.length !== arity) return usageError();

  if (command === 'import') {
    let text;
    try {
      text = await fs.readFile(args[0], 'utf8');
    } catch (error) {
      return emit(fail('IO', `result 파일을 읽지 못했습니다: ${error.message}`, '파일 경로와 권한을 확인한 뒤 다시 실행하세요.'));
    }
    return emit(await importResult(text));
  }
  if (command === 'delete') return emit(confirm === undefined ? await planDelete(args[0], args[1]) : await applyDelete(args[0], args[1], confirm));
  if (command === 'restore') return emit(generation === undefined ? await planRestore(args[0]) : await applyRestore(args[0], Number(generation), confirm));
  const summary = await summarize(args[0]);
  if (summary.ok) {
    process.stdout.write(summary.text);
    process.exitCode = 0;
  } else emit(summary);
}

await main(process.argv.slice(2));
