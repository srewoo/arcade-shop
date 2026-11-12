import { describe, expect, it } from 'vitest';
import { collides, createBoard, HEIGHT, WIDTH } from '../src/core/board';
import { kickTable, rotateWithKicks } from '../src/core/kicks';

describe('wall and floor kicks', () => {
  it('rotates in place when there is room (kick 0)', () => {
    const r = rotateWithKicks(createBoard(), { id: 'hookL', rot: 0, x: 3, y: 5 }, 1);
    expect(r?.kick).toBe(0);
    expect(r?.piece.rot).toBe(1);
  });
  it('kicks left off the right wall for the upright bar', () => {
    // upright bar (rot 1) hugging the right wall: cells at x+2
    const p = { id: 'bar' as const, rot: 1, x: WIDTH - 3, y: 4 };
    const r = rotateWithKicks(createBoard(), p, 1);
    expect(r).not.toBeNull();
    expect(r?.piece.x).toBeLessThan(p.x);
    expect(collides(createBoard(), 'bar', r!.piece.rot, r!.piece.x, r!.piece.y)).toBe(false);
  });
  it('kicks right off the left wall', () => {
    const p = { id: 'bar' as const, rot: 3, x: -1, y: 4 }; // upright bar at column 0
    const r = rotateWithKicks(createBoard(), p, -1);
    expect(r).not.toBeNull();
    expect(r!.piece.x).toBeGreaterThanOrEqual(p.x);
    expect(collides(createBoard(), 'bar', r!.piece.rot, r!.piece.x, r!.piece.y)).toBe(false);
  });
  it('floor kick lifts the piece when rotation would hit the floor', () => {
    const p = { id: 'spur' as const, rot: 0, x: 3, y: HEIGHT - 2 }; // flat on the floor
    const r = rotateWithKicks(createBoard(), p, 1);
    expect(r).not.toBeNull();
    expect(r!.piece.y).toBeLessThanOrEqual(p.y);
  });
  it('returns null when boxed in', () => {
    const b = createBoard();
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) (b[y] as number[])[x] = 1;
    for (const [cx, cy] of [[1, 0], [0, 1], [1, 1], [2, 1]] as const) (b[5 + cy] as number[])[3 + cx] = 0;
    expect(rotateWithKicks(b, { id: 'spur', rot: 0, x: 3, y: 5 }, 1)).toBeNull();
  });
  it('ccw table mirrors cw horizontally; cube never kicks', () => {
    const cw = kickTable('hookR', 1);
    const ccw = kickTable('hookR', -1);
    cw.forEach(([dx, dy], i) => expect(ccw[i]).toEqual([-dx, dy]));
    expect(kickTable('cube', 1)).toHaveLength(1);
  });
  it('is consistent: same input gives the same result', () => {
    const p = { id: 'ripple' as const, rot: 1, x: -1, y: 10 };
    expect(rotateWithKicks(createBoard(), p, 1)).toEqual(rotateWithKicks(createBoard(), p, 1));
  });
});
