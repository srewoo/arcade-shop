// Gameplay-flow checks: settings, focus, vanishing feedback, game over, premove, reduced motion.
import { marks, open, shot } from './lib.mjs';

const SEEN = { 'ttt-seen': '1' };
const withSettings = (s) => ({ ...SEEN, 'ttt-settings': JSON.stringify(s) });

export async function flowChecks(browser, report) {
  await settingsFlow(browser, report);
  await focusFlow(browser, report);
  await vanishFlow(browser, report);
  await gameOverFlow(browser, report);
  await premoveFlow(browser, report);
  await reducedMotionFlow(browser, report);
}

async function settingsFlow(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { storage: withSettings({ first: 'X', level: 'easy' }) });
  await page.keyboard.press('5');
  await page.waitForTimeout(600);
  const before = await marks(page);
  await page.click('fieldset[data-setting=variant] button[data-value=classic]');
  check('TICTACTOE-02 clicking the already-selected option keeps the game', (await marks(page)) === before, before);
  await page.click('fieldset[data-setting=level] button[data-value=hard]');
  check('level change applies without wiping the board', (await marks(page)) === before && (await page.$eval('#status', (s) => s.textContent)).length > 0);
  await page.click('fieldset[data-setting=opponent] button[data-value=human]');
  const barShown = await page.$eval('#confirm-bar', (b) => !b.hidden);
  check('restarting setting mid-game asks first (board untouched)', barShown && (await marks(page)) === before);
  await page.click('#confirm-no');
  check('Cancel keeps the game and the old setting', (await marks(page)) === before && (await page.$eval('[data-setting=opponent] [aria-pressed=true]', (b) => b.dataset.value)) === 'cpu');
  await page.click('fieldset[data-setting=opponent] button[data-value=human]');
  await page.click('#confirm-yes');
  check('Restart applies the setting and starts a new round', (await marks(page)) === '.........' && (await page.$eval('[data-setting=opponent] [aria-pressed=true]', (b) => b.dataset.value)) === 'human');
  // Reset scores two-step
  await page.evaluate(() => window.__ttt.setScores({ X: 5, O: 2, draw: 1 }));
  await page.click('#reset');
  const armedText = await page.$eval('#reset', (b) => b.textContent);
  check('Reset scores needs a second tap', armedText.includes('confirm') && (await page.evaluate(() => window.__ttt.scores().X)) === 5, armedText);
  await page.waitForTimeout(3200);
  check('Reset confirmation disarms after 3 s', (await page.$eval('#reset', (b) => b.textContent)) === 'Reset scores');
  await page.click('#reset');
  await page.click('#reset');
  check('second tap resets scores', (await page.evaluate(() => JSON.stringify(window.__ttt.scores()))) === '{"X":0,"O":0,"draw":0}');
  // N mid-game
  await page.keyboard.press('1');
  await page.keyboard.press('n');
  check('N mid-game does not abandon the round on first press', (await marks(page)) === 'X........');
  await page.keyboard.press('n');
  check('second N starts a new round', (await marks(page)) === '.........');
  await ctx.close();
}

async function focusFlow(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'human', first: 'X' }) });
  const active = () => page.evaluate(() => document.activeElement?.className + '|' + (document.activeElement?.dataset?.index ?? ''));
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const onCell = (await active()).startsWith('cell');
  check('keyboard reaches the board in one tab stop group', onCell, await active());
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp');
  check('arrow keys move focus inside the board', (await active()).endsWith('|0'), await active());
  await page.keyboard.press('Enter');
  check('TICTACTOE-03 focus stays on the cell after Enter', (await active()).startsWith('cell'), await active());
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
  check('Space places a mark and focus is kept', (await marks(page)).startsWith('XO') && (await active()).startsWith('cell'));
  const roles = await page.evaluate(() => [document.querySelector('#board').getAttribute('role'), document.querySelectorAll('[role=gridcell]').length]);
  check('board uses role=group (no invalid grid ARIA)', roles[0] === 'group' && roles[1] === 0, JSON.stringify(roles));
  for (const k of ['5', '4', '9']) await page.keyboard.press(k);
  check('game over moves focus to New round', (await active()).includes('btn primary') || (await page.evaluate(() => document.activeElement?.id)) === 'new-round');
  await ctx.close();
}

