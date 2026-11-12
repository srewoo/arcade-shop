import { describe, expect, it } from 'vitest';
import { parseGrid } from '../src/core/grid';
import { DASH } from '../src/core/scoring';
import { Session, type SessionEvent } from '../src/session';
import { PUZZLE, SOLUTION } from './fixtures';

function make(mode: 'dash' | 'classic', mistakeLimit = true): { s: Session; events: SessionEvent[] } {
  const events: SessionEvent[] = [];
  const s = new Session(
    { puzzle: parseGrid(PUZZLE) as number[], solution: parseGrid(SOLUTION) as number[], mode, difficulty: 'easy', daily: null, custom: false, mistakeLimit },
    (e) => events.push(e),
  );
  return { s, events };
}
const wrongDigit = (cell: number): number => (Number(SOLUTION[cell]) % 9) + 1;

describe('session: Dash mode', () => {
  it('gains time and score for correct entries, with a combo popup', () => {
    const { s, events } = make('dash');
    const start = s.dash!.timeLeftMs;
    s.select(2);
    s.input(Number(SOLUTION[2]));
    expect(s.dash!.timeLeftMs).toBe(start + DASH.gainSeconds.easy * 1000);
    expect(s.dash!.score).toBe(50);
    expect(events.some((e) => e.type === 'popup' && e.good && e.text === '+50')).toBe(true);
    s.tick(1000);
    s.select(3);
    s.input(Number(SOLUTION[3]));
    expect(s.dash!.combo).toBe(2);
    expect(s.dash!.score).toBe(50 + 100);
  });

  it('loses time and the combo on a mistake, and runs out', () => {
    const { s } = make('dash');
    s.select(2);
    s.input(Number(SOLUTION[2]));
    const before = s.dash!.timeLeftMs;
    s.select(3);
    s.input(wrongDigit(3));
    expect(s.dash!.timeLeftMs).toBe(before - DASH.mistakePenaltySeconds * 1000);
    expect(s.dash!.combo).toBe(0);
    expect(s.mistakes).toBe(1);
    s.tick(10_000_000);
    expect(s.status).toBe('lost');
    expect(s.lossReason).toBe('time');
  });

  it('wins with a time bonus and counts as a record-eligible run', () => {
    const { s } = make('dash');
    for (let c = 0; c < 81; c++) {
      s.select(c);
      s.input(Number(SOLUTION[c]));
    }
    expect(s.status).toBe('won');
    expect(s.eligibleForRecords).toBe(true);
    expect(s.finalScore).toBeGreaterThan(s.dash!.timeLeftMs / 100);
  });
});

describe('session: Classic mode', () => {
  it('ends after three mistakes when the limit is on', () => {
    const { s } = make('classic');
    const open = s.game.values.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    for (const c of open.slice(0, 3)) {
      s.select(c);
      s.input(wrongDigit(c));
    }
    expect(s.status).toBe('lost');
    expect(s.lossReason).toBe('mistakes');
  });

  it('keeps going without the limit, supports notes and undo/redo', () => {
    const { s } = make('classic', false);
    s.select(2);
    s.toggleNotesMode();
    s.input(1);
    expect(s.game.notes[2]).toBe(1);
    s.toggleNotesMode();
    s.input(wrongDigit(2));
    s.select(3);
    s.input(wrongDigit(3));
    s.select(5);
    s.input(wrongDigit(5));
    s.input(wrongDigit(5) === 9 ? 1 : 9);
    expect(s.status).toBe('playing');
    expect(s.mistakes).toBe(4);
    s.undo();
    expect(s.game.values[5]).toBe(wrongDigit(5));
    s.redo();
    expect(s.game.values[5]).not.toBe(wrongDigit(5));
  });

  it('solver help marks the run as assisted and ineligible for records', () => {
    const { s } = make('classic');
    s.solveStep();
    expect(s.assisted).toBe(true);
    s.solveAll();
    expect(s.status).toBe('won');
    expect(s.eligibleForRecords).toBe(false);
  });

  it('pauses the clock', () => {
    const { s } = make('classic');
    s.tick(1000);
    s.pause();
    s.tick(5000);
    expect(s.elapsedMs).toBe(1000);
    s.resume();
    s.tick(500);
    expect(s.elapsedMs).toBe(1500);
  });
});

