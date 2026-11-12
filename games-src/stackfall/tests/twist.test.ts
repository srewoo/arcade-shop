import { describe, expect, it } from 'vitest';
import { createBoard } from '../src/core/board';
import { detectTwist } from '../src/core/twist';

const spur = (rot = 0) => ({ id: 'spur' as const, rot, x: 3, y: 10 });
const put = (b: number[][], cells: [number, number][]) => cells.forEach(([x, y]) => ((b[y] as number[])[x] = 8));

describe('twist detection', () => {
  it('needs a rotation as the last action', () => {
    const b = createBoard();
    put(b, [[3, 12], [5, 12], [3, 10]]);
    expect(detectTwist(b, spur(), false)).toBe('none');
  });
  it('is only for the spur shape', () => {
    const b = createBoard();
    put(b, [[3, 12], [5, 12], [3, 10]]);
    expect(detectTwist(b, { id: 'hookL', rot: 0, x: 3, y: 10 }, true)).toBe('none');
  });
  it('needs 3 occupied corners', () => {
    const b = createBoard();
    put(b, [[3, 12], [5, 12]]); // two corners
    expect(detectTwist(b, spur(), true)).toBe('none');
  });
  it('full twist: both corners in front of the nose are filled', () => {
    const b = createBoard();
    put(b, [[3, 10], [5, 10], [3, 12]]); // nose up, front corners = top two
    expect(detectTwist(b, spur(0), true)).toBe('twist');
  });
  it('mini twist: 3 corners but a front corner is open', () => {
    const b = createBoard();
    put(b, [[3, 12], [5, 12], [3, 10]]); // nose up, only one top corner
    expect(detectTwist(b, spur(0), true)).toBe('mini');
  });
  it('walls and floor count as filled corners', () => {
    const b = createBoard();
    // spur pressed into the left wall and the floor: x=-1 puts left corners in the wall
    expect(detectTwist(b, { id: 'spur', rot: 1, x: -1, y: 20 }, true)).not.toBe('none');
  });
  it('front corners follow the rotation', () => {
    const b = createBoard();
    put(b, [[5, 10], [5, 12], [3, 12]]); // nose right: right two corners filled
    expect(detectTwist(b, spur(1), true)).toBe('twist');
    expect(detectTwist(b, spur(3), true)).toBe('mini');
  });
});
