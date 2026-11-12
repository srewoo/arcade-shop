// Zips dist/ into arcadeShop-<version>.zip (for sharing or the Chrome Web Store).
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, EXT_ROOT } from './lib/catalogue.mjs';

const { version } = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
const zip = join(EXT_ROOT, `arcadeShop-${version}.zip`);
rmSync(zip, { force: true });
execFileSync('zip', ['-q', '-r', '-X', zip, '.', '-x', '*.DS_Store'], { cwd: DIST, stdio: 'inherit' });
console.log(`Packed ${zip}`);
