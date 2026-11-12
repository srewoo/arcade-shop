// Decides which arcade banner (if any) follows a roll. Pure.
import { isSpare, SPARE_CLEAR_BONUS, type Match } from './match';
import { lastRollWasSpare, lastRollWasStrike, strikeStreak } from './scoring';

export type BannerKind = 'strike' | 'spare' | 'turkey' | 'gutter' | 'miss';

export interface Banner {
  readonly text: string;
  readonly kind: BannerKind;
}

/** `m` is the match AFTER the roll was recorded; `player` threw it. */
export function bannerFor(m: Match, player: number, knocked: number, gutter: boolean): Banner | null {
  const rolls = m.rolls[player] ?? [];
  if (isSpare(m)) {
    const size = (m.leaves[rolls.length - 1] ?? []).length;
    if (knocked === size && size > 0) return { text: `CLEARED! +${SPARE_CLEAR_BONUS}`, kind: 'spare' };
    return gutter && knocked === 0 ? { text: 'GUTTER BALL', kind: 'gutter' } : { text: 'MISSED', kind: 'miss' };
  }
  if (lastRollWasStrike(rolls)) {
    const n = strikeStreak(rolls);
    if (n === 3) return { text: 'TURKEY!', kind: 'turkey' };
    if (n === 4) return { text: 'HAMBONE!', kind: 'turkey' };
    return { text: 'STRIKE!', kind: 'strike' };
  }
  if (lastRollWasSpare(rolls)) return { text: 'SPARE!', kind: 'spare' };
  if (knocked === 0 && gutter) return { text: 'GUTTER BALL', kind: 'gutter' };
  return null;
}
