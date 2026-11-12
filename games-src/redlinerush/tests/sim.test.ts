import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { createSim, endRun, score, step } from '../src/sim';
import { NO_INPUT } from '../src/simTypes';
import { clearRoad, driveOracle, GAS, runningSim } from './helpers';

const addCar = (s: ReturnType<typeof runningSim>, lane: number, rel: number, speed = 13): void => {
  s.cars.push({ id: s.nextId++, lane, kind: 'sedan', len: 6.4, hue: 200, speed, z: s.z + rel, pz: s.z + rel, minDx: 99, scored: false });
};

describe('phases', () => {
  it('counts down 3-2-1 then runs, with no movement before go', () => {
    const s = createSim('endless', 1);
    let n = 0;
    while (s.phase === 'countdown' && n++ < 1000) step(s, GAS);
    const kinds = s.events.map((e) => e.type);
    expect(kinds.filter((k) => k === 'count')).toHaveLength(2);
    expect(kinds.at(-1)).toBe('go');
    expect(s.z).toBe(0);
    expect(s.phase).toBe('run');
  });
  it('the trial clock does not start before go', () => {
    const s = createSim('trial', 1);
    for (let i = 0; i < 60; i++) step(s, NO_INPUT);
    expect(s.timeLeft).toBe(CONFIG.trial.startTime);
  });
  it('a finished run stops advancing', () => {
    const s = runningSim();
    endRun(s, 'crash');
    const z = s.z;
    step(s, GAS);
    expect(s.z).toBe(z);
    expect(s.overT).toBeGreaterThan(0);
  });
});

describe('driving', () => {
  it('speed ramps up with gas and brakes down to the minimum', () => {
    const s = runningSim();
    clearRoad(s);
    for (let i = 0; i < 120; i++) step(s, GAS);
    expect(s.speed).toBeGreaterThan(CONFIG.player.startSpeed);
    for (let i = 0; i < 300; i++) step(s, { steer: 0, gas: false, brake: true });
    expect(s.speed).toBe(CONFIG.player.minSpeed);
  });
  it('top speed rises with distance', () => {
    const s = runningSim();
    clearRoad(s);
    for (let i = 0; i < 600; i++) step(s, GAS);
    const early = s.speed;
    s.z = 5000;
    for (let i = 0; i < 1200; i++) { s.cars = []; step(s, GAS); }
    expect(s.speed).toBeGreaterThan(early + 5);
  });
  it('steering moves sideways and stops at the road edge', () => {
    const s = runningSim();
    clearRoad(s);
    for (let i = 0; i < 200; i++) step(s, { steer: 1, gas: true, brake: false });
    expect(s.x).toBeCloseTo(CONFIG.lanes - CONFIG.player.halfW - CONFIG.player.edgePad, 5);
    expect(s.lives).toBe(CONFIG.player.lives);
  });
  it('same seed and inputs give identical state (deterministic sim)', () => {
    const run = (): string => {
      const s = createSim('endless', 77);
      for (let i = 0; i < 1500; i++) step(s, { steer: i % 200 < 100 ? 1 : -1, gas: i % 7 !== 0, brake: false });
      return JSON.stringify([s.z, s.x, s.lives, s.fuel, score(s), s.cars.length]);
    };
    expect(run()).toBe(run());
  });
});

