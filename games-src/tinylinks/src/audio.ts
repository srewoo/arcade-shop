// Tiny synthesised sound effects (no audio files). Every cue goes through one master gain +
// compressor. The AudioContext is created on the first user gesture and cues are dropped while
// the tab is hidden.
import { CONFIG } from './config';
import { CUES, type Cue, type Sfx } from './audioCues';

export type { Sfx } from './audioCues';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let unlocked = false;
let enabled = true;
let volume: number = CONFIG.audio.defaultVolume;

const masterLevel = (): number => (enabled ? (volume / 100) * CONFIG.audio.masterGain : 0);

function build(): AudioContext | null {
  try {
    const ac = new AudioContext();
    const gain = ac.createGain();
    const limiter = ac.createDynamicsCompressor();
    gain.gain.value = masterLevel();
    gain.connect(limiter);
    limiter.connect(ac.destination);
    master = gain;
    const len = Math.floor(ac.sampleRate * 0.5);
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < len; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = (seed / 0xffffffff) * 2 - 1; }
    return ac;
  } catch {
    return null;
  }
}

/** Mute and volume from the settings; safe to call before the context exists. */
export function configureAudio(next: { enabled: boolean; volume: number }): void {
  enabled = next.enabled;
  volume = next.volume;
  if (master && ctx) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.02);
}

/** Create/resume the context. Only ever called from a user gesture handler. */
export function unlockAudio(): void {
  unlocked = true;
  ctx ??= build();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function installAudioUnlock(target: Document = document): void {
  const once = (): void => {
    unlockAudio();
    target.removeEventListener('pointerdown', once, true);
    target.removeEventListener('keydown', once, true);
  };
  target.addEventListener('pointerdown', once, true);
  target.addEventListener('keydown', once, true);
}

function playNotes(ac: AudioContext, out: GainNode, cue: Cue, start: number, scale: number): void {
  for (const [freq, at, dur, glide] of cue.notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = cue.wave;
    osc.frequency.setValueAtTime(freq, start + at);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, start + at + dur);
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, CONFIG.audio.cueGain * cue.gain * scale), start + at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + dur);
    osc.connect(gain).connect(out);
    osc.start(start + at);
    osc.stop(start + at + dur + 0.02);
  }
}

function playNoise(ac: AudioContext, out: GainNode, cue: Cue, start: number, scale: number): void {
  if (!cue.noise || !noiseBuf) return;
  const [at, dur, hz, g] = cue.noise;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = noiseBuf;
  filter.type = 'lowpass';
  filter.frequency.value = hz;
  gain.gain.setValueAtTime(CONFIG.audio.cueGain * g * scale, start + at);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + at + dur);
  src.connect(filter).connect(gain).connect(out);
  src.start(start + at);
  src.stop(start + at + dur + 0.02);
}

/** Play a cue after `delay` seconds; `scale` (0..1) softens it. Returns false when not played. */
export function emit(name: Sfx, delay = 0, scale = 1): boolean {
  if (!enabled || volume === 0 || !unlocked || !ctx || !master) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (ctx.state === 'suspended') void ctx.resume();
  const cue: Cue = CUES[name];
  const start = ctx.currentTime + delay;
  playNotes(ctx, master, cue, start, scale);
  playNoise(ctx, master, cue, start, scale);
  return true;
}

/** Test hook: forget the context and gesture state. */
export function resetAudioForTests(): void {
  ctx = null; master = null; noiseBuf = null; unlocked = false; enabled = true;
  volume = CONFIG.audio.defaultVolume as number;
}
