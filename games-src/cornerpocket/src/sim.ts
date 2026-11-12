// Shot application and headless simulation (used by the game loop, tests and the CPU).
import { MAX_SHOT_SECONDS, MAX_SPEED, STEP } from './constants';
import { type Ball, type SimEvent, cloneBalls, isMoving, stepWorld } from './physics';

export interface Shot {
  angle: number; // radians, direction the cue ball travels
  power: number; // 0..1
  spin: number; // -1 back .. +1 top
}

export interface ShotReport {
  firstHit: number | null; // first ball the cue ball touched
  potted: number[]; // object balls potted, in order
  cuePotted: boolean;
  onTableBefore: number[]; // object ball ids on the table before the shot
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function applyShot(balls: Ball[], shot: Shot): void {
  const cue = balls.find((b) => b.id === 0);
  if (!cue || cue.pocketed) return;
  const p = clamp(shot.power, 0, 1) * MAX_SPEED;
  cue.vx = Math.cos(shot.angle) * p;
  cue.vy = Math.sin(shot.angle) * p;
  cue.spin = clamp(shot.spin, -1, 1);
  cue.spinPending = true;
}

export const newReport = (balls: readonly Ball[]): ShotReport => ({
  firstHit: null,
  potted: [],
  cuePotted: false,
  onTableBefore: balls.filter((b) => b.id !== 0 && !b.pocketed).map((b) => b.id),
});

export function foldEvents(report: ShotReport, events: readonly SimEvent[]): void {
  for (const e of events) {
    if (e.t === 'hit' && report.firstHit === null && (e.a === 0 || e.b === 0)) {
      report.firstHit = e.a === 0 ? e.b : e.a;
    } else if (e.t === 'pot') {
      if (e.id === 0) report.cuePotted = true;
      else report.potted.push(e.id);
    }
  }
}

export interface SimResult {
  balls: Ball[];
  report: ShotReport;
  steps: number;
}

/** Run a whole shot on a copy of the table until everything stops (or the time cap). */
export function simulateShot(start: readonly Ball[], shot: Shot, maxSeconds = MAX_SHOT_SECONDS): SimResult {
  const balls = cloneBalls(start);
  const report = newReport(balls);
  applyShot(balls, shot);
  const events: SimEvent[] = [];
  const maxSteps = Math.ceil(maxSeconds / STEP);
  let steps = 0;
  while (steps < maxSteps && isMoving(balls)) {
    events.length = 0;
    stepWorld(balls, events);
    foldEvents(report, events);
    steps++;
  }
  return { balls, report, steps };
}
