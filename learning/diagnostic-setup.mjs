import {output, validateDocument} from '../contracts/index.mjs';

const SETUP_KEYS = ['kind', 'version', 'diagnosticId', 'profileId', 'contextKind', 'rounds'];
const HEADER_KEYS = ['diagnosticId', 'profileId', 'contextKind'];
const MAX_ROUNDS = 2;
const MAX_CANDIDATES = 3;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value, key);
const placeholder = [{candidateId: 'placeholder', title: 'placeholder', decisionQuestion: 'placeholder', reason: 'placeholder', preview: 'placeholder'}];

// Candidate and header shapes are delegated to the diagnostic contract through a draft document so the two formats cannot drift.
function draft(setup, candidates) {
  const header = Object.fromEntries(HEADER_KEYS.filter(key => own(setup, key)).map(key => [key, setup[key]]));
  return {kind: 'diagnostic', version: 1, ...header, candidates, selection: null, confirmation: 'unconfirmed', hypotheses: []};
}

function roundErrors(setup, round, index, errors) {
  const base = `/rounds/${index}`;
  if (!isObject(round)) return errors.push({code: 'TYPE', path: base});
  for (const key of Object.keys(round)) if (key !== 'candidates') errors.push({code: 'UNKNOWN_FIELD', path: `${base}/${key}`});
  if (!own(round, 'candidates')) return errors.push({code: 'REQUIRED', path: `${base}/candidates`});
  if (!Array.isArray(round.candidates)) return errors.push({code: 'TYPE', path: `${base}/candidates`});
  if (round.candidates.length < 1 || round.candidates.length > MAX_CANDIDATES) errors.push({code: 'RANGE', path: `${base}/candidates`});
  const seen = new Set();
  round.candidates.forEach((candidate, position) => {
    const id = isObject(candidate) ? candidate.candidateId : undefined;
    if (typeof id === 'string' && seen.has(id)) errors.push({code: 'DUPLICATE', path: `${base}/candidates/${position}/candidateId`});
    seen.add(id);
  });
  for (const error of validateDocument(draft(setup, round.candidates), 'diagnostic').errors) {
    if (error.path.startsWith('/candidates/')) errors.push({code: error.code, path: `${base}${error.path}`});
  }
}

export function validateSetup(setup) {
  if (!isObject(setup)) return output([{code: 'TYPE', path: ''}]);
  const errors = [];
  for (const key of Object.keys(setup)) if (!SETUP_KEYS.includes(key)) errors.push({code: 'UNKNOWN_FIELD', path: `/${key}`});
  if (!own(setup, 'kind')) errors.push({code: 'REQUIRED', path: '/kind'});
  else if (setup.kind !== 'diagnostic-setup') errors.push({code: 'KIND', path: '/kind'});
  if (!own(setup, 'version')) errors.push({code: 'REQUIRED', path: '/version'});
  else if (setup.version !== 1) errors.push({code: 'VERSION', path: '/version'});
  for (const error of validateDocument(draft(setup, placeholder), 'diagnostic').errors) {
    if (HEADER_KEYS.some(key => error.path === `/${key}`)) errors.push(error);
  }
  if (!own(setup, 'rounds')) errors.push({code: 'REQUIRED', path: '/rounds'});
  else if (!Array.isArray(setup.rounds)) errors.push({code: 'TYPE', path: '/rounds'});
  else {
    if (setup.rounds.length < 1 || setup.rounds.length > MAX_ROUNDS) errors.push({code: 'RANGE', path: '/rounds'});
    setup.rounds.forEach((round, index) => roundErrors(setup, round, index, errors));
  }
  const result = output(errors);
  return result.ok ? {ok: true, errors: [], value: setup} : result;
}
