import { describe, expect, it } from 'vitest';
import { LEVELS, LEVEL_COUNT, countDestructible, expandRow, generateLevel, parseLevel, validateLevel } from '../src/levels';

describe('level format', () => {
  it('expands mirrored rows', () => {
    expect(expandRow('~123...')).toBe('123......321');
    expect(expandRow('123456789012')).toBe('123456789012');
  });
  it('parses bricks, steel and power bricks', () => {
    const lv = parseLevel('T|~1#2w..');
    expect(lv.name).toBe('T');
    expect(lv.cells[0]?.[0]).toEqual({ kind: 'brick', hp: 1, power: null });
    expect(lv.cells[0]?.[1]).toEqual({ kind: 'steel' });
    expect(lv.cells[0]?.[3]).toEqual({ kind: 'brick', hp: 1, power: 'wide' });
    expect(lv.cells[0]?.[5]).toBeNull();
  });
  it('rejects bad input', () => {
    expect(() => parseLevel('nobar')).toThrow();
    expect(() => parseLevel('T|111')).toThrow(/12 columns/);
    expect(() => parseLevel('T|~1x....')).toThrow(/unknown cell/);
    expect(() => parseLevel('T|' + Array(15).fill('~111111').join('/'))).toThrow(/too many rows/);
  });
});

describe('level validation', () => {
  it('ships at least 30 levels, all valid with unique names', () => {
    expect(LEVEL_COUNT).toBeGreaterThanOrEqual(30);
    const names = new Set(LEVELS.map((l) => l.name));
    expect(names.size).toBe(LEVEL_COUNT);
    for (const lv of LEVELS) expect(validateLevel(lv), lv.name).toEqual([]);
  });
  it('uses every power-up and steel somewhere', () => {
    const kinds = new Set<string>();
    for (const lv of LEVELS) for (const row of lv.cells) for (const c of row) if (c) kinds.add(c.kind === 'steel' ? 'steel' : (c.power ?? 'plain'));
    for (const k of ['wide', 'multi', 'slow', 'laser', 'steel', 'plain']) expect(kinds.has(k), k).toBe(true);
  });
  it('flags empty and sealed boards', () => {
    expect(validateLevel(parseLevel('E|~......'))).toContain('no destructible bricks');
    const sealed = parseLevel('S|~111111/~######/~111111/~######');
    expect(validateLevel(sealed).join()).toMatch(/sealed/);
  });
});

describe('endless generator', () => {
  it('is deterministic per seed and level', () => {
    expect(generateLevel(7, 5)).toEqual(generateLevel(7, 5));
    expect(generateLevel(7, 5)).not.toEqual(generateLevel(8, 5));
  });
  it('always produces valid boards', () => {
    for (let n = 1; n <= 40; n++) for (const seed of [1, 99, 2024]) {
      const lv = generateLevel(seed, n);
      expect(validateLevel(lv), `${seed}/${n}`).toEqual([]);
      expect(countDestructible(lv.cells)).toBeGreaterThan(0);
    }
  });
});
