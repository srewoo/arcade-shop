// In-canvas feedback: the combo meter beside the car, and the run-end payoff banner.
import { CONFIG } from './config';
import { PALETTE } from './palette';
import { multiplier } from './scoring';
import type { Sim } from './simTypes';
import { OUTCOME_TITLE } from './strings';
import { ROAD_W, view as V } from './viewport';

/** Pill next to the player: multiplier, chain length and a bar that drains with the chain timer. */
export function drawComboMeter(g: CanvasRenderingContext2D, s: Sim, px: number, assist: boolean): void {
  if (s.combo <= 0 || s.phase === 'over') return;
  const w = 66;
  const h = 34;
  const right = px + 28 + w < V.roadLeft + ROAD_W - 2;
  const x = right ? px + 28 : px - 28 - w;
  const y = V.playerY - 18;
  g.save();
  g.fillStyle = 'rgba(10,14,20,0.82)';
  g.strokeStyle = PALETTE.boost;
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(x, y, w, h, 9);
  g.fill();
  g.stroke();
  g.font = 'bold 17px system-ui, sans-serif';
  g.textAlign = 'left';
  g.fillStyle = PALETTE.text;
  g.fillText(`x${multiplier(s.combo)}`, x + 8, y + 19);
  g.font = 'bold 12px system-ui, sans-serif';
  g.fillStyle = PALETTE.boost;
  g.fillText(`${s.combo} chain`, x + 34, y + 19);
  const frac = Math.max(0, Math.min(1, s.comboT / CONFIG.scoring.comboWindow));
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.fillRect(x + 8, y + 25, w - 16, 4);
  g.fillStyle = assist ? PALETTE.text : PALETTE.boost;
  g.fillRect(x + 8, y + 25, (w - 16) * frac, 4);
  g.restore();
}

/** The run-end moment, drawn before the result card opens: dim, outcome word, pop-in unless reduced. */
export function drawPayoff(g: CanvasRenderingContext2D, s: Sim, reduce: boolean): void {
  if (s.phase !== 'over' || !s.outcome) return;
  const t = Math.min(1, s.overT / 0.35);
  g.fillStyle = `rgba(6,9,14,${0.55 * t})`;
  g.fillRect(0, 0, V.width, V.height);
  const pop = reduce ? 1 : 0.7 + 0.3 * Math.min(1, t * 1.4) + Math.sin(Math.min(1, t) * Math.PI) * 0.08;
  g.save();
  g.translate(V.roadLeft + ROAD_W / 2, V.height * 0.38);
  g.scale(pop, pop);
  g.globalAlpha = t;
  g.font = 'italic 900 44px system-ui, sans-serif';
  g.textAlign = 'center';
  g.lineWidth = 8;
  g.lineJoin = 'round';
  g.strokeStyle = PALETTE.ink;
  const label = OUTCOME_TITLE[s.outcome].toUpperCase();
  const fit = Math.min(1, (ROAD_W * 0.92) / g.measureText(label).width);
  g.scale(fit, fit);
  g.strokeText(label, 0, 0);
  g.fillStyle = s.outcome === 'finish' ? PALETTE.fuel : PALETTE.hit;
  g.fillText(label, 0, 0);
  g.restore();
}
