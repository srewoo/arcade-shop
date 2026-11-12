// Road surface (pre-rendered tile), edge lines, rumble strips, lane marks, speed streaks and vignette.
import { CONFIG } from './config';
import { PALETTE } from './palette';
import { drawGround, drawScenery } from './renderScenery';
import { ROAD_TILE_W, TILE_H, VERGE, getRoadTile, hash } from './renderTextures';
import { ROAD_W, view as V } from './viewport';

function drawAsphalt(g: CanvasRenderingContext2D, zi: number): void {
  const tile = getRoadTile();
  const x = V.roadLeft - VERGE;
  const off = (zi * V.pxPerU) % TILE_H;
  for (let y = off - TILE_H; y < V.height; y += TILE_H) g.drawImage(tile, x, y, ROAD_TILE_W, TILE_H);
}

function drawEdges(g: CanvasRenderingContext2D, zi: number): void {
  const L = V.roadLeft;
  const period = 30;
  const off = (zi * V.pxPerU) % (period * 2);
  for (const x of [L - 10, L + ROAD_W + 3]) {
    for (let y = -period * 2 + off; y < V.height; y += period * 2) {
      g.fillStyle = PALETTE.rumbleB;
      g.fillRect(x, y, 7, period);
      g.fillStyle = PALETTE.rumbleA;
      g.fillRect(x, y + period, 7, period);
      // Kerb top highlight and shaded outer face give the strip height.
      g.fillStyle = 'rgba(255,255,255,0.28)';
      g.fillRect(x, y, 2, period * 2);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(x + 5, y, 2, period * 2);
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(L - 12, 0, 2, V.height);
  g.fillRect(L + ROAD_W + 10, 0, 2, V.height);
  g.fillStyle = PALETTE.roadEdge;
  g.fillRect(L - 3, 0, 3, V.height);
  g.fillRect(L + ROAD_W, 0, 3, V.height);
}

function drawDashes(g: CanvasRenderingContext2D, zi: number): void {
  const period = 72;
  const dOff = (zi * V.pxPerU) % period;
  for (let l = 1; l < CONFIG.lanes; l++) {
    const x = V.roadLeft + l * V.laneW;
    for (let y = -period + dOff; y < V.height; y += period) {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(x - 2.5, y + 1.5, 5, 34);
      g.fillStyle = PALETTE.dash;
      g.fillRect(x - 1.5, y, 3, 34);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(x - 1.5, y, 3, 3);
    }
  }
}

export function drawRoad(g: CanvasRenderingContext2D, zi: number, parallax: boolean): void {
  drawGround(g, zi);
  drawAsphalt(g, zi);
  drawEdges(g, zi);
  drawDashes(g, zi);
  drawScenery(g, zi, parallax);
}

/** Streaks grow with speed; boost turns them cyan. Skipped under Reduce motion by the caller. */
export function drawSpeedLines(g: CanvasRenderingContext2D, speed: number, zi: number, boost: boolean): void {
  const start = CONFIG.fx.speedLineSpeed - 14;
  if (speed < start) return;
  const k = Math.min(1, (speed - start) / 24);
  g.lineCap = 'round';
  g.strokeStyle = boost ? `rgba(38,215,255,${0.25 + k * 0.4})` : `rgba(255,255,255,${0.1 + k * 0.28})`;
  const len = 18 + k * 90;
  const n = 10 + Math.round(k * 16);
  for (let i = 0; i < n; i++) {
    const y = ((i * 97 + zi * V.pxPerU * 1.6) % (V.height + 140)) - 70;
    const spread = hash(i + 33);
    const outside = spread * Math.max(40, V.roadLeft - 20);
    const x = i % 2 === 0 ? V.roadLeft - 16 - outside : V.roadLeft + ROAD_W + 16 + outside;
    g.lineWidth = 1.5 + hash(i + 8) * 1.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y + len);
    g.stroke();
  }
  g.lineCap = 'butt';
}

let vig: CanvasGradient | null = null;
let vigKey = '';

/** Edge darkening; the gradient is cached per canvas size. */
export function drawVignette(g: CanvasRenderingContext2D, speed: number, reduce: boolean): void {
  const k = reduce ? 0 : Math.min(1, Math.max(0, (speed - 20) / 36));
  const key = `${V.width}x${V.height}`;
  if (!vig || key !== vigKey) {
    vigKey = key;
    vig = g.createRadialGradient(V.width / 2, V.height * 0.62, Math.min(V.width, V.height) * 0.35, V.width / 2, V.height * 0.62, Math.max(V.width, V.height) * 0.78);
    vig.addColorStop(0, 'rgba(4,8,14,0)');
    vig.addColorStop(1, 'rgba(4,8,14,1)');
  }
  g.globalAlpha = 0.35 + k * 0.3;
  g.fillStyle = vig;
  g.fillRect(0, 0, V.width, V.height);
  g.globalAlpha = 1;
}
