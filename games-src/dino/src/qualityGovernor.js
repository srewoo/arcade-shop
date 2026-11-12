// Adaptive quality governor logic (pure, unit-tested).  Frames are averaged over windowS-second windows.  A window below
// downFps steps quality down (up to maxSteps); a run of windows at or above upFps lasting upHoldS steps it back up, so a
// one-off dip (tab switch, notification shade) no longer lowers the pixel ratio for the rest of the session.
// The two thresholds differ (50 down, 58 up) so it can not oscillate.
import { QUALITY } from './tuning.js';

export function createGovernor(cfg = QUALITY) {
  return { cfg, steps: 0, warmup: cfg.warmupS, windowTime: 0, windowFrames: 0, goodTime: 0 };
}

/** Restart the measuring (quality changed, a pause ended): keeps the current step, drops the partial window. */
export function resetGovernor(g, { keepSteps = true } = {}) {
  g.warmup = g.cfg.warmupS;
  g.windowTime = 0;
  g.windowFrames = 0;
  g.goodTime = 0;
  if (!keepSteps) g.steps = 0;
}

/**
 * Feed one frame of `dt` seconds.  Returns 'down' | 'up' when the step changed (g.steps is already updated), else null.
 * Frames longer than cfg.maxFrameS (tab switch, GC) are ignored.
 */
export function governorFrame(g, dt) {
  const { cfg } = g;
  if (dt > cfg.maxFrameS) return null;
  if (g.warmup > 0) {
    g.warmup -= dt;
    return null;
  }
  g.windowTime += dt;
  g.windowFrames++;
  if (g.windowTime < cfg.windowS) return null;
  const fps = g.windowFrames / g.windowTime;
  const span = g.windowTime;
  g.windowTime = 0;
  g.windowFrames = 0;
  if (fps < cfg.downFps) {
    g.goodTime = 0;
    if (g.steps >= cfg.maxSteps) return null;
    g.steps++;
    return 'down';
  }
  if (fps >= cfg.upFps && g.steps > 0) {
    g.goodTime += span;
    if (g.goodTime < cfg.upHoldS) return null;
    g.goodTime = 0;
    g.steps--;
    return 'up';
  }
  g.goodTime = 0;
  return null;
}

/** Pixel ratio and shadows for a governor step given the device default `base` (step 0 = untouched). */
export function planForStep(step, base) {
  if (step <= 0) return { pixelRatio: base, shadows: true };
  if (step === 1) return { pixelRatio: Math.min(base, 1.25), shadows: true };
  if (step === 2) return { pixelRatio: Math.min(base, 1), shadows: true };
  return { pixelRatio: Math.min(base, 1), shadows: false };
}
