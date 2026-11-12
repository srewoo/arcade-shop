import { describe, expect, it } from 'vitest';
import { isSkippable, Pacing, waitScale, type Stage } from '../src/turnFlow';
import { TUNING } from '../src/tuning';

describe('turn flow waits', () => {
  it('only the non-physics waits can be skipped', () => {
    const stages: Stage[] = ['ready', 'cpu', 'rolling', 'settle', 'sweep', 'banner', 'over'];
    expect(stages.filter(isSkippable)).toEqual(['cpu', 'settle', 'sweep', 'banner']);
  });
  it('physics never fast-forwards', () => {
    expect(waitScale('rolling', true, true)).toBe(1);
    expect(waitScale('ready', true, true)).toBe(1);
  });
  it('skip and fast CPU turns speed up waits by the tuned factor', () => {
    expect(waitScale('banner', false, false)).toBe(1);
    expect(waitScale('banner', true, false)).toBe(TUNING.timing.fastForward);
    expect(waitScale('settle', false, true)).toBe(TUNING.timing.fastForward);
  });
  it('Pacing: a skip request lasts until reset and is idempotent', () => {
    const p = new Pacing();
    expect(p.request('rolling')).toBe(false);
    expect(p.request('banner')).toBe(true);
    expect(p.request('banner')).toBe(false);
    expect(p.scale('sweep')).toBe(TUNING.timing.fastForward);
    p.reset();
    expect(p.scale('sweep')).toBe(1);
  });
  it('Pacing: fast CPU turns cover the think time and the frame the CPU threw, not human turns', () => {
    const p = new Pacing();
    p.fastCpu = true;
    expect(p.scale('cpu')).toBe(TUNING.timing.fastForward);
    p.noteThrow(true);
    expect(p.scale('banner')).toBe(TUNING.timing.fastForward);
    p.noteThrow(false);
    expect(p.scale('banner')).toBe(1);
    expect(p.scale('ready')).toBe(1);
  });
});
