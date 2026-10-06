import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
import {readdirSync, existsSync, readFileSync, renameSync} from 'node:fs';
import {networkInterfaces} from 'node:os';
import {request} from 'node:http';
import {fileURLToPath} from 'node:url';
import {tid, gotoFresh, toSimulation, show, fillPrediction, TRANSFER_PRED} from './helpers.mjs';
import {buildDiagnostic, startServe, http as httpGet} from './builds.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const root = fileURLToPath(new URL('../..', import.meta.url));
async function axeViolations(page) {
  const r = await new AxeBuilder({page}).withTags(TAGS).analyze();
  return r.violations.map(v => ({id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target.join(' ')).slice(0, 5)}));
}

test('[V6.axe.before-reveal] zero WCAG 2.2 A/AA violations before result reveal', async ({page}) => {
  await toSimulation(page, {predict: 'record'});
  await expect(tid(page, 'baseline-comparison')).toHaveCount(0);
  expect(await axeViolations(page)).toEqual([]);
});
test('[V6.axe.after-reveal] zero violations after baseline reveal', async ({page}) => {
  await toSimulation(page, {predict: 'record'});
  await (await show(page, 'prediction-reveal')).click();
  await expect(tid(page, 'baseline-comparison')).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});
test('[V6.axe.transfer] zero violations with new-case result shown', async ({page}) => {
  await gotoFresh(page);
  await fillPrediction(page, 'transfer', TRANSFER_PRED);
  await tid(page, 'transfer-record').click();
  await expect(tid(page, 'transfer-result')).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});
test('[V6.axe.hint-open] zero violations with hints opened', async ({page}) => {
  await gotoFresh(page);
  await (await show(page, 'hint-level-2')).click();
  await expect(tid(page, 'hint-text-2')).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

test('[V6.perf] p95 of 20 single-input updates (dispatch until re-queried table and bar show the new value) <= 100ms', async ({page, browser}) => {
  await gotoFresh(page);
  const samples = await page.evaluate(async () => {
    const q = sel => document.querySelector(sel);
    const ready = expectedTp => {
      const cell = q('[data-testid="output-table"] [data-output="true-positive"]');
      const bar = q('[data-testid="bar-true-positive"]');
      if (!cell || !bar) return false;
      const shown = parseFloat(cell.textContent.replace(/,/g, ''));
      const raw = parseFloat(bar.getAttribute('data-value'));
      return Math.abs(shown - expectedTp) < 1e-3 && Math.abs(raw - expectedTp) < 1e-6;
    };
    const out = [];
    for (let i = 0; i < 20; i++) {
      const value = 2 + i * 0.5, expectedTp = 90 * value;
      const t = await new Promise((resolve, reject) => {
        const obs = new MutationObserver(() => { if (ready(expectedTp)) { obs.disconnect(); resolve(performance.now() - start); } });
        obs.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true});
        const timer = setTimeout(() => { obs.disconnect(); reject(new Error(`no table+bar update for input ${value}`)); }, 3000);
        const start = performance.now();
        const input = q('[data-testid="input-defect-percent"]');
        input.value = String(value);
        input.dispatchEvent(new Event('input', {bubbles: true}));
        if (ready(expectedTp)) { clearTimeout(timer); obs.disconnect(); resolve(performance.now() - start); }
      });
      out.push(t);
      await new Promise(r => setTimeout(r, 30));
    }
    return out;
  });
  expect(samples).toHaveLength(20);
  const sorted = [...samples].sort((a, b) => a - b);
  const p95 = sorted[Math.ceil(0.95 * sorted.length) - 1];
  const line = `[V6.perf] chrome=${browser.version()} p95=${p95.toFixed(2)}ms max=${sorted.at(-1).toFixed(2)}ms samples=${samples.map(x => x.toFixed(1)).join(',')}`;
  console.log(line);
  test.info().annotations.push({type: 'perf', description: line});
  expect(p95).toBeLessThanOrEqual(100);
});

