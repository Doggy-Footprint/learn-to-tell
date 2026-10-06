import {output, validateDocument} from '../contracts/index.mjs';
import {fail} from '../knowledge/store.mjs';

const REACTIONS = ['similar', 'surprising', 'unknown', 'not-applicable'];
const CHOICE_KEYS = ['kind', 'version', 'diagnosticId', 'profileId', 'contextKind', 'rounds'];
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const draft = (choices, candidates, hypotheses) => ({
  kind: 'diagnostic', version: 1, diagnosticId: choices.diagnosticId, profileId: choices.profileId, contextKind: choices.contextKind,
  candidates, selection: null, confirmation: 'unconfirmed', hypotheses,
});

function reactionErrors(round, base, errors) {
  const ids = new Set(Array.isArray(round.candidates) ? round.candidates.map(candidate => candidate?.candidateId) : []);
  const seen = new Set();
  if (!Array.isArray(round.reactions)) return errors.push({code: 'TYPE', path: `${base}/reactions`});
  round.reactions.forEach((reaction, index) => {
    const path = `${base}/reactions/${index}`;
    if (!isObject(reaction) || Object.keys(reaction).sort().join() !== 'candidateId,reaction') return errors.push({code: 'TYPE', path});
    if (!REACTIONS.includes(reaction.reaction)) errors.push({code: 'VALUE', path: `${path}/reaction`});
    if (!ids.has(reaction.candidateId)) errors.push({code: 'REFERENCE', path: `${path}/candidateId`});
    else if (seen.has(reaction.candidateId)) errors.push({code: 'DUPLICATE', path: `${path}/candidateId`});
    seen.add(reaction.candidateId);
  });
}

function choiceErrors(choices) {
  const errors = [];
  if (!isObject(choices)) return [{code: 'TYPE', path: ''}];
  for (const key of Object.keys(choices)) if (!CHOICE_KEYS.includes(key)) errors.push({code: 'UNKNOWN_FIELD', path: `/${key}`});
  if (choices.kind !== 'diagnostic-choices') errors.push({code: 'KIND', path: '/kind'});
  if (choices.version !== 1) errors.push({code: 'VERSION', path: '/version'});
  if (!Array.isArray(choices.rounds) || choices.rounds.length < 1 || choices.rounds.length > 2) return [...errors, {code: 'TYPE', path: '/rounds'}];
  choices.rounds.forEach((round, index) => {
    const base = `/rounds/${index}`;
    if (!isObject(round) || Object.keys(round).sort().join() !== 'candidates,reactions') return errors.push({code: 'TYPE', path: base});
    reactionErrors(round, base, errors);
    for (const error of validateDocument(draft(choices, round.candidates, []), 'diagnostic').errors) {
      errors.push(error.path.startsWith('/candidates') ? {code: error.code, path: `${base}/candidates`} : error);
    }
  });
  return errors;
}

export function buildDiagnostic(choices, hypotheses) {
  const errors = choiceErrors(choices);
  if (errors.length) return output(errors);
  const diagnostic = draft(choices, choices.rounds.at(-1).candidates, hypotheses);
  const checked = validateDocument(diagnostic, 'diagnostic');
  return checked.ok ? {ok: true, diagnostic, errors: []} : checked;
}

function parseJson(text, label) {
  try {
    return {value: JSON.parse(text)};
  } catch {
    return {errors: [{code: 'JSON', path: `/${label}`}]};
  }
}

export function diagnoseOutcome(choicesText, hypothesesText) {
  const choices = parseJson(choicesText, 'choices');
  const hypotheses = parseJson(hypothesesText, 'hypotheses');
  const parseErrors = [...(choices.errors ?? []), ...(hypotheses.errors ?? [])];
  if (parseErrors.length) return fail('INVALID', '입력 파일을 JSON으로 읽지 못했습니다.', '파일을 올바른 JSON으로 다시 만드세요.', parseErrors);
  const built = buildDiagnostic(choices.value, hypotheses.value);
  return built.ok
    ? {ok: true, diagnostic: built.diagnostic}
    : fail('INVALID', '진단 입력이 계약 검증을 통과하지 못했습니다.', 'errors의 path를 보고 choices 또는 hypotheses를 고친 뒤 다시 실행하세요.', built.errors);
}
