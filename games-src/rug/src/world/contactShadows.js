import * as THREE from "three";
import { PILE_HEIGHT } from "./fiberTextures.js";
import { makeSoftBlobTexture } from "./softBlob.js";

/**
 * Cheap contact shadows: two InstancedMeshes of unit quads lying on the rug
 * ("round" = circular blob, "rect" = squircle blob). Each instance has a
 * per-instance `aStrength` attribute; the fragment shader outputs a grey that
 * is multiplied into the framebuffer (src = DstColor, dst = Zero), darkening
 * the rug underneath by up to 62%.
 *
 * Usage per frame: begin(); add(...)*; end().
 */
export class ContactShadows {
  /**
   * @param {THREE.Object3D} parent scene/group to attach both meshes to
   * @param {number} capacity max instances per mesh kind
   */
  constructor(parent, capacity = 400) {
    /** @type {unknown[]} RE: never used in the bundle */
    this.entries = [];
    /** @type {Record<string, {mesh: THREE.InstancedMesh, strength: THREE.InstancedBufferAttribute, n: number}>} */
    this.meshes = {};
    for (const round of [true, false]) {
      const geometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      const strength = new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1);
      geometry.setAttribute("aStrength", strength);
      const material = new THREE.ShaderMaterial({
        uniforms: { map: { value: makeSoftBlobTexture(round) } },
        vertexShader: `
          attribute float aStrength; varying float vS; varying vec2 vUv;
          void main(){ vUv = uv; vS = aStrength; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform sampler2D map; varying float vS; varying vec2 vUv;
          void main(){ float a = texture2D(map, vUv).a * vS; gl_FragColor = vec4(vec3(1.0 - a * 0.62), 1.0); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.DstColorFactor,
        blendDst: THREE.ZeroFactor,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const mesh = new THREE.InstancedMesh(geometry, material, capacity);
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      parent.add(mesh);
      this.meshes[round ? "round" : "rect"] = { mesh, strength, n: 0 };
    }
    // scratch objects
    this.matrix = new THREE.Matrix4();
    this.quaternion = new THREE.Quaternion();
    this.position = new THREE.Vector3();
    this.scale = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
  }

  /** Reset instance counts for a new frame. */
  begin() {
    for (const key in this.meshes) this.meshes[key].n = 0;
  }

  /**
   * Queue one shadow quad.
   * @param {number} x world x
   * @param {number} z world z
   * @param {number} sizeX quad scale along local x
   * @param {number} sizeZ quad scale along local z
   * @param {number} rotY yaw (radians)
   * @param {boolean} round true -> circular blob mesh, false -> squircle mesh
   * @param {number} strength 0..1 shadow strength; <= 0.003 is skipped
   */
  add(x, z, sizeX, sizeZ, rotY, round, strength) {
    if (strength <= 0.003) return;
    const entry = this.meshes[round ? "round" : "rect"];
    if (entry.n >= entry.strength.count) return;
    this.position.set(x, 0.05 + PILE_HEIGHT, z);
    this.quaternion.setFromAxisAngle(this.up, rotY);
    this.scale.set(sizeX, 1, sizeZ);
    this.matrix.compose(this.position, this.quaternion, this.scale);
    entry.mesh.setMatrixAt(entry.n, this.matrix);
    entry.strength.array[entry.n] = strength;
    entry.n++;
  }

  /** Commit counts and flag buffers for upload. */
  end() {
    for (const key in this.meshes) {
      const entry = this.meshes[key];
      entry.mesh.count = entry.n;
      entry.mesh.instanceMatrix.needsUpdate = true;
      entry.strength.needsUpdate = true;
    }
  }
}
