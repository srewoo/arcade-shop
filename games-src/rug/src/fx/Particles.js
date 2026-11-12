/**
 * Particle system (original: class Yw, instance `ci`).
 * Three layers, all drawn as soft round point sprites with a tiny custom shader:
 *   1. a 900-slot ring buffer of short-lived particles: kind 0 = dust puff, kind 1 = rug fibres,
 *      coloured by sampling the rug texture under the emitter (so puffs match the floor);
 *   2. 420 floating dust motes that wrap inside an 80x40x80 box around the camera (additive);
 *   3. 90 "speed lines" parented to the camera, visible only while boosting.
 */
import { emitterMethods } from "./emitters.js";
import * as THREE from "three";
import { mulberry32 } from "../util/math.js";

/** 64px radial-gradient sprite. */
function makeSoftDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.65)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

const PARTICLE_VERT = `
  attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
  uniform float uScale;
  varying float vAlpha; varying vec3 vColor;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uScale / -mv.z, 0.0, 180.0);
    vAlpha = aAlpha; vColor = aColor;
  }`;
const PARTICLE_FRAG = `
  uniform sampler2D uMap; uniform float uGain;
  varying float vAlpha; varying vec3 vColor;
  void main(){
    vec4 t = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor * uGain, t.a * vAlpha);
  }`;

export class Particles {
  /**
   * @param scene   world scene
   * @param camera  perspective camera (speed lines are its children)
   * @param lookup  rug colour lookup {at(x,z)->[r,g,b] 0..1} (Be.lookup)
   */
  constructor(scene, camera, lookup) {
    this.scene = scene;
    this.camera = camera;
    this.lookup = lookup;
    this.rnd = mulberry32(5);
    this.sparkRnd = mulberry32(61); // separate stream so sparks never shift the dust/fibre sequence
    const softDot = makeSoftDotTexture();

    this.buildRing(scene, softDot);
    this.buildDust(scene, softDot);
    this.buildSpeedLines(camera);
  }

