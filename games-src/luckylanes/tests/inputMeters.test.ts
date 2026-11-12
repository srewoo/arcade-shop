import { describe, expect, it } from 'vitest';
import { MAX_AIM } from '../src/constants';
import { aimFromBar, spinFromBar } from '../src/meterMap';
import { AIM_HZ, back, confirm, createInput, tick, throwWith } from '../src/inputFsm';
import { aimReadout, powerReadout, spinReadout } from '../src/readouts';

describe('meters with phase offsets and assist', () => {
  it('default offsets keep the old start values (aim 0, power 0.5, spin 0)', () => {
    const aim = confirm(createInput());
    expect(aim.aim).toBe(0);
    const power = confirm(aim);
    expect(power.power).toBe(0.5);
    expect(confirm(power).spin).toBe(0);
  });
  it('an offset starts the meter away from the centre as soon as it is armed', () => {
    const s = confirm(createInput(0, { offsets: { aim: 0.1, power: 0, spin: 0 } }));
    expect(s.aimU).toBeCloseTo(0.4, 9);
    expect(s.aim).toBeCloseTo(aimFromBar(0.4), 12);
    expect(Math.abs(s.aim)).toBeGreaterThan(0);
  });
  it('different offsets give different first readings, so mashing Space is not a centred shot', () => {
    const readings = [0.05, 0.3, 0.55, 0.8].map((o) => confirm(createInput(0, { offsets: { aim: o, power: o, spin: o } })).aimU);
    expect(new Set(readings.map((r) => r.toFixed(3))).size).toBe(4);
  });
  it('tick follows the mapped curve and stays within bounds', () => {
    let s = confirm(createInput(0, { offsets: { aim: 0.37, power: 0, spin: 0 } }));
    for (let i = 0; i < 400; i++) {
      s = tick(s, 1 / 60);
      expect(s.aim).toBeCloseTo(aimFromBar(s.aimU), 12);
      expect(Math.abs(s.aim)).toBeLessThanOrEqual(MAX_AIM + 1e-12);
    }
  });
  it('assist flattens the centre of the aim and hook meters', () => {
    const base = { aim: 0.1, power: 0, spin: 0.1 };
    const n = confirm(createInput(0, { offsets: base }));
    const w = confirm(createInput(0, { assist: true, offsets: base }));
    expect(Math.abs(w.aim)).toBeLessThan(Math.abs(n.aim));
    expect(Math.abs(confirm(confirm(w)).spin)).toBeLessThan(Math.abs(confirm(confirm(n)).spin));
    expect(spinFromBar(0.4, true)).toBeLessThan(spinFromBar(0.4));
  });
  it('stepping back re-arms the meter', () => {
    let s = confirm(confirm(createInput(0, { offsets: { aim: 0.2, power: 0.2, spin: 0 } })));
    s = back(s);
    expect(s.phase).toBe('aim');
    expect(s.t).toBe(0);
    expect(s.aimU).toBeCloseTo(0.8, 9);
  });
  it('the aim meter runs at the tuned speed', () => {
    expect(AIM_HZ).toBeLessThan(0.5);
  });
  it('a throw with explicit values reports matching bar positions', () => {
    const s = throwWith(createInput(0), { aim: aimFromBar(0.5), power: 0.8, spin: spinFromBar(-0.3) });
    expect(s.aimU).toBeCloseTo(0.5, 6);
    expect(s.spinU).toBeCloseTo(-0.3, 6);
  });
});

describe('meter readouts', () => {
  it('describes aim and hook in words', () => {
    expect(aimReadout(0)).toBe('centre');
    expect(aimReadout(0.04)).toBe('centre');
    expect(aimReadout(-0.31)).toBe('left 3');
    expect(aimReadout(1)).toBe('right 10');
    expect(spinReadout(0)).toBe('straight');
    expect(spinReadout(0.42)).toBe('right 4');
  });
  it('formats power as a clamped percentage', () => {
    expect(powerReadout(0.853)).toBe('85%');
    expect(powerReadout(2)).toBe('100%');
    expect(powerReadout(-1)).toBe('0%');
  });
});
