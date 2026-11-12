// First-appearance hints for special bubbles and the ceiling counter. Pure: no DOM.
import { HintKind } from './settings';
import { Game } from './state';

/** The hint to show now (first unseen special that is loaded, queued or on the board), or null. */
export function pendingHint(g: Game, seen: readonly HintKind[]): HintKind | null {
  if (g.status !== 'playing') return null;
  const has = (k: HintKind): boolean => !seen.includes(k);
  for (const b of [g.cur, g.next]) {
    if (b?.kind === 'bomb' && has('bomb')) return 'bomb';
    if (b?.kind === 'rainbow' && has('rainbow')) return 'rainbow';
  }
  if (has('stone') && g.grid.rows.some((row) => row.some((c) => c?.kind === 'stone'))) return 'stone';
  if (has('ceiling') && g.mode !== 'puzzle' && g.diff.dropEvery - g.sinceDrop === 1) return 'ceiling';
  return null;
}
