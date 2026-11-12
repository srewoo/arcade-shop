import { describe, expect, it } from 'vitest';
import { isDebug, seedFromQuery } from '../src/debug';
import { buildResultView } from '../src/resultView';
import { newSession } from '../src/session';
import { applyAppearance, isReducedMotion } from '../src/ui/appearance';
import { windDir, windKmh } from '../src/ui/hudView';
import { DEFAULT_SETTINGS } from '../src/settings';
import { S, windLabel } from '../src/strings';
import { makeRound, runBot } from './helpers';

describe('appearance', () => {
  it('reduce motion: System follows the OS, On/Off override', () => {
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('system', false)).toBe(false);
    expect(isReducedMotion('on', false)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
  });
  it('stamps theme, text size, motion and assist on the root', () => {
    const root = { dataset: {} as Record<string, string | undefined> } as unknown as HTMLElement;
    applyAppearance({ ...DEFAULT_SETTINGS, theme: 'dark', textSize: 150, colorAssist: true, reduceMotion: 'on' }, false, root);
    expect(root.dataset).toMatchObject({ theme: 'dark', text: '150', motion: 'reduce', assist: 'on' });
    applyAppearance({ ...DEFAULT_SETTINGS }, false, root);
    expect(root.dataset.theme).toBeUndefined();
    expect(root.dataset.motion).toBe('full');
  });
});

describe('debug gating', () => {
  it('hooks only with ?debug=1', () => {
    expect(isDebug('?debug=1')).toBe(true);
    expect(isDebug('')).toBe(false);
    expect(isDebug('?debug=0')).toBe(false);
    expect(isDebug('?debug=true')).toBe(false);
  });
  it('seed parsing accepts only safe integers', () => {
    expect(seedFromQuery('?seed=42')).toBe(42);
    expect(seedFromQuery('?seed=-1')).toBeNull();
    expect(seedFromQuery('?seed=abc')).toBeNull();
    expect(seedFromQuery('?seed=1.5')).toBeNull();
    expect(seedFromQuery('')).toBeNull();
  });
});

describe('wind readout', () => {
  it('shows calm for tiny wind, otherwise km/h and a direction arrow', () => {
    expect(windDir(0)).toBe('none');
    expect(windDir(0.0001)).toBe('none');
    expect(windDir(0.05)).toBe('right');
    expect(windDir(-0.05)).toBe('left');
    expect(windKmh(-0.05)).toBe(10);
    expect(windLabel(10, 'left')).toBe('10 km/h ←');
    expect(windLabel(10, 'right')).toBe('10 km/h →');
    expect(windLabel(0, 'none')).toBe(S.calm);
  });
});

describe('result summary', () => {
  it('campaign pass shows needed hits, bonuses and run score', () => {
    const r = makeRound(1, 3);
    runBot(r);
    const v = buildResultView(r, 'next', { ...newSession('campaign', 1, 3), runScore: r.result!.finalScore });
    expect(v.title).toBe(S.passed);
    expect(v.nextLabel).toBe(S.nextRound);
    expect(v.big).toBe('25 / 25');
    const keys = v.rows.map((x) => x[0]);
    expect(keys).toEqual(expect.arrayContaining(['Hits', 'Needed', 'Time bonus', 'Perfect bonus', S.runScore]));
    expect(v.rating).toContain('★');
  });
  it('practice has no pass mark or run score', () => {
    const r = makeRound(1, 3, 'practice');
    runBot(r);
    const v = buildResultView(r, 'practice', newSession('practice', 1, 3));
    const keys = v.rows.map((x) => x[0]);
    expect(keys).not.toContain('Needed');
    expect(keys).not.toContain(S.runScore);
    expect(v.nextLabel).toBe(S.again);
  });
  it('a lost run offers Try again', () => {
    const r = makeRound(1, 8);
    for (let i = 0; i < 60 * 200 && r.phase !== 'done'; i++) r.step(1 / 60);
    const v = buildResultView(r, 'over', newSession('campaign', 1, 8));
    expect(v.title).toBe(S.failed);
    expect(v.nextLabel).toBe(S.tryAgain);
  });
});
