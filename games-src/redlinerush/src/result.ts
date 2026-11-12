// Pure result-card rules: score tier, one improvement tip and the count-up curve.
import { CONFIG } from './config';
import type { Outcome } from './simTypes';
import { TIPS } from './strings';

export type Tier = 'rookie' | 'street' | 'ace' | 'legend';

export function tierFor(score: number): Tier {
  const t = CONFIG.fx.tiers;
  if (score >= t.legend) return 'legend';
  if (score >= t.ace) return 'ace';
  if (score >= t.street) return 'street';
  return 'rookie';
}

export interface RunFacts { outcome: Outcome; nearMisses: number; crashes: number; maxCombo: number }

/** One concrete suggestion; the first matching rule wins. */
export function tipFor(f: RunFacts): string {
  if (f.nearMisses === 0) return TIPS.noSkim;
  if (f.outcome === 'fuel') return TIPS.fuel;
  if (f.outcome === 'time') return TIPS.time;
  if (f.outcome === 'finish') return TIPS.finish;
  if (f.crashes >= 3 && f.maxCombo < 3) return TIPS.crashes;
  return TIPS.chain;
}

/** Ease-out count-up value at progress t (0..1). */
export const countValue = (to: number, t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return Math.round(to * (1 - (1 - k) ** 3));
};
