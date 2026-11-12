// Timing constants (ms) used by the loop, autosave and background work.
export const TIMING = {
  /** Logic tick. The HUD itself is painted from requestAnimationFrame. */
  logicTickMs: 100,
  /** A single tick never advances the clock by more than this (tab throttling, debugger pauses). */
  maxTickMs: 1000,
  autosaveMs: 5000,
  poolStartDelayMs: 1500,
  /** The inline "Solve all? Tap again" confirmation reverts after this long. */
  confirmRevertMs: 3000,
  /** How long the first-run coach hint stays before fading on its own. */
  coachAutoHideMs: 12_000,
} as const;

/** Background Hard-puzzle pool: how many to keep ready and how many the stored list may hold. */
export const POOL = { target: 4, max: 6 } as const;
