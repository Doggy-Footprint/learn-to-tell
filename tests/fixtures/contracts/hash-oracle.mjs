// Independent oracle for the result content hash (spec Signatures: canonicalContent/computeContentHash).
// Written from the spec text only; never imports contracts/ or learning/.
import {createHash} from 'node:crypto';

export const HASH_FORMAT = /^sha256-[0-9a-f]{64}$/;

function canon(value) {
  if (Array.isArray(value)) return `[${value.map(canon).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canon(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function oracleCanonical(result) {
  const {resultId: _r, contentHash: _c, ...rest} = result;
  return canon(rest);
}
export const oracleHash = result => `sha256-${createHash('sha256').update(oracleCanonical(result), 'utf8').digest('hex')}`;
export const withHash = result => ({...result, contentHash: oracleHash(result)});

const isPlain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const rehash = r => { if (isPlain(r) && typeof r.contentHash === 'string' && HASH_FORMAT.test(r.contentHash)) r.contentHash = oracleHash(r); };
// Recomputes the hash of every result-like object (result document, map.results[*], bundle result/previousResult/map.results[*])
// whose contentHash is currently well-formed; absent or malformed hashes are left untouched so HASH/REQUIRED/VALUE cases stay intended.
export function reseal(document) {
  if (!isPlain(document)) return document;
  if (document.kind === 'result') rehash(document);
  if (Array.isArray(document.results)) document.results.forEach(rehash);
  for (const key of ['result', 'previousResult']) if (isPlain(document[key])) rehash(document[key]);
  if (isPlain(document.map) && Array.isArray(document.map.results)) document.map.results.forEach(rehash);
  return document;
}

// Fixed vector computed outside Node (shasum -a 256 / openssl dgst -sha256 on the UTF-8 canonical text).
export const VECTOR = {
  input: {version: 2, kind: 'result', resultId: 'result-vec', contentHash: 'sha256-ignored', sequence: 1, answer: '한국어', list: [{b: 2, a: 1}, [3, 1]], z: null, flag: true},
  canonical: '{"answer":"한국어","flag":true,"kind":"result","list":[{"a":1,"b":2},[3,1]],"sequence":1,"version":2,"z":null}',
  hash: 'sha256-5d496191925d33e5a54ce49f035670ee35f6edb96cca2ca46b473a3459b5fa04',
};
