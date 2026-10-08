import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
import {readdirSync, existsSync, readFileSync, renameSync} from 'node:fs';
import {networkInterfaces} from 'node:os';
import {request} from 'node:http';
import {fileURLToPath} from 'node:url';
import {tid, gotoFresh, toSimulation, show, fillPrediction, TRANSFER_PRED, submitResult} from './helpers.mjs';
import {startServe, startReceiver, http as httpGet, buildLesson, SYNTHETIC_V3, SYNTHETIC_V3_MIN, INSPECTION} from './builds.mjs';
import {lessonF1, lessonF2, display} from '../fixtures/learning/v3.mjs';

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

// O7 (spec 3c9d5e71a0b84f26 v1, Q4): axe on the submit success and failure screens. Own server with --out on its own port.
test.describe('[T54S-O7] axe after submit', () => {
  const PORT = 4343;
  test.use({baseURL: `http://127.0.0.1:${PORT}/`});
  test.describe.configure({mode: 'serial'});
  let receiver;
  test.beforeEach(async () => { receiver = await startReceiver(PORT); });
  test.afterEach(async () => { await receiver?.stop(); receiver = null; });
  async function toCompleted(page) {
    await toSimulation(page, {predict: 'record'});
    await (await show(page, 'complete-lesson')).click();
  }
  test('[T54S-O7.success] zero violations with the submit-success state visible', async ({page}) => {
    await toCompleted(page);
    await submitResult(page, receiver);
    await expect(tid(page, 'export-status')).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });
  test('[T54S-O7.failure] zero violations with the submit-failure state visible', async ({page}) => {
    await toCompleted(page);
    await show(page, 'export-result');
    receiver.server.stop();
    await receiver.server.exited;
    await tid(page, 'export-result').click();
    await expect(tid(page, 'export-error')).toBeVisible();
    await expect(tid(page, 'export-status')).toBeHidden();
    expect(await axeViolations(page)).toEqual([]);
  });
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


// ---- V11 / T54-O5: serve has no --target option (R9, A2). Ports are distinct from the Playwright web server (4321).
test.describe('[T53-V11] serve --target', () => {
  test.describe.configure({mode: 'serial'});
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
      let stdout = '', stderr = ''; child.stdout.on('data', d => { stdout += d; }); child.stderr.on('data', d => { stderr += d; });
      const timer = setTimeout(() => { child.kill('SIGTERM'); resolve({code: 'timeout', stdout, stderr}); }, 20000);
      child.on('exit', code => { clearTimeout(timer); resolve({code, stdout, stderr}); });
    });
  }
  test('[T53-V11.omitted] without --target the lesson build (dist/) is served', async () => {
    expect(await served([], 4326)).toBe(bodyOf('dist'));
  });
  async function rejectsTarget(value, port) {
    const r = await exitOf(['--target', value, '--port', String(port)]);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain('ARGUMENT --target');
    expect(r.stdout).toBe('');
  }
  test('[T54-O5.target-diagnostic] --target diagnostic exits 2 with ARGUMENT --target and starts no server (R9, C16)', async () => { await rejectsTarget('diagnostic', 4328); });
  test('[T54-O5.target-lesson] --target lesson exits 2 with ARGUMENT --target and starts no server (R9, C16)', async () => { await rejectsTarget('lesson', 4327); });
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
  test('[T53-V11.dist-missing] a missing dist/index.html exits 1 with DIST_MISSING dist/index.html', async () => {
    const file = `${root}dist/index.html`, parked = `${root}dist/index.html.parked-by-test`;
    renameSync(file, parked);
    try {
      const r = await exitOf(['--port', '4330']);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/DIST_MISSING dist[\\/]index\.html/);
      expect(r.stdout).toBe('');
    } finally { renameSync(parked, file); }
  });
});


