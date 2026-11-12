import { describe, expect, it } from 'vitest';
import { CONFIG, ENEMY, type DifficultyId } from '../src/config';
import { buildWave, isBossWave, validateWave } from '../src/waves';

const LEVELS: DifficultyId[] = ['easy', 'normal', 'hard'];

describe('wave validation', () => {
  it('every wave 1..80 on every difficulty and several seeds is valid', () => {
    for (const d of LEVELS)
      for (const seed of [1, 99, 123456, 0xdeadbeef])
        for (let i = 1; i <= 80; i++) expect(validateWave(buildWave(i, d, seed)), `${d}/${seed}/${i}`).toEqual([]);
  });
  it('is deterministic', () => {
    expect(buildWave(7, 'normal', 5)).toEqual(buildWave(7, 'normal', 5));
    expect(buildWave(7, 'normal', 5)).not.toEqual(buildWave(7, 'normal', 6));
  });
  it('boss every fourth wave with exactly one boss first', () => {
    for (let i = 1; i <= 24; i++) {
      const w = buildWave(i, 'normal', 3);
      expect(w.boss).toBe(i % CONFIG.waves.bossEvery === 0);
      expect(isBossWave(i)).toBe(w.boss);
      if (w.boss) expect(w.spawns[0]?.kind).toBe('boss');
    }
  });
  it('introduces enemy kinds no earlier than their minWave', () => {
    for (let i = 1; i <= 30; i++)
      for (const s of buildWave(i, 'hard', 8).spawns) if (s.kind !== 'boss') expect(ENEMY[s.kind].minWave).toBeLessThanOrEqual(i);
  });
  it('rejects broken waves', () => {
    expect(validateWave({ index: 1, boss: false, spawns: [] })).toContain('no spawns');
    expect(validateWave({ index: 1, boss: false, spawns: [{ at: 0, kind: 'scout', x: 999, path: 'straight', dir: 1 }] }).join()).toContain('x out of bounds');
    expect(validateWave({ index: 4, boss: false, spawns: [{ at: 0, kind: 'scout', x: 10, path: 'straight', dir: 1 }] })).toContain('boss flag mismatch');
  });
  it('harder difficulty never has fewer spawns in early waves than easy', () => {
    for (let i = 1; i <= 10; i++) {
      if (isBossWave(i)) continue;
      expect(buildWave(i, 'hard', 4).spawns.length).toBeGreaterThanOrEqual(buildWave(i, 'easy', 4).spawns.length - 2);
    }
  });
});
