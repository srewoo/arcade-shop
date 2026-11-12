// One fixed-timestep tick of the whole simulation.
import { catTarget, lineOfSight, stepPounce, updateBiscuit } from './cats';
import { TUNING } from './config/tuning';
import { advance, pipChooser, tryReverse } from './movement';
import type { Chooser } from './movement';
import { ITEM_NONE, ITEM_PISTOL, ITEM_SUGAR } from './maze';
import { drenchActive, startDrench, tickClock, tickDrench } from './modes';
import { demoWant } from './pipAi';
import { addPoints, chainPoints, POINTS } from './scoring';
import { chaseDir, fleeDir, steer } from './steer';
import type { SteerCtx } from './steer';
import type { Tile } from './types';
import { BLINK_SEC } from './modes';
import { basketCenter, isDrenched, isGrooming, tileOf } from './world';
import type { Cat, World } from './world';

const SPEED = TUNING.speed;

export function award(w: World, pts: number): void {
  if (addPoints(w.score, pts)) w.events.push({ type: 'extralife' });
}

function eatAt(w: World, col: number, row: number): void {
  const idx = row * w.maze.cols + col;
  const it = w.items[idx];
  if (it === ITEM_NONE || it === undefined) return;
  w.items[idx] = ITEM_NONE;
  if (it === ITEM_PISTOL) {
    award(w, POINTS.pistol);
    startDrench(w.drench, w.tuning.drenchSec);
    w.stats.drenches++;
    for (const c of w.cats) c.immune = false;
    w.events.push({ type: 'pistol', points: POINTS.pistol });
    return;
  }
  const sugar = it === ITEM_SUGAR;
  w.remaining--;
  w.stats.crumbs++;
  award(w, sugar ? POINTS.sugar : POINTS.crumb);
  w.events.push({ type: sugar ? 'sugar' : 'crumb' });
  maybeSpawnCheese(w);
  if (w.remaining <= 0) {
    w.cleared = true;
    w.events.push({ type: 'clear' });
  }
}

function maybeSpawnCheese(w: World): void {
  const eaten = w.maze.edibleCount - w.remaining;
  const due = eaten >= (w.maze.edibleCount * (w.cheeseSpawned + 1)) / 3 && w.cheeseSpawned < 2;
  if (!due) return;
  w.cheeseSpawned++;
  w.cheese = { active: true, left: w.tuning.cheeseSec };
  w.events.push({ type: 'cheeseSpawn' });
}

function pipChoose(w: World): Chooser {
  const base = pipChooser(w.maze, w.pip);
  if (!w.ai) return base;
  return (m, col, row) => {
    w.pip.want = demoWant(w, { col, row });
    return base(m, col, row);
  };
}

function stepPip(w: World, dt: number): void {
  const { pip } = w;
  if (!w.ai) tryReverse(pip, pip);
  advance(w.maze, pip, w.tuning.pipSpeed * dt, pipChoose(w));
  const t = tileOf(pip, w.maze);
  const near = Math.abs(pip.x - t.col) + Math.abs(pip.y - t.row) < 0.45;
  if (near) eatAt(w, t.col, t.row);
  const ch = w.maze.cheese;
  if (w.cheese.active && near && t.col === ch.col && t.row === ch.row) {
    w.cheese.active = false;
    w.stats.cheese++;
    award(w, POINTS.cheese);
    w.events.push({ type: 'cheese', points: POINTS.cheese, at: ch });
  }
}

function steerCtx(w: World, access: 'cat' | 'home'): SteerCtx {
  return { maze: w.maze, dists: w.dists, rng: w.rng, access };
}

function activeDir(w: World, cat: Cat, at: Tile): ReturnType<typeof steer> {
  const ctx = steerCtx(w, 'cat');
  const pipT = tileOf(w.pip, w.maze);
  if (isDrenched(w, cat)) return fleeDir(ctx, at, cat.dir, pipT);
  if (w.clock.phase === 'rest') return 'N'; // grooming: stop at the next tile centre
  if (cat.index === 0 && w.time < w.tuning.graceSec) return chaseDir(ctx, at, cat.dir, w.maze.corners[0] as Tile);
  if (cat.pounce.phase === 'cooldown') return steer(ctx, at, cat.dir, { kind: 'wander' });
  const target = catTarget(cat.kind, { maze: w.maze, pip: pipT, pipDir: w.pip.dir, cat: at }, cat.brain);
  return steer(ctx, at, cat.dir, target);
}