const openCells = (s: Session): number[] => s.game.values.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);

describe('session: undo/redo cannot farm Dash time or score', () => {
  it('re-entering an undone correct digit pays nothing the second time', () => {
    const { s } = make('dash');
    const cell = 2;
    s.select(cell);
    s.input(Number(SOLUTION[cell]));
    const afterFirst = { ...s.dash! };
    for (let i = 0; i < 5; i++) {
      s.undo();
      s.select(cell);
      s.input(Number(SOLUTION[cell]));
    }
    expect(s.dash!.timeLeftMs).toBe(afterFirst.timeLeftMs);
    expect(s.dash!.score).toBe(afterFirst.score);
    expect(s.dash!.combo).toBe(afterFirst.combo);
    expect(s.game.values[cell]).toBe(Number(SOLUTION[cell]));
  });

  it('emits no payout popups for a repeated cell', () => {
    const { s, events } = make('dash');
    s.select(2);
    s.input(Number(SOLUTION[2]));
    s.undo();
    events.length = 0;
    s.input(Number(SOLUTION[2]));
    expect(events.some((e) => e.type === 'popup' || e.type === 'clock')).toBe(false);
  });

  it('a cell filled by a hint cannot be undone and re-entered for a payout', () => {
    const { s } = make('dash');
    s.requestHint();
    const before = s.dash!.score;
    s.applyCurrentHint();
    const filled = s.game.values.findIndex((v, i) => v !== 0 && v === s.game.solution[i] && s.game.puzzle[i] === 0);
    expect(filled).toBeGreaterThanOrEqual(0);
    s.undo();
    s.select(filled);
    s.input(Number(SOLUTION[filled]));
    expect(s.dash!.score).toBe(before);
  });

  it('mistakes are still charged every time', () => {
    const { s } = make('dash');
    s.select(2);
    s.input(wrongDigit(2));
    s.undo();
    s.input(wrongDigit(2));
    expect(s.mistakes).toBe(2);
  });
});

describe('session: pause state', () => {
  it('a paused Dash session does not consume the countdown or elapsed time', () => {
    const { s } = make('dash');
    const before = s.dash!.timeLeftMs;
    s.pause('menu');
    s.tick(60_000);
    expect(s.dash!.timeLeftMs).toBe(before);
    expect(s.elapsedMs).toBe(0);
    expect(s.status).toBe('paused');
  });

  it('cannot time out, place digits or use tools while paused', () => {
    const { s } = make('dash');
    s.pause('menu');
    s.tick(10_000_000);
    expect(s.status).toBe('paused');
    s.select(2);
    s.input(Number(SOLUTION[2]));
    expect(s.game.values[2]).toBe(0);
    s.solveAll();
    expect(s.status).toBe('paused');
  });

  it('resumes where it stopped, remembers why it paused, and "ready" replaces an earlier reason', () => {
    const { s } = make('dash');
    s.tick(1000);
    s.pause('hidden');
    expect(s.pauseReason).toBe('hidden');
    s.pause('ready');
    expect(s.pauseReason).toBe('ready');
    s.pause('blur');
    expect(s.pauseReason).toBe('ready');
    const left = s.dash!.timeLeftMs;
    s.resume();
    expect(s.status).toBe('playing');
    expect(s.pauseReason).toBeNull();
    s.tick(500);
    expect(s.dash!.timeLeftMs).toBe(left - 500);
  });

  it('plays the pause cue only for a manual pause, the start cue when leaving "ready"', () => {
    const { s, events } = make('classic');
    s.pause('hidden');
    expect(events.some((e) => e.type === 'sfx' && e.name === 'pause')).toBe(false);
    s.pause('ready');
    s.resume();
    expect(events.some((e) => e.type === 'sfx' && e.name === 'start')).toBe(true);
    events.length = 0;
    s.pause('manual');
    expect(events.some((e) => e.type === 'sfx' && e.name === 'pause')).toBe(true);
  });
});

