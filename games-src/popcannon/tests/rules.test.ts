import { describe, expect, it } from 'vitest';
import { traceShot } from '../src/aim';
import { bestAngle, playRandom, playSkilled } from '../src/bot';
import { DANGER_ROW, SHOOTER, bubbleCount, landingCell, lowestRow, nearestFreeCell, setCell } from '../src/hex';
import { previewShot } from '../src/preview';
import { ceilingWarning, popPoints } from '../src/resolve';
import { mulberry32 } from '../src/rules';
import { aim, fire, moveBall, nextArcadeLevel, requestFire } from '../src/shoot';
import { Game, drawNext, newGame } from '../src/state';
import { STEP, update } from '../src/update';
import { trimRows } from '../src/match';

const n = (color: number) => ({ kind: 'normal', color }) as const;
const run = (g: Game, seconds = 3): void => {
  for (let i = 0; i < seconds / STEP; i++) update(g, STEP, { left: false, right: false });
};

describe('miss-budget ceiling rule', () => {
  it('warns one miss before the drop', () => {
    const g = newGame('arcade', { seed: 5 });
    g.sinceDrop = g.diff.dropEvery - 2;
    g.cur = n(5);
    aim(g, 0);
    fire(g);
    run(g);
    expect(g.events.some((e) => e.type === 'warn')).toBe(true);
    expect(ceilingWarning(g)).toBe(true);
  });
  it('never warns in puzzles', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    expect(ceilingWarning(g)).toBe(false);
  });
  it('Time Rush uses the same rule', () => {
    const g = newGame('rush', { seed: 3 });
    g.sinceDrop = g.diff.dropEvery - 1;
    g.cur = n(5);
    aim(g, 0);
    fire(g);
    run(g);
    expect(g.sinceDrop).toBe(0);
  });
});

describe('balance (seeded bots)', () => {
  const clearsLevelOne = (seed: number, maxShots: number, kind: 'skilled' | 'random'): number => {
    const g = newGame('arcade', { seed });
    const rnd = mulberry32(seed + 1000);
    for (let i = 0; i < maxShots && g.status === 'playing'; i++) {
      if (kind === 'skilled') playSkilled(g);
      else playRandom(g, rnd);
    }
    return g.status === 'cleared' ? 1 : 0;
  };
  it('a skilled bot clears Arcade level 1 within 40 shots on at least 70% of seeds', { timeout: 30000 }, () => {
    let ok = 0;
    for (let s = 1; s <= 10; s++) ok += clearsLevelOne(s, 40, 'skilled');
    expect(ok).toBeGreaterThanOrEqual(7);
  });
  it('a skilled bot reaches level 5 but a random one does not', { timeout: 60000 }, () => {
    const play = (seed: number, kind: 'skilled' | 'random', shots: number): number => {
      const g = newGame('arcade', { seed });
      const rnd = mulberry32(seed + 77);
      for (let i = 0; i < shots && g.status !== 'lost'; i++) {
        if (kind === 'skilled') playSkilled(g);
        else playRandom(g, rnd);
        if (g.status === 'cleared') nextArcadeLevel(g);
      }
      return g.level;
    };
    let skilled = 0;
    for (let s = 1; s <= 6; s++) {
      if (play(s, 'skilled', 260) >= 5) skilled++;
      expect(play(s, 'random', 260)).toBeLessThan(5);
    }
    expect(skilled).toBeGreaterThanOrEqual(5);
  });
  it('rows stay bounded over a long run (at most 16)', { timeout: 60000 }, () => {
    const g = newGame('arcade', { seed: 3 });
    let maxRows = 0;
    for (let i = 0; i < 400 && g.status !== 'lost'; i++) {
      playSkilled(g);
      if (g.status === 'cleared') nextArcadeLevel(g);
      maxRows = Math.max(maxRows, g.grid.rows.length);
      expect(g.grid.rows.length).toBeLessThanOrEqual(lowestRow(g.grid) + 2);
    }
    expect(maxRows).toBeLessThanOrEqual(16);
  });
});

describe('row trimming and landing fallback', () => {
  it('trimRows removes only empty trailing rows', () => {
    const g = newGame('arcade', { seed: 1 });
    g.grid.rows = [];
    setCell(g.grid, 0, 0, n(0));
    setCell(g.grid, 3, 0, n(1));
    setCell(g.grid, 3, 0, null);
    expect(g.grid.rows.length).toBe(4);
    trimRows(g.grid);
    expect(g.grid.rows.length).toBe(1);
  });
  it('a packed board never swallows the shot: it still lands (below the pack) and the loss is recorded', () => {
    const g = newGame('arcade', { seed: 1 });
    g.grid.rows = [];
    for (let r = 0; r <= DANGER_ROW + 3; r++) for (let c = 0; c < (r % 2 ? 10 : 11); c++) setCell(g.grid, r, c, n(0));
    const spot = landingCell(g.grid, SHOOTER.x, SHOOTER.y);
    expect(spot?.row).toBe(DANGER_ROW + 4);
    const before = bubbleCount(g.grid);
    g.ball = { x: SHOOTER.x, y: 300, vx: 0, vy: -1, rx: SHOOTER.x, ry: 300, px: SHOOTER.x, py: 300 };
    g.flying = n(1);
    moveBall(g, STEP);
    expect(g.ball).toBeNull();
    expect(bubbleCount(g.grid)).toBe(before + 1);
    expect(g.status).toBe('lost');
    expect(g.events.some((e) => e.type === 'lose')).toBe(true);
  });
  it('nearestFreeCell finds nothing in a tiny window around a packed area but landingCell widens', () => {
    const g = newGame('arcade', { seed: 1 });
    g.grid.rows = [];
    for (let r = 0; r <= 6; r++) for (let c = 0; c < (r % 2 ? 10 : 11); c++) setCell(g.grid, r, c, n(0));
    expect(nearestFreeCell(g.grid, 176, 100, 1)).toBeNull();
    expect(landingCell(g.grid, 176, 100)?.row).toBe(7);
  });
  it('widens the search when the nearest cells are taken', () => {
    const g = newGame('arcade', { seed: 1 });
    g.grid.rows = [];
    setCell(g.grid, 0, 5, n(0));
    expect(landingCell(g.grid, 176, 34)).not.toBeNull();
  });
});

