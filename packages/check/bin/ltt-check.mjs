#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { checkHtml } from '../src/index.mjs';

const file = process.argv[2];
if (file === undefined) {
  process.stderr.write('ltt-check: usage: ltt-check <file.html>\n');
  process.exit(2);
}
let html;
try {
  html = await readFile(file, 'utf8');
} catch (err) {
  process.stderr.write(`ltt-check: cannot read ${file}: ${String(err.message).replace(/\s+/g, ' ')}\n`);
  process.exit(2);
}
const report = await checkHtml(html);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exitCode = report.ok ? 0 : 1;
