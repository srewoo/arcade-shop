// CPU bowler: samples candidate shots, scores each with the real physics, then
// adds level-dependent noise to the winner. Pure and seedable.
import { HEAD_Y, MAX_AIM, START_X_LIMIT } from './constants';
import { createWorld, knockedCount, simulate, standingMask, stepWorld } from './physics';
import { countStanding, pinSpot, type PinMask } from './pins';
import { clamp, gauss, type Rng } from './rng';
import { TUNING, type CpuLevel, type CpuProfile } from './tuning';
import type { Shot } from './worldTypes';

export type { CpuLevel };

export const PROFILES: Record<CpuLevel, CpuProfile> = TUNING.cpu;

/** Ball x when it reaches the head-pin line, with no pins in the way. */
export function ballXAtHead(x: number, aim: number, power: number, spin: number): number {
  const w = createWorld(Array.from({ length: 10 }, () => false), { x, aim, power, spin });
  while (w.ball.active && w.ball.y < HEAD_Y) stepWorld(w);
  return w.ball.x;
}

/** Lateral targets at the head-pin line: each standing pin plus the gaps between neighbours. */
function targetXs(mask: PinMask): number[] {
  const spots = mask.map((up, i) => (up ? pinSpot(i) : null)).filter((p): p is NonNullable<typeof p> => p !== null);
  const xs = spots.map((p) => p.x);
  if (spots.length === 10) return [-7, 7];
  // Pins further back are reached on a slight line, so aim straight at each standing pin.
  for (const a of spots) for (const b of spots) if (a.y === b.y && b.x - a.x > 0 && b.x - a.x < 32) xs.push((a.x + b.x) / 2);
  return xs;
}

function sampleCandidate(mask: PinMask, rng: Rng): Shot {
  const targets = targetXs(mask);
  const tx = (targets[Math.floor(rng() * targets.length)] as number) + (mask.every(Boolean) ? (rng() - 0.5) * 6 : (rng() - 0.5) * 3);
  const x = clamp((rng() * 2 - 1) * START_X_LIMIT, -START_X_LIMIT, START_X_LIMIT);
  const spin = Math.round((rng() * 2 - 1) * 4) / 4;
  const power = 0.72 + rng() * 0.28;
  const drift = ballXAtHead(x, 0, power, spin) - x;
  const aim = clamp(Math.atan2(tx - x - drift, HEAD_Y), -MAX_AIM, MAX_AIM);
  return { x, aim, power, spin };
}

function scoreShot(mask: PinMask, shot: Shot): number {
  const w = simulate(mask, shot);
  const left = countStanding(standingMask(w));
  return knockedCount(w) + (left === 0 ? 4 : 0);
}

function applyNoise(shot: Shot, p: CpuProfile, rng: Rng): Shot {
  return {
    x: clamp(shot.x + gauss(rng) * p.xNoise, -START_X_LIMIT, START_X_LIMIT),
    aim: clamp(shot.aim + gauss(rng) * p.aimNoise, -MAX_AIM, MAX_AIM),
    power: clamp(shot.power + gauss(rng) * p.powerNoise, 0.3, 1),
    spin: clamp(shot.spin + gauss(rng) * p.spinNoise, -1, 1),
  };
}

/** Pick a shot for the pins currently standing. Never returns an out-of-range shot. */
export function chooseShot(mask: PinMask, level: CpuLevel, rng: Rng): Shot {
  const profile = PROFILES[level];
  let best = sampleCandidate(mask, rng);
  let bestScore = scoreShot(mask, best);
  for (let i = 1; i < profile.candidates; i++) {
    const cand = sampleCandidate(mask, rng);
    const s = scoreShot(mask, cand);
    if (s > bestScore) {
      best = cand;
      bestScore = s;
    }
  }
  return applyNoise(best, profile, rng);
}
