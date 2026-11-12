import { describe, expect, it } from 'vitest';
import { act, advanceTurn, createMatch, currentFrame, setCurve, throwNow, totals, type Match } from '../src/match';
import { stepMatch, triangle } from '../src/matchStep';
import { frameState } from '../src/scoring';

const mk = (players: 1 | 2 = 1, seed = 11): Match => createMatch({ players, difficulty: 'normal', seed });
function bowl(m: Match, angle = 0, power = 0.9, curve = 0): void {
  throwNow(m, angle, power, curve);
  let n = 0;
  while (m.phase === 'rolling' && n++ < 3000) stepMatch(m, 1 / 60);
  while (m.phase === 'result') stepMatch(m, 1 / 60);
}

describe('match flow', () => {
  it('starts in the aim phase with a sweeping arrow', () => {
    const m = mk();
    expect(m.phase).toBe('aim');
    const a0 = m.aim.angle;
    for (let i = 0; i < 30; i++) stepMatch(m, 1 / 60);
    expect(m.aim.angle).not.toBe(a0);
    expect(Math.abs(m.aim.angle)).toBeLessThanOrEqual(0.2);
  });
  it('changes the arrow sweep speed on every throw', () => {
    const m = mk();
    const speeds = new Set<number>([m.aim.speed]);
    for (let i = 0; i < 4; i++) { bowl(m); if (m.phase === 'aim') speeds.add(m.aim.speed); }
    expect(speeds.size).toBeGreaterThanOrEqual(4);
  });
  it('is deterministic for a seed', () => {
    const a = mk(1, 5), b = mk(1, 5);
    for (let i = 0; i < 6; i++) { bowl(a, 0.01 * i, 0.8, i % 3); bowl(b, 0.01 * i, 0.8, i % 3); }
    expect(a.players[0]?.rolls).toEqual(b.players[0]?.rolls);
    expect(a.aim.speed).toBe(b.aim.speed);
  });
  it('act locks aim, then throws; extra presses while rolling are ignored', () => {
    const m = mk();
    act(m); expect(m.phase).toBe('power');
    for (let i = 0; i < 60; i++) stepMatch(m, 1 / 60);
    expect(m.power.value).toBeGreaterThan(0.3);
    act(m); expect(m.phase).toBe('rolling');
    act(m); expect(m.phase).toBe('rolling');
  });
  it('power meter is a 0..1 triangle wave', () => {
    expect(triangle(0)).toBe(0);
    expect(triangle(0.5)).toBe(1);
    expect(triangle(1)).toBeCloseTo(0);
    expect(triangle(1.25)).toBeCloseTo(0.5);
  });
  it('clamps the curve', () => {
    const m = mk();
    for (let i = 0; i < 9; i++) setCurve(m, 1);
    expect(m.curve).toBe(3);
    for (let i = 0; i < 9; i++) setCurve(m, -1);
    expect(m.curve).toBe(-3);
  });
  it('records rolls, keeps the rack for ball two and re-racks for the next frame', () => {
    const m = mk();
    bowl(m, 0.03, 0.8, 0);
    const first = m.players[0]?.rolls[0] ?? -1;
    if (first < 10) {
      expect(frameState(m.players[0]?.rolls ?? [])).toMatchObject({ frame: 1, ball: 2 });
      expect(m.world.cats.filter((c) => c.gone)).toHaveLength(first);
      bowl(m, 0, 0.8, 0);
    }
    expect(currentFrame(m)).toBe(2);
    expect(m.world.cats.every((c) => !c.gone && !c.hit)).toBe(true);
  });
  it('ends after ten frames with a legal total', () => {
    const m = mk();
    let guard = 0;
    while (m.phase !== 'over' && guard++ < 40) bowl(m, 0.005 * (guard % 5), 0.85, guard % 3);
    expect(m.phase).toBe('over');
    const total = totals(m)[0];
    expect(total?.bowling).toBeGreaterThan(0);
    expect(total?.bowling).toBeLessThanOrEqual(300);
    expect(m.events.some((e) => e.type === 'over')).toBe(true);
  });
  it('two players alternate frames and both finish', () => {
    const m = mk(2);
    expect(m.current).toBe(0);
    bowl(m, 0.1, 0.5, 0); bowl(m, 0.1, 0.5, 0); // two gutter-ish balls end frame 1 for player 1
    expect(m.current).toBe(1);
    let guard = 0;
    while (m.phase !== 'over' && guard++ < 80) bowl(m, 0.004 * (guard % 4), 0.85, 0);
    expect(m.phase).toBe('over');
    expect(m.players.every((p) => frameState(p.rolls).complete)).toBe(true);
  });
  it('fish frames are announced via 3 frames and add bonus points when collected', () => {
    const m = mk();
    expect(m.fishFrames).toHaveLength(3);
    const m2 = mk(1, 21);
    const frame = m2.fishFrames[0] ?? 1;
    let guard = 0;
    while (currentFrame(m2) < frame && guard++ < 30) bowl(m2, 0, 0.85, 0);
    expect(m2.world.fish).not.toBeNull();
    const fish = m2.world.fish;
    if (fish) {
      const dy = fish.y, dx = fish.x;
      throwNow(m2, Math.atan2(dy, dx), 0.85, 0);
      while (m2.phase === 'rolling') stepMatch(m2, 1 / 60);
      expect(fish.taken).toBe(true);
      expect(totals(m2)[0]?.fish).toBe(5);
    }
  });
  it('advanceTurn on an unfinished 10th frame keeps the same player', () => {
    const m = mk();
    let guard = 0;
    while (currentFrame(m) < 10 && guard++ < 30) bowl(m);
    expect(currentFrame(m)).toBe(10);
    advanceTurn(m);
    expect(m.current).toBe(0);
  });
});
