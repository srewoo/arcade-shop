// One-shot synthesised voices. Each takes the live audio graph and a `muted` guard is applied by the caller.
// No audio files: oscillators and filtered noise only.

export interface Graph {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  readonly noise: AudioBuffer;
}

export type Jingle = 'strike' | 'spare' | 'turkey' | 'gutter' | 'over';
export type UiCue = 'tap' | 'open' | 'close' | 'pop';

const JINGLES: Record<Jingle, readonly (readonly [freq: number, at: number, dur: number])[]> = {
  strike: [[523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.1], [1047, 0.27, 0.34]],
  spare: [[587, 0, 0.1], [740, 0.1, 0.1], [880, 0.2, 0.26]],
  turkey: [[392, 0, 0.1], [523, 0.1, 0.1], [659, 0.2, 0.1], [784, 0.3, 0.1], [1047, 0.4, 0.5]],
  gutter: [[196, 0, 0.16], [165, 0.16, 0.16], [131, 0.32, 0.3]],
  over: [[523, 0, 0.14], [494, 0.16, 0.14], [440, 0.32, 0.14], [523, 0.5, 0.4]],
};

/** Jingle voice level (was 0.16): the square waves used to stand out against the soft rumble. */
export const JINGLE_GAIN = 0.1;
/** Meter-lock blip pitches (Hz): one per lock, rising. */
export const TICK_FREQS: readonly number[] = [880, 988, 1109, 1319];
const UI_FREQS: Record<UiCue, readonly [number, number]> = { tap: [660, 0.05], open: [520, 0.07], close: [400, 0.07], pop: [990, 0.09] };

function blip(g: Graph, type: OscillatorType, freq: number, at: number, dur: number, peak: number): void {
  const osc = g.ctx.createOscillator();
  const gain = g.ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(g.master);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function playJingle(g: Graph, name: Jingle): void {
  const now = g.ctx.currentTime;
  const type: OscillatorType = name === 'gutter' ? 'sawtooth' : name === 'spare' ? 'triangle' : 'square';
  for (const [freq, at, dur] of JINGLES[name]) blip(g, type, freq, now + at, dur, JINGLE_GAIN);
}

/** Pin crash: a filtered noise burst plus a wooden tock. */
export function playClatter(g: Graph, strength: number): void {
  const now = g.ctx.currentTime;
  const vol = Math.min(1, 0.15 + strength / 900);
  const src = g.ctx.createBufferSource();
  src.buffer = g.noise;
  const bp = g.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1200 + Math.random() * 2400;
  bp.Q.value = 1.5;
  const gain = g.ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.9, now);
  gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.12);
  src.connect(bp).connect(gain).connect(g.master);
  src.start(now, Math.random());
  src.stop(now + 0.14);
  const osc = g.ctx.createOscillator();
  const og = g.ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(380 + Math.random() * 500, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
  og.gain.setValueAtTime(vol * 0.5, now);
  og.gain.exponentialRampToValueAtTime(0.0005, now + 0.1);
  osc.connect(og).connect(g.master);
  osc.start(now);
  osc.stop(now + 0.12);
}

export const tickFreq = (step: number): number => TICK_FREQS[Math.max(0, Math.min(TICK_FREQS.length - 1, Math.floor(step)))] as number;

/** Meter lock: short blip, higher for each successive lock. */
export function playTick(g: Graph, step: number): void {
  blip(g, 'square', tickFreq(step), g.ctx.currentTime, 0.07, 0.07);
}

/** Ball release: a low thud plus a click. */
export function playRelease(g: Graph): void {
  const now = g.ctx.currentTime;
  const osc = g.ctx.createOscillator();
  const gain = g.ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.2);
  osc.connect(gain).connect(g.master);
  osc.start(now);
  osc.stop(now + 0.22);
  blip(g, 'square', 1800, now, 0.025, 0.05);
}

export function playUi(g: Graph, cue: UiCue): void {
  const [freq, dur] = UI_FREQS[cue];
  blip(g, 'triangle', freq, g.ctx.currentTime, dur, 0.09);
}

/** Strike crowd: a 0.6 s swell of band-passed noise. */
export function playCrowd(g: Graph): void {
  const now = g.ctx.currentTime;
  const src = g.ctx.createBufferSource();
  src.buffer = g.noise;
  const bp = g.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900;
  bp.Q.value = 0.7;
  const gain = g.ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.18);
  gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.6);
  src.connect(bp).connect(gain).connect(g.master);
  src.start(now, Math.random());
  src.stop(now + 0.65);
}
