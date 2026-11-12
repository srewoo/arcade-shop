// Procedural tunnel. Columns are generated strictly in order from the seeded RNG, so the
// same seed always yields the same course no matter how it is queried.
import { CONFIG } from './config';
import { createRng, type Rng } from './rng';

const W = CONFIG.world;

export interface Obstacle { readonly x: number; readonly w: number; readonly y0: number; readonly y1: number; readonly top: boolean }
export interface Coin { readonly id: number; readonly x: number; readonly y: number }

export const gapAt = (x: number): number => Math.max(W.minGap, W.startGap - W.narrowPerUnit * Math.max(0, x));
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function firstFrom<T extends { x: number }>(items: readonly T[], x: number, width: (t: T) => number): number {
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const t = items[mid] as T;
    if (t.x + width(t) < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export class World {
  readonly ceil: number[] = [];
  readonly floor: number[] = [];
  readonly obstacles: Obstacle[] = [];
  readonly coins: Coin[] = [];
  private readonly rng: Rng;
  private center = W.height / 2;
  private target = W.height / 2;
  private segLeft = 0;
  private segStep = 0;
  private nextObs = Math.ceil(W.obstacleFrom / W.colW);
  private nextCoin = W.coinFromCol;
  private readonly pendingObs: number[] = [];
  private readonly pendingCoin: number[] = [];
  private coinId = 0;

  constructor(readonly seed: number) {
    this.rng = createRng(seed);
  }

  /** Make sure columns exist (and their obstacles/coins are final) up to world x. */
  ensure(x: number): void {
    const need = x + (W.coinLagCols + 4) * W.colW;
    while (this.ceil.length * W.colW < need) this.genColumn();
  }

  ceilAt(x: number): number { return this.sample(this.ceil, x); }
  floorAt(x: number): number { return this.sample(this.floor, x); }

  /** Free vertical span at x once obstacles are taken into account. */
  freeSpan(x: number): readonly [number, number] {
    let lo = this.ceilAt(x);
    let hi = this.floorAt(x);
    for (let i = firstFrom(this.obstacles, x - 20, (o) => o.w); i < this.obstacles.length; i++) {
      const o = this.obstacles[i] as Obstacle;
      if (o.x > x + 20) break;
      if (o.top) lo = Math.max(lo, o.y1);
      else hi = Math.min(hi, o.y0);
    }
    return [lo, hi];
  }

  obstaclesIn(x0: number, x1: number): Obstacle[] {
    this.ensure(x1);
    const out: Obstacle[] = [];
    for (let i = firstFrom(this.obstacles, x0, (o) => o.w); i < this.obstacles.length; i++) {
      const o = this.obstacles[i] as Obstacle;
      if (o.x > x1) break;
      out.push(o);
    }
    return out;
  }

  coinsIn(x0: number, x1: number): Coin[] {
    this.ensure(x1);
    const out: Coin[] = [];
    for (let i = firstFrom(this.coins, x0, () => 0); i < this.coins.length; i++) {
      const c = this.coins[i] as Coin;
      if (c.x > x1) break;
      out.push(c);
    }
    return out;
  }

  private sample(arr: readonly number[], x: number): number {
    if (x < 0) return arr[0] ?? this.sampleFresh(arr, 0);
    this.ensure(x);
    const f = x / W.colW;
    const i = Math.floor(f);
    const a = arr[i] as number;
    const b = arr[i + 1] as number;
    return a + (b - a) * (f - i);
  }

  private sampleFresh(arr: readonly number[], x: number): number {
    this.ensure(x);
    return arr[0] as number;
  }

  private walk(x: number, gap: number): void {
    if (x < W.flatUntil) return;
    const lo = W.wallMin + gap / 2;
    const hi = W.height - W.wallMin - gap / 2;
    if (this.segLeft <= 0) {
      this.target = this.rng.range(lo, hi);
      this.segLeft = this.rng.int(W.segMin, W.segMax);
      this.segStep = W.colW * this.rng.range(W.minSlope, W.maxSlope);
    }
    this.segLeft--;
    const d = this.target - this.center;
    this.center = clamp(this.center + clamp(d, -this.segStep, this.segStep), lo, hi);
  }

  private genColumn(): void {
    const k = this.ceil.length;
    const gap = gapAt(k * W.colW);
    this.walk(k * W.colW, gap);
    this.ceil.push(this.center - gap / 2);
    this.floor.push(this.center + gap / 2);
    if (k === this.nextObs) {
      this.pendingObs.push(k);
      this.nextObs += this.rng.int(W.obsSpacingMin, W.obsSpacingMax);
    }
    if (k === this.nextCoin) {
      this.pendingCoin.push(k);
      this.nextCoin += this.rng.int(W.coinSpacingMin, W.coinSpacingMax);
    }
    while (this.pendingObs.length > 0 && (this.pendingObs[0] as number) + W.obsLagCols <= k) {
      this.buildObstacle(this.pendingObs.shift() as number);
    }
    while (this.pendingCoin.length > 0 && (this.pendingCoin[0] as number) + W.coinLagCols <= k) {
      this.buildCoins(this.pendingCoin.shift() as number);
    }
  }

  private buildObstacle(start: number): void {
    const cols = Math.ceil(W.obsW / W.colW) + 2;
    let cMin = Infinity, cMax = -Infinity, fMin = Infinity, fMax = -Infinity;
    for (let c = start; c < start + cols; c++) {
      cMin = Math.min(cMin, this.ceil[c] as number);
      cMax = Math.max(cMax, this.ceil[c] as number);
      fMin = Math.min(fMin, this.floor[c] as number);
      fMax = Math.max(fMax, this.floor[c] as number);
    }
    const top = this.rng.chance(0.5);
    const frac = this.rng.range(W.obsFracMin, W.obsFracMax);
    const len = Math.min(frac * gapAt(start * W.colW), fMin - cMax - W.minPass);
    if (len < W.obsMinLen) return;
    const x = start * W.colW;
    this.obstacles.push(
      top ? { x, w: W.obsW, y0: cMin - 8, y1: cMax + len, top } : { x, w: W.obsW, y0: fMin - len, y1: fMax + 8, top },
    );
  }

  private buildCoins(start: number): void {
    const n = this.rng.int(W.coinGroupMin, W.coinGroupMax);
    for (let j = 0; j < n; j++) {
      const x = (start + j) * W.colW + W.colW / 2;
      const [lo, hi] = this.freeSpan(x);
      const amp = Math.min(W.coinWave, (hi - lo) * 0.2);
      this.coins.push({ id: this.coinId++, x, y: (lo + hi) / 2 + Math.sin(j * 1.1) * amp });
    }
  }
}
