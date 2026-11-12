// Rug material: MeshStandardMaterial patched (onBeforeCompile) with the rug shader:
// fibre-jittered print lookup, progressive route reveal along the track (uTrackS),
// tuft shading, worn patches, window-light patches, wheel-pressed pile (uTrail) and rim light.
// On non-coarse devices a second "shell" material renders PILE_LAYERS stacked quads as standing pile.
import * as THREE from "three";
import { RUG } from "./layoutSelect.js";
import { FIBER_WORLD_SIZE, PILE_HEIGHT, PILE_LAYERS } from "./fiberTextures.js";

/**
 * @param {{print:HTMLCanvasElement, route:HTMLCanvasElement, trackField:{data:Float32Array,w:number,h:number},
 *          fiber:THREE.Texture, normal:THREE.Texture, anisotropy:number}} opts
 * @returns {THREE.MeshStandardMaterial} userData.uniforms = shared uniforms, userData.shell = pile material (desktop only)
 */
export function createRugMaterial({ print, route, trackField, fiber, normal, anisotropy }) {
  const printTex = new THREE.CanvasTexture(print);
  printTex.colorSpace = THREE.SRGBColorSpace;
  printTex.anisotropy = anisotropy;
  printTex.minFilter = THREE.LinearMipmapLinearFilter;
  printTex.generateMipmaps = true;
  const routeTex = new THREE.CanvasTexture(route);
  routeTex.colorSpace = THREE.SRGBColorSpace;
  routeTex.anisotropy = anisotropy;
  const halfData = new Uint16Array(trackField.data.length);
  for (let i = 0; i < halfData.length; i++) halfData[i] = THREE.DataUtils.toHalfFloat(trackField.data[i]);
  const trackTex = new THREE.DataTexture(halfData, trackField.w, trackField.h, THREE.RedFormat, THREE.HalfFloatType);
  trackTex.flipY = false;
  trackTex.magFilter = THREE.NearestFilter;
  trackTex.minFilter = THREE.NearestFilter;
  trackTex.needsUpdate = true;
  const normalTex = normal.clone();
  normalTex.repeat.set(RUG.W / FIBER_WORLD_SIZE, RUG.H / FIBER_WORLD_SIZE);
  normalTex.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({
    map: printTex,
    normalMap: normalTex,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.97,
    metalness: 0,
    envMapIntensity: 0.35,
  });
  const uniforms = {
    uFiber: { value: fiber },
    uRoute: { value: routeTex },
    uTrackS: { value: trackTex },
    uRevealStart: { value: 0 },
    uReveal: { value: 0 },
    uFuzz: { value: 0.16 },
    uSun: { value: 1 },
    uTrail: { value: null },
    uTrailK: { value: 1 },
    uPileOn: { value: 0 },
    uRugSize: { value: new THREE.Vector2(RUG.W, RUG.H) },
  };
  material.userData.uniforms = uniforms;
  const makePatch = (withShell) => (shader) => {
    Object.assign(shader.uniforms, uniforms),
      (shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vRugPos;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
vRugPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
        )),
      (shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vRugPos;
uniform sampler2D uFiber, uRoute, uTrackS;
uniform float uRevealStart, uReveal, uFuzz;
uniform vec2 uRugSize;
float rugHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
uniform float uSun, uTrailK, uPileOn;
uniform sampler2D uTrail;
// Soft patches of window light: two tall windows, each split by a cross bar.
float windowPatch(vec2 p, vec2 centre, vec2 half_){
  float c = 0.93, s = 0.37;
  vec2 q = abs(vec2(c * (p.x - centre.x) - s * (p.y - centre.y), s * (p.x - centre.x) + c * (p.y - centre.y)));
  float edge = 2.6;
  float a = smoothstep(half_.x + edge, half_.x - edge, q.x) * smoothstep(half_.y + edge, half_.y - edge, q.y);
  return a * smoothstep(1.2, 4.0, q.x) * smoothstep(1.2, 4.0, q.y);
}
float rugNoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(rugHash(i), rugHash(i+vec2(1,0)), f.x), mix(rugHash(i+vec2(0,1)), rugHash(i+vec2(1,1)), f.x), f.y);
}`,
        )
        .replace(
          "#include <map_fragment>",
          `
  vec2 rxz = vRugPos.xz;
  vec4 fib = texture2D(uFiber, rxz / 4.5);
  vec4 fib2 = texture2D(uFiber, rxz * 0.093 + vec2(0.31, 0.17));
  vec2 jit = (fib.rg - 0.5) * 2.0 * uFuzz / uRugSize;
  jit.y = -jit.y;
  vec4 texelColor = texture2D(map, vMapUv + jit);
  // race route layer (revealed along the track)
  vec4 rt = texture2D(uRoute, vMapUv + jit * 0.6);
  float ts = texture2D(uTrackS, vec2(vMapUv.x, 1.0 - vMapUv.y)).r;
  float rel = fract(ts - uRevealStart + 1.0);
  float vis = ts < -0.5 ? 0.0 : 1.0 - smoothstep(uReveal - 0.012, uReveal, rel);
  texelColor.rgb = mix(texelColor.rgb, rt.rgb, rt.a * vis);
  // pile: tuft height shading, per-tuft tint, large scale variation, worn spots
  float h = fib.b * 0.7 + fib2.b * 0.3;
  texelColor.rgb *= 0.76 + 0.34 * h;
  texelColor.rgb *= 0.9 + 0.2 * fib.a;
  float big = rugNoise(rxz * 0.06) * 0.6 + rugNoise(rxz * 0.21) * 0.4;
  texelColor.rgb *= 0.93 + 0.12 * big;
  float worn = smoothstep(0.6, 0.86, rugNoise(rxz * 0.035 + 7.0) * 0.7 + rugNoise(rxz * 0.4) * 0.3);
  float lum = dot(texelColor.rgb, vec3(0.299, 0.587, 0.114));
  texelColor.rgb = mix(texelColor.rgb, vec3(lum) * 1.08 + 0.015, worn * 0.26);
  float sunlit = max(windowPatch(rxz, vec2(-62.0, -18.0), vec2(34.0, 46.0)), windowPatch(rxz, vec2(40.0, 26.0), vec2(30.0, 40.0)));
  texelColor.rgb *= mix(0.94, 1.0 + 0.6 * uSun, sunlit);
  // pile pressed by the wheels (trails.js): 0.5 is untouched
  float pressed = texture2D(uTrail, vec2(vRugPos.x / uRugSize.x + 0.5, vRugPos.z / uRugSize.y + 0.5)).r;
  texelColor.rgb *= mix(1.0, 0.5 + pressed, uTrailK);
  texelColor.rgb += clamp(fwidth(pressed) * 4.0, 0.0, 0.1) * uTrailK;
  texelColor.rgb *= mix(1.0, 0.8, uPileOn); // under the standing pile the backing is in shade
  diffuseColor *= texelColor;
  float rugWorn = worn;
