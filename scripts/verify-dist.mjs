// Gate for the packed extension: manifest sane, every catalogue game + thumbnail present, and no page
// that the extension CSP would break.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIST, loadGames } from './lib/catalogue.mjs';
import { findCspProblems } from './lib/htmlCheck.mjs';

const errors = [];
const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) errors.push('manifest_version must be 3');
if (manifest.permissions?.length || manifest.host_permissions?.length) errors.push('extension must not request permissions');
for (const f of ['popup.html', 'arcade.html', 'background.js', ...Object.values(manifest.icons)]) {
  if (!existsSync(join(DIST, f))) errors.push(`missing ${f}`);
}
for (const g of loadGames()) {
  if (!existsSync(join(DIST, 'games', g.id, 'index.html'))) errors.push(`game not built: ${g.id}`);
  if (!existsSync(join(DIST, 'thumbs', `${g.id}.webp`))) errors.push(`thumbnail missing: ${g.id}`);
}
const files = walk(DIST);
for (const file of files.filter((f) => f.endsWith('.html'))) {
  for (const p of findCspProblems(readFileSync(file, 'utf8'))) errors.push(`${relative(DIST, file)}: ${p}`);
}
const bytes = files.reduce((n, f) => n + statSync(f).size, 0);
if (errors.length) {
  console.error(`verify-dist: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`verify-dist: ok (${files.length} files, ${(bytes / 1048576).toFixed(1)} MB)`);
