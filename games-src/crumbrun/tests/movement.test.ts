import { describe, expect, it } from 'vitest';
import { advance, pipChooser, tryReverse } from '../src/movement';
import type { Mover, TurnBuffer } from '../src/movement';
import { tinyMaze } from './helpers';

const maze = tinyMaze();
type Pip = Mover & TurnBuffer;
const mk = (x: number, y: number, dir: Pip['dir'], want: Pip['want'] = 'N'): Pip => ({ x, y, px: x, py: y, dir, want });
const run = (p: Pip, dist: number): void => advance(maze, p, dist, pipChooser(maze, p));

describe('movement and turning', () => {
  it('moves straight and stops at a wall', () => {
    const p = mk(1, 1, 'R');
    run(p, 20);
    expect(p).toMatchObject({ x: 9, y: 1, dir: 'N' });
  });

  it('queues a turn until it is legal, then takes it', () => {
    const p = mk(3, 1, 'R', 'D');
    run(p, 2);
    expect(p.want).toBe('D'); // still buffered: no corridor down at cols 4..5
    expect(p.dir).toBe('R');
    run(p, 4.5);
    expect(p.x).toBe(9);
    expect(p.dir).toBe('D');
    expect(p.y).toBeCloseTo(1.5, 5);
    expect(p.want).toBe('N');
  });

  it('keeps a buffered turn across several ticks of small steps', () => {
    const p = mk(7, 1, 'R', 'D');
    for (let i = 0; i < 200; i++) run(p, 0.05);
    expect(p.dir === 'D' || p.dir === 'N').toBe(true);
    expect(p.x).toBe(9);
    expect(p.y).toBeGreaterThan(2);
  });

  it('applies an immediate 180 degree reversal mid-corridor', () => {
    const p = mk(4.4, 1, 'R', 'L');
    expect(tryReverse(p, p)).toBe(true);
    expect(p.dir).toBe('L');
    run(p, 1);
    expect(p.x).toBeCloseTo(3.4, 5);
  });

  it('does not reverse for a perpendicular request', () => {
    const p = mk(4.4, 1, 'R', 'D');
    expect(tryReverse(p, p)).toBe(false);
  });

  it('wraps through the tunnel going left', () => {
    const p = mk(1, 4, 'L');
    run(p, 2.5);
    expect(p.x).toBeCloseTo(10.5, 5);
    expect(p.y).toBe(4);
    expect(p.dir).toBe('L');
  });

  it('wraps through the tunnel going right', () => {
    const p = mk(9, 4, 'R');
    run(p, 2.5);
    expect(p.x).toBeCloseTo(-0.5, 5); // just re-entered from the left edge, off-grid until tile 0
    run(p, 1);
    expect(p.x).toBeCloseTo(0.5, 5);
  });
});
