// CPU opponent. `rng` is injected so tests are deterministic.
import { CONFIG } from './config';
import { findWin, legalMoves, play, type GameState, type Player } from './game';

/** 'hard' keeps its stored key but means Unbeatable; 'strong' is the newer Hard tier. */
export type Level = 'easy' | 'medium' | 'strong' | 'hard';
export type Rng = () => number;

const WIN = 1000;
/** Search depth for the vanishing variant, where the game tree is unbounded. */
const VANISH_DEPTH = CONFIG.ai.vanishDepth;
/** Prefer centre, then corners, then edges when scores tie. */
const PREFERENCE = [4, 0, 2, 6, 8, 1, 3, 5, 7];

const pick = <T>(items: readonly T[], rng: Rng): T => {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick from empty list');
  return item;
};

/** A move that wins immediately for `who`, if there is one. */
export function winningMove(s: GameState, who: Player): number | null {
  const probe: GameState = { ...s, turn: who };
  for (const m of legalMoves(probe)) {
    if (findWin(play(probe, m).board)?.winner === who) return m;
  }
  return null;
}

function negamax(s: GameState, depth: number, alpha: number, beta: number, limit: number): number {
  if (s.winner) return -(WIN - depth); // the player who just moved won
  if (s.draw || depth >= limit) return 0;
  let best = -Infinity;
  for (const m of legalMoves(s)) {
    const score = -negamax(play(s, m), depth + 1, -beta, -alpha, limit);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Best move by full search (classic) or depth-limited search (vanishing). */
export function bestMove(s: GameState): number {
  const moves = legalMoves(s);
  if (moves.length === 0) throw new Error('no legal moves');
  const limit = s.variant === 'classic' ? Infinity : VANISH_DEPTH;
  const ordered = [...moves].sort((a, b) => PREFERENCE.indexOf(a) - PREFERENCE.indexOf(b));
  let best = ordered[0] as number;
  let bestScore = -Infinity;
  for (const m of ordered) {
    const score = -negamax(play(s, m), 1, -Infinity, Infinity, limit);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

export function chooseMove(s: GameState, level: Level, rng: Rng = Math.random): number {
  const moves = legalMoves(s);
  if (moves.length === 0) throw new Error('no legal moves');
  if (level === 'hard') return bestMove(s);
  if (level === 'medium' || level === 'strong') {
    const win = winningMove(s, s.turn);
    if (win !== null) return win;
    const block = winningMove(s, s.turn === 'X' ? 'O' : 'X');
    if (block !== null) return block;
    const bestRate = level === 'medium' ? CONFIG.cpu.mediumBestRate : CONFIG.cpu.strongBestRate;
    return rng() < bestRate ? bestMove(s) : pick(moves, rng);
  }
  return pick(moves, rng);
}
