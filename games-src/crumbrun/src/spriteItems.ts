// Crumbs, sugar cubes, water pistols, cheese. Small procedural icons.
type Ctx = CanvasRenderingContext2D;

export function drawCrumb(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = 'rgba(255,224,150,0.22)'; // soft halo so the main collectible reads against the floor
  ctx.beginPath();
  ctx.arc(x, y, 4.2, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - 0.8, y - 0.9, 0.2, x, y, 2.9);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#fff0c0');
  g.addColorStop(1, '#d9aa5c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 2.6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSugar(ctx: Ctx, x: number, y: number, t: number): void {
  const pulse = 1 + Math.sin(t * 5 + x) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(-4, -4, 8, 8);
  ctx.fillStyle = '#e1d6c2';
  ctx.fillRect(-4, 2, 8, 2);
  ctx.fillRect(2, -4, 2, 8);
  const sg = ctx.createLinearGradient(-4, -4, 4, 4);
  sg.addColorStop(0, 'rgba(255,255,255,0.7)');
  sg.addColorStop(1, 'rgba(160,140,110,0.25)');
  ctx.fillStyle = sg;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.strokeStyle = 'rgba(90,70,40,0.55)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-3.6, -3.6, 7.2, 7.2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3, -3, 3, 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 0.8;
  const s = (Math.sin(t * 4 + y) + 1) * 1.2;
  ctx.beginPath();
  ctx.moveTo(5, -5 - s);
  ctx.lineTo(5, -5 + s);
  ctx.moveTo(5 - s, -5);
  ctx.lineTo(5 + s, -5);
  ctx.stroke();
  ctx.restore();
}

/** Water pistol with a white halo (not colour-only). `hint` adds an expanding ring to guide first-timers. */
export function drawPistol(ctx: Ctx, x: number, y: number, t: number, hint = false): void {
  const glow = 0.35 + (Math.sin(t * 6 + x) + 1) * 0.2;
  const hg = ctx.createRadialGradient(x, y, 1, x, y, 10);
  hg.addColorStop(0, `rgba(190,232,255,${glow + 0.25})`);
  hg.addColorStop(1, `rgba(120,200,255,${glow * 0.6})`);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  if (hint) {
    const k = (t * 1.6) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8 + k * 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#2f8fe0';
  ctx.fillRect(x - 6, y - 3, 10, 5);
  ctx.fillStyle = '#9fd4ff';
  ctx.fillRect(x - 6, y - 3, 10, 1.5);
  ctx.fillStyle = '#1d5fa8';
  ctx.fillRect(x - 3, y + 2, 3, 5);
  ctx.fillStyle = '#d8f0ff';
  ctx.fillRect(x + 4, y - 2, 3, 2);
  ctx.fillStyle = '#ff7a59';
  ctx.fillRect(x - 6, y - 5, 4, 2);
}

export function drawCheese(ctx: Ctx, x: number, y: number, left: number, calm = false): void {
  if (!calm && left < 2.5 && Math.floor(left * 6) % 2 === 0) return; // expiry flicker (off in reduced motion)
  ctx.fillStyle = 'rgba(255,220,100,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  const cg = ctx.createLinearGradient(x, y - 5, x, y + 4);
  cg.addColorStop(0, '#ffe27a');
  cg.addColorStop(1, '#f2b937');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(x - 7, y + 4);
  ctx.lineTo(x + 7, y + 4);
  ctx.lineTo(x + 7, y - 1);
  ctx.lineTo(x - 7, y - 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e0a82a';
  ctx.fillRect(x - 7, y + 2, 14, 2);
  ctx.fillStyle = '#c98f1d';
  for (const [dx, dy, r] of [[-2, 0, 1.4], [3, 1, 1.1], [-5, 2, 0.9]] as const) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
