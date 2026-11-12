// World construction: renderer, scene, lights, environment, rug (print + route + mask + track field),
// floor, room walls, bright window and light shafts. Reports progress through `progress(p, label, text?)`.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { IS_COARSE_POINTER } from "../util/math.js";
import { RUG } from "./layoutSelect.js";
import { COLORS } from "./mapPainter.js";
import { paintPrintTexture } from "./paint/printTexture.js";
import { paintRouteLayer } from "./routeOverlay.js";
import { buildRoadWaterMask } from "./surfaceMask.js";
import { buildTrackField, makeColourLookup } from "./trackField.js";
import { createFiberTextures } from "./fiberTextures.js";
import { createRugMaterial, createPileShellGeometry } from "./rugMaterial.js";
import { floorTexture, FLOOR_MATERIAL } from "./floors.js";
import { RUG_SHAPE } from "./layoutSelect.js";
import { FLOOR_ENV, THEME_LIGHT, THEME_EMISSIVE } from "../logic/appearance.js";
import { loadSettings } from "../logic/settings.js";

/** Normalised direction towards the sun (shadow-camera offset uses it x260). */
export const SUN_DIRECTION = new THREE.Vector3(-0.52, 0.78, -0.36).normalize();

/** Build the soft vertical gradient texture used by the window light shafts. */
function createShaftTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const horizontal = ctx.createLinearGradient(0, 0, 64, 0);
  horizontal.addColorStop(0, "rgba(255,255,255,0)");
  horizontal.addColorStop(0.5, "rgba(255,255,255,1)");
  horizontal.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = horizontal;
  ctx.fillRect(0, 0, 64, 256);
  ctx.globalCompositeOperation = "destination-in";
  const vertical = ctx.createLinearGradient(0, 0, 0, 256);
  vertical.addColorStop(0, "rgba(0,0,0,0.9)");
  vertical.addColorStop(1, "rgba(0,0,0,0.05)");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(canvas);
}

/** Four room walls (760 x 340 tall, depth 600) with skirting boards, ceiling, and the big window. */
function createRoom(scene) {
  const room = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: "#efe2cc", roughness: 0.95 });
  const skirtMat = new THREE.MeshStandardMaterial({ color: "#f7f3ea", roughness: 0.6 });
  const width = 760;
  const depth = 600;
  const height = 340;
  // [x, z, rotationY, length]
  const sides = [
    [0, -depth / 2, 0, width],
    [0, depth / 2, Math.PI, width],
    [-width / 2, 0, Math.PI / 2, depth],
    [width / 2, 0, -Math.PI / 2, depth],
  ];
  for (const [x, z, rotY, len] of sides) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, height), wallMat);
    wall.position.set(x, height / 2 - 0.8, z);
    wall.rotation.y = rotY;
    room.add(wall);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(len, 12, 2), skirtMat);
    skirt.position.set(x, 5.2, z);
    skirt.rotation.y = rotY;
    skirt.translateZ(1);
    room.add(skirt);
  }
  // window: emissive-ish pane (colour x2.6, unlit) with white frame bars
  const paneMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff4dc").multiplyScalar(2.6) });
  const frameMat = new THREE.MeshStandardMaterial({ color: "#fbfaf6", roughness: 0.5 });
  const window_ = new THREE.Group();
  const winW = 200;
  const winH = 170;
  window_.add(new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), paneMat));
  // [w, h, x, y]
  for (const [w, h, x, y] of [
    [winW + 14, 10, 0, winH / 2 + 3],
    [winW + 14, 10, 0, -winH / 2 - 3],
    [10, winH, -winW / 2 - 3, 0],
    [10, winH, winW / 2 + 3, 0],
    [6, winH, 0, 0],
    [winW, 6, 0, 0],
  ]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), frameMat);
    bar.position.set(x, y, 2);
    window_.add(bar);
  }
  window_.position.set(-150, 150, -depth / 2 + 1);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color: "#f4ede2", roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height - 0.8;
  room.add(ceiling);
  room.add(window_);
  scene.add(room);
  return { depth, group: room, wallMat };
}

