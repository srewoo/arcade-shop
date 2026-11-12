// Camera feel: shake impulses and decay. Visual only (physics never reads cameraRig.shake).
export const CAMERA_FX = Object.freeze({
  shakeDecayPerSecond: 2.5,
  boostJitter: 0.05, // position jitter amplitude scale while boosting
  landShake: 0.25,
  turboShakePerTier: 0.12,
  hitShakePerStrength: 0.03,
  hitShakeMax: 0.6,
  sofaShake: 0.55,
});
