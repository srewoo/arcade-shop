import * as THREE from "three";
import { GeometryBatch, colorizeGeometry } from "./propBuilder.js";
import { applyCarpetPile } from "./carpetPile.js";
import { paintFacade, paintFlatRoof } from "./facadeTextures.js";
import { shadeColor } from "../util/color.js";

/**
 * Builds the four wall strips (front, right, back, left) side by side on one
 * canvas, plus a 1-unit plain strip at the end used for faces that need no art.
 * @param {{w:number,d:number,h:number,art?:number,wall?:string}} spec building spec
 * @returns {{tex:THREE.CanvasTexture,total:number,regions:object,plainU:number}}
 */
export function buildWallAtlas(spec) {
  const { w, d, h } = spec,
    total = 2 * w + 2 * d + 1,
    pxPerUnit = Math.min(36, 1800 / total),
    canvas = document.createElement("canvas");
  canvas.width = Math.ceil(total * pxPerUnit);
  canvas.height = Math.ceil(h * pxPerUnit);
  const ctx = canvas.getContext("2d");
  ctx.scale(canvas.width / total, canvas.height / h);
  const regions = { front: [0, w], right: [w, w + d], back: [w + d, 2 * w + d], left: [2 * w + d, 2 * w + 2 * d] },
    art = spec.art || 1;
  for (const [face, [u0, u1]] of Object.entries(regions)) {
    ctx.save();
    ctx.translate(u0, 0);
    ctx.scale(art, art);
    paintFacade(ctx, spec, face === "front" ? "front" : face === "back" ? "back" : "side", (u1 - u0) / art, h / art);
    ctx.restore();
  }
  ctx.fillStyle = spec.wall || "#f6f1e6";
  ctx.fillRect(2 * w + 2 * d, 0, 1, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, total, regions, plainU: (2 * w + 2 * d + 0.5) / total };
}

/**
 * Remaps a BoxGeometry's uv.x per face into the wall atlas.
 * Face order is three's BoxGeometry: +x, -x, +y, -y, +z, -z; the roof/floor faces
 * (null) sample the plain strip.
 */
export function remapBoxUvToAtlas(boxGeometry, atlas) {
  const uv = boxGeometry.attributes.uv;
  const faceRegions = [
    atlas.regions.right,
    atlas.regions.left,
    null,
    null,
    atlas.regions.front,
    atlas.regions.back,
  ];
  for (let face = 0; face < 6; face++) {
    for (let corner = 0; corner < 4; corner++) {
      const index = face * 4 + corner,
        region = faceRegions[face];
      if (region) uv.setX(index, (region[0] + uv.getX(index) * (region[1] - region[0])) / atlas.total);
      else uv.setXY(index, atlas.plainU, 0.5);
    }
  }
  uv.needsUpdate = true;
}

/** Points every uv of a geometry at the single texel (u, v). */
export function setAllUv(geometry, u, v) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u, v);
}

/** Wall material sampling the atlas, with rug-fibre fuzz scaled to atlas size. */
export function makeWallMaterial(atlas, spec, fiber) {
  const material = new THREE.MeshStandardMaterial({ map: atlas.tex, roughness: 1 });
  return applyCarpetPile(material, fiber, {
    scale: 7,
    bump: 0.1,
    fuzz: [0.06 / atlas.total, 0.06 / spec.h],
    tone: 0.22,
  });
}

/** Triangular prism for a gable roof end: base `depth` wide, `height` tall. */
export function makeGableGeometry(width, depth, height) {
  const shape = new THREE.Shape();
  shape.moveTo(-depth / 2, 0);
  shape.lineTo(depth / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  geometry.translate(0, 0, -width / 2);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}

/** 'rgb(r,g,b)' -> '#rrggbb' (other strings pass through). */
export function rgbToHex(color) {
  const m = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
  return m ? "#" + [m[1], m[2], m[3]].map((c) => (+c).toString(16).padStart(2, "0")).join("") : color;
}

/** Adds the two sloped roof slabs (light side / darker side) of a gabled roof to `batch`. */
export function addRoofSlabs(batch, width, depth, height, roofColor, overhang = 0.45, thickness = 0.28) {
  const slabHalf = depth / 2 + overhang,
    slope = Math.atan2(height, depth / 2),
    slabLength = Math.hypot(slabHalf, height * (slabHalf / (depth / 2)));
  for (const side of [-1, 1]) {
    const box = new THREE.BoxGeometry(width + overhang * 2, thickness, slabLength),
      uv = box.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) * (width + overhang * 2)) / 1.6, (uv.getY(i) * slabLength) / 1.3);
    }
    const slab = colorizeGeometry(box, side < 0 ? roofColor : rgbToHex(shadeColor(roofColor, -0.12)));
    slab.translate(0, 0, (side * slabLength) / 2);
    slab.rotateX(side * slope);
    slab.translate(0, height + thickness * 0.3 - overhang * Math.tan(slope) * 0, 0);
    batch.list.push(slab);
  }
}

