// A Session wraps one Race plus the things that live alongside it: the seeded RNG, the
// roaming cat event scheduler, and the scripted "film" pilot used by the attract-mode demo.
import { mulberry32 } from "../util/math.js";
import { Race } from "../race/Race.js";
import { driveAi } from "../race/aiDriver.js";
import { unusedBrickZone as demoJumpPoint, unusedCatCrossingSample as demoCatProgress, PAD_SETS } from "../race/boostPads.js";
import { RunTracker } from "../race/runTracker.js";
import { DriftController } from "../race/driftBoost.js";
import { buildStaticColliders } from "../race/colliders.js";
import { route } from "../world/layoutSelect.js";
import { catCrossings } from "../world/layoutSelect.js";
import { world, obstacles } from "./bootstrap.js";
import { snapshotPoses } from "./interpolation.js";

/** Physics environment passed to Race: road/water mask + static colliders. Original `lf`. */
export const physicsEnv = { mask: world.mask, colliders: [...buildStaticColliders(), ...obstacles.colliders] };

/** Route progress of each cat crossing spawn point. Original `Mb`. */
const catRouteProgress = catCrossings.map((c) => route.nearestGlobal(c.x, c.z));

export class Session {
  /**
   * @param {{demo:boolean, laps:number, menu?:boolean, kind?:"race"|"timetrial", opponents?:number,
   *   difficulty?:string, padDensity?:string, best?:object|null, ghost?:object|null}} options
   *   demo: scripted attract-mode (fixed RNG seed 7, pilot-driven player); menu: background race behind the title;
   *   kind "timetrial": no AI cars, ghost recording/replay.  Defaults give the original race (3 AI, Normal, 5 pads).
   */
  constructor({
    demo, laps, menu = false, kind = "race", opponents = 3, difficulty = "normal", padDensity = "normal",
    best = null, ghost = null,
  }) {
    this.demo = demo;
    this.menu = menu;
    this.kind = kind;
    this.difficulty = difficulty;
    this.opponents = opponents;
    this.padDensity = padDensity;
    this.time = 0;
    this.rnd = mulberry32(demo ? 7 : (Math.random() * 1e9) | 0);
    this.cat = null;
    /** Seconds until the next cat run is attempted. */
    this.nextCat = 13 + this.rnd() * 6;
    /** One-shot flags for the scripted demo "film". */
    this.film = {
      catDone: false,
      jumped: false,
      catPassed: false,
      clearAt: 0,
      cockpitAt: 0,
      cockpitUntil: 0,
      cockpit: false,
    };
    this.race = new Race({
      laps,
      demo,
      env: physicsEnv,
      menu,
      pilot: demo ? (car, dt) => this.pilot(car, dt) : null,
      opponents: kind === "timetrial" ? 0 : opponents,
      difficulty,
      pads: PAD_SETS[padDensity] ?? PAD_SETS.normal,
    });
    // player-only trackers (never in demo/menu sessions: keeps the deterministic sim untouched)
    const playable = !demo && !menu;
    this.tracker = playable ? new RunTracker({ laps, routeLen: route.len, best, ghost, recordGhost: kind === "timetrial" }) : null;
    this.drift = playable ? new DriftController() : null;
  }

  /** True while the cat is on screen (within its life time). */
  catActive() {
    return !!this.cat && this.time - this.cat.t0 <= obstacles.catLife(this.cat);
  }

  /** Scripted driving for the demo: slow for the cat, jump the ramp, boost on straights, cockpit shot. */
  pilot(car, dt) {
    const film = this.film;
    const prog = car.prog;
    const raceTime = this.race.time;
    const target = { dt, lane: Math.sin(prog * 0.022) * 1.2, top: 37, aLat: 92, jumpBricks: false };
    const toJump = demoJumpPoint.s - prog;
    if (!film.jumped && toJump < 44 && toJump > 0) target.lane = demoJumpPoint.lat;
    const toCat = demoCatProgress - prog;
    const catBlocking = film.catDone && this.catActive() && this.time - this.cat.t0 < film.clearAt;
    if (toCat > 0 && toCat < 120 && !film.catPassed) {
      if (catBlocking || !film.catDone) target.top = toCat > 80 ? 26 : toCat > 52 ? 15 : 7;
      if (catBlocking && toCat < 45) target.top = 0.5;
      if (film.catDone && !catBlocking) film.catPassed = true;
    }
    driveAi(car, this.race.cars, target, car.prog);
    if (toJump < 44 && toJump > 0 && !film.jumped && toJump < Math.max(4, car.speed) * 0.42 && car.onGround) {
      car.input.jump = true;
      film.jumped = true;
    }
    car.input.boost = prog > 20 && prog < 240 && route.maxCurvAhead(prog, 60) < 0.02;
    if (car.input.boost) {
      car.input.throttle = 1;
      car.input.brake = 0;
      car.topOverride = undefined;
    }
    if (!film.catDone && toCat < 92) {
      film.catDone = true;
      const lead = 3.1;
      this.cat = { c: catCrossings[0], t0: this.time, lead };
      film.clearAt = lead + 1.5;
      film.cockpitAt = raceTime + 1.2;
      film.cockpitUntil = raceTime + lead + 2.1;
    }
    if (film.cockpitAt && raceTime > film.cockpitAt) {
      film.cockpitAt = 0;
      film.cockpit = true;
    }
    if (film.cockpit && raceTime > film.cockpitUntil) film.cockpit = false;
  }

  /** Occasionally send the cat across the track ahead of the player (normal races only). */
  sendCat(dt) {
    this.nextCat -= dt;
    if (this.nextCat > 0 || this.catActive()) return;
    const player = this.race.player;
    const playerProg = route.mod(player.prog);
    let crossing = null;
    let bestDist = 1e9;
    for (let i = 0; i < catCrossings.length; i++) {
      let dist = catRouteProgress[i] - playerProg;
      if (dist < 0) dist += route.len;
      if (dist > 60 && dist < bestDist) {
        bestDist = dist;
        crossing = catCrossings[i];
      }
    }
    if (!crossing || bestDist > 240) {
      this.nextCat = 2;
      return;
    }
    this.cat = {
      c: crossing,
      t0: this.time,
      lead: Math.max(1, bestDist / Math.max(20, player.speed) - 0.2),
    };
    this.nextCat = 16 + this.rnd() * 10;
  }

  /** Advance one fixed physics step. */
  step(dt, input) {
    snapshotPoses(this.race.cars); // previous pose for render interpolation (no effect on the sim)
    this.time += dt;
    obstacles.updateBall(this.time);
    const race = this.race;
    if (!this.demo && race.state === "racing") this.sendCat(dt);
    race.step(dt, input);
    this.tracker?.update(race.player, race);
    this.drift?.update(race.player, dt);
    obstacles.updateCat(this.time, this.cat, race.player, !this.demo);
  }
}
