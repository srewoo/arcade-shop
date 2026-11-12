import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { topSpeed } from '../src/scoring';
import { step } from '../src/sim';
import { NO_INPUT, type Input, type Sim } from '../src/simTypes';
import { GAS, clearRoad, runningSim } from './helpers';

const BRAKE: Input = { steer: 0, gas: false, brake: true };

/** Drive for `seconds` on an empty road with a full tank, so only the throttle model is under test. */
function drive(s: Sim, input: Input, seconds: number, onStep?: (s: Sim) => void): void {
  const steps = Math.round(seconds / CONFIG.step);
  for (let i = 0; i < steps && s.phase === 'run'; i++) {
    clearRoad(s);
    s.fuel = CONFIG.fuel.max;
    step(s, input);
    s.events.length = 0;
    onStep?.(s);
  }
}

describe('speed with no input (auto acceleration)', () => {
  it('rises gradually, never jumping more than autoAccel per step', () => {
    const s = runningSim();
    const start = s.speed;
    let prev = s.speed;
    drive(s, NO_INPUT, 3, (cur) => {
      expect(cur.speed).toBeGreaterThanOrEqual(prev);
      expect(cur.speed - prev).toBeLessThanOrEqual(CONFIG.player.autoAccel * CONFIG.step + 1e-9);
      prev = cur.speed;
    });
    expect(s.speed).toBeGreaterThan(start);
  });

  it('never goes above the current top speed without boost', () => {
    const s = runningSim();
    drive(s, NO_INPUT, 60, (cur) => {
      if (cur.boost === 0) expect(cur.speed).toBeLessThanOrEqual(topSpeed(cur.z) + 1e-9);
    });
  });

  it('ends up holding the hard cap (topCap) on a long run', () => {
    const s = runningSim();
    drive(s, NO_INPUT, 300);
    expect(s.speed).toBeCloseTo(CONFIG.speed.topCap, 6);
    drive(s, NO_INPUT, 10);
    expect(s.speed).toBeCloseTo(CONFIG.speed.topCap, 6);
  });

  it('is gentler than holding gas', () => {
    const coast = runningSim();
    const gas = runningSim();
    drive(coast, NO_INPUT, 2);
    drive(gas, GAS, 2);
    expect(gas.speed).toBeGreaterThan(coast.speed);
  });

  it('brake still slows the car down', () => {
    const s = runningSim();
    drive(s, NO_INPUT, 4);
    const before = s.speed;
    drive(s, BRAKE, 0.5);
    expect(s.speed).toBeLessThan(before);
    expect(s.speed).toBeGreaterThanOrEqual(CONFIG.player.minSpeed);
  });
});
