// Synthesised WebAudio. Everything goes through one master gain and a compressor.
import { enginePlan, soundPlan, type Cue, type Voice } from './audioPlan';

const MASTER = 0.7;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let engine: { osc: OscillatorNode; gain: GainNode } | null = null;
let enabled = true;
let volume = 0.7;

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

function tone(c: AudioContext, out: AudioNode, v: Voice, t: number): void {
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

function noise(c: AudioContext, out: AudioNode, v: Voice, t: number, buf: AudioBuffer): void {
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

function startEngine(c: AudioContext, out: AudioNode): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  const lp = c.createBiquadFilter();
  osc.type = 'sawtooth';
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  gain.gain.value = 0;
  osc.connect(lp).connect(gain).connect(out);
  osc.start();
  engine = { osc, gain };
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (!on) setEngine(0, false, false);
}

export function setVolume(percent: number): void {
  volume = Math.max(0, Math.min(100, percent)) / 100;
  if (master) master.gain.value = MASTER * volume;
}

/** Call from a user gesture. */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = MASTER * volume;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp).connect(ctx.destination);
      noiseBuf = noiseBuffer(ctx);
      startEngine(ctx, master);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
    master = null;
  }
}

export function playCue(cue: Cue): void {
  if (!ctx || !master || !noiseBuf || !enabled || volume === 0) return;
  const now = ctx.currentTime;
  for (const v of soundPlan(cue)) {
    const t = now + (v.delay ?? 0);
    if (v.kind === 'tone') tone(ctx, master, v, t);
    else noise(ctx, master, v, t, noiseBuf);
  }
}

/** Engine hum follows speed while running; silent when stopped, paused or muted. */
export function setEngine(speed: number, boosting: boolean, running: boolean): void {
  if (!ctx || !engine) return;
  const plan = enginePlan(speed, boosting);
  const t = ctx.currentTime;
  engine.osc.frequency.setTargetAtTime(plan.freq, t, 0.05);
  engine.gain.gain.setTargetAtTime(running && enabled ? plan.gain : 0, t, 0.08);
}
