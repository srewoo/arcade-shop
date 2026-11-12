// Synthesised WebAudio feedback (no audio files). The context is created on the first user
// gesture, as browsers require. Every cue goes through one master gain and a limiter.
import { CUES, MASTER_GAIN, PEAK_CEILING, type Sfx } from './config/audio';

export type { Sfx } from './config/audio';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Worst-case summed amplitude of a cue (notes overlapping in time), before the master gain. */
export function cuePeak(name: Sfx): number {
  const { notes, gain } = CUES[name];
  let worst = 0;
  for (const [, at] of notes) {
    const overlapping = notes.filter(([, a, d]) => a <= at && at < a + d).length;
    worst = Math.max(worst, overlapping * gain);
  }
  return worst;
}

/** Peak after the master gain at a given volume (0-1); the test keeps this under PEAK_CEILING. */
export const peakAtVolume = (name: Sfx, volume: number): number => cuePeak(name) * MASTER_GAIN * Math.max(0, Math.min(1, volume));

function graph(): { ac: AudioContext; out: GainNode } | null {
  if (ctx && master) return { ac: ctx, out: master };
  try {
    ctx = new AudioContext();
    master = ctx.createGain();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    master.connect(limiter).connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
    return null;
  }
  return { ac: ctx, out: master };
}

/** Plays a cue. `volume` is 0-1 (the Settings slider); `enabled` is the mute switch. */
export function playSfx(name: Sfx, enabled: boolean, volume = 1): void {
  if (!enabled || volume <= 0) return;
  const g = graph();
  if (!g) return;
  const { ac, out } = g;
  if (ac.state === 'suspended') void ac.resume();
  out.gain.value = MASTER_GAIN * Math.min(1, volume);
  const cue = CUES[name];
  const now = ac.currentTime;
  for (const [freq, at, dur] of cue.notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = cue.wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(cue.gain, now + at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
    osc.connect(gain).connect(out);
    osc.start(now + at);
    osc.stop(now + at + dur + 0.02);
  }
}

export { PEAK_CEILING };
