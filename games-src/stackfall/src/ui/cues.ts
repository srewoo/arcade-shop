// One-shot live cues derived from game state each frame: danger, Ultra countdown, new best.
import { feel } from '../config/feel';
import type { GameState } from '../core/state';
import { liveBest } from '../records';
import { isDanger, secondsLeft } from './view';

export type LiveCue = 'warn' | 'tick' | 'newBest';

export class LiveCues {
  private danger = false;
  private lastSecond = Infinity;
  private bestFired = false;

  reset(): void {
    this.danger = false;
    this.lastSecond = Infinity;
    this.bestFired = false;
  }

  /** Cues to fire now. `record` is the stored best for this mode before the run. */
  update(s: GameState, record: number | null): LiveCue[] {
    if (s.status !== 'playing') return [];
    const out: LiveCue[] = [];
    const danger = isDanger(s.board);
    if (danger && !this.danger) out.push('warn');
    this.danger = danger;
    const left = secondsLeft(s);
    if (left !== null && left > 0 && left <= feel.ultraWarnSeconds) {
      const whole = Math.ceil(left);
      if (whole < this.lastSecond) out.push('tick');
      this.lastSecond = whole;
    }
    if (!this.bestFired && liveBest(s.rules.id, record, s.score).passed) {
      this.bestFired = true;
      out.push('newBest');
    }
    return out;
  }
}
