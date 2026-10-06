import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateDocument} from '../../contracts/index.mjs';
import {buildDiagnostic as buildChoices} from '../../authoring/diagnose.mjs';
import {tid, norm, focusByTab} from './helpers.mjs';
import {buildDiagnostic, startServe} from './builds.mjs';

// V10: built diagnostic page. dist-diagnostic/ is built here from fixture setups and served with --target diagnostic on its own port.
const PORT = 4325;
const TWO = 'tests/fixtures/diagnostic/setup.two-rounds.json';
const ONE = 'tests/fixtures/diagnostic/setup.one-round.json';
const readSetup = path => JSON.parse(readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), 'utf8'));
const two = readSetup(TWO), one = readSetup(ONE);
const REACTIONS = ['similar', 'surprising', 'unknown', 'not-applicable'];
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
let server;
test.use({baseURL: `http://127.0.0.1:${PORT}/`});
test.describe.configure({mode: 'serial'});
test.beforeAll(async () => {
  buildDiagnostic(TWO);
  server = startServe(['--target', 'diagnostic', '--port', String(PORT)]);
  await server.ready;
});
test.afterAll(() => { server?.stop(); });

const cardOf = (page, id) => tid(page, `candidate-${id}`);
const react = (page, id, reaction) => tid(page, `reaction-${id}-${reaction}`).check();
async function reactAll(page, round, picks) {
  for (const [i, c] of round.candidates.entries()) await react(page, c.candidateId, picks[i]);
}
async function expectRound(page, round, others) {
  for (const c of round.candidates) {
    const card = cardOf(page, c.candidateId);
    await expect(card).toBeVisible();
    const t = norm(await card.innerText());
    for (const f of ['title', 'decisionQuestion', 'reason', 'preview']) expect(t, `${c.candidateId}.${f}`).toContain(norm(c[f]));
    for (const r of REACTIONS) await expect(tid(page, `reaction-${c.candidateId}-${r}`)).toHaveCount(1);
  }
  for (const c of others) await expect(cardOf(page, c.candidateId), `${c.candidateId} belongs to another round`).toBeHidden();
}
const hypothesesFor = round => round.candidates.map((c, i) => ({candidateId: c.candidateId, category: i === 0 ? 'common-knowledge-gap' : 'unknown-concept', rationale: `가설 ${c.candidateId}`, status: 'hypothesis'}));
async function download(page, button, how = 'click') {
  const [d] = await Promise.all([page.waitForEvent('download'), (async () => { if (how === 'click') await tid(page, button).click(); else { await focusByTab(page, button); await page.keyboard.press('Enter'); } })()]);
  return d;
}
function assertChoices(choices, setup, picks) {
  expect(choices).toMatchObject({kind: 'diagnostic-choices', version: 1, diagnosticId: setup.diagnosticId, profileId: setup.profileId, contextKind: setup.contextKind});
  expect(choices.rounds).toHaveLength(setup.rounds.length);
  setup.rounds.forEach((round, i) => {
    expect(choices.rounds[i].candidates).toEqual(round.candidates);
    expect(choices.rounds[i].reactions).toHaveLength(round.candidates.length);
    const got = new Map(choices.rounds[i].reactions.map(r => [r.candidateId, r.reaction]));
    expect(got.size).toBe(round.candidates.length);
    round.candidates.forEach((c, j) => expect(got.get(c.candidateId), `${c.candidateId}`).toBe(picks[i][j]));
  });
  const last = setup.rounds.at(-1);
  const built = buildChoices(choices, hypothesesFor(last));
  expect(built.ok, JSON.stringify(built.errors)).toBe(true);
  expect(built.diagnostic.candidates).toEqual(last.candidates);
  expect(built.diagnostic.selection).toBeNull();
  expect(validateDocument(built.diagnostic, 'diagnostic')).toEqual({ok: true, errors: []});
}
async function kbReact(page, id, reaction) {
  const inGroup = () => page.evaluate(i => !!document.activeElement?.matches(`input[type=radio][data-testid^="reaction-${i}-"]`), id);
  for (let i = 0; i < 400 && !(await inGroup()); i++) await page.keyboard.press('Tab');
  expect(await inGroup(), `focus reaches the ${id} radio group`).toBe(true);
  const onTarget = () => page.evaluate(([i, r]) => document.activeElement?.getAttribute('data-testid') === `reaction-${i}-${r}`, [id, reaction]);
  for (let i = 0; i < REACTIONS.length && !(await onTarget()); i++) await page.keyboard.press('ArrowDown');
  expect(await onTarget(), `${reaction} reachable by arrow keys`).toBe(true);
  await page.keyboard.press('Space');
  await expect(tid(page, `reaction-${id}-${reaction}`)).toBeChecked();
}
const axeViolations = async page => (await new AxeBuilder({page}).withTags(AXE_TAGS).analyze()).violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target.join(' ')).slice(0, 5)}));

