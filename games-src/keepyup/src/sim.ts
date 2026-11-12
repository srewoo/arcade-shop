// Deterministic simulation. Fixed step; the caller feeds taps. Emits events through a callback.
import { CONFIG } from './config';
import type { Mode } from './modes';
import { applyHit, gravityAt, hitResult, inReach, isMiss, makeBall, stepBall, type Ball } from './physics';
import { createRng } from './rng';
import { tierCrossed, type Tier } from './tiers';
import { Wind } from './wind';

export type SimEvent =
  | { t: 'hit'; ball: number; x: number; y: number; offsetX: number; sweet: boolean; score: number }
  | { t: 'whiff'; x: number; y: number }
  | { t: 'wall'; ball: number; x: number; y: number }
  | { t: 'tier'; tier: Tier }
  | { t: 'spawn'; ball: number }
  | { t: 'gust' }
  | { t: 'miss'; ball: number; x: number };

export class Sim {
  readonly balls: Ball[] = [];
  score = 0;
  time = 0;
  over = false;
  started = false;
  width: number;
  private wind: Wind;
  private spawnAt = Infinity;
  private gustWarned = false;
  windNow = 0;

  constructor(readonly mode: Mode, seed: number, width: number, private readonly emit: (e: SimEvent) => void = () => {}) {
    this.width = width;
    this.wind = new Wind(createRng(seed), mode === 'windy');
    this.balls.push(makeBall(width / 2, 170));
    if (mode === 'twoballs') {
      this.balls.push(makeBall(width / 2, 170, false));
      this.spawnAt = CONFIG.twoBalls.secondDelay;
    }
  }

  get gravity(): number { return gravityAt(this.time); }

  /** Walls follow the visible width; balls are pulled back inside. */
  setWidth(w: number): void {
    this.width = w;
    if (!this.started) for (const b of this.balls) { b.x = b.px = w / 2; }
    const r = CONFIG.ball.radius;
    for (const b of this.balls) { b.x = Math.min(Math.max(b.x, r), w - r); b.px = b.x; }
  }

  /** Strike at a world point. Returns true when a ball was hit. Starts the rally if needed. */
  tap(x: number, y: number): boolean {
    if (this.over) return false;
    this.started = true;
    let best = -1;
    let bestD = Infinity;
    this.balls.forEach((b, i) => {
      if (!b.active || !inReach(b, x, y)) return;
      const d = (x - b.x) ** 2 + (y - b.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    const b = this.balls[best];
    if (!b) { this.emit({ t: 'whiff', x, y }); return false; }
    const r = hitResult(b, x, y);
    applyHit(b, r);
    const prev = this.score;
    this.score++;
    this.emit({ t: 'hit', ball: best, x: b.x, y: b.y, offsetX: r.offsetX, sweet: r.sweet, score: this.score });
    const tier = tierCrossed(prev, this.score);
    if (tier) this.emit({ t: 'tier', tier });
    return true;
  }

  step(dt: number): void {
    if (this.over || !this.started) return;
    this.time += dt;
    this.windNow = this.wind.at(this.time);
    this.watchGust();
    if (this.time >= this.spawnAt) this.spawn();
    const g = this.gravity;
    this.balls.forEach((b, i) => {
      if (!b.active || this.over) return;
      if (stepBall(b, dt, g, this.windNow, this.width)) this.emit({ t: 'wall', ball: i, x: b.x, y: b.y });
      if (isMiss(b)) { this.over = true; this.emit({ t: 'miss', ball: i, x: b.x }); }
    });
  }

  private spawn(): void {
    this.spawnAt = Infinity;
    const b = this.balls[1];
    if (!b) return;
    b.active = true;
    b.x = b.px = this.width * (this.balls[0] && this.balls[0].x > this.width / 2 ? 0.28 : 0.72);
    b.y = b.py = -CONFIG.ball.radius;
    b.vy = 60;
    this.emit({ t: 'spawn', ball: 1 });
  }

  private watchGust(): void {
    const soon = this.wind.untilNext(this.time) <= 0.6;
    if (soon && !this.gustWarned) this.emit({ t: 'gust' });
    this.gustWarned = soon;
  }
}
