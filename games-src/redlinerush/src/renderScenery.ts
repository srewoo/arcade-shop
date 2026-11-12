// Roadside scenery across the full (wide) view: mown grass, two parallax layers of pre-rendered
// trees, shrubs, guard rail with shaded posts and lamp posts that pool light on the asphalt.
import { GRASS_TILE_W, TILE_H, getGrassTile, glowSprite, hash, treeSprite } from './renderTextures';
import { ROAD_W, view as V } from './viewport';

const SPACING = 22;

export function drawGround(g: CanvasRenderingContext2D, zi: number): void {
  const tile = getGrassTile();
  const off = (zi * V.pxPerU) % TILE_H;
  for (let y = off - TILE_H; y < V.height; y += TILE_H) {
    for (let x = 0; x < V.width; x += GRASS_TILE_W) g.drawImage(tile, x, y, GRASS_TILE_W, TILE_H);
  }
}

function shrub(g: CanvasRenderingContext2D, x: number, y: number, r: number, h: number): void {
  g.fillStyle = 'rgba(2,8,6,0.35)';
  g.beginPath();
  g.ellipse(x + r * 0.35, y + r * 0.45, r, r * 0.8, 0, 0, 7);
  g.fill();
  const rg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, 1, x, y, r);
  rg.addColorStop(0, h > 0.5 ? '#5aa65a' : '#4f9a58');
  rg.addColorStop(1, '#1d5230');
  g.fillStyle = rg;
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fill();
  if (h > 0.82) {
    g.fillStyle = '#ffd3e0';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x - r * 0.4 + i * r * 0.28, y - r * 0.2 + (i % 2) * r * 0.3, 1.4, 0, 7); g.fill(); }
  }
}

function placeSide(g: CanvasRenderingContext2D, i: number, y: number, layer: number, side: number, left: number, right: number): void {
  const h = hash(i * 4 + side * 2 + layer);
  if (h < 0.3) return;
  const room = side === 0 ? left : V.width - right;
  const dx = 12 + hash(i * 7 + side + layer * 3) * Math.max(10, room - 24);
  const x = side === 0 ? left - dx : right + dx;
  if (h > 0.88 && dx < 40) { shrub(g, x, y, 6 + h * 4, h); return; }
  const r = (layer === 0 ? 11 : 17) + h * (layer === 0 ? 6 : 12);
  const k = r * 3;
  g.drawImage(treeSprite(Math.floor(hash(i * 13 + side * 5 + layer) * 6)), x - k / 2, y - k / 2, k, k);
}

/** Far trees are smaller, scroll slower (parallax) and are dimmed by haze. */
function drawTrees(g: CanvasRenderingContext2D, zi: number, parallax: boolean): void {
  const left = V.roadLeft - 56;
  const right = V.roadLeft + ROAD_W + 56;
  for (const layer of [0, 1]) {
    const zs = zi * (layer === 0 && parallax ? 0.7 : 1);
    const first = Math.floor((zs - (V.height - V.playerY) / V.pxPerU) / SPACING) - 1;
    const last = Math.ceil((zs + V.playerY / V.pxPerU) / SPACING) + 1;
    g.globalAlpha = layer === 0 ? 0.82 : 1;
    for (let i = first; i <= last; i++) {
      const y = V.playerY - (i * SPACING - zs) * V.pxPerU;
      placeSide(g, i, y, layer, 0, left, right);
      placeSide(g, i, y, layer, 1, left, right);
    }
  }
  g.globalAlpha = 1;
}

function drawRail(g: CanvasRenderingContext2D, zi: number): void {
  const period = 48;
  const off = (zi * V.pxPerU) % period;
  for (const [x, dir] of [[V.roadLeft - 22, -1], [V.roadLeft + ROAD_W + 22, 1]] as const) {
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(x + dir * 2, 0, 4, V.height);
    const beam = g.createLinearGradient(x - 2.5, 0, x + 2.5, 0);
    beam.addColorStop(0, '#e6ebf2');
    beam.addColorStop(0.5, '#9aa5b4');
    beam.addColorStop(1, '#5d6776');
    g.fillStyle = beam;
    g.fillRect(x - 2.5, 0, 5, V.height);
    for (let y = -period + off; y < V.height; y += period) {
      g.fillStyle = '#3b4350';
      g.fillRect(x - 4, y - 1, 8, 8);
      g.fillStyle = '#c7cfda';
      g.fillRect(x - 3, y, 6, 3);
      g.fillStyle = '#ff9a3c';
      g.fillRect(x - 1, y + 4, 2, 2);
    }
  }
}

function drawLamps(g: CanvasRenderingContext2D, zi: number, glow: boolean): void {
  const period = 320;
  const off = (zi * V.pxPerU) % period;
  const sprite = glowSprite();
  for (const [x, dir] of [[V.roadLeft - 34, 1], [V.roadLeft + ROAD_W + 34, -1]] as const) {
    for (let y = -period + off; y < V.height + 40; y += period) {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(x + 4, y + 4, 5, 4, 0, 0, 7);
      g.fill();
      g.strokeStyle = '#2f3742';
      g.lineWidth = 3.5;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + dir * 14, y);
      g.stroke();
      g.fillStyle = '#4a5463';
      g.beginPath();
      g.arc(x, y, 4.5, 0, 7);
      g.fill();
      g.fillStyle = '#fff3c4';
      g.beginPath();
      g.roundRect(x + dir * 14 - 4, y - 3.5, 8, 7, 2);
      g.fill();
      if (glow) {
        g.globalAlpha = 0.9;
        g.drawImage(sprite, x + dir * 14 - 56, y - 56, 112, 112);
        g.globalAlpha = 0.55;
        g.drawImage(sprite, x + dir * 14 + dir * 64 - 70, y - 60, 140, 120);
        g.globalAlpha = 1;
      }
    }
  }
}

export function drawScenery(g: CanvasRenderingContext2D, zi: number, parallax: boolean): void {
  drawTrees(g, zi, parallax);
  drawRail(g, zi);
  drawLamps(g, zi, parallax);
}
