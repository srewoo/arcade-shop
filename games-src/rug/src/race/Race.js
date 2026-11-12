/**
 * Race session logic: 4 cars on a grid, countdown, racing, standings (original: class Ww).
 * Exposed in the game as `app.session.race`.
 */
import { route } from "../world/layoutSelect.js";
import { TRACK } from "../world/trackSamples.js";
import { STARTING_GRID } from "../world/layoutSelect.js";
import { Car } from "./Car.js";
import { resolveCarCarCollisions } from "./carCollision.js";
import { driveAi, AI_PROFILES, AI_FINISHED_PROFILE } from "./aiDriver.js";
import { boostPads, applyBoostPads } from "./boostPads.js";
import { buildOpponentProfiles } from "../logic/difficulty.js";

const NO_INPUT = { throttle: 0, brake: 0, steer: 0, boost: false, jump: false };
const CAR_TYPES = ["coupe", "pickup", "van", "formula"];
/** Two extra grid rows behind the original four slots (used when there are more than 3 opponents). */
const EXTRA_GRID = [
  { s: -24, lat: -3.3 },
  { s: -24, lat: 3.3 },
];
const GRID = [...STARTING_GRID, ...EXTRA_GRID];
/** Player keeps original slot 3 (so times stay comparable); AI 1-3 take slots 0-2, AI 4-5 start behind. */
const gridSlot = (i) => GRID[i === 0 ? 3 : i <= 3 ? i - 1 : i];

export class Race {
  /**
   * @param {object} o
   * @param {number} [o.laps=3]
   * @param {boolean} [o.demo]   attract-mode: ghost cars, AI slowed to 0.83+0.012*i of top, no boost
   * @param {object} o.env       {mask, colliders}
   * @param {Function|null} [o.pilot] custom driver for the player car (pilot(car, dt) fills car.input)
   * @param {boolean} [o.menu]   title-screen background race: ghost cars, AI-driven "player"
   * @param {number} [o.opponents=3]  AI cars, 0-5
   * @param {string} [o.difficulty="normal"]  "easy" | "normal" | "hard" | "insane" (scales AI_PROFILES)
   * @param {object[]} [o.pads]   boost pad set (default: the original five per lap)
   */
  constructor({ laps = 3, demo = false, env, pilot = null, menu = false, opponents = 3, difficulty = "normal", pads = boostPads }) {
    this.menu = menu;
    this.opponents = opponents;
    this.difficulty = difficulty;
    this.pads = pads;
    this.padOff = pads.map(() => 0); // per-pad re-arm timers
    this.laps = laps;
    this.demo = demo;
    this.env = env;
    this.pilot = pilot;
    this.state = "grid"; // grid -> countdown -> racing -> finished
    this.countdown = 0;
    this.time = 0; // race clock (starts at GO)
    this.clock = 0; // wall clock since creation
    this.cars = Array.from({ length: 1 + opponents }, (_, i) => new Car(i, CAR_TYPES[i % CAR_TYPES.length], i === 0));
    this.player = this.cars[0];
    this.cars.forEach((car, i) => {
      const slot = gridSlot(i);
      car.laps = laps;
      car.placeOnTrack(slot.s, slot.lat);
      car.ghost = demo || menu;
    });
    const demoScale = (k) => (demo ? 0.83 + k * 0.012 : 1);
    const profiles = buildOpponentProfiles(AI_PROFILES, opponents, difficulty);
    for (let i = 1; i <= opponents; i++) {
      const profile = profiles[i - 1];
      this.cars[i].ai = { top: profile.top * demoScale(i - 1), aLat: profile.aLat, rubber: profile.rubber };
    }
    if (menu) this.player.ai = { top: 33, aLat: 84 };
    this.finishOrder = [];
    this.events = [];
    this.updatePlaces();
  }

  startCountdown(seconds = 3) {
    this.state = "countdown";
    this.countdown = seconds;
    this.countdownTotal = seconds;
  }

  /** One fixed physics step. `input` is the human player's input. */
  step(dt, input) {
    this.clock += dt;
    for (let i = 0; i < this.padOff.length; i++) this.padOff[i] = Math.max(0, this.padOff[i] - dt);
    if (this.state === "countdown") {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.state = "racing";
        this.time = 0;
      }
    } else if (this.state === "racing" || this.state === "finished") {
      this.time += dt;
    }
    const frozen = this.state === "grid" || this.state === "countdown";
    for (const car of this.cars) {
      if (car.grabbed) continue;
      let carInput;
      if (frozen) {
        carInput = NO_INPUT;
        car.vx = car.vz = 0;
      } else if (this.pilot && car === this.player) {
        this.pilot(car, dt);
        carInput = car.input;
      } else if (car.ai) {
        const profile = car.finished ? AI_FINISHED_PROFILE : car.ai;
        driveAi(
          car,
          this.cars,
          {
            dt,
            top: profile.top,
            aLat: profile.aLat,
            rubber: profile.rubber,
            jumpBricks: !this.menu,
            boost: !this.menu && !this.demo && !car.finished,
          },
          this.player.prog,
        );
        carInput = car.input;
      } else {
        carInput = input;
      }
      car.step(dt, carInput, this.env);
      if (!frozen && !this.menu) applyBoostPads(car, dt, this.padOff, this.pads);
    }
    resolveCarCarCollisions(this.cars);
    if (this.state === "racing" || this.state === "finished") {
      for (const car of this.cars) {
        if (!car.finished && car.prog >= this.laps * route.len) {
          car.finished = true;
          car.finishTime = this.time;
          this.finishOrder.push(car);
          car.place = this.finishOrder.length;
          if (car === this.player) this.state = "finished";
        }
      }
    }
    this.updatePlaces();
  }

  /** Finished cars first (in finishing order), then the rest sorted by progress. */
  updatePlaces() {
    const running = this.cars.filter((c) => !c.finished).sort((a, b) => b.prog - a.prog);
    const order = [...this.finishOrder, ...running];
    order.forEach((car, i) => {
      car.position = i + 1;
    });
    this.order = order;
  }

  /** Results rows; unfinished cars get an estimated time (remaining track length / 30 units per s). */
  standings() {
    return this.order.map((car) => {
      let time = car.finished ? car.finishTime : null;
      if (time === null) time = this.time + Math.max(0, this.laps * TRACK.length - car.prog) / 30;
      return { car, time, estimated: !car.finished };
    });
  }
}
