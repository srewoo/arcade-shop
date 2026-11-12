// Obstacles scattered on the rug: lego bricks, brick towers, a beach ball that rolls back and forth, a sofa
// standing on four legs (pops up/down as one platform) and a cat that walks across the rug.
// Returns poppable items (for Popper) plus collider descriptions consumed by car physics.
import * as THREE from "three";
import { clamp } from "../util/math.js";
import { legoBricks } from "../world/trackSamples.js";
import { BRICK_H, ball, sofaLegs, sofaBottom } from "../world/layoutSelect.js";
import { towersFiltered } from "../world/roadDistance.js";
import { buildBrickGeometry, legoMaterial } from "./legoBrick.js";
import { buildCat, solveCatLegIK } from "./cat.js";
import { makeBallTexture, makeSofaTopTexture } from "./obstacleTextures.js";

/** Cat root scale (minified `yr`). */
export const CAT_SCALE = 1.6;
/** Cat walking speed in world units / second (minified `Jd`). */
export const CAT_SPEED = 34;

const SOFA_LAND_PHASE = 0.72; // fraction of the "up" wave at which the sofa lands
const SOFA_PEAK = 190; // sofa jump peak height (minified x)

/** Sofa vertical offset as a function of wave progress p and mode (minified local `M`). */
function sofaHeight(p, mode) {
  if (mode === "down") return SOFA_PEAK * p * p;
  if (mode !== "up") return 0;
  if (p < SOFA_LAND_PHASE) {
    const z = p / SOFA_LAND_PHASE;
    return SOFA_PEAK * (1 - z * z);
  }
  const q = (p - SOFA_LAND_PHASE) / (1 - SOFA_LAND_PHASE);
  return 3.5 * Math.sin(Math.PI * q) * (1 - q);
}

/**
 * Build all obstacles (minified `aw`).
 * @param {THREE.Scene} scene
 * @param {THREE.Texture} fiberTexture rug fibre texture (for the cat fur)
 * @returns {{group, poppables, colliders, bricks, cat, catLife, updateBall, updateCat, onSofaLand?}}
 */
