import { describe, expect, it } from 'vitest';
import { EVENT_SOUND, cuesFor } from '../src/audio/events';
import { busGains, comboHz } from '../src/audio/bus';
import { specsFor } from '../src/audio/synth';
import { SFX_NAMES } from '../src/config/sfx';
import { createBoard } from '../src/core/board';
import type { GameEvent } from '../src/core/state';
import { lerpPiece, snapOf } from '../src/ui/interp';
import { computeLayout } from '../src/ui/layout';
import { motionProfile, isReduced } from '../src/ui/motion';
import { announceFor } from '../src/ui/announce';
import { LiveCues } from '../src/ui/cues';
import { collapseShifts, isDanger, secondsLeft, visualLevel } from '../src/ui/view';
import { game } from './helpers';

describe('audio mapping (STACKFALL-11)', () => {
  it('every event type is a cue or explicitly silent, and cue events produce a known sound', () => {
    const samples: GameEvent[] = [
      { type: 'move' }, { type: 'rotate' }, { type: 'stash', id: 'bar' }, { type: 'hardDrop', rows: 2 }, { type: 'lock', piece: { id: 'bar', rot: 0, x: 0, y: 0 } },
      { type: 'clear', rows: [21], colors: [[1]], lines: 1, twist: 'none', label: 'Single', points: 100, combo: 2, b2b: true, allClear: true },
      { type: 'levelUp', level: 2 }, { type: 'garbage' }, { type: 'wipe' }, { type: 'end', status: 'over' }, { type: 'deny', what: 'move' }, { type: 'softDrop' }, { type: 'land' },
    ];
    expect(new Set(samples.map((e) => e.type))).toEqual(new Set(Object.keys(EVENT_SOUND)));
    for (const e of samples) {
      const cues = cuesFor([e]);
      if (EVENT_SOUND[e.type] === 'silent') expect(cues).toEqual([]);
      else {
        expect(cues.length).toBeGreaterThan(0);
        for (const c of cues) expect(SFX_NAMES).toContain(c.name);
      }
    }
  });
  it('clear adds combo, back-to-back and all-clear cues; hard drop suppresses the lock thud', () => {
    const clear: GameEvent = { type: 'clear', rows: [21], colors: [[1]], lines: 4, twist: 'none', label: 'Quad', points: 800, combo: 3, b2b: true, allClear: true };
    expect(cuesFor([clear]).map((c) => c.name)).toEqual(['clear4', 'combo', 'b2b', 'allClear']);
    const lock: GameEvent = { type: 'lock', piece: { id: 'bar', rot: 0, x: 0, y: 0 } };
    expect(cuesFor([{ type: 'hardDrop', rows: 3 }, lock]).map((c) => c.name)).toEqual(['hardDrop']);
    expect(cuesFor([{ type: 'hardDrop', rows: 0 }, lock]).map((c) => c.name)).toEqual(['hardDrop', 'lock']);
  });
  it('combo pitch is 392 * 2^(combo/12), capped at an octave', () => {
    expect(comboHz(0, 392)).toBe(392);
    expect(comboHz(12, 392)).toBeCloseTo(784, 6);
    expect(comboHz(40, 392)).toBeCloseTo(784, 6);
    expect(specsFor('combo', 7)[0]?.[0]).toBeCloseTo(392 * 2 ** (7 / 12), 6);
  });
  it('every sound has tone specs with sane ranges', () => {
    for (const n of SFX_NAMES) {
      const specs = specsFor(n, 1);
      expect(specs.length).toBeGreaterThan(0);
      for (const [f, d, , g] of specs) { expect(f).toBeGreaterThan(20); expect(d).toBeGreaterThan(0); expect(g).toBeGreaterThan(0); expect(g).toBeLessThanOrEqual(0.4); }
    }
  });
  it('bus gains follow volume, mute and the on/off toggles', () => {
    const base = { sfxOn: true, musicOn: true, muted: false, master: 100, sfx: 100, music: 100 };
    expect(busGains(base)).toEqual({ master: 1, sfx: 0.65, music: 0.35 });
    expect(busGains({ ...base, muted: true }).master).toBe(0);
    expect(busGains({ ...base, sfxOn: false }).sfx).toBe(0);
    expect(busGains({ ...base, master: 50, music: 0 })).toMatchObject({ master: 0.5, music: 0 });
  });
});

