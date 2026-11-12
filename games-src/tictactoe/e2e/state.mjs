// Pause, persistence, onboarding, audio gating, multi-tab.
import { marks, open, shot } from './lib.mjs';

const SEEN = { 'ttt-seen': '1' };
const withSettings = (s) => ({ ...SEEN, 'ttt-settings': JSON.stringify(s) });
const sleep = (page, ms) => page.waitForTimeout(ms);

export async function stateChecks(browser, report) {
  await pauseFlow(browser, report);
  await persistFlow(browser, report);
  await onboardingFlow(browser, report);
  await audioFlow(browser, report);
  await tabsFlow(browser, report);
  await extras(browser, report);
}

async function pauseFlow(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'cpu', level: 'easy', first: 'X' }) });
  await page.keyboard.press('5');
  await page.keyboard.press('p');
  check('P opens the pause overlay with Resume focused', (await page.$eval('#pause-overlay', (o) => !o.hidden)) && (await page.evaluate(() => document.activeElement?.id)) === 'pause-resume');
  await sleep(page, 900);
  check('CPU does not move while paused', (await marks(page)) === '....X....', await marks(page));
  check('page behind the overlay is inert', await page.$eval('#app', (a) => a.inert));
  await page.keyboard.press('Escape');
  check('Esc on the overlay resumes', await page.$eval('#pause-overlay', (o) => o.hidden));
  await sleep(page, 800);
  check('CPU moves after resume', (await marks(page)).split('O').length - 1 === 1, await marks(page));
  // auto-pause on blur
  await page.keyboard.press('1');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  check('window blur during play auto-pauses', await page.$eval('#pause-overlay', (o) => !o.hidden));
  const note = await page.$eval('#pause-note', (n) => n.textContent);
  check('auto-pause explains itself and stays paused (manual resume)', note.includes('background'));
  await sleep(page, 800);
  const stable = await marks(page);
  await page.click('#pause-resume');
  await sleep(page, 800);
  check('resume is manual and the CPU then plays', (await marks(page)) !== stable || stable.split('O').length - 1 >= 2, `${stable} -> ${await marks(page)}`);
  // visibilitychange
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  check('hidden tab auto-pauses when a round is in progress (or round over)', (await page.$eval('#pause-overlay', (o) => !o.hidden)) || (await page.evaluate(() => window.__ttt.state().winner !== null || window.__ttt.state().draw)));
  await ctx.close();
  await settingsPause(browser, report);
}

async function settingsPause(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'cpu', level: 'easy', first: 'X' }) });
  await page.keyboard.press('5');
  await page.click('#open-settings');
  check('opening Settings pauses the game', await page.evaluate(() => window.__ttt.isPaused()));
  await sleep(page, 800);
  check('CPU waits while Settings is open', (await marks(page)) === '....X....');
  await shot(page, 'desktop-settings');
  await page.keyboard.press('Escape');
  check('closing Settings returns focus to the opener', (await page.evaluate(() => document.activeElement?.id)) === 'open-settings');
  await sleep(page, 800);
  check('CPU resumes after Settings closes', (await marks(page)).split('O').length - 1 === 1);
  // paused stays paused
  await page.keyboard.press('1');
  await page.keyboard.press('p');
  await page.click('#pause-settings');
  await page.click('#settings-close');
  check('closing Settings opened from Pause stays paused', await page.evaluate(() => window.__ttt.isPaused()) && (await page.$eval('#pause-overlay', (o) => !o.hidden)));
  await page.click('#pause-restart');
  check('Restart from pause asks in-page confirmation', await page.$eval('#pause-confirm', (c) => !c.hidden));
  await page.click('#pause-confirm-no');
  check('Keep playing leaves the round intact', (await marks(page)).includes('X'));
  await ctx.close();
}

