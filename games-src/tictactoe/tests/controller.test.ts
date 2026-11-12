import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Controller, type MoveInfo } from '../src/controller';
import type { Settings } from '../src/settings';
import { newGame, play } from '../src/game';

type S = Pick<Settings, 'opponent' | 'level' | 'variant'>;

function make(overrides: Partial<S> = {}, choose?: (n: number) => number) {
  const settings: S = { opponent: 'cpu', level: 'easy', variant: 'classic', ...overrides };
  const moves: MoveInfo[] = [];
  let changes = 0;
  let calls = 0;
  const ctrl = new Controller(
    {
      settings: () => settings,
      onMove: (info) => moves.push(info),
      onChange: () => (changes += 1),
      choose: (s) => {
        calls += 1;
        return choose ? choose(calls) : (s.board.findIndex((c) => c === null));
      },
      delayMs: 380,
    },
    settings.variant,
    'X',
  );
  return { ctrl, settings, moves, changes: () => changes, calls: () => calls };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('CPU timer', () => {
  it('answers after the configured delay, not before', () => {
    const { ctrl, moves } = make();
    ctrl.humanMove(4);
    vi.advanceTimersByTime(379);
    expect(moves.map((m) => m.source)).toEqual(['human']);
    vi.advanceTimersByTime(2);
    expect(moves.map((m) => m.source)).toEqual(['human', 'cpu']);
  });

  it('does not start a CPU turn in 2-player mode', () => {
    const { ctrl, moves } = make({ opponent: 'human' });
    ctrl.humanMove(4);
    vi.advanceTimersByTime(2000);
    expect(moves).toHaveLength(1);
    expect(ctrl.cpuTurn).toBe(false);
  });
});

describe('pause', () => {
  it('stops the CPU while paused and resumes it on resume', () => {
    const { ctrl, moves } = make();
    ctrl.humanMove(4);
    ctrl.pause('manual');
    vi.advanceTimersByTime(5000);
    expect(moves).toHaveLength(1);
    expect(ctrl.paused).toBe(true);
    ctrl.resume('manual');
    vi.advanceTimersByTime(381);
    expect(moves).toHaveLength(2);
  });

  it('stays paused until every reason is cleared', () => {
    const { ctrl, moves } = make();
    ctrl.humanMove(4);
    ctrl.pause('manual');
    ctrl.pause('settings');
    ctrl.resume('settings');
    vi.advanceTimersByTime(2000);
    expect(ctrl.paused).toBe(true);
    expect(moves).toHaveLength(1);
    ctrl.resume('manual');
    vi.advanceTimersByTime(400);
    expect(moves).toHaveLength(2);
  });

  it('ignores human moves while paused (no state change)', () => {
    const { ctrl } = make({ opponent: 'human' });
    ctrl.pause('auto');
    expect(ctrl.humanMove(0)).toBe('denied');
    expect(ctrl.state.moves).toBe(0);
  });

  it('resume of a reason that was never set does nothing', () => {
    const { ctrl, changes } = make();
    const before = changes();
    ctrl.resume('auto');
    expect(changes()).toBe(before);
  });

  it('a CPU opening (first move O) waits while paused and counts as in progress', () => {
    const { ctrl, moves } = make();
    ctrl.newRound('O', false);
    expect(ctrl.inProgress).toBe(true);
    ctrl.pause('auto');
    vi.advanceTimersByTime(3000);
    expect(moves).toHaveLength(0);
    ctrl.resume('auto');
    vi.advanceTimersByTime(381);
    expect(moves).toHaveLength(1);
  });

  it('a finished game is not in progress', () => {
    const { ctrl } = make({ opponent: 'human' });
    [0, 3, 1, 4, 2].forEach((m) => ctrl.humanMove(m));
    expect(ctrl.inProgress).toBe(false);
    expect(ctrl.humanMove(8)).toBe('denied');
  });
});

describe('premove', () => {
  it('queues one premove during the CPU turn and plays it afterwards', () => {
    const { ctrl, moves } = make({}, () => 0);
    ctrl.humanMove(4);
    expect(ctrl.humanMove(8)).toBe('queued');
    expect(ctrl.premove).toBe(8);
    vi.advanceTimersByTime(381);
    expect(moves.map((m) => m.source)).toEqual(['human', 'cpu', 'premove']);
    expect(ctrl.state.board[8]).toBe('X');
    expect(ctrl.premove).toBeNull();
  });

  it('drops the premove when the CPU took that cell', () => {
    const { ctrl, moves } = make({}, () => 8);
    ctrl.humanMove(4);
    ctrl.humanMove(8);
    vi.advanceTimersByTime(381);
    expect(moves.map((m) => m.source)).toEqual(['human', 'cpu']);
    expect(ctrl.premove).toBeNull();
  });

  it('only the latest premove is kept', () => {
    const { ctrl } = make({}, () => 0);
    ctrl.humanMove(4);
    ctrl.humanMove(7);
    ctrl.humanMove(8);
    vi.advanceTimersByTime(381);
    expect(ctrl.state.board[8]).toBe('X');
    expect(ctrl.state.board[7]).toBeNull();
  });

  it('is discarded by a new round', () => {
    const { ctrl } = make();
    ctrl.humanMove(4);
    ctrl.humanMove(8);
    ctrl.newRound('X', true);
    expect(ctrl.premove).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(ctrl.state.moves).toBe(0);
  });

  it('is not played if the CPU move ended the game', () => {
    const { ctrl, moves } = make({}, (n) => [3, 4, 5][n - 1] ?? 0);
    ctrl.humanMove(0);
    vi.advanceTimersByTime(381);
    ctrl.humanMove(1);
    vi.advanceTimersByTime(381);
    ctrl.humanMove(8);
    expect(ctrl.humanMove(2)).toBe('queued');
    vi.advanceTimersByTime(381);
    expect(ctrl.state.winner).toBe('O');
    expect(moves.at(-1)?.source).toBe('cpu');
    expect(ctrl.premove).toBeNull();
  });

  it('human cannot queue onto a taken cell', () => {
    const { ctrl } = make();
    ctrl.humanMove(4);
    expect(ctrl.humanMove(4)).toBe('denied');
  });
});

describe('rounds and restore', () => {
  it('new round clears history and advances the counter only when asked', () => {
    const { ctrl } = make({ opponent: 'human' });
    ctrl.humanMove(0);
    ctrl.newRound('O', false);
    expect(ctrl.round).toBe(0);
    expect(ctrl.history).toEqual([]);
    ctrl.newRound('X', true);
    expect(ctrl.round).toBe(1);
  });

  it('tracks the move history and vanished cells', () => {
    const { ctrl, moves } = make({ opponent: 'human', variant: 'vanishing' });
    [0, 3, 1, 4, 6, 8, 2].forEach((m) => ctrl.humanMove(m));
    expect(ctrl.history).toEqual([0, 3, 1, 4, 6, 8, 2]);
    expect(moves.at(-1)?.vanishedCell).toBe(0);
    expect(moves.at(-1)?.vanished).toBe(true);
  });

  it('restore re-arms the CPU timer when the CPU is to move', () => {
    const { ctrl, moves } = make();
    const state = play(newGame('classic', 'X'), 4);
    ctrl.restore(state, 'X', 2, [4]);
    expect(ctrl.round).toBe(2);
    vi.advanceTimersByTime(381);
    expect(moves.map((m) => m.source)).toEqual(['cpu']);
  });
});