describe('interpolation (conventions section 4)', () => {
  const p = { id: 'bar' as const, rot: 0, x: 3, y: 5 };
  it('blends between the previous and current step', () => {
    const prev = snapOf({ ...p, y: 4 }, 0);
    expect(lerpPiece(prev, p, 0, 0)).toEqual({ x: 3, y: 4 });
    expect(lerpPiece(prev, p, 0, 0.5)).toEqual({ x: 3, y: 4.5 });
    expect(lerpPiece(prev, p, 0, 1)).toEqual({ x: 3, y: 5 });
    expect(lerpPiece(prev, p, 0, 9)).toEqual({ x: 3, y: 5 });
  });
  it('snaps on a new piece, rotation, stash or big jump', () => {
    expect(lerpPiece(snapOf({ ...p, y: 4 }, 0), p, 1, 0.5)).toEqual({ x: 3, y: 5 });
    expect(lerpPiece(snapOf({ ...p, rot: 1 }, 0), p, 0, 0.5)).toEqual({ x: 3, y: 5 });
    expect(lerpPiece(snapOf({ ...p, id: 'cube' }, 0), p, 0, 0.5)).toEqual({ x: 3, y: 5 });
    expect(lerpPiece(snapOf({ ...p, y: 0 }, 0), p, 0, 0.5)).toEqual({ x: 3, y: 5 });
    expect(lerpPiece(null, p, 0, 0.5)).toEqual({ x: 3, y: 5 });
  });
});

describe('layout (STACKFALL-04/05)', () => {
  const sizes: [number, number, number][] = [[1024, 784, 0.92], [1500, 1056, 0.92], [492, 384, 0.9]];
  it('landscape well uses at least 90% of the stage height', () => {
    for (const [w, h, min] of sizes) {
      const l = computeLayout(w, h);
      expect(l.portrait).toBe(false);
      expect(l.well.h / h).toBeGreaterThanOrEqual(min);
      expect(l.well.x).toBeGreaterThan(l.stash.x + l.stash.w);
      expect(l.next.x).toBeGreaterThanOrEqual(l.well.x + l.well.w);
    }
  });
  it('phone landscape cell is at least 14 px and panels fit the stage', () => {
    const l = computeLayout(492, 384);
    expect(l.cell).toBeGreaterThanOrEqual(14);
    expect(l.stash.x).toBeGreaterThanOrEqual(0);
    expect(l.next.x + l.next.w).toBeLessThanOrEqual(492);
  });
  it('panel labels are never below 12 px and scale with text size', () => {
    for (const [w, h] of [[400, 600], [492, 384], [1024, 784]] as const) expect(computeLayout(w, h).labelPx).toBeGreaterThanOrEqual(12);
    expect(computeLayout(1024, 784, 1.5).labelPx).toBeGreaterThan(computeLayout(1024, 784, 1).labelPx);
  });
  it('portrait strip fits inside the stage width', () => {
    for (const w of [320, 360, 400]) {
      const l = computeLayout(w, 600);
      expect(l.portrait).toBe(true);
      expect(l.stash.x).toBeGreaterThanOrEqual(0);
      expect(l.next.x + l.next.w).toBeLessThanOrEqual(w + 0.5);
      expect(l.well.x + l.well.w).toBeLessThanOrEqual(w);
      expect(l.well.y).toBeGreaterThanOrEqual(l.stash.y + l.stash.h);
    }
  });
});

describe('motion profile (STACKFALL-18, conventions)', () => {
  const on = { shake: true, flashes: true, particles: 'full' as const };
  it('full motion keeps everything', () => {
    expect(motionProfile(on, false)).toEqual({ shake: true, flash: 'full', particleScale: 1, tweens: true });
  });
  it('reduced motion: no shake, outline-only flashes, at most 40% particles, no tweens', () => {
    expect(motionProfile(on, true)).toEqual({ shake: false, flash: 'outline', particleScale: 0.4, tweens: false });
  });
  it('independent toggles', () => {
    expect(motionProfile({ ...on, shake: false }, false).shake).toBe(false);
    expect(motionProfile({ ...on, flashes: false }, false).flash).toBe('off');
    expect(motionProfile({ ...on, particles: 'off' }, false).particleScale).toBe(0);
    expect(motionProfile({ ...on, particles: 'low' }, false).particleScale).toBe(0.4);
    expect(motionProfile({ ...on, particles: 'low' }, true).particleScale).toBe(0.4);
  });
  it('system follows the media query; on and off override it', () => {
    expect(isReduced('system', true)).toBe(true);
    expect(isReduced('system', false)).toBe(false);
    expect(isReduced('on', false)).toBe(true);
    expect(isReduced('off', true)).toBe(false);
  });
});

