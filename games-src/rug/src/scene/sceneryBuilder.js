// Builds all static "pop-up" scenery (buildings, trees, fences, fields, goals, signs, ducks, reeds) as Groups
// and returns them as poppable items for the Popper. Each item.apply(level, scaleY) animates it between
// flat-on-rug (0) and standing (1).
import * as THREE from "three";
import { mulberry32 } from "../util/math.js";
import { applyCarpetPile } from "../world/carpetPile.js";
import { GeometryBatch } from "../world/propBuilder.js";
import { makeParkingSignTexture } from "../world/buildingTextures.js";
import { buildHouse, buildShopBuilding } from "../world/buildings.js";
import {
  buildFerrisWheel,
  buildCarousel,
  buildCastle,
  buildTree,
  buildFence,
  buildCropField,
  buildDuck,
  buildReeds,
} from "../world/props.js";
import {
  buildGrandstand,
  buildPetrolStation,
  buildSilo,
  buildFountain,
  addSign,
  buildFootballPitchFurniture,
} from "../world/propsCivic.js";
import { houses, trees, fenceSegments } from "../world/houseLayout.js";
import { farmFields, mainField, parkingRects, ducks, reeds } from "../world/layoutSelect.js";

const MIN_SCALE = 0.001;
const grow = (v) => Math.max(MIN_SCALE, v);

/**
 * @param {THREE.Scene} scene
 * @param {object} materials from makePropMaterials: {fiber, body, flat, roof, glass, plastic}
 * @param {(progress:number, label:string)=>Promise} progress boot progress callback (`si`)
 * @returns {Promise<Array & {spinners: Array}>}
 */
