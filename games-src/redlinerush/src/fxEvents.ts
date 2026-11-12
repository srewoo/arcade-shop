// Turns sim events into audio, particles and screen-reader announcements.
import { playCue } from './audio';
import { CONFIG } from './config';
import { PALETTE } from './palette';
import { laneX, roadX } from './render';
import { burst, debris, floatText, hitShake, ring, smoke, type Fx } from './renderFx';
import { score } from './sim';
import type { Sim, SimEvent } from './simTypes';
import { announce } from './strings';
import { view } from './viewport';

function visual(e: SimEvent, s: Sim, fx: Fx): void {
  const px = roadX(s.x);
  const PY = view.playerY;
  switch (e.type) {
    case 'near':
      floatText(fx, `CLOSE! +${e.points}`, px, PY - 50);
      burst(fx, laneX(Math.floor(e.x)), PY, 10, PALETTE.boost, 110);
      break;
    case 'crash':
      burst(fx, px, PY, 22, PALETTE.hit, 220);
      burst(fx, px, PY, 16, '#ffb800', 260);
      burst(fx, px, PY, 8, PALETTE.text, 140);
      debris(fx, px, PY - 10, 14, PALETTE.player, 190);
      debris(fx, px, PY - 10, 6, '#2b323c', 150);
      ring(fx, px, PY - 10, '#ffb800');
      ring(fx, px, PY - 10, '#fff3c4', 'glow', 34);
      for (let i = 0; i < 4; i++) smoke(fx, px + (i - 1.5) * 8, PY - 14, -50 - i * 10, 9 + i * 2, 1.2);
      hitShake(fx);
      break;
    case 'fuel': burst(fx, px, PY, 10, PALETTE.fuel, 110); floatText(fx, 'FUEL', px, PY - 50); break;
    case 'boost': burst(fx, px, PY, 12, PALETTE.boost, 140); floatText(fx, 'BOOST', px, PY - 50); break;
    case 'checkpoint': floatText(fx, e.bonus > 0 ? `CHECKPOINT +${e.bonus}s` : 'FINISH', view.roadLeft + (view.laneW * CONFIG.lanes) / 2, view.playerY - 250); break;
    default: break;
  }
}

function spoken(e: SimEvent, s: Sim): string | null {
  switch (e.type) {
    case 'go': return announce.go;
    case 'crash': return announce.crash(e.lives);
    case 'fuel': return announce.fuel;
    case 'boost': return announce.boost;
    case 'lowfuel': return announce.lowfuel;
    case 'checkpoint': return announce.checkpoint(e.index, e.of);
    case 'over': return announce.over(e.outcome, score(s));
    default: return null;
  }
}

/** Per-frame ambient effects: boost exhaust sparks and smoke from a battered car. */
export function ambientFx(s: Sim, fx: Fx): void {
  if (s.phase !== 'run') return;
  const px = roadX(s.x);
  const PY = view.playerY;
  if (s.boost > 0 && fx.tick % 2 === 0) burst(fx, px + ((fx.tick % 4) - 1.5) * 6, PY + 30, 1, PALETTE.boost, 70);
  if (s.lives === 1 && fx.tick % 7 === 0) smoke(fx, px, PY - 18, 30, 6, 0.8);
}

/** Drain the sim's event queue; returns the lines to announce. */
export function consumeEvents(s: Sim, fx: Fx): string[] {
  const lines: string[] = [];
  for (const e of s.events) {
    playCue(e);
    visual(e, s, fx);
    const line = spoken(e, s);
    if (line) lines.push(line);
  }
  s.events.length = 0;
  return lines;
}
