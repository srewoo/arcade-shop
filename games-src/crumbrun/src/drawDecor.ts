// Extra kitchen detail painted over the base tiles: ambient shadow cast by the counters onto the floor,
// tile bevels and speckle, wood grain on counter tops and recessed cabinet doors. Skipped in high contrast.
import { TILE } from './layout';
import { cellAt } from './maze';
import type { Maze } from './maze';
import type { Theme } from './theme';

type Ctx = CanvasRenderingContext2D;

const hash = (c: number, r: number): number => {
  const n = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

function shadowStrip(ctx: Ctx, x: number, y: number, w: number, h: number, vertical: boolean, flip: boolean): void {
  const g = vertical
    ? ctx.createLinearGradient(0, flip ? y + h : y, 0, flip ? y : y + h)
    : ctx.createLinearGradient(flip ? x + w : x, 0, flip ? x : x + w, 0);
  g.addColorStop(0, 'rgba(10,4,6,0.42)');
  g.addColorStop(1, 'rgba(10,4,6,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

export function floorDetail(ctx: Ctx, m: Maze, th: Theme): void {
  for (let row = 0; row < m.rows; row++) {
    for (let col = 0; col < m.cols; col++) {
      if (cellAt(m, col, row) === 'wall') continue;
      const x = col * TILE;
      const y = row * TILE;
      const wallN = cellAt(m, col, row - 1) === 'wall';
      if (wallN) shadowStrip(ctx, x, y, TILE, 7, true, false);
      if (cellAt(m, col - 1, row) === 'wall') shadowStrip(ctx, x, y, 4, TILE, false, false);
      if (cellAt(m, col + 1, row) === 'wall') shadowStrip(ctx, x + TILE - 4, y, 4, TILE, false, true);
      // Glaze highlight in the top-left corner and a faint speckle so tiles don't look flat.
      ctx.fillStyle = 'rgba(255,240,220,0.05)';
      ctx.fillRect(x + 1, y + 1, 5, 1);
      ctx.fillRect(x + 1, y + 1, 1, 5);
      const h = hash(col, row);
      ctx.fillStyle = h > 0.5 ? 'rgba(255,235,205,0.06)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x + 3 + h * 10, y + 4 + hash(row, col) * 9, 1.5, 1.5);
      if (th.style === 'checker' && (col + row) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.025)';
        ctx.fillRect(x, y, TILE, TILE / 2);
      }
    }
  }
}

/** Counter top: lit surface with a soft front lip, wood grain and a bright edge line. */
export function counterTop(ctx: Ctx, x: number, y: number, th: Theme, col: number, row: number): void {
  const g = ctx.createLinearGradient(0, y, 0, y + TILE);
  g.addColorStop(0, 'rgba(255,255,255,0.20)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(60,30,10,0.14)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = th.wallEdge;
  ctx.globalAlpha = 0.14;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const gy = y + 3 + i * 5 + hash(col, row + i) * 2;
    ctx.moveTo(x + 1, gy);
    ctx.bezierCurveTo(x + 6, gy - 1.2, x + 12, gy + 1.2, x + TILE - 1, gy);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Cabinet door below a counter tile: recessed panel, inner highlight, brushed pull. */
export function cabinetFace(ctx: Ctx, x: number, y: number, th: Theme): void {
  const fy = y + TILE - 7;
  const g = ctx.createLinearGradient(0, fy, 0, fy + 7);
  g.addColorStop(0, 'rgba(0,0,0,0.22)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.10)');
  g.addColorStop(1, 'rgba(0,0,0,0.20)');
  ctx.fillStyle = g;
  ctx.fillRect(x, fy, TILE, 7);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 2.5, fy + 1.5, TILE - 5, 4);
  const hg = ctx.createLinearGradient(0, fy + 2, 0, fy + 4);
  hg.addColorStop(0, '#f6ead0');
  hg.addColorStop(1, th.handle);
  ctx.fillStyle = hg;
  ctx.fillRect(x + TILE / 2 - 3.5, fy + 2.2, 7, 2.2);
  const shadow = ctx.createLinearGradient(0, y + TILE, 0, y + TILE + 9);
  shadow.addColorStop(0, 'rgba(0,0,0,0.38)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(x, y + TILE, TILE, 9);
}
