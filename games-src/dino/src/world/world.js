// Desert environment: gradient sky dome, sun, lights + shadow rig, infinite ground, scattered rocks / scrub /
// dunes / mesas / cacti, far mesa backdrop and drifting clouds (bundle class `gu`).
import * as THREE from 'three';
import { PALETTE as C, GROUND_TILE, FOG_NEAR, FOG_FAR } from '../config.js';
import { rand } from '../util.js';
import { bake, mergeAndShade, jitter } from '../gfx/geometry.js';
import { buildCactusGeometry } from '../obstacles/cactus.js';
import { makeGroundTexture, makeSnowTexture, makeSunGlowTexture } from './textures.js';
import { Scatter } from './scatter.js';
import { DayNight } from './daynight.js';
import { KEYFRAMES } from './biomes.js';
import { Weather } from './weather.js';
import { addSnowDust } from './snow.js';
import { PROP_MATERIAL } from '../gfx/geometry.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color(), _c4 = new THREE.Color(), _c5 = new THREE.Color();
const PALETTE_DAY = KEYFRAMES[0];

const SKY_RADIUS = 1500;
const SUN_DISTANCE = 1350;

export class World {
  /** @param opts {mobile:boolean} halves shadow-map size and scatter counts */
  constructor(scene, renderer, { mobile }) {
    this.scene = scene;
    this.renderer = renderer;
    this.mobile = mobile;
    this.speed = 0; // player speed while running (particles slide past the camera at this rate)
    scene.background = new THREE.Color(C.horizon);
    scene.fog = new THREE.Fog(C.horizon, FOG_NEAR, FOG_FAR);
    const sunDir = (this.sunDir = new THREE.Vector3(0.24, 0.2, -0.95).normalize());
    const shadowDir = new THREE.Vector3(0.3, 0.34, -0.89).normalize();
    this._buildSky(scene, sunDir);
    this._buildLights(scene, shadowDir, mobile);
    this._buildGround(scene, renderer);
    this._buildScatters(scene, mobile);
    this._buildBackdrop(scene);
    addSnowDust(this.scatterMat);
    addSnowDust(PROP_MATERIAL);
    this._layoutClouds(0);
    this.dayNight = new DayNight(this);
    this.weather = new Weather(scene);
    this.weatherId = 'auto';
    this.reset(0);
  }

