import { describe, expect, it } from 'vitest';
import { clearRows, collides, createBoard, fullRows, HEIGHT, placePiece, WIDTH } from '../src/core/board';
import { fillRow } from './helpers';

describe('collision', () => {
  it('detects walls, floor and filled cells', () => {
    const b = createBoard();
    expect(collides(b, 'cube', 0, 0, 0)).toBe(false);
    expect(collides(b, 'cube', 0, -1, 0)).toBe(true);
    expect(collides(b, 'cube', 0, WIDTH - 1, 0)).toBe(true);
    expect(collides(b, 'cube', 0, 0, HEIGHT - 1)).toBe(true);
    expect(collides(b, 'cube', 0, 0, HEIGHT - 2)).toBe(false);
    (b[5] as number[])[3] = 1;
    expect(collides(b, 'cube', 0, 2, 4)).toBe(true);
    expect(collides(b, 'cube', 0, 4, 4)).toBe(false);
  });
});

describe('line clear', () => {
  for (const n of [1, 2, 3, 4]) {
    it(`clears ${n} line(s) and drops the rest`, () => {
      const b = createBoard();
      (b[HEIGHT - n - 1] as number[])[0] = 3; // marker above the lines
      for (let i = 0; i < n; i++) fillRow(b, HEIGHT - 1 - i);
      const rows = fullRows(b);
      expect(rows).toHaveLength(n);
      expect(clearRows(b, rows)).toBe(n);
      expect((b[HEIGHT - 1] as number[])[0]).toBe(3);
      expect(fullRows(b)).toHaveLength(0);
      expect(b).toHaveLength(HEIGHT);
    });
  }
  it('non-adjacent rows clear correctly', () => {
    const b = createBoard();
    fillRow(b, HEIGHT - 1);
    fillRow(b, HEIGHT - 2, [4]);
    fillRow(b, HEIGHT - 3);
    placePiece(b, { id: 'cube', rot: 0, x: 0, y: 0 });
    clearRows(b, fullRows(b));
    expect((b[HEIGHT - 1] as number[]).filter(Boolean)).toHaveLength(WIDTH - 1);
    expect((b[0] as number[]).every((c) => c === 0)).toBe(true);
  });
});
