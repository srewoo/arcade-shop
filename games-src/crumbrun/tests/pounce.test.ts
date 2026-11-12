import { describe, expect, it } from 'vitest';
import { newPounce, stepPounce } from '../src/cats';
import type { PounceState } from '../src/cats';
import { TUNING } from '../src/config/tuning';
import { isGrooming, createWorld } from '../src/world';
import { stepWorld } from '../src/step';
import { FIXED_DT } from '../src/types';
import { REST_SEC } from '../src/modes';

const P = TUNING.pounce;
function run(s: PounceState, sees: boolean, secs: number): void {
  for (let i = 0; i < Math.round(secs * 60); i++) stepPounce(s, sees, FIXED_DT);
}

describe('pounce wind-up, dash, cooldown', () => {
  it('seeing Pip starts a wind-up exactly once and returns the sound cue', () => {
    const s = newPounce();
    expect(stepPounce(s, true, FIXED_DT)).toBe('windup');
    expect(s.phase).toBe('windup');
    expect(stepPounce(s, true, FIXED_DT)).toBeNull();
  });

  it('dashes only after the 0.35 s wind-up', () => {
    const s = newPounce();
    stepPounce(s, true, FIXED_DT);
    run(s, true, P.windupSec - 0.1);
    expect(s.phase).toBe('windup');
    run(s, true, 0.2);
    expect(s.phase).toBe('dash');
  });

  it('losing line of sight during the wind-up cancels it', () => {
    const s = newPounce();
    stepPounce(s, true, FIXED_DT);
    run(s, false, P.windupSec + 0.05);
    expect(s.phase).toBe('idle');
  });

  it('a dash lasts at most 3 s, then a 4 s cooldown blocks re-pouncing', () => {
    const s = newPounce();
    stepPounce(s, true, FIXED_DT);
    run(s, true, P.windupSec + 0.05);
    expect(s.phase).toBe('dash');
    run(s, true, P.dashMaxSec + 0.05);
    expect(s.phase).toBe('cooldown');
    run(s, true, P.cooldownSec - 0.2);
    expect(s.phase).toBe('cooldown');
    expect(stepPounce(s, true, 0.3)).toBeNull();
    expect(s.phase).toBe('idle');
    expect(stepPounce(s, true, FIXED_DT)).toBe('windup');
  });

  it('breaking line of sight ends the dash early into cooldown', () => {
    const s = newPounce();
    stepPounce(s, true, FIXED_DT);
    run(s, true, P.windupSec + 0.05);
    run(s, false, FIXED_DT * 2);
    expect(s.phase).toBe('cooldown');
  });

  it('a wound-up Tuxedo stands still in the live world', () => {
    const w = createWorld(1);
    w.god = true;
    const tux = w.cats[2]!;
    tux.mode = 'active';
    tux.x = 1; tux.y = 17; tux.px = 1; tux.py = 17; tux.dir = 'N';
    w.pip.x = 1; w.pip.y = 13; w.pip.px = 1; w.pip.py = 13;
    stepWorld(w, FIXED_DT);
    expect(tux.pounce.phase).toBe('windup');
    expect(w.events.some((e) => e.type === 'pounce')).toBe(true);
    const y = tux.y;
    stepWorld(w, FIXED_DT);
    expect(tux.y).toBe(y);
  });
});

describe('grooming rest phase', () => {
  it('active cats stop at a tile centre and are harmless to touch while resting', () => {
    const w = createWorld(1);
    for (let i = 0; i < 60 * 12; i++) { stepWorld(w, FIXED_DT); w.events.length = 0; w.god = true; }
    w.god = false;
    w.clock.phase = 'rest';
    w.clock.left = REST_SEC;
    for (let i = 0; i < 60; i++) stepWorld(w, FIXED_DT);
    const active = w.cats.filter((c) => c.mode === 'active');
    expect(active.length).toBeGreaterThan(0);
    for (const c of active) {
      expect(c.dir).toBe('N');
      expect(isGrooming(w, c)).toBe(true);
      expect(Number.isInteger(c.x) && Number.isInteger(c.y)).toBe(true);
    }
    const c0 = active[0]!;
    w.pip.x = c0.x; w.pip.y = c0.y; w.pip.alive = true;
    stepWorld(w, FIXED_DT);
    expect(w.events.some((e) => e.type === 'death')).toBe(false);
  });

  it('cats do not reverse on phase change or pistol pickup', () => {
    const w = createWorld(1);
    w.god = true;
    for (let i = 0; i < 60 * 3; i++) stepWorld(w, FIXED_DT);
    const smudge = w.cats[0]!;
    smudge.x = 5; smudge.y = 1; smudge.px = 5; smudge.py = 1; smudge.dir = 'R';
    w.clock.left = 0.001;
    stepWorld(w, FIXED_DT);
    expect(w.events.some((e) => e.type === 'phase')).toBe(true);
    expect(smudge.dir).not.toBe('L'); // keeps going (then grooms at the next centre), never turns back
  });
});
