import { describe, expect, it } from 'vitest';
import { newGame } from '../src/core/game';
import { parseGrid } from '../src/core/grid';
import { completedHouseCells, eraseWrong, newlyCorrect, solveAllState } from '../src/core/solverActions';
import { PUZZLE, SOLUTION } from './fixtures';

const fresh = () => newGame(parseGrid(PUZZLE) as number[], parseGrid(SOLUTION) as number[]);
const withValues = (g: ReturnType<typeof fresh>, patch: Record<number, number>) => {
  const values = [...g.values];
  for (const [i, v] of Object.entries(patch)) values[Number(i)] = v;
  return { ...g, values };
};

describe('solver action helpers', () => {
  it('eraseWrong clears only wrong digits', () => {
    const g = withValues(fresh(), { 2: Number(SOLUTION[2]), 3: (Number(SOLUTION[3]) % 9) + 1 });
    const out = eraseWrong(g);
    expect(out.values[2]).toBe(Number(SOLUTION[2]));
    expect(out.values[3]).toBe(0);
  });

  it('solveAllState fills the solution and clears notes', () => {
    const g = { ...fresh(), notes: new Array<number>(81).fill(7) };
    const out = solveAllState(g);
    expect(out.values).toEqual(g.solution);
    expect(out.notes.every((n) => n === 0)).toBe(true);
  });

  it('newlyCorrect lists only cells that became correct', () => {
    const before = fresh();
    const after = withValues(before, { 2: Number(SOLUTION[2]), 3: (Number(SOLUTION[3]) % 9) + 1 });
    expect(newlyCorrect(before, after)).toEqual([2]);
    expect(newlyCorrect(after, after)).toEqual([]);
  });

  it('completedHouseCells reports a finished row only once it is fully correct', () => {
    const rowOpen = [...Array(9).keys()].filter((c) => PUZZLE[c] === '.');
    let g = fresh();
    for (const c of rowOpen.slice(0, -1)) g = withValues(g, { [c]: Number(SOLUTION[c]) });
    const last = rowOpen[rowOpen.length - 1] as number;
    expect(completedHouseCells(withValues(g, { [last]: Number(SOLUTION[last]) % 9 + 1 }), last)).toEqual([]);
    const done = completedHouseCells(withValues(g, { [last]: Number(SOLUTION[last]) }), last);
    expect([...Array(9).keys()].every((c) => done.includes(c))).toBe(true);
  });
});
