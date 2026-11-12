// Screen-reader status lines for key events (kept short; the HUD itself is not live).
import { S } from '../strings';
import type { GameEvent, GameState } from '../core/state';

export function announceFor(events: readonly GameEvent[], g: GameState): string[] {
  const out: string[] = [];
  for (const e of events) {
    if (e.type === 'clear' && e.label) out.push(S.live.clear(e.label, e.points));
    else if (e.type === 'levelUp') out.push(S.live.level(e.level));
    else if (e.type === 'garbage') out.push(S.live.garbage);
    else if (e.type === 'wipe') out.push(S.live.wipe);
    else if (e.type === 'end') out.push(e.status === 'over' ? S.live.over(g.score) : e.status === 'won' ? S.live.won(g.score) : S.live.time(g.score));
  }
  return out;
}
