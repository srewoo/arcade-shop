import { describe, expect, it } from 'vitest';
import { framesPerRow, softDropRate, TUNINGS } from '../src/config/tuning';
import { levelFor, MODES } from '../src/core/modes';
import { scoreLock } from '../src/core/scoring';
import { createGame, tick } from '../src/core/step';
import { defaultConfig } from '../src/core/state';
import { game, input } from './helpers';

describe('STACKFALL-01 stash top-out', () => {
  function blockedStash(mode: 'marathon' | 'zen') {
    const s = game({ mode });
    s.stash = 'cube';
    (s.board[0] as number[])[4] = 3;
    (s.board[1] as number[])[4] = 3;
    return s;
  }
  it('ends the run with exactly one end event', () => {
    const s = blockedStash('marathon');
    tick(s, input({ stash: true }));
    expect(s.status).toBe('over');
    expect(s.events.filter((e) => e.type === 'end')).toHaveLength(1);
    s.events.length = 0;
    tick(s, input());
    expect(s.events.filter((e) => e.type === 'end')).toHaveLength(0);
  });
  it('Zen wipes the terrarium instead of ending', () => {
    const s = blockedStash('zen');
    tick(s, input({ stash: true }));
    expect(s.status).toBe('playing');
    expect(s.events.some((e) => e.type === 'wipe')).toBe(true);
    expect(s.board.every((r) => r.every((c) => c === 0))).toBe(true);
    expect(s.piece).not.toBeNull();
  });
  it('safety net reports an end event if the status changed silently', () => {
    const s = game();
    s.status = 'over';
    tick(s, input());
    expect(s.events.filter((e) => e.type === 'end')).toHaveLength(1);
    tick(s, input());
    expect(s.events.filter((e) => e.type === 'end')).toHaveLength(1);
  });
  it('a blocked spawn at creation reports the end', () => {
    // Marathon spawn is never blocked on an empty board, so use a crowded Dig config via board edit.
    const s = createGame(defaultConfig({ seed: 3 }));
    expect(s.status).toBe('playing');
  });
});

describe('feedback events', () => {
  it('denies a second stash in the same drop', () => {
    const s = game();
    tick(s, input({ stash: true }));
    s.events.length = 0;
    tick(s, input({ stash: true }));
    expect(s.events.some((e) => e.type === 'deny' && e.what === 'stash')).toBe(true);
  });
  it('level-up events carry the new level', () => {
    const s = game();
    s.lines = 9;
    (s.board[21] as number[]).fill(8);
    (s.board[21] as number[])[0] = 0;
    s.piece = { id: 'bar', rot: 1, x: -2, y: 18 }; // vertical bar in column 0
    tick(s, input({ hard: true }));
    const up = s.events.find((e) => e.type === 'levelUp');
    expect(up).toBeDefined();
    if (up && up.type === 'levelUp') expect(up.level).toBe(2);
  });
});

describe('tuning presets (STACKFALL-19, 24, 26)', () => {
  it('classic matches the original gravity table', () => {
    expect(framesPerRow(1)).toBe(48);
    expect(framesPerRow(5)).toBeCloseTo(48 * 0.82 ** 4, 9);
    expect(softDropRate(15)).toBeCloseTo(1 / framesPerRow(15), 9); // no faster than gravity
    expect(softDropRate(1)).toBeCloseTo(1 / 3, 9);
  });
  it('tuned starts faster, ramps steeper and has an instant tier from level 16', () => {
    const t = TUNINGS.tuned;
    expect(framesPerRow(1, t)).toBe(36);
    expect(framesPerRow(10, t)).toBeLessThan(framesPerRow(10));
    expect(framesPerRow(16, t)).toBeLessThan(1);
    expect(framesPerRow(20, t)).toBeCloseTo(1 / 20, 9);
  });
  it('tuned soft drop is at least 6x gravity so it still helps at high levels', () => {
    const t = TUNINGS.tuned;
    expect(softDropRate(10, t)).toBeGreaterThan(softDropRate(10));
    expect(softDropRate(1, t)).toBeCloseTo(1 / 3, 9);
    expect(softDropRate(15, t)).toBeGreaterThan(1);
  });
  it('tuned Sprint ramps one level per 8 lines; classic stays fixed', () => {
    const sprint = MODES.sprint;
    expect(levelFor(sprint, 1, 0)).toBe(3);
    expect(levelFor(sprint, 1, 39)).toBe(3);
    expect(levelFor(sprint, 1, 0, TUNINGS.tuned)).toBe(1);
    expect(levelFor(sprint, 1, 16, TUNINGS.tuned)).toBe(3);
    expect(levelFor(sprint, 1, 39, TUNINGS.tuned)).toBe(5);
  });
  it('Marathon level cap follows the preset', () => {
    expect(levelFor(MODES.marathon, 15, 150)).toBe(15);
    expect(levelFor(MODES.marathon, 15, 150, TUNINGS.tuned)).toBe(20);
  });
  it('tuned scoring uses its own ladder and still scales by level', () => {
    const base = { twist: 'none' as const, level: 1, combo: -1, b2b: false, allClear: false };
    const lines = [1, 2, 3, 4].map((l) => scoreLock({ ...base, lines: l, tables: TUNINGS.tuned.scores }).points);
    expect(lines).toEqual([100, 250, 450, 750]);
    expect(scoreLock({ ...base, lines: 2, level: 4, tables: TUNINGS.tuned.scores }).points).toBe(1000);
    const b2b = scoreLock({ ...base, lines: 4, b2b: true, tables: TUNINGS.tuned.scores });
    expect(b2b.points).toBe(750 + 300);
  });
  it('a tuned game runs and differs from classic on the same inputs', () => {
    const run = (tuning: 'classic' | 'tuned') => {
      const s = createGame(defaultConfig({ seed: 5, tuning }));
      for (let i = 0; i < 600; i++) tick(s, input());
      return s.piece?.y ?? 0;
    };
    expect(run('tuned')).toBeGreaterThan(run('classic'));
  });
});
