import { describe, expect, it } from 'vitest';
import { applyMove, carrierBank, checkMove, crossingCost, initialState, isWon, legalMoves } from '../src/puzzle/engine';
import { brokenRule, maskOf, popcount } from '../src/puzzle/rules';
import { RAFT_LEVELS } from '../src/levels';
import { classic } from './helpers';

describe('bridge rules', () => {
  const level = classic(2);

  it('starts with everyone and the lantern on the start bank', () => {
    const s = initialState(level);
    expect(s).toEqual({ start: 0b1111, carrierAtStart: true, cost: 0, moves: 0 });
    expect(carrierBank(level, s)).toBe(0b1111);
  });

  it('a crossing costs the slower walker', () => {
    expect(crossingCost(level, [0, 3])).toBe(10);
    expect(crossingCost(level, [1])).toBe(2);
  });

  it('rejects empty, oversized and duplicate groups', () => {
    const s = initialState(level);
    expect(checkMove(level, s, [])).toEqual({ ok: false, reason: 'empty' });
    expect(checkMove(level, s, [0, 1, 2])).toEqual({ ok: false, reason: 'too-many' });
    expect(checkMove(level, s, [1, 1])).toMatchObject({ ok: false, reason: 'wrong-side' });
  });

  it('only people on the lantern side can cross', () => {
    const s = applyMove(level, initialState(level), [0, 1]);
    expect(checkMove(level, s, [2])).toMatchObject({ ok: false, reason: 'wrong-side' });
    expect(checkMove(level, s, [0]).ok).toBe(true);
    expect(s).toMatchObject({ start: 0b1100, carrierAtStart: false, cost: 2, moves: 1 });
  });

  it('wins when all are across and the lantern is on the far bank', () => {
    let s = initialState(level);
    for (const g of [[0, 1], [0], [2, 3], [1], [0, 1]]) s = applyMove(level, s, g);
    expect(isWon(s)).toBe(true);
    expect(s.cost).toBe(17);
  });

  it('enumerates every legal group from the start (4 singles + 6 pairs)', () => {
    expect(legalMoves(level, initialState(level))).toHaveLength(10);
  });
});

describe('raft rules', () => {
  const [farm, , family] = RAFT_LEVELS;
  if (!farm || !family) throw new Error('levels missing');

  it('helpers count and mask bits', () => {
    expect(maskOf([0, 3])).toBe(9);
    expect(popcount(0b10110)).toBe(3);
  });

  it('the fox cannot be left with the hen', () => {
    const s = initialState(farm);
    const res = checkMove(farm, s, [0, 3]); // farmer takes grain, fox+hen stay
    expect(res).toMatchObject({ ok: false, reason: 'rule' });
    expect(checkMove(farm, s, [0, 2]).ok).toBe(true);
  });

  it('the raft needs a rower', () => {
    expect(checkMove(farm, initialState(farm), [1])).toEqual({ ok: false, reason: 'no-rower' });
  });

  it('pair rule honours the unless clause', () => {
    const fox = maskOf([1]);
    expect(brokenRule(farm.rules, fox | maskOf([2]))?.kind).toBe('pair');
    expect(brokenRule(farm.rules, fox | maskOf([2, 0]))).toBeNull();
  });

  it('the pickpocket cannot be left with the family', () => {
    const s = initialState(family);
    const pickIdx = family.actors.findIndex((a) => a.art === 'pickpocket');
    const wardenIdx = family.actors.findIndex((a) => a.art === 'warden');
    const res = checkMove(family, s, [wardenIdx, family.actors.findIndex((a) => a.art === 'pa')]);
    expect(res).toMatchObject({ ok: false, reason: 'rule' });
    expect(pickIdx).toBeGreaterThan(-1);
  });

  it('outnumber rule: magpies may not outnumber keepers where keepers are present', () => {
    const level = RAFT_LEVELS[1];
    if (!level) throw new Error('missing');
    const k = [0, 1, 2];
    const m = [3, 4, 5];
    expect(brokenRule(level.rules, maskOf([k[0] as number, m[0] as number, m[1] as number]))).not.toBeNull();
    expect(brokenRule(level.rules, maskOf([m[0] as number, m[1] as number]))).toBeNull();
    expect(brokenRule(level.rules, maskOf([k[0] as number, k[1] as number, m[0] as number]))).toBeNull();
  });
});