describe('session: solver and scoring rules', () => {
  it('Solve all in Dash pays no time bonus', () => {
    const { s } = make('dash');
    s.solveAll();
    expect(s.status).toBe('won');
    expect(s.assisted).toBe(true);
    expect(s.dashBreakdown?.bonus).toBe(0);
    expect(s.finalScore).toBe(0);
  });

  it('an unassisted Dash win pays the bonus and reports the breakdown and best combo', () => {
    const { s } = make('dash');
    for (const c of openCells(s)) {
      s.select(c);
      s.input(Number(SOLUTION[c]));
    }
    const b = s.dashBreakdown!;
    expect(s.status).toBe('won');
    expect(b.bonus).toBeGreaterThan(0);
    expect(b.base + b.bonus).toBe(s.finalScore);
    expect(b.bestCombo).toBe(DASH.maxCombo);
  });

  it('a lost Classic run scores 0, a won one scores more than 0', () => {
    const lost = make('classic');
    for (const c of openCells(lost.s).slice(0, 3)) {
      lost.s.select(c);
      lost.s.input(wrongDigit(c));
    }
    expect(lost.s.status).toBe('lost');
    expect(lost.s.finalScore).toBe(0);
    const won = make('classic');
    won.s.solveAll();
    expect(won.s.finalScore).toBeGreaterThan(0);
  });

  it('a mistake emits the cell shake, the -10s popup and an announcement in Dash', () => {
    const { s, events } = make('dash');
    s.select(2);
    s.input(wrongDigit(2));
    expect(events.some((e) => e.type === 'mistake' && e.cell === 2)).toBe(true);
    expect(events.some((e) => e.type === 'popup' && !e.good && e.text === '-10s')).toBe(true);
    expect(events.some((e) => e.type === 'announce')).toBe(true);
  });

  it('tracks mistake cells for the share grid, and a repeated press on a locked cell makes the tap cue', () => {
    const { s, events } = make('classic', false);
    s.select(2);
    s.input(wrongDigit(2));
    expect([...s.mistakeCells]).toEqual([2]);
    s.select(0);
    events.length = 0;
    s.input(1);
    expect(events.some((e) => e.type === 'sfx' && e.name === 'tap')).toBe(true);
  });

  it('completing a row emits a house flash for its cells', () => {
    const { s, events } = make('classic');
    const rowOpen = openCells(s).filter((c) => c < 9);
    for (const c of rowOpen) {
      s.select(c);
      s.input(Number(SOLUTION[c]));
    }
    const flash = events.find((e) => e.type === 'house');
    expect(flash && flash.type === 'house' && flash.cells.length).toBeGreaterThanOrEqual(9);
  });
});

describe('session: countdown cues', () => {
  it('ticks once per second in the final seconds and warns once at the low mark', () => {
    const { s, events } = make('dash');
    s.tick((s.dash!.timeLeftMs - 12_000));
    events.length = 0;
    for (let i = 0; i < 120; i++) s.tick(100);
    const ticks = events.filter((e) => e.type === 'sfx' && e.name === 'tick');
    expect(ticks.length).toBe(10);
    s.tick(5_000);
    const { s: s2, events: ev2 } = make('dash');
    s2.tick(s2.dash!.timeLeftMs - 31_000);
    for (let i = 0; i < 40; i++) s2.tick(100);
    expect(ev2.filter((e) => e.type === 'announce' && /seconds left/.test(e.text)).length).toBe(1);
  });
});
