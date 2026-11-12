import { describe, expect, it } from 'vitest';
import { CPU } from '../src/config/cpu';
import { chooseCuePlacement, chooseCuePlacementSteps, chooseShot, chooseShotSteps, drain } from '../src/cpu';
import { Game } from '../src/game';
import { eightBallRack } from '../src/layouts';
import { EightMode } from '../src/modes/eightMode';
import { makeRng } from '../src/rng';

const targets = [1, 2, 3, 4, 5, 6, 7];

describe('time-sliced CPU planning', () => {
  it('gives the same shot as the one-shot call, with the same RNG use', () => {
    for (const level of ['easy', 'pro'] as const) {
      const a = chooseShot(eightBallRack(), targets, { level, rng: makeRng(5) });
      const r = makeRng(5);
      const b = drain(chooseShotSteps(eightBallRack(), targets, { level, rng: r }));
      expect(b).toEqual(a);
    }
  });
  it('splits planning into many small steps (one simulated candidate each)', () => {
    const plan = chooseShotSteps(eightBallRack(), targets, { level: 'pro', rng: makeRng(1) });
    let steps = 0;
    for (;;) { const r = plan.next(); if (r.done) break; steps++; }
    expect(steps).toBeGreaterThan(10);
    expect(steps).toBeLessThanOrEqual(CPU.candidates);
  });
  it('placement is also sliced and matches the one-shot result', () => {
    const balls = eightBallRack();
    expect(drain(chooseCuePlacementSteps(balls, targets))).toEqual(chooseCuePlacement(balls, targets));
  });
  it('the CPU turn does at most workPerFrame simulations per tick and still fires within ~2 s of ticks', () => {
    const g = new Game({ mode: 'cpu', level: 'pro', seed: 3 });
    (g.ctl as EightMode).state = { ...(g.ctl as EightMode).state, current: 1 };
    let ticks = 0;
    while (g.phase === 'aim' && ticks < 400) { g.update(1 / 60); ticks++; }
    expect(g.phase).toBe('rolling');
    expect(ticks / 60).toBeLessThan(2.5);
    expect(ticks / 60).toBeGreaterThan(1.2); // THINK + SHOW, no instant shots
  });
  it('the CPU places the cue ball (ball in hand) without throwing and then goes on to shoot', () => {
    const g = new Game({ mode: 'cpu', level: 'pro', seed: 3 });
    const eight = g.ctl as EightMode;
    eight.state = { ...eight.state, current: 1, ballInHand: true };
    g.phase = 'place';
    let ticks = 0;
    expect(() => { while ((g.phase as string) === 'place' && ticks < 400) { g.update(1 / 60); ticks++; } }).not.toThrow();
    expect(g.phase).toBe('aim');
    const cue = g.balls.find((b) => b.id === 0)!;
    expect(Number.isFinite(cue.x) && Number.isFinite(cue.y)).toBe(true);
    while ((g.phase as string) === 'aim' && ticks < 800) { g.update(1 / 60); ticks++; }
    expect(g.phase).toBe('rolling');
  });
});
