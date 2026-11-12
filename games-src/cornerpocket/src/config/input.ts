// Input tuning (table px unless noted). One place for every aim/charge number.
export const INPUT = Object.freeze({
  pullMaxTable: 150, // minimum table px of pull for full power
  pullMaxScreen: 110, // CSS px of pull for full power on small screens (power resolution stays constant)
  pullMin: 8, // table px: smaller pulls cancel the shot
  grabTable: 90, // minimum table px radius around the cue ball where a drag may start
  grabScreen: 56, // CSS px radius floor for the grab area on small screens
  chargeRate: 0.85, // power per second while Space is held
  turnRate: 0.9, // rad/s aim rotation
  turnRateFine: 0.18, // rad/s with Shift
  nudgeSpeed: 150, // table px/s while placing the cue ball with arrows
  minShoot: 0.04, // power below this does not fire
  defaultShoot: 0.55, // power used when Shoot is pressed with nothing charged
  presets: [0.3, 0.6, 0.9] as readonly number[], // keys 1, 2, 3
  grabFlashSeconds: 0.9,
  graceMs: 600, // a new dialog or grid ignores activations this long after appearing
});
