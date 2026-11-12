// Sprite layer: a visual mirror of the logical board. The logic is instant; the
// sprites ease towards their targets, so input never has to wait for animation.
import type { Board, ClearResult } from '../board';
import { CONFIG } from '../config';

export interface Sprite {
  colour: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  vy: number;
  popAge: number; // < 0 live, otherwise ms since the pop began
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  colour: number;
  /** 0 = glowing spark, 1 = tumbling shard. */
  kind: number;
  rot: number;
  vr: number;
  size: number;
}
export interface Ring {
  x: number;
  y: number;
  age: number;
  colour: number;
}
export interface Floater {
  text: string;
  x: number;
  y: number;
  age: number;
}

const fx = CONFIG.fx;

export class SpriteLayer {
  grid: (Sprite | undefined)[][] = [];
  popping: Sprite[] = [];
  particles: Particle[] = [];
  floaters: Floater[] = [];
  rings: Ring[] = [];
  reduced = false;

  /** Replace everything with `board`; discs drop in from above unless `instant`. */
  reset(board: Board, instant: boolean): void {
    this.popping = [];
    this.particles = [];
    this.floaters = [];
    this.rings = [];
    this.grid = board.cols.map((col, x) =>
      col.map((colour, y) => this.make(colour, x, y, instant ? y : board.height + y + x * 0.6)),
    );
  }

  private make(colour: number, x: number, y: number, startY: number): Sprite {
    return { colour, x, y: startY, tx: x, ty: y, vy: 0, popAge: -1 };
  }

  applyClear(res: ClearResult, points: number): void {
    const centre = { x: 0, y: 0 };
    for (const r of res.removed) {
      const s = this.grid[r.x]?.[r.y];
      if (!s) continue;
      centre.x += r.x / res.removed.length;
      centre.y += r.y / res.removed.length;
      this.grid[r.x]![r.y] = undefined;
      this.pop(s);
    }
    for (const m of res.moves) {
      const s = this.grid[m.from.x]?.[m.from.y];
      if (!s) continue;
      s.tx = m.to.x;
      s.ty = m.to.y;
      if (this.reduced) {
        s.x = s.tx;
        s.y = s.ty;
      }
    }
    this.grid = layout(this.grid.flat());
    if (!this.reduced && points > 0) this.floaters.push({ text: `+${points}`, x: centre.x, y: centre.y, age: 0 });
  }

  private pop(s: Sprite): void {
    s.popAge = 0;
    this.popping.push(s);
    if (this.reduced) return;
    if (this.rings.length < fx.ringCap) this.rings.push({ x: s.x, y: s.y, age: 0, colour: s.colour });
    for (let i = 0; i < fx.particlesPerDisc && this.particles.length < fx.particleCap; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 2.2 + Math.random() * 3.2;
      const shard = i % 2 === 0;
      this.particles.push({
        x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 2, life: shard ? 0.7 : 0.5, colour: s.colour,
        kind: shard ? 1 : 0, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, size: shard ? 0.13 + Math.random() * 0.07 : 0.1 + Math.random() * 0.08,
      });
    }
  }

  applyRise(x: number, colours: readonly number[]): void {
    this.grid[x] = colours.map((c, y) => this.make(c, x, y, this.reduced ? y : y - colours.length - 1));
  }

  get busy(): boolean {
    if (this.popping.length > 0 || this.particles.length > 0 || this.floaters.length > 0 || this.rings.length > 0) return true;
    return this.grid.some((c) => c.some((s) => s && (s.x !== s.tx || s.y !== s.ty)));
  }

  update(dt: number): void {
    for (const col of this.grid) for (const s of col) if (s) step(s, dt);
    for (const s of this.popping) s.popAge += dt * 1000;
    this.popping = this.popping.filter((s) => s.popAge < (this.reduced ? 60 : fx.popMs));
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 12 * dt;
      p.rot += p.vr * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) f.age += dt * 1000;
    this.floaters = this.floaters.filter((f) => f.age < fx.floatMs);
    for (const r of this.rings) r.age += dt * 1000;
    this.rings = this.rings.filter((r) => r.age < fx.ringMs);
  }
}

/** Targets are authoritative: lay sprites out by their (tx, ty). */
function layout(sprites: readonly (Sprite | undefined)[]): (Sprite | undefined)[][] {
  const out: (Sprite | undefined)[][] = [];
  for (const s of sprites) if (s) (out[s.tx] ??= [])[s.ty] = s;
  return Array.from({ length: Math.max(out.length, CONFIG.board.cols) }, (_, x) => out[x] ?? []);
}

function step(s: Sprite, dt: number): void {
  const dx = s.tx - s.x;
  s.x = Math.abs(dx) < 0.005 ? s.tx : s.x + dx * Math.min(1, dt * fx.slideRate);
  if (s.y > s.ty) {
    s.vy += fx.gravity * dt;
    s.y = Math.max(s.ty, s.y - s.vy * dt);
    if (s.y === s.ty) s.vy = 0;
  } else if (s.y < s.ty) {
    const dy = s.ty - s.y;
    s.y = dy < 0.005 ? s.ty : s.y + dy * Math.min(1, dt * fx.riseRate);
  }
}
