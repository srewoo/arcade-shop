import { describe, expect, it } from 'vitest';
import type { Banner } from '../src/announce';
import type { AudioEngine } from '../src/audio';
import { chooseShot } from '../src/cpu';
import { Game } from '../src/game';
import { isGameComplete, totalScore } from '../src/scoring';
import { matchScore, type Match, type MatchConfig } from '../src/match';
import { createRng } from '../src/rng';

const silent = new Proxy({}, { get: () => () => undefined }) as unknown as AudioEngine;

function playOut(cfg: MatchConfig): { game: Game; banners: Banner[]; overs: number } {
  const banners: Banner[] = [];
  let overs = 0;
  const game = new Game(silent, { onChange: () => undefined, onBanner: (b) => banners.push(b), onOver: () => { overs++; } }, 5);
  game.start(cfg);
  const rng = createRng(21);
  for (let t = 0; t < 3000 && !game.match.over; t += 1 / 60) {
    if (game.humanTurn) game.throwShot(chooseShot(game.match.mask, 'pro', rng));
    game.update(1 / 60);
  }
  for (let t = 0; t < 3; t += 1 / 60) game.update(1 / 60);
  return { game, banners, overs };
}

describe('Game controller (headless)', () => {
  it('plays a full solo game to a legal score', () => {
    const { game, overs } = playOut({ mode: 'solo', players: 1, cpuLevel: 'easy' });
    expect(game.match.over).toBe(true);
    expect(game.stage).toBe('over');
    expect(overs).toBe(1);
    const rolls = game.match.rolls[0] as number[];
    expect(isGameComplete(rolls)).toBe(true);
    const score = totalScore(rolls);
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThanOrEqual(300);
  });
  it('lets the CPU rival bowl its own frames', () => {
    const { game } = playOut({ mode: 'cpu', players: 2, cpuLevel: 'pro' });
    expect(game.match.over).toBe(true);
    const m: Match = game.match;
    expect(isGameComplete(m.rolls[1] as number[])).toBe(true);
    expect(matchScore(m, 1)).toBeGreaterThan(0);
  });
  it('runs the spare challenge for ten leaves', () => {
    const { game } = playOut({ mode: 'spare', players: 1, cpuLevel: 'easy', seed: 9 });
    expect(game.match.rolls[0]).toHaveLength(10);
    expect(game.match.over).toBe(true);
  });
  it('ignores input while the ball is rolling or during the CPU turn', () => {
    const game = new Game(silent, { onChange: () => undefined, onBanner: () => undefined, onOver: () => undefined }, 1);
    game.start({ mode: 'cpu', players: 2, cpuLevel: 'easy' });
    game.throwShot({ x: 0, aim: 0, power: 1, spin: 0 });
    expect(game.stage).toBe('rolling');
    const before = game.input;
    game.confirm();
    game.nudge(10);
    expect(game.input).toBe(before);
  });
  it('emits banners for strikes', () => {
    const banners: Banner[] = [];
    const game = new Game(silent, { onChange: () => undefined, onBanner: (b) => banners.push(b), onOver: () => undefined }, 1);
    game.start({ mode: 'solo', players: 1, cpuLevel: 'easy' });
    game.throwShot({ x: 0, aim: -0.0045, power: 1, spin: 0 });
    for (let t = 0; t < 12 && banners.length === 0; t += 1 / 60) game.update(1 / 60);
    expect(banners[0]?.text).toBe('STRIKE!');
  });
});
