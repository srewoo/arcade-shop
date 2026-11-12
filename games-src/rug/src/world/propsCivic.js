import * as THREE from "three";
import { GeometryBatch } from "./propBuilder.js";
import { applyCarpetPile } from "./carpetPile.js";
import { COLORS } from "./mapPainter.js";
import { mainField } from "./layoutSelect.js";
import { mulberry32 } from "../util/math.js";

/**
 * Football pitch furniture: two goals (posts, crossbar, diagonal braces, net grid)
 * at x = +-field.w/2, plus four corner flags. Uses the main field rect.
 */
export function buildFootballPitchFurniture() {
  const batch = new GeometryBatch(),
    field = mainField,
    goalH = 3.6,
    halfGoalW = 4;
  for (const side of [-1, 1]) {
    const lineX = (side * field.w) / 2,
      backX = lineX + side * 2;
    for (const z of [-halfGoalW, halfGoalW]) {
      batch.add(new THREE.CylinderGeometry(0.18, 0.18, goalH, 8), "#ffffff", lineX, goalH / 2, z);
      batch.add(
        new THREE.CylinderGeometry(0.09, 0.09, Math.hypot(goalH, 2), 6),
        "#dddddd",
        (lineX + backX) / 2,
        goalH / 2,
        z,
        0,
        0,
        side * Math.atan2(2, goalH),
      );
    }
    batch.add(new THREE.CylinderGeometry(0.18, 0.18, halfGoalW * 2 + 0.3, 8), "#ffffff", lineX, goalH, 0, 0, Math.PI / 2);
    for (let z = -halfGoalW; z <= halfGoalW; z += 0.6) {
      batch.add(new THREE.BoxGeometry(0.05, 0.05, 0.05).scale(1, goalH / 0.05, 1), "#e8e8e8", backX, goalH / 2, z);
    }
    for (let y = 0.2; y <= goalH; y += 0.5) batch.add(new THREE.BoxGeometry(0.05, 0.05, halfGoalW * 2), "#e8e8e8", backX, y, 0);
  }
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    batch.add(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 5), "#f6f3ea", (sx * field.w) / 2, 1.2, (sz * field.h) / 2);
    batch.add(new THREE.BoxGeometry(0.05, 0.7, 1), "#f2c21b", (sx * field.w) / 2, 2.05, (sz * field.h) / 2 + 0.5);
  }
  return batch.merge();
}

/**
 * Grandstand: four blue tiers rising toward -z, a cream back wall, and
 * randomly placed coloured spectator blobs (seeded with 5).
 * @param {{w:number,d:number}} spec
 */
export function buildGrandstand(spec) {
  const batch = new GeometryBatch();
  for (let i = 0; i < 4; i++) {
    batch.box(
      spec.w,
      0.8 + i * 0.8,
      spec.d / 4,
      i % 2 ? "#3f70b8" : "#5b8bd0",
      0,
      (0.8 + i * 0.8) / 2,
      spec.d / 2 - ((i + 0.5) * spec.d) / 4,
    );
  }
  batch.box(spec.w, 4.2, 0.3, "#f6f1e6", 0, 2.1, -spec.d / 2);
  const rand = mulberry32(5);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 18; j++) {
      if (rand() < 0.4) continue;
      const color = ["#e8452f", "#f6d23a", "#ffffff", "#45a346", "#ef8ab0"][Math.floor(rand() * 5)];
      batch.add(
        new THREE.IcosahedronGeometry(0.32, 0),
        color,
        -spec.w / 2 + 1 + (j * (spec.w - 2)) / 17,
        0.8 + i * 0.8 + 0.4,
        spec.d / 2 - ((i + 0.5) * spec.d) / 4,
      );
    }
  }
  return batch.merge();
}

/** 512x128 canvas texture with centred bold text. */
export function makeSignTexture(text, background, foreground) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = foreground;
  ctx.font = '900 92px "Arial Rounded MT Bold", "Arial Black", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 70);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Stone fountain: basin, water disc, pedestal, upper bowl, spray cone and droplets. */
export function buildFountain(spec) {
  const batch = new GeometryBatch();
  batch.add(new THREE.CylinderGeometry(spec.r, spec.r * 1.05, 0.9, 28), "#c9ccd1", 0, 0.45, 0);
  batch.add(new THREE.CylinderGeometry(spec.r * 0.78, spec.r * 0.78, 0.2, 28), COLORS.water, 0, 0.86, 0);
  batch.add(new THREE.CylinderGeometry(0.45, 0.6, 2.4, 14), "#c9ccd1", 0, 1.2, 0);
  batch.add(new THREE.CylinderGeometry(1.5, 0.9, 0.35, 20), "#c9ccd1", 0, 2.5, 0);
  batch.add(new THREE.CylinderGeometry(1.25, 1.25, 0.12, 20), COLORS.waterLight, 0, 2.66, 0);
  batch.add(new THREE.ConeGeometry(0.7, 1.6, 12), "#dff1fb", 0, 3.4, 0);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    batch.add(new THREE.SphereGeometry(0.26, 8, 6), "#dff1fb", Math.cos(angle) * 1.25, 1.4 - (i % 2) * 0.3, Math.sin(angle) * 1.25);
  }
  return batch.merge();
}

/**
 * Adds a signboard mesh (box w x h x 0.25 with a text texture) to `group`.
 * RE: reads the fibre texture bundle from group.userData.fiber.
 */
export function addSign(group, text, background, foreground, w, h, x, y, z, rotY = 0) {
  const material = applyCarpetPile(
    new THREE.MeshStandardMaterial({ map: makeSignTexture(text, background, foreground), roughness: 1 }),
    group.userData.fiber,
    { fuzz: [0.004, 0.012] },
  );
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

/** Petrol station: four posts, flat canopy with accent trim, two red pumps with screens and bases. */
export function buildPetrolStation(spec) {
  const batch = new GeometryBatch(),
    { w, d, h } = spec;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      batch.add(new THREE.CylinderGeometry(0.3, 0.3, h, 10), "#f6f3ea", sx * (w / 2 - 1.2), h / 2, sz * (d / 2 - 1.2));
    }
  }
  batch.box(w, 0.8, d, "#f3f3f0", 0, h + 0.4, 0);
  batch.box(w + 0.1, 0.35, d + 0.1, spec.accent, 0, h + 0.15, 0);
  for (const x of [-w / 4, w / 4]) {
    batch.box(1, 1.6, 0.7, "#e8452f", x, 0.8, 0);
    batch.box(0.7, 0.4, 0.75, "#2b3440", x, 1.25, 0);
    batch.box(1.6, 0.25, 1.2, "#cfd2d6", x, 0.12, 0);
  }
  return batch.merge();
}

/** Farm silo: cylinder, grey bands every 1.5 units, hemispherical dome. */
export function buildSilo(spec) {
  const batch = new GeometryBatch();
  batch.add(new THREE.CylinderGeometry(spec.r, spec.r, spec.h, 18), spec.wall, 0, spec.h / 2, 0);
  for (let y = 1.5; y < spec.h; y += 1.5) {
    batch.add(new THREE.CylinderGeometry(spec.r + 0.06, spec.r + 0.06, 0.12, 18), "#a9aeb6", 0, y, 0);
  }
  batch.add(new THREE.SphereGeometry(spec.r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), spec.roof, 0, spec.h, 0);
  return batch.merge();
}