/** Three additive light shafts (two crossed planes each) from the window down to the floor. */
function createLightShafts(scene, roomDepth) {
  const material = new THREE.MeshBasicMaterial({
    map: createShaftTexture(),
    color: "#ffe2b0",
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const group = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  // [floorX, floorZ... RE: (x, y-ish) target offset: top x, target x, target z, plane width]
  for (const [topX, targetX, targetZ, planeW] of [
    [-205, -80, -30, 62],
    [-150, -48, -8, 74],
    [-95, -6, 12, 56],
  ]) {
    const top = new THREE.Vector3(topX, 225, -roomDepth / 2 + 6);
    const target = new THREE.Vector3(targetX, 0, targetZ);
    const dir = top.clone().sub(target);
    const len = dir.length();
    for (let k = 0; k < 2; k++) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(planeW, len), material);
      plane.position.copy(top).add(target).multiplyScalar(0.5);
      plane.quaternion.setFromUnitVectors(up, dir.normalize());
      plane.rotateY((k * Math.PI) / 2 + 0.4);
      plane.renderOrder = 4;
      group.add(plane);
    }
  }
  scene.add(group);
  return { group, material };
}

/**
 * Create renderer/scene/rug etc.
 * @param {HTMLCanvasElement} canvas
 * @param {(p:number,label:string,text?:string)=>Promise<void>} progress boot-loader progress callback
 */