describe('view helpers and live cues (STACKFALL-10)', () => {
  it('danger when any cell is in the top six visible rows', () => {
    const b = createBoard();
    expect(isDanger(b)).toBe(false);
    (b[10] as number[])[0] = 3;
    expect(isDanger(b)).toBe(false);
    (b[7] as number[])[0] = 3;
    expect(isDanger(b)).toBe(true);
  });
  it('collapse shifts: cleared rows push the rows above them down by the number cleared below', () => {
    const s = collapseShifts([18, 20], 22);
    expect(s[21]).toBe(0);
    expect(s[20]).toBe(1); // old row 19 sat above one cleared row
    expect(s[19]).toBe(2); // old row 17 above two
    expect(s[0]).toBe(0); // fresh empty rows
    expect(collapseShifts([], 22).every((v) => v === 0)).toBe(true);
  });
  it('visual level: Zen drifts with lines while its gravity level stays 1', () => {
    const z = game({ mode: 'zen' });
    z.lines = 25;
    expect(z.level).toBe(1);
    expect(visualLevel(z)).toBe(3);
    expect(visualLevel(null)).toBe(1);
    const m = game();
    m.level = 4;
    expect(visualLevel(m)).toBe(4);
  });
  it('Ultra warns for the last ten seconds, one tick per second', () => {
    const s = game({ mode: 'ultra' });
    const cues = new LiveCues();
    const limit = s.rules.timeLimitTicks as number;
    s.ticks = limit - 11 * 60;
    expect(cues.update(s, null)).toEqual([]);
    const ticks: string[] = [];
    for (let t = limit - 10 * 60; t <= limit - 1; t += 20) { s.ticks = t; ticks.push(...cues.update(s, null)); }
    expect(ticks.filter((c) => c === 'tick')).toHaveLength(10);
    expect(secondsLeft(s)).toBeGreaterThan(0);
  });
  it('danger warns once on entering, new best fires once, nothing after the run ends', () => {
    const s = game();
    const cues = new LiveCues();
    expect(cues.update(s, 500)).toEqual([]);
    (s.board[3] as number[])[0] = 3;
    expect(cues.update(s, 500)).toEqual(['warn']);
    expect(cues.update(s, 500)).toEqual([]);
    s.score = 600;
    expect(cues.update(s, 500)).toEqual(['newBest']);
    expect(cues.update(s, 500)).toEqual([]);
    s.status = 'over';
    expect(cues.update(s, 500)).toEqual([]);
  });
  it('announcements: clears, level, end', () => {
    const g = game();
    g.score = 1234;
    const out = announceFor([
      { type: 'clear', rows: [21], colors: [[1]], lines: 2, twist: 'none', label: 'Double', points: 300, combo: 0, b2b: false, allClear: false },
      { type: 'levelUp', level: 4 }, { type: 'end', status: 'over' },
    ], g);
    expect(out).toEqual(['Double, 300 points', 'Level 4', 'Game over, score 1,234']);
  });
});

describe('result card guard (STACKFALL-02)', () => {
  it('stays locked for the grace period, then until input has been quiet, up to a hard cap', async () => {
    const { unlockDelay } = await import('../src/ui/screens');
    expect(unlockDelay(100, 1e9)).toBe(600); // quiet player: wait out the 700 ms grace
    expect(unlockDelay(700, 1e9)).toBe(0);
    expect(unlockDelay(800, 50)).toBe(400); // still mashing at 800 ms: wait for 450 ms of quiet
    expect(unlockDelay(800, 449)).toBe(1);
    expect(unlockDelay(800, 450)).toBe(0);
    expect(unlockDelay(3000, 0)).toBe(0); // never locked out forever
    expect(unlockDelay(2900, 0)).toBe(100);
  });
});
