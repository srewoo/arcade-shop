// Single source of truth for gameplay numbers. Everything here is simulation tuning:
// changing a value changes how the game plays, so tests/tuning.test.ts snapshot-guards it.
// Units: speeds are tiles per second, durations are seconds.

export const TUNING = Object.freeze({
  speed: Object.freeze({
    /** Pip: base at level 1, plus perLevel per extra level, capped. */
    pipBase: 5.6, pipPerLevel: 0.05, pipCap: 6,
    /** Cats stay slower than Pip on every level (pounce and modifiers aside). */
    catBase: 4.4, catPerLevel: 0.2, catCap: 5.6,
    /** Multipliers applied to a cat's base speed. */
    drenchedSlow: 0.55, returningFast: 2.2, leavingSlow: 0.8,
  }),
  drench: Object.freeze({
    baseSec: 6, perLevel: 0.8, minSec: 3,
    /** The blue tint blinks (and a tick plays) for this long before it ends. */
    blinkSec: 1.6,
  }),
  release: Object.freeze({
    /** Seconds until each cat (smudge, biscuit, tuxedo, ginger) leaves the basket on level 1. */
    base: Object.freeze([2, 6, 10, 15] as readonly number[]),
    shrinkPerLevel: 0.07, minShrink: 0.45,
  }),
  opening: Object.freeze({
    /** Smudge heads for its corner for this long at level 1, 1.5 s less per level. */
    graceSec: 4, gracePerLevel: 1.5,
  }),
  rhythm: Object.freeze({ chaseSec: 20, groomSec: 3 }),
  cheeseSec: 9,
  contactRadiusSq: 0.42,
  pounce: Object.freeze({
    windupSec: 0.35, dashMaxSec: 3, cooldownSec: 4,
    /** Dash speed multiplier on levels 1-3, then from level 4. */
    multEarly: 1.3, multLate: 1.6, earlyLevels: 3,
  }),
  biscuit: Object.freeze({ radiusTiles: 5, chaseSec: 4 }),
  scoring: Object.freeze({
    points: Object.freeze({ crumb: 10, sugar: 50, pistol: 50, cheese: 500 }),
    chain: Object.freeze([100, 250, 600, 1500] as readonly number[]),
    extraLifeAt: Object.freeze([7500, 25000] as readonly number[]),
    startLives: 3, maxLives: 6,
  }),
  modifiers: Object.freeze({
    /** From this level one modifier per level cycles: fastCats, darkKitchen, quickRelease. */
    startLevel: 7, fastCatsMult: 1.05, quickReleaseMult: 0.5,
    /** Dark kitchen: visible radius around Pip in tiles. */
    darkRadiusTiles: 5.5,
  }),
  flow: Object.freeze({
    readySec: 2.2, dyingSec: 1.9, clearingSec: 1.8, demoRestartSec: 1.4,
    summaryInputDelaySec: 0.6, gameOverInputDelaySec: 1,
  }),
  mazeCount: 3, themeCount: 3,
});
