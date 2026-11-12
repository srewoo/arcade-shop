// Text for the results panel. Pure, so it can be tested without a DOM.
import { isSpare, matchScore, type Match } from './match';
import { spareStars, tallyRolls } from './stats';
import { S } from './strings';
import { TUNING } from './tuning';

export const starText = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n);

/** One-line summary: counts for bowling, stars for the spare challenge. */
export function detailLine(match: Match): string {
  if (isSpare(match)) {
    const score = matchScore(match, 0);
    return `${S.stars}: ${starText(spareStars(score))}`;
  }
  const parts = match.players.map((p, i) => {
    const t = tallyRolls(match.rolls[i] ?? []);
    return match.players.length > 1 ? `${p.name}: ${S.strikesSpares(t.strikes, t.spares)}` : S.strikesSpares(t.strikes, t.spares);
  });
  return parts.join(' · ');
}

export interface ResultTier {
  /** 0 (lowest) to 4 for bowling, 0 to 3 for the spare challenge. */
  readonly level: number;
  readonly label: string;
  /** The payoff (banner kind, confetti) is a big one. */
  readonly big: boolean;
}

/** Bowling tiers by the best score on the table: <100, 100+, 150+, 200+, 300. */
export const bowlingLevel = (score: number): number => (score >= 300 ? 4 : score >= 200 ? 3 : score >= 150 ? 2 : score >= 100 ? 1 : 0);

/** Tier of a finished match: spare challenge by stars, otherwise by the best score. */
export function resultTier(match: Match): ResultTier {
  const best = Math.max(0, ...match.players.map((_, i) => matchScore(match, i)));
  if (isSpare(match)) {
    const level = spareStars(best);
    return { level, label: S.tiersSpare[level] ?? '', big: level >= 2 };
  }
  const level = bowlingLevel(best);
  return { level, label: S.tiers[level] ?? '', big: level >= 2 };
}

/** How long the lane payoff plays before the results card opens. */
export function resultsDelayMs(tier: ResultTier, reduced: boolean): number {
  if (reduced) return TUNING.timing.resultsDelayReducedMs;
  return tier.big ? TUNING.timing.resultsDelayMs : TUNING.timing.resultsDelayQuietMs;
}