export function buildObstacles(scene, fiberTexture) {
  const poppables = [];
  const colliders = [];
  const group = new THREE.Group();
  scene.add(group);
  const bricks = [];

  // --- loose lego bricks (rotated boxes) ---
  for (const b of legoBricks) {
    const mesh = new THREE.Mesh(buildBrickGeometry(b.sx, b.sy, b.h, b.studs[0], b.studs[1]), legoMaterial(b.color));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(b.x, 0, b.y);
    mesh.rotation.y = -b.a;
    group.add(mesh);
    bricks.push(b);
    colliders.push({ type: "obb", x: b.x, z: b.y, a: b.a, hx: b.sx / 2, hz: b.sy / 2, h: BRICK_H, brick: true, hard: true });
    poppables.push({
      group: mesh,
      x: b.x,
      z: b.y,
      kind: "brick",
      ao: { w: b.sx * 1.2, d: b.sy * 1.2, rot: -b.a, round: false },
      apply: (level) => mesh.scale.set(1, Math.max(0.001, level), 1),
    });
  }

  // --- brick towers: stacked 12x6.5x6.4 bricks, odd layers yellow and offset ---
  const towerBrick = buildBrickGeometry(12, 6.5, 6.4, 4, 2);
  const towerMats = new Map();
  const towerMat = (color) => {
    if (!towerMats.has(color)) towerMats.set(color, legoMaterial(color));
    return towerMats.get(color);
  };
  for (const tower of towersFiltered) {
    const g = new THREE.Group();
    g.position.set(tower.x, 0, tower.z);
    for (let k = 0; k < tower.n; k++) {
      const mesh = new THREE.Mesh(towerBrick, towerMat(k % 2 ? "#f3c21d" : tower.color));
      mesh.position.set(k % 2 ? 0.8 : -0.4, k * 6.4, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
    }
    group.add(g);
    poppables.push({
      group: g,
      x: tower.x,
      z: tower.z,
      kind: "tower",
      ao: { w: 15, d: 9.5, rot: 0, round: false },
      apply: (level) => g.scale.set(1, Math.max(0.001, level), 1),
    });
  }

  // --- beach ball: oscillates along z between ball.z0 and ball.z1 ---
  const ballMat = new THREE.MeshPhysicalMaterial({ map: makeBallTexture(), roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  ballMat.map.colorSpace = "srgb";
  const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(ball.r, 48, 32), ballMat);
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;
  const ballGroup = new THREE.Group();
  ballGroup.add(ballMesh);
  group.add(ballGroup);
  const ballCollider = { type: "circle", x: ball.x, z: ball.z0, r: ball.r * 0.72, h: 99, vx: 0, vz: 0, ball: true, hard: true };
  colliders.push(ballCollider);
  let ballLevel = 1;
  poppables.push({
    group: ballGroup,
    x: ball.x,
    z: 60,
    kind: "ball",
    ao: null,
    apply: (level) => {
      ballLevel = level;
    },
  });

  // --- sofa: four legs (colliders) + one cushion plane that jumps in/out ---
  const legMat = new THREE.MeshPhysicalMaterial({ color: 5911584, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const legCapMat = new THREE.MeshStandardMaterial({ color: 1776411, roughness: 0.6 });
  const sofaGroup = new THREE.Group();
  group.add(sofaGroup);
  let sofaLanded = false;
  for (const leg of sofaLegs) {
    const g = new THREE.Group();
    g.position.set(leg.x, 0, leg.z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(leg.r * 1.1, leg.r * 0.72, leg.h, 28).translate(0, leg.h / 2, 0), legMat);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(leg.r * 0.76, leg.r * 0.76, 1.1, 28).translate(0, 0.55, 0), legCapMat);
    post.castShadow = true;
    post.receiveShadow = true;
    cap.castShadow = true;
    g.add(post, cap);
    sofaGroup.add(g);
    colliders.push({ type: "circle", x: leg.x, z: leg.z, r: leg.r * 0.85, h: 99, hard: true });
    poppables.push({
      group: null,
      x: leg.x,
      z: leg.z,
      waveX: sofaBottom.x,
      waveZ: sofaBottom.z,
      afterLanding: SOFA_LAND_PHASE,
      kind: "sofaLeg",
      ao: { w: leg.r * 2.8, d: leg.r * 2.8, rot: 0, round: true },
      apply: () => {},
    });
  }
  const sofaTop = new THREE.Mesh(
    new THREE.PlaneGeometry(sofaBottom.w, sofaBottom.d),
    new THREE.MeshStandardMaterial({ map: makeSofaTopTexture(), color: 6967864, roughness: 1, side: THREE.BackSide }), // RE: hn = BackSide
  );
  sofaTop.rotation.x = -Math.PI / 2;
  sofaTop.position.set(sofaBottom.x, sofaLegs[0].h, sofaBottom.z);
  sofaGroup.add(sofaTop);
  poppables.push({
    group: sofaGroup,
    x: sofaBottom.x,
    z: sofaBottom.z,
    kind: "sofa",
    ao: null,
    apply: (level, scaleY, progress, mode) => {
      sofaGroup.position.y = sofaHeight(progress, mode);
      if (mode === "up" && progress >= SOFA_LAND_PHASE && !sofaLanded) {
        sofaLanded = true;
        api.onSofaLand?.(); // set by main: sfx, camera shake, dust puffs
      } else if (mode !== "up" || progress < SOFA_LAND_PHASE) {
        sofaLanded = mode === "full";
      }
    },
  });

  // --- cat ---
  const cat = buildCat(fiberTexture);
  cat.root.visible = false;
  group.add(cat.root);
  cat.root.scale.setScalar(CAT_SCALE);
  // one circle collider per paw, enabled only while that paw is planted
  const pawColliders = [0, 1, 2, 3].map(() => ({ type: "circle", x: 0, z: 0, r: 3.8, h: 99, off: true, cat: true, hard: true }));
  colliders.push(...pawColliders);

  /** Update ball position / velocity for time t (minified local `L`). */
  function updateBall(t) {
    const zAt = (tt) => {
      const phase = (tt + 1.5) % 9;
      const u = phase < 4.5 ? phase / 4.5 : 2 - phase / 4.5;
      return ball.z0 + (ball.z1 - ball.z0) * u * u * (3 - 2 * u);
    };
    const z = zAt(t);
    ballCollider.z = z;
    ballCollider.vz = (zAt(t + 0.01) - z) / 0.01;
    ballCollider.off = ballLevel < 0.5;
    ballGroup.position.set(ball.x, ball.r * ballLevel, z);
    ballGroup.scale.setScalar(Math.max(0.001, ballLevel));
    ballMesh.rotation.x = z / ball.r;
    ballGroup.visible = ballLevel > 0.003;
  }

  /** How long a cat run lasts (seconds) (minified `w`). */
  const catLife = (run) => run.lead + 4.4;

  /**
   * Animate the cat for time t (minified `S`).
   * @param run {t0, lead, c:{x,z,dx,dz}} current cat run or null
   * @param target {x,z} point the cat looks at (player) or null
   * @param enablePaws whether to enable paw colliders
   * @returns {boolean} whether the cat is visible
   */
  function updateCat(t, run, target, enablePaws) {
    for (const c of pawColliders) c.off = true;
    const age = run ? t - run.t0 : -1;
    const active = !!run && age >= 0 && age <= catLife(run);
    cat.root.visible = active;
    if (!active) return false;
    const len = Math.hypot(run.c.dx, run.c.dz) || 1;
    const dirX = run.c.dx / len;
    const dirZ = run.c.dz / len;
    const travelled = CAT_SPEED * (age - run.lead);
    const px = run.c.x + dirX * travelled;
    const pz = run.c.z + dirZ * travelled;
    cat.root.position.set(px, 0, pz);
    cat.root.rotation.y = -Math.atan2(dirZ, dirX);
    const stride = 0.95;
    const stanceFrac = 0.62;
    const stepLen = (CAT_SPEED / CAT_SCALE) * stride * stanceFrac;
    const cycle = age / stride;
    cat.body.position.y = Math.sin(cycle * Math.PI * 4) * 0.35;
    cat.body.rotation.x = Math.sin(cycle * Math.PI * 2) * 0.03;
    for (let i = 0; i < cat.legs.length; i++) {
      const leg = cat.legs[i];
      const ph = (((cycle + leg.phase) % 1) + 1) % 1;
      let footX;
      let footLift;
      if (ph < stanceFrac) {
        footX = stepLen / 2 - (ph / stanceFrac) * stepLen;
        footLift = 0;
      } else {
        const sw = (ph - stanceFrac) / (1 - stanceFrac);
        footX = -stepLen / 2 + sw * stepLen;
        footLift = Math.sin(sw * Math.PI) * 3.2;
      }
      const hipY = leg.hip.position.y + cat.body.position.y;
      solveCatLegIK(leg, leg.hip.position.x, hipY, leg.hip.position.x + footX, footLift + 1.3);
      if (enablePaws && footLift < 1) {
        const lx = leg.hip.position.x + footX;
        const lz = leg.z;
        pawColliders[i].off = false;
        pawColliders[i].x = px + CAT_SCALE * (lx * dirX - lz * dirZ);
        pawColliders[i].z = pz + CAT_SCALE * (lx * dirZ + lz * dirX);
      }
    }
    for (let i = 0; i < cat.tail.length; i++) {
      const seg = cat.tail[i];
      seg.rotation.z = (i === 0 ? 0.9 : 0.12) + Math.sin(age * 2.2 - i * 0.45) * 0.04 * i * 0.4;
      seg.rotation.y = Math.sin(age * 1.6 - i * 0.5) * 0.12;
    }
    if (target) {
      // look toward the target when it is within ~90 units ahead
      const headX = px + dirX * 19 * CAT_SCALE;
      const headZ = pz + dirZ * 19 * CAT_SCALE;
      const dx = target.x - headX;
      const dz = target.z - headZ;
      const dist = Math.hypot(dx, dz);
      const yaw = Math.atan2(-(-dx * dirZ + dz * dirX), dx * dirX + dz * dirZ);
      const attention = clamp(1 - (dist - 20) / 70, 0, 1);
      cat.neck.rotation.y = clamp(yaw, -0.9, 0.9) * attention * 0.6;
      cat.neck.rotation.z = -0.85 * attention;
      cat.head.rotation.y = clamp(yaw, -0.9, 0.9) * attention * 0.5;
      cat.head.rotation.z = 0.25 * attention;
    }
    return true;
  }

  const api = { group, poppables, colliders, bricks, cat, catLife, updateBall, updateCat };
  return api;
}
