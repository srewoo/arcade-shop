// Pure sound design: which voices each game event plays. No Web Audio here, so it is unit-testable.
import { GameEvent } from './state';

export interface Voice {
  kind: 'tone' | 'noise';
  /** Start frequency (tone) or low-pass cutoff (noise). */
  freq: number;
  /** Frequency the tone slides to. */
  to?: number;
  dur: number;
  type?: OscillatorType;
  vol: number;
  delay?: number;
}

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
export const note = (base: number, semis: number): number => base * 2 ** (semis / 12);
const tone = (freq: number, dur: number, type: OscillatorType, vol: number, to = freq, delay = 0): Voice =>
  ({ kind: 'tone', freq, dur, type, vol, to, delay });
const noise = (dur: number, vol: number, cutoff: number): Voice => ({ kind: 'noise', freq: cutoff, dur, vol });
const arp = (base: number, semis: number[], dur: number, type: OscillatorType, vol: number, gap: number): Voice[] =>
  semis.map((s, i) => tone(note(base, s), dur, type, vol, note(base, s), i * gap));

/** Pop pitch climbs two semitones per combo step (capped at an octave). */
export const comboSemis = (combo: number): number => Math.min(12, 2 * Math.max(0, combo - 1));

function popVoices(n: number, combo: number): Voice[] {
  const lift = comboSemis(combo);
  return Array.from({ length: Math.max(1, Math.min(4, n - 2)) }, (_, i) =>
    tone(note(440, (SCALE[i] ?? 0) + lift), 0.12, 'sine', 0.16, note(440, (SCALE[i] ?? 0) + lift + 7), i * 0.05));
}

/** Voices for one event; an unknown event plays nothing. */
export function soundPlan(e: GameEvent): Voice[] {
  switch (e.type) {
    case 'fire': return [tone(320, 0.12, 'triangle', 0.18, 760)];
    case 'swap': return [tone(520, 0.06, 'square', 0.07, 680)];
    case 'stick': return [tone(150, 0.1, 'sine', 0.22, 90)];
    case 'pop': return popVoices(e.n, e.combo ?? 1);
    case 'bomb': return [noise(0.4, 0.38, 900), tone(110, 0.35, 'sawtooth', 0.2, 40)];
    case 'fall': return [tone(700, 0.35, 'sine', 0.12, 180)];
    case 'ceiling': return [tone(90, 0.25, 'square', 0.15, 60)];
    case 'warn': return [tone(260, 0.07, 'square', 0.07, 260), tone(260, 0.07, 'square', 0.07, 260, 0.11)];
    case 'danger': return [tone(180, 0.18, 'sawtooth', 0.1, 140), tone(180, 0.18, 'sawtooth', 0.1, 140, 0.24)];
    case 'tick': return [tone(e.n <= 3 ? 1040 : 880, 0.05, 'square', 0.06)];
    case 'ui': return [tone(620, 0.05, 'triangle', 0.08, 760)];
    case 'start': return arp(392, [0, 7], 0.12, 'triangle', 0.13, 0.08);
    case 'pause': return arp(523, [0, -5], 0.09, 'triangle', 0.1, 0.07);
    case 'resume': return arp(523, [-5, 0], 0.09, 'triangle', 0.1, 0.07);
    case 'locked': return [tone(110, 0.14, 'square', 0.08, 90)];
    case 'best': return arp(523, [0, 4, 7, 12, 7, 12], 0.16, 'triangle', 0.15, 0.08);
    case 'star': return [tone(note(660, 2 * Math.max(0, e.n - 1)), 0.22, 'triangle', 0.15), tone(note(1320, 2 * Math.max(0, e.n - 1)), 0.18, 'sine', 0.06, undefined, 0.02)];
    case 'levelup': return arp(523, [0, 4, 7, 12], 0.25, 'triangle', 0.16, 0.09);
    case 'win': return arp(523, [0, 4, 7, 12, 16], 0.35, 'triangle', 0.17, 0.1);
    case 'finish': return arp(392, [12, 7, 4, 0], 0.3, 'triangle', 0.15, 0.1);
    case 'lose': return [0, -3, -7, -12].map((s, i) => tone(note(330, s), 0.35, 'sawtooth', 0.1, note(330, s - 1), i * 0.14));
  }
}
