import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CUES, type Sfx } from '../src/audioCues';
import { configureAudio, emit, resetAudioForTests, unlockAudio } from '../src/audio';

let created = 0;
let oscillators = 0;
let state: 'running' | 'suspended' = 'running';
let masterValue = -1;

class FakeParam {
  value = 0;
  setValueAtTime(): void {}
  exponentialRampToValueAtTime(): void {}
  setTargetAtTime(v: number): void {
    masterValue = v;
    this.value = v;
  }
}
const node = () => ({ connect: (n: unknown) => n, start() {}, stop() {}, gain: new FakeParam(), frequency: new FakeParam(), type: '' });

class FakeContext {
  currentTime = 0;
  destination = {};
  get state() {
    return state;
  }
  constructor() {
    created += 1;
  }
  createOscillator() {
    oscillators += 1;
    return node();
  }
  createGain() {
    const n = node();
    n.gain.setTargetAtTime = (v: number) => (masterValue = v);
    return n;
  }
  createDynamicsCompressor() {
    return node();
  }
  resume() {
    return Promise.resolve();
  }
}

beforeEach(() => {
  created = 0;
  oscillators = 0;
  state = 'running';
  masterValue = -1;
  resetAudioForTests();
  vi.stubGlobal('AudioContext', FakeContext);
});
afterEach(() => vi.unstubAllGlobals());

describe('audio', () => {
  it('creates no AudioContext before a gesture, and drops cues', () => {
    expect(emit('x')).toBe(false);
    expect(created).toBe(0);
  });

  it('unlock creates exactly one context', () => {
    unlockAudio();
    unlockAudio();
    expect(created).toBe(1);
  });

  it.each(Object.keys(CUES) as Sfx[])('cue "%s" starts one oscillator per note', (name) => {
    unlockAudio();
    expect(emit(name)).toBe(true);
    expect(oscillators).toBe(CUES[name].notes.length);
  });

  it('muting or zero volume silences every cue', () => {
    unlockAudio();
    configureAudio({ enabled: false, volume: 70 });
    expect(emit('win')).toBe(false);
    configureAudio({ enabled: true, volume: 0 });
    expect(emit('win')).toBe(false);
    expect(oscillators).toBe(0);
  });

  it('master level follows volume (0.5 headroom) and mute', () => {
    unlockAudio();
    configureAudio({ enabled: true, volume: 100 });
    expect(masterValue).toBeCloseTo(0.5);
    configureAudio({ enabled: false, volume: 100 });
    expect(masterValue).toBe(0);
  });

  it('drops cues while the tab is hidden', () => {
    vi.stubGlobal('document', { hidden: true });
    unlockAudio();
    expect(emit('x')).toBe(false);
  });

  it('X and O cue gains sit within 6 dB of each other (square vs triangle)', () => {
    const db = 20 * Math.log10(CUES.o.gain / CUES.x.gain);
    expect(db).toBeLessThan(6);
    expect(CUES.x.wave).toBe('square');
    expect(CUES.o.wave).toBe('triangle');
  });
});
