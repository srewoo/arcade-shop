// Pure round-result bookkeeping: scoreboard, streak and milestone.
import type { GameState } from './game';
import { bumpScore, isMilestone, nextStats, type Outcome, type Scores, type Stats } from './scores';
import type { Settings } from './settings';

export interface RoundResult {
  readonly scores: Scores;
  readonly stats: Stats;
  readonly outcome: Outcome;
  /** Set when a human win just reached a streak milestone. */
  readonly milestone: number | null;
}

/** Outcome from the human's side (X) against the CPU; from X's side in 2 Players. */
export function outcomeFor(s: GameState): Outcome {
  if (s.winner === 'X') return 'win';
  return s.winner === 'O' ? 'loss' : 'draw';
}

export function recordResult(
  scores: Scores, stats: Stats, s: GameState, opponent: Settings['opponent'],
): RoundResult {
  const outcome = outcomeFor(s);
  const nextScores = bumpScore(scores, s.winner ?? 'draw');
  if (opponent !== 'cpu') return { scores: nextScores, stats, outcome, milestone: null };
  const nextStat = nextStats(stats, outcome);
  const milestone = outcome === 'win' && isMilestone(nextStat.streak) ? nextStat.streak : null;
  return { scores: nextScores, stats: nextStat, outcome, milestone };
}
