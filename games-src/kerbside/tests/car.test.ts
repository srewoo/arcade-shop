import { describe, expect, it } from 'vitest';
import { carBox, integrate, isJackknifed, makeCar, nextSpeed, nextSteer, trailerBox } from '../src/car';
import type { Controls } from '../src/car';
import { CONFIG, STEP } from '../src/config';

const drive = (s = makeCar(0, 0, 0), c: Controls, secs: number, trailer = false) => {
  let cur = s;
  for (let i = 0; i < Math.round(secs / STEP); i++) cur = integrate(cur, c, STEP, trailer);
  return cur;
};
const gas: Controls = { throttle: 1, brake: false, steer: 0 };

describe('bicycle model', () => {
  it('accelerates forward in a straight line and caps speed', () => {
    const s = drive(undefined, gas, 6);
    expect(s.v).toBeCloseTo(CONFIG.car.maxForward, 1);
    expect(s.v).toBeLessThanOrEqual(CONFIG.car.maxForward);
    expect(s.y).toBeCloseTo(0, 6);
    expect(s.x).toBeGreaterThan(10);
  });
  it('reverse is slower and goes backwards', () => {
    const s = drive(undefined, { throttle: -1, brake: false, steer: 0 }, 6);
    expect(s.v).toBeCloseTo(-CONFIG.car.maxReverse, 1);
    expect(s.v).toBeGreaterThanOrEqual(-CONFIG.car.maxReverse);
    expect(s.x).toBeLessThan(-5);
  });
  it('pressing the opposite pedal brakes before reversing', () => {
    const moving = { ...makeCar(0, 0, 0), v: 4 };
    const next = nextSpeed(moving.v, { throttle: -1, brake: false, steer: 0 }, STEP, false);
    expect(next).toBeLessThan(4);
    expect(next).toBeGreaterThan(3);
  });
  it('the handbrake stops the car and never reverses it', () => {
    let v = 5;
    for (let i = 0; i < 120; i++) v = nextSpeed(v, { throttle: 0, brake: true, steer: 0 }, STEP, false);
    expect(v).toBe(0);
  });
  it('coasting slows the car down', () => {
    const v = nextSpeed(3, { throttle: 0, brake: false, steer: 0 }, STEP, false);
    expect(v).toBeLessThan(3);
  });
  it('steering angle is rate limited and self-centres', () => {
    const one = nextSteer(0, 1, STEP);
    expect(one).toBeCloseTo(CONFIG.car.steerRate * STEP, 6);
    let s = 0;
    for (let i = 0; i < 100; i++) s = nextSteer(s, 1, STEP);
    expect(s).toBeCloseTo(CONFIG.car.maxSteer, 6);
    for (let i = 0; i < 100; i++) s = nextSteer(s, 0, STEP);
    expect(s).toBe(0);
  });
  it('follows a circle of radius wheelbase / tan(steer) at constant speed', () => {
    const steer = 0.4;
    const start = { ...makeCar(0, 0, 0), v: 3, steer };
    const hold: Controls = { throttle: 0, brake: false, steer: steer / CONFIG.car.maxSteer };
    // no drag: integrate with tiny drag by re-asserting speed each step
    let s = start;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 600; i++) {
      s = { ...integrate(s, hold, STEP, false), v: 3 };
      pts.push({ x: s.x, y: s.y });
    }
    const r = CONFIG.car.wheelbase / Math.tan(steer);
    const cy = r; // turning left of heading 0 means +y in screen coordinates (positive steer)
    for (const p of pts.slice(50)) expect(Math.hypot(p.x, p.y - cy)).toBeCloseTo(r, 1);
  });
  it('reversing with the wheel right swings the nose the other way', () => {
    const fwd = drive({ ...makeCar(0, 0, 0), steer: 0.5, v: 1 }, { throttle: 0, brake: true, steer: 0.8 }, 0.2);
    expect(fwd.a).toBeGreaterThanOrEqual(0);
    const back = { ...makeCar(0, 0, 0), steer: 0.5, v: -2 };
    const next = integrate(back, { throttle: 0, brake: false, steer: 0.8 }, STEP, false);
    expect(next.a).toBeLessThan(0);
  });
  it('body box sits ahead of the rear axle', () => {
    const b = carBox(makeCar(10, 5, 0));
    expect(b.x).toBeCloseTo(10 + CONFIG.car.centreOffset, 6);
    expect(b.hw).toBeCloseTo(CONFIG.car.length / 2, 6);
  });
});

describe('trailer', () => {
  it('trails straight behind a straight-driving car', () => {
    const s = drive(makeCar(20, 0, 0), gas, 3, true);
    expect(Math.abs(s.phi)).toBeLessThan(1e-6);
    expect(trailerBox(s).x).toBeLessThan(s.x);
  });
  it('bends when reversing with the wheel turned, until it jackknifes', () => {
    let s = makeCar(20, 0, 0);
    const back: Controls = { throttle: -1, brake: false, steer: 1 };
    let jack = false;
    for (let i = 0; i < 60 * 20 && !jack; i++) {
      s = integrate(s, back, STEP, true);
      jack = isJackknifed(s);
    }
    expect(jack).toBe(true);
  });
  it('is not jackknifed at rest', () => {
    expect(isJackknifed(makeCar(0, 0, 1))).toBe(false);
  });
});
