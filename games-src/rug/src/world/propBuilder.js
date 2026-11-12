import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Returns a non-indexed copy of `geometry` with a flat per-vertex `color`
 * attribute from a CSS colour, and a zeroed `uv` if it has none.
 * RE: Color is parsed by THREE.Color, so color management converts sRGB hex
 * to linear for vertex colours (same as the original).
 */
export function colorizeGeometry(geometry, cssColor) {
  geometry = geometry.index ? geometry.toNonIndexed() : geometry;
  const color = new THREE.Color(cssColor);
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  if (!geometry.attributes.uv) {
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  return geometry;
}

/**
 * Accumulates coloured primitives and merges them into one BufferGeometry
 * (one draw call per prop). Rotation order applied: X, Z, Y, then translate.
 */
export class GeometryBatch {
  constructor() {
    this.list = [];
  }

  /** Add a geometry with colour, position (x,y,z) and rotations (rotY, rotX, rotZ). */
  add(geometry, color, x = 0, y = 0, z = 0, rotY = 0, rotX = 0, rotZ = 0) {
    const g = colorizeGeometry(geometry, color);
    if (rotX) g.rotateX(rotX);
    if (rotZ) g.rotateZ(rotZ);
    if (rotY) g.rotateY(rotY);
    g.translate(x, y, z);
    this.list.push(g);
    return g;
  }

  /** Add a coloured box (w,h,d) at (x,y,z) with optional yaw. */
  box(w, h, d, color, x, y, z, rotY = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, rotY);
  }

  /** Merge everything into one geometry (null if empty). */
  merge() {
    return this.list.length ? mergeGeometries(this.list, false) : null;
  }
}
