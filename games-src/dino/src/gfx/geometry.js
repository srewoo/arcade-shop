// Procedural low-poly geometry helpers.  Everything in the game is built from vertex-coloured
// primitives that are baked (transform + colour) and merged into one BufferGeometry per prop.
// Bundle symbols: B bake, Al mergeAndShade, jl box, Ml warpByZ, Nl warpByY, mu jitter, Pl PROP_MATERIAL.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const _c = new THREE.Color();

/**
 * Bake a primitive: de-index, optionally warp vertices, apply pos/rot/scale, paint a flat vertex colour,
 * and strip uv + normal so that all pieces can be merged.
 * @param {THREE.BufferGeometry} geometry consumed (disposed) by this call
 * @param {number} color 0xRRGGBB
 * @param {{pos?:number[], rot?:number[], scale?:number[], warp?:(v:THREE.Vector3)=>void}} [opts]
 */
export function bake(geometry, color, { pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1], warp } = {}) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  geometry.dispose();
  const position = g.attributes.position;
  if (warp) {
    for (let i = 0; i < position.count; i++) {
      _v.fromBufferAttribute(position, i);
      warp(_v);
      position.setXYZ(i, _v.x, _v.y, _v.z);
    }
  }
  _m.compose(_p.set(...pos), _q.setFromEuler(_e.set(...rot)), _s.set(...scale));
  g.applyMatrix4(_m);
  _c.set(color);
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    colors[i * 3] = _c.r;
    colors[i * 3 + 1] = _c.g;
    colors[i * 3 + 2] = _c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  return g;
}

/** Merge baked parts into one geometry (disposing the parts) and compute flat-ish normals. */
export function mergeAndShade(parts) {
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

export const box = (w, h, d, sx = 1, sy = 1, sz = 1) => new THREE.BoxGeometry(w, h, d, sx, sy, sz);

/** Taper a box along z: (frontX, frontY) scale vertices with z<0, (backX, backY) those with z>0. */
export const taperZ = (frontX, frontY, backX, backY) => (v) => {
  if (v.z < -1e-4) {
    v.x *= frontX;
    v.y *= frontY;
  } else if (v.z > 1e-4) {
    v.x *= backX;
    v.y *= backY;
  }
};

/** Taper along y: (topX, topZ) for y>0, (bottomX, bottomZ) for y<0. */
export const taperY = (topX, topZ, bottomX, bottomZ) => (v) => {
  if (v.y > 1e-4) {
    v.x *= topX;
    v.z *= topZ;
  } else if (v.y < -1e-4) {
    v.x *= bottomX;
    v.z *= bottomZ;
  }
};

/** Deterministic per-vertex scale jitter (hash of position) used to make rocks / dunes lumpy. */
export const jitter = (amount) => (v) => {
  const n = Math.sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) * 43758.5453;
  v.multiplyScalar(1 - amount + 2 * amount * (n - Math.floor(n)));
};

/** Shared Lambert material for every vertex-coloured prop (dino, cacti, pteros...). */
export const PROP_MATERIAL = new THREE.MeshLambertMaterial({ vertexColors: true });
