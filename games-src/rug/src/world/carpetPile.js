// Triplanar carpet-pile shader patch for ordinary MeshStandardMaterials (toys, furniture, props).
// Samples the shared fibre texture in world space: per-pixel UV jitter, tuft-height shading,
// screen-space bump from tuft height (fades with distance) and a sheen rim.
import * as THREE from "three";
import { FIBER_WORLD_SIZE } from "./fiberTextures.js";

/**
 * Patch `material` in place and return it.
 * @param {THREE.MeshStandardMaterial} material
 * @param {THREE.Texture} fiberTexture the fibre texture from createFiberTextures()
 * @param {{scale?:number,fuzz?:number[],bump?:number,sheen?:number,tone?:number}} [options]
 */
export function applyCarpetPile(
  material,
  fiberTexture,
  { scale = FIBER_WORLD_SIZE, fuzz = [0, 0], bump = 0.045, sheen = 0.25, tone = 0.34 } = {},
) {
  const uniforms = {
    uPile: { value: fiberTexture },
    uPileScale: { value: 1 / scale },
    uPileFuzz: { value: new THREE.Vector2(fuzz[0], fuzz[1]) },
    uPileBump: { value: bump },
    uPileSheen: { value: sheen },
    uPileTone: { value: tone },
  };
  return (
    (material.roughness = Math.max(material.roughness ?? 1, 0.9)),
    (material.metalness = 0),
    (material.userData.pile = uniforms),
    (material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms),
        (shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
        varying vec3 vPileW; varying vec3 vPileN;`,
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vPileW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
          vPileN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
        #else
          vPileW = (modelMatrix * vec4(transformed, 1.0)).xyz;
          vPileN = normalize(mat3(modelMatrix) * objectNormal);
        #endif`,
          )),
        (shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
        varying vec3 vPileW; varying vec3 vPileN;
        uniform sampler2D uPile; uniform float uPileScale, uPileBump, uPileSheen, uPileTone; uniform vec2 uPileFuzz;
        vec4 pileSample(vec3 p, vec3 n) {
          vec3 w = pow(abs(n), vec3(4.0)); w /= max(w.x + w.y + w.z, 1e-5);
          return texture2D(uPile, p.zy * uPileScale) * w.x
               + texture2D(uPile, p.xz * uPileScale + 0.37) * w.y
               + texture2D(uPile, p.xy * uPileScale + 0.71) * w.z;
        }`,
          )
          .replace(
            "#include <map_fragment>",
            `
        vec4 pile = pileSample(vPileW, normalize(vPileN));
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D(map, vMapUv + (pile.rg - 0.5) * 2.0 * uPileFuzz);
          diffuseColor *= sampledDiffuseColor;
        #endif
        float pileH = pile.b;
        diffuseColor.rgb *= 1.0 - uPileTone * 0.7 + uPileTone * pileH;
        diffuseColor.rgb *= 0.92 + 0.16 * pile.a;`,
          )
          .replace(
            "#include <normal_fragment_maps>",
            `#include <normal_fragment_maps>
        {
          vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          float pileTexels = length(fwidth(vPileW)) * uPileScale * 512.0; // fibre texels under one pixel
          float pileNear = 1.0 - smoothstep(0.45, 1.3, pileTexels);
          vec3 grad = sign(det) * (dFdx(pileH) * uPileBump * r1 + dFdy(pileH) * uPileBump * r2) * pileNear;
          vec3 bumped = abs(det) * normal - grad;
          if (dot(bumped, bumped) > 1e-20) normal = normalize(bumped);
        }`,
          )
          .replace(
            "#include <opaque_fragment>",
            `
        outgoingLight += diffuseColor.rgb * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0) * uPileSheen;
        #include <opaque_fragment>`,
          ));
    }),
    (material.customProgramCacheKey = () => "carpet"),
    (material.needsUpdate = true),
    material
  );
}
