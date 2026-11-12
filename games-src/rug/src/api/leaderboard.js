/**
 * Leaderboard client. Contract (server not part of this repo):
 *   GET  ../api/scores?board=rug:<mapId>&limit=8
 *   POST ../api/scores  JSON {board, name, ms}
 * Any network/parse failure yields {error: "offline"}. 7 s timeout.
 */
export const SCORES_URL = "../api/scores";
export const NICK_STORAGE_KEY = "rug-racers-nick";

/** Board key for a map id, e.g. "rug:sol". (original: ml) */
export const boardKey = (mapId) => `rug:${mapId}`;

/** False when bundled in the arcadeShop extension: there is no score server there, so skip the request. */
export const hasScoreServer = () => globalThis.location?.protocol !== "chrome-extension:";

/** After a failed request the server counts as down for this long, so we stop hitting a 404 on every screen. */
export const RETRY_AFTER_MS = 120e3;
let downSince = -Infinity;

/** True while the online board should not be attempted (no server in this build, or it failed recently). */
export const scoreServerDown = (now = Date.now()) => !hasScoreServer() || now - downSince < RETRY_AFTER_MS;

/** Test hook: forget a recorded failure. */
export const resetScoreServerState = () => {
  downSince = -Infinity;
};

async function fetchJson(url, init) {
  if (scoreServerDown()) return { error: "offline" };
  try {
    const result = await (await fetch(url, { ...init, signal: AbortSignal.timeout(7e3) })).json();
    if (result?.error === "offline") downSince = Date.now();
    return result;
  } catch {
    downSince = Date.now();
    return { error: "offline" };
  }
}

/** Top scores of a board. (original: rm) */
export const fetchScores = (board, limit = 8) =>
  fetchJson(`${SCORES_URL}?board=${encodeURIComponent(board)}&limit=${limit}`);

/** Submit a lap/race time in ms. (original: Tw) */
export const submitScore = (board, name, ms) =>
  fetchJson(SCORES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board, name, ms }),
  });

/** Stored nickname ("" if none / storage blocked). (original: Ew) */
export function loadNick() {
  try {
    return localStorage.getItem(NICK_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

/** Persist nickname. (original: Aw) */
export function saveNick(name) {
  try {
    localStorage.setItem(NICK_STORAGE_KEY, name);
  } catch {}
}
