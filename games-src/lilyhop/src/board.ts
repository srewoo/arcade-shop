// Pure rules. A board is a flat string of cells: 'A' (team A), 'B' (team B), '.' (empty pad).
// Team A moves right (and down on grids), team B moves left (and up). A piece may step
// into an adjacent empty pad or jump over one adjacent opposing piece into the pad behind it.
export type Team = 'A' | 'B';
export type Cell = '.' | Team;

export interface BoardSpec {
  readonly id: string;
  readonly kind: 'line' | 'grid';
  readonly cols: number;
  readonly rows: number;
  readonly start: string;
  readonly goal: string;
}

export interface Move {
  readonly from: number;
  readonly to: number;
  /** Index of the jumped piece, or -1 for a step. */
  readonly over: number;
}

const FORWARD: Readonly<Record<Team, readonly (readonly [number, number])[]>> = {
  A: [[1, 0], [0, 1]],
  B: [[-1, 0], [0, -1]],
};

export const otherTeam = (t: Team): Team => (t === 'A' ? 'B' : 'A');
export const isTeam = (c: string | undefined): c is Team => c === 'A' || c === 'B';

/** Legal moves for the piece at `index` (empty when the cell is not a piece). */
export function movesFrom(spec: BoardSpec, state: string, index: number): Move[] {
  const team = state[index];
  if (!isTeam(team)) return [];
  const x = index % spec.cols;
  const y = Math.floor(index / spec.cols);
  const out: Move[] = [];
  for (const [dx, dy] of FORWARD[team]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= spec.cols || ny >= spec.rows) continue;
    const near = ny * spec.cols + nx;
    if (state[near] === '.') {
      out.push({ from: index, to: near, over: -1 });
      continue;
    }
    const fx = nx + dx;
    const fy = ny + dy;
    if (state[near] !== otherTeam(team) || fx < 0 || fy < 0 || fx >= spec.cols || fy >= spec.rows) continue;
    const far = fy * spec.cols + fx;
    if (state[far] === '.') out.push({ from: index, to: far, over: near });
  }
  return out;
}

export function legalMoves(spec: BoardSpec, state: string): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < state.length; i++) out.push(...movesFrom(spec, state, i));
  return out;
}

export function applyMove(state: string, m: Move): string {
  const chars = [...state];
  chars[m.to] = chars[m.from] ?? '.';
  chars[m.from] = '.';
  return chars.join('');
}

export const isSolved = (spec: BoardSpec, state: string): boolean => state === spec.goal;

export const isJump = (m: Move): boolean => m.over >= 0;
