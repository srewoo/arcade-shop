// HUD tuning that is not CSS: thresholds and timings.
export const HUD_TUNING = Object.freeze({
  gapSpeedFloor: 12, // speed floor (u/s) for the gap-in-seconds estimate
  lowNitroPercent: 25, // nitro meter turns to the warning pattern below this
  hintSeconds: 8, // controls hint stays up this long at the start of a race (first lap)
  brickBreakCooldown: 1.5, // seconds between lego brick break-offs per car
  minTextPx: 12, // HUD text never renders smaller than this (secondary labels: 11)
});
