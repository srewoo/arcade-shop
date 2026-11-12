import { describe, expect, it } from 'vitest';
import { chooseLayout, placeLine } from '../src/layout';

describe('layout', () => {
  it('keeps one row when pads already fill the pond', () => {
    const l = chooseLayout(5, 700, 500);
    expect(l.rows).toBe(1);
    expect(l.cell).toBeGreaterThanOrEqual(96);
  });
  it('scales pads up to the max cell so a short line is not a thin band', () => {
    expect(chooseLayout(3, 900, 500).cell).toBe(168);
  });
  it('folds a long line into the fewest rows that fill the pond', () => {
    const l = chooseLayout(11, 900, 400);
    expect(l.rows).toBe(2);
    expect(l.cell).toBeGreaterThanOrEqual(96);
  });
  it('on a phone picks the row count with the biggest pads when none reach the fill size', () => {
    const l = chooseLayout(11, 368, 360);
    expect(l.rows).toBe(3);
    expect(l.cell).toBeGreaterThanOrEqual(56);
  });
  it('keeps one row when the box is too short to fold', () => {
    expect(chooseLayout(11, 900, 80).rows).toBe(1);
  });
  it('folds a long path on a phone and keeps pads tappable', () => {
    const l = chooseLayout(11, 368, 360);
    expect(l.rows).toBeGreaterThan(1);
    expect(l.cell).toBeGreaterThanOrEqual(44);
    expect(l.perRow * l.rows).toBeGreaterThanOrEqual(11);
  });
  it('never goes below the minimum cell size', () => {
    expect(chooseLayout(11, 200, 100).cell).toBe(44);
  });
  it('serpentine keeps neighbours adjacent at the turn', () => {
    const a = placeLine(5, 6);
    const b = placeLine(6, 6);
    expect(a).toEqual({ x: 5, y: 0 });
    expect(b).toEqual({ x: 5, y: 1 });
    expect(placeLine(7, 6)).toEqual({ x: 4, y: 1 });
  });
});
