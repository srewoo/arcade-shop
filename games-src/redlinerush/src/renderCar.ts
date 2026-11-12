// Vehicle and pickup drawing. Traffic, the player body, pickups and the headlight beam are painted once
// into cached sprites (carPaint.ts does the artwork); per frame we only blit them and add live details.
import { bodyShell, headLamps, sedanTop, shades, tailLamps, taxiSign, truckTop, tyres, vanTop, type Shades } from './carPaint';
import { PALETTE } from './palette';
import type { Car, Pickup } from './simTypes';

const RES = 4;
const PAD = 26;
const cache = new Map<string, HTMLCanvasElement>();

function bake(key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = Math.ceil((w + PAD * 2) * RES);
  c.height = Math.ceil((h + PAD * 2) * RES);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.scale(RES, RES);
  g.translate(w / 2 + PAD, h / 2 + PAD);
  paint(g);
  cache.set(key, c);
  return c;
}

const blit = (g: CanvasRenderingContext2D, c: HTMLCanvasElement, w: number, h: number): void =>
  g.drawImage(c, -w / 2 - PAD, -h / 2 - PAD, w + PAD * 2, h + PAD * 2);

function tailGlow(g: CanvasRenderingContext2D, w: number, h: number): void {
  const r = g.createRadialGradient(0, h / 2 + 2, 2, 0, h / 2 + 2, 24);
  r.addColorStop(0, 'rgba(255,77,61,0.4)');
  r.addColorStop(1, 'rgba(255,77,61,0)');
  g.fillStyle = r;
  g.fillRect(-w, h / 2 - 20, w * 2, 46);
}

function paintTraffic(g: CanvasRenderingContext2D, car: Car, w: number, h: number, taxi: boolean): void {
  const c: Shades = taxi ? shades(46, 100, 56) : shades(car.hue, PALETTE.trafficSat, PALETTE.trafficLightness - 2);
  tailGlow(g, w, h);
  tyres(g, w, car.kind === 'truck' ? [-h * 0.36, h * 0.18, h * 0.36] : [-h * 0.3, h * 0.3]);
  bodyShell(g, w, h, c, 9);
  if (car.kind === 'truck') truckTop(g, w, h, c);
  else if (car.kind === 'van') vanTop(g, w, h, c);
  else sedanTop(g, w, h, c);
  if (taxi) taxiSign(g, h);
  headLamps(g, w, h);
  tailLamps(g, w, h);
}

/** Traffic: sedan (every 5th is a taxi), van or truck. Centred at the origin. */
export function drawTraffic(g: CanvasRenderingContext2D, car: Car, w: number, h: number): void {
  const taxi = car.kind === 'sedan' && car.id % 5 === 0;
  const key = `${car.kind}|${taxi ? 'taxi' : car.hue}|${Math.round(h)}`;
  blit(g, bake(key, w, h, (p) => paintTraffic(p, car, w, h, taxi)), w, h);
}

function paintPlayer(g: CanvasRenderingContext2D, w: number, h: number): void {
  const c = shades(5, 100, 60);
  const hw = w / 2;
  tyres(g, w + 2, [-h * 0.3, h * 0.3]);
  bodyShell(g, w, h, c, 9);
  g.fillStyle = PALETTE.playerStripe;
  for (const x of [-4.4, 1.8]) g.fillRect(x, -h / 2 + 1.5, 2.6, h - 3);
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (const x of [-1.8, 4.4]) g.fillRect(x, -h / 2 + 1.5, 0.7, h - 3);
  sedanTop(g, w, h, c);
  g.fillStyle = PALETTE.playerStripe;
  for (const x of [-4.4, 1.8]) g.fillRect(x, -h * 0.06, 2.6, h * 0.23);
  // Rear wing with end plates, and front splitter.
  g.fillStyle = '#12161c';
  g.fillRect(-hw - 2.5, h / 2 - 6, 2, 7);
  g.fillRect(hw + 0.5, h / 2 - 6, 2, 7);
  const wing = g.createLinearGradient(0, h / 2 - 6, 0, h / 2 - 1);
  wing.addColorStop(0, '#2b323c');
  wing.addColorStop(1, '#0c0f14');
  g.fillStyle = wing;
  g.fillRect(-hw - 2.5, h / 2 - 6, w + 5, 4.4);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.fillRect(-hw - 2, h / 2 - 5.8, w + 4, 0.8);
  g.fillStyle = '#12161c';
  g.fillRect(-hw + 2, -h / 2 - 1.2, w - 4, 1.8);
  headLamps(g, w, h);
  tailLamps(g, w, h - 4);
}

const BEAM_LEN = 150;
let beamSprite: HTMLCanvasElement | null = null;

/** Two soft headlight cones, baked once into their own (taller) sprite. Origin = car centre. */
function beam(w: number): HTMLCanvasElement {
  if (beamSprite) return beamSprite;
  const bw = w + 80;
  const c = document.createElement('canvas');
  c.width = bw * 2;
  c.height = (BEAM_LEN + 10) * 2;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.scale(2, 2);
  g.translate(bw / 2, BEAM_LEN + 6);
  const grad = g.createLinearGradient(0, 0, 0, -BEAM_LEN);
  grad.addColorStop(0, 'rgba(255,244,190,0.30)');
  grad.addColorStop(1, 'rgba(255,244,190,0)');
  g.fillStyle = grad;
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 6.5);
    g.beginPath();
    g.moveTo(x - 3, 0);
    g.lineTo(x + 3, 0);
    g.lineTo(x + s * 16 + 17, -BEAM_LEN);
    g.lineTo(x + s * 16 - 17, -BEAM_LEN);
    g.closePath();
    g.fill();
  }
  beamSprite = c;
  return c;
}

