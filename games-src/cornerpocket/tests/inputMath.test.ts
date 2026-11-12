import { describe, expect, it } from 'vitest';
import { INPUT } from '../src/config/input';
import { type Rect, rayExit, stickLength, visibleBounds } from '../src/geom';
import { grabRadius, pullMax, pullPower } from '../src/pull';
import { layoutView } from '../src/view';
import { Game } from '../src/game';

describe('slingshot pull maths', () => {
  it('gives the same power for the same finger travel on every phone-sized scale', () => {
    for (const scale of [0.4, 0.5, 0.688, 0.73]) {
      const at = (cssPx: number): number => pullPower(cssPx / scale, scale);
      expect(at(40)).toBeCloseTo(0.33, 1);
      expect(at(80)).toBeCloseTo(0.69, 1);
      expect(at(120)).toBe(1);
    }
  });
  it('keeps the original table-px range on big screens', () => {
    expect(pullPower(150 + INPUT.pullMin, 1.1)).toBe(1);
    expect(pullMax(2)).toBe(INPUT.pullMaxTable);
    expect(grabRadius(2)).toBe(INPUT.grabTable);
  });
  it('widens the grab area on phones (45 px before, 56 px now at scale 0.5)', () => {
    expect(grabRadius(0.499) * 0.499).toBeGreaterThanOrEqual(INPUT.grabScreen - 0.01);
    expect(grabRadius(0.5) * 0.5).toBeGreaterThan(90 * 0.5);
  });
  it('cancels inside the dead zone', () => {
    expect(pullPower(INPUT.pullMin - 1, 1)).toBe(0);
    expect(pullPower(INPUT.pullMin + 1, 1)).toBeGreaterThan(0);
  });
});

describe('cue stick and ray clipping', () => {
  const r: Rect = { x0: 0, y0: 0, x1: 100, y1: 50 };
  it('finds where a ray leaves a rectangle', () => {
    expect(rayExit(50, 25, 1, 0, r)).toBe(50);
    expect(rayExit(50, 25, 0, -1, r)).toBe(25);
    expect(rayExit(50, 25, -1, 0, r)).toBe(50);
    expect(rayExit(10, 10, 1, 1, r)).toBe(40);
    expect(rayExit(150, 10, 1, 0, r)).toBe(0);
  });
  it('shortens the stick so it never leaves the canvas', () => {
    const bounds: Rect = { x0: -36, y0: -36, x1: 836, y1: 436 };
    expect(stickLength(160, 200, -1, 0, bounds)).toBeLessThan(260); // cue ball at x=200 pulling left: edge is near
    expect(160 - stickLength(160, 200, -1, 0, bounds)).toBeGreaterThanOrEqual(-36);
    expect(stickLength(400, 200, -1, 0, bounds)).toBe(260);
  });
  it('derives the visible table rectangle from the view in both orientations', () => {
    for (const [w, h] of [[1000, 520], [376, 600]] as const) {
      const b = visibleBounds(layoutView(w, h), w, h);
      expect(b.x0).toBeLessThanOrEqual(-36 + 1e-6);
      expect(b.x1).toBeGreaterThanOrEqual(836 - 1e-6);
      expect(b.y0).toBeLessThanOrEqual(-36 + 1e-6);
      expect(b.y1).toBeGreaterThanOrEqual(436 - 1e-6);
    }
  });
});

describe('keyboard targeting', () => {
  it('N cycles through the legal balls and aims at each', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    const ids = g.ctl.targets();
    const seen: number[] = [];
    for (let i = 0; i < ids.length + 1; i++) {
      const id = g.aimAtNext()!;
      seen.push(id);
      const t = g.balls.find((b) => b.id === id)!;
      expect(g.angle).toBeCloseTo(Math.atan2(t.y - g.cue.y, t.x - g.cue.x), 9);
    }
    expect(new Set(seen)).toEqual(new Set(ids));
    expect(seen[0]).toBe(seen[ids.length]);
  });
  it('does nothing while rolling or paused-over', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    g.shoot({ angle: 0, power: 0.2, spin: 0 });
    expect(g.aimAtNext()).toBeNull();
  });
  it('8-ball targets exclude the 8 until the group is cleared', () => {
    const g = new Game({ mode: 'duo', level: 'easy' });
    expect(g.ctl.targets()).not.toContain(8);
  });
});
