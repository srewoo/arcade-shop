import { describe, expect, it } from 'vitest';
import { bestMove, chooseMove, winningMove, type Level, type Rng } from '../src/ai';
import { isOver, legalMoves, newGame, nextToVanish, play, other, type GameState, type Player } from '../src/game';

/** Small seeded PRNG so every batch is reproducible. */
function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A casual human: takes a win, blocks a threat, otherwise plays at random. */
function casual(s: GameState, rng: Rng): number {
  const win = winningMove(s, s.turn);
  if (win !== null) return win;
  const block = winningMove(s, other(s.turn));
  if (block !== null) return block;
  const moves = legalMoves(s);
  return moves[Math.floor(rng() * moves.length)] as number;
}

function playGame(level: Level, rng: Rng, humanFirst: boolean): 'human' | 'cpu' | 'draw' {
  let s = newGame('classic', humanFirst ? 'X' : 'O');
  while (!isOver(s)) s = play(s, s.turn === 'X' ? casual(s, rng) : chooseMove(s, level, rng));
  return s.winner === 'X' ? 'human' : s.winner === 'O' ? 'cpu' : 'draw';
}

export function batch(level: Level, games = 500, seed = 20261111): { human: number; cpu: number; draw: number } {
  const rng = mulberry32(seed);
  const out = { human: 0, cpu: 0, draw: 0 };
  for (let i = 0; i < games; i++) out[playGame(level, rng, i % 2 === 0)] += 1;
  return out;
}

const LEVELS: Level[] = ['easy', 'medium', 'strong', 'hard'];

describe('difficulty ladder (500 seeded games per level, casual human)', () => {
  const table = Object.fromEntries(LEVELS.map((l) => [l, batch(l)])) as Record<Level, ReturnType<typeof batch>>;
  console.info('BALANCE', JSON.stringify(table));

  it('is reproducible with a fixed seed', () => {
    expect(batch('medium', 100)).toEqual(batch('medium', 100));
  });

  it('human win rate falls at every step up the ladder', () => {
    expect(table.easy.human).toBeGreaterThan(table.medium.human);
    expect(table.medium.human).toBeGreaterThan(table.strong.human);
    expect(table.strong.human).toBeGreaterThanOrEqual(table.hard.human);
  });

  it('Unbeatable never loses Classic, even to random-ish play', () => {
    expect(table.hard.human).toBe(0);
  });

  it('Easy is beatable most of the time, Medium only now and then', () => {
    expect(table.easy.human / 500).toBeGreaterThan(0.7);
    expect(table.medium.human / 500).toBeGreaterThan(0.02);
    expect(table.medium.human / 500).toBeLessThan(0.3);
  });

  it('the Hard tier (85% best move) is not easier than Medium', () => {
    expect(table.strong.human).toBeLessThanOrEqual(table.medium.human);
    expect(table.strong.human + table.strong.cpu + table.strong.draw).toBe(500);
  });
});

/** Documents (and guards) the honest label: depth-8 search can lose Vanishing. */
describe('Vanishing is not provably unbeatable', () => {
  const key = (s: GameState): string => `${s.board.join('')}|${s.marks.X}|${s.marks.O}|${s.turn}`;

  function findHumanWin(first: Player): GameState | null {
    const seen = new Set<string>();
    const stack = [newGame('vanishing', first)];
    while (stack.length > 0) {
      const s = stack.pop() as GameState;
      if (seen.has(key(s))) continue;
      seen.add(key(s));
      if (s.winner === 'X') return s;
      if (isOver(s)) continue;
      if (s.turn === 'O') stack.push(play(s, bestMove(s)));
      else legalMoves(s).forEach((m) => stack.push(play(s, m)));
    }
    return null;
  }

  it('a reachable line exists where the depth-8 CPU loses', () => {
    expect(findHumanWin('X')?.winner).toBe('X');
  });

  it('the UI therefore labels it Expert, never Unbeatable (see strings.test.ts)', () => {
    expect(nextToVanish(newGame('vanishing'), 'X')).toBeNull();
  });
});
