// Deterministic fixed-step ball physics for one hole. No DOM, no randomness, no wall-clock time.
import { CONFIG } from '../config';
import { collideSegment, type Ball } from './collide';
import { inShape, polysToSegments, type Seg } from './geometry';
import { moverPoly, moverVelocity, tickToSec } from './movers';
import type { HoleDef, MoverDef, SimEvent, SimState, Vec } from './types';

const DT = CONFIG.sim.dt;
const WALL_R = CONFIG.ball.r + CONFIG.wall.half;
const segCache = new WeakMap<HoleDef, Seg[]>();

export const segmentsOf = (hole: HoleDef): Seg[] => {
  let s = segCache.get(hole);
  if (!s) { s = polysToSegments(hole.walls); segCache.set(hole, s); }
  return s;
};

export class Sim {
  readonly ball: Ball;
  state: SimState = 'idle';
  tick = 0;
  events: SimEvent[] = [];
  /** Where the ball last came to rest (water returns here). */
  lastSpot: Vec;
  private rest = 0;
  private rollTicks = 0;
  private inSand = false;
  private readonly segs: Seg[];
  private readonly mpoly: Vec[][];
  private readonly scratch: Vec = { x: 0, y: 0 };
  private readonly mv: Vec = { x: 0, y: 0 };

  constructor(readonly hole: HoleDef, tick = 0) {
    this.segs = segmentsOf(hole);
    this.ball = { x: hole.tee.x, y: hole.tee.y, vx: 0, vy: 0, px: hole.tee.x, py: hole.tee.y, roll: 0 };
    this.lastSpot = { x: hole.tee.x, y: hole.tee.y };
    this.mpoly = (hole.movers ?? []).map(() => []);
    this.tick = tick;
    this.updateMovers();
  }

  get speed(): number { return Math.hypot(this.ball.vx, this.ball.vy); }
  get time(): number { return tickToSec(this.tick); }
  /** Current corner points of each moving obstacle. */
  get moverPolys(): readonly (readonly Vec[])[] { return this.mpoly; }

  place(p: Vec): void {
    const b = this.ball;
    b.x = b.px = p.x; b.y = b.py = p.y; b.vx = b.vy = 0;
    this.state = 'idle';
    this.lastSpot = { x: p.x, y: p.y };
    this.rest = 0;
  }

  /** Copy for look-ahead (aim preview, solver). Events are not copied. */
  clone(): Sim {
    const s = new Sim(this.hole, this.tick);
    Object.assign(s.ball, this.ball);
    s.state = this.state; s.lastSpot = { ...this.lastSpot };
    s.rest = this.rest; s.rollTicks = this.rollTicks; s.inSand = this.inSand;
    return s;
  }

  strike(angle: number, power: number): boolean {
    if (this.state !== 'idle') return false;
    const p = Math.min(1, Math.max(0, power));
    if (p < CONFIG.shot.minPower) return false;
    const speed = p * CONFIG.shot.maxSpeed;
    this.ball.vx = Math.cos(angle) * speed;
    this.ball.vy = Math.sin(angle) * speed;
    this.lastSpot = { x: this.ball.x, y: this.ball.y };
    this.state = 'rolling';
    this.rest = 0;
    this.rollTicks = 0;
    this.events.push({ type: 'strike', speed });
    return true;
  }

  step(): void {
    this.tick++;
    this.updateMovers();
    const b = this.ball;
    b.px = b.x; b.py = b.y;
    if (this.state === 'idle') { this.nudgeByMovers(); return; }
    if (this.state !== 'rolling') return;
    this.rollTicks++;
    const slope = this.applyForces();
    b.x += b.vx * DT;
    b.y += b.vy * DT;
    b.roll += (this.speed * DT) / CONFIG.ball.r;
    this.collideAll();
    if (this.checkHazards() || this.checkCup()) return;
    this.checkStop(slope);
  }

