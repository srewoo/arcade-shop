// Stage sizing, orientation (landscape 16:9 / portrait 9:16) and adaptive resolution.
// The original used loose `let` globals (Xl, Oi, is, il, Mm); they are grouped into one `layout` object here.
import { renderer, camera, composer, ui, cameraRig } from "./bootstrap.js";
import { stage } from "./stage.js";
import { query } from "./query.js";

export const layout = {
  /** No ?v/?w/?h given: follow the window orientation automatically. Original `Xl`. */
  autoOrientation: !query.has("v") && !query.has("w") && !query.has("h"),
  /** Portrait (9:16) layout. Original `Oi`. */
  isVertical: false,
  /** Adaptive resolution multiplier 0.62..1. Original `is`. */
  resolutionScale: 1,
  /** Quality setting other than "auto": resolutionScale is pinned, adaptive scaling is off. */
  fixedQuality: false,
  /** Whether the HUD/UI overlay is shown (H key, ?ui=0). Original `il`. */
  uiVisible: query.get("ui") !== "0",
  /** Canvas height in device pixels (used by particles for point size). Original `Mm`. */
  renderHeightPx: 1080,
  /** HUD size multiplier from the Text and HUD size setting (1, 1.25, 1.5). */
  hudScale: 1,
  /** Set when a resize is pending; consumed in the frame loop. Original `uu`. */
  resizePending: false,
};
layout.isVertical =
  query.get("v") === "1" || (layout.autoOrientation && window.innerHeight > window.innerWidth);

/** ?q=fixed disables adaptive resolution. Original `xb`. */
export const adaptiveQuality = query.get("q") !== "fixed";

/** Flag a resize; the loop calls resizeStage() on the next frame. Original `vl`. */
export function requestResize() {
  layout.resizePending = true;
}

/** Fit the stage to the window at 16:9 (or 9:16), and set renderer/composer/camera sizes. Original `_m`. */
export function resizeStage() {
  const forcedW = +query.get("w") || 0;
  const forcedH = +query.get("h") || 0;
  const availW = forcedW || window.innerWidth;
  const availH = forcedH || window.innerHeight;
  let width = availW;
  let height = availH;
  if (!layout.autoOrientation) {
    const aspect = layout.isVertical ? 0.5625 : 1.7777777777777777;
    height = availW / aspect;
    if (height > availH) {
      height = availH;
      width = availH * aspect;
    }
  }
  width = Math.floor(width);
  height = Math.floor(height);
  stage.style.width = width + "px";
  stage.style.height = height + "px";
  stage.classList.toggle("vertical", layout.isVertical);
  // --u: one CSS "unit" = 1/1080 of the stage's short side
  const unit = (layout.isVertical ? width : height) / 1080;
  stage.style.setProperty("--u", unit + "px");
  stage.style.setProperty("--u-base", unit + "px");
  stage.style.setProperty("--hud-u", unit * layout.hudScale + "px"); // HUD-only unit (Text and HUD size)
  const pixelBudget = layout.isVertical ? 1080 * 1920 : 1920 * 1080;
  const pixelRatio =
    Math.min(window.devicePixelRatio || 1, Math.sqrt(pixelBudget / (width * height)) * 1.0001, 2) *
    layout.resolutionScale;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  composer.setSize(width, height, pixelRatio);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  cameraRig.vertical = layout.isVertical;
  layout.renderHeightPx = height * pixelRatio;
  ui.layoutTitleRecord();
}

window.addEventListener("resize", () => {
  if (document.activeElement instanceof HTMLInputElement) return; // on-screen keyboard (name prompt)
  if (layout.autoOrientation) layout.isVertical = window.innerHeight > window.innerWidth;
  requestResize();
});
resizeStage();
