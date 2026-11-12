// Move legality, state transitions and win detection for both packs.
import { brokenRule, maskOf, popcount } from './rules';
import type { Level, MoveCheck, State } from './types';

export const fullMask = (n: number): number => (1 << n) - 1;

export const initialState = (level: Level): State => ({
  start: fullMask(level.actors.length),
  carrierAtStart: true,
  cost: 0,
  moves: 0,
});

/** Bitmask of actors standing on the carrier's current bank. */
export function carrierBank(level: Level, s: State): number {
  const all = fullMask(level.actors.length);
  return s.carrierAtStart ? s.start : all & ~s.start;
}

/** Cost of one crossing: slowest walker on the bridge, one crossing on the raft. */
export function crossingCost(level: Level, group: readonly number[]): number {
  if (level.pack === 'raft') return 1;
  return Math.max(...group.map((i) => level.actors[i]?.time ?? 0));
}

export function checkMove(level: Level, s: State, group: readonly number[]): MoveCheck {
  if (group.length === 0) return { ok: false, reason: 'empty' };
  if (group.length > level.capacity) return { ok: false, reason: 'too-many' };
  const gm = maskOf(group);
  if (popcount(gm) !== group.length || (gm & ~carrierBank(level, s)) !== 0) return { ok: false, reason: 'wrong-side' };
  if (level.pack === 'raft' && !group.some((i) => level.actors[i]?.canRow)) return { ok: false, reason: 'no-rower' };
  if (level.rules.length > 0) {
    const all = fullMask(level.actors.length);
    const startAfter = s.carrierAtStart ? s.start & ~gm : s.start | gm;
    const rule = brokenRule(level.rules, gm) ?? brokenRule(level.rules, startAfter) ?? brokenRule(level.rules, all & ~startAfter);
    if (rule) return { ok: false, reason: 'rule', rule };
  }
  return { ok: true };
}

/** Apply a move already accepted by checkMove. */
export function applyMove(level: Level, s: State, group: readonly number[]): State {
  const gm = maskOf(group);
  return {
    start: s.carrierAtStart ? s.start & ~gm : s.start | gm,
    carrierAtStart: !s.carrierAtStart,
    cost: s.cost + crossingCost(level, group),
    moves: s.moves + 1,
  };
}

export const isWon = (s: State): boolean => s.start === 0 && !s.carrierAtStart;

/** Every legal group (as index arrays) from this state. */
export function legalMoves(level: Level, s: State): number[][] {
  const bank = carrierBank(level, s);
  const ids: number[] = [];
  for (let i = 0; i < level.actors.length; i++) if (bank & (1 << i)) ids.push(i);
  const out: number[][] = [];
  const total = 1 << ids.length;
  for (let sub = 1; sub < total; sub++) {
    if (popcount(sub) > level.capacity) continue;
    const group = ids.filter((_, k) => sub & (1 << k));
    if (checkMove(level, s, group).ok) out.push(group);
  }
  return out;
}
