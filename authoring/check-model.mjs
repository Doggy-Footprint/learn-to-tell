import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {output, parseDocument} from '../contracts/index.mjs';
import {validateOracleBinding} from '../contracts/model.mjs';
import {fail} from '../knowledge/store.mjs';

const runner = fileURLToPath(new URL('./model-runner.mjs', import.meta.url));
const TIMEOUT_MS = 5000;

function parsed(text, kind) {
  const result = parseDocument(text, kind);
  return result.ok
    ? {document: JSON.parse(text), errors: []}
    : {errors: result.errors.map(error => error.code === 'JSON' ? {code: 'JSON', path: `/${kind}`} : error)};
}

// A model can corrupt what the child prints, so an unparseable or malformed report counts as no report.
const parseLine = line => { try { return JSON.parse(line); } catch { return null; } };
const validErrors = errors => Array.isArray(errors) && errors.every(error => error !== null && typeof error === 'object' && typeof error.code === 'string' && typeof error.path === 'string');

function interpret(buffer) {
  const messages = buffer.split('\n').map(parseLine).filter(message => message !== null && typeof message === 'object');
  const report = messages.find(message => message.type === 'report' && validErrors(message.errors));
  if (report) return report.errors;
  const last = messages.findLast(message => message.type === 'at');
  return [messages.some(message => message.type === 'loaded') ? {code: 'THROW', path: last?.path ?? '/model'} : {code: 'LOAD', path: '/model'}];
}

async function runChild(input, timeoutMs) {
  const child = spawn(process.execPath, [runner], {stdio: ['pipe', 'ignore', 'ignore', 'pipe']});
  let buffer = '';
  child.stdio[3].on('data', chunk => void (buffer += chunk));
  const ended = new Promise(resolve => {
    const done = () => resolve('ended');
    child.on('close', done);
    child.on('error', done);
    child.stdin.on('error', done);
  });
  let timer;
  const expired = new Promise(resolve => { timer = setTimeout(resolve, timeoutMs, 'timeout'); });
  child.stdin.end(JSON.stringify(input));
  const state = await Promise.race([ended, expired]);
  clearTimeout(timer);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await once(child, 'close');
  }
  return state === 'timeout' ? [{code: 'TIMEOUT', path: '/model'}] : interpret(buffer);
}

export async function checkModel({lessonText, modelPath, oracleText}, {timeoutMs = TIMEOUT_MS} = {}) {
  const lesson = parsed(lessonText, 'lesson');
  const oracle = parsed(oracleText, 'oracle');
  const contract = [...lesson.errors, ...oracle.errors];
  if (contract.length) return output(contract);
  const binding = validateOracleBinding(oracle.document, lesson.document);
  if (!binding.ok) return binding;
  return output(await runChild({modelPath, lesson: lesson.document, oracle: oracle.document}, timeoutMs));
}

export const checkFail = errors => errors.some(error => error.code === 'JSON')
  ? fail('INVALID', '문서를 JSON으로 읽지 못했습니다.', '파일을 올바른 JSON으로 다시 만드세요.', errors)
  : fail('CHECK', '모델 검증에 실패했습니다. 파일은 배치하지 않았습니다.', 'errors의 code와 path를 보고 lesson·모델·oracle을 고친 뒤 다시 검증하세요.', errors);
