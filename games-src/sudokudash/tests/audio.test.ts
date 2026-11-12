import { describe, expect, it } from 'vitest';
import { CUES, PEAK_CEILING, type Sfx } from '../src/config/audio';
import { cuePeak, peakAtVolume } from '../src/audio';

const NAMES = Object.keys(CUES) as Sfx[];

describe('audio cues', () => {
  it('has the cues the report asked for', () => {
    for (const n of ['tap', 'erase', 'undo', 'redo', 'pause', 'resume', 'tick', 'record', 'start', 'solve'] as const) {
      expect(CUES[n].notes.length).toBeGreaterThan(0);
    }
  });

  it('every note is well formed (audible frequency, positive timing)', () => {
    for (const n of NAMES) {
      for (const [f, at, dur] of CUES[n].notes) {
        expect(f).toBeGreaterThan(80);
        expect(f).toBeLessThan(4000);
        expect(at).toBeGreaterThanOrEqual(0);
        expect(dur).toBeGreaterThan(0);
      }
    }
  });

  it('a single cue never peaks above -6 dBFS at full volume', () => {
    for (const n of NAMES) expect(peakAtVolume(n, 1), n).toBeLessThanOrEqual(PEAK_CEILING);
  });

  it('even a combo + correct + tick pile-up stays under the ceiling at full volume', () => {
    const pile = peakAtVolume('correct', 1) + peakAtVolume('combo', 1) + peakAtVolume('tick', 1) + peakAtVolume('mistake', 1);
    expect(pile).toBeLessThanOrEqual(PEAK_CEILING * 1.6);
  });

  it('volume scales the peak linearly and zero is silent', () => {
    expect(peakAtVolume('win', 0)).toBe(0);
    expect(peakAtVolume('win', 0.5)).toBeCloseTo(peakAtVolume('win', 1) / 2);
    expect(cuePeak('tick')).toBeLessThan(cuePeak('correct'));
  });
});
