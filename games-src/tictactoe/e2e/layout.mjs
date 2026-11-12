// Layout, accessibility-floor and contrast checks.
import { PAGE_CONTRAST, cellRects, open, shot } from './lib.mjs';

const equalWithin = (rects, tol = 1) =>
  rects.every(([w, h]) => Math.abs(w - rects[0][0]) <= tol && Math.abs(h - rects[0][1]) <= tol);

export async function layoutChecks(browser, report) {
  const { check } = report;
  for (const kind of ['desktop', 'phone', 'tiny', 'landscape']) {
    const { ctx, page } = await open(browser, kind, report, { storage: { 'ttt-seen': '1' } });
    await page.evaluate(() => localStorage.setItem('ttt-settings', JSON.stringify({ opponent: 'human' })));
    await page.reload();
    await page.keyboard.press('5');
    await page.keyboard.press('6');
    const rects = await cellRects(page);
    check(`TICTACTOE-01 equal cells with marks in one row (${kind})`, equalWithin(rects), `${Math.round(rects[0][0])}x${Math.round(rects[0][1])} vs ${Math.round(rects[4][0])}x${Math.round(rects[4][1])}`);
    const dims = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth, document.documentElement.scrollHeight, innerHeight]);
    check(`no horizontal scroll (${kind})`, dims[0] <= dims[1], `${dims[0]}/${dims[1]}`);
    const board = await page.$eval('#board', (b) => { const r = b.getBoundingClientRect(); return [r.top, r.bottom]; });
    check(`board fully visible on first screen (${kind})`, board[0] >= 0 && board[1] <= dims[3], `${Math.round(board[0])}-${Math.round(board[1])} of ${dims[3]}`);
    if (kind === 'phone') await touchTargets(page, check);
    if (kind === 'phone' || kind === 'desktop') await textSizes(page, check, kind);
    if (kind === 'phone') {
      const nr = await page.$eval('#new-round', (b) => b.getBoundingClientRect().bottom);
      check('board + status + New round visible within 740px (phone)', nr <= 740, `bottom ${Math.round(nr)}`);
    }
    await shot(page, `${kind}-midgame`);
    await ctx.close();
  }
}

async function touchTargets(page, check) {
  const small = await page.$$eval('button, summary, input[type=range]', (els) =>
    els.filter((e) => e.offsetParent !== null && !e.closest('[hidden]')).map((e) => { const r = e.getBoundingClientRect(); return [e.id || e.textContent.trim().slice(0, 14), Math.round(r.width), Math.round(r.height)]; })
      .filter(([, w, h]) => w < 44 || h < 44));
  check('TICTACTOE-05 every visible button >= 44x44 (phone)', small.length === 0, JSON.stringify(small));
  await page.click('summary');
  const open = await page.$$eval('#options-box fieldset button', (els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  check('option chips >= 44px tall when expanded', open.every((h) => h >= 44), `min ${Math.min(...open)}`);
  const gap = await page.$eval('.actions', (a) => { const [x, y] = a.querySelectorAll('button'); const r1 = x.getBoundingClientRect(), r2 = y.getBoundingClientRect(); return Math.max(r2.left - r1.right, r2.top - r1.bottom); });
  check('gap between New round and Reset scores >= 8px', gap >= 8, `${Math.round(gap)}px`);
}

async function textSizes(page, check, kind) {
  const tiny = await page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const p = n.parentElement;
      if (!n.textContent.trim() || !p.offsetParent && getComputedStyle(p).position !== 'fixed') continue;
      if (p.closest('[hidden], .sr-only, kbd')) continue;
      const px = parseFloat(getComputedStyle(p).fontSize);
      if (px < 14) out.push([n.textContent.trim().slice(0, 20), px]);
    }
    return out;
  });
  check(`TICTACTOE-06 no text under 14px (${kind})`, tiny.length === 0, JSON.stringify(tiny));
}

export async function contrastChecks(browser, report) {
  const { check } = report;
  for (const scheme of ['light', 'dark']) {
    const { ctx, page } = await open(browser, 'desktop', report, { media: { colorScheme: scheme }, storage: { 'ttt-seen': '1', 'ttt-settings': JSON.stringify({ opponent: 'human', variant: 'vanishing', first: 'X' }) } });
    await page.evaluate(PAGE_CONTRAST);
    const css = (v) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), v);
    const [bg, panel, ink, muted, grid, x, o] = await Promise.all(['--bg', '--panel', '--ink', '--muted', '--grid', '--x', '--o'].map(css));
    const cr = (a, b, al) => page.evaluate(([p, q, k]) => window.__cr(p, q, k), [a, b, al ?? 1]);
    check(`muted text on bg >= 4.5 (${scheme})`, (await cr(muted, bg)) >= 4.5, (await cr(muted, bg)).toFixed(2));
    check(`muted text on panel >= 4.5 (${scheme})`, (await cr(muted, panel)) >= 4.5, (await cr(muted, panel)).toFixed(2));
    check(`cell vs grid >= 3 (${scheme})`, (await cr(panel, grid)) >= 3, (await cr(panel, grid)).toFixed(2));
    // X wins on 0,1,2: 1 4 2 5 3 -> use keys.
    for (const k of ['1', '4', '2', '5', '3']) await page.keyboard.press(k);
    await page.waitForTimeout(900);
    const win = await page.$eval('.cell.win', (c) => getComputedStyle(c).backgroundColor);
    const ring = await css('--win-ring');
    const xs = await page.$eval('.cell.win .stroke', (s) => getComputedStyle(s).stroke);
    check(`win ring vs cell >= 3 (${scheme})`, (await cr(ring, panel)) >= 3, (await cr(ring, panel)).toFixed(2));
    check(`X mark on win tile >= 3 (${scheme})`, (await cr(xs, win)) >= 3, (await cr(xs, win)).toFixed(2));
    await shot(page, `${scheme}-win`);
    await ctx.close();
    await fadingContrast(browser, report, scheme);
  }
}

async function fadingContrast(browser, report, scheme) {
  const { ctx, page } = await open(browser, 'desktop', report, { media: { colorScheme: scheme }, storage: { 'ttt-seen': '1', 'ttt-settings': JSON.stringify({ opponent: 'human', variant: 'vanishing', first: 'X' }) } });
  await page.evaluate(PAGE_CONTRAST);
  for (const k of ['1', '5', '2', '6', '7', '9']) await page.keyboard.press(k);
  const info = await page.$eval('.cell.fading', (c) => { const s = c.querySelector('.stroke'); const cs = getComputedStyle(s); return [cs.stroke, cs.opacity, getComputedStyle(c).backgroundColor, cs.strokeDasharray]; });
  const ratio = await page.evaluate(([a, op, b]) => window.__cr(a, b, Number(op)), [info[0], info[1], info[2]]);
  report.check(`TICTACTOE-04 fading mark >= 3 and dashed (${scheme})`, ratio >= 3 && info[3] !== 'none', `${ratio.toFixed(2)} dash=${info[3]}`);
  await ctx.close();
}
