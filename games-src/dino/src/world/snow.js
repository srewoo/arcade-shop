// Snow environment: falling snow particles plus a shader tweak that dusts upward-facing surfaces of the
// shared prop / scatter materials (cacti, rocks, dunes, obstacles) with white.
import * as THREE from 'three';
import { ParticleCloud } from './particles.js';

const MAX_FLAKES = 1600;

/** Shared uniforms: uSnow = dusting amount 0..1, uUpView = world up in view space (updated per frame). */
export const snowUniforms = { uSnow: { value: 0 }, uUpView: { value: new THREE.Vector3(0, 1, 0) } };

/** Patch a Lambert material so up-facing surfaces fade to white by uSnow.  Call before its first render. */
export function addSnowDust(material) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, snowUniforms);
    shader.fragmentShader = `uniform float uSnow;\nuniform vec3 uUpView;\n${shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      float snowAmt = uSnow * smoothstep(0.25, 0.75, dot(normal, uUpView));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.96, 1.0), snowAmt);`,
    )}`;
  };
  material.customProgramCacheKey = () => 'snow-dust';
}

export class SnowFall {
  constructor(scene) {
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, transparent: true, opacity: 0.92, depthWrite: false });
    this.cloud = new ParticleCloud(scene, mat, MAX_FLAKES, false);
  }
  setBudget(count) {
    this.cloud.setCount(count);
  }
  update(dt, camera, { speed, worldSpeed, time }) {
    this.cloud.step(dt, camera, { fallSpeed: 3.2 * speed, sway: 1.4 * speed, worldSpeed, time });
  }
}
