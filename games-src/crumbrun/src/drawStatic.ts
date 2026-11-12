// Static kitchen layer: floor tiles, cabinet/counter walls, basket, mouse-holes.
import { TILE } from './layout';
import { cellAt } from './maze';
import type { Maze } from './maze';
import { counterTop, cabinetFace, floorDetail } from './drawDecor';
import { drawProps } from './drawProps';
import type { Theme } from './theme';

type Ctx = CanvasRenderingContext2D;

function floorTile(ctx: Ctx, th: Theme, col: number, row: number): void {
  const x = col * TILE;
  const y = row * TILE;
  const alt = (col + row) % 2 === 0;
  ctx.fillStyle = alt ? th.floorA : th.floorB;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = th.grout;
  ctx.lineWidth = 1;
  if (th.style === 'terracotta') {
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    ctx.fillStyle = 'rgba(255,220,180,0.10)';
    ctx.fillRect(x + 2, y + 2, TILE - 6, 2);
  } else if (th.style === 'plank') {
    ctx.beginPath();
    ctx.moveTo(x, y + 0.5);
    ctx.lineTo(x + TILE, y + 0.5);
    ctx.moveTo(x + (row % 2 ? 5 : 12) + 0.5, y);
    ctx.lineTo(x + (row % 2 ? 5 : 12) + 0.5, y + TILE);
    ctx.stroke();
  } else if (th.style === 'checker') {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, y, TILE, 2);
  }
}

function wallTile(ctx: Ctx, m: Maze, th: Theme, col: number, row: number): void {
  const x = col * TILE;
  const y = row * TILE;
  const rich = th.style !== 'flat';
  const below = cellAt(m, col, row + 1) !== 'wall';
  const above = cellAt(m, col, row - 1) !== 'wall';
  ctx.fillStyle = th.wallTop;
  ctx.fillRect(x, y, TILE, TILE);
  if (rich) counterTop(ctx, x, y, th, col, row);
  ctx.fillStyle = th.wallEdge;
  if (above) ctx.fillRect(x, y, TILE, 1);
  if (cellAt(m, col - 1, row) !== 'wall') ctx.fillRect(x, y, 1, TILE);
  if (cellAt(m, col + 1, row) !== 'wall') ctx.fillRect(x + TILE - 1, y, 1, TILE);
  if (below) {
    ctx.fillStyle = th.wallFace;
    ctx.fillRect(x, y + TILE - 7, TILE, 7);
    ctx.fillStyle = th.wallEdge;
    ctx.fillRect(x, y + TILE - 8, TILE, 1);
    ctx.fillRect(x, y + TILE - 1, TILE, 1);
    ctx.fillStyle = th.handle;
    ctx.fillRect(x + TILE / 2 - 3, y + TILE - 5, 6, 2);
    if (rich) cabinetFace(ctx, x, y, th);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y + TILE, TILE, 3);
    }
  }
}

function basketTile(ctx: Ctx, col: number, row: number): void {
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = '#7a5530';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = '#a77b49';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < TILE; i += 6) {
    ctx.moveTo(x, y + i + ((col + row) % 2) * 3);
    ctx.lineTo(x + TILE, y + i + ((col + row) % 2) * 3);
  }
  ctx.stroke();
  const bg = ctx.createLinearGradient(0, y, 0, y + TILE);
  bg.addColorStop(0, 'rgba(255,230,170,0.18)');
  bg.addColorStop(1, 'rgba(30,12,0,0.32)');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, TILE, TILE);
}

function doorTile(ctx: Ctx, col: number, row: number): void {
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = '#5a3d22';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = '#e86a8a';
  ctx.fillRect(x, y + TILE / 2 - 2, TILE, 4);
  ctx.fillStyle = '#ffd1dc';
  ctx.fillRect(x + TILE / 2 - 2, y + TILE / 2 - 4, 4, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x, y + TILE / 2 - 2, TILE, 1);
}

function mouseHole(ctx: Ctx, m: Maze, row: number): void {
  for (const side of [0, 1]) {
    const x = side === 0 ? 0 : (m.cols - 1) * TILE;
    const y = row * TILE;
    const hx = side === 0 ? x : x + TILE;
    const hg = ctx.createRadialGradient(hx, y + TILE / 2, 1, hx, y + TILE / 2, 10);
    hg.addColorStop(0, 'rgba(0,0,0,0.95)');
    hg.addColorStop(1, 'rgba(24,12,6,0.75)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(hx, y + TILE / 2, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b2312';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function drawStaticLayer(ctx: Ctx, m: Maze, th: Theme): void {
  for (let row = 0; row < m.rows; row++) {
    for (let col = 0; col < m.cols; col++) {
      const cell = cellAt(m, col, row);
      if (cell === 'floor') floorTile(ctx, th, col, row);
      else if (cell === 'basket') basketTile(ctx, col, row);
    }
  }
  if (th.style !== 'flat') floorDetail(ctx, m, th);
  for (let row = 0; row < m.rows; row++) {
    for (let col = 0; col < m.cols; col++) {
      const cell = cellAt(m, col, row);
      if (cell === 'wall') wallTile(ctx, m, th, col, row);
      else if (cell === 'door') doorTile(ctx, col, row);
    }
  }
  for (const row of m.tunnelRows) mouseHole(ctx, m, row);
  if (th.style !== 'flat') drawProps(ctx, m);
}
