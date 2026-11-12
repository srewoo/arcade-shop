// Local run records (best time, splits, best lap, time-trial ghost) in localStorage, validated on load.
// Wraps the pure logic in ../logic/bests.js and ../logic/ghost.js. Every access is try/catch'd.
import { bestKey, ghostKey, loadBest, saveBest, mergeRun, validMapId } from "../logic/bests.js";
import { parseGhost, serializeGhost } from "../logic/ghost.js";
import { MAP } from "../config/maps.js";
import { formatTime } from "../ui/format.js";

const KIND_KEY = "rug-racers-autostart-kind";

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Record mode names: "race" (vs AI, any lap count) and "tt" (time trial). */
export const recordMode = (kind) => (kind === "timetrial" ? "tt" : "race");

/** Stored best record for this mode/map/laps, or null. */
export function loadRecord(kind, mapId, laps) {
  if (!validMapId(mapId)) return null;
  return loadBest(storage(), bestKey(recordMode(kind), mapId, laps), laps);
}

/** Stored time-trial ghost for this map/laps, or null (corrupt entries are deleted). */
export function loadGhost(mapId, laps) {
  const store = storage();
  if (!store || !validMapId(mapId)) return null;
  try {
    const text = store.getItem(ghostKey(mapId, laps));
    if (!text) return null;
    const ghost = parseGhost(text);
    if (!ghost) store.removeItem(ghostKey(mapId, laps));
    return ghost;
  } catch {
    return null;
  }
}

/**
 * Merge a finished run (tracker.result) into storage.  The ghost is only kept for a new best total time;
 * if it is too large to store, the old ghost is dropped so ghost and record never disagree.
 * @returns {{record:object,newBest:boolean,newBestLap:boolean,ghostSaved:boolean}|null}
 */
export function saveRun(kind, mapId, laps, result) {
  const store = storage();
  if (!store || !validMapId(mapId)) return null;
  const key = bestKey(recordMode(kind), mapId, laps);
  const merged = mergeRun(loadBest(store, key, laps), result);
  saveBest(store, key, merged.record);
  let ghostSaved = false;
  if (kind === "timetrial" && merged.newBest) {
    const text = result.ghost ? serializeGhost(result.ghost) : null;
    try {
      if (text) {
        store.setItem(ghostKey(mapId, laps), text);
        ghostSaved = true;
      } else store.removeItem(ghostKey(mapId, laps));
    } catch {
      /* storage full: keep the record without a ghost */
    }
  }
  return { ...merged, ghostSaved };
}

/** One-line "best" summary for the title screen at the given lap count, or "". */
export function titleBestText(laps) {
  const parts = [];
  const race = loadRecord("race", MAP.id, laps);
  const trial = loadRecord("timetrial", MAP.id, laps);
  if (race) parts.push(`Race ${formatTime(race.ms / 1e3)}`);
  if (trial) parts.push(`Time trial ${formatTime(trial.ms / 1e3)}`);
  return parts.length ? `Your best, ${laps} lap${laps > 1 ? "s" : ""}: ${parts.join(" · ")}` : "";
}

/** Remember the run kind across the page reload used for "random" maps. */
export function stashKind(kind) {
  try {
    sessionStorage.setItem(KIND_KEY, kind);
  } catch {}
}

/** Kind stashed by the previous page ("race" by default); consumed once. */
export function consumeKind() {
  try {
    const kind = sessionStorage.getItem(KIND_KEY);
    sessionStorage.removeItem(KIND_KEY);
    return kind === "timetrial" ? "timetrial" : "race";
  } catch {
    return "race";
  }
}
