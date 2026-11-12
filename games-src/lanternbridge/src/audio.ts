// Synthesised sound effects (no audio files). One master gain + compressor; the
// AudioContext is created on the first user gesture; cues drop while hidden.
import { CONFIG } from './config';
import { CUES, type Sfx } from './audioCues';

export type { Sfx } from './audioCues';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
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

/** Play a cue after `delay` seconds. Returns false when it was not played. */
export function emit(name: Sfx, delay = 0): boolean {
  if (!enabled || volume === 0 || !unlocked || !ctx || !master) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (ctx.state === 'suspended') void ctx.resume();
  const start = ctx.currentTime + delay;
  for (const tone of CUES[name]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.f, start + tone.t);
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, start + tone.t + tone.d);
    gain.gain.setValueAtTime(0.0001, start + tone.t);
    gain.gain.exponentialRampToValueAtTime(tone.g, start + tone.t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.t + tone.d);
    osc.connect(gain).connect(master);
    osc.start(start + tone.t);
    osc.stop(start + tone.t + tone.d + 0.02);
  }
  return true;
}
