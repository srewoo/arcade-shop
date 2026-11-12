// Pip and the cats, drawn at interpolated positions.
import { BLINK_SEC, drenchBlinking } from './modes';
import { lerpMover } from './movement';
import { tileCenterX, tileCenterY } from './layout';
import type { Particles } from './particles';
import { drawCat } from './spriteCat';
import { drawPip } from './spritePip';
import { isDrenched, isGrooming } from './world';
import type { Game } from './flow';
import type { Dir } from './types';

type Ctx = CanvasRenderingContext2D;

export interface ActorOpts {
  readonly assist: boolean;
  readonly bold: boolean;
}

/** Soft contact shadow so sprites sit on the floor instead of floating. */
function groundShadow(ctx: Ctx, x: number, y: number, rx: number, alpha: number): void {
  ctx.fillStyle = `rgba(8,3,4,${0.3 * alpha})`;
  ctx.beginPath();
  ctx.ellipse(x + 1.5, y + 3.2, rx, rx * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
}

export class ActorPainter {
  private lastDir: Dir = 'R';

  constructor(private readonly particles: Particles) {}

  draw(ctx: Ctx, game: Game, t: number, alpha: number, o: ActorOpts): void {
    const { world } = game;
    const calm = game.reducedMotion;
    for (const cat of world.cats) {
      const wet = isDrenched(world, cat);
      const p = lerpMover(cat, alpha);
      const x = tileCenterX(p.x);
      const y = tileCenterY(p.y);
      if (wet && Math.random() < (calm ? 0.04 : 0.16)) this.particles.drip(x, y + 5);
      if (cat.mode !== 'returning') groundShadow(ctx, x, y + (cat.mode === 'house' ? 0 : 0), 10, 1);
      drawCat(ctx, x, y, {
        kind: cat.kind, dir: cat.dir, time: t, drenched: wet, wearingOff: wet && (calm ? world.drench.left < BLINK_SEC : drenchBlinking(world.drench)),
        pouncing: cat.pouncing, windup: cat.pounce.phase === 'windup', grooming: isGrooming(world, cat),
        returning: cat.mode === 'returning', bob: cat.mode === 'house' ? Math.sin(t * 6 + cat.index) * 1.4 : 0,
        calm, assist: o.assist, bold: o.bold,
      });
    }
    this.drawPipSprite(ctx, game, t, alpha, o);
  }

  private drawPipSprite(ctx: Ctx, game: Game, t: number, alpha: number, o: ActorOpts): void {
    const { pip } = game.world;
    if (pip.dir !== 'N') this.lastDir = pip.dir;
    const dying = game.phase === 'dying';
    const k = game.phaseT;
    const calm = game.reducedMotion;
    const p = lerpMover(pip, alpha);
    const x = tileCenterX(p.x);
    const y = tileCenterY(p.y);
    const pa = dying ? Math.max(0, 1 - Math.max(0, k - 0.5) / 1.1) : 1;
    groundShadow(ctx, x, y, 8, pa);
    drawPip(ctx, x, y, {
      dir: this.lastDir, time: t, moving: pip.dir !== 'N',
      spin: dying && !calm ? Math.max(0, k - 0.35) * 16 : 0,
      alpha: dying ? Math.max(0, 1 - Math.max(0, k - 0.5) / 1.1) : 1,
      scale: dying && !calm ? Math.max(0.1, 1 - Math.max(0, k - 0.35) / 1.4) : 1, calm, bold: o.bold,
    });
    if (dying && k < 0.45) this.drawPaw(ctx, x, y, k / 0.45);
  }

  private drawPaw(ctx: Ctx, x: number, y: number, p: number): void {
    const off = (1 - p) * 26;
    ctx.save();
    ctx.translate(x + off, y - off);
    ctx.fillStyle = 'rgba(40,36,48,0.92)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a4b4';
    for (const [dx, dy] of [[-4, -5], [0, -7], [4, -5]] as const) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
