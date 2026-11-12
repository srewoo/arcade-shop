import { describe, expect, it } from 'vitest';
import { bit } from '../src/core/candidates';
import {
  conflictCells, enterDigit, eraseCell, fillAllNotes, isSolved, newGame, remainingCounts, toggleNote,
} from '../src/core/game';
import { applyHint, nextHint } from '../src/core/hint';
import { emptyHistory, record, redo, undo } from '../src/core/history';
import { parseGrid } from '../src/core/grid';
import { solveBacktracking } from '../src/core/counter';
import { EXPERT, EXPERT_SOLUTION, PUZZLE, SOLUTION, XWING } from './fixtures';

const fresh = () => newGame(parseGrid(PUZZLE) as number[], parseGrid(SOLUTION) as number[]);
const sol = (i: number): number => Number(SOLUTION[i]);

describe('game state', () => {
  it('locks givens and correct digits, lets mistakes be replaced', () => {
    const g = fresh();
    expect(enterDigit(g, 0, 9, true).outcome).toBe('noop');
    const wrong = enterDigit(g, 2, sol(2) === 4 ? 1 : 4, true);
    expect(wrong.outcome).toBe('mistake');
    expect(eraseCell(wrong.state, 2).values[2]).toBe(0);
    const right = enterDigit(wrong.state, 2, sol(2), true);
    expect(right.outcome).toBe('correct');
    expect(enterDigit(right.state, 2, 1, true).outcome).toBe('noop');
    expect(eraseCell(right.state, 2)).toBe(right.state);
  });

  it('removes notes from peers on a correct entry (when enabled)', () => {
    let g = fresh();
    g = toggleNote(g, 3, sol(2));
    g = toggleNote(g, 3, 9 === sol(2) ? 8 : 9);
    const on = enterDigit(g, 2, sol(2), true).state;
    expect(on.notes[3]! & bit(sol(2))).toBe(0);
    const off = enterDigit(g, 2, sol(2), false).state;
    expect(off.notes[3]! & bit(sol(2))).not.toBe(0);
    expect(toggleNote(on, 2, 1)).toBe(on); // filled cells take no notes
  });

  it('counts remaining digits and detects conflicts and completion', () => {
    const g = fresh();
    const left = remainingCounts(g);
    expect(left[5]).toBe(9 - (PUZZLE.match(/5/g)?.length ?? 0));
    const bad = enterDigit(g, 2, 3, true).state; // 3 clashes with the given 3 in row 1
    expect(conflictCells(bad).has(2)).toBe(true);
    expect(remainingCounts(bad)[3]).toBe(left[3]);
    const done = { ...g, values: [...g.solution] };
    expect(isSolved(done)).toBe(true);
    expect(isSolved(g)).toBe(false);
  });

  it('undoes and redoes snapshots', () => {
    let h = emptyHistory<number>();
    h = record(h, 1);
    h = record(h, 2);
    const u = undo(h, 3);
    expect(u?.state).toBe(2);
    const r = redo(u!.history, 2);
    expect(r?.state).toBe(3);
    expect(undo(emptyHistory<number>(), 0)).toBeNull();
    expect(redo(h, 0)).toBeNull();
    expect(record(emptyHistory<number>(), 1, 2).past).toEqual([1]);
    expect(record(record(record(emptyHistory<number>(), 1, 2), 2, 2), 3, 2).past).toEqual([2, 3]);
  });
});

describe('hints', () => {
  it('explains the next step in words and applying it places the digit', () => {
    const g = fresh();
    const hint = nextHint(g);
    expect(hint.kind).toBe('step');
    if (hint.kind !== 'step') return;
    expect(hint.step.message.length).toBeGreaterThan(20);
    const next = applyHint(g, hint);
    const { cell, digit } = hint.step.placement!;
    expect(next.values[cell]).toBe(digit);
    expect(digit).toBe(sol(cell));
  });

  it('flags a wrong entry first', () => {
    const g = enterDigit(fresh(), 2, 1, true).state;
    const hint = nextHint(g);
    expect(hint.kind).toBe('mistake');
    expect(applyHint(g, hint).values[2]).toBe(0);
  });

  it('applies an elimination step by remembering it and showing notes', () => {
    const puzzle = parseGrid(XWING) as number[];
    const g = newGame(puzzle, solveBacktracking(puzzle) as number[]);
    let cur = g;
    let guard = 0;
    while (guard++ < 200) {
      const hint = nextHint(cur);
      if (hint.kind !== 'step') break;
      if (hint.step.technique === 'x-wing') {
        const after = applyHint(cur, hint);
        expect(after.elim.some((m) => m !== 0)).toBe(true);
        expect(after.notes.some((m) => m !== 0)).toBe(true);
        return;
      }
      cur = applyHint(cur, hint);
    }
    throw new Error('no x-wing step reached');
  });

  it('falls back to a search suggestion when no technique applies', () => {
    const g = newGame(parseGrid(EXPERT) as number[], parseGrid(EXPERT_SOLUTION) as number[]);
    const hint = nextHint(g);
    expect(hint.kind).toBe('guess');
    if (hint.kind === 'guess') expect(hint.message).toContain('trial and error');
    expect(nextHint({ ...g, values: [...g.solution] }).kind).toBe('solved');
  });

  it('fills pencil marks from candidates', () => {
    const filled = fillAllNotes(fresh());
    expect(filled.notes[2]).not.toBe(0);
    expect(filled.notes[0]).toBe(0);
  });
});
