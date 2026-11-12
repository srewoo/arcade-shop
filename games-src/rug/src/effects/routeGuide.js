import * as THREE from "three";

const GUIDE_WIDTH = 4.2; // ip: ribbon width across the road
const GUIDE_Y = 0.4; // om: height above the rug

/** Animated chevron + "comet" ribbon shader drawn over the road on the title screen. (original: $c) */
const guideMaterial = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uLength: { value: 1 } },
  vertexShader: `
    attribute float aS; attribute float aLat;
    varying float vS; varying float vLat;
    void main(){ vS = aS; vLat = aLat; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform float uTime, uLength;
    varying float vS, vLat;
    void main(){
      float side = abs(vLat);
      float edge = smoothstep(1.0, 0.7, side);
      // chevrons pointing along the race: bright at the front, fading behind
      float f = fract((vS + side * 2.6) / 12.0 - uTime * 1.25);
      float chevron = smoothstep(0.3, 0.92, f) * (1.0 - smoothstep(0.94, 1.0, f));
      // one brighter pulse that runs the whole lap
      float comet = pow(fract(vS / uLength - uTime * 0.2), 24.0);
      float breathe = 0.8 + 0.2 * sin(uTime * 4.5);
      float glow = max(chevron, comet);
      vec3 color = mix(vec3(1.0, 0.68, 0.1), vec3(1.0, 0.95, 0.72), glow) * (1.0 + 1.5 * chevron + 2.5 * comet);
      gl_FragColor = vec4(color, edge * (0.2 * breathe + 0.8 * glow));
    }`,
  transparent: true,
  depthTest: false,
  depthWrite: false,
  side: THREE.DoubleSide,
});

/**
 * Flat ribbon along a closed centerline [x,z,x,z,...]; aS = arc length, aLat = -1|1 side.
 * (original: Cw)
 */
function buildRibbon(points) {
  const n = points.length / 2;
  const positions = new Float32Array((n + 1) * 6);
  const arc = new Float32Array((n + 1) * 2);
  const lat = new Float32Array((n + 1) * 2);
  const indices = [];
  let length = 0;
  for (let i = 0; i <= n; i++) {
    const k = i % n;
    const x = points[k * 2];
    const z = points[k * 2 + 1];
    const prev = (k + n - 1) % n;
    const next = (k + 1) % n;
    let dx = points[next * 2] - points[prev * 2];
    let dz = points[next * 2 + 1] - points[prev * 2 + 1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    if (i) length += Math.hypot(x - points[(i - 1) * 2], z - points[(i - 1) * 2 + 1]);
    for (const side of [-1, 1]) {
      const idx = i * 2 + (side + 1) / 2;
      positions.set([x - (dz * side * GUIDE_WIDTH) / 2, GUIDE_Y, z + (dx * side * GUIDE_WIDTH) / 2], idx * 3);
      arc[idx] = length;
      lat[idx] = side;
    }
    if (i < n) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aS", new THREE.BufferAttribute(arc, 1));
  geometry.setAttribute("aLat", new THREE.BufferAttribute(lat, 1));
  geometry.setIndex(indices);
  return { geometry, length };
}

/** 2x7 black/white checker texture for the start line. (original: Pw) */
function makeCheckerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 112;
  const ctx = canvas.getContext("2d");
  for (let x = 0; x < 2; x++)
    for (let y = 0; y < 7; y++) {
      ctx.fillStyle = (x + y) % 2 ? "#ffffff" : "#1f2026";
      ctx.fillRect(x * 16, y * 16, 16, 16);
    }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Route guide (ribbon + start/finish line) driven by maps/routes.json, which is
 * fetched lazily after boot via load(). (original: Lw)
 * @param {THREE.Scene} scene
 */
export function createRouteGuide(scene) {
  const ribbon = new THREE.Mesh(new THREE.BufferGeometry(), guideMaterial);
  ribbon.frustumCulled = false;
  ribbon.renderOrder = 3;
  ribbon.visible = false;
  const lineMaterial = new THREE.MeshBasicMaterial({
    map: makeCheckerTexture(),
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const startLine = new THREE.Mesh(new THREE.PlaneGeometry(4, 14).rotateX(-Math.PI / 2), lineMaterial);
  startLine.position.y = GUIDE_Y;
  startLine.renderOrder = 4;
  startLine.visible = false;
  scene.add(ribbon, startLine);

  let routes = null;
  let currentId = null;
  const cache = new Map();

  function refresh() {
    const pts = currentId && routes?.[currentId];
    ribbon.visible = startLine.visible = !!pts;
    if (!pts) return;
    if (!cache.has(currentId)) cache.set(currentId, buildRibbon(pts));
    const built = cache.get(currentId);
    ribbon.geometry = built.geometry;
    guideMaterial.uniforms.uLength.value = built.length;
    startLine.position.x = pts[0];
    startLine.position.z = pts[1];
    startLine.rotation.y = -Math.atan2(pts[3] - pts[1], pts[2] - pts[0]);
  }

  return {
    load() {
      fetch("./maps/routes.json")
        .then((r) => r.json())
        .then((data) => {
          routes = data;
          refresh();
        })
        .catch(() => {});
    },
    show(mapId) {
      currentId = mapId;
      refresh();
    },
    update(time) {
      if (ribbon.visible) {
        guideMaterial.uniforms.uTime.value = time;
        lineMaterial.opacity = 0.72 + 0.28 * Math.sin(time * 4.5);
      }
    },
  };
}
