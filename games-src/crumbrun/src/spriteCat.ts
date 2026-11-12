// The four cats, drawn top-down. Drenched cats go blue, drip and carry a droplet icon;
// splashed cats are just a pair of eyes and a ripple on their way home.
import { BOLD_OUTLINE, NORMAL_OUTLINE, paint } from './spriteOutline';
import type { Outline } from './spriteOutline';
import { drawCatBadges } from './spriteCatBadges';
import type { CatKind, Dir } from './types';

type Ctx = CanvasRenderingContext2D;

interface Fur {
  readonly body: string;
  readonly dark: string;
  readonly eye: string;
}

const FUR: Readonly<Record<CatKind, Fur>> = {
  smudge: { body: '#2b2b35', dark: '#1a1a22', eye: '#ffd84a' },
  biscuit: { body: '#f0dcae', dark: '#d2b982', eye: '#4f9a4a' },
  tuxedo: { body: '#23232c', dark: '#15151b', eye: '#9be39b' },
  ginger: { body: '#e98a3b', dark: '#c4631c', eye: '#fff2a0' },
};

export interface CatLook {
  readonly kind: CatKind;
  readonly dir: Dir;
  readonly time: number;
  readonly drenched: boolean;
  readonly wearingOff: boolean; // blink back toward normal fur
  readonly pouncing: boolean;
  readonly windup?: boolean; // frozen, ears flat, eyes wide
  readonly grooming?: boolean; // resting: sits and licks a paw
  readonly returning: boolean;
  readonly bob: number; // sitting in the basket
  readonly calm: boolean;
  readonly assist?: boolean; // colour-blind assist: letter badge + wavy drench ring
  readonly bold?: boolean; // high contrast: thicker outline
}

function angleOf(d: Dir): number {
  if (d === 'D') return Math.PI / 2;
  if (d === 'L') return Math.PI;
  if (d === 'U') return -Math.PI / 2;
  return 0;
}

const mixCache = new Map<string, string>();

/** Blend two #rrggbb colours; results are cached so the render loop never re-parses hex. */
export function mix(a: string, b: string, t: number): string {
  const key = `${a}|${b}|${t}`;
  const hit = mixCache.get(key);
  if (hit) return hit;
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + ((pb[i] as number) - v) * t));
  const out = `rgb(${c[0]},${c[1]},${c[2]})`;
  mixCache.set(key, out);
  return out;
}

function earPath(ctx: Ctx, side: number, flat: boolean): void {
  ctx.beginPath();
  if (flat) {
    ctx.moveTo(4, side * 3);
    ctx.lineTo(5.5, side * 9.5);
    ctx.lineTo(8, side * 2.5);
  } else {
    ctx.moveTo(4, side * 3);
    ctx.lineTo(9, side * 8);
    ctx.lineTo(8.5, side * 1.5);
  }
  ctx.closePath();
}

function ears(ctx: Ctx, color: string, inner: string, flat: boolean, o: Outline): void {
  for (const side of [-1, 1]) {
    paint(ctx, color, () => earPath(ctx, side, flat), o);
    ctx.fillStyle = inner;
    ctx.beginPath();
    if (flat) {
      ctx.moveTo(5, side * 3.8);
      ctx.lineTo(5.8, side * 7.4);
      ctx.lineTo(7.2, side * 3);
    } else {
      ctx.moveTo(5.5, side * 3.6);
      ctx.lineTo(8.3, side * 6.4);
      ctx.lineTo(8, side * 2.6);
    }
    ctx.fill();
  }
}

function markings(ctx: Ctx, kind: CatKind, fur: Fur, dark: string): void {
  if (kind === 'tuxedo') {
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath();
    ctx.ellipse(1, 0, 3.4, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'ginger') {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const x of [-5, -1.5, 2]) {
      ctx.moveTo(x, -5);
      ctx.lineTo(x, -2.4);
      ctx.moveTo(x, 5);
      ctx.lineTo(x, 2.4);
    }
    ctx.stroke();
  } else if (kind === 'biscuit') {
    ctx.fillStyle = fur.dark;
    ctx.beginPath();
    ctx.arc(8.4, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function eyes(ctx: Ctx, look: CatLook, fur: Fur, wet: boolean): void {
  const wide = look.windup === true;
  ctx.fillStyle = look.pouncing ? '#ff4a3a' : wet ? '#e8f4ff' : fur.eye;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(8, side * 2.4, wide ? 2.1 : 1.5, look.pouncing ? 1.2 : wide ? 2.6 : 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#111';
  for (const side of [-1, 1]) ctx.fillRect(8.3, side * 2.4 - 0.5, 1, wide ? 1.6 : 1);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const side of [-1, 1]) ctx.fillRect(7.2, side * 2.4 - 1.2, 0.8, 0.8);
}

/** Soft top-light and under-shade across the torso, so the fur reads as a rounded body. */
function sheen(ctx: Ctx, rx: number, ry: number, cx: number): void {
  const g = ctx.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, 'rgba(255,255,255,0.24)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.26)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function body(ctx: Ctx, look: CatLook, o: Outline): void {
  const fur = FUR[look.kind];
  const wet = look.drenched && !look.wearingOff;
  const main = wet ? mix(fur.body, '#4aa8ff', 0.58) : fur.body;
  const dark = wet ? mix(fur.dark, '#2f6fd0', 0.6) : fur.dark;
  const sway = look.grooming ? 0 : Math.sin(look.time * 7) * (look.calm ? 1 : 3);
  const tailPath = (): void => {
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-13, sway, -16, -sway * 1.6);
  };
  ctx.lineCap = 'round';
  tailPath();
  ctx.strokeStyle = '#f6ecd2';
  ctx.lineWidth = 4.6;
  ctx.stroke();
  tailPath();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ears(ctx, main, wet ? '#9fd0ff' : '#f2a4b4', look.windup === true, o);
  const head = (): void => {
    ctx.beginPath();
    ctx.arc(6, 0, 5.8, 0, Math.PI * 2);
  };
  paint(ctx, main, head, o);
  paint(ctx, main, () => {
    ctx.beginPath();
    ctx.ellipse(-2, 0, 9.2, 6.4, 0, 0, Math.PI * 2);
  }, o);
  head();
  ctx.fillStyle = main;
  ctx.fill();
  sheen(ctx, 9.2, 6.4, -2);
  markings(ctx, look.kind, fur, dark);
  eyes(ctx, look, fur, wet);
}

function eyesOnly(ctx: Ctx, time: number): void {
  ctx.strokeStyle = 'rgba(120,200,255,0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 6 + ((time * 14) % 5), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#eaf6ff';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 3, 0, 2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16345a';
    ctx.fillRect(side * 3 - 0.6, -1, 1.2, 2);
    ctx.fillStyle = '#eaf6ff';
  }
}

export function drawCat(ctx: Ctx, px: number, py: number, look: CatLook): void {
  ctx.save();
  ctx.translate(px, py + look.bob);
  if (look.returning) {
    eyesOnly(ctx, look.time);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.rotate(angleOf(look.dir === 'N' ? 'U' : look.dir));
  if (look.pouncing) ctx.scale(1.14, 0.92);
  else if (look.windup) ctx.scale(0.92, 1.06);
  else if (look.grooming) ctx.scale(0.94, 0.94);
  body(ctx, look, look.bold ? BOLD_OUTLINE : NORMAL_OUTLINE);
  ctx.restore();
  drawCatBadges(ctx, look);
  ctx.restore();
}
