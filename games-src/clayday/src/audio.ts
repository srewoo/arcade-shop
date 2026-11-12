// Synthesised sound effects (no audio files). One master gain + compressor.
// The AudioContext is created on the first user gesture; cues are dropped
// while the tab is hidden.
import { CONFIG } from './config';
import { CUES, type Sfx } from './audioCues';

export type { Sfx } from './audioCues';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
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
    const len = Math.floor(ac.sampleRate * 0.4);
    noise = ac.createBuffer(1, len, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
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

function playSegment(ac: AudioContext, out: GainNode, seg: (typeof CUES)[Sfx][number], start: number): void {
  const gain = ac.createGain();
  const t0 = start + seg.at;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(seg.gain, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seg.dur);
  let src: AudioScheduledSourceNode;
  if (seg.kind === 'osc') {
    const osc = ac.createOscillator();
    osc.type = seg.wave ?? 'triangle';
    osc.frequency.setValueAtTime(seg.f0 ?? 440, t0);
    if (seg.f1) osc.frequency.exponentialRampToValueAtTime(seg.f1, t0 + seg.dur);
    osc.connect(gain);
    src = osc;
  } else {
    const n = ac.createBufferSource();
    n.buffer = noise;
    const filter = ac.createBiquadFilter();
    filter.type = seg.hp ? 'highpass' : 'lowpass';
    filter.frequency.value = seg.hp ?? seg.lp ?? 4000;
    n.connect(filter).connect(gain);
    src = n;
  }
  gain.connect(out);
  src.start(t0);
  src.stop(t0 + seg.dur + 0.03);
}

/** Play a cue after `delay` seconds. Returns false when it was not played. */
export function emit(name: Sfx, delay = 0): boolean {
  if (!enabled || volume === 0 || !unlocked || !ctx || !master) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (ctx.state === 'suspended') void ctx.resume();
  const start = ctx.currentTime + delay;
  for (const seg of CUES[name]) playSegment(ctx, master, seg, start);
  return true;
}

/** Test hook: forget the context and gesture state. */
export function resetAudioForTests(): void {
  ctx = null;
  master = null;
  noise = null;
  unlocked = false;
  enabled = true;
  volume = CONFIG.audio.defaultVolume;
}
