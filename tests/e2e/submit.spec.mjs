import {test, expect} from '@playwright/test';
import {tid, norm, toPrediction, show, fillPrediction, assertResultDocument, BASELINE_PRED} from './helpers.mjs';
import {startServe, startReceiver} from './builds.mjs';
import {session} from '../fixtures/learning/data.mjs';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

// O5 (spec 3c9d5e71a0b84f26 v1): the lesson screen submits the result with POST /__ltt/result; states idle, submitting, success, server failure, hash failure, resubmit success.
const PORT = 4350;
const SUCCESS_TEXT = '제출했습니다. agent에게 끝났다고 알려 주세요.';
test.use({baseURL: `http://127.0.0.1:${PORT}/`});
test.describe.configure({mode: 'serial'});

let receiver;
test.beforeEach(async () => { receiver = await startReceiver(PORT); });
test.afterEach(async () => { await receiver?.stop(); receiver = null; });

const isSubmit = r => new URL(r.url()).pathname === '/__ltt/result';
function watch(page) {
  const seen = {downloads: 0, requests: []};
  page.on('download', () => { seen.downloads++; });
  page.on('request', r => { if (isSubmit(r)) seen.requests.push(r); });
  return seen;
}
async function toCompleted(page) {
  await toPrediction(page);
  await fillPrediction(page, 'prediction', BASELINE_PRED);
  await tid(page, 'prediction-record').click();
  await (await show(page, 'complete-lesson')).click();
}
const clickSubmit = async page => { await show(page, 'export-result'); await tid(page, 'export-result').click(); };
async function expectNotBoth(page) {
  const [s, e] = [await tid(page, 'export-status').isVisible(), await tid(page, 'export-error').isVisible()];
  expect(s && e, 'export-status and export-error are never visible together').toBe(false);
}
const noDownloadArtifacts = page => page.evaluate(() => ({download: document.querySelectorAll('a[download]').length, blob: document.querySelectorAll('a[href^="blob:"]').length}));

test('[T54S-O5.idle] before any click the button reads 결과 제출 and neither status nor error is visible; no request is sent', async ({page}) => {
  const seen = watch(page);
  await toCompleted(page);
  await show(page, 'export-result');
  await expect(tid(page, 'export-result')).toHaveText('결과 제출');
  await expect(tid(page, 'export-status')).toBeHidden();
  await expect(tid(page, 'export-error')).toBeHidden();
  await page.waitForTimeout(500);
  expect(seen.requests).toHaveLength(0);
  expect(receiver.files()).toEqual([]);
  expect(await noDownloadArtifacts(page)).toEqual({download: 0, blob: 0});
});

