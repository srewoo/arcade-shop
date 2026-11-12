import { describe, expect, it } from 'vitest';
import { makeCar } from '../src/car';
import type { Controls } from '../src/car';
import { CONFIG, STEP } from '../src/config';
import { LEVELS } from '../src/levels';
import type { SimState } from '../src/sim';
import { collides, createSim, isInBay, stepSim } from '../src/sim';
import { box } from '../src/levels/build';
import { fresh, run } from './helpers';

const L1 = LEVELS[0]!;
const gas: Controls = { throttle: 1, brake: false, steer: 0 };
const idle: Controls = { throttle: 0, brake: false, steer: 0 };
const brake: Controls = { throttle: 0, brake: true, steer: 0 };

describe('sim', () => {
  it('keeps the clock at zero until the player moves', () => {
    const s = run(L1, fresh(L1), idle, 3);
    expect(s.status).toBe('ready');
    expect(s.time).toBe(0);
  });
  it('starts the clock on the first input and emits a start event', () => {
    const s = stepSim(fresh(L1), gas, L1, STEP);
    expect(s.status).toBe('playing');
    expect(s.events).toContain('start');
    const t = run(L1, s, gas, 0.5);
    expect(t.time).toBeGreaterThan(0.4);
  });
  it('counts a hit once per cooldown and bounces the car back', () => {
    // L1 faces the back kerb: drive into it.
    let s = run(L1, fresh(L1), gas, 4);
    expect(s.damage).toBeGreaterThanOrEqual(1);
    const before = s.damage;
    s = stepSim(s, gas, L1, STEP);
    expect(s.damage).toBe(before);
  });
  it('wrecks the car at the damage limit', () => {
    const far = { ...L1, bay: box(1.5, 1.5, 2.6, 1.8, 0) };
    const s = run(far, fresh(far), gas, 12);
    expect(s.status).toBe('wrecked');
    expect(s.damage).toBe(CONFIG.damage.wreckAt);
  });
  it('times out when the clock reaches the limit', () => {
    const short = { ...L1, timeLimit: 1, obstacles: [] };
    const s = run(short, run(short, fresh(short), { ...gas, throttle: -1 }, 0.1), idle, 2);
    expect(s.status).toBe('timeout');
    expect(s.time).toBe(1);
  });
  it('parks after holding still inside the bay, and not before', () => {
    const bay = L1.bay;
    const car = makeCar(bay.x, bay.y + 1.3, -Math.PI / 2);
    let s: SimState = { ...createSim(L1), status: 'playing', car };
    expect(isInBay(car, L1)).toBe(true);
    s = run(L1, s, brake, 0.3);
    expect(s.status).toBe('playing');
    expect(s.hold).toBeGreaterThan(0.2);
    s = run(L1, s, brake, 0.6);
    expect(s.status).toBe('parked');
  });
  it('does not count a park while still rolling', () => {
    const bay = L1.bay;
    const car = { ...makeCar(bay.x, bay.y + 1.3, -Math.PI / 2), v: 1 };
    const s = run(L1, { ...createSim(L1), status: 'playing' as const, car }, { ...gas, throttle: 0 }, 0.05);
    expect(s.hold).toBe(0);
  });
  it('rejects a bad heading even when inside the bay', () => {
    const bay = L1.bay;
    expect(isInBay(makeCar(bay.x, bay.y + 1.3, -Math.PI / 2 + 0.6), L1)).toBe(false);
  });
  it('accepts either direction of travel in the bay', () => {
    const bay = L1.bay;
    expect(isInBay(makeCar(bay.x, bay.y - 1.3, Math.PI / 2), L1)).toBe(true);
  });
  it('stops stepping once finished', () => {
    const done = { ...createSim(L1), status: 'parked' as const };
    expect(stepSim(done, gas, L1, STEP)).toEqual({ ...done, events: [] });
  });
  it('is deterministic for the same input sequence', () => {
    const a = run(L1, fresh(L1), { throttle: 1, brake: false, steer: 0.3 }, 2);
    const b = run(L1, fresh(L1), { throttle: 1, brake: false, steer: 0.3 }, 2);
    expect(a).toEqual(b);
  });
});

describe('driving by the rules (scripted keyboard run)', () => {
  it('parks level 1 cleanly: roll forward, coast, brake, hold still', () => {
    let s = fresh(L1);
    let guard = 0;
    while (s.car.y > 9.2 && guard++ < 600) s = stepSim(s, gas, L1, STEP);
    s = run(L1, s, idle, 0.4);
    while (s.car.v < -0.05 || (s.car.y > 5.6 && s.status === 'playing' && guard++ < 1200)) s = stepSim(s, s.car.y > 7 ? { ...idle } : brake, L1, STEP);
    s = run(L1, s, brake, 1.5);
    expect(s.status).toBe('parked');
    expect(s.damage).toBe(0);
  });
  it('steering while reversing a parked-car level hits the neighbour and costs damage', () => {
    const L3 = LEVELS[2]!;
    const s = run(L3, fresh(L3), { throttle: 1, brake: false, steer: 1 }, 4);
    expect(s.damage).toBeGreaterThan(0);
  });
});

describe('wall-pinned parking', () => {
  it('does not count a level 1 park made by driving into the back wall', () => {
    let s = run(L1, fresh(L1), gas, 12);
    s = run(L1, s, idle, 3);
    expect(s.car.y).toBeLessThan(5.2);
    expect(s.status).not.toBe('parked');
    s = run(L1, s, { throttle: 1, brake: false, steer: 0 }, 6);
    expect(s.status).not.toBe('parked');
  });
});

describe('park clearance leaves every bay reachable', () => {
  it('a rig centred in each bay has the required clearance', () => {
    for (const lv of LEVELS) {
      if (lv.trailer) continue;
      const car = makeCar(lv.bay.x - Math.cos(lv.bay.a) * 1.3, lv.bay.y - Math.sin(lv.bay.a) * 1.3, lv.bay.a);
      expect(isInBay(car, lv), lv.name).toBe(true);
      expect(collides(car, lv, CONFIG.parking.clearance), lv.name).toBe(false);
    }
  });
});
