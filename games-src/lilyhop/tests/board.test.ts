import { describe, expect, it } from 'vitest';
import { applyMove, isSolved, legalMoves, movesFrom, type BoardSpec } from '../src/board';
import { gridSpec, lineSpec } from '../src/levels';

const line = (start: string): BoardSpec => ({ id: 't', kind: 'line', cols: start.length, rows: 1, start, goal: start });

describe('line rules', () => {
  it('steps into an adjacent empty pad, forward only', () => {
    const spec = line('A.B');
    expect(movesFrom(spec, 'A.B', 0)).toEqual([{ from: 0, to: 1, over: -1 }]);
    expect(movesFrom(spec, 'A.B', 2)).toEqual([{ from: 2, to: 1, over: -1 }]);
  });
  it('never moves backwards', () => {
    expect(movesFrom(line('.A'), '.A', 1)).toEqual([]);
    expect(movesFrom(line('B.'), 'B.', 0)).toEqual([]);
  });
  it('jumps over exactly one opposing piece into an empty pad', () => {
    const spec = line('AB.');
    expect(movesFrom(spec, 'AB.', 0)).toEqual([{ from: 0, to: 2, over: 1 }]);
  });
  it('cannot jump own team, two pieces, or into an occupied pad', () => {
    expect(movesFrom(line('AA.'), 'AA.', 0)).toEqual([]);
    expect(movesFrom(line('ABB.'), 'ABB.', 0)).toEqual([]);
    expect(movesFrom(line('ABA'), 'ABA', 0)).toEqual([]);
  });
  it('cannot jump past the edge of the pond', () => {
    expect(movesFrom(line('.AB'), '.AB', 1)).toEqual([]);
  });
  it('an empty pad has no moves', () => {
    expect(movesFrom(line('A.B'), 'A.B', 1)).toEqual([]);
  });
  it('apply moves a piece without changing the jumped one', () => {
    expect(applyMove('AB.', { from: 0, to: 2, over: 1 })).toBe('.BA');
  });
  it('detects the solved position', () => {
    const spec = lineSpec('x', 2, 1);
    expect(isSolved(spec, spec.goal)).toBe(true);
    expect(isSolved(spec, spec.start)).toBe(false);
  });
  it('lists every legal move at the standard start', () => {
    const spec = lineSpec('x', 3, 1);
    expect(legalMoves(spec, spec.start)).toHaveLength(2);
  });
});

describe('grid rules', () => {
  const spec = gridSpec('g', 3, 3, 2);
  it('A moves right or down, B moves left or up', () => {
    const moves = movesFrom(spec, spec.start, 1).map((m) => m.to).sort();
    expect(moves).toEqual([2, 4]);
    expect(movesFrom(spec, spec.start, 7).map((m) => m.to).sort()).toEqual([4, 6]);
  });
  it('can jump vertically', () => {
    const g: BoardSpec = { id: 'v', kind: 'grid', cols: 2, rows: 3, start: 'A.B.' + '..', goal: '..' + '..' + '..' };
    expect(movesFrom({ ...g, cols: 1, rows: 3 }, 'AB.', 0)).toEqual([{ from: 0, to: 2, over: 1 }]);
  });
  it('start and goal are mirror images with equal team sizes', () => {
    expect([...spec.start].filter((c) => c === 'A')).toHaveLength(3);
    expect([...spec.start].filter((c) => c === 'B')).toHaveLength(3);
    expect(spec.goal.replace(/A/g, 'x').replace(/B/g, 'A').replace(/x/g, 'B')).toBe(spec.start);
  });
});