/**
 * House: textured box body, gable end prism, merged roof slabs (+ optional chimney).
 * @returns {{body:THREE.BufferGeometry,gable:THREE.BufferGeometry,roof:THREE.BufferGeometry|null,wallMat:THREE.Material}}
 */
export function buildHouse(spec, materials) {
  const { w, d, h } = spec,
    roofH = spec.roofH ?? 2.8,
    atlas = buildWallAtlas(spec),
    body = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  remapBoxUvToAtlas(body, atlas);
  const gable = makeGableGeometry(w, d, roofH);
  setAllUv(gable, atlas.plainU, 0.5);
  const batch = new GeometryBatch();
  addRoofSlabs(batch, w, d, roofH, spec.roof, 0.7, 0.4);
  if (spec.chimney) {
    const art = spec.art || 1;
    batch.box(0.9 * art, 2.2 * art, 0.9 * art, "#a4553a", w * 0.22, roofH * 0.55 + 0.6 * art, -d * 0.36 + 0.45 * art);
    batch.box(1.1 * art, 0.25 * art, 1.1 * art, "#7d3d2a", w * 0.22, roofH * 0.55 + 1.75 * art, -d * 0.36 + 0.45 * art);
  }
  return { body, gable, roof: batch.merge(), wallMat: makeWallMaterial(atlas, spec, materials.fiber) };
}

/**
 * Flat-roofed building (shops, civic): wall box, thin roof slab painted with a
 * top-down texture (H/P/FIRE markings via paintFlatRoof), optional striped awning for shops.
 */
export function buildShopBuilding(spec, materials) {
  const { w, d, h } = spec,
    atlas = buildWallAtlas(spec),
    body = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  remapBoxUvToAtlas(body, atlas);
  const roofCanvas = document.createElement("canvas"),
    pxPerUnit = Math.min(40, 1024 / w);
  roofCanvas.width = Math.ceil(w * pxPerUnit);
  roofCanvas.height = Math.ceil(d * pxPerUnit);
  const ctx = roofCanvas.getContext("2d");
  ctx.scale(roofCanvas.width / w, roofCanvas.height / d);
  ctx.translate(w / 2, d / 2);
  if (Math.cos(spec.rot) < -0.5) ctx.rotate(Math.PI);
  paintFlatRoof(ctx, spec, w, d);
  const roofTex = new THREE.CanvasTexture(roofCanvas);
  roofTex.colorSpace = THREE.SRGBColorSpace;
  roofTex.anisotropy = 4;
  const slab = new THREE.BoxGeometry(w, 0.7, d).translate(0, 0.35, 0),
    slabUv = slab.attributes.uv;
  // every face except the top (index 2) samples one corner texel
  for (let face = 0; face < 6; face++) {
    if (face !== 2) for (let corner = 0; corner < 4; corner++) slabUv.setXY(face * 4 + corner, 0.01, 0.01);
  }
  const roofMat = applyCarpetPile(new THREE.MeshStandardMaterial({ map: roofTex, roughness: 1 }), materials.fiber, {
    scale: 7,
    bump: 0.12,
    fuzz: [0.14 / w, 0.14 / d],
  });
  let awning = null;
  if (spec.kind === "shop") {
    const batch = new GeometryBatch(),
      stripes = Math.round(w / 2);
    for (let i = 0; i < stripes; i++) {
      const stripe = colorizeGeometry(new THREE.BoxGeometry(w / stripes, 0.22, 2.4), i % 2 ? "#fff7e4" : spec.accent);
      stripe.rotateX(0.32);
      stripe.translate(-w / 2 + ((i + 0.5) * w) / stripes, h * 0.62, d / 2 + 1.05);
      batch.list.push(stripe);
    }
    awning = batch.merge();
  }
  return { body, slab, awning, roofMat, wallMat: makeWallMaterial(atlas, spec, materials.fiber) };
}
