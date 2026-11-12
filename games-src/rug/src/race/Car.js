/**
 * One racing car: arcade physics state and fixed-step integrator (original: class Fw).
 *
 * UNITS: world units ~ "cm-ish" toy scale; speeds in units/s (top speed 37), angles in radians,
 * time in seconds.  The simulation is stepped at STEP = 1/240 s (see main loop), so `dt` is tiny.
 *
 * COORDINATES: x/z are the ground plane, y is up (height above the floor/rug). `a` is the yaw:
 * heading vector = (cos a, sin a) in (x,z).  Velocity (vx,vz) is split each step into
 *   fwd  = component along the heading     (forward speed, `speed`)
 *   side = component across the heading    (lateral slip, `latV`)
 * and recomposed after the update.  This is a "bicycle-free" arcade model: grip simply damps `side`.
 */
import { clamp, mulberry32 } from "../util/math.js";
import { wrapAngle } from "../util/angles.js";
import { PHYSICS } from "../config/physics.js";
import { NEUTRAL_TUNE } from "../logic/tuning.js";
import { route } from "../world/layoutSelect.js";
import { projectOnTrack } from "../world/trackSamples.js";
import { sampleSurfaceMask } from "../world/surfaceMask.js";
import { carGroundHeight, collideCarWithColliders, clampCarToRug } from "./carCollision.js";

export class Car {
  /**
   * @param {number} id       index in the race (0 = player)
   * @param {string} type     "coupe" | "pickup" | "van" | "formula"
   * @param {boolean} isPlayer
   */
  constructor(id, type, isPlayer) {
    this.id = id;
    this.type = type;
    this.isPlayer = isPlayer;
    this.x = 0;
    this.z = 0;
    this.a = 0; // yaw
    this.vx = 0;
    this.vz = 0;
    this.y = 0; // height above ground
    this.vy = 0;
    this.onGround = true;
    this.speed = 0; // forward speed (signed)
    this.latV = 0; // lateral slip speed
    this.boost = 1; // boost tank 0..1
    this.boosting = false;
    this.steer = 0; // smoothed steering -1..1
    this.squash = 0; // visual suspension squash spring
    this.squashV = 0;
    this.pitch = 0; // visual body pitch
    this.roll = 0; // visual body roll
    this.wheelRot = 0;
    this.offroad = 0; // smoothed 0..1 off-road amount (dust/fibre FX)
    this.jumpCd = 0;
    this.jumpHeld = false;
    this.padCd = 0;
    this.padT = 0; // time left of the boost-pad glow
    this.idx = -1; // nearest track sample index
    this.s = 0; // arclength along track
    this.lat = 0; // signed lateral offset from centreline
    this.prog = 0; // progress in route sample units (monotone-ish)
    this.bestProg = 0;
    this.stuckT = 0;
    this.offRouteT = 0;
    this.laps = 3;
    this.lane = 0; // AI lane (current / target)
    this.laneT = 0;
    this.spin = 0; // remaining spin-out time
    this.spinRate = 0;
    this.topOverride = undefined; // AI rubber-banded top speed
    this.ghost = false; // ghost cars (menu/demo) skip collisions
    this.tune = NEUTRAL_TUNE; // per-model stat multipliers {top, accel, grip, boost}; 1 = original physics
    this.drifting = false; // true while a drift (brake + steer above 14 u/s) is active
    this.input = { throttle: 0, brake: 0, steer: 0, boost: false, jump: false };
    this.finished = false;
    this.finishTime = 0;
    this.place = 0;
    this.events = []; // one-shot events for audio/FX: boost, jump, land, hit, pad
    this.hitCd = 0;
    this.prevAccel = 0;
    this.rnd = mulberry32(900 + id);
  }

  /** Put the car on the track at arclength `s` (sample units) and lateral offset `lat`, stationary. */
  placeOnTrack(s, lat) {
    const p = route.at(s, lat);
    this.x = p.x;
    this.z = p.z;
    this.a = p.heading;
    this.vx = this.vz = 0;
    this.speed = 0;
    this.y = 0;
    this.vy = 0;
    this.onGround = true;
    this.prog = s;
    this.bestProg = s;
    this.lane = lat;
    this.laneT = lat;
    const near = projectOnTrack(this.x, this.z);
    this.idx = near.i;
    this.s = near.s;
    this.lat = near.lat;
  }

