import { describe, it, expect } from 'vitest';
import { quipPool, QUIPS, QUIPS_ZEN, QUIPS_TIMEUP, KILLER_QUIPS } from '../quips.js';
import { summaryLine, S } from '../strings.js';
import { pendingHint, needsDuck, hintText, pickupToast, HINT_IDS } from '../coach.js';
import { COACH } from '../tuning.js';

describe('mode-aware game-over copy', () => {
  it('uses Zen quips when a Zen run is ended and time-up quips for Time Attack', () => {
    expect(quipPool('RUN OVER', null)).toBe(QUIPS_ZEN);
    expect(quipPool('TIME UP', null)).toBe(QUIPS_TIMEUP);
    expect(QUIPS_ZEN).not.toContain('Aerodynamic. Not steerable.');
  });
  it('keeps crash quips for crashes, with killer-specific ones half the time', () => {
    expect(quipPool('GAME OVER', 'cactus', 0.1)).toBe(QUIPS);
    expect(quipPool('GAME OVER', 'ptero', 0.1)).toBe(KILLER_QUIPS.ptero);
    expect(quipPool('GAME OVER', 'ptero', 0.9)).toBe(QUIPS);
  });
});

describe('run summary line', () => {
  it('reports distance, pickups, cleared obstacles and the best', () => {
    expect(summaryLine({ dist: 412.9, pickups: 3, cleared: 7, best: 500 })).toBe('412 m, 3 pickups, 7 cleared, best 00500');
    expect(summaryLine({ dist: 0, pickups: 1, cleared: 0, best: 0 })).toBe('0 m, 1 pickup, 0 cleared, best 00000');
    expect(summaryLine({})).toContain('best 00000');
  });
});

describe('first-run coaching', () => {
  const ptero = (type) => ({ kind: 'ptero', type });
  it('recognises what needs a duck', () => {
    expect(needsDuck(ptero('pteroMid'))).toBe(true);
    expect(needsDuck({ kind: 'log' })).toBe(true);
    expect(needsDuck(ptero('pteroLow'))).toBe(false);
    expect(needsDuck({ kind: 'cactus' })).toBe(false);
  });
  it('fires the duck hint once, within 25 m of the first mid pterodactyl or log', () => {
    expect(pendingHint({ seen: [], nearest: ptero('pteroMid'), distanceAhead: COACH.duckWithinM })).toBe('duck');
    expect(pendingHint({ seen: [], nearest: { kind: 'log' }, distanceAhead: 10 })).toBe('duck');
    expect(pendingHint({ seen: [], nearest: ptero('pteroMid'), distanceAhead: COACH.duckWithinM + 1 })).toBeNull();
    expect(pendingHint({ seen: ['duck'], nearest: ptero('pteroMid'), distanceAhead: 10 })).toBeNull();
    expect(pendingHint({ seen: [], nearest: { kind: 'cactus' }, distanceAhead: 10 })).toBeNull();
    expect(pendingHint({ seen: [], nearest: null, distanceAhead: 10 })).toBeNull();
    expect(pendingHint({ seen: [], nearest: ptero('pteroMid'), distanceAhead: -2 })).toBeNull();
  });
  it('has touch and keyboard wording for the duck hint', () => {
    expect(hintText('duck', true)).toContain('swipe down');
    expect(hintText('duck', false)).toContain('Down');
    expect(hintText('bogus', false)).toBe('');
    for (const id of HINT_IDS) expect(S.coach[id]).toBeDefined();
  });
  it('states the effect on the first pickup of a kind only', () => {
    expect(pickupToast('doublejump', 'Double Jump', [], false)).toBe('DOUBLE JUMP: press jump again in the air');
    expect(pickupToast('doublejump', 'Double Jump', [], true)).toBe('DOUBLE JUMP: tap again in the air');
    expect(pickupToast('doublejump', 'Double Jump', ['doublejump'], false)).toBe('DOUBLE JUMP');
    expect(pickupToast('shield', 'Shield', [], false)).toContain('absorbs one hit');
  });
});
