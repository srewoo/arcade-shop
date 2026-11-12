import { describe, expect, it } from 'vitest';
import { MAX_AIM, START_X_LIMIT } from '../src/constants';
import { shotFromDrag } from '../src/drag';
import { back, confirm, createInput, isRolling, moveStart, shotOf, throwWith, tick, triangle } from '../src/inputFsm';

describe('input state machine', () => {
  it('walks position -> aim -> power -> spin -> rolling', () => {
    let s = createInput();
    const seen = [s.phase];
    for (let i = 0; i < 4; i++) {
      s = confirm(s);
      seen.push(s.phase);
    }
    expect(seen).toEqual(['position', 'aim', 'power', 'spin', 'rolling']);
    expect(isRolling(s)).toBe(true);
    expect(confirm(s)).toBe(s);
  });
  it('clamps the start position to the lane', () => {
    expect(moveStart(createInput(), 999).startX).toBe(START_X_LIMIT);
    expect(moveStart(createInput(), -999).startX).toBe(-START_X_LIMIT);
    expect(createInput(500).startX).toBe(START_X_LIMIT);
  });
  it('ignores movement outside the position phase', () => {
    const s = confirm(createInput(5));
    expect(moveStart(s, 10).startX).toBe(5);
  });
  it('oscillates the aim within bounds and holds it once locked', () => {
    let s = confirm(createInput());
    for (let i = 0; i < 600; i++) {
      s = tick(s, 1 / 60);
      expect(Math.abs(s.aim)).toBeLessThanOrEqual(MAX_AIM + 1e-12);
    }
    const locked = confirm(s);
    expect(tick(locked, 0.3).aim).toBe(s.aim);
  });
  it('keeps power in 0..1 and spin in -1..1 across a full cycle', () => {
    let s = confirm(confirm(createInput()));
    let sawLow = false;
    let sawHigh = false;
    for (let i = 0; i < 400; i++) {
      s = tick(s, 1 / 60);
      expect(s.power).toBeGreaterThanOrEqual(0);
      expect(s.power).toBeLessThanOrEqual(1);
      sawLow ||= s.power < 0.05;
      sawHigh ||= s.power > 0.95;
    }
    expect(sawLow && sawHigh).toBe(true);
    s = confirm(s);
    for (let i = 0; i < 400; i++) {
      s = tick(s, 1 / 60);
      expect(Math.abs(s.spin)).toBeLessThanOrEqual(1);
    }
  });
  it('can step back but not out of rolling', () => {
    expect(back(createInput()).phase).toBe('position');
    expect(back(confirm(createInput())).phase).toBe('position');
    const rolling = throwWith(createInput(), { aim: 0, power: 1, spin: 0 });
    expect(back(rolling).phase).toBe('rolling');
  });
  it('builds a shot from the locked values', () => {
    const s = throwWith(createInput(12), { aim: 5, power: 2, spin: -3 });
    expect(shotOf(s)).toEqual({ x: 12, aim: MAX_AIM, power: 1, spin: -1 });
  });
  it('triangle wave stays in [-1,1] and starts at 0', () => {
    expect(triangle(0)).toBe(0);
    expect(triangle(0.25)).toBe(1);
    expect(triangle(0.75)).toBe(-1);
    for (let c = -3; c < 3; c += 0.037) expect(Math.abs(triangle(c))).toBeLessThanOrEqual(1);
  });
});

describe('drag to throw', () => {
  const up = (dx: number, len: number) => [{ x: 200, y: 700 }, { x: 200 + dx, y: 700 - len }];
  it('ignores short or downward drags', () => {
    expect(shotFromDrag(up(0, 10), 300, 0)).toBeNull();
    expect(shotFromDrag([{ x: 0, y: 0 }, { x: 0, y: 200 }], 300, 0)).toBeNull();
    expect(shotFromDrag([{ x: 0, y: 0 }], 300, 0)).toBeNull();
  });
  it('maps length to power and clamps it', () => {
    const weak = shotFromDrag(up(0, 60), 300, 7)!;
    const strong = shotFromDrag(up(0, 5000), 300, 7)!;
    expect(weak.power).toBeLessThan(strong.power);
    expect(strong.power).toBe(1);
    expect(weak.x).toBe(7);
  });
  it('aims toward the drag direction within limits', () => {
    expect(shotFromDrag(up(60, 200), 300, 0)!.aim).toBeGreaterThan(0);
    expect(shotFromDrag(up(-60, 200), 300, 0)!.aim).toBeLessThan(0);
    expect(shotFromDrag(up(9000, 200), 300, 0)!.aim).toBeCloseTo(MAX_AIM);
  });
  it('turns a bowed path into spin', () => {
    const bowRight = [{ x: 200, y: 700 }, { x: 260, y: 600 }, { x: 200, y: 500 }];
    const bowLeft = [{ x: 200, y: 700 }, { x: 140, y: 600 }, { x: 200, y: 500 }];
    expect(shotFromDrag(bowRight, 300, 0)!.spin).toBeLessThan(0);
    expect(shotFromDrag(bowLeft, 300, 0)!.spin).toBeGreaterThan(0);
    expect(shotFromDrag(up(0, 200), 300, 0)!.spin).toBe(0);
  });
});
