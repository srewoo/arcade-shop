import { describe, expect, it } from 'vitest';
import { DANGER_ROW, bubbleCount, cellCenter, getCell, setCell } from '../src/hex';
import { SHOOTER } from '../src/hex';
import { arcadeDifficulty, mulberry32 } from '../src/rules';
import { aim, canShoot, fire, swap } from '../src/shoot';
import { Game, newGame } from '../src/state';
import { STEP, update } from '../src/update';

const run = (g: Game, seconds = 3): void => {
  for (let i = 0; i < seconds / STEP; i++) update(g, STEP, { left: false, right: false });
};
const n = (color: number) => ({ kind: 'normal', color }) as const;

function aimAtCell(g: Game, row: number, col: number): void {
  const c = cellCenter(row, col, g.grid.phase);
  aim(g, Math.atan2(c.x - SHOOTER.x, SHOOTER.y - c.y));
}

describe('simulation', () => {
  it('pops a matching group, scores, and drops the orphaned cluster', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.grid.rows = [];
    // Two reds in row 0 hold a hanging green; a red shot completes the match.
    setCell(g.grid, 0, 4, n(0));
    setCell(g.grid, 0, 5, n(0));
    setCell(g.grid, 1, 4, n(1)); // hangs from (0,4)/(0,5)
    setCell(g.grid, 5, 9, n(2)); // keeps the board non-empty
    setCell(g.grid, 4, 9, n(2));
    setCell(g.grid, 3, 9, n(2));
    setCell(g.grid, 2, 9, n(2));
    setCell(g.grid, 1, 8, n(2));
    setCell(g.grid, 0, 9, n(2));
    g.cur = n(0);
    aimAtCell(g, 0, 3);
    expect(fire(g)).toBe(true);
    run(g);
    expect(getCell(g.grid, 0, 4)).toBeNull();
    expect(getCell(g.grid, 0, 3)).toBeNull();
    expect(getCell(g.grid, 1, 4)).toBeNull(); // floating green fell
    expect(g.score).toBeGreaterThan(30);
    expect(g.combo).toBe(1);
  });

  it('a miss resets the combo and sticks the bubble', () => {
    const g = newGame('arcade', { seed: 3 });
    g.combo = 4;
    g.cur = n(5);
    const before = bubbleCount(g.grid);
    aim(g, 0);
    fire(g);
    run(g);
    expect(g.combo).toBe(0);
    expect(bubbleCount(g.grid)).toBe(before + 1);
  });

  it('cannot fire while a bubble is in flight; swap exchanges current and next', () => {
    const g = newGame('arcade', { seed: 4 });
    const [a, b] = [g.cur, g.next];
    swap(g);
    expect(g.cur).toBe(b);
    expect(g.next).toBe(a);
    expect(fire(g)).toBe(true);
    expect(canShoot(g)).toBe(false);
    expect(fire(g)).toBe(false);
  });

  it('ceiling drops after N consecutive misses, and a pop resets the budget', () => {
    const g = newGame('arcade', { seed: 5 });
    const every = g.diff.dropEvery;
    expect(every).toBe(arcadeDifficulty(1).dropEvery);
    const phase = g.grid.phase;
    g.sinceDrop = every - 1;
    g.cur = n(5); // colour that is not on the level 1 board: guaranteed miss
    aim(g, 0);
    fire(g);
    run(g, 4);
    expect(g.sinceDrop).toBe(0);
    expect(g.grid.phase).not.toBe(phase);
    expect(g.events.some((e) => e.type === 'ceiling')).toBe(true);
  });

  it('a popping shot resets the miss counter and never drops the ceiling', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.mode = 'arcade';
    g.diff = { colors: 3, rows: 0, dropEvery: 4, specials: false };
    g.grid.rows = [];
    setCell(g.grid, 0, 4, n(0));
    setCell(g.grid, 0, 5, n(0));
    setCell(g.grid, 0, 9, n(2));
    g.sinceDrop = 3; // one more miss would drop
    g.cur = n(0);
    aimAtCell(g, 0, 3);
    fire(g);
    run(g);
    expect(g.sinceDrop).toBe(0);
    expect(g.hits).toBe(1);
    expect(g.events.some((e) => e.type === 'ceiling')).toBe(false);
  });

  it('game over when a bubble reaches the danger row', () => {
    const g = newGame('arcade', { seed: 6 });
    g.grid.rows = [];
    setCell(g.grid, 0, 5, n(0));
    for (let r = 1; r < DANGER_ROW; r++) setCell(g.grid, r, r % 2 ? 4 : 5, n(1));
    g.sinceDrop = 0;
    g.cur = n(2);
    aim(g, 0);
    fire(g);
    run(g);
    expect(g.status === 'lost' || g.status === 'playing').toBe(true);
    setCell(g.grid, DANGER_ROW, 2, n(3));
    g.status = 'playing';
    g.cur = n(2);
    aim(g, -0.5);
    fire(g);
    run(g, 4);
    expect(g.status).toBe('lost');
  });

  it('clearing a puzzle awards stars and ends the game', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.grid.rows = [];
    setCell(g.grid, 0, 4, n(0));
    setCell(g.grid, 0, 5, n(0));
    g.cur = n(0);
    aimAtCell(g, 0, 3);
    fire(g);
    run(g);
    expect(g.status).toBe('won');
    expect(g.stars).toBe(3);
  });

  it('puzzle ends with a loss when the queue runs out', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.limit = 1;
    g.cur = n(0);
    g.next = null;
    aim(g, 1.2);
    fire(g);
    run(g, 4);
    expect(g.status).toBe('lost');
  });

  it('seeded rng is deterministic', () => {
    const a = mulberry32(9);
    const b = mulberry32(9);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
