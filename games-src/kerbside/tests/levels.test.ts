import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { validateLevel } from '../src/validate';

describe('level set', () => {
  it('has 20+ levels with sequential ids and unique names', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(20);
    LEVELS.forEach((l, i) => expect(l.id).toBe(i + 1));
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(LEVELS.length);
  });
  it('covers pull-in, reverse, parallel, angled, garage and trailer', () => {
    const kinds = new Set(LEVELS.map((l) => l.kind));
    for (const k of ['pull-in', 'reverse', 'parallel', 'angled', 'garage', 'trailer']) expect(kinds.has(k as never)).toBe(true);
  });
  it('introduces the trailer only in the last levels', () => {
    const first = LEVELS.findIndex((l) => l.trailer);
    expect(first).toBeGreaterThanOrEqual(LEVELS.length - 5);
    expect(LEVELS.slice(first).every((l) => l.trailer)).toBe(true);
  });
  it('gets tighter: time limits never shrink between kinds of equal rank', () => {
    expect(LEVELS.every((l) => l.timeLimit >= 60 && l.parTime < l.timeLimit)).toBe(true);
  });
  for (const level of LEVELS) {
    it(`level ${level.id} (${level.name}) is structurally valid`, () => {
      expect(validateLevel(level)).toEqual([]);
    });
  }
  it('validation catches a bay that overlaps an obstacle', () => {
    const l = LEVELS[2]!;
    const bad = { ...l, bay: { ...l.bay, x: l.bay.x + l.bay.hh * 2 } };
    expect(validateLevel(bad)).toContain('bay overlaps an obstacle');
  });
  it('validation catches a start inside a wall', () => {
    const l = LEVELS[0]!;
    expect(validateLevel({ ...l, start: { x: -1, y: 5, a: 0 } })).toContain('start pose collides');
  });
});
