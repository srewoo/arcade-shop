import { describe, expect, it } from 'vitest';
import { restoreSession } from '../src/session';

const base = { round: 3, starter: 'O', variant: 'classic', moves: [4, 0] };

describe('session restore', () => {
  it('replays a valid move list', () => {
    const r = restoreSession(base, 'classic');
    expect(r?.round).toBe(3);
    expect(r?.state.board[4]).toBe('O');
    expect(r?.state.board[0]).toBe('X');
    expect(r?.state.turn).toBe('O');
  });

  it('accepts an empty round (keeps the round counter after reload)', () => {
    expect(restoreSession({ ...base, moves: [] }, 'classic')?.state.moves).toBe(0);
  });

  it.each([
    ['illegal (cell reused)', { ...base, moves: [4, 4] }],
    ['out of range', { ...base, moves: [9] }],
    ['finished game', { ...base, starter: 'X', moves: [0, 3, 1, 4, 2] }],
    ['unknown field', { ...base, evil: 1 }],
    ['bad starter', { ...base, starter: 'Z' }],
    ['too many moves', { ...base, variant: 'vanishing', moves: Array<number>(61).fill(0) }],
    ['not an object', 'x'],
    ['null', null],
  ])('rejects %s', (_name, raw) => {
    expect(restoreSession(raw, 'classic')).toBeNull();
  });

  it('is ignored when the variant setting changed', () => {
    expect(restoreSession(base, 'vanishing')).toBeNull();
  });
});
