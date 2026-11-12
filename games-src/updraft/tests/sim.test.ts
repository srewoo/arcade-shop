import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { Recorder, Replayer } from '../src/ghost';
import { FixedStepper } from '../src/loop';
import { Run } from '../src/session';
import { collides, metres, newSim, scoreOf, speedAt, stepSim } from '../src/sim';
import { World } from '../src/world';
import { hashSeed } from '../src/rng';

describe('physics', () => {
  it('rises while held and falls when released', () => {
    const w = new World(1);
    const s = newSim();
    for (let i = 0; i < 10; i++) stepSim(w, s, true);
    expect(s.y).toBeLessThan(CONFIG.world.height / 2);
    expect(s.vy).toBeLessThan(0);
    for (let i = 0; i < 15; i++) stepSim(w, s, false);
    expect(s.vy).toBeGreaterThan(-CONFIG.craft.maxVy);
    expect(s.vy).toBeGreaterThan(-200);
  });
  it('clamps vertical speed', () => {
    const w = new World(1);
    const s = newSim();
    stepSim(w, s, true);
    for (let i = 0; i < 60 && s.alive; i++) stepSim(w, s, true);
    expect(Math.abs(s.vy)).toBeLessThanOrEqual(CONFIG.craft.maxVy);
  });
  it('speed ramps up and caps', () => {
    expect(speedAt(0)).toBe(CONFIG.speed.start);
    expect(speedAt(5000)).toBeGreaterThan(speedAt(100));
    expect(speedAt(1e7)).toBe(CONFIG.speed.max);
  });
  it('is deterministic for identical inputs', () => {
    const run = (): number[] => {
      const w = new World(77); const s = newSim();
      for (let i = 0; i < 120; i++) stepSim(w, s, i % 17 < 9);
      return [s.y, s.dist, s.vy, s.tick];
    };
    expect(run()).toEqual(run());
  });
  it('does not advance after a crash', () => {
    const w = new World(1); const s = newSim();
    while (s.alive) stepSim(w, s, false);
    const snap = [s.y, s.dist, s.tick];
    stepSim(w, s, true);
    expect([s.y, s.dist, s.tick]).toEqual(snap);
  });
});

describe('collision', () => {
  it('detects walls and obstacles', () => {
    const w = new World(3);
    expect(collides(w, 100, 225)).toBe(false);
    expect(collides(w, 100, w.ceilAt(100) + 5)).toBe(true);
    expect(collides(w, 100, w.floorAt(100) - 5)).toBe(true);
    w.ensure(5000);
    const o = w.obstacles[0];
    if (!o) throw new Error('no obstacle');
    expect(collides(w, o.x + o.w / 2, (o.y0 + o.y1) / 2)).toBe(true);
  });
});

describe('coins and scoring', () => {
  it('collects each coin once and scores distance + coins', () => {
    const w = new World(4);
    const s = newSim();
    const c = w.coins[0] ?? (w.ensure(500), w.coins[0]);
    if (!c) throw new Error('no coin');
    s.dist = s.prevDist = c.x - 1;
    s.y = c.y;
    stepSim(w, s, false);
    expect(s.coinCount).toBeGreaterThanOrEqual(1);
    const n = s.coinCount;
    s.dist = c.x - 1; s.y = c.y;
    stepSim(w, s, false);
    expect(s.taken.has(c.id)).toBe(true);
    expect(s.coinCount).toBe(n);
    expect(scoreOf(s)).toBe(metres(s) + n * CONFIG.score.coinValue);
  });
});

describe('ghost replay', () => {
  it('replaying the recorded inputs reproduces the run exactly', () => {
    const run = new Run('daily-2026-11-11', null);
    for (let i = 0; i < 500 && run.step(i % 23 < 11); i++);
    const rec = run.record();
    const w = new World(hashSeed('daily-2026-11-11'));
    const ghost = newSim();
    const rep = new Replayer(rec.toggles);
    for (let t = 0; t < run.sim.tick; t++) stepSim(w, ghost, rep.holdAt(t));
    expect(ghost.dist).toBeCloseTo(run.sim.dist, 9);
    expect(ghost.y).toBeCloseTo(run.sim.y, 9);
    expect(ghost.alive).toBe(run.sim.alive);
    const withGhost = new Run('daily-2026-11-11', rec);
    for (let i = 0; i < 40 && withGhost.step(true); i++);
    expect(withGhost.ghostSim?.tick).toBeGreaterThan(0);
  });
  it('recorder logs only toggles; replayer inverts it', () => {
    const r = new Recorder();
    [false, true, true, false, false, true].forEach((h, t) => r.record(t, h));
    expect(r.toggles).toEqual([1, 3, 5]);
    const p = new Replayer(r.toggles);
    expect([0, 1, 2, 3, 4, 5].map((t) => p.holdAt(t))).toEqual([false, true, true, false, false, true]);
  });
});

describe('fixed stepper', () => {
  it('runs whole steps and exposes alpha', () => {
    const st = new FixedStepper(1 / 60, 0.25, 6);
    let n = 0;
    st.advance(1 / 60 * 2.5, () => (n++, true));
    expect(n).toBe(2);
    expect(st.alpha).toBeCloseTo(0.5, 5);
  });
  it('caps catch-up after a long stall and honours early stop', () => {
    const st = new FixedStepper(1 / 60, 0.25, 6);
    let n = 0;
    st.advance(10, () => (n++, true));
    expect(n).toBe(6);
    expect(st.alpha).toBeLessThan(1);
    n = 0;
    st.advance(1, () => (n++, false));
    expect(n).toBe(1);
  });
  it('same frame split differently gives the same step count', () => {
    const count = (frames: number[]): number => {
      const st = new FixedStepper(1 / 60, 0.25, 6);
      let n = 0;
      for (const f of frames) st.advance(f, () => (n++, true));
      return n;
    };
    expect(count(Array(60).fill(1 / 60))).toBe(count(Array(120).fill(1 / 120)));
  });
});
