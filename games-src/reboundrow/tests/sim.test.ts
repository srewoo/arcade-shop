import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { sweepCircleBox } from '../src/sim/collide';
import { moveBall } from '../src/sim/balls';
import { stepWorld, NO_INPUT, type Input } from '../src/sim/step';
import { applyPower } from '../src/sim/powerups';
import { createWorld, loadLevel, brickRect, type World } from '../src/sim/world';
import { parseLevel } from '../src/levels';
import { botInput } from '../src/sim/bot';
import { LEVELS } from '../src/levels';
import { newRun, advance } from '../src/run';

const DT = CONFIG.sim.step;
const world = (rows: string, seed = 1): World => {
  const w = createWorld(seed);
  loadLevel(w, parseLevel('T|' + rows).cells, 1);
  return w;
};
const launch: Input = { ...NO_INPUT, launch: true };

describe('swept collision', () => {
  it('hits the near face at the right time', () => {
    const h = sweepCircleBox(0, 0, 100, 0, 5, 50, -10, 60, 10);
    expect(h).toMatchObject({ nx: -1, ny: 0 });
    expect(h?.t).toBeCloseTo(0.45, 5);
  });
  it('misses when the path passes beside the box', () => {
    expect(sweepCircleBox(0, 100, 100, 0, 5, 50, -10, 60, 10)).toBeNull();
  });
  it('catches a very fast ball that would skip a thin brick', () => {
    const h = sweepCircleBox(0, 0, 10000, 0, 1, 500, -5, 501, 5);
    expect(h).not.toBeNull();
  });
});

describe('no tunnelling', () => {
  it('a 20000 px/s ball never passes through a full wall of bricks', () => {
    const w = world('~111111/~111111/~111111/~111111');
    w.phase = 'playing';
    const ball = w.balls[0]!;
    ball.stuck = false;
    ball.x = 300; ball.y = 500; ball.vx = 3000; ball.vy = -20000;
    const topOfWall = brickRect(0).top;
    for (let i = 0; i < 400; i++) {
      moveBall(w, ball, DT);
      expect(ball.x).toBeGreaterThanOrEqual(0);
      expect(ball.x).toBeLessThanOrEqual(CONFIG.field.w);
      expect(ball.y).toBeGreaterThanOrEqual(0);
      if (w.remaining === 48) expect(ball.y).toBeGreaterThan(topOfWall);
    }
    expect(w.remaining).toBeLessThan(48);
  });
  it('a fast ball stays inside the walls over many bounces', () => {
    const w = world('~......');
    w.remaining = 1;
    const ball = w.balls[0]!;
    ball.stuck = false;
    ball.x = 300; ball.y = 400; ball.vx = 9000; ball.vy = -7000;
    for (let i = 0; i < 2000; i++) {
      moveBall(w, ball, DT);
      expect(ball.x).toBeGreaterThanOrEqual(-0.001);
      expect(ball.x).toBeLessThanOrEqual(CONFIG.field.w + 0.001);
      expect(ball.y).toBeGreaterThanOrEqual(-0.001);
      if (ball.y > CONFIG.field.h) break;
    }
  });
});

describe('paddle angle control', () => {
  const bounce = (offsetFrac: number): { vx: number; vy: number } => {
    const w = world('~111111');
    w.phase = 'playing';
    const ball = w.balls[0]!;
    ball.stuck = false;
    ball.x = w.paddle.x + offsetFrac * (w.paddle.w / 2);
    ball.y = CONFIG.paddle.y - 30;
    ball.vx = 0; ball.vy = 340;
    for (let i = 0; i < 20 && ball.vy > 0; i++) moveBall(w, ball, DT);
    return ball;
  };
  it('centre goes straight up, edges angle outward, symmetric', () => {
    const mid = bounce(0);
    const right = bounce(0.9);
    const left = bounce(-0.9);
    expect(Math.abs(mid.vx)).toBeLessThan(1);
    expect(mid.vy).toBeLessThan(0);
    expect(right.vx).toBeGreaterThan(100);
    expect(left.vx).toBeCloseTo(-right.vx, 3);
    expect(right.vy).toBeLessThan(0);
  });
});