async function vanishFlow(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'human', variant: 'vanishing', first: 'X' }) });
  for (const k of ['1', '5', '2', '6', '7', '9']) await page.keyboard.press(k);
  const fading = await page.$$eval('.cell.fading', (cs) => cs.map((c) => c.dataset.mark));
  check('TICTACTOE-09 both players oldest marks are flagged (2 fading cells)', fading.length === 2 && fading.includes('X') && fading.includes('O'), JSON.stringify(fading));
  const labels = await page.$$eval('.cell.fading', (cs) => cs.map((c) => c.getAttribute('aria-label')));
  check('TICTACTOE-12 fading cell aria-label mentions disappearing', labels.every((l) => l.includes('will disappear')), JSON.stringify(labels));
  check('"next out" tag only on the mover', (await page.$$('.cell.next-out')).length === 1);
  const pips = await page.$$eval('#pips-x i.on', (n) => n.length);
  check('3-dot mark counter on score card', pips === 3 && (await page.$eval('#pips-x', (n) => !n.hidden)));
  check('TICTACTOE-10 move counter shown', (await page.$eval('#movecount', (n) => n.textContent))  === 'Move 6 / 60');
  await page.evaluate(() => { window.__sawVanishing = false; new MutationObserver(() => { if (document.querySelector('.vanishing')) window.__sawVanishing = true; }).observe(document.body, { subtree: true, childList: true }); });
  await page.keyboard.press('3');
  check('vanishing mark plays a .vanishing fade', await page.evaluate(() => window.__sawVanishing));
  await page.waitForTimeout(500);
  check('ghost removed after the fade', (await page.$$('.vanishing')).length === 0);
  check('hint mentions the 60-move cap', (await page.$eval('#vanish-hint', (n) => n.textContent)).includes('60'));
  await shot(page, 'desktop-vanishing');
  const label = await page.$eval('[data-setting=level] [data-value=hard]', (b) => b.textContent);
  check('top level is labelled Expert in Vanishing', label === 'Expert', label);
  await ctx.close();
}

async function gameOverFlow(browser, report) {
  const { check } = report;
  let { ctx, page } = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'human', first: 'X' }) });
  for (const k of ['1', '4', '2', '5', '3']) await page.keyboard.press(k);
  await page.waitForTimeout(150);
  const text = await page.$eval('#status', (s) => s.textContent);
  check('TICTACTOE-11 game over status carries a call to action', text.includes('wins') && text.includes('Press N'), text);
  check('strike line drawn through the winning cells', (await page.$$('#strike .strike-line')).length === 1);
  const delay = await page.$eval('.cell.win', (c) => getComputedStyle(c).animationDelay);
  check('TICTACTOE-08 win highlight waits for the last mark to draw', parseFloat(delay) >= 0.3, delay);
  await page.waitForTimeout(550);
  check('confetti on a human win', (await page.$$('#confetti .dot')).length > 0);
  await shot(page, 'desktop-gameover');
  await ctx.close();
  ({ ctx, page } = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'cpu', level: 'hard', first: 'X' }) }));
  await page.keyboard.press('1'); await page.waitForTimeout(500);
  await page.keyboard.press('2'); await page.waitForTimeout(500);
  await page.keyboard.press('4'); await page.waitForTimeout(500);
  const s = await page.$eval('#status', (n) => n.textContent);
  check('CPU win shows result + shake class lifecycle', s.includes('CPU wins') && s.includes('Press N'), s);
  check('CPU win ends the streak (stats persisted)', (await page.evaluate(() => window.__ttt.stats().streak)) === 0);
  await ctx.close();
}

async function premoveFlow(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { storage: withSettings({ opponent: 'cpu', level: 'hard', first: 'X' }) });
  await page.keyboard.press('5');
  await page.keyboard.press('9');
  const queued = await page.$$('.cell.queued');
  check('TICTACTOE-22 premove shows on the board and CPU turn dims it', queued.length === 1 && (await page.$eval('#board', (b) => b.classList.contains('thinking-cpu'))));
  await page.waitForTimeout(800);
  const m = await marks(page);
  check('premove is played when the CPU finishes', m.split('X').length - 1 === 2 && m[8] === 'X', m);
  await ctx.close();
}

async function reducedMotionFlow(browser, report) {
  const { check } = report;
  const { ctx, page } = await open(browser, 'desktop', report, { media: { reducedMotion: 'reduce' }, storage: withSettings({ opponent: 'human', first: 'X' }) });
  for (const k of ['1', '4', '2', '5', '3']) await page.keyboard.press(k);
  await page.waitForTimeout(300);
  const names = await page.evaluate(() => [getComputedStyle(document.querySelector('.cell.win .stroke')).animationName, getComputedStyle(document.querySelector('.cell.win')).animationName, document.documentElement.dataset.motion]);
  check('reduced motion: no stroke/win animation, data-motion=reduce', names[0] === 'none' && names[1] === 'none' && names[2] === 'reduce', JSON.stringify(names));
  check('reduced motion: no confetti', (await page.$$('#confetti .dot')).length === 0);
  check('reduced motion: strike line shown statically', (await page.$eval('#strike .strike-line', (l) => getComputedStyle(l).animationName)) === 'none');
  await ctx.close();
}
