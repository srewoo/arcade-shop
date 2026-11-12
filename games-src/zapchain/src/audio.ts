// Tiny synthesised sound effects (no audio files). Every cue goes through one master gain +
// compressor. The AudioContext is created on the first user gesture (browsers require it) and
// cues are dropped while the tab is hidden. Rapid repeats of one cue are throttled.
import { CONFIG } from './config';
import { CUES, type CueOpts, type Sfx } from './audioCues';

export type { Sfx, CueOpts } from './audioCues';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let unlocked = false;
let enabled = true;
let volume: number = CONFIG.audio.defaultVolume;
const lastPlayed = new Map<Sfx, number>();
const MIN_GAP_SEC = 0.035;

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

/** Unlock on the first pointer or key press anywhere on the page. */
export function installAudioUnlock(target: Document = document): void {
  const once = (): void => {
    unlockAudio();
    target.removeEventListener('pointerdown', once, true);
    target.removeEventListener('keydown', once, true);
  };
  target.addEventListener('pointerdown', once, true);
  target.addEventListener('keydown', once, true);
}

function noise(ac: AudioContext, out: AudioNode, start: number, n: { dur: number; from: number; to: number; gain: number }): void {
  noiseBuf ??= (() => {
    const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();
  const src = ac.createBufferSource();
  const filt = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = noiseBuf;
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(n.from, start);
  filt.frequency.exponentialRampToValueAtTime(Math.max(20, n.to), start + n.dur);
  gain.gain.setValueAtTime(n.gain, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
  src.connect(filt).connect(gain).connect(out);
  src.start(start);
  src.stop(start + n.dur + 0.02);
}

/** Play a cue after `delay` seconds. Returns false when it was not played. */
export function emit(name: Sfx, opts: CueOpts = {}): boolean {
  if (!enabled || volume === 0 || !unlocked || !ctx || !master) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (ctx.state === 'suspended') void ctx.resume();
  const cue = CUES[name];
  const start = ctx.currentTime + (opts.delay ?? 0);
  if (start - (lastPlayed.get(name) ?? -1) < MIN_GAP_SEC) return false;
  lastPlayed.set(name, start);
  const ratio = 2 ** ((opts.step ?? 0) / 12);
  for (const [freq, at, dur] of cue.notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = cue.wave;
    osc.frequency.value = freq * ratio;
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(cue.gain, start + at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + dur);
    osc.connect(gain).connect(master);
    osc.start(start + at);
    osc.stop(start + at + dur + 0.02);
  }
  if (cue.noise) noise(ctx, master, start, cue.noise);
  return true;
}

/** Test hook: forget the context and gesture state. */
export function resetAudioForTests(): void {
  ctx = null;
  master = null;
  noiseBuf = null;
  unlocked = false;
  enabled = true;
  volume = CONFIG.audio.defaultVolume as number;
  lastPlayed.clear();
}
