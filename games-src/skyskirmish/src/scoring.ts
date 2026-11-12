// Score and the kill-chain multiplier. Every few kills in a row raise the multiplier; a pause in
// the action lets it drain, and taking a hit resets it.
import { CONFIG, DIFFICULTY } from './config';
import type { GameState } from './types';

export function registerKill(s: GameState, base: number): number {
  const points = Math.round(base * s.mult * DIFFICULTY[s.difficulty].score);
  s.score += points;
  s.kills += 1;
  s.chain += 1;
  s.chainTimer = CONFIG.score.chainSecs;
  if (s.chain >= CONFIG.score.killsPerStep && s.mult < CONFIG.score.multMax) {
    s.mult += 1;
    s.chain = 0;
    s.events.push({ type: 'multUp', mult: s.mult });
  }
  s.stats.bestMult = Math.max(s.stats.bestMult, s.mult);
  return points;
}

export function resetMultiplier(s: GameState): void {
  s.mult = 1;
  s.chain = 0;
  s.chainTimer = 0;
}

export function tickChain(s: GameState, dt: number): void {
  if (s.mult <= 1 && s.chain === 0) return;
  s.chainTimer -= dt;
  if (s.chainTimer > 0) return;
  s.chain = 0;
  if (s.mult > 1) s.mult -= 1;
  s.chainTimer = CONFIG.score.chainSecs;
}

export function addBonus(s: GameState, points: number): number {
  const value = Math.round(points * DIFFICULTY[s.difficulty].score);
  s.score += value;
  return value;
}
