import { describe, expect, it } from 'vitest';
import { PUZZLES, parseLevel } from '../src/levels';
import { aim, fire, swap } from '../src/shoot';
import { Game, newGame } from '../src/state';
import { STEP, update } from '../src/update';
import solutions from './puzzle-solutions.json';

interface Sol { index: number; best: number; moves: { swap: boolean; deg: number }[] }
const SOLS = solutions.levels as Sol[];

function replay(sol: Sol): Game {
  const g = newGame('puzzle', { puzzleIndex: sol.index, seed: 1 });
  for (const m of sol.moves) {
    if (m.swap) swap(g);
    aim(g, (m.deg * Math.PI) / 180);
    if (!fire(g)) throw new Error(`level ${sol.index + 1}: could not fire`);
    for (let i = 0; g.ball && i < 600; i++) update(g, STEP, { left: false, right: false });
  }
  return g;
}

describe('puzzle calibration (solver fixtures, replayed through the real simulation)', () => {
  it('has a solution for every level', () => {
    expect(SOLS.map((s) => s.index)).toEqual(PUZZLES.map((_, i) => i));
  });
  SOLS.forEach((sol) => {
    const def = PUZZLES[sol.index];
    if (!def) return;
    describe(`level ${sol.index + 1} ${def.name}`, () => {
      const lv = parseLevel(def);
      const g = replay(sol);
      it('is solvable within the shot limit', () => {
        expect(g.status).toBe('won');
        expect(g.shots).toBe(sol.best);
        expect(g.shots).toBeLessThanOrEqual(lv.limit);
      });
      it('par is solver-best + 1 or 2, so the three-star shot count is reachable but not trivial', () => {
        expect(lv.par).toBeGreaterThanOrEqual(sol.best + 1);
        expect(lv.par).toBeLessThanOrEqual(sol.best + 2);
        expect(g.stars).toBe(3);
      });
      it('the queue is about 1.6 x par (never shorter than the solution needs)', () => {
        expect(lv.limit).toBeLessThanOrEqual(Math.max(Math.ceil(lv.par * 1.6), sol.best + 2));
        expect(lv.limit).toBeGreaterThanOrEqual(sol.best + 2);
      });
    });
  });
  it('the old trivial pars are fixed: level 10 par is now small, level 1 par is 4', () => {
    expect(PUZZLES[9]?.par).toBeLessThanOrEqual(6);
    expect(PUZZLES[0]?.par).toBe(4);
  });
});