test('[T53-V10.states] round and button states: round1 incomplete/complete, round2 incomplete/complete; export carries all rounds (R14, C9, C10)', async ({page}) => {
  const [r1, r2] = two.rounds;
  await page.goto('/');
  await expectRound(page, r1, r2.candidates);
  await expect(tid(page, 'diagnostic-next')).toBeDisabled();
  await expect(tid(page, 'diagnostic-export')).toBeHidden();
  for (const c of r1.candidates) for (const r of REACTIONS) await expect(tid(page, `reaction-${c.candidateId}-${r}`)).not.toBeChecked();

  await react(page, r1.candidates[0].candidateId, 'similar');
  await react(page, r1.candidates[1].candidateId, 'surprising');
  await expect(tid(page, 'diagnostic-next'), 'two of three cards reacted').toBeDisabled();
  await react(page, r1.candidates[2].candidateId, 'not-applicable');
  await expect(tid(page, 'diagnostic-next')).toBeEnabled();
  await expect(tid(page, 'diagnostic-export')).toBeHidden();

  await react(page, r1.candidates[0].candidateId, 'unknown');
  await expect(tid(page, 'reaction-' + r1.candidates[0].candidateId + '-unknown')).toBeChecked();
  await expect(tid(page, 'reaction-' + r1.candidates[0].candidateId + '-similar')).not.toBeChecked();
  await expect(tid(page, 'diagnostic-next')).toBeEnabled();

  await tid(page, 'diagnostic-next').click();
  await expectRound(page, r2, r1.candidates);
  await expect(tid(page, 'diagnostic-next')).toBeHidden();
  await expect(tid(page, 'diagnostic-export')).toBeDisabled();
  await expect(page.getByRole('button', {name: /이전|뒤로|돌아가/})).toHaveCount(0);
  await expect(page.locator('[data-testid*="back"], [data-testid*="prev"]')).toHaveCount(0);
  await react(page, r2.candidates[0].candidateId, 'similar');
  await react(page, r2.candidates[1].candidateId, 'unknown');
  await expect(tid(page, 'diagnostic-export'), 'two of three cards reacted').toBeDisabled();
  await react(page, r2.candidates[2].candidateId, 'surprising');
  await expect(tid(page, 'diagnostic-export')).toBeEnabled();

  const d = await download(page, 'diagnostic-export');
  expect(d.suggestedFilename()).toBe(`diagnostic-choices-${two.diagnosticId}.json`);
  assertChoices(JSON.parse(readFileSync(await d.path(), 'utf8')), two, [['unknown', 'surprising', 'not-applicable'], ['similar', 'unknown', 'surprising']]);
});

test('[T53-V10.keyboard] the whole diagnostic is completable and exportable with the keyboard only (Q4, C9)', async ({page}) => {
  const [r1, r2] = two.rounds;
  await page.goto('/');
  const picks = [['not-applicable', 'similar', 'unknown'], ['surprising', 'not-applicable', 'similar']];
  for (const [i, c] of r1.candidates.entries()) await kbReact(page, c.candidateId, picks[0][i]);
  await focusByTab(page, 'diagnostic-next');
  await page.keyboard.press('Enter');
  await expectRound(page, r2, r1.candidates);
  for (const [i, c] of r2.candidates.entries()) await kbReact(page, c.candidateId, picks[1][i]);
  const d = await download(page, 'diagnostic-export', 'keyboard');
  assertChoices(JSON.parse(readFileSync(await d.path(), 'utf8')), two, picks);
});

