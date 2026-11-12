// Procedurally animated dino (bundle class `Gl`).  A tree of pivots/bones is posed every frame from a
// run-phase + blend factors (run / duck / air) plus three secondary-motion springs.  On crash the meshes are
// detached from the rig and handed to the physics ragdoll, together with per-bone velocities estimated here.
import * as THREE from 'three';
import { PALETTE as C } from '../config.js';
import { clamp, damp, lerp, rand, Spring } from '../util.js';
import { bake, mergeAndShade, box, PROP_MATERIAL } from '../gfx/geometry.js';
import { BONES, REST_PITCH, FOOT_CONTACTS } from './skeleton.js';
import { PART_BUILDERS } from './parts.js';
import { animateFace } from './face.js';

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _dq = new THREE.Quaternion();
const MAX_ANGVEL = 22;

export class DinoRig {
  constructor(scene) {
    this.scene = scene;
    this.rig = new THREE.Group();
    scene.add(this.rig);
    /** name -> {def,pivot,bone,mesh,prevPos,prevQuat,vel,angVel} */
    this.parts = {};
    this.list = [];
    const geometryCache = {};
    for (const def of BONES) {
      const pivot = new THREE.Object3D();
      pivot.position.set(...def.at);
      const bone = new THREE.Object3D();
      bone.position.set(...def.off);
      pivot.add(bone);
      (def.parent ? this.parts[def.parent].bone : this.rig).add(pivot);
      const mesh = new THREE.Mesh((geometryCache[def.mesh] ??= PART_BUILDERS[def.mesh]()), PROP_MATERIAL);
      mesh.castShadow = true;
      mesh.name = def.name;
      mesh.scale.setScalar(def.scale ?? 1);
      bone.add(mesh);
      const part = {
        def, pivot, bone, mesh,
        prevPos: new THREE.Vector3(), prevQuat: new THREE.Quaternion(),
        vel: new THREE.Vector3(), angVel: new THREE.Vector3(),
      };
      this.parts[def.name] = part;
      this.list.push(part);
    }
    this._buildFace();
    // Secondary-motion springs (stiffness, damping)
    this.squash = new Spring(190, 17);
    this.nod = new Spring(110, 9);
    this.whip = new Spring(80, 7);
    this.jawKick = new Spring(140, 10);
    this.onStep = null; // (side:-1|1, worldPos) => void
    this._k = { t: 0, run: 0, duck: 0, air: 0, idle: 1, ph: 0, squash: 0, nod: 0, whip: 0, breath: 0, look: 0 }; // pose blend scratch
    this._torsoPitch = 0;
    this._boxes = [[-0.8, 0.55, 0, 0], [0, 0, 0, 0]]; // scratch [zMin, zMax, yMin, yMax] boxes for hitboxes()
    this.ragdoll = false;
    this.reset();
  }

  _buildFace() {
    const head = this.parts.head.mesh;
    const pupilMat = new THREE.MeshBasicMaterial({ color: 1776411 });
    this.jaw = new THREE.Mesh(PART_BUILDERS.jaw(), PROP_MATERIAL);
    this.jaw.position.set(0, -0.14, 0.3);
    this.jaw.castShadow = true;
    head.add(this.jaw);
    const pupilGeo = new THREE.IcosahedronGeometry(0.062, 1);
    this.pupils = [-1, 1].map((side) => {
      const mesh = new THREE.Mesh(pupilGeo, pupilMat);
      head.add(mesh);
      return { mesh, side, ang: rand(0, 6.28), spin: 0 };
    });
    const tailGeo = mergeAndShade([bake(box(0.09, 0.02, 0.42), C.band, { pos: [0, 0, 0.21] })]);
    this.bandTails = [-1, 1].map((side) => {
      const m = new THREE.Mesh(tailGeo, PROP_MATERIAL);
      m.position.set(0.04 * side, 0.27, 0.63);
      m.castShadow = true;
      head.add(m);
      return m;
    });
  }

  reset() {
    this.attach();
    this.time = 0;
    this.phase = 0; // run-cycle phase (cycles)
    this.stepCount = 0;
    this.duckT = 0; // blend 0..1
    this.airT = 0;
    this.runT = 0;
    this.rootH = 1.5; // hip height above ground
    this.fresh = true; // first frame after reset: skip smoothing / velocity estimation
    this.squash.reset();
    this.nod.reset();
    this.whip.reset();
    this.jawKick.reset();
    for (const p of this.pupils) p.spin = 0;
  }

  jumped() {
    this.nod.kick(3.2);
    this.whip.kick(2.6);
    this.squash.kick(-2.5);
  }
  landed(impactSpeed) {
    this.squash.kick(clamp(impactSpeed * 0.3, 2, 7));
    this.nod.kick(-4.5);
    this.whip.kick(3.5);
  }
  /** Eyes spin and jaw flaps; strength 0..1 */
  knock(strength) {
    for (const p of this.pupils) p.spin = rand(14, 30) * (Math.random() < 0.5 ? -1 : 1) * (0.5 + strength);
    this.jawKick.kick(rand(4, 9) * (0.4 + strength));
  }

