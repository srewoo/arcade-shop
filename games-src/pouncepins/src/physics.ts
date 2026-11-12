// Lane simulation: a ball, ten cats, a fish. Fixed-step, deterministic, DOM-free.
// Cats are never hurt: a struck cat tumbles away, then lands on its feet or dives
// into a cushion. "Down" here just means "knocked off its spot".
import { CONFIG } from './config';
import { rackSpots } from './layout';
import { lerp } from './util';
import type { Ball, Cat, FrameSetup, World } from './worldTypes';

const { ball: B, cat: C, lane: L } = CONFIG;

/** On its spot and not yet struck (a jumping scaredy cat still counts as standing). */
const isStanding = (c: Cat): boolean => !c.gone && !c.hit && (c.mode === 'stand' || c.mode === 'jump');
const massOf = (c: Cat): number => (c.kind === 'lazy' ? C.lazyMass : C.mass);

export function createCat(id: number, setup: FrameSetup): Cat {
  const spot = rackSpots()[id] as { x: number; y: number };
  return {
    id, kind: setup.kinds[id] ?? 'plain', coat: setup.coats[id] ?? 0,
    homeX: spot.x, homeY: spot.y, x: spot.x, y: spot.y, px: spot.x, py: spot.y, vx: 0, vy: 0,
    mode: 'stand', t: 0, hit: false, gone: false, cushion: false, settled: false, landT: 0, scared: false, spin: id % 2 === 0 ? 1 : -1,
  };
}

const idleBall = (): Ball => ({ x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, curve: 0, active: false, gutter: false, launched: false });

export function createWorld(setup: FrameSetup): World {
  const cats = Array.from({ length: 10 }, (_, i) => createCat(i, setup));
  return { t: 0, ball: idleBall(), cats, fish: setup.fish ? { ...setup.fish, taken: false } : null, events: [], settled: false };
}

/** Clear knocked cats and ready the same rack for the next ball of a frame. */
export function prepareNextBall(world: World): void {
  for (const c of world.cats) if (c.hit) c.gone = true;
  world.ball = idleBall();
  world.settled = false;
  world.t = 0;
}

export const pinsDown = (world: World): number => world.cats.filter((c) => c.hit && !c.gone).length;
export const standingCount = (world: World): number => world.cats.filter(isStanding).length;

export function launch(world: World, angle: number, power: number, curve: number): void {
  const speed = lerp(B.minSpeed, B.maxSpeed, Math.min(1, Math.max(0, power)));
  world.ball = {
    ...idleBall(), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    curve: Math.max(-B.maxCurve, Math.min(B.maxCurve, Math.round(curve))), active: true, launched: true,
  };
}

function stepBall(w: World, dt: number): void {
  const b = w.ball;
  b.px = b.x; b.py = b.y;
  if (!b.active) return;
  const speed = Math.hypot(b.vx, b.vy);
  if (b.x > B.hookStartX && !b.gutter && b.curve !== 0 && speed > 0) {
    const a = b.curve * B.curveAccel * dt;
    b.vx += (-b.vy / speed) * a;
    b.vy += (b.vx / speed) * a;
  }
  const slowed = Math.max(0, Math.hypot(b.vx, b.vy) - B.decel * dt) / (Math.hypot(b.vx, b.vy) || 1);
  b.vx *= slowed; b.vy *= slowed;
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (Math.abs(b.y) > L.halfWidth && !b.gutter) {
    b.gutter = true;
    w.events.push({ type: 'gutter' });
  }
  if (b.gutter) { b.y = Math.sign(b.y || 1) * (L.halfWidth + 17); b.vy = 0; }
  if (b.x > L.endX || Math.hypot(b.vx, b.vy) < B.stopSpeed) b.active = false;
}

function hitBy(w: World, c: Cat, power: number, vx: number, vy: number): void {
  c.hit = true;
  c.t = 0;
  if (c.kind === 'lazy') {
    c.mode = 'wobble';
    c.vx = vx * C.wobbleKeep; c.vy = vy * C.wobbleKeep;
    w.events.push({ type: 'wobble', id: c.id });
  } else {
    c.mode = 'down'; c.vx = vx; c.vy = vy;
  }
  w.events.push({ type: 'hit', id: c.id, power });
}

function collideBall(w: World): void {
  const b = w.ball;
  if (!b.active) return;
  for (const c of w.cats) {
    if (!isStanding(c) || c.mode === 'jump') continue;
    const dx = c.x - b.x, dy = c.y - b.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= B.radius + C.radius || dist === 0) continue;
    const nx = dx / dist, ny = dy / dist;
    const rel = (b.vx - c.vx) * nx + (b.vy - c.vy) * ny;
    if (rel <= 0) continue;
    const j = ((1 + B.restitution) * rel) / (1 / B.mass + 1 / massOf(c));
    b.vx -= (j / B.mass) * nx; b.vy -= (j / B.mass) * ny;
    hitBy(w, c, rel, (j / massOf(c)) * nx, (j / massOf(c)) * ny);
  }
}

