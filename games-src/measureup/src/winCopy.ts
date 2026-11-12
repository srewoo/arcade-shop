// What the result card says. Star copy is derived from the award itself so it
// can never contradict it.
import { S } from './strings';
import { twoStarLimit } from './scoring';

export interface WinCopy {
  readonly tier: string;
  readonly note: string;
}

export function winCopy(stars: number, moves: number, par: number, hinted: boolean): WinCopy {
  if (stars >= 3) return { tier: S.winTierThree, note: S.winPerfect };
  if (stars === 2) {
    const capped = hinted && moves <= par;
    return { tier: S.winTierTwo, note: capped ? S.noteHintCap : S.noteNeedPar(par, hinted) };
  }
  return { tier: S.winTierOne, note: S.noteNeedTwo(twoStarLimit(par)) };
}

/** Star glyph markup: earned stars are gold, the rest are outlines. */
export function starsMarkup(earned: number): string {
  return [1, 2, 3].map((i) => `<span class="star ${i <= earned ? 'on' : 'off'}">${i <= earned ? '★' : '☆'}</span>`).join('');
}
