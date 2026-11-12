import { describe, it, expect, vi } from 'vitest';
import { AudioFx } from '../audio.js';
import { AUDIO } from '../tuning.js';

/** Minimal fake AudioContext that counts what gets built and lets the test end voices. */
function fakeCtx(state = 'running') {
  const ended = [];
  const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), value: 0 });
  const node = (extra = {}) => ({ connect: (n) => n, start: vi.fn(), stop: vi.fn(), frequency: param(), gain: param(), ...extra });
  return {
    state, currentTime: 0, sampleRate: 100, ended,
    resume: vi.fn(() => Promise.resolve()), suspend: vi.fn(() => Promise.resolve()),
    createOscillator() { const o = node(); ended.push(o); return o; },
    createGain: () => node(),
    createBiquadFilter: () => node(),
    createBufferSource() { const s = node(); ended.push(s); return s; },
    createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
  };
}

function setup(state) {
  const fx = new AudioFx();
  fx.ctx = fakeCtx(state);
  fx.master = { gain: { value: 0 } };
  fx.noiseBuf = {};
  return fx;
}

describe('audio plumbing', () => {
  it('caps polyphony but lets priority voices through', () => {
    const fx = setup('running');
    for (let i = 0; i < AUDIO.maxVoices + 5; i++) fx.step(1); // noise bursts, no priority
    expect(fx.ctx.ended.length).toBe(AUDIO.maxVoices);
    fx.crash(); // priority layers
    expect(fx.ctx.ended.length).toBeGreaterThan(AUDIO.maxVoices);
  });
  it('frees a voice when its node ends', () => {
    const fx = setup('running');
    for (let i = 0; i < AUDIO.maxVoices; i++) fx.jump();
    fx.jump();
    expect(fx.ctx.ended.length).toBe(AUDIO.maxVoices);
    fx.ctx.ended[0].onended();
    fx.jump();
    expect(fx.ctx.ended.length).toBe(AUDIO.maxVoices + 1);
  });
  it('plays nothing while muted', () => {
    const fx = setup('running');
    fx.setMuted(true);
    fx.jump();
    fx.ui('tick');
    expect(fx.ctx.ended.length).toBe(0);
    expect(fx.master.gain.value).toBe(0);
  });
  it('queues a sound asked for while the context is still waking up, then plays it', async () => {
    const fx = setup('suspended');
    fx.ui('confirm');
    expect(fx.ctx.ended.length).toBe(0);
    expect(fx._queue.length).toBeGreaterThan(0);
    fx.ctx.state = 'running';
    fx._flush();
    expect(fx.ctx.ended.length).toBeGreaterThan(0);
  });
  it('drops queued sounds that are too old', () => {
    const fx = setup('suspended');
    fx.ui('tick');
    fx._queue[0].at -= AUDIO.queueMaxAgeMs + 50;
    fx.ctx.state = 'running';
    fx._flush();
    expect(fx.ctx.ended.length).toBe(0);
  });
  it('master volume maps to the master gain', () => {
    const fx = setup('running');
    fx.setVolume(0.5);
    expect(fx.master.gain.value).toBeCloseTo(0.25);
    fx.setVolume(7);
    expect(fx.volume).toBe(1);
    fx.setMuted(true);
    expect(fx.level).toBe(0);
  });
  it('suspends the context on a hidden pause only, and resumes afterwards', () => {
    const fx = setup('running');
    fx.setPaused(true);
    expect(fx.ctx.suspend).not.toHaveBeenCalled();
    fx.setPaused(false);
    fx.setPaused(true, { suspend: true });
    expect(fx.ctx.suspend).toHaveBeenCalled();
    fx.ctx.state = 'suspended';
    fx.setPaused(false);
    expect(fx.ctx.resume).toHaveBeenCalled();
  });
  it('has a sound for every new feedback event', () => {
    const fx = setup('running');
    for (const call of [() => fx.newBest(), () => fx.warn(), () => fx.tick(0.5), () => fx.timeUp(), () => fx.slowmo(true), () => fx.slowmo(false),
      () => fx.powerEnd(), () => fx.recover(), () => fx.biome(), () => fx.ui('back'), () => fx.ui('toggle')]) expect(call).not.toThrow();
  });
});
