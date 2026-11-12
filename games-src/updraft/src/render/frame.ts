// Composes one frame: interpolated craft, scrolling world, particles, popups, shake and flash.
import { CONFIG } from '../config';
import type { Game } from '../game';
import { hashSeed, mulberry32 } from '../rng';
import { World } from '../world';
import { ATTRACT_SEED, attractDist, attractY } from './attract';
import { CRAFT_ART, drawCoins, drawCraft, drawGhost } from './entities';
import { Particles } from './particles';
import { Popups } from './popups';
import { drawObstacles, drawWalls } from './rock';
import { drawBackdrop } from './terrain';
import type { Palette, View } from './view';

export interface FrameOpts { reduced: boolean; assist: boolean; time: number; dt: number }

const NO_COINS: ReadonlySet<number> = new Set();
const RING_SEC = 0.55;

export class Renderer {
  readonly particles = new Particles();
  readonly popups = new Popups();
  private shake = 0;
  private flash = 0;
  private wasCrashed = false;
  private coinSeen = 0;
  private runRef: unknown = null;
  private readonly rnd = mulberry32(99);
  private readonly attract = new World(hashSeed(ATTRACT_SEED));

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  draw(game: Game, v: View, pal: Palette, o: FrameOpts): void {
    const { ctx } = this;
    this.begin(v, o);
    const run = game.run;
    if (!run) { this.drawAttract(v, pal, o); return; }
    this.particles.factor = o.reduced ? CONFIG.fx.reducedFactor : 1;
    const a = game.alpha;
    const sim = run.sim;
    const dist = sim.prevDist + (sim.dist - sim.prevDist) * a;
    const y = sim.prevY + (sim.y - sim.prevY) * a;
    const ready = game.phase === 'ready';
    const bob = ready && !o.reduced ? Math.sin(o.time * 3) * 6 : 0;
    const camX = dist - v.cx;
    const crashed = game.phase === 'crashed' || game.phase === 'over';
    this.react(game, crashed, dist, y, o);
    this.setTransform(v, o);
    drawBackdrop(ctx, v, pal, camX, !o.reduced, o.time);
    drawCoins(ctx, v, pal, run.world, sim.taken, camX, o.time, !o.reduced, o.assist);
    if (run.ghostSim) drawGhost(ctx, run.ghostSim, a, camX, pal);
    drawWalls(ctx, v, pal, run.world, camX, o.assist);
    drawObstacles(ctx, v, pal, run.world, camX, o.assist);
    this.particles.draw(ctx, camX, pal);
    if (!crashed) {
      if (ready) this.readyRing(v.cx, y + bob, pal, o);
      drawCraft(ctx, v.cx, y + bob, sim.vy, pal, { thrusting: game.hold, time: o.time });
    } else {
      this.shockwave(v.cx, y, game.crashClock, pal, o);
    }
    this.popups.draw(ctx, camX, o.reduced);
    this.finish(v, pal, o);
  }

  private begin(v: View, o: FrameOpts): void {
    this.ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    this.ctx.clearRect(0, 0, v.pxW, v.pxH);
    this.setTransform(v, o);
  }

  private setTransform(v: View, o: FrameOpts): void {
    const s = v.dpr * v.s;
    this.ctx.setTransform(s, 0, 0, s, v.dpr * this.shakeX(o), v.dpr * (v.pxH / 2 - (CONFIG.world.height / 2) * v.s));
  }

  private drawAttract(v: View, pal: Palette, o: FrameOpts): void {
    const { ctx } = this;
    const w = this.attract;
    const dist = attractDist(o.time, o.reduced);
    const camX = dist - v.cx;
    const y = attractY(w, dist, o.time, o.reduced);
    drawBackdrop(ctx, v, pal, camX, !o.reduced, o.time);
    drawCoins(ctx, v, pal, w, NO_COINS, camX, o.time, !o.reduced, o.assist);
    drawWalls(ctx, v, pal, w, camX, o.assist);
    drawObstacles(ctx, v, pal, w, camX, o.assist);
    drawCraft(ctx, v.cx, y, Math.cos(o.time * 1.4) * 40, pal, { thrusting: !o.reduced && Math.cos(o.time * 1.4) > 0, time: o.time });
  }

  private readyRing(x: number, y: number, pal: Palette, o: FrameOpts): void {
    const k = o.reduced ? 0.5 : (o.time * 0.9) % 1;
    this.ctx.strokeStyle = pal.craft;
    this.ctx.globalAlpha = 0.6 * (1 - k);
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, CONFIG.craft.radius * CRAFT_ART * (1.6 + k * 2.4), 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  private shockwave(x: number, y: number, t: number, pal: Palette, o: FrameOpts): void {
    if (o.reduced || t > RING_SEC) return;
    const k = t / RING_SEC;
    const R = 20 + k * 90;
    const fb = this.ctx.createRadialGradient(x, y, 0, x, y, R);
    fb.addColorStop(0, '#fff9dc');
    fb.addColorStop(0.35, pal.flame);
    fb.addColorStop(1, 'rgba(255,100,40,0)');
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.globalAlpha = Math.max(0, 1 - k * 1.4);
    this.ctx.fillStyle = fb;
    this.ctx.beginPath();
    this.ctx.arc(x, y, R, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
    this.ctx.strokeStyle = pal.flame;
    this.ctx.globalAlpha = 1 - k;
    this.ctx.lineWidth = 6 * (1 - k) + 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 14 + k * 110, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  private shakeX(o: FrameOpts): number {
    return o.reduced || this.shake <= 0 ? 0 : (this.rnd() - 0.5) * CONFIG.fx.shakePx * (this.shake / CONFIG.fx.shakeSec);
  }

  private react(game: Game, crashed: boolean, dist: number, y: number, o: FrameOpts): void {
    const run = game.run;
    if (run && run !== this.runRef) {
      this.runRef = run;
      this.coinSeen = 0;
      this.popups.clear();
    }
    this.shake = Math.max(0, this.shake - o.dt);
    this.flash = Math.max(0, this.flash - o.dt);
    if (run && run.sim.coinCount > this.coinSeen) {
      this.coinSeen = run.sim.coinCount;
      this.popups.add(dist, y, `+${CONFIG.score.coinValue}`);
      this.particles.burst(dist, y, 12, '#ffd24a', 110);
    }
    if (crashed && !this.wasCrashed) {
      this.particles.burst(dist, y, 40);
      this.particles.burst(dist, y, 14, '#fff4c2', 300);
      if (!o.reduced) {
        this.shake = CONFIG.fx.shakeSec;
        this.flash = CONFIG.fx.flashSec;
      }
    }
    this.wasCrashed = crashed;
    if (game.phase === 'playing' || game.phase === 'ready') {
      this.particles.smoke(dist, y, game.hold && game.phase === 'playing');
    }
    if (game.phase !== 'paused') {
      this.particles.update(o.dt);
      this.popups.update(o.dt);
    }
    if (game.phase === 'ready' && run?.sim.tick === 0) this.particles.clear();
  }

  private finish(v: View, pal: Palette, o: FrameOpts): void {
    if (this.flash <= 0 || o.reduced) return;
    this.ctx.globalAlpha = (this.flash / CONFIG.fx.flashSec) * 0.5;
    this.ctx.fillStyle = pal.flame;
    this.ctx.fillRect(-10, v.top - 10, v.wv + 20, v.bottom - v.top + 20);
    this.ctx.globalAlpha = 1;
  }
}
