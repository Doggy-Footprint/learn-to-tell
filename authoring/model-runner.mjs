import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {output} from '../contracts/index.mjs';
import {validateModelBinding} from '../contracts/model.mjs';
import {runProbes} from './probes.mjs';

// Progress goes through fd 3 with synchronous writes so it survives a model that calls process.exit().
// Reporting primitives are captured before the model loads because model code may replace globals such as JSON.
const {stringify} = JSON;
const {writeSync} = fs;
const send = message => writeSync(3, stringify(message) + '\n');
const importPattern = /\bimport\b|\brequire\s*\(|\bexport\s*(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\})\s*from\b/;

async function load(modelPath) {
  try {
    const source = fs.readFileSync(modelPath, 'utf8');
    if (importPattern.test(source)) return null;
    const model = (await import(pathToFileURL(modelPath).href)).model;
    return typeof model?.calculate === 'function' ? model : null;
  } catch {
    return null;
  }
}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const {modelPath, lesson, oracle} = JSON.parse(Buffer.concat(chunks).toString('utf8'));
const model = await load(modelPath);
let errors;
if (model === null) errors = [{code: 'LOAD', path: '/model'}];
else {
  send({type: 'loaded'});
  const binding = validateModelBinding(model, lesson);
  errors = binding.ok ? output(runProbes(model, lesson, oracle, path => send({type: 'at', path}))).errors : binding.errors;
}
send({type: 'report', errors});
process.exit(0);
