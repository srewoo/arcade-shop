import { describe, expect, it } from 'vitest';
import { createDas, msToFrames, stepDas } from '../src/core/das';

const run = (frames: number, l: boolean, r: boolean, das: number, arr: number, s = createDas()) =>
  Array.from({ length: frames }, () => stepDas(s, l, r, das, arr));

describe('DAS / ARR', () => {
  it('moves once immediately, waits DAS, then repeats every ARR', () => {
    const out = run(14, true, false, 6, 2);
    expect(out[0]).toBe(-1);
    expect(out.slice(1, 6).every((v) => v === 0)).toBe(true);
    const moves = out.map((v, i) => (v ? i : -1)).filter((i) => i > 0);
    expect(moves).toEqual([6, 8, 10, 12]);
  });
  it('ARR 0 slams to the wall', () => {
    const out = run(8, false, true, 3, 0);
    expect(out[0]).toBe(1);
    expect(out.some((v) => v >= 10)).toBe(true);
  });
  it('releasing stops repeats; the other direction takes over', () => {
    const s = createDas();
    run(10, true, false, 4, 1, s);
    expect(stepDas(s, false, false, 4, 1)).toBe(0);
    expect(stepDas(s, false, true, 4, 1)).toBe(1);
  });
  it('configurable ms converts to 60 Hz frames', () => {
    expect(msToFrames(167)).toBe(10);
    expect(msToFrames(0)).toBe(0);
    expect(msToFrames(1000)).toBe(60);
  });
});
