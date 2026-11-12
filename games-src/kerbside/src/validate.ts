// Structural level validation (the solver proves reachability separately).
import { carBox, makeCar, trailerBox } from './car';
import { CONFIG } from './config';
import { containedIn, insideWorld, overlaps } from './geom';
import type { Level } from './levels/types';
import { collides } from './sim';

const rigLength = (): number =>
  CONFIG.car.centreOffset + CONFIG.car.length / 2 + CONFIG.trailer.hitchBehindAxle + CONFIG.trailer.drawbar + CONFIG.trailer.length / 2;

/** Returns a list of problems; an empty list means the level is structurally sound. */
export function validateLevel(level: Level): string[] {
  const out: string[] = [];
  const { w, h } = level.world;
  const bay = level.bay;
  const start = makeCar(level.start.x, level.start.y, level.start.a);
  if (!insideWorld(bay, w, h)) out.push('bay outside world');
  if (collides(start, level, CONFIG.solver.margin)) out.push('start pose collides');
  if (level.obstacles.some((o) => overlaps(bay, o.box, -0.02))) out.push('bay overlaps an obstacle');
  const need = level.goal === 'trailer' ? CONFIG.trailer : CONFIG.car;
  if (bay.hw * 2 < need.length + 0.2 || bay.hh * 2 < need.width + 0.2) out.push('bay too small for the car');
  if (level.goal === 'both' && bay.hw * 2 < rigLength() + 0.5) out.push('bay too short for the rig');
  if (containedIn(carBox(start), bay) && level.goal !== 'trailer') out.push('start already inside the bay');
  if (level.trailer && !containedIn(trailerBox(start), { x: w / 2, y: h / 2, hw: w / 2, hh: h / 2, a: 0 })) out.push('trailer starts outside world');
  if (level.parTime >= level.timeLimit) out.push('par time not below time limit');
  if (level.parTime <= 0) out.push('par time must be positive');
  return out;
}
