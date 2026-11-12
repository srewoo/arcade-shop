/**
 * Camera rig (original: class Xw, instance `Ot`, exposed as window.__rug.rig).
 *
 * Modes (this.mode):
 *   "top"     overhead view framing the whole rug (title screen; fov 30)
 *   "chase"   third-person behind the car; yaw follows velocity direction half-way
 *   "cockpit" first-person at car.eye
 *   "trans"   dive (top -> chase) / rise (chase -> top) along a cubic Bezier, eased
 *   "grab"    camera hangs where it was while the "hand" lifts the car (outro)
 *   "garage"  orbit around the car while the garage menu is open, blending from/to "top"
 *   "closeup" fixed debug close-up
 * "chase" has three framings selected by `view`: "chase" (original), "far" (higher/further back) and
 * "topdown" (nearly overhead, follows the car); the C key cycles them and "cockpit".
 * Public knobs set from outside: vertical (portrait layout), shake, menuOpen/menuRoom (shift view
 * to leave room for a side menu), garageT/garageDir/garageA, others (cars to hop over), cockpitLift.
 */
import * as THREE from "three";
import { clamp, lerp, smoothstep, easeInOutCubic } from "../util/math.js";
import { wrapAngle } from "../util/angles.js";
import { RUG, RUG_SHAPE } from "../world/layoutSelect.js";
import { CAMERA_FX } from "../config/camera.js";

/** Extent the top view must fit: the clip shape for shaped rugs, else the whole rug. */
const FIT_W = RUG_SHAPE ? (RUG_SHAPE.rx ?? RUG_SHAPE.hx) * 2 : RUG.W;
const FIT_H = RUG_SHAPE ? (RUG_SHAPE.rz ?? RUG_SHAPE.hz) * 2 : RUG.H;

const UP = new THREE.Vector3(0, 1, 0);
// scratch vectors (shared, returned by transPose - callers must not hold on to them)
const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const tmpUp = new THREE.Vector3();

