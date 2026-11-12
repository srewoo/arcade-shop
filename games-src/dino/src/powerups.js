// Power-up definitions and timer maths (pure; the scene objects live in obstacles/pickups.js and fx/bubble.js).

export const POWERUPS = {
  shield: { id: 'shield', label: 'Shield', short: 'SH', duration: 20, weight: 1, color: '#4fd8ff' },
  doublejump: { id: 'doublejump', label: 'Double Jump', short: '2J', duration: 15, weight: 1.2, color: '#ffd23f' },
  slowmo: { id: 'slowmo', label: 'Slow-Mo', short: 'SM', duration: 5, weight: 0.9, color: '#b388ff' },
  score2: { id: 'score2', label: 'Score x2', short: 'x2', duration: 10, weight: 1.2, color: '#ff9f43' },
};
export const POWERUP_IDS = Object.keys(POWERUPS);
export const isPowerupId = (v) => typeof v === 'string' && Object.hasOwn(POWERUPS, v);

export const SLOWMO_SCALE = 0.6; // gameplay + physics time scale while Slow-Mo is active
export const SHIELD_GRACE = 0.8; // seconds of invulnerability after a shield absorbs a hit
export const STUMBLE_TIME = 1.3; // Zen knock-down length
export const STUMBLE_GRACE = 2; // invulnerability after getting up
export const AIR_JUMP_POWER = 0.92; // second jump strength relative to the first

const NONE = Object.freeze([]);
export const EXPIRY_WARN_S = 3; // the HUD / audio warn when a power-up has this long left

/** Timers keyed by power-up id.  update() reports which ones ran out. */
export class PowerupState {
  constructor() {
    this.timers = {};
  }
  clear() {
    this.timers = {};
  }
  grant(id) {
    if (isPowerupId(id)) this.timers[id] = POWERUPS[id].duration;
  }
  has(id) {
    return (this.timers[id] ?? 0) > 0;
  }
  remaining(id) {
    return Math.max(0, this.timers[id] ?? 0);
  }
  /** True in the last EXPIRY_WARN_S seconds of an active power-up. */
  expiring(id) {
    const left = this.remaining(id);
    return left > 0 && left <= EXPIRY_WARN_S;
  }
  /** 0..1 of the original duration still left. */
  fraction(id) {
    return isPowerupId(id) ? this.remaining(id) / POWERUPS[id].duration : 0;
  }
  /** Advance timers by `dt` real seconds; returns the ids that expired. */
  update(dt) {
    let expired = NONE; // shared empty list: no allocation on the (common) frames where nothing expires
    const step = Math.max(0, dt);
    for (const id in this.timers) {
      this.timers[id] -= step;
      if (this.timers[id] <= 0) {
        delete this.timers[id];
        if (expired === NONE) expired = [];
        expired.push(id);
      }
    }
    return expired;
  }
  /** Use up the Shield (returns true when there was one). */
  consumeShield() {
    if (!this.has('shield')) return false;
    delete this.timers.shield;
    return true;
  }
  timeScale() {
    return this.has('slowmo') ? SLOWMO_SCALE : 1;
  }
  scoreMultiplier() {
    return this.has('score2') ? 2 : 1;
  }
  active() {
    return POWERUP_IDS.filter((id) => this.has(id));
  }
}

/** Extra score (beyond the plain distance score) earned over `step` metres at multiplier `mult`. */
export const bonusDelta = (step, mult, scorePerMeter) => step * scorePerMeter * (mult - 1);

/** Integer score from run distance plus accumulated bonus.  Without bonus this equals floor(dist * scorePerMeter). */
export const scoreFrom = (dist, bonus, scorePerMeter) => Math.floor(dist * scorePerMeter + bonus);

/** Weighted choice among `pool` (ids) using `roll` in [0,1). */
export function pickPowerup(pool, roll) {
  const ids = pool.filter(isPowerupId);
  if (!ids.length) return null;
  const total = ids.reduce((s, id) => s + POWERUPS[id].weight, 0);
  let r = Math.min(Math.max(roll, 0), 0.999999) * total;
  for (const id of ids) {
    r -= POWERUPS[id].weight;
    if (r < 0) return id;
  }
  return ids[ids.length - 1];
}

/** Should a pickup be placed in this gap?  Needs power-ups on, some distance since the last one, and a lucky roll. */
export const shouldSpawnPickup = ({ enabled, distance, lastAt, roll, minGap = 110, chance = 0.35, firstAt = 90 }) =>
  enabled && distance >= firstAt && distance - lastAt >= minGap && roll < chance;