  /** @param pose {mode:'run'|'idle', z, y, vy, grounded, duck, speed} */
  update(dt, pose) {
    const t = (this.time += dt);
    const running = pose.mode === 'run';
    this.runT = damp(this.runT, +!!running, 7, dt);
    this.duckT = damp(this.duckT, running && pose.duck && pose.grounded ? 1 : 0, 17, dt);
    this.airT = damp(this.airT, +!pose.grounded, 16, dt);
    const run = this.runT, duck = this.duckT, air = this.airT, idle = 1 - run;
    const cadence = (2.2 + pose.speed * 0.05) * (1 + 0.45 * duck) * (1 + 0.5 * air);
    this.phase += cadence * Math.PI * 2 * dt * run;
    // blend factors shared by the pose helpers below (one reused object, no per-frame allocation)
    const k = this._k;
    k.t = t; k.run = run; k.duck = duck; k.air = air; k.idle = idle; k.ph = this.phase;
    k.squash = this.squash.update(dt); k.nod = this.nod.update(dt); k.whip = this.whip.update(dt);
    k.breath = Math.sin(t * 2.1) * idle;
    k.look = Math.sin(t * 0.55) * 0.45 * idle;
    this.animateTorsoAndLegs(k, pose);
    this.animateHeadAndTail(k);
    this.animateArms(k);
    this.plantFeet(dt, pose, running);
    this._estimateBoneVelocities(dt);
    this.fresh = false;
    this.updateFace(dt, { r: run, a: air, d: duck, ph: this.phase });
  }

  /** Torso pitch / sway and the leg swing (thigh, shin, foot) for the run, duck and air blends. */
  animateTorsoAndLegs(k, pose) {
    const { run, duck, air, squash, breath, ph } = k;
    const P = this.parts;
    const torsoPitch =
      lerp(REST_PITCH.torso, -0.12, duck) -
      0.07 * run * clamp((pose.speed - 13) / 18, 0, 1) +
      air * clamp(pose.vy * 0.02, -0.28, 0.32) +
      0.03 * Math.sin(2 * ph) * run +
      0.015 * breath;
    this._torsoPitch = torsoPitch;
    P.torso.pivot.rotation.set(torsoPitch, 0.1 * Math.sin(ph + 1.2) * run, 0.09 * Math.sin(ph) * run);
    for (const side of [-1, 1]) {
      const s = side < 0 ? 'L' : 'R';
      const legPhase = ph + (side < 0 ? 0 : Math.PI);
      const swing = Math.sin(legPhase);
      const lift = Math.max(0, Math.cos(legPhase));
      const stride = lerp(0.92, 0.5, duck) * lerp(1, 0.8, air);
      const thigh = REST_PITCH.thigh + run * (stride * swing + 0.1) + duck * 0.95 + squash * 0.35 + air * 0.3;
      const shin = lerp(REST_PITCH.shin, -1 - 0.95 * lift, run) - duck * 1.1 - squash * 0.6 - air * 0.35;
      const foot = run * (0.5 * swing - 0.35 * lift) * (1 - 0.6 * duck);
      P[`thigh${s}`].pivot.rotation.set(thigh, 0, side * 0.06 * run * lift);
      P[`shin${s}`].pivot.rotation.set(shin, 0, 0);
      // keep the foot roughly level: cancel accumulated pitch of torso+thigh+shin
      P[`foot${s}`].pivot.rotation.set(foot - (torsoPitch + thigh + shin), 0, 0);
    }
  }

  /** Neck, head and the three tail segments. */
  animateHeadAndTail(k) {
    const { t, run, duck, air, idle, whip, nod, breath, look, ph } = k;
    const P = this.parts;
    const neckPitch = lerp(REST_PITCH.neck, 0.2, duck) + run * 0.09 * Math.sin(2 * ph - 0.9) + nod * 0.5 - air * 0.12 + 0.02 * breath;
    P.neck.pivot.rotation.set(neckPitch, run * 0.06 * Math.sin(ph - 0.6) + look * 0.4, 0);
    const headPitch = -(this._torsoPitch + neckPitch) + run * 0.07 * Math.sin(2 * ph - 1.7) + nod * 0.6 + air * 0.18 - duck * 0.05;
    P.head.pivot.rotation.set(headPitch, run * 0.08 * Math.sin(ph - 1) + look * 0.6, run * 0.07 * Math.sin(ph - 0.4));
    for (let i = 0; i < 3; i++) {
      const lag = 0.9 * (i + 1);
      const pitch =
        REST_PITCH.tail[i] + run * 0.07 * Math.sin(2 * ph - lag) + whip * (0.22 + 0.14 * i) - duck * (i === 0 ? 0.14 : 0.04) - air * 0.1;
      const yaw = run * (0.16 + 0.07 * i) * Math.sin(ph - lag) + idle * 0.1 * Math.sin(t * 1.5 - lag);
      P[`tail${i + 1}`].pivot.rotation.set(pitch, yaw, 0);
    }
  }

