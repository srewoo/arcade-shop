// Level sanity checks: shape, something to break, and nothing walled off by steel.
import { CONFIG } from '../config';
import { countDestructible, type ParsedLevel } from './format';

/** Returns a list of problems; an empty list means the level is playable. */
export function validateLevel(level: ParsedLevel): string[] {
  const issues: string[] = [];
  const rows = level.cells.length;
  if (rows < 1 || rows > CONFIG.field.maxRows) issues.push(`row count ${rows} out of range`);
  if (countDestructible(level.cells) === 0) issues.push('no destructible bricks');
  const stranded = unreachableBricks(level);
  if (stranded > 0) issues.push(`${stranded} brick(s) sealed behind indestructible bricks`);
  return issues;
}

/** Flood from below the grid through everything except steel; leftover bricks can never be hit. */
export function unreachableBricks(level: ParsedLevel): number {
  const rows = level.cells.length;
  const cols = CONFIG.field.cols;
  const seen = new Set<number>();
  const stack: number[] = [];
  const open = (r: number, c: number): boolean => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    const cell = level.cells[r]?.[c];
    return cell === undefined || cell === null || cell.kind === 'brick';
  };
  const push = (r: number, c: number): void => {
    const key = r * cols + c;
    if (!seen.has(key) && open(r, c)) {
      seen.add(key);
      stack.push(key);
    }
  };
  for (let c = 0; c < cols; c++) push(rows - 1, c);
  while (stack.length > 0) {
    const key = stack.pop() as number;
    const r = Math.floor(key / cols);
    const c = key % cols;
    push(r - 1, c);
    push(r + 1, c);
    push(r, c - 1);
    push(r, c + 1);
  }
  let stranded = 0;
  level.cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell !== null && cell.kind === 'brick' && !seen.has(r * cols + c)) stranded++;
    }),
  );
  return stranded;
}
