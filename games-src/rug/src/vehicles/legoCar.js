import * as THREE from "three";
import { createCarLights } from "../scene/carLights.js";
import { BRICK_HEIGHT, PLATE_HEIGHT, STUD_PITCH, buildBrickGeometry, flyingBricks } from "./legoBricks.js";
import { legoBodyLayout } from "./legoCarLayouts.js";
import { legoPlasticMaterial, getLegoSharedMaterials } from "./legoMaterials.js";
import { buildLegoWheel } from "./legoWheel.js";

/**
 * Build a lego car rig (model 0 coupe, 1 pickup, 2 van, 3 racer).
 * Same rig shape as the classic cars plus: lego:true, pieces[], reset(), breakOff(), bricksLeft.
 */
export function buildLegoCar(model = 0) {
  const shared = getLegoSharedMaterials();
  const mainMat = legoPlasticMaterial("#d01712");
  const accentMat = legoPlasticMaterial("#f2cd37");
  const seatMat = legoPlasticMaterial("#d01712"); // driver torso brick; recoloured to the accent colour in setColors
  const tailMat = legoPlasticMaterial("#c01008", { emissive: "#e00800", emissiveIntensity: 1 });
  const mats = { ...shared, main: mainMat, accent: accentMat, tail: tailMat };
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const squash = new THREE.Group();
  root.add(tilt);
  tilt.add(squash);
  const wheelR = model === 1 ? 0.78 : 0.62;
  const chassisY = wheelR - 0.12;
  const bodyBaseY = chassisY + PLATE_HEIGHT;
  const addBrick = (sx, sz, height, mat, x, y, z, parent = squash, studs = true) => {
    const mesh = new THREE.Mesh(buildBrickGeometry(sx, sz, height, studs), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  // chassis plate, seat, engine/grey block
  addBrick(10, 4, PLATE_HEIGHT, mats.dark, 0, chassisY, 0, tilt);
  addBrick(2, 2, PLATE_HEIGHT * 2, mats.black, -0.31, bodyBaseY, 0);
  addBrick(2, 2, 0.45, mats.grey, 1.9, bodyBaseY, 0);
  // minifig driver: torso brick (no studs) + yellow head cylinder
  const driverY = bodyBaseY + PLATE_HEIGHT * 2;
  const driverParts = [addBrick(1, 2, 0.5, seatMat, -0.31, driverY, 0, squash, false)];
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.42, 14), mats.skin);
  head.position.set(-0.31, driverY + 0.72, 0);
  head.castShadow = true;
  squash.add(head);
  driverParts.push(head);
  const baseCabin = [...driverParts]; // restored by reset()
  const cabin = [...baseCabin];

  // body bricks, each tracked as a detachable piece
  const pieces = [];
  for (const [sx, sz, height, matKey, x, y, z, tag] of legoBodyLayout(model)) {
    const mesh = new THREE.Mesh(buildBrickGeometry(sx, sz, height), mats[matKey]);
    mesh.position.set(x, bodyBaseY + y, z);
    mesh.castShadow = matKey !== "glass";
    mesh.receiveShadow = true;
    squash.add(mesh);
    pieces.push({
      mesh,
      parent: squash,
      pos: mesh.position.clone(),
      quat: mesh.quaternion.clone(),
      attached: true,
      cabin: tag === "cabin",
      box: {
        x0: x - (sx * STUD_PITCH) / 2,
        x1: x + (sx * STUD_PITCH) / 2,
        z0: z - (sz * STUD_PITCH) / 2,
        z1: z + (sz * STUD_PITCH) / 2,
        y0: y,
        y1: y + height,
      },
      restsOn: [],
    });
    if (tag === "cabin") {
      cabin.push(mesh);
      baseCabin.push(mesh);
    }
  }
  // stacking graph: piece A "rests on" B if A's bottom touches B's top and footprints overlap
  for (const a of pieces) {
    for (const b of pieces) {
      if (
        a !== b &&
        Math.abs(a.box.y0 - b.box.y1) < 0.02 &&
        a.box.y0 > 0.02 &&
        a.box.x0 < b.box.x1 - 0.02 &&
        b.box.x0 < a.box.x1 - 0.02 &&
        a.box.z0 < b.box.z1 - 0.02 &&
        b.box.z0 < a.box.z1 - 0.02
      ) {
        a.restsOn.push(b);
      }
    }
  }
  /** Attached pieces with nothing attached on top of them (safe to knock off). */
  const detachable = () => pieces.filter((a) => a.attached && !pieces.some((b) => b.attached && b.restsOn.includes(a)));

  const wheels = [];
  for (const axle of [1, -1]) {
    for (const side of [-1, 1]) {
      const wheel = buildLegoWheel(wheelR, 0.5, shared);
      const steer = new THREE.Group();
      steer.position.set(axle * 1.9, wheelR, side * 1.42);
      steer.add(wheel.group);
      tilt.add(steer);
      wheels.push({ steer, spin: wheel.spin, front: axle > 0, r: wheelR });
    }
  }

  const car = {
    lego: true,
    root,
    tilt,
    squash,
    wheels,
    cabin,
    wheelR,
    pieces,
    eye: [0.5, bodyBaseY + BRICK_HEIGHT * 2 + 0.35, 0],
    setColors(scheme) {
      mainMat.color.set(scheme.main);
      accentMat.color.set(scheme.accent);
      seatMat.color.set(scheme.accent);
    },
    /** Re-attach every brick and cancel debris. */
    reset() {
      for (const piece of pieces) {
        const idx = flyingBricks.findIndex((f) => f.mesh === piece.mesh);
        if (idx >= 0) flyingBricks.splice(idx, 1);
        piece.parent.add(piece.mesh);
        piece.mesh.position.copy(piece.pos);
        piece.mesh.quaternion.copy(piece.quat);
        piece.mesh.scale.setScalar(1);
        piece.mesh.visible = true;
        piece.attached = true;
      }
      cabin.length = 0;
      cabin.push(...baseCabin);
      for (const mesh of cabin) mesh.visible = true;
    },
    /**
     * Knock `count` random detachable bricks off.
     * @param {number} count @param {THREE.Object3D} scene debris parent (world space)
     * @param {number} vx car velocity x @param {number} vz car velocity z
     */
    breakOff(count, scene, vx, vz) {
      for (let n = 0; n < count; n++) {
        const candidates = detachable();
        if (!candidates.length) break;
        const piece = candidates[Math.floor(Math.random() * candidates.length)];
        piece.attached = false;
        const cabinIdx = cabin.indexOf(piece.mesh);
        if (cabinIdx >= 0) cabin.splice(cabinIdx, 1);
        piece.mesh.visible = true;
        scene.attach(piece.mesh);
        const dir =
          Math.atan2(piece.mesh.position.z - root.position.z, piece.mesh.position.x - root.position.x) +
          (Math.random() - 0.5) * 1.1;
        const speed = 5 + Math.random() * 7;
        flyingBricks.push({
          mesh: piece.mesh,
          vx: vx * 0.55 + Math.cos(dir) * speed,
          vy: 7 + Math.random() * 7,
          vz: vz * 0.55 + Math.sin(dir) * speed,
          axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
          spin: 6 + Math.random() * 12,
          life: 7 + Math.random() * 3,
          rest: false,
        });
      }
    },
    get bricksLeft() {
      return pieces.filter((p) => p.attached).length;
    },
  };
  car.lights = createCarLights(car, tailMat, 1);
  return car;
}