  /** Current lap, 1-based, clamped to the race length. */
  get lap() {
    return clamp(Math.floor(this.prog / route.len) + 1, 1, this.laps);
  }

  get progressTotal() {
    return this.prog;
  }

  /**
   * Advance the simulation by dt.
   * @param {number} dt
   * @param {{throttle:number,brake:number,steer:number,boost:boolean,jump:boolean,drift?:boolean}} input
   * @param {{mask:object, colliders:object[]}} env
   */
  step(dt, input, env) {
    const tn = this.tune;
    const cosA = Math.cos(this.a);
    const sinA = Math.sin(this.a);
    // split world velocity into forward / lateral components
    let fwd = this.vx * cosA + this.vz * sinA;
    let side = -this.vx * sinA + this.vz * cosA;

    // --- surface under the car: road (full grip), pond (slow), rug (offroad) ---
    const surface = sampleSurfaceMask(env.mask, this.x, this.z);
    const onRoad = surface.road > 0.45;
    const inWater = !onRoad && surface.water > 0.5;
    const surfaceTopFactor = onRoad ? 1 : inWater ? PHYSICS.pond : PHYSICS.offroad; // multiplies top speed
    this.offroad += ((onRoad ? 0 : 1) - this.offroad) * Math.min(1, dt * 10);
    this.jumpCd -= dt;
    this.hitCd -= dt;

    // --- boost tank: drains in 2.6 s (1/2.6 = 0.3846/s), refills at PHYSICS.boostFill ---
    const wantBoost = input.boost && this.boost > 0.01 && input.throttle > 0 && !this.finished;
    if (wantBoost && !this.boosting) this.events.push({ type: "boost" });
    this.boosting = wantBoost;
    this.boost = clamp(this.boost + (this.boosting ? -0.3846153846153846 / tn.boost : PHYSICS.boostFill) * dt, 0, 1);

    // --- spin-out after a hard hit: no control while spin > 0 ---
    const inControl = this.spin <= 0;
    if (!inControl) {
      this.spin -= dt;
      this.a = wrapAngle(this.a + this.spinRate * dt);
    }
    // steering authority grows with speed (full at 9 u/s) and flips when reversing
    const turnRate = clamp(Math.abs(fwd) / 9, 0, 1) * Math.sign(fwd || 1) * PHYSICS.turn;
    // drifting (input.drift) only above 14 u/s: low lateral grip, tighter turn, recharges boost
    const drifting = inControl && this.onGround && !!input.drift && fwd > 14;
    this.drifting = drifting;

    if (this.onGround) {
      // target top speed: boost top (AI has its own), AI/rubber-band override, or normal top
      const topSpeed =
        (this.boosting ? (this.ai ? PHYSICS.aiBoostTop : PHYSICS.boostTop) : (this.topOverride ?? PHYSICS.top)) * tn.top * surfaceTopFactor;
      if (inControl && input.throttle > 0 && fwd < topSpeed) {
        // acceleration tapers off linearly, reaching 0 at 1.25 * topSpeed
        const accel = (this.boosting ? PHYSICS.boostAccel : PHYSICS.accel) * tn.accel * (1 - Math.max(0, fwd) / (topSpeed * 1.25));
        fwd += accel * input.throttle * dt;
      } else if (fwd > topSpeed) {
        fwd += (topSpeed - fwd) * Math.min(1, dt * 2.8); // ease back down to the cap
      }
      this.braking = inControl && input.brake > 0 && fwd > 1;
      if (inControl && input.brake > 0) {
        // brake: 8 while drifting, PHYSICS.brake when moving forward, 20 when already reversing
        fwd -= (drifting ? 8 : fwd > 0 ? PHYSICS.brake : 20) * input.brake * dt;
        fwd = Math.max(fwd, -13); // reverse speed cap
      }
      if (input.throttle <= 0 && input.brake <= 0) fwd *= Math.exp(-0.9 * dt); // coasting drag
      // lateral grip: exponential decay of sideways slip (weaker off-road, 5x weaker when drifting)
      side *= Math.exp(-(onRoad ? PHYSICS.grip : PHYSICS.offGrip) * (drifting ? 0.2 : 1) * tn.grip * dt);
      if (drifting && Math.abs(side) > 6) this.boost = Math.min(1, this.boost + 0.22 * tn.boost * dt); // drift charges boost
      this.steer += (input.steer - this.steer) * Math.min(1, dt * 11); // steering smoothing
      const yawRate = inControl ? this.steer * turnRate * (drifting ? 1.3 : 1) : 0;
      this.a = wrapAngle(this.a + yawRate * dt);
      side -= yawRate * fwd * PHYSICS.slide * dt; // centrifugal-ish slide proportional to yaw*speed
      if (input.jump && !this.jumpHeld && this.jumpCd <= 0) {
        this.vy = PHYSICS.jumpV;
        this.onGround = false;
        this.jumpCd = 0.4;
        this.squashV += 5.5;
        this.events.push({ type: "jump" });
      }
    } else {
      // airborne: little steering (0.3x), almost no drag, strong lateral damping
      this.steer += (input.steer - this.steer) * Math.min(1, dt * 4);
      if (inControl) this.a = wrapAngle(this.a + this.steer * turnRate * 0.3 * dt);
      fwd -= fwd * 0.05 * dt;
      side *= Math.exp(-1.5 * dt);
    }
    this.jumpHeld = !!input.jump;

    // recompose world velocity with the (possibly rotated) heading and integrate position
    const cosB = Math.cos(this.a);
    const sinB = Math.sin(this.a);
    this.vx = cosB * fwd - sinB * side;
    this.vz = sinB * fwd + cosB * side;
    this.x += this.vx * dt;
    this.z += this.vz * dt;

    // --- vertical motion: ground / box tops, gravity, landing squash ---
    const groundY = carGroundHeight(this, env);
    if (this.onGround) {
      if (groundY < this.y - 0.05) {
        this.onGround = false; // drove off a ledge
        this.vy = 0;
      } else {
        this.y = groundY;
      }
    } else {
      this.vy -= PHYSICS.gravity * dt;
      this.y += this.vy * dt;
      if (this.y <= groundY) {
        const impact = -this.vy;
        this.y = groundY;
        this.vy = 0;
        this.onGround = true;
        this.squashV -= Math.min(9, impact * 0.55);
        this.events.push({ type: "land", impact });
      }
    }

    // --- visual suspension: damped spring (k=230, c=13) ---
    const damping = 13;
    this.squashV += (-230 * this.squash - damping * this.squashV) * dt;
    this.squash += this.squashV * dt;
    // measured longitudinal acceleration -> body pitch; steering*speed -> body roll
    const accelNow = (fwd - this.speed) / Math.max(dt, 1e-4);
    this.prevAccel += (accelNow - this.prevAccel) * Math.min(1, dt * 6);
    const pitchTarget = this.onGround ? clamp(this.prevAccel * 0.0026, -0.07, 0.07) : clamp(this.vy * 0.012, -0.12, 0.12);
    this.pitch += (pitchTarget - this.pitch) * Math.min(1, dt * 8);
    const rollTarget = this.onGround ? clamp(-this.steer * fwd * 0.0032, -0.09, 0.09) : 0;
    this.roll += (rollTarget - this.roll) * Math.min(1, dt * 7);
    this.speed = fwd;
    this.latV = side;
    this.wheelRot += (fwd * dt) / 0.65; // wheel radius 0.65
    if (!this.ghost) collideCarWithColliders(this, env);
    clampCarToRug(this);
    this.updateProgress();
  }

  /**
   * Update nearest-track data and `prog`, the lap progress counted in route sample indices.
   * prog only advances to a sample within [-14,+34] of the previous one that is closer than
   * 34 units (1156 = 34^2); otherwise the car counts as off-route (shortcut protection).
   */
  updateProgress() {
    const near = projectOnTrack(this.x, this.z, this.idx);
    this.idx = near.i;
    this.s = near.s;
    this.lat = near.lat;
    const base = Math.round(this.prog);
    let bestDist2 = 1e12;
    let bestOffset = 0;
    for (let k = -14; k <= 34; k++) {
      const j = route.mod(base + k);
      const d2 = (route.x[j] - this.x) ** 2 + (route.z[j] - this.z) ** 2;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestOffset = k;
      }
    }
    if (bestDist2 < 1156) {
      this.prog = base + bestOffset;
      this.offRouteT = 0;
    } else {
      this.offRouteT += 1 / 240;
    }
  }
}