function boostFlame(g: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const len = 24 + Math.sin(t * 40) * 5;
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 8);
    g.fillStyle = 'rgba(38,215,255,0.55)';
    g.beginPath();
    g.moveTo(x - 4, h / 2 - 1);
    g.quadraticCurveTo(x - 1, h / 2 + len * 0.6, x, h / 2 + len);
    g.quadraticCurveTo(x + 1, h / 2 + len * 0.6, x + 4, h / 2 - 1);
    g.fill();
    g.fillStyle = '#e6fbff';
    g.beginPath();
    g.moveTo(x - 2, h / 2 - 1);
    g.lineTo(x, h / 2 + len * 0.55);
    g.lineTo(x + 2, h / 2 - 1);
    g.fill();
  }
  g.fillStyle = 'rgba(38,215,255,0.18)';
  g.beginPath();
  g.ellipse(0, h / 2 + 8, w * 0.7, 20, 0, 0, 7);
  g.fill();
}

export interface PlayerLook { w: number; h: number; blink: boolean; boost: boolean; assist: boolean; time: number }

export function drawPlayer(g: CanvasRenderingContext2D, look: PlayerLook): void {
  const { w, h } = look;
  if (look.boost) boostFlame(g, w, h, look.time);
  if (look.blink) g.globalAlpha = 0.45;
  g.drawImage(beam(w), -w / 2 - 40, -h / 2 + 2 - BEAM_LEN - 6, w + 80, BEAM_LEN + 10);
  blit(g, bake('player', w, h, (p) => paintPlayer(p, w, h)), w, h);
  if (look.assist) {
    g.strokeStyle = PALETTE.text;
    g.lineWidth = 2;
    g.setLineDash([4, 3]);
    g.beginPath();
    g.roundRect(-w / 2 - 6, -h / 2 - 5, w + 12, h + 10, 9);
    g.stroke();
    g.setLineDash([]);
  }
  g.globalAlpha = 1;
}

function paintPickup(g: CanvasRenderingContext2D, kind: 'fuel' | 'boost', assist: boolean): void {
  const col = kind === 'fuel' ? PALETTE.fuel : PALETTE.boost;
  const halo = g.createRadialGradient(0, 0, 8, 0, 0, 26);
  halo.addColorStop(0, kind === 'fuel' ? 'rgba(255,184,0,0.45)' : 'rgba(38,215,255,0.45)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = halo;
  g.fillRect(-26, -26, 52, 52);
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.5)';
  g.shadowBlur = 8;
  g.shadowOffsetY = 3;
  g.beginPath();
  if (kind === 'fuel') g.arc(0, 0, 15, 0, 7);
  else for (let i = 0; i < 6; i++) g.lineTo(Math.cos((i * Math.PI) / 3) * 17, Math.sin((i * Math.PI) / 3) * 17);
  g.closePath();
  g.fillStyle = col;
  g.fill();
  g.restore();
  const shine = g.createLinearGradient(-12, -14, 12, 14);
  shine.addColorStop(0, 'rgba(255,255,255,0.65)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0)');
  shine.addColorStop(1, 'rgba(0,0,0,0.3)');
  g.fillStyle = shine;
  g.fill();
  g.strokeStyle = PALETTE.ink;
  g.lineWidth = assist ? 4 : 2.5;
  g.stroke();
  g.fillStyle = PALETTE.ink;
  g.beginPath();
  if (kind === 'fuel') { g.moveTo(0, -9); g.quadraticCurveTo(8, 2, 0, 8); g.quadraticCurveTo(-8, 2, 0, -9); }
  else { g.moveTo(3, -10); g.lineTo(-6, 2); g.lineTo(-1, 2); g.lineTo(-3, 10); g.lineTo(6, -3); g.lineTo(1, -3); }
  g.fill();
}

export function drawPickup(g: CanvasRenderingContext2D, p: Pickup, assist: boolean, time: number): void {
  const pulse = 1 + Math.sin(time * 6 + p.id) * 0.06;
  const key = `pickup|${p.kind}|${assist}`;
  const c = bake(key, 0, 0, (q) => paintPickup(q, p.kind, assist));
  const s = 52 * pulse;
  g.drawImage(c, -s / 2, -s / 2, s, s);
  g.strokeStyle = 'rgba(255,255,255,0.7)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(0, 0, 20 * pulse, time * 2 + p.id, time * 2 + p.id + 1.3);
  g.stroke();
  if (assist) {
    g.font = 'bold 13px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillStyle = PALETTE.text;
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 3;
    const label = p.kind === 'fuel' ? 'FUEL' : 'BOOST';
    g.strokeText(label, 0, 32);
    g.fillText(label, 0, 32);
  }
}