describe('collisions and near misses', () => {
  it('hitting a car costs armor, slows you, resets combo and grants brief invulnerability', () => {
    const s = runningSim();
    clearRoad(s);
    s.combo = 5;
    for (let i = 0; i < 30; i++) step(s, GAS);
    addCar(s, Math.floor(s.x), 3);
    step(s, GAS);
    expect(s.lives).toBe(CONFIG.player.lives - 1);
    expect(s.speed).toBeLessThanOrEqual(CONFIG.player.hurtSpeed + 1);
    expect(s.combo).toBe(0);
    expect(s.invuln).toBeGreaterThan(1);
    expect(s.events.some((e) => e.type === 'crash')).toBe(true);
  });
  it('invulnerability prevents a second hit', () => {
    const s = runningSim();
    clearRoad(s);
    addCar(s, Math.floor(s.x), 3);
    step(s, GAS);
    addCar(s, Math.floor(s.x), 3);
    step(s, GAS);
    expect(s.lives).toBe(CONFIG.player.lives - 1);
  });
  it('losing the last armor ends the run as a crash', () => {
    const s = runningSim();
    clearRoad(s);
    s.lives = 1;
    addCar(s, Math.floor(s.x), 3);
    step(s, GAS);
    expect(s.phase).toBe('over');
    expect(s.outcome).toBe('crash');
  });
  const pass = (laneOffset: number): ReturnType<typeof runningSim> => {
    const s = runningSim();
    clearRoad(s);
    s.x = 2.5;
    s.vx = 0;
    addCar(s, 2 + laneOffset, 15);
    for (let i = 0; i < 120; i++) step(s, GAS);
    return s;
  };
  it('a tight pass scores, a wide pass does not', () => {
    const tight = runningSim();
    clearRoad(tight);
    tight.x = 2.5 + 0.54 + 0.15;
    tight.vx = 0;
    addCar(tight, 2, 15);
    for (let i = 0; i < 120; i++) step(tight, GAS);
    expect(tight.nearMisses).toBe(1);
    expect(tight.bonus).toBe(CONFIG.scoring.near);
    expect(tight.lives).toBe(CONFIG.player.lives);
    const wide = pass(2);
    expect(wide.nearMisses).toBe(0);
  });
  it('combo expires after the window', () => {
    const s = runningSim();
    clearRoad(s);
    s.combo = 3;
    s.comboT = CONFIG.scoring.comboWindow;
    for (let i = 0; i < 60 * (CONFIG.scoring.comboWindow + 1); i++) { s.cars = []; step(s, GAS); }
    expect(s.combo).toBe(0);
  });
});

describe('pickups, fuel and modes', () => {
  it('fuel pickup refills (capped) and boost raises the speed ceiling', () => {
    const s = runningSim();
    clearRoad(s);
    s.fuel = 50;
    s.pickups.push({ id: 900, kind: 'fuel', lane: Math.floor(s.x), z: s.z + 2 });
    step(s, GAS);
    expect(s.fuel).toBeGreaterThan(50 + CONFIG.fuel.pickup - 3);
    s.fuel = 90;
    s.pickups.push({ id: 901, kind: 'fuel', lane: Math.floor(s.x), z: s.z + 1 });
    step(s, GAS);
    expect(s.fuel).toBeLessThanOrEqual(CONFIG.fuel.max);
    s.pickups.push({ id: 902, kind: 'boost', lane: Math.floor(s.x), z: s.z + 1 });
    step(s, GAS);
    expect(s.boost).toBeGreaterThan(0);
  });
  it('running dry ends endless and daily runs but not time trial', () => {
    for (const mode of ['endless', 'daily'] as const) {
      const s = runningSim(mode);
      clearRoad(s);
      s.fuel = 0.01;
      step(s, GAS);
      expect(s.outcome).toBe('fuel');
    }
    const t = runningSim('trial');
    clearRoad(t);
    for (let i = 0; i < 600; i++) step(t, NO_INPUT);
    expect(t.fuel).toBe(CONFIG.fuel.max);
  });
  it('trial: checkpoints add time, last one finishes with a bonus', () => {
    const s = runningSim('trial');
    clearRoad(s);
    const seg = CONFIG.trial.length / CONFIG.trial.checkpoints;
    const before = s.timeLeft;
    s.z = seg + 1;
    step(s, GAS);
    expect(s.checkpoint).toBe(1);
    expect(s.timeLeft).toBeGreaterThan(before + CONFIG.trial.bonusTime - 1);
    s.checkpoint = CONFIG.trial.checkpoints - 1;
    s.z = CONFIG.trial.length + 1;
    step(s, GAS);
    expect(s.outcome).toBe('finish');
    expect(score(s)).toBeGreaterThanOrEqual(CONFIG.trial.finishPoints);
  });
  it('trial: running out of time ends the run', () => {
    const s = runningSim('trial');
    clearRoad(s);
    s.timeLeft = 0.01;
    step(s, GAS);
    expect(s.outcome).toBe('time');
  });
  it('daily mode with the same seed creates the same road', () => {
    const a = runningSim('daily', 123);
    const b = runningSim('daily', 123);
    expect(a.cars.map((c) => [c.lane, c.z])).toEqual(b.cars.map((c) => [c.lane, c.z]));
  });
});

describe('level validation: a clean line always exists', () => {
  it('an oracle that follows the path lane finishes the trial on many seeds without crashing', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = driveOracle('trial', seed, 60 * 200);
      expect(s.outcome, `seed ${seed}`).toBe('finish');
      expect(s.crashes, `seed ${seed}`).toBe(0);
    }
  });
  it('the oracle survives deep into endless at top speed', () => {
    const s = driveOracle('endless', 5, 60 * 150);
    expect(s.crashes).toBe(0);
    expect(s.z).toBeGreaterThan(3000);
  });
});
