// requestAnimationFrame loop with adaptive render resolution.
import { FIXED_STEP } from "../config/constants.js";
import { trailField, composer, fpsEl } from "./bootstrap.js";
import { app, advanceGlobalTime, globalTime } from "./state.js";
import { layout, adaptiveQuality, requestResize, resizeStage } from "./layout.js";
import { handleMenuKeys, keysPressed } from "./input.js";
import { updateMode } from "./modeUpdate.js";
import { stepDemo, restartDemoLoop, updateDemoPresentation } from "./demo.js";
import { renderFrame } from "./frame.js";
import { isFrozen, syncOverlays } from "./overlays.js";

let lastTimestamp = performance.now();
// fps measurement window
let fpsSeconds = 0;
let fpsFrames = 0;
let lastFpsTimestamp = performance.now();
// adaptive resolution bookkeeping
let goodFpsStreak = 0;
let lastScaleChangeAt = 0;
let lastUpscaleAt = -1e9;
let upscaleLocked = false;

/** Adjust layout.resolutionScale from the measured fps (called once per ~0.5 s window). */
function adaptResolution(fps, now) {
  fpsEl.textContent = `${Math.round(fps)} fps · ${Math.round(layout.resolutionScale * 100)}% res`;
  if (!adaptiveQuality || layout.fixedQuality || !(now > 4e3) || document.hidden) return;
  const cooledDown = now - lastScaleChangeAt > 8e3;
  if (fps < 50 && layout.resolutionScale > 0.62 && cooledDown) {
    // dropped again soon after an upscale: stop trying to go back up
    if (now - lastUpscaleAt < 12e3) upscaleLocked = true;
    layout.resolutionScale = Math.max(0.62, layout.resolutionScale * 0.85);
    lastScaleChangeAt = now;
    goodFpsStreak = 0;
    requestResize();
  } else if (!upscaleLocked && fps > 58 && layout.resolutionScale < 1 && cooledDown && ++goodFpsStreak > 12) {
    layout.resolutionScale = Math.min(1, layout.resolutionScale * 1.08);
    lastScaleChangeAt = now;
    lastUpscaleAt = now;
    goodFpsStreak = 0;
    requestResize();
  } else if (fps <= 58) goodFpsStreak = 0;
}

/** One animation frame. Original `Tm`. window.__rug.pause / timeScale are debug controls. */
export function frame(now) {
  if (app.leaving) return; // page is about to reload for another map
  const lastTs = lastTimestamp;
  lastTimestamp = now;
  handleMenuKeys(); // may open / close the pause overlay, so it runs before the freeze check
  syncOverlays();
  app.frozen = app.mode !== "demo" && isFrozen();
  const dt = window.__rug?.pause || app.frozen ? 0 : Math.min(0.1, (now - lastTs) / 1e3) * (window.__rug?.timeScale || 1);
  if (layout.resizePending) {
    layout.resizePending = false;
    resizeStage();
  }
  let visualTime;
  if (app.mode === "demo") {
    for (app.acc += dt; app.acc >= FIXED_STEP; ) {
      stepDemo(FIXED_STEP);
      app.acc -= FIXED_STEP;
      if (app.demo.time >= app.demo.end) restartDemoLoop();
    }
    visualTime = app.demo.time;
    updateDemoPresentation();
  } else {
    advanceGlobalTime(dt);
    if (!app.frozen) updateMode(dt); // pausing only withholds the update: no sim steps, no timers
    visualTime = globalTime;
  }
  renderFrame(dt, visualTime);
  trailField.render(dt);
  composer.render(dt);
  keysPressed.clear();
  const frameSeconds = (now - lastFpsTimestamp) / 1e3;
  lastFpsTimestamp = now;
  if (frameSeconds > 0.1) {
    // long stall (tab switch etc.): restart the window
    fpsSeconds = 0;
    fpsFrames = 0;
  } else {
    fpsSeconds += frameSeconds;
    fpsFrames++;
  }
  if (fpsSeconds > 0.5) {
    adaptResolution(fpsFrames / fpsSeconds, now);
    fpsSeconds = 0;
    fpsFrames = 0;
  }
  requestAnimationFrame(frame);
}