// ---- spec 0dcd8454f6e5111d V9 (R18, Q4): the synthetic v3 lessons F1 and F2 on their own builds and ports. build-lesson replaces dist/, so each describe restores the default build.
const BASE_F1 = display(20, 10), NEW_F1 = display(40, 15);
async function toSimulationOf(page, lesson, baseline) {
  await page.goto('/');
  await expect(tid(page, 'stage-context')).toBeVisible();
  await tid(page, 'stage-next').click();
  await fillPrediction(page, 'prediction', baseline, [], lesson);
  await tid(page, 'prediction-record').click();
  await tid(page, 'stage-next').click();
  await expect(tid(page, 'output-table')).toBeVisible();
}
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('[F4-V9] synthetic v3 lesson F1', () => {
  const PORT = 4353;
  test.use({baseURL: `http://127.0.0.1:${PORT}/`});
  test.describe.configure({mode: 'serial'});
  let server;
  test.beforeAll(async () => {
    buildLesson(SYNTHETIC_V3);
    server = startServe(['--port', String(PORT)]);
    await server.ready;
  });
  test.afterAll(async () => { server?.stop(); await server?.exited; buildLesson(INSPECTION); });

  test('[F4-V9.axe F1 before-reveal] zero WCAG 2.2 A/AA violations before the result reveal', async ({page}) => {
    await toSimulationOf(page, lessonF1, BASE_F1);
    await expect(tid(page, 'baseline-comparison')).toHaveCount(0);
    await expect(tid(page, 'visual-sweep-a')).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });
  test('[F4-V9.axe F1 after-reveal] zero violations after the baseline reveal', async ({page}) => {
    await toSimulationOf(page, lessonF1, BASE_F1);
    await (await show(page, 'prediction-reveal')).click();
    await expect(tid(page, 'baseline-comparison')).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });
  test('[F4-V9.axe F1 new-case] zero violations with the new-case result shown', async ({page}) => {
    await toSimulationOf(page, lessonF1, BASE_F1);
    await fillPrediction(page, 'transfer', NEW_F1, [], lessonF1);
    await tid(page, 'transfer-record').click();
    await expect(tid(page, 'transfer-result')).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });
  test('[F4-V9.axe F1 hint-open] zero violations with hints opened', async ({page}) => {
    await toSimulationOf(page, lessonF1, BASE_F1);
    await (await show(page, 'hint-level-2')).click();
    await expect(tid(page, 'hint-text-2')).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });
  test('[F4-V9.width 390 simulation-after-reveal] no horizontal scroll at 390px with the simulation shown after the reveal', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await toSimulationOf(page, lessonF1, BASE_F1);
    await (await show(page, 'prediction-reveal')).click();
    await expect(tid(page, 'baseline-comparison')).toBeVisible();
    await expect(tid(page, 'visual-share')).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
  test('[F4-V9.width 390 assessment-after-result] no horizontal scroll at 390px with the new-case result shown', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await toSimulationOf(page, lessonF1, BASE_F1);
    await fillPrediction(page, 'transfer', NEW_F1, [], lessonF1);
    await tid(page, 'transfer-record').click();
    await expect(tid(page, 'transfer-result')).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
  test('[F4-V9.reduced-motion] with prefers-reduced-motion: reduce the computed transition-duration of cards and buttons is 0s', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'reduce'});
    await toSimulationOf(page, lessonF1, BASE_F1);
    const ids = ['output-card-part-a', 'output-card-margin', `decision-${lessonF1.decisions[0].decisionId}`, 'stage-next', 'stage-back', 'prediction-reveal', 'scenario-base', 'reset-inputs'];
    const durations = await page.evaluate(list => list.map(id => { const el = document.querySelector(`[data-testid="${id}"]`); return [id, el ? getComputedStyle(el).transitionDuration : null]; }), ids);
    for (const [id, value] of durations) {
      expect(value, `${id} exists`).not.toBeNull();
      expect(value.split(',').map(x => x.trim()), `${id} transition-duration ${value}`).toEqual(value.split(',').map(() => '0s'));
    }
  });
});

test.describe('[F4-V9] synthetic v3 lesson F2 (minimal)', () => {
  const PORT = 4354;
  test.use({baseURL: `http://127.0.0.1:${PORT}/`});
  test.describe.configure({mode: 'serial'});
  let server;
  test.beforeAll(async () => {
    buildLesson(SYNTHETIC_V3_MIN);
    server = startServe(['--port', String(PORT)]);
    await server.ready;
  });
  test.afterAll(async () => { server?.stop(); await server?.exited; buildLesson(INSPECTION); });

  test('[F4-V9.axe F2 simulation] zero WCAG 2.2 A/AA violations on the minimal lesson (one input, one sweep, no composition)', async ({page}) => {
    await toSimulationOf(page, lessonF2, {twice: 8});
    await expect(tid(page, 'visual-twice-sweep')).toBeVisible();
    await expect(page.locator('[data-testid^="composition-"]')).toHaveCount(0);
    expect(await axeViolations(page)).toEqual([]);
  });
});