describe('fire buffering', () => {
  it('a press during flight fires on landing', () => {
    const g = newGame('arcade', { seed: 8 });
    g.cur = n(5);
    aim(g, 0);
    fire(g);
    while (g.ball && g.ball.y > 190) update(g, STEP, { left: false, right: false });
    expect(g.ball).not.toBeNull();
    const shots = g.shots;
    expect(requestFire(g)).toBe(false);
    expect(g.fireBuffer).toBeGreaterThan(0);
    run(g, 2);
    expect(g.shots).toBe(shots + 1);
  });
  it('an expired press is forgotten', () => {
    const g = newGame('arcade', { seed: 8 });
    g.cur = n(5);
    aim(g, 0.5);
    fire(g);
    run(g, 0.02);
    requestFire(g);
    g.fireBuffer = 0.01;
    run(g, 0.2);
    expect(g.fireBuffer).toBe(0);
    expect(g.shots).toBe(1);
  });
  it('is ignored when the run is over', () => {
    const g = newGame('arcade', { seed: 8 });
    g.status = 'lost';
    requestFire(g);
    expect(g.fireBuffer).toBe(0);
  });
});

describe('flight matches the aim guide', () => {
  it('the ball lands where the preview says, for many angles', () => {
    for (let deg = -75; deg <= 75; deg += 5) {
      const g = newGame('arcade', { seed: 4 });
      g.cur = n(5);
      const a = (deg * Math.PI) / 180;
      const tr = traceShot(g.grid, a, 8);
      const want = landingCell(g.grid, tr.end.x, tr.end.y);
      aim(g, a);
      fire(g);
      while (g.ball) moveBall(g, STEP);
      expect(want).not.toBeNull();
      if (want) expect(g.grid.rows[want.row]?.[want.col]).toEqual(n(5));
    }
  });
  it('preview lists the group that would pop and restores the grid', () => {
    const g = newGame('arcade', { seed: 4 });
    const before = bubbleCount(g.grid);
    const rows = g.grid.rows.length;
    const a = bestAngle(g);
    const pv = previewShot(g.grid, a, g.cur, 8);
    expect(pv.landing).not.toBeNull();
    expect(bubbleCount(g.grid)).toBe(before);
    expect(g.grid.rows.length).toBe(rows);
    if (pv.popped.length) expect(pv.popped.length).toBeGreaterThanOrEqual(3);
  });
  it('bomb preview flags the blast', () => {
    const g = newGame('arcade', { seed: 4 });
    expect(previewShot(g.grid, 0, { kind: 'bomb', color: -1 }).bomb).toBe(true);
  });
});

describe('scoring and Rush', () => {
  it('popPoints grows with group size and combo', () => {
    expect(popPoints(3, 1)).toBe(30);
    expect(popPoints(5, 1)).toBe(70);
    expect(popPoints(3, 3)).toBe(60);
  });
  it('a Rush board clear adds seconds and a fresh board', () => {
    const g = newGame('rush', { seed: 2 });
    g.grid.rows = [];
    setCell(g.grid, 0, 4, n(0));
    setCell(g.grid, 0, 5, n(0));
    g.cur = n(0);
    g.timeLeft = 40;
    aim(g, Math.atan2(176 - 4 * 32 - 16 - 32, 462 - 34));
    fire(g);
    run(g, 2);
    expect(g.timeLeft).toBeGreaterThan(40);
    expect(g.status).toBe('playing');
  });
  it('Rush ticks once per second in the last 10 s and ends at zero', () => {
    const g = newGame('rush', { seed: 2 });
    g.timeLeft = 4;
    const ticks: number[] = [];
    for (let i = 0; i < 60 * 5; i++) {
      update(g, STEP, { left: false, right: false });
      for (const e of g.events.splice(0)) if (e.type === 'tick') ticks.push(e.n);
    }
    expect(ticks).toEqual([4, 3, 2, 1]);
    expect(g.status).toBe('finished');
  });
  it('timers do not move when the simulation is not stepped (paused)', () => {
    const g = newGame('rush', { seed: 2 });
    const t = g.timeLeft;
    run(g, 0);
    expect(g.timeLeft).toBe(t);
  });
});

describe('daily seed', () => {
  it('the same seed gives identical boards and the same first 20 shooter bubbles', () => {
    const a = newGame('daily', { seed: 20261111 });
    const b = newGame('daily', { seed: 20261111 });
    expect(a.grid.rows).toEqual(b.grid.rows);
    const qa = Array.from({ length: 20 }, () => drawNext(a));
    const qb = Array.from({ length: 20 }, () => drawNext(b));
    expect(qa).toEqual(qb);
    expect(newGame('daily', { seed: 20261112 }).grid.rows).not.toEqual(a.grid.rows);
  });
});
