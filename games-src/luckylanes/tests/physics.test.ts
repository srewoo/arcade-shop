import { describe, expect, it } from 'vitest';
import { pinRadius } from '../src/collide';
import { BALL_R, DT, LANE_HALF, PIN_R, PIN_SPACING, ROW_SPACING } from '../src/constants';
import { createWorld, drainEvents, kineticEnergy, knockedCount, simulate, standingMask, stepWorld } from '../src/physics';
import { fullRack, pinSpot } from '../src/pins';
import { createRng } from '../src/rng';
import type { Shot, World } from '../src/worldTypes';

const straight: Shot = { x: 0, aim: 0, power: 0.9, spin: 0 };

function maxOverlap(w: World): number {
  let worst = 0;
  const live = w.pins.filter((p) => p.state !== 'down');
  for (let i = 0; i < live.length; i++) {
    for (let k = i + 1; k < live.length; k++) {
      const a = live[i]!;
      const b = live[k]!;
      const overlap = pinRadius(a) + pinRadius(b) - Math.hypot(a.x - b.x, a.y - b.y);
      worst = Math.max(worst, overlap);
    }
  }
  return worst;
}

function randomShot(rng: () => number, spin = (rng() * 2 - 1)): Shot {
  return { x: (rng() * 2 - 1) * 40, aim: (rng() * 2 - 1) * 0.004, power: 0.4 + rng() * 0.6, spin };
}

describe('pin layout', () => {
  it('places ten pins in a triangle with the head pin nearest', () => {
    const spots = Array.from({ length: 10 }, (_, i) => pinSpot(i));
    expect(spots[0]!.x).toBe(0);
    expect(spots[6]!.x).toBeCloseTo(-1.5 * PIN_SPACING);
    expect(spots[9]!.x).toBeCloseTo(1.5 * PIN_SPACING);
    expect(spots[6]!.y - spots[0]!.y).toBeCloseTo(3 * ROW_SPACING);
  });
  it('starts with no overlapping pins', () => {
    expect(maxOverlap(createWorld(fullRack(), straight))).toBeLessThanOrEqual(0);
  });
});

describe('physics invariants', () => {
  it('never leaves pins overlapping after resolve (random shots, every step)', () => {
    const rng = createRng(11);
    for (let n = 0; n < 12; n++) {
      const w = createWorld(fullRack(), randomShot(rng));
      while (!w.done) {
        stepWorld(w);
        expect(maxOverlap(w)).toBeLessThan(0.05);
      }
    }
  });
  it('never increases total kinetic energy without hook', () => {
    const rng = createRng(5);
    for (let n = 0; n < 10; n++) {
      const w = createWorld(fullRack(), randomShot(rng, 0));
      let prev = kineticEnergy(w);
      while (!w.done) {
        stepWorld(w);
        const e = kineticEnergy(w);
        expect(e).toBeLessThanOrEqual(prev * (1 + 1e-9) + 1e-6);
        prev = e;
      }
    }
  });
  it('is deterministic', () => {
    const a = simulate(fullRack(), { x: 3, aim: -0.002, power: 0.8, spin: 0.3 });
    const b = simulate(fullRack(), { x: 3, aim: -0.002, power: 0.8, spin: 0.3 });
    expect(standingMask(a)).toEqual(standingMask(b));
    expect(a.time).toBe(b.time);
  });
  it('always finishes with no pin still falling', () => {
    const rng = createRng(3);
    for (let n = 0; n < 8; n++) {
      const w = simulate(fullRack(), randomShot(rng));
      expect(w.done).toBe(true);
      expect(w.pins.some((p) => p.state === 'falling')).toBe(false);
    }
  });
});

describe('shots', () => {
  it('a ball down the gutter knocks nothing', () => {
    const w = simulate(fullRack(), { x: 40, aim: 0.01, power: 0.7, spin: 0 });
    expect(w.ball.inGutter).toBe(true);
    expect(Math.abs(w.ball.x)).toBeGreaterThan(LANE_HALF);
    expect(knockedCount(w)).toBe(0);
  });
  it('a gutter ball cannot hook back onto the lane', () => {
    const w = simulate(fullRack(), { x: -45, aim: -0.02, power: 0.7, spin: 1 });
    expect(w.ball.inGutter).toBe(true);
    expect(knockedCount(w)).toBe(0);
  });
  it('a high-power pocket hit can strike', () => {
    let best = 0;
    for (const aim of [-0.0045, -0.0040, -0.0035, -0.0030]) {
      best = Math.max(best, knockedCount(simulate(fullRack(), { x: 0, aim, power: 1, spin: 0 })));
    }
    expect(best).toBeGreaterThanOrEqual(9);
  });
  it('a dead-centre hit knocks at least a few pins', () => {
    expect(knockedCount(simulate(fullRack(), straight))).toBeGreaterThanOrEqual(4);
  });
  it('spin curves the ball toward its sign', () => {
    const right = simulate(Array.from({ length: 10 }, () => false), { ...straight, spin: 1 });
    const left = simulate(Array.from({ length: 10 }, () => false), { ...straight, spin: -1 });
    expect(right.ball.x).toBeGreaterThan(0);
    expect(left.ball.x).toBeLessThan(0);
  });
  it('only counts pins that were standing at the start', () => {
    const mask = fullRack().map((_, i) => i === 9);
    const w = simulate(mask, { x: 22, aim: 0.0075, power: 0.8, spin: 0 });
    expect(knockedCount(w)).toBeLessThanOrEqual(1);
  });
  it('emits impact events while pins are hit', () => {
    const w = createWorld(fullRack(), straight);
    let hits = 0;
    while (!w.done) {
      stepWorld(w);
      hits += drainEvents(w).filter((e) => e.kind === 'ballPin').length;
    }
    expect(hits).toBeGreaterThan(0);
  });
  it('uses a fixed step small enough that the ball cannot tunnel through a pin', () => {
    expect(1100 * DT).toBeLessThan(BALL_R + PIN_R);
  });
});
