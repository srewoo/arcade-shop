import { describe, expect, it } from 'vitest';
import { forEachBubble } from '../src/hex';
import { PUZZLES, COLOR_LETTERS, parseLevel, starsFor, twoStarShots } from '../src/levels';
import { findFloating } from '../src/match';

describe('puzzle levels', () => {
  it('has twelve levels with unique names', () => {
    expect(PUZZLES).toHaveLength(12);
    expect(new Set(PUZZLES.map((p) => p.name)).size).toBe(12);
  });

  PUZZLES.forEach((def, i) => {
    describe(`level ${i + 1} ${def.name}`, () => {
      const lv = parseLevel(def);
      it('parses with correct row widths', () => {
        expect(lv.grid.rows.length).toBe(def.rows.length);
      });
      it('has nothing floating at the start', () => {
        expect(findFloating(lv.grid)).toEqual([]);
      });
      it('has at least one bubble to clear', () => {
        let coloured = 0;
        forEachBubble(lv.grid, (b) => {
          if (b.kind === 'normal') coloured++;
        });
        expect(coloured).toBeGreaterThanOrEqual(3);
      });
      it('queue holds every colour on the board, so it is clearable in principle', () => {
        const inQueue = new Set(lv.queue.filter((b) => b.kind === 'normal').map((b) => b.color));
        for (const c of lv.colors) expect(inQueue.has(c)).toBe(true);
      });
      it('has a sane shot limit and par', () => {
        expect(lv.limit).toBeGreaterThanOrEqual(lv.colors.length);
        expect(lv.par).toBeGreaterThan(0);
        expect(lv.par).toBeLessThan(lv.limit);
      });
      it('only uses specials from level 3', () => {
        const hasSpecial = def.queue.includes('!') || def.queue.includes('?') || def.rows.some((r) => r.includes('#'));
        if (i < 2) expect(hasSpecial).toBe(false);
      });
    });
  });

  it('rejects malformed layouts', () => {
    expect(() => parseLevel({ name: 'x', par: 1, queue: 'R', rows: ['RRR'] })).toThrow(/needs 11/);
    expect(() => parseLevel({ name: 'x', par: 1, queue: 'R', rows: ['Z'.repeat(11)] })).toThrow(/bad bubble/);
    expect(() => parseLevel({ name: 'x', par: 1, queue: 'R#', rows: ['R'.repeat(11)] })).toThrow(/bad bubble/);
  });
  it('two-star band is a quarter of the slack above par', () => {
    expect(twoStarShots(20, 8)).toBe(11);
    expect(twoStarShots(12, 12)).toBe(12);
  });
  it('colour letters map to six colours', () => {
    expect(COLOR_LETTERS).toHaveLength(6);
  });
  it('awards 3, 2 or 1 stars by shots used', () => {
    expect(starsFor(5, 20, 8)).toBe(3);
    expect(starsFor(8, 20, 8)).toBe(3);
    expect(starsFor(11, 20, 8)).toBe(2);
    expect(starsFor(12, 20, 8)).toBe(1);
    expect(starsFor(20, 20, 8)).toBe(1);
  });
});
