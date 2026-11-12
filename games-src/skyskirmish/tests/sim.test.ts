import { describe, expect, it } from 'vitest';
import { CONFIG, DIFFICULTY, ENEMY, STEP, WORLD } from '../src/config';
import { pathPos } from '../src/enemies';
import { detonateBomb, volley } from '../src/player';
import { hurtPlayer } from '../src/combat';
import { createGame, useContinue } from '../src/state';
import { stepGame } from '../src/step';
import { NO_INPUT, type GameState, type Input } from '../src/types';

const run = (s: GameState, input: Input, steps: number): void => {
  for (let i = 0; i < steps; i++) stepGame(s, input, STEP);
};
const fresh = (): GameState => {
  const s = createGame(5, 'campaign', 'normal');
  s.wave.banner = 0;
  s.wave.queue = [];
  s.player.invuln = 0;
  return s;
};
const enemy = (s: GameState, x: number, y: number, kind: 'scout' | 'tank' = 'scout') => {
  s.enemies.push({ id: s.nextId++, kind, hp: 1, maxHp: 1, r: ENEMY[kind].r, t: 0, x0: x, y0: y, x, y, px: x, py: y, path: 'straight', dir: 1, cd: 99, flash: 0, armed: true });
  return s.enemies[s.enemies.length - 1]!;
};

describe('player', () => {
  it('moves with keys, clamps to the playfield and ignores diagonal speed-up', () => {
    const s = fresh();
    const x0 = s.player.x;
    run(s, { ...NO_INPUT, moveX: 1 }, 30);
    expect(s.player.x).toBeCloseTo(x0 + CONFIG.player.speed * 0.5, 0);
    run(s, { ...NO_INPUT, moveX: 1, moveY: -1 }, 600);
    expect(s.player.x).toBe(WORLD.w - CONFIG.player.margin);
    expect(s.player.y).toBe(CONFIG.player.minY);
    const d = fresh();
    run(d, { ...NO_INPUT, moveX: 1, moveY: 1 }, 10);
    expect(Math.hypot(d.player.x - WORLD.w / 2, d.player.y - CONFIG.player.startY)).toBeCloseTo(CONFIG.player.speed * 10 * STEP, 0);
  });
  it('drag target moves toward the point without overshooting', () => {
    const s = fresh();
    run(s, { ...NO_INPUT, target: { x: 100, y: 500 } }, 60);
    expect(s.player.x).toBeCloseTo(100, 3);
    expect(s.player.y).toBeCloseTo(500, 3);
  });
  it('fires on the interval only while fire is held', () => {
    const s = fresh();
    run(s, NO_INPUT, 30);
    expect(s.pBullets.length).toBe(0);
    run(s, { ...NO_INPUT, fire: true }, 1);
    expect(s.pBullets.length).toBe(2);
    run(s, { ...NO_INPUT, fire: true }, 60);
    expect(s.pBullets.length).toBeGreaterThan(6);
  });
  it('volley widens with weapon level', () => {
    expect(volley(0)).toHaveLength(2);
    expect(volley(1)).toHaveLength(3);
    expect(volley(2)).toHaveLength(5);
    expect(volley(3)).toHaveLength(7);
  });
});

describe('combat', () => {
  it('player bullets kill enemies and score', () => {
    const s = fresh();
    enemy(s, s.player.x, s.player.y - 120);
    run(s, { ...NO_INPUT, fire: true }, 40);
    expect(s.enemies.length).toBe(0);
    expect(s.score).toBeGreaterThan(0);
    expect(s.events.some((e) => e.type === 'kill')).toBe(true);
  });
  it('a hit costs a life, resets the multiplier and grants invulnerability', () => {
    const s = fresh();
    s.mult = 5;
    hurtPlayer(s);
    expect(s.player.lives).toBe(DIFFICULTY.normal.lives - 1);
    expect(s.mult).toBe(1);
    expect(s.player.invuln).toBeGreaterThan(2);
    hurtPlayer(s);
    expect(s.player.lives).toBe(DIFFICULTY.normal.lives - 1);
  });
  it('shield absorbs one hit', () => {
    const s = fresh();
    s.player.shield = 5;
    hurtPlayer(s);
    expect(s.player.lives).toBe(DIFFICULTY.normal.lives);
    expect(s.player.shield).toBe(0);
    expect(s.events.some((e) => e.type === 'shieldBreak')).toBe(true);
  });
  it('enemy bullets and bodies hurt the player', () => {
    const s = fresh();
    s.eBullets.push({ x: s.player.x, y: s.player.y, px: 0, py: 0, vx: 0, vy: 0, r: 4 });
    run(s, NO_INPUT, 1);
    expect(s.player.lives).toBe(DIFFICULTY.normal.lives - 1);
    const t = fresh();
    enemy(t, t.player.x, t.player.y);
    run(t, NO_INPUT, 1);
    expect(t.player.lives).toBe(DIFFICULTY.normal.lives - 1);
  });
  it('last life moves the run to down; continue restores it once per continue', () => {
    const s = fresh();
    s.player.lives = 1;
    hurtPlayer(s);
    expect(s.phase).toBe('down');
    const before = s.continuesLeft;
    expect(useContinue(s)).toBe(true);
    expect(s.phase).toBe('playing');
    expect(s.continuesLeft).toBe(before - 1);
    expect(s.player.lives).toBe(DIFFICULTY.normal.continueLives);
    expect(useContinue(s)).toBe(false);
    s.phase = 'down';
    s.continuesLeft = 0;
    expect(useContinue(s)).toBe(false);
  });
});

