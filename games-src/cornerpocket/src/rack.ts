// Rack Attack scoring and timer logic. Pure state transitions, no DOM.
import { RACK } from './config/rack';
import { rackBallCount } from './layouts';
import { STR } from './strings';

export const SCRATCH_PENALTY = RACK.scratchPenalty; // seconds
export const CLEAN_SWEEP_SECONDS = RACK.cleanSweepSeconds;

export interface RackState {
  rack: number;
  time: number; // seconds left
  score: number;
  combo: number; // consecutive pots (resets on a miss or scratch)
  bestCombo: number;
  shots: number; // shots in the current rack
  clean: boolean; // no miss or scratch yet in this rack
  over: boolean;
  started: boolean; // the first shot has been taken: the clock only runs after that
}

export interface RackOutcome {
  texts: string[];
  cleared: boolean; // rack finished: caller should deal the next one
  sweep: boolean; // cleared without a miss or scratch
}

/** Seconds for a fresh rack: base + per ball, minus a ramp once racks get late. */
export function rackTime(rack: number): number {
  const raw = RACK.baseSeconds + RACK.perBallSeconds * rackBallCount(rack);
  const late = Math.max(0, rack - RACK.rampFromRack + 1);
  return Math.max(Math.min(raw, RACK.minRackSeconds), raw - RACK.rampSeconds * late);
}

export const initialRack = (): RackState => ({
  rack: 1, time: rackTime(1), score: 0, combo: 0, bestCombo: 0, shots: 0, clean: true, over: false,
  started: !RACK.startOnFirstShot,
});

export function tickRack(s: RackState, dt: number): void {
  if (s.over || !s.started) return;
  s.time = Math.max(0, s.time - dt);
  if (s.time === 0) s.over = true;
}

/** True when a countdown from `prev` to `cur` seconds crosses a tick boundary (1 Hz under 10 s, 2 Hz under 5 s). */
export function crossedTick(prev: number, cur: number): boolean {
  if (cur <= 0 || cur >= RACK.lowTimeSeconds || cur >= prev) return false;
  const step = cur < RACK.fastTickSeconds ? 0.5 : 1;
  return Math.floor(prev / step) !== Math.floor(cur / step);
}

function awardPots(s: RackState, pots: number, out: string[]): void {
  let bonus = 0;
  for (let i = 0; i < pots; i++) {
    s.combo++;
    s.score += RACK.comboPoints * s.combo;
    bonus += Math.min(s.combo, RACK.comboBonusCap);
  }
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  s.time += bonus;
  out.push(s.combo > 1 ? STR.combo(s.combo, bonus) : STR.pot(bonus));
}

/** Apply one finished shot. `remaining` = object balls left on the table. */
export function applyRackShot(s: RackState, pots: number, scratch: boolean, remaining: number, noContact = false): RackOutcome {
  const texts: string[] = [];
  const first = s.shots === 0;
  s.shots++;
  if (pots > 0) {
    awardPots(s, pots, texts);
    if (first) { s.score += RACK.holeInOnePoints; texts.push(STR.holeInOne(RACK.holeInOnePoints)); }
  } else if (!scratch) {
    s.combo = 0; s.clean = false; texts.push(noContact ? STR.noContact : STR.miss);
  }
  if (scratch) {
    s.combo = 0; s.clean = false; s.time = Math.max(0, s.time - RACK.scratchPenalty);
    texts.push(STR.scratch(RACK.scratchPenalty));
    if (s.time === 0) s.over = true;
  }
  if (remaining > 0) return { texts, cleared: false, sweep: false };
  const bonus = RACK.clearPointsPerRack * s.rack;
  s.score += bonus;
  texts.push(STR.rackCleared(s.rack, bonus));
  if (s.clean) {
    s.score += RACK.cleanSweepPoints; s.time += RACK.cleanSweepSeconds;
    texts.push(STR.cleanSweep(RACK.cleanSweepPoints, RACK.cleanSweepSeconds));
  }
  return { texts, cleared: true, sweep: s.clean };
}

/** Move to the next rack, carrying leftover time. */
export function nextRack(s: RackState): void {
  s.rack++; s.time += rackTime(s.rack); s.shots = 0; s.clean = true; s.combo = 0;
}
