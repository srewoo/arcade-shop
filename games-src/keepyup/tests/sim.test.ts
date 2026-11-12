import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { Sim, type SimEvent } from '../src/sim';

const W = 600;
function run(sim: Sim, secs: number): void { for (let i = 0; i < secs * 120; i++) sim.step(1 / 120); }

/** Tap each ball whenever it falls low: a deterministic bot. */
function bot(sim: Sim, secs: number): void {
  for (let i = 0; i < secs * 120 && !sim.over; i++) {
    sim.step(1 / 120);
    for (const b of sim.balls) if (b.active && b.vy > 0 && b.y > 330) sim.tap(b.x, b.y + CONFIG.ball.radius * 0.5);
  }
}

describe('sim', () => {
  it('does nothing until the first tap', () => {
    const s = new Sim('classic', 1, W);
    run(s, 2);
    expect(s.time).toBe(0);
    expect(s.over).toBe(false);
  });
  it('a ball left alone hits the ground: miss ends the rally', () => {
    const ev: SimEvent[] = [];
    const s = new Sim('classic', 1, W, (e) => ev.push(e));
    s.tap(0, 0); // whiff starts the rally
    run(s, 5);
    expect(s.over).toBe(true);
    expect(ev.some((e) => e.t === 'whiff')).toBe(true);
    expect(ev.filter((e) => e.t === 'miss')).toHaveLength(1);
    expect(s.score).toBe(0);
  });
  it('each successful hit scores one and a miss tap does not', () => {
    const s = new Sim('classic', 1, W);
    const b = s.balls[0]!;
    expect(s.tap(b.x, b.y)).toBe(true);
    expect(s.score).toBe(1);
    expect(s.tap(b.x + 500, b.y + 500)).toBe(false);
    expect(s.score).toBe(1);
  });
  it('a taps-only bot keeps the rally going, and runs are deterministic', () => {
    const a = new Sim('classic', 9, W); a.tap(a.balls[0]!.x, a.balls[0]!.y); bot(a, 20);
    const b = new Sim('classic', 9, W); b.tap(b.balls[0]!.x, b.balls[0]!.y); bot(b, 20);
    expect(a.score).toBeGreaterThan(5);
    expect(a.score).toBe(b.score);
    expect(a.balls[0]!.x).toBe(b.balls[0]!.x);
  });
  it('emits a tier event when the milestone is crossed', () => {
    const ev: SimEvent[] = [];
    const s = new Sim('classic', 1, W, (e) => ev.push(e));
    s.balls[0]!.y = 100;
    for (let i = 0; i < 10; i++) { s.balls[0]!.vy = 0; s.tap(s.balls[0]!.x, s.balls[0]!.y); }
    expect(s.score).toBe(10);
    expect(ev.filter((e) => e.t === 'tier')).toHaveLength(1);
  });
  it('gravity grows with rally time', () => {
    const s = new Sim('classic', 1, W);
    const g0 = s.gravity;
    s.tap(s.balls[0]!.x, s.balls[0]!.y);
    s.balls[0]!.y = -5000; s.balls[0]!.vy = -1;
    run(s, 10);
    expect(s.gravity).toBeGreaterThan(g0);
  });
  it('setWidth recentres a waiting ball and pulls a flying ball back inside the walls', () => {
    const idle = new Sim('classic', 1, 900);
    idle.setWidth(400);
    expect(idle.balls[0]!.x).toBe(200);
    const live = new Sim('classic', 1, 900);
    live.tap(0, 0);
    live.balls[0]!.x = 880;
    live.setWidth(400);
    expect(live.balls[0]!.x).toBe(400 - CONFIG.ball.radius);
  });
});

describe('two balls', () => {
  it('spawns the second ball after the delay and either miss ends the rally', () => {
    const ev: SimEvent[] = [];
    const s = new Sim('twoballs', 3, W, (e) => ev.push(e));
    expect(s.balls[1]!.active).toBe(false);
    s.tap(s.balls[0]!.x, s.balls[0]!.y);
    s.balls[0]!.y = -9000; s.balls[0]!.vy = 0;
    run(s, CONFIG.twoBalls.secondDelay + 0.2);
    expect(s.balls[1]!.active).toBe(true);
    expect(ev.some((e) => e.t === 'spawn')).toBe(true);
    run(s, 6);
    expect(s.over).toBe(true);
  });
});

describe('windy', () => {
  it('only the windy mode has wind, and it is repeatable by seed', () => {
    const sample = (mode: 'classic' | 'windy', seed: number): number[] => {
      const s = new Sim(mode, seed, W);
      s.tap(0, 0); s.balls[0]!.y = -99999; s.balls[0]!.vy = 0;
      const out: number[] = [];
      for (let i = 0; i < 120 * 20; i++) { s.balls[0]!.y = -99999; s.balls[0]!.vy = 0; s.step(1 / 120); if (i % 120 === 0) out.push(s.windNow); }
      return out;
    };
    expect(sample('classic', 4).every((v) => v === 0)).toBe(true);
    const w1 = sample('windy', 4);
    expect(w1.some((v) => v !== 0)).toBe(true);
    expect(w1).toEqual(sample('windy', 4));
    expect(Math.max(...w1.map(Math.abs))).toBeLessThanOrEqual(CONFIG.wind.forceMax);
  });
});
