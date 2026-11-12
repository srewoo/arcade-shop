// Leaderboard client (bundle symbols $m/eh/th, nh fetchJson, rh fetchTop, ih submitScore, ah/oh nickname storage).
//
// Contract (server is not part of this bundle; inferred from usage):
//   GET  ../api/scores?board=dino&limit=8           -> { top:[{name,ms}], rank?, best? } | { error }
//   POST ../api/scores  {board:'dino', name, ms}    -> { name, top:[...], rank, best } | { error:'name'|'rate'|... }
// Board ids per mode (modes.js): 'dino' (Classic, unchanged), 'dino:hardcore', 'dino:timeattack'.  Zen has none.
// `ms` carries the integer SCORE (the endpoint is shared with a sibling "rug racers" game where it holds milliseconds).
import { NICK_KEY, safeGet, safeSet } from './storage.js';

const ENDPOINT = '../api/scores';
const BOARD = 'dino';
const TIMEOUT_MS = 7000;

/** False when bundled in the arcadeShop extension: there is no score server there, so skip the request. */
export const hasScoreServer = () => globalThis.location?.protocol !== 'chrome-extension:';

/** fetch -> JSON; any network / parse / timeout failure becomes {error:'offline'} (never throws). */
async function fetchJson(url, init) {
  if (!hasScoreServer()) return { error: 'offline' };
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return await res.json();
  } catch {
    return { error: 'offline' };
  }
}

export const fetchTopScores = (board = BOARD) => fetchJson(`${ENDPOINT}?board=${encodeURIComponent(board)}&limit=8`);

export const submitScore = (name, score, board = BOARD) =>
  fetchJson(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, name, ms: score }),
  });

export const loadNickname = () => safeGet(NICK_KEY) || '';

export function saveNickname(name) {
  safeSet(NICK_KEY, name);
}
