// AI tuning: opponent profiles, difficulty scale table and the numbers the driver uses.
// Values are moved here unchanged from race/aiDriver.js and logic/difficulty.js. The six original maps'
// sim() times depend on every one of them, so change them only together with the sim gate.

/** The AI opponents' tuning (first three = original): top speed and the lateral-acceleration budget for cornering. */
export const AI_PROFILES = [
  { top: 36.2, aLat: 88 },
  { top: 35.2, aLat: 82 },
  { top: 34.2, aLat: 76 },
  // 4th and 5th opponents (opponent count > 3): slightly slower so a bigger field is not harder up front
  { top: 33.2, aLat: 70 },
  { top: 32.2, aLat: 64 },
];
/** Cruise profile used once an AI car has finished. */
export const AI_FINISHED_PROFILE = { top: 24, aLat: 70 };

export const MAX_OPPONENTS = 5;

/** top / aLat multiply the profile; rubber multiplies the rubber-band gain and its +/- limits. Normal = exactly x1. */
export const DIFFICULTY = Object.freeze({
  easy: { label: "Easy", top: 0.9, aLat: 0.88, rubber: 0.6 },
  normal: { label: "Normal", top: 1, aLat: 1, rubber: 1 },
  hard: { label: "Hard", top: 1.04, aLat: 1.06, rubber: 1.5 },
  insane: { label: "Insane", top: 1.08, aLat: 1.12, rubber: 2 },
});

/** Driving constants of driveAi (route samples unless noted). */
export const AI_DRIVING = Object.freeze({
  lookaheadBase: 7, // samples ahead to steer toward = base + speed * perSpeed
  lookaheadPerSpeed: 0.36,
  laneLimit: 5.6, // allowed lateral window +/-
  steerGain: 3.4,
  laneFollow: 2.4, // lane smoothing rate per second
  rubberGain: 0.0022, // per sample of distance to the player
  rubberMin: -0.07,
  rubberMax: 0.08,
  topOverrideScale: 1.1,
  coastThrottle: 0.15,
  brakeMargin: 2,
  brakeAmount: 0.7,
  stuckSeconds: 1.4,
  stuckSkip: 8,
});