  animateArms(k) {
    const { t, run, air, idle, ph } = k;
    const P = this.parts;
    for (const side of [-1, 1]) {
      const s = side < 0 ? 'L' : 'R';
      const pitch =
        REST_PITCH.arm + run * 0.75 * Math.sin(2 * ph + side * 1.3) + air * (1.3 + 0.5 * Math.sin(t * 38 + side)) + idle * 0.12 * Math.sin(t * 2.3 + side);
      const roll = side * (0.22 + run * 0.32 * Math.abs(Math.sin(1.5 * ph + side)) + air * 0.9);
      P[`arm${s}`].pivot.rotation.set(pitch, 0, roll);
    }
  }

  /** Place the rig on the track, drop the hips onto the lowest foot contact point and fire footstep callbacks. */
  plantFeet(dt, pose, running) {
    const P = this.parts;
    const ph = this.phase;
    this.rig.position.set(0.05 * Math.sin(ph) * this.runT, 0, pose.z);
    this.rig.updateMatrixWorld(true);
    let lowest = Infinity;
    for (const s of ['L', 'R']) {
      const m = P[`foot${s}`].bone.matrixWorld;
      for (const c of FOOT_CONTACTS) lowest = Math.min(lowest, _pos.copy(c).applyMatrix4(m).y);
    }
    this.rootH = this.fresh ? -lowest : pose.grounded ? damp(this.rootH, -lowest, 45, dt) : damp(this.rootH, 1.42, 10, dt);
    this.rig.position.y = pose.y + this.rootH;
    this.rig.updateMatrixWorld(true);
    const stepIndex = Math.floor((ph - Math.PI / 2) / Math.PI);
    if (stepIndex !== this.stepCount) {
      this.stepCount = stepIndex;
      if (running && pose.grounded && this.onStep) {
        const side = stepIndex % 2 === 0 ? -1 : 1;
        this.onStep(side, P[side < 0 ? 'footL' : 'footR'].bone.getWorldPosition(_pos));
      }
    }
  }

  /** Finite-difference world linear/angular velocity of every bone (seeds the ragdoll on crash). */
  _estimateBoneVelocities(dt) {
    for (const p of this.list) {
      p.bone.getWorldPosition(_pos);
      p.bone.getWorldQuaternion(_quat);
      if (this.fresh || dt <= 0) {
        p.vel.set(0, 0, 0);
        p.angVel.set(0, 0, 0);
      } else {
        p.vel.copy(_pos).sub(p.prevPos).divideScalar(dt);
        _dq.copy(p.prevQuat).invert().premultiply(_quat);
        if (_dq.w < 0) _dq.set(-_dq.x, -_dq.y, -_dq.z, -_dq.w);
        const s = Math.hypot(_dq.x, _dq.y, _dq.z);
        if (s > 1e-6) {
          const angle = 2 * Math.atan2(s, _dq.w);
          p.angVel.set(_dq.x, _dq.y, _dq.z).multiplyScalar(angle / s / dt);
          if (p.angVel.length() > MAX_ANGVEL) p.angVel.setLength(MAX_ANGVEL);
        } else p.angVel.set(0, 0, 0);
      }
      p.prevPos.copy(_pos);
      p.prevQuat.copy(_quat);
    }
  }

  /** Jaw / pupils / headband tails (see face.js).  `blend` is only needed outside ragdoll mode. */
  updateFace(dt, blend) {
    animateFace(this, dt, blend);
  }

  /**
   * Player hit boxes as [zMin, zMax, yMin, yMax]: z offsets are relative to the player's z
   * (negative = in front / the direction of travel), y values are absolute world heights.
   * Consumed by ObstacleField.hit().
   */
  hitboxes(y, grounded) {
    const d = this.duckT;
    const [body, head] = this._boxes; // reused every call: callers only read them within the frame
    body[2] = y + (grounded ? 0.3 : 0.45);
    body[3] = y + lerp(2.05, 1.5, d);
    head[0] = lerp(-2, -2.25, d);
    head[1] = lerp(-0.7, -0.9, d);
    head[2] = y + lerp(2, 0.9, d);
    head[3] = y + lerp(2.92, 1.68, d);
    return this._boxes;
  }

  /** Hand meshes over to the physics world (they become scene children, keeping world transforms). */
  detach() {
    if (this.ragdoll) return;
    this.ragdoll = true;
    this.rig.updateMatrixWorld(true);
    for (const p of this.list) this.scene.attach(p.mesh);
  }

  attach() {
    this.ragdoll = false;
    for (const p of this.list) {
      p.bone.add(p.mesh);
      p.mesh.position.set(0, 0, 0);
      p.mesh.quaternion.identity();
      p.mesh.scale.setScalar(p.def.scale ?? 1);
    }
  }
}
