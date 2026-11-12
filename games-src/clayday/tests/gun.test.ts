import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { Gun } from '../src/gun';

describe('Gun', () => {
  it('holds two shells and reloads by itself after the second', () => {
    const g = new Gun();
    expect(g.shells).toBe(2);
    expect(g.fire()).toBe('fired');
    expect(g.reloading).toBe(false);
    expect(g.fire()).toBe('fired');
    expect(g.shells).toBe(0);
    expect(g.reloading).toBe(true);
  });
  it('cannot fire while reloading, then is full again', () => {
    const g = new Gun();
    g.fire();
    g.fire();
    expect(g.fire()).toBe('reloading');
    expect(g.step(CONFIG.gun.reloadMs / 1000 - 0.01)).toBe(false);
    expect(g.step(0.02)).toBe(true);
    expect(g.shells).toBe(2);
    expect(g.fire()).toBe('fired');
  });
  it('manual reload works with one shell left, not when full or already reloading', () => {
    const g = new Gun();
    expect(g.reload()).toBe(false);
    g.fire();
    expect(g.reload()).toBe(true);
    expect(g.reload()).toBe(false);
    expect(g.reloadProgress).toBeLessThan(1);
    g.step(10);
    expect(g.shells).toBe(2);
    expect(g.reloadProgress).toBe(1);
  });
  it('reports empty when out of shells and not reloading', () => {
    const g = new Gun(1);
    g.shells = 0;
    expect(g.fire()).toBe('empty');
  });
});
