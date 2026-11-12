// Local best records (total time, checkpoint splits, best lap) keyed by mode + map + laps. Pure; storage injected.
import { SECTORS_PER_LAP } from "./splits.js";

export const BEST_VERSION = 1;
export const BEST_PREFIX = "rug-racers-best";
export const GHOST_PREFIX = "rug-racers-ghost";
const MAX_MS = 60 * 60 * 1000;
const MAP_ID = /^[a-z0-9-]{1,32}$/;

export const bestKey = (mode, mapId, laps) => `${BEST_PREFIX}:${mode}:${mapId}:${laps}`;
export const ghostKey = (mapId, laps) => `${GHOST_PREFIX}:${mapId}:${laps}`;
export const validMapId = (id) => typeof id === "string" && MAP_ID.test(id);

const isMs = (v) => Number.isInteger(v) && v > 0 && v <= MAX_MS;

/** A record {ms, splits:[ms...], bestLap} or null if it does not fit a `laps`-lap race. */
export function validateBest(raw, laps) {
  if (!raw || typeof raw !== "object" || raw.v !== BEST_VERSION) return null;
  if (!isMs(raw.ms) || !isMs(raw.bestLap) || !Array.isArray(raw.splits)) return null;
  if (raw.splits.length !== laps * SECTORS_PER_LAP || !raw.splits.every(isMs)) return null;
  for (let i = 1; i < raw.splits.length; i++) if (raw.splits[i] < raw.splits[i - 1]) return null;
  if (raw.splits[raw.splits.length - 1] !== raw.ms) return null;
  return { v: BEST_VERSION, ms: raw.ms, splits: raw.splits.slice(), bestLap: raw.bestLap };
}

/**
 * Combine the stored record with a finished run {ms, splits, bestLap} (all integer ms).
 * @returns {{record:object,newBest:boolean,newBestLap:boolean}}
 */
export function mergeRun(prev, run) {
  const newBest = !prev || run.ms < prev.ms;
  const newBestLap = !prev || run.bestLap < prev.bestLap;
  const base = newBest ? run : prev;
  return {
    record: {
      v: BEST_VERSION,
      ms: base.ms,
      splits: base.splits.slice(),
      bestLap: newBestLap ? run.bestLap : prev.bestLap,
    },
    newBest,
    newBestLap,
  };
}

/** Load + validate a record; corrupt entries are removed and reported as null. */
export function loadBest(storage, key, laps) {
  try {
    const text = storage?.getItem(key);
    if (!text) return null;
    const record = validateBest(JSON.parse(text), laps);
    if (!record) storage.removeItem(key);
    return record;
  } catch {
    return null;
  }
}

export function saveBest(storage, key, record) {
  try {
    storage.setItem(key, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}