  /** Slope + cup pull + friction. Returns the slope acceleration magnitude under the ball. */
  private applyForces(): number {
    const b = this.ball;
    let ax = 0;
    let ay = 0;
    for (const s of this.hole.slopes ?? []) if (inShape(b.x, b.y, s.shape)) { ax += s.ax; ay += s.ay; }
    b.vx += ax * DT; b.vy += ay * DT;
    const c = this.hole.cup;
    const dx = c.x - b.x;
    const dy = c.y - b.y;
    const d = Math.hypot(dx, dy);
    if (d < CONFIG.cup.pullR && d > 0.01 && this.speed < CONFIG.cup.sinkSpeed * 1.2) {
      b.vx += (dx / d) * CONFIG.cup.pull * DT; b.vy += (dy / d) * CONFIG.cup.pull * DT;
    }
    const sand = (this.hole.sand ?? []).some((p) => inShape(b.x, b.y, p.shape));
    if (sand && !this.inSand) this.events.push({ type: 'sand', x: b.x, y: b.y });
    this.inSand = sand;
    const sp = this.speed;
    const dec = ((sand ? CONFIG.friction.sand : CONFIG.friction.grass) + CONFIG.friction.drag * sp) * DT;
    const k = sp <= dec ? 0 : (sp - dec) / sp;
    b.vx *= k; b.vy *= k;
    return Math.hypot(ax, ay);
  }

  private collideAll(): void {
    const b = this.ball;
    const e = CONFIG.wall.restitution;
    for (let pass = 0; pass < 2; pass++) {
      for (const s of this.segs) {
        const v = collideSegment(b, s.ax, s.ay, s.bx, s.by, WALL_R, e);
        if (v > 0) this.events.push({ type: 'wall', speed: v, x: b.x, y: b.y });
      }
      for (const p of this.hole.posts ?? []) {
        const v = collideSegment(b, p.x, p.y, p.x, p.y, p.r + CONFIG.ball.r, CONFIG.wall.postRestitution);
        if (v > 0) this.events.push({ type: 'post', speed: v, x: b.x, y: b.y });
      }
      this.collideMovers(e);
    }
  }

  private collideMovers(e: number): number {
    const b = this.ball;
    const defs = this.hole.movers ?? [];
    let worst = 0;
    for (let m = 0; m < defs.length; m++) {
      const poly = this.mpoly[m] as Vec[];
      for (let i = 0; i < 4; i++) {
        const p = poly[i] as Vec;
        const n = poly[(i + 1) % 4] as Vec;
        this.scratch.x = b.x; this.scratch.y = b.y;
        moverVelocity(defs[m] as MoverDef, this.time, this.scratch, this.mv);
        const v = collideSegment(b, p.x, p.y, n.x, n.y, CONFIG.ball.r + 1, e, this.mv.x, this.mv.y);
        if (v > 0) { worst = Math.max(worst, v); this.events.push({ type: 'mover', speed: v, x: b.x, y: b.y }); }
      }
    }
    return worst;
  }

  /** A mover sweeping into a resting ball sets it rolling. */
  private nudgeByMovers(): void {
    if (!this.hole.movers?.length) return;
    if (this.collideMovers(CONFIG.wall.restitution) > 0) {
      this.state = 'rolling'; this.rest = 0; this.rollTicks = 0;
      this.collideAll();
    }
  }

  private checkHazards(): boolean {
    const b = this.ball;
    for (const h of this.hole.hazards ?? []) {
      if (!inShape(b.x, b.y, h.shape)) continue;
      this.state = 'water';
      this.events.push({ type: 'splash', x: b.x, y: b.y, kind: h.kind });
      b.vx = b.vy = 0;
      return true;
    }
    return false;
  }

  private checkCup(): boolean {
    const b = this.ball;
    const c = this.hole.cup;
    if (Math.hypot(b.x - c.x, b.y - c.y) >= CONFIG.cup.r || this.speed > CONFIG.cup.sinkSpeed) return false;
    b.x = c.x; b.y = c.y; b.vx = b.vy = 0;
    this.state = 'sunk';
    this.events.push({ type: 'sink', x: c.x, y: c.y });
    return true;
  }

  private checkStop(slope: number): void {
    const b = this.ball;
    const slow = this.speed < CONFIG.stop.speed;
    this.rest = slow ? this.rest + 1 : 0;
    const timeout = this.rollTicks * DT > CONFIG.stop.maxRollSec;
    if ((slow && slope <= CONFIG.slope.hold) || this.rest > CONFIG.stop.restTicks || timeout) {
      b.vx = b.vy = 0;
      this.state = 'idle';
      this.lastSpot = { x: b.x, y: b.y };
      this.events.push({ type: 'rest' });
    }
  }

  private updateMovers(): void {
    const defs = this.hole.movers ?? [];
    const t = this.time;
    for (let i = 0; i < defs.length; i++) moverPoly(defs[i] as MoverDef, t, this.mpoly[i] as Vec[]);
  }
}
