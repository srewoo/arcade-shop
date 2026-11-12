import { describe, expect, it } from 'vitest';
import { BISCUIT_CHASE_SEC, catTarget, lineOfSight, mirrorTarget, updateBiscuit } from '../src/cats';
import type { CatBrain } from '../src/cats';
import { DistCache } from '../src/graph';
import { chaseDir, fleeDir, steer } from '../src/steer';
import type { SteerCtx } from '../src/steer';
import { mulberry32 } from '../src/types';
import type { Tile } from '../src/types';
import { tinyMaze } from './helpers';

const maze = tinyMaze();
const t = (col: number, row: number): Tile => ({ col, row });
const ctx = (cat: Tile, pip: Tile) => ({ maze, pip, pipDir: 'N' as const, cat });
const fresh = (): CatBrain => ({ routeIdx: 0, chaseTimer: 0 });

describe('Smudge: direct chase', () => {
  it('targets Pip tile', () => {
    expect(catTarget('smudge', ctx(t(5, 4), t(1, 1)), fresh())).toEqual({ kind: 'tile', tile: t(1, 1) });
  });

  it('steers along the shortest path on the tile graph, including through the tunnel', () => {
    const sc: SteerCtx = { maze, dists: new DistCache(maze), rng: mulberry32(1), access: 'cat' };
    expect(chaseDir(sc, t(1, 4), 'R', t(1, 1))).toBe('U');
    expect(chaseDir(sc, t(2, 4), 'L', t(10, 4))).toBe('L'); // 3 steps via wrap vs 8 the other way
    expect(steer(sc, t(2, 4), 'L', { kind: 'tile', tile: t(10, 4) })).toBe('L');
  });
});

describe('Biscuit: patrol with proximity chase', () => {
  it('patrols the fixed route while Pip is far away', () => {
    const b = fresh();
    expect(catTarget('biscuit', ctx(t(5, 4), t(1, 1)), b)).toEqual({ kind: 'tile', tile: t(1, 1) });
    updateBiscuit(b, maze.route, t(1, 1), 12, 0.1); // reached waypoint 0
    expect(b.routeIdx).toBe(1);
    expect(catTarget('biscuit', ctx(t(3, 1), t(5, 4)), b)).toEqual({ kind: 'tile', tile: t(9, 1) });
  });

  it('chases for 4 seconds once Pip is within 5 tiles, then goes back to patrol', () => {
    const b = fresh();
    updateBiscuit(b, maze.route, t(3, 1), 5, 1 / 60);
    expect(b.chaseTimer).toBe(BISCUIT_CHASE_SEC);
    expect(catTarget('biscuit', ctx(t(3, 1), t(7, 4)), b)).toEqual({ kind: 'tile', tile: t(7, 4) });
    for (let i = 0; i < 239; i++) updateBiscuit(b, maze.route, t(3, 1), 20, 1 / 60); // ~3.98 s
    expect(b.chaseTimer).toBeGreaterThan(0);
    for (let i = 0; i < 5; i++) updateBiscuit(b, maze.route, t(3, 1), 20, 1 / 60);
    expect(b.chaseTimer).toBe(0);
    expect(catTarget('biscuit', ctx(t(3, 1), t(7, 4)), b).kind).toBe('tile');
    expect(catTarget('biscuit', ctx(t(3, 1), t(7, 4)), b)).not.toEqual({ kind: 'tile', tile: t(7, 4) });
  });

  it('does not trigger at distance 6', () => {
    const b = fresh();
    updateBiscuit(b, maze.route, t(3, 1), 6, 0.1);
    expect(b.chaseTimer).toBe(0);
  });
});

describe('Tuxedo: wander, pounce on a clear line', () => {
  it('pounces along a clear row', () => {
    expect(lineOfSight(maze, t(3, 1), t(8, 1))).toBe('R');
    expect(catTarget('tuxedo', ctx(t(3, 1), t(8, 1)), fresh())).toEqual({
      kind: 'pounce', tile: t(8, 1), dir: 'R',
    });
  });

  it('pounces along a clear column', () => {
    expect(lineOfSight(maze, t(1, 4), t(1, 1))).toBe('U');
  });

  it('wanders when a wall blocks the line or Pip is off-axis', () => {
    expect(catTarget('tuxedo', ctx(t(1, 2), t(9, 2)), fresh())).toEqual({ kind: 'wander' });
    expect(catTarget('tuxedo', ctx(t(3, 1), t(5, 4)), fresh())).toEqual({ kind: 'wander' });
  });

  it('a pounce heads straight down the line when it can', () => {
    const sc: SteerCtx = { maze, dists: new DistCache(maze), rng: mulberry32(1), access: 'cat' };
    expect(steer(sc, t(3, 1), 'D', { kind: 'pounce', tile: t(8, 1), dir: 'R' })).toBe('R');
  });
});

describe('Ginger: mirror ambush', () => {
  it('targets the reflection of Pip across the maze centre', () => {
    expect(mirrorTarget(maze, t(1, 4))).toEqual(t(9, 2));
    expect(catTarget('ginger', ctx(t(5, 4), t(1, 4)), fresh())).toEqual({ kind: 'tile', tile: t(9, 2) });
  });

  it('falls back to the nearest floor tile when the mirror lands in a wall', () => {
    expect(mirrorTarget(maze, t(1, 1))).toEqual(t(9, 4)); // mirror (9,5) is the wall below
  });
});

describe('drenched cats flee', () => {
  it('picks the neighbour farthest from Pip', () => {
    const sc: SteerCtx = { maze, dists: new DistCache(maze), rng: mulberry32(7), access: 'cat' };
    expect(fleeDir(sc, t(5, 4), 'N', t(9, 4))).toBe('L');
    expect(fleeDir(sc, t(5, 4), 'N', t(2, 4))).toBe('R');
  });
});
