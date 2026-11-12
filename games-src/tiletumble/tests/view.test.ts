import { describe, expect, it } from 'vitest';
import { boardFromRows, clearGroup, findGroup } from '../src/board';
import { stepCursor } from '../src/ui/input';
import { SpriteLayer } from '../src/ui/sprites';

describe('keyboard cursor', () => {
  const b = boardFromRows(['0.1', '011']);
  it('starts bottom-left and clamps to column height', () => {
    expect(stepCursor(b, null, 'ArrowRight')).toEqual({ x: 0, y: 0 });
    expect(stepCursor(b, { x: 2, y: 1 }, 'ArrowLeft')).toEqual({ x: 1, y: 0 });
    expect(stepCursor(b, { x: 0, y: 0 }, 'ArrowUp')).toEqual({ x: 0, y: 1 });
    expect(stepCursor(b, { x: 0, y: 1 }, 'ArrowUp')).toEqual({ x: 0, y: 1 });
    expect(stepCursor(b, { x: 0, y: 0 }, 'ArrowDown')).toEqual({ x: 0, y: 0 });
  });
  it('stays put at the edges and re-clamps after a column vanishes', () => {
    expect(stepCursor(b, { x: 0, y: 0 }, 'ArrowLeft')).toEqual({ x: 0, y: 0 });
    expect(stepCursor(b, { x: 5, y: 3 }, '')).toEqual({ x: 2, y: 1 });
  });
  it('returns null on an empty board', () => {
    expect(stepCursor(boardFromRows(['...']), null, '')).toBeNull();
  });
});

describe('sprite layer mirrors the logical board', () => {
  it('keeps colours at the right cells after clearing and sliding', () => {
    const board = boardFromRows(['2.1', '0.1', '021']);
    const layer = new SpriteLayer();
    layer.reset(board, true);
    const res = clearGroup(board, findGroup(board, 2, 0));
    layer.applyClear(res, 4);
    res.board.cols.forEach((col, x) => col.forEach((colour, y) => expect(layer.grid[x]?.[y]?.colour).toBe(colour)));
    expect(layer.popping).toHaveLength(3);
    for (let i = 0; i < 120; i++) layer.update(1 / 60);
    expect(layer.busy).toBe(false);
    expect(layer.grid[1]?.[0]).toMatchObject({ x: 1, y: 0 });
  });
  it('snaps instantly and spawns no particles when motion is reduced', () => {
    const board = boardFromRows(['2.', '00']);
    const layer = new SpriteLayer();
    layer.reduced = true;
    layer.reset(board, true);
    layer.applyClear(clearGroup(board, findGroup(board, 0, 0)), 0);
    expect(layer.particles).toHaveLength(0);
    expect(layer.floaters).toHaveLength(0);
    expect(layer.grid[0]?.[0]).toMatchObject({ x: 0, y: 0, ty: 0 });
  });
  it('raises a new column from below the floor', () => {
    const layer = new SpriteLayer();
    layer.reset(boardFromRows(['0']), true);
    layer.applyRise(1, [1, 2]);
    expect(layer.grid[1]?.[0]?.y).toBeLessThan(0);
    for (let i = 0; i < 120; i++) layer.update(1 / 60);
    expect(layer.grid[1]?.[1]).toMatchObject({ y: 1, ty: 1 });
  });
});