function http(method, port, path) {
  return new Promise((resolve, reject) => {
    const req = request({host: '127.0.0.1', port, method, path, agent: false, headers: {connection: 'close'}}, res => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString()})); });
    req.on('error', reject);
    req.end(method === 'GET' ? undefined : 'x');
  });
}
test('[V6.serve] serve script: first stdout line URL, loopback-only, no-cache, serves dist only, no write endpoints', async () => {
  expect(existsSync(`${root}dist`)).toBe(true);
  const port = 4322;
  const child = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(port)], {cwd: root});
  try {
    const first = await new Promise((resolve, reject) => {
      let buf = '';
      child.stdout.on('data', d => { buf += d; if (buf.includes('\n')) resolve(buf.split('\n')[0].trim()); });
      child.on('exit', code => reject(new Error(`serve exited ${code}`)));
      setTimeout(() => reject(new Error('no stdout line in 20s')), 20000);
    });
    expect(first).toBe(`http://127.0.0.1:${port}/`);
    const index = await http('GET', port, '/');
    expect(index.status).toBe(200);
    expect(String(index.headers['cache-control'] ?? '')).toMatch(/no-cache|max-age=0|no-store/);
    const external = Object.values(networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal);
    for (const iface of external) {
      const err = await new Promise(resolve => { const r = request({host: iface.address, port, method: 'GET', path: '/', timeout: 3000}, res => { res.resume(); resolve(null); }); r.on('error', resolve); r.on('timeout', () => { r.destroy(); resolve(new Error('timeout')); }); r.end(); });
      expect(err, `must not be reachable on ${iface.address}`).not.toBeNull();
    }
    for (const method of ['PUT', 'POST', 'DELETE']) {
      await http(method, port, '/written-by-test.txt').catch(() => null);
      expect((await http('GET', port, '/written-by-test.txt')).status).toBe(404);
    }
    expect(readdirSync(`${root}dist`)).not.toContain('written-by-test.txt');
    expect((await http('GET', port, '/..%2f..%2fpackage.json')).body).not.toContain('"learn-to-tell"');
    expect((await http('GET', port, '/package.json')).status).toBe(404);
  } finally { child.kill('SIGTERM'); }
});


// ---- V11: serve --target (R18). Ports are distinct from the Playwright web server (4321).
const DIAG_SETUP = 'tests/fixtures/diagnostic/setup.one-round.json';
test.describe('[T53-V11] serve --target', () => {
  test.describe.configure({mode: 'serial'});
  test.beforeAll(() => { buildDiagnostic(DIAG_SETUP); });
  const bodyOf = path => readFileSync(`${root}${path}/index.html`, 'utf8');
  async function served(args, port) {
    const s = startServe([...args, '--port', String(port)]);
    try {
      expect(await s.ready).toBe(`http://127.0.0.1:${port}/`);
      return (await httpGet('GET', port, '/')).body;
    } finally { s.stop(); }
  }
  function exitOf(args) {
    return new Promise(resolve => {
      const child = spawn(process.execPath, ['scripts/serve.mjs', ...args], {cwd: root});
      let stderr = ''; child.stderr.on('data', d => { stderr += d; });
      const timer = setTimeout(() => { child.kill('SIGTERM'); resolve({code: 'timeout', stderr}); }, 20000);
      child.on('exit', code => { clearTimeout(timer); resolve({code, stderr}); });
    });
  }
  test('[T53-V11.omitted] without --target the lesson build (dist/) is served', async () => {
    expect(await served([], 4326)).toBe(bodyOf('dist'));
  });
  test('[T53-V11.lesson] --target lesson serves dist/', async () => {
    expect(await served(['--target', 'lesson'], 4327)).toBe(bodyOf('dist'));
  });
  test('[T53-V11.diagnostic] --target diagnostic serves dist-diagnostic/', async () => {
    const body = await served(['--target', 'diagnostic'], 4328);
    expect(body).toBe(bodyOf('dist-diagnostic'));
    expect(body).not.toBe(bodyOf('dist'));
  });
  test('[T53-V11.other] --target with any other value exits 2 with ARGUMENT --target', async () => {
    const r = await exitOf(['--target', 'bogus', '--port', '4329']);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain('ARGUMENT --target');
  });
  test('[T53-V11.unknown-flag] an unknown flag exits 2 with ARGUMENT --bogus', async () => {
    const r = await exitOf(['--bogus', 'x', '--port', '4331']);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain('ARGUMENT --bogus');
  });
  test('[T53-V11.dist-missing] a missing target index.html exits 1 with DIST_MISSING', async () => {
    const dir = `${root}dist-diagnostic`, parked = `${root}dist-diagnostic.parked-by-test`;
    renameSync(dir, parked);
    try {
      const r = await exitOf(['--target', 'diagnostic', '--port', '4330']);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/DIST_MISSING .*dist-diagnostic[\\/]index\.html/);
    } finally { renameSync(parked, dir); }
  });
});
