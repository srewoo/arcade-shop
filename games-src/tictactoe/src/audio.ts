// Tiny synthesised sound effects (no audio files). Every cue goes through one
// master gain + compressor. The AudioContext is created on the first user
// gesture (browsers require it) and cues are dropped while the tab is hidden.
import { CONFIG } from './config';
import { CUES, type Sfx } from './audioCues';

export type { Sfx } from './audioCues';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;
let enabled = true;
let volume = CONFIG.audio.defaultVolume;

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

/** Play a cue after `delay` seconds. Returns false when it was not played. */
export function emit(name: Sfx, delay = 0): boolean {
  if (!enabled || volume === 0 || !unlocked || !ctx || !master) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (ctx.state === 'suspended') void ctx.resume();
  const cue = CUES[name];
  const start = ctx.currentTime + delay;
  for (const [freq, at, dur] of cue.notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = cue.wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(cue.gain, start + at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + dur);
    osc.connect(gain).connect(master);
    osc.start(start + at);
    osc.stop(start + at + dur + 0.02);
  }
  return true;
}

/** Test hook: forget the context and gesture state. */
export function resetAudioForTests(): void {
  ctx = null;
  master = null;
  unlocked = false;
  enabled = true;
  volume = CONFIG.audio.defaultVolume;
}
