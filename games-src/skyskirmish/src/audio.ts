// Synthesised sound effects (no audio files). Every cue goes through one master gain and a
// compressor. The AudioContext is created on the first user gesture and cues are dropped while
// the tab is hidden.
import { CONFIG } from './config';
import { CUES, type Sfx } from './audioCues';

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
    const len = Math.floor(ac.sampleRate * 0.9);
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < len; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = seed / 2147483648 - 1;
    }
    return ac;
  } catch {
    return null;
  }
}

export function configureAudio(next: { enabled: boolean; volume: number }): void {
  enabled = next.enabled;
  volume = next.volume;
  if (master && ctx) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.02);
}

/** Create/resume the context. Only called from a user gesture handler. */
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

function playNoise(ac: AudioContext, out: GainNode, start: number, dur: number, cutoff: number, gainLevel: number): void {
  if (!noiseBuf) return;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = noiseBuf;
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(gainLevel, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(gain).connect(out);
  src.start(start);
  src.stop(start + dur + 0.02);
}

/** Play a cue. Returns false when it was not played. */
export function emit(name: Sfx, delay = 0): boolean {
  if (!enabled || volume === 0 || !unlocked || !ctx || !master) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (ctx.state === 'suspended') void ctx.resume();
  const cue = CUES[name];
  const start = ctx.currentTime + delay;
  for (const [freq, at, dur, end] of cue.notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = cue.wave;
    osc.frequency.setValueAtTime(freq, start + at);
    if (end) osc.frequency.exponentialRampToValueAtTime(end, start + at + dur);
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(cue.gain, start + at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + dur);
    osc.connect(gain).connect(master);
    osc.start(start + at);
    osc.stop(start + at + dur + 0.02);
  }
  if (cue.noise) playNoise(ctx, master, start, cue.noise[0], cue.noise[1], cue.gain * 1.2);
  return true;
}

export function resetAudioForTests(): void {
  ctx = null;
  master = null;
  noiseBuf = null;
  unlocked = false;
  enabled = true;
  volume = CONFIG.audio.defaultVolume;
}
