// Parsing and validation of user-entered puzzles ("Enter my own puzzle").
import { CELLS, cellName, countClues, findConflictDetails, houseName } from './grid';
import { countSolutions, solveBacktracking } from './counter';
import { gradeLevel } from './generator';
import type { Difficulty } from './grader';

export const MIN_CLUES = 17;

export type ParseResult =
  | { readonly ok: true; readonly puzzle: number[]; readonly solution: number[]; readonly difficulty: Difficulty; readonly clues: number }
  | { readonly ok: false; readonly message: string };

const fail = (message: string): ParseResult => ({ ok: false, message });

/** Turn pasted text into 81 cell characters, ignoring whitespace and grid-drawing characters. */
export function normalizePuzzleText(text: string): string {
  return text.replace(/[\s|+\-_=,]/g, (ch) => (ch === '_' ? '.' : ''));
}

/** Parse pasted text into a grid (no solving). */
export function parsePuzzleCells(text: string): { cells: number[] } | { error: string } {
  const flat = normalizePuzzleText(text);
  if (flat.length === 0) return { error: 'Paste or type the 81 cells: digits 1-9, and 0 or . for blanks.' };
  const bad = [...flat].find((ch) => !/[0-9.]/.test(ch));
  if (bad !== undefined) return { error: `"${bad}" is not allowed. Use digits 1-9, and 0 or . for an empty cell.` };
  if (flat.length !== CELLS) {
    return { error: `Expected 81 cells but found ${flat.length}. Check for a missing or extra character.` };
  }
  return { cells: [...flat].map((ch) => (ch === '.' ? 0 : Number(ch))) };
}

/** Full validation: format, conflicts, enough clues, exactly one solution. */
export function validatePuzzle(text: string): ParseResult {
  const parsed = parsePuzzleCells(text);
  if ('error' in parsed) return fail(parsed.error);
  const grid = parsed.cells;
  const conflict = findConflictDetails(grid)[0];
  if (conflict) {
    return fail(
      `The digit ${conflict.digit} appears twice in ${houseName(conflict.house)} ` +
        `(${conflict.cells.map(cellName).join(' and ')}). Fix that clash first.`,
    );
  }
  const clues = countClues(grid);
  if (clues < MIN_CLUES) {
    return fail(`Only ${clues} clues given. A puzzle with fewer than ${MIN_CLUES} clues can never have a single solution.`);
  }
  const count = countSolutions(grid, 2);
  if (count === 0) return fail('This grid has no solution: the clues contradict each other somewhere.');
  if (count > 1) return fail('This grid has more than one solution. Add more clues until only one answer is possible.');
  const solution = solveBacktracking(grid) as number[];
  return { ok: true, puzzle: grid, solution, difficulty: gradeLevel(grid), clues };
}