  _buildSky(scene, sunDir) {
    const dome = new THREE.SphereGeometry(SKY_RADIUS, 48, 28);
    this._horizon = new THREE.Color(C.horizon);
    dome.setAttribute('color', new THREE.BufferAttribute(new Float32Array(dome.attributes.position.count * 3), 3));
    this._dome = dome;
    this.sky = new THREE.Mesh(
      dome,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }),
    );
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    scene.add(this.sky);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(46, 40),
      new THREE.MeshBasicMaterial({ color: C.sunDisc, fog: false, depthWrite: false, toneMapped: false }),
    );
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(1500, 1500),
      new THREE.MeshBasicMaterial({
        map: makeSunGlowTexture(), transparent: true, blending: THREE.AdditiveBlending,
        fog: false, depthWrite: false, toneMapped: false,
      }),
    );
    this.sunDisc = disc;
    this.sunHalo = halo;
    for (const m of [halo, disc]) {
      m.frustumCulled = false;
      this.sky.add(m);
    }
    disc.renderOrder = -9;
    halo.renderOrder = -8;
    this.placeSun();
    this._paintSky(PALETTE_DAY);
  }

  /** Move the sun/moon disc + halo to the current `sunDir`. */
  placeSun() {
    for (const m of [this.sunHalo, this.sunDisc]) {
      m.position.copy(this.sunDir).multiplyScalar(SUN_DISTANCE);
      m.lookAt(0, 0, 0);
    }
  }

  /** Recolour the sky dome's vertex gradient from a palette (see biomes.js); glow follows `sunDir`. */
  _paintSky(pal) {
    const top = _c1.setHex(pal.skyTop), mid = _c2.setHex(pal.skyMid), low = _c3.setHex(pal.skyLow);
    const horizon = _c4.setHex(pal.horizon), glow = _c5.setHex(pal.sunGlow);
    const colors = this._dome.attributes.color;
    const pos = this._dome.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      _p.fromBufferAttribute(pos, i).normalize();
      const h = _p.y; // height above horizon, 0..1
      // 4-stop vertical gradient: horizon -> low (0.01..0.1) -> mid (..0.34) -> top (..0.84)
      if (h <= 0.01) _c.copy(horizon);
      else if (h < 0.1) _c.copy(horizon).lerp(low, (h - 0.01) / 0.09);
      else if (h < 0.34) _c.copy(low).lerp(mid, (h - 0.1) / 0.24);
      else _c.copy(mid).lerp(top, Math.min(1, (h - 0.34) / 0.5));
      const toSun = Math.max(0, _p.dot(this.sunDir));
      _c.lerp(glow, Math.min(1, 0.85 * toSun ** 7 + 0.22 * toSun * toSun * Math.max(0, 1 - h * 1.6)));
      colors.setXYZ(i, _c.r, _c.g, _c.b);
    }
    colors.needsUpdate = true;
  }

  _buildLights(scene, shadowDir, mobile) {
    this.hemi = new THREE.HemisphereLight(C.skyFill, C.bounce, 0.85);
    scene.add(this.hemi);
    this.rim = new THREE.DirectionalLight(C.rim, 1.1);
    this.rim.position.set(-0.6, 0.55, 0.9);
    scene.add(this.rim);
    this.sun = new THREE.DirectionalLight(C.sunLight, 5.6);
    this.sunOffset = shadowDir.clone().multiplyScalar(90);
    this.sun.castShadow = true;
    this.shadowSize = mobile ? 1024 : 2048;
    this.shadowRange = 30; // half-extent of the orthographic shadow frustum
    this.sun.shadow.mapSize.set(this.shadowSize, this.shadowSize);
    const cam = this.sun.shadow.camera;
    cam.left = cam.bottom = -this.shadowRange;
    cam.right = cam.top = this.shadowRange;
    cam.near = 1;
    cam.far = 220;
    this.sun.shadow.bias = -5e-4;
    this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun, this.sun.target);
    // soft fill light that travels with the player (only lit at night / in rain so obstacles stay readable)
    this.fill = new THREE.PointLight(0xaec4ff, 0, 26, 1.2);
    scene.add(this.fill);
    // light-space basis used to snap the shadow frustum to texel increments (prevents shimmering)
    const dir = this.sunOffset.clone().normalize();
    this._lr = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
    this._lu = dir.clone().cross(this._lr).normalize();
    this._ld = dir;
  }

  _buildGround(scene, renderer) {
    const tex = makeGroundTexture();
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const size = 3000;
    tex.repeat.set(size / GROUND_TILE, size / GROUND_TILE);
    this.sandTex = tex;
    this.snowTex = makeSnowTexture();
    this.snowTex.anisotropy = tex.anisotropy;
    this.snowTex.repeat.copy(tex.repeat);
    // Phong with a black specular is the same diffuse look as Lambert; Rain raises the specular for a wet sheen.
    this.groundMat = new THREE.MeshPhongMaterial({ map: tex, specular: 0x000000, shininess: 30 });
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    scene.add(this.ground);
  }

  _buildScatters(scene, mobile) {
    const mat = (this.scatterMat = new THREE.MeshLambertMaterial({ vertexColors: true }));
    const pebble = mergeAndShade([bake(new THREE.IcosahedronGeometry(1, 0), C.rock, { scale: [1, 0.6, 1], warp: jitter(0.18) })]);
    const boulder = mergeAndShade([bake(new THREE.IcosahedronGeometry(1, 1), C.rock, { scale: [1, 0.72, 1], warp: jitter(0.2) })]);
    const scrub = mergeAndShade(
      [0, 1, 2, 3, 4, 5].map((i) =>
        bake(new THREE.ConeGeometry(0.05, 0.6, 3), i % 2 ? C.scrub : 9407058, {
          pos: [Math.cos(i * 1.05) * 0.1, 0.24, Math.sin(i * 1.05) * 0.1],
          rot: [Math.sin(i * 1.05) * 0.5, 0, -Math.cos(i * 1.05) * 0.5],
        }),
      ),
    );
    const dune = mergeAndShade([bake(new THREE.IcosahedronGeometry(1, 2), C.dune, { warp: jitter(0.07) })]);
    const mesa = mergeAndShade([
      bake(new THREE.CylinderGeometry(0.72, 1, 1, 7), C.mesa, { pos: [0, 0.5, 0], warp: jitter(0.05) }),
      bake(new THREE.CylinderGeometry(1.05, 1.3, 0.22, 7), C.mesa, { pos: [0, 0.11, 0] }),
    ]);
    const cactusTall = buildCactusGeometry({
      h: 1.6, r: 0.25,
      arms: [{ side: -1, y: 0.7, len: 0.22, up: 0.5 }, { side: 1, y: 0.95, len: 0.2, up: 0.38 }],
    });
    const cactusFlower = buildCactusGeometry({ h: 1.15, r: 0.22, arms: [{ side: 1, y: 0.5, len: 0.18, up: 0.3 }], flower: true });
    // [geometry, instance count, options] -- near-track props first, distant dunes/mesas last
    this.scatters = [
      new Scatter(scene, pebble, mat, mobile ? 110 : 170, { span: 320, x: [1.4, 30], bias: 2.2, scale: [0.05, 0.2], sink: 0.2, tint: 0.12 }),
      new Scatter(scene, scrub, mat, mobile ? 50 : 80, { span: 320, x: [2.4, 48], bias: 1.6, scale: [0.6, 1.3], tint: 0.15 }),
      new Scatter(scene, boulder, mat, 34, { span: 340, x: [4.5, 75], bias: 1.4, scale: [0.35, 1.5], sink: 0.25, tint: 0.1, castShadow: true }),
      new Scatter(scene, cactusTall, mat, 20, { span: 360, x: [6, 85], bias: 1.3, scale: [0.85, 1.7], tint: 0.1, castShadow: true }),
      new Scatter(scene, cactusFlower, mat, 20, { span: 360, x: [5, 70], bias: 1.3, scale: [0.8, 1.5], tint: 0.1, castShadow: true }),
      new Scatter(scene, dune, mat, 16, {
        span: 760, x: [70, 290], bias: 1, scale: [34, 80], yScale: [0.1, 0.2], sink: 0.25, wide: true, tint: 0.05, clear: 16, reach: 1.05,
      }),
      new Scatter(scene, mesa, mat, 9, {
        span: 760, x: [95, 280], bias: 1, scale: [12, 26], yScale: [0.7, 1.5], wide: true, tint: 0.06, clear: 24, reach: 1.35,
      }),
    ];
  }

  /** Fixed far mesas (fog-free, in an arc ahead) and slowly drifting clouds; the group follows the camera. */
  _buildBackdrop(scene) {
    this.backdrop = new THREE.Group();
    scene.add(this.backdrop);
    const mesaGeo = new THREE.CylinderGeometry(0.78, 1, 1, 8).toNonIndexed();
    mesaGeo.translate(0, 0.5, 0);
    mesaGeo.computeVertexNormals();
    this.mesaMat = new THREE.MeshLambertMaterial({ fog: false });
    const mesas = new THREE.InstancedMesh(mesaGeo, this.mesaMat, 30);
    mesas.frustumCulled = false;
    const farColor = new THREE.Color(C.mesaFar);
    for (let i = 0; i < 30; i++) {
      const angle = -Math.PI * 0.5 + ((i + rand(-0.4, 0.4)) / 30 - 0.5) * Math.PI * 1.7;
      const farRow = i % 2; // odd = farther, taller, hazier
      const dist = farRow ? rand(700, 800) : rand(540, 640);
      const width = rand(45, 120);
      _m.compose(
        _p.set(Math.cos(angle) * dist, -2, Math.sin(angle) * dist),
        _q.setFromEuler(_e.set(0, rand(0, 3), 0)),
        _s.set(width, rand(28, farRow ? 105 : 80), width * rand(0.6, 1)),
      );
      mesas.setMatrixAt(i, _m);
      mesas.setColorAt(i, _c.copy(farColor).lerp(this._horizon, farRow ? rand(0.6, 0.72) : rand(0.3, 0.45)));
    }
    this.backdrop.add(mesas);
    const cloud = mergeAndShade([
      bake(new THREE.IcosahedronGeometry(1, 1), 16777215, { scale: [1, 0.55, 0.7] }),
      bake(new THREE.IcosahedronGeometry(0.72, 1), 16777215, { pos: [0.95, -0.08, 0.1], scale: [1, 0.55, 0.7] }),
      bake(new THREE.IcosahedronGeometry(0.6, 1), 16777215, { pos: [-0.95, -0.12, -0.05], scale: [1, 0.55, 0.7] }),
    ]);
    this.cloudMat = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, emissive: 8218226 });
    this.clouds = new THREE.InstancedMesh(cloud, this.cloudMat, 11);
    this.clouds.frustumCulled = false;
    this.cloudData = [];
    for (let i = 0; i < 11; i++) {
      this.cloudData.push({ x: rand(-750, 750), y: rand(120, 260), z: rand(-720, -380), s: rand(34, 70), v: rand(2, 5) });
    }
    this.backdrop.add(this.clouds);
  }

  _layoutClouds(dt) {
    this.cloudData.forEach((c, i) => {
      c.x += c.v * dt;
      if (c.x > 800) c.x = -800;
      _m.compose(_p.set(c.x, c.y, c.z), _q.identity(), _s.set(c.s, c.s * 0.55, c.s * 0.7));
      this.clouds.setMatrixAt(i, _m);
    });
    this.clouds.instanceMatrix.needsUpdate = true;
  }

  setShadows(enabled) {
    this.sun.castShadow = enabled;
  }

  reset(playerZ) {
    for (const s of this.scatters) s.reset(playerZ);
    this.dayNight?.snap(0);
  }

  /** Select the environment and rebuild its particles for the current quality / motion settings. */
  setEnvironment(id, quality, reduced) {
    this.weatherId = id;
    this.weather.configure(id, quality, { reduced, mobile: this.mobile });
    this.dayNight.setWeather(id);
  }

  /** Score drives the day/night cycle and biome (call every frame; cheap when the score has not moved). */
  setProgress(score) {
    this.dayNight.update(score);
  }

  /** Reduced motion freezes the cloud drift. */
  setReducedMotion(on) {
    this.reducedMotion = on;
  }

  /** Per-frame: recycle scenery, glue sky/backdrop/ground to the camera and snap the shadow frustum. */
  update(dt, focus, camera) {
    const z = camera.position.z;
    for (const s of this.scatters) s.update(z);
    this.sky.position.copy(camera.position);
    this.backdrop.position.set(camera.position.x, 0, z);
    this._layoutClouds(this.reducedMotion ? 0 : dt);
    // ground is snapped to whole tiles so the texture never appears to slide
    this.ground.position.set(Math.round(camera.position.x / GROUND_TILE) * GROUND_TILE, 0, Math.round(z / GROUND_TILE) * GROUND_TILE);
    const texel = (2 * this.shadowRange) / this.shadowSize;
    _p.set(focus.x, 0, focus.z - 12);
    const sr = Math.round(_p.dot(this._lr) / texel) * texel;
    const su = Math.round(_p.dot(this._lu) / texel) * texel;
    const sd = _p.dot(this._ld);
    this.sun.target.position.set(0, 0, 0).addScaledVector(this._lr, sr).addScaledVector(this._lu, su).addScaledVector(this._ld, sd);
    this.sun.position.copy(this.sun.target.position).add(this.sunOffset);
    this.sun.target.updateMatrixWorld();
    this.fill.position.set(1.5, 3.2, focus.z - 5);
    this.weather.worldSpeed = this.speed;
    this.weather.update(dt, camera);
    this.dayNight.setFlash(this.weather.flash);
  }
}
