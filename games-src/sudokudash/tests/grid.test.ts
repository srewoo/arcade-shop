import { describe, expect, it } from 'vitest';
import {
  CELLS, HOUSES, PEERS, boxOf, cellName, countClues, emptyGrid, findConflictDetails, findConflicts, formatGrid,
  houseName, isValidSolution, parseGrid,
} from '../src/core/grid';
import { PUZZLE, SOLUTION } from './fixtures';

describe('grid model', () => {
  it('has 27 houses of 9 cells and 20 peers per cell', () => {
    expect(HOUSES).toHaveLength(27);
    expect(HOUSES.every((h) => h.cells.length === 9)).toBe(true);
    expect(PEERS.every((p) => p.length === 20)).toBe(true);
    expect(PEERS[0]).not.toContain(0);
  });

  it('names cells and houses in plain words', () => {
    expect(cellName(0)).toBe('r1c1');
    expect(cellName(80)).toBe('r9c9');
    expect(boxOf(40)).toBe(4);
    expect(houseName(HOUSES[2] as never)).toBe('row 3');
    expect(houseName(HOUSES[9] as never)).toBe('column 1');
    expect(houseName(HOUSES[22] as never)).toBe('the centre box');
  });

  it('parses and formats grids', () => {
    const g = parseGrid(PUZZLE);
    expect(g).not.toBeNull();
    expect(formatGrid(g as number[])).toBe(PUZZLE);
    expect(parseGrid('123')).toBeNull();
    expect(parseGrid('x'.repeat(81))).toBeNull();
    expect(countClues(g as number[])).toBe(30);
  });

  it('accepts a valid solution and rejects broken ones', () => {
    const sol = parseGrid(SOLUTION) as number[];
    expect(isValidSolution(sol)).toBe(true);
    const bad = [...sol];
    bad[0] = bad[1] as number;
    expect(isValidSolution(bad)).toBe(false);
    expect(isValidSolution(emptyGrid())).toBe(false);
    expect(emptyGrid()).toHaveLength(CELLS);
  });

  it('detects conflicts with their house and cells', () => {
    const g = emptyGrid();
    g[0] = 5;
    g[8] = 5;
    g[40] = 5;
    const details = findConflictDetails(g);
    expect(details).toHaveLength(1);
    expect(details[0]?.digit).toBe(5);
    expect(details[0]?.house.kind).toBe('row');
    expect([...findConflicts(g)].sort((a, b) => a - b)).toEqual([0, 8]);
    expect(findConflicts(parseGrid(PUZZLE) as number[]).size).toBe(0);
  });
});
