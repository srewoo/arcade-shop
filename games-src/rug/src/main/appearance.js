// Applies the rug theme / pattern / floor: repaints the print in place, regrades prop vertex colours,
// refreshes the minimap. Routes, colliders and the road/water mask are never rebuilt.
import { stylePropRgb } from "../logic/appearance.js";
import { renderMinimapBackground } from "../ui/minimap.js";
import { world, scene, ui, propMaterials } from "./bootstrap.js";

const propSet = new Set(Object.values(propMaterials).filter((m) => m && m.isMaterial));
const toSrgb = (v) => Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2);
const toLinear = (v) => Math.pow(Math.max(0, Math.min(1, v)), 2.2);

/** Regrade every prop mesh's vertex colours for the theme + pattern (original colours are kept per geometry). */
export function regradeProps(theme, pattern) {
  const cache = new Map();
  const seen = new Set();
  scene.traverse((node) => {
    const geo = node.isMesh ? node.geometry : null;
    const attr = geo?.attributes.color;
    const mats = node.isMesh ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
    if (!attr || seen.has(geo) || !mats.some((m) => propSet.has(m))) return;
    seen.add(geo);
    geo.userData.baseColor ??= attr.array.slice();
    const base = geo.userData.baseColor;
    for (let i = 0; i < attr.count; i++) {
      const r = base[i * attr.itemSize];
      const g = base[i * attr.itemSize + 1];
      const b = base[i * attr.itemSize + 2];
      const key = (Math.round(r * 63) << 12) | (Math.round(g * 63) << 6) | Math.round(b * 63);
      let out = cache.get(key);
      if (!out) {
        out = stylePropRgb(theme, pattern, toSrgb(r), toSrgb(g), toSrgb(b)).map(toLinear);
        cache.set(key, out);
      }
      attr.array[i * attr.itemSize] = out[0];
      attr.array[i * attr.itemSize + 1] = out[1];
      attr.array[i * attr.itemSize + 2] = out[2];
    }
    attr.needsUpdate = true;
  });
}

let running = false;
let pending = null;

/** Repaint + regrade for {theme, pattern, floor}; calls while busy collapse into the latest one. */
export async function applyAppearance(next) {
  pending = { theme: next.theme, pattern: next.pattern, floor: next.floor };
  if (running) return;
  running = true;
  try {
    while (pending) {
      const style = pending;
      pending = null;
      ui.setBusy(true);
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 30)));
      await world.repaint(style);
      regradeProps(style.theme, style.pattern);
      ui.mapBg = renderMinimapBackground(world.lookup);
      world.style = style;
    }
  } finally {
    running = false;
    ui.setBusy(false);
  }
}