test('[T54S-O5.submitting] while the request is pending the success text is not shown and status/error are not both visible; releasing it gives success', async ({page}) => {
  await toCompleted(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/__ltt/result', async route => { await gate; await route.continue(); });
  await clickSubmit(page);
  await page.waitForTimeout(500);
  await expect(page.getByText('제출했습니다')).toHaveCount(0);
  await expectNotBoth(page);
  expect(receiver.files()).toEqual([]);
  release();
  await expect(tid(page, 'export-status')).toHaveText(SUCCESS_TEXT);
  await expect(tid(page, 'export-error')).toBeHidden();
});

test('[T54S-O5.success] a click POSTs the result with Origin = the server and application/json, shows the exact success text, writes result-<resultId>.json equal to the posted body, and starts no download (C2, R9, R10)', async ({page}) => {
  const seen = watch(page);
  await toCompleted(page);
  await clickSubmit(page);
  await expect(tid(page, 'export-status')).toHaveText(SUCCESS_TEXT);
  await expect(tid(page, 'export-error')).toBeHidden();
  await expectNotBoth(page);
  await page.waitForTimeout(500);
  expect(seen.requests).toHaveLength(1);
  const req = seen.requests[0];
  expect(req.method()).toBe('POST');
  const headers = await req.allHeaders();
  expect(headers['content-type']).toContain('application/json');
  expect(headers.origin).toBe(`http://127.0.0.1:${PORT}`);
  expect(receiver.files()).toEqual([`result-${session.resultId}.json`]);
  expect(req.postData()).toBe(receiver.text(session.resultId));
  assertResultDocument(receiver.read(session.resultId), 'completed');
  expect(seen.downloads).toBe(0);
  expect(await noDownloadArtifacts(page)).toEqual({download: 0, blob: 0});
});

test('[T54S-O5.server-failure] with the server stopped the click shows a ⚠-prefixed export-error naming NETWORK, no export-status and no download (C15)', async ({page}) => {
  const seen = watch(page);
  await toCompleted(page);
  await show(page, 'export-result');
  receiver.server.stop();
  await receiver.server.exited;
  await tid(page, 'export-result').click();
  await expect(tid(page, 'export-error')).toBeVisible();
  const error = norm(await tid(page, 'export-error').textContent());
  expect(error.startsWith('⚠'), error).toBe(true);
  expect(error).toContain('NETWORK');
  await expect(tid(page, 'export-status')).toBeHidden();
  await expectNotBoth(page);
  expect(seen.downloads).toBe(0);
});

test('[T54S-O5.server-code] a non-200 answer shows the server code in export-error (NO_OUT from a server started without --out), never export-status', async ({page}) => {
  const seen = watch(page);
  await receiver.stop();
  const bare = startServe(['--port', String(PORT)]);
  await bare.ready;
  try {
    await toCompleted(page);
    await clickSubmit(page);
    await expect(tid(page, 'export-error')).toBeVisible();
    const error = norm(await tid(page, 'export-error').textContent());
    expect(error.startsWith('⚠'), error).toBe(true);
    expect(error).toContain('NO_OUT');
    await expect(tid(page, 'export-status')).toBeHidden();
    await expectNotBoth(page);
    expect(seen.requests).toHaveLength(1);
    expect(seen.downloads).toBe(0);
  } finally { bare.stop(); await bare.exited; }
  receiver = await startReceiver(PORT);
});

test('[T54S-O5.hash-failure] a failing crypto hash shows export-error, sends no request, creates no file and no status (C16)', async ({page}) => {
  await page.addInitScript(() => { crypto.subtle.digest = () => Promise.reject(new Error('digest unavailable')); });
  const seen = watch(page);
  await toCompleted(page);
  await clickSubmit(page);
  await expect(tid(page, 'export-error')).toBeVisible();
  expect(norm(await tid(page, 'export-error').textContent()).length).toBeGreaterThan(0);
  await expect(tid(page, 'export-status')).toBeHidden();
  await expectNotBoth(page);
  await page.waitForTimeout(1000);
  expect(seen.requests).toHaveLength(0);
  expect(seen.downloads).toBe(0);
  expect(receiver.files()).toEqual([]);
});

test('[T54S-O5.resubmit] after a network failure, restarting the server and clicking again succeeds: export-error disappears, the file is written (C17)', async ({page}) => {
  const seen = watch(page);
  await toCompleted(page);
  await show(page, 'export-result');
  const out = receiver.out;
  receiver.server.stop();
  await receiver.server.exited;
  await tid(page, 'export-result').click();
  await expect(tid(page, 'export-error')).toBeVisible();
  await expect(tid(page, 'export-error')).toContainText('NETWORK');
  await expectNotBoth(page);

  const again = startServe(['--port', String(PORT), '--out', out]);
  await again.ready;
  try {
    await tid(page, 'export-result').click();
    await expect(tid(page, 'export-status')).toHaveText(SUCCESS_TEXT);
    await expect(tid(page, 'export-error')).toBeHidden();
    await expectNotBoth(page);
    expect(seen.downloads).toBe(0);
    expect(seen.requests).toHaveLength(2);
    expect(readdirSync(out)).toEqual([`result-${session.resultId}.json`]);
    assertResultDocument(JSON.parse(readFileSync(join(out, `result-${session.resultId}.json`), 'utf8')), 'completed');
  } finally { again.stop(); await again.exited; }
});

test('[T54S-O5.success-then-failure] after a successful submit, stopping the server and clicking again shows export-error (⚠, NETWORK) and hides export-status (spec O5 transition 6)', async ({page}) => {
  const seen = watch(page);
  await toCompleted(page);
  await clickSubmit(page);
  await expect(tid(page, 'export-status')).toHaveText(SUCCESS_TEXT);
  await expectNotBoth(page);
  receiver.server.stop();
  await receiver.server.exited;
  await tid(page, 'export-result').click();
  await expect(tid(page, 'export-error')).toBeVisible();
  const error = norm(await tid(page, 'export-error').textContent());
  expect(error.startsWith('⚠'), error).toBe(true);
  expect(error).toContain('NETWORK');
  await expect(tid(page, 'export-status')).toBeHidden();
  await expectNotBoth(page);
  expect(seen.requests).toHaveLength(2);
  expect(seen.downloads).toBe(0);
});

test('[T54S-O5.no-download-ever] across partial and completed submissions there is no download event and no download link', async ({page}) => {
  const seen = watch(page);
  await toPrediction(page);
  await fillPrediction(page, 'prediction', BASELINE_PRED);
  await tid(page, 'prediction-record').click();
  await clickSubmit(page);
  await expect(tid(page, 'export-status')).toBeVisible();
  const partial = receiver.read(session.resultId);
  assertResultDocument(partial, 'partial');
  await (await show(page, 'complete-lesson')).click();
  await clickSubmit(page);
  await expect.poll(() => receiver.read(session.resultId).state).toBe('completed');
  assertResultDocument(receiver.read(session.resultId), 'completed');
  expect(seen.downloads).toBe(0);
  expect(await noDownloadArtifacts(page)).toEqual({download: 0, blob: 0});
});
