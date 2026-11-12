import { describe, expect, it } from 'vitest';
import { configureAudio, emit, resetAudioForTests } from '../src/audio';
import { CUES } from '../src/audioCues';

describe('audio', () => {
  it('has a non-empty cue for every sound with sane notes', () => {
    for (const [name, cue] of Object.entries(CUES)) {
      expect(cue.notes.length, name).toBeGreaterThan(0);
      expect(cue.gain, name).toBeLessThanOrEqual(0.3);
      for (const [freq, at, dur] of cue.notes) {
        expect(freq).toBeGreaterThan(50);
        expect(at).toBeGreaterThanOrEqual(0);
        expect(dur).toBeGreaterThan(0);
      }
    }
  });
  it('plays nothing before a user gesture, when muted, or without WebAudio', () => {
    resetAudioForTests();
    expect(emit('win')).toBe(false);
    configureAudio({ enabled: false, volume: 70 });
    expect(emit('pour')).toBe(false);
    configureAudio({ enabled: true, volume: 0 });
    expect(emit('pour')).toBe(false);
    resetAudioForTests();
  });
});
