// WebAudio synthesis. One master gain + compressor. The AudioContext is created
// on the first user gesture; cues are dropped while the tab is hidden or muted.
import { CONFIG } from './config';
import { CUES, type Sfx, type Voice } from './audioCues';

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

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const data = buf.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
  noiseBuf = buf;
  return buf;
}

function playVoice(ac: AudioContext, out: AudioNode, v: Voice, start: number, pitch: number): void {
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(v.gain, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + v.dur);
  let src: AudioScheduledSourceNode;
  if (v.kind === 'tone') {
    const osc = ac.createOscillator();
    osc.type = v.wave ?? 'sine';
    osc.frequency.setValueAtTime(v.f0 * pitch, start);
    osc.frequency.linearRampToValueAtTime((v.f1 ?? v.f0) * pitch, start + v.dur);
    src = osc;
  } else {
    const n = ac.createBufferSource();
    n.buffer = noiseBuffer(ac);
    n.loop = true;
    src = n;
  }
  const lp = v.kind === 'noise' ? v.f0 : v.lp;
  if (lp) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    src.connect(f);
    f.connect(gain);
  } else src.connect(gain);
  gain.connect(out);
  src.start(start);
  src.stop(start + v.dur + 0.03);
}

/** Play a cue after `delay` seconds; `pitch` varies repeats (cat yowls). Returns false when dropped. */
export function emit(name: Sfx, delay = 0, pitch = 1): boolean {
  if (!enabled || volume === 0 || !unlocked || !ctx || !master) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (ctx.state === 'suspended') void ctx.resume();
  const start = ctx.currentTime + delay;
  for (const v of CUES[name]) playVoice(ctx, master, v, start + v.at, pitch);
  return true;
}

export function resetAudioForTests(): void {
  ctx = null; master = null; noiseBuf = null; unlocked = false; enabled = true; volume = CONFIG.audio.defaultVolume;
}
