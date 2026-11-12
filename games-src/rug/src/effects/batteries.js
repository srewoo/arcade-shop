import * as THREE from "three";
import { PILE_HEIGHT } from "../world/fiberTextures.js";

/** 256x256 battery label texture: green body, yellow top band, two lightning bolts. (original: Dw) */
function makeBatteryTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1f9d55";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#f2c21b";
  ctx.fillRect(0, 0, 256, 70);
  ctx.fillStyle = "#157a41";
  ctx.fillRect(0, 70, 256, 8);
  for (const cx of [64, 192]) {
    ctx.fillStyle = "#fff36a";
    ctx.strokeStyle = "#0e5a30";
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx + 14, 96);
    ctx.lineTo(cx - 26, 176);
    ctx.lineTo(cx - 2, 176);
    ctx.lineTo(cx - 16, 236);
    ctx.lineTo(cx + 28, 150);
    ctx.lineTo(cx + 4, 150);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Boost pickups: giant standing AA batteries with a pulsing additive glow ring on the rug.
 * (original: Uw)
 * @param {THREE.Scene} scene
 * @param {{x:number,z:number}[]} pads pad positions
 * @returns {{setPads(pads:object[]):void, update(time:number, dt:number, visibility:(x:number,z:number)=>number, taken?:number[]):void}}
 *   `visibility(x,z)` -> 0..1 (distance/fog fade); `taken[i] > 0` hides pad i (picked up, respawning)
 */
export function createBoostBatteries(scene, pads) {
  const bodyMat = new THREE.MeshPhysicalMaterial({
    map: makeBatteryTexture(),
    roughness: 0.28,
    metalness: 0.15,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: "#d9dde2", roughness: 0.22, metalness: 0.9 });
  const radius = 0.75;
  const height = 3.9;
  const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 28).translate(0, height / 2, 0);
  const capGeo = new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.14, 28);
  const nubGeo = new THREE.CylinderGeometry(radius * 0.36, radius * 0.36, 0.32, 18);
  const glowUniforms = { uTime: { value: 0 } };
  const glowMat = new THREE.ShaderMaterial({
    uniforms: glowUniforms,
    vertexShader:
      "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      void main(){
        float d = length(vUv * 2.0 - 1.0);
        float ring = smoothstep(0.25, 0.0, abs(d - (0.45 + 0.3 * fract(uTime * 0.9)))) * (1.0 - fract(uTime * 0.9));
        float core = smoothstep(0.7, 0.0, d) * 0.45;
        gl_FragColor = vec4(vec3(1.0, 0.95, 0.35) * 1.6, (ring + core) * smoothstep(1.0, 0.8, d));
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const glowGeo = new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2);

  let current = pads;
  let items = [];

  /** Build the battery meshes for a pad set (called once, and again when the pad density changes). */
  const build = (padSet) => {
    for (const item of items) scene.remove(item.root);
    current = padSet;
    items = padSet.map((pad, index) => {
      const root = new THREE.Group();
      root.position.set(pad.x, 0, pad.z);
      const battery = new THREE.Group();
      const parts = [
        new THREE.Mesh(bodyGeo, bodyMat),
        new THREE.Mesh(capGeo, metalMat),
        new THREE.Mesh(capGeo, metalMat),
        new THREE.Mesh(nubGeo, metalMat),
      ];
      parts[1].position.y = 0.02;
      parts[2].position.y = height;
      parts[3].position.y = height + 0.2;
      for (const part of parts) {
        part.castShadow = true;
        battery.add(part);
      }
      battery.rotation.z = 0.22;
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = 0.13 + PILE_HEIGHT;
      glow.renderOrder = 2;
      root.add(battery, glow);
      scene.add(root);
      return { root, battery, glow, shown: 1, phase: index * 1.7 };
    });
  };
  build(pads);

  return {
    /** Swap to another pad set (no-op if it is the one already shown). */
    setPads(padSet) {
      if (padSet !== current) build(padSet);
    },
    update(time, dt, visibility, taken) {
      glowUniforms.uTime.value = time;
      items.forEach((item, i) => {
        const vis = Math.min(1, visibility(current[i].x, current[i].z));
        const target = taken && taken[i] > 0 ? 0 : 1;
        item.shown += (target - item.shown) * Math.min(1, dt * (target ? 6 : 16));
        const scale = vis * item.shown;
        item.root.visible = vis > 0.02;
        item.battery.visible = scale > 0.03;
        item.battery.scale.setScalar(Math.max(0.001, scale));
        item.battery.position.y = 0.5 + 0.3 * Math.sin(time * 2.2 + item.phase);
        item.battery.rotation.y = time * 1.6 + item.phase;
        item.glow.scale.setScalar(Math.max(0.001, vis * (0.35 + 0.65 * item.shown)));
      });
    },
  };
}