describe('bricks and combos', () => {
  it('multi-hit bricks take several hits; steel never breaks', () => {
    const w = world('~3#....');
    const idx = 0;
    const steel = 1;
    w.phase = 'playing';
    const b = w.balls[0]!;
    for (let k = 0; k < 3; k++) {
      b.stuck = false;
      const r = brickRect(idx);
      b.x = (r.left + r.right) / 2; b.y = r.bottom + 40; b.vx = 0; b.vy = -340;
      for (let i = 0; i < 120 && b.vy < 0; i++) moveBall(w, b, DT);
    }
    expect(w.bricks[idx]).toBeNull();
    const r = brickRect(steel);
    for (let k = 0; k < 3; k++) {
      b.x = (r.left + r.right) / 2; b.y = r.bottom + 40; b.vx = 0; b.vy = -340;
      for (let i = 0; i < 120 && b.vy < 0; i++) moveBall(w, b, DT);
    }
    expect(w.bricks[steel]?.steel).toBe(true);
  });
  it('clearing the last brick finishes the level with a bonus', () => {
    const w = world('~1.....');
    w.remaining = 2; // two mirrored bricks
    const events: string[] = [];
    let guard = 0;
    stepWorld(w, DT, launch);
    while (w.phase === 'playing' && guard++ < 20000) {
      stepWorld(w, DT, botInput(w));
      events.push(...w.events.map((e) => e.type));
      w.events.length = 0;
    }
    expect(w.phase).toBe('clear');
    expect(w.score).toBeGreaterThan(200);
  });
});

describe('lives and game over', () => {
  it('losing the ball costs a life and re-serves; last life ends the run', () => {
    const w = world('~111111');
    stepWorld(w, DT, launch);
    for (let life = CONFIG.lives.start; life > 0; life--) {
      const ball = w.balls[0]!;
      ball.x = 20; ball.y = CONFIG.field.h + 30; ball.vx = 0; ball.vy = 400;
      w.paddle.x = 500; w.paddle.px = 500;
      stepWorld(w, DT, { ...NO_INPUT, targetX: 500 });
      expect(w.lives).toBe(life - 1);
      if (life > 1) {
        expect(w.phase).toBe('ready');
        expect(w.balls[0]?.stuck).toBe(true);
        stepWorld(w, DT, launch);
      }
    }
    expect(w.phase).toBe('over');
  });
});