export async function buildScenery(scene, materials, progress) {
  const items = [];
  items.spinners = []; // {obj, axis, rate}: continuously rotating parts (windmill, carousel)
  const mesh = (geo, mat, castShadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = castShadow;
    m.receiveShadow = true;
    return m;
  };

  for (const [index, h] of houses.entries()) {
    if (index % 6 === 5) await progress(0.36 + (0.12 * index) / houses.length, "buildings");
    const group = new THREE.Group();
    group.userData.fiber = materials.fiber;
    group.position.set(h.x, 0, h.y);
    group.rotation.y = h.rot || 0;
    let apply;
    const footW = h.w ?? h.r * 2;
    const footD = h.d ?? h.r * 2;
    if (["house", "mill", "post", "school", "barn"].includes(h.kind)) {
      const parts = buildHouse(h, materials);
      const walls = new THREE.Group();
      walls.add(mesh(parts.body, parts.wallMat));
      const top = new THREE.Group(); // gable + roof ride on top of the growing walls
      top.add(mesh(parts.gable, parts.wallMat), mesh(parts.roof, materials.roof));
      group.add(walls, top);
      const extras = new THREE.Group();
      if (h.kind === "mill") {
        const wheel = mesh(buildFerrisWheel(), materials.body); // RE: HS() = windmill/ferris-wheel hub+spokes
        wheel.position.set(h.w / 2 + 2.6, 4.9, h.d / 2 - 1);
        extras.add(wheel);
        group.add(extras);
        items.spinners.push({ obj: wheel, axis: "z", rate: -0.8 });
      }
      apply = (level, scaleY) => {
        walls.scale.set(1, grow(level), 1);
        top.position.y = h.h * level;
        top.scale.set(1, grow(scaleY), 1);
        extras.scale.set(1, grow(scaleY), 1);
      };
    } else if (["shop", "hospital", "fire", "police"].includes(h.kind)) {
      const parts = buildShopBuilding(h, materials);
      const walls = new THREE.Group();
      walls.add(mesh(parts.body, parts.wallMat));
      if (parts.awning) walls.add(mesh(parts.awning, materials.body));
      const top = new THREE.Group();
      top.add(mesh(parts.slab, parts.roofMat));
      group.add(walls, top);
      apply = (level, scaleY) => {
        walls.scale.set(1, grow(level), 1);
        top.position.y = h.h * level;
        top.scale.set(1, grow(scaleY), 1);
      };
    } else if (h.kind === "carousel") {
      const parts = buildCarousel(h);
      const spin = mesh(parts.spin, materials.body);
      group.add(mesh(parts.base, materials.body), spin);
      items.spinners.push({ obj: spin, axis: "y", rate: 0.7 });
      apply = (level) => {
        group.scale.set(1, grow(level), 1);
      };
    } else {
      const builder = { castle: buildCastle, stand: buildGrandstand, gas: buildPetrolStation, silo: buildSilo, fountain: buildFountain }[h.kind];
      const m = mesh(builder(h), h.kind === "gas" ? materials.plastic : materials.body);
      group.add(m);
      if (h.kind === "gas") addSign(group, "GAS", "#e8452f", "#ffffff", 4.2, 0.75, 0, h.h + 0.4, h.d / 2 + 0.1);
      apply = (level) => {
        group.scale.set(1, grow(level), 1);
      };
    }
    scene.add(group);
    items.push({
      group,
      x: h.x,
      z: h.y,
      apply,
      ao: { w: footW, d: footD, rot: h.rot || 0, round: ["carousel", "silo", "fountain"].includes(h.kind) },
      kind: h.kind,
    });
  }

  // trees (y-scale = level, xz-scale = scaleY)
  for (const t of trees) {
    const m = mesh(buildTree(t), materials.flat);
    m.position.set(t.x, 0, t.y);
    m.rotation.y = mulberry32(t.seed)() * 0.6;
    scene.add(m);
    items.push({
      group: m,
      x: t.x,
      z: t.y,
      kind: "tree",
      ao: { w: t.r * 1.7, d: t.r * 1.7, rot: 0, round: true },
      apply: (level, scaleY) => {
        m.scale.set(grow(scaleY), grow(level), grow(scaleY));
      },
    });
  }

  for (const f of fenceSegments) {
    const m = mesh(buildFence(f), materials.body);
    m.position.set(f.a[0], 0, f.a[1]);
    scene.add(m);
    items.push({
      group: m,
      x: (f.a[0] + f.b[0]) / 2,
      z: (f.a[1] + f.b[1]) / 2,
      kind: "fence",
      ao: null,
      apply: (level) => {
        m.scale.set(1, grow(level), 1);
      },
    });
  }

  for (const field of farmFields) {
    const m = mesh(buildCropField(field), field.type === "cabbage" ? materials.flat : materials.body);
    m.position.set(field.x, 0, field.y);
    scene.add(m);
    items.push({
      group: m,
      x: field.x,
      z: field.y,
      kind: "field",
      ao: null,
      apply: (level) => {
        m.scale.set(1, grow(level), 1);
      },
    });
  }

  {
    const goals = mesh(buildFootballPitchFurniture(), materials.body);
    goals.position.set(mainField.x, 0, mainField.y);
    scene.add(goals);
    items.push({
      group: goals,
      x: mainField.x,
      z: mainField.y,
      kind: "goals",
      ao: null,
      apply: (level) => {
        goals.scale.set(1, grow(level), 1);
      },
    });
  }

  // parking-lot "P" signs: pole + 3.1 x 3.1 board with the P texture
  const signMat = applyCarpetPile(new THREE.MeshStandardMaterial({ map: makeParkingSignTexture(), roughness: 1 }), materials.fiber, {
    fuzz: [0.006, 0.006],
  });
  for (const lot of parkingRects) {
    const group = new THREE.Group();
    group.position.set(lot.x - lot.w / 2 + 2.4, 0, lot.y - lot.h / 2 - 3);
    const pole = new GeometryBatch();
    pole.box(0.26, 5, 0.26, "#d6d6d0", 0, 2.5, 0);
    group.add(mesh(pole.merge(), materials.body));
    const board = mesh(new THREE.BoxGeometry(3.1, 3.1, 0.25), signMat);
    board.position.y = 5.8;
    group.add(board);
    scene.add(group);
    items.push({
      group,
      x: group.position.x,
      z: group.position.z,
      kind: "sign",
      ao: null,
      apply: (level) => {
        group.scale.set(1, grow(level), 1);
      },
    });
  }

  const duckGeo = buildDuck();
  ducks.forEach((d, i) => {
    const m = mesh(duckGeo, materials.body);
    m.position.set(d.x, 0, d.z);
    m.rotation.y = i * 2.4;
    scene.add(m);
    items.push({
      group: m,
      x: d.x,
      z: d.z,
      kind: "duck",
      ao: null,
      apply: (level) => {
        m.scale.setScalar(grow(level));
      },
    });
  });

  // reeds in clumps of 26, re-centred on their centroid
  for (let c = 0; c * 26 < reeds.length; c++) {
    const clump = reeds.slice(c * 26, (c + 1) * 26).map((r) => ({ ...r }));
    const cx = clump.reduce((s, r) => s + r.x, 0) / clump.length;
    const cz = clump.reduce((s, r) => s + r.z, 0) / clump.length;
    clump.forEach((r) => {
      r.x -= cx;
      r.z -= cz;
    });
    const m = mesh(buildReeds(clump), materials.flat);
    m.position.set(cx, 0, cz);
    scene.add(m);
    items.push({
      group: m,
      x: cx,
      z: cz,
      kind: "reeds",
      ao: null,
      apply: (level) => {
        m.scale.set(1, grow(level), 1);
      },
    });
  }
  return items;
}
