// Renders each store asset in assets.html to webstore/<name>.png at its exact pixel size.
const { chromium } = require('/Users/sharajrewoo/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const path = require('path');
const OUT = path.resolve(__dirname, '..');
const ITEMS = [['shot-1','screenshot-1-launcher'],['shot-2','screenshot-2-popup'],['shot-3','screenshot-3-3d-games'],['shot-4','screenshot-4-arcade'],['shot-5','screenshot-5-offline'],['tile-small','promo-small-440x280'],['tile-marquee','promo-marquee-1400x560'],['store-icon','store-icon-128']];
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'assets.html'));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  for (const [id, name] of ITEMS) {
    await p.locator('#' + id).screenshot({ path: path.join(OUT, '_' + name + '.png'), omitBackground: id === 'store-icon' });
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
