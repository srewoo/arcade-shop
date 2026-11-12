// Applies the score-driven day/night + biome palette (biomes.js) to the scene: sky gradient, sun/moon, fog,
// lights, ground/scenery tints and stars.  Updated only when the score moves by a few points (~6 Hz at speed).
import * as THREE from 'three';
import { paletteFor } from './biomes.js';
import { snowUniforms } from './snow.js';
import { PROP_MATERIAL } from '../gfx/geometry.js';

const STAR_COUNT = 420;
const STAR_RADIUS = 1400;
const SCORE_STEP = 3;
const WHITE = new THREE.Color(0xffffff);
const NIGHT_GLOW = 0x1c2442; // faint emissive that keeps the dino and obstacles readable at night

export class DayNight {
  constructor(world) {
    this.world = world;
    this.key = -1;
    this.weatherId = 'auto';
    this.score = 0;
    this.base = { hemi: 1, sun: 1 };
    this.flashOn = false;
    this.biome = '';
    this.onBiome = null; // (name) => void, fired when the biome name changes
    this._buildStars();
  }

  _buildStars() {
    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const y = 0.06 + Math.random() * 0.94; // upper hemisphere only
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(a) * r * STAR_RADIUS, y * STAR_RADIUS, Math.sin(a) * r * STAR_RADIUS], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false }),
    );
    this.stars.renderOrder = -7;
    this.stars.frustumCulled = false;
    this.stars.visible = false;
    this.world.sky.add(this.stars);
  }

  /** Switch environment (auto / day / night / snow / rain) and repaint immediately. */
  setWeather(id) {
    this.weatherId = id;
    this.snap(this.score);
  }

  /** Lightning: brighten lights, sky and fog for `f` in 0..1 (0 restores the palette). */
  setFlash(f) {
    const w = this.world;
    if (f <= 0 && !this.flashOn) return;
    this.flashOn = f > 0;
    w.hemi.intensity = this.base.hemi + 2.4 * f;
    w.sun.intensity = this.base.sun + 3 * f;
    w.sky.material.color.setScalar(1 + 0.9 * f);
    w.scene.fog.color.setHex(this.horizon).lerp(WHITE, 0.55 * f);
    w.scene.background.copy(w.scene.fog.color);
  }

  /** Jump straight to the palette for `score` (used on reset). */
  snap(score) {
    this.key = -1;
    this.biome = '';
    this._apply(score, false);
  }

  update(score) {
    this.score = score;
    if (Math.floor(score / SCORE_STEP) === this.key) return;
    this._apply(score, true);
  }

  _apply(score, notify) {
    const w = this.world;
    this.key = Math.floor(score / SCORE_STEP);
    this.score = score;
    const p = paletteFor(this.weatherId, score);
    this.horizon = p.horizon;
    w.scene.background.setHex(p.horizon);
    w.scene.fog.color.setHex(p.horizon);
    w.scene.fog.near = p.fogNear;
    w.scene.fog.far = p.fogFar;
    this.flashOn = false;
    w.sky.material.color.setScalar(1);
    w.sunDir.set(0.24, p.sunY, -0.95).normalize();
    w.placeSun();
    w._paintSky(p);
    w.sunDisc.material.color.setHex(p.sunDisc);
    w.sunHalo.material.color.setHex(p.sunGlow);
    w.sun.color.setHex(p.sunLight);
    w.sun.intensity = this.base.sun = p.sunIntensity;
    w.hemi.color.setHex(p.hemiSky);
    w.hemi.groundColor.setHex(p.hemiGround);
    w.hemi.intensity = this.base.hemi = p.hemiIntensity;
    w.rim.color.setHex(p.rim);
    w.rim.intensity = p.rimIntensity;
    w.groundMat.color.setHex(p.ground);
    this._groundLook(p);
    w.fill.intensity = p.fillLight;
    w.sunDisc.visible = w.sunHalo.visible = p.sunShow > 0.5;
    w.sunHalo.material.opacity = p.sunShow;
    snowUniforms.uSnow.value = 0.9 * p.snow;
    w.scatterMat.color.setHex(p.ground);
    w.mesaMat.color.setHex(p.mesa);
    w.cloudMat.emissive.setHex(p.cloud);
    this.stars.material.opacity = p.stars;
    this.stars.visible = p.stars > 0.02;
    PROP_MATERIAL.emissive.setHex(NIGHT_GLOW).multiplyScalar(p.propGlow);
    if (p.name !== this.biome) {
      const first = this.biome === '';
      this.biome = p.name;
      if (notify && !first && this.weatherId === 'auto') this.onBiome?.(p.name);
    }
  }

  /** Snow swaps the ground texture; rain adds a specular sheen (wet look). */
  _groundLook(p) {
    const w = this.world;
    const map = p.snow > 0.5 ? w.snowTex : w.sandTex;
    if (w.groundMat.map !== map) {
      w.groundMat.map = map;
      w.groundMat.needsUpdate = true;
    }
    w.groundMat.specular.setHex(p.wet ? 0x555c68 : 0x000000);
    w.groundMat.shininess = p.wet ? 55 : 30;
  }
}
