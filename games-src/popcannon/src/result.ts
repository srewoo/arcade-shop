// Builds the result-sheet content for a finished run. Pure: no DOM.
import { Result } from './screens';
import { Game, shotsLeft } from './state';
import { S } from './strings';

export function resultTitle(g: Game): string {
  if (g.status === 'won') return S.result.cleared(g.stars);
  if (g.status === 'finished') return S.result.timesUp;
  return g.mode === 'puzzle' && shotsLeft(g) <= 0 && g.loseRow < 0 ? S.result.outOfShots : S.result.gameOver;
}

export function resultLines(g: Game): string[] {
  const lines = [S.result.combo(g.bestCombo), S.result.shots(g.shots, g.hits)];
  if (g.mode === 'arcade' || g.mode === 'daily') lines.push(S.result.level(g.level));
  if (g.status === 'lost' && g.loseRow >= 0) lines.push(S.result.lostBy);
  if (g.status === 'won') lines.push(g.stars >= 3 ? S.result.perfect : S.result.threeStars(g.par));
  return lines;
}

export interface Stat { label: string; value: string }

export const accuracyPct = (shots: number, hits: number): number => (shots > 0 ? Math.round((hits / shots) * 100) : 0);

/** Secondary stats for the 2x2 grid. Level only appears once it means something (level 2+). */
export function resultStats(g: Game): Stat[] {
  const stats: Stat[] = [
    { label: S.statLabels.combo, value: `x${g.bestCombo}` },
    { label: S.statLabels.accuracy, value: `${accuracyPct(g.shots, g.hits)}%` },
    { label: S.statLabels.shots, value: String(g.shots) },
  ];
  if ((g.mode === 'arcade' || g.mode === 'daily') && g.level > 1) stats.push({ label: S.statLabels.level, value: String(g.level) });
  return stats;
}

/** One-line cause of the end, shown under the stats. */
export function resultNote(g: Game): string | undefined {
  if (g.status === 'lost' && g.loseRow >= 0) return S.result.lostBy;
  if (g.status === 'won') return g.stars >= 3 ? S.result.perfect : S.result.threeStars(g.par);
  return undefined;
}

export function buildResult(g: Game, best: boolean, retry: () => void, next?: Result['next']): Result {
  const r: Result = {
    title: resultTitle(g),
    lines: resultLines(g),
    stats: resultStats(g),
    score: { value: g.score, best },
    retry,
  };
  const note = resultNote(g);
  if (note) r.note = note;
  if (g.status === 'won') r.stars = g.stars;
  if (next) r.next = next;
  return r;
}
