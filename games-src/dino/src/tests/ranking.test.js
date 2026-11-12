import { describe, it, expect } from 'vitest';
import { isRanked, unrankedReasons, snapshotRun, taintRun, isRunRanked, runInProgress } from '../ranking.js';
import { defaultSettings } from '../settings.js';

const base = defaultSettings();

describe('leaderboard eligibility', () => {
  it('ranks the default configuration on every mode that has a board', () => {
    expect(isRanked(base, 'classic')).toBe(true);
    expect(isRanked(base, 'hardcore')).toBe(true);
    expect(isRanked(base, 'timeattack')).toBe(true);
  });
  it('never ranks Zen (no board)', () => {
    expect(isRanked(base, 'zen')).toBe(false);
  });
  it('flags Easy and Hard as unranked', () => {
    expect(unrankedReasons({ ...base, difficulty: 'hard' }, 'classic')).toEqual(['difficulty']);
    expect(isRanked({ ...base, difficulty: 'easy' }, 'hardcore')).toBe(false);
  });
  it('flags Classic Plus only in Classic', () => {
    expect(unrankedReasons({ ...base, classicPlus: true }, 'classic')).toEqual(['classicPlus']);
    expect(isRanked({ ...base, classicPlus: true }, 'hardcore')).toBe(true);
  });
  it('flags Snow in every mode (floatier landings)', () => {
    expect(unrankedReasons({ ...base, weather: 'snow' }, 'timeattack')).toEqual(['snow']);
    expect(isRanked({ ...base, weather: 'rain' }, 'classic')).toBe(true);
    expect(isRanked({ ...base, weather: 'night' }, 'classic')).toBe(true);
  });
  it('lists every reason', () => {
    expect(unrankedReasons({ ...base, difficulty: 'hard', classicPlus: true, weather: 'snow' }, 'classic')).toEqual(['difficulty', 'classicPlus', 'snow']);
  });
});

describe('run-start ranking snapshot (DINO-10 follow-up)', () => {
  it('freezes the reasons at run start, independent of later settings objects', () => {
    const live = { ...base, difficulty: 'easy' };
    const snap = snapshotRun(live, 'classic');
    live.difficulty = 'normal'; // changed in pause
    expect(snap.reasons).toEqual(['difficulty']);
    expect(isRunRanked(snap)).toBe(false); // an easy start stays unranked even if switched back to Normal
  });
  it('a clean start stays ranked while settings are unchanged', () => {
    const snap = snapshotRun(base, 'classic');
    expect(isRunRanked(taintRun(snap, base))).toBe(true);
  });
  it('a mid-run switch to an off-config setting makes the run unranked, even if switched back', () => {
    let snap = snapshotRun(base, 'classic');
    snap = taintRun(snap, { ...base, difficulty: 'easy' }); // pause > Settings > Easy
    snap = taintRun(snap, base); // and back to Normal before dying
    expect(snap.reasons).toEqual(['difficulty']);
    expect(isRunRanked(snap)).toBe(false);
  });
  it('accumulates Classic Plus and Snow without duplicates', () => {
    let snap = snapshotRun({ ...base, weather: 'snow' }, 'classic');
    snap = taintRun(snap, { ...base, weather: 'snow', classicPlus: true });
    snap = taintRun(snap, { ...base, weather: 'snow', classicPlus: true });
    expect(snap.reasons).toEqual(['snow', 'classicPlus']);
  });
  it('never ranks a mode without a board, whatever the snapshot', () => {
    expect(isRunRanked(snapshotRun(base, 'zen'))).toBe(false);
  });
  it('does not mutate the snapshot it taints', () => {
    const snap = snapshotRun(base, 'classic');
    taintRun(snap, { ...base, difficulty: 'hard' });
    expect(snap.reasons).toEqual([]);
  });
  it('treats running, paused, stumble and crashed as a run in progress', () => {
    for (const s of ['running', 'paused', 'stumble', 'crashed']) expect(runInProgress(s)).toBe(true);
    for (const s of ['loading', 'title', 'gameover']) expect(runInProgress(s)).toBe(false);
  });
});
