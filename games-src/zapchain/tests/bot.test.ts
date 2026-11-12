import { describe, expect, it } from 'vitest';
import { Attract } from '../src/attract';
import { bestMove } from '../src/model/bot';
import { layout } from './helpers';

describe('bot', () => {
  it('picks the biggest group', () => {
    const sim = layout(['1123', '1123', '4411']);
    expect(bestMove(sim)).toMatchObject({ col: 0 });
  });
  it('uses a bomb when its row is full enough, otherwise ignores it', () => {
    expect(bestMove(layout(['1234512345', '6.........']))).toBeNull();
    expect(bestMove(layout(['6234512345']))).toEqual({ col: 0, row: 11 });
  });
  it('returns null on a dead board', () => {
    expect(bestMove(layout(['12', '21']))).toBeNull();
  });
});

describe('attract demo', () => {
  it('plays itself and keeps going for a long time without throwing', () => {
    const a = new Attract(() => 42);
    let zaps = 0;
    for (let i = 0; i < 60 * 60; i++) zaps += a.step(1 / 60).filter((e) => e.t === 'zap' || e.t === 'bomb').length;
    expect(zaps).toBeGreaterThan(10);
  });
});