/** Cubic Bezier through control points p0..p3 at t, written into `out`. */
function cubicBezier3(out, p0, p1, p2, p3, t) {
  const u = 1 - t;
  out
    .set(0, 0, 0)
    .addScaledVector(p0, u * u * u)
    .addScaledVector(p1, 3 * u * u * t)
    .addScaledVector(p2, 3 * u * t * t)
    .addScaledVector(p3, t * t * t);
  return out;
}

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.vertical = false;
    this.mode = "top";
    this.view = "chase"; // framing used by mode "chase": "chase" | "far" | "topdown"
    this.chasePos = new THREE.Vector3();
    this.chaseLook = new THREE.Vector3();
    this.chaseFov = 60;
    this.boostAmt = 0;
    this.trans = null;
    this.shake = 0;
    /** 1 = normal; 0 = Reduce motion (no shake, no boost jitter). */
    this.motionScale = 1;
  }

  /** Tuning per orientation. dist/height/ahead/lookH: chase offsets behind/above/looking ahead of the car. */
  params() {
    const base = this.vertical
      ? { dist: 12, height: 6.5, ahead: 6.5, lookH: 0.9, fov: 80, boostFov: 94, cockpitFov: 88, topFov: 30 }
      : { dist: 10.4, height: 4.5, ahead: 7.8, lookH: 1.15, fov: 57, boostFov: 73, cockpitFov: 66, topFov: 30 };
    if (this.view === "far") return { ...base, dist: base.dist * 1.8, height: base.height * 2.1, ahead: base.ahead * 1.3, lookH: 0.6 };
    if (this.view === "topdown") return { ...base, dist: 3.5, height: this.vertical ? 62 : 48, ahead: 7, lookH: 0, fov: 46, boostFov: 56 };
    return base;
  }

  /** Overhead pose that fits the rug (+8 margin) into the viewport for the current aspect. */
  topPose() {
    const p = this.params();
    const aspect = this.camera.aspect;
    const margin = 8;
    const fov = THREE.MathUtils.degToRad(p.topFov);
    let fitSize;
    if (this.vertical) fitSize = Math.max(FIT_W + margin, (FIT_H + margin) / aspect);
    else fitSize = Math.max(FIT_H + margin, (FIT_W + margin) / aspect);
    const up = this.vertical ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, -1);
    const room = (this.menuK || 0) * (this.menuRoom || 0);
    const size = fitSize / (1 - room);
    const shift = up.clone().multiplyScalar((-size * room) / 2);
    return {
      pos: new THREE.Vector3(0, size / 2 / Math.tan(fov / 2), 0).add(shift),
      look: shift.clone(),
      up,
      fov: p.topFov,
    };
  }

  /** Desired chase camera position/target for car `car`; boost pulls the camera back 2.4 and up 0.5. */
  chaseDesired(car, boost, outPos, outLook, yaw = car.a) {
    const p = this.params();
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const dist = p.dist + boost * 2.4;
    outPos.set(car.x - cos * dist, p.height + boost * 0.5 + car.y * 0.45, car.z - sin * dist);
    outLook.set(car.x + cos * p.ahead, p.lookH + car.y * 0.5, car.z + sin * p.ahead);
  }

  startGrab(car) {
    if (this.mode === "cockpit") {
      this.snapChase(car);
      this.grabPos = this.chasePos.clone();
    } else {
      this.grabPos = this.camera.position.clone();
    }
    this.grabK = 0;
    this.mode = "grab";
  }

  snapChase(car) {
    this.yaw = car.a;
    this.chaseDesired(car, 0, this.chasePos, this.chaseLook);
    this.chaseFov = this.params().fov;
  }

  /** Apply a pose to the THREE camera; near/far scale with altitude. */
  /** Raise the shake to at least `amount`; with Reduce motion (motionScale 0) it stays 0. */
  addShake(amount) {
    if (this.motionScale > 0) this.shake = Math.max(this.shake, amount);
  }

  apply(pos, look, up, fov) {
    const cam = this.camera;
    cam.position.copy(pos);
    cam.up.copy(up);
    cam.lookAt(look);
    if (Math.abs(cam.fov - fov) > 0.001) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    const height = pos.y;
    const near = clamp(height * 0.035, 0.05, 20);
    const far = Math.max(1200, height * 4);
    if (cam.near !== near || cam.far !== far) {
      cam.near = near;
      cam.far = far;
      cam.updateProjectionMatrix();
    }
  }

  /** Start the top -> chase dive over `duration` s beginning at time `now`. */
  startDive(now, duration, car) {
    const top = this.topPose();
    const endPos = new THREE.Vector3();
    const endLook = new THREE.Vector3();
    this.chaseDesired(car, 0, endPos, endLook);
    const cos = Math.cos(car.a);
    const sin = Math.sin(car.a);
    const b1 = new THREE.Vector3(lerp(top.pos.x, car.x, 0.35), top.pos.y * 0.5, lerp(top.pos.z, car.z, 0.35));
    const b2 = new THREE.Vector3(endPos.x - cos * 26, endPos.y + 34, endPos.z - sin * 26);
    this.trans = { type: "dive", t0: now, dur: duration, top, endPos, endLook, b1, b2, endFov: this.params().fov };
    this.mode = "trans";
  }

  /** Start the chase -> top rise. */
  startRise(now, duration, car) {
    const top = this.topPose();
    const startPos = this.camera.position.clone();
    const startLook = this.chaseLook.clone();
    const startFov = this.camera.fov;
    const cos = Math.cos(car.a);
    const sin = Math.sin(car.a);
    const b1 = new THREE.Vector3(startPos.x - cos * 18, startPos.y + 36, startPos.z - sin * 18);
    const b2 = new THREE.Vector3(lerp(top.pos.x, startPos.x, 0.3), top.pos.y * 0.55, lerp(top.pos.z, startPos.z, 0.3));
    this.trans = { type: "rise", t0: now, dur: duration, top, startPos, startLook, startFov, b1, b2, startUp: this.camera.up.clone() };
    this.mode = "trans";
  }

  /** Pose during a dive/rise at time `now`; component curves are staggered smoothsteps. */
  transPose(now) {
    const tr = this.trans;
    const t = clamp((now - tr.t0) / tr.dur, 0, 1);
    const e = easeInOutCubic(t);
    if (tr.type === "dive") {
      cubicBezier3(tmpPos, tr.top.pos, tr.b1, tr.b2, tr.endPos, e);
      tmpLook.copy(tr.top.look).lerp(tr.endLook, smoothstep(0, 0.8, e));
      tmpUp.copy(tr.top.up).lerp(UP, smoothstep(0.15, 0.85, e)).normalize();
      const fov = lerp(tr.top.fov, tr.endFov, smoothstep(0.2, 1, e));
      return { pos: tmpPos, look: tmpLook, up: tmpUp, fov, done: t >= 1 };
    }
    cubicBezier3(tmpPos, tr.startPos, tr.b1, tr.b2, tr.top.pos, e);
    tmpLook.copy(tr.startLook).lerp(tr.top.look, smoothstep(0.15, 1, e));
    tmpUp.copy(UP).lerp(tr.top.up, smoothstep(0.2, 0.9, e)).normalize();
    const fov = lerp(tr.startFov, tr.top.fov, smoothstep(0, 0.8, e));
    return { pos: tmpPos, look: tmpLook, up: tmpUp, fov, done: t >= 1 };
  }

  /**
   * Per-frame update.
   * @param dt frame time  @param now clock time (for transitions)  @param car focus car
   * @param boostTarget 0..1 boost amount (widens fov, pulls camera back)
   */
  update(dt, now, car, boostTarget) {
    const p = this.params();
    this.boostAmt += (boostTarget - this.boostAmt) * Math.min(1, dt * 5);
    this.menuK = (this.menuK || 0) + ((this.menuOpen ? 1 : 0) - (this.menuK || 0)) * Math.min(1, dt * 9);

    if (this.mode === "grab") {
      this.grabK = Math.min(1, this.grabK + dt * 3);
      tmpLook.set(car.x, Math.min(car.y, 14) + 1, car.z);
      this.chaseLook.lerp(tmpLook, 1 - Math.exp(-dt * 7));
      this.apply(this.grabPos, this.chaseLook, UP, this.chaseFov);
      return;
    }
    if (this.mode === "garage") {
      // garageT 0..1 = blend from top view to orbit (0.85 s); garageA = orbit angle (0.42 rad/s)
      this.garageT = clamp(this.garageT + (dt * this.garageDir) / 0.85, 0, 1);
      this.garageA += dt * 0.42;
      const k = easeInOutCubic(this.garageT);
      const top = this.topPose();
      const radius = this.vertical ? 15 : 12.5;
      tmpPos
        .set(car.x + Math.cos(this.garageA) * radius, this.vertical ? 4.6 : 3.3, car.z + Math.sin(this.garageA) * radius)
        .lerp(top.pos, 1 - k);
      tmpLook.set(car.x, this.vertical ? 0.2 : -0.1, car.z).lerp(top.look, 1 - k);
      tmpUp.copy(top.up).lerp(UP, k).normalize();
      this.apply(tmpPos, tmpLook, tmpUp, lerp(top.fov, this.vertical ? 46 : 38, k));
      if (this.garageDir < 0 && this.garageT <= 0) this.mode = "top";
      return;
    }
    if (this.mode === "top") {
      const top = this.topPose();
      this.apply(top.pos, top.look, top.up, top.fov);
      return;
    }
    if (this.mode === "trans") {
      const pose = this.transPose(now);
      this.apply(pose.pos, pose.look, pose.up, pose.fov);
      if (pose.done) {
        if (this.trans.type === "dive") {
          this.mode = "chase";
          this.snapChase(car);
        } else {
          this.mode = "top";
        }
        this.trans = null;
      }
      return;
    }
    if (this.mode === "chase") {
      // target yaw: halfway between car heading and velocity direction (above 4 u/s)
      const speed = Math.hypot(car.vx, car.vz);
      const targetYaw = car.a + wrapAngle((speed > 4 ? Math.atan2(car.vz, car.vx) : car.a) - car.a) * 0.5;
      this.yaw = wrapAngle(this.yaw + wrapAngle(targetYaw - this.yaw) * (1 - Math.exp(-dt * 7.5)));
      this.chaseDesired(car, this.boostAmt, this.chasePos, this.chaseLook, this.yaw);
      this.chaseFov = lerp(p.fov, p.boostFov, this.boostAmt);
      const pos = tmpUp.copy(this.chasePos); // RE: original reuses the `up` scratch vector as a temp position
      // lift the camera over cars that are close behind it so they do not block the view
      let lift = 0;
      if (this.others && this.view === "chase") {
        for (const other of this.others) {
          if (other === car) continue;
          const d = Math.hypot(other.x - pos.x, other.z - pos.z);
          if (d < 6.5) lift = Math.max(lift, other.y + 2.6 + (6.5 - d) * 0.6 - pos.y);
        }
      }
      this.liftY = lerp(this.liftY || 0, lift, 1 - Math.exp(-dt * 8));
      pos.y += Math.max(0, this.liftY);
      // boost jitter + impact shake (shake decays 2.5/s)
      if (this.motionScale > 0) {
        pos.x += (Math.random() - 0.5) * this.boostAmt * CAMERA_FX.boostJitter * this.motionScale;
        pos.y += (Math.random() - 0.5) * this.boostAmt * CAMERA_FX.boostJitter * this.motionScale;
      }
      if (this.shake > 0) {
        if (this.motionScale > 0) {
          pos.x += (Math.random() - 0.5) * this.shake * this.motionScale;
          pos.y += (Math.random() - 0.5) * this.shake * 0.6 * this.motionScale;
        }
        this.shake = Math.max(0, this.shake - dt * CAMERA_FX.shakeDecayPerSecond);
      }
      this.apply(pos, this.chaseLook, UP, this.chaseFov);
    }
    if (this.mode === "cockpit") {
      const cos = Math.cos(car.a);
      const sin = Math.sin(car.a);
      const eye = car.eye; // [forward, up, right] offset from the car origin, set by the car model
      const rightX = -sin;
      const rightZ = cos;
      tmpPos.set(car.x + cos * eye[0] + rightX * eye[2], car.y + eye[1] + car.squash * 0.3, car.z + sin * eye[0] + rightZ * eye[2]);
      tmpLook.set(tmpPos.x + cos * 20, tmpPos.y + (this.cockpitLift || 0) - 0.9 + car.pitch * 8, tmpPos.z + sin * 20);
      this.apply(tmpPos, tmpLook, UP, p.cockpitFov + this.boostAmt * 10);
      this.snapChase(car);
      return;
    }
    if (this.mode === "closeup") {
      const cos = Math.cos(car.a);
      const sin = Math.sin(car.a);
      tmpPos.set(car.x + cos * 6.5 + -sin * 6.5, 2.6, car.z + sin * 6.5 + cos * 6.5);
      tmpLook.set(car.x + cos * 0.6, 1, car.z + sin * 0.6);
      this.apply(tmpPos, tmpLook, UP, 40);
    }
  }
}
