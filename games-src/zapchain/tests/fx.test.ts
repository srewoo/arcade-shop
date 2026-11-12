import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { isReducedMotion } from '../src/ui/appearance';
import { Particles } from '../src/render/particles';
import { Arcs } from '../src/render/arcs';
import { cellAt, computeView } from '../src/render/view';
import { countUpValue } from '../src/ui/countUp';
import { chainLabel, formatTime } from '../src/strings';
import { cueFor, zapStep } from '../src/sfxMap';
import { CUES } from '../src/audioCues';
import { createRng } from '../src/rng';

describe('reduce motion', () => {
  it('System follows the OS; On/Off override', () => {
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('system', false)).toBe(false);
    expect(isReducedMotion('on', false)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
  });
  it('particle budget drops to 40% when reduced', () => {
    const rnd = createRng(1).next;
    const full = new Particles(1), reduced = new Particles(CONFIG.fx.reducedFactor);
    for (let i = 0; i < 80; i++) { full.burst(1, 1, 8, 5, '#fff', 'spark', rnd); reduced.burst(1, 1, 8, 5, '#fff', 'spark', rnd); }
    full.update(0.01); reduced.update(0.01);
    expect(full.count).toBe(CONFIG.fx.maxParticles);
    expect(reduced.count).toBeLessThanOrEqual(Math.round(CONFIG.fx.maxParticles * CONFIG.fx.reducedFactor));
  });
  it('particles expire and the pool never grows', () => {
    const p = new Particles(1);
    p.emit('spark', 0, 0, 1, 1, 0.2, 0.05, '#fff');
    p.update(0.1);
    expect(p.count).toBe(1);
    p.update(0.2);
    expect(p.count).toBe(0);
  });
  it('arcs expire after their delay plus life', () => {
    const a = new Arcs();
    a.add(0, 0, 1, 0, 0.1, 1);
    a.update(0.05);
    expect(a.count).toBe(1);
    a.update(0.1 + CONFIG.fx.arcLifeSec);
    expect(a.count).toBe(0);
  });
});

describe('view', () => {
  const none = { top: 0, left: 0, right: 0, bottom: 0 };
  it('fits the 10 x 12 board in every layout, caps dpr at 2, keeps the board inside', () => {
    for (const [w, h, r] of [[1280, 800, { ...none, left: 250 }], [400, 860, { ...none, top: 110 }], [860, 400, { ...none, left: 180 }], [360, 640, { ...none, top: 120 }]] as const) {
      const v = computeView(w, h, 3, r);
      expect(v.dpr).toBe(2);
      expect(v.ox).toBeGreaterThanOrEqual(r.left);
      expect(v.ox + 10 * v.cs).toBeLessThanOrEqual(w);
      expect(v.oy).toBeGreaterThanOrEqual(r.top);
      expect(v.oy + 12 * v.cs).toBeLessThanOrEqual(h);
      expect(v.cs).toBeGreaterThanOrEqual(8);
    }
  });
  it('maps points to cells and ignores the feeder row and the outside', () => {
    const v = computeView(1000, 800, 1, none);
    const c = cellAt(v, v.ox + v.cs * 3.5, v.oy + v.cs * 5.5);
    expect(c).toEqual({ col: 3, row: 5 });
    expect(cellAt(v, v.ox + v.cs * 3.5, v.oy + v.cs * 0.5)).toBeNull();
    expect(cellAt(v, v.ox - 5, v.oy + v.cs * 5)).toBeNull();
    expect(cellAt(v, v.ox + v.cs * 3.5, v.oy + v.cs * 12.5)).toBeNull();
  });
});

describe('small helpers', () => {
  it('count-up eases from 0 to the target', () => {
    expect(countUpValue(1000, 0, 800)).toBe(0);
    expect(countUpValue(1000, 400, 800)).toBeGreaterThan(500);
    expect(countUpValue(1000, 900, 800)).toBe(1000);
    expect(countUpValue(0, 100, 800)).toBe(0);
  });
  it('formats the clock and chain labels', () => {
    expect(formatTime(85)).toBe('1:25');
    expect(formatTime(9.2)).toBe('0:10');
    expect(formatTime(-3)).toBe('0:00');
    expect(chainLabel(2)).toBe('');
    expect(chainLabel(5)).toBe('NICE!');
    expect(chainLabel(25)).toBe('OVERLOAD!');
  });
});

describe('sound mapping', () => {
  it('every cue the game can request exists, and zap pitch rises with chain size up to an octave', () => {
    for (const n of [2, 5, 12, 40]) expect(CUES[cueFor({ t: 'zap', kind: 1, n, points: 1, cells: [] })!.name]).toBeDefined();
    expect(zapStep(2)).toBe(0);
    expect(zapStep(6)).toBeGreaterThan(zapStep(3));
    expect(zapStep(99)).toBe(12);
  });
  it('spawn tones climb across the row; soft landings are silent', () => {
    const step = (col: number): number => cueFor({ t: 'spawn', col })!.opts!.step!;
    expect(step(0)).toBeLessThan(step(9));
    expect(cueFor({ t: 'land', col: 0, row: 3, fresh: false, speed: 3 })).toBeNull();
    expect(cueFor({ t: 'invalid', col: 0, row: 3 })?.name).toBe('invalid');
    expect(cueFor({ t: 'over', reason: 'time' })?.name).toBe('over');
  });
});
