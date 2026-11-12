import { describe, expect, it } from 'vitest';
import { BOARD_CROP, boardShare, boardSize, fitScale, layoutMode, ORIGIN_Y, HUD_TOP, TILE } from '../src/layout';
import { MAZE_DEFS, MAZES } from '../src/mazes';
import { COACH_MS, shouldCoach } from '../src/ui/coach';

const maze = MAZES[0]!;
const size = boardSize(maze);

describe('cropped board geometry', () => {
  it('drops the outer scenery rows only', () => {
    expect(size.w).toBe(maze.cols * TILE);
    expect(size.h).toBe(maze.rows * TILE - 2 * BOARD_CROP);
    expect(ORIGIN_Y).toBe(HUD_TOP + BOARD_CROP);
  });
  it('crops only wall rows in every maze', () => {
    for (const def of MAZE_DEFS) {
      const rows = def.rows;
      const cropRows = Math.ceil(BOARD_CROP / TILE);
      for (let i = 0; i < cropRows; i++) {
        expect(rows[i]).toMatch(/^#+$/);
        expect(rows[rows.length - 1 - i]).toMatch(/^#+$/);
      }
    }
  });
});

describe('layoutMode', () => {
  it('uses side gutters on desktop and landscape phones', () => {
    expect(layoutMode(1280, 800, size)).toBe('side');
    expect(layoutMode(860, 400, size)).toBe('side');
  });
  it('stacks on portrait phones and squarish windows', () => {
    expect(layoutMode(400, 860, size)).toBe('stack');
    expect(layoutMode(1000, 900, size)).toBe('stack');
  });
  it('honours a custom minimum gutter', () => {
    expect(layoutMode(1280, 800, size, 600)).toBe('stack');
  });
});

describe('boardShare', () => {
  it('fills at least half of a desktop window in the side layout', () => {
    const f = fitScale(1280 / 2, 800 - 12, 2, size);
    expect(boardShare(f, 1280, 800)).toBeGreaterThan(0.2);
    const tall = fitScale(1280 - 0, 788, 2, size);
    expect(boardShare(tall, 1280, 800)).toBeGreaterThan(0.55);
  });
  it('is safe for empty viewports', () => {
    expect(boardShare({ cssW: 10, cssH: 10 }, 0, 0)).toBe(0);
  });
});

describe('first-run coach mark', () => {
  it('shows once, on the first READY of level 1', () => {
    expect(shouldCoach(false, 'ready', 1)).toBe(true);
    expect(shouldCoach(true, 'ready', 1)).toBe(false);
    expect(shouldCoach(false, 'ready', 2)).toBe(false);
    expect(shouldCoach(false, 'title', 1)).toBe(false);
    expect(COACH_MS).toBeGreaterThan(3000);
  });
});
