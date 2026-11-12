// Draws one cartoon office cat. Units are sprite units (cat is ~60 tall, feet at 0).
import { INK, COATS } from './palette';
import { mix } from './tint';
import type { Pose } from './pose';
import type { CatKind } from '../worldTypes';

export interface CatLook {
  readonly kind: CatKind;
  readonly coat: number;
  readonly pose: Pose;
  readonly yowl: boolean;
  readonly assist: boolean;
  readonly time: number;
}

function line(ctx: CanvasRenderingContext2D, pts: readonly (readonly [number, number])[], w = 1.4): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineWidth = w;
  ctx.stroke();
}

function eyes(ctx: CanvasRenderingContext2D, look: CatLook): void {
  const closed = look.pose.name === 'tumble' || look.pose.name === 'cushion' || (look.yowl && look.pose.name === 'landed');
  for (const s of [-1, 1]) {
    if (closed) { line(ctx, [[s * 4.5 - 2.5, -42], [s * 4.5, -40], [s * 4.5 + 2.5, -42]], 1.6); continue; }
    const big = look.kind === 'scaredy' || look.pose.name === 'leap';
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(s * 4.6, -41, big ? 3.9 : 3.2, big ? 4.4 : 3.6, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(s * 4.6 + (look.kind === 'lazy' ? 0 : 0.4), -41 + (look.kind === 'lazy' ? 1 : 0), big ? 1.2 : 1.7, 0, 7); ctx.fill();
    if (look.kind !== 'lazy') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 4.6 - 0.2, -42.1, 0.7, 0, 7); ctx.fill(); }
    if (look.kind === 'lazy') { ctx.fillStyle = COATS[look.coat]?.body ?? '#999'; ctx.fillRect(s * 4.6 - 3.6, -45.2, 7.2, 4.1); line(ctx, [[s * 4.6 - 3.6, -41.1], [s * 4.6 + 3.6, -41.1]], 1.6); }
  }
}

