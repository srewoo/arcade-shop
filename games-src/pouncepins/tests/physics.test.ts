import { describe, expect, it } from 'vitest';
import { makeSetup } from '../src/layout';
import { createWorld, launch, pinsDown, prepareNextBall, stepWorld } from '../src/physics';
import type { World } from '../src/worldTypes';

function run(w: World): number {
  let n = 0;
  while (!w.settled && n < 3000) { stepWorld(w, 1 / 60); n++; }
  return n;
}
const shot = (seed: number, a: number, p: number, c: number): World => {
  const w = createWorld(makeSetup(seed, false));
  launch(w, a, p, c);
  run(w);
  return w;
};

describe('physics', () => {
  it('always settles in finite time', () => {
    for (let s = 1; s < 20; s++) {
      const w = shot(s, 0.01 * s - 0.1, 0.8, s % 3);
      expect(w.settled).toBe(true);
      expect(w.t).toBeLessThan(10);
    }
  });
  it('is deterministic', () => {
    const a = shot(3, 0.01, 0.8, 1), b = shot(3, 0.01, 0.8, 1);
    expect(pinsDown(a)).toBe(pinsDown(b));
    expect(a.cats.map((c) => [c.x, c.y, c.mode])).toEqual(b.cats.map((c) => [c.x, c.y, c.mode]));
  });
  it('a straight hard shot topples most of the rack', () => {
    expect(pinsDown(shot(1, 0, 0.9, 0))).toBeGreaterThanOrEqual(6);
  });
  it('a wide shot is a gutter ball and knocks nothing', () => {
    const w = shot(1, 0.19, 0.8, 0);
    expect(w.ball.gutter).toBe(true);
    expect(pinsDown(w)).toBe(0);
  });
  it('a feeble roll stops short', () => {
    const w = shot(1, 0, 0, 0);
    expect(pinsDown(w)).toBe(0);
  });
  it('curve bends the path: opposite curves end up on opposite sides', () => {
    const left = createWorld(makeSetup(2, false)); launch(left, 0, 0.8, 3);
    const right = createWorld(makeSetup(2, false)); launch(right, 0, 0.8, -3);
    for (let i = 0; i < 40; i++) { stepWorld(left, 1 / 60); stepWorld(right, 1 / 60); }
    expect(left.ball.y).toBeGreaterThan(right.ball.y);
  });
  it('some aimed shot reaches a strike (the rack is clearable)', () => {
    let best = 0;
    for (let s = 1; s <= 6 && best < 10; s++) for (const a of [-0.02, -0.01, 0, 0.01]) for (const c of [0, 1, 2, -1]) best = Math.max(best, pinsDown(shot(s, a, 0.85, c)));
    expect(best).toBe(10);
  });
  it('shots are not all strikes (average stays in a fair band)', () => {
    let total = 0, n = 0;
    for (let s = 1; s <= 10; s++) for (const a of [-0.03, 0, 0.03]) { total += pinsDown(shot(s, a, 0.85, 0)); n++; }
    expect(total / n).toBeGreaterThan(3);
    expect(total / n).toBeLessThan(9);
  });
  it('struck cats end settled, either on their feet or in a cushion', () => {
    const w = shot(1, 0, 0.9, 0);
    for (const c of w.cats.filter((k) => k.hit)) expect(c.settled).toBe(true);
    expect(w.cats.some((c) => c.cushion)).toBe(true);
  });
  it('scaredy cats can dodge a fast ball by leaping', () => {
    const setup = { kinds: Array.from({ length: 10 }, (_, i) => (i === 0 ? 'scaredy' : 'plain')) as never, coats: [], fish: null };
    const w = createWorld({ ...setup, kinds: setup.kinds });
    (w.cats[0] as { kind: string }).kind = 'scaredy';
    launch(w, 0, 1, 0);
    run(w);
    const head = w.cats[0];
    expect(w.events.some((e) => e.type === 'scare')).toBe(true);
    expect(head?.scared).toBe(true);
  });
  it('lazy cats wobble first and fall later', () => {
    const w = createWorld({ kinds: Array.from({ length: 10 }, () => 'lazy') as never, coats: [], fish: null });
    launch(w, 0, 0.9, 0);
    let sawWobble = false;
    while (!w.settled) { stepWorld(w, 1 / 60); if (w.cats.some((c) => c.mode === 'wobble')) sawWobble = true; }
    expect(sawWobble).toBe(true);
    expect(pinsDown(w)).toBeGreaterThan(0);
  });
  it('picks up the fish when the ball rolls over it', () => {
    const w = createWorld({ kinds: [], coats: [], fish: { x: 500, y: 0 } });
    launch(w, 0, 0.8, 0);
    run(w);
    expect(w.fish?.taken).toBe(true);
  });
  it('removes knocked cats before the next ball and keeps the rest', () => {
    const w = shot(1, 0.02, 0.8, 0);
    const down = pinsDown(w);
    prepareNextBall(w);
    expect(pinsDown(w)).toBe(0);
    expect(w.cats.filter((c) => c.gone)).toHaveLength(down);
  });
});
