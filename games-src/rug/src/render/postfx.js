// Post-processing chain: scene -> depth of field (custom) -> unreal bloom -> output (tone map + sRGB).
// The vendored three addons in the bundle (Pass, FullScreenQuad, ShaderPass, MaskPass, EffectComposer,
// RenderPass, LuminosityHighPassShader, UnrealBloomPass, OutputShader, OutputPass) are the stock r170 versions.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/** Depth-of-field + vignette shader: far blur beyond focus*farStart..farEnd, near blur below focus*0.55. */
export const DOF_SHADER = {
  uniforms: {
    tColor: { value: null },
    tDepth: { value: null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 1e3 },
    focus: { value: 10 },
    farStart: { value: 1.3 },
    farEnd: { value: 5 },
    nearAmt: { value: 0.5 },
    maxBlur: { value: 6 },
    resolution: { value: new THREE.Vector2(1920, 1080) },
    vignette: { value: 0.18 },
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
  fragmentShader: `
    uniform sampler2D tColor, tDepth;
    uniform float cameraNear, cameraFar, focus, farStart, farEnd, nearAmt, maxBlur, vignette;
    uniform vec2 resolution;
    varying vec2 vUv;
    float linDepth(vec2 uv){
      float d = texture2D(tDepth, uv).x;
      return (cameraNear * cameraFar) / (cameraFar - d * (cameraFar - cameraNear));
    }
    float coc(float z){
      float f = smoothstep(focus * farStart, focus * farEnd, z);
      float n = smoothstep(focus * 0.55, focus * 0.18, z) * nearAmt;
      return max(f, n);
    }
    void main(){
      float z = linDepth(vUv);
      float c = coc(z);
      vec3 col = clamp(texture2D(tColor, vUv).rgb, vec3(0.0), vec3(32.0));
      if (c > 0.02) {
        vec3 acc = col; float wsum = 1.0;
        float R = c * maxBlur;
        const int N = 18;
        for (int i = 0; i < N; i++) {
          float fi = float(i) + 0.5;
          float r = sqrt(fi / float(N)) * R;
          float a = fi * 2.39996323;
          vec2 o = vec2(cos(a), sin(a)) * r / resolution;
          float sc = coc(linDepth(vUv + o));
          float w = clamp(sc * maxBlur / max(r, 0.5), 0.0, 1.0);
          vec3 sc3 = clamp(texture2D(tColor, vUv + o).rgb, vec3(0.0), vec3(32.0));
          acc += sc3 * w;
          wsum += w;
        }
        col = acc / wsum;
      }
      // never let a bad pixel (Inf/NaN) reach the bloom, it would flash the whole screen
      col = clamp(col, vec3(0.0), vec3(32.0));
      vec2 q = vUv - 0.5;
      col *= 1.0 - vignette * smoothstep(0.25, 0.95, dot(q, q) * 2.2);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/** Full-screen pass applying DOF_SHADER to the read buffer (colour + depth texture). */
export class DepthOfFieldPass extends Pass {
  constructor() {
    super();
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(DOF_SHADER.uniforms),
      vertexShader: DOF_SHADER.vertexShader,
      fragmentShader: DOF_SHADER.fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.uniforms = this.material.uniforms;
    this.fsQuad = new FullScreenQuad(this.material);
  }

  render(renderer, writeBuffer, readBuffer) {
    this.uniforms.tColor.value = readBuffer.texture;
    this.uniforms.tDepth.value = readBuffer.depthTexture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.fsQuad.render(renderer);
  }
}

/**
 * Builds the composer: Render -> DepthOfField -> UnrealBloom(res 960x540, strength .2, radius .5, threshold .93) -> Output.
 * @returns {{composer, dof, bloom, setSize(w,h,dpr), render(dt)}}
 */
export function createPostFx(renderer, scene, camera) {
  // RE: 4x MSAA half-float target with a depth texture (UnsignedIntType) so the DOF pass can read depth.
  const target = new THREE.WebGLRenderTarget(16, 16, {
    type: THREE.HalfFloatType,
    samples: 4,
    depthTexture: new THREE.DepthTexture(16, 16, THREE.UnsignedIntType),
  });
  const composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(scene, camera);
  const dof = new DepthOfFieldPass();
  const bloom = new UnrealBloomPass(new THREE.Vector2(960, 540), 0.2, 0.5, 0.93);
  const output = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(dof);
  composer.addPass(bloom);
  composer.addPass(output);
  return {
    composer,
    dof,
    bloom,
    setSize(width, height, pixelRatio) {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
      dof.uniforms.resolution.value.set(width * pixelRatio, height * pixelRatio);
      dof.uniforms.maxBlur.value = 7 * ((Math.min(width, height) * pixelRatio) / 1080);
    },
    render(dt) {
      dof.uniforms.cameraNear.value = camera.near;
      dof.uniforms.cameraFar.value = camera.far;
      composer.render(dt);
    },
  };
}
