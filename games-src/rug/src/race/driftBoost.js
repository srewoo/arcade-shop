/**
 * Drift scoring + mini-turbo for the human player (wraps logic/drift.js).  Runs after each physics
 * step from Session.step, reads car state and, on a tiered drift release, pushes the car forward.
 * Never active in demo/menu sessions, so the deterministic sim is unaffected.
 */
import { PHYSICS } from "../config/physics.js";
import { DriftScorer, TIERS, turboImpulse, turboThrust } from "../logic/drift.js";

export class DriftController {
  constructor() {
    this.scorer = new DriftScorer();
    this.events = []; // {type:"tier"|"release"|"bank"|"lost"|"turbo", ...} drained by the HUD
    this.turboTier = 0;
    this.turboLeft = 0;
  }

  /** Call after every race.step(). */
  update(car, dt) {
    for (const event of car.events) {
      if (event.type !== "hit" || event.driftSeen) continue;
      event.driftSeen = true;
      const lost = this.scorer.hit();
      if (lost) {
        this.events.push(lost);
        this.turboLeft = 0;
      }
    }
    const drifting = car.drifting && car.onGround && !car.finished && !car.ai;
    for (const event of this.scorer.update(dt, { drifting, speed: car.speed })) {
      this.events.push(event);
      if (event.type === "release" && event.tier > 0) this.startTurbo(car, event.tier);
    }
    if (this.turboLeft > 0) this.thrust(car, dt);
  }

  startTurbo(car, tier) {
    const fwd = this.forward(car);
    this.push(car, turboImpulse(tier, fwd, PHYSICS.boostTop));
    this.turboTier = tier;
    this.turboLeft = TIERS[tier].dur;
    car.events.push({ type: "turbo", tier });
    this.events.push({ type: "turbo", tier });
  }

  thrust(car, dt) {
    this.turboLeft -= dt;
    this.push(car, turboThrust(this.turboTier, dt, this.forward(car), PHYSICS.boostTop));
  }

  forward(car) {
    return car.vx * Math.cos(car.a) + car.vz * Math.sin(car.a);
  }

  push(car, add) {
    car.vx += Math.cos(car.a) * add;
    car.vz += Math.sin(car.a) * add;
  }

  /** Live state for the HUD / sparks. */
  get state() {
    const s = this.scorer;
    return { active: s.active, duration: s.duration, tier: s.tier, points: Math.round(s.pending), combo: s.combo, total: s.total };
  }
}
