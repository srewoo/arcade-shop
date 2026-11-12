import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { Game, type FxEvent } from '../src/game/game';
import { bestShot } from '../src/physics/solver';
import { distanceField } from '../src/course/validate';
import type { Player } from '../src/game/players';

const P = (n: string, c: Player['color']): Player => ({ name: n, color: c });

function make(): { g: Game; fx: FxEvent[]; changes: number[] } {
  const fx: FxEvent[] = [];
  const changes: number[] = [];
  const g = new Game({ onFx: (e) => fx.push(e), onChange: () => changes.push(1) });
  return { g, fx, changes };
}
const run = (g: Game, sec: number): void => { for (let t = 0; t < sec; t += 1 / 60) g.frame(1 / 60); };
function bot(g: Game): void {
  if (!g.sim || !g.match) throw new Error('no match');
  const shot = bestShot(g.sim, distanceField(g.match.hole));
  if (!shot) throw new Error('bot stuck');
  g.aim = shot;
  expect(g.shoot()).toBe(true);
}
function finishTurn(g: Game): void {
  const hole = g.match?.holeIdx;
  const who = g.playerIdx;
  for (let i = 0; i < 20 && g.canShoot && g.playerIdx === who && g.match?.holeIdx === hole; i++) {
    bot(g);
    for (let t = 0; t < 14 && g.phase !== 'aim' && g.phase !== 'holeDone' && g.playerIdx === who; t += 0.25) run(g, 0.25);
    if (g.phase === 'sinking') run(g, CONFIG.flow.sinkSec + 0.2);
  }
}

describe('Game flow', () => {
  it('starts on the tee of hole 1 with the first player', () => {
    const { g } = make();
    g.start({ course: 'front9', players: [P('A', 'tomato'), P('B', 'sky')] });
    expect(g.phase).toBe('aim');
    expect(g.match?.hole.id).toBe(1);
    expect(g.playerIdx).toBe(0);
    expect(g.strokes).toBe(0);
  });

  it('counts strokes, records a hole-out and emits callouts', () => {
    const { g, fx } = make();
    g.start({ course: 'front9', players: [P('A', 'tomato')] });
    g.aim = { angle: 0, power: 0.82 };
    expect(g.shoot()).toBe(true);
    expect(g.phase).toBe('rolling');
    expect(g.shoot()).toBe(false);
    run(g, 10);
    finishTurn(g);
    expect(g.match?.scores[0]?.[0]).toBeGreaterThan(0);
    expect(fx.some((e) => e.type === 'callout')).toBe(true);
    expect(g.phase).toBe('holeDone');
  });

  it('two players alternate; lowest score tees off first on the next hole', () => {
    const { g } = make();
    g.start({ course: 'front9', players: [P('A', 'tomato'), P('B', 'sky')] });
    finishTurn(g);
    expect(g.phase).toBe('aim');
    expect(g.playerIdx).toBe(1);
    finishTurn(g);
    expect(g.phase).toBe('holeDone');
    const [a, b] = [g.match?.scores[0]?.[0] ?? 0, g.match?.scores[1]?.[0] ?? 0];
    g.nextHole();
    expect(g.match?.hole.id).toBe(2);
    expect(g.playerIdx).toBe(b < a ? 1 : 0);
  });

  it('adds a stroke penalty for water and returns to the last spot', () => {
    const { g, fx } = make();
    g.start({ course: 'all18', startHole: 6, players: [P('A', 'tomato')] });
    expect(g.match?.hole.id).toBe(7);
    g.aim = { angle: -0.35, power: 0.8 }; // straight into the first pond
    g.shoot();
    run(g, 6);
    expect(fx.some((e) => e.type === 'splash')).toBe(true);
    expect(g.strokes).toBeGreaterThanOrEqual(1 + CONFIG.shot.waterPenalty);
    run(g, 2);
    expect(g.phase).toBe('aim');
    expect(g.sim?.ball.x).toBe(g.match?.hole.tee.x);
  });

  it('picks up after the stroke limit', () => {
    const { g } = make();
    g.start({ course: 'front9', players: [P('A', 'tomato')] });
    for (let i = 0; i < CONFIG.shot.maxStrokes; i++) {
      g.aim = { angle: Math.PI, power: 0.06 }; // taps into the back wall, never reaching the cup
      g.shoot();
      run(g, 4);
    }
    expect(g.match?.scores[0]?.[0]).toBe(CONFIG.shot.maxStrokes);
    expect(g.match?.pickups[0]?.[0]).toBe(true);
    run(g, 2);
    expect(g.phase).toBe('holeDone');
  });

  it('pausing freezes the simulation; resume continues', () => {
    const { g } = make();
    g.start({ course: 'front9', players: [P('A', 'tomato')] });
    g.aim = { angle: 0, power: 0.5 };
    g.shoot();
    run(g, 0.3);
    g.pause();
    const x = g.sim?.ball.x;
    run(g, 2);
    expect(g.sim?.ball.x).toBe(x);
    expect(g.canShoot).toBe(false);
    g.resume();
    run(g, 0.3);
    expect(g.sim?.ball.x).not.toBe(x);
  });

  it('plays a whole Front 9 and completes, then restarts clean', () => {
    const { g } = make();
    g.start({ course: 'front9', players: [P('A', 'tomato'), P('B', 'sky')] });
    for (let h = 0; h < 9; h++) {
      finishTurn(g); finishTurn(g);
      expect(g.phase).toBe('holeDone');
      g.nextHole();
    }
    expect(g.phase).toBe('complete');
    const st = g.match?.standings();
    expect(st?.totals.every((t) => t >= 9)).toBe(true);
    g.restartMatch();
    expect(g.phase).toBe('aim');
    expect(g.match?.scores[0]?.every((s) => s === null)).toBe(true);
  });

  it('pause is a no-op on the title and between holes', () => {
    const { g } = make();
    g.pause();
    expect(g.paused).toBe(false);
    g.start({ course: 'back9', players: [P('A', 'tomato')] });
    g.toSetup();
    expect(g.phase).toBe('setup');
  });
});