function face(ctx: CanvasRenderingContext2D, look: CatLook): void {
  eyes(ctx, look);
  ctx.fillStyle = 'rgba(240,120,140,0.28)';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 8, -35.6, 2.6, 1.7, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(0.45, -37.2, 0.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#e88a9a';
  ctx.beginPath(); ctx.moveTo(-1.8, -37.6); ctx.lineTo(1.8, -37.6); ctx.lineTo(0, -35.8); ctx.closePath(); ctx.fill();
  const open = look.yowl || look.pose.name === 'tumble' || look.pose.name === 'leap';
  if (open) {
    ctx.fillStyle = '#5b1d27';
    ctx.beginPath(); ctx.ellipse(0, -32.6, 3, 3.4, 0, 0, 7); ctx.fill(); ctx.stroke();
  } else {
    line(ctx, [[-3, -33.5], [-1.5, -32.2], [0, -33.6], [1.5, -32.2], [3, -33.5]], 1.2);
  }
  for (const s of [-1, 1]) {
    line(ctx, [[s * 8, -37], [s * 15, -38.5]], 0.9);
    line(ctx, [[s * 8, -35.5], [s * 15, -35]], 0.9);
  }
}

function accessories(ctx: CanvasRenderingContext2D, look: CatLook): void {
  if (look.kind === 'plain') {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.moveTo(0, -29); ctx.lineTo(-3, -24); ctx.lineTo(0, -12); ctx.lineTo(3, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (look.kind === 'lazy') {
    ctx.fillStyle = INK;
    ctx.font = 'bold 9px system-ui, sans-serif';
    const bob = Math.sin(look.time * 2) * 2;
    ctx.fillText('z', 10, -52 + bob); ctx.fillText('Z', 15, -59 + bob);
  } else {
    ctx.fillStyle = '#7fd0ee';
    ctx.beginPath(); ctx.moveTo(13, -50); ctx.quadraticCurveTo(16, -45, 13, -43); ctx.quadraticCurveTo(10, -45, 13, -50); ctx.fill(); ctx.stroke();
  }
}

function badge(ctx: CanvasRenderingContext2D, kind: CatKind): void {
  if (kind === 'plain') return;
  ctx.fillStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(-14, -57, 6, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = 'bold 8px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(kind === 'lazy' ? 'L' : 'S', -14, -54.2); ctx.textAlign = 'left';
}

interface Shades { readonly body: CanvasGradient; readonly head: CanvasGradient; readonly belly: CanvasGradient }
const shades = new Map<number, Shades>();

function shadesFor(ctx: CanvasRenderingContext2D, idx: number): Shades {
  const hit = shades.get(idx);
  if (hit) return hit;
  const coat = COATS[idx] ?? COATS[0]!;
  const radial = (cx: number, cy: number, r: number, a: string, b: string, c: string): CanvasGradient => {
    const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.08, cx, cy, r);
    g.addColorStop(0, a); g.addColorStop(0.5, b); g.addColorStop(1, c);
    return g;
  };
  const made = {
    body: radial(0, -20, 19, mix(coat.body, 0.28), coat.body, mix(coat.body, -0.22)),
    head: radial(0, -41, 14, mix(coat.body, 0.32), coat.body, mix(coat.body, -0.2)),
    belly: radial(0, -15, 11, '#ffffff', coat.belly, mix(coat.belly, -0.12)),
  };
  shades.set(idx, made);
  return made;
}

function tabby(ctx: CanvasRenderingContext2D, mark: string): void {
  ctx.strokeStyle = mark; ctx.lineWidth = 1.7;
  for (const s of [-1, 1]) for (const y of [-27, -21, -15]) line(ctx, [[s * 11, y], [s * 6.5, y + 1.2]], 1.7);
}

function headMarks(ctx: CanvasRenderingContext2D, idx: number, mark: string): void {
  ctx.save(); ctx.beginPath(); ctx.arc(0, -40, 10.6, 0, 7); ctx.clip();
  ctx.strokeStyle = mark; ctx.fillStyle = mark;
  if (idx === 0 || idx === 4 || idx === 1) { for (const x of [-3, 0, 3]) line(ctx, [[x, -51], [x * 0.7, -46.5]], 1.4); line(ctx, [[-11, -38], [-7, -38.5]], 1.2); line(ctx, [[11, -38], [7, -38.5]], 1.2); }
  else if (idx === 5) { ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(-6, -44, 6, 5, 0, 0, 7); ctx.fill(); }
  else if (idx === 3) { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(6, -46, 5, 4, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}

function ears(ctx: CanvasRenderingContext2D, coat: (typeof COATS)[number], head: CanvasGradient): void {
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7; ctx.fillStyle = head;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(s * 10, -46); ctx.lineTo(s * 9, -58); ctx.lineTo(s * 2, -50); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4a6b4'; ctx.beginPath(); ctx.moveTo(s * 8.5, -47.5); ctx.lineTo(s * 8, -54); ctx.lineTo(s * 4, -49.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(180,70,90,0.35)'; ctx.beginPath(); ctx.moveTo(s * 8.5, -47.5); ctx.lineTo(s * 7.5, -51); ctx.lineTo(s * 6, -48.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = head;
  }
  void coat;
}

function bodyParts(ctx: CanvasRenderingContext2D, look: CatLook, sh: Shades, sit: boolean): void {
  const coat = COATS[look.coat] ?? COATS[0]!;
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7; ctx.fillStyle = sh.body;
  ctx.beginPath(); ctx.ellipse(0, sit ? -13 : -18, sit ? 12 : 11, sit ? 12 : 16, 0, 0, 7); ctx.fill(); ctx.stroke();
  if (look.coat === 0 || look.coat === 4 || look.coat === 1) {
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, sit ? -13 : -18, sit ? 11.4 : 10.4, sit ? 11.4 : 15.4, 0, 0, 7); ctx.clip(); tabby(ctx, coat.mark); ctx.restore();
  }
  ctx.fillStyle = sh.belly; ctx.beginPath(); ctx.ellipse(0, sit ? -12 : -16, 6, sit ? 8 : 10, 0, 0, 7); ctx.fill();
  ctx.fillStyle = sh.body; ctx.strokeStyle = INK;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(s * 6, -1.5, 5, 3, 0, 0, 7); ctx.fill(); ctx.stroke();
    line(ctx, [[s * 6 - 1, -3.5], [s * 6 - 1, -1.2]], 0.8); line(ctx, [[s * 6 + 1.3, -3.5], [s * 6 + 1.3, -1.2]], 0.8);
  }
}

/** Draw at the current transform origin (feet). Caller applies translate/scale/rotate. */
export function drawCatBody(ctx: CanvasRenderingContext2D, look: CatLook): void {
  const coat = COATS[look.coat] ?? COATS[0]!;
  const sh = shadesFor(ctx, look.coat);
  const sit = look.pose.name === 'landed' || look.pose.name === 'cushion';
  const flail = look.pose.name === 'tumble' || look.pose.name === 'leap';
  const tail: readonly (readonly [number, number])[] = [[8, -8], [20, -12], [24, -26], [20, -36]];
  ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  line(ctx, tail, 6.5);
  ctx.strokeStyle = coat.body; line(ctx, tail, 3.6);
  ctx.strokeStyle = coat.mark; line(ctx, [[24, -26], [20, -36]], 3.6); line(ctx, [[17, -11], [19, -14]], 3.6);
  bodyParts(ctx, look, sh, sit);
  if (flail) { ctx.strokeStyle = INK; for (const s of [-1, 1]) line(ctx, [[s * 9, -24], [s * 17, -34 + Math.sin(look.time * 30 + s) * 3]], 3.4); }
  accessories(ctx, look);
  ears(ctx, coat, sh.head);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7; ctx.fillStyle = sh.head;
  ctx.beginPath(); ctx.arc(0, -40, 11, 0, 7); ctx.fill(); ctx.stroke();
  headMarks(ctx, look.coat, coat.mark);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(0, -40, 9.6, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  face(ctx, look);
  if (look.assist) badge(ctx, look.kind);
}
