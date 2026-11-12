// Crash particles, shock rings and strike flash. Glow sprites are pre-rendered once.
import type { Game } from './game';

type Ctx = CanvasRenderingContext2D;

let glow: HTMLCanvasElement | null = null;

function glowSprite(): HTMLCanvasElement | null {
  if (glow) return glow;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 64, 64);
  glow = c;
  return c;
}

function drawRings(ctx: Ctx, game: Game, sprite: HTMLCanvasElement | null): void {
  for (const r of game.pres.particles.rings) {
    if (!r.active) continue;
    const t = r.life / r.maxLife;
    const radius = r.maxR * (0.2 + 0.8 * t);
    if (sprite) {
      ctx.globalAlpha = Math.pow(1 - t, 2) * 0.7;
      ctx.drawImage(sprite, r.x - radius * 1.4, r.y - radius * 1.4, radius * 2.8, radius * 2.8);
    }
    ctx.globalAlpha = (1 - t) * 0.85;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2 + 7 * (1 - t);
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = (1 - t) * 0.5;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius * 0.86, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawParticles(ctx: Ctx, game: Game): void {
  const { particles } = game.pres;
  const sprite = glowSprite();
  ctx.save();
  drawRings(ctx, game, sprite);
  for (const p of particles.items) {
    if (!p.active) continue;
    const life = Math.max(0, 1 - p.life / p.maxLife);
    ctx.globalAlpha = life;
    if (p.square) {
      // Splinter / confetti chip: tumbles along its flight.
      ctx.save();
      ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
      ctx.rotate(p.life * 9 + p.size);
      ctx.fillStyle = 'rgba(110,40,70,0.55)';
      ctx.fillRect(-p.size / 2 - 1, -p.size * 0.25 - 1, p.size + 2, p.size * 0.5 + 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size * 0.25, p.size, p.size * 0.5);
      ctx.restore();
    } else if (sprite) {
      const s = p.size * 3.4;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
      ctx.strokeStyle = 'rgba(110,40,70,0.55)';
      ctx.lineWidth = Math.max(2, p.size * 0.5) + 1.5;
      ctx.stroke();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.5, p.size * 0.5);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
