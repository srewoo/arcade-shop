import * as THREE from "three";
import { GeometryBatch, colorizeGeometry } from "./propBuilder.js";
import { COLORS } from "./mapPainter.js";
import { mulberry32 } from "../util/math.js";

// Each builder returns merged vertex-coloured BufferGeometry (or {base, spin} etc.)
// for one scenery prop. Local origin is the prop centre on the rug (y = 0 is the floor).

/**
 * Lake castle: ringed wall box with crenellations, four round towers with red
 * cone roofs, and a gate.
 * @param {{w:number,d:number,h:number}} spec
 */
export function buildCastle(spec) {
  const batch = new GeometryBatch(),
    { w, d, h } = spec,
    wallH = h * 0.62,
    wallColor = "#d6a888",
    trimColor = "#b8795a";
  batch.box(w, wallH, d, wallColor, 0, wallH / 2, 0);
  batch.box(w + 0.3, 0.8, d + 0.3, trimColor, 0, 0.4, 0);
  for (let i = -2; i <= 2; i++) {
    for (const side of [-1, 1]) {
      batch.box(w * 0.11, 1.8, 1, wallColor, i * w * 0.2, wallH + 0.9, side * (d / 2 - 0.5));
      batch.box(1, 1.8, d * 0.11, wallColor, side * (w / 2 - 0.5), wallH + 0.9, i * d * 0.2);
    }
  }
  const towerH = h * 0.74,
    towerR = 2.9;
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const x = (sx * w) / 2,
      z = (sz * d) / 2;
    batch.add(new THREE.CylinderGeometry(towerR * 0.95, towerR, towerH, 18), "#cf9974", x, towerH / 2, z);
    batch.add(new THREE.CylinderGeometry(towerR * 1.14, towerR * 1.14, 0.9, 18), trimColor, x, towerH + 0.1, z);
    batch.add(new THREE.ConeGeometry(towerR * 1.32, h * 0.36, 18), "#d8402f", x, towerH + 0.5 + h * 0.18, z);
  }
  batch.box(w * 0.2, h * 0.24, 0.3, "#58342a", 0, h * 0.12, d / 2 + 0.05);
  batch.add(new THREE.CylinderGeometry(w * 0.1, w * 0.1, 0.3, 18), "#58342a", 0, h * 0.24, d / 2 + 0.05, 0, Math.PI / 2);
  for (const x of [-w * 0.3, w * 0.3]) batch.box(0.8, 2.4, 0.2, "#58342a", x, wallH * 0.72, d / 2 + 0.05);
  return batch.merge();
}

/**
 * Fair carousel: static `base` disc and a `spin` group (canopy, striped cone, poles, horses).
 * @returns {{base:THREE.BufferGeometry, spin:THREE.BufferGeometry}}
 */
export function buildCarousel(spec) {
  const radius = spec.w * 0.4,
    poleH = spec.h * 0.56,
    palette = ["#d8332a", "#f6d23a", "#2f6fc0", "#f6f4ea"],
    base = new GeometryBatch(),
    spin = new GeometryBatch();
  base.add(new THREE.CylinderGeometry(radius * 1.04, radius * 1.08, 0.6, 32), "#f4e6c4", 0, 0.3, 0);
  spin.add(new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.4, 32), "#d9b27a", 0, 0.8, 0);
  spin.add(new THREE.CylinderGeometry(0.9, 1.1, poleH, 14), "#d8332a", 0, poleH / 2, 0);
  spin.add(new THREE.CircleGeometry(radius, 32), "#fff4dc", 0, poleH - 0.02, 0, 0, Math.PI / 2);
  const segments = 16,
    segAngle = (Math.PI * 2) / segments,
    canopyH = spec.h - poleH;
  for (let i = 0; i < segments; i++) {
    const start = i * segAngle;
    spin.add(new THREE.CylinderGeometry(0, radius, canopyH, 1, 1, true, start, segAngle), palette[i % 4], 0, poleH + canopyH / 2, 0);
    spin.add(new THREE.CylinderGeometry(radius, radius, 1.3, 1, 1, true, start, segAngle), palette[(i + 2) % 4], 0, poleH - 0.65, 0);
  }
  spin.add(new THREE.SphereGeometry(0.75, 12, 8), "#f6d23a", 0, spec.h + 0.2, 0);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4,
      x = Math.cos(angle) * radius * 0.78,
      z = Math.sin(angle) * radius * 0.78;
    spin.add(new THREE.CylinderGeometry(0.16, 0.16, poleH, 8), "#f3c21d", x, poleH / 2, z);
    const color = palette[i % 4],
      yaw = -angle;
    // RE: horse body + head blocks, tangent to the ring
    spin.add(new THREE.BoxGeometry(0.9, 1, 2.4), color, x, 3.2 + (i % 2) * 0.7, z, yaw);
    const tx = -Math.sin(angle),
      tz = Math.cos(angle);
    spin.add(new THREE.BoxGeometry(0.7, 1.1, 0.9), color, x + tx * 1.4, 4.1 + (i % 2) * 0.7, z + tz * 1.4, yaw);
  }
  return { base: base.merge(), spin: spin.merge() };
}

