// Drawing of the well contents: stacked stones, the falling piece, ghost, danger and game-over marks.
import { feel } from '../config/feel';
import { ghostY } from '../core/actions';
import { HIDDEN, VISIBLE, WIDTH } from '../core/board';
import { cellsOf, shapeIndex } from '../core/shapes';
import type { GameState } from '../core/state';
import type { BoardAnim } from './anim';
import type { Layout } from './layout';
import { stoneOf } from './palette';
import { stoneSprite } from './stones';
import { isDanger } from './view';

export interface BoardOpts {
  ghost: boolean;
  paused: boolean;
  assist: boolean;
  dpr: number;
  tweens: boolean;
  time: number; // seconds, for the danger pulse
  piecePos: { x: number; y: number } | null; // interpolated position of the active piece
}

export class BoardView {
  constructor(private readonly c: CanvasRenderingContext2D) {}

  private px(layout: Layout, dpr: number): number {
    return layout.cell * dpr;
  }

  drawBoard(s: GameState, layout: Layout, anim: BoardAnim, o: BoardOpts): void {
    const { well, cell } = layout;
    const c = this.c;
    for (let r = HIDDEN; r < HIDDEN + VISIBLE; r++) {
      const row = s.board[r] as number[];
      const dy = -anim.rowOffset(r) * cell;
      for (let col = 0; col < WIDTH; col++) {
        const v = row[col] as number;
        if (v === 0) continue;
        c.drawImage(stoneSprite(v, this.px(layout, o.dpr), o.assist), well.x + col * cell, well.y + (r - HIDDEN) * cell + dy, cell, cell);
      }
    }
    for (const g of anim.ghosts()) {
      if (g.row < HIDDEN) continue;
      c.globalAlpha = g.fade;
      const squeeze = 1 - (1 - g.fade) * 0.7;
      g.colors.forEach((v, col) => {
        if (v === 0) return;
        const y = well.y + (g.row - HIDDEN) * cell + (cell * (1 - squeeze)) / 2;
        c.drawImage(stoneSprite(v, this.px(layout, o.dpr), o.assist), well.x + col * cell, y, cell, cell * squeeze);
      });
      c.globalAlpha = 1;
    }
  }

  drawPiece(s: GameState, layout: Layout, o: BoardOpts): void {
    const p = s.piece;
    if (!p) return;
    const { cell, well } = layout;
    const idx = shapeIndex(p.id);
    const sprite = stoneSprite(idx, this.px(layout, o.dpr), o.assist);
    const gy = ghostY(s);
    const pos = o.piecePos ?? { x: p.x, y: p.y };
    const c = this.c;
    for (const [cx, cy] of cellsOf(p.id, p.rot)) {
      if (o.ghost && gy !== p.y && p.y + cy >= HIDDEN - 1) {
        const gx = well.x + (p.x + cx) * cell + 2;
        const gyy = well.y + (gy + cy - HIDDEN) * cell + 2;
        c.fillStyle = stoneOf(idx, o.assist).glow;
        c.globalAlpha = 0.16;
        c.fillRect(gx, gyy, cell - 4, cell - 4);
        c.strokeStyle = '#ffffff';
        c.globalAlpha = 0.85;
        c.lineWidth = 2;
        c.strokeRect(gx, gyy, cell - 4, cell - 4);
        c.globalAlpha = 1;
      }
      const y = pos.y + cy;
      if (y < HIDDEN - 0.99) continue;
      c.drawImage(sprite, well.x + (pos.x + cx) * cell, well.y + (y - HIDDEN) * cell, cell, cell);
    }
  }

  /** Red-tinted vignette plus a dashed line (a cue that is not colour alone) when the stack is high. */
  drawDanger(s: GameState, layout: Layout, o: BoardOpts): void {
    if (!isDanger(s.board)) return;
    const { well, cell } = layout;
    const c = this.c;
    const pulse = o.tweens ? 0.5 + 0.5 * Math.sin(o.time * 6) : 1;
    const h = cell * (feel.dangerRows + 2);
    const g = c.createLinearGradient(0, well.y, 0, well.y + h);
    g.addColorStop(0, `rgba(255,70,70,${0.12 + 0.2 * pulse})`);
    g.addColorStop(1, 'rgba(255,70,70,0)');
    c.fillStyle = g;
    c.fillRect(well.x, well.y, well.w, h);
    c.save();
    c.setLineDash([cell * 0.4, cell * 0.3]);
    c.strokeStyle = 'rgba(255,200,200,0.75)';
    c.lineWidth = Math.max(1.5, cell * 0.07);
    const y = well.y + feel.dangerRows * cell;
    c.beginPath();
    c.moveTo(well.x, y);
    c.lineTo(well.x + well.w, y);
    c.stroke();
    c.restore();
  }

  /** Dim the stack and cross out every stone after a loss. */
  drawGameOver(s: GameState, layout: Layout): void {
    const { well, cell } = layout;
    const c = this.c;
    c.fillStyle = 'rgba(12,4,8,0.5)';
    c.fillRect(well.x, well.y, well.w, well.h);
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = Math.max(1.5, cell * 0.08);
    c.beginPath();
    for (let r = HIDDEN; r < HIDDEN + VISIBLE; r++) {
      const row = s.board[r] as number[];
      for (let col = 0; col < WIDTH; col++) {
        if (row[col] === 0) continue;
        const x = well.x + col * cell;
        const y = well.y + (r - HIDDEN) * cell;
        const m = cell * 0.3;
        c.moveTo(x + m, y + m); c.lineTo(x + cell - m, y + cell - m);
        c.moveTo(x + cell - m, y + m); c.lineTo(x + m, y + cell - m);
      }
    }
    c.stroke();
  }
}