`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
  roughnessFactor = clamp(roughnessFactor - rugWorn * 0.12 + (1.0 - h) * 0.03, 0.6, 1.0);`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
  normal = normalize(mix(normal, nonPerturbedNormal, rugWorn * 0.55));`,
        )
        .replace(
          "#include <opaque_fragment>",
          `
  float rim = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 4.0);
  outgoingLight += diffuseColor.rgb * rim * 0.22;
  #include <opaque_fragment>`,
        )),
      withShell &&
        ((shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
attribute float aLayer; varying float vLayer; varying float vPileFade;`,
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
        vLayer = aLayer;
        float pileDist = distance((modelMatrix * vec4(transformed, 1.0)).xz, cameraPosition.xz);
        vPileFade = 1.0 - smoothstep(38.0, 64.0, pileDist); // the pile thins out away from the camera`,
          )),
        (shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
varying float vLayer; varying float vPileFade;`,
          )
          .replace(
            "void main() {",
            `void main() {
  if (vPileFade <= 0.002) discard;`,
          )
          .replace(
            "texelColor.rgb *= mix(1.0, 0.5 + pressed, uTrailK);",
            `
  float standing = mix(1.0, smoothstep(0.3, 0.5, pressed), uTrailK);
  float tuft = max(texture2D(uFiber, rxz / 10.0).b, fib.b * 0.55); // big soft tufts with fine fibres between them
  if (tuft * standing * vPileFade * uPileOn < 0.3 + 0.62 * vLayer) discard;
  texelColor.rgb *= mix(0.9, 1.14, vLayer); // tips catch more light than the sides of a tuft`,
          )));
  };

  material.onBeforeCompile = makePatch(false);
  material.customProgramCacheKey = () => "rug";
  if (PILE_HEIGHT > 0) {
    const shell = new THREE.MeshStandardMaterial({
      map: printTex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.97,
      metalness: 0,
      envMapIntensity: 0.35,
    });
    shell.userData.uniforms = uniforms;
    shell.onBeforeCompile = makePatch(true);
    shell.customProgramCacheKey = () => "rug-pile";
    material.userData.pile = null;
    material.userData.shell = shell;
  }
  return material;
}

/** Stacked full-rug quads (aLayer = layer/PILE_LAYERS) forming the shell-pile geometry. */
export function createPileShellGeometry() {
  const positions = [];
  const uvs = [];
  const normals = [];
  const layers = [];
  const indices = [];
  for (let layer = 1; layer <= PILE_LAYERS; layer++) {
    const y = (PILE_HEIGHT * layer) / PILE_LAYERS;
    const base = positions.length / 3;
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      positions.push((cx * RUG.W) / 2, y, (cz * RUG.H) / 2);
      uvs.push(cx / 2 + 0.5, 0.5 - cz / 2);
      normals.push(0, 1, 0);
      layers.push(layer / PILE_LAYERS);
    }
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("aLayer", new THREE.Float32BufferAttribute(layers, 1));
  geometry.setIndex(indices);
  return geometry;
}
