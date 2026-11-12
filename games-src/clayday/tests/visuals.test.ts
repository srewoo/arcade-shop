import { describe, expect, it } from 'vitest';
import { countUp, clampLabelX, clampLabelY, scatterInDisc, starsFor, tierFor, trailPoints } from '../src/visuals';
import { shouldShowHint } from '../src/ui/hint';
import { Fx } from '../src/fx';
import { CONFIG } from '../src/config';

describe('clampLabelX (clipped "Double! +37" fix)', () => {
  it('leaves a label that already fits', () => {
    expect(clampLabelX(200, 80, 0, 400, 6)).toBe(200);
  });
  it('pulls a right-edge label fully inside with a margin', () => {
    const x = clampLabelX(395, 120, 0, 400, 6);
    expect(x + 60).toBeLessThanOrEqual(394);
  });
  it('pulls a left-edge label fully inside', () => {
    const x = clampLabelX(-10, 120, 0, 400, 6);
    expect(x - 60).toBeGreaterThanOrEqual(6);
  });
  it('centres when the label is wider than the view', () => {
    expect(clampLabelX(5, 500, 0, 400, 6)).toBe(200);
  });
  it('keeps the baseline below the top edge', () => {
    expect(clampLabelY(-5, 24, 0, 4)).toBe(28);
    expect(clampLabelY(300, 24, 0, 4)).toBe(300);
  });
});

describe('pellet scatter and trail', () => {
  it('stays inside the spread disc', () => {
    let i = 0;
    const seq = [0.1, 0.99, 0.5, 0.5, 0.9, 0.2, 0.3, 0.7];
    const rand = (): number => seq[i++ % seq.length]!;
    for (const p of scatterInDisc(40, 15, rand)) expect(Math.hypot(p.dx, p.dy)).toBeLessThanOrEqual(15 + 1e-9);
  });
  it('trail runs backwards along the velocity and fades', () => {
    const t = trailPoints(100, 100, 50, -20, 3, 0.1);
    expect(t).toHaveLength(3);
    expect(t[0]).toMatchObject({ x: 95, y: 102 });
    expect(t[0]!.k).toBeGreaterThan(t[2]!.k);
  });
});

describe('results payoff', () => {
  it('maps ratings to stars and tiers', () => {
    expect(starsFor('perfect')).toBe(5);
    expect(starsFor('bystander')).toBe(0);
    expect(tierFor('ace')).toBe('gold');
    expect(tierFor('marksman')).toBe('silver');
    expect(tierFor('novice')).toBe('bronze');
    expect(tierFor('bystander')).toBe('plain');
  });
  it('counts up monotonically and lands on the target', () => {
    let prev = -1;
    for (let t = 0; t <= 700; t += 50) {
      const v = countUp(20, t, 700);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(countUp(20, 700, 700)).toBe(20);
    expect(countUp(20, 0, 0)).toBe(20);
  });
});

describe('first-run hint flag', () => {
  const mem = (seen: boolean): Pick<Storage, 'getItem' | 'setItem'> & { v: string | null } => {
    const o = { v: seen ? '1' : null, getItem: () => o.v, setItem: (_k: string, val: string) => void (o.v = val) };
    return o;
  };
  it('shows once, then never again', () => {
    const s = mem(false);
    expect(shouldShowHint(s)).toBe(true);
    expect(shouldShowHint(s)).toBe(false);
  });
  it('shows when storage is missing or throws', () => {
    expect(shouldShowHint(null)).toBe(true);
    expect(shouldShowHint({ getItem: () => { throw new Error('blocked'); }, setItem: () => undefined })).toBe(true);
  });
});

describe('Fx muzzle flash and recoil', () => {
  it('flash and full recoil on a normal shot', () => {
    const fx = new Fx();
    fx.shot(10, 10);
    expect(fx.flashAmount).toBe(1);
    expect(fx.recoilAmount).toBe(1);
  });
  it('Reduce motion: no flash, smaller recoil, fewer particles', () => {
    const full = new Fx();
    const calm = new Fx();
    calm.reduced = true;
    full.shot(0, 0);
    calm.shot(0, 0);
    expect(calm.flashAmount).toBe(0);
    expect(calm.recoilAmount).toBeCloseTo(CONFIG.fx.reducedFactor);
    expect(calm.recoilAmount).toBeLessThan(full.recoilAmount);
  });
  it('flash decays to zero', () => {
    const fx = new Fx();
    fx.shot(0, 0);
    fx.update(CONFIG.fx.flashMs / 1000 + 0.01);
    expect(fx.flashAmount).toBe(0);
  });
});
