import * as THREE from "three";
import { RUG } from "../world/layoutSelect.js";

const MAX_SEGMENTS = 96; // Kc: tyre-mark quads per frame

/**
 * Tyre-trail / pressed-pile map: an orthographic top-down render target covering the
 * whole rug (1024 px wide). Cars add ink segments; the texture (R = ink value,
 * A = strength via aInk.y) is sampled by the rug shader (uTrail) to flatten the pile.
 * Every 1.5 s a 0.02-alpha grey quad is drawn so old marks slowly fade back to 0.5.
 * (original: Iw)
 * @param {THREE.WebGLRenderer} renderer
 */
export function createTrailMap(renderer) {
  const height = Math.round((1024 * RUG.H) / RUG.W);
  const target = new THREE.WebGLRenderTarget(1024, height, { depthBuffer: false });
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const positions = new THREE.BufferAttribute(new Float32Array(MAX_SEGMENTS * 18), 3);
  const inks = new THREE.BufferAttribute(new Float32Array(MAX_SEGMENTS * 12), 2);
  positions.setUsage(THREE.DynamicDrawUsage);
  inks.setUsage(THREE.DynamicDrawUsage);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", positions);
  geometry.setAttribute("aInk", inks);

  const marks = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial({
      uniforms: { uHalf: { value: new THREE.Vector2(RUG.W / 2, RUG.H / 2) } },
      vertexShader: `
      attribute vec2 aInk; uniform vec2 uHalf; varying vec2 vInk; varying float vAcross;
      void main(){ vInk = aInk; vAcross = position.z; gl_Position = vec4(position.xy / uHalf, 0.0, 1.0); }`,
      fragmentShader: `
      varying vec2 vInk; varying float vAcross;
      void main(){ gl_FragColor = vec4(vec3(vInk.x), vInk.y * smoothstep(1.0, 0.35, abs(vAcross))); }`,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  marks.frustumCulled = false;

  const fadeUniforms = { uAlpha: { value: 1 } };
  const fadeQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: fadeUniforms,
      vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: "uniform float uAlpha; void main(){ gl_FragColor = vec4(vec3(0.5), uAlpha); }",
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  fadeQuad.frustumCulled = false;
  fadeQuad.renderOrder = -1;
  scene.add(fadeQuad, marks);

  let count = 0; // segments queued this frame
  let sinceFade = 0;
  let needsClear = true;

  const api = {
    texture: target.texture,
    /** Wipe the whole trail map on next render. */
    reset() {
      needsClear = true;
      count = 0;
    },
    /**
     * Queue a tyre segment from (x0,z0) to (x1,z1) of the given width.
     * `ink`/`strength` go to aInk.x / aInk.y.
     */
    add(x0, z0, x1, z1, width, ink, strength) {
      if (count >= MAX_SEGMENTS) return;
      let dx = x1 - x0;
      let dz = z1 - z0;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
      const nx = (-dz * width) / 2;
      const nz = (dx * width) / 2;
      const ext = width * 0.1; // slight overlap along the travel direction
      const ax = x0 - dx * ext;
      const az = z0 - dz * ext;
      const bx = x1 + dx * ext;
      const bz = z1 + dz * ext;
      [
        [ax - nx, az - nz, -1],
        [ax + nx, az + nz, 1],
        [bx - nx, bz - nz, -1],
        [ax + nx, az + nz, 1],
        [bx + nx, bz + nz, 1],
        [bx - nx, bz - nz, -1],
      ].forEach((v, k) => {
        positions.setXYZ(count * 6 + k, v[0], v[1], v[2]);
        inks.setXY(count * 6 + k, ink, strength);
      });
      count++;
    },
    render(dt) {
      sinceFade += dt;
      const fade = needsClear || sinceFade > 1.5;
      if (!fade && !count) return;
      fadeQuad.visible = fade;
      fadeUniforms.uAlpha.value = needsClear ? 1 : 0.02;
      if (fade) {
        sinceFade = 0;
        needsClear = false;
      }
      marks.visible = count > 0;
      geometry.setDrawRange(0, count * 6);
      if (count) {
        positions.needsUpdate = true;
        inks.needsUpdate = true;
      }
      const prevTarget = renderer.getRenderTarget();
      const prevAutoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(prevTarget);
      renderer.autoClear = prevAutoClear;
      count = 0;
    },
  };
  api.render(0);
  return api;
}
