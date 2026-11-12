// Pure result-card content: a tier headline and a few stat chips. Star copy never contradicts the stars awarded.
import type { OverInfo } from './gameTypes';
import { STR } from './strings';

export function resultTier(info: OverInfo): string | null {
  if (info.mode === 'trick') {
    if (!info.won) return STR.tiers.retry;
    const s = info.stars ?? 1;
    return s >= 3 ? STR.tiers.perfect : s === 2 ? STR.tiers.nice : STR.tiers.solved;
  }
  if (info.mode === 'rack') {
    const r = info.rack ?? 1;
    return r >= 6 ? STR.tiers.hot : r >= 4 ? STR.tiers.sharp : r >= 2 ? STR.tiers.solid : STR.tiers.warm;
  }
  return null;
}

export function resultStats(info: OverInfo): { label: string; value: string }[] {
  if (info.mode === 'rack') {
    return [
      { label: STR.stat.score, value: String(info.score ?? 0) },
      { label: STR.stat.racks, value: String(info.rack ?? 1) },
      { label: STR.stat.pots, value: String(info.pots ?? 0) },
      { label: STR.stat.shots, value: String(info.shotsTaken ?? 0) },
      { label: STR.stat.combo, value: `x${info.bestCombo ?? 0}` },
    ];
  }
  if (info.mode === 'trick') {
    return [
      { label: STR.stat.shots, value: String(info.shots ?? 0) },
      { label: STR.stat.par, value: String(info.par ?? 0) },
    ];
  }
  return [];
}
