// Synthesised WebAudio. Every voice goes through one master gain and a compressor, so
// stacked events (bomb + fall + pop) cannot clip. No audio files.
import { Voice, soundPlan } from './audioPlan';
import { GameEvent } from './state';

/** Master level before the volume setting; leaves headroom for stacked voices. */
const MASTER = 0.7;

interface Bus { master: GainNode; input: AudioNode }

let ctx: AudioContext | null = null;
let bus: Bus | null = null;
let noiseBuf: AudioBuffer | null = null;
let enabled = true;
let volume = 0.8;

export function createBus(c: BaseAudioContext, vol: number): Bus {
  const master = c.createGain();
  master.gain.value = MASTER * vol;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 8;
  comp.ratio.value = 14;
  comp.attack.value = 0.002;
  comp.release.value = 0.2;
  master.connect(comp).connect(c.destination);
  return { master, input: master };
}

/** One shared white-noise buffer, generated once per context. */
function noiseBuffer(c: BaseAudioContext): AudioBuffer {
  const len = Math.floor(c.sampleRate * 0.6);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  let seed = 1;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = (seed / 2147483648 - 1) * (1 - i / len);
  }
  return buf;
}

function playTone(c: BaseAudioContext, out: AudioNode, v: Voice, t: number): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = v.type ?? 'sine';
  osc.frequency.setValueAtTime(v.freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, v.to ?? v.freq), t + v.dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(v.vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + v.dur + 0.02);
}

function playNoise(c: BaseAudioContext, out: AudioNode, v: Voice, t: number, buf: AudioBuffer): void {
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  filter.type = 'lowpass';
  filter.frequency.value = v.freq;
  gain.gain.value = v.vol;
  src.buffer = buf;
  src.connect(filter).connect(gain).connect(out);
  src.start(t, 0, Math.min(v.dur, buf.duration));
}

export function playVoices(c: BaseAudioContext, b: Bus, voices: readonly Voice[], buf: AudioBuffer, at = c.currentTime): void {
  for (const v of voices) {
    const t = at + (v.delay ?? 0);
    if (v.kind === 'tone') playTone(c, b.input, v, t);
    else playNoise(c, b.input, v, t, buf);
  }
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** 0 to 100, as stored in settings. */
export function setVolume(percent: number): void {
  volume = Math.max(0, Math.min(100, percent)) / 100;
  if (bus) bus.master.gain.value = MASTER * volume;
}

/** Must be called from a user gesture the first time. */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      bus = createBus(ctx, volume);
      noiseBuf = noiseBuffer(ctx);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
    bus = null;
  }
}

export function playEvent(e: GameEvent): void {
  if (!ctx || !bus || !noiseBuf || !enabled || volume === 0) return;
  playVoices(ctx, bus, soundPlan(e), noiseBuf);
}

/** Render a bomb + fall + pop burst offline and return its peak sample (test hook). */
export async function renderBurstPeak(percent: number): Promise<number> {
  const rate = 44100;
  const off = new OfflineAudioContext(1, rate * 1.5, rate);
  const b = createBus(off, percent / 100);
  const events: GameEvent[] = [
    { type: 'bomb', n: 9 }, { type: 'fall', n: 6 }, { type: 'pop', n: 9, combo: 5 }, { type: 'ceiling', n: 0 },
  ];
  const buf = noiseBuffer(off);
  for (const e of events) playVoices(off, b, soundPlan(e), buf, 0);
  const data = (await off.startRendering()).getChannelData(0);
  let peak = 0;
  for (const s of data) peak = Math.max(peak, Math.abs(s));
  return peak;
}
