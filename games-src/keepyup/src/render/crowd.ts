// Animated crowd and pennants. Static positions are baked once; per frame only a bob offset is
// applied, and heads are batched by colour so the whole crowd costs a handful of fills.
import { mulberry32 } from '../rng';
import { BANDS } from './layout';
import { PAL } from './palette';

interface Fan { x: number; row: number; bob: number; phase: number; skin: number; shirt: number }

export class Crowd {
  private fans: Fan[] = [];
  private flagXs: number[] = [];
  private built = '';
  /** 0..1 excitement, decays; raised by milestones. */
  excite = 0;

  build(x0: number, x1: number): void {
    const key = `${Math.round(x0)}:${Math.round(x1)}`;
    if (key === this.built) return;
    this.built = key;
    const rnd = mulberry32(31);
    this.fans = [];
    BANDS.rows.forEach((_, row) => {
      for (let x = x0 + 6 + rnd() * 10; x < x1; x += 15 + rnd() * 5) {
        this.fans.push({ x, row, bob: 1.5 + rnd() * 2, phase: rnd() * 6.28, skin: Math.floor(rnd() * PAL.crowd.length), shirt: Math.floor(rnd() * PAL.shirts.length) });
      }
    });
    this.flagXs = [];
    for (let x = x0 + 70; x < x1; x += 180) this.flagXs.push(x);
  }

  update(dt: number): void { this.excite = Math.max(0, this.excite - dt * 0.35); }

  draw(ctx: CanvasRenderingContext2D, t: number, animate: boolean, windSway: number): void {
    const amp = animate ? 1 + this.excite * 3.2 : 0;
    const rate = 2.2 + this.excite * 5;
    for (let c = 0; c < PAL.shirts.length; c++) {
      ctx.fillStyle = PAL.shirts[c] ?? '#fff';
      ctx.beginPath();
      for (const f of this.fans) {
        if (f.shirt !== c) continue;
        const y = (BANDS.rows[f.row] ?? 0) + 18 - Math.abs(Math.sin(t * rate + f.phase)) * f.bob * amp;
        ctx.rect(f.x - 5, y, 10, 14);
      }
      ctx.fill();
    }
    for (let c = 0; c < PAL.crowd.length; c++) {
      ctx.fillStyle = PAL.crowd[c] ?? '#fcc';
      ctx.beginPath();
      for (const f of this.fans) {
        if (f.skin !== c) continue;
        const y = (BANDS.rows[f.row] ?? 0) + 14 - Math.abs(Math.sin(t * rate + f.phase)) * f.bob * amp;
        ctx.moveTo(f.x + 4.6, y); ctx.arc(f.x, y, 4.6, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    this.flags(ctx, t, animate, windSway);
  }

  private flags(ctx: CanvasRenderingContext2D, t: number, animate: boolean, windSway: number): void {
    const colors = [PAL.shirts[0], PAL.shirts[1], PAL.shirts[3]];
    this.flagXs.forEach((x, i) => {
      const top = BANDS.stands.top - 40;
      ctx.fillStyle = PAL.pole; ctx.fillRect(x - 1.2, top, 2.4, 44);
      const sway = animate ? Math.sin(t * 3 + i * 1.7) * 3 : 0;
      const lean = 16 + windSway * 8;
      ctx.fillStyle = colors[i % 3] ?? '#fff';
      ctx.beginPath(); ctx.moveTo(x + 1, top + 2);
      ctx.quadraticCurveTo(x + lean * 0.5, top + 4 + sway, x + lean, top + 8 + sway * 0.5);
      ctx.quadraticCurveTo(x + lean * 0.5, top + 14 + sway, x + 1, top + 16); ctx.closePath(); ctx.fill();
    });
  }
}
