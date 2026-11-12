import { describe, expect, it } from 'vitest';
import { doStash, ghostY, hardDrop } from '../src/core/actions';
import { createBoard, HEIGHT, WIDTH } from '../src/core/board';
import { tick } from '../src/core/step';
import { fillRow, game, input, setPiece } from './helpers';

describe('lock delay', () => {
  const grounded = () => {
    const s = game({ lockDelay: 30, moveResetLimit: 15 });
    setPiece(s, { id: 'hookL', rot: 0, x: 3, y: HEIGHT - 2 });
    return s;
  };
  it('locks after the delay when nothing moves', () => {
    const s = grounded();
    for (let i = 0; i < 29; i++) tick(s, input());
    expect(s.piecesPlaced).toBe(0);
    tick(s, input());
    expect(s.piecesPlaced).toBe(1);
  });
  it('moves reset the timer up to the limit, then it locks regardless', () => {
    const s = grounded();
    let tickCount = 0;
    while (s.piecesPlaced === 0 && tickCount < 1000) {
      // pulse left/right every 5 ticks to keep resetting
      const pulse = tickCount % 10 === 0 ? { left: true } : tickCount % 10 === 5 ? { right: true } : {};
      tick(s, input(pulse));
      tickCount++;
    }
    expect(s.piecesPlaced).toBe(1);
    // 15 resets x 5 ticks apart + 30 delay, never infinite
    expect(tickCount).toBeLessThan(15 * 5 + 40);
    expect(tickCount).toBeGreaterThan(15 * 5);
  });
  it('moveResets never exceeds the limit', () => {
    const s = grounded();
    for (let i = 0; i < 12; i++) tick(s, input({ rotCW: i % 2 === 0, rotCCW: i % 2 === 1 }));
    expect(s.moveResets).toBeLessThanOrEqual(15);
  });
  it('falling to a new lowest row restores the reset budget', () => {
    const s = game();
    setPiece(s, { id: 'cube', rot: 0, x: 4, y: 5 });
    s.moveResets = 15;
    s.lockTimer = 20;
    s.gravAcc = 5; // force a fall
    tick(s, input());
    expect(s.moveResets).toBe(0);
  });
});

describe('drops and stash', () => {
  it('hard drop scores 2 per row and locks immediately', () => {
    const s = game();
    const y0 = s.piece!.y;
    const rows = ghostY(s) - y0;
    tick(s, input({ hard: true }));
    expect(s.score).toBe(rows * 2);
    expect(s.piecesPlaced).toBe(1);
  });
  it('soft drop scores 1 per row', () => {
    const s = game();
    for (let i = 0; i < 6; i++) tick(s, input({ down: true }));
    expect(s.score).toBeGreaterThan(0);
    expect(s.score).toBe(s.piece!.y - 1);
  });
  it('ghost sits on the floor for an empty well', () => {
    const s = game();
    setPiece(s, { id: 'cube', rot: 0, x: 0, y: 3 });
    expect(ghostY(s)).toBe(HEIGHT - 2);
    expect(hardDrop(s)).toBe(HEIGHT - 5);
  });
  it('stash works once per drop and returns the piece next time', () => {
    const s = game({ seed: 5 });
    const first = s.piece!.id;
    expect(doStash(s)).toBe(true);
    expect(s.stash).toBe(first);
    const second = s.piece!.id;
    expect(doStash(s)).toBe(false);
    tick(s, input({ hard: true }));
    expect(doStash(s)).toBe(true);
    expect(s.piece!.id).toBe(first);
    expect(s.stash).not.toBe(first);
    expect(second).toBeDefined();
  });
});

describe('modes', () => {
  it('Sprint finishes at exactly 40 lines', () => {
    const s = game({ mode: 'sprint', seed: 9 });
    expect(s.rules.goalLines).toBe(40);
    s.lines = 39;
    fillRow(s.board, HEIGHT - 1, [0, 1]);
    setPiece(s, { id: 'hookL', rot: 0, x: 0, y: 5 }); // fits the two-wide gap with a flat drop
    s.piece = { id: 'cube', rot: 0, x: 0, y: 5 };
    tick(s, input({ hard: true }));
    expect(s.lines).toBe(40);
    expect(s.status).toBe('won');
    const before = s.ticks;
    tick(s, input());
    expect(s.ticks).toBe(before); // frozen once finished
  });
  it('Marathon levels rise every 10 lines up to 15', () => {
    const s = game({ mode: 'marathon' });
    expect(s.level).toBe(1);
    s.lines = 9;
    fillRow(s.board, HEIGHT - 1, [0, 1]);
    s.piece = { id: 'cube', rot: 0, x: 0, y: 5 };
    tick(s, input({ hard: true }));
    expect(s.level).toBe(2);
  });
  it('Ultra ends at 2 minutes', () => {
    const s = game({ mode: 'ultra' });
    for (let i = 0; i < 7300 && s.status === 'playing'; i++) {
      s.board = createBoard();
      tick(s, input({ hard: i % 30 === 0 }));
    }
    expect(s.status).toBe('time');
    expect(s.ticks).toBe(7200);
  });
  it('Dig starts with garbage and wins when none is left', () => {
    const s = game({ mode: 'dig', seed: 3 });
    expect(s.garbageLeft).toBe(90);
    s.board = createBoard();
    fillRow(s.board, HEIGHT - 1, [0, 1]);
    s.board[HEIGHT - 1] = (s.board[HEIGHT - 1] as number[]).map((c) => (c ? 8 : 0));
    s.piece = { id: 'cube', rot: 0, x: 0, y: 5 };
    tick(s, input({ hard: true }));
    expect(s.status).toBe('won');
  });
  it('game over when the stack blocks the spawn; Zen never ends', () => {
    for (const mode of ['marathon', 'zen'] as const) {
      const s = game({ mode });
      for (let y = 2; y < HEIGHT; y++) fillRow(s.board, y, [0]);
      for (let y = 0; y < 2; y++) fillRow(s.board, y, [WIDTH - 1]);
      s.piece = { id: 'cube', rot: 0, x: 0, y: 0 };
      s.board[0] = new Array<number>(WIDTH).fill(0);
      (s.board[0] as number[])[4] = 8;
      (s.board[0] as number[])[5] = 8;
      tick(s, input({ hard: true }));
      expect(s.status).toBe(mode === 'zen' ? 'playing' : 'over');
    }
  });
  it('Zen rising garbage adds rows when enabled', () => {
    const s = game({ mode: 'zen', zenGarbage: true });
    for (let i = 0; i < 601; i++) tick(s, input());
    expect(s.events.some((e) => e.type === 'garbage')).toBe(true);
  });
});