describe('power-ups and bombs', () => {
  it('spread pickup raises the weapon level, shield and bomb pickups apply', () => {
    const s = fresh();
    const p = s.player;
    for (const kind of ['spread', 'spread', 'shield', 'bomb'] as const) s.pickups.push({ x: p.x, y: p.y, px: p.x, py: p.y, kind, t: 0 });
    run(s, NO_INPUT, 1);
    expect(p.spreadLevel).toBe(2);
    expect(p.spread).toBeGreaterThan(0);
    expect(p.shield).toBeGreaterThan(0);
    expect(p.bombs).toBe(DIFFICULTY.normal.startBombs + 1);
  });
  it('spread expires back to twin guns', () => {
    const s = fresh();
    s.player.spread = 0.05;
    s.player.spreadLevel = 2;
    run(s, NO_INPUT, 10);
    expect(s.player.spreadLevel).toBe(0);
  });
  it('bomb clears enemy fire, damages enemies, and is limited by stock', () => {
    const s = fresh();
    enemy(s, 100, 100);
    s.eBullets.push({ x: 50, y: 50, px: 50, py: 50, vx: 0, vy: 0, r: 4 });
    const bombs = s.player.bombs;
    expect(detonateBomb(s)).toBe(true);
    expect(s.player.bombs).toBe(bombs - 1);
    expect(s.eBullets.length).toBe(0);
    run(s, NO_INPUT, 1);
    expect(s.enemies.length).toBe(0);
    s.player.bombs = 0;
    expect(detonateBomb(s)).toBe(false);
  });
});

describe('enemy paths', () => {
  it('are deterministic and head downward', () => {
    for (const path of ['straight', 'sine', 'sweep', 'hold'] as const) {
      const e = { path, t: 0, x0: 100, y0: -20, dir: 1 as const };
      expect(pathPos(e, 80)).toEqual(pathPos({ ...e }, 80));
      expect(pathPos({ ...e, t: 2 }, 80).y).toBeGreaterThan(pathPos(e, 80).y);
    }
    expect(pathPos({ path: 'hold', t: 3, x0: 0, y0: -20, dir: 1 }, 80).y).toBe(pathPos({ path: 'hold', t: 4, x0: 0, y0: -20, dir: 1 }, 80).y);
  });
});

describe('determinism and full runs', () => {
  const script = (i: number): Input => ({ moveX: Math.sin(i / 40), moveY: Math.cos(i / 70), target: null, fire: i % 3 !== 0, bomb: i % 500 === 499 });
  it('same seed and inputs give an identical state', () => {
    const a = createGame(77, 'campaign', 'normal');
    const b = createGame(77, 'campaign', 'normal');
    for (let i = 0; i < 3000; i++) {
      stepGame(a, script(i));
      stepGame(b, script(i));
    }
    const strip = (g: GameState): string => JSON.stringify({ ...g, rng: g.rng.state });
    expect(strip(a)).toBe(strip(b));
    expect(a.score).toBeGreaterThan(0);
  });
  it('a different seed diverges', () => {
    const a = createGame(1, 'campaign', 'normal');
    const b = createGame(2, 'campaign', 'normal');
    for (let i = 0; i < 400; i++) {
      stepGame(a, script(i));
      stepGame(b, script(i));
    }
    expect(JSON.stringify(a.enemies)).not.toBe(JSON.stringify(b.enemies));
  });
  it('an invulnerable bot can clear the whole campaign, bosses included', () => {
    const s = createGame(3, 'campaign', 'normal');
    let steps = 0;
    while (s.phase === 'playing' && steps < 60 * 60 * 12) {
      s.player.invuln = 1;
      const target = [...s.enemies].sort((p, q) => q.y - p.y)[0];
      const dx = target ? target.x - s.player.x : 0;
      stepGame(s, { moveX: Math.max(-1, Math.min(1, dx / 20)), moveY: 0, target: null, fire: true, bomb: false });
      steps++;
    }
    expect(s.phase).toBe('won');
    expect(s.bossesDown).toBe(3);
    expect(s.wave.index).toBe(CONFIG.waves.campaignLength);
    expect(s.events.some((e) => e.type === 'win')).toBe(true);
  });
  it('endless mode keeps going past the campaign length', () => {
    const s = createGame(3, 'endless', 'easy', CONFIG.waves.campaignLength);
    s.wave.banner = 0;
    let steps = 0;
    while (s.wave.index <= CONFIG.waves.campaignLength && steps < 60 * 60 * 6) {
      s.player.invuln = 1;
      const target = [...s.enemies].sort((p, q) => q.y - p.y)[0];
      stepGame(s, { moveX: target ? Math.max(-1, Math.min(1, (target.x - s.player.x) / 20)) : 0, moveY: 0, target: null, fire: true, bomb: false });
      steps++;
    }
    expect(s.phase).toBe('playing');
    expect(s.wave.index).toBeGreaterThan(CONFIG.waves.campaignLength);
  });
  it('does nothing once the run is down', () => {
    const s = fresh();
    s.phase = 'down';
    const t = s.time;
    run(s, NO_INPUT, 10);
    expect(s.time).toBe(t);
  });
});