/** Ferris wheel in the XY plane: two torus rims, 12 gondola slats, 4 spoke bars, hub. */
export function buildFerrisWheel(radius = 4.6, width = 1.4) {
  const batch = new GeometryBatch();
  for (const z of [-width / 2, width / 2]) batch.add(new THREE.TorusGeometry(radius, 0.26, 8, 28), "#8a6238", 0, 0, z);
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6,
      x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius;
    batch.add(new THREE.BoxGeometry(0.9, 0.2, width + 0.4), "#f6f3ea", x, y, 0, 0, 0, angle + Math.PI / 2);
  }
  for (let i = 0; i < 4; i++) batch.add(new THREE.BoxGeometry(radius * 2, 0.26, 0.26), "#6f4632", 0, 0, 0, 0, 0, (i * Math.PI) / 4);
  batch.add(new THREE.CylinderGeometry(0.6, 0.6, width + 1.2, 12), "#6f4632", 0, 0, 0, 0, Math.PI / 2);
  return batch.merge();
}

/** Yellow rubber duck: squashed body, head, orange beak. */
export function buildDuck() {
  const batch = new GeometryBatch(),
    body = new THREE.SphereGeometry(1, 12, 9);
  body.scale(1.5, 0.85, 1);
  batch.add(body, "#f6d23a", 0, 0.75, 0);
  batch.add(new THREE.SphereGeometry(0.62, 12, 9), "#f6d23a", 1.05, 1.75, 0);
  batch.add(new THREE.ConeGeometry(0.24, 0.65, 8), "#ec8a2c", 1.78, 1.68, 0, 0, 0, -Math.PI / 2);
  return batch.merge();
}

/** Cattails (green stalk + brown capsule head) at each {x, z, h}. */
export function buildReeds(reeds) {
  const batch = new GeometryBatch();
  for (const r of reeds) {
    batch.add(new THREE.CylinderGeometry(0.06, 0.11, r.h, 5), "#4f8f3a", r.x, r.h / 2, r.z);
    batch.add(new THREE.CapsuleGeometry(0.17, 0.5, 2, 6), "#7a4a2a", r.x, r.h, r.z);
  }
  return batch.merge();
}

/**
 * Tree: `pine` = trunk + three stacked cones; otherwise trunk + blobby icosahedron
 * canopy (seeded by spec.seed). Colours come from the map palette.
 * @param {{r:number,pine?:boolean,seed?:number}} spec
 */
export function buildTree(spec) {
  const batch = new GeometryBatch(),
    r = spec.r,
    trunkBase = 3.5;
  if (spec.pine) {
    const trunkH = trunkBase + 0.4;
    batch.add(new THREE.CylinderGeometry(r * 0.16, r * 0.26, trunkH, 7), "#7a4a26", 0, trunkH / 2, 0);
    const greens = [COLORS.pine, "#2e8556", "#46a06a"];
    for (let i = 0; i < 3; i++) {
      const coneR = r * (1 - i * 0.26),
        coneH = r * (1.25 - i * 0.18);
      batch.add(new THREE.ConeGeometry(coneR, coneH, 9), greens[i], 0, trunkBase + i * r * 0.62 + coneH / 2, 0, i * 0.3);
    }
  } else {
    const rand = mulberry32(spec.seed),
      trunkH = trunkBase + r * 0.86;
    batch.add(new THREE.CylinderGeometry(r * 0.16, r * 0.26, trunkH, 7), "#7a4a26", 0, trunkH / 2, 0);
    const blob = (radius) => new THREE.IcosahedronGeometry(radius, 1);
    batch.add(blob(r * 0.86), COLORS.tree, 0, trunkH, 0);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rand();
      batch.add(
        blob(r * 0.42),
        COLORS.tree,
        Math.cos(angle) * r * 0.62,
        trunkH - r * 0.05 + (rand() - 0.5) * 0.4,
        Math.sin(angle) * r * 0.62,
      );
    }
    batch.add(blob(r * 0.68), COLORS.treeMid, -r * 0.1, trunkH + r * 0.34, -r * 0.1);
    batch.add(blob(r * 0.34), COLORS.treeLight, -r * 0.28, trunkH + r * 0.78, -r * 0.3);
  }
  return batch.merge();
}

