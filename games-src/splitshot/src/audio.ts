// Synthesised sound effects (no audio files). Every cue goes through one master gain + compressor.
// The AudioContext is created on the first user gesture and cues are dropped while the tab is hidden.
import { CONFIG } from './config';
import { CUES, type Sfx } from './audioCues';

export type { Sfx } from './audioCues';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let unlocked = false;
let enabled = true;
let volume: number = CONFIG.audio.defaultVolume;
const lastAt = new Map<Sfx, number>();

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
    const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.4), ac.sampleRate);
    const data = buf.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < data.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; data[i] = s / 2147483648 - 1; }
    noise = buf;
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

function voice(ac: AudioContext, out: AudioNode, v: readonly [string, number, number, number, number, number], start: number): void {
  const [wave, f0, f1, at, dur, gain] = v;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, start + at);
  g.gain.exponentialRampToValueAtTime(gain, start + at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + at + dur);
  let src: AudioScheduledSourceNode;
  if (wave === 'n' && noise) {
    const n = ac.createBufferSource();
    n.buffer = noise;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = f0; bp.Q.value = 0.9;
    n.connect(bp).connect(g);
    src = n;
  } else {
    const o = ac.createOscillator();
    o.type = wave as OscillatorType;
    o.frequency.setValueAtTime(f0, start + at);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), start + at + dur);
    o.connect(g);
    src = o;
  }
  g.connect(out);
  src.start(start + at);
  src.stop(start + at + dur + 0.03);
}

/** Play a cue after `delay` seconds. Returns false when it was not played. */
export function emit(name: Sfx, delay = 0): boolean {
  if (!enabled || volume === 0 || !unlocked || !ctx || !master) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (ctx.state === 'suspended') void ctx.resume();
  const cue = CUES[name];
  const now = ctx.currentTime;
  if (now - (lastAt.get(name) ?? -9) < cue.gap) return false;
  lastAt.set(name, now);
  for (const v of cue.voices) voice(ctx, master, v, now + delay);
  return true;
}

/** Test hook: forget the context and gesture state. */
export function resetAudioForTests(): void {
  ctx = null; master = null; noise = null; unlocked = false; enabled = true;
  volume = CONFIG.audio.defaultVolume as number;
  lastAt.clear();
}