test('[T53-V10.axe.round1] zero WCAG 2.2 A/AA violations with round 1 fully answered', async ({page}) => {
  await page.goto('/');
  await reactAll(page, two.rounds[0], ['similar', 'surprising', 'unknown']);
  await expect(tid(page, 'diagnostic-next')).toBeEnabled();
  expect(await axeViolations(page)).toEqual([]);
});

test('[T53-V10.axe.last] zero WCAG 2.2 A/AA violations with the last round fully answered', async ({page}) => {
  await page.goto('/');
  await reactAll(page, two.rounds[0], ['similar', 'surprising', 'unknown']);
  await tid(page, 'diagnostic-next').click();
  await reactAll(page, two.rounds[1], ['unknown', 'not-applicable', 'similar']);
  await expect(tid(page, 'diagnostic-export')).toBeEnabled();
  expect(await axeViolations(page)).toEqual([]);
});

test('[T53-V10.network] every request during the whole diagnostic goes to 127.0.0.1 (Q6, R17)', async ({page, context}) => {
  const seen = [];
  context.on('request', req => { const u = new URL(req.url()); if (/^(https?|wss?):$/.test(u.protocol)) seen.push(u.hostname); });
  await context.route(url => /^https?:$/.test(url.protocol) && url.hostname !== '127.0.0.1', route => route.abort());
  await page.goto('/');
  await reactAll(page, two.rounds[0], ['similar', 'surprising', 'unknown']);
  await tid(page, 'diagnostic-next').click();
  await reactAll(page, two.rounds[1], ['unknown', 'not-applicable', 'similar']);
  await download(page, 'diagnostic-export');
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.filter(h => h !== '127.0.0.1')).toEqual([]);
});

test('[T53-V10.no-persist] progress is not stored: reload returns to round 1 with nothing selected and storage stays empty (R17)', async ({page}) => {
  const [r1] = two.rounds;
  await page.goto('/');
  await reactAll(page, r1, ['similar', 'surprising', 'unknown']);
  await tid(page, 'diagnostic-next').click();
  await react(page, two.rounds[1].candidates[0].candidateId, 'similar');
  expect(await page.evaluate(() => ({local: localStorage.length, session: sessionStorage.length}))).toEqual({local: 0, session: 0});
  await page.reload();
  await expectRound(page, r1, two.rounds[1].candidates);
  for (const c of r1.candidates) for (const r of REACTIONS) await expect(tid(page, `reaction-${c.candidateId}-${r}`)).not.toBeChecked();
  await expect(tid(page, 'diagnostic-next')).toBeDisabled();
});

test('[T53-V13.diagnostic-screen] review capture: visible diagnostic texts for the Q8 checklist (reactions are not an ability judgement)', async ({page}) => {
  await page.goto('/');
  const round1 = await page.locator('body').innerText();
  await reactAll(page, two.rounds[0], ['similar', 'surprising', 'unknown']);
  await tid(page, 'diagnostic-next').click();
  const round2 = await page.locator('body').innerText();
  const text = `# V13 diagnostic page screen text\n## round 1\n${round1}\n\n## round 2 (last)\n${round2}\n`;
  mkdirSync(fileURLToPath(new URL('../../test-results/review/', import.meta.url)), {recursive: true});
  writeFileSync(fileURLToPath(new URL('../../test-results/review/V13-diagnostic.txt', import.meta.url)), text);
  await test.info().attach('V13-diagnostic-screen', {body: text, contentType: 'text/plain'});
  expect(round1.trim().length).toBeGreaterThan(0);
});

test('[T53-V10.single-round] one round with one card: no next button, export enables after that card is answered (C10)', async ({page}) => {
  buildDiagnostic(ONE);
  const round = one.rounds[0];
  await page.goto('/');
  await expectRound(page, round, two.rounds.flatMap(r => r.candidates));
  await expect(tid(page, 'diagnostic-next')).toBeHidden();
  await expect(tid(page, 'diagnostic-export')).toBeDisabled();
  await react(page, round.candidates[0].candidateId, 'not-applicable');
  await expect(tid(page, 'diagnostic-export')).toBeEnabled();
  const d = await download(page, 'diagnostic-export');
  expect(d.suggestedFilename()).toBe(`diagnostic-choices-${one.diagnosticId}.json`);
  assertChoices(JSON.parse(readFileSync(await d.path(), 'utf8')), one, [['not-applicable']]);
});