function catChooser(w: World, cat: Cat): Chooser {
  return (_m, col, row) => {
    const at = { col, row };
    if (cat.mode === 'leaving') {
      if (col === w.maze.exit.col && row === w.maze.exit.row) cat.mode = 'active';
      else return chaseDir(steerCtx(w, 'home'), at, cat.dir, w.maze.exit);
    }
    if (cat.mode === 'returning') {
      const home = basketCenter(w.maze);
      if (col === home.col && row === home.row) {
        cat.mode = 'house';
        cat.houseTimer = 2;
        return 'N';
      }
      return chaseDir(steerCtx(w, 'home'), at, cat.dir, home);
    }
    return activeDir(w, cat, at);
  };
}

function catSpeed(w: World, cat: Cat): number {
  const base = w.tuning.catSpeed;
  if (cat.mode === 'returning') return base * SPEED.returningFast;
  if (cat.mode === 'leaving') return base * SPEED.leavingSlow;
  if (isDrenched(w, cat)) return base * SPEED.drenchedSlow;
  return base * (cat.pouncing ? w.tuning.pounceMult : 1);
}

function stepCat(w: World, cat: Cat, dt: number): void {
  if (cat.mode === 'house') {
    cat.houseTimer -= dt;
    if (cat.houseTimer <= 0) {
      cat.mode = 'leaving';
      w.events.push({ type: 'release', cat: cat.kind });
    }
    return;
  }
  const at = tileOf(cat, w.maze);
  const pipT = tileOf(w.pip, w.maze);
  if (cat.kind === 'biscuit' && cat.mode === 'active') {
    const d = w.dists.dist(pipT, at, 'cat');
    updateBiscuit(cat.brain, w.maze.route, at, d, dt);
  }
  if (cat.kind === 'tuxedo') {
    const hunting = cat.mode === 'active' && w.clock.phase === 'chase' && !isDrenched(w, cat);
    const cue = stepPounce(cat.pounce, hunting && lineOfSight(w.maze, at, pipT) !== null, dt);
    if (!hunting) cat.pounce.phase = 'idle';
    if (cue) w.events.push({ type: 'pounce', cat: cat.kind });
    cat.pouncing = cat.pounce.phase === 'dash';
    if (cat.pounce.phase === 'windup') return; // frozen, ears flat
  }
  advance(w.maze, cat, catSpeed(w, cat) * dt, catChooser(w, cat));
}

function resolveContacts(w: World): void {
  for (const cat of w.cats) {
    if ((cat.mode !== 'active' && cat.mode !== 'leaving') || isGrooming(w, cat)) continue;
    const dx = cat.x - w.pip.x;
    const dy = cat.y - w.pip.y;
    if (dx * dx + dy * dy > TUNING.contactRadiusSq) continue;
    if (isDrenched(w, cat)) {
      const pts = chainPoints(w.drench.chain++);
      w.stats.bestChain = Math.max(w.stats.bestChain, w.drench.chain);
      cat.mode = 'returning';
      cat.immune = true;
      w.stats.splashes++;
      award(w, pts);
      w.events.push({ type: 'splash', cat: cat.kind, points: pts, at: tileOf(cat, w.maze) });
    } else if (!w.god && w.pip.alive) {
      w.pip.alive = false;
      w.events.push({ type: 'death' });
    }
  }
}

function snapshotPrev(w: World): void {
  for (const m of [w.pip, ...w.cats]) {
    m.px = m.x;
    m.py = m.y;
  }
}

export function stepWorld(w: World, dt: number): void {
  snapshotPrev(w);
  if (!w.pip.alive || w.cleared) return;
  w.time += dt;
  stepPip(w, dt);
  if (w.cheese.active) {
    w.cheese.left -= dt;
    if (w.cheese.left <= 0) w.cheese.active = false;
  }
  const before = w.drench.left;
  if (before > BLINK_SEC && before - dt <= BLINK_SEC) w.events.push({ type: 'drenchWarn' });
  if (tickDrench(w.drench, dt)) {
    for (const c of w.cats) c.immune = false;
    w.events.push({ type: 'drenchEnd' });
  }
  if (!drenchActive(w.drench) && tickClock(w.clock, dt)) {
    w.events.push({ type: 'phase' });
  }
  for (const cat of w.cats) stepCat(w, cat, dt);
  resolveContacts(w);
}
