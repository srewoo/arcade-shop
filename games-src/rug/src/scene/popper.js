// "Popper": drives the rug-to-3D "pop up" wave. Every scenery/obstacle item has an `apply(level, scaleY, ...)`
// callback; the popper decides, per item, how far along the wave it is (distance from origin / speed).
import { clamp, popInOvershoot, popOutShrink } from "../util/math.js";

export class Popper {
  /** @param {Array} items poppable items {x,z,group,apply,...} (minified class `ew`) */
  constructor(items) {
    this.items = items;
    this.mode = "flat"; // "flat" | "full" | "up" | "down"
    this.t0 = 0;
    this.ox = 0;
    this.oz = 0;
    this.speed = 85; // wave speed, world units / second
    this.dur = 0.75; // per-item animation duration
    this.maxDist = 1;
    this.lastLevel = -1;
  }

  setFlat() {
    this.mode = "flat";
  }

  setFull() {
    this.mode = "full";
  }

  /** Start a wave from origin (ox,oz) at time t0. carLead shifts physics queries ahead in time. */
  start(mode, t0, ox, oz, speed = 85, dur = 0.75, carLead = 0) {
    this.carLead = carLead;
    this.mode = mode;
    this.t0 = t0;
    this.ox = ox;
    this.oz = oz;
    this.speed = speed;
    this.dur = dur;
    let maxDist = 1;
    for (const item of this.items) maxDist = Math.max(maxDist, Math.hypot(item.x - ox, item.z - oz));
    this.maxDist = maxDist;
  }

  /** Total wave duration in seconds. */
  get length() {
    return this.maxDist / this.speed + this.dur + 0.1;
  }

  localT(t, dist) {
    return (t - this.t0 - dist / this.speed) / this.dur;
  }

  /** Eased height level (0..1) of a point at time t; used for physics (e.g. ramps). */
  levelAt(t, x, z) {
    if (this.mode === "flat") return 0;
    if (this.mode === "full") return 1;
    const u = clamp(this.localT(t + (this.carLead || 0), Math.hypot(x - this.ox, z - this.oz)), 0, 1);
    return this.mode === "up" ? popInOvershoot(u) : popOutShrink(u);
  }

  update(t) {
    for (const item of this.items) {
      let level;
      let scaleY;
      let raw = 1;
      if (this.mode === "flat") {
        level = 0;
        scaleY = 0;
      } else if (this.mode === "full") {
        level = 1;
        scaleY = 1;
      } else {
        const dist = Math.hypot((item.waveX ?? item.x) - this.ox, (item.waveZ ?? item.z) - this.oz);
        const a = this.localT(t, dist);
        raw = clamp(a, 0, 1);
        if (this.mode === "up") {
          level = popInOvershoot(clamp(a * 1.15, 0, 1));
          scaleY = popInOvershoot(clamp(a * 1.3 - 0.3, 0, 1));
        } else {
          scaleY = popOutShrink(clamp(a * 1.3, 0, 1));
          level = popOutShrink(clamp(a * 1.15 - 0.15, 0, 1));
        }
      }
      item.level = item.afterLanding && raw < item.afterLanding ? 0 : level;
      if (item.group) {
        const visible = level > 0.004 || scaleY > 0.004;
        item.group.visible = visible;
        if (visible || item.lastS !== level) item.apply(level, scaleY, raw, this.mode);
      }
      item.lastS = level;
    }
  }
}
