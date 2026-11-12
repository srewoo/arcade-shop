import { describe, expect, it } from 'vitest';
import { createGame, tick } from '../src/core/step';
import { defaultConfig, type TickInput } from '../src/core/state';
import { input } from './helpers';

function script(seed: number, n: number): TickInput[] {
  let a = seed;
  const r = () => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: n }, () =>
    input({ left: r() < 0.2, right: r() < 0.2, down: r() < 0.3, rotCW: r() < 0.08, rotCCW: r() < 0.05, hard: r() < 0.04, stash: r() < 0.01 }),
  );
}

function play(seed: number, inputs: TickInput[]) {
  const s = createGame(defaultConfig({ seed, mode: 'zen', zenGarbage: true }));
  for (const i of inputs) tick(s, i);
  return { board: s.board, score: s.score, lines: s.lines, placed: s.piecesPlaced, stash: s.stash };
}

describe('determinism', () => {
  it('same seed + inputs gives the same board, score and counts', () => {
    const inputs = script(99, 6000);
    const a = play(1234, inputs);
    const b = play(1234, inputs);
    expect(a).toEqual(b);
    expect(a.placed).toBeGreaterThan(20);
  });
  it('a different seed diverges', () => {
    const inputs = script(99, 3000);
    expect(play(1, inputs).board).not.toEqual(play(2, inputs).board);
  });
});
