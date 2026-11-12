import { describe, expect, it } from 'vitest';
import { advanceClock, lerp } from '../src/clock';
import { STEP } from '../src/config';
import { axis, dragTarget } from '../src/input';
import { CUES } from '../src/audioCues';

describe('fixed-step clock', () => {
  it('splits time into whole steps and carries the remainder', () => {
    const r = advanceClock(0, STEP * 2.5);
    expect(r.steps).toBe(2);
    expect(r.alpha).toBeCloseTo(0.5, 5);
    const r2 = advanceClock(r.acc, STEP * 0.5 + 1e-9);
    expect(r2.steps).toBe(1);
  });
  it('clamps long frames and ignores negative time', () => {
    expect(advanceClock(0, 5).steps).toBeLessThanOrEqual(Math.ceil(0.1 / STEP));
    expect(advanceClock(0, -1).steps).toBe(0);
  });
  it('the same total time gives the same step count at 60 and 144 Hz', () => {
    const total = (hz: number): number => {
      let acc = 0;
      let n = 0;
      for (let i = 0; i < hz * 5; i++) {
        const r = advanceClock(acc, 1 / hz);
        acc = r.acc;
        n += r.steps;
      }
      return n;
    };
    expect(Math.abs(total(60) - total(144))).toBeLessThanOrEqual(2);
  });
  it('lerp blends', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });
});

describe('input helpers', () => {
  it('axis cancels opposite keys', () => {
    expect(axis(new Set(['ArrowLeft']), ['ArrowLeft'], ['ArrowRight'])).toBe(-1);
    expect(axis(new Set(['ArrowLeft', 'ArrowRight']), ['ArrowLeft'], ['ArrowRight'])).toBe(0);
    expect(axis(new Set(['KeyD']), ['KeyA'], ['KeyD'])).toBe(1);
  });
  it('drag keeps the plane offset from the finger', () => {
    expect(dragTarget({ x: 100, y: 300 }, { x: 180, y: 540 }, { x: 130, y: 280 })).toEqual({ x: 210, y: 520 });
  });
});

describe('audio cues', () => {
  it('every cue has sane notes', () => {
    for (const cue of Object.values(CUES)) {
      expect(cue.gain).toBeGreaterThan(0);
      expect(cue.gain).toBeLessThanOrEqual(0.25);
      expect(cue.notes.length).toBeGreaterThan(0);
      for (const [f, at, dur] of cue.notes) {
        expect(f).toBeGreaterThan(20);
        expect(at).toBeGreaterThanOrEqual(0);
        expect(dur).toBeGreaterThan(0);
      }
    }
  });
});
