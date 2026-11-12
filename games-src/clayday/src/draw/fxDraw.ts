// Particle drawing for the effects in ../fx.ts: tumbling shards, soft dust and smoke puffs, pellet cloud, rings and stars.
import type { Particle } from '../fx';
import { PALETTE as P } from '../palette';
import { puffSprite } from './sprites';

function shard(ctx: CanvasRenderingContext2D, p: Particle, k: number): void {
  ctx.globalAlpha = Math.min(1, k * 1.6);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.rot * 1.3)));
  const s = p.size;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.3);
  ctx.lineTo(-s * 0.1, -s * 0.7);
  ctx.lineTo(s, -s * 0.1);
  ctx.lineTo(s * 0.3, s * 0.6);
  ctx.lineTo(-s * 0.7, s * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.clayOutline;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-s * 0.7, -s * 0.4, s * 0.9, s * 0.18);
  ctx.restore();
}

function puff(ctx: CanvasRenderingContext2D, p: Particle, k: number): void {
  const grow = 2 - k;
  const r = p.size * grow * 1.5;
  ctx.globalAlpha = Math.max(0, p.kind === 'puff' ? k * 0.6 : k * 0.5);
  ctx.drawImage(puffSprite(p.color), p.x - r, p.y - r, r * 2, r * 2);
}

function ring(ctx: CanvasRenderingContext2D, p: Particle, k: number): void {
  ctx.globalAlpha = Math.max(0, k) * 0.8;
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 1 + k * 4;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * (1.2 - k), 0, Math.PI * 2);
  ctx.stroke();
}

function star(ctx: CanvasRenderingContext2D, p: Particle, k: number): void {
  ctx.globalAlpha = Math.max(0, k);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.fillStyle = p.color;
  const s = p.size * (0.5 + k);
  ctx.beginPath();
  ctx.moveTo(0, -s); ctx.lineTo(s * 0.25, -s * 0.25); ctx.lineTo(s, 0); ctx.lineTo(s * 0.25, s * 0.25);
  ctx.lineTo(0, s); ctx.lineTo(-s * 0.25, s * 0.25); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.25, -s * 0.25);
  ctx.fill();
  ctx.restore();
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const k = 1 - p.life / p.max;
  if (k <= 0) return;
  switch (p.kind) {
    case 'frag': shard(ctx, p, k); break;
    case 'puff':
    case 'smoke': puff(ctx, p, k); break;
    case 'ring': ring(ctx, p, k); break;
    case 'star': star(ctx, p, k); break;
    default:
      ctx.globalAlpha = k * 0.7;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
  }
}
