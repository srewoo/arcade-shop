import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine, MASTER_MAX, masterLevel } from '../src/audio';
import { JINGLE_GAIN, TICK_FREQS, tickFreq } from '../src/sfx';

class Param {
  value = 0;
  calls: string[] = [];
  setValueAtTime(v: number): void { this.value = v; this.calls.push('set'); }
  setTargetAtTime(v: number): void { this.calls.push(`target:${v}`); this.value = v; }
  exponentialRampToValueAtTime(): void { this.calls.push('ramp'); }
  cancelScheduledValues(): void { this.calls.push('cancel'); }
}
class Node {
  gain = new Param(); frequency = new Param(); Q = new Param(); threshold = new Param(); ratio = new Param();
  type = ''; buffer: unknown = null; loop = false; started = 0;
  connect(n: unknown): unknown { return n; }
  start(): void { this.started++; }
  stop(): void { /* noop */ }
}
let created: Node[] = [];
class FakeCtx {
  state = 'running';
  currentTime = 1;
  sampleRate = 1000;
  destination = new Node();
  static instances: FakeCtx[] = [];
  constructor() { FakeCtx.instances.push(this); }
  private make(): Node { const n = new Node(); created.push(n); return n; }
  createGain(): Node { return this.make(); }
  createOscillator(): Node { return this.make(); }
  createBiquadFilter(): Node { return this.make(); }
  createDynamicsCompressor(): Node { return this.make(); }
  createBufferSource(): Node { return this.make(); }
  createBuffer(_c: number, len: number): { getChannelData: () => Float32Array } { return { getChannelData: () => new Float32Array(len) }; }
  suspend(): Promise<void> { this.state = 'suspended'; return Promise.resolve(); }
  resume(): Promise<void> { this.state = 'running'; return Promise.resolve(); }
}

beforeEach(() => {
  created = [];
  FakeCtx.instances = [];
  vi.stubGlobal('AudioContext', FakeCtx);
  vi.stubGlobal('window', { setTimeout: () => 0 });
});
afterEach(() => vi.unstubAllGlobals());

describe('master level', () => {
  it('stays at or under -6 dBFS and follows volume and mute', () => {
    expect(20 * Math.log10(MASTER_MAX)).toBeLessThanOrEqual(-6);
    expect(masterLevel(100, false)).toBe(MASTER_MAX);
    expect(masterLevel(0, false)).toBe(0);
    expect(masterLevel(50, false)).toBeCloseTo(MASTER_MAX / 2);
    expect(masterLevel(80, true)).toBe(0);
    expect(masterLevel(500, false)).toBe(MASTER_MAX);
  });
  it('jingles are quieter than before and the tick pitch rises per lock', () => {
    expect(JINGLE_GAIN).toBeLessThan(0.16);
    expect(TICK_FREQS).toEqual([...TICK_FREQS].sort((a, b) => a - b));
    expect(tickFreq(0)).toBeLessThan(tickFreq(3));
    expect(tickFreq(99)).toBe(tickFreq(3));
    expect(tickFreq(-2)).toBe(tickFreq(0));
  });
});

describe('AudioEngine pause and mute', () => {
  const engine = (): AudioEngine => { const a = new AudioEngine(); a.unlock(); return a; };

  it('pause silences the rumble at once, ignores updates, and resume lets them through', () => {
    const a = engine();
    a.startRoll();
    a.updateRoll(1, false);
    expect(a.debugState().rollGain).toBeCloseTo(0.42);
    a.pause();
    expect(a.debugState().rollGain).toBe(0);
    a.updateRoll(1, false);
    expect(a.debugState().rollGain).toBe(0);
    a.resume();
    a.updateRoll(1, false);
    expect(a.debugState().rollGain).toBeCloseTo(0.42);
  });
  it('sleep suspends the context and wake resumes it', () => {
    const a = engine();
    a.sleep();
    expect(FakeCtx.instances[0]?.state).toBe('suspended');
    expect(a.debugState().asleep).toBe(true);
    a.unlock();
    expect(FakeCtx.instances[0]?.state).toBe('suspended');
    a.wake();
    expect(FakeCtx.instances[0]?.state).toBe('running');
  });
  it('muted engines create no voices for any one-shot cue', () => {
    const a = engine();
    a.setMuted(true);
    const before = created.length;
    a.tick(0); a.release(); a.ui('tap'); a.crowd(); a.jingle('strike'); a.clatter(500);
    expect(created.length).toBe(before);
    a.setMuted(false);
    a.tick(0); a.release(); a.crowd();
    expect(created.length).toBeGreaterThan(before);
  });
  it('volume maps to the master gain', () => {
    const a = engine();
    a.setVolume(40);
    expect(a.debugState().master).toBeCloseTo(masterLevel(40, false));
    a.setVolume(999);
    expect(a.volume).toBe(100);
  });
  it('UI cues are rate-limited', () => {
    const a = engine();
    a.ui('tap');
    const n = created.length;
    a.ui('tap');
    expect(created.length).toBe(n);
  });
  it('works without any AudioContext (no crash)', () => {
    vi.stubGlobal('AudioContext', undefined);
    const a = new AudioEngine();
    a.unlock();
    a.startRoll(); a.updateRoll(1, false); a.stopRoll(); a.tick(1); a.pause(); a.resume(); a.sleep(); a.wake();
    expect(a.debugState().state).toBe('none');
  });
});
