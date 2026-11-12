import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { Fx, scaledCount } from '../src/render/fx';

describe('Fx', () => {
  it('keeps at most CONFIG.fx.skidMarks tyre segments and clear() drops them', () => {
    const fx = new Fx();
    for (let i = 0; i < CONFIG.fx.skidMarks + 40; i++) fx.skid(i, 0, i + 0.2, 0);
    const marks = (fx as unknown as { skids: unknown[] }).skids;
    expect(marks.length).toBe(CONFIG.fx.skidMarks);
    fx.clear();
    expect((fx as unknown as { skids: unknown[] }).skids.length).toBe(0);
  });
  it('Reduce motion trims particle counts to 40% and disables shake', () => {
    expect(scaledCount(50, true)).toBe(20);
    const fx = new Fx();
    fx.reduced = true;
    fx.burst(0, 0, 3);
    expect(fx.shake()).toEqual({ x: 0, y: 0 });
    const parts = (fx as unknown as { sparks: unknown[] }).sparks.length;
    const full = new Fx();
    full.burst(0, 0, 3);
    expect(parts).toBeLessThan((full as unknown as { sparks: unknown[] }).sparks.length * 0.5);
  });
  it('particles die out', () => {
    const fx = new Fx();
    fx.confetti(0, 0);
    for (let i = 0; i < 200; i++) fx.update(0.02);
    expect((fx as unknown as { sparks: unknown[] }).sparks.length).toBe(0);
  });
});
