// Playwright smoke suite: `PLAYWRIGHT_PATH=... BASE_URL=http://localhost:4173 npm run e2e`
import { createReport, loadPlaywright } from './lib.mjs';
import { contrastChecks, layoutChecks } from './layout.mjs';
import { flowChecks } from './flow.mjs';
import { stateChecks } from './state.mjs';

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const report = createReport();
try {
  await layoutChecks(browser, report);
  await contrastChecks(browser, report);
  await flowChecks(browser, report);
  await stateChecks(browser, report);
} finally {
  await browser.close();
}
process.exit(report.summary() ? 0 : 1);
