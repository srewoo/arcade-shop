import { describe, expect, it } from 'vitest';
import { enginePlan, soundPlan, type Cue } from '../src/audioPlan';

const CUES: Cue[] = [
  { type: 'count', n: 3 }, { type: 'go' }, { type: 'near', combo: 4, points: 100, x: 2 },
  { type: 'crash', lives: 2, x: 2, rel: 1 }, { type: 'fuel' }, { type: 'boost' }, { type: 'lowfuel' },
  { type: 'checkpoint', index: 1, of: 5, bonus: 16 }, { type: 'over', outcome: 'finish' }, { type: 'over', outcome: 'crash' },
  { type: 'click' }, { type: 'pause' },
];

describe('audio plan', () => {
  it('every cue has audible, finite voices', () => {
    for (const cue of CUES) {
      const voices = soundPlan(cue);
      expect(voices.length).toBeGreaterThan(0);
      for (const v of voices) {
        expect(v.freq).toBeGreaterThan(0);
        expect(v.dur).toBeGreaterThan(0);
        expect(v.vol).toBeGreaterThan(0);
        expect(v.vol).toBeLessThanOrEqual(0.6);
      }
    }
  });
  it('near-miss pitch rises with combo', () => {
    const f = (combo: number): number => soundPlan({ type: 'near', combo, points: 1, x: 0 })[0]?.freq ?? 0;
    expect(f(5)).toBeGreaterThan(f(1));
  });
  it('engine pitch rises with speed and boost, and gain stays quiet', () => {
    expect(enginePlan(50, false).freq).toBeGreaterThan(enginePlan(10, false).freq);
    expect(enginePlan(30, true).freq).toBeGreaterThan(enginePlan(30, false).freq);
    expect(enginePlan(200, false).gain).toBeLessThan(0.12);
  });
});
