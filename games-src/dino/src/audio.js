// Fully procedural WebAudio sound effects (bundle class `Wm`): no audio files.  Every effect is built from
// short oscillator "tones" with exponential pitch/gain ramps and low-passed noise bursts (see audioCore.js for the
// plumbing: master gain, limiter, polyphony cap, queue, ambience bed).
import { AudioCore } from './audioCore.js';

export class AudioFx extends AudioCore {
  /** Footstep; side -1 (left) is slightly duller than right. */
  step(side) {
    this._noise({ dur: 0.07, gain: 0.16, freq: side < 0 ? 300 : 380 });
  }
  jump() {
    this._tone({ type: 'triangle', f0: 260, f1: 640, dur: 0.17, gain: 0.22 });
  }
  land() {
    this._noise({ dur: 0.12, gain: 0.32, freq: 240 });
    this._tone({ f0: 110, f1: 55, dur: 0.12, gain: 0.25 });
  }
  duck() {
    this._tone({ type: 'triangle', f0: 320, f1: 150, dur: 0.09, gain: 0.12 });
  }
  /** Every 100 points. */
  milestone() {
    this._tone({ type: 'square', f0: 880, dur: 0.07, gain: 0.07 });
    this._tone({ type: 'square', f0: 1320, dur: 0.14, gain: 0.07, delay: 0.08 });
  }
  crash() {
    this._noise({ dur: 0.3, gain: 0.6, freq: 700, priority: true });
    this._tone({ f0: 170, f1: 38, dur: 0.34, gain: 0.6, priority: true });
    this._tone({ type: 'square', f0: 420, f1: 300, dur: 0.06, gain: 0.12 });
    this._tone({ f0: 1150, f1: 190, dur: 0.95, gain: 0.11, delay: 0.12 }); // "cartoon" falling whistle
  }
  /** Ragdoll impact, strength 0..1. */
  thud(strength) {
    this._noise({ dur: 0.14, gain: 0.12 + 0.4 * strength, freq: 220 + 300 * strength });
    this._tone({ f0: 100 + 40 * strength, f1: 45, dur: 0.14, gain: 0.1 + 0.35 * strength });
  }
  /** Descending 4-note sting: E4 D4 C4 G3 (330, 294, 262, 196 Hz). */
  gameOver() {
    [330, 294, 262, 196].forEach((freq, i) => {
      this._tone({ type: 'triangle', f0: freq, f1: freq * (i === 3 ? 0.7 : 0.97), dur: i === 3 ? 0.5 : 0.2, gain: 0.16, delay: i * 0.2, priority: true });
    });
  }
  /** Power-up collected: rising two-note chime. */
  pickup() {
    this._tone({ type: 'triangle', f0: 660, dur: 0.08, gain: 0.14 });
    this._tone({ type: 'triangle', f0: 990, f1: 1320, dur: 0.18, gain: 0.14, delay: 0.07 });
  }
  /** Shield absorbed a hit. */
  shieldBreak() {
    this._noise({ dur: 0.22, gain: 0.35, freq: 2400 });
    this._tone({ type: 'square', f0: 900, f1: 220, dur: 0.2, gain: 0.1 });
  }
  /** Second jump in mid-air. */
  airJump() {
    this._tone({ type: 'triangle', f0: 420, f1: 980, dur: 0.15, gain: 0.2 });
  }
  /** Meteor lands. */
  meteor() {
    this._noise({ dur: 0.4, gain: 0.5, freq: 500 });
    this._tone({ f0: 120, f1: 36, dur: 0.4, gain: 0.5 });
  }
  /** Distant thunder: long low rumble. */
  thunder() {
    this._noise({ dur: 2.4, gain: 0.55, freq: 150 });
    this._tone({ f0: 62, f1: 28, dur: 2, gain: 0.3 });
    this._noise({ dur: 1.4, gain: 0.3, freq: 90, delay: 0.5 });
  }

  /** UI feedback: 'tick' (move / select), 'confirm' (primary action), 'back' (close / cancel), 'toggle'. */
  ui(kind = 'tick') {
    if (kind === 'confirm') {
      this._tone({ type: 'triangle', f0: 520, f1: 780, dur: 0.1, gain: 0.1 });
      this._tone({ type: 'triangle', f0: 780, f1: 1040, dur: 0.12, gain: 0.08, delay: 0.06 });
    } else if (kind === 'back') this._tone({ type: 'triangle', f0: 420, f1: 260, dur: 0.1, gain: 0.1 });
    else if (kind === 'toggle') this._tone({ type: 'square', f0: 700, f1: 760, dur: 0.05, gain: 0.05 });
    else this._tone({ type: 'triangle', f0: 600, f1: 640, dur: 0.045, gain: 0.08 });
  }
  /** New personal best: rising three-note arpeggio (C5 E5 G5, then a high C). */
  newBest() {
    [523, 659, 784, 1047].forEach((f, i) => this._tone({ type: 'triangle', f0: f, dur: i === 3 ? 0.4 : 0.14, gain: 0.15, delay: i * 0.11, priority: true }));
  }
  /** Power-up about to expire, and Time Attack's last seconds. */
  warn() {
    this._tone({ type: 'square', f0: 980, dur: 0.06, gain: 0.07 });
    this._tone({ type: 'square', f0: 980, dur: 0.06, gain: 0.07, delay: 0.1 });
  }
  /** Time Attack countdown tick (pitch rises as the clock empties via `urgency` 0..1). */
  tick(urgency = 0) {
    this._tone({ type: 'square', f0: 760 + 420 * urgency, dur: 0.05, gain: 0.07 });
  }
  /** Time Attack time up: two hard falling notes (distinct from the crash game-over sting). */
  timeUp() {
    [880, 660, 440].forEach((f, i) => this._tone({ type: 'square', f0: f, f1: f * 0.96, dur: 0.16, gain: 0.1, delay: i * 0.14, priority: true }));
  }
  /** Slow-Mo on (time dilation dive) and off (rising release). */
  slowmo(on) {
    this._tone({ type: 'sine', f0: on ? 700 : 260, f1: on ? 180 : 700, dur: on ? 0.45 : 0.3, gain: 0.14 });
  }
  /** A power-up ran out. */
  powerEnd() {
    this._tone({ type: 'triangle', f0: 520, f1: 330, dur: 0.14, gain: 0.1 });
  }
  /** Zen: back on your feet after a stumble. */
  recover() {
    this._tone({ type: 'triangle', f0: 330, f1: 520, dur: 0.12, gain: 0.12 });
    this._tone({ type: 'triangle', f0: 520, f1: 660, dur: 0.12, gain: 0.1, delay: 0.09 });
  }
  /** Biome change: a soft two-voice pad swell. */
  biome() {
    this._tone({ type: 'sine', f0: 262, f1: 270, dur: 0.9, gain: 0.07 });
    this._tone({ type: 'sine', f0: 392, f1: 400, dur: 0.9, gain: 0.05, delay: 0.1 });
  }
}
