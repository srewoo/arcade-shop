// Builds every game in src/games.json into dist/games/<id> with a relative base, so the bundles run from
// chrome-extension://<id>/games/<id>/. Runs each game's own `npm run build` (type-check + vite build).
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DIST, GAMES_SRC, loadGames } from './lib/catalogue.mjs';

const CONCURRENCY = 4;
const only = new Set(process.argv.slice(2));

function run(cwd, args) {
  return new Promise((done) => {
    const child = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', (d) => (log += d));
    child.stderr.on('data', (d) => (log += d));
    child.on('close', (code) => done({ code, log }));
  });
}

async function buildOne(game) {
  const cwd = resolve(GAMES_SRC, game.dir);
  if (!existsSync(resolve(cwd, 'package.json'))) throw new Error(`${game.id}: no package.json in ${cwd}`);
  if (!existsSync(resolve(cwd, 'node_modules'))) {
    const install = await run(cwd, ['ci', '--no-audit', '--no-fund']);
    if (install.code !== 0) return { game, ...install };
  }
  const out = resolve(DIST, 'games', game.id);
  const started = Date.now();
  const result = await run(cwd, ['run', 'build', '--', '--base', './', '--outDir', out, '--emptyOutDir']);
  return { game, ...result, ms: Date.now() - started };
}

const games = loadGames().filter((g) => only.size === 0 || only.has(g.id));
const queue = [...games];
const failures = [];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let g = queue.shift(); g; g = queue.shift()) {
      const r = await buildOne(g);
      console.log(`${r.code === 0 ? 'ok  ' : 'FAIL'} ${g.id}${r.ms ? ` (${(r.ms / 1000).toFixed(1)}s)` : ''}`);
      if (r.code !== 0) failures.push(r);
    }
  }),
);
for (const f of failures) console.error(`\n--- ${f.game.id} ---\n${f.log.slice(-3000)}`);
if (failures.length) process.exit(1);
console.log(`Built ${games.length} games into ${resolve(DIST, 'games')}`);
