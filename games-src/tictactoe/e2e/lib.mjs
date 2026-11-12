// Shared helpers for the Playwright smoke suite (no extra npm dependency:
// point PLAYWRIGHT_PATH at an installed playwright, e.g. .../node_modules/playwright/index.mjs).
export const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
export const SHOT_DIR = process.env.SHOT_DIR ?? '';

export async function loadPlaywright() {
  return await import(process.env.PLAYWRIGHT_PATH ?? 'playwright');
}

export const VIEWPORTS = {
  desktop: { viewport: { width: 1280, height: 800 } },
  phone: { viewport: { width: 400, height: 860 }, hasTouch: true, isMobile: true },
  landscape: { viewport: { width: 860, height: 400 }, hasTouch: true, isMobile: true },
  tiny: { viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true },
};

export function createReport() {
  const results = [];
  const errors = [];
  return {
    results,
    errors,
    check(name, ok, detail = '') {
      results.push({ name, ok: Boolean(ok), detail });
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`);
    },
    summary() {
      const failed = results.filter((r) => !r.ok);
      console.log(`\n${results.length - failed.length}/${results.length} checks passed, ${errors.length} console problems`);
      errors.forEach((e) => console.log('  console:', e));
      return failed.length === 0 && errors.length === 0;
    },
  };
}

/** Open a fresh isolated context + page. `init` runs before page scripts. */
export async function open(browser, kind, report, { query = '?debug=1', init, media, storage } = {}) {
  const ctx = await browser.newContext({ ...VIEWPORTS[kind], ...(media ? { reducedMotion: media.reducedMotion, colorScheme: media.colorScheme } : {}) });
  if (init) await ctx.addInitScript(init);
  if (storage) await ctx.addInitScript((s) => { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, storage);
  const page = await ctx.newPage();
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && report.errors.push(`${kind}: ${m.text()}`));
  page.on('pageerror', (e) => report.errors.push(`${kind} pageerror: ${e.message}`));
  await page.goto(BASE + '/' + query);
  return { ctx, page };
}

export const shot = async (page, name) => {
  if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/after-tictactoe-${name}.png` });
};

export const cellRects = (page) =>
  page.$$eval('.cell', (cs) => cs.map((c) => { const r = c.getBoundingClientRect(); return [r.width, r.height]; }));

export const marks = (page) => page.$$eval('.cell', (cs) => cs.map((c) => c.dataset.mark || '.').join(''));

/** Contrast helpers evaluated in the page so computed colours (color-mix etc.) resolve. */
export const PAGE_CONTRAST = `(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (css) => { g.clearRect(0,0,1,1); g.fillStyle = '#000'; g.fillStyle = css; g.fillRect(0,0,1,1); const d = g.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3]/255]; };
  const lum = ([r,gg,b]) => { const f = (v) => { v/=255; return v<=0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; }; return 0.2126*f(r)+0.7152*f(gg)+0.0722*f(b); };
  const over = (fg, bg) => fg.slice(0,3).map((v,i) => v*fg[3] + bg[i]*(1-fg[3]));
  window.__cr = (fgCss, bgCss, fgAlpha = 1) => { const bg = rgba(bgCss); const fg = rgba(fgCss); fg[3] *= fgAlpha; const f = over(fg, bg); const a = lum(f), b = lum(bg); return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05); };
  window.__rgba = rgba;
})()`;
