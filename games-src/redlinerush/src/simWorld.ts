// Traffic, pickups, collisions and near-miss detection.
import { CONFIG } from './config';
import { isNearMiss, nearPoints } from './scoring';
import type { Car, Sim } from './simTypes';
import { laneSpeed } from './track';

const P = CONFIG.player;

function spawn(s: Sim): void {
  while (s.track.peekZ() < s.z + CONFIG.traffic.spawnAhead) {
    const row = s.track.next();
    for (const c of row.cars) {
      s.cars.push({
        id: s.nextId++, lane: c.lane, kind: c.kind, len: CONFIG.carLen[c.kind], hue: c.hue,
        speed: laneSpeed(c.lane), z: row.z, pz: row.z, minDx: 99, scored: false,
      });
    }
    for (const p of row.pickups) s.pickups.push({ id: s.nextId++, kind: p.kind, lane: p.lane, z: p.z });
  }
}

export const carHalfLen = (c: Car): number => c.len * CONFIG.hitLenFrac;

function crash(s: Sim, car: Car): void {
  s.lives--;
  s.crashes++;
  s.invuln = P.invuln;
  s.speed = Math.min(s.speed, P.hurtSpeed);
  s.combo = 0;
  s.comboT = 0;
  s.cars = s.cars.filter((c) => c !== car);
  s.events.push({ type: 'crash', lives: s.lives, x: car.lane + 0.5, rel: car.z - s.z });
}

function nearMiss(s: Sim, car: Car): void {
  const clearance = car.minDx - 2 * P.halfW;
  if (s.invuln > 0 || !isNearMiss(clearance)) return;
  s.combo++;
  s.comboT = CONFIG.scoring.comboWindow;
  s.maxCombo = Math.max(s.maxCombo, s.combo);
  s.nearMisses++;
  const points = nearPoints(s.combo, s.boost > 0);
  s.bonus += points;
  s.events.push({ type: 'near', combo: s.combo, points, x: car.lane + 0.5 });
}

function stepCars(s: Sim, dt: number): void {
  for (const car of s.cars) car.z += car.speed * dt;
  for (const car of [...s.cars]) {
    const rel = car.z - s.z;
    const dx = Math.abs(car.lane + 0.5 - s.x);
    if (s.invuln <= 0 && dx < 2 * P.halfW && Math.abs(rel) < carHalfLen(car) + P.halfLen) {
      crash(s, car);
      continue;
    }
    if (Math.abs(rel) < CONFIG.scoring.nearWindow) car.minDx = Math.min(car.minDx, dx);
    if (!car.scored && car.pz - s.pz > 0 && rel <= 0) {
      car.scored = true;
      nearMiss(s, car);
    }
  }
  s.cars = s.cars.filter((c) => c.z > s.z - CONFIG.traffic.cullBehind);
}

function stepPickups(s: Sim): void {
  const keep = [];
  for (const p of s.pickups) {
    const hit = Math.abs(p.lane + 0.5 - s.x) < 0.5 && Math.abs(p.z - s.z) < 4;
    if (!hit) {
      if (p.z > s.z - CONFIG.traffic.cullBehind) keep.push(p);
      continue;
    }
    s.bonus += CONFIG.scoring.pickup;
    if (p.kind === 'fuel') {
      s.fuel = Math.min(CONFIG.fuel.max, s.fuel + CONFIG.fuel.pickup);
      s.lowWarned = false;
    } else s.boost = CONFIG.speed.boostDur;
    s.events.push({ type: p.kind });
  }
  s.pickups = keep;
}

export function stepWorld(s: Sim, dt: number): void {
  spawn(s);
  stepCars(s, dt);
  stepPickups(s);
  if (s.mode !== 'trial' && !s.lowWarned && s.fuel < CONFIG.fuel.low) {
    s.lowWarned = true;
    s.events.push({ type: 'lowfuel' });
  }
}
