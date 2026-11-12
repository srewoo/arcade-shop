import { describe, it, expect } from 'vitest';
import { createGovernor, governorFrame, resetGovernor, planForStep } from '../qualityGovernor.js';
import { QUALITY } from '../tuning.js';

/** Feed `seconds` of frames at `fps`; returns the list of changes. */
function feed(g, fps, seconds) {
  const out = [];
  const dt = 1 / fps;
  for (let t = 0; t < seconds; t += dt) {
    const c = governorFrame(g, dt);
    if (c) out.push(c);
  }
  return out;
}

describe('adaptive quality governor', () => {
  it('waits out the warm-up before judging anything', () => {
    const g = createGovernor();
    expect(feed(g, 20, QUALITY.warmupS - 0.1)).toEqual([]);
    expect(g.steps).toBe(0);
  });
  it('steps down once per slow window, up to maxSteps', () => {
    const g = createGovernor();
    feed(g, 30, QUALITY.warmupS);
    expect(feed(g, 30, QUALITY.windowS * 6)).toEqual(['down', 'down', 'down']);
    expect(g.steps).toBe(QUALITY.maxSteps);
  });
  it('recovers after a sustained good stretch (the old governor never did)', () => {
    const g = createGovernor();
    feed(g, 30, QUALITY.warmupS);
    feed(g, 30, QUALITY.windowS * 2);
    expect(g.steps).toBe(2);
    const ups = feed(g, 60, QUALITY.upHoldS * 3 + QUALITY.windowS);
    expect(ups.filter((c) => c === 'up').length).toBe(2);
    expect(g.steps).toBe(0);
  });
  it('does not step up on a brief good spell or at 50-58 fps (hysteresis)', () => {
    const g = createGovernor();
    feed(g, 30, QUALITY.warmupS);
    feed(g, 30, QUALITY.windowS);
    expect(g.steps).toBe(1);
    expect(feed(g, 60, QUALITY.upHoldS - QUALITY.windowS * 2)).toEqual([]);
    expect(feed(g, 54, QUALITY.upHoldS * 3)).toEqual([]);
    expect(g.steps).toBe(1);
  });
  it('a dip inside the good stretch resets the hold timer', () => {
    const g = createGovernor();
    feed(g, 30, QUALITY.warmupS + QUALITY.windowS);
    expect(g.steps).toBe(1);
    feed(g, 60, QUALITY.upHoldS - QUALITY.windowS);
    feed(g, 54, QUALITY.windowS); // in-between window: not good enough
    expect(feed(g, 60, QUALITY.upHoldS - QUALITY.windowS)).toEqual([]);
  });
  it('ignores frames longer than maxFrameS (tab switch, GC)', () => {
    const g = createGovernor();
    expect(governorFrame(g, 1)).toBeNull();
    expect(g.warmup).toBe(QUALITY.warmupS);
  });
  it('resetGovernor keeps or clears the step', () => {
    const g = createGovernor();
    g.steps = 2;
    resetGovernor(g);
    expect(g.steps).toBe(2);
    expect(g.warmup).toBe(QUALITY.warmupS);
    resetGovernor(g, { keepSteps: false });
    expect(g.steps).toBe(0);
  });
  it('maps steps to pixel ratio and shadows', () => {
    expect(planForStep(0, 2)).toEqual({ pixelRatio: 2, shadows: true });
    expect(planForStep(1, 2)).toEqual({ pixelRatio: 1.25, shadows: true });
    expect(planForStep(2, 2)).toEqual({ pixelRatio: 1, shadows: true });
    expect(planForStep(3, 2)).toEqual({ pixelRatio: 1, shadows: false });
    expect(planForStep(1, 1)).toEqual({ pixelRatio: 1, shadows: true });
  });
});
