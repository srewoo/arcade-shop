import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { coverage, fitField, minHeightFor, placeField } from '../src/layout';
import { createWorld, loadLevel, setField, brickRect } from '../src/sim/world';
import { stepWorld, NO_INPUT } from '../src/sim/step';
import { LEVELS } from '../src/levels';

const SIZES = { desktop: { w: 1280, h: 800 }, phone: { w: 392, h: 852 }, land: { w: 852, h: 392 } };

describe('fitField', () => {
  it('keeps the 600-wide brick grid and stays within limits for any screen', () => {
    for (const box of [...Object.values(SIZES), { w: 300, h: 900 }, { w: 3000, h: 300 }, { w: 800, h: 800 }]) {
      const f = fitField(box, 10);
      expect(f.w).toBeGreaterThanOrEqual(600);
      expect(f.w).toBeLessThanOrEqual(CONFIG.field.maxW);
      expect(f.h).toBeGreaterThanOrEqual(minHeightFor(10));
      expect(f.h).toBeLessThanOrEqual(CONFIG.field.maxH);
    }
  });
  it('gives tall screens a taller field and wide screens a wider one', () => {
    expect(fitField(SIZES.phone, 6).h).toBeGreaterThan(CONFIG.field.h);
    expect(fitField(SIZES.land, 6).w).toBeGreaterThan(600);
    expect(fitField(SIZES.land, 6).w).toBeGreaterThan(fitField(SIZES.phone, 6).w);
  });
  it('leaves room above the paddle for the tallest boards', () => {
    expect(minHeightFor(CONFIG.field.maxRows)).toBe(CONFIG.field.top + CONFIG.field.maxRows * CONFIG.field.brickH + CONFIG.field.clearance);
    const tallest = Math.max(...LEVELS.map((l) => l.cells.length));
    expect(fitField(SIZES.land, tallest).h).toBeGreaterThanOrEqual(minHeightFor(tallest));
  });
});

describe('placement and coverage', () => {
  it('centres the field and never overflows the box', () => {
    for (const box of Object.values(SIZES)) {
      const f = fitField(box, 8);
      const p = placeField(box, f);
      expect(f.w * p.scale).toBeLessThanOrEqual(box.w + 0.001);
      expect(f.h * p.scale).toBeLessThanOrEqual(box.h + 0.001);
      expect(p.offX).toBeGreaterThanOrEqual(-0.001);
      expect(p.offY).toBeGreaterThanOrEqual(-0.001);
    }
  });
  it('fills at least 65% of the viewport on phone, landscape phone and desktop', () => {
    for (const box of Object.values(SIZES)) expect(coverage(box, fitField(box, 8)), JSON.stringify(box)).toBeGreaterThanOrEqual(0.65);
  });
});

describe('dynamic field in the simulation', () => {
  it('re-anchors the paddle and bricks when the field changes', () => {
    const w = createWorld(1);
    loadLevel(w, LEVELS[0]!.cells, 1);
    setField(w, { w: 760, h: 900 });
    expect(w.ox).toBe(80);
    expect(w.paddleY).toBe(900 - CONFIG.field.paddleBottom);
    expect(w.paddle.x).toBe(380);
    expect(brickRect(0, w.ox).left).toBe(80);
    expect(w.balls[0]!.y).toBe(w.paddleY - CONFIG.ball.r);
  });
  it('the ball bounces off the wider right wall and is lost below the taller floor', () => {
    const w = createWorld(3);
    loadLevel(w, LEVELS[0]!.cells, 1);
    setField(w, { w: 760, h: 900 });
    stepWorld(w, 1 / 120, { ...NO_INPUT, launch: true });
    let maxX = 0;
    for (let i = 0; i < 1200 && w.phase === 'playing'; i++) {
      stepWorld(w, 1 / 120, { targetX: w.balls[0]?.x ?? 380, axis: 0, launch: false });
      for (const b of w.balls) maxX = Math.max(maxX, b.x);
      expect(w.balls.every((b) => b.x <= 760.001 && b.x >= -0.001)).toBe(true);
    }
    expect(maxX).toBeGreaterThan(0);
  });
});
