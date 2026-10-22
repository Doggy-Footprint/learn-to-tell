// Spec 753ff3c539424409 "Fuzzing": differential check of LTT.usesTerm against a reference written from FR-14's text.
// Run: node tests/term-boundary.fuzz.mjs   (exit 1 and a minimized counterexample on any difference)
// Not matched by `npm test` (the file name does not end in .test.mjs).
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SEED = 1, CASES = 20000, MAX_LEN = 12;
const ALPHABET = ["a", "p", "t", "F", "L", "O", "P", "S", "0", "가", "분", "산", "상", "관", "없", "이", "는", "된", "투", "자", " ", ".", "』", "-"];
const KEYS = ["pt", "FLOP", "a", "분산", "상관", "이"];
const PARTICLES = "은 는 이 가 을 를 의 에 와 과 도 로 으로 에서 에게 만 까지 부터 보다 처럼 이다 이고 이며 이나 이란 이라 라 란 나 랑 하 한 할 해 했 된 되 될 적 들".split(" ");

const isAlnum = (c) => c !== undefined && /^[A-Za-z0-9]$/.test(c);
const isHangul = (c) => c !== undefined && c >= "가" && c <= "힣";

function reference(text, key) {
  const first = key[0], last = key[key.length - 1];
  for (let i = text.indexOf(key); i >= 0; i = text.indexOf(key, i + 1)) {
    const before = text[i - 1], rest = text.slice(i + key.length), after = rest[0];
    let ok = true;
    if (isAlnum(first) && isAlnum(before)) ok = false;
    if (isAlnum(last) && isAlnum(after)) ok = false;
    if (isHangul(first) && isHangul(before)) ok = false;
    if (isHangul(last) && rest !== "" && isHangul(after) && !PARTICLES.some((p) => rest.startsWith(p))) ok = false;
    if (ok) return true;
  }
  return false;
}

const context = { console: { info() {}, warn() {}, log() {}, error() {} } };
vm.createContext(context);
vm.runInContext(readFileSync(new URL("../skills/learn-to-tell/kit/ltt.js", import.meta.url), "utf8"), context);
const usesTerm = context.LTT.usesTerm;
if (typeof usesTerm !== "function") {
  console.error("LTT.usesTerm is not a function");
  process.exit(1);
}

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];

// Half of the cases plant the key at a random place so that long keys (FLOP) occur often enough;
// the text is then cut to MAX_LEN, which may cut the planted key.
function makeText() {
  const len = Math.floor(rnd() * (MAX_LEN + 1));
  return { len, chars: Array.from({ length: len }, () => pick(ALPHABET)) };
}

const disagree = (text, key) => {
  let got;
  try { got = usesTerm(text, key); } catch (e) { return `threw ${e}`; }
  const want = reference(text, key);
  return got === want ? null : `usesTerm=${got} reference=${want}`;
};

function shrink(text, key) {
  let cur = text;
  for (let changed = true; changed;) {
    changed = false;
    for (let i = 0; i < cur.length; i++) {
      const cand = cur.slice(0, i) + cur.slice(i + 1);
      if (disagree(cand, key)) { cur = cand; changed = true; break; }
    }
  }
  return cur;
}

let failures = 0, planted = 0;
for (let n = 0; n < CASES; n++) {
  const key = pick(KEYS);
  const { chars } = makeText();
  let text = chars.join("");
  if (rnd() < 0.5) {
    const at = Math.floor(rnd() * (text.length + 1));
    text = (text.slice(0, at) + key + text.slice(at)).slice(0, MAX_LEN);
    planted++;
  }
  if (disagree(text, key)) {
    const small = shrink(text, key);
    console.error(`DIFFERENCE case ${n}: key=${JSON.stringify(key)} text=${JSON.stringify(text)}`);
    console.error(`  minimized: key=${JSON.stringify(key)} text=${JSON.stringify(small)} -> ${disagree(small, key)}`);
    if (++failures >= 5) break;
  }
}
if (failures) {
  console.error(`${failures} difference(s) in ${CASES} cases (seed ${SEED})`);
  process.exit(1);
}
console.log(`ok: ${CASES} cases, seed ${SEED}, ${planted} with a planted key, no difference`);
