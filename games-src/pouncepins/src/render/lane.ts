// The lane: plank wood with gloss, slab edge, gutters, guide arrows, foul line, pin deck and cushion pits.
import { CONFIG } from '../config';
import { INK, WOOD } from './palette';
import { paintCushions, pillow } from './pillow';
import { quad } from './sceneGeometry';
import type { Camera } from './camera';

export { paintCushions, pillow };

const { lane } = CONFIG;
const X0 = -60;
const PLANKS = 10;
const tone = (i: number): string => `hsl(${34 + ((i * 37) % 5)} ${58 + ((i * 17) % 9)}% ${72 - ((i * 29) % 7)}%)`;

function gutters(c: CanvasRenderingContext2D, cam: Camera): void {
  const gh = lane.gutterHalf, hw = lane.halfWidth;
  for (const s of [-1, 1]) {
    const a = cam.project(0, s * hw), b = cam.project(0, s * gh);
    const g = c.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, '#2f2b36'); g.addColorStop(0.5, '#69626f'); g.addColorStop(1, '#3b3641');
    quad(c, cam, [[X0, s * hw], [lane.endX, s * hw], [lane.endX, s * gh], [X0, s * gh]]);
    c.fillStyle = g; c.fill();
  }
}

function slabEdge(c: CanvasRenderingContext2D, cam: Camera): void {
  const hw = lane.halfWidth;
  const t = cam.portrait ? 0 : Math.max(6, 10 * cam.k);
  c.fillStyle = '#9a6b3c';
  quad(c, cam, [[X0, hw], [lane.backX, hw]]);
  const a = cam.project(X0, hw), b = cam.project(lane.backX, hw);
  c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, b.y + t); c.lineTo(a.x, a.y + t); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
}

function planks(c: CanvasRenderingContext2D, cam: Camera): void {
  const hw = lane.halfWidth, pw = (hw * 2) / PLANKS;
  for (let i = 0; i < PLANKS; i++) {
    quad(c, cam, [[X0, -hw + i * pw], [lane.backX, -hw + i * pw], [lane.backX, -hw + (i + 1) * pw + 0.5], [X0, -hw + (i + 1) * pw + 0.5]]);
    c.fillStyle = tone(i); c.fill();
  }
  const a = cam.project(0, -hw), b = cam.project(0, hw);
  const sh = c.createLinearGradient(a.x, a.y, b.x, b.y);
  sh.addColorStop(0, 'rgba(255,250,230,0.35)'); sh.addColorStop(0.5, 'rgba(255,250,230,0)'); sh.addColorStop(1, 'rgba(90,50,10,0.25)');
  quad(c, cam, [[X0, -hw], [lane.backX, -hw], [lane.backX, hw], [X0, hw]]);
  c.fillStyle = sh; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.strokeStyle = WOOD.line; c.lineWidth = 1; c.globalAlpha = 0.7;
  for (let i = 1; i < PLANKS; i++) { quad(c, cam, [[X0, -hw + i * pw], [lane.backX, -hw + i * pw]]); c.stroke(); }
  c.globalAlpha = 1;
  // plank seams, staggered
  c.strokeStyle = 'rgba(120,70,20,0.3)';
  for (let i = 0; i < PLANKS; i++) {
    for (let x = 90 + ((i * 173) % 260); x < lane.backX; x += 340) quad(c, cam, [[x, -hw + i * pw], [x, -hw + (i + 1) * pw]]), c.stroke();
  }
}

function gloss(c: CanvasRenderingContext2D, cam: Camera): void {
  c.fillStyle = 'rgba(255,255,255,0.07)';
  for (let x = 120; x < lane.backX; x += 300) {
    quad(c, cam, [[x, -lane.halfWidth * 0.85], [x + 120, -lane.halfWidth * 0.85], [x + 90, -lane.halfWidth * 0.25], [x - 30, -lane.halfWidth * 0.25]]); c.fill();
  }
}

export function paintLane(c: CanvasRenderingContext2D, cam: Camera): void {
  c.lineJoin = 'round';
  quad(c, cam, [[X0, -lane.gutterHalf], [lane.endX, -lane.gutterHalf], [lane.endX, lane.gutterHalf], [X0, lane.gutterHalf]]);
  c.fillStyle = '#5b5560'; c.fill();
  gutters(c, cam);
  slabEdge(c, cam);
  planks(c, cam);
  gloss(c, cam);
  paintDeck(c, cam);
  paintMarks(c, cam);
}

function paintDeck(c: CanvasRenderingContext2D, cam: Camera): void {
  const x1 = lane.pinX - 70, hw = lane.halfWidth;
  quad(c, cam, [[x1, -hw], [lane.backX, -hw], [lane.backX, hw], [x1, hw]]);
  c.fillStyle = 'rgba(122, 78, 40, 0.22)'; c.fill();
  c.strokeStyle = 'rgba(43,36,32,0.35)'; c.lineWidth = 2; c.setLineDash([6, 6]);
  quad(c, cam, [[x1, -hw], [x1, hw]]); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(43,36,32,0.3)';
  const spots: readonly (readonly [number, number])[] = [[0, 0], [38, -23], [38, 23], [76, -46], [76, 0], [76, 46], [114, -69], [114, -23], [114, 23], [114, 69]];
  for (const [dx, dy] of spots) {
    const p = cam.project(lane.pinX + dx, dy);
    c.beginPath(); c.ellipse(p.x, p.y, 4 * cam.k, 2.4 * cam.k, 0, 0, 7); c.fill();
  }
}

function paintMarks(c: CanvasRenderingContext2D, cam: Camera): void {
  c.save();
  c.shadowColor = 'rgba(216,53,42,0.7)'; c.shadowBlur = 8;
  c.fillStyle = '#d8352a';
  quad(c, cam, [[-4, -lane.halfWidth], [4, -lane.halfWidth], [4, lane.halfWidth], [-4, lane.halfWidth]]); c.fill();
  c.restore();
  for (let i = -2; i <= 2; i++) {
    const y = i * 45, x = 400 + Math.abs(i) * -22;
    quad(c, cam, [[x - 22, y - 9], [x + 22, y], [x - 22, y + 9]]);
    c.fillStyle = 'rgba(43,36,32,0.6)'; c.fill();
    c.strokeStyle = 'rgba(255,240,200,0.4)'; c.lineWidth = 1; c.stroke();
  }
}
