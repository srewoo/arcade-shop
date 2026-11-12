import { describe, it, expect } from 'vitest';
import { startAction, startPhase, shouldFireQueued, LOAD_STEPS } from '../startFlow.js';
import { hazardLift, isOriginalFraming } from '../cameraMath.js';
import { ctaText, S } from '../strings.js';
import { CAMERA, COACH } from '../tuning.js';

describe('start flow (loading vs call-to-action)', () => {
  it('starts when ready, queues the first press while loading, ignores repeats', () => {
    expect(startAction({ ready: true, queued: false })).toBe('start');
    expect(startAction({ ready: true, queued: true })).toBe('start');
    expect(startAction({ ready: false, queued: false })).toBe('queue');
    expect(startAction({ ready: false, queued: true })).toBe('ignore');
  });
  it('phase follows ready then queued', () => {
    expect(startPhase({ ready: false, queued: false })).toBe('loading');
    expect(startPhase({ ready: false, queued: true })).toBe('queued');
    expect(startPhase({ ready: true, queued: true })).toBe('ready');
  });
  it('a queued start only fires on the title with no dialog open', () => {
    expect(shouldFireQueued({ queued: true, state: 'title', menuOpen: false })).toBe(true);
    expect(shouldFireQueued({ queued: true, state: 'title', menuOpen: true })).toBe(false);
    expect(shouldFireQueued({ queued: true, state: 'running', menuOpen: false })).toBe(false);
    expect(shouldFireQueued({ queued: false, state: 'title', menuOpen: false })).toBe(false);
  });
  it('load steps rise monotonically to 1', () => {
    const v = Object.values(LOAD_STEPS);
    expect([...v].sort((a, b) => a - b)).toEqual(v);
    expect(LOAD_STEPS.ready).toBe(1);
  });
  it('CTA never says "press space to run" while loading', () => {
    expect(ctaText(false, false, 'loading')).toBe(S.title.ctaLoading);
    expect(ctaText(false, true, 'queued')).toBe(S.title.ctaQueued);
    expect(ctaText(false, false, 'loading')).not.toMatch(/RUN/);
    expect(ctaText(false, false)).toBe('PRESS SPACE TO RUN');
  });
});

describe('hazard camera lift (presentation only)', () => {
  const base = { mode: 'classic', difficulty: 'normal', classicPlus: false };
  it('Classic on Normal keeps the original framing', () => {
    expect(isOriginalFraming(base)).toBe(true);
    expect(hazardLift(base)).toBe(0);
  });
  it('other modes, difficulties and Classic Plus get the lift', () => {
    for (const cfg of [{ ...base, mode: 'hardcore' }, { ...base, difficulty: 'hard' }, { ...base, difficulty: 'easy' }, { ...base, classicPlus: true }]) {
      expect(hazardLift(cfg)).toBe(CAMERA.hazardLift);
    }
  });
});

describe('hint line', () => {
  it('keeps the in-run hint short and auto-hides quickly', () => {
    expect(S.hints.keys.length).toBeLessThan(40);
    expect(S.hints.keys).not.toMatch(/Double Jump/);
    expect(COACH.hintsAutoHideS).toBeLessThanOrEqual(5);
  });
});
