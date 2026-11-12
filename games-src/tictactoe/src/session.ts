// Round-in-progress persistence. A session is the move list; it is validated
// by replaying it through the rules, so an illegal or stale save is dropped.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import { isOver, newGame, play, CELLS, type GameState, type Player, type Variant } from './game';
import { readJson, removeKey, writeJson } from './storage';

export const SESSION_KEY = 'ttt-session';

const SessionSchema = z.strictObject({
  round: z.int().check(z.gte(0), z.lte(1_000_000)),
  starter: z.enum(['X', 'O']),
  variant: z.enum(['classic', 'vanishing']),
  moves: z.array(z.int().check(z.gte(0), z.lte(CELLS - 1))).check(z.maxLength(CONFIG.rules.vanishMoveCap)),
});
export type Session = z.infer<typeof SessionSchema>;

export interface Restored {
  readonly round: number;
  readonly starter: Player;
  readonly history: readonly number[];
  readonly state: GameState;
}

/** Replay a stored session; null when invalid, illegal, finished or for another variant. */
export function restoreSession(raw: unknown, variant: Variant): Restored | null {
  const parsed = z.safeParse(SessionSchema, raw);
  if (!parsed.success || parsed.data.variant !== variant) return null;
  const { round, starter, moves } = parsed.data;
  try {
    const state = moves.reduce(play, newGame(variant, starter));
    return isOver(state) ? null : { round, starter, history: moves, state };
  } catch {
    return null;
  }
}

export const loadSession = (variant: Variant): Restored | null => restoreSession(readJson(SESSION_KEY), variant);

export function saveSession(s: Session): void {
  writeJson(SESSION_KEY, s);
}

export const clearSession = (): void => removeKey(SESSION_KEY);
