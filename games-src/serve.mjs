// Local server for the mirrored games.
//   node serve.mjs [port]  ->  http://localhost:5173/dino/  and  /rug/
// Serves the untouched mirrors in */original and stubs the leaderboard API the
// bundles call at `../api/scores` (in-memory, resets on restart).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.argv[2] ?? 5173);
const MOUNTS = { dino: join(ROOT, 'dino', 'original'), rug: join(ROOT, 'rug', 'original') };
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.wasm': 'application/wasm',
};
const MAX_BODY = 1024;
const boards = new Map(); // board -> [{name, ms}]

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

const isValidScore = (b) =>
  b && typeof b.board === 'string' && /^[\w:-]{1,40}$/.test(b.board) &&
  typeof b.name === 'string' && b.name.trim().length > 0 && b.name.length <= 16 &&
  Number.isInteger(b.ms) && b.ms > 0 && b.ms < 1e9;

const top = (board, limit) => (boards.get(board) ?? []).slice(0, limit);

async function handleScores(req, res, url) {
  if (req.method === 'GET') {
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 8, 1), 50);
    return send(res, 200, { top: top(url.searchParams.get('board') ?? '', limit) });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) return send(res, 413, { error: 'too large' });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'bad json' }); }
  if (!isValidScore(body)) return send(res, 400, { error: 'invalid' });
  // RE: the real backend's ordering semantics are unknown; dino `ms` reads like a
  // score (higher is better). Rug boards are lap times, so lower is better there.
  const lowerIsBetter = body.board.startsWith('rug:');
  const list = [...(boards.get(body.board) ?? []), { name: body.name.trim(), ms: body.ms }]
    .sort((a, b) => (lowerIsBetter ? a.ms - b.ms : b.ms - a.ms)).slice(0, 100);
  boards.set(body.board, list);
  return send(res, 200, { ok: true, top: top(body.board, 8) });
}

async function handleStatic(res, url) {
  const [, mount, ...rest] = url.pathname.split('/');
  const base = MOUNTS[mount];
  if (!base) return send(res, 200, `<a href="/dino/">dino</a> · <a href="/rug/">rug</a>`, 'text/html');
  const file = normalize(join(base, decodeURIComponent(rest.join('/')) || 'index.html'));
  if (!file.startsWith(base + sep) && file !== base) return send(res, 403, { error: 'forbidden' });
  try {
    const data = await readFile(file.endsWith(sep) ? join(file, 'index.html') : file);
    return send(res, 200, data, TYPES[extname(file)] ?? 'application/octet-stream');
  } catch {
    return send(res, 404, { error: 'not found' });
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (url.pathname === '/dino' || url.pathname === '/rug') {
      res.writeHead(308, { Location: url.pathname + '/' });
      return res.end();
    }
    if (url.pathname === '/api/scores') return await handleScores(req, res, url);
    return await handleStatic(res, url);
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', path: url.pathname, msg: String(err) }));
    return send(res, 500, { error: 'internal' });
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}/dino/  http://localhost:${PORT}/rug/`));
