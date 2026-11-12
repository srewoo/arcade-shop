import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { ALL_HOLES } from '../src/course';
import { oval, rect } from '../src/course/helpers';
import { insidePolys } from '../src/physics/geometry';
import { Sim } from '../src/physics/sim';
import { rng } from '../src/render/rng';
import { box } from './helpers';

function roll(sim: Sim, maxSteps = 6000): number {
  let n = 0;
  while (sim.state === 'rolling' && n++ < maxSteps) sim.step();
  return n;
}

describe('ball physics', () => {
  it('is deterministic: the same shot gives bit-identical results', () => {
    const run = (): number[] => {
      const s = new Sim(ALL_HOLES[12] as never);
      s.strike(0.37, 0.8); roll(s);
      return [s.ball.x, s.ball.y, s.tick];
    };
    expect(run()).toEqual(run());
  });

  it('rolls to rest with friction (distance close to v^2 / 2a)', () => {
    const s = new Sim(box());
    s.strike(0, 0.4);
    const v = 0.4 * CONFIG.shot.maxSpeed;
    roll(s);
    expect(s.state).toBe('idle');
    const d = s.ball.x - 100;
    const ideal = (v * v) / (2 * CONFIG.friction.grass);
    expect(d).toBeGreaterThan(ideal * 0.6);
    expect(d).toBeLessThan(ideal * 1.05);
    expect(s.events.some((e) => e.type === 'rest')).toBe(true);
  });

  it('sand stops the ball much sooner than grass', () => {
    const grass = new Sim(box());
    const sand = new Sim(box({ sand: [{ shape: rect(60, 100, 680, 300) }] }));
    for (const s of [grass, sand]) { s.strike(0, 0.5); roll(s); }
    expect(sand.ball.x - 100).toBeLessThan((grass.ball.x - 100) * 0.4);
    expect(sand.events.some((e) => e.type === 'sand')).toBe(true);
  });

  it('bounces off a wall, losing some speed', () => {
    const s = new Sim(box({ tee: { x: 700, y: 250 }, cup: { x: 150, y: 150 } }));
    s.strike(0, 0.6);
    let bounced = false;
    for (let i = 0; i < 400 && !bounced; i++) { s.step(); bounced = s.ball.vx < 0; }
    expect(bounced).toBe(true);
    expect(Math.abs(s.ball.vx)).toBeLessThan(0.6 * CONFIG.shot.maxSpeed);
    expect(s.events.some((e) => e.type === 'wall')).toBe(true);
  });

  it('a slope bends the path of a rolling ball', () => {
    const flat = new Sim(box());
    const ramp = new Sim(box({ slopes: [{ shape: rect(200, 100, 300, 300), ax: 0, ay: 190 }] }));
    for (const s of [flat, ramp]) { s.strike(0, 0.7); roll(s); }
    expect(Math.abs(flat.ball.y - 250)).toBeLessThan(0.5);
    expect(ramp.ball.y).toBeGreaterThan(260);
  });

  it('a ball resting on a gentle slope stays put', () => {
    const s = new Sim(box({ slopes: [{ shape: rect(60, 100, 680, 300), ax: 0, ay: 190 }] }));
    s.strike(0, 0.1); roll(s);
    const y = s.ball.y;
    for (let i = 0; i < 600; i++) s.step();
    expect(s.state).toBe('idle');
    expect(s.ball.y).toBe(y);
  });

  it('water ends the roll with a splash and place() returns the ball to its last spot', () => {
    const s = new Sim(box({ hazards: [{ kind: 'water', shape: rect(300, 100, 100, 300) }] }));
    s.strike(0, 0.7); roll(s);
    expect(s.state).toBe('water');
    expect(s.events.find((e) => e.type === 'splash')).toBeTruthy();
    s.place(s.lastSpot);
    expect(s.state).toBe('idle');
    expect(s.ball.x).toBe(100);
  });

  it('sinks a slow ball over the cup but skips a fast one', () => {
    const slow = new Sim(box({ cup: { x: 250, y: 250 } }));
    slow.strike(0, 0.5); roll(slow);
    expect(slow.state).toBe('sunk');
    const fast = new Sim(box({ cup: { x: 250, y: 250 } }));
    fast.strike(0, 1); roll(fast);
    expect(fast.state).not.toBe('sunk');
  });

  it('refuses strikes while rolling and tiny taps', () => {
    const s = new Sim(box());
    expect(s.strike(0, 0.01)).toBe(false);
    expect(s.strike(0, 0.5)).toBe(true);
    expect(s.strike(1, 0.5)).toBe(false);
  });

  it('clone() is independent of the original', () => {
    const s = new Sim(box());
    const c = s.clone();
    c.strike(0, 1); roll(c);
    expect(s.ball.x).toBe(100);
    expect(s.state).toBe('idle');
  });

  it('a sliding gate knocks a resting ball and can block a shot', () => {
    const hole = box({ movers: [{ kind: 'slide', cx: 300, cy: 250, w: 22, h: 200, axis: 'y', amp: 0, period: 3, phase: 0 }] });
    const s = new Sim(hole);
    s.strike(0, 0.9); roll(s);
    expect(s.ball.x).toBeLessThan(300);
    expect(s.events.some((e) => e.type === 'mover')).toBe(true);
  });

  it('a spinner sweeping into a resting ball sets it moving', () => {
    const hole = box({ tee: { x: 400, y: 250 }, movers: [{ kind: 'spin', cx: 400, cy: 250, len: 120, thick: 10, omega: 2, phase: 0 }], cup: { x: 700, y: 120 } });
    const s = new Sim(hole);
    s.ball.x = s.ball.px = 440; s.ball.y = s.ball.py = 250;
    for (let i = 0; i < 400; i++) s.step();
    expect(s.events.some((e) => e.type === 'mover')).toBe(true);
  });

  it('never tunnels through walls, posts or movers on any hole (random shots)', () => {
    const r = rng(7);
    for (const hole of ALL_HOLES) {
      for (let k = 0; k < 6; k++) {
        const s = new Sim(hole);
        s.strike(r() * Math.PI * 2, 0.5 + r() * 0.5);
        for (let i = 0; i < 2400 && s.state === 'rolling'; i++) {
          s.step();
          if ((s.state as string) === 'water') break;
          expect(insidePolys(s.ball.x, s.ball.y, hole.walls)).toBe(true);
        }
      }
    }
  });

  it('keeps the ball out of posts', () => {
    const hole = box({ posts: [{ x: 300, y: 250, r: 20 }] });
    const s = new Sim(hole);
    for (let i = 0; i < 1; i++) { s.strike(0, 0.8); }
    for (let i = 0; i < 1200 && s.state === 'rolling'; i++) {
      s.step();
      expect(Math.hypot(s.ball.x - 300, s.ball.y - 250)).toBeGreaterThanOrEqual(20 + CONFIG.ball.r - 0.01);
    }
  });

  it('void hazards also penalise', () => {
    const s = new Sim(box({ hazards: [{ kind: 'void', shape: oval(300, 250, 40, 60) }] }));
    s.strike(0, 0.7); roll(s);
    expect(s.state).toBe('water');
  });
});