async function persistFlow(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'phone', report, { storage: SEEN });
  await page.click('#open-settings');
  await page.fill('#volume', '30');
  await page.click('[data-setting=reduceMotion] [data-value=on]');
  await page.click('[data-setting=colorAssist] [data-value=true]');
  await page.click('[data-setting=textSize] [data-value="125"]');
  await page.click('[data-setting=theme] [data-value=dark]');
  await page.click('#settings-close');
  await shot(page, 'phone-settings-applied');
  await page.reload();
  const s = await page.evaluate(() => window.__ttt.settings());
  check('settings persist across reload', s.volume === 30 && s.reduceMotion === 'on' && s.colorAssist === true && s.textSize === 125 && s.theme === 'dark', JSON.stringify(s));
  const root = await page.evaluate(() => { const d = document.documentElement.dataset; return [d.motion, d.assist, d.text, d.theme, getComputedStyle(document.documentElement).fontSize]; });
  check('persisted settings are applied on load', root.join() === 'reduce,on,125,dark,20px', root.join());
  await page.evaluate(() => localStorage.setItem('ttt-settings', '{"volume":999,"textSize":"big","theme":"dark","extra":1}'));
  await page.reload();
  const fallback = await page.evaluate(() => window.__ttt.settings());
  check('invalid stored fields fall back per field', fallback.volume === 70 && fallback.textSize === 100 && fallback.theme === 'dark', JSON.stringify(fallback));
  await ctx.close();
  const two = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'human', first: 'alternate' }) });
  for (const k of ['5', '1']) await two.page.keyboard.press(k);
  await two.page.reload();
  check('TICTACTOE-17 round in progress is restored after reload', (await marks(two.page)) === 'O...X....', await marks(two.page));
  for (const k of ['2', '3', '6', '7', '8']) await two.page.keyboard.press(k);
  await two.page.keyboard.press('n');
  await two.page.reload();
  check('Alternate order survives reload (round 2 starts with O)', (await two.page.$eval('#status', (s) => s.textContent)).includes('Player O'));
  await two.ctx.close();
}

async function onboardingFlow(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { init: () => { if (!sessionStorage.getItem('x')) { localStorage.clear(); sessionStorage.setItem('x', '1'); } } });
  check('TICTACTOE-11 first visit shows the hint', await page.$eval('#onboard', (b) => !b.hidden));
  await page.click('#onboard-close');
  await page.reload();
  check('hint does not return after dismissing', await page.$eval('#onboard', (b) => b.hidden));
  await ctx.close();
}

async function audioFlow(browser, report) {
  const { check } = report;
  const init = () => {
    window.__ac = 0;
    const Orig = window.AudioContext;
    window.AudioContext = class extends Orig { constructor(...a) { super(...a); window.__ac++; } };
  };
  const { ctx, page } = await open(browser, 'desktop', report, { init, storage: withSettings({ opponent: 'cpu', first: 'O' }) });
  await sleep(page, 900);
  check('TICTACTOE-15 no AudioContext before a user gesture (CPU opens as O)', (await page.evaluate(() => window.__ac)) === 0);
  await page.keyboard.press('5');
  check('AudioContext is created by the first key/pointer gesture', (await page.evaluate(() => window.__ac)) === 1);
  await ctx.close();
}

async function tabsFlow(browser, report) {
  const { check } = report;
  const a = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'human', first: 'X' }) });
  const b = await a.ctx.newPage();
  await b.goto(new URL(a.page.url()).origin + '/?debug=1');
  for (const k of ['1', '4', '2', '5', '3']) await a.page.keyboard.press(k);
  await sleep(b, 300);
  check('TICTACTOE-17 other tab sees the new score via storage event', (await b.evaluate(() => window.__ttt.scores().X)) === 1);
  for (const k of ['1', '4', '2', '5', '3']) await b.keyboard.press(k);
  await sleep(a.page, 300);
  check('scores merge instead of overwriting', (await a.page.evaluate(() => window.__ttt.scores().X)) === 2);
  await a.ctx.close();
}

async function extras(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { query: '', storage: SEEN });
  check('debug hook hidden without ?debug=1', (await page.evaluate(() => typeof window.__ttt)) === 'undefined');
  await ctx.close();
  const hov = await open(browser, 'phone', report, { storage: SEEN });
  const rule = await hov.page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules]).some((r) => r.constructor.name === 'CSSMediaRule' && r.conditionText.includes('hover: hover')));
  check('TICTACTOE-18 hover styles wrapped in (hover: hover)', rule);
  await hov.ctx.close();
}