export async function createWorld(canvas, progress) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#d9c7ad");
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 2000);
  const sun = new THREE.DirectionalLight("#ffdcae", 2.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(IS_COARSE_POINTER ? 1536 : 3072, IS_COARSE_POINTER ? 1536 : 3072);
  sun.shadow.bias = -4e-4;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  const shadowCam = sun.shadow.camera;
  shadowCam.near = 1;
  shadowCam.far = 600;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight("#dfe8ff", "#c99f73", 0.8);
  scene.add(hemi);
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  await progress(0.05, "renderer", "Unrolling the rug…");
  let storage = null;
  try {
    storage = window.localStorage;
  } catch {}
  const style = loadSettings(storage); // theme / pattern / floor chosen last time
  const print = await paintPrintTexture(progress, style);
  await progress(0.2, "print: soften", "Painting the roads…");
  const route = paintRouteLayer(IS_COARSE_POINTER ? 2048 : 4096);
  await progress(0.22, "route");
  const mask = buildRoadWaterMask();
  await progress(0.24, "mask");
  const trackField = buildTrackField();
  await progress(0.26, "track field");
  const lookup = makeColourLookup(print);
  await progress(0.27, "colour lookup", "Fluffing the carpet…");
  const { fiber, normal } = createFiberTextures();
  await progress(0.36, "fibres", "Building the town…");

  const rugMat = createRugMaterial({ print, route, trackField, fiber, normal, anisotropy });
  rugMat.alphaTest = RUG_SHAPE ? 0.5 : 0; // shaped rugs: transparent print pixels are cut away
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(RUG.W, RUG.H), rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.receiveShadow = true;
  scene.add(rug);
  let pile = null;
  if (rugMat.userData.shell) {
    pile = new THREE.Mesh(createPileShellGeometry(), rugMat.userData.shell);
    pile.receiveShadow = true;
    pile.frustumCulled = false;
    scene.add(pile);
  }
  // rug side border: box under the rug, top/bottom faces invisible
  const borderMat = new THREE.MeshStandardMaterial({ color: COLORS.borderDark, roughness: 0.95, normalMap: normal, normalScale: new THREE.Vector2(0.6, 0.6) });
  const hiddenMat = new THREE.MeshBasicMaterial({ visible: false });
  const edge = new THREE.Mesh(new THREE.BoxGeometry(RUG.W, 0.8, RUG.H), [borderMat, borderMat, hiddenMat, hiddenMat, borderMat, borderMat]);
  edge.position.y = -0.4;
  edge.receiveShadow = true;
  edge.visible = !RUG_SHAPE; // the slab under the rug is rectangular
  scene.add(edge);
  if (RUG_SHAPE && pile) pile.visible = false;
  // floor (parquet by default; see floors.js)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500), new THREE.MeshStandardMaterial({ map: floorTexture("parquet"), roughness: 0.45, metalness: 0, envMapIntensity: 0.7 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.8;
  floor.receiveShadow = true;
  scene.add(floor);

  const room = createRoom(scene);
  const { group: shafts, material: shaftMat } = createLightShafts(scene, room.depth);
  const world = { shaftScale: 1 };

  /** Apply a floor option + theme lighting: floor texture, walls, sky/background, sun, hemisphere, environment. */
  function applyEnvironment(floorId, themeId) {
    const env = FLOOR_ENV[floorId] ?? FLOOR_ENV.parquet;
    const light = THEME_LIGHT[themeId] ?? THEME_LIGHT.classic;
    const tint = new THREE.Color(light.tint);
    const map = floorTexture(floorId);
    floor.material.map = map;
    const [roughness, envI] = FLOOR_MATERIAL[floorId] ?? FLOOR_MATERIAL.parquet;
    floor.material.roughness = roughness;
    floor.material.envMapIntensity = envI;
    floor.material.color.setScalar(light.floor);
    floor.material.needsUpdate = true;
    room.group.visible = env.walls;
    room.wallMat.color.set(env.wall);
    world.shaftScale = env.walls ? 1 : 0;
    scene.background.set(themeId === "neon" ? "#05061a" : env.bg);
    sun.color.set(env.sun).multiply(tint);
    sun.intensity = env.sunI * light.sun;
    hemi.color.set(env.hemiSky).multiply(tint);
    hemi.groundColor.set(env.hemiGround);
    hemi.intensity = env.hemiI * light.hemi;
    scene.environmentIntensity = env.envI * (themeId === "neon" ? 0.5 : 1);
    rugMat.emissiveMap = THEME_EMISSIVE[themeId] ? rugMat.map : null;
    rugMat.emissive.set(THEME_EMISSIVE[themeId] ? "#ffffff" : "#000000");
    rugMat.emissiveIntensity = THEME_EMISSIVE[themeId] || 0;
    rugMat.needsUpdate = true;
  }
  applyEnvironment(style.floor, style.theme);

  /** Repaint the rug print in place (same canvas/texture objects); routes, masks and colliders are untouched. */
  async function repaint(next) {
    const fresh = await paintPrintTexture(async () => {}, next);
    const ctx = print.getContext("2d");
    ctx.clearRect(0, 0, print.width, print.height);
    ctx.drawImage(fresh, 0, 0);
    rugMat.map.needsUpdate = true;
    Object.assign(lookup, makeColourLookup(print));
    applyEnvironment(next.floor, next.theme);
  }

  /** Re-centre the sun's shadow frustum on (x,z) with half-size `half`, snapped to shadow texels. */
  function setShadowFocus(x, z, half) {
    const texel = (half * 2) / sun.shadow.mapSize.x;
    const sx = Math.round(x / texel) * texel;
    const sz = Math.round(z / texel) * texel;
    sun.target.position.set(sx, 0, sz);
    sun.position.set(sx + SUN_DIRECTION.x * 260, SUN_DIRECTION.y * 260, sz + SUN_DIRECTION.z * 260);
    if (shadowCam.right !== half) {
      shadowCam.left = -half;
      shadowCam.right = half;
      shadowCam.top = half;
      shadowCam.bottom = -half;
      shadowCam.updateProjectionMatrix();
    }
  }
  return Object.assign(world, { pile, edge, shafts, shaftMat, renderer, scene, camera, sun, hemi, rug, rugMat, print, route, mask, lookup, setShadowFocus, fiber, floor, applyEnvironment, repaint, style });
}
