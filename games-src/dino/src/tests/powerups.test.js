import { describe, it, expect } from 'vitest';
import {
  POWERUPS, PowerupState, SLOWMO_SCALE, bonusDelta, scoreFrom, pickPowerup, shouldSpawnPickup,
} from '../powerups.js';

describe('PowerupState timers', () => {
  it('grants a power-up with its full duration', () => {
    const p = new PowerupState();
    p.grant('slowmo');
    expect(p.has('slowmo')).toBe(true);
    expect(p.remaining('slowmo')).toBe(POWERUPS.slowmo.duration);
    expect(p.fraction('slowmo')).toBe(1);
  });
  it('counts down and reports expiry once', () => {
    const p = new PowerupState();
    p.grant('slowmo'); // 5 s
    expect(p.update(2)).toEqual([]);
    expect(p.remaining('slowmo')).toBeCloseTo(3);
    expect(p.fraction('slowmo')).toBeCloseTo(0.6);
    expect(p.update(3.5)).toEqual(['slowmo']);
    expect(p.has('slowmo')).toBe(false);
    expect(p.update(1)).toEqual([]);
  });
  it('refreshes (not stacks) when picked up again', () => {
    const p = new PowerupState();
    p.grant('score2');
    p.update(6);
    p.grant('score2');
    expect(p.remaining('score2')).toBe(POWERUPS.score2.duration);
  });
  it('ignores unknown ids and negative time', () => {
    const p = new PowerupState();
    p.grant('bogus');
    p.grant('doublejump');
    p.update(-5);
    expect(p.active()).toEqual(['doublejump']);
    expect(p.remaining('doublejump')).toBe(POWERUPS.doublejump.duration);
  });
  it('slows time and doubles score only while those are active', () => {
    const p = new PowerupState();
    expect(p.timeScale()).toBe(1);
    expect(p.scoreMultiplier()).toBe(1);
    p.grant('slowmo');
    p.grant('score2');
    expect(p.timeScale()).toBe(SLOWMO_SCALE);
    expect(SLOWMO_SCALE).toBeCloseTo(0.6);
    expect(p.scoreMultiplier()).toBe(2);
    p.update(5.5);
    expect(p.timeScale()).toBe(1);
    expect(p.scoreMultiplier()).toBe(2);
  });
  it('consumes the shield exactly once', () => {
    const p = new PowerupState();
    expect(p.consumeShield()).toBe(false);
    p.grant('shield');
    expect(p.consumeShield()).toBe(true);
    expect(p.has('shield')).toBe(false);
    expect(p.consumeShield()).toBe(false);
  });
  it('clears everything', () => {
    const p = new PowerupState();
    for (const id of Object.keys(POWERUPS)) p.grant(id);
    p.clear();
    expect(p.active()).toEqual([]);
  });
});

describe('score maths', () => {
  it('equals the original floor(dist * 0.75) with no bonus', () => {
    for (const d of [0, 1, 13.4, 999.9, 12345.6]) expect(scoreFrom(d, 0, 0.75)).toBe(Math.floor(d * 0.75));
  });
  it('adds an extra copy of the distance score while x2 is active', () => {
    let bonus = 0;
    for (let i = 0; i < 100; i++) bonus += bonusDelta(1, 2, 0.75); // 100 m at x2
    expect(bonus).toBeCloseTo(75);
    expect(scoreFrom(100, bonus, 0.75)).toBe(150);
    expect(bonusDelta(10, 1, 0.75)).toBe(0);
  });
});

describe('pickup spawning', () => {
  it('picks by weight from the pool and skips unknown ids', () => {
    expect(pickPowerup(['shield'], 0.99)).toBe('shield');
    expect(pickPowerup([], 0.5)).toBeNull();
    expect(pickPowerup(['nope'], 0.5)).toBeNull();
    const pool = ['shield', 'slowmo'];
    expect(pickPowerup(pool, 0)).toBe('shield');
    expect(pickPowerup(pool, 0.999)).toBe('slowmo');
  });
  it('spawns only when enabled, far enough in, spaced out and lucky', () => {
    const base = { enabled: true, distance: 500, lastAt: 0, roll: 0.1 };
    expect(shouldSpawnPickup(base)).toBe(true);
    expect(shouldSpawnPickup({ ...base, enabled: false })).toBe(false);
    expect(shouldSpawnPickup({ ...base, distance: 40 })).toBe(false);
    expect(shouldSpawnPickup({ ...base, lastAt: 450 })).toBe(false);
    expect(shouldSpawnPickup({ ...base, roll: 0.9 })).toBe(false);
  });
});