describe('power-ups', () => {
  it('wide paddle grows then shrinks back when it expires', () => {
    const w = world('~111111');
    stepWorld(w, DT, launch);
    applyPower(w, 'wide');
    for (let i = 0; i < 300; i++) stepWorld(w, DT, NO_INPUT);
    expect(w.paddle.w).toBeCloseTo(CONFIG.paddle.w * CONFIG.paddle.wideMul, 3);
    for (let i = 0; i < CONFIG.power.wideSec * 120 + 400; i++) {
      stepWorld(w, DT, { ...NO_INPUT, targetX: w.balls[0]?.x ?? 300 });
      if (w.phase !== 'playing') break;
    }
    if (w.phase === 'playing') expect(w.paddle.w).toBeCloseTo(CONFIG.paddle.w, 3);
  });
  it('multiball triples the live balls with equal speed, capped', () => {
    const w = world('~111111');
    stepWorld(w, DT, launch);
    stepWorld(w, DT, NO_INPUT);
    const speed = Math.hypot(w.balls[0]!.vx, w.balls[0]!.vy);
    applyPower(w, 'multi');
    expect(w.balls).toHaveLength(3);
    for (const b of w.balls) expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(speed, 3);
    for (let i = 0; i < 6; i++) applyPower(w, 'multi');
    expect(w.balls.length).toBeLessThanOrEqual(CONFIG.ball.maxBalls);
  });
  it('slow lowers ball speed after the next step', () => {
    const w = world('~111111');
    stepWorld(w, DT, launch);
    stepWorld(w, DT, NO_INPUT);
    const before = Math.hypot(w.balls[0]!.vx, w.balls[0]!.vy);
    applyPower(w, 'slow');
    stepWorld(w, DT, NO_INPUT);
    expect(Math.hypot(w.balls[0]!.vx, w.balls[0]!.vy)).toBeCloseTo(before * CONFIG.ball.slowMul, 3);
  });
  it('laser bolts break bricks above the paddle', () => {
    const w = world('~1.....');
    stepWorld(w, DT, launch);
    applyPower(w, 'laser');
    const ball = w.balls[0]!;
    ball.x = 300; ball.y = 300; ball.vx = 0; ball.vy = 200; // keep the ball out of the way
    w.paddle.x = brickRect(0).left + 25; w.paddle.px = w.paddle.x;
    const before = w.remaining;
    for (let i = 0; i < 400 && w.remaining === before; i++) {
      w.paddle.x = brickRect(0).left + 25 + w.paddle.w / 2 - 6;
      ball.x = 300; ball.y = 300; ball.vx = 0; ball.vy = 100;
      stepWorld(w, DT, { ...NO_INPUT, targetX: w.paddle.x });
    }
    expect(w.remaining).toBeLessThan(before);
  });
});

describe('determinism and solvability', () => {
  const run = (seed: number): number[] => {
    const r = newRun('campaign', 4, seed);
    stepWorld(r.world, DT, launch);
    const out: number[] = [];
    for (let i = 0; i < 3000; i++) {
      stepWorld(r.world, DT, botInput(r.world));
      r.world.events.length = 0;
    }
    out.push(r.world.score, r.world.remaining, r.world.balls[0]?.x ?? 0, r.world.balls[0]?.y ?? 0);
    return out;
  };
  it('same seed gives the identical simulation', () => {
    expect(run(11)).toEqual(run(11));
  });
  it('the autoplayer clears sampled campaign levels', () => {
    for (const n of [1, 2, 3, 5, 9, 14, 17, 25, 34]) {
      const r = newRun('campaign', n, 3);
      let steps = 0;
      while (r.world.phase !== 'clear' && r.world.phase !== 'over' && steps++ < 120 * 600) {
        stepWorld(r.world, DT, botInput(r.world));
        r.world.events.length = 0;
      }
      expect(r.world.phase, `level ${n} (${LEVELS[n - 1]?.name})`).toBe('clear');
    }
  }, 60000);
  it('Vault (level 33) is clearable by the bot and by offset players in reasonable time', () => {
    const idx = LEVELS.findIndex((l) => l.name === 'Vault') + 1;
    expect(idx).toBe(33);
    for (const [seed, off] of [[3, 0], [4, 0.2], [5, -0.2], [6, 0.25], [7, -0.25], [8, 0.1]] as const) {
      const r = newRun('campaign', idx, seed);
      let steps = 0;
      while (r.world.phase !== 'clear' && r.world.phase !== 'over' && steps++ < 120 * 240) {
        const inp = botInput(r.world);
        stepWorld(r.world, DT, { ...inp, targetX: (inp.targetX ?? 0) + off * (r.world.paddle.w / 2) });
        r.world.events.length = 0;
      }
      expect(r.world.phase, `seed ${seed} offset ${off}`).toBe('clear');
    }
  }, 60000);
  it('advance walks the campaign and stops at the end', () => {
    const r = newRun('campaign', LEVELS.length - 1, 1);
    expect(advance(r)).toBe(true);
    expect(r.world.level).toBe(LEVELS.length);
    expect(advance(r)).toBe(false);
    const e = newRun('endless', 1, 5);
    expect(advance(e)).toBe(true);
    expect(e.world.level).toBe(2);
  });
});
