import { describe, expect, it } from 'vitest';
import { burst, burstCount, confetti, createParticles, liveParticles, MAX_PARTICLES, ring, updateParticles } from '../src/particles';
import { capture, createSnapshot, interpolate, lerp } from '../src/interp';
import { createCamera, depthAt, project } from '../src/project';
import { HEAD_Y, ROW_SPACING } from '../src/constants';
import { createWorld } from '../src/physics';
import { fullRack } from '../src/pins';
import { createRng } from '../src/rng';
import { quantiseScale } from '../src/gradients';

describe('particles', () => {
  it('a strike burst is more than 25 live particles; a normal crash is fewer', () => {
    const ps = createParticles();
    burst(ps, createRng(1), 100, 100, 600, 1, true);
    expect(liveParticles(ps)).toBeGreaterThan(25);
    const small = createParticles();
    burst(small, createRng(1), 100, 100, 100, 1);
    expect(liveParticles(small)).toBeLessThan(liveParticles(ps));
  });
  it('reduced intensity cuts particles to 30% and drops rings and confetti', () => {
    const ps = createParticles(0.3);
    expect(burstCount(600, 0.3, true)).toBe(9);
    expect(burstCount(600, 1, true)).toBe(30);
    burst(ps, createRng(1), 0, 0, 600, 1, true);
    expect(liveParticles(ps)).toBe(9);
    ring(ps, 0, 0, 50, '#fff');
    expect(ps.rings.some((r) => r.active)).toBe(false);
    confetti(ps, createRng(2), 300, 300);
    expect(liveParticles(ps)).toBe(9);
  });
  it('the pool never grows and particles expire', () => {
    const ps = createParticles();
    for (let i = 0; i < 40; i++) burst(ps, createRng(i), 0, 0, 900, 1, true);
    expect(ps.items).toHaveLength(MAX_PARTICLES);
    expect(liveParticles(ps)).toBeLessThanOrEqual(MAX_PARTICLES);
    for (let t = 0; t < 4; t += 0.05) updateParticles(ps, 0.05);
    expect(liveParticles(ps)).toBe(0);
  });
  it('rings expire after their life', () => {
    const ps = createParticles();
    ring(ps, 5, 5, 40, '#fff');
    expect(ps.rings.filter((r) => r.active)).toHaveLength(1);
    updateParticles(ps, 1);
    expect(ps.rings.filter((r) => r.active)).toHaveLength(0);
  });
});

describe('render interpolation', () => {
  it('blends between the previous and current step and never touches the world', () => {
    const w = createWorld(fullRack(), { x: 0, aim: 0, power: 1, spin: 0 });
    const snap = createSnapshot();
    capture(snap, w);
    const y0 = w.ball.y;
    w.ball.y += 10;
    const v = interpolate(snap, w, 0.5);
    expect(v.ball.y).toBeCloseTo(y0 + 5);
    expect(w.ball.y).toBe(y0 + 10);
    expect(interpolate(snap, w, 1).ball).toBe(w.ball);
    expect(interpolate(createSnapshot(), w, 0.5).ball).toBe(w.ball);
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});

describe('camera', () => {
  it('keeps the foul line anchored and depth monotonic', () => {
    const cam = createCamera(500, 500);
    expect(project(cam, 0, 0, 0).sy).toBeCloseTo(430, 3);
    let prev = 0;
    for (let y = -170; y < HEAD_Y + 400; y += 50) {
      const d = depthAt(cam.y, y);
      expect(d).toBeGreaterThan(prev);
      prev = d;
    }
  });
  it('separates the four pin rows on screen (was one line)', () => {
    const cam = createCamera(500, 500);
    cam.y = HEAD_Y - 560;
    const rows = [0, 1, 2, 3].map((r) => project(cam, 0, HEAD_Y + r * ROW_SPACING, 0).sy);
    for (let i = 1; i < rows.length; i++) expect((rows[i - 1] as number) - (rows[i] as number)).toBeGreaterThan(8);
  });
  it('gradient scales are quantised so near sizes share one entry', () => {
    expect(quantiseScale(1.003)).toBe(quantiseScale(1.009));
    expect(quantiseScale(0)).toBeGreaterThan(0);
  });
});