/**
 * Fence from a to b. White picket style (posts with pointed caps) unless
 * spec.color is the default wood "#8a5a33", which gives a low rail fence.
 * @param {{a:number[],b:number[],color:string}} spec
 */
export function buildFence(spec) {
  const batch = new GeometryBatch(),
    dx = spec.b[0] - spec.a[0],
    dz = spec.b[1] - spec.a[1],
    length = Math.hypot(dx, dz),
    yaw = Math.atan2(dz, dx),
    picket = spec.color !== "#8a5a33",
    count = Math.max(1, Math.round(length / (picket ? 0.95 : 1.5))),
    postH = picket ? 2.1 : 1.5;
  for (let i = 0; i <= count; i++) {
    const f = i / count,
      x = dx * f,
      z = dz * f;
    if (picket) {
      batch.add(new THREE.BoxGeometry(0.42, postH, 0.14), spec.color, x, postH / 2, z, -yaw);
      batch.add(new THREE.ConeGeometry(0.3, 0.45, 4), spec.color, x, postH + 0.22, z, Math.PI / 4);
    } else {
      batch.add(new THREE.BoxGeometry(0.28, postH, 0.28), spec.color, x, postH / 2, z);
    }
  }
  for (const y of picket ? [0.7, 1.55] : [0.55, 1.15]) {
    const rail = new THREE.BoxGeometry(length, picket ? 0.14 : 0.18, picket ? 0.1 : 0.14),
      g = colorizeGeometry(rail, picket ? "#e6e1d4" : "#9c6a3e");
    g.rotateY(-yaw);
    g.translate(dx / 2, y, dz / 2);
    batch.list.push(g);
  }
  return batch.merge();
}

/**
 * Farm field rows. type "wheat" (hay strips + golden cones), "cabbage"
 * (icosahedron heads) or anything else (corn stalks with leaves and cobs).
 * RNG call order is significant (seeded from the field size).
 * @param {{w:number,h:number,type:string}} spec
 */
export function buildCropField(spec) {
  const batch = new GeometryBatch(),
    rand = mulberry32(spec.w * 13 + spec.h),
    x0 = -spec.w / 2,
    z0 = -spec.h / 2;
  if (spec.type === "wheat") {
    for (let z = z0 + 1; z < z0 + spec.h - 0.3; z += 1.6) {
      batch.add(new THREE.BoxGeometry(spec.w - 1, 0.9, 0.9), "#e3c15a", 0, 0.45, z + 0.3);
      for (let x = x0 + 0.8; x < x0 + spec.w - 0.6; x += 0.55) {
        batch.add(
          new THREE.ConeGeometry(0.22, 0.6 + rand() * 0.3, 4),
          rand() < 0.5 ? "#f0d478" : "#d9b14a",
          x,
          1.15,
          z + 0.3 + (rand() - 0.5) * 0.4,
        );
      }
    }
  } else if (spec.type === "cabbage") {
    for (let x = x0 + 1.9; x < x0 + spec.w - 0.5; x += 1.8) {
      for (let z = z0 + 1.2; z < z0 + spec.h - 0.6; z += 1.5) {
        batch.add(new THREE.IcosahedronGeometry(0.62, 0), "#5dae45", x, 0.5, z, rand() * 3);
        batch.add(new THREE.IcosahedronGeometry(0.34, 0), "#8fd06a", x - 0.1, 0.92, z - 0.1);
      }
    }
  } else {
    for (let z = z0 + 1.8; z < z0 + spec.h - 0.5; z += 1.6) {
      for (let x = x0 + 0.8; x < x0 + spec.w - 0.8; x += 0.9) {
        const stalkH = 2.2 + rand() * 0.8;
        batch.add(new THREE.CylinderGeometry(0.08, 0.12, stalkH, 4), "#5aa83c", x, stalkH / 2, z);
        batch.add(new THREE.BoxGeometry(0.9, 0.08, 0.25), "#6fbf4a", x, stalkH * 0.55, z, rand() * 3);
        batch.add(new THREE.ConeGeometry(0.16, 0.6, 5), "#f2cf4a", x, stalkH * 0.75, z + 0.12);
      }
    }
  }
  return batch.merge();
}
