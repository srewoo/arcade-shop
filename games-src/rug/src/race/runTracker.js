/**
 * Per-run bookkeeping for the human player: sector splits, lap times, live delta vs the stored best
 * and (time trial) ghost recording + playback.  Driven once per physics step from Session.step; it only
 * reads the race, so it can never change the simulation.
 */
import { GhostRecorder, ghostPoseAt, ghostDuration } from "../logic/ghost.js";
import { SplitTracker, lapTimes, fastestLap } from "../logic/splits.js";

const toMs = (seconds) => Math.round(seconds * 1000);

export class RunTracker {
  /**
   * @param {object} o
   * @param {number} o.laps
   * @param {number} o.routeLen     route length in samples
   * @param {{splits:number[],bestLap:number}|null} [o.best]  stored best record (ms)
   * @param {object|null} [o.ghost]   decoded best-run ghost to replay
   * @param {boolean} [o.recordGhost] record this run as a candidate ghost (time trial)
   */
  constructor({ laps, routeLen, best = null, ghost = null, recordGhost = false }) {
    this.laps = laps;
    this.best = best;
    this.splits = new SplitTracker(laps, routeLen, best ? best.splits.map((ms) => ms / 1000) : null);
    this.ghost = ghost;
    this.recorder = recordGhost ? new GhostRecorder() : null;
    this.events = []; // {type:"split"|"lap", ...} drained by the HUD
    this.lapSeconds = [];
    this.bestLapSeconds = best ? best.bestLap / 1000 : null; // best lap ever (stored or this run)
    this.lastLapSeconds = null;
    this.done = false;
    this.result = null; // {ms, splits, bestLap, ghost} once the player has finished
  }

  /** Call after every race.step(). */
  update(player, race) {
    if (this.done) return;
    const live = race.state === "racing" || (race.state === "finished" && player.finished);
    if (!live) return;
    const t = race.time;
    for (const e of this.splits.update(player.prog, t)) this.onSplit(e);
    this.recorder?.update(t, player);
    if (player.finished) this.finish(player);
  }

  onSplit(e) {
    this.events.push({ type: "split", ...e });
    if (!e.lapEnd) return;
    const laps = lapTimes(this.splits.times, this.laps);
    const lapTime = laps[laps.length - 1];
    const record = this.bestLapSeconds === null || lapTime < this.bestLapSeconds;
    this.lapSeconds = laps;
    this.lastLapSeconds = lapTime;
    if (record) this.bestLapSeconds = lapTime;
    this.events.push({ type: "lap", lap: e.lap, time: lapTime, record });
  }

  finish(player) {
    this.done = true;
    const seconds = player.finishTime;
    const laps = lapTimes(this.splits.times, this.laps);
    this.result = {
      ms: toMs(seconds),
      splits: this.splits.times.map(toMs),
      bestLap: toMs(fastestLap(laps) ?? seconds),
      ghost: this.recorder ? this.recorder.finish(player, seconds) : null,
    };
  }

  /** Live delta [s] vs the stored best at the player's progress; null without a best. */
  delta(race) {
    return this.splits.delta(race.time);
  }

  /** Ghost pose at race time `t` written into `out`, or null if there is no ghost or it has finished. */
  ghostPose(t, out) {
    if (!this.ghost || t > ghostDuration(this.ghost) + 1.5) return null;
    return ghostPoseAt(this.ghost, t, out);
  }
}
