import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { Fx } from '../src/fx';

const parts = (fx: Fx): { kind: string; rot: number }[] => (fx as unknown as { parts: { kind: string; rot: number }[] }).parts;

describe('Fx particles', () => {
  it('a broken clay throws shards plus a ring; a gold clay adds stars', () => {
    const fx = new Fx();
    fx.breakClay(10, 10, 'std');
    expect(parts(fx).filter((p) => p.kind === 'frag').length).toBe(CONFIG.fx.fragments);
    expect(parts(fx).some((p) => p.kind === 'ring')).toBe(true);
    expect(parts(fx).some((p) => p.kind === 'star')).toBe(false);
    const gold = new Fx();
    gold.breakClay(10, 10, 'gold');
    expect(parts(gold).some((p) => p.kind === 'star')).toBe(true);
  });
  it('Reduce motion trims shard and star counts', () => {
    const full = new Fx();
    full.breakClay(0, 0, 'gold');
    const reduced = new Fx();
    reduced.reduced = true;
    reduced.breakClay(0, 0, 'gold');
    expect(parts(reduced).length).toBeLessThan(parts(full).length);
  });
  it('shards tumble while they live and everything expires', () => {
    const fx = new Fx();
    fx.breakClay(0, 0, 'std');
    const before = parts(fx).filter((p) => p.kind === 'frag').map((p) => p.rot);
    fx.update(0.05);
    const after = parts(fx).filter((p) => p.kind === 'frag').map((p) => p.rot);
    expect(after).not.toEqual(before);
    for (let i = 0; i < 100; i++) fx.update(0.05);
    expect(parts(fx).length).toBe(0);
  });
});
