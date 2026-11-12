import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { previewPath } from '../src/preview';
import { makeCamera } from '../src/render/camera';
import { catPose } from '../src/render/pose';
import { makeSetup } from '../src/layout';
import { createWorld, launch, stepWorld } from '../src/physics';
import { isReducedMotion } from '../src/ui/appearance';
import { arrowSpeedLabel, curveLabel } from '../src/ui/controls';
import { createMatch } from '../src/match';

describe('camera', () => {
  it('lays the lane out horizontally on wide canvases and vertically on tall ones', () => {
    const wide = makeCamera(1200, 500), tall = makeCamera(400, 520);
    expect(wide.portrait).toBe(false);
    expect(tall.portrait).toBe(true);
    expect(wide.project(1000, 0).x).toBeGreaterThan(wide.project(0, 0).x);
    expect(tall.project(1000, 0).y).toBeLessThan(tall.project(0, 0).y);
  });
  it('keeps the whole lane and rack inside the canvas', () => {
    for (const [w, h] of [[1200, 480], [400, 520], [560, 190], [320, 420]] as const) {
      const cam = makeCamera(w, h);
      for (const [x, y] of [[0, -CONFIG.lane.gutterHalf], [CONFIG.lane.endX, CONFIG.lane.gutterHalf], [CONFIG.lane.pinX + 3 * CONFIG.lane.rowGap, 0]] as const) {
        const p = cam.project(x, y);
        expect(p.x, `${w}x${h}`).toBeGreaterThanOrEqual(0);
        expect(p.x, `${w}x${h}`).toBeLessThanOrEqual(w);
        expect(p.y, `${w}x${h}`).toBeGreaterThanOrEqual(0);
        expect(p.y, `${w}x${h}`).toBeLessThanOrEqual(h);
      }
    }
  });
  it('projects z upwards', () => {
    const cam = makeCamera(1200, 500);
    expect(cam.project(500, 0, 30).y).toBeLessThan(cam.project(500, 0, 0).y);
  });
});

describe('ghost path', () => {
  it('goes straight with no curve and bends with curve', () => {
    const straight = previewPath(0, 0, 0.7, 640);
    expect(straight.every((p) => p.y === 0)).toBe(true);
    const bent = previewPath(0, 2, 0.7, 640);
    expect(Math.abs(bent.at(-1)?.y ?? 0)).toBeGreaterThan(5);
    expect(previewPath(0, -2, 0.7, 640).at(-1)?.y ?? 0).toBeLessThan(0);
    expect(bent.at(-1)?.x ?? 0).toBeGreaterThanOrEqual(640);
  });
});

describe('cat pose', () => {
  it('walks stand -> tumble -> landed for a struck cat and lands upright', () => {
    const w = createWorld(makeSetup(1, false));
    launch(w, 0, 0.9, 0);
    const seen = new Set<string>();
    let maxZ = 0;
    while (!w.settled) { stepWorld(w, 1 / 60); for (const c of w.cats) { const p = catPose(c); seen.add(p.name); maxZ = Math.max(maxZ, p.z); } }
    expect(seen.has('stand')).toBe(true);
    expect(seen.has('tumble')).toBe(true);
    expect(maxZ).toBeGreaterThan(5);
    for (const c of w.cats.filter((k) => k.hit)) {
      for (let i = 0; i < 90; i++) c.t += 1 / 60;
      const p = catPose(c);
      expect(['landed', 'cushion']).toContain(p.name);
      expect(Math.abs(p.rot)).toBeLessThan(0.01);
    }
  });
  it('finishes the landing animation after the lane settles', () => {
    const w = createWorld(makeSetup(1, false));
    launch(w, 0, 0.9, 0);
    while (!w.settled) stepWorld(w, 1 / 60);
    for (let i = 0; i < 60; i++) stepWorld(w, 1 / 60);
    for (const c of w.cats.filter((k) => k.hit)) expect(Math.abs(catPose(c).rot)).toBeLessThan(0.01);
  });
  it('hides cats removed from play', () => {
    const w = createWorld(makeSetup(1, false));
    const c = w.cats[0]!;
    c.gone = true;
    expect(catPose(c).name).toBe('gone');
  });
});

describe('ui helpers', () => {
  it('resolves reduce-motion from setting and system preference', () => {
    expect(isReducedMotion('on', false)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('system', false)).toBe(false);
  });
  it('labels curve and arrow speed (never colour-only)', () => {
    expect(curveLabel(0)).toBe('Straight');
    expect(curveLabel(-2)).toContain('left');
    expect(curveLabel(3)).toContain('●●●');
    const m = createMatch({ players: 1, difficulty: 'normal', seed: 3 });
    expect(arrowSpeedLabel(m)).toMatch(/arrow/);
  });
});
