import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CUES, type Sfx } from '../src/audioCues';
import { configureAudio, emit, resetAudioForTests, unlockAudio } from '../src/audio';

class Param { value = 0; setValueAtTime = vi.fn(); exponentialRampToValueAtTime = vi.fn(); linearRampToValueAtTime = vi.fn(); setTargetAtTime = vi.fn(); }
const node = (): Record<string, unknown> => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), gain: new Param(), frequency: new Param(), type: '', buffer: null, loop: false });
let created = 0;
class FakeCtx {
  state = 'running'; currentTime = 0; sampleRate = 8000; destination = {};
  createGain = (): unknown => { created++; return node(); };
  createOscillator = (): unknown => { created++; return node(); };
  createBiquadFilter = (): unknown => node();
  createDynamicsCompressor = (): unknown => node();
  createBufferSource = (): unknown => { created++; return node(); };
  createBuffer = (): unknown => ({ getChannelData: () => new Float32Array(8000) });
  resume = vi.fn();
}

describe('audio cues', () => {
  it('every cue has voices with sane timing and gain', () => {
    for (const [name, voices] of Object.entries(CUES)) {
      expect(voices.length, name).toBeGreaterThan(0);
      for (const v of voices) {
        expect(v.dur, name).toBeGreaterThan(0);
        expect(v.at, name).toBeGreaterThanOrEqual(0);
        expect(v.gain, name).toBeGreaterThan(0);
        expect(v.gain, name).toBeLessThanOrEqual(0.5);
        expect(v.f0, name).toBeGreaterThan(0);
      }
    }
  });
  it('covers the cues the game emits', () => {
    const need: Sfx[] = ['lock', 'throw', 'roll', 'hit', 'wobble', 'scare', 'yowl', 'cushion', 'fish', 'strike', 'spare', 'gutter', 'over', 'start', 'ui'];
    for (const n of need) expect(CUES[n]).toBeDefined();
  });
});

describe('audio engine', () => {
  beforeEach(() => { resetAudioForTests(); created = 0; vi.stubGlobal('AudioContext', FakeCtx); });
  afterEach(() => vi.unstubAllGlobals());
  it('drops cues before the first user gesture', () => {
    expect(emit('hit')).toBe(false);
  });
  it('plays after unlock and builds nodes', () => {
    unlockAudio();
    expect(emit('yowl', 0, 1.2)).toBe(true);
    expect(created).toBeGreaterThan(2);
  });
  it('is silent when muted or volume is 0', () => {
    unlockAudio();
    configureAudio({ enabled: false, volume: 50 });
    expect(emit('hit')).toBe(false);
    configureAudio({ enabled: true, volume: 0 });
    expect(emit('hit')).toBe(false);
    configureAudio({ enabled: true, volume: 50 });
    expect(emit('hit')).toBe(true);
  });
  it('survives a missing AudioContext', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => unlockAudio()).not.toThrow();
    expect(emit('hit')).toBe(false);
  });
});
