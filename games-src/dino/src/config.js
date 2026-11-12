// Tuning constants and palette.  Values are copied verbatim from the bundle.
// RE: bundle symbol `pl` (line 21772) = TUNING, `R` = PALETTE, `ml` = AIR_TIME,
//     `Ql/$l/eu` = pterodactyl heights / required action / weed radius.

export const TUNING = {
  startSpeed: 13,
  maxSpeed: 31,
  accel: 0.2, // speed gain, units/s^2
  scorePerMeter: 0.75,
  gravity: 42,
  jumpVel: 15.5,
  fastFall: 60, // extra gravity while ducking in mid-air
  jumpBuffer: 0.12, // seconds a pressed jump stays queued
  spawnAhead: 190,
  firstObstacle: 50,
  groupsAfter: 60, // distance (m) after which cactus groups can spawn
  weedsAfter: 100,
  pterosAfter: 140,
  pteroSpeed: 4, // pterodactyls fly toward the player at this speed
  weedSpeed: 6,
  crashToGameOver: 2, // seconds of ragdoll before the GAME OVER panel
  ragdollGravity: 30,
  autoFailEvery: [17, 23], // autopilot deliberately blunders after this many seconds of run time
  autoRestartDelay: 2.4,
  storageKey: 'dino-run-locked-in:best',
};

/** Total airtime of an unobstructed jump (s) = 2*v0/g. Autopilot uses it as its timing yardstick. */
export const AIR_TIME = (2 * TUNING.jumpVel) / TUNING.gravity;

/** 0xRRGGBB colours (kept as the decimal literals found in the bundle in comments where useful). */
export const PALETTE = {
  skyTop: 4158141,
  skyMid: 10470374,
  skyLow: 16234906,
  horizon: 16767400,
  sunGlow: 16758886,
  sunDisc: 16774358,
  sunLight: 16760954,
  skyFill: 10466047,
  bounce: 16759168,
  rim: 8825087,
  sand: 15521710,
  sandDark: 14270353,
  dune: 15125404,
  mesa: 13867643,
  mesaFar: 14923676,
  rock: 12166282,
  cactus: 6068840,
  cactusDark: 4883545,
  flower: 16744352,
  scrub: 11116644,
  dinoBody: 8363900,
  dinoDark: 6060640,
  dinoBelly: 15327684,
  claw: 16117728,
  band: 14697518,
  mouth: 12077662,
  ptero: 11887946,
  pteroWing: 14257763,
  pteroBeak: 15909198,
  pteroCrest: 14833469,
  weed: 9071162,
};

/** Hover height (centre y) of each pterodactyl variant. */
export const PTERO_HEIGHT = { pteroLow: 0.95, pteroMid: 2.42, pteroHigh: 3.95 };
/** What the player must do to survive each pterodactyl variant. */
export const PTERO_ACTION = { pteroLow: 'jump', pteroMid: 'duck', pteroHigh: 'none' };
/** Tumbleweed radius. */
export const WEED_RADIUS = 0.58;

// Ground tiling + fog (bundle: ru, iu, au)
export const GROUND_TILE = 12;
export const FOG_NEAR = 70;
export const FOG_FAR = 300;
