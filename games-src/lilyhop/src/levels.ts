// Level catalogue. Optimal move counts are never hard-coded: the solver computes them.
import type { BoardSpec } from './board';

export type Group = 'classic' | 'gaps' | 'grid';

export interface Level {
  readonly id: string;
  readonly group: Group;
  readonly spec: BoardSpec;
  /** Short size label, e.g. "3 + 3". */
  readonly label: string;
}

export function lineSpec(id: string, n: number, gaps: number): BoardSpec {
  const a = 'A'.repeat(n);
  const b = 'B'.repeat(n);
  const mid = '.'.repeat(gaps);
  return { id, kind: 'line', cols: n * 2 + gaps, rows: 1, start: a + mid + b, goal: b + mid + a };
}

/** Grid: team A fills the top-left staircase, team B the bottom-right one. */
export function gridSpec(id: string, cols: number, rows: number, depth: number): BoardSpec {
  const a: number[] = [];
  const b: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x + y < depth) a.push(y * cols + x);
      if ((cols - 1 - x) + (rows - 1 - y) < depth) b.push(y * cols + x);
    }
  }
  const build = (first: readonly number[], second: readonly number[]): string =>
    Array.from({ length: cols * rows }, (_, i) => (first.includes(i) ? 'A' : second.includes(i) ? 'B' : '.')).join('');
  return { id, kind: 'grid', cols, rows, start: build(a, b), goal: build(b, a) };
}

const line = (n: number, gaps: number, group: Group): Level => {
  const id = `${group}-${n}`;
  return { id, group, spec: lineSpec(id, n, gaps), label: `${n} + ${n}` };
};

export const LEVELS: readonly Level[] = [
  line(2, 1, 'classic'),
  line(3, 1, 'classic'),
  line(4, 1, 'classic'),
  line(5, 1, 'classic'),
  line(2, 2, 'gaps'),
  line(3, 2, 'gaps'),
  line(4, 2, 'gaps'),
  { id: 'grid-3', group: 'grid', spec: gridSpec('grid-3', 3, 3, 2), label: '3 + 3 on 3x3' },
  { id: 'grid-4', group: 'grid', spec: gridSpec('grid-4', 4, 3, 2), label: '3 + 3 on 4x3' },
];

export const findLevel = (id: string): Level | undefined => LEVELS.find((l) => l.id === id);
