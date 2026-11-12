// Deterministic gust schedule: calm gaps alternate with smooth gusts of random strength/direction.
import { CONFIG } from './config';
import type { Rng } from './rng';

export interface Gust { readonly start: number; readonly end: number; readonly force: number }

export class Wind {
  private gusts: Gust[] = [];
  private horizon = 0;
  constructor(private readonly rng: Rng, private readonly enabled: boolean) {}

  private extend(until: number): void {
    const w = CONFIG.wind;
    while (this.horizon < until) {
      const start = this.horizon + this.rng.range(w.calmMin, w.calmMax);
      const end = start + this.rng.range(w.gustMin, w.gustMax);
      const dir = this.rng.chance(0.5) ? 1 : -1;
      this.gusts.push({ start, end, force: dir * this.rng.range(w.forceMin, w.forceMax) });
      this.horizon = end;
    }
  }

  /** Horizontal acceleration (px/s^2) at play time `t`. */
  at(t: number): number {
    if (!this.enabled) return 0;
    this.extend(t + 10);
    for (const g of this.gusts) {
      if (t < g.start) break;
      if (t <= g.end) return g.force * envelope(t, g);
    }
    return 0;
  }

  /** Seconds until the next gust begins (0 while one is blowing); used for the pre-gust cue. */
  untilNext(t: number): number {
    if (!this.enabled) return Infinity;
    this.extend(t + 10);
    const g = this.gusts.find((x) => x.end >= t);
    return g ? Math.max(0, g.start - t) : Infinity;
  }
}

/** 0..1 sine-ish ramp in and out so a gust never snaps on. */
export function envelope(t: number, g: Gust): number {
  const rise = Math.min(CONFIG.wind.rise, (g.end - g.start) / 2);
  const k = Math.max(0, Math.min((t - g.start) / rise, (g.end - t) / rise, 1));
  return k * k * (3 - 2 * k);
}