  /** 1. ring-buffer particles (dust puffs, fibres, sparks). */
  buildRing(scene, softDot) {
    const count = 900;
    this.N = count;
    /** 1 = normal; 0.4 = Reduce motion. */
    this.density = 1;
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.col = new Float32Array(count * 3);
    this.size = new Float32Array(count);
    this.alpha = new Float32Array(count);
    this.life = new Float32Array(count);
    this.maxLife = new Float32Array(count).fill(1);
    this.kind = new Uint8Array(count);
    this.baseSize = new Float32Array(count);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(this.col, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    this.uniforms = { uMap: { value: softDot }, uScale: { value: 800 }, uGain: { value: 1 } };
    this.points = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        transparent: true,
        depthWrite: false,
      }),
    );
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this.next = 0; // ring-buffer write head

  }

  /** 2. ambient dust motes. */
  buildDust(scene, softDot) {
    const dustCount = 420;
    this.D = dustCount;
    this.dustBase = new Float32Array(dustCount * 3);
    this.dustPos = new Float32Array(dustCount * 3);
    const dustSize = new Float32Array(dustCount);
    const dustAlpha = new Float32Array(dustCount);
    const dustColor = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      this.dustBase[i * 3] = this.rnd() * 80;
      this.dustBase[i * 3 + 1] = this.rnd() * 40;
      this.dustBase[i * 3 + 2] = this.rnd() * 80;
      dustSize[i] = 0.05 + this.rnd() * 0.1;
      dustAlpha[i] = 0.15 + this.rnd() * 0.35;
      dustColor[i * 3] = 1;
      dustColor[i * 3 + 1] = 0.9;
      dustColor[i * 3 + 2] = 0.72;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(this.dustPos, 3));
    dustGeometry.setAttribute("aSize", new THREE.BufferAttribute(dustSize, 1));
    dustGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(dustAlpha, 1));
    dustGeometry.setAttribute("aColor", new THREE.BufferAttribute(dustColor, 3));
    this.dustUniforms = { uMap: { value: softDot }, uScale: { value: 800 }, uGain: { value: 1.6 } };
    this.dust = new THREE.Points(
      dustGeometry,
      new THREE.ShaderMaterial({
        uniforms: this.dustUniforms,
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.dust.frustumCulled = false;
    this.dust.renderOrder = 6;
    scene.add(this.dust);

  }

  /** 3. speed lines (camera space). */
  buildSpeedLines(camera) {
    const lineCount = 90;
    this.S = lineCount;
    this.lines = new Float32Array(lineCount * 6);
    this.lineData = [];
    for (let i = 0; i < lineCount; i++) this.lineData.push(this.spawnLine({}, true));
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(this.lines, 3));
    const lineColors = new Float32Array(lineCount * 8); // per segment: RGBA at tail (a=0) and head (a=0.9)
    for (let i = 0; i < lineCount; i++) lineColors.set([1, 1, 1, 0, 1, 1, 1, 0.9], i * 8);
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 4));
    this.lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    this.speedLines = new THREE.LineSegments(lineGeometry, this.lineMat);
    this.speedLines.frustumCulled = false;
    this.speedLines.renderOrder = 10;
    camera.add(this.speedLines);
    this.boostAmt = 0;
  }

  /** (Re)initialise one speed line at a random ring position; `initial` scatters it along the depth. */
  spawnLine(line, initial) {
    const angle = this.rnd() * Math.PI * 2;
    const radius = 2.2 + this.rnd() * 5.5;
    line.x = Math.cos(angle) * radius * 1.5;
    line.y = Math.sin(angle) * radius * 0.85;
    line.z = initial ? -this.rnd() * 40 : -40 - this.rnd() * 6;
    line.len = 2 + this.rnd() * 4;
    line.speed = 0.8 + this.rnd() * 0.5;
    return line;
  }

  /**
   * Spawn one particle into the ring buffer.
   * @param kind 0 puff / 1 fibre  @param x,y,z position  @param vx,vy,vz velocity
   * @param size base size  @param life seconds  @param color [r,g,b] linear
   */
  emit(kind, x, y, z, vx, vy, vz, size, life, color) {
    const i = this.next;
    this.next = (this.next + 1) % this.N;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = color[0];
    this.col[i * 3 + 1] = color[1];
    this.col[i * 3 + 2] = color[2];
    this.baseSize[i] = size;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.kind[i] = kind;
  }

  /** Rug colour at (x,z), brightened by `boost` and converted sRGB -> linear (gamma 2.2). */
  rugColor(x, z, boost = 0.1) {
    return this.lookup.at(x, z).map((c) => Math.pow(Math.min(1, c * (1 + boost) + 0.04), 2.2));
  }

  clear() {
    this.life.fill(0);
    this.alpha.fill(0);
  }

  /**
   * @param dt frame time  @param time clock (dust drift)  @param viewportHeight px (point-size scale)
   * @param boostTarget 0..1 boost amount  @param cameraDistance camera height-ish (dust fades out above 90 -> gone at 150)
   */
  update(dt, time, viewportHeight, boostTarget, cameraDistance) {
    const cam = this.camera;
    // pixel scale for gl_PointSize: viewportHeight / (2*tan(fov/2))
    const scale = viewportHeight / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    this.uniforms.uScale.value = scale;
    this.dustUniforms.uScale.value = scale;

    for (let i = 0; i < this.N; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const age = 1 - this.life[i] / this.maxLife[i]; // 0 -> 1
      const kind = this.kind[i];
      const drag = kind === 0 ? 3.2 : 1.2; // horizontal drag
      this.vel[i * 3] *= Math.exp(-drag * dt);
      this.vel[i * 3 + 2] *= Math.exp(-drag * dt);
      // vertical: puffs float (drag 2.5, gravity 1.2); fibres fall (drag 0.5, gravity 9)
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * Math.exp(-(kind === 0 ? 2.5 : 0.5) * dt) - (kind === 0 ? 1.2 : 9) * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] = Math.max(0.05, this.pos[i * 3 + 1] + this.vel[i * 3 + 1] * dt);
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = this.baseSize[i] * (kind === 0 ? 1 + age * 1.6 : 1); // puffs grow
      this.alpha[i] = (kind === 0 ? 0.85 : 1) * (1 - age) * Math.min(1, age * 8 + 0.2);
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aColor.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;

    // ambient dust: slow sinusoidal drift, wrapped into a box centred on the camera
    const boxX = 80;
    const boxY = 40;
    const boxZ = 80;
    const minX = cam.position.x - boxX / 2;
    const minY = Math.max(0, cam.position.y - boxY / 2);
    const minZ = cam.position.z - boxZ / 2;
    for (let i = 0; i < this.D; i++) {
      const x = this.dustBase[i * 3] + Math.sin(time * 0.13 + i) * 1.5 + time * 0.35;
      const y = this.dustBase[i * 3 + 1] + Math.sin(time * 0.21 + i * 1.7) * 1.2 - time * 0.12;
      const z = this.dustBase[i * 3 + 2] + Math.cos(time * 0.17 + i * 0.7) * 1.5;
      this.dustPos[i * 3] = minX + ((((x - minX) % boxX) + boxX) % boxX);
      this.dustPos[i * 3 + 1] = minY + ((((y - minY) % boxY) + boxY) % boxY);
      this.dustPos[i * 3 + 2] = minZ + ((((z - minZ) % boxZ) + boxZ) % boxZ);
    }
    this.dust.geometry.attributes.position.needsUpdate = true;
    this.dustUniforms.uGain.value = 1.6 * Math.max(0, Math.min(1, (90 - cameraDistance) / 60));
    this.dust.visible = this.dustUniforms.uGain.value > 0.01;

    // speed lines
    this.boostAmt += (boostTarget - this.boostAmt) * Math.min(1, dt * 6);
    this.lineMat.opacity = this.boostAmt * 0.55;
    this.speedLines.visible = this.boostAmt > 0.02;
    if (this.speedLines.visible) {
      for (let i = 0; i < this.S; i++) {
        const line = this.lineData[i];
        line.z += 90 * line.speed * dt; // rush toward the camera
        if (line.z > -1.5) this.spawnLine(line, false);
        const length = line.len * (0.5 + this.boostAmt);
        this.lines.set([line.x, line.y, line.z, line.x, line.y, line.z + length], i * 6);
      }
      this.speedLines.geometry.attributes.position.needsUpdate = true;
    }
  }
}

Object.assign(Particles.prototype, emitterMethods);
