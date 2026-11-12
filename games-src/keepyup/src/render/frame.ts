// Frame compositor: static layers, animated crowd/clouds, balls (interpolated), shadows, effects.
import { CONFIG } from '../config';
import { heightFrac } from '../physics';
import type { Game } from '../game';
import type { SimEvent } from '../sim';
import { Backdrop } from './backdrop';
import { drawBall } from './ballSprite';
import { Clouds } from './clouds';
import { Crowd } from './crowd';
import { Effects } from './fx';
import { drawReticle, drawShadow, drawSock, drawStreaks } from './scenery';
import { applyWorld, type View } from './view';

export interface FrameOpts { reduced: boolean; assist: boolean; time: number; dt: number }

export class Renderer {
  readonly fx = new Effects();
  private readonly back = new Backdrop();
  private readonly crowd = new Crowd();
  private readonly clouds = new Clouds();
  private hitAt: number[] = [-9, -9];
  private now = 0;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** Feed sim events into the visual effects. */
  onEvent(e: SimEvent): void {
    if (e.t === 'hit') {
      this.fx.hit(e.x, e.y, e.sweet, e.sweet ? 'Sweet!' : '+1');
      this.hitAt[e.ball] = this.now;
      if (e.score % 10 === 0) this.crowd.excite = Math.min(1, this.crowd.excite + 0.4);
    } else if (e.t === 'wall') this.fx.wall(e.x, e.y);
    else if (e.t === 'miss') this.fx.land(e.x);
    else if (e.t === 'tier') { this.fx.tier(e.tier.label); this.crowd.excite = 1; }
  }

  reset(): void { this.fx.clear(); this.hitAt = [-9, -9]; }

  draw(game: Game, v: View, o: FrameOpts): void {
    const { ctx } = this;
    this.now = o.time;
    this.fx.factor = o.reduced ? CONFIG.fx.reducedFactor : 1;
    this.back.ensure(v);
    const k = v.s * v.dpr;
    this.clouds.ensure(k);
    this.crowd.build(-v.ox, v.wv - v.ox);
    this.fx.update(o.dt);
    this.crowd.update(o.dt);
    const sh = this.fx.shakeOffset(o.time);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    applyWorld(ctx, v, sh.x, sh.y);
    this.scene(game, v, o, k);
    this.balls(game, v, o, k);
    this.overlay(game, v, o);
  }

  private scene(game: Game, v: View, o: FrameOpts, k: number): void {
    const { ctx } = this;
    const animate = !o.reduced;
    const wind = game.sim.windNow / CONFIG.wind.forceMax;
    this.back.drawBack(ctx);
    this.clouds.draw(ctx, o.time, -v.ox, v.wv - v.ox, animate, k);
    this.crowd.draw(ctx, o.time, animate, Math.max(-1, Math.min(1, wind)));
    this.back.drawFront(ctx);
    if (game.mode === 'windy') {
      if (animate) drawStreaks(ctx, wind, o.time, v.worldW);
      drawSock(ctx, v.worldW * 0.9, wind, o.time, animate);
    }
  }

  private balls(game: Game, v: View, o: FrameOpts, k: number): void {
    const { ctx } = this;
    const sim = game.sim;
    const alpha = game.phase === 'playing' ? Math.min(1, game.stepper.alpha) : 1;
    for (const b of sim.balls) {
      if (!b.active) continue;
      const bob = sim.started ? 0 : Math.sin(o.time * 2.2) * 8;
      const x = b.px + (b.x - b.px) * alpha;
      const y = b.py + (b.y - b.py) * alpha + bob;
      drawShadow(ctx, x, heightFrac(y));
    }
    sim.balls.forEach((b, i) => {
      if (!b.active) return;
      const bob = sim.started ? 0 : Math.sin(o.time * 2.2) * 8;
      const x = b.px + (b.x - b.px) * alpha;
      const y = b.py + (b.y - b.py) * alpha + bob;
      const rot = b.prot + (b.rot - b.prot) * alpha + (sim.started ? 0 : o.time * 0.8);
      const age = o.time - (this.hitAt[i] ?? -9);
      const squash = sim.over ? 0.82 : o.reduced ? 1 : 1 - 0.2 * Math.exp(-age * 20) * (age >= 0 ? 1 : 0);
      drawBall(ctx, k, x, y, rot, squash);
    });
    void v;
  }

  private overlay(game: Game, v: View, o: FrameOpts): void {
    const { ctx } = this;
    if (game.aim.visible && (game.phase === 'playing' || game.phase === 'ready')) drawReticle(ctx, game.aim.x, game.aim.y, o.time, !o.reduced);
    this.fx.drawGround(ctx, o.assist);
    this.fx.drawParticles(ctx);
    this.fx.drawPopups(ctx, !o.reduced);
    this.fx.drawCallout(ctx, v.worldW / 2, !o.reduced);
  }
}
