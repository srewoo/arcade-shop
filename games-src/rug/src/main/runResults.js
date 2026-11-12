// Finish-of-run handling: store local records, decide leaderboard eligibility, post the score.
import { MAP, hasBoard } from "../config/maps.js";
import { leaderboardEligible } from "../logic/settings.js";
import { boardKey, fetchScores, submitScore, loadNick, saveNick, scoreServerDown } from "../api/leaderboard.js";
import { sfx } from "../audio/sfx.js";
import { ui } from "./bootstrap.js";
import { app } from "./state.js";
import { saveRun } from "./records.js";
import { PAR_LAP_SECONDS } from "../config/medals.js";
import { DIFFICULTY } from "../config/ai.js";
import { parMs, medalFor, medalTargets, MEDALS } from "../logic/medals.js";

/**
 * Save the finished run's local records (best time, splits, best lap, ghost) and describe it for the
 * results panel. Returns null when the session has no tracker or the run is not complete.
 */
export function finalizeRun(session) {
  const tracker = session.tracker;
  if (!tracker?.result) return null;
  const { race } = session;
  const result = tracker.result;
  const prev = tracker.best;
  const saved = saveRun(session.kind, MAP.id, race.laps, result);
  const par = parMs(PAR_LAP_SECONDS[MAP.id], race.laps);
  const medal = medalFor(result.ms, par);
  const prevMedal = prev ? medalFor(prev.ms, par) : null;
  return {
    medal,
    newMedal: !!medal && MEDALS.indexOf(medal) > MEDALS.indexOf(prevMedal),
    targets: medalTargets(par),
    difficulty: session.kind === "race" && session.opponents > 0 ? DIFFICULTY[session.difficulty]?.label ?? null : null,
    kind: session.kind,
    ms: result.ms,
    lapSeconds: tracker.splits.times.length ? tracker.lapSeconds : [],
    bestLapMs: saved?.record.bestLap ?? result.bestLap,
    newBest: !!saved?.newBest && !!prev,
    firstRun: !prev,
    newBestLap: !!saved?.newBestLap && !!prev,
    deltaMs: prev ? result.ms - prev.ms : null,
    ghostSaved: !!saved?.ghostSaved,
    stored: !!saved,
  };
}

/** True when this session's result may go to the online board rug:<mapId> (default race only). */
export function boardEligible(session) {
  return hasBoard(MAP) && leaderboardEligible({
    kind: session.kind,
    laps: session.race.laps,
    opponents: session.race.opponents,
    padDensity: session.padDensity,
  });
}

/** Results: prompt for a name, POST the time, show the board. Original `bb`. */
export function submitResultsScore(player) {
  const key = boardKey(MAP.id);
  const ms = Math.round(player.finishTime * 1e3);
  if (scoreServerDown()) return ui.showOfflineBoard(); // calm note, no name form that can only fail
  ui.askName(
    loadNick(),
    async (name) => {
      ui.saveBusy(true);
      ui.saveMessage("");
      const result = await submitScore(key, name, ms);
      ui.saveBusy(false);
      if (result.error === "offline") return ui.showOfflineBoard();
      if (result.error) {
        ui.saveMessage(
          result.error === "name"
            ? "Try another name (2-16 letters or digits)"
            : result.error === "rate"
              ? "Too many tries, wait a minute"
              : "Couldn't save the time, try again",
        );
        return;
      }
      saveNick(result.name);
      sfx.click();
      ui.showBoard(result.top, result);
    },
    () => {
      // skipped: just show the leaderboard
      fetchScores(key, 8).then((result) => {
        if (app.mode !== "results") return;
        if (result.top?.length) ui.showBoard(result.top, {});
        else if (result.error === "offline") ui.showOfflineBoard();
      });
    },
  );
}
