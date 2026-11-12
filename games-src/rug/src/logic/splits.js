// Sector splits, lap times and live delta vs the best run. Pure.
// Checkpoints sit at every third of a lap (3 sectors per lap); the last one is the finish line.
// All times here are seconds of race time; stored records use integer milliseconds.

export const SECTORS_PER_LAP = 3;

/** Route-progress thresholds of every checkpoint of a `laps`-lap race (progress is in route samples). */
export function checkpointProgs(laps, routeLen) {
  return Array.from({ length: laps * SECTORS_PER_LAP }, (_, k) => ((k + 1) * routeLen) / SECTORS_PER_LAP);
}

/** Cumulative checkpoint times [s] -> per-lap times [s]. */
export function lapTimes(splits, laps) {
  const out = [];
  for (let lap = 0; lap < laps; lap++) {
    const end = splits[(lap + 1) * SECTORS_PER_LAP - 1];
    if (end === undefined) break;
    const start = lap === 0 ? 0 : splits[lap * SECTORS_PER_LAP - 1];
    out.push(end - start);
  }
  return out;
}

/** Fastest lap [s] of a list of lap times, or null. */
export const fastestLap = (laps) => (laps.length ? Math.min(...laps) : null);

/** Time of the best run at route progress `prog`, interpolated linearly between its checkpoints. */
export function bestTimeAtProgress(bestSplits, cpProgs, prog) {
  if (!bestSplits || bestSplits.length !== cpProgs.length) return null;
  if (prog <= 0) return 0;
  let prevProg = 0;
  let prevTime = 0;
  for (let k = 0; k < cpProgs.length; k++) {
    if (prog <= cpProgs[k]) return prevTime + ((bestSplits[k] - prevTime) * (prog - prevProg)) / (cpProgs[k] - prevProg);
    prevProg = cpProgs[k];
    prevTime = bestSplits[k];
  }
  return prevTime;
}

/** Current time minus the best run's time at the same progress (negative = ahead of best); null w/o best. */
export function liveDelta(bestSplits, cpProgs, prog, time) {
  const best = bestTimeAtProgress(bestSplits, cpProgs, prog);
  return best === null ? null : time - best;
}

/** "+0.34" / "-0.21" / "+0.00". */
export const formatDelta = (seconds) => `${seconds < 0 ? "-" : "+"}${Math.abs(seconds).toFixed(2)}`;

/** Tracks checkpoint crossings of one run and the split delta vs the best run (seconds, may be null). */
export class SplitTracker {
  constructor(laps, routeLen, bestSplits = null) {
    this.laps = laps;
    this.cpProgs = checkpointProgs(laps, routeLen);
    this.best = bestSplits && bestSplits.length === this.cpProgs.length ? bestSplits : null;
    this.times = [];
    this.maxProg = 0;
  }

  /** Feed progress and race time; returns the checkpoints crossed since the last call. */
  update(prog, time) {
    const events = [];
    this.maxProg = Math.max(this.maxProg, prog);
    while (this.times.length < this.cpProgs.length && this.maxProg >= this.cpProgs[this.times.length]) {
      const index = this.times.length;
      this.times.push(time);
      events.push({
        index,
        lap: Math.floor(index / SECTORS_PER_LAP) + 1,
        sector: (index % SECTORS_PER_LAP) + 1,
        time,
        delta: this.best ? time - this.best[index] : null,
        lapEnd: index % SECTORS_PER_LAP === SECTORS_PER_LAP - 1,
      });
    }
    return events;
  }

  get done() {
    return this.times.length === this.cpProgs.length;
  }

  /** Live delta at the current progress/time vs the best run (null w/o a best). */
  delta(time) {
    return liveDelta(this.best, this.cpProgs, this.maxProg, time);
  }
}
