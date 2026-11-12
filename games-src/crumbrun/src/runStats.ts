// Run-wide bookkeeping that outlives a single level's World: banked stats and the final result.
import type { Stats } from './world';

/** What a finished (or abandoned) run looked like, for the game-over panel and the top-5 table. */
export interface RunResult {
  readonly score: number;
  readonly level: number;
  readonly splashes: number;
  readonly bestChain: number;
  readonly newHigh: boolean;
  /** True when the player quit or restarted instead of running out of lives. */
  readonly abandoned: boolean;
}

export class RunTracker {
  private banked = { splashes: 0, bestChain: 0 };
  private hiAtStart = 0;

  start(hi: number): void {
    this.banked = { splashes: 0, bestChain: 0 };
    this.hiAtStart = hi;
  }

  /** Called when a level is left behind: its stats join the run total. */
  bank(s: Pick<Stats, 'splashes' | 'bestChain'>): void {
    this.banked = { splashes: this.banked.splashes + s.splashes, bestChain: Math.max(this.banked.bestChain, s.bestChain) };
  }

  totals(live: Pick<Stats, 'splashes' | 'bestChain'>): { splashes: number; bestChain: number } {
    return { splashes: this.banked.splashes + live.splashes, bestChain: Math.max(this.banked.bestChain, live.bestChain) };
  }

  result(score: number, level: number, live: Pick<Stats, 'splashes' | 'bestChain'>, abandoned: boolean): RunResult {
    const t = this.totals(live);
    return { score, level, splashes: t.splashes, bestChain: t.bestChain, newHigh: score > 0 && score > this.hiAtStart, abandoned };
  }
}
