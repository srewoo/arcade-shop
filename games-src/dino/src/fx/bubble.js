// Shield bubble that wraps the dino: a translucent fresnel-shaded shell (bright rim, clear centre) that pulses, blinks
// when about to expire and "pops" (expands and fades) when it absorbs a hit.  Replaces the old debug-looking wireframe.
import * as THREE from 'three';

const POP_TIME = 0.3;
const BLINK_BELOW = 0.15; // fraction of the shield left when it starts blinking
const BASE_SCALE = [1.5, 1.8, 2.5];

const VERTEX = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAGMENT = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
    vec3 col = uColor * (0.35 + 1.5 * rim);
    gl_FragColor = vec4(col, (0.10 + 0.70 * rim) * uOpacity);
  }
`;

export class ShieldBubble {
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.position.set(0, 1.45, -0.8);
    this.group.scale.set(...BASE_SCALE);
    this.material = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0x4fd8ff) }, uOpacity: { value: 1 } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.shell = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), this.material);
    this.group.add(this.shell);
    this.group.visible = false;
    this.popT = -1;
    parent.add(this.group);
  }

  /** @param active shield up, @param fraction 0..1 of its timer left, @param reduced skip the pulsing */
  update(dt, active, fraction, time, reduced) {
    if (this.popT >= 0) {
      this.popT += dt;
      const k = this.popT / POP_TIME;
      if (k >= 1) {
        this.popT = -1;
        this.group.visible = false;
        return;
      }
      this.group.visible = true;
      this.group.scale.set(...BASE_SCALE).multiplyScalar(1 + 0.6 * k);
      this.material.uniforms.uOpacity.value = 1 - k;
      return;
    }
    this.group.visible = active;
    if (!active) return;
    const blink = fraction < BLINK_BELOW && Math.sin(time * 18) > 0.2;
    this.group.visible = !blink;
    const pulse = reduced ? 0 : Math.sin(time * 5) * 0.04;
    this.group.scale.set(...BASE_SCALE).multiplyScalar(1 + pulse);
    this.material.uniforms.uOpacity.value = 1;
  }

  pop() {
    this.popT = 0;
  }
  hide() {
    this.popT = -1;
    this.group.visible = false;
  }
}
