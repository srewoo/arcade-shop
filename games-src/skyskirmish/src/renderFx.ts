// Particles, shockwaves and score popups, drawn in world space on top of the action.
import type { Fx } from './fx';

type Ctx = CanvasRenderingContext2D;

function drawRings(c: Ctx, fx: Fx): void {
  for (const r of fx.rings) {
    const k = Math.max(0, r.life / r.max);
    if (r.fill) {
      const g = c.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * k})`);
      g.addColorStop(0.35, r.color);
      g.addColorStop(1, 'rgba(255,120,40,0)');
      c.globalAlpha = k;
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = g;
      c.fillRect(r.x - r.r, r.y - r.r, r.r * 2, r.r * 2);
      c.globalCompositeOperation = 'source-over';
      continue;
    }
    c.globalAlpha = k * 0.8;
    c.lineWidth = 1 + 3 * k;
    c.strokeStyle = r.color;
    c.beginPath();
    c.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    c.stroke();
  }
}

function drawParticles(c: Ctx, fx: Fx): void {
  // Smoke first (normal blend), then fire and sparks additively on top.
  for (const q of fx.particles) {
    if (q.kind !== 2) continue;
    const k = q.life / q.max;
    c.globalAlpha = Math.max(0, k * 0.4);
    c.fillStyle = q.color;
    c.beginPath();
    c.arc(q.x, q.y, q.size * (1.6 - k * 0.6), 0, Math.PI * 2);
    c.fill();
  }
  c.globalCompositeOperation = 'lighter';
  for (const q of fx.particles) {
    if (q.kind === 2) continue;
    const k = Math.max(0, q.life / q.max);
    c.globalAlpha = k;
    if (q.kind === 1) {
      c.strokeStyle = q.color;
      c.lineWidth = 1.6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(q.x, q.y);
      c.lineTo(q.x - q.vx * 0.045, q.y - q.vy * 0.045);
      c.stroke();
    } else {
      c.fillStyle = q.color;
      c.beginPath();
      c.arc(q.x, q.y, (q.size / 2 + 0.4) * (0.6 + k * 0.6), 0, Math.PI * 2);
      c.fill();
    }
  }
  c.globalCompositeOperation = 'source-over';
}

export function drawFxLayer(c: Ctx, fx: Fx): void {
  drawRings(c, fx);
  drawParticles(c, fx);
  c.globalAlpha = 1;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  for (const q of fx.popups) {
    c.globalAlpha = Math.max(0, Math.min(1, (q.life / q.max) * 1.6));
    c.font = `bold ${q.big ? 20 : 14}px system-ui, sans-serif`;
    c.lineWidth = 4;
    c.strokeStyle = '#06182f';
    c.strokeText(q.text, q.x, q.y);
    c.fillStyle = q.big ? '#ffd25a' : '#ffffff';
    c.fillText(q.text, q.x, q.y);
  }
  c.globalAlpha = 1;
}
