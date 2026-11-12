// Brute-force putting bot: proves holes are solvable by playing them with the real physics.
// Also drives the ?debug=1 autoplay. Not used during normal play.
import { CONFIG } from '../config';
import { distanceField, type Field } from '../course/validate';
import { Sim } from './sim';
import type { HoleDef } from './types';

export interface BotShot { angle: number; power: number }

const POWERS = [0.28, 0.42, 0.58, 0.78, 1];
const ANGLES = 72;
const MAX_STEPS = 4000;

function playOut(sim: Sim): void {
  for (let i = 0; i < MAX_STEPS && sim.state === 'rolling'; i++) sim.step();
}

/** Choose the shot whose resting spot is closest (walking distance) to the cup. */
export function bestShot(sim: Sim, field: Field): BotShot | null {
  const cup = sim.hole.cup;
  const direct = Math.atan2(cup.y - sim.ball.y, cup.x - sim.ball.x);
  const angles = [direct, ...Array.from({ length: ANGLES }, (_, i) => (i / ANGLES) * Math.PI * 2)];
  let best: BotShot | null = null;
  let bestScore = Infinity;
  for (const angle of angles) {
    for (const power of POWERS) {
      const t = sim.clone();
      if (!t.strike(angle, power)) continue;
      playOut(t);
      if (t.state === 'sunk') return { angle, power };
      if (t.state !== 'idle') continue;
      const score = field.at(t.ball.x, t.ball.y);
      if (score < bestScore) { bestScore = score; best = { angle, power }; }
    }
  }
  return best;
}

export interface Solution { strokes: number; shots: BotShot[]; penalties: number }

/** Play the hole with the bot. Returns null when it cannot hole out within `limit` strokes. */
export function solveHole(hole: HoleDef, limit: number = CONFIG.shot.maxStrokes + 4): Solution | null {
  const field = distanceField(hole);
  const sim = new Sim(hole);
  const shots: BotShot[] = [];
  let penalties = 0;
  while (shots.length + penalties < limit) {
    const shot = bestShot(sim, field);
    if (!shot) return null;
    shots.push(shot);
    sim.strike(shot.angle, shot.power);
    playOut(sim);
    if (sim.state === 'sunk') return { strokes: shots.length + penalties, shots, penalties };
    if (sim.state === 'water') { penalties++; sim.place(sim.lastSpot); }
  }
  return null;
}
