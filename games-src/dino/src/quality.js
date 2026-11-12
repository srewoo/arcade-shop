// Adaptive quality governor wiring (bundle function Qh).  Skipped entirely with ?quality=high.  The decisions live in
// qualityGovernor.js: step down after a window under 50 fps, step back up after 10 s above 58 fps.
import { params, settings } from './state.js';
import { display, renderer, world } from './systems.js';
import { resize } from './camera.js';
import { qualityPlan } from './qualityLevels.js';
import { createGovernor, governorFrame, resetGovernor, planForStep } from './qualityGovernor.js';

const BASE_PIXEL_RATIO = display.pixelRatio; // the device default, before any adaptive drop
const governor = createGovernor();

function applyPlan(plan) {
  display.pixelRatio = plan.pixelRatio;
  renderer.setPixelRatio(plan.pixelRatio);
  world.setShadows(plan.shadows);
  resize();
}

/**
 * Settings hook: 'auto' keeps the adaptive FPS governor; high / medium / low pin pixel ratio and shadows.
 * (?quality=high on the URL still disables the governor in auto.)
 */
export function applyQuality(level) {
  resetGovernor(governor, { keepSteps: false });
  applyPlan(qualityPlan(level, BASE_PIXEL_RATIO));
}

/** After a pause / hidden tab the first frames are not representative: measure again from scratch. */
export const restartGovernor = () => resetGovernor(governor);

/** Current governor step (0 = full quality), for the ?fps overlay and tests. */
export const governorSteps = () => governor.steps;

export function sampleFrame(dt) {
  if (params.highQuality || settings.quality !== 'auto' || document.hidden) return null;
  const change = governorFrame(governor, dt);
  if (change) applyPlan(planForStep(governor.steps, BASE_PIXEL_RATIO));
  return change;
}