function stepScare(w: World, dt: number): void {
  for (const c of w.cats) {
    if (c.gone) continue;
    if (c.mode === 'jump') {
      c.t += dt;
      if (c.t >= C.jumpTime) { c.mode = 'stand'; c.t = 0; }
    } else if (c.kind === 'scaredy' && c.mode === 'stand' && !c.hit && !c.scared && w.ball.active) {
      const gap = c.x - w.ball.x;
      if (gap > 0 && gap < C.scareDist && Math.abs(c.y - w.ball.y) < 80) {
        c.mode = 'jump'; c.t = 0; c.scared = true;
        w.events.push({ type: 'scare', id: c.id });
      }
    }
  }
}

function collideCats(w: World): void {
  for (const m of w.cats) {
    if (m.gone || m.mode !== 'down' || m.settled || Math.hypot(m.vx, m.vy) < C.knockSpeed) continue;
    for (const o of w.cats) {
      if (o === m || o.gone || (o.mode !== 'stand' && o.mode !== 'wobble')) continue;
      const dx = o.x - m.x, dy = o.y - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= C.radius * 2 || dist === 0) continue;
      const spd = Math.hypot(m.vx, m.vy);
      const k = (spd * C.transfer) / massOf(o);
      if (o.mode === 'wobble') { o.mode = 'down'; o.vx = (dx / dist) * k; o.vy = (dy / dist) * k; o.t = 0; }
      else hitBy(w, o, spd, (dx / dist) * k, (dy / dist) * k);
      m.vx *= C.moverKeep; m.vy *= C.moverKeep;
    }
  }
}

function stepDown(w: World, dt: number): void {
  for (const c of w.cats) {
    c.px = c.x; c.py = c.y;
    if (c.gone || !c.hit) continue;
    c.t += dt;
    if (c.mode === 'wobble') {
      if (c.t >= C.wobbleTime) { c.mode = 'down'; c.t = 0; }
      continue;
    }
    if (c.settled) continue;
    const spd = Math.hypot(c.vx, c.vy);
    const next = Math.max(0, spd - C.friction * dt);
    const f = spd > 0 ? next / spd : 0;
    c.vx *= f; c.vy *= f;
    c.x += c.vx * dt; c.y += c.vy * dt;
    edgeCheck(w, c);
    if (!c.settled && next < C.settleSpeed) { c.settled = true; c.landT = c.t; c.vx = 0; c.vy = 0; w.events.push({ type: 'land', id: c.id }); }
  }
}

function edgeCheck(w: World, c: Cat): void {
  const wallY = Math.abs(c.y) > L.deckHalf;
  const wallX = c.x > L.backX;
  if (!wallY && !wallX) return;
  c.cushion = true; c.settled = true; c.landT = c.t; c.vx = 0; c.vy = 0;
  if (wallY) c.y = Math.sign(c.y) * L.deckHalf;
  if (wallX) c.x = L.backX;
  w.events.push({ type: 'cushion', id: c.id });
}

function stepFish(w: World): void {
  const f = w.fish;
  if (!f || f.taken || !w.ball.active) return;
  if (Math.hypot(f.x - w.ball.x, f.y - w.ball.y) < B.radius + CONFIG.frames.fishRadius) {
    f.taken = true;
    w.events.push({ type: 'fish' });
  }
}

function checkSettled(w: World): void {
  const busy = w.cats.some((c) => !c.gone && (c.mode === 'wobble' || c.mode === 'jump' || (c.hit && !c.settled)));
  if ((!w.ball.active && !busy) || w.t > C.maxThrowTime) {
    w.ball.active = false;
    for (const c of w.cats) if (c.hit && !c.settled) { c.settled = true; c.landT = c.t; c.mode = 'down'; c.vx = 0; c.vy = 0; }
    w.settled = true;
  }
}

/** Advance the lane by dt seconds. Events accumulate in world.events. */
export function stepWorld(w: World, dt: number): void {
  if (w.settled) {
    // Keep landed cats' clocks running so their landing animation can finish.
    for (const c of w.cats) if (c.hit && !c.gone) { c.t += dt; c.px = c.x; c.py = c.y; }
    return;
  }
  w.t += dt;
  stepBall(w, dt);
  stepScare(w, dt);
  collideBall(w);
  collideCats(w);
  stepDown(w, dt);
  stepFish(w);
  checkSettled(w);
}
