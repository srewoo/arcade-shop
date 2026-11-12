// Sound recipes. Each voice: [wave, startFreq, endFreq, startOffset, duration, gain]; wave 'n' is a band-passed noise burst
// (startFreq = filter centre). Everything is synthesised: no audio files.
export type Wave = OscillatorType | 'n';
export type Voice = readonly [Wave, number, number, number, number, number];
export interface Cue { voices: readonly Voice[]; /** Minimum seconds between plays, so floods do not stack. */ gap: number }

const pop = (f: number, g: number): readonly Voice[] => [['sine', f, f * 0.35, 0, 0.16, g], ['n', f * 3, f * 3, 0, 0.07, g * 0.6]];

export const CUES = {
  fire: { gap: 0.05, voices: [['sawtooth', 380, 900, 0, 0.13, 0.06], ['n', 2400, 2400, 0, 0.05, 0.04]] },
  pop0: { gap: 0.03, voices: pop(980, 0.2) },
  pop1: { gap: 0.03, voices: pop(780, 0.22) },
  pop2: { gap: 0.03, voices: pop(600, 0.25) },
  pop3: { gap: 0.03, voices: [...pop(430, 0.28), ['triangle', 215, 120, 0, 0.22, 0.18]] },
  bounce: { gap: 0.09, voices: [['sine', 150, 70, 0, 0.09, 0.08]] },
  block: { gap: 0.04, voices: [['square', 240, 110, 0, 0.07, 0.07], ['n', 900, 900, 0, 0.06, 0.07]] },
  blockBreak: { gap: 0.05, voices: [['square', 200, 60, 0, 0.16, 0.1], ['n', 700, 700, 0, 0.18, 0.12]] },
  drop: { gap: 0.1, voices: [['triangle', 660, 660, 0, 0.08, 0.1], ['triangle', 990, 990, 0.07, 0.1, 0.1]] },
  collect: { gap: 0.05, voices: [['triangle', 523, 523, 0, 0.09, 0.14], ['triangle', 659, 659, 0.07, 0.09, 0.14], ['triangle', 880, 880, 0.14, 0.16, 0.14]] },
  shieldBreak: { gap: 0.1, voices: [['sawtooth', 700, 150, 0, 0.3, 0.1], ['n', 1500, 1500, 0, 0.2, 0.12]] },
  hit: { gap: 0.2, voices: [['sawtooth', 420, 70, 0, 0.55, 0.16], ['square', 210, 50, 0, 0.5, 0.1], ['n', 500, 500, 0, 0.25, 0.14]] },
  clear: { gap: 0.5, voices: [['triangle', 523, 523, 0, 0.16, 0.16], ['triangle', 659, 659, 0.12, 0.16, 0.16], ['triangle', 784, 784, 0.24, 0.16, 0.16], ['triangle', 1046, 1046, 0.36, 0.4, 0.18]] },
  timeout: { gap: 0.5, voices: [['sine', 440, 220, 0, 0.5, 0.16], ['sine', 330, 165, 0.25, 0.6, 0.14]] },
  warn: { gap: 0.3, voices: [['square', 880, 880, 0, 0.05, 0.05]] },
  ready: { gap: 0.3, voices: [['sine', 392, 392, 0, 0.1, 0.12], ['sine', 587, 587, 0.1, 0.16, 0.12]] },
  over: { gap: 0.5, voices: [['triangle', 392, 392, 0, 0.22, 0.14], ['triangle', 330, 330, 0.2, 0.22, 0.14], ['triangle', 262, 262, 0.4, 0.5, 0.14]] },
  best: { gap: 0.5, voices: [['triangle', 659, 659, 0, 0.12, 0.14], ['triangle', 784, 784, 0.1, 0.12, 0.14], ['triangle', 1046, 1046, 0.2, 0.3, 0.16]] },
  extraLife: { gap: 0.5, voices: [['sine', 784, 784, 0, 0.1, 0.14], ['sine', 988, 988, 0.1, 0.1, 0.14], ['sine', 1319, 1319, 0.2, 0.3, 0.14]] },
} as const satisfies Record<string, Cue>;

export type Sfx = keyof typeof CUES;
