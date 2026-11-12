// Global mutable application state shared between the main modules.

/**
 * Original: `H`.
 * mode: "title" | "garage" | "maps" | "intro" | "race" | "results" | "grab" | "outro" | "demo"
 * Other fields are added lazily: previewing, previewRoute, mapIndex, mapBoard, cycle, cycleAt,
 * leaving, carTaken, shownResults, hintT, grabY, demo (demo timeline object).
 */
export const app = {
  mode: "title",
  session: null,
  t: 0,
  cockpit: false,
  demo: null,
  wrongT: 0,
  acc: 0,
  /** True while pause / settings / tips freeze the simulation (set each frame by the loop). */
  frozen: false,
};

/** Visual clock (seconds) used outside demo mode. Original: `Gi`. Read via live binding; advance with advanceGlobalTime. */
export let globalTime = 0;

export function advanceGlobalTime(dt) {
  globalTime += dt;
}
